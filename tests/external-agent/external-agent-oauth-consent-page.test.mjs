import test from "node:test";
import assert from "node:assert/strict";

import {
  renderExternalAgentOAuthConsentPageV010
} from "../../dist/manager/external-agent-oauth-consent-page.js";

function model() {
  return {
    contractVersion: "0.1.0",
    kind: "evo.external-agent.oauth-consent",
    client: {
      oauthClientId: "https://client.example/mcp-client.json",
      displayName: '<script>alert("x")</script>',
      origin: "https://client.example",
      registered: false
    },
    request: {
      responseType: "code",
      clientId: "https://client.example/mcp-client.json",
      redirectUri: "https://client.example/callback",
      resource: "https://evo.example/mcp",
      scope: "evo.capabilities offline_access",
      scopes: ["evo.capabilities", "offline_access"],
      state: 'state-"><img src=x onerror=alert(1)>',
      codeChallenge: "challenge",
      codeChallengeMethod: "S256"
    },
    contexts: [{
      contextId: "enterprise:ent-1",
      enterpriseId: "ent-1",
      displayName: "Enterprise <One>",
      operations: [{
        operationId: "sample.read",
        capability: "sample",
        title: "Sample <read>",
        description: "Read & inspect.",
        effect: "READ",
        dataScope: "ENTERPRISE"
      }]
    }]
  };
}

test("OAuth consent page escapes all client and operation metadata", () => {
  const html = renderExternalAgentOAuthConsentPageV010(model());

  assert.equal(html.includes("<script>alert"), false);
  assert.equal(html.includes("<img src=x"), false);
  assert.match(html, /&lt;script&gt;alert/);
  assert.match(html, /Enterprise &lt;One&gt;/);
  assert.match(html, /Sample &lt;read&gt;/);
  assert.match(html, /Read &amp; inspect/);
  assert.match(html, /method="post"/);
  assert.match(html, /action="\/oauth\/authorize"/);
  assert.match(html, /name="operation_id"/);
  assert.match(html, /value="sample.read"/);
  assert.match(html, /name="duration_minutes"/);
});

test("OAuth consent page does not preselect capability operations", () => {
  const html = renderExternalAgentOAuthConsentPageV010(model());
  const operationInput = html.match(
    /<input type="checkbox" name="operation_id"[^>]+>/
  )?.[0];
  assert.ok(operationInput);
  assert.equal(/checked/.test(operationInput), false);
});
