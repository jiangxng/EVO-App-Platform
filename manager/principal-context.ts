import type {
  EnterpriseContextGrantProviderV010,
  EnterpriseContextProviderV010,
  IdentitySessionV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import {
  createHostContextRegistryV010,
  type HostContextRegistryV010
} from "./context-registry.js";

export interface PrincipalContextSourcesV010 {
  enterpriseDirectory?: EnterpriseContextProviderV010;
  enterpriseGrants?: EnterpriseContextGrantProviderV010;
}

export function createPrincipalContextRegistryV010(
  principal: PlatformPrincipalV010,
  sources: PrincipalContextSourcesV010 = {}
): HostContextRegistryV010 {
  return createHostContextRegistryV010({
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: `personal:${principal.subjectId}`,
      ownerSubjectId: principal.subjectId,
      displayName: principal.displayName ?? principal.subjectId
    },
    enterpriseContextSource() {
      if (!sources.enterpriseDirectory || !sources.enterpriseGrants) return [];
      const allowed = new Set(
        sources.enterpriseGrants
          .listForPrincipal(principal)
          .map(grant => grant.contextId)
      );
      return sources.enterpriseDirectory
        .list()
        .filter(context =>
          context.contextId !== undefined && allowed.has(context.contextId)
        );
    }
  });
}

export function createSessionContextRegistryV010(
  session: IdentitySessionV010,
  sources: PrincipalContextSourcesV010 = {}
): HostContextRegistryV010 {
  return createPrincipalContextRegistryV010(session.principal, sources);
}
