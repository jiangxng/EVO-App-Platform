import type {
  HostStaticAuthorizationPolicyV010
} from "../../providers/authorization/runtime.js";

export const EOG_DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION_V010 =
  "definition.projection.save" as const;

export const EOG_DEFINITION_PROJECTION_RESOURCE_TYPE_V010 =
  "enterprise.business-definition.projection" as const;

export const EOG_OPERATING_GRAPH_VIEW_EDIT_AUTHORIZATION_ACTION_V010 =
  "enterprise.operating-graph.view.edit" as const;

export const EOG_OPERATING_GRAPH_VIEW_RESOURCE_TYPE_V010 =
  "enterprise.operating-graph.view" as const;

/**
 * Product-level authorization baseline for EOG Definition Projection writes.
 *
 * This policy does not establish enterprise ownership/admin membership.
 * The projection editor separately requires an ACTIVE OWNER/ADMIN relationship
 * before this authorization check is reached. Deployment policy may still
 * explicitly DENY this action and DENY continues to override this baseline.
 *
 * Save and Save As intentionally share this action because both persist only
 * Projection Gallery presentation state under the same governance boundary.
 */
export const eogDefinitionProjectionAuthorizationPolicyV010:
  HostStaticAuthorizationPolicyV010 = {
    contractVersion: "0.1.0",
    rules: [{
      id: "evo.eog-definition-projection.save",
      effect: "ALLOW",
      actions: [
        EOG_DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION_V010
      ],
      actorTypes: ["HUMAN"],
      resourceTypes: [
        EOG_DEFINITION_PROJECTION_RESOURCE_TYPE_V010
      ]
    }, {
      id: "evo.eog-operating-graph.view.edit",
      effect: "ALLOW",
      actions: [
        EOG_OPERATING_GRAPH_VIEW_EDIT_AUTHORIZATION_ACTION_V010
      ],
      actorTypes: ["HUMAN"],
      resourceTypes: [
        EOG_OPERATING_GRAPH_VIEW_RESOURCE_TYPE_V010
      ]
    }]
  };
