import assert from "node:assert/strict";
import test from "node:test";

import {
  EVO_MODERN_PROTOCOL_VERSION,
  base64urlSha256,
  buildModernParams,
  localInitializeResult,
  translateModernToolCall,
  translateModernToolsList
} from "../../tools/integration-adapters/evo-cline-mcp-adapter.mjs";

test("Cline adapter stamps EVO modern request metadata", () => {
  const params = buildModernParams({ cursor: "abc" });
  assert.equal(params.cursor, "abc");
  assert.equal(
    params._meta["io.modelcontextprotocol/protocolVersion"],
    EVO_MODERN_PROTOCOL_VERSION
  );
  assert.deepEqual(
    params._meta["io.modelcontextprotocol/clientCapabilities"],
    { tools: {} }
  );
});

test("Cline adapter exposes a legacy stdio initialize surface", () => {
  const exact = localInitializeResult("2025-11-25");
  assert.equal(exact.protocolVersion, "2025-11-25");
  assert.equal(exact.capabilities.tools.listChanged, false);

  const modernClient = localInitializeResult("2026-07-28");
  assert.equal(modernClient.protocolVersion, "2025-11-25");
});

test("Cline adapter translates modern tools/list without modern envelope", () => {
  const translated = translateModernToolsList({
    resultType: "complete",
    ttlMs: 0,
    cacheScope: "private",
    tools: [{
      name: "ledger.runtime.configuration.describe",
      title: "Describe Ledger Runtime Configuration",
      description: "Read current installation configuration.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      outputSchema: {
        type: "object",
        required: ["contractVersion"]
      },
      securitySchemes: [{
        type: "oauth2",
        scopes: ["evo.capabilities"]
      }],
      _meta: {
        securitySchemes: []
      }
    }]
  });

  assert.equal(translated.tools.length, 1);
  assert.equal(
    translated.tools[0].name,
    "ledger.runtime.configuration.describe"
  );
  assert.equal(translated.tools[0].securitySchemes, undefined);
  assert.equal(translated.tools[0]._meta, undefined);
  assert.deepEqual(translated.tools[0].outputSchema, {
    type: "object",
    required: ["contractVersion"]
  });
});

test("Cline adapter translates modern tools/call business result", () => {
  const translated = translateModernToolCall({
    resultType: "complete",
    content: [{ type: "text", text: "{\"ok\":true}" }],
    structuredContent: {
      contractVersion: "0.1.0",
      kind: "example"
    }
  });

  assert.deepEqual(translated.structuredContent, {
    contractVersion: "0.1.0",
    kind: "example"
  });
  assert.equal(translated.content.length, 1);
});

test("PKCE helper is deterministic base64url SHA-256", () => {
  assert.equal(
    base64urlSha256("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"),
    base64urlSha256("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
  );
  assert.match(
    base64urlSha256("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"),
    /^[A-Za-z0-9_-]+$/
  );
});
