import type { PackageManifestV010, PlatformSnapshotV010 } from "../contracts/package.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import { packageHasSettings, settingsPackageRoute } from "./settings-page.js";

export const pluginStorePageSource = "app://evo-app-platform/pages/plugin-store";

export const pluginStoreExperienceManifest = {
  contractVersion: "0.1.0",
  experienceId: "evo-plugin-store",
  packageId: "evo-app-platform",
  featureId: "evo-plugin-store.system",
  defaultRoute: "/store",
  pages: [
    {
      id: "evo-plugin-store.home",
      title: "Plugin Store",
      source: pluginStorePageSource
    }
  ],
  routes: [
    {
      id: "evo-plugin-store.home",
      path: "/store",
      pageId: "evo-plugin-store.home"
    }
  ],
  navigation: [
    {
      id: "evo-plugin-store.nav",
      label: "Plugin Store",
      route: "/store",
      order: 0
    }
  ]
} as const;

function firstExperienceRoute(pkg: PackageManifestV010): string | undefined {
  for (const feature of pkg.features) {
    for (const contribution of feature.contributions ?? []) {
      if (contribution.kind === "eidos.experience" && contribution.manifest.defaultRoute) {
        return contribution.manifest.defaultRoute;
      }
    }
  }
  return undefined;
}

function packageSummary(pkg: PackageManifestV010): string {
  const provides = pkg.features.flatMap(feature => feature.providesCapabilities ?? []);
  const requires = pkg.features.flatMap(feature => feature.requiresCapabilities ?? []);
  return `${pkg.features.length} feature(s) · ${provides.length} provided capability(ies) · ${requires.length} required capability(ies)`;
}

export function createPluginStorePage(
  packages: PackageManifestV010[],
  snapshot: PlatformSnapshotV010
): CatalogBrowserV010 {
  const installed = new Set(snapshot.installedPackages.map(item => item.packageId));

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.plugin-store",
    title: "EVO Plugin Store",
    description: "发现、检查依赖、安装和打开 EVO 插件。正式验收必须从安装生命周期开始。",
    items: packages
      .filter(pkg => pkg.type !== "FOUNDATION_RUNTIME")
      .map(pkg => {
        const isInstalled = installed.has(pkg.packageId);
        const activeFeatureIds = new Set(
          snapshot.activeFeatures
            .filter(feature => feature.packageId === pkg.packageId)
            .map(feature => feature.featureId)
        );
        const isEnabled = pkg.features.some(feature => activeFeatureIds.has(feature.featureId));
        const route = firstExperienceRoute(pkg);
        const settingsRoute = packageHasSettings(pkg) ? settingsPackageRoute(pkg.packageId) : undefined;
        return {
          id: pkg.packageId,
          title: pkg.displayName,
          version: pkg.version,
          category: pkg.type,
          summary: packageSummary(pkg),
          badges: [
            pkg.type,
            ...pkg.features.map(feature => feature.activationScope)
          ],
          status: {
            id: !isInstalled ? "not-installed" : isEnabled ? "enabled" : "disabled",
            label: !isInstalled ? "Not installed" : isEnabled ? "Enabled" : "Disabled",
            tone: isEnabled ? "positive" : "neutral"
          },
          metadata: {
            features: pkg.features.length,
            activeFeatures: activeFeatureIds.size,
            providedCapabilities: pkg.features.flatMap(feature => feature.providesCapabilities ?? []).length,
            requiredCapabilities: pkg.features.flatMap(feature => feature.requiresCapabilities ?? []).length,
            ...(route ? { route } : {})
          },
          ...(!isInstalled
            ? {
                primaryAction: {
                  id: "install",
                  label: "Install",
                  type: "command",
                  command: "app-platform.install-package",
                  inputVersion: "0.1.0",
                  helpText: "The system automatically checks dependencies and compatibility. Human input is requested only when a material decision is required."
                },
                secondaryActions: [
                  {
                    id: "plan",
                    label: "Installation details",
                    type: "command",
                    command: "app-platform.plan-install",
                    inputVersion: "0.1.0",
                    helpText: "Optional: preview dependencies, packages to install, and features to activate."
                  }
                ]
              }
            : isEnabled
              ? {
                  ...(route ? {
                    primaryAction: {
                      id: "open",
                      label: "Open",
                      type: "navigate",
                      route
                    }
                  } : {}),
                  secondaryActions: [
                    ...(settingsRoute ? [{
                      id: "configure",
                      label: "Configure",
                      type: "navigate" as const,
                      route: settingsRoute
                    }] : []),
                    {
                      id: "disable",
                      label: "Disable",
                      type: "command",
                      command: "app-platform.disable-package",
                      inputVersion: "0.1.0",
                      requiresConfirmation: true
                    },
                    {
                      id: "uninstall",
                      label: "Uninstall",
                      type: "command",
                      command: "app-platform.uninstall-package",
                      inputVersion: "0.1.0",
                      requiresConfirmation: true
                    }
                  ]
                }
              : {
                  primaryAction: {
                    id: "enable",
                    label: "Enable",
                    type: "command",
                    command: "app-platform.enable-package",
                    inputVersion: "0.1.0"
                  },
                  secondaryActions: [
                    ...(settingsRoute ? [{
                      id: "configure",
                      label: "Configure",
                      type: "navigate" as const,
                      route: settingsRoute
                    }] : []),
                    {
                      id: "uninstall",
                      label: "Uninstall",
                      type: "command",
                      command: "app-platform.uninstall-package",
                      inputVersion: "0.1.0",
                      requiresConfirmation: true
                    }
                  ]
                })
        };
      })
  };
}
