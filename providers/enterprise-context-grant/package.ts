import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID = "host-enterprise-context-grant-provider";
export const HOST_ENTERPRISE_CONTEXT_GRANT_FEATURE_ID = "host-enterprise-context-grant-provider.default";
export const HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID = "host.enterprise-context-grant";
export const ENTERPRISE_MEMBERSHIP_CAPABILITY = "enterprise.membership";

export const hostEnterpriseContextGrantProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID,
  displayName: "Host Enterprise Context Grant Provider",
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
    featureId: HOST_ENTERPRISE_CONTEXT_GRANT_FEATURE_ID,
    packageId: HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [ENTERPRISE_MEMBERSHIP_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID,
        capability: ENTERPRISE_MEMBERSHIP_CAPABILITY,
        providerContract: "evo.enterprise.context-grant",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.enterprise-context-grant"
        },
        metadata: {
          configurationBoundary: "APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON",
          purpose: "Host-owned Principal-to-Enterprise-Context grants"
        }
      }
    }]
  }]
};
