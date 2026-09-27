import type {
  ContextMemoryGovernanceDecisionV010,
  ContextMemoryGovernanceProviderV010
} from "../../contracts/platform-services.js";
import type {
  ContextMemoryGovernanceStoreV010
} from "../../manager/context-memory-governance-store.js";
import type {
  ContextMemoryLegalHoldStoreV010
} from "../../manager/context-memory-legal-hold-store.js";
import {
  HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID
} from "./package.js";

function applyLegalHold(
  decision: ContextMemoryGovernanceDecisionV010 | undefined,
  store: ContextMemoryGovernanceStoreV010,
  legalHolds: ContextMemoryLegalHoldStoreV010 | undefined
): ContextMemoryGovernanceDecisionV010 | undefined {
  if (!decision || !legalHolds?.decision(decision.memoryId)?.held) return decision;
  const latestEvent = store.snapshot().events
    .filter(event => event.memoryId === decision.memoryId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.eventId.localeCompare(a.eventId))[0];
  if (!latestEvent) return decision;
  if (latestEvent.state === "ACTIVE" && decision.state === "EXPIRED" && latestEvent.retainUntil) {
    return {
      ...decision,
      state: "ACTIVE"
    };
  }
  return decision;
}

export function createHostContextMemoryGovernanceProviderV010(
  store: ContextMemoryGovernanceStoreV010,
  now: () => Date = () => new Date(),
  legalHolds?: ContextMemoryLegalHoldStoreV010
): ContextMemoryGovernanceProviderV010 {
  return {
    providerId: HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
    get(memoryId) {
      return applyLegalHold(store.decision(memoryId, now()), store, legalHolds);
    },
    listForContext(context) {
      return store.listForContext(context, now())
        .map(decision => applyLegalHold(decision, store, legalHolds)!)
        .sort((a, b) => a.memoryId.localeCompare(b.memoryId));
    }
  };
}
