import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_BEARER_SESSION_PACKAGE_ID = "host-bearer-session-provider";
export const HOST_BEARER_SESSION_FEATURE_ID = "host-bearer-session-provider.default";
export const HOST_BEARER_SESSION_PROVIDER_ID = "host.bearer-session";
export const REQUEST_IDENTITY_SESSION_CAPABILITY = "identity.session.request";

export const hostBearerSessionProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_BEARER_SESSION_PACKAGE_ID,
  displayName: "Host Bearer Session Provider",
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
    featureId: HOST_BEARER_SESSION_FEATURE_ID,
    packageId: HOST_BEARER_SESSION_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [REQUEST_IDENTITY_SESSION_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_BEARER_SESSION_PROVIDER_ID,
        capability: REQUEST_IDENTITY_SESSION_CAPABILITY,
        providerContract: "evo.identity.request-session",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.bearer-session"
        },
        metadata: {
          configurationBoundary: "APP_PLATFORM_BEARER_SESSIONS_JSON",
          purpose: "Request-bound reference bearer Session resolution"
        }
      }
    }]
  }]
};
