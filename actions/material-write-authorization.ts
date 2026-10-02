import type {
  AuthorizationDecisionV010,
  AuthorizationProviderV010,
  PlatformRequestContextV010,
  PlatformScopeV010
} from "../contracts/platform-services.js";

export interface MaterialWriteAuthorizationInputV010 {
  action: string;
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  };
}

export function legacyScopeFromRequestContextV010(
  context: PlatformRequestContextV010
): PlatformScopeV010 {
  const active = context.context?.activeContext;
  const enterprise = context.context?.enterpriseContext;
  if (active?.kind === "ENTERPRISE") {
    return {
      contractVersion: "0.1.0",
      enterpriseId: enterprise?.enterpriseId ?? active.enterpriseId,
      ...(enterprise?.companyId ? { companyId: enterprise.companyId } : {}),
      ...(enterprise?.workspaceId ? { workspaceId: enterprise.workspaceId } : {}),
      userId: context.principal.subjectId
    };
  }
  return {
    contractVersion: "0.1.0",
    userId: context.principal.subjectId
  };
}

export async function authorizeMaterialWriteV010(
  provider: AuthorizationProviderV010 | undefined,
  context: PlatformRequestContextV010,
  input: MaterialWriteAuthorizationInputV010
): Promise<AuthorizationDecisionV010> {
  if (!provider) {
    return {
      contractVersion: "0.1.0",
      allowed: false,
      policyProviderId: "host.missing-authorization-provider",
      reasonCodes: ["AUTHORIZATION_PROVIDER_REQUIRED"]
    };
  }

  const active = context.context?.activeContext;
  return provider.check({
    contractVersion: "0.1.0",
    principal: context.principal,
    scope: legacyScopeFromRequestContextV010(context),
    action: input.action,
    resource: input.resource,
    context: {
      ...(active ? { activeContextKind: active.kind, activeContextId: active.contextId } : {}),
      correlationId: context.correlationId
    }
  });
}
