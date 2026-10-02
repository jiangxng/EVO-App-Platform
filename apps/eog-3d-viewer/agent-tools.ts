import type {
  AgentToolDescriptorV010
} from "../../agents/enterprise-agent/contracts.js";
import type {
  EnterpriseAgentToolRegistrationV010
} from "../../agents/enterprise-agent/host-tool-catalog.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
} from "../../contracts/enterprise-operating-graph.js";
import {
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewMutationV010
} from "../../contracts/enterprise-operating-graph-view.js";
import {
  EOG_3D_VIEWER_PACKAGE_ID
} from "./package.js";
import type {
  EnterpriseOperatingGraphHostServiceV010
} from "../eog-2d-designer/enterprise-operating-graph-service.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";

function descriptor(
  input: Omit<AgentToolDescriptorV010, "contractVersion">
): AgentToolDescriptorV010 {
  return {
    contractVersion: "0.1.0",
    ...input
  };
}

function stringArg(
  args: Record<string, unknown>,
  key: string,
  required = true
): string | undefined {
  const value = args[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EOG_AGENT_ARGUMENT_INVALID:" + key);
  }
  return value.trim();
}

function revisionArg(args: Record<string, unknown>): number {
  const value = args.expectedRevision;
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 0
  ) {
    throw new Error("EOG_AGENT_ARGUMENT_INVALID:expectedRevision");
  }
  return value;
}

function enterpriseId(
  context: ResolvedContextSetV010
): string {
  if (
    context.activeContext.kind !== "ENTERPRISE"
    || !context.activeContext.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return context.activeContext.enterpriseId.trim();
}

function defaultSpatialViewId(graphId: string): string {
  if (graphId === PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010) {
    return PRIMARY_EOG_SPATIAL_VIEW_ID_V010;
  }
  return graphId + ":view:spatial-3d";
}

function spatialViewMutation(
  args: Record<string, unknown>
): EnterpriseOperatingGraphViewMutationV010 {
  const value = args.mutation;
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (
      (value as { type?: unknown }).type !== "NODE_POSITION_SET"
      && (value as { type?: unknown }).type !== "CAMERA_SET"
    )
  ) {
    throw new Error("EOG_VIEW_MUTATION_INVALID");
  }
  return structuredClone(value) as EnterpriseOperatingGraphViewMutationV010;
}

export function createEog3dViewerAgentToolRegistrationsV010(
  input: {
    service: EnterpriseOperatingGraphHostServiceV010;
    viewService: EnterpriseOperatingGraphViewStateProviderV010;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    is3dViewerActive?: () => boolean;
  }
): EnterpriseAgentToolRegistrationV010[] {
  const inEnterprise = () => input.context.activeContext.kind === "ENTERPRISE";
  const spatialViewerAvailable = () =>
    inEnterprise() && (input.is3dViewerActive?.() ?? true);
  const currentEnterpriseId = () => enterpriseId(input.context);

  return [
    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.spatial_view.get",
        modelName: "enterprise_operating_graph_spatial_view_get",
        title: "Enterprise Operating Graph 3D view",
        description: "Read or initialize renderer-independent SPATIAL_3D EOG View State. Spatial placement and camera are presentation state, not enterprise truth.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            viewId: { type: "string" }
          },
          required: ["graphId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: EOG_3D_VIEWER_PACKAGE_ID,
        capability: "enterprise.operating-graph.view.read"
      }),
      available: spatialViewerAvailable,
      execute(args) {
        const graphId = stringArg(args, "graphId")!;
        const enterpriseId = currentEnterpriseId();
        input.service.get({ enterpriseId, graphId });
        const suppliedViewId = stringArg(args, "viewId", false);
        const viewId = suppliedViewId ?? defaultSpatialViewId(graphId);
        const existing = input.viewService.list({ enterpriseId, graphId })
          .find(view => view.viewId === viewId && view.kind === "SPATIAL_3D");
        return existing ?? {
          contractVersion: "0.1.0",
          viewId,
          graphId,
          enterpriseId,
          kind: "SPATIAL_3D",
          revision: 0,
          placements: [],
          createdAt: "",
          updatedAt: ""
        };
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.spatial_view.apply",
        modelName: "enterprise_operating_graph_spatial_view_apply",
        title: "Arrange Enterprise Operating Graph 3D view",
        description: "Change only SPATIAL_3D node placement or camera state. This does not change semantic graph revision, relations, or publication state.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            viewId: { type: "string" },
            expectedRevision: { type: "number" },
            mutation: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["NODE_POSITION_SET", "CAMERA_SET"] }
              },
              required: ["type"],
              additionalProperties: true
            }
          },
          required: ["graphId", "expectedRevision", "mutation"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: EOG_3D_VIEWER_PACKAGE_ID,
        capability: "enterprise.operating-graph.view.write"
      }),
      available: spatialViewerAvailable,
      execute(args) {
        const graphId = stringArg(args, "graphId")!;
        const graph = input.service.get({
          enterpriseId: currentEnterpriseId(),
          graphId
        });
        const mutation = spatialViewMutation(args);
        if (
          mutation.type === "NODE_POSITION_SET"
          && !graph.nodes.some(node => node.nodeId === mutation.placement.nodeId)
        ) {
          throw new Error("EOG_VIEW_NODE_NOT_FOUND");
        }
        const suppliedViewId = stringArg(args, "viewId", false);
        const view = input.viewService.ensure({
          enterpriseId: currentEnterpriseId(),
          graphId,
          kind: "SPATIAL_3D",
          ...(suppliedViewId ? { viewId: suppliedViewId } : {})
        });
        return input.viewService.apply({
          enterpriseId: currentEnterpriseId(),
          graphId,
          viewId: view.viewId,
          expectedRevision: revisionArg(args),
          mutation
        });
      }
    }
  ];
}
