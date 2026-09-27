import type { AppManagerService } from "./service.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import {
  resolveProviderRuntimeV010,
  type ProviderBindingStoreV010
} from "./provider-resolution.js";
import type { ChatExperienceV020 } from "../vendor/eidos/src/chat/contracts.js";
import type {
  ActiveContextRefV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import type { SetupFlowV010 } from "../vendor/eidos/src/setup-flow/contracts.js";
import type { ExtensionManagerItemV010, ExtensionManagerActionV010 } from "../vendor/eidos/src/extension-manager/contracts.js";
import type { ReviewQueueV010 } from "../vendor/eidos/src/review-queue/contracts.js";
import type { ContextMemoryProposalV010 } from "./context-memory-proposal-store.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID,
  ENTERPRISE_AGENT_PAGE_SOURCE,
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE,
  ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE
} from "../agents/enterprise-agent/package.js";
import { providerManagerCapabilityRoute } from "./provider-manager-page.js";
import { settingsPackageRoute } from "./settings-page.js";

export const PERSONAL_AGENT_ROUTE = "/enterprise-agent";
export const PERSONAL_AGENT_SETUP_ROUTE = "/enterprise-agent/setup";
export const PERSONAL_AGENT_MEMORY_REVIEW_ROUTE = "/enterprise-agent/memory";
const LLM_CAPABILITY = "llm.inference";

export type PersonalAgentReadinessStateV010 =
  | "ready"
  | "setup-required"
  | "degraded"
  | "unavailable";

export interface PersonalAgentReadinessV010 {
  contractVersion: "0.1.0";
  state: PersonalAgentReadinessStateV010;
  code:
    | "READY"
    | "LLM_PROVIDER_REQUIRED"
    | "LLM_PROVIDER_CONFIGURATION_REQUIRED"
    | "LLM_PROVIDER_SELECTION_REQUIRED"
    | "LLM_PROVIDER_DEGRADED"
    | "LLM_PROVIDER_UNAVAILABLE";
  message: string;
  active: boolean;
  providerId?: string;
  providerPackageId?: string;
  installedProviderPackageIds: string[];
  catalogProviderPackageIds: string[];
}


export interface PersonalAgentPluginStoreProductStateV010 {
  readiness: NonNullable<ExtensionManagerItemV010["readiness"]>;
  primaryAction: ExtensionManagerActionV010;
}

export function createPersonalAgentPluginStoreProductStateV010(
  readiness: PersonalAgentReadinessV010
): PersonalAgentPluginStoreProductStateV010 {
  const readinessId = readiness.state === "unavailable"
    ? "error"
    : readiness.state;
  return {
    readiness: {
      id: readinessId,
      label: readiness.state === "ready"
        ? "Ready"
        : readiness.state === "setup-required"
          ? "Needs setup"
          : readiness.state === "degraded"
            ? "Degraded"
            : "Unavailable",
      tone: readiness.state === "ready"
        ? "positive"
        : readiness.state === "unavailable"
          ? "danger"
          : "warning",
      message: readiness.message
    },
    primaryAction: readiness.state === "ready" || readiness.state === "degraded"
      ? {
          id: "open",
          label: "Open",
          type: "navigate",
          route: PERSONAL_AGENT_ROUTE
        }
      : {
          id: "setup",
          label: "Set up",
          type: "navigate",
          route: PERSONAL_AGENT_SETUP_ROUTE
        }
  };
}

function providerPackagesInCatalog(manager: AppManagerService): string[] {
  const ids = new Set<string>();
  for (const pkg of manager.listCatalog()) {
    for (const feature of pkg.features) {
      for (const contribution of feature.contributions ?? []) {
        if (
          contribution.kind === "platform.service-provider"
          && contribution.provider.capability === LLM_CAPABILITY
        ) {
          ids.add(pkg.packageId);
        }
      }
    }
  }
  return [...ids].sort();
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split(":")[0]?.trim() ?? "PROVIDER_RESOLUTION_FAILED";
}

export function evaluatePersonalAgentReadinessV010(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry,
  bindings: ProviderBindingStoreV010
): PersonalAgentReadinessV010 {
  const active = manager.getSnapshot().activeFeatures.some(
    feature => feature.featureId === ENTERPRISE_AGENT_FEATURE_ID
  );
  const descriptors = manager.listEffectiveServiceProviders(LLM_CAPABILITY);
  const installedProviderPackageIds = [...new Set(descriptors.map(item => item.packageId))].sort();
  const catalogProviderPackageIds = providerPackagesInCatalog(manager);

  if (!active) {
    return {
      contractVersion: "0.1.0",
      state: "unavailable",
      code: "LLM_PROVIDER_UNAVAILABLE",
      message: "Personal Agent is not active.",
      active,
      installedProviderPackageIds,
      catalogProviderPackageIds
    };
  }

  if (descriptors.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "setup-required",
      code: "LLM_PROVIDER_REQUIRED",
      message: "Install and configure an LLM Provider before using Personal Agent.",
      active,
      installedProviderPackageIds,
      catalogProviderPackageIds
    };
  }

  try {
    const resolved = resolveProviderRuntimeV010<unknown>(
      registry,
      descriptors,
      bindings,
      LLM_CAPABILITY,
      { installationId: "default" }
    );

    if (!resolved) {
      return {
        contractVersion: "0.1.0",
        state: "setup-required",
        code: "LLM_PROVIDER_CONFIGURATION_REQUIRED",
        message: "The installed LLM Provider still needs credentials or runtime configuration.",
        active,
        ...(installedProviderPackageIds.length === 1
          ? { providerPackageId: installedProviderPackageIds[0] }
          : {}),
        installedProviderPackageIds,
        catalogProviderPackageIds
      };
    }

    const providerPackageId = descriptors.find(
      item => item.providerId === resolved.providerId
    )?.packageId;

    if (resolved.health.state === "DEGRADED") {
      return {
        contractVersion: "0.1.0",
        state: "degraded",
        code: "LLM_PROVIDER_DEGRADED",
        message: resolved.health.message ?? "The selected LLM Provider is degraded.",
        active,
        providerId: resolved.providerId,
        ...(providerPackageId ? { providerPackageId } : {}),
        installedProviderPackageIds,
        catalogProviderPackageIds
      };
    }

    return {
      contractVersion: "0.1.0",
      state: "ready",
      code: "READY",
      message: "Personal Agent is ready.",
      active,
      providerId: resolved.providerId,
      ...(providerPackageId ? { providerPackageId } : {}),
      installedProviderPackageIds,
      catalogProviderPackageIds
    };
  } catch (error) {
    const code = errorCode(error);
    if (
      code === "PROVIDER_RESOLUTION_AMBIGUOUS"
      || code === "PROVIDER_BINDING_UNAVAILABLE"
    ) {
      return {
        contractVersion: "0.1.0",
        state: "setup-required",
        code: "LLM_PROVIDER_SELECTION_REQUIRED",
        message: "Choose which installed LLM Provider Personal Agent should use.",
        active,
        installedProviderPackageIds,
        catalogProviderPackageIds
      };
    }
    return {
      contractVersion: "0.1.0",
      state: "unavailable",
      code: "LLM_PROVIDER_UNAVAILABLE",
      message: error instanceof Error ? error.message : "The selected LLM Provider is unavailable.",
      active,
      installedProviderPackageIds,
      catalogProviderPackageIds
    };
  }
}

export interface PersonalAgentContextOptionV010 {
  ref: ActiveContextRefV010;
  label: string;
}

export function createPersonalAgentChatPageV020(
  readiness: PersonalAgentReadinessV010,
  context: ResolvedContextSetV010,
  availableContexts: readonly PersonalAgentContextOptionV010[]
): ChatExperienceV020 {
  const contextLabel = context.activeContext.kind === "PERSONAL"
    ? context.personalContext.displayName ?? context.activeContext.contextId
    : context.enterpriseContext?.displayName ?? context.activeContext.contextId;
  return {
    contractVersion: "0.2.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    composer: {
      key: "message",
      placeholder: "Ask or describe a task",
      sendLabel: "Send",
      disabled: readiness.state !== "ready" && readiness.state !== "degraded"
    },
    context: {
      label: "Current context",
      value: contextLabel,
      selector: {
        key: "activeContext",
        ariaLabel: "Choose context",
        selectedId: context.activeContext.contextId,
        options: availableContexts.map(item => ({
          id: item.ref.contextId,
          label: item.label,
          value: structuredClone(item.ref)
        }))
      }
    },
    readiness: {
      state: readiness.state,
      label: readiness.state === "ready"
        ? "Ready"
        : readiness.state === "setup-required"
          ? "Needs setup"
          : readiness.state === "degraded"
            ? "Degraded"
            : "Unavailable",
      message: readiness.message,
      ...(readiness.state === "ready"
        ? {}
        : {
            action: {
              id: "open-setup",
              label: "Open setup",
              type: "navigate",
              route: PERSONAL_AGENT_SETUP_ROUTE,
              primary: true
            } as const
          })
    },
    emptyState: {
      title: "How can I help?",
      description: "I can inspect your available apps and Context, explain what is happening, and prepare an opinion or plan.",
      suggestions: [
        {
          id: "attention",
          label: "What needs my attention?",
          prompt: "What needs my attention right now?"
        },
        {
          id: "context",
          label: "Explain my current context",
          prompt: "Explain my current context and what you can access."
        }
      ]
    },
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      pageSource: ENTERPRISE_AGENT_PAGE_SOURCE,
      readinessCode: readiness.code
    }
  };
}

export function createPersonalAgentSetupPageV010(
  readiness: PersonalAgentReadinessV010
): SetupFlowV010 {
  const selectedPackageId = readiness.providerPackageId
    ?? (readiness.installedProviderPackageIds.length === 1
      ? readiness.installedProviderPackageIds[0]
      : undefined);

  const providerComplete = readiness.code !== "LLM_PROVIDER_REQUIRED"
    && readiness.code !== "LLM_PROVIDER_SELECTION_REQUIRED";
  const providerCurrent = readiness.code === "LLM_PROVIDER_REQUIRED"
    || readiness.code === "LLM_PROVIDER_SELECTION_REQUIRED";
  const configurationComplete = readiness.state === "ready" || readiness.state === "degraded";
  const configurationCurrent = readiness.code === "LLM_PROVIDER_CONFIGURATION_REQUIRED";
  const readinessComplete = readiness.state === "ready";
  const readinessError = readiness.state === "degraded" || readiness.state === "unavailable";

  return {
    contractVersion: "0.1.0",
    kind: "setup-flow",
    id: "personal-agent.setup",
    title: "Personal Agent setup",
    description: "Complete the required platform-owned Provider steps. Personal Agent does not store Provider credentials.",
    steps: [
      {
        id: "provider",
        title: "LLM Provider",
        description: "Select or install a Provider for llm.inference.",
        state: providerComplete ? "complete" : providerCurrent ? "current" : "pending",
        statusDetail: providerComplete ? "Complete" : "Required",
        ...(!providerComplete
          ? {
              primaryAction: readiness.code === "LLM_PROVIDER_SELECTION_REQUIRED"
                ? {
                    id: "choose-provider",
                    label: "Choose Provider",
                    type: "navigate",
                    route: providerManagerCapabilityRoute(LLM_CAPABILITY)
                  } as const
                : {
                    id: "open-provider-catalog",
                    label: "Open Provider catalog",
                    type: "navigate",
                    route: "/store"
                  } as const
            }
          : {})
      },
      {
        id: "credentials",
        title: "Provider configuration",
        description: "Configure credentials and Provider-owned runtime settings in the Provider Settings surface.",
        state: configurationComplete
          ? "complete"
          : configurationCurrent
            ? "current"
            : providerComplete
              ? "pending"
              : "blocked",
        statusDetail: configurationComplete
          ? "Complete"
          : configurationCurrent
            ? "Required"
            : "Waiting",
        ...(configurationCurrent && selectedPackageId
          ? {
              primaryAction: {
                id: "configure-provider",
                label: "Configure Provider",
                type: "navigate",
                route: settingsPackageRoute(selectedPackageId)
              } as const,
              secondaryActions: [{
                id: "provider-status",
                label: "Provider status",
                type: "navigate",
                route: providerManagerCapabilityRoute(LLM_CAPABILITY)
              }] as const
            }
          : {})
      },
      {
        id: "readiness",
        title: "Provider readiness",
        description: "The Host verifies that Provider resolution and runtime readiness are usable.",
        state: readinessComplete
          ? "complete"
          : readinessError
            ? "error"
            : configurationComplete
              ? "current"
              : "blocked",
        statusDetail: readinessComplete
          ? "Complete"
          : readinessError
            ? "Attention required"
            : "Waiting",
        ...(!readinessComplete
          ? {
              primaryAction: {
                id: "check-provider-status",
                label: "Check Provider status",
                type: "navigate",
                route: providerManagerCapabilityRoute(LLM_CAPABILITY)
              } as const,
              secondaryActions: [{
                id: "recheck-setup",
                label: "Recheck setup",
                type: "navigate",
                route: PERSONAL_AGENT_SETUP_ROUTE
              }] as const
            }
          : {})
      },
      {
        id: "ready",
        title: "Ready",
        description: "Personal Agent can now use the selected LLM Provider.",
        state: readinessComplete ? "complete" : "blocked",
        statusDetail: readinessComplete ? "Complete" : "Waiting",
        ...(readinessComplete
          ? {
              secondaryActions: [
                {
                  id: "review-memory",
                  label: "Review Memory",
                  type: "navigate",
                  route: PERSONAL_AGENT_MEMORY_REVIEW_ROUTE
                },
                {
                  id: "memory-governance",
                  label: "Memory Governance",
                  type: "navigate",
                  route: "/memory"
                },
                {
                  id: "memory-source-health",
                  label: "Memory Source Health",
                  type: "navigate",
                  route: "/memory/sources"
                },
                {
                  id: "agent-quality",
                  label: "Personal Agent Quality",
                  type: "navigate",
                  route: "/enterprise-agent/quality"
                }
              ] as const
            }
          : {})
      }
    ],
    ...(readinessComplete
      ? {
          completionAction: {
            id: "open-agent",
            label: "Open Personal Agent",
            type: "navigate",
            route: PERSONAL_AGENT_ROUTE
          }
        }
      : {})
  };
}

export function createPersonalAgentMemoryReviewPageV010(
  proposals: readonly ContextMemoryProposalV010[],
  contextLabels: ReadonlyMap<string, string>
): ReviewQueueV010 {
  const pending = proposals.filter(item => item.state === "PENDING");
  return {
    contractVersion: "0.1.0",
    kind: "review-queue",
    id: "personal-agent.memory-review",
    title: "Memory review",
    description: "Review, edit, accept or reject proposed durable knowledge before it becomes Context Memory.",
    emptyMessage: "No Memory proposals need review.",
    items: pending.map(proposal => {
      const revision = proposal.revisions.at(-1)!;
      const evidenceSources = revision.evidenceSources ?? [];
      const sourceTrustMetrics = ([
        ["HOST_VERIFIED", "source-trust-host-verified", "Host-verified sources"],
        ["DECLARED", "source-trust-declared", "Declared sources"],
        ["UNVERIFIED", "source-trust-unverified", "Unverified sources"]
      ] as const).flatMap(([trustLevel, id, label]) => {
        const count = evidenceSources.filter(source => source.trustLevel === trustLevel).length;
        return count === 0
          ? []
          : [{
              id,
              label,
              value: String(count),
              tone: trustLevel === "UNVERIFIED" ? "warning" as const : "neutral" as const
            }];
      });
      const attention = revision.reviewSignals.length > 0
        || revision.evidenceQuality === "UNVERIFIED"
        || evidenceSources.some(source => source.trustLevel === "UNVERIFIED");
      return {
        id: proposal.proposalId,
        title: revision.summary,
        state: attention ? "attention" : "pending",
        statusLabel: attention ? "Needs attention" : "Pending",
        metrics: [
          {
            id: "confidence",
            label: "Proposed confidence",
            value: revision.proposedConfidence === undefined
              ? "—"
              : `${Math.round(revision.proposedConfidence * 100)}%`,
            tone: revision.proposedConfidence !== undefined && revision.proposedConfidence < 0.5
              ? "warning"
              : "neutral"
          },
          {
            id: "evidence",
            label: "Evidence refs",
            value: String(revision.evidenceRefs.length),
            tone: revision.evidenceRefs.length === 0 ? "warning" : "neutral"
          },
          ...sourceTrustMetrics,
          {
            id: "conflicts",
            label: "Review signals",
            value: String(revision.reviewSignals.length),
            tone: revision.reviewSignals.length > 0 ? "warning" : "neutral"
          },
          {
            id: "context",
            label: "Context",
            value: contextLabels.get(proposal.context.contextId) ?? proposal.context.contextId
          }
        ],
        fields: [
          {
            key: "kind",
            label: "Kind",
            control: "select",
            value: revision.kind,
            options: [
              { label: "Fact", value: "FACT" },
              { label: "Claim", value: "CLAIM" },
              { label: "Experience", value: "EXPERIENCE" },
              { label: "Practice", value: "PRACTICE" }
            ]
          },
          {
            key: "summary",
            label: "Summary",
            control: "textarea",
            value: revision.summary
          }
        ],
        evidence: [
          ...revision.evidenceRefs.map((ref, index) => ({
            id: `evidence-${index + 1}`,
            title: ref,
            source: revision.evidenceQuality
          })),
          ...evidenceSources.map((source, index) => ({
            id: `evidence-source-${index + 1}`,
            title: source.displayName ?? source.sourceId,
            source: source.sourceType,
            detail: source.sourceId
          })),
          ...revision.reviewSignals.map((signal, index) => ({
            id: `signal-${index + 1}`,
            title: signal.summary,
            source: signal.kind,
            detail: signal.memoryId
          }))
        ],
        primaryAction: {
          id: "accept",
          label: "Accept",
          type: "command",
          command: "context.memory.proposal.accept",
          inputVersion: "0.1.0",
          primary: true,
          requiresConfirmation: true
        },
        secondaryActions: [
          {
            id: "save",
            label: "Save edit",
            type: "command",
            command: "context.memory.proposal.edit",
            inputVersion: "0.1.0"
          },
          {
            id: "reject",
            label: "Reject",
            type: "command",
            command: "context.memory.proposal.reject",
            inputVersion: "0.1.0",
            requiresConfirmation: true
          }
        ],
        metadata: {
          contextId: proposal.context.contextId,
          revisionId: revision.revisionId,
          evidenceQuality: revision.evidenceQuality,
          evidenceSourceCount: evidenceSources.length
        }
      };
    }),
    metadata: {
      route: PERSONAL_AGENT_MEMORY_REVIEW_ROUTE,
      pendingCount: pending.length
    }
  };
}

export function isPersonalAgentPageSource(source: string): boolean {
  return source === ENTERPRISE_AGENT_PAGE_SOURCE
    || source === ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
    || source === ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE;
}
