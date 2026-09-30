import test from "node:test";
import assert from "node:assert/strict";

import {
  EXTERNAL_AGENT_OAUTH_SCOPE
} from "../../dist/contracts/external-agent-oauth.js";
import {
  createChatGptMcpProductAdapterV010,
  createCompositeMcpProductAdapterV010
} from "../../dist/manager/mcp-product-adapter.js";

function access(oauthClientId) {
  return {
    contractVersion: "0.1.0",
    token: {
      contractVersion: "0.1.0",
      tokenId: "token-1",
      tokenHash: "hash",
      oauthClientId,
      clientId: "client-1",
      agentId: "agent-1",
      grantId: "grant-1",
      resource: "https://evo.example/mcp",
      scopes: [EXTERNAL_AGENT_OAUTH_SCOPE],
      createdAt: "2026-09-30T12:00:00.000Z",
      expiresAt: "2026-09-30T12:15:00.000Z"
    },
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    resource: "https://evo.example/mcp",
    operationIds: ["ledger.runtime.configuration.describe"]
  };
}

function tool() {
  return {
    name: "ledger.runtime.configuration.describe",
    title: "Describe Ledger Runtime Configuration",
    description: "Returns the current Ledger Runtime configuration summary.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    },
    outputSchema: {
      type: "object"
    }
  };
}

test("ChatGPT stable CIMD client receives OAuth security metadata and read annotations", () => {
  const adapter = createChatGptMcpProductAdapterV010();
  const result = adapter.adaptTool({
    access: access("https://chatgpt.com/oauth/client.json"),
    effect: "READ",
    tool: tool()
  });

  assert.deepEqual(result.securitySchemes, [{
    type: "oauth2",
    scopes: [EXTERNAL_AGENT_OAUTH_SCOPE]
  }]);
  assert.deepEqual(result._meta.securitySchemes, result.securitySchemes);
  assert.deepEqual(result.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  });
  assert.equal(result.name, "ledger.runtime.configuration.describe");
});

test("ChatGPT callback-specific CIMD client receives the same product metadata", () => {
  const adapter = createChatGptMcpProductAdapterV010();
  const result = adapter.adaptTool({
    access: access("https://chatgpt.com/oauth/callback-123/client.json"),
    effect: "PLAN",
    tool: tool()
  });

  assert.equal(result.annotations.readOnlyHint, true);
  assert.equal(result.securitySchemes[0].type, "oauth2");
});

test("non-ChatGPT MCP clients remain generic and receive no OpenAI-specific decoration", () => {
  const original = tool();
  const adapter = createChatGptMcpProductAdapterV010();
  const result = adapter.adaptTool({
    access: access("https://claude.example/oauth/client.json"),
    effect: "READ",
    tool: original
  });

  assert.deepEqual(result, original);
  assert.notEqual(result, original);
});

test("ChatGPT client recognition is exact to HTTPS chatgpt.com CIMD paths", () => {
  const adapter = createChatGptMcpProductAdapterV010();
  for (const oauthClientId of [
    "http://chatgpt.com/oauth/client.json",
    "https://evil.example/oauth/client.json",
    "https://chatgpt.com/not-oauth/client.json",
    "https://chatgpt.com/oauth/a/b/client.json"
  ]) {
    const result = adapter.adaptTool({
      access: access(oauthClientId),
      effect: "READ",
      tool: tool()
    });
    assert.equal(result.securitySchemes, undefined, oauthClientId);
  }
});

test("product adapter composition preserves business tool identity", () => {
  const adapter = createCompositeMcpProductAdapterV010([
    createChatGptMcpProductAdapterV010()
  ]);
  const result = adapter.adaptTool({
    access: access("https://chatgpt.com/oauth/client.json"),
    effect: "READ",
    tool: tool()
  });

  assert.equal(
    result.name,
    "ledger.runtime.configuration.describe"
  );
  assert.equal(
    result.description,
    "Returns the current Ledger Runtime configuration summary."
  );
});
