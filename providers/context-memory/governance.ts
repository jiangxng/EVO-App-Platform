import type {
  ContextMemoryGovernanceProviderV010
} from "../../contracts/platform-services.js";
import type {
  ContextMemoryGovernanceStoreV010
} from "../../manager/context-memory-governance-store.js";
import {
  HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID
} from "./package.js";

export function createHostContextMemoryGovernanceProviderV010(
  store: ContextMemoryGovernanceStoreV010,
  now: () => Date = () => new Date()
): ContextMemoryGovernanceProviderV010 {
  return {
    providerId: HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
    get(memoryId) {
      return store.decision(memoryId, now());
    },
    listForContext(context) {
      return store.listForContext(context, now());
    }
  };
}
