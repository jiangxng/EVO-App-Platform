import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID = "host-enterprise-relationship-provider";
export const HOST_ENTERPRISE_RELATIONSHIP_FEATURE_ID = "host-enterprise-relationship-provider.default";
export const HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID = "host.enterprise-relationship";
export const ENTERPRISE_RELATIONSHIP_CAPABILITY = "enterprise.relationship";

export const hostEnterpriseRelationshipProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID,
  displayName: "Host Enterprise Relationship Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: HOST_ENTERPRISE_RELATIONSHIP_FEATURE_ID,
    packageId: HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [ENTERPRISE_RELATIONSHIP_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID,
        capability: ENTERPRISE_RELATIONSHIP_CAPABILITY,
        providerContract: "evo.enterprise.relationship",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.enterprise-relationship"
        },
        metadata: {
          purpose: "Host-owned Enterprise Context governance relationships"
        }
      }
    }]
  }]
};
