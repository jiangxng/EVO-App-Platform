import type { PackageManifestV010 } from "../../contracts/package.js";
import { REQUEST_IDENTITY_SESSION_CAPABILITY } from "../request-session/package.js";

export const HOST_MANAGED_SESSION_PACKAGE_ID = "host-managed-session-provider";
export const HOST_MANAGED_SESSION_FEATURE_ID = "host-managed-session-provider.default";
export const HOST_MANAGED_SESSION_PROVIDER_ID = "host.managed-session";

export const hostManagedSessionProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_MANAGED_SESSION_PACKAGE_ID,
  displayName: "Host Managed Session Provider",
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
    featureId: HOST_MANAGED_SESSION_FEATURE_ID,
    packageId: HOST_MANAGED_SESSION_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [REQUEST_IDENTITY_SESSION_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: HOST_MANAGED_SESSION_PROVIDER_ID,
        capability: REQUEST_IDENTITY_SESSION_CAPABILITY,
        providerContract: "evo.identity.request-session",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://host.managed-session"
        },
        metadata: {
          purpose: "Host-owned durable, revocable request-bound Session resolution",
          credentialStorage: "SHA256_TOKEN_HASH_ONLY",
          lifecycle: "ISSUE_REVOKE_ROTATE"
        }
      }
    }]
  }]
};
