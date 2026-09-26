import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type { ContextMemoryItemV010 } from "../contracts/platform-services.js";

export interface ContextMemorySnapshotV010 {
  contractVersion: "0.1.0";
  items: ContextMemoryItemV010[];
}

export interface ContextMemoryStoreV010 {
  snapshot(): ContextMemorySnapshotV010;
  save(snapshot: ContextMemorySnapshotV010): void;
}

function empty(): ContextMemorySnapshotV010 {
  return {
    contractVersion: "0.1.0",
    items: []
  };
}

function clone(value: ContextMemorySnapshotV010): ContextMemorySnapshotV010 {
  return structuredClone(value);
}

function validate(snapshot: ContextMemorySnapshotV010): ContextMemorySnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.items)
  ) {
    throw new Error("CONTEXT_MEMORY_STATE_INVALID");
  }

  const ids = new Set<string>();
  for (const item of snapshot.items) {
    if (!item.memoryId?.trim()) throw new Error("CONTEXT_MEMORY_ID_REQUIRED");
    if (ids.has(item.memoryId)) {
      throw new Error(`CONTEXT_MEMORY_DUPLICATE: ${item.memoryId}`);
    }
    ids.add(item.memoryId);

    if (!item.context?.contextId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_CONTEXT_REQUIRED: ${item.memoryId}`);
    }
    if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(item.kind)) {
      throw new Error(`CONTEXT_MEMORY_KIND_INVALID: ${item.memoryId}`);
    }
    if (!item.summary?.trim()) {
      throw new Error(`CONTEXT_MEMORY_SUMMARY_REQUIRED: ${item.memoryId}`);
    }
    if (!item.provenance || item.provenance.contractVersion !== "0.1.0") {
      throw new Error(`CONTEXT_MEMORY_PROVENANCE_REQUIRED: ${item.memoryId}`);
    }
    if (!["DIRECT", "PROMOTED"].includes(item.provenance.origin)) {
      throw new Error(`CONTEXT_MEMORY_ORIGIN_INVALID: ${item.memoryId}`);
    }
    if (!item.provenance.sourceContext?.contextId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_SOURCE_CONTEXT_REQUIRED: ${item.memoryId}`);
    }
    if (!Array.isArray(item.provenance.evidenceRefs)) {
      throw new Error(`CONTEXT_MEMORY_EVIDENCE_REFS_INVALID: ${item.memoryId}`);
    }
    if (
      item.provenance.origin === "PROMOTED"
      && !item.provenance.sourceMemoryId?.trim()
    ) {
      throw new Error(`CONTEXT_MEMORY_PROMOTED_SOURCE_REQUIRED: ${item.memoryId}`);
    }
    if (!item.attribution || item.attribution.contractVersion !== "0.1.0") {
      throw new Error(`CONTEXT_MEMORY_ATTRIBUTION_REQUIRED: ${item.memoryId}`);
    }
    if (!item.attribution.recordedBySubjectId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_ATTRIBUTION_SUBJECT_REQUIRED: ${item.memoryId}`);
    }
    if (!["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(item.attribution.recordedByActorType)) {
      throw new Error(`CONTEXT_MEMORY_ATTRIBUTION_ACTOR_INVALID: ${item.memoryId}`);
    }
    if (!Number.isFinite(Date.parse(item.attribution.recordedAt))) {
      throw new Error(`CONTEXT_MEMORY_ATTRIBUTION_TIME_INVALID: ${item.memoryId}`);
    }
    if (item.observedAt && !Number.isFinite(Date.parse(item.observedAt))) {
      throw new Error(`CONTEXT_MEMORY_OBSERVED_AT_INVALID: ${item.memoryId}`);
    }
  }

  const known = new Set(snapshot.items.map(item => item.memoryId));
  for (const item of snapshot.items) {
    if (item.supersedesMemoryId && !known.has(item.supersedesMemoryId)) {
      throw new Error(
        `CONTEXT_MEMORY_SUPERSEDES_NOT_FOUND: ${item.supersedesMemoryId}`
      );
    }
    if (
      item.provenance.sourceMemoryId
      && !known.has(item.provenance.sourceMemoryId)
    ) {
      throw new Error(
        `CONTEXT_MEMORY_SOURCE_NOT_FOUND: ${item.provenance.sourceMemoryId}`
      );
    }
  }

  return clone(snapshot);
}

function validateAppendOnly(
  previous: ContextMemorySnapshotV010,
  next: ContextMemorySnapshotV010
): void {
  const after = new Map(next.items.map(item => [item.memoryId, item]));
  for (const item of previous.items) {
    const current = after.get(item.memoryId);
    if (!current) {
      throw new Error(`CONTEXT_MEMORY_APPEND_ONLY_DELETE_FORBIDDEN: ${item.memoryId}`);
    }
    if (JSON.stringify(current) !== JSON.stringify(item)) {
      throw new Error(`CONTEXT_MEMORY_APPEND_ONLY_MUTATION_FORBIDDEN: ${item.memoryId}`);
    }
  }
}

export function createMemoryContextMemoryStoreV010(
  seed: ContextMemorySnapshotV010 = empty()
): ContextMemoryStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateAppendOnly(current, valid);
      current = valid;
    }
  };
}

export function createFileContextMemoryStoreV010(
  path: string
): ContextMemoryStoreV010 {
  const load = (): ContextMemorySnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ContextMemorySnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateAppendOnly(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      writeFileSync(temporary, JSON.stringify(valid, null, 2) + "\n", "utf8");
      renameSync(temporary, path);
    }
  };
}
