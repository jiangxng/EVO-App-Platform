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
        capability: "sample<&>",
        title: "Sample <read>",
        description: "Read & inspect.",
        effect: "READ",
        dataScope: "ENTERPRISE"
      }, {
        operationId: "sample.other",
        capability: "sample<&>",
        title: "Sample other",
        description: "Second operation.",
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
  assert.match(html, /name="capability_selector"/);
  assert.match(html, /Grant entire capability: sample&lt;&amp;&gt;/);
  assert.match(html, /Currently covers 2 operations/);
  assert.match(html, /fresh OAuth authorization/);
  assert.equal(html.includes('sample<&>'), false);
});

test("OAuth consent page preselects neither capability selectors nor individual operations", () => {
  const html = renderExternalAgentOAuthConsentPageV010(model());
  const selectorInput = html.match(
    /<input type="checkbox" name="capability_selector"[^>]+>/
  )?.[0];
  const operationInput = html.match(
    /<input type="checkbox" name="operation_id"[^>]+>/
  )?.[0];
  assert.ok(selectorInput);
  assert.ok(operationInput);
  assert.equal(/checked/.test(selectorInput), false);
  assert.equal(/checked/.test(operationInput), false);
});

test("OAuth consent page explicitly discloses selector safety boundaries", () => {
  const html = renderExternalAgentOAuthConsentPageV010(model());
  assert.match(html, /exact capability\/effect/);
  assert.match(html, /WRITE, wildcard, prefix and regex delegation are not available/);
  assert.match(html, /Choose individual operations instead/);
});
