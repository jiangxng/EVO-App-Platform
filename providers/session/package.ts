import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_STATIC_SESSION_PACKAGE_ID = "host-static-session-provider";
export const HOST_STATIC_SESSION_FEATURE_ID = "host-static-session-provider.default";
export const HOST_STATIC_SESSION_PROVIDER_ID = "host.static-session";
export const IDENTITY_SESSION_CAPABILITY = "identity.session";

export const hostStaticSessionProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_STATIC_SESSION_PACKAGE_ID,
  displayName: "Host Static Session Provider",
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
    featureId: HOST_STATIC_SESSION_FEATURE_ID,
    packageId: HOST_STATIC_SESSION_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [IDENTITY_SESSION_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_STATIC_SESSION_PROVIDER_ID,
        capability: IDENTITY_SESSION_CAPABILITY,
        providerContract: "evo.identity.session",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.static-session"
        },
        metadata: {
          configurationBoundary: "APP_PLATFORM_STATIC_SESSION_JSON",
          purpose: "Deployment-scoped reference Identity Session"
        }
      }
    }]
  }]
};
