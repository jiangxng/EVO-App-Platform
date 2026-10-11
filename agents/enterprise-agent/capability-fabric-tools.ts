import type {
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type { AppActionRouter } from "../../actions/router.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type { AppManagerService } from "../../manager/service.js";
import {
  capabilityOperationPublicMetadataV010,
  listAuthorizedCapabilityOperationsV010,
  type EffectiveCapabilityOperationV010
} from "../../manager/capability-operation-access.js";
import type {
  EnterpriseAgentToolRegistrationV010
} from "./host-tool-catalog.js";

export const PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID =
  "evo.capabilities.search" as const;
export const PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID =
  "evo.capabilities.describe" as const;
export const PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID =
  "evo.capabilities.invoke.read-plan" as const;
export const PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID =
  "evo.capabilities.invoke.write" as const;

type CapabilityEffect = "READ" | "PLAN" | "WRITE";

export function personalAgentCapabilityRequestContextV010(
  base: PlatformRequestContextV010
): PlatformRequestContextV010 {
  return {
    ...structuredClone(base),
    principal: {
      ...structuredClone(base.principal),
      actorType: "AI"
    }
  };
}

function normalizedText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

function queryTokens(value: string): string[] {
  const normalized = normalizedText(value);
  if (!normalized || normalized.length > 240) {
    throw new Error("PERSONAL_AGENT_CAPABILITY_QUERY_INVALID");
  }
  return Array.from(new Set(
    normalized
      .split(/[\s,.;:!?/\\()[\]{}"'~@#$%^&*+=<>|_-]+/u)
      .map(item => item.trim())
      .filter(Boolean)
  )).slice(0, 16);
}

function boundedLimit(value: unknown): number {
  if (value === undefined) return 10;
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 1
    || value > 20
  ) {
    throw new Error("PERSONAL_AGENT_CAPABILITY_LIMIT_INVALID");
  }
  return value;
}

function requestedEffects(value: unknown): Set<CapabilityEffect> {
  if (value === undefined) return new Set(["READ", "PLAN", "WRITE"]);
  if (
    !Array.isArray(value)
    || value.length === 0
    || value.some(item =>
      item !== "READ" && item !== "PLAN" && item !== "WRITE"
    )
  ) {
    throw new Error("PERSONAL_AGENT_CAPABILITY_EFFECT_FILTER_INVALID");
  }
  return new Set(value as CapabilityEffect[]);
}

function scoreOperation(
  operation: EffectiveCapabilityOperationV010,
  tokens: readonly string[]
): number {
  const operationId = normalizedText(operation.operationId);
  const capability = normalizedText(operation.capability);
  const title = normalizedText(operation.title);
  const description = normalizedText(operation.description);
  let score = 0;

  for (const token of tokens) {
    if (operationId === token) score += 120;
    else if (operationId.includes(token)) score += 40;

    if (capability === token) score += 90;
    else if (capability.includes(token)) score += 28;

    if (title === token) score += 60;
    else if (title.includes(token)) score += 18;

    if (description.includes(token)) score += 6;
  }

  return score;
}

function stringArgument(
  args: Record<string, unknown>,
  key: string
): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("PERSONAL_AGENT_CAPABILITY_ARGUMENT_REQUIRED: " + key);
  }
  return value.trim();
}

function objectArgument(
  args: Record<string, unknown>,
  key: string
): Record<string, JsonValue> {
  const value = args[key];
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("PERSONAL_AGENT_CAPABILITY_INPUT_INVALID");
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, JsonValue>;
}

function descriptor(
  input: Omit<
    EnterpriseAgentToolRegistrationV010["descriptor"],
    "contractVersion"
  >
): EnterpriseAgentToolRegistrationV010["descriptor"] {
  return {
    contractVersion: "0.1.0",
    ...input
  };
}

export function createPersonalAgentCapabilityToolRegistrationsV010(input: {
  manager: AppManagerService;
  actionRouter: AppActionRouter;
  requestContext: PlatformRequestContextV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): EnterpriseAgentToolRegistrationV010[] {
  const agentContext =
    personalAgentCapabilityRequestContextV010(input.requestContext);

  const authorizedCatalog = () =>
    listAuthorizedCapabilityOperationsV010({
      manager: input.manager,
      authorizationProvider: input.resolveAuthorizationProvider(),
      requestContext: agentContext,
      audience: "PERSONAL_AGENT"
    });

  const operation = async (
    operationId: string
  ): Promise<EffectiveCapabilityOperationV010> => {
    const catalog = await authorizedCatalog();
    const found = catalog.operations.find(
      item => item.operationId === operationId
    );
    if (!found) {
      throw new Error("PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE");
    }
    return found;
  };

  const invoke = async (
    args: Record<string, unknown>,
    allowedEffects: readonly CapabilityEffect[]
  ) => {
    const operationId = stringArgument(args, "operationId");
    const selected = await operation(operationId);
    if (!allowedEffects.includes(selected.effect)) {
      throw new Error("PERSONAL_AGENT_CAPABILITY_EFFECT_MISMATCH");
    }
    if (selected.binding.type !== "ACTION_HOST") {
      throw new Error("PERSONAL_AGENT_CAPABILITY_BINDING_UNSUPPORTED");
    }

    const request: AppActionRequestV010 = {
      contractVersion: "0.1.0",
      type: "command",
      command: {
        code: selected.binding.commandCode,
        inputVersion: selected.binding.inputVersion
      },
      values: objectArgument(args, "input"),
      sourceInteractionId:
        "personal-agent-capability:" + input.requestContext.correlationId,
      actionId: selected.operationId,
      requiresConfirmation: false
    };
    const result = await input.actionRouter.execute(
      request,
      agentContext
    );
    if (!result.ok) {
      const code =
        result.error?.code ?? "PERSONAL_AGENT_CAPABILITY_EXECUTION_FAILED";
      const message =
        result.error?.message ?? "Capability Operation execution failed.";
      throw new Error(code + ": " + message);
    }

    return {
      contractVersion: "0.1.0",
      kind: "evo.personal-agent-capability.invoke-result",
      operationId: selected.operationId,
      effect: selected.effect,
      correlationId:
        result.correlationId ?? input.requestContext.correlationId,
      ...(result.result === undefined
        ? {}
        : { result: structuredClone(result.result) })
    };
  };

  return [{
    descriptor: descriptor({
      id: PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
      modelName: "evo_capabilities_search",
      title: "Search EVO capabilities",
      description:
        "Search the current authorized Personal Agent Capability Operations by intent instead of guessing one-off tool names. Use this when the Human asks to operate a plugin/domain capability that is not already represented by a more contextual current-surface tool.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description:
              "Natural-language or machine-oriented capability search terms."
          },
          effects: {
            type: "array",
            items: {
              type: "string",
              enum: ["READ", "PLAN", "WRITE"]
            },
            description: "Optional effect filter."
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            description: "Maximum results. Defaults to 10."
          }
        }
      },
      effect: "READ",
      ownerPackageId: "evo-app-platform",
      capability: "platform.capability-operation"
    }),
    async execute(args) {
      const query = stringArgument(args, "query");
      const tokens = queryTokens(query);
      const effects = requestedEffects(args.effects);
      const limit = boundedLimit(args.limit);
      const catalog = await authorizedCatalog();
      const ranked = catalog.operations
        .filter(item => effects.has(item.effect))
        .map(item => ({
          operation: item,
          score: scoreOperation(item, tokens)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) =>
          b.score - a.score
          || a.operation.operationId.localeCompare(b.operation.operationId)
        );
      const items = ranked.slice(0, limit).map(({ operation }) => ({
        contractVersion: operation.contractVersion,
        operationId: operation.operationId,
        capability: operation.capability,
        operationVersion: operation.operationVersion,
        title: operation.title,
        description: operation.description,
        effect: operation.effect,
        dataScope: operation.dataScope
      }));
      return {
        contractVersion: "0.1.0",
        kind: "evo.personal-agent-capability.search-result",
        query,
        matchedCount: ranked.length,
        returnedCount: items.length,
        truncated: ranked.length > items.length,
        items
      };
    }
  }, {
    descriptor: descriptor({
      id: PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
      modelName: "evo_capabilities_describe",
      title: "Describe EVO capability operation",
      description:
        "Read the public contract, input schema and output schema of one currently authorized Personal Agent Capability Operation before invoking it.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["operationId"],
        properties: {
          operationId: { type: "string" }
        }
      },
      effect: "READ",
      ownerPackageId: "evo-app-platform",
      capability: "platform.capability-operation"
    }),
    async execute(args) {
      const selected = await operation(
        stringArgument(args, "operationId")
      );
      return {
        contractVersion: "0.1.0",
        kind: "evo.personal-agent-capability.operation-description",
        operation: capabilityOperationPublicMetadataV010(selected)
      };
    }
  }, {
    descriptor: descriptor({
      id: PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID,
      modelName: "evo_capabilities_invoke_read_plan",
      title: "Invoke EVO read or plan capability",
      description:
        "Invoke one currently authorized READ or PLAN Capability Operation after discovering/describing it. The Host rechecks lifecycle, Personal Agent exposure, scope and authorization before execution.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["operationId"],
        properties: {
          operationId: { type: "string" },
          input: {
            type: "object",
            description:
              "Input matching the operation contract returned by evo_capabilities_describe."
          }
        }
      },
      effect: "PLAN",
      ownerPackageId: "evo-app-platform",
      capability: "platform.capability-operation"
    }),
    execute(args) {
      return invoke(args, ["READ", "PLAN"]);
    }
  }, {
    descriptor: descriptor({
      id: PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,
      modelName: "evo_capabilities_invoke_write",
      title: "Invoke EVO write capability",
      description:
        "Invoke one currently authorized WRITE Capability Operation after discovering/describing it. This generic bridge never grants authority: the Host issues an Agent action receipt, checks the underlying Capability Operation for the AI actor, then the Action Host rechecks the operation before domain execution.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["operationId"],
        properties: {
          operationId: { type: "string" },
          input: {
            type: "object",
            description:
              "Input matching the operation contract returned by evo_capabilities_describe."
          }
        }
      },
      effect: "WRITE",
      ownerPackageId: "evo-app-platform",
      capability: "platform.capability-operation"
    }),
    execute(args) {
      return invoke(args, ["WRITE"]);
    }
  }];
}
