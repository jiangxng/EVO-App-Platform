import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";

export const ITEM_READ_ACTION_V010 = "item.read" as const;
export const ITEM_FIELD_READ_ACTION_V010 = "item.field.read" as const;
export const ITEM_READ_RESOURCE_V010 = "item.subject" as const;
export const ITEM_FIELD_RESOURCE_V010 = "item.field" as const;

export const itemAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.item.subject-reader",
      effect: "ALLOW",
      actions: [ITEM_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [ITEM_READ_RESOURCE_V010]
    }, {
      id: "evo.item.field-reader",
      effect: "ALLOW",
      actions: [ITEM_FIELD_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [ITEM_FIELD_RESOURCE_V010]
    }]
  };
