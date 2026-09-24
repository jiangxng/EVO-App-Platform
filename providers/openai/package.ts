import type { PackageManifestV010 } from "../../contracts/package.js";

export const OPENAI_LLM_PROVIDER_ID = "openai.responses";
export const OPENAI_LLM_PACKAGE_ID = "openai-llm-provider";
export const OPENAI_LLM_FEATURE_ID = "openai-llm-provider.default";

export const openAiLlmProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: OPENAI_LLM_PACKAGE_ID,
  displayName: "OpenAI LLM Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: OPENAI_LLM_FEATURE_ID,
      packageId: OPENAI_LLM_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        "llm.inference",
        "llm.tool-calling"
      ],
      contributions: [
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: OPENAI_LLM_PROVIDER_ID,
            capability: "llm.inference",
            providerContract: "evo.llm.inference",
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://openai.responses"
            },
            metadata: {
              apiFamily: "OpenAI Responses API",
              apiKeySecretName: "OPENAI_API_KEY",
              modelConfigName: "OPENAI_MODEL",
              defaultModel: "gpt-5.6-luna"
            }
          }
        },
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: OPENAI_LLM_PROVIDER_ID,
            capability: "llm.tool-calling",
            providerContract: "evo.llm.inference",
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://openai.responses"
            }
          }
        }
      ]
    }
  ]
};
