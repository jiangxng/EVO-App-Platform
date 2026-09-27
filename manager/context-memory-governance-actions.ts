import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  ContextMemoryGovernanceStateV010,
  ContextMemoryPrivacyClassV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { ContextMemoryGovernanceStoreV010 } from "./context-memory-governance-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const CONTEXT_MEMORY_GOVERNANCE_SET_ACTION = "context.memory.governance.set";

export interface ContextMemoryGovernanceActionDependenciesV010 {
  memoryStore: ContextMemoryStoreV010;
  governanceStore: ContextMemoryGovernanceStoreV010;
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
        : "CONTEXT_MEMORY_GOVERNANCE_ACTION_FAILED",
      message
    }
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`CONTEXT_MEMORY_GOVERNANCE_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function activeContext(requestContext: PlatformRequestContextV010) {
  const active = requestContext.context?.activeContext;
  if (!active) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");
  return active;
}

function requireGovernanceAuthority(
  dependencies: ContextMemoryGovernanceActionDependenciesV010,
  requestContext: PlatformRequestContextV010
): void {
  const context = activeContext(requestContext);
  if (context.kind === "PERSONAL") {
    if (
      requestContext.context?.personalContext.contextId !== context.contextId
      || requestContext.context.personalContext.ownerSubjectId
        !== requestContext.principal.subjectId
    ) {
      throw new Error("PERSONAL_CONTEXT_MEMORY_OWNER_REQUIRED");
    }
    return;
  }
  const allowed = dependencies.resolveRelationshipProvider()
    ?.listForPrincipal(requestContext.principal)
    .some(item =>
      item.contextId === context.contextId
      && item.state === "ACTIVE"
      && ["OWNER", "ADMIN"].includes(item.kind)
    ) ?? false;
  if (!allowed) {
    throw new Error("ENTERPRISE_CONTEXT_MEMORY_GOVERNANCE_ROLE_REQUIRED");
  }
}

function parseState(values: Record<string, JsonValue>): ContextMemoryGovernanceStateV010 {
  const value = stringValue(values, "state")!;
  if (!["ACTIVE", "RESTRICTED", "EXPIRED"].includes(value)) {
    throw new Error("CONTEXT_MEMORY_GOVERNANCE_STATE_INVALID");
  }
  return value as ContextMemoryGovernanceStateV010;
}

function parsePrivacy(
  values: Record<string, JsonValue>
): ContextMemoryPrivacyClassV010 {
  const value = stringValue(values, "privacyClass")!;
  if (!["STANDARD", "SENSITIVE", "RESTRICTED"].includes(value)) {
    throw new Error("CONTEXT_MEMORY_PRIVACY_CLASS_INVALID");
  }
  return value as ContextMemoryPrivacyClassV010;
}

export function createContextMemoryGovernanceActionHandlerV010(
  dependencies: ContextMemoryGovernanceActionDependenciesV010
): AppActionHandler {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  return {
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode: CONTEXT_MEMORY_GOVERNANCE_SET_ACTION,
    async execute(request: AppActionRequestV010, requestContext?: PlatformRequestContextV010) {
      if (!requestContext) {
        return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        if (requestContext.principal.actorType !== "HUMAN") {
          throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
        }
        if (request.requiresConfirmation !== true) {
          throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
        }
        requireGovernanceAuthority(dependencies, requestContext);

        const memoryId = stringValue(request.values, "memoryId")!;
        const state = parseState(request.values);
        const privacyClass = parsePrivacy(request.values);
        const reason = stringValue(request.values, "reason", false);
        const retainUntilRaw = stringValue(request.values, "retainUntil", false);
        const retainUntil = retainUntilRaw
          ? new Date(retainUntilRaw).toISOString()
          : undefined;
        if (
          retainUntilRaw
          && !Number.isFinite(Date.parse(retainUntilRaw))
        ) {
          throw new Error("CONTEXT_MEMORY_RETENTION_TIME_INVALID");
        }

        const context = activeContext(requestContext);
        const memory = dependencies.memoryStore.snapshot().items.find(
          item => item.memoryId === memoryId
        );
        if (!memory) throw new Error(`CONTEXT_MEMORY_NOT_FOUND: ${memoryId}`);
        if (
          memory.context.kind !== context.kind
          || memory.context.contextId !== context.contextId
          || (
            memory.context.kind === "ENTERPRISE"
            && context.kind === "ENTERPRISE"
            && memory.context.enterpriseId !== context.enterpriseId
          )
        ) {
          throw new Error("CONTEXT_MEMORY_CONTEXT_MISMATCH");
        }

        const decision = await authorizeMaterialWriteV010(
          dependencies.resolveAuthorizationProvider(),
          requestContext,
          {
            action: CONTEXT_MEMORY_GOVERNANCE_SET_ACTION,
            resource: {
              type: "context.memory.governance",
              id: memoryId,
              attributes: {
                contextId: context.contextId,
                contextKind: context.kind,
                state,
                privacyClass
              }
            }
          }
        );
        if (!decision.allowed) {
          throw new Error(
            `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: `
            + `denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
          );
        }

        const event = {
          contractVersion: "0.1.0" as const,
          eventId: `memory-governance:${id()}`,
          memoryId,
          context: structuredClone(context),
          state,
          privacyClass,
          ...(reason ? { reason } : {}),
          ...(retainUntil ? { retainUntil } : {}),
          occurredAt: now().toISOString(),
          actorSubjectId: requestContext.principal.subjectId
        };
        dependencies.governanceStore.append(event);

        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify({
            event,
            effective: dependencies.governanceStore.decision(memoryId, now())
          }))
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}
