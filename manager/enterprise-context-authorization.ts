import type {
  HostStaticAuthorizationPolicyV010
} from "../providers/authorization/runtime.js";

/**
 * Product-level authorization baseline for Enterprise Context governance.
 *
 * This does not establish ownership by itself. The archive action separately
 * requires an ACTIVE OWNER relationship before authorization is evaluated.
 * Explicit DENY rules in deployment policy still override this ALLOW rule.
 */
export const enterpriseContextGovernanceAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.enterprise-context.owner-archive",
      effect: "ALLOW",
      actions: ["enterprise.context.archive"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["enterprise.context"]
    }]
  };
