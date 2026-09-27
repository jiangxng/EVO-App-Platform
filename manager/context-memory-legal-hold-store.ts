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
  const latest = events
    .filter(event => event.memoryId === memoryId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.eventId.localeCompare(a.eventId))[0];
  if (!latest) return undefined;
  return {
    contractVersion: "0.1.0" as const,
    holdId: latest.holdId,
    memoryId,
    context: structuredClone(latest.context),
    held: latest.state === "PLACED",
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
