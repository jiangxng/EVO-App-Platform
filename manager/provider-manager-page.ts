import type { AppManagerService } from "./service.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import type {
  ProviderBindingStoreV010,
  ProviderResolutionContextV010
} from "./provider-resolution.js";
import { resolveProviderRuntimeV010 } from "./provider-resolution.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { SettingsEditorV010 } from "../vendor/eidos/src/settings/contracts.js";
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
): SettingsEditorV010 | undefined {
  const descriptors = manager.listEffectiveServiceProviders(capability);
  if (descriptors.length === 0) return undefined;

  const existing = chosenBinding(bindings, capability);
  const providerIds = [...new Set(descriptors.map(provider => provider.providerId))].sort();
  const selectedProviderId = existing?.providerId ?? providerIds[0]!;
  const health = registry.getHealth(selectedProviderId);

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

  return {
    contractVersion: "0.1.0",
    kind: "settings-editor",
    id: `evo-provider-binding.${capability}`,
    namespace: `provider-binding:${capability}`,
    title: `Provider · ${capability}`,
    description: "Save an explicit binding for this capability. More specific scopes override broader scopes. Empty SYSTEM scopeId is valid; other scopes require an id.",
    command: {
      code: "app-platform.update-provider-binding",
      inputVersion: "0.1.0"
    },
    settings: [
      {
        key: "providerId",
        label: "Provider",
        description: "Installed Provider selected for this binding.",
        type: "select",
        value: selectedProviderId,
        options: providerIds.map(providerId => ({
          label: `${providerId} · ${registry.getHealth(providerId).state.toLowerCase()}`,
          value: providerId
        }))
      },
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
      },
      {
        key: "adminToken",
        label: "Administrator authorization",
        description: "Host bootstrap credential used only to authenticate the administrator principal. Authorization is decided by the active authorization.check Provider. The credential is never persisted in Provider binding state or audit history.",
        type: "secret",
        value: ""
      },
      {
        key: "currentResolution",
        label: "Current resolution",
        type: "string",
        value: resolution,
        readOnly: true
      },
      {
        key: "selectedHealth",
        label: "Selected runtime health",
        type: "string",
        value: `${health.state}${health.message ? ` · ${health.message}` : ""}${health.checkedAt ? ` · checked ${health.checkedAt}` : ""}`,
        readOnly: true
      }
    ],
    saveLabel: "Save binding"
  };
}
