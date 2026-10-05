import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";
import {
  LEDGER_MANAGER_PUBLISH_AUTHORIZATION_ACTION
} from "./constants.js";

export const ledgerManagerAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.ledger-manager.publish",
      effect: "ALLOW",
      actions: [LEDGER_MANAGER_PUBLISH_AUTHORIZATION_ACTION],
      actorTypes: ["HUMAN"],
      resourceTypes: ["ledger.definition"]
    }]
  };
