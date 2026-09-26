import type { AppManagerService } from "./service.js";
import type { SettingsStore } from "./settings-store.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { SettingsEditorV010 } from "../vendor/eidos/src/settings/contracts.js";
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
) => SecretDescriptorV010 | undefined;

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

export function createSettingsPage(
  manager: AppManagerService,
  store: SettingsStore,
  packageId: string,
  describeSecret?: DescribeSecretV010,
  secretContext: SettingsSecretScopeContextV010 = { installationId: "default" }
): SettingsEditorV010 | undefined {
  const pkg = manager.listCatalog().find(item => item.packageId === packageId);
  const installed = manager.getSnapshot().installedPackages.some(item => item.packageId === packageId);
  if (!pkg || !installed || !packageHasConfiguration(pkg)) return undefined;

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

  const secretSettings = (pkg.secrets ?? []).flatMap(declaration => {
    const reference = secretReferenceForPackageV010(pkg.packageId, declaration, secretContext);
    const status = reference ? describeSecret?.(reference) : undefined;
    const configured = status?.configured === true;
    const unavailable = !reference;
    const statusValue = unavailable
      ? "Scope context unavailable"
      : configured
        ? `Configured${status?.updatedAt ? ` · updated ${status.updatedAt}` : ""} · value is never displayed`
        : "Not configured";

    return [
      {
        key: `secret:${declaration.key}`,
        label: configured ? `Replace ${declaration.label}` : declaration.label,
        description: unavailable
          ? `Secret scope '${declaration.scope}' is not available in the current platform context.`
          : declaration.description,
        type: "secret" as const,
        value: "",
        readOnly: unavailable
      },
      {
        key: `secret-status:${declaration.key}`,
        label: `${declaration.label} status`,
        type: "string" as const,
        value: statusValue,
        readOnly: true
      },
      ...(configured && !unavailable
        ? [{
            key: `secret-remove:${declaration.key}`,
            label: `Remove ${declaration.label}`,
            description: "Remove the stored Secret when saving.",
            type: "boolean" as const,
            value: false,
            defaultValue: false
          }]
        : [])
    ];
  });

  const hasSecrets = (pkg.secrets?.length ?? 0) > 0;

  return {
    contractVersion: "0.1.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace,
    title: merged?.title ?? pkg.displayName,
    description: merged?.description ?? "Configure Host-managed credentials for this Package.",
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    settings: [
      ...ordinarySettings,
      ...secretSettings,
      ...(hasSecrets
        ? [{
            key: "adminToken",
            label: "Administrator authorization",
            description: "Bootstrap-phase administrator authentication used only when changing Secrets. It is never persisted.",
            type: "secret" as const,
            value: ""
          }]
        : [])
    ],
    saveLabel: "Save",
    emptyMessage: "This plugin has no editable configuration."
  };
}

export function validateAndMergeSettings(
  manager: AppManagerService,
  store: SettingsStore,
  namespace: string,
  input: Record<string, unknown>
): Record<string, SettingValueV010> {
  const merged = mergeSettingsContributions(manager.listInstalledSettings(namespace));
  if (!merged || merged.namespace !== namespace) {
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
