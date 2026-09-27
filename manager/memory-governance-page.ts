import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { ReviewQueueV010 } from "../vendor/eidos/src/review-queue/contracts.js";
import type { UidlFormV011 } from "../vendor/eidos/src/runtime/contracts.js";
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
import type { ContextMemoryFreshnessPolicyStoreV010 } from "./context-memory-freshness-policy-store.js";
import { evaluateContextMemoryQualityV010, type ContextMemoryQualityStoreV010 } from "./context-memory-quality-store.js";
import type { ContextMemoryRetentionDraftStoreV010 } from "./context-memory-retention-draft-store.js";
import type { ContextMemoryOperationLogV010 } from "./context-memory-operations.js";
import { simulateContextMemoryRetentionV010 } from "./context-memory-retention-simulation.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import type { AppManagerService } from "./service.js";

export const memoryGovernancePageSource = "app://evo-app-platform/pages/memory";
export const memorySearchPageSource = "app://evo-app-platform/pages/memory/search";
export const memorySourceHealthPageSource = "app://evo-app-platform/pages/memory/sources";
export const memoryRetentionSimulationPageSource = "app://evo-app-platform/pages/memory/retention-simulation";
export const memoryRetentionDraftNewPageSource = "app://evo-app-platform/pages/memory/retention-drafts/new";
export const memoryRetentionDraftsPageSource = "app://evo-app-platform/pages/memory/retention-drafts";
export const memoryQualityPageSource = "app://evo-app-platform/pages/memory/quality";
export const memoryContradictionReviewPageSource = "app://evo-app-platform/pages/memory/quality/contradictions";
export const memoryFreshnessPolicyNewPageSource = "app://evo-app-platform/pages/memory/quality/freshness-policies/new";
export const memoryFreshnessPoliciesPageSource = "app://evo-app-platform/pages/memory/quality/freshness-policies";

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
      { id: "evo-memory.sources", title: "Memory Source Health", source: memorySourceHealthPageSource },
      { id: "evo-memory.retention-simulation", title: "Retention Simulation", source: memoryRetentionSimulationPageSource },
      { id: "evo-memory.retention-draft-new", title: "Prepare Retention Policy", source: memoryRetentionDraftNewPageSource },
      { id: "evo-memory.retention-drafts", title: "Retention Drafts", source: memoryRetentionDraftsPageSource },
      { id: "evo-memory.quality", title: "Memory Quality", source: memoryQualityPageSource },
      { id: "evo-memory.contradictions", title: "Memory Contradictions", source: memoryContradictionReviewPageSource },
      { id: "evo-memory.freshness-policy-new", title: "Set Freshness Policy", source: memoryFreshnessPolicyNewPageSource },
      { id: "evo-memory.freshness-policies", title: "Freshness Policies", source: memoryFreshnessPoliciesPageSource }
    ],
    routes: [
      { id: "evo-memory.home", path: "/memory", pageId: "evo-memory.home" },
      { id: "evo-memory.search", path: "/memory/search", pageId: "evo-memory.search" },
      { id: "evo-memory.sources", path: "/memory/sources", pageId: "evo-memory.sources" },
      { id: "evo-memory.retention-simulation", path: "/memory/retention-simulation", pageId: "evo-memory.retention-simulation" },
      { id: "evo-memory.retention-draft-new", path: "/memory/retention-drafts/new", pageId: "evo-memory.retention-draft-new" },
      { id: "evo-memory.retention-drafts", path: "/memory/retention-drafts", pageId: "evo-memory.retention-drafts" },
      { id: "evo-memory.quality", path: "/memory/quality", pageId: "evo-memory.quality" },
      { id: "evo-memory.contradictions", path: "/memory/quality/contradictions", pageId: "evo-memory.contradictions" },
      { id: "evo-memory.freshness-policy-new", path: "/memory/quality/freshness-policies/new", pageId: "evo-memory.freshness-policy-new" },
      { id: "evo-memory.freshness-policies", path: "/memory/quality/freshness-policies", pageId: "evo-memory.freshness-policies" }
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
  const governedItems = input.memoryStore.snapshot().items
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
    items: [
      {
        id: "memory-governance:retention-simulation",
        title: "Retention policy dry-run",
        category: "Governance tool",
        summary: "Preview the current retention impact without changing Memory or governance state.",
        primaryAction: {
          id: "open-retention-simulation",
          label: "Open simulation",
          type: "navigate",
          route: "/memory/retention-simulation"
        },
        metadata: {
          sideEffectFree: true
        }
      },
      {
        id: "memory-governance:retention-policy-draft",
        title: "Prepare retention policy",
        category: "Governance tool",
        summary: "Create a non-authoritative draft, preview its impact, then confirm before append-only policy commit.",
        primaryAction: {
          id: "prepare-retention-policy",
          label: "Prepare policy",
          type: "navigate",
          route: "/memory/retention-drafts/new"
        },
        secondaryActions: [{
          id: "review-retention-drafts",
          label: "Review drafts",
          type: "navigate",
          route: "/memory/retention-drafts"
        }],
        metadata: {
          previewRequired: true,
          appendOnlyCommit: true
        }
      },
      {
        id: "memory-governance:quality",
        title: "Memory quality",
        category: "Governance tool",
        summary: "Inspect evidence references, source trust, policy-driven observation freshness and unresolved contradictions without rewriting Memory.",
        primaryAction: {
          id: "open-memory-quality",
          label: "Open quality",
          type: "navigate",
          route: "/memory/quality"
        },
        secondaryActions: [
          {
            id: "review-contradictions",
            label: "Review contradictions",
            type: "navigate",
            route: "/memory/quality/contradictions"
          },
          {
            id: "manage-freshness-policies",
            label: "Freshness policies",
            type: "navigate",
            route: "/memory/quality/freshness-policies"
          }
        ],
        metadata: {
          immutableMemory: true,
          compositeScore: false
        }
      },
      ...governedItems
    ],
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


export function createMemoryRetentionSimulationPageV010(input: {
  principal: PlatformPrincipalV010;
  personalContext: PersonalContextV010;
  context: ActiveContextRefV010;
  memoryStore: ContextMemoryStoreV010;
  governanceStore: import("./context-memory-governance-store.js").ContextMemoryGovernanceStoreV010;
  retentionPolicies: ContextMemoryRetentionPolicyStoreV010;
  legalHolds: ContextMemoryLegalHoldStoreV010;
  relationships?: EnterpriseContextRelationshipProviderV010;
  now?: Date;
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
      id: "evo.memory.retention-simulation",
      title: "Retention Simulation",
      description: "Enterprise retention simulation requires an active OWNER or ADMIN relationship.",
      items: [],
      emptyMessage: "You do not have retention simulation authority for this Context."
    };
  }

  const simulation = simulateContextMemoryRetentionV010({
    context: input.context,
    memoryStore: input.memoryStore,
    governanceStore: input.governanceStore,
    retentionPolicies: input.retentionPolicies,
    legalHolds: input.legalHolds,
    ...(input.now ? { now: input.now } : {})
  });

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.memory.retention-simulation",
    title: "Retention Simulation",
    description: [
      `Dry-run only at ${simulation.simulatedAt}`,
      `examined=${simulation.totals.examined}`,
      `would-expire=${simulation.totals.wouldExpire}`,
      `legal-hold=${simulation.totals.legalHold}`,
      `already-expired=${simulation.totals.alreadyExpired}`
    ].join(" · "),
    items: simulation.items.map(item => ({
      id: item.memoryId,
      title: item.memoryId,
      category: item.privacyClass,
      summary: [
        item.outcome,
        `recorded=${item.recordedAt}`,
        item.effectiveDeadline ? `deadline=${item.effectiveDeadline}` : undefined,
        item.legalHoldId ? `legal-hold=${item.legalHoldId}` : undefined
      ].filter(Boolean).join(" · "),
      status: {
        label: item.outcome,
        tone: item.outcome === "WOULD_EXPIRE"
          ? "warning"
          : item.outcome === "LEGAL_HOLD"
            ? "neutral"
            : item.outcome === "ALREADY_EXPIRED"
              ? "warning"
              : "positive"
      },
      metadata: {
        currentDeadline: item.currentDeadline ?? null,
        candidateDeadline: item.candidateDeadline ?? null,
        effectiveDeadline: item.effectiveDeadline ?? null
      }
    })),
    emptyMessage: "No Memory exists in this Context."
  };
}


export function createMemoryRetentionDraftFormV010(): UidlFormV011 {
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo.memory.retention-draft-new",
    title: "Prepare retention policy",
    purpose: "execute-command",
    command: {
      code: "context.memory.retention-draft.prepare",
      inputVersion: "0.1.0"
    },
    fields: [
      {
        key: "policyId",
        label: "Policy ID",
        semanticType: "context.memory.retention-policy.id",
        control: "text",
        required: true
      },
      {
        key: "retainForDays",
        label: "Retain for days",
        semanticType: "duration.days",
        control: "number",
        required: true,
        validation: { min: 1 }
      },
      {
        key: "reason",
        label: "Reason",
        semanticType: "governance.reason",
        control: "text",
        required: false
      }
    ],
    actions: [
      {
        id: "preview",
        label: "Preview and prepare draft",
        type: "submit",
        requiresConfirmation: false
      }
    ],
    metadata: {
      authority: "planning-only",
      governanceMutation: false,
      nextRoute: "/memory/retention-drafts"
    }
  };
}

export function createMemoryRetentionDraftsPageV010(input:{
  principal: PlatformPrincipalV010;
  personalContext: PersonalContextV010;
  context: ActiveContextRefV010;
  drafts: ContextMemoryRetentionDraftStoreV010;
  relationships?: EnterpriseContextRelationshipProviderV010;
}): CatalogBrowserV010 {
  const allowed=governanceAllowed(
    input.principal,
    input.personalContext,
    input.context,
    input.relationships
  );
  if(!allowed){
    return {
      contractVersion:"0.1.0",
      kind:"catalog-browser",
      id:"evo.memory.retention-drafts",
      title:"Retention Drafts",
      description:"Enterprise retention draft review requires an active OWNER or ADMIN relationship.",
      items:[],
      emptyMessage:"You do not have retention policy authority for this Context."
    };
  }

  const drafts=input.drafts.listForContext(input.context);
  return {
    contractVersion:"0.1.0",
    kind:"catalog-browser",
    id:"evo.memory.retention-drafts",
    title:"Retention Drafts",
    description:"Prepared policies are non-authoritative until Human confirmation commits an append-only policy event.",
    items:drafts.map(draft=>({
      id:draft.draftId,
      title:draft.policy.policyId,
      category:draft.state,
      summary:[
        `retain=${draft.policy.retainForDays}d`,
        `examined=${draft.simulation.totals.examined}`,
        `would-expire=${draft.simulation.totals.wouldExpire}`,
        `legal-hold=${draft.simulation.totals.legalHold}`,
        draft.policy.reason ? `reason=${draft.policy.reason}` : undefined
      ].filter(Boolean).join(" · "),
      status:{
        label:draft.state,
        tone:draft.state==="PREPARED"
          ? "warning" as const
          : draft.state==="COMMITTED"
            ? "positive" as const
            : "neutral" as const
      },
      ...(draft.state==="PREPARED"
        ? {
            primaryAction:{
              id:"commit-retention-draft",
              label:"Confirm and commit",
              type:"command" as const,
              command:"context.memory.retention-draft.commit",
              inputVersion:"0.1.0",
              requiresConfirmation:true
            },
            secondaryActions:[{
              id:"discard-retention-draft",
              label:"Discard",
              type:"command" as const,
              command:"context.memory.retention-draft.discard",
              inputVersion:"0.1.0",
              requiresConfirmation:false
            }]
          }
        : {}),
      metadata:{
        preparedAt:draft.occurredAt,
        previewWouldExpire:draft.simulation.totals.wouldExpire,
        previewLegalHold:draft.simulation.totals.legalHold,
        committedPolicyEventId:draft.committedPolicyEventId ?? null
      }
    })),
    emptyMessage:"No retention policy drafts exist for this Context."
  };
}


export function createMemoryQualityPageV010(input:{
  principal:PlatformPrincipalV010;
  personalContext:PersonalContextV010;
  context:ActiveContextRefV010;
  memoryStore:ContextMemoryStoreV010;
  qualityStore:ContextMemoryQualityStoreV010;
  freshnessPolicies?:ContextMemoryFreshnessPolicyStoreV010;
  relationships?:EnterpriseContextRelationshipProviderV010;
  now?:Date;
  freshnessWindowDays?:number;
}):CatalogBrowserV010{
  const allowed=governanceAllowed(
    input.principal,
    input.personalContext,
    input.context,
    input.relationships
  );
  if(!allowed){
    return {
      contractVersion:"0.1.0",
      kind:"catalog-browser",
      id:"evo.memory.quality",
      title:"Memory Quality",
      description:"Enterprise Memory quality governance requires an active OWNER or ADMIN relationship.",
      items:[],
      emptyMessage:"You do not have Memory quality governance authority for this Context."
    };
  }

  const memories=input.memoryStore.snapshot().items
    .filter(item=>sameContext(item.context,input.context))
    .sort((a,b)=>b.attribution.recordedAt.localeCompare(a.attribution.recordedAt));
  const evaluations=memories.map(memory=>({
    memory,
    quality:evaluateContextMemoryQualityV010({
      memory,
      qualityStore:input.qualityStore,
      ...(input.now ? {now:input.now} : {}),
      freshnessWindowDays:
        input.freshnessPolicies?.freshnessWindowDays(memory)
        ?? input.freshnessWindowDays
        ?? 180
    })
  }));
  const openContradictions=input.qualityStore
    .listContradictionsForContext(input.context)
    .filter(item=>item.state==="OPEN");

  return {
    contractVersion:"0.1.0",
    kind:"catalog-browser",
    id:"evo.memory.quality",
    title:"Memory Quality",
    description:[
      `Context ${input.context.contextId}`,
      `Memory=${memories.length}`,
      `open contradictions=${openContradictions.length}`,
      "No composite quality score: evidence dimensions remain visible."
    ].join(" · "),
    search:{
      placeholder:"Filter Memory quality",
      ariaLabel:"Filter Memory quality",
      noResultsMessage:"No Memory quality item matches this filter."
    },
    items:[
      {
        id:"memory-quality:contradictions",
        title:"Contradiction review",
        category:"Quality governance",
        summary:`${openContradictions.length} open contradiction(s) require explicit resolution or dismissal.`,
        status:{
          label:openContradictions.length ? "Attention" : "Clear",
          tone:openContradictions.length ? "warning" : "positive"
        },
        primaryAction:{
          id:"review-contradictions",
          label:"Review contradictions",
          type:"navigate",
          route:"/memory/quality/contradictions"
        },
        metadata:{
          openContradictions:openContradictions.length
        }
      },
      ...evaluations.map(({memory,quality})=>({
        id:memory.memoryId,
        title:memory.summary,
        category:memory.kind,
        summary:[
          `freshness=${quality.freshness.state}`,
          quality.freshness.ageDays!==undefined ? `age=${quality.freshness.ageDays}d` : undefined,
          `source-trust=${quality.evidence.trust}`,
          `evidence-refs=${quality.evidence.referenceCount}`,
          `open-contradictions=${quality.contradictions.openCount}`,
          quality.signals.length ? `signals=${quality.signals.join(",")}` : "no quality warning signal"
        ].filter(Boolean).join(" · "),
        badges:[
          quality.freshness.state,
          quality.evidence.trust,
          ...(quality.contradictions.openCount ? ["CONTRADICTION"] : [])
        ],
        status:{
          label:quality.signals.length ? "Review" : "Observed",
          tone:quality.signals.length ? "warning" as const : "positive" as const
        },
        metadata:{
          observedAt:quality.freshness.observedAt ?? null,
          freshnessWindowDays:quality.freshness.freshnessWindowDays,
          hostVerifiedSources:quality.evidence.hostVerifiedSources,
          declaredSources:quality.evidence.declaredSources,
          unverifiedSources:quality.evidence.unverifiedSources,
          openContradictions:quality.contradictions.openCount
        }
      }))
    ],
    emptyMessage:"No Memory exists in this Context."
  };
}

export function createMemoryContradictionReviewPageV010(input:{
  principal:PlatformPrincipalV010;
  personalContext:PersonalContextV010;
  context:ActiveContextRefV010;
  memoryStore:ContextMemoryStoreV010;
  qualityStore:ContextMemoryQualityStoreV010;
  relationships?:EnterpriseContextRelationshipProviderV010;
}):ReviewQueueV010{
  const allowed=governanceAllowed(
    input.principal,
    input.personalContext,
    input.context,
    input.relationships
  );
  if(!allowed){
    return {
      contractVersion:"0.1.0",
      kind:"review-queue",
      id:"evo.memory.contradictions",
      title:"Memory Contradictions",
      description:"Enterprise contradiction governance requires an active OWNER or ADMIN relationship.",
      items:[],
      emptyMessage:"You do not have contradiction governance authority for this Context."
    };
  }

  const byId=new Map(
    input.memoryStore.snapshot().items
      .filter(item=>sameContext(item.context,input.context))
      .map(item=>[item.memoryId,item])
  );
  const open=input.qualityStore.listContradictionsForContext(input.context)
    .filter(item=>item.state==="OPEN");

  return {
    contractVersion:"0.1.0",
    kind:"review-queue",
    id:"evo.memory.contradictions",
    title:"Memory Contradictions",
    description:"Resolve the relationship between immutable Memory records. This overlay does not rewrite or supersede Memory by itself.",
    items:open.map(item=>{
      const left=byId.get(item.leftMemoryId);
      const right=byId.get(item.rightMemoryId);
      return {
        id:item.contradictionId,
        title:`${left?.summary ?? item.leftMemoryId} ↔ ${right?.summary ?? item.rightMemoryId}`,
        summary:`Detected from ${item.origin} at ${item.occurredAt}`,
        state:"attention" as const,
        statusLabel:"Open contradiction",
        fields:[
          {
            key:"resolution",
            label:"Resolution",
            control:"select" as const,
            value:"BOTH_VALID",
            options:[
              {label:"Prefer left Memory",value:"PREFER_LEFT"},
              {label:"Prefer right Memory",value:"PREFER_RIGHT"},
              {label:"Both are valid in context",value:"BOTH_VALID"},
              {label:"Other",value:"OTHER"}
            ]
          },
          {
            key:"reason",
            label:"Reason",
            control:"textarea" as const,
            value:""
          }
        ],
        evidence:[
          {
            id:"left",
            title:left?.summary ?? item.leftMemoryId,
            source:"LEFT_MEMORY",
            detail:item.leftMemoryId
          },
          {
            id:"right",
            title:right?.summary ?? item.rightMemoryId,
            source:"RIGHT_MEMORY",
            detail:item.rightMemoryId
          }
        ],
        primaryAction:{
          id:"resolve-contradiction",
          label:"Confirm resolution",
          type:"command" as const,
          command:"context.memory.quality.contradiction.resolve",
          inputVersion:"0.1.0",
          primary:true,
          requiresConfirmation:true
        },
        secondaryActions:[{
          id:"dismiss-contradiction",
          label:"Dismiss as not a contradiction",
          type:"command" as const,
          command:"context.memory.quality.contradiction.resolve",
          inputVersion:"0.1.0",
          requiresConfirmation:true
        }],
        metadata:{
          leftMemoryId:item.leftMemoryId,
          rightMemoryId:item.rightMemoryId,
          detectedBy:item.origin
        }
      };
    }),
    emptyMessage:"No open Memory contradictions require review.",
    metadata:{
      contextId:input.context.contextId,
      openCount:open.length
    }
  };
}


export function createMemoryFreshnessPolicyFormV010(): UidlFormV011 {
  return {
    contractVersion:"0.1.1",
    kind:"form",
    id:"evo.memory.freshness-policy-new",
    title:"Set Memory freshness policy",
    purpose:"execute-command",
    command:{
      code:"context.memory.quality.freshness-policy.set",
      inputVersion:"0.1.0"
    },
    fields:[
      {
        key:"policyId",
        label:"Policy ID",
        semanticType:"context.memory.freshness-policy.id",
        control:"text",
        required:true
      },
      {
        key:"freshnessWindowDays",
        label:"Freshness window (days)",
        semanticType:"duration.days",
        control:"number",
        required:true,
        validation:{min:1,max:36500}
      },
      {
        key:"kinds",
        label:"Memory kinds (comma-separated; blank = Context default)",
        semanticType:"context.memory.kind-list",
        control:"text",
        required:false
      },
      {
        key:"reason",
        label:"Reason",
        semanticType:"governance.reason",
        control:"text",
        required:false
      }
    ],
    actions:[
      {
        id:"save-freshness-policy",
        label:"Confirm policy",
        type:"submit",
        requiresConfirmation:true
      }
    ],
    metadata:{
      appendOnly:true,
      precedence:"KIND_SPECIFIC_THEN_CONTEXT_DEFAULT",
      sameLevelRule:"SHORTEST_WINDOW"
    }
  };
}

export function createMemoryFreshnessPoliciesPageV010(input:{
  principal:PlatformPrincipalV010;
  personalContext:PersonalContextV010;
  context:ActiveContextRefV010;
  policies:ContextMemoryFreshnessPolicyStoreV010;
  relationships?:EnterpriseContextRelationshipProviderV010;
}):CatalogBrowserV010{
  const allowed=governanceAllowed(
    input.principal,
    input.personalContext,
    input.context,
    input.relationships
  );
  if(!allowed){
    return {
      contractVersion:"0.1.0",
      kind:"catalog-browser",
      id:"evo.memory.freshness-policies",
      title:"Freshness Policies",
      description:"Enterprise freshness policy governance requires an active OWNER or ADMIN relationship.",
      items:[],
      emptyMessage:"You do not have freshness policy authority for this Context."
    };
  }

  const policies=input.policies.effectiveForContext(input.context);
  return {
    contractVersion:"0.1.0",
    kind:"catalog-browser",
    id:"evo.memory.freshness-policies",
    title:"Freshness Policies",
    description:"Kind-specific policies override Context defaults. Within the same specificity, the shortest active window is used.",
    items:[
      {
        id:"freshness-policy:new",
        title:"Set or update freshness policy",
        category:"Governance tool",
        summary:"Append a new policy event. Existing policy history remains immutable.",
        primaryAction:{
          id:"new-freshness-policy",
          label:"Set policy",
          type:"navigate",
          route:"/memory/quality/freshness-policies/new"
        }
      },
      ...policies.map(policy=>({
        id:policy.policyId,
        title:policy.policyId,
        category:policy.kinds?.length ? "Kind-specific" : "Context default",
        summary:[
          `window=${policy.freshnessWindowDays}d`,
          policy.kinds?.length ? `kinds=${policy.kinds.join(",")}` : "kinds=all",
          policy.reason ? `reason=${policy.reason}` : undefined
        ].filter(Boolean).join(" · "),
        status:{
          label:"ACTIVE",
          tone:"positive" as const
        },
        secondaryActions:[{
          id:"retire-freshness-policy",
          label:"Retire",
          type:"command" as const,
          command:"context.memory.quality.freshness-policy.retire",
          inputVersion:"0.1.0",
          requiresConfirmation:true
        }],
        metadata:{
          effectiveEventId:policy.effectiveEventId,
          occurredAt:policy.occurredAt,
          actorSubjectId:policy.actorSubjectId
        }
      }))
    ],
    emptyMessage:"No active freshness policy exists for this Context."
  };
}
