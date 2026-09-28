import type { AppManagerService } from "./service.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import type {
  ProviderBindingStoreV010,
  ProviderResolutionContextV010
} from "./provider-resolution.js";
import { resolveProviderRuntimeV010 } from "./provider-resolution.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { SettingsEditorV020 } from "../vendor/eidos/src/settings/contracts.js";
import type { ActivationScope } from "../contracts/package.js";

export const providerManagerIndexPageSource = "app://evo-app-platform/pages/providers";

export function providerManagerCapabilityPageSource(capability: string): string {
  return `app://evo-app-platform/pages/providers/${encodeURIComponent(capability)}`;
}

export function providerManagerCapabilityRoute(capability: string): string {
  return `/providers/${encodeURIComponent(capability)}`;
}

export function capabilityFromProviderManagerSource(source: string): string | undefined {
  const prefix = "app://evo-app-platform/pages/providers/";
  if (!source.startsWith(prefix)) return undefined;
  const encoded = source.slice(prefix.length);
  if (!encoded) return undefined;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

function uniqueCapabilities(manager: AppManagerService): string[] {
  return [...new Set(
    manager.listEffectiveServiceProviders().map(provider => provider.capability)
  )].sort();
}

export function createProviderManagerExperienceManifest(manager: AppManagerService) {
  const capabilities = uniqueCapabilities(manager);
  return {
    contractVersion: "0.1.0",
    experienceId: "evo-provider-manager",
    packageId: "evo-app-platform",
    featureId: "evo-provider-manager.system",
    defaultRoute: "/providers",
    pages: [
      {
        id: "evo-providers.home",
        title: "Providers",
        source: providerManagerIndexPageSource
      },
      ...capabilities.map(capability => ({
        id: `evo-providers.${capability}`,
        title: capability,
        source: providerManagerCapabilityPageSource(capability)
      }))
    ],
    routes: [
      {
        id: "evo-providers.home",
        path: "/providers",
        pageId: "evo-providers.home"
      },
      ...capabilities.map(capability => ({
        id: `evo-providers.${capability}`,
        path: providerManagerCapabilityRoute(capability),
        pageId: `evo-providers.${capability}`
      }))
    ]
  } as const;
}

export function createProviderManagerIndexPage(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry,
  bindings: ProviderBindingStoreV010,
  context: ProviderResolutionContextV010 = { installationId: "default" }
): CatalogBrowserV010 {
  const descriptors = manager.listEffectiveServiceProviders();
  const capabilities = [...new Set(descriptors.map(provider => provider.capability))].sort();

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.providers",
    title: "Provider Bindings",
    description: "Choose which installed Provider implements each platform capability. Explicit scope bindings are deterministic and never silently fail over.",
    emptyMessage: "No active platform Providers are available.",
    items: capabilities.map(capability => {
      const candidates = descriptors.filter(provider => provider.capability === capability);
      const healthSummary = candidates
        .map(provider => `${provider.providerId}: ${registry.getHealth(provider.providerId).state.toLowerCase()}`)
        .join(" · ");

      let resolution = "Unresolved";
      try {
        const resolved = resolveProviderRuntimeV010<unknown>(
          registry,
          candidates,
          bindings,
          capability,
          context
        );
        resolution = resolved
          ? `${resolved.providerId} · ${resolved.source.toLowerCase()} · ${resolved.health.state.toLowerCase()}`
          : "No executable Provider runtime";
      } catch (error) {
        resolution = error instanceof Error ? error.message : String(error);
      }

      return {
        id: capability,
        title: capability,
        category: "PLATFORM_PROVIDER",
        summary: `${candidates.length} candidate(s) · ${bindings.list(capability).length} binding(s) · ${resolution} · ${healthSummary}`,
        primaryAction: {
          id: "configure",
          label: "Configure",
          type: "navigate",
          route: providerManagerCapabilityRoute(capability)
        }
      };
    })
  };
}

function chosenBinding(
  bindings: ProviderBindingStoreV010,
  capability: string
) {
  const values = bindings.list(capability);
  return values.find(binding => binding.scope === "SYSTEM") ?? values[0];
}

export function createProviderBindingPage(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry,
  bindings: ProviderBindingStoreV010,
  capability: string,
  context: ProviderResolutionContextV010 = { installationId: "default" }
): SettingsEditorV020 | undefined {
  const descriptors = manager.listEffectiveServiceProviders(capability);
  if (descriptors.length === 0) return undefined;

  const existing = chosenBinding(bindings, capability);
  const providerIds = [...new Set(descriptors.map(provider => provider.providerId))].sort();
  const selectedProviderId = existing?.providerId ?? providerIds[0]!;
  const health = registry.getHealth(selectedProviderId);
  const packageNameById = new Map(
    manager.listCatalog().map(pkg => [pkg.packageId, pkg.displayName] as const)
  );
  const providerDisplayName = (providerId: string): string => {
    const descriptor = descriptors.find(item => item.providerId === providerId);
    return descriptor
      ? packageNameById.get(descriptor.packageId) ?? descriptor.providerId
      : providerId;
  };
  const humanFacingLlm = capability === "llm.inference";

  let resolution = "Unresolved";
  try {
    const resolved = resolveProviderRuntimeV010<unknown>(
      registry,
      descriptors,
      bindings,
      capability,
      context
    );
    resolution = resolved
      ? `${resolved.providerId} · ${resolved.source} · ${resolved.health.state}`
      : "No executable Provider runtime";
  } catch (error) {
    resolution = error instanceof Error ? error.message : String(error);
  }

  const scopes: ActivationScope[] = [
    "SYSTEM",
    "INSTALLATION",
    "ENTERPRISE",
    "COMPANY",
    "WORKSPACE",
    "USER"
  ];

  const healthTone = health.state === "HEALTHY"
    ? "success" as const
    : health.state === "DEGRADED"
      ? "warning" as const
      : "danger" as const;

  return {
    contractVersion: "0.2.0",
    kind: "settings-editor",
    id: `evo-provider-binding.${capability}`,
    namespace: `provider-binding:${capability}`,
    title: humanFacingLlm ? "AI service" : `Provider · ${capability}`,
    description: humanFacingLlm
      ? "Choose the installed AI service Personal Agent should use. Advanced scope and runtime details are available when needed."
      : "Choose the Provider for this capability and govern where the binding applies. Runtime status remains read-only.",
    notice: {
      tone: healthTone,
      title: humanFacingLlm ? "Connection status" : "Provider status",
      message: humanFacingLlm
        ? `${providerDisplayName(selectedProviderId)} · ${health.state === "HEALTHY" ? "Available" : health.state === "DEGRADED" ? "Needs attention" : "Unavailable"}`
        : `${selectedProviderId} · ${health.state.toLowerCase()}${health.message ? ` · ${health.message}` : ""}`
    },
    command: {
      code: "app-platform.update-provider-binding",
      inputVersion: "0.1.0"
    },
    groups: [
      {
        id: "selection",
        title: humanFacingLlm ? "AI service" : "Provider selection",
        description: humanFacingLlm
          ? "Choose the service Personal Agent should use."
          : "Select the installed Provider that should implement this capability.",
        settings: [{
          key: "providerId",
          label: humanFacingLlm ? "Service" : "Provider",
          description: humanFacingLlm
            ? "The AI service Personal Agent will use."
            : "Installed Provider selected for this binding.",
          type: "select",
          value: selectedProviderId,
          options: providerIds.map(providerId => {
            const state = registry.getHealth(providerId).state;
            return {
              label: humanFacingLlm
                ? `${providerDisplayName(providerId)} · ${state === "HEALTHY" ? "Available" : state === "DEGRADED" ? "Needs attention" : "Unavailable"}`
                : `${providerId} · ${state.toLowerCase()}`,
              value: providerId
            };
          })
        }]
      },
      {
        id: "scope",
        title: "Binding scope",
        advanced: true,
        description: "More specific scopes override broader scopes. Priority only breaks ties at the same specificity.",
        settings: [
          {
            key: "scope",
            label: "Scope",
            description: "Binding scope. More specific scopes override broader scopes.",
            type: "select",
            value: existing?.scope ?? "SYSTEM",
            options: scopes.map(scope => ({ label: scope, value: scope }))
          },
          {
            key: "scopeId",
            label: "Scope ID",
            description: "Required for INSTALLATION, ENTERPRISE, COMPANY, WORKSPACE and USER. Leave blank for SYSTEM.",
            type: "string",
            value: existing?.scopeId ?? ""
          },
          {
            key: "priority",
            label: "Priority",
            description: "Tie-breaker only within the same scope specificity.",
            type: "number",
            value: existing?.priority ?? 0
          }
        ]
      },
      {
        id: "runtime-status",
        title: "Runtime status",
        advanced: true,
        description: "Host-observed resolution and health for the currently selected Provider.",
        settings: [
          {
            key: "currentResolution",
            label: "Current resolution",
            type: "string",
            value: resolution,
            readOnly: true,
            status: {
              label: resolution === "Unresolved" ? "Unresolved" : "Resolved",
              tone: resolution === "Unresolved" ? "warning" as const : "positive" as const
            }
          },
          {
            key: "selectedHealth",
            label: "Selected runtime health",
            type: "string",
            value: `${health.state}${health.message ? ` · ${health.message}` : ""}${health.checkedAt ? ` · checked ${health.checkedAt}` : ""}`,
            readOnly: true,
            status: {
              label: health.state,
              tone: health.state === "HEALTHY"
                ? "positive" as const
                : health.state === "DEGRADED"
                  ? "warning" as const
                  : "danger" as const
            }
          }
        ]
      },
      {
        id: "administration",
        title: "Administration",
        description: "Authorization used only when changing a protected Provider binding.",
        advanced: true,
        settings: [{
          key: "adminToken",
          label: "Administrator authorization",
          description: "Host bootstrap credential used only to authenticate the administrator principal. Authorization is decided by the active authorization.check Provider. The credential is never persisted in Provider binding state or audit history.",
          type: "secret",
          value: ""
        }]
      }
    ],
    saveLabel: humanFacingLlm ? "Save choice" : "Save binding"
  };
}
