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
    contributions: [
      {
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
      },
      ...[
        {
          locale: "en",
          title: "Semantic Retrieval Provider",
          description: "Secure credential for the external semantic ranking service.",
          tokenLabel: "API Token",
          tokenDescription: "Optional bearer credential. The value stays inside the Host Secrets boundary.",
          status: "API Token status",
          remove: "Remove API Token",
          removeDescription: "Remove the stored semantic retrieval credential when saving."
        },
        {
          locale: "zh-CN",
          title: "语义检索 Provider",
          description: "外部语义排序服务的安全凭据设置。",
          tokenLabel: "API Token",
          tokenDescription: "可选 Bearer 凭据。明文仅保存在 Host Secrets 安全边界内。",
          status: "API Token 状态",
          remove: "删除 API Token",
          removeDescription: "保存时删除已存储的语义检索凭据。"
        },
        {
          locale: "ja",
          title: "セマンティック検索 Provider",
          description: "外部セマンティックランキングサービス用の安全な認証情報設定です。",
          tokenLabel: "API Token",
          tokenDescription: "任意の Bearer 認証情報。平文は Host Secrets 境界の外へ公開されません。",
          status: "API Token の状態",
          remove: "API Token を削除",
          removeDescription: "保存時にセマンティック検索用の保存済み認証情報を削除します。"
        },
        {
          locale: "zh-TW",
          title: "語意檢索 Provider",
          description: "外部語意排序服務的安全憑證設定。",
          tokenLabel: "API Token",
          tokenDescription: "可選 Bearer 憑證。明文只保留在 Host Secrets 安全邊界內。",
          status: "API Token 狀態",
          remove: "刪除 API Token",
          removeDescription: "儲存時刪除已保存的語意檢索憑證。"
        }
      ].map(copy => ({
        kind: "eidos.localization-bundle" as const,
        bundle: {
          contractVersion: "0.1.0" as const,
          namespace: REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID,
          locale: copy.locale,
          messages: {
            "settings.title": copy.title,
            "settings.description": copy.description,
            "settings.secret:apiToken.label": copy.tokenLabel,
            "settings.secret:apiToken.description": copy.tokenDescription,
            "settings.secret-status:apiToken.label": copy.status,
            "settings.secret-remove:apiToken.label": copy.remove,
            "settings.secret-remove:apiToken.description": copy.removeDescription
          }
        }
      }))
    ]
  }]
};
