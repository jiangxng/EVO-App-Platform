import type { PackageManifestV010, PlatformSnapshotV010 } from "../contracts/package.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

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
  return [
    `${pkg.features.length} Feature${pkg.features.length === 1 ? "" : "s"}`,
    provides.length ? `提供 ${provides.length} 个 Capability` : "",
    requires.length ? `依赖 ${requires.length} 个 Capability` : ""
  ].filter(Boolean).join(" · ");
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
        const route = firstExperienceRoute(pkg);
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
            label: isInstalled ? "已安装" : "未安装",
            tone: isInstalled ? "positive" : "neutral"
          },
          metadata: {
            features: pkg.features.length,
            ...(route ? { route } : {})
          },
          ...(isInstalled
            ? route
              ? {
                  primaryAction: {
                    id: "open",
                    label: "打开",
                    type: "navigate",
                    route
                  }
                }
              : {}
            : {
                primaryAction: {
                  id: "plan",
                  label: "查看安装计划",
                  type: "command",
                  command: "app-platform.plan-install",
                  inputVersion: "0.1.0"
                },
                secondaryActions: [
                  {
                    id: "install",
                    label: "确认安装",
                    type: "command",
                    command: "app-platform.install-package",
                    inputVersion: "0.1.0",
                    requiresConfirmation: true
                  }
                ]
              })
        };
      })
  };
}
