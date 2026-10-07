import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";
import {
  DATA_IMPORT_AUTH_RESOURCE_V010,
  DATA_IMPORT_READ_ACTION_V010,
  DATA_IMPORT_WRITE_ACTION_V010
} from "./constants.js";

/**
 * Product-level authorization baseline for Human and Personal Agent Data Import operations.
 *
 * This policy does not establish Enterprise Context ownership/admin membership.
 * Data Import handlers separately require an ACTIVE OWNER/ADMIN relationship
 * before enterprise data is staged or committed. Deployment policy may still
 * explicitly DENY these actions, and DENY continues to override this baseline.
 */
export const dataImportAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.data-import.operator",
      effect: "ALLOW",
      actions: [
        DATA_IMPORT_READ_ACTION_V010,
        DATA_IMPORT_WRITE_ACTION_V010
      ],
      actorTypes: ["HUMAN", "AI"],
      resourceTypes: [DATA_IMPORT_AUTH_RESOURCE_V010]
    }]
  };
