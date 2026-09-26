import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  ContextMemoryKindV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "../agents/enterprise-agent/package.js";
import {
  requireContextMemoryWriteAuthorityV010
} from "./context-memory-authority.js";
import type {
  ContextMemoryProposalServiceV010
} from "./context-memory-proposal-service.js";
import {
  authorizeMaterialWriteV010,
  legacyScopeFromRequestContextV010
} from "./material-write-authorization.js";

export const CONTEXT_MEMORY_PROPOSAL_EDIT_ACTION = "context.memory.proposal.edit";
export const CONTEXT_MEMORY_PROPOSAL_ACCEPT_ACTION = "context.memory.proposal.accept";
export const CONTEXT_MEMORY_PROPOSAL_REJECT_ACTION = "context.memory.proposal.reject";

export interface ContextMemoryProposalActionDependenciesV010 {
  service: ContextMemoryProposalServiceV010;
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
        : "CONTEXT_MEMORY_PROPOSAL_ACTION_FAILED",
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
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function kindValue(
  values: Record<string, JsonValue>
): ContextMemoryKindV010 | undefined {
  const value = stringValue(values, "kind", false);
  if (!value) return undefined;
  if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(value)) {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_KIND_INVALID");
  }
  return value as ContextMemoryKindV010;
}

function requireHuman(context: PlatformRequestContextV010): void {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_HUMAN_REQUIRED");
  }
}

function requireConfirmation(request: AppActionRequestV010): void {
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function proposalForRequest(
  dependencies: ContextMemoryProposalActionDependenciesV010,
  request: AppActionRequestV010,
  requestContext: PlatformRequestContextV010
) {
  const proposalId = stringValue(request.values, "itemId")!;
  const proposal = dependencies.service.get(proposalId);
  if (!proposal) throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");

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

function requestContextForProposal(
  dependencies: ContextMemoryProposalActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010
): PlatformRequestContextV010 {
  const resolved = dependencies.resolveContext(requestContext.principal, context);
  const partial: PlatformRequestContextV010 = {
    ...requestContext,
    context: resolved
  };
  return {
    ...partial,
    scope: legacyScopeFromRequestContextV010(partial)
  };
}

async function authorize(
  dependencies: ContextMemoryProposalActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010,
  action: string,
  proposalId: string
): Promise<void> {
  const scoped = requestContextForProposal(dependencies, requestContext, context);
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

async function authorizeMemoryRecord(
  dependencies: ContextMemoryProposalActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  context: ActiveContextRefV010,
  proposalId: string
): Promise<void> {
  const scoped = requestContextForProposal(dependencies, requestContext, context);
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    scoped,
    {
      action: "context.memory.record",
      resource: {
        type: "context.memory",
        attributes: {
          contextId: context.contextId,
          contextKind: context.kind,
          sourceProposalId: proposalId
        }
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: durable Memory write denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
    );
  }
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Memory Proposal review requires a Host-resolved request context."
          }
        };
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

export function createContextMemoryProposalActionHandlersV010(
  dependencies: ContextMemoryProposalActionDependenciesV010
): AppActionHandler[] {
  const edit = handler(
    CONTEXT_MEMORY_PROPOSAL_EDIT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      const proposal = proposalForRequest(dependencies, request, requestContext);
      await authorize(
        dependencies,
        requestContext,
        proposal.context,
        CONTEXT_MEMORY_PROPOSAL_EDIT_ACTION,
        proposal.proposalId
      );
      const updated = await dependencies.service.edit({
        proposalId: proposal.proposalId,
        principal: requestContext.principal,
        ...(kindValue(request.values) ? { kind: kindValue(request.values) } : {}),
        ...(stringValue(request.values, "summary", false)
          ? { summary: stringValue(request.values, "summary", false) }
          : {})
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify({ proposal: updated }))
      };
    }
  );

  const accept = handler(
    CONTEXT_MEMORY_PROPOSAL_ACCEPT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const proposal = proposalForRequest(dependencies, request, requestContext);
      await authorize(
        dependencies,
        requestContext,
        proposal.context,
        CONTEXT_MEMORY_PROPOSAL_ACCEPT_ACTION,
        proposal.proposalId
      );
      await authorizeMemoryRecord(
        dependencies,
        requestContext,
        proposal.context,
        proposal.proposalId
      );
      const accepted = await dependencies.service.accept({
        proposalId: proposal.proposalId,
        principal: requestContext.principal,
        ...(kindValue(request.values) ? { kind: kindValue(request.values) } : {}),
        ...(stringValue(request.values, "summary", false)
          ? { summary: stringValue(request.values, "summary", false) }
          : {})
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify(accepted))
      };
    }
  );

  const reject = handler(
    CONTEXT_MEMORY_PROPOSAL_REJECT_ACTION,
    async (request, requestContext) => {
      requireHuman(requestContext);
      requireConfirmation(request);
      const proposal = proposalForRequest(dependencies, request, requestContext);
      await authorize(
        dependencies,
        requestContext,
        proposal.context,
        CONTEXT_MEMORY_PROPOSAL_REJECT_ACTION,
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

  return [edit, accept, reject];
}
