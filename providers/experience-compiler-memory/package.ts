import type { PackageManifestV010 } from "../../contracts/package.js";

export const EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID =
  "experience-compiler-memory-intake-provider";
export const EXPERIENCE_COMPILER_MEMORY_INTAKE_FEATURE_ID =
  "experience-compiler-memory-intake-provider.default";
export const EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID =
  "experience-compiler.memory-intake";
export const EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID =
  "experience-compiler.evidence-source";

export const experienceCompilerMemoryIntakeProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID,
  displayName: "Experience Compiler Memory Intake Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  secrets: [{
    key: "apiToken",
    label: "API Token",
    description: "Optional bearer credential used only by the Host when calling the Experience Compiler intake endpoint.",
    scope: "INSTALLATION",
    required: false
  }],
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: EXPERIENCE_COMPILER_MEMORY_INTAKE_FEATURE_ID,
    packageId: EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: ["secrets.resolve"],
    providesCapabilities: [
      "context.memory.intake-source",
      "context.memory.evidence-source"
    ],
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
          capability: "context.memory.intake-source",
          providerContract: "evo.context-memory.intake-source",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://experience-compiler.memory-intake"
          },
          metadata: {
            transport: "HTTP_POST",
            configurationBoundary: "APP_PLATFORM_EC_MEMORY_INTAKE_JSON",
            internalDependency: "NONE"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
          capability: "context.memory.evidence-source",
          providerContract: "evo.context-memory.evidence-source",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://experience-compiler.evidence-source"
          },
          metadata: {
            sourceType: "EXPERIENCE_COMPILER",
            truthAuthority: "NONE"
          }
        }
      }
    ]
  }]
};
