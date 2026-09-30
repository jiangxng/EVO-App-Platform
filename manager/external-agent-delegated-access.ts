import type {
  ExternalAgentAuthorityGrantV010,
  ExternalAgentGovernanceStoreV010
} from "../contracts/external-agent-access.js";
import type {
  AuthorizationProviderV010,
  EnterpriseContextGrantProviderV010,
  EnterpriseContextProviderV010,
  IdentityUserDirectoryProviderV010,
  PlatformRequestContextV010,
  PlatformScopeV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import type {
  CapabilityOperationAccessEvaluationV010,
  EffectiveCapabilityOperationV010
} from "./capability-operation-access.js";
import {
  listAuthorizedCapabilityOperationsV010
} from "./capability-operation-access.js";
import {
  resolveExternalAgentGrantEffectiveStatusV010
} from "./external-agent-governance-service.js";
import {
  createPrincipalContextRegistryV010
} from "./principal-context.js";
import type { AppManagerService } from "./service.js";

export type EffectiveDelegatedAuthorityReasonV010 =
  | "ACTIVE"
  | "GRANT_NOT_FOUND"
  | "GRANT_AGENT_MISMATCH"
  | "GRANT_CLIENT_MISMATCH"
  | "AGENT_NOT_ACTIVE"
  | "CLIENT_NOT_ACTIVE"
  | "CLIENT_AGENT_MISMATCH"
  | "GRANT_REVOKED"
  | "GRANT_NOT_YET_VALID"
  | "GRANT_EXPIRED"
  | "IDENTITY_DIRECTORY_UNAVAILABLE"
  | "AUTHORIZING_PRINCIPAL_NOT_FOUND"
  | "AUTHORIZING_PRINCIPAL_NOT_ACTIVE"
  | "AUTHORIZING_PRINCIPAL_MISMATCH"
  | "ENTERPRISE_CONTEXT_DIRECTORY_UNAVAILABLE"
  | "ENTERPRISE_CONTEXT_GRANT_DIRECTORY_UNAVAILABLE"
  | "GRANT_CONTEXT_NOT_AVAILABLE";

export interface EffectiveDelegatedCapabilityCatalogV010 {
  contractVersion: "0.1.0";
  active: boolean;
  reason: EffectiveDelegatedAuthorityReasonV010;
  grant?: ExternalAgentAuthorityGrantV010;
  context?: ResolvedContextSetV010;
  requestContext?: PlatformRequestContextV010;
  operations: EffectiveCapabilityOperationV010[];
  evaluations: CapabilityOperationAccessEvaluationV010[];
}

export interface EffectiveDelegatedOperationResolutionV010 {
  contractVersion: "0.1.0";
  allowed: boolean;
  reason:
    | EffectiveDelegatedAuthorityReasonV010
    | "OPERATION_NOT_GRANTED"
    | "OPERATION_NOT_CURRENTLY_AUTHORIZED";
  grant?: ExternalAgentAuthorityGrantV010;
  context?: ResolvedContextSetV010;
  requestContext?: PlatformRequestContextV010;
  operation?: EffectiveCapabilityOperationV010;
}

export interface EffectiveDelegatedAuthorityDependenciesV010 {
  store: ExternalAgentGovernanceStoreV010;
  manager: AppManagerService;
  identityDirectory?: IdentityUserDirectoryProviderV010;
  enterpriseDirectory?: EnterpriseContextProviderV010;
  enterpriseGrants?: EnterpriseContextGrantProviderV010;
  authorizationProvider?: AuthorizationProviderV010;
  now?: () => Date;
}

function deniedCatalog(
  reason: EffectiveDelegatedAuthorityReasonV010,
  grant?: ExternalAgentAuthorityGrantV010
): EffectiveDelegatedCapabilityCatalogV010 {
  return {
    contractVersion: "0.1.0",
    active: false,
    reason,
    ...(grant ? { grant: structuredClone(grant) } : {}),
    operations: [],
    evaluations: []
  };
}

function requestScope(
  principalSubjectId: string,
  context: ResolvedContextSetV010
): PlatformScopeV010 {
  if (context.activeContext.kind === "ENTERPRISE") {
    const enterprise = context.enterpriseContext;
    return {
      contractVersion: "0.1.0",
      enterpriseId:
        enterprise?.enterpriseId ?? context.activeContext.enterpriseId,
      ...(enterprise?.companyId ? { companyId: enterprise.companyId } : {}),
      ...(enterprise?.workspaceId
        ? { workspaceId: enterprise.workspaceId }
        : {}),
      userId: principalSubjectId
    };
  }
  return {
    contractVersion: "0.1.0",
    userId: principalSubjectId
  };
}

function findGrantContext(
  grant: ExternalAgentAuthorityGrantV010,
  input: {
    principal: Parameters<typeof createPrincipalContextRegistryV010>[0];
    enterpriseDirectory: EnterpriseContextProviderV010;
    enterpriseGrants: EnterpriseContextGrantProviderV010;
  }
): ResolvedContextSetV010 | undefined {
  const registry = createPrincipalContextRegistryV010(input.principal, {
    enterpriseDirectory: input.enterpriseDirectory,
    enterpriseGrants: input.enterpriseGrants
  });
  const ref = registry.list().find(item => item.contextId === grant.contextId);
  if (!ref) return undefined;
  return registry.resolve(ref);
}

export async function listEffectiveDelegatedCapabilityOperationsV010(input: {
  dependencies: EffectiveDelegatedAuthorityDependenciesV010;
  grantId: string;
  agentId: string;
  clientId: string;
  correlationId: string;
  locale?: string;
  capability?: string;
}): Promise<EffectiveDelegatedCapabilityCatalogV010> {
  const now = input.dependencies.now ?? (() => new Date());
  const grantStatus = resolveExternalAgentGrantEffectiveStatusV010({
    store: input.dependencies.store,
    grantId: input.grantId,
    agentId: input.agentId,
    clientId: input.clientId,
    at: now()
  });
  if (!grantStatus.active || !grantStatus.grant) {
    return deniedCatalog(grantStatus.reason);
  }
  const grant = grantStatus.grant;

  const identityDirectory = input.dependencies.identityDirectory;
  if (!identityDirectory) {
    return deniedCatalog("IDENTITY_DIRECTORY_UNAVAILABLE", grant);
  }
  const record = identityDirectory.get(grant.authorizingPrincipalSubjectId);
  if (!record) {
    return deniedCatalog("AUTHORIZING_PRINCIPAL_NOT_FOUND", grant);
  }
  if (record.state !== "ACTIVE") {
    return deniedCatalog("AUTHORIZING_PRINCIPAL_NOT_ACTIVE", grant);
  }
  if (
    record.principal.subjectId !== grant.authorizingPrincipalSubjectId
    || record.principal.actorType !== "HUMAN"
  ) {
    return deniedCatalog("AUTHORIZING_PRINCIPAL_MISMATCH", grant);
  }

  if (!input.dependencies.enterpriseDirectory) {
    return deniedCatalog("ENTERPRISE_CONTEXT_DIRECTORY_UNAVAILABLE", grant);
  }
  if (!input.dependencies.enterpriseGrants) {
    return deniedCatalog(
      "ENTERPRISE_CONTEXT_GRANT_DIRECTORY_UNAVAILABLE",
      grant
    );
  }

  const context = findGrantContext(grant, {
    principal: record.principal,
    enterpriseDirectory: input.dependencies.enterpriseDirectory,
    enterpriseGrants: input.dependencies.enterpriseGrants
  });
  if (!context) {
    return deniedCatalog("GRANT_CONTEXT_NOT_AVAILABLE", grant);
  }

  const requestContext: PlatformRequestContextV010 = {
    contractVersion: "0.1.0",
    principal: structuredClone(record.principal),
    scope: requestScope(record.principal.subjectId, context),
    context: structuredClone(context),
    correlationId: input.correlationId,
    ...(input.locale ? { locale: input.locale } : {})
  };

  const humanCatalog = await listAuthorizedCapabilityOperationsV010({
    manager: input.dependencies.manager,
    authorizationProvider: input.dependencies.authorizationProvider,
    requestContext,
    audience: "HUMAN",
    ...(input.capability ? { capability: input.capability } : {})
  });

  const grantedIds = new Set(grant.allowedOperationIds);
  const allowedEffects = new Set(grant.effectConstraints);
  const operations = humanCatalog.operations
    .filter(operation =>
      operation.exposure.includes("EXTERNAL_AGENT")
      && grantedIds.has(operation.operationId)
      && allowedEffects.has(operation.effect)
    )
    .sort((a, b) => a.operationId.localeCompare(b.operationId));

  return {
    contractVersion: "0.1.0",
    active: true,
    reason: "ACTIVE",
    grant: structuredClone(grant),
    context: structuredClone(context),
    requestContext: structuredClone(requestContext),
    operations: operations.map(operation => structuredClone(operation)),
    evaluations: humanCatalog.evaluations.map(item => structuredClone(item))
  };
}

export async function resolveEffectiveDelegatedCapabilityOperationV010(input: {
  dependencies: EffectiveDelegatedAuthorityDependenciesV010;
  grantId: string;
  agentId: string;
  clientId: string;
  operationId: string;
  correlationId: string;
  locale?: string;
}): Promise<EffectiveDelegatedOperationResolutionV010> {
  const catalog = await listEffectiveDelegatedCapabilityOperationsV010({
    dependencies: input.dependencies,
    grantId: input.grantId,
    agentId: input.agentId,
    clientId: input.clientId,
    correlationId: input.correlationId,
    ...(input.locale ? { locale: input.locale } : {})
  });

  if (!catalog.active) {
    return {
      contractVersion: "0.1.0",
      allowed: false,
      reason: catalog.reason,
      ...(catalog.grant ? { grant: structuredClone(catalog.grant) } : {})
    };
  }

  const grant = catalog.grant!;
  if (!grant.allowedOperationIds.includes(input.operationId)) {
    return {
      contractVersion: "0.1.0",
      allowed: false,
      reason: "OPERATION_NOT_GRANTED",
      grant: structuredClone(grant),
      ...(catalog.context ? { context: structuredClone(catalog.context) } : {}),
      ...(catalog.requestContext
        ? { requestContext: structuredClone(catalog.requestContext) }
        : {})
    };
  }

  const operation = catalog.operations.find(
    item => item.operationId === input.operationId
  );
  if (!operation) {
    return {
      contractVersion: "0.1.0",
      allowed: false,
      reason: "OPERATION_NOT_CURRENTLY_AUTHORIZED",
      grant: structuredClone(grant),
      ...(catalog.context ? { context: structuredClone(catalog.context) } : {}),
      ...(catalog.requestContext
        ? { requestContext: structuredClone(catalog.requestContext) }
        : {})
    };
  }

  return {
    contractVersion: "0.1.0",
    allowed: true,
    reason: "ACTIVE",
    grant: structuredClone(grant),
    context: structuredClone(catalog.context!),
    requestContext: structuredClone(catalog.requestContext!),
    operation: structuredClone(operation)
  };
}
