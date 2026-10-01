import test from "node:test";
import assert from "node:assert/strict";

import {
  MCP_PROTOCOL_VERSION_2026_07_28,
  createMcpModernCoreV010
} from "../../dist/manager/mcp-modern-core.js";
import {
  createMcpModernHttpAdapterV010
} from "../../dist/manager/mcp-modern-http.js";

function meta(extra = {}) {
  return {
    "io.modelcontextprotocol/protocolVersion":
      MCP_PROTOCOL_VERSION_2026_07_28,
    "io.modelcontextprotocol/clientCapabilities": {},
    "io.modelcontextprotocol/clientInfo": {
      name: "fixture-client",
      version: "1.0.0"
    },
    ...extra
  };
}

function request(method, params = {}, id = 1) {
  return {
    jsonrpc: "2.0",
    id,
    method,
    params: {
      ...params,
      _meta: meta(params._meta ?? {})
    }
  };
}

function core() {
  return createMcpModernCoreV010({
    serverInfo: {
      name: "evo-app-platform",
      title: "EVO App Platform",
      version: "0.1.0",
      description: "Agent-neutral EVO capability surface."
    },
    instructions:
      "Use only tools returned by the current authorized tool catalog.",
    listTools() {
      return [
        {
          name: "z-tool",
          title: "Z Tool",
          description: "Fixture Z.",
          inputSchema: { type: "object" }
        },
        {
          name: "a-tool",
          title: "A Tool",
          description: "Fixture A.",
          inputSchema: {
            type: "object",
            properties: {
              value: { type: "string" }
            }
          },
          outputSchema: { type: "object" }
        }
      ];
    },
    callTool({ name, arguments: args }) {
      if (name !== "a-tool") throw new Error("TOOL_NOT_AVAILABLE");
      return {
        content: [{
          type: "text",
          text: JSON.stringify(args)
        }],
        structuredContent: {
          name,
          arguments: args
        }
      };
    }
  });
}

test("modern MCP server/discover advertises only 2026-07-28 stateless tools capability", async () => {
  const result = await core().handle(request("server/discover"));

  assert.equal(result.error, undefined);
  assert.equal(result.result.resultType, "complete");
  assert.deepEqual(result.result.supportedVersions, ["2026-07-28"]);
  assert.deepEqual(result.result.capabilities, {
    tools: { listChanged: false }
  });
  assert.equal(result.result.ttlMs, 300000);
  assert.equal(result.result.cacheScope, "private");
  assert.equal(
    result.result._meta["io.modelcontextprotocol/serverInfo"].name,
    "evo-app-platform"
  );
  assert.equal("protocolVersion" in result.result, false);
});

test("modern MCP rejects missing per-request metadata instead of relying on initialize state", async () => {
  const result = await core().handle({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });

  assert.equal(result.error.code, -32602);
  assert.equal(result.error.data.code, "MCP_MODERN_META_REQUIRED");
});

test("modern MCP rejects unsupported protocol version in request metadata", async () => {
  const result = await core().handle({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2025-11-25",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  });

  assert.equal(result.error.code, -32602);
  assert.equal(
    result.error.data.code,
    "MCP_PROTOCOL_VERSION_UNSUPPORTED"
  );
  assert.deepEqual(result.error.data.supported, ["2026-07-28"]);
});

test("tools/list returns deterministic tool order and private zero-TTL cache semantics", async () => {
  const result = await core().handle(request("tools/list"));

  assert.equal(result.error, undefined);
  assert.equal(result.result.resultType, "complete");
  assert.deepEqual(
    result.result.tools.map(item => item.name),
    ["a-tool", "z-tool"]
  );
  assert.equal(result.result.ttlMs, 0);
  assert.equal(result.result.cacheScope, "private");
});

test("tools/call returns structured content and tool failure stays a protocol error", async () => {
  const ok = await core().handle(request("tools/call", {
    name: "a-tool",
    arguments: { value: "hello" }
  }));

  assert.equal(ok.error, undefined);
  assert.equal(ok.result.resultType, "complete");
  assert.deepEqual(ok.result.structuredContent, {
    name: "a-tool",
    arguments: { value: "hello" }
  });
  assert.equal(ok.result.content[0].type, "text");

  const denied = await core().handle(request("tools/call", {
    name: "missing",
    arguments: {}
  }));

  assert.equal(denied.error.code, -32603);
  assert.equal(denied.error.data.code, "MCP_TOOL_CALL_FAILED");
});

test("unknown modern MCP method returns JSON-RPC method-not-found", async () => {
  const result = await core().handle(request("prompts/list"));
  assert.equal(result.error.code, -32601);
});

test("modern HTTP adapter requires POST JSON and 2026 protocol header", async () => {
  const adapter = createMcpModernHttpAdapterV010(core());

  const method = await adapter.handle({
    method: "GET",
    headers: {},
    body: undefined
  });
  assert.equal(method.status, 405);
  assert.equal(method.headers.allow, "POST");

  const contentType = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "text/plain"
    },
    body: request("server/discover")
  });
  assert.equal(contentType.status, 415);

  const version = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2025-11-25",
      "mcp-method": "server/discover"
    },
    body: request("server/discover")
  });
  assert.equal(version.status, 400);
  assert.equal(
    version.body.error.data.code,
    "MCP_PROTOCOL_VERSION_HEADER_INVALID"
  );
});

test("modern HTTP adapter detects Mcp-Method mismatch with -32020", async () => {
  const adapter = createMcpModernHttpAdapterV010(core());
  const result = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/list"
    },
    body: request("server/discover")
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, -32020);
  assert.equal(result.body.error.data.code, "MCP_METHOD_HEADER_MISMATCH");
});

test("modern tools/call requires Mcp-Name and exact body/header agreement", async () => {
  const adapter = createMcpModernHttpAdapterV010(core());
  const body = request("tools/call", {
    name: "a-tool",
    arguments: { value: "x" }
  });

  const missing = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/call"
    },
    body
  });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, -32020);
  assert.equal(missing.body.error.data.code, "MCP_NAME_HEADER_MISMATCH");

  const mismatch = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/call",
      "mcp-name": "other-tool"
    },
    body
  });
  assert.equal(mismatch.status, 400);
  assert.equal(mismatch.body.error.code, -32020);

  const ok = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/call",
      "mcp-name": "a-tool"
    },
    body
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.result.resultType, "complete");
  assert.deepEqual(ok.body.result.structuredContent, {
    name: "a-tool",
    arguments: { value: "x" }
  });
});

test("Mcp-Name is rejected on methods that do not name an MCP object", async () => {
  const adapter = createMcpModernHttpAdapterV010(core());
  const result = await adapter.handle({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/list",
      "mcp-name": "unexpected"
    },
    body: request("tools/list")
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, -32020);
  assert.equal(result.body.error.data.code, "MCP_NAME_HEADER_UNEXPECTED");
});
