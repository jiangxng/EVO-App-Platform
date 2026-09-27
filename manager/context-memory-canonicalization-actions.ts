import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import type {
  ContextMemoryCanonicalizationServiceV010
} from "./context-memory-canonicalization-service.js";
import {
  authorizeMaterialWriteV010,
  legacyScopeFromRequestContextV010
} from "./material-write-authorization.js";
import { requireContextMemoryWriteAuthorityV010 } from "./context-memory-authority.js";

export const CONTEXT_MEMORY_CANONICALIZATION_ACCEPT_ACTION =
  "context.memory.canonicalization.proposal.accept";
export const CONTEXT_MEMORY_CANONICALIZATION_REJECT_ACTION =
  "context.memory.canonicalization.proposal.reject";

export interface ContextMemoryCanonicalizationActionDependenciesV010 {
  service: ContextMemoryCanonicalizationServiceV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolveRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined;
  listAvailableContexts(principal: PlatformPrincipalV010): ActiveContextRefV010[];
  resolveContext(
    principal: PlatformPrincipalV010,
    ref: ActiveContextRefV010
  ): ResolvedContextSetV010;
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONTEXT_MEMORY_CANONICALIZATION_ACTION_FAILED",
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
    throw new Error(`CONTEXT_MEMORY_CANONICALIZATION_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function requireHuman(context: PlatformRequestContextV010): void {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("CONTEXT_MEMORY_CANONICALIZATION_HUMAN_REQUIRED");
  }
}

function requireConfirmation(request: AppActionRequestV010): void {
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function proposalForRequest(
  dependencies: ContextMemoryCanonicalizationActionDependenciesV010,
  request: AppActionRequestV010,
  requestContext: PlatformRequestContextV010
) {
  const proposalId = stringValue(request.values, "itemId")!;
  const proposal = dependencies.service.get(proposalId);
  if (!proposal) {
    throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_FOUND");
  }
  const available = dependencies.listAvailableContexts(requestContext.principal)
    .some(item =>
      item.kind === proposal.context.kind
      && item.contextId === proposal.context.contextId
      && (
        item.kind !== "ENTERPRISE"
        || proposal.context.kind !== "ENTERPRISE"
        || item.enterpriseId === proposal.context.enterpriseId
      )
    );
  if (!available) {
    throw new Error(`CONTEXT_NOT_AVAILABLE: ${proposal.context.contextId}`);
  }
  requireContextMemoryWriteAuthorityV010({
    principal: requestContext.principal,
    personalContext: requestContext.context?.personalContext,
    targetContext: proposal.context,
    relationshipProvider: dependencies.resolveRelationshipProvider()
  });
  return proposal;
}

function scopedRequestContext(
  dependencies: ContextMemoryCanonicalizationActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010
): PlatformRequestContextV010 {
  const partial: PlatformRequestContextV010 = {
    ...requestContext,
    context: dependencies.resolveContext(requestContext.principal, context)
  };
  return {
    ...partial,
    scope: legacyScopeFromRequestContextV010(partial)
  };
}

async function authorizeProposalDecision(
  dependencies: ContextMemoryCanonicalizationActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010,
  action: "context.memory.proposal.accept" | "context.memory.proposal.reject",
  proposalId: string
): Promise<void> {
  const scoped = scopedRequestContext(dependencies, requestContext, context);
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    scoped,
    {
      action,
      resource: {
        type: "context.memory.proposal",
        id: proposalId,
        attributes: {
          contextId: context.contextId,
          contextKind: context.kind,
          proposalType: "CANONICALIZATION"
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

async function authorizeCanonicalization(
  dependencies: ContextMemoryCanonicalizationActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010,
  proposalId: string,
  duplicateMemoryId: string,
  canonicalMemoryId: string
): Promise<void> {
  const scoped = scopedRequestContext(dependencies, requestContext, context);
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    scoped,
    {
      action: "context.memory.governance.set",
      resource: {
        type: "context.memory.governance",
        id: duplicateMemoryId,
        attributes: {
          contextId: context.contextId,
          contextKind: context.kind,
          governanceType: "CANONICALIZATION",
          canonicalMemoryId,
          sourceProposalId: proposalId
        }
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: canonicalization denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
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
      if (!requestContext) return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      try {
        return await execute(request, requestContext);
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

export function createContextMemoryCanonicalizationActionHandlersV010(
  dependencies: ContextMemoryCanonicalizationActionDependenciesV010
): AppActionHandler[] {
  const accept = handler(
    CONTEXT_MEMORY_CANONICALIZATION_ACCEPT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const proposal = proposalForRequest(dependencies, request, requestContext);
      await authorizeProposalDecision(
        dependencies,
        requestContext,
        proposal.context,
        "context.memory.proposal.accept",
        proposal.proposalId
      );
      await authorizeCanonicalization(
        dependencies,
        requestContext,
        proposal.context,
        proposal.proposalId,
        proposal.duplicateMemoryId,
        proposal.canonicalMemoryId
      );
      const accepted = dependencies.service.accept({
        proposalId: proposal.proposalId,
        principal: requestContext.principal,
        ...(stringValue(request.values, "reason", false)
          ? { reason: stringValue(request.values, "reason", false) }
          : {})
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ proposal: accepted }))
      };
    }
  );

  const reject = handler(
    CONTEXT_MEMORY_CANONICALIZATION_REJECT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const proposal = proposalForRequest(dependencies, request, requestContext);
      await authorizeProposalDecision(
        dependencies,
        requestContext,
        proposal.context,
        "context.memory.proposal.reject",
        proposal.proposalId
      );
      const rejected = dependencies.service.reject({
        proposalId: proposal.proposalId,
        principal: requestContext.principal,
        ...(stringValue(request.values, "reason", false)
          ? { reason: stringValue(request.values, "reason", false) }
          : {})
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ proposal: rejected }))
      };
    }
  );

  return [accept, reject];
}
