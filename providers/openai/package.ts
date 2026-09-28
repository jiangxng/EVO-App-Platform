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
  secrets: [
    {
      key: "apiKey",
      label: "API Key",
      description: "OpenAI API credential. Stored only in the Host Secrets Provider and never returned to the browser after save.",
      scope: "INSTALLATION",
      required: true
    }
  ],
  features: [
    {
      contractVersion: "0.1.0",
      featureId: OPENAI_LLM_FEATURE_ID,
      packageId: OPENAI_LLM_PACKAGE_ID,
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
            namespace: OPENAI_LLM_PACKAGE_ID,
            title: "OpenAI LLM Provider",
            description: "Runtime settings for the OpenAI provider. API credentials remain in the secure secret boundary.",
            properties: [
              {
                key: "model",
                label: "Model",
                description: "Model id used for inference.",
                type: "select",
                defaultValue: "gpt-5.6-luna",
                options: [
                  { label: "GPT-5.6 Luna", value: "gpt-5.6-luna" }
                ],
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
              "settings.model.description": "Choose the model used for inference.",
              "settings.model.option.gpt-5.6-luna": "GPT-5.6 Luna",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI-compatible Responses API base URL.",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "Enter a new API Key to configure or replace the stored credential. Saved values are never displayed again.",
              "settings.secret-status:apiKey.label": "API Key status",
              "settings.secret-remove:apiKey.label": "Remove API Key",
              "settings.secret-remove:apiKey.description": "Remove the stored credential when saving.",
              "settings.adminToken.label": "Bootstrap administrator verification",
              "settings.adminToken.description": "Temporary verification used only when changing credentials before sign-in/session authorization is available."
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
              "settings.model.description": "选择推理时使用的模型。",
              "settings.model.option.gpt-5.6-luna": "GPT-5.6 Luna",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 兼容 Responses API 的基础地址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "输入新的 API Key 以配置或替换已保存的凭据。保存后系统不会再次显示明文。",
              "settings.secret-status:apiKey.label": "API Key 状态",
              "settings.secret-remove:apiKey.label": "删除 API Key",
              "settings.secret-remove:apiKey.description": "保存时删除当前已存储的凭据。",
              "settings.adminToken.label": "引导阶段管理员验证",
              "settings.adminToken.description": "仅在尚未接入正式登录/会话授权时，修改凭据需要此临时 bootstrap 验证。"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "ja",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "OpenAI Provider のランタイム設定です。API Key は安全な Secrets 境界で管理されます。",
              "settings.saveLabel": "保存",
              "settings.model.label": "モデル",
              "settings.model.description": "推論に使用するモデルを選択します。",
              "settings.model.option.gpt-5.6-luna": "GPT-5.6 Luna",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 互換 Responses API のベース URL。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "保存済み認証情報を設定または置換する新しい API Key を入力します。保存後に値は再表示されません。",
              "settings.secret-status:apiKey.label": "API Key の状態",
              "settings.secret-remove:apiKey.label": "API Key を削除",
              "settings.secret-remove:apiKey.description": "保存時に現在の認証情報を削除します。",
              "settings.adminToken.label": "ブートストラップ管理者確認",
              "settings.adminToken.description": "正式なサインイン／セッション認可が利用可能になる前に、認証情報を変更する場合だけ使う一時的な確認です。"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "zh-TW",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "OpenAI Provider 的執行設定。API Key 仍由安全的 Secrets 邊界管理。",
              "settings.saveLabel": "儲存",
              "settings.model.label": "模型",
              "settings.model.description": "選擇推論時使用的模型。",
              "settings.model.option.gpt-5.6-luna": "GPT-5.6 Luna",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 相容 Responses API 的基礎網址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "輸入新的 API Key，以設定或取代已儲存的憑證。儲存後不會再次顯示明文。",
              "settings.secret-status:apiKey.label": "API Key 狀態",
              "settings.secret-remove:apiKey.label": "刪除 API Key",
              "settings.secret-remove:apiKey.description": "儲存時刪除目前已儲存的憑證。",
              "settings.adminToken.label": "引導階段管理員驗證",
              "settings.adminToken.description": "僅在尚未接入正式登入／工作階段授權時，修改憑證需要此臨時 bootstrap 驗證。"
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
              apiKeySecretName: "openai-llm-provider/apiKey",
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
