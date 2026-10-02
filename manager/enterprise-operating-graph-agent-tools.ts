import type {
  AgentToolDescriptorV010
} from "../agents/enterprise-agent/contracts.js";
import {
  EOG_2D_DESIGNER_PACKAGE_ID
} from "../apps/eog-2d-designer/package.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
} from "../contracts/enterprise-operating-graph.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewKindV010,
  type EnterpriseOperatingGraphViewMutationV010
} from "../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseAgentToolRegistrationV010
} from "../agents/enterprise-agent/host-tool-catalog.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import type {
  EnterpriseOperatingGraphHostServiceV010,
  EnterpriseOperatingGraphMutationV010
} from "./enterprise-operating-graph-service.js";
import type {
  EnterpriseOperatingGraphViewHostServiceV010
} from "./enterprise-operating-graph-view-service.js";

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

function proposalMutation(
  args: Record<string, unknown>
): EnterpriseOperatingGraphMutationV010 {
  const value = args.mutation;
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || typeof (value as { type?: unknown }).type !== "string"
  ) {
    throw new Error("EOG_MUTATION_INVALID");
  }
  const mutation = structuredClone(
    value
  ) as EnterpriseOperatingGraphMutationV010;
  if (
    mutation.type === "ENTERPRISE_RELATION_CONFIRM"
    || mutation.type === "ENTERPRISE_RELATION_REMOVE"
    || mutation.type === "PUBLISH"
  ) {
    throw new Error("EOG_HUMAN_CONFIRMATION_REQUIRED");
  }
  if (
    mutation.type !== "NODE_BIND"
    && mutation.type !== "NODE_REMOVE"
    && mutation.type !== "GUIDANCE_RELATION_PUT"
    && mutation.type !== "GUIDANCE_RELATION_REMOVE"
  ) {
    throw new Error("EOG_MUTATION_INVALID");
  }
  return mutation;
}

function viewKindArg(
  args: Record<string, unknown>
): EnterpriseOperatingGraphViewKindV010 {
  const value = args.kind;
  if (value !== "DIAGRAM_2D" && value !== "SPATIAL_3D") {
    throw new Error("EOG_AGENT_ARGUMENT_INVALID:kind");
  }
  return value;
}

function defaultViewId(
  graphId: string,
  kind: EnterpriseOperatingGraphViewKindV010
): string {
  if (graphId === PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010) {
    return kind === "DIAGRAM_2D"
      ? PRIMARY_EOG_DIAGRAM_VIEW_ID_V010
      : PRIMARY_EOG_SPATIAL_VIEW_ID_V010;
  }
  return graphId + (
    kind === "DIAGRAM_2D"
      ? ":view:diagram-2d"
      : ":view:spatial-3d"
  );
}

function viewMutation(
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

export function createEnterpriseOperatingGraphAgentToolRegistrationsV010(
  input: {
    service: EnterpriseOperatingGraphHostServiceV010;
    viewService: EnterpriseOperatingGraphViewHostServiceV010;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    isDesignerActive?: () => boolean;
  }
): EnterpriseAgentToolRegistrationV010[] {
  const inEnterprise = () => input.context.activeContext.kind === "ENTERPRISE";
  const designerAvailable = () =>
    inEnterprise() && (input.isDesignerActive?.() ?? true);
  const compatibilityViewAvailable = inEnterprise;
  const currentEnterpriseId = () => enterpriseId(input.context);

  return [
    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.list",
        modelName: "enterprise_operating_graph_list",
        title: "Enterprise Operating Graphs",
        description: "List Enterprise Operating Graph drafts and published versions for the current Host-resolved Enterprise Context.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
        capability: "enterprise.operating-graph.read"
      }),
      available: designerAvailable,
      execute() {
        return {
          graphs: input.service.list({
            enterpriseId: currentEnterpriseId()
          })
        };
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.get",
        modelName: "enterprise_operating_graph_get",
        title: "Enterprise Operating Graph",
        description: "Read one Enterprise Operating Graph semantic model from the current Enterprise Context. Guidance relations are advisory and enterprise relations are Human-confirmed truth. Layout is stored separately as View State.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" }
          },
          required: ["graphId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
        capability: "enterprise.operating-graph.read"
      }),
      available: designerAvailable,
      execute(args) {
        return input.service.get({
          enterpriseId: currentEnterpriseId(),
          graphId: stringArg(args, "graphId")!
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.create",
        modelName: "enterprise_operating_graph_create",
        title: "Create Enterprise Operating Graph draft",
        description: "Create a new Enterprise Operating Graph DRAFT in the current Enterprise Context. This creates an empty governed semantic model only; it does not publish enterprise truth.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: {
              type: "string",
              description: "Optional stable graph id. Omit to use the v0.1 primary enterprise graph."
            }
          },
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
        capability: "enterprise.operating-graph.write"
      }),
      available: designerAvailable,
      execute(args) {
        const graphId = stringArg(args, "graphId", false);
        return input.service.create({
          enterpriseId: currentEnterpriseId(),
          graphId: graphId ?? PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.proposal.apply",
        modelName: "enterprise_operating_graph_proposal_apply",
        title: "Apply EOG semantic draft proposal",
        description: "Apply one proposal-level semantic operation to an Enterprise Operating Graph DRAFT. Allowed: bind/remove nodes and add/remove Guidance relations. Layout belongs to the separate EOG View tools. This tool cannot confirm enterprise relations or publish the graph; those require Human action.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            expectedRevision: { type: "number" },
            operationId: {
              type: "string",
              description: "Optional stable operation id."
            },
            mutation: {
              type: "object",
              description: "One semantic EOG draft mutation. ENTERPRISE_RELATION_CONFIRM, ENTERPRISE_RELATION_REMOVE and PUBLISH are rejected.",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "NODE_BIND",
                    "NODE_REMOVE",
                    "GUIDANCE_RELATION_PUT",
                    "GUIDANCE_RELATION_REMOVE"
                  ]
                }
              },
              required: ["type"],
              additionalProperties: true
            }
          },
          required: ["graphId", "expectedRevision", "mutation"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: EOG_2D_DESIGNER_PACKAGE_ID,
        capability: "enterprise.operating-graph.write"
      }),
      available: designerAvailable,
      execute(args) {
        const operationId = stringArg(args, "operationId", false);
        return input.service.apply({
          enterpriseId: currentEnterpriseId(),
          graphId: stringArg(args, "graphId")!,
          expectedRevision: revisionArg(args),
          mutation: proposalMutation(args),
          actor: {
            type: "AGENT",
            subjectId: input.principal.subjectId
          },
          ...(operationId ? { operationId } : {})
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.view.get",
        modelName: "enterprise_operating_graph_view_get",
        title: "Enterprise Operating Graph view",
        description: "Read or initialize a renderer-independent EOG View State. DIAGRAM_2D stores x/y layout. SPATIAL_3D stores x/y/z placement and may store a camera. View State is not enterprise truth.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            kind: {
              type: "string",
              enum: ["DIAGRAM_2D", "SPATIAL_3D"]
            },
            viewId: { type: "string" }
          },
          required: ["graphId", "kind"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.view.read"
      }),
      available: compatibilityViewAvailable,
      execute(args) {
        const graphId = stringArg(args, "graphId")!;
        const enterpriseId = currentEnterpriseId();
        input.service.get({
          enterpriseId,
          graphId
        });
        const kind = viewKindArg(args);
        const suppliedViewId = stringArg(args, "viewId", false);
        const viewId = suppliedViewId ?? defaultViewId(graphId, kind);
        const existing = input.viewService.list({
          enterpriseId,
          graphId
        }).find(view => view.viewId === viewId);
        return existing ?? {
          contractVersion: "0.1.0",
          viewId,
          graphId,
          enterpriseId,
          kind,
          revision: 0,
          placements: [],
          createdAt: "",
          updatedAt: ""
        };
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.view.apply",
        modelName: "enterprise_operating_graph_view_apply",
        title: "Arrange Enterprise Operating Graph view",
        description: "Change only EOG presentation state: node placement or a 3D camera. This does not change semantic graph revision, Guidance, Human-confirmed relations, or publication state.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            kind: {
              type: "string",
              enum: ["DIAGRAM_2D", "SPATIAL_3D"]
            },
            viewId: { type: "string" },
            expectedRevision: { type: "number" },
            mutation: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["NODE_POSITION_SET", "CAMERA_SET"]
                }
              },
              required: ["type"],
              additionalProperties: true
            }
          },
          required: ["graphId", "kind", "expectedRevision", "mutation"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.view.write"
      }),
      available: compatibilityViewAvailable,
      execute(args) {
        const graphId = stringArg(args, "graphId")!;
        const graph = input.service.get({
          enterpriseId: currentEnterpriseId(),
          graphId
        });
        const mutation = viewMutation(args);
        if (
          mutation.type === "NODE_POSITION_SET"
          && !graph.nodes.some(node =>
            node.nodeId === mutation.placement.nodeId
          )
        ) {
          throw new Error("EOG_VIEW_NODE_NOT_FOUND");
        }
        const view = input.viewService.ensure({
          enterpriseId: currentEnterpriseId(),
          graphId,
          kind: viewKindArg(args),
          ...(stringArg(args, "viewId", false)
            ? { viewId: stringArg(args, "viewId", false) }
            : {})
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
