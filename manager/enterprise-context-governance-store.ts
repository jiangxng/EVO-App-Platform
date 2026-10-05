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
  EnterpriseContextV010,
  EnterpriseOwnershipTransferV010,
  EnterpriseRelationshipInvitationV010
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

export type EnterpriseRelationshipLifecycleEventTypeV010 =
  | "INVITATION_CREATED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "INVITATION_REVOKED"
  | "INVITATION_EXPIRED"
  | "RELATIONSHIP_ACTIVATED"
  | "RELATIONSHIP_REVOKED"
  | "OWNERSHIP_TRANSFER_CREATED"
  | "OWNERSHIP_TRANSFER_ACCEPTED"
  | "OWNERSHIP_TRANSFER_DECLINED"
  | "OWNERSHIP_TRANSFER_CANCELLED"
  | "OWNERSHIP_TRANSFER_EXPIRED";

export interface EnterpriseRelationshipLifecycleEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  contextId: string;
  type: EnterpriseRelationshipLifecycleEventTypeV010;
  occurredAt: string;
  actorSubjectId: string;
  subjectId?: string;
  relationshipId?: string;
  invitationId?: string;
  transferId?: string;
}

export interface EnterpriseContextDefaultSelectionV010 {
  contractVersion: "0.1.0";
  subjectId: string;
  contextId: string;
  selectedAt: string;
  selectedBySubjectId: string;
}

export interface EnterpriseContextGovernanceSnapshotV010 {
  contractVersion: "0.1.0";
  contexts: EnterpriseContextV010[];
  relationships: EnterpriseContextRelationshipV010[];
  grants: EnterpriseContextGrantV010[];
  lifecycleEvents: EnterpriseContextLifecycleEventV010[];
  invitations: EnterpriseRelationshipInvitationV010[];
  ownershipTransfers: EnterpriseOwnershipTransferV010[];
  relationshipEvents: EnterpriseRelationshipLifecycleEventV010[];
  defaultContexts: EnterpriseContextDefaultSelectionV010[];
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
    lifecycleEvents: [],
    invitations: [],
    ownershipTransfers: [],
    relationshipEvents: [],
    defaultContexts: []
  };
}

function clone(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  return structuredClone(value);
}

function normalize(value: unknown): EnterpriseContextGovernanceSnapshotV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("ENTERPRISE_GOVERNANCE_STATE_INVALID");
  }
  const raw = value as Partial<EnterpriseContextGovernanceSnapshotV010>;
  return {
    contractVersion: raw.contractVersion as "0.1.0",
    contexts: Array.isArray(raw.contexts) ? structuredClone(raw.contexts) : [],
    relationships: Array.isArray(raw.relationships) ? structuredClone(raw.relationships) : [],
    grants: Array.isArray(raw.grants) ? structuredClone(raw.grants) : [],
    lifecycleEvents: Array.isArray(raw.lifecycleEvents) ? structuredClone(raw.lifecycleEvents) : [],
    invitations: Array.isArray(raw.invitations) ? structuredClone(raw.invitations) : [],
    ownershipTransfers: Array.isArray(raw.ownershipTransfers)
      ? structuredClone(raw.ownershipTransfers)
      : [],
    relationshipEvents: Array.isArray(raw.relationshipEvents)
      ? structuredClone(raw.relationshipEvents)
      : [],
    defaultContexts: Array.isArray(raw.defaultContexts)
      ? structuredClone(raw.defaultContexts)
      : []
  };
}

function duplicate(values: readonly string[], code: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${code}: ${value}`);
    seen.add(value);
  }
}

function validate(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  const normalized = normalize(value);
  if (normalized.contractVersion !== "0.1.0") {
    throw new Error("ENTERPRISE_GOVERNANCE_STATE_INVALID");
  }

  duplicate(
    normalized.contexts.map(context => {
      if (!context.contextId) throw new Error("ENTERPRISE_GOVERNANCE_CONTEXT_ID_REQUIRED");
      return context.contextId;
    }),
    "ENTERPRISE_GOVERNANCE_CONTEXT_DUPLICATE"
  );
  duplicate(
    normalized.contexts.map(context => context.enterpriseId),
    "ENTERPRISE_GOVERNANCE_ENTERPRISE_DUPLICATE"
  );
  duplicate(
    normalized.relationships.map(item => item.relationshipId),
    "ENTERPRISE_GOVERNANCE_RELATIONSHIP_DUPLICATE"
  );
  duplicate(
    normalized.grants.map(item => item.grantId),
    "ENTERPRISE_GOVERNANCE_GRANT_DUPLICATE"
  );
  duplicate(
    normalized.lifecycleEvents.map(item => item.eventId),
    "ENTERPRISE_GOVERNANCE_EVENT_DUPLICATE"
  );
  duplicate(
    normalized.invitations.map(item => item.invitationId),
    "ENTERPRISE_GOVERNANCE_INVITATION_DUPLICATE"
  );
  duplicate(
    normalized.ownershipTransfers.map(item => item.transferId),
    "ENTERPRISE_GOVERNANCE_TRANSFER_DUPLICATE"
  );
  duplicate(
    normalized.relationshipEvents.map(item => item.eventId),
    "ENTERPRISE_GOVERNANCE_RELATIONSHIP_EVENT_DUPLICATE"
  );
  duplicate(
    normalized.defaultContexts.map(item => item.subjectId),
    "ENTERPRISE_CONTEXT_DEFAULT_SUBJECT_DUPLICATE"
  );
  for (const selection of normalized.defaultContexts) {
    if (
      selection.contractVersion !== "0.1.0"
      || !selection.subjectId?.trim()
      || !selection.contextId?.trim()
      || !selection.selectedAt?.trim()
      || !selection.selectedBySubjectId?.trim()
    ) {
      throw new Error("ENTERPRISE_CONTEXT_DEFAULT_INVALID");
    }
  }

  for (const relationship of normalized.relationships) {
    if (!["ACTIVE", "REVOKED"].includes(relationship.state)) {
      throw new Error(`ENTERPRISE_RELATIONSHIP_STATE_INVALID: ${relationship.relationshipId}`);
    }
    if (
      relationship.state === "REVOKED"
      && (!relationship.revokedAt || !relationship.revokedBySubjectId)
    ) {
      throw new Error(`ENTERPRISE_RELATIONSHIP_REVOCATION_FACT_REQUIRED: ${relationship.relationshipId}`);
    }
  }

  for (const grant of normalized.grants) {
    if (grant.state !== undefined && !["ACTIVE", "REVOKED"].includes(grant.state)) {
      throw new Error(`ENTERPRISE_GRANT_STATE_INVALID: ${grant.grantId}`);
    }
    if (
      grant.state === "REVOKED"
      && (!grant.revokedAt || !grant.revokedBySubjectId)
    ) {
      throw new Error(`ENTERPRISE_GRANT_REVOCATION_FACT_REQUIRED: ${grant.grantId}`);
    }
  }

  for (const context of normalized.contexts) {
    if (context.lifecycleState !== "ACTIVE") continue;
    const hasOwner = normalized.relationships.some(
      relationship =>
        relationship.contextId === context.contextId
        && relationship.kind === "OWNER"
        && relationship.state === "ACTIVE"
    );
    if (!hasOwner) {
      throw new Error(`ENTERPRISE_CONTEXT_ACTIVE_OWNER_REQUIRED: ${context.contextId}`);
    }
  }

  return clone(normalized);
}

function requireUnchanged(
  code: string,
  id: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  keys: readonly string[]
): void {
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      throw new Error(`${code}: ${id}`);
    }
  }
}

function validateAppendOnlyEvents(
  code: string,
  previous: readonly { eventId: string }[],
  next: readonly { eventId: string }[]
): void {
  const nextIds = new Set(next.map(item => item.eventId));
  for (const event of previous) {
    if (!nextIds.has(event.eventId)) throw new Error(`${code}: ${event.eventId}`);
  }
}

function validateTransition(
  previous: EnterpriseContextGovernanceSnapshotV010,
  next: EnterpriseContextGovernanceSnapshotV010
): void {
  const beforeContexts = new Map(
    previous.contexts
      .filter(context => context.contextId)
      .map(context => [context.contextId!, context])
  );
  for (const context of next.contexts) {
    if (!context.contextId) continue;
    const existing = beforeContexts.get(context.contextId);
    if (!existing) continue;
    requireUnchanged(
      "ENTERPRISE_CONTEXT_CREATION_FACT_IMMUTABLE",
      context.contextId,
      existing as unknown as Record<string, unknown>,
      context as unknown as Record<string, unknown>,
      ["enterpriseId", "createdBySubjectId", "createdAt"]
    );
  }

  const beforeRelationships = new Map(
    previous.relationships.map(item => [item.relationshipId, item])
  );
  for (const relationship of next.relationships) {
    const existing = beforeRelationships.get(relationship.relationshipId);
    if (!existing) continue;
    requireUnchanged(
      "ENTERPRISE_RELATIONSHIP_CREATION_FACT_IMMUTABLE",
      relationship.relationshipId,
      existing as unknown as Record<string, unknown>,
      relationship as unknown as Record<string, unknown>,
      ["subjectId", "contextId", "kind", "createdAt", "createdBySubjectId"]
    );
    if (existing.state === "REVOKED" && relationship.state !== "REVOKED") {
      throw new Error(`ENTERPRISE_RELATIONSHIP_REACTIVATION_FORBIDDEN: ${relationship.relationshipId}`);
    }
  }

  const beforeGrants = new Map(previous.grants.map(item => [item.grantId, item]));
  for (const grant of next.grants) {
    const existing = beforeGrants.get(grant.grantId);
    if (!existing) continue;
    requireUnchanged(
      "ENTERPRISE_GRANT_CREATION_FACT_IMMUTABLE",
      grant.grantId,
      existing as unknown as Record<string, unknown>,
      grant as unknown as Record<string, unknown>,
      ["subjectId", "contextId", "relationship", "createdAt", "createdBySubjectId"]
    );
    if (existing.state === "REVOKED" && grant.state !== "REVOKED") {
      throw new Error(`ENTERPRISE_GRANT_REACTIVATION_FORBIDDEN: ${grant.grantId}`);
    }
  }

  const beforeInvitations = new Map(
    previous.invitations.map(item => [item.invitationId, item])
  );
  for (const invitation of next.invitations) {
    const existing = beforeInvitations.get(invitation.invitationId);
    if (!existing) continue;
    requireUnchanged(
      "ENTERPRISE_INVITATION_CREATION_FACT_IMMUTABLE",
      invitation.invitationId,
      existing as unknown as Record<string, unknown>,
      invitation as unknown as Record<string, unknown>,
      ["contextId", "targetSubjectId", "kind", "invitedBySubjectId", "createdAt", "expiresAt"]
    );
    if (existing.state !== "PENDING" && invitation.state !== existing.state) {
      throw new Error(`ENTERPRISE_INVITATION_TERMINAL_STATE_IMMUTABLE: ${invitation.invitationId}`);
    }
  }

  const beforeTransfers = new Map(
    previous.ownershipTransfers.map(item => [item.transferId, item])
  );
  for (const transfer of next.ownershipTransfers) {
    const existing = beforeTransfers.get(transfer.transferId);
    if (!existing) continue;
    requireUnchanged(
      "ENTERPRISE_OWNERSHIP_TRANSFER_CREATION_FACT_IMMUTABLE",
      transfer.transferId,
      existing as unknown as Record<string, unknown>,
      transfer as unknown as Record<string, unknown>,
      ["contextId", "fromOwnerSubjectId", "toSubjectId", "createdAt", "expiresAt"]
    );
    if (existing.state !== "PENDING" && transfer.state !== existing.state) {
      throw new Error(`ENTERPRISE_OWNERSHIP_TRANSFER_TERMINAL_STATE_IMMUTABLE: ${transfer.transferId}`);
    }
  }

  validateAppendOnlyEvents(
    "ENTERPRISE_CONTEXT_LIFECYCLE_EVENT_APPEND_ONLY",
    previous.lifecycleEvents,
    next.lifecycleEvents
  );
  validateAppendOnlyEvents(
    "ENTERPRISE_RELATIONSHIP_EVENT_APPEND_ONLY",
    previous.relationshipEvents,
    next.relationshipEvents
  );
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
    return validate(JSON.parse(readFileSync(path, "utf8")));
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
