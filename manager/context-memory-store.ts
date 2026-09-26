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

function sameContext(
  left: { kind: string; contextId: string; enterpriseId?: string },
  right: { kind: string; contextId: string; enterpriseId?: string }
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
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

  const byId = new Map(snapshot.items.map(item => [item.memoryId, item]));
  for (const item of snapshot.items) {
    if (item.provenance.origin === "DIRECT") {
      if (!sameContext(item.context, item.provenance.sourceContext)) {
        throw new Error(`CONTEXT_MEMORY_DIRECT_SOURCE_MISMATCH: ${item.memoryId}`);
      }
      if (item.provenance.sourceMemoryId) {
        throw new Error(`CONTEXT_MEMORY_DIRECT_SOURCE_MEMORY_FORBIDDEN: ${item.memoryId}`);
      }
    }

    if (item.supersedesMemoryId) {
      const superseded = byId.get(item.supersedesMemoryId);
      if (!superseded) {
        throw new Error(
          `CONTEXT_MEMORY_SUPERSEDES_NOT_FOUND: ${item.supersedesMemoryId}`
        );
      }
      if (!sameContext(item.context, superseded.context)) {
        throw new Error(
          `CONTEXT_MEMORY_SUPERSEDES_CONTEXT_MISMATCH: ${item.memoryId}`
        );
      }
    }

    if (item.provenance.sourceMemoryId) {
      const source = byId.get(item.provenance.sourceMemoryId);
      if (!source) {
        throw new Error(
          `CONTEXT_MEMORY_SOURCE_NOT_FOUND: ${item.provenance.sourceMemoryId}`
        );
      }
      if (!sameContext(source.context, item.provenance.sourceContext)) {
        throw new Error(
          `CONTEXT_MEMORY_SOURCE_CONTEXT_MISMATCH: ${item.memoryId}`
        );
      }
      if (
        item.provenance.origin === "PROMOTED"
        && sameContext(item.context, item.provenance.sourceContext)
      ) {
        throw new Error(
          `CONTEXT_MEMORY_PROMOTION_CROSS_CONTEXT_REQUIRED: ${item.memoryId}`
        );
      }
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
