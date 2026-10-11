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
import type {
  ReviewQueueItemV010,
  ReviewQueueV010
} from "../vendor/eidos/src/review-queue/contracts.js";
import type { ContextMemoryProposalV010 } from "./context-memory-proposal-store.js";
import type {
  ContextMemoryCanonicalizationProposalV010
} from "./context-memory-canonicalization-store.js";
import type { PersonalAgentFollowUpV010 } from "./personal-agent-follow-up-store.js";
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
export const PERSONAL_AGENT_FOLLOW_UP_ROUTE = "/enterprise-agent/follow-ups";
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

export function resolvePersonalAgentActiveContextV010(input: {
  requestedContext?: ActiveContextRefV010;
  defaultEnterpriseContext?: ActiveContextRefV010;
  availableContexts: readonly ActiveContextRefV010[];
}): ActiveContextRefV010 | undefined {
  const enterprises = input.availableContexts.filter(
    context => context.kind === "ENTERPRISE"
  );
  if (enterprises.length > 0) {
    if (input.requestedContext?.kind === "ENTERPRISE") {
      return input.requestedContext;
    }
    if (input.defaultEnterpriseContext?.kind === "ENTERPRISE") {
      return input.defaultEnterpriseContext;
    }
    return enterprises[0];
  }
  return input.requestedContext;
}

export function createPersonalAgentChatPageV020(
  readiness: PersonalAgentReadinessV010,
  context: ResolvedContextSetV010,
  _availableContexts: readonly PersonalAgentContextOptionV010[],
  followUps: readonly PersonalAgentFollowUpV010[] = []
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
      label: context.activeContext.kind === "ENTERPRISE"
        ? "Current enterprise"
        : "Current context",
      value: contextLabel
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
        ...followUps.slice(0, 3).map(item => ({
          id: `follow-up:${item.followUpId}`,
          label: item.title,
          prompt: `Review Personal Agent follow-up '${item.followUpId}'. Use the personal_follow_up_list tool to inspect the Host-provided instruction and related Memory before proposing any next action.`
        })),
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
    title: "Set up Personal Agent",
    description: "Follow these steps to connect an AI service. Only the choices needed to get started are shown here.",
    steps: [
      {
        id: "provider",
        title: "Choose an AI service",
        description: "Select the service Personal Agent will use. If you do not have one installed yet, browse the available AI services.",
        state: providerComplete ? "complete" : providerCurrent ? "current" : "pending",
        statusDetail: providerComplete ? "Complete" : "Choose now",
        ...(!providerComplete
          ? {
              primaryAction: readiness.code === "LLM_PROVIDER_SELECTION_REQUIRED"
                ? {
                    id: "choose-provider",
                    label: "Choose AI service",
                    type: "navigate",
                    route: providerManagerCapabilityRoute(LLM_CAPABILITY),
                    continuation: {
                      onActionId: "settings.save",
                      route: PERSONAL_AGENT_SETUP_ROUTE
                    }
                  } as const
                : {
                    id: "open-provider-catalog",
                    label: "Browse AI services",
                    type: "navigate",
                    route: "/store",
                    continuation: {
                      onActionId: "install",
                      route: PERSONAL_AGENT_SETUP_ROUTE,
                      onItemIds: readiness.catalogProviderPackageIds
                    }
                  } as const
            }
          : {})
      },
      {
        id: "credentials",
        title: "Connect the service",
        description: "Enter the credentials and model settings required by the selected service.",
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
            ? "Connect now"
            : "Waiting",
        ...(configurationCurrent && selectedPackageId
          ? {
              primaryAction: {
                id: "configure-provider",
                label: "Connect service",
                type: "navigate",
                route: settingsPackageRoute(selectedPackageId),
                continuation: {
                  onActionId: "settings.save",
                  route: PERSONAL_AGENT_SETUP_ROUTE
                }
              } as const,
              secondaryActions: [{
                id: "provider-status",
                label: "Connection details",
                type: "navigate",
                route: providerManagerCapabilityRoute(LLM_CAPABILITY)
              }] as const
            }
          : {})
      },
      {
        id: "readiness",
        title: "Check the connection",
        description: "We’ll verify that Personal Agent can reach the selected service and use it.",
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
            ? "Needs attention"
            : configurationComplete
              ? "Check now"
              : "Waiting",
        ...(!readinessComplete
          ? {
              primaryAction: {
                id: "check-provider-status",
                label: "Check connection",
                type: "navigate",
                route: providerManagerCapabilityRoute(LLM_CAPABILITY)
              } as const,
              secondaryActions: [{
                id: "recheck-setup",
                label: "Try again",
                type: "navigate",
                route: PERSONAL_AGENT_SETUP_ROUTE
              }] as const
            }
          : {})
      },
      {
        id: "ready",
        title: "Ready to use",
        description: "Setup is complete. You can start using Personal Agent now.",
        state: readinessComplete ? "complete" : "blocked",
        statusDetail: readinessComplete ? "Complete" : "Waiting"
      }
    ],
    ...(readinessComplete
      ? {
          completionAction: {
            id: "open-agent",
            label: "Start using Personal Agent",
            type: "navigate",
            route: PERSONAL_AGENT_ROUTE
          }
        }
      : {})
  };
}

export function createPersonalAgentMemoryReviewPageV010(
  proposals: readonly ContextMemoryProposalV010[],
  contextLabels: ReadonlyMap<string, string>,
  canonicalizationProposals: readonly ContextMemoryCanonicalizationProposalV010[] = [],
  memorySummaries: ReadonlyMap<string, string> = new Map()
): ReviewQueueV010 {
  const pending = proposals.filter(item => item.state === "PENDING");
  const canonicalizationPending = canonicalizationProposals.filter(
    item => item.state === "PENDING"
  );

  const trustLabel = (trustLevel: "HOST_VERIFIED" | "DECLARED" | "UNVERIFIED"): string =>
    trustLevel === "HOST_VERIFIED"
      ? "Verified source"
      : trustLevel === "DECLARED"
        ? "Declared source"
        : "Unverified source";

  const signalPresentation = (kind: string): {
    localizationKey: string;
    title: string;
  } => {
    if (kind === "POTENTIAL_DUPLICATE") {
      return { localizationKey: "signal-potential-duplicate", title: "Possible duplicate" };
    }
    if (kind === "POTENTIAL_CONTRADICTION") {
      return { localizationKey: "signal-potential-contradiction", title: "Possible contradiction" };
    }
    return { localizationKey: "signal-supersession-candidate", title: "May replace existing Memory" };
  };

  return {
    contractVersion: "0.1.0",
    kind: "review-queue",
    id: "personal-agent.memory-review",
    title: "Memory review",
    description: "Decide which proposed knowledge should become durable Memory. Review signals are suggestions only; you remain in control of every decision.",
    emptyMessage: "No Memory proposals need review.",
    technicalDetailsLabel: "Technical details",
    items: [
      ...pending.map((proposal): ReviewQueueItemV010 => {
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

        const technicalDetails = [
          { key: "proposalId", label: "Proposal ID", value: proposal.proposalId },
          { key: "contextId", label: "Context ID", value: proposal.context.contextId },
          { key: "revisionId", label: "Revision ID", value: revision.revisionId },
          { key: "evidenceQuality", label: "Evidence quality", value: revision.evidenceQuality },
          ...revision.evidenceRefs.map(ref => ({
            key: "evidenceReference",
            label: "Evidence reference",
            value: ref
          })),
          ...evidenceSources.flatMap(source => [
            { key: "sourceId", label: "Source ID", value: source.sourceId },
            { key: "sourceType", label: "Source type", value: source.sourceType },
            { key: "sourceTrust", label: "Source trust", value: source.trustLevel },
            ...(source.trustPolicyId
              ? [{ key: "trustPolicyId", label: "Trust policy ID", value: source.trustPolicyId }]
              : [])
          ]),
          ...revision.reviewSignals.flatMap(signal => [
            { key: "reviewSignal", label: "Review signal", value: signal.kind },
            { key: "relatedMemoryId", label: "Related Memory ID", value: signal.memoryId },
            { key: "signalExplanation", label: "Signal explanation", value: signal.summary }
          ])
        ];

        return {
          id: proposal.proposalId,
          title: revision.summary,
          state: attention ? "attention" : "pending",
          statusLabel: attention ? "Needs attention" : "Pending",
          metrics: [
            {
              id: "confidence",
              label: "Confidence",
              value: revision.proposedConfidence === undefined
                ? "—"
                : `${Math.round(revision.proposedConfidence * 100)}%`,
              tone: revision.proposedConfidence !== undefined && revision.proposedConfidence < 0.5
                ? "warning"
                : "neutral"
            },
            {
              id: "evidence",
              label: "Evidence",
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
            ...(contextLabels.get(proposal.context.contextId)
              ? [{
                  id: "context",
                  label: "Context",
                  value: contextLabels.get(proposal.context.contextId)!
                }]
              : [])
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
            ...revision.evidenceRefs.map((_, index) => ({
              id: `evidence-${index + 1}`,
              localizationKey: revision.evidenceQuality === "UNVERIFIED"
                ? "reference-unverified"
                : "reference",
              title: "Evidence",
              source: revision.evidenceQuality === "UNVERIFIED"
                ? "Unverified evidence"
                : "Referenced evidence"
            })),
            ...evidenceSources.map((source, index) => ({
              id: `evidence-source-${index + 1}`,
              localizationKey: source.displayName
                ? source.trustLevel === "HOST_VERIFIED"
                  ? "source-host-verified"
                  : source.trustLevel === "DECLARED"
                    ? "source-declared"
                    : "source-unverified"
                : source.trustLevel === "HOST_VERIFIED"
                  ? "source-host-verified-generic"
                  : source.trustLevel === "DECLARED"
                    ? "source-declared-generic"
                    : "source-unverified-generic",
              title: source.displayName ?? "Evidence source",
              source: trustLabel(source.trustLevel)
            })),
            ...revision.reviewSignals.map((signal, index) => {
              const presentation = signalPresentation(signal.kind);
              return {
                id: `signal-${index + 1}`,
                localizationKey: presentation.localizationKey,
                title: presentation.title,
                source: "Review signal",
                ...(memorySummaries.get(signal.memoryId)
                  ? { detail: memorySummaries.get(signal.memoryId)! }
                  : {})
              };
            })
          ],
          technicalDetails,
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
      ...canonicalizationPending.map((proposal): ReviewQueueItemV010 => {
        const duplicateSummary = memorySummaries.get(proposal.duplicateMemoryId)
          ?? "The suspected duplicate Memory";
        const canonicalSummary = memorySummaries.get(proposal.canonicalMemoryId)
          ?? "The Memory to keep";
        return {
          id: proposal.proposalId,
          localizationKey: "canonicalization",
          title: "Review possible duplicate",
          state: "attention" as const,
          statusLabel: "Needs attention",
          summary: "If accepted, the duplicate will be hidden from normal retrieval while the existing Memory remains available. No Memory text is deleted.",
          metrics: contextLabels.get(proposal.context.contextId)
            ? [{
                id: "context",
                label: "Context",
                value: contextLabels.get(proposal.context.contextId)!
              }]
            : [],
          fields: proposal.reason
            ? [{
                key: "reason",
                label: "Why this was suggested",
                control: "textarea" as const,
                value: proposal.reason,
                readOnly: true
              }]
            : [],
          evidence: [
            {
              id: "duplicate",
              localizationKey: "canonicalization-duplicate",
              title: duplicateSummary,
              source: "Duplicate to hide"
            },
            {
              id: "canonical",
              localizationKey: "canonicalization-canonical",
              title: canonicalSummary,
              source: "Memory to keep"
            }
          ],
          technicalDetails: [
            { key: "proposalId", label: "Proposal ID", value: proposal.proposalId },
            { key: "contextId", label: "Context ID", value: proposal.context.contextId },
            { key: "duplicateMemoryId", label: "Duplicate Memory ID", value: proposal.duplicateMemoryId },
            { key: "canonicalMemoryId", label: "Canonical Memory ID", value: proposal.canonicalMemoryId }
          ],
          primaryAction: {
            id: "accept-canonicalization",
            label: "Confirm duplicate",
            type: "command" as const,
            command: "context.memory.canonicalization.proposal.accept",
            inputVersion: "0.1.0",
            primary: true,
            requiresConfirmation: true
          },
          secondaryActions: [{
            id: "reject-canonicalization",
            label: "Keep both",
            type: "command" as const,
            command: "context.memory.canonicalization.proposal.reject",
            inputVersion: "0.1.0",
            requiresConfirmation: true
          }],
          metadata: {
            contextId: proposal.context.contextId,
            proposalType: "CANONICALIZATION",
            duplicateMemoryId: proposal.duplicateMemoryId,
            canonicalMemoryId: proposal.canonicalMemoryId,
            beforeActiveCount: 2,
            afterActiveCount: 1
          }
        };
      })
    ],
    metadata: {
      route: PERSONAL_AGENT_MEMORY_REVIEW_ROUTE,
      pendingCount: pending.length + canonicalizationPending.length,
      contentProposalCount: pending.length,
      canonicalizationProposalCount: canonicalizationPending.length
    }
  };
}

export function isPersonalAgentPageSource(source: string): boolean {
  return source === ENTERPRISE_AGENT_PAGE_SOURCE
    || source === ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
    || source === ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE;
}
