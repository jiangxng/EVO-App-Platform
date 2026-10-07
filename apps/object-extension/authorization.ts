import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";
import {
  OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010,
  OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010,
  OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010
} from "./constants.js";

/**
 * Product-level authorization baseline for governed Object Extension operations.
 *
 * Human and Personal Agent callers still require the active Enterprise Context
 * relationship checks enforced by the Object Extension handlers. Deployment
 * policy may explicitly DENY these actions and DENY remains authoritative.
 */
export const objectExtensionAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.object-extension.operator",
      effect: "ALLOW",
      actions: [
        OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010,
        OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010
      ],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010]
    }]
  };
