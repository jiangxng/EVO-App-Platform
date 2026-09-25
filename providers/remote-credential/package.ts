import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_REMOTE_CREDENTIAL_PROVIDER_PACKAGE_ID = "host-remote-credential-provider";
export const HOST_REMOTE_CREDENTIAL_PROVIDER_FEATURE_ID = "host-remote-credential-provider.default";
export const HOST_REMOTE_CREDENTIAL_PROVIDER_ID = "host.remote-bearer";
export const REMOTE_CREDENTIAL_CAPABILITY = "plugin.remote-credential";

export const hostRemoteCredentialProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_REMOTE_CREDENTIAL_PROVIDER_PACKAGE_ID,
  displayName: "Host Remote Credential Provider",
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
    featureId: HOST_REMOTE_CREDENTIAL_PROVIDER_FEATURE_ID,
    packageId: HOST_REMOTE_CREDENTIAL_PROVIDER_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [REMOTE_CREDENTIAL_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_REMOTE_CREDENTIAL_PROVIDER_ID,
        capability: REMOTE_CREDENTIAL_CAPABILITY,
        providerContract: "evo.plugin.remote-credential",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.remote-bearer"
        },
        metadata: {
          secretBoundary: "APP_PLATFORM_REMOTE_BEARER_TOKENS_JSON",
          purpose: "REMOTE plugin short-lived bearer credential resolution"
        }
      }
    }]
  }]
};
