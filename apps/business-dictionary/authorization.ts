import type { HostStaticAuthorizationPolicyV010 } from "../../providers/authorization/runtime.js";
import {
  BUSINESS_DICTIONARY_AUTH_RESOURCE_V010 as RESOURCE,
  BUSINESS_DICTIONARY_PUBLISH_ACTION_V010 as PUBLISH,
  BUSINESS_DICTIONARY_READ_ACTION_V010 as READ,
  BUSINESS_DICTIONARY_WRITE_ACTION_V010 as WRITE
} from "./constants.js";

/**
 * Global capability policy is only one layer. The Action handler checks
 * active Enterprise Context and current OWNER/ADMIN membership at execution.
 * External explicit DENY and the real Host permission provider remain binding.
 */
export const businessDictionaryAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [
      {
        id: "evo.business-dictionary.read",
        effect: "ALLOW",
        actions: [READ],
        actorTypes: ["HUMAN", "AI"],
        resourceTypes: [RESOURCE]
      },
      {
        id: "evo.business-dictionary.manage",
        effect: "ALLOW",
        actions: [WRITE, PUBLISH],
        actorTypes: ["HUMAN"],
        resourceTypes: [RESOURCE]
      }
    ]
  };
