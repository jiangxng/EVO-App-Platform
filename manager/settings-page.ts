import type { AppManagerService } from "./service.js";
import type { SettingsStore } from "./settings-store.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  SettingsEditorV020,
  SettingsFieldV010
} from "../vendor/eidos/src/settings/contracts.js";
import type {
  EidosSettingsContributionV010,
  PackageManifestV010,
  PackageSecretDeclarationV010,
  SettingValueV010
} from "../contracts/package.js";
import type {
  SecretDescriptorV010,
  SecretReferenceV010
} from "../contracts/platform-services.js";

export const settingsIndexPageSource = "app://evo-app-platform/pages/settings";

export interface SettingsSecretScopeContextV010 {
  installationId: string;
  enterpriseId?: string;
  companyId?: string;
  workspaceId?: string;
  userId?: string;
}

export type DescribeSecretV010 = (
  reference: SecretReferenceV010
) => SecretDescriptorV010 | undefined | Promise<SecretDescriptorV010 | undefined>;

type SettingsUiLocaleV010 = "en" | "zh-CN" | "ja" | "zh-TW";

function settingsUiLocale(locale: string): SettingsUiLocaleV010 {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical === "ja" || canonical.startsWith("ja-")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

function settingsText(
  locale: SettingsUiLocaleV010,
  values: Record<SettingsUiLocaleV010, string>
): string {
  return values[locale] ?? values.en;
}

export function settingsPackagePageSource(packageId: string): string {
  return `app://evo-app-platform/pages/settings/${encodeURIComponent(packageId)}`;
}

export function settingsPackageRoute(packageId: string): string {
  return `/settings/${encodeURIComponent(packageId)}`;
}

export function packageIdFromSettingsPageSource(source: string): string | undefined {
  const prefix = "app://evo-app-platform/pages/settings/";
  if (!source.startsWith(prefix)) return undefined;
  const encoded = source.slice(prefix.length);
  if (!encoded) return undefined;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

export function packageHasSettings(pkg: PackageManifestV010): boolean {
  return pkg.features.some(feature =>
    (feature.contributions ?? []).some(contribution => contribution.kind === "eidos.settings")
  );
}

export function packageHasConfiguration(pkg: PackageManifestV010): boolean {
  return packageHasSettings(pkg) || (pkg.secrets?.length ?? 0) > 0;
}

function installedConfigurablePackages(manager: AppManagerService): PackageManifestV010[] {
  const installed = new Set(
    manager.getSnapshot().installedPackages.map(item => item.packageId)
  );
  return manager.listCatalog()
    .filter(pkg => installed.has(pkg.packageId) && packageHasConfiguration(pkg))
    .sort((a, b) => a.packageId.localeCompare(b.packageId));
}

export function createSettingsExperienceManifest(manager: AppManagerService) {
  const packages = installedConfigurablePackages(manager);

  return {
    contractVersion: "0.1.0",
    experienceId: "evo-settings",
    packageId: "evo-app-platform",
    featureId: "evo-settings.system",
    defaultRoute: "/settings",
    pages: [
      {
        id: "evo-settings.home",
        title: "Settings",
        source: settingsIndexPageSource
      },
      ...packages.map(pkg => ({
        id: `evo-settings.${pkg.packageId}`,
        title: pkg.displayName,
        source: settingsPackagePageSource(pkg.packageId)
      }))
    ],
    routes: [
      {
        id: "evo-settings.home",
        path: "/settings",
        pageId: "evo-settings.home"
      },
      ...packages.map(pkg => ({
        id: `evo-settings.${pkg.packageId}`,
        path: settingsPackageRoute(pkg.packageId),
        pageId: `evo-settings.${pkg.packageId}`
      }))
    ]
  } as const;
}

export function createSettingsIndexPage(
  manager: AppManagerService
): CatalogBrowserV010 {
  const packages = installedConfigurablePackages(manager);

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.settings",
    title: "Settings",
    description: "Configure installed plugins and Provider credentials through Host-owned settings and Secret boundaries.",
    emptyMessage: "No installed plugins expose configurable settings or credentials.",
    items: [
      {
        id: "provider-bindings",
        title: "Provider Bindings",
        category: "PLATFORM",
        summary: "Manage deterministic Provider selection by capability and scope.",
        primaryAction: {
          id: "configure",
          label: "Configure",
          type: "navigate",
          route: "/providers"
        }
      },
      ...packages.map(pkg => ({
        id: pkg.packageId,
        title: pkg.displayName,
        version: pkg.version,
        category: pkg.type,
        summary: (pkg.secrets?.length ?? 0) > 0
          ? "Plugin settings and Host-managed credentials"
          : "Standard plugin settings",
        primaryAction: {
          id: "configure",
          label: "Configure",
          type: "navigate" as const,
          route: settingsPackageRoute(pkg.packageId)
        }
      }))
    ]
  };
}

function mergeSettingsContributions(
  contributions: Array<EidosSettingsContributionV010["settings"] & { packageId: string; featureId: string }>
): EidosSettingsContributionV010["settings"] | undefined {
  if (contributions.length === 0) return undefined;
  const first = contributions[0]!;
  const seen = new Set<string>();
  const properties = contributions.flatMap(item => item.properties).filter(property => {
    if (seen.has(property.key)) {
      throw new Error(`DUPLICATE_SETTING_KEY: ${first.namespace}.${property.key}`);
    }
    if (
      property.key.startsWith("secret:")
      || property.key.startsWith("secret-status:")
      || property.key.startsWith("secret-remove:")
      || property.key === "adminToken"
    ) {
      throw new Error(`SETTING_KEY_RESERVED: ${first.namespace}.${property.key}`);
    }
    seen.add(property.key);
    return true;
  });
  return {
    contractVersion: "0.1.0",
    namespace: first.namespace,
    title: first.title,
    description: first.description,
    properties,
    advancedRoute: first.advancedRoute
  };
}

export function secretReferenceForPackageV010(
  packageId: string,
  declaration: PackageSecretDeclarationV010,
  context: SettingsSecretScopeContextV010
): SecretReferenceV010 | undefined {
  let scopeId: string | undefined;
  if (declaration.scope === "INSTALLATION") scopeId = context.installationId;
  else if (declaration.scope === "ENTERPRISE") scopeId = context.enterpriseId;
  else if (declaration.scope === "COMPANY") scopeId = context.companyId;
  else if (declaration.scope === "WORKSPACE") scopeId = context.workspaceId;
  else if (declaration.scope === "USER") scopeId = context.userId;

  if (declaration.scope !== "SYSTEM" && !scopeId) return undefined;

  return {
    contractVersion: "0.1.0",
    namespace: packageId,
    key: declaration.key,
    scope: declaration.scope,
    ...(scopeId ? { scopeId } : {})
  };
}

export async function createSettingsPage(
  manager: AppManagerService,
  store: SettingsStore,
  packageId: string,
  describeSecret?: DescribeSecretV010,
  secretContext: SettingsSecretScopeContextV010 = { installationId: "default" },
  locale = "en"
): Promise<SettingsEditorV020 | undefined> {
  const pkg = manager.listCatalog().find(item => item.packageId === packageId);
  const installed = manager.getSnapshot().installedPackages.some(item => item.packageId === packageId);
  if (!pkg || !installed || !packageHasConfiguration(pkg)) return undefined;

  const uiLocale = settingsUiLocale(locale);
  const merged = mergeSettingsContributions(manager.listInstalledSettings(packageId));
  const namespace = merged?.namespace ?? packageId;
  const current = store.getNamespace(namespace);
  const ordinarySettings: SettingsFieldV010[] = (merged?.properties ?? []).map(property => ({
    key: property.key,
    label: property.label,
    description: property.description,
    type: property.type,
    value: current[property.key] ?? property.defaultValue,
    defaultValue: property.defaultValue,
    options: property.options,
    readOnly: property.readOnly
  }));

  const secretSettings = (
    await Promise.all((pkg.secrets ?? []).map(async declaration => {
      const reference = secretReferenceForPackageV010(pkg.packageId, declaration, secretContext);
      const status = reference && describeSecret ? await describeSecret(reference) : undefined;
      const configured = status?.configured === true;
      const unavailable = !reference;
      const statusValue = unavailable
        ? settingsText(uiLocale, {
            en: "Scope context unavailable",
            "zh-CN": "当前作用域上下文不可用",
            ja: "現在のスコープコンテキストは利用できません",
            "zh-TW": "目前的作用域上下文無法使用"
          })
        : configured
          ? settingsText(uiLocale, {
              en: `Configured${status?.updatedAt ? ` · updated ${status.updatedAt}` : ""} · saved value is never displayed`,
              "zh-CN": `已配置${status?.updatedAt ? ` · 更新于 ${status.updatedAt}` : ""} · 不显示已保存明文`,
              ja: `設定済み${status?.updatedAt ? ` · 更新 ${status.updatedAt}` : ""} · 保存済みの値は表示されません`,
              "zh-TW": `已配置${status?.updatedAt ? ` · 更新於 ${status.updatedAt}` : ""} · 不顯示已儲存明文`
            })
          : settingsText(uiLocale, {
              en: "Not configured",
              "zh-CN": "未配置",
              ja: "未設定",
              "zh-TW": "未配置"
            });

      const secretInput: SettingsFieldV010 = {
        key: `secret:${declaration.key}`,
        label: configured
          ? settingsText(uiLocale, {
              en: `Replace ${declaration.label}`,
              "zh-CN": `替换 ${declaration.label}`,
              ja: `${declaration.label} を置き換える`,
              "zh-TW": `替換 ${declaration.label}`
            })
          : declaration.label,
        description: unavailable
          ? settingsText(uiLocale, {
              en: `Secret scope '${declaration.scope}' is not available in the current platform context.`,
              "zh-CN": `当前平台上下文中无法使用 Secret 作用域 '${declaration.scope}'。`,
              ja: `現在のプラットフォームコンテキストでは Secret スコープ '${declaration.scope}' を利用できません。`,
              "zh-TW": `目前平台上下文中無法使用 Secret 作用域 '${declaration.scope}'。`
            })
          : declaration.description,
        type: "secret",
        value: "",
        readOnly: unavailable,
        status: {
          label: unavailable
            ? settingsText(uiLocale, {
                en: "Unavailable",
                "zh-CN": "不可用",
                ja: "利用不可",
                "zh-TW": "無法使用"
              })
            : configured
              ? settingsText(uiLocale, {
                  en: "Configured",
                  "zh-CN": "已配置",
                  ja: "設定済み",
                  "zh-TW": "已配置"
                })
              : settingsText(uiLocale, {
                  en: "Not configured",
                  "zh-CN": "未配置",
                  ja: "未設定",
                  "zh-TW": "未配置"
                }),
          tone: unavailable ? "danger" : configured ? "positive" : "warning"
        }
      };

      return [
        secretInput,
        {
          key: `secret-status:${declaration.key}`,
          label: settingsText(uiLocale, {
            en: `${declaration.label} status`,
            "zh-CN": `${declaration.label} 状态`,
            ja: `${declaration.label} の状態`,
            "zh-TW": `${declaration.label} 狀態`
          }),
          type: "string" as const,
          value: statusValue,
          readOnly: true
        },
        ...(configured && !unavailable
          ? [{
              key: `secret-remove:${declaration.key}`,
              label: settingsText(uiLocale, {
                en: `Remove ${declaration.label}`,
                "zh-CN": `删除 ${declaration.label}`,
                ja: `${declaration.label} を削除`,
                "zh-TW": `刪除 ${declaration.label}`
              }),
              description: settingsText(uiLocale, {
                en: "Remove the stored Secret when saving.",
                "zh-CN": "保存时删除当前已存储的 Secret。",
                ja: "保存時に現在保存されている Secret を削除します。",
                "zh-TW": "儲存時刪除目前已儲存的 Secret。"
              }),
              type: "boolean" as const,
              value: false,
              defaultValue: false
            }]
          : [])
      ] satisfies SettingsFieldV010[];
    }))
  ).flat();

  const hasSecrets = (pkg.secrets?.length ?? 0) > 0;
  const groups: SettingsEditorV020["groups"] = [];

  if (ordinarySettings.length > 0) {
    groups.push({
      id: "general",
      title: "General",
      description: "Provider runtime and ordinary package settings.",
      settings: ordinarySettings
    });
  }

  if (secretSettings.length > 0) {
    groups.push({
      id: "credentials",
      title: "Credentials",
      description: "Credentials are stored by Host Secrets and saved values are never returned to the browser.",
      settings: secretSettings
    });
  }

  if (hasSecrets) {
    groups.push({
      id: "advanced",
      title: "Advanced",
      description: "Temporary bootstrap administration controls.",
      advanced: true,
      settings: [{
        key: "adminToken",
        label: settingsText(uiLocale, {
          en: "Administrator authorization",
          "zh-CN": "管理员授权",
          ja: "管理者認証",
          "zh-TW": "管理員授權"
        }),
        description: settingsText(uiLocale, {
          en: "Bootstrap-phase administrator authentication used only when changing Secrets. It is never persisted.",
          "zh-CN": "仅在修改 Secret 时用于 bootstrap 阶段管理员认证，不会被持久化。",
          ja: "Secret を変更する場合のみ使用する bootstrap 段階の管理者認証です。保存されません。",
          "zh-TW": "僅在修改 Secret 時用於 bootstrap 階段的管理員認證，不會被持久化。"
        }),
        type: "secret",
        value: ""
      }]
    });
  }

  return {
    contractVersion: "0.2.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace,
    title: merged?.title ?? pkg.displayName,
    description: merged?.description ?? settingsText(uiLocale, {
      en: "Configure Host-managed credentials for this Package.",
      "zh-CN": "配置此 Package 的 Host 管理凭据。",
      ja: "この Package の Host 管理資格情報を設定します。",
      "zh-TW": "配置此 Package 的 Host 管理憑據。"
    }),
    ...(hasSecrets ? {
      notice: {
        tone: "info" as const,
        title: "Credential security",
        message: "Saved Secret values are managed by Host Secrets and are never displayed again."
      }
    } : {}),
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    groups,
    saveLabel: settingsText(uiLocale, {
      en: "Save",
      "zh-CN": "保存",
      ja: "保存",
      "zh-TW": "儲存"
    }),
    emptyMessage: settingsText(uiLocale, {
      en: "This plugin has no editable configuration.",
      "zh-CN": "此插件没有可编辑配置。",
      ja: "このプラグインには編集可能な設定がありません。",
      "zh-TW": "此插件沒有可編輯配置。"
    })
  };
}

export function validateAndMergeSettings(
  manager: AppManagerService,
  store: SettingsStore,
  namespace: string,
  input: Record<string, unknown>
): Record<string, SettingValueV010> {
  const merged = mergeSettingsContributions(manager.listInstalledSettings(namespace));
  if (!merged) {
    const pkg = manager.listCatalog().find(item => item.packageId === namespace);
    const installed = manager.getSnapshot().installedPackages.some(item => item.packageId === namespace);
    if (pkg && installed && (pkg.secrets?.length ?? 0) > 0) {
      return store.getNamespace(namespace);
    }
    throw new Error(`SETTINGS_NAMESPACE_NOT_INSTALLED: ${namespace}`);
  }
  if (merged.namespace !== namespace) {
    throw new Error(`SETTINGS_NAMESPACE_NOT_INSTALLED: ${namespace}`);
  }

  const current = store.getNamespace(namespace);
  const next: Record<string, SettingValueV010> = { ...current };

  for (const property of merged.properties) {
    if (!Object.prototype.hasOwnProperty.call(input, property.key)) continue;
    if (property.readOnly) continue;
    const value = input[property.key];

    if (property.type === "string") {
      if (typeof value !== "string") throw new Error(`SETTING_TYPE_INVALID: ${namespace}.${property.key}`);
      next[property.key] = value;
    } else if (property.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`SETTING_TYPE_INVALID: ${namespace}.${property.key}`);
      }
      next[property.key] = value;
    } else if (property.type === "boolean") {
      if (typeof value !== "boolean") throw new Error(`SETTING_TYPE_INVALID: ${namespace}.${property.key}`);
      next[property.key] = value;
    } else {
      const allowed = property.options ?? [];
      const valid = allowed.some(option => option.value === value);
      if (!valid || (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")) {
        throw new Error(`SETTING_VALUE_INVALID: ${namespace}.${property.key}`);
      }
      next[property.key] = value;
    }
  }

  store.setNamespace(namespace, next);
  return store.getNamespace(namespace);
}
