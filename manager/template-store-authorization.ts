import type {
  HostStaticAuthorizationPolicyV010
} from "../providers/authorization/runtime.js";

/**
 * Product-level authorization baseline for Template Store writes.
 *
 * The copy action separately requires that the target Enterprise Context
 * relationship is OWNER or ADMIN. Explicit deployment DENY rules continue
 * to override this baseline.
 */
export const templateStoreAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.template-store.enterprise-copy",
      effect: "ALLOW",
      actions: ["template.store.copy"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["template.store.entry"]
    }]
  };
