import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_ENTERPRISE_CONTEXT_PACKAGE_ID = "host-enterprise-context-provider";
export const HOST_ENTERPRISE_CONTEXT_FEATURE_ID = "host-enterprise-context-provider.default";
export const HOST_ENTERPRISE_CONTEXT_PROVIDER_ID = "host.enterprise-context";
export const ENTERPRISE_CONTEXT_CAPABILITY = "enterprise.directory";

export const hostEnterpriseContextProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  displayName: "Host Enterprise Context Provider",
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
    featureId: HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
    packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [ENTERPRISE_CONTEXT_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
        capability: ENTERPRISE_CONTEXT_CAPABILITY,
        providerContract: "evo.enterprise.context-directory",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.enterprise-context"
        },
        metadata: {
          configurationBoundary: "APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON",
          purpose: "Host-owned Enterprise Context directory"
        }
      }
    }]
  }]
};
