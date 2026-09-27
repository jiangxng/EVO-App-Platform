import type { PackageManifestV010 } from "../../contracts/package.js";

export const REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID =
  "remote-context-memory-dlp-provider";
export const REMOTE_CONTEXT_MEMORY_DLP_FEATURE_ID =
  "remote-context-memory-dlp-provider.default";
export const REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID =
  "remote.context-memory-dlp";
export const CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY =
  "context.memory.dlp-classification";

export const remoteContextMemoryDlpProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID,
  displayName: "Remote Context Memory DLP Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  secrets: [{
    key: "apiToken",
    label: "API Token",
    description: "Optional bearer credential used only by the Host when calling the DLP classification endpoint.",
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
    featureId: REMOTE_CONTEXT_MEMORY_DLP_FEATURE_ID,
    packageId: REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: ["secrets.resolve"],
    providesCapabilities: [CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY],
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
          capability: CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY,
          providerContract: "evo.context-memory.dlp-classifier",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://remote.context-memory-dlp"
          },
          metadata: {
            transport: "HTTP_POST",
            configurationBoundary: "APP_PLATFORM_MEMORY_DLP_URL",
            purpose: "Replaceable sensitive-data classification for Host-scoped Context Memory"
          }
        }
      },
      ...[
        {
          locale: "en",
          title: "Memory DLP Provider",
          description: "Secure credential for the external sensitive-data classification service.",
          tokenLabel: "API Token",
          tokenDescription: "Optional bearer credential. The value stays inside the Host Secrets boundary."
        },
        {
          locale: "zh-CN",
          title: "Memory DLP Provider",
          description: "外部敏感数据分类服务的安全凭据设置。",
          tokenLabel: "API Token",
          tokenDescription: "可选 Bearer 凭据。明文仅保存在 Host Secrets 安全边界内。"
        },
        {
          locale: "ja",
          title: "Memory DLP Provider",
          description: "外部の機密データ分類サービス用の安全な認証情報設定です。",
          tokenLabel: "API Token",
          tokenDescription: "任意の Bearer 認証情報。平文は Host Secrets 境界の外へ公開されません。"
        },
        {
          locale: "zh-TW",
          title: "Memory DLP Provider",
          description: "外部敏感資料分類服務的安全憑證設定。",
          tokenLabel: "API Token",
          tokenDescription: "可選 Bearer 憑證。明文只保留在 Host Secrets 安全邊界內。"
        }
      ].map(copy => ({
        kind: "eidos.localization-bundle" as const,
        bundle: {
          contractVersion: "0.1.0" as const,
          namespace: REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID,
          locale: copy.locale,
          messages: {
            "settings.title": copy.title,
            "settings.description": copy.description,
            "settings.secret:apiToken.label": copy.tokenLabel,
            "settings.secret:apiToken.description": copy.tokenDescription
          }
        }
      }))
    ]
  }]
};
