import type {
  ActiveContextRefV010,
  ContextMemoryKindV010,
  ContextMemoryPrivacyClassV010
} from "../contracts/platform-services.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { ContextMemoryGovernanceStoreV010 } from "./context-memory-governance-store.js";
import type { ContextMemoryRetentionPolicyStoreV010 } from "./context-memory-retention-policy-store.js";
import type { ContextMemoryLegalHoldStoreV010 } from "./context-memory-legal-hold-store.js";

export interface ContextMemoryRetentionSimulationPolicyV010 {
  contractVersion: "0.1.0";
  policyId: string;
  retainForDays: number;
  kinds?: ContextMemoryKindV010[];
  privacyClasses?: ContextMemoryPrivacyClassV010[];
}

export type ContextMemoryRetentionSimulationOutcomeV010 =
  | "ALREADY_EXPIRED"
  | "LEGAL_HOLD"
  | "WOULD_EXPIRE"
  | "WOULD_REMAIN_ACTIVE"
  | "NO_MATCHING_POLICY";

export interface ContextMemoryRetentionSimulationItemV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  outcome: ContextMemoryRetentionSimulationOutcomeV010;
  privacyClass: ContextMemoryPrivacyClassV010;
  recordedAt: string;
  currentDeadline?: string;
  candidateDeadline?: string;
  effectiveDeadline?: string;
  legalHoldId?: string;
}

export interface ContextMemoryRetentionSimulationResultV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  simulatedAt: string;
  candidatePolicy?: ContextMemoryRetentionSimulationPolicyV010;
  totals: {
    examined: number;
    alreadyExpired: number;
    legalHold: number;
    wouldExpire: number;
    wouldRemainActive: number;
    noMatchingPolicy: number;
  };
  items: ContextMemoryRetentionSimulationItemV010[];
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

function candidateDeadline(
  item: ReturnType<ContextMemoryStoreV010["snapshot"]>["items"][number],
  privacyClass: ContextMemoryPrivacyClassV010,
  policy: ContextMemoryRetentionSimulationPolicyV010 | undefined
): string | undefined {
  if (!policy) return undefined;
  if (!Number.isInteger(policy.retainForDays) || policy.retainForDays < 1) {
    throw new Error("CONTEXT_MEMORY_RETENTION_SIMULATION_DURATION_INVALID");
  }
  if (policy.kinds?.length && !policy.kinds.includes(item.kind)) return undefined;
  if (policy.privacyClasses?.length && !policy.privacyClasses.includes(privacyClass)) return undefined;
  const recordedAt = Date.parse(item.attribution.recordedAt);
  if (!Number.isFinite(recordedAt)) {
    throw new Error("CONTEXT_MEMORY_RECORDED_AT_INVALID");
  }
  return new Date(recordedAt + policy.retainForDays * 86_400_000).toISOString();
}

export function simulateContextMemoryRetentionV010(input: {
  context: ActiveContextRefV010;
  memoryStore: ContextMemoryStoreV010;
  governanceStore: ContextMemoryGovernanceStoreV010;
  retentionPolicies: ContextMemoryRetentionPolicyStoreV010;
  legalHolds: ContextMemoryLegalHoldStoreV010;
  candidatePolicy?: ContextMemoryRetentionSimulationPolicyV010;
  now?: Date;
}): ContextMemoryRetentionSimulationResultV010 {
  const now = input.now ?? new Date();
  const items: ContextMemoryRetentionSimulationItemV010[] = [];

  for (const item of input.memoryStore.snapshot().items.filter(value => sameContext(value.context, input.context))) {
    const governance = input.governanceStore.decision(item.memoryId, now);
    const privacyClass = governance?.privacyClass ?? "STANDARD";
    const hold = input.legalHolds.decision(item.memoryId);
    const currentDeadline = input.retentionPolicies.retentionDeadline(item, privacyClass);
    const proposedDeadline = candidateDeadline(item, privacyClass, input.candidatePolicy);
    const effectiveDeadline = [currentDeadline, proposedDeadline]
      .filter((value): value is string => Boolean(value))
      .sort()[0];

    let outcome: ContextMemoryRetentionSimulationOutcomeV010;
    if (governance?.state === "EXPIRED") {
      outcome = "ALREADY_EXPIRED";
    } else if (hold?.held) {
      outcome = "LEGAL_HOLD";
    } else if (!effectiveDeadline) {
      outcome = "NO_MATCHING_POLICY";
    } else if (Date.parse(effectiveDeadline) <= now.getTime()) {
      outcome = "WOULD_EXPIRE";
    } else {
      outcome = "WOULD_REMAIN_ACTIVE";
    }

    items.push({
      contractVersion: "0.1.0",
      memoryId: item.memoryId,
      outcome,
      privacyClass,
      recordedAt: item.attribution.recordedAt,
      ...(currentDeadline ? { currentDeadline } : {}),
      ...(proposedDeadline ? { candidateDeadline: proposedDeadline } : {}),
      ...(effectiveDeadline ? { effectiveDeadline } : {}),
      ...(hold?.held ? { legalHoldId: hold.holdId } : {})
    });
  }

  items.sort((a, b) => a.memoryId.localeCompare(b.memoryId));
  return {
    contractVersion: "0.1.0",
    context: structuredClone(input.context),
    simulatedAt: now.toISOString(),
    ...(input.candidatePolicy ? { candidatePolicy: structuredClone(input.candidatePolicy) } : {}),
    totals: {
      examined: items.length,
      alreadyExpired: items.filter(item => item.outcome === "ALREADY_EXPIRED").length,
      legalHold: items.filter(item => item.outcome === "LEGAL_HOLD").length,
      wouldExpire: items.filter(item => item.outcome === "WOULD_EXPIRE").length,
      wouldRemainActive: items.filter(item => item.outcome === "WOULD_REMAIN_ACTIVE").length,
      noMatchingPolicy: items.filter(item => item.outcome === "NO_MATCHING_POLICY").length
    },
    items
  };
}
