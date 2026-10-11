import type {
  HostStaticAuthorizationPolicyV010
} from "../providers/authorization/runtime.js";

export const templateStoreAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.template-store.copy-to-enterprise",
      effect: "ALLOW",
      actions: ["template.store.copy"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["template.store.entry"]
    }]
  };
