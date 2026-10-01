import type {
  ExternalAgentOAuthConsentModelV010
} from "./external-agent-oauth-http.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hidden(name: string, value: string | undefined): string {
  if (value === undefined) return "";
  return '<input type="hidden" name="' + escapeHtml(name)
    + '" value="' + escapeHtml(value) + '">';
}

export function renderExternalAgentOAuthConsentPageV010(
  model: ExternalAgentOAuthConsentModelV010
): string {
  const request = model.request;
  const hiddenFields = [
    hidden("response_type", request.responseType),
    hidden("client_id", request.clientId),
    hidden("redirect_uri", request.redirectUri),
    hidden("resource", request.resource),
    hidden("scope", request.scope),
    hidden("state", request.state),
    hidden("code_challenge", request.codeChallenge),
    hidden("code_challenge_method", request.codeChallengeMethod)
  ].join("\n");

  const contexts = model.contexts.map((context, contextIndex) => {
    const grouped = new Map<
      string,
      typeof context.operations
    >();
    for (const operation of context.operations) {
      const key = operation.capability + "::" + operation.effect;
      const current = grouped.get(key) ?? [];
      current.push(operation);
      grouped.set(key, current);
    }

    const capabilityGroups = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, operations]) => {
        const first = operations[0]!;
        const selector = JSON.stringify({
          capability: first.capability,
          effects: [first.effect]
        });
        const operationRows = operations
          .sort((a, b) => a.operationId.localeCompare(b.operationId))
          .map(operation => (
            '<label><input type="checkbox" name="operation_id" value="'
            + escapeHtml(operation.operationId)
            + '"> <strong>'
            + escapeHtml(operation.title)
            + '</strong> <code>'
            + escapeHtml(operation.effect)
            + '</code><br><small><code>'
            + escapeHtml(operation.operationId)
            + '</code> — '
            + escapeHtml(operation.description)
            + '</small></label><br>'
          ))
          .join("\n");

        return '<section>'
          + '<p><label><input type="checkbox" name="capability_selector" value="'
          + escapeHtml(selector)
          + '"> <strong>Grant entire capability: '
          + escapeHtml(first.capability)
          + '</strong> <code>'
          + escapeHtml(first.effect)
          + '</code></label></p>'
          + '<p><small>Currently covers '
          + String(operations.length)
          + ' operation'
          + (operations.length === 1 ? '' : 's')
          + '. A future matching operation requires a fresh OAuth authorization before an existing token family can gain it.</small></p>'
          + '<details><summary>Choose individual operations instead</summary>'
          + operationRows
          + '</details>'
          + '</section>';
      }).join("\n");

    return '<fieldset><legend><label><input type="radio" name="context_id" value="'
      + escapeHtml(context.contextId)
      + '"'
      + (contextIndex === 0 ? " checked" : "")
      + '> '
      + escapeHtml(context.displayName)
      + '</label></legend>'
      + '<p><small>Enterprise: '
      + escapeHtml(context.enterpriseId)
      + '</small></p>'
      + capabilityGroups
      + '</fieldset>';
  }).join("\n");

  const refreshNotice = request.scopes.includes("offline_access")
    ? '<p><strong>Refresh access requested.</strong> EVO will still cap all tokens by the Grant expiry you choose below.</p>'
    : "";

  const registrationNotice = model.client.registered
    ? '<p>This client is already registered in EVO governance.</p>'
    : '<p>This is the first connection for this public CIMD client. Approving will register the Agent and Client in EVO governance before creating the Grant.</p>';

  return '<!doctype html>'
    + '<html lang="en"><head>'
    + '<meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Authorize External Agent — EVO</title>'
    + '</head><body>'
    + '<main>'
    + '<h1>Authorize External Agent</h1>'
    + '<p><strong>' + escapeHtml(model.client.displayName) + '</strong> wants governed access to EVO.</p>'
    + '<p><small>Client ID: <code>' + escapeHtml(model.client.oauthClientId) + '</code></small></p>'
    + '<p><small>Client origin: <code>' + escapeHtml(model.client.origin) + '</code></small></p>'
    + registrationNotice
    + refreshNotice
    + '<form method="post" action="/oauth/authorize">'
    + hiddenFields
    + '<h2>1. Choose Enterprise Context</h2>'
    + '<p>Select one enterprise, then grant an exact capability/effect or choose individual operations.</p>'
    + contexts
    + '<h2>2. Choose access duration</h2>'
    + '<label>Grant duration <select name="duration_minutes">'
    + '<option value="60">1 hour</option>'
    + '<option value="240" selected>4 hours</option>'
    + '<option value="1440">24 hours</option>'
    + '</select></label>'
    + '<p><small>WRITE, wildcard, prefix and regex delegation are not available. Capability selectors use exact capability ids with READ/PLAN only.</small></p>'
    + '<p>'
    + '<button type="submit" name="decision" value="approve">Allow selected access</button> '
    + '<button type="submit" name="decision" value="deny">Deny</button>'
    + '</p>'
    + '</form>'
    + '</main>'
    + '</body></html>';
}
