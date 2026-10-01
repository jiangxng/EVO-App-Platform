# EA-1B2C — Google OIDC Production Live Cutover Runbook

**Status:** LIVING RUNBOOK — HUMAN LOGIN PASS / INSPECTOR E2E SECURITY PASS  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Active gate:** real-external-ai-agent-portability-v0-1  
**Production service:** Ledger Configurator  
**Production base URL:** https://ledger-configurator-production.up.railway.app  
**OIDC Provider:** Generic OIDC Identity Provider  
**First real IdP profile:** Google OpenID Connect

## 1. Purpose

This runbook closes the last production Human-login gate before public Human-delegated External Agent access may be enabled.

The implementation chain already exists:

~~~text
Generic OIDC Provider
→ Host authentication orchestration
→ Host Managed Session
→ request-bound Principal
→ Enterprise Context / authorization
~~~

What remains is live proof against one real external OIDC authority.

Google is selected as the first production interoperability profile because it uses standard OpenID Connect / Authorization Code semantics that fit the generic Provider without a Google-specific business/runtime implementation.

Google-specific configuration MUST remain deployment/setup metadata only.

Do not add a Google-specific Host identity contract.

## 2. Canonical production values

### EVO base URL

~~~text
https://ledger-configurator-production.up.railway.app
~~~

### Redirect URI

~~~text
https://ledger-configurator-production.up.railway.app/auth/callback
~~~

The redirect URI registered at Google MUST exactly match this value.

### OIDC issuer

~~~text
https://accounts.google.com
~~~

### Scopes

~~~text
openid profile email
~~~

No Google Drive, Calendar, Gmail or other API scopes are required for EVO login.

## 3. Google-side client registration

Create one OAuth/OIDC client for the EVO production Ledger Configurator Host.

Client type:

~~~text
Web application
~~~

Authorized redirect URI:

~~~text
https://ledger-configurator-production.up.railway.app/auth/callback
~~~

Record:

~~~text
client_id
client_secret
~~~

The client secret MUST NOT be committed to GitHub, Package manifests, ordinary Settings, documentation examples or logs.

It belongs only in the Host Secrets boundary.

## 4. EVO configuration

Install/enable the normal Package:

~~~text
generic-oidc-identity-provider
~~~

Configure ordinary Settings:

~~~text
issuer = https://accounts.google.com
clientId = <Google client id>
scopes = openid profile email
~~~

Configure Host Secret:

~~~text
namespace = generic-oidc-identity-provider
key = clientSecret
scope = INSTALLATION
scopeId = default
value = <Google client secret>
~~~

The value must be written through Host Secrets.

It must not be copied into ordinary Settings.

## 5. Railway production prerequisites

The production service already has:

~~~text
RAILWAY_PUBLIC_DOMAIN
APP_PLATFORM_STATE_FILE
/data persistent volume
~~~

The following deployment value has been prepared:

~~~text
APP_PLATFORM_PUBLIC_BASE_URL=https://ledger-configurator-production.up.railway.app
~~~

It must be present in the deployed service before live OIDC callback validation.

Managed login remains disabled until Provider readiness is confirmed:

~~~text
APP_PLATFORM_MANAGED_SESSION_ENABLED
!= true
~~~

External Agent public surfaces also remain disabled:

~~~text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED
!= true

APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED
!= true
~~~

## 6. Mandatory cutover order

Do not reorder these steps.

### Gate A — IdP configuration

1. create Google Web application client;
2. register the exact EVO redirect URI;
3. install/enable Generic OIDC Provider Package if not already active;
4. save issuer/clientId/scopes;
5. save clientSecret through Host Secrets;
6. verify effective `identity.authenticate` Provider is `generic.oidc`;
7. run Provider health probe;
8. health MUST be HEALTHY.

Failure at this stage:

~~~text
do not enable managed login
~~~

### Gate B — Host login activation

After Gate A passes, deploy:

~~~text
APP_PLATFORM_PUBLIC_BASE_URL=https://ledger-configurator-production.up.railway.app
APP_PLATFORM_MANAGED_SESSION_ENABLED=true
~~~

Do not enable public External Agent OAuth/MCP yet.

### Gate C — Human browser proof

Use a normal browser.

Required evidence:

~~~text
GET /auth/login
→ redirect to Google
→ Human authenticates
→ Google redirects to /auth/callback
→ EVO issues __Host-evo_session
→ GET /auth/session returns authenticated Human Principal
~~~

Confirm:

- actor type = HUMAN;
- identity provider = generic.oidc;
- Session is Host-owned rather than Google access token;
- Google access/ID tokens are not exposed to browser application state;
- Enterprise Context access still follows EVO Grant/authorization logic.

### Gate D — logout / revocation

Required evidence:

~~~text
authenticated Session
→ logout
→ same Session credential no longer authenticates
~~~

Then create a second Session and verify explicit Host Session revocation also denies it.

This is required because future External Agent delegation depends on current Human authority being revocable.

### Gate E — restart durability

While one valid Session exists:

~~~text
restart/redeploy Host
→ persistent Session event store reloads
→ still-valid Session remains valid
~~~

Then logout/revoke and confirm denial survives another restart.

## 7. Pass criteria

The parent gate may be marked production PASS only when all are proven:

1. real Google OIDC redirect works;
2. state validation works;
3. PKCE S256 exchange succeeds;
4. nonce / ID Token validation succeeds;
5. Host creates request-bound Human Principal;
6. Host Managed Session cookie is issued;
7. Session survives ordinary Host restart within TTL;
8. logout invalidates Session;
9. explicit revocation invalidates Session;
10. revoked Session remains invalid after restart;
11. authorization/Enterprise Context remains Host-owned;
12. no static Session identity is used as production evidence.

## 8. Failure and rollback

If login fails after managed-session activation:

1. do not loosen token/issuer/audience/nonce validation;
2. do not switch authorization to ALLOW;
3. do not use static identity as evidence of a successful production login;
4. disable managed-session activation through Railway deployment configuration;
5. preserve logs/audit evidence;
6. fix IdP/redirect/Secret configuration;
7. repeat Gate A before re-enabling.

## 9. What remains disabled after login PASS

A successful Human OIDC live proof does NOT automatically expose External Agent access.

Still required before first public EA-001:

~~~text
explicit external Agent/client registration
+ Human delegated Authority Grant
+ intentional OAuth protected-resource enablement
+ intentional MCP enablement
+ ChatGPT client identity binding
~~~

The implementation for those foundations already exists.

They remain default-OFF until this login gate is passed.

## 10. First External Agent live proof after login

EA-001:

> Tell me the current Ledger Runtime configuration/template content for this enterprise.

Plugin-owned operations:

~~~text
ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
~~~

Expected path:

~~~text
Human login
→ Human authorizes registered ChatGPT client
→ delegated Grant
→ OAuth access
→ Generic MCP
→ ChatGPT Product Adapter
→ authorized Capability Operation discovery
→ Ledger describe
→ bounded section reads as needed
→ answer Human
~~~

No GitHub/source/database/private endpoint knowledge is part of the Agent task.

## 11. Enterprise-specific wording constraint

Current Ledger configuration data scope is INSTALLATION.

Therefore the first live answer MUST distinguish:

~~~text
current installation Ledger configuration
~~~

from an unimplemented assertion such as:

~~~text
enterprise-specific selected Ledger template
~~~

until Enterprise Context → Ledger Template inheritance/binding is explicit and queryable.

Do not let the ChatGPT Adapter infer this relationship.

## 12. Standards notes

Google requires a Web application OAuth client to register authorized redirect URIs, and the runtime redirect URI must exactly match the registered value.

EVO uses standard OIDC discovery and validates the configured issuer against discovered metadata.

References:

- Google OAuth 2.0 Web Server Applications:
  https://developers.google.com/identity/protocols/oauth2/web-server
- Google OpenID Connect:
  https://developers.google.com/identity/openid-connect/openid-connect
- EVO Generic OIDC architecture:
  `docs/architecture/GENERIC-OIDC-IDENTITY-PROVIDER-EA1B2A-v0.1.md`
- EVO Host wiring:
  `docs/architecture/GENERIC-OIDC-HOST-WIRING-EA1B2B-v0.1.md`

## 13. Next project transition

When this runbook passes in production:

~~~text
production-human-login-request-bound-session-v0-1
→ VERIFIED_PRODUCTION_PASS
~~~

Then immediately continue:

~~~text
register first ChatGPT external client
→ create first Human delegated READ Grant
→ enable External Agent OAuth
→ enable External Agent MCP
→ run EA-001
~~~

Do not return to major Personal Agent feature expansion before EA-001 and at least one second mature External Agent portability proof are complete.


## 14. Production evidence — 2026-10-01

The Human login gate and the EVO-side External Agent protocol foundation are now production-proven.

### 14.1 Human identity/session gate

Status:

~~~text
production-human-login-request-bound-session-v0-1
= VERIFIED_PRODUCTION_PASS
~~~

Observed production evidence includes:

- real Google OIDC browser login;
- request-bound HUMAN Principal through `generic.oidc`;
- Host Managed Session rather than IdP token reuse;
- Session survival across controlled restart;
- logout denial;
- explicit managed Session revocation;
- revoked Session remaining denied after restart.

### 14.2 Enterprise Context creation

The first Enterprise Context was created by the Human through the normal installable Enterprise Context Governance Experience.

This confirms the intended separation:

~~~text
Provider
= Enterprise Context facts / lifecycle / OWNER / Grants

Application Experience plugin
= creation UI / UIDL / localization

Eidos
= rendering / interaction
~~~

Do not repeat Enterprise Context creation for EA-001 unless current governance evidence proves the existing Context is unavailable.

### 14.3 EA-001 delegated governance

The production Human registered/reused:

- ChatGPT External Agent;
- ChatGPT PUBLIC MCP Client using the validated CIMD client identity;
- one ACTIVE delegated Authority Grant.

The Grant is bounded to:

~~~text
effect = READ

ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
~~~

No Ledger WRITE authority is granted.

The Grant validity observed during setup ends at:

~~~text
2026-10-02T01:15:27.387Z
~~~

### 14.4 Production OAuth activation

Railway deployment:

~~~text
2d809e5e-e22e-4e17-aae0-52fddf399e35
~~~

Source commit:

~~~text
e5da83b7bacd2cc1fbc5d4d6ad39a25f02f2e2ca
~~~

Status:

~~~text
SUCCESS
~~~

Production configuration intentionally enables:

~~~text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED=true
~~~

The Host started successfully with the existing durable governance/OAuth/session prerequisites.

### 14.5 Production MCP activation

Railway deployment:

~~~text
7b488002-8fca-4a33-a731-f7543abac13a
~~~

Source commit:

~~~text
e5da83b7bacd2cc1fbc5d4d6ad39a25f02f2e2ca
~~~

Status:

~~~text
SUCCESS
~~~

Production configuration intentionally enables:

~~~text
APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED=true
~~~

### 14.6 Public protocol discovery proof

Browser production proof returned:

~~~text
GET /.well-known/oauth-protected-resource/mcp
→ 200

GET /.well-known/oauth-authorization-server
→ 200

POST /mcp
without Bearer access token
→ 401
~~~

Protected Resource:

~~~text
https://ledger-configurator-production.up.railway.app/mcp
~~~

Authorization Server issuer:

~~~text
https://ledger-configurator-production.up.railway.app
~~~

Advertised endpoints:

~~~text
https://ledger-configurator-production.up.railway.app/oauth/authorize
https://ledger-configurator-production.up.railway.app/oauth/token
https://ledger-configurator-production.up.railway.app/oauth/revoke
~~~

The unauthenticated MCP challenge points to the exact Resource Metadata URL:

~~~text
Bearer resource_metadata="https://ledger-configurator-production.up.railway.app/.well-known/oauth-protected-resource/mcp"
~~~

Therefore the EVO-side chain is production-proven through:

~~~text
/mcp
→ 401 Bearer discovery challenge
→ RFC 9728 Protected Resource Metadata
→ OAuth Authorization Server Metadata
→ EVO authorization/token/revocation endpoints
~~~

### 14.7 What this does not yet prove

This proof does **not** yet prove:

- a real ChatGPT custom MCP client completing Authorization Code + PKCE;
- production issuance of EVO Agent access/refresh tokens to ChatGPT;
- ChatGPT `tools/list`;
- ChatGPT calling either Ledger Runtime READ tool;
- EA-001 returning actual Ledger Runtime content;
- post-Grant-revocation denial of an already-issued ChatGPT access token;
- Enterprise Context → Ledger Template selection/binding;
- External Agent WRITE;
- second-Agent portability.

### 14.8 Current external-client gate

The next live gate is:

~~~text
ea001-real-chatgpt-mcp-connection-v0-1
~~~

Use a ChatGPT plan/workspace that currently exposes custom MCP Developer mode.

Current OpenAI product documentation must be rechecked before giving UI steps because plan/UI availability can change independently of EVO.

Do not weaken EVO OAuth, CIMD, PKCE, Enterprise Context, Grant, authorization or MCP security to work around client-product entitlement.

### 14.9 Ledger wording constraint remains active

The two EA-001 Ledger Runtime Capability Operations remain:

~~~text
dataScope = INSTALLATION
~~~

Therefore a successful ChatGPT answer must say **current installation Ledger Runtime configuration/template**, not claim an Enterprise-specific Ledger Template until explicit Enterprise Context → Ledger Template inheritance/binding exists.


## 15. MCP Inspector end-to-end production proof — 2026-10-01

The official MCP Inspector was used as an independent standards/debugging client to exercise the real production External Agent path.

### 15.1 Client identity and transport

Client identity:

~~~text
https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/mcp-inspector-web-v3-client.json
~~~

Transport:

~~~text
Streamable HTTP
~~~

Protocol era:

~~~text
Modern
MCP 2026-07-28
~~~

The Inspector completed the real EVO OAuth Authorization Code + PKCE flow and then accessed the bearer-protected production MCP resource.

### 15.2 Least-privilege tool discovery

The production `tools/list` result exposed exactly:

~~~text
ledger.runtime.configuration.describe
ledger.runtime.configuration.section.read
~~~

No WRITE operation, External Agent governance operation, Enterprise Context governance operation, or unrelated App Platform operation was exposed.

### 15.3 Ledger describe live call

The Inspector invoked:

~~~text
ledger.runtime.configuration.describe
~~~

and received the current installation Ledger Runtime configuration:

~~~text
templateId = bookkeeping-default
semanticDigest = 8a1e5f7110625cf92da1c6c65a57d875cca9c008bc47c391ebeb76a694990e98

accounts = 141
applications = 143
dictionaries = 106
postingRules = 912
referenceLegacyPostingRules = 587

burnReady = true
blockers = []
~~~

This is an INSTALLATION-scoped configuration read. It is not evidence of Enterprise Context-specific Ledger Template binding.

### 15.4 Bounded section read and cursor continuation

The Inspector invoked:

~~~text
ledger.runtime.configuration.section.read
~~~

for:

~~~text
section = accounts
pageSize = 3
~~~

First page:

~~~text
offset = 0
total = 141
items = 3
nextCursor = present
~~~

Using the returned cursor produced:

~~~text
offset = 3
total = 141
items = next 3
nextCursor = present
~~~

Both pages retained the exact same semantic digest as `describe`.

This proves bounded read and digest-bound cursor continuation rather than unbounded configuration dumping.

### 15.5 Grant revocation immediate-cutoff proof

Without clearing Inspector OAuth state and without explicitly revoking the previously issued access token:

~~~text
ACTIVE Inspector delegated Grant
→ REVOKED
→ Inspector retries MCP connection
→ EVO rejects current authority
~~~

Observed client error prefix:

~~~text
EXTERNAL_AGENT_OAUTH_DELEGATED_AUTHORITY_INACTIVE
~~~

The OAuth service resolves every access-token request against current delegated authority through:

~~~text
resolveAccessToken
→ requireCurrentDelegatedAuthority
→ listEffectiveDelegatedCapabilityOperations
~~~

Therefore the access token is not treated as permanently freezing the Grant's authority.

The production proof demonstrates:

~~~text
token still exists
∩ Grant is no longer ACTIVE
=
no effective External Agent access
~~~

### 15.6 Protocol interoperability fixes discovered by the live proof

The real Inspector run exposed and verified two MCP 2026-07-28 conformance corrections:

PR #241:

~~~text
all successful Modern MCP results
→ resultType = "complete"
~~~

PR #242:

~~~text
tools/call structuredContent
→ actual business result directly
→ conforms to declared outputSchema
~~~

Production commit after these corrections:

~~~text
9c3c1399ecc2c9d42598004e39b5add49d7015ae
~~~

Railway deployment:

~~~text
9b44fd96-df50-48c4-bc66-c7bea7428b64
SUCCESS
~~~

### 15.7 What this proof does and does not close

Closed:

~~~text
EVO Human identity
+ Enterprise Context delegation
+ CIMD
+ OAuth Authorization Code / PKCE
+ bearer-protected MCP
+ Modern MCP 2026-07-28
+ least-privilege tools/list
+ real Ledger READ
+ bounded cursor continuation
+ immediate Grant revocation cutoff
=
VERIFIED_PRODUCTION_PASS
~~~

Not closed:

- MCP Inspector is not an AI Agent and therefore does not prove autonomous Agent tool selection;
- a real ChatGPT custom MCP client remains pending product plan/workspace entitlement;
- second mature external AI Agent portability remains open;
- Enterprise Context → Ledger Template selection/binding remains unimplemented;
- External Agent WRITE remains unproved.

The next live gate is therefore a real external AI Agent client over the same generic contract, preferably through a free standards-compatible client path first.
