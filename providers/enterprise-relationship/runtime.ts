import type {
  EnterpriseContextRelationshipProviderV010,
  EnterpriseContextRelationshipV010,
  PlatformPrincipalV010
} from "../../contracts/platform-services.js";
import { HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID } from "./package.js";

export function createHostEnterpriseRelationshipProviderV010(
  source: () => readonly EnterpriseContextRelationshipV010[]
): EnterpriseContextRelationshipProviderV010 {
  return {
    providerId: HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID,
    listForPrincipal(principal: PlatformPrincipalV010) {
      return source()
        .filter(item => item.subjectId === principal.subjectId && item.state === "ACTIVE")
        .map(item => structuredClone(item));
    },
    listForContext(contextId: string) {
      return source()
        .filter(item => item.contextId === contextId && item.state === "ACTIVE")
        .map(item => structuredClone(item));
    }
  };
}

export function createHostEnterpriseRelationshipHealthProbeV010(
  source: () => readonly EnterpriseContextRelationshipV010[]
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Host Enterprise Relationship store contains ${source().length} relationship(s).`
  });
}
