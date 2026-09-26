import type { AppManagerService } from "../manager/service.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import type { ProviderBindingStoreV010 } from "../manager/provider-resolution.js";
import { resolveProviderRuntimeV010 } from "../manager/provider-resolution.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import { settingsPackageRoute } from "../manager/settings-page.js";

export type PersonalAgentReadinessStateV010 =
  | "READY"
  | "SETUP_REQUIRED"
  | "UNAVAILABLE";

export type PersonalAgentReadinessCodeV010 =
  | "READY"
  | "NO_PROVIDER_INSTALLED"
  | "PROVIDER_NOT_ACTIVE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_AMBIGUOUS"
  | "PROVIDER_UNAVAILABLE";

export interface PersonalAgentProviderCandidateV010 {
  packageId: string;
  displayName: string;
  providerIds: string[];
  installed: boolean;
  active: boolean;
  runtimeReady: boolean;
  settingsRoute?: string;
}

export interface PersonalAgentReadinessV010 {
  contractVersion: "0.1.0";
  state: PersonalAgentReadinessStateV010;
  code: PersonalAgentReadinessCodeV010;
  message: string;
  providerId?: string;
  providerPackageId?: string;
  candidates: PersonalAgentProviderCandidateV010[];
}

function candidatePackages(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry
): PersonalAgentProviderCandidateV010[] {
  const snapshot = manager.getSnapshot();
  const installed = new Set(snapshot.installedPackages.map(item => item.packageId));
  const active = new Set(snapshot.activeFeatures.map(item => item.packageId));
  return manager.listCatalog()
    .map(pkg => {
      const providerIds = pkg.features.flatMap(feature =>
        (feature.contributions ?? [])
          .filter(contribution =>
            contribution.kind === "platform.service-provider"
            && contribution.provider.capability === "llm.inference"
          )
          .map(contribution => contribution.kind === "platform.service-provider"
            ? contribution.provider.providerId
            : "")
      ).filter(Boolean);
      if (providerIds.length === 0) return undefined;
      return {
        packageId: pkg.packageId,
        displayName: pkg.displayName,
        providerIds: [...new Set(providerIds)].sort(),
        installed: installed.has(pkg.packageId),
        active: active.has(pkg.packageId),
        runtimeReady: providerIds.some(id => registry.has(id)),
        settingsRoute: settingsPackageRoute(pkg.packageId)
      } satisfies PersonalAgentProviderCandidateV010;
    })
    .filter((item): item is PersonalAgentProviderCandidateV010 => item !== undefined)
    .sort((a, b) => a.packageId.localeCompare(b.packageId));
}

export function evaluatePersonalAgentReadinessV010(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry,
  bindings: ProviderBindingStoreV010
): PersonalAgentReadinessV010 {
  const candidates = candidatePackages(manager, registry);
  const installedCandidates = candidates.filter(item => item.installed);
  const activeDescriptors = manager.listEffectiveServiceProviders("llm.inference");

  if (installedCandidates.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "SETUP_REQUIRED",
      code: "NO_PROVIDER_INSTALLED",
      message: "Install an LLM Provider to use Personal Agent.",
      candidates
    };
  }

  if (activeDescriptors.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "SETUP_REQUIRED",
      code: "PROVIDER_NOT_ACTIVE",
      message: "An LLM Provider is installed but not active.",
      candidates
    };
  }

  const runtimeCandidates = activeDescriptors
    .filter(descriptor => registry.has(descriptor.providerId));

  if (runtimeCandidates.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "SETUP_REQUIRED",
      code: "PROVIDER_NOT_CONFIGURED",
      message: "The installed LLM Provider needs credentials or runtime configuration.",
      candidates
    };
  }

  try {
    const resolved = resolveProviderRuntimeV010<LlmInferenceProvider>(
      registry,
      activeDescriptors,
      bindings,
      "llm.inference",
      { installationId: "default" }
    );
    if (!resolved) {
      return {
        contractVersion: "0.1.0",
        state: "SETUP_REQUIRED",
        code: "PROVIDER_NOT_CONFIGURED",
        message: "No usable LLM Provider runtime is available.",
        candidates
      };
    }

    const owner = activeDescriptors.find(item => item.providerId === resolved.providerId);
    if (resolved.health.state === "UNAVAILABLE") {
      return {
        contractVersion: "0.1.0",
        state: "UNAVAILABLE",
        code: "PROVIDER_UNAVAILABLE",
        message: resolved.health.message ?? "The selected LLM Provider is unavailable.",
        providerId: resolved.providerId,
        ...(owner ? { providerPackageId: owner.packageId } : {}),
        candidates
      };
    }

    return {
      contractVersion: "0.1.0",
      state: "READY",
      code: "READY",
      message: "Personal Agent is ready.",
      providerId: resolved.providerId,
      ...(owner ? { providerPackageId: owner.packageId } : {}),
      candidates
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("PROVIDER_RESOLUTION_AMBIGUOUS")) {
      return {
        contractVersion: "0.1.0",
        state: "SETUP_REQUIRED",
        code: "PROVIDER_AMBIGUOUS",
        message: "Choose which LLM Provider Personal Agent should use.",
        candidates
      };
    }
    return {
      contractVersion: "0.1.0",
      state: "UNAVAILABLE",
      code: "PROVIDER_UNAVAILABLE",
      message,
      candidates
    };
  }
}
