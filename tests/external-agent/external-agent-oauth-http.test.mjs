import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import {
  createExternalAgentOAuthHttpAdapterV010
} from "../../dist/manager/external-agent-oauth-http.js";

const oauthClientId = "https://client.example/mcp-client.json";
const redirectUri = "https://client.example/callback";
const resource = "https://evo.example/mcp";
const issuer = "https://evo.example";

function operation() {
  return {
    contractVersion: "0.1.0",
    operationId: "sample.read",
    capability: "sample",
    operationVersion: "1.0.0",
    title: "Sample read",
    description: "HTTP adapter fixture.",
    effect: "READ",
    dataScope: "ENTERPRISE",
    authorization: {
      action: "sample.read",
      resource: {
        type: "sample",
        idSource: "DATA_SCOPE"
      }
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    },
    outputSchema: { type: "object" },
    binding: {
      type: "ACTION_HOST",
      commandCode: "sample.read",
      inputVersion: "0.1.0"
    },
    exposure: ["HUMAN", "EXTERNAL_AGENT"],
    packageId: "sample-plugin",
    featureId: "sample-plugin.default"
  };
}

function governanceStore({ grantCount = 1, includeClient = true } = {}) {
  const grants = Array.from({ length: grantCount }, (_, index) => ({
    contractVersion: "0.1.0",
    grantId: "grant-" + (index + 1),
    agentId: "agent-1",
    clientId: "client-1",
    authorizingPrincipalSubjectId: "human-1",
    contextId: "enterprise:ent-1",
    allowedOperationIds: ["sample.read"],
    effectConstraints: ["READ"],
    state: "ACTIVE",
    validFrom: "2026-09-30T10:00:00.000Z",
    validUntil: "2026-10-01T10:00:00.000Z",
    createdAt: "2026-09-30T10:00:00.000Z",
    createdBySubjectId: "human-1"
  }));
  return createMemoryExternalAgentGovernanceStoreV010({
    contractVersion: "0.1.0",
    agents: [{
      contractVersion: "0.1.0",
      agentId: "agent-1",
      displayName: "Reference Agent",
      trustLevel: "REGISTERED",
      state: "ACTIVE",
      createdAt: "2026-09-30T09:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    clients: includeClient ? [{
      contractVersion: "0.1.0",
      clientId: "client-1",
      agentId: "agent-1",
      displayName: "Reference MCP Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId,
      state: "ACTIVE",
      createdAt: "2026-09-30T09:05:00.000Z",
      createdBySubjectId: "human-1"
    }] : [],
    grants,
    events: []
  });
}

function dependencies(store, {
  policyAllowed = true,
  membershipActive = true
} = {}) {
  return {
    store,
    manager: {
      listEffectiveCapabilityOperations() {
        return [operation()];
      }
    },
    identityDirectory: {
      providerId: "test.identity-directory",
      get(subjectId) {
        if (subjectId !== "human-1") return undefined;
        return {
          contractVersion: "0.1.0",
          principal: {
            contractVersion: "0.1.0",
            subjectId: "human-1",
            actorType: "HUMAN",
            identityProviderId: "generic.oidc",
            displayName: "Human 1"
          },
          state: "ACTIVE",
          firstSeenAt: "2026-09-29T10:00:00.000Z",
          lastAuthenticatedAt: "2026-09-30T10:00:00.000Z",
          updatedAt: "2026-09-30T10:00:00.000Z"
        };
      },
      list() {
        const value = this.get("human-1");
        return value ? [value] : [];
      }
    },
    enterpriseDirectory: {
      providerId: "test.enterprise-directory",
      list() {
        return [{
          contractVersion: "0.1.0",
          enterpriseId: "ent-1",
          enterpriseProviderId: "test.enterprise-directory",
          contextId: "enterprise:ent-1",
          kind: "ENTERPRISE",
          lifecycleState: "ACTIVE",
          displayName: "Enterprise 1"
        }];
      }
    },
    enterpriseGrants: {
      providerId: "test.enterprise-grants",
      listForPrincipal(principal) {
        if (
          principal.subjectId !== "human-1"
          || !membershipActive
        ) return [];
        return [{
          contractVersion: "0.1.0",
          grantId: "membership-1",
          subjectId: "human-1",
          contextId: "enterprise:ent-1",
          state: "ACTIVE"
        }];
      }
    },
    authorizationProvider: {
      providerId: "test.authorization",
      check() {
        return {
          contractVersion: "0.1.0",
          allowed: policyAllowed,
          policyProviderId: "test.authorization",
          reasonCodes: [policyAllowed ? "ALLOW" : "DENY"]
        };
      }
    },
    now: () => new Date("2026-09-30T11:00:00.000Z")
  };
}

function session(subjectId = "human-1") {
  return {
    contractVersion: "0.1.0",
    sessionId: "session-1",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "generic.oidc"
    },
    issuedAt: "2026-09-30T10:30:00.000Z"
  };
}

function requestContext(currentSession, contextId, correlationId) {
  if (contextId !== "enterprise:ent-1") {
    throw new Error("CONTEXT_NOT_AVAILABLE");
  }
  return {
    contractVersion: "0.1.0",
    principal: {
      ...structuredClone(currentSession.principal),
      sessionId: currentSession.sessionId
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-1",
      userId: currentSession.principal.subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + currentSession.principal.subjectId,
        ownerSubjectId: currentSession.principal.subjectId
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId,
        enterpriseId: "ent-1"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId,
        enterpriseId: "ent-1",
        enterpriseProviderId: "test.enterprise-directory",
        displayName: "Enterprise 1"
      }
    },
    correlationId
  };
}

function authorizationUrl(currentRedirectUri = redirectUri) {
  const url = new URL("https://evo.example/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", oauthClientId);
  url.searchParams.set("redirect_uri", currentRedirectUri);
  url.searchParams.set("resource", resource);
  url.searchParams.set("scope", "evo.capabilities offline_access");
  url.searchParams.set("state", "state-1");
  url.searchParams.set("code_challenge", "challenge-1");
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

function fixture({
  grantCount = 1,
  policyAllowed = true,
  registeredRedirectUri = redirectUri,
  includeClient = true
} = {}) {
  const store = governanceStore({ grantCount, includeClient });
  const calls = {
    issue: [],
    exchange: [],
    refresh: [],
    revoke: [],
    ensureClient: [],
    createGrant: [],
    listGrantable: []
  };
  const oauth = {
    protectedResourceMetadata() {
      return { resource };
    },
    authorizationServerMetadata() {
      return {
        issuer,
        scopes_supported: ["evo.capabilities", "offline_access"]
      };
    },
    async inspectClientMetadata(clientId) {
      assert.equal(clientId, oauthClientId);
      return {
        client_id: oauthClientId,
        client_name: "Reference MCP Client",
        redirect_uris: [registeredRedirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none"
      };
    },
    async resolveClientMetadata(clientId) {
      assert.equal(clientId, oauthClientId);
      const registration = store.snapshot().clients[0];
      if (!registration) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_NOT_REGISTERED");
      }
      return {
        registration,
        metadata: await this.inspectClientMetadata(clientId)
      };
    },
    async issueAuthorizationCode(input) {
      calls.issue.push(structuredClone(input));
      return {
        code: "evo_code_fixture",
        redirectUri: input.redirectUri,
        scopes: [...input.scopes],
        expiresAt: "2026-09-30T11:05:00.000Z"
      };
    },
    async exchangeAuthorizationCode(input) {
      calls.exchange.push(structuredClone(input));
      return {
        access_token: "evo_at_fixture",
        token_type: "Bearer",
        expires_in: 900,
        scope: "evo.capabilities"
      };
    },
    async refreshAccessToken(input) {
      calls.refresh.push(structuredClone(input));
      return {
        access_token: "evo_at_refreshed",
        token_type: "Bearer",
        expires_in: 900,
        scope: "evo.capabilities offline_access",
        refresh_token: "evo_rt_rotated"
      };
    },
    async resolveAccessToken() {
      throw new Error("NOT_USED");
    },
    revokeToken(token) {
      calls.revoke.push(token);
    }
  };
  const delegatedAuthority = dependencies(store, { policyAllowed });
  const governance = {
    async ensurePublicCimdClient(context, input) {
      calls.ensureClient.push({
        context: structuredClone(context),
        input: structuredClone(input)
      });
      return {
        agent: {
          contractVersion: "0.1.0",
          agentId: "agent-consent",
          displayName: input.displayName,
          trustLevel: "REGISTERED",
          state: "ACTIVE",
          createdAt: "2026-09-30T11:00:00.000Z",
          createdBySubjectId: "human-1"
        },
        client: {
          contractVersion: "0.1.0",
          clientId: "client-consent",
          agentId: "agent-consent",
          displayName: input.displayName,
          kind: "PUBLIC",
          protocols: ["MCP"],
          oauthClientId: input.oauthClientId,
          state: "ACTIVE",
          createdAt: "2026-09-30T11:00:00.000Z",
          createdBySubjectId: "human-1"
        },
        created: true
      };
    },
    async listGrantableOperations(context) {
      calls.listGrantable.push(structuredClone(context));
      return [{
        operationId: "sample.read",
        capability: "sample",
        title: "Sample read",
        description: "HTTP adapter fixture.",
        effect: "READ",
        dataScope: "ENTERPRISE"
      }];
    },
    async createGrant(context, input) {
      calls.createGrant.push({
        context: structuredClone(context),
        input: structuredClone(input)
      });
      return {
        contractVersion: "0.1.0",
        grantId: "grant-consent",
        agentId: input.agentId,
        clientId: input.clientId,
        authorizingPrincipalSubjectId: "human-1",
        contextId: context.context.activeContext.contextId,
        allowedOperationIds: [...input.allowedOperationIds],
        effectConstraints: ["READ"],
        state: "ACTIVE",
        validFrom: "2026-09-30T11:00:00.000Z",
        validUntil: input.validUntil,
        createdAt: "2026-09-30T11:00:00.000Z",
        createdBySubjectId: "human-1"
      };
    }
  };
  return {
    calls,
    store,
    adapter: createExternalAgentOAuthHttpAdapterV010({
      oauth,
      governanceStore: store,
      governance,
      delegatedAuthority,
      buildHumanRequestContext: requestContext,
      listHumanEnterpriseContexts() {
        return [{
          contextId: "enterprise:ent-1",
          enterpriseId: "ent-1",
          displayName: "Enterprise 1"
        }];
      },
      now: () => new Date("2026-09-30T11:00:00.000Z")
    })
  };
}

test("authorize binds the unique current Human Grant and preserves OAuth state", async () => {
  const f = fixture();
  const result = await f.adapter.authorize({
    url: authorizationUrl(),
    session: session(),
    correlationId: "corr-1"
  });

  assert.equal(result.status, 303);
  const target = new URL(result.location);
  assert.equal(target.origin + target.pathname, redirectUri);
  assert.equal(target.searchParams.get("code"), "evo_code_fixture");
  assert.equal(target.searchParams.get("state"), "state-1");
  assert.equal(target.searchParams.get("iss"), issuer);
  assert.equal(f.calls.issue.length, 1);
  assert.equal(f.calls.issue[0].grantId, "grant-1");
  assert.equal(
    f.calls.issue[0].requestContext.context.activeContext.contextId,
    "enterprise:ent-1"
  );
});

test("first-use CIMD client enters Human consent instead of requiring pre-registration", async () => {
  const f = fixture({
    grantCount: 0,
    includeClient: false
  });

  const result = await f.adapter.authorize({
    url: authorizationUrl(),
    session: session(),
    correlationId: "corr-consent-preview"
  });

  assert.equal(result.kind, "CONSENT");
  assert.equal(result.status, 200);
  assert.equal(result.consent.client.registered, false);
  assert.equal(
    result.consent.client.oauthClientId,
    oauthClientId
  );
  assert.equal(result.consent.contexts.length, 1);
  assert.deepEqual(
    result.consent.contexts[0].operations.map(item => item.operationId),
    ["sample.read"]
  );
  assert.equal(f.calls.issue.length, 0);
});

test("Human consent can enroll public CIMD client, create bounded Grant and issue code", async () => {
  const f = fixture({
    grantCount: 0,
    includeClient: false
  });
  const url = authorizationUrl();
  const form = new URLSearchParams(url.searchParams);
  form.set("decision", "approve");
  form.set("context_id", "enterprise:ent-1");
  form.set("duration_minutes", "240");
  form.append("operation_id", "sample.read");

  const result = await f.adapter.approve({
    form,
    session: session(),
    correlationId: "corr-consent-approve"
  });

  assert.equal(result.kind, "REDIRECT");
  assert.equal(result.status, 303);
  assert.equal(f.calls.ensureClient.length, 1);
  assert.equal(f.calls.createGrant.length, 1);
  assert.deepEqual(
    f.calls.createGrant[0].input.allowedOperationIds,
    ["sample.read"]
  );
  assert.equal(
    f.calls.createGrant[0].input.validUntil,
    "2026-09-30T15:00:00.000Z"
  );
  assert.equal(f.calls.issue.length, 1);
  assert.equal(f.calls.issue[0].grantId, "grant-consent");
  const target = new URL(result.location);
  assert.equal(target.searchParams.get("code"), "evo_code_fixture");
  assert.equal(target.searchParams.get("state"), "state-1");
});

test("Human consent denial redirects without enrollment or Grant creation", async () => {
  const f = fixture({
    grantCount: 0,
    includeClient: false
  });
  const url = authorizationUrl();
  const form = new URLSearchParams(url.searchParams);
  form.set("decision", "deny");

  const result = await f.adapter.approve({
    form,
    session: session(),
    correlationId: "corr-consent-deny"
  });

  assert.equal(result.kind, "REDIRECT");
  const target = new URL(result.location);
  assert.equal(target.searchParams.get("error"), "access_denied");
  assert.equal(f.calls.ensureClient.length, 0);
  assert.equal(f.calls.createGrant.length, 0);
  assert.equal(f.calls.issue.length, 0);
});

test("authorize accepts an RFC 8252 native loopback ephemeral port", async () => {
  const f = fixture({
    registeredRedirectUri: "http://127.0.0.1/callback"
  });
  const runtimeRedirect =
    "http://127.0.0.1:53421/callback";

  const result = await f.adapter.authorize({
    url: authorizationUrl(runtimeRedirect),
    session: session(),
    correlationId: "corr-native-loopback"
  });

  assert.equal(result.status, 303);
  const target = new URL(result.location);
  assert.equal(
    target.origin + target.pathname,
    runtimeRedirect
  );
  assert.equal(target.searchParams.get("code"), "evo_code_fixture");
  assert.equal(f.calls.issue.length, 1);
  assert.equal(f.calls.issue[0].redirectUri, runtimeRedirect);
});

test("authorize never guesses when multiple effective Grants exist", async () => {
  const f = fixture({ grantCount: 2 });
  const result = await f.adapter.authorize({
    url: authorizationUrl(),
    session: session(),
    correlationId: "corr-multiple"
  });

  const target = new URL(result.location);
  assert.equal(target.searchParams.get("error"), "interaction_required");
  assert.equal(target.searchParams.get("state"), "state-1");
  assert.equal(target.searchParams.get("iss"), issuer);
  assert.equal(f.calls.issue.length, 0);
});

test("authorize denies when current policy removes delegated authority", async () => {
  const f = fixture({ policyAllowed: false });
  const result = await f.adapter.authorize({
    url: authorizationUrl(),
    session: session(),
    correlationId: "corr-deny"
  });

  const target = new URL(result.location);
  assert.equal(target.searchParams.get("error"), "access_denied");
  assert.equal(target.searchParams.get("iss"), issuer);
  assert.equal(f.calls.issue.length, 0);
});

test("authorize refuses unregistered redirect before redirecting anywhere", async () => {
  const f = fixture();
  const url = authorizationUrl();
  url.searchParams.set("redirect_uri", "https://evil.example/callback");

  await assert.rejects(
    () => f.adapter.authorize({
      url,
      session: session(),
      correlationId: "corr-evil"
    }),
    /EXTERNAL_AGENT_OAUTH_REDIRECT_URI_NOT_REGISTERED/
  );
  assert.equal(f.calls.issue.length, 0);
});

test("token endpoint projection supports authorization_code and refresh_token only", async () => {
  const f = fixture();

  const codeForm = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: oauthClientId,
    resource,
    code: "code-1",
    redirect_uri: redirectUri,
    code_verifier: "v".repeat(64)
  });
  const codeResult = await f.adapter.token({
    form: codeForm,
    correlationId: "corr-code"
  });
  assert.equal(codeResult.status, 200);
  assert.equal(codeResult.body.access_token, "evo_at_fixture");
  assert.equal(f.calls.exchange.length, 1);

  const refreshForm = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: oauthClientId,
    resource,
    refresh_token: "evo_rt_1"
  });
  const refreshResult = await f.adapter.token({
    form: refreshForm,
    correlationId: "corr-refresh"
  });
  assert.equal(refreshResult.status, 200);
  assert.equal(refreshResult.body.refresh_token, "evo_rt_rotated");
  assert.equal(f.calls.refresh.length, 1);

  const unsupported = await f.adapter.token({
    form: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: oauthClientId,
      resource
    }),
    correlationId: "corr-unsupported"
  });
  assert.equal(unsupported.status, 400);
  assert.equal(unsupported.body.error, "unsupported_grant_type");
});

test("revocation is non-disclosing and idempotent at HTTP projection", () => {
  const f = fixture();
  const result = f.adapter.revoke({
    form: new URLSearchParams({ token: "unknown-or-known" })
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {});
  assert.deepEqual(f.calls.revoke, ["unknown-or-known"]);
});
