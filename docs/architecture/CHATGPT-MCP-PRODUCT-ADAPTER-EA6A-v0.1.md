# ChatGPT MCP Product Adapter — EA-6A v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Generic MCP authority:** preserved  
**Business semantic changes:** none  
**Production activation:** still blocked on real Human OIDC live proof

## 1. Purpose

EA-6A implements the first product-specific External Agent adapter.

It exists to reduce ChatGPT integration friction without creating a ChatGPT-specific EVO.

Canonical layering remains:

```text
Plugin Capability Operation
        ↓
App Platform authority
        ↓
Generic MCP projection
        ↓
Product Tool Adapter
        ↓
ChatGPT
```

The Product Adapter may add client-specific interoperability metadata.

It MUST NOT modify:

- business operation identity;
- business meaning;
- input/output semantic schema;
- Principal authority;
- Enterprise Context;
- delegated Authority Grant;
- authorization.check;
- ACTION_HOST binding;
- domain execution.

## 2. Why an adapter is justified

ChatGPT's current remote MCP integration expects authenticated tools to expose explicit OAuth tool metadata in addition to protected-resource metadata.

The product adapter therefore supplies:

```text
securitySchemes
_meta.securitySchemes
annotations
```

without requiring every EVO plugin to know ChatGPT conventions.

OpenAI reference:

- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/reference
- https://developers.openai.com/plugins/build/mcp-server

## 3. Client identity

The adapter does not trust MCP self-reported `clientInfo`.

ChatGPT-specific behavior is activated only from the OAuth-bound CIMD client identity already validated by the EVO authorization server.

Accepted ChatGPT CIMD forms:

```text
https://chatgpt.com/oauth/client.json
https://chatgpt.com/oauth/<callback-id>/client.json
```

The first is the stable ChatGPT CIMD identity.

The second preserves compatibility with callback-specific ChatGPT client metadata.

A URL merely containing the word "chatgpt" is not accepted.

## 4. Tool security metadata

For ChatGPT, each authorized Tool receives:

```json
{
  "securitySchemes": [
    {
      "type": "oauth2",
      "scopes": ["evo.capabilities"]
    }
  ],
  "_meta": {
    "securitySchemes": [
      {
        "type": "oauth2",
        "scopes": ["evo.capabilities"]
      }
    ]
  }
}
```

The `_meta` value is a compatibility mirror only.

The actual authority remains server-side:

```text
OAuth credential
∩ current Human
∩ Enterprise membership
∩ active Agent
∩ active Client
∩ active/unexpired Grant
∩ active plugin Feature
∩ operation exposure
∩ authorization.check
=
current callable Tool
```

## 5. Tool annotations

Current EA-6A only projects READ/PLAN operations.

For ChatGPT those Tools receive:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "openWorldHint": false
}
```

These hints describe behavior.

They do not replace server-side authorization or input validation.

When governed WRITE is introduced later, WRITE annotations must be derived from actual operation semantics rather than a product default.

## 6. No product-specific business contract

Forbidden:

```text
chatgpt.ledger.runtime.describe
chatgpt.sales.order.read
```

Required:

```text
ledger.runtime.configuration.describe
sales.order.read
```

ChatGPT receives the same stable EVO operation identity used by any other conforming client.

## 7. Generic clients remain unchanged

A non-ChatGPT OAuth client receives the Generic MCP projection.

Therefore:

```text
Generic MCP
≠ ChatGPT-specific server
```

and:

```text
ChatGPT Adapter
= compatibility/developer-experience layer
```

The second mature Agent product should be able to add a sibling adapter without changing the Capability Operation contract.

## 8. RFC 9207 issuer identification

EA-6A also adds OAuth Authorization Server Issuer Identification.

Authorization Server metadata declares:

```json
{
  "authorization_response_iss_parameter_supported": true
}
```

Every authorization success and OAuth redirect error includes:

```text
iss=<exact authorization server issuer>
```

This follows RFC 9207 and protects against authorization-server mix-up.

It also enables the stable ChatGPT client/callback mode when OpenAI's current connector requirements permit it.

Authority:

- https://www.rfc-editor.org/rfc/rfc9207.html
- https://developers.openai.com/plugins/build/auth

## 9. Stable ChatGPT connection target

Once the production Human-login gate is closed and External Agent OAuth/MCP is intentionally enabled, the target remote MCP endpoint is:

```text
https://ledger-configurator-production.up.railway.app/mcp
```

Protected-resource metadata is derived for the path-bound Resource Identifier:

```text
https://ledger-configurator-production.up.railway.app/.well-known/oauth-protected-resource/mcp
```

Authorization Server metadata remains Host-root:

```text
https://ledger-configurator-production.up.railway.app/.well-known/oauth-authorization-server
```

No endpoint should be activated in production merely because EA-6A is merged.

## 10. First target prompt

The first ChatGPT EA-001 validation remains:

> Tell me the current Ledger Runtime template content for this enterprise.

Expected Tool path:

```text
ledger.runtime.configuration.describe
        ↓
optional bounded section reads
        ↓
ledger.runtime.configuration.section.read
```

No GitHub, source code, database or private internal API knowledge is allowed in the conformance proof.

## 11. Production gate

Before connecting ChatGPT to production:

1. configure a real OIDC Human Identity Provider;
2. browser-prove /auth/login → IdP → /auth/callback → managed Session;
3. prove logout/revocation;
4. register ChatGPT External Agent + OAuth Client identity;
5. create an explicit Human delegated Authority Grant;
6. enable External Agent OAuth;
7. enable External Agent MCP;
8. connect the ChatGPT app;
9. run EA-001;
10. verify Grant revocation removes Tool access immediately.

The current Railway environment MUST remain with External Agent OAuth/MCP disabled until steps 1-3 are complete.

## 12. Invariants

### CGA-01

ChatGPT-specific metadata MUST be selected from validated OAuth client identity, never model text or MCP self-reported clientInfo.

### CGA-02

Product adapters MUST NOT rename or reinterpret EVO business Capability Operations.

### CGA-03

Tool security metadata is descriptive; server-side current authority remains decisive.

### CGA-04

Generic clients MUST continue to receive valid Generic MCP Tools without requiring ChatGPT metadata.

### CGA-05

RFC 9207 support requires `iss` on both successful and error authorization redirects and exact equality with Authorization Server metadata `issuer`.

### CGA-06

Production activation remains blocked until request-bound Human OIDC login is live and revocable.
