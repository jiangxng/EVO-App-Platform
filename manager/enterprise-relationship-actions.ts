import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  EnterpriseContextGrantV010,
  EnterpriseContextRelationshipKindV010,
  EnterpriseContextRelationshipV010,
  EnterpriseOwnershipTransferV010,
  EnterpriseRelationshipInvitationKindV010,
  EnterpriseRelationshipInvitationV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_ENTERPRISE_RELATIONSHIP_FEATURE_ID,
  HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID
} from "../providers/enterprise-relationship/package.js";
import type {
  EnterpriseContextGovernanceSnapshotV010,
  EnterpriseContextGovernanceStoreV010,
  EnterpriseRelationshipLifecycleEventV010
} from "./enterprise-context-governance-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const ENTERPRISE_RELATIONSHIP_INVITE_ACTION = "enterprise.relationship.invite";
export const ENTERPRISE_INVITATION_ACCEPT_ACTION = "enterprise.relationship.invitation.accept";
export const ENTERPRISE_INVITATION_DECLINE_ACTION = "enterprise.relationship.invitation.decline";
export const ENTERPRISE_INVITATION_REVOKE_ACTION = "enterprise.relationship.invitation.revoke";
export const ENTERPRISE_RELATIONSHIP_REVOKE_ACTION = "enterprise.relationship.revoke";
export const ENTERPRISE_OWNERSHIP_TRANSFER_INITIATE_ACTION = "enterprise.ownership.transfer.initiate";
export const ENTERPRISE_OWNERSHIP_TRANSFER_ACCEPT_ACTION = "enterprise.ownership.transfer.accept";
export const ENTERPRISE_OWNERSHIP_TRANSFER_DECLINE_ACTION = "enterprise.ownership.transfer.decline";
export const ENTERPRISE_OWNERSHIP_TRANSFER_CANCEL_ACTION = "enterprise.ownership.transfer.cancel";

export interface EnterpriseRelationshipActionDependenciesV010 {
  store: EnterpriseContextGovernanceStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_RELATIONSHIP_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function invitationKind(values: Record<string, JsonValue>): EnterpriseRelationshipInvitationKindV010 {
  const value = stringValue(values, "kind")!;
  if (!["ADMIN", "MEMBER", "AUDITOR"].includes(value)) {
    throw new Error("ENTERPRISE_INVITATION_KIND_INVALID");
  }
  return value as EnterpriseRelationshipInvitationKindV010;
}

function optionalIso(
  values: Record<string, JsonValue>,
  key: string,
  now: Date
): string | undefined {
  const value = stringValue(values, key, false);
  if (!value) return undefined;
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || epoch <= now.getTime()) {
    throw new Error(`ENTERPRISE_RELATIONSHIP_${key.toUpperCase()}_INVALID`);
  }
  return new Date(epoch).toISOString();
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "ENTERPRISE_RELATIONSHIP_ACTION_FAILED",
      message
    }
  };
}

function requireContext(
  requestContext: PlatformRequestContextV010 | undefined
): PlatformRequestContextV010 {
  if (!requestContext) throw new Error("REQUEST_CONTEXT_REQUIRED");
  return requestContext;
}

function requireHuman(requestContext: PlatformRequestContextV010): void {
  if (requestContext.principal.actorType !== "HUMAN") {
    throw new Error("ENTERPRISE_GOVERNANCE_HUMAN_REQUIRED");
  }
}

function requireConfirmation(request: AppActionRequestV010): void {
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function activeEnterpriseContextId(
  requestContext: PlatformRequestContextV010
): string {
  const active = requestContext.context?.activeContext;
  if (!active || active.kind !== "ENTERPRISE") {
    throw new Error("ENTERPRISE_ACTIVE_CONTEXT_REQUIRED");
  }
  return active.contextId;
}

function requirePersonalContext(requestContext: PlatformRequestContextV010): void {
  const active = requestContext.context?.activeContext;
  if (!active || active.kind !== "PERSONAL") {
    throw new Error("PERSONAL_ACTIVE_CONTEXT_REQUIRED");
  }
}

function requireActiveGovernedContext(
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  contextId: string
): void {
  const context = snapshot.contexts.find(item => item.contextId === contextId);
  if (!context) throw new Error(`ENTERPRISE_GOVERNANCE_CONTEXT_NOT_FOUND: ${contextId}`);
  if (context.lifecycleState !== "ACTIVE") {
    throw new Error(`ENTERPRISE_CONTEXT_NOT_ACTIVE: ${contextId}`);
  }
}

function activeRelationships(
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  contextId: string,
  subjectId: string
): EnterpriseContextRelationshipV010[] {
  return snapshot.relationships.filter(item =>
    item.contextId === contextId
    && item.subjectId === subjectId
    && item.state === "ACTIVE"
  );
}

function hasRole(
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  contextId: string,
  subjectId: string,
  roles: readonly EnterpriseContextRelationshipKindV010[]
): boolean {
  return activeRelationships(snapshot, contextId, subjectId)
    .some(item => roles.includes(item.kind));
}

function requireRole(
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  contextId: string,
  subjectId: string,
  roles: readonly EnterpriseContextRelationshipKindV010[]
): void {
  if (!hasRole(snapshot, contextId, subjectId, roles)) {
    throw new Error(`ENTERPRISE_GOVERNANCE_ROLE_REQUIRED: ${roles.join("|")}`);
  }
}

async function authorize(
  dependencies: EnterpriseRelationshipActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  action: string,
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  }
): Promise<void> {
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    requestContext,
    { action, resource }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: `
      + `denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
    );
  }
}

function nextId(
  prefix: string,
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  id: () => string
): string {
  const used = new Set<string>([
    ...snapshot.contexts.flatMap(item => [item.contextId ?? "", item.enterpriseId]),
    ...snapshot.relationships.map(item => item.relationshipId),
    ...snapshot.grants.map(item => item.grantId),
    ...snapshot.lifecycleEvents.map(item => item.eventId),
    ...snapshot.invitations.map(item => item.invitationId),
    ...snapshot.ownershipTransfers.map(item => item.transferId),
    ...snapshot.relationshipEvents.map(item => item.eventId)
  ]);
  let candidate = `${prefix}:${id()}`;
  while (used.has(candidate)) candidate = `${prefix}:${id()}`;
  return candidate;
}

function appendEvent(
  snapshot: EnterpriseContextGovernanceSnapshotV010,
  event: EnterpriseRelationshipLifecycleEventV010
): EnterpriseRelationshipLifecycleEventV010[] {
  return [...snapshot.relationshipEvents, event];
}

function revokeGrants(
  grants: readonly EnterpriseContextGrantV010[],
  input: {
    contextId: string;
    subjectId: string;
    relationship: string;
    occurredAt: string;
    actorSubjectId: string;
  }
): EnterpriseContextGrantV010[] {
  return grants.map(grant =>
    grant.contextId === input.contextId
    && grant.subjectId === input.subjectId
    && grant.relationship === input.relationship
    && grant.state !== "REVOKED"
      ? {
          ...grant,
          state: "REVOKED" as const,
          revokedAt: input.occurredAt,
          revokedBySubjectId: input.actorSubjectId
        }
      : grant
  );
}

function expired(expiresAt: string | undefined, at: Date): boolean {
  return expiresAt !== undefined && Date.parse(expiresAt) <= at.getTime();
}

function relationshipHandler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    requestContext: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID,
    featureId: HOST_ENTERPRISE_RELATIONSHIP_FEATURE_ID,
    commandCode,
    async execute(request, requestContext) {
      try {
        return await execute(request, requireContext(requestContext));
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

export function createEnterpriseRelationshipActionHandlersV010(
  dependencies: EnterpriseRelationshipActionDependenciesV010
): AppActionHandler[] {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  const invite = relationshipHandler(
    ENTERPRISE_RELATIONSHIP_INVITE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const contextId = activeEnterpriseContextId(requestContext);
      const actor = requestContext.principal.subjectId;
      const targetSubjectId = stringValue(request.values, "targetSubjectId")!;
      const kind = invitationKind(request.values);
      if (targetSubjectId === actor) {
        throw new Error("ENTERPRISE_INVITATION_SELF_FORBIDDEN");
      }

      const at = now();
      const snapshot = dependencies.store.snapshot();
      requireActiveGovernedContext(snapshot, contextId);
      requireRole(snapshot, contextId, actor, ["OWNER", "ADMIN"]);
      if (
        activeRelationships(snapshot, contextId, targetSubjectId)
          .some(item => item.kind === kind)
      ) {
        throw new Error("ENTERPRISE_RELATIONSHIP_ALREADY_ACTIVE");
      }
      if (
        snapshot.invitations.some(item =>
          item.contextId === contextId
          && item.targetSubjectId === targetSubjectId
          && item.kind === kind
          && item.state === "PENDING"
          && !expired(item.expiresAt, at)
        )
      ) {
        throw new Error("ENTERPRISE_INVITATION_ALREADY_PENDING");
      }

      await authorize(dependencies, requestContext, ENTERPRISE_RELATIONSHIP_INVITE_ACTION, {
        type: "enterprise.relationship.invitation",
        attributes: { contextId, targetSubjectId, kind }
      });

      const invitation: EnterpriseRelationshipInvitationV010 = {
        contractVersion: "0.1.0",
        invitationId: nextId("invitation", snapshot, id),
        contextId,
        targetSubjectId,
        kind,
        state: "PENDING",
        invitedBySubjectId: actor,
        createdAt: at.toISOString(),
        ...(optionalIso(request.values, "expiresAt", at)
          ? { expiresAt: optionalIso(request.values, "expiresAt", at) }
          : {})
      };
      const event: EnterpriseRelationshipLifecycleEventV010 = {
        contractVersion: "0.1.0",
        eventId: nextId("relationship-event", snapshot, id),
        contextId,
        type: "INVITATION_CREATED",
        occurredAt: at.toISOString(),
        actorSubjectId: actor,
        subjectId: targetSubjectId,
        invitationId: invitation.invitationId
      };
      dependencies.store.save({
        ...snapshot,
        invitations: [...snapshot.invitations, invitation],
        relationshipEvents: appendEvent(snapshot, event)
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ invitation }))
      };
    }
  );

  const acceptInvitation = relationshipHandler(
    ENTERPRISE_INVITATION_ACCEPT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requirePersonalContext(requestContext);
      requireConfirmation(request);
      const actor = requestContext.principal.subjectId;
      const invitationId = stringValue(request.values, "invitationId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      const invitation = snapshot.invitations.find(item => item.invitationId === invitationId);
      if (!invitation) throw new Error("ENTERPRISE_INVITATION_NOT_FOUND");
      if (invitation.targetSubjectId !== actor) {
        throw new Error("ENTERPRISE_INVITATION_TARGET_MISMATCH");
      }
      if (invitation.state !== "PENDING") {
        throw new Error(`ENTERPRISE_INVITATION_NOT_PENDING: ${invitation.state}`);
      }
      requireActiveGovernedContext(snapshot, invitation.contextId);

      if (expired(invitation.expiresAt, at)) {
        const expiredInvitation = {
          ...invitation,
          state: "EXPIRED" as const,
          respondedAt: at.toISOString(),
          respondedBySubjectId: actor
        };
        dependencies.store.save({
          ...snapshot,
          invitations: snapshot.invitations.map(item =>
            item.invitationId === invitationId ? expiredInvitation : item
          ),
          relationshipEvents: appendEvent(snapshot, {
            contractVersion: "0.1.0",
            eventId: nextId("relationship-event", snapshot, id),
            contextId: invitation.contextId,
            type: "INVITATION_EXPIRED",
            occurredAt: at.toISOString(),
            actorSubjectId: actor,
            subjectId: actor,
            invitationId
          })
        });
        throw new Error("ENTERPRISE_INVITATION_EXPIRED");
      }

      if (activeRelationships(snapshot, invitation.contextId, actor)
        .some(item => item.kind === invitation.kind)) {
        throw new Error("ENTERPRISE_RELATIONSHIP_ALREADY_ACTIVE");
      }

      await authorize(dependencies, requestContext, ENTERPRISE_INVITATION_ACCEPT_ACTION, {
        type: "enterprise.relationship.invitation",
        id: invitationId,
        attributes: {
          contextId: invitation.contextId,
          kind: invitation.kind
        }
      });

      const relationship: EnterpriseContextRelationshipV010 = {
        contractVersion: "0.1.0",
        relationshipId: nextId("relationship", snapshot, id),
        subjectId: actor,
        contextId: invitation.contextId,
        kind: invitation.kind,
        state: "ACTIVE",
        createdAt: at.toISOString(),
        createdBySubjectId: actor
      };
      const grant: EnterpriseContextGrantV010 = {
        contractVersion: "0.1.0",
        grantId: nextId("grant", snapshot, id),
        subjectId: actor,
        contextId: invitation.contextId,
        relationship: invitation.kind,
        state: "ACTIVE",
        createdAt: at.toISOString(),
        createdBySubjectId: actor,
        attributes: {
          source: "enterprise.relationship.invitation.accept",
          invitationId
        }
      };
      const accepted = {
        ...invitation,
        state: "ACCEPTED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      const acceptedEvent: EnterpriseRelationshipLifecycleEventV010 = {
        contractVersion: "0.1.0",
        eventId: nextId("relationship-event", snapshot, id),
        contextId: invitation.contextId,
        type: "INVITATION_ACCEPTED",
        occurredAt: at.toISOString(),
        actorSubjectId: actor,
        subjectId: actor,
        invitationId
      };
      const activatedEvent: EnterpriseRelationshipLifecycleEventV010 = {
        contractVersion: "0.1.0",
        eventId: nextId("relationship-event", {
          ...snapshot,
          relationshipEvents: [...snapshot.relationshipEvents, acceptedEvent]
        }, id),
        contextId: invitation.contextId,
        type: "RELATIONSHIP_ACTIVATED",
        occurredAt: at.toISOString(),
        actorSubjectId: actor,
        subjectId: actor,
        relationshipId: relationship.relationshipId,
        invitationId
      };
      dependencies.store.save({
        ...snapshot,
        relationships: [...snapshot.relationships, relationship],
        grants: [...snapshot.grants, grant],
        invitations: snapshot.invitations.map(item =>
          item.invitationId === invitationId ? accepted : item
        ),
        relationshipEvents: [
          ...snapshot.relationshipEvents,
          acceptedEvent,
          activatedEvent
        ]
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({
          invitation: accepted,
          relationship,
          grant
        }))
      };
    }
  );

  const declineInvitation = relationshipHandler(
    ENTERPRISE_INVITATION_DECLINE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requirePersonalContext(requestContext);
      requireConfirmation(request);
      const actor = requestContext.principal.subjectId;
      const invitationId = stringValue(request.values, "invitationId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      const invitation = snapshot.invitations.find(item => item.invitationId === invitationId);
      if (!invitation) throw new Error("ENTERPRISE_INVITATION_NOT_FOUND");
      if (invitation.targetSubjectId !== actor) {
        throw new Error("ENTERPRISE_INVITATION_TARGET_MISMATCH");
      }
      if (invitation.state !== "PENDING") {
        throw new Error(`ENTERPRISE_INVITATION_NOT_PENDING: ${invitation.state}`);
      }
      await authorize(dependencies, requestContext, ENTERPRISE_INVITATION_DECLINE_ACTION, {
        type: "enterprise.relationship.invitation",
        id: invitationId,
        attributes: { contextId: invitation.contextId, kind: invitation.kind }
      });

      const declined = {
        ...invitation,
        state: "DECLINED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      dependencies.store.save({
        ...snapshot,
        invitations: snapshot.invitations.map(item =>
          item.invitationId === invitationId ? declined : item
        ),
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId: invitation.contextId,
          type: "INVITATION_DECLINED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: actor,
          invitationId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ invitation: declined }))
      };
    }
  );

  const revokeInvitation = relationshipHandler(
    ENTERPRISE_INVITATION_REVOKE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const contextId = activeEnterpriseContextId(requestContext);
      const actor = requestContext.principal.subjectId;
      const invitationId = stringValue(request.values, "invitationId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      requireActiveGovernedContext(snapshot, contextId);
      requireRole(snapshot, contextId, actor, ["OWNER", "ADMIN"]);
      const invitation = snapshot.invitations.find(item => item.invitationId === invitationId);
      if (!invitation || invitation.contextId !== contextId) {
        throw new Error("ENTERPRISE_INVITATION_NOT_FOUND");
      }
      if (invitation.state !== "PENDING") {
        throw new Error(`ENTERPRISE_INVITATION_NOT_PENDING: ${invitation.state}`);
      }
      await authorize(dependencies, requestContext, ENTERPRISE_INVITATION_REVOKE_ACTION, {
        type: "enterprise.relationship.invitation",
        id: invitationId,
        attributes: {
          contextId,
          targetSubjectId: invitation.targetSubjectId,
          kind: invitation.kind
        }
      });

      const revoked = {
        ...invitation,
        state: "REVOKED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      dependencies.store.save({
        ...snapshot,
        invitations: snapshot.invitations.map(item =>
          item.invitationId === invitationId ? revoked : item
        ),
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId,
          type: "INVITATION_REVOKED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: invitation.targetSubjectId,
          invitationId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ invitation: revoked }))
      };
    }
  );

  const revokeRelationship = relationshipHandler(
    ENTERPRISE_RELATIONSHIP_REVOKE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const contextId = activeEnterpriseContextId(requestContext);
      const actor = requestContext.principal.subjectId;
      const relationshipId = stringValue(request.values, "relationshipId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      requireActiveGovernedContext(snapshot, contextId);
      const target = snapshot.relationships.find(item =>
        item.relationshipId === relationshipId
        && item.contextId === contextId
      );
      if (!target || target.state !== "ACTIVE") {
        throw new Error("ENTERPRISE_RELATIONSHIP_ACTIVE_NOT_FOUND");
      }
      if (target.kind === "OWNER") {
        throw new Error("ENTERPRISE_OWNER_REVOKE_REQUIRES_TRANSFER");
      }
      const actorIsOwner = hasRole(snapshot, contextId, actor, ["OWNER"]);
      const actorIsAdmin = hasRole(snapshot, contextId, actor, ["ADMIN"]);
      if (!actorIsOwner && !(actorIsAdmin && ["MEMBER", "AUDITOR"].includes(target.kind))) {
        throw new Error("ENTERPRISE_RELATIONSHIP_REVOKE_ROLE_REQUIRED");
      }
      await authorize(dependencies, requestContext, ENTERPRISE_RELATIONSHIP_REVOKE_ACTION, {
        type: "enterprise.relationship",
        id: relationshipId,
        attributes: {
          contextId,
          targetSubjectId: target.subjectId,
          kind: target.kind
        }
      });

      const revokedRelationship: EnterpriseContextRelationshipV010 = {
        ...target,
        state: "REVOKED",
        revokedAt: at.toISOString(),
        revokedBySubjectId: actor
      };
      dependencies.store.save({
        ...snapshot,
        relationships: snapshot.relationships.map(item =>
          item.relationshipId === relationshipId ? revokedRelationship : item
        ),
        grants: revokeGrants(snapshot.grants, {
          contextId,
          subjectId: target.subjectId,
          relationship: target.kind,
          occurredAt: at.toISOString(),
          actorSubjectId: actor
        }),
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId,
          type: "RELATIONSHIP_REVOKED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: target.subjectId,
          relationshipId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ relationship: revokedRelationship }))
      };
    }
  );

  const initiateTransfer = relationshipHandler(
    ENTERPRISE_OWNERSHIP_TRANSFER_INITIATE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const contextId = activeEnterpriseContextId(requestContext);
      const actor = requestContext.principal.subjectId;
      const toSubjectId = stringValue(request.values, "toSubjectId")!;
      if (toSubjectId === actor) {
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_SELF_FORBIDDEN");
      }
      const at = now();
      const snapshot = dependencies.store.snapshot();
      requireActiveGovernedContext(snapshot, contextId);
      requireRole(snapshot, contextId, actor, ["OWNER"]);
      if (hasRole(snapshot, contextId, toSubjectId, ["OWNER"])) {
        throw new Error("ENTERPRISE_OWNERSHIP_TARGET_ALREADY_OWNER");
      }
      if (
        snapshot.ownershipTransfers.some(item =>
          item.contextId === contextId
          && item.fromOwnerSubjectId === actor
          && item.state === "PENDING"
          && !expired(item.expiresAt, at)
        )
      ) {
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_ALREADY_PENDING");
      }
      await authorize(
        dependencies,
        requestContext,
        ENTERPRISE_OWNERSHIP_TRANSFER_INITIATE_ACTION,
        {
          type: "enterprise.ownership-transfer",
          attributes: { contextId, toSubjectId }
        }
      );

      const transfer: EnterpriseOwnershipTransferV010 = {
        contractVersion: "0.1.0",
        transferId: nextId("ownership-transfer", snapshot, id),
        contextId,
        fromOwnerSubjectId: actor,
        toSubjectId,
        state: "PENDING",
        createdAt: at.toISOString(),
        ...(optionalIso(request.values, "expiresAt", at)
          ? { expiresAt: optionalIso(request.values, "expiresAt", at) }
          : {})
      };
      dependencies.store.save({
        ...snapshot,
        ownershipTransfers: [...snapshot.ownershipTransfers, transfer],
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId,
          type: "OWNERSHIP_TRANSFER_CREATED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: toSubjectId,
          transferId: transfer.transferId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ transfer }))
      };
    }
  );

  const acceptTransfer = relationshipHandler(
    ENTERPRISE_OWNERSHIP_TRANSFER_ACCEPT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requirePersonalContext(requestContext);
      requireConfirmation(request);
      const actor = requestContext.principal.subjectId;
      const transferId = stringValue(request.values, "transferId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      const transfer = snapshot.ownershipTransfers.find(item => item.transferId === transferId);
      if (!transfer) throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_NOT_FOUND");
      if (transfer.toSubjectId !== actor) {
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_TARGET_MISMATCH");
      }
      if (transfer.state !== "PENDING") {
        throw new Error(`ENTERPRISE_OWNERSHIP_TRANSFER_NOT_PENDING: ${transfer.state}`);
      }
      requireActiveGovernedContext(snapshot, transfer.contextId);

      if (expired(transfer.expiresAt, at)) {
        const expiredTransfer = {
          ...transfer,
          state: "EXPIRED" as const,
          respondedAt: at.toISOString(),
          respondedBySubjectId: actor
        };
        dependencies.store.save({
          ...snapshot,
          ownershipTransfers: snapshot.ownershipTransfers.map(item =>
            item.transferId === transferId ? expiredTransfer : item
          ),
          relationshipEvents: appendEvent(snapshot, {
            contractVersion: "0.1.0",
            eventId: nextId("relationship-event", snapshot, id),
            contextId: transfer.contextId,
            type: "OWNERSHIP_TRANSFER_EXPIRED",
            occurredAt: at.toISOString(),
            actorSubjectId: actor,
            subjectId: actor,
            transferId
          })
        });
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_EXPIRED");
      }

      const outgoingOwners = activeRelationships(
        snapshot,
        transfer.contextId,
        transfer.fromOwnerSubjectId
      ).filter(item => item.kind === "OWNER");
      if (outgoingOwners.length === 0) {
        throw new Error("ENTERPRISE_OWNERSHIP_SOURCE_NOT_OWNER");
      }
      if (hasRole(snapshot, transfer.contextId, actor, ["OWNER"])) {
        throw new Error("ENTERPRISE_OWNERSHIP_TARGET_ALREADY_OWNER");
      }

      await authorize(
        dependencies,
        requestContext,
        ENTERPRISE_OWNERSHIP_TRANSFER_ACCEPT_ACTION,
        {
          type: "enterprise.ownership-transfer",
          id: transferId,
          attributes: {
            contextId: transfer.contextId,
            fromOwnerSubjectId: transfer.fromOwnerSubjectId
          }
        }
      );

      const incomingOwner: EnterpriseContextRelationshipV010 = {
        contractVersion: "0.1.0",
        relationshipId: nextId("relationship", snapshot, id),
        subjectId: actor,
        contextId: transfer.contextId,
        kind: "OWNER",
        state: "ACTIVE",
        createdAt: at.toISOString(),
        createdBySubjectId: actor
      };
      const incomingGrant: EnterpriseContextGrantV010 = {
        contractVersion: "0.1.0",
        grantId: nextId("grant", snapshot, id),
        subjectId: actor,
        contextId: transfer.contextId,
        relationship: "OWNER",
        state: "ACTIVE",
        createdAt: at.toISOString(),
        createdBySubjectId: actor,
        attributes: {
          source: "enterprise.ownership.transfer.accept",
          transferId
        }
      };
      const accepted = {
        ...transfer,
        state: "ACCEPTED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      const revokedRelationships = new Set(outgoingOwners.map(item => item.relationshipId));
      let relationshipEvents = [...snapshot.relationshipEvents];
      relationshipEvents.push({
        contractVersion: "0.1.0",
        eventId: nextId("relationship-event", snapshot, id),
        contextId: transfer.contextId,
        type: "OWNERSHIP_TRANSFER_ACCEPTED",
        occurredAt: at.toISOString(),
        actorSubjectId: actor,
        subjectId: actor,
        transferId
      });
      relationshipEvents.push({
        contractVersion: "0.1.0",
        eventId: nextId("relationship-event", {
          ...snapshot,
          relationshipEvents
        }, id),
        contextId: transfer.contextId,
        type: "RELATIONSHIP_ACTIVATED",
        occurredAt: at.toISOString(),
        actorSubjectId: actor,
        subjectId: actor,
        relationshipId: incomingOwner.relationshipId,
        transferId
      });
      for (const owner of outgoingOwners) {
        relationshipEvents.push({
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", {
            ...snapshot,
            relationshipEvents
          }, id),
          contextId: transfer.contextId,
          type: "RELATIONSHIP_REVOKED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: transfer.fromOwnerSubjectId,
          relationshipId: owner.relationshipId,
          transferId
        });
      }

      dependencies.store.save({
        ...snapshot,
        relationships: [
          ...snapshot.relationships.map(item =>
            revokedRelationships.has(item.relationshipId)
              ? {
                  ...item,
                  state: "REVOKED" as const,
                  revokedAt: at.toISOString(),
                  revokedBySubjectId: actor
                }
              : item
          ),
          incomingOwner
        ],
        grants: [
          ...revokeGrants(snapshot.grants, {
            contextId: transfer.contextId,
            subjectId: transfer.fromOwnerSubjectId,
            relationship: "OWNER",
            occurredAt: at.toISOString(),
            actorSubjectId: actor
          }),
          incomingGrant
        ],
        ownershipTransfers: snapshot.ownershipTransfers.map(item =>
          item.transferId === transferId ? accepted : item
        ),
        relationshipEvents
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({
          transfer: accepted,
          ownerRelationship: incomingOwner,
          ownerGrant: incomingGrant,
          previousOwnerRelationships: outgoingOwners.map(item => item.relationshipId)
        }))
      };
    }
  );

  const declineTransfer = relationshipHandler(
    ENTERPRISE_OWNERSHIP_TRANSFER_DECLINE_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requirePersonalContext(requestContext);
      requireConfirmation(request);
      const actor = requestContext.principal.subjectId;
      const transferId = stringValue(request.values, "transferId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      const transfer = snapshot.ownershipTransfers.find(item => item.transferId === transferId);
      if (!transfer) throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_NOT_FOUND");
      if (transfer.toSubjectId !== actor) {
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_TARGET_MISMATCH");
      }
      if (transfer.state !== "PENDING") {
        throw new Error(`ENTERPRISE_OWNERSHIP_TRANSFER_NOT_PENDING: ${transfer.state}`);
      }
      await authorize(
        dependencies,
        requestContext,
        ENTERPRISE_OWNERSHIP_TRANSFER_DECLINE_ACTION,
        {
          type: "enterprise.ownership-transfer",
          id: transferId,
          attributes: { contextId: transfer.contextId }
        }
      );

      const declined = {
        ...transfer,
        state: "DECLINED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      dependencies.store.save({
        ...snapshot,
        ownershipTransfers: snapshot.ownershipTransfers.map(item =>
          item.transferId === transferId ? declined : item
        ),
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId: transfer.contextId,
          type: "OWNERSHIP_TRANSFER_DECLINED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: actor,
          transferId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ transfer: declined }))
      };
    }
  );

  const cancelTransfer = relationshipHandler(
    ENTERPRISE_OWNERSHIP_TRANSFER_CANCEL_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const contextId = activeEnterpriseContextId(requestContext);
      const actor = requestContext.principal.subjectId;
      const transferId = stringValue(request.values, "transferId")!;
      const at = now();
      const snapshot = dependencies.store.snapshot();
      requireActiveGovernedContext(snapshot, contextId);
      requireRole(snapshot, contextId, actor, ["OWNER"]);
      const transfer = snapshot.ownershipTransfers.find(item =>
        item.transferId === transferId
        && item.contextId === contextId
      );
      if (!transfer) throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_NOT_FOUND");
      if (transfer.fromOwnerSubjectId !== actor) {
        throw new Error("ENTERPRISE_OWNERSHIP_TRANSFER_SOURCE_MISMATCH");
      }
      if (transfer.state !== "PENDING") {
        throw new Error(`ENTERPRISE_OWNERSHIP_TRANSFER_NOT_PENDING: ${transfer.state}`);
      }
      await authorize(
        dependencies,
        requestContext,
        ENTERPRISE_OWNERSHIP_TRANSFER_CANCEL_ACTION,
        {
          type: "enterprise.ownership-transfer",
          id: transferId,
          attributes: { contextId, toSubjectId: transfer.toSubjectId }
        }
      );

      const cancelled = {
        ...transfer,
        state: "CANCELLED" as const,
        respondedAt: at.toISOString(),
        respondedBySubjectId: actor
      };
      dependencies.store.save({
        ...snapshot,
        ownershipTransfers: snapshot.ownershipTransfers.map(item =>
          item.transferId === transferId ? cancelled : item
        ),
        relationshipEvents: appendEvent(snapshot, {
          contractVersion: "0.1.0",
          eventId: nextId("relationship-event", snapshot, id),
          contextId,
          type: "OWNERSHIP_TRANSFER_CANCELLED",
          occurredAt: at.toISOString(),
          actorSubjectId: actor,
          subjectId: transfer.toSubjectId,
          transferId
        })
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ transfer: cancelled }))
      };
    }
  );

  return [
    invite,
    acceptInvitation,
    declineInvitation,
    revokeInvitation,
    revokeRelationship,
    initiateTransfer,
    acceptTransfer,
    declineTransfer,
    cancelTransfer
  ];
}
