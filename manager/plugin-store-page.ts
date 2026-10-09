import type { PackageManifestV010, PlatformSnapshotV010 } from "../contracts/package.js";
import { EVO_PLUGIN_PROTOCOL_VERSION } from "../contracts/plugin-protocol.js";
import {
  compareSemanticVersionsV010,
  evaluatePackageCompatibility
} from "./compatibility.js";
import {
  inspectPluginRuntimeV010,
  type PluginRuntimeStatusV010
} from "./plugin-runtime-host.js";
import type {
  ExtensionManagerActionV010,
  ExtensionManagerItemV010,
  ExtensionManagerV010
} from "../vendor/eidos/src/extension-manager/contracts.js";
import { packageHasConfiguration, settingsPackageRoute } from "./settings-page.js";
import {
  createMemoryPluginIntegrityTrustStoreV010,
  verifyPackageIntegrityV010,
  type PluginIntegrityTrustStoreV010
} from "./package-integrity.js";
import type {
  PluginRuntimeDiagnosticsV010,
  PluginRuntimeEventV010
} from "./plugin-runtime-observability.js";

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

export interface PluginStoreProductStateV010 {
  readiness?: NonNullable<ExtensionManagerItemV010["readiness"]>;
  primaryAction?: ExtensionManagerActionV010;
}

export interface PluginStorePageOptionsV010 {
  integrityTrustStore?: PluginIntegrityTrustStoreV010;
  runtimeDiagnostics?: PluginRuntimeDiagnosticsV010[];
  runtimeEvents?: PluginRuntimeEventV010[];
  evaluateRuntime?: (pkg: PackageManifestV010) => PluginRuntimeStatusV010;
  evaluateProductState?: (
    pkg: PackageManifestV010,
    lifecycle: { isInstalled: boolean; isEnabled: boolean }
  ) => PluginStoreProductStateV010 | undefined;
}

export function createPluginStorePage(
  packages: PackageManifestV010[],
  snapshot: PlatformSnapshotV010,
  options: PluginStorePageOptionsV010 = {}
): ExtensionManagerV010 {
  const installed = new Set(snapshot.installedPackages.map(item => item.packageId));
  const integrityTrustStore = options.integrityTrustStore
    ?? createMemoryPluginIntegrityTrustStoreV010();
  const diagnosticsByPackage = new Map(
    (options.runtimeDiagnostics ?? []).map(item => [item.packageId, item])
  );
  const runtimeEventsByPackage = new Map<string, PluginRuntimeEventV010[]>();
  for (const event of options.runtimeEvents ?? []) {
    const current = runtimeEventsByPackage.get(event.packageId) ?? [];
    current.push(event);
    runtimeEventsByPackage.set(event.packageId, current);
  }
  for (const current of runtimeEventsByPackage.values()) {
    current.sort((a, b) => b.sequence - a.sequence);
  }
  const evaluateRuntime = options.evaluateRuntime ?? inspectPluginRuntimeV010;

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
        const installedRecord = snapshot.installedPackages.find(item => item.packageId === pkg.packageId);
        const upgradeComparison = installedRecord
          ? compareSemanticVersionsV010(pkg.version, installedRecord.version)
          : undefined;
        const hasUpgrade = upgradeComparison !== undefined && upgradeComparison > 0;
        const activeFeatureIds = new Set(
          snapshot.activeFeatures
            .filter(feature => feature.packageId === pkg.packageId)
            .map(feature => feature.featureId)
        );
        const isEnabled = pkg.features.some(feature => activeFeatureIds.has(feature.featureId));
        const productState = options.evaluateProductState?.(pkg, { isInstalled, isEnabled });
        const route = firstExperienceRoute(pkg);
        const settingsRoute = packageHasConfiguration(pkg) ? settingsPackageRoute(pkg.packageId) : undefined;
        const compatibility = evaluatePackageCompatibility(pkg);
        const runtimeStatus = evaluateRuntime(pkg);
        const integrityStatus = verifyPackageIntegrityV010(pkg, integrityTrustStore);
        const runtimeDiagnostics = diagnosticsByPackage.get(pkg.packageId);
        const runtimeHistory = (runtimeEventsByPackage.get(pkg.packageId) ?? []).slice(0, 5);
        const compatible = (
          pkg.contractVersion === EVO_PLUGIN_PROTOCOL_VERSION
          && compatibility.state !== "INCOMPATIBLE"
          && runtimeStatus.status === "READY"
        );
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
            hostVersion: compatibility.host.appPlatform,
            eidosVersion: compatibility.host.eidos,
            state: compatible
              ? compatibility.state === "UNKNOWN"
                ? "unknown" as const
                : "compatible" as const
              : "incompatible" as const,
            message: runtimeStatus.status === "UNSUPPORTED"
              ? runtimeStatus.message
              : compatibility.messages.join(" ")
          },
          trust: {
            level: pkg.publisher?.trust === "UNVERIFIED" && installedRecord?.trustApproved !== true
              ? "review" as const
              : "trusted" as const,
            label: pkg.publisher?.trust === "UNVERIFIED" && installedRecord?.trustApproved !== true
              ? "Review required"
              : pkg.publisher?.trust === "UNVERIFIED"
                ? "Approved"
                : "Trusted",
            publisher: pkg.publisher?.displayName ?? pkg.publisher?.id ?? "EVO catalog",
            source: pkg.publisher?.source ?? "host catalog",
            message: pkg.publisher?.trust === "UNVERIFIED" && installedRecord?.trustApproved !== true
              ? "Publisher trust must be approved before installation."
              : "Publisher trust is admitted for this installation."
          },
          integrity: {
            state: integrityStatus.state === "VERIFIED"
              ? "verified" as const
              : integrityStatus.state === "UNSIGNED"
                ? "unsigned" as const
                : integrityStatus.state === "UNTRUSTED"
                  ? "untrusted" as const
                  : integrityStatus.state === "INVALID"
                    ? "invalid" as const
                    : "pending" as const,
            label: integrityStatus.state === "VERIFIED"
              ? "Signature verified"
              : integrityStatus.state === "UNSIGNED"
                ? "Unsigned"
                : integrityStatus.state === "UNTRUSTED"
                  ? "Untrusted signature"
                  : integrityStatus.state === "INVALID"
                    ? "Invalid signature"
                    : "Signature verified · artifact pending",
            algorithm: integrityStatus.algorithm,
            keyId: integrityStatus.keyId,
            digest: integrityStatus.digest,
            provenance: integrityStatus.provenance
              ? `${integrityStatus.provenance.type}${integrityStatus.provenance.reference ? ` · ${integrityStatus.provenance.reference}` : ""}`
              : undefined,
            message: integrityStatus.message
          },
          permissions: (pkg.permissions ?? []).map(permission => ({
            id: permission.id,
            label: permission.label,
            risk: permission.risk.toLowerCase() as "low" | "medium" | "high",
            granted: installedRecord?.grantedPermissions?.includes(permission.id) === true
          })),
          activation: {
            mode: pkg.features.some(feature => feature.activation?.mode === "ON_DEMAND")
              ? "on-demand" as const
              : "eager" as const,
            events: unique(pkg.features.flatMap(feature => feature.activation?.events ?? []))
          },
          runtime: {
            kind: runtimeStatus.kind.toLowerCase() as "declarative" | "worker" | "process" | "remote",
            isolation: runtimeStatus.isolation.toLowerCase() as "host" | "worker" | "process" | "remote",
            status: runtimeStatus.status === "READY"
              ? "ready" as const
              : runtimeStatus.status === "INACTIVE"
                ? "inactive" as const
                : runtimeStatus.status === "ERROR"
                  ? "error" as const
                  : "unsupported" as const,
            ...(runtimeDiagnostics ? {
              health: runtimeDiagnostics.health,
              metrics: {
                invocations: runtimeDiagnostics.invocations,
                failures: runtimeDiagnostics.failures,
                timeouts: runtimeDiagnostics.timeouts,
                crashes: runtimeDiagnostics.crashes,
                restarts: runtimeDiagnostics.restarts,
                lastEventAt: runtimeDiagnostics.lastEventAt,
                lastError: runtimeDiagnostics.lastError
              }
            } : {}),
            ...(runtimeHistory.length > 0 ? {
              history: runtimeHistory.map(event => ({
                sequence: event.sequence,
                occurredAt: event.occurredAt,
                type: event.type,
                ...(event.method ? { method: event.method } : {}),
                ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}),
                ...(event.message ? { message: event.message } : {})
              }))
            } : {})
          },
          storage: {
            scope: "package" as const,
            state: pkg.storage ? "available" as const : "unavailable" as const
          },
          events: {
            publish: pkg.events?.publish ?? [],
            subscribe: pkg.events?.subscribe ?? []
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
                    requiresConfirmation: (pkg.permissions?.length ?? 0) > 0 || pkg.publisher?.trust === "UNVERIFIED",
                    helpText: (pkg.permissions?.length ?? 0) > 0 || pkg.publisher?.trust === "UNVERIFIED"
                      ? "Review requested permissions and publisher trust before installation."
                      : "Dependencies and protocol compatibility are checked automatically."
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
                      ...(hasUpgrade ? [{
                        id: "upgrade",
                        label: `Upgrade to ${pkg.version}`,
                        type: "command" as const,
                        command: "app-platform.upgrade-package",
                        inputVersion: "0.1.0",
                        requiresConfirmation: true,
                        helpText: `Upgrade installed version ${installedRecord?.version ?? ""} to catalog version ${pkg.version} after compatibility and dependency checks.`
                      }] : []),
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
                      ...(hasUpgrade ? [{
                        id: "upgrade",
                        label: `Upgrade to ${pkg.version}`,
                        type: "command" as const,
                        command: "app-platform.upgrade-package",
                        inputVersion: "0.1.0",
                        requiresConfirmation: true,
                        helpText: `Upgrade installed version ${installedRecord?.version ?? ""} to catalog version ${pkg.version} after compatibility and dependency checks.`
                      }] : []),
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
                  }),
          ...(productState?.readiness ? { readiness: productState.readiness } : {}),
          ...(productState?.primaryAction ? { primaryAction: productState.primaryAction } : {})
        };
      })
  };
}
