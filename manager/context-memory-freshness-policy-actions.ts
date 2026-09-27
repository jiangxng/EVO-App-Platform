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
  EnterpriseContextRelationshipProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import type {
  ContextMemoryFreshnessPolicyStoreV010
} from "./context-memory-freshness-policy-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const CONTEXT_MEMORY_FRESHNESS_POLICY_SET_ACTION =
  "context.memory.quality.freshness-policy.set";
export const CONTEXT_MEMORY_FRESHNESS_POLICY_RETIRE_ACTION =
  "context.memory.quality.freshness-policy.retire";

export interface ContextMemoryFreshnessPolicyActionDependenciesV010 {
  store: ContextMemoryFreshnessPolicyStoreV010;
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
        : "CONTEXT_MEMORY_FRESHNESS_POLICY_ACTION_FAILED",
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
    throw new Error(`CONTEXT_MEMORY_FRESHNESS_POLICY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function stringArray(
  values: Record<string, JsonValue>,
  key: string
): string[] {
  const value = values[key];
  if (value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    if (value.some(item => typeof item !== "string" || !item.trim())) {
      throw new Error(`CONTEXT_MEMORY_FRESHNESS_POLICY_FIELD_INVALID: ${key}`);
    }
    return [...new Set(value.map(item => String(item).trim()))];
  }
  if (typeof value === "string") {
    return [...new Set(
      value.split(",").map(item => item.trim()).filter(Boolean)
    )];
  }
  throw new Error(`CONTEXT_MEMORY_FRESHNESS_POLICY_FIELD_INVALID: ${key}`);
}

function activeContext(requestContext: PlatformRequestContextV010) {
  const active = requestContext.context?.activeContext;
  if (!active) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");
  return active;
}

function requireGovernanceAuthority(
  dependencies: ContextMemoryFreshnessPolicyActionDependenciesV010,
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

async function authorize(
  dependencies: ContextMemoryFreshnessPolicyActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  action: string,
  policyId: string,
  attributes: Record<string, string | number | boolean | null>
): Promise<void> {
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    requestContext,
    {
      action,
      resource: {
        type: "context.memory.quality.freshness-policy",
        id: policyId,
        attributes
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
    );
  }
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    requestContext: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode,
    async execute(request, requestContext) {
      if (!requestContext) {
        return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, requestContext);
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

export function createContextMemoryFreshnessPolicyActionHandlersV010(
  dependencies: ContextMemoryFreshnessPolicyActionDependenciesV010
): AppActionHandler[] {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  const set = handler(
    CONTEXT_MEMORY_FRESHNESS_POLICY_SET_ACTION,
    async (request, requestContext) => {
      if (requestContext.principal.actorType !== "HUMAN") {
        throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
      }
      if (request.requiresConfirmation !== true) {
        throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
      }
      requireGovernanceAuthority(dependencies, requestContext);

      const context = activeContext(requestContext);
      const policyId = stringValue(request.values, "policyId")!;
      const rawWindow = request.values.freshnessWindowDays;
      const freshnessWindowDays = typeof rawWindow === "number"
        ? rawWindow
        : Number(rawWindow);
      if (
        !Number.isInteger(freshnessWindowDays)
        || freshnessWindowDays < 1
        || freshnessWindowDays > 36500
      ) {
        throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_WINDOW_INVALID");
      }

      const rawKinds = stringArray(request.values, "kinds");
      if (
        rawKinds.some(kind =>
          !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(kind)
        )
      ) {
        throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_KIND_INVALID");
      }
      const kinds = rawKinds as ContextMemoryKindV010[];
      const reason = stringValue(request.values, "reason", false);

      await authorize(
        dependencies,
        requestContext,
        CONTEXT_MEMORY_FRESHNESS_POLICY_SET_ACTION,
        policyId,
        {
          contextId: context.contextId,
          contextKind: context.kind,
          freshnessWindowDays,
          kindSpecific: kinds.length > 0
        }
      );

      const event = {
        contractVersion: "0.1.0" as const,
        eventId: `memory-freshness-policy:${id()}`,
        policyId,
        context: structuredClone(context),
        state: "ACTIVE" as const,
        freshnessWindowDays,
        ...(kinds.length ? { kinds } : {}),
        ...(reason ? { reason } : {}),
        occurredAt: now().toISOString(),
        actorSubjectId: requestContext.principal.subjectId
      };
      dependencies.store.append(event);

      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({
          event,
          effective: dependencies.store.effectiveForContext(context)
        }))
      };
    }
  );

  const retire = handler(
    CONTEXT_MEMORY_FRESHNESS_POLICY_RETIRE_ACTION,
    async (request, requestContext) => {
      if (requestContext.principal.actorType !== "HUMAN") {
        throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
      }
      if (request.requiresConfirmation !== true) {
        throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
      }
      requireGovernanceAuthority(dependencies, requestContext);

      const context = activeContext(requestContext);
      const policyId = stringValue(request.values, "itemId", false)
        ?? stringValue(request.values, "policyId")!;
      const current = dependencies.store.effectiveForContext(context)
        .find(policy => policy.policyId === policyId);
      if (!current) {
        throw new Error("CONTEXT_MEMORY_FRESHNESS_POLICY_NOT_ACTIVE");
      }

      await authorize(
        dependencies,
        requestContext,
        CONTEXT_MEMORY_FRESHNESS_POLICY_RETIRE_ACTION,
        policyId,
        {
          contextId: context.contextId,
          contextKind: context.kind,
          previousWindowDays: current.freshnessWindowDays
        }
      );

      const event = {
        contractVersion: "0.1.0" as const,
        eventId: `memory-freshness-policy:${id()}`,
        policyId,
        context: structuredClone(context),
        state: "RETIRED" as const,
        freshnessWindowDays: current.freshnessWindowDays,
        ...(current.kinds ? { kinds: [...current.kinds] } : {}),
        ...(current.reason ? { reason: current.reason } : {}),
        occurredAt: now().toISOString(),
        actorSubjectId: requestContext.principal.subjectId
      };
      dependencies.store.append(event);

      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({
          event,
          effective: dependencies.store.effectiveForContext(context)
        }))
      };
    }
  );

  return [set, retire];
}
