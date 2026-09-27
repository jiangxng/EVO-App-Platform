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
  ContextMemoryItemV010,
  ContextMemoryKindV010
} from "../contracts/platform-services.js";

export type ContextMemoryFreshnessPolicyStateV010 = "ACTIVE" | "RETIRED";

export interface ContextMemoryFreshnessPolicyEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  policyId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryFreshnessPolicyStateV010;
  freshnessWindowDays: number;
  kinds?: ContextMemoryKindV010[];
  reason?: string;
  occurredAt: string;
  actorSubjectId: string;
}

export interface ContextMemoryFreshnessPolicyV010
  extends Omit<ContextMemoryFreshnessPolicyEventV010, "eventId"> {
  effectiveEventId: string;
}

export interface ContextMemoryFreshnessPolicySnapshotV010 {
  contractVersion: "0.1.0";
  events: ContextMemoryFreshnessPolicyEventV010[];
}

export interface ContextMemoryFreshnessPolicyStoreV010 {
  snapshot(): ContextMemoryFreshnessPolicySnapshotV010;
  append(event: ContextMemoryFreshnessPolicyEventV010): void;
  effectiveForContext(
    context: ActiveContextRefV010
  ): ContextMemoryFreshnessPolicyV010[];
  freshnessWindowDays(
    item: ContextMemoryItemV010
  ): number | undefined;
}

function sameContext(
  a: ActiveContextRefV010,
  b: ActiveContextRefV010
): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

function validate(
  snapshot: ContextMemoryFreshnessPolicySnapshotV010
): ContextMemoryFreshnessPolicySnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.events)
  ) {
    throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_STATE_INVALID");
  }

  const eventIds = new Set<string>();
  for (const event of snapshot.events) {
    if (!event.eventId?.trim() || eventIds.has(event.eventId)) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_EVENT_INVALID");
    }
    eventIds.add(event.eventId);
    if (!event.policyId?.trim() || !event.context?.contextId?.trim()) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_TARGET_INVALID");
    }
    if (!["ACTIVE", "RETIRED"].includes(event.state)) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_STATE_INVALID");
    }
    if (
      !Number.isInteger(event.freshnessWindowDays)
      || event.freshnessWindowDays < 1
      || event.freshnessWindowDays > 36500
    ) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_WINDOW_INVALID");
    }
    if (
      event.kinds?.some(kind =>
        !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(kind)
      )
    ) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_KIND_INVALID");
    }
    if (!Number.isFinite(Date.parse(event.occurredAt))) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_TIME_INVALID");
    }
    if (!event.actorSubjectId?.trim()) {
      throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_ACTOR_INVALID");
    }
  }
  return structuredClone(snapshot);
}

function latest(
  events: readonly ContextMemoryFreshnessPolicyEventV010[]
): ContextMemoryFreshnessPolicyEventV010[] {
  const byPolicy = new Map<string, ContextMemoryFreshnessPolicyEventV010>();
  for (const event of [...events].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
    || a.eventId.localeCompare(b.eventId)
  )) {
    byPolicy.set(event.policyId, event);
  }
  return [...byPolicy.values()];
}

function materialize(
  event: ContextMemoryFreshnessPolicyEventV010
): ContextMemoryFreshnessPolicyV010 {
  const { eventId, ...rest } = event;
  return {
    ...structuredClone(rest),
    effectiveEventId: eventId
  };
}

export function createMemoryContextMemoryFreshnessPolicyStoreV010(
  seed: ContextMemoryFreshnessPolicySnapshotV010 = {
    contractVersion: "0.1.0",
    events: []
  }
): ContextMemoryFreshnessPolicyStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return structuredClone(current);
    },
    append(event) {
      if (current.events.some(value => value.eventId === event.eventId)) {
        throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_EVENT_DUPLICATE");
      }
      current = validate({
        contractVersion: "0.1.0",
        events: [...current.events, structuredClone(event)]
      });
    },
    effectiveForContext(context) {
      return latest(current.events)
        .filter(event =>
          event.state === "ACTIVE"
          && sameContext(event.context, context)
        )
        .map(materialize)
        .sort((a, b) => a.policyId.localeCompare(b.policyId));
    },
    freshnessWindowDays(item) {
      const active = latest(current.events)
        .filter(event =>
          event.state === "ACTIVE"
          && sameContext(event.context, item.context)
        );
      const kindSpecific = active.filter(event =>
        event.kinds?.includes(item.kind)
      );
      const generic = active.filter(event =>
        !event.kinds || event.kinds.length === 0
      );
      const applicable = kindSpecific.length > 0
        ? kindSpecific
        : generic;
      if (applicable.length === 0) return undefined;
      return Math.min(...applicable.map(event => event.freshnessWindowDays));
    }
  };
}

function readFileState(
  path: string
): ContextMemoryFreshnessPolicySnapshotV010 {
  if (!existsSync(path)) {
    return {
      contractVersion: "0.1.0",
      events: []
    };
  }
  return validate(
    JSON.parse(
      readFileSync(path, "utf8")
    ) as ContextMemoryFreshnessPolicySnapshotV010
  );
}

function writeFileState(
  path: string,
  snapshot: ContextMemoryFreshnessPolicySnapshotV010
): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

export function createFileContextMemoryFreshnessPolicyStoreV010(
  path: string
): ContextMemoryFreshnessPolicyStoreV010 {
  return {
    snapshot() {
      return readFileState(path);
    },
    append(event) {
      const memory = createMemoryContextMemoryFreshnessPolicyStoreV010(
        readFileState(path)
      );
      memory.append(event);
      writeFileState(path, memory.snapshot());
    },
    effectiveForContext(context) {
      return createMemoryContextMemoryFreshnessPolicyStoreV010(
        readFileState(path)
      ).effectiveForContext(context);
    },
    freshnessWindowDays(item) {
      return createMemoryContextMemoryFreshnessPolicyStoreV010(
        readFileState(path)
      ).freshnessWindowDays(item);
    }
  };
}
