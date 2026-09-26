import type {
  PackageManifestV010,
  PlatformSnapshotV010
} from "../../contracts/package.js";
import type { ProviderRuntimeHealthV010 } from "../../providers/runtime-registry.js";
import { providerManagerCapabilityRoute } from "../../manager/provider-manager-page.js";
import { settingsPackageRoute } from "../../manager/settings-page.js";
import {
  ENTERPRISE_AGENT_PAGE_SOURCE,
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
} from "./package.js";

export const PERSONAL_AGENT_ROUTE = "/enterprise-agent";
export const PERSONAL_AGENT_SETUP_ROUTE = "/enterprise-agent/setup";

export type PersonalAgentReadinessStateV010 =
  | "READY"
  | "SETUP_REQUIRED"
  | "UNAVAILABLE";

export type PersonalAgentReadinessReasonV010 =
  | "READY"
  | "LLM_PROVIDER_REQUIRED"
  | "LLM_PROVIDER_CONFIGURATION_REQUIRED"
  | "LLM_PROVIDER_SELECTION_REQUIRED"
  | "LLM_PROVIDER_UNAVAILABLE";

export interface PersonalAgentProviderCandidateV010 {
  packageId: string;
  displayName: string;
  installed: boolean;
  providerId?: string;
  configureRoute: string;
}

export interface PersonalAgentReadinessV010 {
  contractVersion: "0.1.0";
  state: PersonalAgentReadinessStateV010;
  reason: PersonalAgentReadinessReasonV010;
  providerCandidates: PersonalAgentProviderCandidateV010[];
  selectedProviderId?: string;
  selectedProviderPackageId?: string;
  selectedProviderHealth?: ProviderRuntimeHealthV010;
}

export interface EffectiveLlmProviderV010 {
  providerId: string;
  packageId: string;
  capability: string;
}

export interface ResolvedLlmProviderV010 {
  providerId: string;
  health: ProviderRuntimeHealthV010;
}

function packageProvidesLlmInference(pkg: PackageManifestV010): boolean {
  return pkg.features.some(feature =>
    (feature.providesCapabilities ?? []).includes("llm.inference")
  );
}

export function evaluatePersonalAgentReadinessV010(input: {
  catalog: PackageManifestV010[];
  snapshot: PlatformSnapshotV010;
  effectiveProviders: EffectiveLlmProviderV010[];
  resolveProvider(): ResolvedLlmProviderV010 | undefined;
}): PersonalAgentReadinessV010 {
  const installed = new Set(input.snapshot.installedPackages.map(item => item.packageId));
  const providerByPackage = new Map(
    input.effectiveProviders.map(provider => [provider.packageId, provider])
  );
  const providerCandidates = input.catalog
    .filter(packageProvidesLlmInference)
    .map(pkg => ({
      packageId: pkg.packageId,
      displayName: pkg.displayName,
      installed: installed.has(pkg.packageId),
      ...(providerByPackage.get(pkg.packageId)
        ? { providerId: providerByPackage.get(pkg.packageId)!.providerId }
        : {}),
      configureRoute: settingsPackageRoute(pkg.packageId)
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  if (input.effectiveProviders.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "SETUP_REQUIRED",
      reason: "LLM_PROVIDER_REQUIRED",
      providerCandidates
    };
  }

  try {
    const resolved = input.resolveProvider();
    if (!resolved) {
      const only = input.effectiveProviders.length === 1
        ? input.effectiveProviders[0]
        : undefined;
      return {
        contractVersion: "0.1.0",
        state: "SETUP_REQUIRED",
        reason: input.effectiveProviders.length > 1
          ? "LLM_PROVIDER_SELECTION_REQUIRED"
          : "LLM_PROVIDER_CONFIGURATION_REQUIRED",
        providerCandidates,
        ...(only ? {
          selectedProviderId: only.providerId,
          selectedProviderPackageId: only.packageId
        } : {})
      };
    }

    const descriptor = input.effectiveProviders.find(
      provider => provider.providerId === resolved.providerId
    );
    return {
      contractVersion: "0.1.0",
      state: "READY",
      reason: "READY",
      providerCandidates,
      selectedProviderId: resolved.providerId,
      ...(descriptor ? { selectedProviderPackageId: descriptor.packageId } : {}),
      selectedProviderHealth: resolved.health
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("PROVIDER_RESOLUTION_AMBIGUOUS:")) {
      return {
        contractVersion: "0.1.0",
        state: "SETUP_REQUIRED",
        reason: "LLM_PROVIDER_SELECTION_REQUIRED",
        providerCandidates
      };
    }
    if (
      message.startsWith("PROVIDER_RUNTIME_UNAVAILABLE:")
      || message.startsWith("PROVIDER_CANDIDATE_UNHEALTHY:")
      || message.startsWith("PROVIDER_BINDING_UNHEALTHY:")
      || message.startsWith("PROVIDER_BINDING_UNAVAILABLE:")
    ) {
      return {
        contractVersion: "0.1.0",
        state: "UNAVAILABLE",
        reason: "LLM_PROVIDER_UNAVAILABLE",
        providerCandidates
      };
    }
    throw error;
  }
}

function readinessCopy(readiness: PersonalAgentReadinessV010) {
  return structuredClone(readiness);
}

export function createPersonalAgentChatExperienceV020(
  readiness: PersonalAgentReadinessV010,
  contextLabel = "Context",
  contextValue = "Personal"
) {
  const ready = readiness.state === "READY";
  return {
    contractVersion: "0.2.0" as const,
    kind: "chat" as const,
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    context: {
      label: contextLabel,
      value: contextValue
    },
    readiness: ready
      ? {
          state: "ready" as const,
          label: "Ready"
        }
      : {
          state: readiness.state === "UNAVAILABLE" ? "unavailable" as const : "setup-required" as const,
          label: readiness.state === "UNAVAILABLE"
            ? "Provider unavailable"
            : "Needs setup",
          message: readiness.reason === "LLM_PROVIDER_REQUIRED"
            ? "Install and configure an LLM Provider before using Personal Agent."
            : readiness.reason === "LLM_PROVIDER_SELECTION_REQUIRED"
              ? "Choose which LLM Provider Personal Agent should use."
              : readiness.reason === "LLM_PROVIDER_CONFIGURATION_REQUIRED"
                ? "The installed LLM Provider still needs credentials or runtime configuration."
                : "The selected LLM Provider is currently unavailable.",
          action: {
            id: "setup",
            label: "Set up",
            type: "navigate" as const,
            route: PERSONAL_AGENT_SETUP_ROUTE
          }
        },
    composer: {
      key: "message",
      placeholder: "Ask or describe a task",
      sendLabel: "Send",
      disabled: !ready
    },
    emptyState: {
      title: "How can I help?",
      description: "I can inspect your current Context, explain what is happening, and prepare an opinion or plan.",
      suggestions: [
        {
          id: "attention",
          label: "What needs my attention?",
          prompt: "What needs my attention?"
        },
        {
          id: "apps",
          label: "Show available apps",
          prompt: "Show me the apps and capabilities available in my current Context."
        },
        {
          id: "workspace",
          label: "Explain this workspace",
          prompt: "Explain this workspace and what I can do here."
        }
      ]
    },
    metadata: {
      packageId: "enterprise-agent",
      featureId: "enterprise-agent.default",
      readiness: readinessCopy(readiness),
      source: ENTERPRISE_AGENT_PAGE_SOURCE
    }
  };
}

function providerStep(readiness: PersonalAgentReadinessV010) {
  if (readiness.state === "READY" || readiness.reason === "LLM_PROVIDER_CONFIGURATION_REQUIRED") {
    const selected = readiness.providerCandidates.find(
      candidate => candidate.packageId === readiness.selectedProviderPackageId
    );
    return {
      id: "provider",
      title: "LLM Provider",
      description: selected
        ? selected.displayName
        : "A Provider is installed for llm.inference.",
      state: "complete" as const,
      statusDetail: "Complete"
    };
  }

  if (readiness.reason === "LLM_PROVIDER_SELECTION_REQUIRED") {
    return {
      id: "provider",
      title: "LLM Provider",
      description: "Choose which installed Provider Personal Agent should use.",
      state: "current" as const,
      statusDetail: "Required",
      primaryAction: {
        id: "choose-provider",
        label: "Choose Provider",
        type: "navigate" as const,
        route: providerManagerCapabilityRoute("llm.inference"),
        primary: true
      }
    };
  }

  if (readiness.reason === "LLM_PROVIDER_REQUIRED") {
    const names = readiness.providerCandidates.map(candidate => candidate.displayName).join(", ");
    return {
      id: "provider",
      title: "LLM Provider",
      description: names
        ? `Install an LLM Provider. Available: ${names}.`
        : "Install a Package that provides llm.inference.",
      state: "current" as const,
      statusDetail: "Required",
      primaryAction: {
        id: "browse-providers",
        label: "Browse Providers",
        type: "navigate" as const,
        route: "/store",
        primary: true
      }
    };
  }

  return {
    id: "provider",
    title: "LLM Provider",
    description: "The selected Provider is unavailable.",
    state: "error" as const,
    statusDetail: "Unavailable",
    primaryAction: {
      id: "manage-provider",
      label: "Manage Provider",
      type: "navigate" as const,
      route: providerManagerCapabilityRoute("llm.inference"),
      primary: true
    }
  };
}

export function createPersonalAgentSetupFlowV010(
  readiness: PersonalAgentReadinessV010
) {
  const selected = readiness.providerCandidates.find(
    candidate => candidate.packageId === readiness.selectedProviderPackageId
  );
  const ready = readiness.state === "READY";
  const needsConfig = readiness.reason === "LLM_PROVIDER_CONFIGURATION_REQUIRED";

  return {
    contractVersion: "0.1.0" as const,
    kind: "setup-flow" as const,
    id: "personal-agent.setup",
    title: "Personal Agent setup",
    description: "Connect Personal Agent to an LLM Provider without putting vendor credentials inside the Agent.",
    steps: [
      providerStep(readiness),
      {
        id: "credentials",
        title: "Provider credentials",
        description: ready
          ? "Provider credentials and runtime configuration are available."
          : needsConfig
            ? "Configure the selected Provider. Credentials remain in Host Secrets."
            : "Waiting for an LLM Provider.",
        state: ready
          ? "complete" as const
          : needsConfig
            ? "current" as const
            : "pending" as const,
        statusDetail: ready
          ? "Complete"
          : needsConfig
            ? "Required"
            : "Waiting",
        ...(needsConfig && selected ? {
          primaryAction: {
            id: "configure-provider",
            label: "Configure Provider",
            type: "navigate" as const,
            route: selected.configureRoute,
            primary: true
          }
        } : {})
      },
      {
        id: "readiness",
        title: "Provider readiness",
        description: ready
          ? "The Provider can be resolved for llm.inference."
          : "Readiness is checked after Provider installation and configuration.",
        state: ready ? "complete" as const : "pending" as const,
        statusDetail: ready ? "Complete" : "Waiting"
      },
      {
        id: "ready",
        title: "Personal Agent",
        description: ready
          ? "Personal Agent is ready to work in the current Context."
          : "Personal Agent becomes available when Provider setup is complete.",
        state: ready ? "complete" as const : "pending" as const,
        statusDetail: ready ? "Ready" : "Waiting"
      }
    ],
    ...(ready ? {
      completionAction: {
        id: "open-agent",
        label: "Open Personal Agent",
        type: "navigate" as const,
        route: PERSONAL_AGENT_ROUTE,
        primary: true
      }
    } : {})
  };
}

export const personalAgentSetupPageSource = ENTERPRISE_AGENT_SETUP_PAGE_SOURCE;
