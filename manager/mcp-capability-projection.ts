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

export interface McpCapabilityProjectionOptionsV010 {
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  actionRouter: AppActionRouter;
  productAdapter?: McpProductToolAdapterV010;
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

export function createMcpCapabilityProjectionV010(
  options: McpCapabilityProjectionOptionsV010
): McpCapabilityProjectionV010 {
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

      const accessIds = new Set(access.operationIds);
      return catalog.operations
        .filter(operation =>
          accessIds.has(operation.operationId)
          && supportedEffect(operation.effect)
        )
        .map(operation => {
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
          return options.productAdapter
            ? options.productAdapter.adaptTool({
                access,
                effect: operation.effect,
                tool
              })
            : tool;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async callTool({
      access,
      correlationId,
      name,
      arguments: args
    }) {
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
