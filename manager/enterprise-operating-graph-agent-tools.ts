import type {
  AgentToolDescriptorV010
} from "../agents/enterprise-agent/contracts.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
} from "../contracts/enterprise-operating-graph.js";
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
  return mutation;
}

export function createEnterpriseOperatingGraphAgentToolRegistrationsV010(
  input: {
    service: EnterpriseOperatingGraphHostServiceV010;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
  }
): EnterpriseAgentToolRegistrationV010[] {
  const available = () => input.context.activeContext.kind === "ENTERPRISE";

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
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.read"
      }),
      available,
      execute() {
        return {
          graphs: input.service.list({
            enterpriseId: enterpriseId(input.context)
          })
        };
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.get",
        modelName: "enterprise_operating_graph_get",
        title: "Enterprise Operating Graph",
        description: "Read one Enterprise Operating Graph from the current Enterprise Context. Guidance relations are advisory and enterprise relations are Human-confirmed truth.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" }
          },
          required: ["graphId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.read"
      }),
      available,
      execute(args) {
        return input.service.get({
          enterpriseId: enterpriseId(input.context),
          graphId: stringArg(args, "graphId")!
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.create",
        modelName: "enterprise_operating_graph_create",
        title: "Create Enterprise Operating Graph draft",
        description: "Create a new Enterprise Operating Graph DRAFT in the current Enterprise Context. This creates an empty governed model only; it does not publish enterprise truth.",
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
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.write"
      }),
      available,
      execute(args) {
        const graphId = stringArg(args, "graphId", false);
        return input.service.create({
          enterpriseId: enterpriseId(input.context),
          graphId: graphId ?? PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.proposal.apply",
        modelName: "enterprise_operating_graph_proposal_apply",
        title: "Apply EOG draft proposal operation",
        description: "Apply one proposal-level operation to an Enterprise Operating Graph DRAFT. Allowed: bind/remove nodes, add/remove Guidance relations, and move nodes. This tool cannot confirm enterprise relations or publish the graph; those require Human action.",
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
              description: "One EOG draft mutation. ENTERPRISE_RELATION_CONFIRM, ENTERPRISE_RELATION_REMOVE and PUBLISH are rejected.",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "NODE_BIND",
                    "NODE_REMOVE",
                    "GUIDANCE_RELATION_PUT",
                    "GUIDANCE_RELATION_REMOVE",
                    "NODE_MOVE"
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
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.write"
      }),
      available,
      execute(args) {
        const operationId = stringArg(args, "operationId", false);
        return input.service.apply({
          enterpriseId: enterpriseId(input.context),
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
    }
  ];
}
