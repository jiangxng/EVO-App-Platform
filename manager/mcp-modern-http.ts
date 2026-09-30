import {
  MCP_PROTOCOL_VERSION_2026_07_28,
  type McpModernCoreV010,
  type McpModernRequestV010,
  type McpModernResponseV010
} from "./mcp-modern-core.js";

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
          "MCP modern HTTP requests require application/json."
        );
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
