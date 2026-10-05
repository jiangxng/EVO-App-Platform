import type {
  ActiveContextRefV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type {
  EnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";

export function resolveDefaultEnterpriseContextV010(input: {
  principal: PlatformPrincipalV010;
  availableContexts: readonly ActiveContextRefV010[];
  store: EnterpriseContextGovernanceStoreV010;
}): Extract<ActiveContextRefV010, { kind: "ENTERPRISE" }> | undefined {
  const enterprises = input.availableContexts
    .filter(
      (item): item is Extract<ActiveContextRefV010, { kind: "ENTERPRISE" }> =>
        item.kind === "ENTERPRISE"
    )
    .sort((a, b) => a.contextId.localeCompare(b.contextId));

  if (enterprises.length === 0) return undefined;

  const stored = input.store.snapshot().defaultContexts.find(
    item => item.subjectId === input.principal.subjectId
  );
  if (stored) {
    const selected = enterprises.find(
      item => item.contextId === stored.contextId
    );
    if (selected) return selected;
  }

  return enterprises[0];
}
