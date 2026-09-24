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
          kind: "eidos.settings",
          settings: {
            contractVersion: "0.1.0",
            namespace: OPENAI_LLM_PACKAGE_ID,
            title: "OpenAI LLM Provider",
            description: "Runtime settings for the OpenAI provider. API credentials remain in the secure secret boundary.",
            properties: [
              {
                key: "model",
                label: "Model",
                description: "Model id used for inference.",
                type: "string",
                defaultValue: "gpt-5.6-luna",
                scope: "INSTALLATION"
              },
              {
                key: "baseUrl",
                label: "API Base URL",
                description: "OpenAI-compatible Responses API base URL.",
                type: "string",
                defaultValue: "https://api.openai.com/v1",
                scope: "INSTALLATION"
              }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "en",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "Runtime settings for the OpenAI provider. API credentials remain in the secure secret boundary.",
              "settings.saveLabel": "Save",
              "settings.model.label": "Model",
              "settings.model.description": "Model id used for inference.",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI-compatible Responses API base URL."
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "zh-CN",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "OpenAI Provider 的运行设置。API Key 继续由安全 Secrets 边界管理。",
              "settings.saveLabel": "保存",
              "settings.model.label": "模型",
              "settings.model.description": "推理时使用的模型 ID。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 兼容 Responses API 的基础地址。"
            }
          }
        },
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
