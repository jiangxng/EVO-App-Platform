import type { PackageManifestV010 } from "../../contracts/package.js";

export const REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID =
  "remote-context-memory-semantic-provider";
export const REMOTE_CONTEXT_MEMORY_SEMANTIC_FEATURE_ID =
  "remote-context-memory-semantic-provider.default";
export const REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID =
  "remote.context-memory-semantic";
export const CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY =
  "context.memory.semantic-retrieval";

export const remoteContextMemorySemanticProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID,
  displayName: "Remote Context Memory Semantic Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  secrets: [{
    key: "apiToken",
    label: "API Token",
    description: "Optional bearer credential used only by the Host when calling the semantic retrieval endpoint.",
    scope: "INSTALLATION",
    required: false
  }],
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
    featureId: REMOTE_CONTEXT_MEMORY_SEMANTIC_FEATURE_ID,
    packageId: REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: ["secrets.resolve"],
    providesCapabilities: [CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY],
    contributions: [{
      kind: "platform.service-provider",
      provider: {
        contractVersion: "0.1.0",
        providerId: REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
        capability: CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY,
        providerContract: "evo.context-memory.semantic-retrieval",
        providerContractVersion: "0.1.0",
        binding: {
          type: "IN_PROCESS",
          ref: "runtime://remote.context-memory-semantic"
        },
        metadata: {
          transport: "HTTP_POST",
          configurationBoundary: "APP_PLATFORM_MEMORY_SEMANTIC_URL",
          purpose: "Replaceable semantic ranking for already-authorized Context Memory candidates"
        }
      }
    }]
  }]
};
