import type { PackageManifestV010 } from "../../contracts/package.js";

export const HOST_MEMORY_INTAKE_PACKAGE_ID = "host-memory-intake-provider";
export const HOST_MEMORY_INTAKE_FEATURE_ID = "host-memory-intake-provider.default";
export const HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID = "host.memory-intake-source";
export const HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID = "host.memory-evidence-source";
export const CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY = "context.memory.intake-source";
export const CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY = "context.memory.evidence-source";

export const hostMemoryIntakeProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_MEMORY_INTAKE_PACKAGE_ID,
  displayName: "Host Memory Intake Provider",
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
    featureId: HOST_MEMORY_INTAKE_FEATURE_ID,
    packageId: HOST_MEMORY_INTAKE_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [
      CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY,
      CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY
    ],
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID,
          capability: CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY,
          providerContract: "evo.context-memory.intake-source",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.memory-intake-source"
          },
          metadata: {
            configurationBoundary: "APP_PLATFORM_MEMORY_INTAKE_JSON",
            purpose: "Reference governed Memory intake source adapter"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
          capability: CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY,
          providerContract: "evo.context-memory.evidence-source",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.memory-evidence-source"
          },
          metadata: {
            configurationBoundary: "APP_PLATFORM_MEMORY_INTAKE_JSON",
            purpose: "Host evidence source identity and trust metadata"
          }
        }
      }
    ]
  }]
};
