import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_STATIC_AUTHORIZATION_PACKAGE_ID = "host-static-authorization-provider";
export const HOST_STATIC_AUTHORIZATION_FEATURE_ID = "host-static-authorization-provider.default";
export const HOST_STATIC_AUTHORIZATION_PROVIDER_ID = "host.static-authorization";
export const AUTHORIZATION_CHECK_CAPABILITY = "authorization.check";

export const hostStaticAuthorizationProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_STATIC_AUTHORIZATION_PACKAGE_ID,
  displayName: "Host Static Authorization Provider",
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
    featureId: HOST_STATIC_AUTHORIZATION_FEATURE_ID,
    packageId: HOST_STATIC_AUTHORIZATION_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [AUTHORIZATION_CHECK_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
        capability: AUTHORIZATION_CHECK_CAPABILITY,
        providerContract: "evo.authorization.check",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.static-authorization"
        },
        metadata: {
          policyBoundary: "APP_PLATFORM_AUTHORIZATION_POLICY_JSON",
          defaultDecision: "DENY",
          purpose: "Host authorization policy evaluation"
        }
      }
    }]
  }]
};
