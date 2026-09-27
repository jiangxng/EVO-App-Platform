import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  ActiveContextRefV010,
  ContextMemoryGovernanceProviderV010,
  ContextMemoryReaderV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformPrincipalV010,
  PersonalContextV010
} from "../contracts/platform-services.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { ContextMemoryRetentionPolicyStoreV010 } from "./context-memory-retention-policy-store.js";
import type { ContextMemoryLegalHoldStoreV010 } from "./context-memory-legal-hold-store.js";
import type { ContextMemoryOperationLogV010 } from "./context-memory-operations.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import type { AppManagerService } from "./service.js";

export const memoryGovernancePageSource = "app://evo-app-platform/pages/memory";
export const memorySearchPageSource = "app://evo-app-platform/pages/memory/search";
export const memorySourceHealthPageSource = "app://evo-app-platform/pages/memory/sources";

export function createMemoryGovernanceExperienceManifestV010() {
  return {
    contractVersion: "0.1.0",
    experienceId: "evo-memory-governance",
    packageId: "evo-app-platform",
    featureId: "evo-memory-governance.system",
    defaultRoute: "/memory",
    pages: [
      { id: "evo-memory.home", title: "Memory Governance", source: memoryGovernancePageSource },
      { id: "evo-memory.search", title: "Memory Search", source: memorySearchPageSource },
      { id: "evo-memory.sources", title: "Memory Source Health", source: memorySourceHealthPageSource }
    ],
    routes: [
      { id: "evo-memory.home", path: "/memory", pageId: "evo-memory.home" },
      { id: "evo-memory.search", path: "/memory/search", pageId: "evo-memory.search" },
      { id: "evo-memory.sources", path: "/memory/sources", pageId: "evo-memory.sources" }
    ]
  } as const;
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

function governanceAllowed(
  principal: PlatformPrincipalV010,
  personalContext: PersonalContextV010,
  context: ActiveContextRefV010,
  relationships: EnterpriseContextRelationshipProviderV010 | undefined
): boolean {
  if (context.kind === "PERSONAL") {
    return personalContext.contextId === context.contextId
      && personalContext.ownerSubjectId === principal.subjectId;
  }
  return relationships?.listForPrincipal(principal).some(item =>
    item.contextId === context.contextId
    && item.state === "ACTIVE"
    && (item.kind === "OWNER" || item.kind === "ADMIN")
  ) === true;
}

export function createMemoryGovernancePageV010(input: {
  principal: PlatformPrincipalV010;
  personalContext: PersonalContextV010;
  context: ActiveContextRefV010;
  memoryStore: ContextMemoryStoreV010;
  governance: ContextMemoryGovernanceProviderV010;
  retentionPolicies: ContextMemoryRetentionPolicyStoreV010;
  legalHolds: ContextMemoryLegalHoldStoreV010;
  operationLog: ContextMemoryOperationLogV010;
  relationships?: EnterpriseContextRelationshipProviderV010;
}): CatalogBrowserV010 {
  const allowed = governanceAllowed(
    input.principal,
    input.personalContext,
    input.context,
    input.relationships
  );
  if (!allowed) {
    return {
      contractVersion: "0.1.0",
      kind: "catalog-browser",
      id: "evo.memory.governance",
      title: "Memory Governance",
      description: "Enterprise Memory governance requires an active OWNER or ADMIN relationship.",
      items: [],
      emptyMessage: "You do not have Memory governance authority for this Context."
    };
  }

  const decisions = new Map(
    input.governance.listForContext(input.context).map(value => [value.memoryId, value])
  );
  const holds = new Map(
    input.legalHolds.listForContext(input.context).map(value => [value.memoryId, value])
  );
  const items = input.memoryStore.snapshot().items
    .filter(item => sameContext(item.context, input.context))
    .sort((a, b) => b.attribution.recordedAt.localeCompare(a.attribution.recordedAt))
    .map(item => {
      const decision = decisions.get(item.memoryId);
      const hold = holds.get(item.memoryId);
      const privacyClass = decision?.privacyClass ?? "STANDARD";
      const state = decision?.state ?? "ACTIVE";
      const policyDeadline = input.retentionPolicies.retentionDeadline(item, privacyClass);
      return {
        id: item.memoryId,
        title: item.summary,
        category: item.kind,
        summary: [
          `state=${state}`,
          `privacy=${privacyClass}`,
          hold?.held ? `legal-hold=${hold.holdId}` : "legal-hold=none",
          decision?.retainUntil ? `explicit-retain-until=${decision.retainUntil}` : undefined,
          policyDeadline ? `policy-deadline=${policyDeadline}` : undefined
        ].filter(Boolean).join(" · "),
        badges: [
          state,
          privacyClass,
          ...(hold?.held ? ["LEGAL_HOLD"] : [])
        ],
        status: {
          label: state,
          tone: state === "ACTIVE" ? "positive" as const : "warning" as const
        },
        metadata: {
          recordedAt: item.attribution.recordedAt,
          effectiveGovernanceEventId: decision?.effectiveEventId ?? null,
          legalHold: hold?.held ?? false
        }
      };
    });

  const operations = input.operationLog.list()
    .filter(event => sameContext(event.context, input.context))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const latestOperation = operations[0];

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.memory.governance",
    title: "Memory Governance",
    description: [
      `Context ${input.context.contextId}`,
      `${input.retentionPolicies.effectiveForContext(input.context).length} active retention policy(s)`,
      latestOperation ? `latest operation ${latestOperation.kind}=${latestOperation.state} at ${latestOperation.completedAt}` : "no scheduled operation evidence"
    ].join(" · "),
    search: {
      placeholder: "Filter governed Memory",
      ariaLabel: "Filter governed Memory",
      noResultsMessage: "No governed Memory matches this filter."
    },
    items,
    emptyMessage: "No Memory exists in this Context."
  };
}

export async function createMemorySearchPageV010(input: {
  context: ActiveContextRefV010;
  reader: ContextMemoryReaderV010;
}): Promise<CatalogBrowserV010> {
  const result = await input.reader.read({
    contractVersion: "0.1.0",
    context: input.context,
    strategy: "LEXICAL",
    limit: 100
  });
  const scores = new Map((result.ranking ?? []).map(value => [value.memoryId, value]));
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.memory.search",
    title: "Memory Search",
    description: "Search the Host-authorized Memory set for the active Context. Restricted and expired Memory is removed before this surface receives candidates.",
    search: {
      placeholder: "Search visible Memory",
      ariaLabel: "Search visible Memory",
      noResultsMessage: "No visible Memory matches this search."
    },
    items: result.items.map(item => ({
      id: item.memoryId,
      title: item.summary,
      category: item.kind,
      summary: [
        `recorded ${item.attribution.recordedAt}`,
        `origin=${item.provenance.origin}`,
        scores.get(item.memoryId) ? `score=${scores.get(item.memoryId)?.score}` : undefined
      ].filter(Boolean).join(" · "),
      metadata: {
        evidenceCount: item.provenance.evidenceRefs.length,
        recordedBy: item.attribution.recordedBySubjectId
      }
    })),
    emptyMessage: "No visible Memory is available in this Context."
  };
}

export function createMemorySourceHealthPageV010(input: {
  manager: AppManagerService;
  registry: ProviderRuntimeRegistry;
}): CatalogBrowserV010 {
  const capabilities = [
    "context.memory.read",
    "context.memory.governance",
    "context.memory.semantic-retrieval",
    "context.memory.dlp-classification",
    "context.memory.intake-source",
    "context.memory.evidence-source"
  ];
  const providers = capabilities.flatMap(capability =>
    input.manager.listEffectiveServiceProviders(capability).map(provider => ({
      capability,
      provider
    }))
  );
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.memory.sources",
    title: "Memory Source Health",
    description: "Operational health for Memory retrieval, governance, DLP, semantic ranking and intake Providers. Secret values are never exposed.",
    items: providers.map(({ capability, provider }) => {
      const health = input.registry.getHealth(provider.providerId);
      return {
        id: `${capability}:${provider.providerId}`,
        title: provider.providerId,
        category: capability,
        summary: health.message ?? `Provider health is ${health.state}`,
        status: {
          label: health.state,
          tone: health.state === "HEALTHY" ? "positive" as const : health.state === "UNKNOWN" ? "neutral" as const : "warning" as const
        },
        primaryAction: {
          id: "configure",
          label: "Provider settings",
          type: "navigate" as const,
          route: `/providers/${encodeURIComponent(capability)}`
        },
        metadata: {
          checkedAt: health.checkedAt ?? null
        }
      };
    }),
    emptyMessage: "No effective Memory Providers are active."
  };
}
