import {
  MCP_PROTOCOL_VERSION_2026_07_28,
  type McpModernCoreV010,
  type McpModernRequestV010,
  type McpModernResponseV010
} from "./mcp-modern-core.js";

export const MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010 = [
  "2025-11-25",
  "2025-06-18",
  "2025-03-26"
] as const;

type McpHandshakeProtocolVersionV010 =
  typeof MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010[number];

interface McpJsonRpcMessageV010 {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpModernHttpRequestV010 {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface McpModernHttpResponseV010 {
  status: number;
  headers: Record<string, string>;
  body?: McpModernResponseV010;
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const key = Object.keys(headers).find(
    item => item.toLowerCase() === name.toLowerCase()
  );
  if (!key) return undefined;
  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function jsonRpcError(
  id: string | number | null,
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

function requestId(value: unknown): string | number | null {
  if (
    value !== null
    && typeof value === "object"
    && !Array.isArray(value)
  ) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return null;
}

function parseRequest(value: unknown): McpModernRequestV010 | undefined {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) return undefined;
  const candidate = value as Partial<McpModernRequestV010>;
  if (
    candidate.jsonrpc !== "2.0"
    || (typeof candidate.id !== "string" && typeof candidate.id !== "number")
    || typeof candidate.method !== "string"
  ) return undefined;
  if (
    candidate.params !== undefined
    && (
      candidate.params === null
      || typeof candidate.params !== "object"
      || Array.isArray(candidate.params)
    )
  ) return undefined;
  return candidate as McpModernRequestV010;
}

function parseJsonRpcMessage(
  value: unknown
): McpJsonRpcMessageV010 | undefined {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) return undefined;
  const candidate = value as {
    jsonrpc?: unknown;
    id?: unknown;
    method?: unknown;
    params?: unknown;
  };
  if (
    candidate.jsonrpc !== "2.0"
    || typeof candidate.method !== "string"
    || !candidate.method.trim()
  ) return undefined;
  if (
    candidate.id !== undefined
    && typeof candidate.id !== "string"
    && typeof candidate.id !== "number"
  ) return undefined;
  if (
    candidate.params !== undefined
    && !record(candidate.params)
  ) return undefined;
  return candidate as McpJsonRpcMessageV010;
}

function errorResponse(
  status: number,
  id: string | number | null,
  code: string,
  message: string,
  jsonRpcCode = -32600
): McpModernHttpResponseV010 {
  return {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    },
    body: jsonRpcError(id, jsonRpcCode, message, { code })
  };
}

function emptyAccepted(): McpModernHttpResponseV010 {
  return {
    status: 202,
    headers: {
      "cache-control": "no-store"
    }
  };
}

function modernEnvelopeVersion(value: unknown): string | undefined {
  const message = record(value);
  const params = record(message?.params);
  const meta = record(params?._meta);
  const version = meta?.["io.modelcontextprotocol/protocolVersion"];
  return typeof version === "string" ? version : undefined;
}

function usesModernWire(
  headers: Record<string, string | string[] | undefined>,
  body: unknown
): boolean {
  return (
    header(headers, "mcp-protocol-version") === MCP_PROTOCOL_VERSION_2026_07_28
    || header(headers, "mcp-method") !== undefined
    || header(headers, "mcp-name") !== undefined
    || modernEnvelopeVersion(body) === MCP_PROTOCOL_VERSION_2026_07_28
  );
}

function handshakeVersion(
  headers: Record<string, string | string[] | undefined>
): McpHandshakeProtocolVersionV010 | undefined {
  const value = header(headers, "mcp-protocol-version");
  if (!value) return MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010[0];
  return MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010.find(
    item => item === value
  );
}

function selectedInitializeVersion(
  params: Record<string, unknown> | undefined
): McpHandshakeProtocolVersionV010 {
  const requested = params?.protocolVersion;
  if (typeof requested === "string") {
    const exact = MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010.find(
      item => item === requested
    );
    if (exact) return exact;
  }
  return MCP_HANDSHAKE_PROTOCOL_VERSIONS_V010[0];
}

function modernMetaForLegacy(
  params: Record<string, unknown> | undefined,
  clientCapabilities: Record<string, unknown> = {},
  clientInfo?: Record<string, unknown>
): Record<string, unknown> {
  const current = record(params?._meta) ?? {};
  return {
    ...current,
    "io.modelcontextprotocol/protocolVersion":
      MCP_PROTOCOL_VERSION_2026_07_28,
    "io.modelcontextprotocol/clientCapabilities":
      structuredClone(clientCapabilities),
    ...(clientInfo
      ? {
          "io.modelcontextprotocol/clientInfo":
            structuredClone(clientInfo)
        }
      : {})
  };
}

function legacyResult(
  response: McpModernResponseV010,
  protocolVersion: McpHandshakeProtocolVersionV010,
  method: string
): McpModernResponseV010 {
  if (!response.result) return structuredClone(response);

  const result = structuredClone(response.result);
  delete result.resultType;
  delete result.ttlMs;
  delete result.cacheScope;
  delete result._meta;

  if (method === "tools/list" && Array.isArray(result.tools)) {
    result.tools = result.tools.map(value => {
      const tool = record(value);
      if (!tool) return value;
      const copy = structuredClone(tool);
      delete copy.securitySchemes;
      delete copy._meta;
      if (protocolVersion === "2025-03-26") {
        delete copy.outputSchema;
      }
      return copy;
    });
  }

  if (
    method === "tools/call"
    && protocolVersion === "2025-03-26"
  ) {
    delete result.structuredContent;
  }

  return {
    jsonrpc: "2.0",
    id: response.id,
    result
  };
}

async function handleHandshakeEra(
  core: McpModernCoreV010,
  input: McpModernHttpRequestV010,
  message: McpJsonRpcMessageV010
): Promise<McpModernHttpResponseV010> {
  if (message.id === undefined) {
    // 2025-era lifecycle and cancellation notifications are one-way. EVO's
    // External Agent surface is stateless, so no transport session mutation is
    // required after notifications/initialized.
    return emptyAccepted();
  }

  if (message.method === "initialize") {
    const protocolVersion = selectedInitializeVersion(message.params);
    const capabilities = record(message.params?.capabilities) ?? {};
    const clientInfo = record(message.params?.clientInfo);

    const discovery = await core.handle({
      jsonrpc: "2.0",
      id: message.id,
      method: "server/discover",
      params: {
        _meta: modernMetaForLegacy(
          undefined,
          capabilities,
          clientInfo
        )
      }
    });

    if (discovery.error) {
      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store"
        },
        body: discovery
      };
    }

    const discoveryResult = discovery.result ?? {};
    const discoveryMeta = record(discoveryResult._meta);
    const serverInfo = record(
      discoveryMeta?.["io.modelcontextprotocol/serverInfo"]
    ) ?? {
      name: "evo-app-platform",
      version: "0.1.0"
    };

    return {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      },
      body: {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion,
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: structuredClone(serverInfo),
          ...(typeof discoveryResult.instructions === "string"
            ? { instructions: discoveryResult.instructions }
            : {})
        }
      }
    };
  }

  const protocolVersion = handshakeVersion(input.headers);
  if (!protocolVersion) {
    return errorResponse(
      400,
      message.id,
      "MCP_LEGACY_PROTOCOL_VERSION_UNSUPPORTED",
      "Supported handshake-era MCP protocol versions are 2025-11-25, 2025-06-18 and 2025-03-26.",
      -32602
    );
  }

  if (message.method === "ping") {
    return {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      },
      body: {
        jsonrpc: "2.0",
        id: message.id,
        result: {}
      }
    };
  }

  const modern = await core.handle({
    jsonrpc: "2.0",
    id: message.id,
    method: message.method,
    params: {
      ...(message.params ?? {}),
      _meta: modernMetaForLegacy(message.params)
    }
  });

  return {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    },
    body: legacyResult(
      modern,
      protocolVersion,
      message.method
    )
  };
}

export function createMcpModernHttpAdapterV010(
  core: McpModernCoreV010
) {
  return {
    async handle(
      input: McpModernHttpRequestV010
    ): Promise<McpModernHttpResponseV010> {
      if (input.method.toUpperCase() !== "POST") {
        return {
          status: 405,
          headers: {
            allow: "POST",
            "cache-control": "no-store"
          }
        };
      }

      const contentType = header(input.headers, "content-type")
        ?.split(";")[0]
        ?.trim()
        ?.toLowerCase();
      if (contentType !== "application/json") {
        return errorResponse(
          415,
          requestId(input.body),
          "MCP_CONTENT_TYPE_UNSUPPORTED",
          "MCP HTTP requests require application/json."
        );
      }

      if (!usesModernWire(input.headers, input.body)) {
        const message = parseJsonRpcMessage(input.body);
        if (!message) {
          return errorResponse(
            400,
            requestId(input.body),
            "MCP_JSONRPC_REQUEST_INVALID",
            "Invalid JSON-RPC request."
          );
        }
        return handleHandshakeEra(core, input, message);
      }

      const request = parseRequest(input.body);
      if (!request) {
        return errorResponse(
          400,
          requestId(input.body),
          "MCP_JSONRPC_REQUEST_INVALID",
          "Invalid JSON-RPC request."
        );
      }

      const protocolVersion = header(
        input.headers,
        "mcp-protocol-version"
      );
      if (protocolVersion !== MCP_PROTOCOL_VERSION_2026_07_28) {
        return errorResponse(
          400,
          request.id,
          "MCP_PROTOCOL_VERSION_HEADER_INVALID",
          "MCP-Protocol-Version must be 2026-07-28.",
          -32602
        );
      }

      const method = header(input.headers, "mcp-method");
      if (method !== request.method) {
        return errorResponse(
          400,
          request.id,
          "MCP_METHOD_HEADER_MISMATCH",
          "Mcp-Method must exactly match the JSON-RPC method.",
          -32020
        );
      }

      const name = header(input.headers, "mcp-name");
      const bodyName =
        request.params
        && typeof request.params.name === "string"
        ? request.params.name
        : undefined;

      if (request.method === "tools/call") {
        if (!name || !bodyName || name !== bodyName) {
          return errorResponse(
            400,
            request.id,
            "MCP_NAME_HEADER_MISMATCH",
            "Mcp-Name must exactly match params.name for tools/call.",
            -32020
          );
        }
      } else if (name !== undefined) {
        return errorResponse(
          400,
          request.id,
          "MCP_NAME_HEADER_UNEXPECTED",
          "Mcp-Name is not defined for this MCP method.",
          -32020
        );
      }

      const response = await core.handle(request);
      return {
        status: response.error?.code === -32600 ? 400 : 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store"
        },
        body: response
      };
    }
  };
}
