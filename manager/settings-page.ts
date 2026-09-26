import type { AppManagerService } from "./service.js";
import type { SettingsStore } from "./settings-store.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  SettingsEditorV010,
  SettingsEditorV020
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

type SettingsUiLocale = "en" | "zh-CN" | "ja" | "zh-TW";

function settingsUiLocale(locale: string): SettingsUiLocale {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical === "zh-HK" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical.startsWith("ja")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

const settingsCopy = {
  en: {
    configured: "Configured",
    notConfigured: "Not configured",
    scopeUnavailable: "Scope context unavailable",
    valueHidden: "value is never displayed",
    updated: "updated",
    replace: "Replace",
    status: "status",
    remove: "Remove",
    removeDescription: "Remove the stored Secret when saving.",
    description: "Configure settings and Host-managed credentials for this Package.",
    save: "Save",
    empty: "This plugin has no editable configuration.",
    general: "General",
    credentials: "Credentials",
    credentialsDescription: "Credentials are stored by Host Secrets and are never read back after save.",
    advanced: "Advanced",
    advancedDescription: "Temporary or administrative controls.",
    admin: "Administrator authorization",
    adminDescription: "Bootstrap-phase administrator authentication used only when changing Secrets. It is never persisted."
  },
  "zh-CN": {
    configured: "已配置",
    notConfigured: "未配置",
    scopeUnavailable: "当前作用域上下文不可用",
    valueHidden: "不显示已保存明文",
    updated: "更新于",
    replace: "替换",
    status: "状态",
    remove: "删除",
    removeDescription: "保存时删除当前已存储的 Secret。",
    description: "配置此 Package 的设置与 Host 管理凭据。",
    save: "保存",
    empty: "此插件没有可编辑配置。",
    general: "常规",
    credentials: "凭据",
    credentialsDescription: "凭据由 Host Secrets 保存，保存后不会再次读取明文。",
    advanced: "高级",
    advancedDescription: "临时或管理控制项。",
    admin: "管理员授权",
    adminDescription: "仅在 bootstrap 管理阶段修改 Secret 时用于管理员认证，不会被持久化。"
  },
  ja: {
    configured: "設定済み",
    notConfigured: "未設定",
    scopeUnavailable: "現在のスコープコンテキストを利用できません",
    valueHidden: "保存済みの値は表示されません",
    updated: "更新",
    replace: "置き換え",
    status: "状態",
    remove: "削除",
    removeDescription: "保存時に保存済み Secret を削除します。",
    description: "この Package の設定と Host 管理の認証情報を構成します。",
    save: "保存",
    empty: "編集可能な設定はありません。",
    general: "一般",
    credentials: "認証情報",
    credentialsDescription: "認証情報は Host Secrets に保存され、保存後に平文で再表示されません。",
    advanced: "詳細設定",
    advancedDescription: "一時的または管理用の設定です。",
    admin: "管理者認証",
    adminDescription: "bootstrap 管理段階で Secret を変更する場合にのみ使用し、保存されません。"
  },
  "zh-TW": {
    configured: "已設定",
    notConfigured: "未設定",
    scopeUnavailable: "目前作用域上下文無法使用",
    valueHidden: "不顯示已儲存明文",
    updated: "更新於",
    replace: "取代",
    status: "狀態",
    remove: "刪除",
    removeDescription: "儲存時刪除目前已儲存的 Secret。",
    description: "設定此 Package 的設定與 Host 管理憑證。",
    save: "儲存",
    empty: "此外掛沒有可編輯設定。",
    general: "一般",
    credentials: "憑證",
    credentialsDescription: "憑證由 Host Secrets 儲存，儲存後不會再次讀取明文。",
    advanced: "進階",
    advancedDescription: "暫時或管理控制項。",
    admin: "管理員授權",
    adminDescription: "僅在 bootstrap 管理階段修改 Secret 時用於管理員驗證，不會被持久化。"
  }
} satisfies Record<SettingsUiLocale, Record<string, string>>;

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
): Promise<SettingsEditorV010 | SettingsEditorV020 | undefined> {
  const pkg = manager.listCatalog().find(item => item.packageId === packageId);
  const installed = manager.getSnapshot().installedPackages.some(item => item.packageId === packageId);
  if (!pkg || !installed || !packageHasConfiguration(pkg)) return undefined;

  const text = settingsCopy[settingsUiLocale(locale)];
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
          ? `${text.configured}${status?.updatedAt ? ` · ${text.updated} ${status.updatedAt}` : ""} · ${text.valueHidden}`
          : text.notConfigured;

      return [
        {
          key: `secret:${declaration.key}`,
          label: configured ? `${text.replace} ${declaration.label}` : declaration.label,
          description: unavailable
            ? `Secret scope '${declaration.scope}' is not available in the current platform context.`
            : declaration.description,
          type: "secret" as const,
          value: "",
          readOnly: unavailable
        },
        {
          key: `secret-status:${declaration.key}`,
          label: `${declaration.label} ${text.status}`,
          type: "string" as const,
          value: statusValue,
          readOnly: true
        },
        ...(configured && !unavailable
          ? [{
              key: `secret-remove:${declaration.key}`,
              label: `${text.remove} ${declaration.label}`,
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

  const groups = [
    ...(ordinarySettings.length > 0 ? [{
      id: "general",
      title: text.general,
      settings: ordinarySettings
    }] : []),
    ...(secretSettings.length > 0 ? [{
      id: "credentials",
      title: text.credentials,
      description: text.credentialsDescription,
      settings: secretSettings
    }] : []),
    ...(hasSecrets ? [{
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
    }] : [])
  ];

  return {
    contractVersion: "0.2.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace,
    title: merged?.title ?? pkg.displayName,
    description: merged?.description ?? text.description,
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    groups,
    saveLabel: text.save,
    emptyMessage: text.empty
  };
}}

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
