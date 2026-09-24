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
  snapshot: PlatformSnapshotV010,
  plannedPackageIds: ReadonlySet<string> = new Set()
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
        const planReady = plannedPackageIds.has(pkg.packageId);
        const activeFeatureIds = new Set(
          snapshot.activeFeatures
            .filter(feature => feature.packageId === pkg.packageId)
            .map(feature => feature.featureId)
        );
        const isEnabled = pkg.features.some(feature => activeFeatureIds.has(feature.featureId));
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
            label: !isInstalled ? (planReady ? "安装计划已就绪" : "未安装") : isEnabled ? "已启用" : "已禁用",
            tone: isEnabled ? "positive" : planReady ? "warning" : "neutral"
          },
          metadata: {
            features: pkg.features.length,
            activeFeatures: activeFeatureIds.size,
            installPlan: !isInstalled ? (planReady ? "ready" : "required") : "not-applicable",
            ...(route ? { route } : {})
          },
          ...(!isInstalled
            ? {
                primaryAction: {
                  id: "plan",
                  label: "查看安装计划",
                  type: "command",
                  command: "app-platform.plan-install",
                  inputVersion: "0.1.0",
                  helpText: planReady ? "安装计划已生成，可重新查看。" : "先检查依赖、将安装的 Package、将激活的 Feature 和阻断项。"
                },
                secondaryActions: [
                  {
                    id: "install",
                    label: "确认安装",
                    type: "command",
                    command: "app-platform.install-package",
                    inputVersion: "0.1.0",
                    requiresConfirmation: true,
                    enabled: planReady,
                    disabledReason: planReady ? undefined : "请先点击“查看安装计划”，确认依赖和变更后再安装。",
                    helpText: planReady ? "当前安装计划已通过检查，可以确认安装。" : "安装计划生成前不可执行。"
                  }
                ]
              }
            : isEnabled
              ? {
                  ...(route ? {
                    primaryAction: {
                      id: "open",
                      label: "打开",
                      type: "navigate",
                      route
                    }
                  } : {}),
                  secondaryActions: [
                    {
                      id: "disable",
                      label: "禁用",
                      type: "command",
                      command: "app-platform.disable-package",
                      inputVersion: "0.1.0",
                      requiresConfirmation: true
                    },
                    {
                      id: "uninstall",
                      label: "卸载",
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
                    label: "启用",
                    type: "command",
                    command: "app-platform.enable-package",
                    inputVersion: "0.1.0"
                  },
                  secondaryActions: [
                    {
                      id: "uninstall",
                      label: "卸载",
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
