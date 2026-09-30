import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID =
  "host-identity-user-directory-provider";
export const HOST_IDENTITY_USER_DIRECTORY_FEATURE_ID =
  "host-identity-user-directory-provider.default";
export const HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID =
  "host.identity-user-directory";
export const IDENTITY_USER_DIRECTORY_CAPABILITY = "identity.user-directory";

export const hostIdentityUserDirectoryProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID,
  displayName: "Host Identity User Directory Provider",
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
    featureId: HOST_IDENTITY_USER_DIRECTORY_FEATURE_ID,
    packageId: HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [IDENTITY_USER_DIRECTORY_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID,
        capability: IDENTITY_USER_DIRECTORY_CAPABILITY,
        providerContract: "evo.identity.user-directory",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.identity-user-directory"
        },
        metadata: {
          purpose:
            "Host-owned current Human Principal directory independent of browser Sessions"
        }
      }
    }]
  }]
};
