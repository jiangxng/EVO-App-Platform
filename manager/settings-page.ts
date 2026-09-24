import type { AppManagerService } from "./service.js";
import type { SettingsStore } from "./settings-store.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { SettingsEditorV010 } from "../vendor/eidos/src/settings/contracts.js";
import type {
  EidosSettingsContributionV010,
  PackageManifestV010,
  SettingValueV010
} from "../contracts/package.js";

export const settingsIndexPageSource = "app://evo-app-platform/pages/settings";

export function settingsPackagePageSource(packageId: string): string {
  return `app://evo-app-platform/pages/settings/${encodeURIComponent(packageId)}`;
}

export function settingsPackageRoute(packageId: string): string {
  return `/settings/${encodeURIComponent(packageId)}`;
}

export function packageHasSettings(pkg: PackageManifestV010): boolean {
  return pkg.features.some(feature =>
    (feature.contributions ?? []).some(contribution => contribution.kind === "eidos.settings")
  );
}

export function createSettingsExperienceManifest(manager: AppManagerService) {
  const installed = manager.listInstalledSettings();
  const packageIds = [...new Set(installed.map(item => item.packageId))].sort();

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
      ...packageIds.map(packageId => ({
        id: `evo-settings.${packageId}`,
        title: packageId,
        source: settingsPackagePageSource(packageId)
      }))
    ],
    routes: [
      {
        id: "evo-settings.home",
        path: "/settings",
        pageId: "evo-settings.home"
      },
      ...packageIds.map(packageId => ({
        id: `evo-settings.${packageId}`,
        path: settingsPackageRoute(packageId),
        pageId: `evo-settings.${packageId}`
      }))
    ]
  } as const;
}

export function createSettingsIndexPage(
  manager: AppManagerService
): CatalogBrowserV010 {
  const catalog = new Map(manager.listCatalog().map(pkg => [pkg.packageId, pkg]));
  const installed = manager.listInstalledSettings();
  const packageIds = [...new Set(installed.map(item => item.packageId))].sort();

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.settings",
    title: "Settings",
    description: "Configure installed plugins that declare standard settings.",
    emptyMessage: "No installed plugins expose standard settings.",
    items: packageIds.map(packageId => {
      const pkg = catalog.get(packageId);
      return {
        id: packageId,
        title: pkg?.displayName ?? packageId,
        version: pkg?.version,
        category: pkg?.type,
        summary: "Standard plugin settings",
        primaryAction: {
          id: "configure",
          label: "Configure",
          type: "navigate",
          route: settingsPackageRoute(packageId)
        }
      };
    })
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

export function createSettingsPage(
  manager: AppManagerService,
  store: SettingsStore,
  packageId: string
): SettingsEditorV010 | undefined {
  const merged = mergeSettingsContributions(manager.listInstalledSettings(packageId));
  if (!merged) return undefined;

  const current = store.getNamespace(merged.namespace);
  return {
    contractVersion: "0.1.0",
    kind: "settings-editor",
    id: `evo-settings.${packageId}`,
    namespace: merged.namespace,
    title: merged.title,
    description: merged.description,
    command: {
      code: "app-platform.update-settings",
      inputVersion: "0.1.0"
    },
    settings: merged.properties.map(property => ({
      key: property.key,
      label: property.label,
      description: property.description,
      type: property.type,
      value: current[property.key] ?? property.defaultValue,
      defaultValue: property.defaultValue,
      options: property.options,
      readOnly: property.readOnly
    })),
    saveLabel: "Save",
    emptyMessage: "This plugin has no editable standard settings."
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
