import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  ContextMemoryKindV010,
  ContextMemoryPrivacyClassV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { ContextMemoryRetentionPolicyStoreV010 } from "./context-memory-retention-policy-store.js";
import type { ContextMemoryLegalHoldStoreV010 } from "./context-memory-legal-hold-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const CONTEXT_MEMORY_RETENTION_POLICY_SET_ACTION = "context.memory.retention-policy.set";
export const CONTEXT_MEMORY_LEGAL_HOLD_SET_ACTION = "context.memory.legal-hold.set";

export interface ContextMemoryPolicyActionDependenciesV010 {
  memoryStore: ContextMemoryStoreV010;
  retentionPolicies: ContextMemoryRetentionPolicyStoreV010;
  legalHolds: ContextMemoryLegalHoldStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolveRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONTEXT_MEMORY_POLICY_ACTION_FAILED",
      message
    }
  };
}

function activeContext(context: PlatformRequestContextV010) {
  const active = context.context?.activeContext;
  if (!active) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");
  return active;
}

function requireHumanAndConfirmation(
  request: AppActionRequestV010,
  context: PlatformRequestContextV010
) {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
  }
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function requireGovernanceAuthority(
  dependencies: ContextMemoryPolicyActionDependenciesV010,
  requestContext: PlatformRequestContextV010
) {
  const context = activeContext(requestContext);
  if (context.kind === "PERSONAL") {
    if (
      requestContext.context?.personalContext.contextId !== context.contextId
      || requestContext.context.personalContext.ownerSubjectId !== requestContext.principal.subjectId
    ) throw new Error("PERSONAL_CONTEXT_MEMORY_OWNER_REQUIRED");
    return;
  }
  const allowed = dependencies.resolveRelationshipProvider()
    ?.listForPrincipal(requestContext.principal)
    .some(item =>
      item.contextId === context.contextId
      && item.state === "ACTIVE"
      && ["OWNER", "ADMIN"].includes(item.kind)
    ) ?? false;
  if (!allowed) throw new Error("ENTERPRISE_CONTEXT_MEMORY_GOVERNANCE_ROLE_REQUIRED");
}

function stringValue(values: Record<string, JsonValue>, key: string, required = true) {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`CONTEXT_MEMORY_POLICY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function arrayOfStrings(values: Record<string, JsonValue>, key: string): string[] | undefined {
  const value = values[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some(item => typeof item !== "string")) {
    throw new Error(`CONTEXT_MEMORY_POLICY_FIELD_INVALID: ${key}`);
  }
  const strings = value as string[];
  return strings.map(item => item.trim()).filter(Boolean);
}

async function authorize(
  dependencies: ContextMemoryPolicyActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  action: string,
  resourceType: string,
  resourceId: string
) {
  const context = activeContext(requestContext);
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    requestContext,
    {
      action,
      resource: {
        type: resourceType,
        id: resourceId,
        attributes: {
          contextId: context.contextId,
          contextKind: context.kind
        }
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
    );
  }
}

export function createContextMemoryPolicyActionHandlersV010(
  dependencies: ContextMemoryPolicyActionDependenciesV010
): AppActionHandler[] {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  const retention: AppActionHandler = {
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode: CONTEXT_MEMORY_RETENTION_POLICY_SET_ACTION,
    async execute(request, requestContext) {
      try {
        if (!requestContext) throw new Error("REQUEST_CONTEXT_REQUIRED");
        requireHumanAndConfirmation(request, requestContext);
        requireGovernanceAuthority(dependencies, requestContext);

        const policyId = stringValue(request.values, "policyId")!;
        const state = stringValue(request.values, "state")!;
        if (!["ACTIVE", "RETIRED"].includes(state)) {
          throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_STATE_INVALID");
        }
        const retainForDays = request.values.retainForDays;
        if (typeof retainForDays !== "number" || !Number.isInteger(retainForDays) || retainForDays < 1) {
          throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_DURATION_INVALID");
        }
        const kinds = arrayOfStrings(request.values, "kinds");
        if (kinds?.some(kind => !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(kind))) {
          throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_KIND_INVALID");
        }
        const privacyClasses = arrayOfStrings(request.values, "privacyClasses");
        if (privacyClasses?.some(value => !["STANDARD", "SENSITIVE", "RESTRICTED"].includes(value))) {
          throw new Error("CONTEXT_MEMORY_RETENTION_POLICY_PRIVACY_INVALID");
        }
        await authorize(
          dependencies,
          requestContext,
          CONTEXT_MEMORY_RETENTION_POLICY_SET_ACTION,
          "context.memory.retention-policy",
          policyId
        );
        const event = {
          contractVersion: "0.1.0" as const,
          eventId: `memory-retention-policy:${id()}`,
          policyId,
          context: structuredClone(activeContext(requestContext)),
          state: state as "ACTIVE" | "RETIRED",
          retainForDays,
          ...(kinds?.length ? { kinds: kinds as ContextMemoryKindV010[] } : {}),
          ...(privacyClasses?.length ? { privacyClasses: privacyClasses as ContextMemoryPrivacyClassV010[] } : {}),
          ...(stringValue(request.values, "reason", false)
            ? { reason: stringValue(request.values, "reason", false)! }
            : {}),
          occurredAt: now().toISOString(),
          actorSubjectId: requestContext.principal.subjectId
        };
        dependencies.retentionPolicies.append(event);
        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify({
            event,
            effective: dependencies.retentionPolicies.effectiveForContext(activeContext(requestContext))
          }))
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  };

  const legalHold: AppActionHandler = {
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode: CONTEXT_MEMORY_LEGAL_HOLD_SET_ACTION,
    async execute(request, requestContext) {
      try {
        if (!requestContext) throw new Error("REQUEST_CONTEXT_REQUIRED");
        requireHumanAndConfirmation(request, requestContext);
        requireGovernanceAuthority(dependencies, requestContext);

        const memoryId = stringValue(request.values, "memoryId")!;
        const holdId = stringValue(request.values, "holdId")!;
        const state = stringValue(request.values, "state")!;
        const reason = stringValue(request.values, "reason")!;
        if (!["PLACED", "RELEASED"].includes(state)) {
          throw new Error("CONTEXT_MEMORY_LEGAL_HOLD_STATE_INVALID");
        }
        const context = activeContext(requestContext);
        const memory = dependencies.memoryStore.snapshot().items.find(item => item.memoryId === memoryId);
        if (!memory) throw new Error("CONTEXT_MEMORY_NOT_FOUND");
        if (
          memory.context.kind !== context.kind
          || memory.context.contextId !== context.contextId
          || (
            memory.context.kind === "ENTERPRISE"
            && context.kind === "ENTERPRISE"
            && memory.context.enterpriseId !== context.enterpriseId
          )
        ) throw new Error("CONTEXT_MEMORY_CONTEXT_MISMATCH");

        await authorize(
          dependencies,
          requestContext,
          CONTEXT_MEMORY_LEGAL_HOLD_SET_ACTION,
          "context.memory.legal-hold",
          memoryId
        );
        const event = {
          contractVersion: "0.1.0" as const,
          eventId: `memory-legal-hold:${id()}`,
          holdId,
          memoryId,
          context: structuredClone(context),
          state: state as "PLACED" | "RELEASED",
          reason,
          occurredAt: now().toISOString(),
          actorSubjectId: requestContext.principal.subjectId
        };
        dependencies.legalHolds.append(event);
        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify({
            event,
            effective: dependencies.legalHolds.decision(memoryId)
          }))
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  };

  return [retention, legalHold];
}
