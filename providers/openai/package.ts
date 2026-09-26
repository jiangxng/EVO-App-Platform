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
              "settings.notice.title": "Credential security",
              "settings.notice.message": "Saved Secret values are managed by Host Secrets and are never displayed again.",
              "settings.group.general.title": "General",
              "settings.group.general.description": "Provider runtime and ordinary settings.",
              "settings.group.credentials.title": "Credentials",
              "settings.group.credentials.description": "Credentials are stored by Host Secrets.",
              "settings.group.advanced.title": "Advanced",
              "settings.group.advanced.description": "Temporary bootstrap administration controls.",
              "settings.model.label": "Model",
              "settings.model.description": "Model id used for inference.",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI-compatible Responses API base URL.",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "Enter a new API Key to configure or replace the stored credential. Saved values are never displayed again.",
              "settings.secret:apiKey.status": "Credential status",
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
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "zh-CN",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "OpenAI Provider 的运行设置。API Key 继续由安全 Secrets 边界管理。",
              "settings.saveLabel": "保存",
              "settings.notice.title": "凭据安全",
              "settings.notice.message": "已保存的 Secret 由 Host Secrets 管理，系统不会再次显示明文。",
              "settings.group.general.title": "常规",
              "settings.group.general.description": "Provider 运行时与普通设置。",
              "settings.group.credentials.title": "凭据",
              "settings.group.credentials.description": "凭据由 Host Secrets 安全保存。",
              "settings.group.advanced.title": "高级",
              "settings.group.advanced.description": "临时 bootstrap 管理控制项。",
              "settings.model.label": "模型",
              "settings.model.description": "推理时使用的模型 ID。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 兼容 Responses API 的基础地址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "输入新的 API Key 以配置或替换已保存的凭据。保存后系统不会再次显示明文。",
              "settings.secret:apiKey.status": "凭据状态",
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
            namespace: OPENAI_LLM_PACKAGE_ID,
            locale: "ja",
            messages: {
              "settings.title": "OpenAI LLM Provider",
              "settings.description": "OpenAI Provider の実行設定です。API Key は安全な Secrets 境界で管理されます。",
              "settings.saveLabel": "保存",
              "settings.notice.title": "資格情報の保護",
              "settings.notice.message": "保存済みの Secret は Host Secrets が管理し、値は再表示されません。",
              "settings.group.general.title": "一般",
              "settings.group.general.description": "Provider の実行設定と通常設定です。",
              "settings.group.credentials.title": "資格情報",
              "settings.group.credentials.description": "資格情報は Host Secrets に安全に保存されます。",
              "settings.group.advanced.title": "詳細設定",
              "settings.group.advanced.description": "一時的な bootstrap 管理用コントロールです。",
              "settings.model.label": "モデル",
              "settings.model.description": "推論に使用するモデル ID。",
              "settings.baseUrl.label": "API ベース URL",
              "settings.baseUrl.description": "OpenAI 互換 Responses API のベース URL。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "新しい API Key を入力して保存済み資格情報を設定または置き換えます。保存後の値は再表示されません。",
              "settings.secret:apiKey.status": "資格情報の状態",
              "settings.secret-status:apiKey.label": "API Key の状態",
              "settings.secret-remove:apiKey.label": "API Key を削除",
              "settings.secret-remove:apiKey.description": "保存時に現在保存されている資格情報を削除します。",
              "settings.adminToken.label": "管理者認証",
              "settings.adminToken.description": "bootstrap 管理段階で Secret を変更する場合にのみ必要です。保存されません。"
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
              "settings.notice.title": "憑據安全",
              "settings.notice.message": "已儲存的 Secret 由 Host Secrets 管理，系統不會再次顯示明文。",
              "settings.group.general.title": "一般",
              "settings.group.general.description": "Provider 執行時與一般設定。",
              "settings.group.credentials.title": "憑據",
              "settings.group.credentials.description": "憑據由 Host Secrets 安全儲存。",
              "settings.group.advanced.title": "進階",
              "settings.group.advanced.description": "暫時的 bootstrap 管理控制項。",
              "settings.model.label": "模型",
              "settings.model.description": "推理時使用的模型 ID。",
              "settings.baseUrl.label": "API Base URL",
              "settings.baseUrl.description": "OpenAI 相容 Responses API 的基礎位址。",
              "settings.secret:apiKey.label": "API Key",
              "settings.secret:apiKey.description": "輸入新的 API Key 以配置或替換已儲存的憑據。儲存後系統不會再次顯示明文。",
              "settings.secret:apiKey.status": "憑據狀態",
              "settings.secret-status:apiKey.label": "API Key 狀態",
              "settings.secret-remove:apiKey.label": "刪除 API Key",
              "settings.secret-remove:apiKey.description": "儲存時刪除目前已儲存的憑據。",
              "settings.adminToken.label": "管理員授權",
              "settings.adminToken.description": "僅在 bootstrap 管理階段修改 Secret 時需要，不會被持久化。"
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
