import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EnterpriseContextGrantV010,
  EnterpriseContextRelationshipV010,
  EnterpriseContextV010
} from "../contracts/platform-services.js";

export interface EnterpriseContextLifecycleEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  contextId: string;
  from?: "CREATING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  to: "CREATING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  occurredAt: string;
  actorSubjectId: string;
}

export interface EnterpriseContextGovernanceSnapshotV010 {
  contractVersion: "0.1.0";
  contexts: EnterpriseContextV010[];
  relationships: EnterpriseContextRelationshipV010[];
  grants: EnterpriseContextGrantV010[];
  lifecycleEvents: EnterpriseContextLifecycleEventV010[];
}

export interface EnterpriseContextGovernanceStoreV010 {
  snapshot(): EnterpriseContextGovernanceSnapshotV010;
  save(snapshot: EnterpriseContextGovernanceSnapshotV010): void;
}

function empty(): EnterpriseContextGovernanceSnapshotV010 {
  return {
    contractVersion: "0.1.0",
    contexts: [],
    relationships: [],
    grants: [],
    lifecycleEvents: []
  };
}

function clone(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  return structuredClone(value);
}

function validate(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  if (
    value.contractVersion !== "0.1.0"
    || !Array.isArray(value.contexts)
    || !Array.isArray(value.relationships)
    || !Array.isArray(value.grants)
    || !Array.isArray(value.lifecycleEvents)
  ) {
    throw new Error("ENTERPRISE_GOVERNANCE_STATE_INVALID");
  }

  const contextIds = new Set<string>();
  const enterpriseIds = new Set<string>();
  for (const context of value.contexts) {
    if (!context.contextId) throw new Error("ENTERPRISE_GOVERNANCE_CONTEXT_ID_REQUIRED");
    if (contextIds.has(context.contextId)) {
      throw new Error(`ENTERPRISE_GOVERNANCE_CONTEXT_DUPLICATE: ${context.contextId}`);
    }
    if (enterpriseIds.has(context.enterpriseId)) {
      throw new Error(`ENTERPRISE_GOVERNANCE_ENTERPRISE_DUPLICATE: ${context.enterpriseId}`);
    }
    contextIds.add(context.contextId);
    enterpriseIds.add(context.enterpriseId);
  }

  const relationshipIds = new Set<string>();
  for (const relationship of value.relationships) {
    if (relationshipIds.has(relationship.relationshipId)) {
      throw new Error(
        `ENTERPRISE_GOVERNANCE_RELATIONSHIP_DUPLICATE: ${relationship.relationshipId}`
      );
    }
    relationshipIds.add(relationship.relationshipId);
  }

  const grantIds = new Set<string>();
  for (const grant of value.grants) {
    if (grantIds.has(grant.grantId)) {
      throw new Error(`ENTERPRISE_GOVERNANCE_GRANT_DUPLICATE: ${grant.grantId}`);
    }
    grantIds.add(grant.grantId);
  }

  const eventIds = new Set<string>();
  for (const event of value.lifecycleEvents) {
    if (eventIds.has(event.eventId)) {
      throw new Error(`ENTERPRISE_GOVERNANCE_EVENT_DUPLICATE: ${event.eventId}`);
    }
    eventIds.add(event.eventId);
  }

  for (const context of value.contexts) {
    if (context.lifecycleState !== "ACTIVE") continue;
    const hasOwner = value.relationships.some(
      relationship =>
        relationship.contextId === context.contextId
        && relationship.kind === "OWNER"
        && relationship.state === "ACTIVE"
    );
    if (!hasOwner) {
      throw new Error(`ENTERPRISE_CONTEXT_ACTIVE_OWNER_REQUIRED: ${context.contextId}`);
    }
  }

  return clone(value);
}

function validateTransition(
  previous: EnterpriseContextGovernanceSnapshotV010,
  next: EnterpriseContextGovernanceSnapshotV010
): void {
  const before = new Map(
    previous.contexts
      .filter(context => context.contextId)
      .map(context => [context.contextId!, context])
  );
  for (const context of next.contexts) {
    if (!context.contextId) continue;
    const existing = before.get(context.contextId);
    if (!existing) continue;
    if (
      existing.enterpriseId !== context.enterpriseId
      || existing.createdBySubjectId !== context.createdBySubjectId
      || existing.createdAt !== context.createdAt
    ) {
      throw new Error(`ENTERPRISE_CONTEXT_CREATION_FACT_IMMUTABLE: ${context.contextId}`);
    }
  }
}

export function createMemoryEnterpriseContextGovernanceStoreV010(
  seed: EnterpriseContextGovernanceSnapshotV010 = empty()
): EnterpriseContextGovernanceStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateTransition(current, valid);
      current = valid;
    }
  };
}

export function createFileEnterpriseContextGovernanceStoreV010(
  path: string
): EnterpriseContextGovernanceStoreV010 {
  const load = (): EnterpriseContextGovernanceSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as EnterpriseContextGovernanceSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateTransition(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      writeFileSync(temporary, JSON.stringify(valid, null, 2) + "\n", "utf8");
      renameSync(temporary, path);
    }
  };
}
