export const MCP_PROTOCOL_VERSION_2026_07_28 = "2026-07-28" as const;

export type McpJsonRpcIdV010 = string | number;

export type McpModernToolSecuritySchemeV010 =
  | { type: "noauth" }
  | { type: "oauth2"; scopes: string[] };

export interface McpModernToolV010 {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  securitySchemes?: McpModernToolSecuritySchemeV010[];
  _meta?: Record<string, unknown>;
}

export interface McpModernCallToolResultV010 {
  content: Array<
    | { type: "text"; text: string }
    | { type: "resource_link"; name: string; uri: string; description?: string }
  >;
  structuredContent?: unknown;
  isError?: boolean;
}

export interface McpModernServerInfoV010 {
  name: string;
  version: string;
  title?: string;
  description?: string;
  websiteUrl?: string;
}

export interface McpModernRequestV010 {
  jsonrpc: "2.0";
  id: McpJsonRpcIdV010;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpModernResponseV010 {
  jsonrpc: "2.0";
  id: McpJsonRpcIdV010 | null;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpModernCoreV010 {
  handle(request: McpModernRequestV010): Promise<McpModernResponseV010>;
}

export interface McpModernCoreOptionsV010 {
  serverInfo: McpModernServerInfoV010;
  instructions?: string;
  listTools(): Promise<McpModernToolV010[]> | McpModernToolV010[];
  callTool(input: {
    name: string;
    arguments: Record<string, unknown>;
  }): Promise<McpModernCallToolResultV010> | McpModernCallToolResultV010;
}

const SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";

function serverMeta(
  serverInfo: McpModernServerInfoV010
): Record<string, unknown> {
  return {
    [SERVER_INFO_META_KEY]: structuredClone(serverInfo)
  };
}

function success(
  id: McpJsonRpcIdV010,
  result: Record<string, unknown>
): McpModernResponseV010 {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      resultType: "complete",
      ...result
    }
  };
}

function failure(
  id: McpJsonRpcIdV010 | null,
  code: number,
  message: string,
  data?: unknown
): McpModernResponseV010 {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data })
    }
  };
}

function paramsMeta(
  params: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  const value = params?._meta;
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function validateModernEnvelope(
  request: McpModernRequestV010
): McpModernResponseV010 | undefined {
  const meta = paramsMeta(request.params);
  if (!meta) {
    return failure(
      request.id,
      -32602,
      "Invalid params",
      { code: "MCP_MODERN_META_REQUIRED" }
    );
  }
  if (
    meta["io.modelcontextprotocol/protocolVersion"]
    !== MCP_PROTOCOL_VERSION_2026_07_28
  ) {
    return failure(
      request.id,
      -32602,
      "Invalid params",
      {
        code: "MCP_PROTOCOL_VERSION_UNSUPPORTED",
        supported: [MCP_PROTOCOL_VERSION_2026_07_28]
      }
    );
  }
  const clientCapabilities =
    meta["io.modelcontextprotocol/clientCapabilities"];
  if (
    clientCapabilities === null
    || typeof clientCapabilities !== "object"
    || Array.isArray(clientCapabilities)
  ) {
    return failure(
      request.id,
      -32602,
      "Invalid params",
      { code: "MCP_CLIENT_CAPABILITIES_REQUIRED" }
    );
  }
  const clientInfo = meta["io.modelcontextprotocol/clientInfo"];
  if (
    clientInfo !== undefined
    && (
      clientInfo === null
      || typeof clientInfo !== "object"
      || Array.isArray(clientInfo)
    )
  ) {
    return failure(
      request.id,
      -32602,
      "Invalid params",
      { code: "MCP_CLIENT_INFO_INVALID" }
    );
  }
  return undefined;
}

function toolName(params: Record<string, unknown> | undefined): string | undefined {
  const value = params?.name;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toolArguments(
  params: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  const value = params?.arguments;
  if (value === undefined) return {};
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function createMcpModernCoreV010(
  options: McpModernCoreOptionsV010
): McpModernCoreV010 {
  return {
    async handle(request) {
      if (
        request.jsonrpc !== "2.0"
        || (typeof request.id !== "string" && typeof request.id !== "number")
        || !request.method.trim()
      ) {
        return failure(null, -32600, "Invalid Request");
      }

      const envelopeError = validateModernEnvelope(request);
      if (envelopeError) return envelopeError;

      if (request.method === "server/discover") {
        return success(request.id, {
          supportedVersions: [MCP_PROTOCOL_VERSION_2026_07_28],
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          ...(options.instructions
            ? { instructions: options.instructions }
            : {}),
          ttlMs: 300_000,
          cacheScope: "private",
          _meta: serverMeta(options.serverInfo)
        });
      }

      if (request.method === "tools/list") {
        const tools = await options.listTools();
        return success(request.id, {
          tools: structuredClone(tools)
            .sort((a, b) => a.name.localeCompare(b.name)),
          ttlMs: 0,
          cacheScope: "private",
          _meta: serverMeta(options.serverInfo)
        });
      }

      if (request.method === "tools/call") {
        const name = toolName(request.params);
        const args = toolArguments(request.params);
        if (!name || !args) {
          return failure(
            request.id,
            -32602,
            "Invalid params",
            { code: "MCP_TOOL_CALL_INPUT_INVALID" }
          );
        }
        try {
          const result = structuredClone(await options.callTool({
            name,
            arguments: structuredClone(args)
          }));
          return success(request.id, {
            content: result.content,
            ...(result.structuredContent === undefined
              ? {}
              : { structuredContent: result.structuredContent }),
            ...(result.isError === undefined
              ? {}
              : { isError: result.isError }),
            _meta: serverMeta(options.serverInfo)
          });
        } catch (error) {
          return failure(
            request.id,
            -32603,
            "Internal error",
            {
              code: "MCP_TOOL_CALL_FAILED",
              message: error instanceof Error ? error.message : String(error)
            }
          );
        }
      }

      return failure(request.id, -32601, "Method not found");
    }
  };
}
