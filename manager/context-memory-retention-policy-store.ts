import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryItemV010,
  ContextMemoryPrivacyClassV010,
  ContextMemoryRetentionPolicyEventV010,
  ContextMemoryRetentionPolicyV010
} from "../contracts/platform-services.js";

export interface ContextMemoryRetentionPolicySnapshotV010 {
  contractVersion: "0.1.0";
  events: ContextMemoryRetentionPolicyEventV010[];
}

export interface ContextMemoryRetentionPolicyStoreV010 {
  snapshot(): ContextMemoryRetentionPolicySnapshotV010;
  append(event: ContextMemoryRetentionPolicyEventV010): void;
  effectiveForContext(context: ActiveContextRefV010): ContextMemoryRetentionPolicyV010[];
  retentionDeadline(
    item: ContextMemoryItemV010,
    privacyClass: ContextMemoryPrivacyClassV010
  ): string | undefined;
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

function validate(snapshot: ContextMemoryRetentionPolicySnapshotV010) {
  if (snapshot.contractVersion !== "0.1.0" || !Array.isArray(snapshot.events)) {
    throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_STATE_INVALID");
  }
  const eventIds = new Set<string>();
  for (const event of snapshot.events) {
    if (!event.eventId?.trim() || eventIds.has(event.eventId)) {
      throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_EVENT_INVALID");
    }
    eventIds.add(event.eventId);
    if (!event.policyId?.trim() || !event.context?.contextId?.trim()) {
      throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_TARGET_INVALID");
    }
    if (!["ACTIVE", "RETIRED"].includes(event.state)) {
      throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_STATE_INVALID");
    }
    if (!Number.isInteger(event.retainForDays) || event.retainForDays < 1) {
      throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_DURATION_INVALID");
    }
    if (!Number.isFinite(Date.parse(event.occurredAt))) {
      throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_TIME_INVALID");
    }
  }
  return structuredClone(snapshot);
}

function latestPolicies(events: readonly ContextMemoryRetentionPolicyEventV010[]) {
  const latest = new Map<string, ContextMemoryRetentionPolicyEventV010>();
  for (const event of [...events].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt) || a.eventId.localeCompare(b.eventId)
  )) latest.set(event.policyId, event);
  return [...latest.values()];
}

function matches(
  policy: ContextMemoryRetentionPolicyEventV010,
  item: ContextMemoryItemV010,
  privacyClass: ContextMemoryPrivacyClassV010
): boolean {
  if (!sameContext(policy.context, item.context)) return false;
  if (policy.kinds?.length && !policy.kinds.includes(item.kind)) return false;
  if (policy.privacyClasses?.length && !policy.privacyClasses.includes(privacyClass)) return false;
  return true;
}

export function createMemoryContextMemoryRetentionPolicyStoreV010(
  seed: ContextMemoryRetentionPolicySnapshotV010 = {
    contractVersion: "0.1.0",
    events: []
  }
): ContextMemoryRetentionPolicyStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return structuredClone(current);
    },
    append(event) {
      if (current.events.some(value => value.eventId === event.eventId)) {
        throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_EVENT_DUPLICATE");
      }
      current = validate({
        contractVersion: "0.1.0",
        events: [...current.events, structuredClone(event)]
      });
    },
    effectiveForContext(context) {
      return latestPolicies(current.events)
        .filter(event => event.state === "ACTIVE" && sameContext(event.context, context))
        .map(event => ({
          contractVersion: "0.1.0" as const,
          policyId: event.policyId,
          context: structuredClone(event.context),
          state: event.state,
          retainForDays: event.retainForDays,
          ...(event.kinds ? { kinds: [...event.kinds] } : {}),
          ...(event.privacyClasses ? { privacyClasses: [...event.privacyClasses] } : {}),
          ...(event.reason ? { reason: event.reason } : {}),
          effectiveEventId: event.eventId
        }))
        .sort((a, b) => a.policyId.localeCompare(b.policyId));
    },
    retentionDeadline(item, privacyClass) {
      const applicable = latestPolicies(current.events)
        .filter(event => event.state === "ACTIVE" && matches(event, item, privacyClass));
      if (!applicable.length) return undefined;
      const days = Math.min(...applicable.map(event => event.retainForDays));
      const recordedAt = Date.parse(item.attribution.recordedAt);
      if (!Number.isFinite(recordedAt)) {
        throw new Error("CONTEXT_MEMORY_RECORDED_AT_INVALID");
      }
      return new Date(recordedAt + days * 86_400_000).toISOString();
    }
  };
}

function readRetentionFile(path: string): ContextMemoryRetentionPolicySnapshotV010 {
  if (!existsSync(path)) return { contractVersion: "0.1.0", events: [] };
  return JSON.parse(readFileSync(path, "utf8")) as ContextMemoryRetentionPolicySnapshotV010;
}

function writeRetentionFile(path: string, snapshot: ContextMemoryRetentionPolicySnapshotV010): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

export function createFileContextMemoryRetentionPolicyStoreV010(
  path: string
): ContextMemoryRetentionPolicyStoreV010 {
  return {
    snapshot() {
      return createMemoryContextMemoryRetentionPolicyStoreV010(readRetentionFile(path)).snapshot();
    },
    append(event) {
      const memory = createMemoryContextMemoryRetentionPolicyStoreV010(readRetentionFile(path));
      memory.append(event);
      writeRetentionFile(path, memory.snapshot());
    },
    effectiveForContext(context) {
      return createMemoryContextMemoryRetentionPolicyStoreV010(readRetentionFile(path))
        .effectiveForContext(context);
    },
    retentionDeadline(item, privacyClass) {
      return createMemoryContextMemoryRetentionPolicyStoreV010(readRetentionFile(path))
        .retentionDeadline(item, privacyClass);
    }
  };
}
