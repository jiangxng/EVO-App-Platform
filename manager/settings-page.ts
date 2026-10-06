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
import { ENTERPRISE_CONTEXT_DIRECTORY_ROUTE } from "../apps/enterprise-context-governance/constants.js";
import { LEDGER_MANAGER_ROUTE } from "../apps/ledger-manager/constants.js";
import { TEMPLATE_STORE_ROUTE } from "../apps/template-store/package.js";

export const settingsIndexPageSource = "app://evo-app-platform/pages/settings";

export type SettingsNavigationGroupV010 =
  | "business"
  | "applications"
  | "ai"
  | "system";

export function settingsGroupPageSource(
  group: SettingsNavigationGroupV010
): string {
  return `app://evo-app-platform/pages/settings-group/${group}`;
}

export function settingsGroupRoute(
  group: SettingsNavigationGroupV010
): string {
  return `/settings/${group}`;
}

export function settingsGroupFromPageSource(
  source: string
): SettingsNavigationGroupV010 | undefined {
  const prefix = "app://evo-app-platform/pages/settings-group/";
  if (!source.startsWith(prefix)) return undefined;
  const group = source.slice(prefix.length);
  return group === "business"
    || group === "applications"
    || group === "ai"
    || group === "system"
    ? group
    : undefined;
}

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
    const canonical = Intl.getCanonicalLocales(locale.trim())[0];
    if (canonical === "zh-CN" || canonical === "ja" || canonical === "zh-TW") return canonical;
    return "en";
  } catch {
    return "en";
  }
}

const settingsUiMessages = {
  en: {
    scopeUnavailable: "Scope context unavailable",
    configured: "Configured",
    updated: "updated",
    neverDisplayed: "value is never displayed",
    notConfigured: "Not configured",
    replace: "Replace",
    status: "status",
    remove: "Remove",
    removeDescription: "Remove the stored Secret when saving.",
    secretScopeUnavailable: "This Secret scope is not available in the current platform context.",
    hostCredentials: "Configure Host-managed credentials for this Package.",
    adminLabel: "Bootstrap administrator verification",
    adminDescription: "Temporary bootstrap verification used only when changing credentials before sign-in/session authorization is available. It is never persisted.",
    save: "Save",
    empty: "This plugin has no editable configuration.",
    runtimeGroup: "Runtime",
    runtimeGroupDescription: "Model and endpoint settings used by this Provider or plugin.",
    credentialsGroup: "Credentials",
    credentialsGroupDescription: "Host-managed secrets. Stored values are never displayed again.",
    administrationGroup: "Bootstrap authorization",
    administrationGroupDescription: "Temporary setup-time authorization for protected credential changes. Once sign-in/session authorization is enabled, this control should not appear in ordinary Settings.",
    credentialNotice: "Credentials stay inside the Host Secrets boundary and are never returned to the browser after save."
  },
  "zh-CN": {
    scopeUnavailable: "当前作用域上下文不可用",
    configured: "已配置",
    updated: "更新于",
    neverDisplayed: "不显示已保存明文",
    notConfigured: "未配置",
    replace: "替换",
    status: "状态",
    remove: "删除",
    removeDescription: "保存时删除当前已存储的 Secret。",
    secretScopeUnavailable: "当前平台上下文不支持此 Secret 作用域。",
    hostCredentials: "配置此 Package 的 Host 管理凭据。",
    adminLabel: "引导阶段管理员验证",
    adminDescription: "仅在尚未接入正式登录/会话授权时，用于修改凭据的临时 bootstrap 验证；不会被持久化。",
    save: "保存",
    empty: "此插件没有可编辑配置。",
    runtimeGroup: "运行设置",
    runtimeGroupDescription: "此 Provider 或插件使用的模型、端点及普通运行参数。",
    credentialsGroup: "凭据",
    credentialsGroupDescription: "由 Host 管理的 Secret。已保存明文不会再次显示。",
    administrationGroup: "引导阶段授权",
    administrationGroupDescription: "用于当前引导阶段受保护凭据变更的临时授权。接入正式登录/会话授权后，此控件不应再出现在普通设置中。",
    credentialNotice: "凭据始终保留在 Host Secrets 边界内，保存后不会返回到浏览器。"
  },
  ja: {
    scopeUnavailable: "現在のスコープコンテキストは利用できません",
    configured: "設定済み",
    updated: "更新",
    neverDisplayed: "保存済みの値は表示されません",
    notConfigured: "未設定",
    replace: "置換",
    status: "状態",
    remove: "削除",
    removeDescription: "保存時に現在の Secret を削除します。",
    secretScopeUnavailable: "現在のプラットフォームコンテキストでは、この Secret スコープを利用できません。",
    hostCredentials: "この Package の Host 管理認証情報を設定します。",
    adminLabel: "ブートストラップ管理者確認",
    adminDescription: "正式なサインイン／セッション認可が利用可能になる前に、認証情報を変更する場合だけ使う一時的な bootstrap 確認です。保存されません。",
    save: "保存",
    empty: "このプラグインには編集可能な設定がありません。",
    runtimeGroup: "ランタイム",
    runtimeGroupDescription: "この Provider またはプラグインが使用するモデル、エンドポイント、通常の実行設定です。",
    credentialsGroup: "認証情報",
    credentialsGroupDescription: "Host 管理の Secret。保存済みの値は再表示されません。",
    administrationGroup: "ブートストラップ認可",
    administrationGroupDescription: "保護された認証情報変更のための一時的なセットアップ認可です。正式なサインイン／セッション認可導入後は通常の設定画面には表示しません。",
    credentialNotice: "認証情報は Host Secrets 境界内に保持され、保存後にブラウザへ返されません。"
  },
  "zh-TW": {
    scopeUnavailable: "目前作用域內容環境無法使用",
    configured: "已設定",
    updated: "更新於",
    neverDisplayed: "不顯示已儲存明文",
    notConfigured: "未設定",
    replace: "取代",
    status: "狀態",
    remove: "刪除",
    removeDescription: "儲存時刪除目前已儲存的 Secret。",
    secretScopeUnavailable: "目前平台內容環境不支援此 Secret 作用域。",
    hostCredentials: "設定此 Package 的 Host 管理憑證。",
    adminLabel: "引導階段管理員驗證",
    adminDescription: "僅在尚未接入正式登入／工作階段授權時，用於修改憑證的臨時 bootstrap 驗證；不會被持久化。",
    save: "儲存",
    empty: "此插件沒有可編輯設定。",
    runtimeGroup: "執行設定",
    runtimeGroupDescription: "此 Provider 或插件使用的模型、端點與一般執行參數。",
    credentialsGroup: "憑證",
    credentialsGroupDescription: "由 Host 管理的 Secret。已儲存明文不會再次顯示。",
    administrationGroup: "引導階段授權",
    administrationGroupDescription: "用於目前引導階段受保護憑證變更的臨時授權。接入正式登入／工作階段授權後，此控制項不應再出現在一般設定中。",
    credentialNotice: "憑證始終保留在 Host Secrets 邊界內，儲存後不會回傳到瀏覽器。"
  }
} as const;

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
  const groups: SettingsNavigationGroupV010[] = [
    "business",
    "applications",
    "ai",
    "system"
  ];

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
      ...groups.map(group => ({
        id: `evo-settings.group.${group}`,
        title: group,
        source: settingsGroupPageSource(group)
      })),
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
      ...groups.map(group => ({
        id: `evo-settings.group.${group}`,
        path: settingsGroupRoute(group),
        pageId: `evo-settings.group.${group}`
      })),
      ...packages.map(pkg => ({
        id: `evo-settings.${pkg.packageId}`,
        path: settingsPackageRoute(pkg.packageId),
        pageId: `evo-settings.${pkg.packageId}`
      }))
    ]
  } as const;
}

function navigationLocale(locale: string) {
  const zh = settingsUiLocale(locale) === "zh-CN";
  return {
    settings: zh ? "设置" : "Settings",
    description: zh
      ? "低频管理和系统配置按职责分组；日常工作保持在工作区。"
      : "Low-frequency administration and system configuration are grouped by responsibility; daily work stays in the workspace.",
    open: zh ? "打开" : "Open",
    business: zh ? "业务管理" : "Business administration",
    businessSummary: zh
      ? "管理企业结构、账本和业务定义。"
      : "Manage enterprise structure, ledgers and business definitions.",
    applications: zh ? "应用与扩展" : "Applications & extensions",
    applicationsSummary: zh
      ? "管理插件、扩展和企业模板。"
      : "Manage plugins, extensions and enterprise templates.",
    ai: zh ? "AI 与知识" : "AI & knowledge",
    aiSummary: zh
      ? "管理 Memory 和后续知识/AI 基础能力。"
      : "Manage Memory and future knowledge/AI foundations.",
    system: zh ? "系统" : "System",
    systemSummary: zh
      ? "管理 Provider、凭据和已安装组件的高级配置。"
      : "Manage Providers, credentials and advanced installed-component configuration.",
    enterprise: zh ? "企业" : "Enterprise",
    enterpriseSummary: zh
      ? "企业信息、成员、组织和企业定义。"
      : "Enterprise information, members, organization and definitions.",
    ledger: zh ? "账本管理" : "Ledger management",
    ledgerSummary: zh
      ? "管理账本定义及相关业务配置。"
      : "Manage ledger definitions and related business configuration.",
    plugins: zh ? "插件" : "Plugins",
    pluginsSummary: zh
      ? "安装、启用、停用和管理扩展。"
      : "Install, enable, disable and manage extensions.",
    templates: zh ? "模板商店" : "Template Store",
    templatesSummary: zh
      ? "浏览企业模板并复制到当前企业。"
      : "Browse enterprise templates and copy them into the current enterprise.",
    memory: zh ? "Memory" : "Memory",
    memorySummary: zh
      ? "管理上下文 Memory、保留策略和质量。"
      : "Govern contextual Memory, retention and quality.",
    providers: zh ? "Provider 绑定" : "Provider bindings",
    providersSummary: zh
      ? "管理平台能力对应的 Provider 和作用域。"
      : "Manage Provider selection and scope for platform capabilities.",
    configure: zh ? "配置" : "Configure"
  };
}

export function createSettingsIndexPage(
  _manager: AppManagerService,
  locale = "en"
): CatalogBrowserV010 {
  const ui = navigationLocale(locale);
  const groups: Array<{
    id: SettingsNavigationGroupV010;
    title: string;
    summary: string;
  }> = [
    { id: "business", title: ui.business, summary: ui.businessSummary },
    { id: "applications", title: ui.applications, summary: ui.applicationsSummary },
    { id: "ai", title: ui.ai, summary: ui.aiSummary },
    { id: "system", title: ui.system, summary: ui.systemSummary }
  ];

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.settings",
    title: ui.settings,
    description: ui.description,
    emptyMessage: "",
    items: groups.map(group => ({
      id: group.id,
      title: group.title,
      category: "SETTINGS_GROUP",
      summary: group.summary,
      primaryAction: {
        id: "open",
        label: ui.open,
        type: "navigate" as const,
        route: settingsGroupRoute(group.id)
      }
    }))
  };
}

export function createSettingsGroupPage(
  manager: AppManagerService,
  group: SettingsNavigationGroupV010,
  locale = "en"
): CatalogBrowserV010 {
  const ui = navigationLocale(locale);
  const packages = installedConfigurablePackages(manager);

  const items = group === "business"
    ? [
        {
          id: "enterprise",
          title: ui.enterprise,
          category: ui.business,
          summary: ui.enterpriseSummary,
          route: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE
        },
        {
          id: "ledger",
          title: ui.ledger,
          category: ui.business,
          summary: ui.ledgerSummary,
          route: LEDGER_MANAGER_ROUTE
        }
      ]
    : group === "applications"
      ? [
          {
            id: "plugins",
            title: ui.plugins,
            category: ui.applications,
            summary: ui.pluginsSummary,
            route: "/store"
          },
          {
            id: "templates",
            title: ui.templates,
            category: ui.applications,
            summary: ui.templatesSummary,
            route: TEMPLATE_STORE_ROUTE
          }
        ]
      : group === "ai"
        ? [
            {
              id: "memory",
              title: ui.memory,
              category: ui.ai,
              summary: ui.memorySummary,
              route: "/memory"
            }
          ]
        : [
            {
              id: "provider-bindings",
              title: ui.providers,
              category: ui.system,
              summary: ui.providersSummary,
              route: "/providers"
            },
            ...packages.map(pkg => ({
              id: pkg.packageId,
              title: pkg.displayName,
              category: ui.system,
              summary: (pkg.secrets?.length ?? 0) > 0
                ? "Plugin settings and Host-managed credentials"
                : "Standard plugin settings",
              route: settingsPackageRoute(pkg.packageId)
            }))
          ];

  const groupTitle = group === "business"
    ? ui.business
    : group === "applications"
      ? ui.applications
      : group === "ai"
        ? ui.ai
        : ui.system;

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: `evo.settings.${group}`,
    title: groupTitle,
    description: group === "business"
      ? ui.businessSummary
      : group === "applications"
        ? ui.applicationsSummary
        : group === "ai"
          ? ui.aiSummary
          : ui.systemSummary,
    emptyMessage: "",
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      summary: item.summary,
      primaryAction: {
        id: "open",
        label: group === "system" ? ui.configure : ui.open,
        type: "navigate" as const,
        route: item.route
      }
    }))
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
  const ui = settingsUiMessages[uiLocale];
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

  const credentialSettings = (
    await Promise.all((pkg.secrets ?? []).map(async declaration => {
      const reference = secretReferenceForPackageV010(pkg.packageId, declaration, secretContext);
      const status = reference && describeSecret ? await describeSecret(reference) : undefined;
      const configured = status?.configured === true;
      const unavailable = !reference;
      const statusLabel = unavailable
        ? ui.scopeUnavailable
        : configured
          ? `${ui.configured}${status?.updatedAt ? ` · ${ui.updated} ${status.updatedAt}` : ""}`
          : ui.notConfigured;

      return [
        {
          key: `secret:${declaration.key}`,
          label: configured ? `${ui.replace} ${declaration.label}` : declaration.label,
          description: unavailable ? ui.secretScopeUnavailable : declaration.description,
          type: "secret" as const,
          value: "",
          readOnly: unavailable,
          status: {
            label: statusLabel,
            tone: unavailable
              ? "warning" as const
              : configured
                ? "positive" as const
                : "neutral" as const
          }
        },
        ...(configured && !unavailable
          ? [{
              key: `secret-remove:${declaration.key}`,
              label: `${ui.remove} ${declaration.label}`,
              description: ui.removeDescription,
              type: "boolean" as const,
              value: false,
              defaultValue: false
            }]
          : [])
      ];
    }))
  ).flat();

  const hasSecrets = (pkg.secrets?.length ?? 0) > 0;
  const groups: SettingsEditorV020["groups"] = [
    ...(ordinarySettings.length
      ? [{
          id: "runtime",
          title: ui.runtimeGroup,
          description: ui.runtimeGroupDescription,
          settings: ordinarySettings
        }]
      : []),
    ...(credentialSettings.length
      ? [{
          id: "credentials",
          title: ui.credentialsGroup,
          description: ui.credentialsGroupDescription,
          settings: credentialSettings
        }]
      : []),
    ...(hasSecrets
      ? [{
          id: "administration",
          title: ui.administrationGroup,
          description: ui.administrationGroupDescription,
          advanced: true,
          settings: [{
            key: "adminToken",
            label: ui.adminLabel,
            description: ui.adminDescription,
            type: "secret" as const,
            value: ""
          }]
        }]
      : [])
  ];

  return {
    contractVersion: "0.2.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace,
    title: merged?.title ?? pkg.displayName,
    description: merged?.description ?? ui.hostCredentials,
    ...(hasSecrets
      ? {
          notice: {
            tone: "info" as const,
            message: ui.credentialNotice
          }
        }
      : {}),
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    groups,
    saveLabel: ui.save,
    emptyMessage: ui.empty
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
