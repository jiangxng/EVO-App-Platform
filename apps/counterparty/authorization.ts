import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";

export const COUNTERPARTY_READ_ACTION_V010 =
  "counterparty.read" as const;
export const COUNTERPARTY_FIELD_READ_ACTION_V010 =
  "counterparty.field.read" as const;
export const COUNTERPARTY_READ_RESOURCE_V010 =
  "counterparty.subject" as const;
export const COUNTERPARTY_FIELD_RESOURCE_V010 =
  "counterparty.field" as const;

export const counterpartyAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.counterparty.subject-reader",
      effect: "ALLOW",
      actions: [COUNTERPARTY_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [COUNTERPARTY_READ_RESOURCE_V010]
    }, {
      id: "evo.counterparty.field-reader",
      effect: "ALLOW",
      actions: [COUNTERPARTY_FIELD_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [COUNTERPARTY_FIELD_RESOURCE_V010]
    }]
  };
