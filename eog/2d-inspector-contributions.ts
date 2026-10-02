import type {
  EogInspectorPropertyContributionV010,
  EogInspectorPropertyV010
} from "../contracts/enterprise-operating-graph-inspector.js";
import type {
  DiagramWorkspaceInspectorPropertyV010,
  DiagramWorkspaceStateV010
} from "../vendor/eidos/src/2d/index.js";
import type {
  Eog2dWorkspaceRoleV010
} from "./2d-workspace-capabilities.js";

function edgeId(
  contribution: EogInspectorPropertyContributionV010
): string {
  if (contribution.target.kind !== "RELATION") {
    throw new Error("EOG_2D_INSPECTOR_RELATION_TARGET_REQUIRED");
  }
  return contribution.target.authority === "GUIDANCE"
    ? "guidance-edge:" + contribution.target.relationId
    : "enterprise-edge:" + contribution.target.relationId;
}

function property(
  input: EogInspectorPropertyV010,
  role: Eog2dWorkspaceRoleV010
): DiagramWorkspaceInspectorPropertyV010 {
  return {
    key: input.key,
    label: input.label,
    value: input.value,
    ...(input.detail === undefined ? {} : { detail: input.detail }),
    ...(role === "DESIGNER" && input.edit
      ? {
          editor: {
            kind: input.edit.kind,
            actionId: input.edit.actionId,
            command: structuredClone(input.edit.command),
            valueField: input.edit.valueField,
            operation: structuredClone(input.edit.operation),
            ...(input.edit.requiresConfirmation === undefined
              ? {}
              : {
                  requiresConfirmation:
                    input.edit.requiresConfirmation
                }),
            ...(input.edit.options === undefined
              ? {}
              : { options: structuredClone(input.edit.options) })
          }
        }
      : {})
  };
}

export function applyEog2dInspectorPropertyContributionsV010(
  state: DiagramWorkspaceStateV010,
  contributions: readonly EogInspectorPropertyContributionV010[],
  role: Eog2dWorkspaceRoleV010
): DiagramWorkspaceStateV010 {
  const next = structuredClone(state);

  for (const contribution of contributions) {
    const target = contribution.target.kind === "NODE"
      ? next.nodes.find(item => item.id === contribution.target.nodeId)
      : next.edges.find(item => item.id === edgeId(contribution));

    if (!target) {
      throw new Error("EOG_2D_INSPECTOR_CONTRIBUTION_TARGET_NOT_FOUND");
    }

    const existing = new Set(
      (target.properties ?? []).map(item => item.key)
    );
    for (const item of contribution.properties) {
      if (existing.has(item.key)) {
        throw new Error("EOG_2D_INSPECTOR_CONTRIBUTION_PROPERTY_DUPLICATE");
      }
      existing.add(item.key);
      target.properties = [
        ...(target.properties ?? []),
        property(item, role)
      ];
    }
  }

  return next;
}
