import test from "node:test";
import assert from "node:assert/strict";

import {
  createExternalAgentOAuthProfileV010,
  assertExternalAgentOAuthResourceV010,
  assertExternalAgentOAuthScopesV010,
  externalAgentOAuthBearerChallengeV010,
  externalAgentOAuthScopesForEffectsV010
} from "../../dist/manager/external-agent-oauth-profile.js";

test("EA-4A derives canonical MCP resource and RFC 9728 well-known metadata URL", () => {
  const profile = createExternalAgentOAuthProfileV010(
    "https://evo.example/"
  );

  assert.equal(profile.publicBaseUrl, "https://evo.example");
  assert.equal(profile.resource, "https://evo.example/mcp");
  assert.equal(
    profile.protectedResourceMetadataUrl,
    "https://evo.example/.well-known/oauth-protected-resource/mcp"
  );
  assert.equal(profile.protectedResourceMetadata.resource, profile.resource);
  assert.deepEqual(
    profile.protectedResourceMetadata.authorization_servers,
    ["https://evo.example"]
  );
  assert.deepEqual(
    profile.protectedResourceMetadata.bearer_methods_supported,
    ["header"]
  );
});

test("EA-4A authorization metadata advertises Authorization Code + PKCE S256 only", () => {
  const profile = createExternalAgentOAuthProfileV010(
    "https://evo.example"
  );
  assert.equal(profile.issuer, "https://evo.example");
  assert.equal(
    profile.authorizationServerMetadataUrl,
    "https://evo.example/.well-known/oauth-authorization-server"
  );
  assert.equal(
    profile.authorizationServerMetadata.authorization_endpoint,
    "https://evo.example/oauth/authorize"
  );
  assert.equal(
    profile.authorizationServerMetadata.token_endpoint,
    "https://evo.example/oauth/token"
  );
  assert.deepEqual(
    profile.authorizationServerMetadata.response_types_supported,
    ["code"]
  );
  assert.deepEqual(
    profile.authorizationServerMetadata.grant_types_supported,
    ["authorization_code"]
  );
  assert.deepEqual(
    profile.authorizationServerMetadata.code_challenge_methods_supported,
    ["S256"]
  );
  assert.deepEqual(
    profile.authorizationServerMetadata.token_endpoint_auth_methods_supported,
    ["none"]
  );
  assert.equal(
    profile.authorizationServerMetadata.authorization_response_iss_parameter_supported,
    true
  );
  assert.deepEqual(
    profile.authorizationServerMetadata.protected_resources,
    ["https://evo.example/mcp"]
  );
});

test("resource indicator must be present and exactly equal to the canonical MCP resource", () => {
  const profile = createExternalAgentOAuthProfileV010(
    "https://evo.example"
  );

  assert.doesNotThrow(() =>
    assertExternalAgentOAuthResourceV010(
      profile,
      "https://evo.example/mcp"
    )
  );
  assert.throws(
    () => assertExternalAgentOAuthResourceV010(profile, undefined),
    /EXTERNAL_AGENT_OAUTH_RESOURCE_REQUIRED/
  );
  assert.throws(
    () =>
      assertExternalAgentOAuthResourceV010(
        profile,
        "https://evo.example/mcp/"
      ),
    /EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH/
  );
  assert.throws(
    () =>
      assertExternalAgentOAuthResourceV010(
        profile,
        "https://other.example/mcp"
      ),
    /EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH/
  );
});

test("OAuth scope mapping can only attenuate READ/PLAN and refuses WRITE", () => {
  assert.deepEqual(
    externalAgentOAuthScopesForEffectsV010(["READ"]),
    ["evo:read"]
  );
  assert.deepEqual(
    externalAgentOAuthScopesForEffectsV010(["READ", "PLAN"]),
    ["evo:plan", "evo:read"]
  );
  assert.throws(
    () => externalAgentOAuthScopesForEffectsV010(["WRITE"]),
    /EXTERNAL_AGENT_OAUTH_WRITE_SCOPE_NOT_ENABLED/
  );

  assert.deepEqual(
    assertExternalAgentOAuthScopesV010(
      ["evo:read"],
      ["evo:read", "evo:plan"]
    ),
    ["evo:read"]
  );
  assert.throws(
    () =>
      assertExternalAgentOAuthScopesV010(
        ["evo:write"],
        ["evo:read", "evo:plan"]
      ),
    /EXTERNAL_AGENT_OAUTH_SCOPE_INVALID: evo:write/
  );
});

test("OAuth public base URL is production HTTPS and does not admit path/query/userinfo ambiguity", () => {
  assert.throws(
    () => createExternalAgentOAuthProfileV010("http://evo.example"),
    /EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_HTTPS_REQUIRED/
  );
  assert.throws(
    () => createExternalAgentOAuthProfileV010("https://evo.example/base"),
    /EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_PATH_FORBIDDEN/
  );
  assert.throws(
    () => createExternalAgentOAuthProfileV010("https://evo.example/?x=1"),
    /EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_INVALID/
  );
  assert.throws(
    () => createExternalAgentOAuthProfileV010("https://u:p@evo.example"),
    /EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_INVALID/
  );

  const localhost = createExternalAgentOAuthProfileV010(
    "http://localhost:3000"
  );
  assert.equal(localhost.resource, "http://localhost:3000/mcp");
});

test("WWW-Authenticate challenge points clients to protected resource metadata and bounded scopes", () => {
  const profile = createExternalAgentOAuthProfileV010(
    "https://evo.example"
  );
  assert.equal(
    externalAgentOAuthBearerChallengeV010({
      profile,
      scopes: ["evo:read"]
    }),
    'Bearer resource_metadata="https://evo.example/.well-known/oauth-protected-resource/mcp", scope="evo:read"'
  );

  assert.equal(
    externalAgentOAuthBearerChallengeV010({
      profile,
      scopes: ["evo:read", "evo:plan"],
      error: "insufficient_scope",
      errorDescription: "Plan permission required"
    }),
    'Bearer resource_metadata="https://evo.example/.well-known/oauth-protected-resource/mcp", scope="evo:plan evo:read", error="insufficient_scope", error_description="Plan permission required"'
  );
});
