import type { AppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010, JsonValue } from "../actions/contracts.js";
import type {
  EffectiveExternalAgentOAuthAccessV010
} from "../contracts/external-agent-oauth.js";
import type {
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  capabilityOperationPublicMetadataV010
} from "./capability-operation-access.js";
import {
  listEffectiveDelegatedCapabilityOperationsV010,
  resolveEffectiveDelegatedCapabilityOperationV010,
  type EffectiveDelegatedAuthorityDependenciesV010
} from "./external-agent-delegated-access.js";
import type {
  McpModernCallToolResultV010,
  McpModernToolV010
} from "./mcp-modern-core.js";
import type {
  McpProductToolAdapterV010
} from "./mcp-product-adapter.js";
import {
  AGENT_CAPABILITY_FABRIC_DESCRIBE,
  AGENT_CAPABILITY_FABRIC_INVOKE,
  AGENT_CAPABILITY_FABRIC_SEARCH,
  createAgentCapabilityFabricV010
} from "./agent-capability-fabric.js";

export interface McpCapabilityProjectionV010 {
  listTools(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    correlationId: string;
  }): Promise<McpModernToolV010[]>;
  callTool(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    correlationId: string;
    name: string;
    arguments: Record<string, unknown>;
  }): Promise<McpModernCallToolResultV010>;
}

export type McpCapabilityProjectionModeV010 =
  | "DIRECT"
  | "HYBRID"
  | "FABRIC";

export interface McpCapabilityProjectionOptionsV010 {
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  actionRouter: AppActionRouter;
  productAdapter?: McpProductToolAdapterV010;
  mode?: McpCapabilityProjectionModeV010;
}

function supportedEffect(effect: string): boolean {
  return effect === "READ" || effect === "PLAN";
}

function jsonObject(
  value: Record<string, unknown>
): Record<string, JsonValue> {
  try {
    const cloned = JSON.parse(JSON.stringify(value)) as unknown;
    if (
      cloned === null
      || typeof cloned !== "object"
      || Array.isArray(cloned)
    ) {
      throw new Error("MCP_TOOL_ARGUMENTS_INVALID");
    }
    return cloned as Record<string, JsonValue>;
  } catch {
    throw new Error("MCP_TOOL_ARGUMENTS_INVALID");
  }
}

function externalRequestContext(
  base: PlatformRequestContextV010,
  access: EffectiveExternalAgentOAuthAccessV010,
  correlationId: string
): PlatformRequestContextV010 {
  return {
    ...structuredClone(base),
    correlationId,
    delegatedActor: {
      contractVersion: "0.1.0",
      kind: "EXTERNAL_AGENT",
      agentId: access.agentId,
      clientId: access.clientId,
      grantId: access.grantId
    }
  };
}

function unavailableToolResult(): McpModernCallToolResultV010 {
  return {
    isError: true,
    content: [{
      type: "text",
      text: "The requested tool is not currently available to this authorized client."
    }]
  };
}

function executionFailure(
  correlationId: string | undefined
): McpModernCallToolResultV010 {
  return {
    isError: true,
    content: [{
      type: "text",
      text: JSON.stringify({
        ok: false,
        error: {
          code: "MCP_TOOL_EXECUTION_FAILED"
        },
        ...(correlationId ? { correlationId } : {})
      })
    }]
  };
}

function successfulToolResult(
  result: JsonValue | undefined,
  correlationId: string | undefined
): McpModernCallToolResultV010 {
  const content = {
    ok: true,
    ...(result === undefined ? {} : { result }),
    ...(correlationId ? { correlationId } : {})
  };
  return {
    content: [{
      type: "text",
      text: JSON.stringify(content)
    }],
    ...(result === undefined
      ? {}
      : { structuredContent: structuredClone(result) })
  };
}


function fabricToolDefinitions(): Array<{
  effect: "READ" | "PLAN";
  tool: McpModernToolV010;
}> {
  return [
    {
      effect: "READ",
      tool: {
        name: AGENT_CAPABILITY_FABRIC_SEARCH,
        title: "Search EVO Capabilities",
        description:
          "Search the current authorized EVO capability catalog by intent. Results are bounded to current delegated authority and do not expose unauthorized operations.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["query"],
          properties: {
            query: {
              type: "string",
              minLength: 1,
              maxLength: 240,
              description:
                "Natural-language or machine-oriented capability search terms."
            },
            capability: {
              type: "string",
              minLength: 1,
              maxLength: 160,
              description:
                "Optional exact Capability id filter."
            },
            effects: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "string",
                enum: ["READ", "PLAN"]
              }
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 20,
              default: 10
            }
          }
        },
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: [
            "contractVersion",
            "kind",
            "query",
            "matchedCount",
            "returnedCount",
            "truncated",
            "items"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            kind: {
              const: "evo.agent-capability-fabric.search-result"
            },
            query: { type: "string" },
            matchedCount: { type: "integer", minimum: 0 },
            returnedCount: { type: "integer", minimum: 0 },
            truncated: { type: "boolean" },
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "contractVersion",
                  "operationId",
                  "capability",
                  "operationVersion",
                  "title",
                  "description",
                  "effect",
                  "dataScope"
                ],
                properties: {
                  contractVersion: { const: "0.1.0" },
                  operationId: { type: "string" },
                  capability: { type: "string" },
                  operationVersion: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  effect: {
                    type: "string",
                    enum: ["READ", "PLAN"]
                  },
                  dataScope: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    {
      effect: "READ",
      tool: {
        name: AGENT_CAPABILITY_FABRIC_DESCRIBE,
        title: "Describe EVO Capability",
        description:
          "Read the public contract of one currently authorized EVO Capability Operation, including its input and output schemas.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["operationId"],
          properties: {
            operationId: {
              type: "string",
              minLength: 1,
              maxLength: 240
            }
          }
        },
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["contractVersion", "kind", "operation"],
          properties: {
            contractVersion: { const: "0.1.0" },
            kind: {
              const:
                "evo.agent-capability-fabric.operation-description"
            },
            operation: { type: "object" }
          }
        }
      }
    },
    {
      effect: "PLAN",
      tool: {
        name: AGENT_CAPABILITY_FABRIC_INVOKE,
        title: "Invoke EVO Capability",
        description:
          "Invoke one currently authorized EVO READ or PLAN Capability Operation by operationId. Current Grant, Human, Context, lifecycle and authorization are re-evaluated before execution.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["operationId"],
          properties: {
            operationId: {
              type: "string",
              minLength: 1,
              maxLength: 240
            },
            input: {
              type: "object",
              description:
                "Input matching the operation contract returned by evo.capabilities.describe."
            }
          }
        },
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: [
            "contractVersion",
            "kind",
            "operationId",
            "correlationId"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            kind: {
              const: "evo.agent-capability-fabric.invoke-result"
            },
            operationId: { type: "string" },
            correlationId: { type: "string" },
            result: {}
          }
        }
      }
    }
  ];
}

function fabricErrorResult(
  error: unknown
): McpModernCallToolResultV010 {
  const code = error instanceof Error
    ? error.message.split(":")[0]?.trim()
    : "AGENT_CAPABILITY_FABRIC_FAILED";
  const publicCode = code === "AGENT_CAPABILITY_NOT_AVAILABLE"
    ? code
    : code?.startsWith("AGENT_CAPABILITY_FABRIC_")
      ? code
      : code === "AGENT_CAPABILITY_AUTHORITY_INACTIVE"
        ? code
        : "AGENT_CAPABILITY_FABRIC_FAILED";
  return {
    isError: true,
    content: [{
      type: "text",
      text: JSON.stringify({
        ok: false,
        error: {
          code: publicCode || "AGENT_CAPABILITY_FABRIC_FAILED"
        }
      })
    }]
  };
}

export function createMcpCapabilityProjectionV010(
  options: McpCapabilityProjectionOptionsV010
): McpCapabilityProjectionV010 {
  const mode = options.mode ?? "DIRECT";
  const fabric = createAgentCapabilityFabricV010({
    delegatedAuthority: options.delegatedAuthority,
    actionRouter: options.actionRouter
  });

  return {
    async listTools({ access, correlationId }) {
      const catalog = await listEffectiveDelegatedCapabilityOperationsV010({
        dependencies: options.delegatedAuthority,
        grantId: access.grantId,
        agentId: access.agentId,
        clientId: access.clientId,
        correlationId
      });

      if (!catalog.active) return [];

      const tools: McpModernToolV010[] = [];

      if (mode !== "DIRECT") {
        for (const definition of fabricToolDefinitions()) {
          tools.push(
            options.productAdapter
              ? options.productAdapter.adaptTool({
                  access,
                  effect: definition.effect,
                  tool: definition.tool
                })
              : structuredClone(definition.tool)
          );
        }
      }

      if (mode !== "FABRIC") {
        const accessIds = new Set(access.operationIds);
        for (const operation of catalog.operations) {
          if (
            !accessIds.has(operation.operationId)
            || !supportedEffect(operation.effect)
          ) {
            continue;
          }
          const publicMetadata =
            capabilityOperationPublicMetadataV010(operation) as {
              operationId: string;
              title: string;
              description: string;
              inputSchema: Record<string, unknown>;
              outputSchema: Record<string, unknown>;
            };
          const tool: McpModernToolV010 = {
            name: publicMetadata.operationId,
            title: publicMetadata.title,
            description: publicMetadata.description,
            inputSchema: structuredClone(publicMetadata.inputSchema),
            outputSchema: structuredClone(publicMetadata.outputSchema)
          };
          tools.push(
            options.productAdapter
              ? options.productAdapter.adaptTool({
                  access,
                  effect: operation.effect,
                  tool
                })
              : tool
          );
        }
      }

      return tools.sort((a, b) => a.name.localeCompare(b.name));
    },

    async callTool({
      access,
      correlationId,
      name,
      arguments: args
    }) {
      if (mode !== "DIRECT" && name === AGENT_CAPABILITY_FABRIC_SEARCH) {
        try {
          const query = typeof args.query === "string" ? args.query : "";
          const capability =
            typeof args.capability === "string"
              ? args.capability
              : undefined;
          const effects = Array.isArray(args.effects)
            ? args.effects.filter(
                (item): item is "READ" | "PLAN" =>
                  item === "READ" || item === "PLAN"
              )
            : undefined;
          const limit =
            typeof args.limit === "number"
              ? args.limit
              : undefined;
          const result = await fabric.search({
            access,
            correlationId,
            query,
            ...(capability ? { capability } : {}),
            ...(effects ? { effects } : {}),
            ...(limit === undefined ? {} : { limit })
          });
          return successfulToolResult(
            result as unknown as JsonValue,
            correlationId
          );
        } catch (error) {
          return fabricErrorResult(error);
        }
      }

      if (mode !== "DIRECT" && name === AGENT_CAPABILITY_FABRIC_DESCRIBE) {
        try {
          const operationId =
            typeof args.operationId === "string"
              ? args.operationId
              : "";
          const result = await fabric.describe({
            access,
            correlationId,
            operationId
          });
          return successfulToolResult(
            result as unknown as JsonValue,
            correlationId
          );
        } catch (error) {
          return fabricErrorResult(error);
        }
      }

      if (mode !== "DIRECT" && name === AGENT_CAPABILITY_FABRIC_INVOKE) {
        try {
          const operationId =
            typeof args.operationId === "string"
              ? args.operationId
              : "";
          const values =
            args.input !== null
            && typeof args.input === "object"
            && !Array.isArray(args.input)
              ? args.input as Record<string, unknown>
              : undefined;
          const result = await fabric.invoke({
            access,
            correlationId,
            operationId,
            ...(values ? { values } : {})
          });
          return successfulToolResult(
            result as unknown as JsonValue,
            result.correlationId
          );
        } catch (error) {
          return fabricErrorResult(error);
        }
      }

      if (mode === "FABRIC") {
        return unavailableToolResult();
      }

      const resolution =
        await resolveEffectiveDelegatedCapabilityOperationV010({
          dependencies: options.delegatedAuthority,
          grantId: access.grantId,
          agentId: access.agentId,
          clientId: access.clientId,
          operationId: name,
          correlationId
        });

      if (
        !resolution.allowed
        || !resolution.operation
        || !resolution.requestContext
        || !supportedEffect(resolution.operation.effect)
      ) {
        return unavailableToolResult();
      }

      // The access-token operation list is an additional bounded credential
      // scope. Current delegated authority may shrink but never expand a token.
      if (!access.operationIds.includes(resolution.operation.operationId)) {
        return unavailableToolResult();
      }

      const operation = resolution.operation;
      if (operation.binding.type !== "ACTION_HOST") {
        return unavailableToolResult();
      }

      let values: Record<string, JsonValue>;
      try {
        values = jsonObject(args);
      } catch {
        return {
          isError: true,
          content: [{
            type: "text",
            text: "Tool arguments must be a JSON object."
          }]
        };
      }

      const context = externalRequestContext(
        resolution.requestContext,
        access,
        correlationId
      );
      const request: AppActionRequestV010 = {
        contractVersion: "0.1.0",
        type: "command",
        command: {
          code: operation.binding.commandCode,
          inputVersion: operation.binding.inputVersion
        },
        values,
        sourceInteractionId: "mcp:" + correlationId,
        actionId: operation.operationId,
        requiresConfirmation: false
      };

      const result = await options.actionRouter.execute(request, context);
      if (!result.ok) {
        return executionFailure(result.correlationId ?? correlationId);
      }
      return successfulToolResult(
        result.result,
        result.correlationId ?? correlationId
      );
    }
  };
}
