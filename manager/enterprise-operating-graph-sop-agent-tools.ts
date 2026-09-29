import type {
  AgentToolDescriptorV010
} from "../agents/enterprise-agent/contracts.js";
import type {
  EnterpriseAgentToolRegistrationV010
} from "../agents/enterprise-agent/host-tool-catalog.js";
import type {
  EogExpectedSopTransitionInputV010
} from "../contracts/enterprise-operating-graph-sop.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";
import type {
  EogExpectedSopServiceV010
} from "./enterprise-operating-graph-sop-service.js";

function descriptor(
  input: Omit<AgentToolDescriptorV010, "contractVersion">
): AgentToolDescriptorV010 {
  return {
    contractVersion: "0.1.0",
    ...input
  };
}

function enterpriseId(context: ResolvedContextSetV010): string {
  if (
    context.activeContext.kind !== "ENTERPRISE"
    || !context.activeContext.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return context.activeContext.enterpriseId.trim();
}

function textArg(
  args: Record<string, unknown>,
  key: string,
  required = true
): string | undefined {
  const value = args[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EOG_SOP_AGENT_ARGUMENT_INVALID:" + key);
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
    throw new Error(
      "EOG_SOP_AGENT_ARGUMENT_INVALID:expectedRevision"
    );
  }
  return value;
}

function applicationNodeIdsArg(
  args: Record<string, unknown>,
  required = true
): string[] | undefined {
  const value = args.applicationNodeIds;
  if (value === undefined && !required) return undefined;
  if (
    !Array.isArray(value)
    || value.some(item =>
      typeof item !== "string" || !item.trim()
    )
  ) {
    throw new Error(
      "EOG_SOP_AGENT_ARGUMENT_INVALID:applicationNodeIds"
    );
  }
  return value.map(item => String(item).trim());
}

function transitionsArg(
  args: Record<string, unknown>,
  required = true
): EogExpectedSopTransitionInputV010[] | undefined {
  const value = args.transitions;
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(
      "EOG_SOP_AGENT_ARGUMENT_INVALID:transitions"
    );
  }
  return value.map(item => {
    if (
      item === null
      || Array.isArray(item)
      || typeof item !== "object"
    ) {
      throw new Error(
        "EOG_SOP_AGENT_ARGUMENT_INVALID:transitions"
      );
    }
    const input = item as Record<string, unknown>;
    const from = input.fromApplicationNodeId;
    const to = input.toApplicationNodeId;
    const kind = input.kind;
    const conditionRef = input.conditionRef;
    const exceptionCode = input.exceptionCode;
    if (
      typeof from !== "string"
      || !from.trim()
      || typeof to !== "string"
      || !to.trim()
      || (
        kind !== undefined
        && kind !== "EXPECTED"
        && kind !== "ALLOWED_ALTERNATIVE"
        && kind !== "ALLOWED_EXCEPTION"
      )
      || (
        conditionRef !== undefined
        && (typeof conditionRef !== "string" || !conditionRef.trim())
      )
      || (
        exceptionCode !== undefined
        && (typeof exceptionCode !== "string" || !exceptionCode.trim())
      )
    ) {
      throw new Error(
        "EOG_SOP_AGENT_ARGUMENT_INVALID:transitions"
      );
    }
    return {
      fromApplicationNodeId: from.trim(),
      toApplicationNodeId: to.trim(),
      ...(kind === undefined ? {} : { kind }),
      ...(conditionRef === undefined
        ? {}
        : { conditionRef: conditionRef.trim() }),
      ...(exceptionCode === undefined
        ? {}
        : { exceptionCode: exceptionCode.trim() })
    };
  });
}

export function createEogExpectedSopAgentToolRegistrationsV010(
  input: {
    service: EogExpectedSopServiceV010;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
  }
): EnterpriseAgentToolRegistrationV010[] {
  const available = () =>
    input.context.activeContext.kind === "ENTERPRISE";
  const currentEnterpriseId = () => enterpriseId(input.context);

  return [
    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.sop.list",
        modelName: "enterprise_operating_graph_sop_list",
        title: "Enterprise SOPs",
        description: "Read expected SOP drafts and Human-published SOPs for one Enterprise Operating Graph. Published SOPs are enterprise truth; drafts are proposals only.",
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
        capability: "enterprise.operating-graph.sop.read"
      }),
      available,
      execute(args) {
        return {
          sops: input.service.list({
            enterpriseId: currentEnterpriseId(),
            graphId: textArg(args, "graphId")!
          })
        };
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.sop.draft.create",
        modelName: "enterprise_operating_graph_sop_draft_create",
        title: "Create SOP draft",
        description: "Create an expected SOP DRAFT as an ordered sequence of EOG Application nodes. This is a proposal only and cannot become enterprise truth until a Human publishes it.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            sopId: { type: "string" },
            title: { type: "string" },
            applicationNodeIds: {
              type: "array",
              items: { type: "string" },
              minItems: 1
            },
            transitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fromApplicationNodeId: { type: "string" },
                  toApplicationNodeId: { type: "string" },
                  kind: {
                    type: "string",
                    enum: [
                      "EXPECTED",
                      "ALLOWED_ALTERNATIVE",
                      "ALLOWED_EXCEPTION"
                    ]
                  },
                  conditionRef: { type: "string" },
                  exceptionCode: { type: "string" }
                },
                required: [
                  "fromApplicationNodeId",
                  "toApplicationNodeId"
                ],
                additionalProperties: false
              }
            }
          },
          required: [
            "graphId",
            "sopId",
            "title",
            "applicationNodeIds"
          ],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.sop.write"
      }),
      available,
      execute(args) {
        return input.service.create({
          enterpriseId: currentEnterpriseId(),
          graphId: textArg(args, "graphId")!,
          sopId: textArg(args, "sopId")!,
          title: textArg(args, "title")!,
          applicationNodeIds:
            applicationNodeIdsArg(args)!,
          ...(Array.isArray(args.transitions)
            ? { transitions: transitionsArg(args)! }
            : {})
        });
      }
    },

    {
      descriptor: descriptor({
        id: "enterprise.operating_graph.sop.draft.revise",
        modelName: "enterprise_operating_graph_sop_draft_revise",
        title: "Revise SOP draft",
        description: "Revise an expected SOP DRAFT. This tool cannot publish an SOP and cannot modify a Human-published SOP.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: { type: "string" },
            sopId: { type: "string" },
            expectedRevision: { type: "number" },
            title: { type: "string" },
            applicationNodeIds: {
              type: "array",
              items: { type: "string" }
            },
            transitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fromApplicationNodeId: { type: "string" },
                  toApplicationNodeId: { type: "string" },
                  kind: {
                    type: "string",
                    enum: [
                      "EXPECTED",
                      "ALLOWED_ALTERNATIVE",
                      "ALLOWED_EXCEPTION"
                    ]
                  },
                  conditionRef: { type: "string" },
                  exceptionCode: { type: "string" }
                },
                required: [
                  "fromApplicationNodeId",
                  "toApplicationNodeId"
                ],
                additionalProperties: false
              }
            }
          },
          required: [
            "graphId",
            "sopId",
            "expectedRevision"
          ],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.operating-graph.sop.write"
      }),
      available,
      execute(args) {
        const title = textArg(args, "title", false);
        const applicationNodeIds =
          applicationNodeIdsArg(args, false);
        const transitions = transitionsArg(args, false);
        return input.service.revise({
          enterpriseId: currentEnterpriseId(),
          graphId: textArg(args, "graphId")!,
          sopId: textArg(args, "sopId")!,
          expectedRevision: revisionArg(args),
          ...(title ? { title } : {}),
          ...(applicationNodeIds
            ? { applicationNodeIds }
            : {}),
          ...(transitions ? { transitions } : {})
        });
      }
    }
  ];
}
