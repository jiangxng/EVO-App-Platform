import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryLegalHoldDecisionV010,
  ContextMemoryLegalHoldEventV010
} from "../contracts/platform-services.js";

export interface ContextMemoryLegalHoldSnapshotV010 {
  contractVersion: "0.1.0";
  events: ContextMemoryLegalHoldEventV010[];
}

export interface ContextMemoryLegalHoldStoreV010 {
  snapshot(): ContextMemoryLegalHoldSnapshotV010;
  append(event: ContextMemoryLegalHoldEventV010): void;
  decision(memoryId: string): ContextMemoryLegalHoldDecisionV010 | undefined;
  listForContext(context: ActiveContextRefV010): ContextMemoryLegalHoldDecisionV010[];
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

function validate(snapshot: ContextMemoryLegalHoldSnapshotV010) {
  if (snapshot.contractVersion !== "0.1.0" || !Array.isArray(snapshot.events)) {
    throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_STATE_INVALID");
  }
  const ids = new Set<string>();
  for (const event of snapshot.events) {
    if (!event.eventId?.trim() || ids.has(event.eventId)) {
      throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_EVENT_INVALID");
    }
    ids.add(event.eventId);
    if (!event.holdId?.trim() || !event.memoryId?.trim() || !event.context?.contextId?.trim()) {
      throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_TARGET_INVALID");
    }
    if (!["PLACED", "RELEASED"].includes(event.state) || !event.reason?.trim()) {
      throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_EVENT_INVALID");
    }
    if (!Number.isFinite(Date.parse(event.occurredAt))) {
      throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_TIME_INVALID");
    }
  }
  return structuredClone(snapshot);
}

function decisionFor(memoryId: string, events: readonly ContextMemoryLegalHoldEventV010[]) {
  const relevant = events.filter(event => event.memoryId === memoryId);
  if (!relevant.length) return undefined;

  const latestByHold = new Map<string, ContextMemoryLegalHoldEventV010>();
  for (const event of [...relevant].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt) || a.eventId.localeCompare(b.eventId)
  )) {
    latestByHold.set(event.holdId, event);
  }

  const active = [...latestByHold.values()]
    .filter(event => event.state === "PLACED")
    .sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt) || b.eventId.localeCompare(a.eventId)
    );
  const latest = active[0] ?? [...latestByHold.values()]
    .sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt) || b.eventId.localeCompare(a.eventId)
    )[0]!;
  return {
    contractVersion: "0.1.0" as const,
    holdId: latest.holdId,
    memoryId,
    context: structuredClone(latest.context),
    held: active.length > 0,
    reason: latest.reason,
    effectiveEventId: latest.eventId
  };
}

export function createMemoryContextMemoryLegalHoldStoreV010(
  seed: ContextMemoryLegalHoldSnapshotV010 = {
    contractVersion: "0.1.0",
    events: []
  }
): ContextMemoryLegalHoldStoreV010 {
  let current = validate(seed);
  return {
    snapshot() { return structuredClone(current); },
    append(event) {
      if (current.events.some(value => value.eventId === event.eventId)) {
        throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_EVENT_DUPLICATE");
      }
      current = validate({
        contractVersion: "0.1.0",
        events: [...current.events, structuredClone(event)]
      });
    },
    decision(memoryId) {
      return decisionFor(memoryId, current.events);
    },
    listForContext(context) {
      const ids = [...new Set(current.events
        .filter(event => sameContext(event.context, context))
        .map(event => event.memoryId))];
      return ids
        .map(memoryId => decisionFor(memoryId, current.events))
        .filter((value): value is ContextMemoryLegalHoldDecisionV010 => value !== undefined)
        .sort((a, b) => a.memoryId.localeCompare(b.memoryId));
    }
  };
}

function readLegalHoldFile(path: string): ContextMemoryLegalHoldSnapshotV010 {
  if (!existsSync(path)) return { contractVersion: "0.1.0", events: [] };
  return JSON.parse(readFileSync(path, "utf8")) as ContextMemoryLegalHoldSnapshotV010;
}

function writeLegalHoldFile(path: string, snapshot: ContextMemoryLegalHoldSnapshotV010): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

export function createFileContextMemoryLegalHoldStoreV010(
  path: string
): ContextMemoryLegalHoldStoreV010 {
  return {
    snapshot() {
      return createMemoryContextMemoryLegalHoldStoreV010(readLegalHoldFile(path)).snapshot();
    },
    append(event) {
      const memory = createMemoryContextMemoryLegalHoldStoreV010(readLegalHoldFile(path));
      memory.append(event);
      writeLegalHoldFile(path, memory.snapshot());
    },
    decision(memoryId) {
      return createMemoryContextMemoryLegalHoldStoreV010(readLegalHoldFile(path)).decision(memoryId);
    },
    listForContext(context) {
      return createMemoryContextMemoryLegalHoldStoreV010(readLegalHoldFile(path)).listForContext(context);
    }
  };
}
