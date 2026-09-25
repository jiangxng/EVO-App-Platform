import type { PackageManifestV010, PlatformSnapshotV010 } from "../contracts/package.js";
import { EVO_PLUGIN_PROTOCOL_VERSION } from "../contracts/plugin-protocol.js";
import type { ExtensionManagerV010 } from "../vendor/eidos/src/extension-manager/contracts.js";
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
      title: "Plugin Platform",
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
      label: "Plugins",
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

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function contributionSummary(pkg: PackageManifestV010): Array<{ kind: string; count: number }> {
  const counts = new Map<string, number>();
  for (const feature of pkg.features) {
    for (const contribution of feature.contributions ?? []) {
      counts.set(contribution.kind, (counts.get(contribution.kind) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

export function createPluginStorePage(
  packages: PackageManifestV010[],
  snapshot: PlatformSnapshotV010
): ExtensionManagerV010 {
  const installed = new Set(snapshot.installedPackages.map(item => item.packageId));

  return {
    contractVersion: "0.1.0",
    kind: "extension-manager",
    id: "evo.plugin-store",
    title: "EVO Plugin Platform",
    description: "App Platform owns plugin protocol and lifecycle. Eidos renders declared Contribution Points. Test install, enable, disable and uninstall here without coupling unrelated plugin CI.",
    protocol: {
      name: "EVO Plugin Protocol",
      version: EVO_PLUGIN_PROTOCOL_VERSION,
      status: "preview"
    },
    host: {
      name: "EVO App Platform",
      version: "0.1.0"
    },
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
        const compatible = pkg.contractVersion === EVO_PLUGIN_PROTOCOL_VERSION;
        const provides = unique(pkg.features.flatMap(feature => feature.providesCapabilities ?? []));
        const requires = unique(pkg.features.flatMap(feature => feature.requiresCapabilities ?? []));

        return {
          id: pkg.packageId,
          title: pkg.displayName,
          description: `${pkg.features.length} Feature(s) · ${provides.length} provided Capability(ies) · ${requires.length} required Capability(ies)`,
          version: pkg.version,
          category: pkg.type,
          status: {
            id: compatible
              ? !isInstalled
                ? "not-installed" as const
                : isEnabled
                  ? "enabled" as const
                  : "disabled" as const
              : "incompatible" as const,
            label: compatible
              ? !isInstalled
                ? "Not installed"
                : isEnabled
                  ? "Enabled"
                  : "Disabled"
              : "Incompatible",
            tone: compatible && isEnabled ? "positive" as const : compatible ? "neutral" as const : "danger" as const
          },
          compatibility: {
            protocolVersion: pkg.contractVersion,
            state: compatible ? "compatible" as const : "incompatible" as const,
            message: compatible
              ? "Compatible with current Plugin Protocol"
              : `Requires Plugin Protocol ${pkg.contractVersion}; host provides ${EVO_PLUGIN_PROTOCOL_VERSION}`
          },
          capabilities: {
            provides,
            requires
          },
          contributions: contributionSummary(pkg),
          ...(!compatible
            ? {}
            : !isInstalled
              ? {
                  primaryAction: {
                    id: "install",
                    label: "Install",
                    type: "command" as const,
                    command: "app-platform.install-package",
                    inputVersion: "0.1.0",
                    helpText: "Dependencies and protocol compatibility are checked automatically."
                  },
                  secondaryActions: [
                    {
                      id: "plan",
                      label: "Details",
                      type: "command" as const,
                      command: "app-platform.plan-install",
                      inputVersion: "0.1.0",
                      helpText: "Inspect dependency and activation plan."
                    }
                  ]
                }
              : isEnabled
                ? {
                    ...(route ? {
                      primaryAction: {
                        id: "open",
                        label: "Open",
                        type: "navigate" as const,
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
                        type: "command" as const,
                        command: "app-platform.disable-package",
                        inputVersion: "0.1.0",
                        requiresConfirmation: true
                      },
                      {
                        id: "uninstall",
                        label: "Uninstall",
                        type: "command" as const,
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
                      type: "command" as const,
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
                        type: "command" as const,
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
