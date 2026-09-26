import type { AppManagerService } from "./service.js";
import type { SettingsStore } from "./settings-store.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { SettingsEditorV020 } from "../vendor/eidos/src/settings/contracts.js";
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

type SettingsUiLocale = "en" | "zh-CN" | "ja" | "zh-TW";

function settingsUiLocale(locale: string): SettingsUiLocale {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical === "zh-HK" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical === "ja" || canonical.startsWith("ja-")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

const uiText: Record<SettingsUiLocale, {
  configureCredentials: string;
  configured: string;
  notConfigured: string;
  scopeUnavailable: string;
  updated: string;
  hidden: string;
  replace: (label: string) => string;
  status: (label: string) => string;
  remove: (label: string) => string;
  removeDescription: string;
  general: string;
  generalDescription: string;
  credentials: string;
  credentialsDescription: string;
  advanced: string;
  advancedDescription: string;
  admin: string;
  adminDescription: string;
  save: string;
  empty: string;
}> = {
  en: {
    configureCredentials: "Configure Host-managed credentials for this Package.",
    configured: "Configured",
    notConfigured: "Not configured",
    scopeUnavailable: "Scope context unavailable",
    updated: "updated",
    hidden: "value is never displayed",
    replace: label => `Replace ${label}`,
    status: label => `${label} status`,
    remove: label => `Remove ${label}`,
    removeDescription: "Remove the stored Secret when saving.",
    general: "General",
    generalDescription: "Provider and plugin runtime settings.",
    credentials: "Credentials",
    credentialsDescription: "Host-managed Secrets. Saved plaintext is never displayed.",
    advanced: "Advanced",
    advancedDescription: "Temporary/bootstrap administration controls.",
    admin: "Administrator authorization",
    adminDescription: "Bootstrap-phase administrator authentication used only when changing Secrets. It is never persisted.",
    save: "Save",
    empty: "This plugin has no editable configuration."
  },
  "zh-CN": {
    configureCredentials: "配置此 Package 的 Host 管理凭据。",
    configured: "已配置",
    notConfigured: "未配置",
    scopeUnavailable: "当前作用域上下文不可用",
    updated: "更新于",
    hidden: "不显示已保存明文",
    replace: label => `替换 ${label}`,
    status: label => `${label} 状态`,
    remove: label => `删除 ${label}`,
    removeDescription: "保存时删除当前已存储的 Secret。",
    general: "常规",
    generalDescription: "Provider 与插件运行设置。",
    credentials: "凭据",
    credentialsDescription: "由 Host 管理的 Secret；保存后的明文不会再次显示。",
    advanced: "高级",
    advancedDescription: "临时/bootstrap 管理控制。",
    admin: "管理员授权",
    adminDescription: "仅在修改 Secret 时用于 bootstrap 阶段管理员认证，不会被持久化。",
    save: "保存",
    empty: "此插件没有可编辑配置。"
  },
  ja: {
    configureCredentials: "この Package の Host 管理認証情報を設定します。",
    configured: "設定済み",
    notConfigured: "未設定",
    scopeUnavailable: "現在のスコープコンテキストを利用できません",
    updated: "更新",
    hidden: "保存済みの値は表示されません",
    replace: label => `${label} を置き換える`,
    status: label => `${label} の状態`,
    remove: label => `${label} を削除`,
    removeDescription: "保存時に現在の Secret を削除します。",
    general: "一般",
    generalDescription: "Provider とプラグインの実行設定。",
    credentials: "認証情報",
    credentialsDescription: "Host 管理の Secret。保存済みの平文は再表示されません。",
    advanced: "詳細設定",
    advancedDescription: "一時的な bootstrap 管理コントロール。",
    admin: "管理者認証",
    adminDescription: "Secret 変更時の bootstrap 管理者認証にのみ使用され、保存されません。",
    save: "保存",
    empty: "編集可能な設定はありません。"
  },
  "zh-TW": {
    configureCredentials: "設定此 Package 的 Host 管理憑證。",
    configured: "已設定",
    notConfigured: "未設定",
    scopeUnavailable: "目前的作用域上下文無法使用",
    updated: "更新於",
    hidden: "不顯示已儲存明文",
    replace: label => `取代 ${label}`,
    status: label => `${label} 狀態`,
    remove: label => `移除 ${label}`,
    removeDescription: "儲存時移除目前已保存的 Secret。",
    general: "一般",
    generalDescription: "Provider 與插件執行設定。",
    credentials: "憑證",
    credentialsDescription: "由 Host 管理的 Secret；已儲存的明文不會再次顯示。",
    advanced: "進階",
    advancedDescription: "暫時/bootstrap 管理控制。",
    admin: "管理員授權",
    adminDescription: "僅在修改 Secret 時用於 bootstrap 階段管理員驗證，不會被保存。",
    save: "儲存",
    empty: "此插件沒有可編輯設定。"
  }
};

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
  const text = uiText[uiLocale];
  const merged = mergeSettingsContributions(manager.listInstalledSettings(packageId));
  const namespace = merged?.namespace ?? packageId;
  const current = store.getNamespace(namespace);
  const ordinarySettings = (merged?.properties ?? []).map(property => ({
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
        ? text.scopeUnavailable
        : configured
          ? `${text.configured}${status?.updatedAt ? ` · ${text.updated} ${status.updatedAt}` : ""} · ${text.hidden}`
          : text.notConfigured;

      return [
        {
          key: `secret:${declaration.key}`,
          label: configured ? text.replace(declaration.label) : declaration.label,
          description: unavailable
            ? `Secret scope '${declaration.scope}' is not available in the current platform context.`
            : declaration.description,
          type: "secret" as const,
          value: "",
          readOnly: unavailable
        },
        {
          key: `secret-status:${declaration.key}`,
          label: text.status(declaration.label),
          type: "string" as const,
          value: statusValue,
          readOnly: true
        },
        ...(configured && !unavailable
          ? [{
              key: `secret-remove:${declaration.key}`,
              label: text.remove(declaration.label),
              description: text.removeDescription,
              type: "boolean" as const,
              value: false,
              defaultValue: false
            }]
          : [])
      ];
    }))
  ).flat();

  const hasSecrets = (pkg.secrets?.length ?? 0) > 0;

  return {
    contractVersion: "0.2.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace,
    title: merged?.title ?? pkg.displayName,
    description: merged?.description ?? text.configureCredentials,
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    groups: [
      ...(ordinarySettings.length > 0
        ? [{
            id: "general",
            title: text.general,
            description: text.generalDescription,
            settings: ordinarySettings
          }]
        : []),
      ...(secretSettings.length > 0
        ? [{
            id: "credentials",
            title: text.credentials,
            description: text.credentialsDescription,
            settings: secretSettings
          }]
        : []),
      ...(hasSecrets
        ? [{
            id: "advanced",
            title: text.advanced,
            description: text.advancedDescription,
            advanced: true,
            settings: [{
              key: "adminToken",
              label: text.admin,
              description: text.adminDescription,
              type: "secret" as const,
              value: ""
            }]
          }]
        : [])
    ],
    saveLabel: text.save,
    emptyMessage: text.empty
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
