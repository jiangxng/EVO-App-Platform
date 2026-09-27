import type { PackageManifestV010 } from "../../contracts/package.js";

export const DEEPSEEK_LLM_PROVIDER_ID = "deepseek.responses";
export const DEEPSEEK_LLM_PACKAGE_ID = "deepseek-llm-provider";
export const DEEPSEEK_LLM_FEATURE_ID = "deepseek-llm-provider.default";

export const deepSeekLlmProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: DEEPSEEK_LLM_PACKAGE_ID,
  displayName: "DeepSeek LLM Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  secrets: [
    {
      key: "apiKey",
      label: "API Key",
      description: "DeepSeek API credential. Stored only in the Host Secrets Provider and never returned to the browser after save.",
      scope: "INSTALLATION",
      required: true
    }
  ],
  features: [
    {
      contractVersion: "0.1.0",
      featureId: DEEPSEEK_LLM_FEATURE_ID,
      packageId: DEEPSEEK_LLM_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: ["secrets.resolve"],
      providesCapabilities: [
        "llm.inference",
        "llm.tool-calling"
      ],
      contributions: [
        {
          kind: "eidos.settings",
          settings: {
            contractVersion: "0.1.0",
            namespace: DEEPSEEK_LLM_PACKAGE_ID,
            title: "DeepSeek LLM Provider",
            description: "Runtime settings for the DeepSeek Responses API provider. API credentials remain in the secure Host Secrets boundary.",
            properties: [
              {
                key: "model",
                label: "Model",
                description: "DeepSeek model id used for inference.",
                type: "string",
                defaultValue: "deepseek-flash",
                scope: "INSTALLATION"
              },
              {
                key: "baseUrl",
                label: "API Base URL",
                description: "DeepSeek OpenAI-compatible API base URL.",
                type: "string",
                defaultValue: "https://api.deepseek.com",
                scope: "INSTALLATION"
              }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: DEEPSEEK_LLM_PACKAGE_ID,
            locale: "en",
            messages: {
              "settings.title": "DeepSeek LLM Provider",
              "settings.description": "Runtime settings for the DeepSeek Responses API provider. API credentials remain in the secure Host Secrets boundary.",
              "settings.saveLabel": "Save",
              "settings.model.label": "Model",
              "settings.model.description": "DeepSeek model id used for inference. Current official choices include deepseek-flash and deepseek-v4-pro.",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "DeepSeek OpenAI-compatible API base URL.",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "Enter a new DeepSeek API Key to configure or replace the stored credential. Saved values are never displayed again.",
              "settings.secret-status:apiKey.label": "API Key status",
              "settings.secret-remove:apiKey.label": "Remove API Key",
              "settings.secret-remove:apiKey.description": "Remove the stored credential when saving.",
              "settings.adminToken.label": "Administrator authorization",
              "settings.adminToken.description": "Required only when changing Secret values during the bootstrap administration phase."
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: DEEPSEEK_LLM_PACKAGE_ID,
            locale: "zh-CN",
            messages: {
              "settings.title": "DeepSeek LLM Provider",
              "settings.description": "DeepSeek Responses API Provider 的运行设置。API Key 由安全的 Host Secrets 边界管理。",
              "settings.saveLabel": "保存",
              "settings.model.label": "模型",
              "settings.model.description": "推理时使用的 DeepSeek 模型 ID。当前官方模型包括 deepseek-flash 和 deepseek-v4-pro。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "DeepSeek 的 OpenAI 兼容 API 基础地址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "输入新的 DeepSeek API Key 以配置或替换已保存的凭据。保存后系统不会再次显示明文。",
              "settings.secret-status:apiKey.label": "API Key 状态",
              "settings.secret-remove:apiKey.label": "删除 API Key",
              "settings.secret-remove:apiKey.description": "保存时删除当前已存储的凭据。",
              "settings.adminToken.label": "管理员授权",
              "settings.adminToken.description": "在 bootstrap 管理阶段，修改 Secret 时需要提供管理员认证。"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: DEEPSEEK_LLM_PACKAGE_ID,
            locale: "ja",
            messages: {
              "settings.title": "DeepSeek LLM Provider",
              "settings.description": "DeepSeek Responses API Provider のランタイム設定です。API Key は安全な Host Secrets 境界で管理されます。",
              "settings.saveLabel": "保存",
              "settings.model.label": "モデル",
              "settings.model.description": "推論に使用する DeepSeek モデル ID。現在の公式モデルには deepseek-flash と deepseek-v4-pro があります。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "DeepSeek の OpenAI 互換 API ベース URL。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "保存済み認証情報を設定または置換する新しい DeepSeek API Key を入力します。保存後に値は再表示されません。",
              "settings.secret-status:apiKey.label": "API Key の状態",
              "settings.secret-remove:apiKey.label": "API Key を削除",
              "settings.secret-remove:apiKey.description": "保存時に現在の認証情報を削除します。",
              "settings.adminToken.label": "管理者認証",
              "settings.adminToken.description": "bootstrap 管理フェーズで Secret を変更する場合にのみ必要です。"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: DEEPSEEK_LLM_PACKAGE_ID,
            locale: "zh-TW",
            messages: {
              "settings.title": "DeepSeek LLM Provider",
              "settings.description": "DeepSeek Responses API Provider 的執行設定。API Key 由安全的 Host Secrets 邊界管理。",
              "settings.saveLabel": "儲存",
              "settings.model.label": "模型",
              "settings.model.description": "推論時使用的 DeepSeek 模型 ID。目前官方模型包括 deepseek-flash 與 deepseek-v4-pro。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "DeepSeek 的 OpenAI 相容 API 基礎網址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "輸入新的 DeepSeek API Key，以設定或取代已儲存的憑證。儲存後不會再次顯示明文。",
              "settings.secret-status:apiKey.label": "API Key 狀態",
              "settings.secret-remove:apiKey.label": "刪除 API Key",
              "settings.secret-remove:apiKey.description": "儲存時刪除目前已儲存的憑證。",
              "settings.adminToken.label": "管理員授權",
              "settings.adminToken.description": "僅在 bootstrap 管理階段修改 Secret 時需要。"
            }
          }
        },
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: DEEPSEEK_LLM_PROVIDER_ID,
            capability: "llm.inference",
            providerContract: "evo.llm.inference",
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://deepseek.responses"
            },
            metadata: {
              apiFamily: "DeepSeek Responses API",
              apiKeySecretName: "deepseek-llm-provider/apiKey",
              modelConfigName: "DEEPSEEK_MODEL",
              defaultModel: "deepseek-flash"
            }
          }
        },
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: DEEPSEEK_LLM_PROVIDER_ID,
            capability: "llm.tool-calling",
            providerContract: "evo.llm.inference",
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://deepseek.responses"
            }
          }
        }
      ]
    }
  ]
};
