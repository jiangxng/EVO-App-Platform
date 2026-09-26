import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_ENCRYPTED_SECRETS_PACKAGE_ID = "host-encrypted-secrets-provider";
export const HOST_ENCRYPTED_SECRETS_FEATURE_ID = "host-encrypted-secrets-provider.default";
export const HOST_ENCRYPTED_SECRETS_PROVIDER_ID = "host.encrypted-secrets";
export const SECRETS_RESOLVE_CAPABILITY = "secrets.resolve";

export const hostEncryptedSecretsProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_ENCRYPTED_SECRETS_PACKAGE_ID,
  displayName: "Host Encrypted Secrets Provider",
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
    featureId: HOST_ENCRYPTED_SECRETS_FEATURE_ID,
    packageId: HOST_ENCRYPTED_SECRETS_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [SECRETS_RESOLVE_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
        capability: SECRETS_RESOLVE_CAPABILITY,
        providerContract: "evo.secrets.resolve",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.encrypted-secrets"
        },
        metadata: {
          storage: "HOST_ENCRYPTED",
          algorithm: "AES-256-GCM",
          plaintextReadback: false
        }
      }
    }]
  }]
};
