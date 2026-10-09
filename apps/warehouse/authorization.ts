import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";

export const WAREHOUSE_READ_ACTION_V010 = "warehouse.read" as const;
export const WAREHOUSE_FIELD_READ_ACTION_V010 =
  "warehouse.field.read" as const;
export const WAREHOUSE_READ_RESOURCE_V010 =
  "warehouse.subject" as const;
export const WAREHOUSE_FIELD_RESOURCE_V010 =
  "warehouse.field" as const;

export const warehouseAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.warehouse.subject-reader",
      effect: "ALLOW",
      actions: [WAREHOUSE_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [WAREHOUSE_READ_RESOURCE_V010]
    }, {
      id: "evo.warehouse.field-reader",
      effect: "ALLOW",
      actions: [WAREHOUSE_FIELD_READ_ACTION_V010],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [WAREHOUSE_FIELD_RESOURCE_V010]
    }]
  };
