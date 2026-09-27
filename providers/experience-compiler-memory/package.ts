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
      },
      ...[
        {
          locale: "en",
          title: "Experience Compiler Memory Intake",
          description: "Secure credential for the Experience Compiler Memory intake endpoint.",
          tokenLabel: "API Token",
          tokenDescription: "Optional bearer credential. The value stays inside the Host Secrets boundary.",
          status: "API Token status",
          remove: "Remove API Token",
          removeDescription: "Remove the stored Experience Compiler credential when saving."
        },
        {
          locale: "zh-CN",
          title: "Experience Compiler 记忆接入",
          description: "Experience Compiler Memory 接入端点的安全凭据设置。",
          tokenLabel: "API Token",
          tokenDescription: "可选 Bearer 凭据。明文仅保存在 Host Secrets 安全边界内。",
          status: "API Token 状态",
          remove: "删除 API Token",
          removeDescription: "保存时删除已存储的 Experience Compiler 凭据。"
        },
        {
          locale: "ja",
          title: "Experience Compiler メモリー取り込み",
          description: "Experience Compiler Memory 取り込みエンドポイント用の安全な認証情報設定です。",
          tokenLabel: "API Token",
          tokenDescription: "任意の Bearer 認証情報。平文は Host Secrets 境界の外へ公開されません。",
          status: "API Token の状態",
          remove: "API Token を削除",
          removeDescription: "保存時に Experience Compiler の保存済み認証情報を削除します。"
        },
        {
          locale: "zh-TW",
          title: "Experience Compiler 記憶接入",
          description: "Experience Compiler Memory 接入端點的安全憑證設定。",
          tokenLabel: "API Token",
          tokenDescription: "可選 Bearer 憑證。明文只保留在 Host Secrets 安全邊界內。",
          status: "API Token 狀態",
          remove: "刪除 API Token",
          removeDescription: "儲存時刪除已保存的 Experience Compiler 憑證。"
        }
      ].map(copy => ({
        kind: "eidos.localization-bundle" as const,
        bundle: {
          contractVersion: "0.1.0" as const,
          namespace: EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID,
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
