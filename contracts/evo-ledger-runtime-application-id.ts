export const EVO_LEDGER_RUNTIME_PROVIDER_ID_V010 =
  "evo-ledger-runtime" as const;

import type {
  EnterpriseApplicationRuntimeBindingV010
} from "./enterprise-application-runtime-binding.js";

export const EVO_LEDGER_RUNTIME_APPLICATION_ID_BRIDGE_VERSION_V010 =
  "0.1.0" as const;

export interface EvoLedgerRuntimeApplicationIdBindingV010 {
  contractVersion: typeof EVO_LEDGER_RUNTIME_APPLICATION_ID_BRIDGE_VERSION_V010;
  enterpriseId: string;
  applicationId: string;
  sourceBindingId: string;
  runtimeProviderId: string;
}

/**
 * Cross-project identity bridge only.
 *
 * App Platform's resolved runtimeApplicationId is the exact EVO
 * ApplicationAnchor/applicationId. No second runtime identity is created.
 */
export function toEvoLedgerRuntimeApplicationIdBindingV010(
  binding: EnterpriseApplicationRuntimeBindingV010
): EvoLedgerRuntimeApplicationIdBindingV010 {
  if (binding.runtimeKind !== "EVO_APPLICATION_ANCHOR") {
    throw new Error("EVO_APPLICATION_RUNTIME_KIND_REQUIRED");
  }
  if (!binding.runtimeApplicationId.trim()) {
    throw new Error("EVO_APPLICATION_ID_REQUIRED");
  }
  return {
    contractVersion: EVO_LEDGER_RUNTIME_APPLICATION_ID_BRIDGE_VERSION_V010,
    enterpriseId: binding.enterpriseId,
    applicationId: binding.runtimeApplicationId,
    sourceBindingId: binding.bindingId,
    runtimeProviderId: binding.runtimeProviderId
  };
}
