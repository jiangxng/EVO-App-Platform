import test from "node:test";
import assert from "node:assert/strict";

import {
  createMcpProtectedResourceV010
} from "../../dist/manager/mcp-protected-resource.js";

const resource = "https://evo.example/mcp";
const metadata =
  "https://evo.example/.well-known/oauth-protected-resource/mcp";

function request(headers = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "server/discover",
      ...headers
    },
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {}
        }
      }
    }
  };
}

function fixture({
  resolve = "success",
  returnedResource = resource
} = {}) {
  const calls = [];
  const authorized = [];
  const oauth = {
    protectedResourceMetadata() {
      return {};
    },
    authorizationServerMetadata() {
      return {};
    },
    async resolveClientMetadata() {
      throw new Error("NOT_USED");
    },
    async issueAuthorizationCode() {
      throw new Error("NOT_USED");
    },
    async exchangeAuthorizationCode() {
      throw new Error("NOT_USED");
    },
    async refreshAccessToken() {
      throw new Error("NOT_USED");
    },
    async resolveAccessToken(token, requestedResource, correlationId) {
      calls.push({ token, requestedResource, correlationId });
      if (resolve !== "success") {
        throw new Error(resolve);
      }
      return {
        contractVersion: "0.1.0",
        token: {
          contractVersion: "0.1.0",
          tokenId: "token-1",
          tokenHash: "hash",
          oauthClientId: "https://client.example/mcp.json",
          clientId: "client-1",
          agentId: "agent-1",
          grantId: "grant-1",
          resource: returnedResource,
          scopes: ["evo.capabilities"],
          createdAt: "2026-09-30T12:00:00.000Z",
          expiresAt: "2026-09-30T12:15:00.000Z"
        },
        grantId: "grant-1",
        agentId: "agent-1",
        clientId: "client-1",
        resource: returnedResource,
        operationIds: ["ledger.runtime.configuration.describe"]
      };
    },
    revokeToken() {}
  };

  const adapter = createMcpProtectedResourceV010({
    oauth,
    resourceIdentifier: resource,
    resourceMetadataUrl: metadata,
    handleAuthorized(input) {
      authorized.push(structuredClone({
        grantId: input.access.grantId,
        agentId: input.access.agentId,
        clientId: input.access.clientId,
        resource: input.access.resource,
        correlationId: input.correlationId
      }));
      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store"
        },
        body: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            ok: true
          }
        }
      };
    }
  });

  return { adapter, calls, authorized };
}

test("MCP protected resource challenges missing Bearer credentials with authoritative RFC 9728 metadata", async () => {
  const f = fixture();
  const result = await f.adapter.handle({
    request: request(),
    correlationId: "corr-missing"
  });

  assert.equal(result.status, 401);
  assert.equal(
    result.headers["www-authenticate"],
    'Bearer resource_metadata="' + metadata + '"'
  );
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(f.calls.length, 0);
  assert.equal(f.authorized.length, 0);
});

test("MCP protected resource rejects malformed Authorization schemes without leaking token state", async () => {
  const f = fixture();
  for (const authorization of [
    "Basic abc",
    "Bearer",
    "Bearer token with spaces"
  ]) {
    const result = await f.adapter.handle({
      request: request({ authorization }),
      correlationId: "corr-malformed"
    });
    assert.equal(result.status, 401);
    assert.equal(
      result.headers["www-authenticate"],
      'Bearer resource_metadata="' + metadata + '"'
    );
  }
  assert.equal(f.calls.length, 0);
});

test("MCP protected resource resolves Bearer token against the exact /mcp resource before dispatch", async () => {
  const f = fixture();
  const result = await f.adapter.handle({
    request: request({
      authorization: "Bearer evo_at_valid"
    }),
    correlationId: "corr-valid"
  });

  assert.equal(result.status, 200);
  assert.deepEqual(f.calls, [{
    token: "evo_at_valid",
    requestedResource: resource,
    correlationId: "corr-valid"
  }]);
  assert.deepEqual(f.authorized, [{
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    resource,
    correlationId: "corr-valid"
  }]);
});

test("invalid, revoked or currently unauthorized access token receives bounded invalid_token challenge", async () => {
  for (const failure of [
    "EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_NOT_FOUND",
    "EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_REVOKED",
    "EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS",
    "EXTERNAL_AGENT_OAUTH_DELEGATED_AUTHORITY_INACTIVE:GRANT_REVOKED"
  ]) {
    const f = fixture({ resolve: failure });
    const result = await f.adapter.handle({
      request: request({
        authorization: "Bearer evo_at_invalid"
      }),
      correlationId: "corr-invalid"
    });

    assert.equal(result.status, 401);
    assert.equal(
      result.headers["www-authenticate"],
      'Bearer resource_metadata="' + metadata + '", error="invalid_token"'
    );
    assert.equal(result.headers["cache-control"], "no-store");
    assert.equal(f.authorized.length, 0);
  }
});

test("MCP protected resource independently verifies resolved token resource binding", async () => {
  const f = fixture({
    returnedResource: "https://other.example/mcp"
  });
  const result = await f.adapter.handle({
    request: request({
      authorization: "Bearer evo_at_wrong_resource"
    }),
    correlationId: "corr-resource"
  });

  assert.equal(result.status, 401);
  assert.equal(
    result.headers["www-authenticate"],
    'Bearer resource_metadata="' + metadata + '", error="invalid_token"'
  );
  assert.equal(f.authorized.length, 0);
});

test("self-reported MCP client metadata never reaches OAuth authority resolution", async () => {
  const f = fixture();
  const req = request({
    authorization: "Bearer evo_at_valid"
  });
  req.body.params._meta["io.modelcontextprotocol/clientInfo"] = {
    name: "pretend-first-party-client",
    version: "999"
  };

  await f.adapter.handle({
    request: req,
    correlationId: "corr-self-report"
  });

  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].token, "evo_at_valid");
  assert.equal(
    JSON.stringify(f.calls[0]).includes("pretend-first-party-client"),
    false
  );
});
