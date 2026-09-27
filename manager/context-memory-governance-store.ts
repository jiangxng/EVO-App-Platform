import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryGovernanceDecisionV010,
  ContextMemoryGovernanceEventV010
} from "../contracts/platform-services.js";

export interface ContextMemoryGovernanceSnapshotV010 {
  contractVersion: "0.1.0";
  events: ContextMemoryGovernanceEventV010[];
}

export interface ContextMemoryGovernanceStoreV010 {
  snapshot(): ContextMemoryGovernanceSnapshotV010;
  append(event: ContextMemoryGovernanceEventV010): void;
  decision(memoryId: string, now?: Date): ContextMemoryGovernanceDecisionV010 | undefined;
  listForContext(
    context: ActiveContextRefV010,
    now?: Date
  ): ContextMemoryGovernanceDecisionV010[];
}

function empty(): ContextMemoryGovernanceSnapshotV010 {
  return { contractVersion: "0.1.0", events: [] };
}

function sameContext(left: ActiveContextRefV010, right: ActiveContextRefV010): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

function validate(snapshot: ContextMemoryGovernanceSnapshotV010): ContextMemoryGovernanceSnapshotV010 {
  if (snapshot.contractVersion !== "0.1.0" || !Array.isArray(snapshot.events)) {
    throw new Error("CONTEXT_MEMORY_GOVERNANCE_STATE_INVALID");
  }
  const ids = new Set<string>();
  for (const event of snapshot.events) {
    if (!event.eventId?.trim()) throw new Error("CONTEXT_MEMORY_GOVERNANCE_EVENT_ID_REQUIRED");
    if (ids.has(event.eventId)) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_EVENT_DUPLICATE: ${event.eventId}`);
    }
    ids.add(event.eventId);
    if (!event.memoryId?.trim() || !event.context?.contextId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_TARGET_INVALID: ${event.eventId}`);
    }
    if (!["ACTIVE", "RESTRICTED", "EXPIRED"].includes(event.state)) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_STATE_INVALID: ${event.eventId}`);
    }
    if (!["STANDARD", "SENSITIVE", "RESTRICTED"].includes(event.privacyClass)) {
      throw new Error(`CONTEXT_MEMORY_PRIVACY_CLASS_INVALID: ${event.eventId}`);
    }
    if (
      event.origin !== undefined
      && !["HUMAN", "RETENTION_POLICY", "DLP_PROVIDER"].includes(event.origin)
    ) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_ORIGIN_INVALID: ${event.eventId}`);
    }
    if (!Number.isFinite(Date.parse(event.occurredAt))) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_TIME_INVALID: ${event.eventId}`);
    }
    if (event.retainUntil && !Number.isFinite(Date.parse(event.retainUntil))) {
      throw new Error(`CONTEXT_MEMORY_RETENTION_TIME_INVALID: ${event.eventId}`);
    }
    if (!event.actorSubjectId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_GOVERNANCE_ACTOR_REQUIRED: ${event.eventId}`);
    }
  }
  return structuredClone(snapshot);
}

function decisionFromEvents(
  memoryId: string,
  events: readonly ContextMemoryGovernanceEventV010[],
  now: Date
): ContextMemoryGovernanceDecisionV010 | undefined {
  const candidates = events
    .filter(event => event.memoryId === memoryId)
    .sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt)
      || b.eventId.localeCompare(a.eventId)
    );
  const latest = candidates[0];
  if (!latest) return undefined;

  const expiredByRetention =
    latest.retainUntil !== undefined
    && Date.parse(latest.retainUntil) <= now.getTime();

  return {
    contractVersion: "0.1.0",
    memoryId,
    context: structuredClone(latest.context),
    state: expiredByRetention ? "EXPIRED" : latest.state,
    privacyClass: latest.privacyClass,
    ...(latest.retainUntil ? { retainUntil: latest.retainUntil } : {}),
    effectiveEventId: latest.eventId
  };
}

function createStore(
  load: () => ContextMemoryGovernanceSnapshotV010,
  persist: (snapshot: ContextMemoryGovernanceSnapshotV010) => void
): ContextMemoryGovernanceStoreV010 {
  return {
    snapshot() {
      return structuredClone(load());
    },
    append(event) {
      const current = load();
      if (current.events.some(item => item.eventId === event.eventId)) {
        throw new Error(`CONTEXT_MEMORY_GOVERNANCE_EVENT_DUPLICATE: ${event.eventId}`);
      }
      const next = validate({
        contractVersion: "0.1.0",
        events: [...current.events, structuredClone(event)]
      });
      persist(next);
    },
    decision(memoryId, now = new Date()) {
      return decisionFromEvents(memoryId, load().events, now);
    },
    listForContext(context, now = new Date()) {
      const current = load();
      const ids = [...new Set(
        current.events
          .filter(event => sameContext(event.context, context))
          .map(event => event.memoryId)
      )];
      return ids
        .map(memoryId => decisionFromEvents(memoryId, current.events, now))
        .filter((item): item is ContextMemoryGovernanceDecisionV010 => item !== undefined)
        .sort((a, b) => a.memoryId.localeCompare(b.memoryId));
    }
  };
}

export function createMemoryContextMemoryGovernanceStoreV010(
  seed: ContextMemoryGovernanceSnapshotV010 = empty()
): ContextMemoryGovernanceStoreV010 {
  let current = validate(seed);
  return createStore(
    () => current,
    next => { current = structuredClone(next); }
  );
}

export function createFileContextMemoryGovernanceStoreV010(
  path: string
): ContextMemoryGovernanceStoreV010 {
  const load = () => {
    if (!existsSync(path)) return empty();
    return validate(JSON.parse(readFileSync(path, "utf8")) as ContextMemoryGovernanceSnapshotV010);
  };
  return createStore(load, next => {
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, JSON.stringify(next, null, 2) + "\n", "utf8");
    renameSync(temporary, path);
  });
}
