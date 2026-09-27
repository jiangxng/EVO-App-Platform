import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_CONTEXT_MEMORY_PACKAGE_ID = "host-context-memory-provider";
export const HOST_CONTEXT_MEMORY_FEATURE_ID = "host-context-memory-provider.default";
export const HOST_CONTEXT_MEMORY_READER_PROVIDER_ID = "host.context-memory-reader";
export const HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID = "host.context-memory-writer";
export const HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID = "host.context-memory-governance";
export const CONTEXT_MEMORY_READ_CAPABILITY = "context.memory.read";
export const CONTEXT_MEMORY_WRITE_CAPABILITY = "context.memory.write";
export const CONTEXT_MEMORY_GOVERNANCE_CAPABILITY = "context.memory.governance";

export const hostContextMemoryProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
  displayName: "Host Context Memory Provider",
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
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [
      CONTEXT_MEMORY_READ_CAPABILITY,
      CONTEXT_MEMORY_WRITE_CAPABILITY,
      CONTEXT_MEMORY_GOVERNANCE_CAPABILITY
    ],
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
          capability: CONTEXT_MEMORY_READ_CAPABILITY,
          providerContract: "evo.context-memory.reader",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.context-memory-reader"
          },
          metadata: {
            purpose: "Host-owned Context Memory read boundary"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID,
          capability: CONTEXT_MEMORY_WRITE_CAPABILITY,
          providerContract: "evo.context-memory.writer",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.context-memory-writer"
          },
          metadata: {
            purpose: "Host-owned append-only Context Memory write boundary"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
          capability: CONTEXT_MEMORY_GOVERNANCE_CAPABILITY,
          providerContract: "evo.context-memory.governance",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.context-memory-governance"
          },
          metadata: {
            purpose: "Host-owned Context Memory retention and privacy governance"
          }
        }
      }
    ]
  }]
};
