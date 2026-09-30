# External Agent Governance Action Host Projection — EA-3C v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Authority:** EA-3A durable governance + EA-3B current delegated authority  
**External network exposure:** none

## 1. Purpose

EA-3C exposes the existing External Agent governance service through the normal
EVO Action Host so a request-bound Human can manage Agent, Client and delegated
Authority Grant facts without a private side API.

Canonical path:

~~~text
Human request-bound Session
→ Host Context resolution
→ Action Host
→ External Agent Governance service
→ authorization.check
→ durable governance store
~~~

This projection does not enable OAuth or MCP.

## 2. Foundation lifecycle owner

The management projection is owned by the built-in first-party Foundation
Package:

~~~text
packageId  = evo.external-agent-governance
featureId  = evo.external-agent-governance.default
capability = external.agent.governance
~~~

The Feature is installation-scoped and default-active when the Host installs the
foundation.

The Foundation package owns only the Host governance management surface. It does
not own Agent business semantics, plugin Capability Operations, OAuth transport,
MCP transport or product-specific adapters.

## 3. Action Host commands

EA-3C projects the already-defined governance actions directly as Action Host
commands:

~~~text
external.agent.register
external.agent.revoke
external.agent.client.register
external.agent.client.revoke
external.agent.grant.create
external.agent.grant.revoke
external.agent.governance.read
~~~

The command identity and authorization action identity intentionally remain
aligned.

## 4. Human confirmation

Every governance mutation requires:

~~~text
requiresConfirmation = true
~~~

The read action does not require confirmation.

Confirmation is not authorization. The underlying governance service still
requires a HUMAN Principal and calls the current `authorization.check`
Provider.

## 5. Enterprise Context binding

Grant creation now fails closed unless the Host-resolved active Context is an
Enterprise Context.

Permanent EA-3C rule:

~~~text
External Agent Authority Grant
→ explicit current Enterprise Context
→ never implicit first-enterprise selection
→ never Personal Context
~~~

For browser/API use, callers select Context through the normal Host request
context mechanism, including `x-evo-context-id` where appropriate.

## 6. ChatGPT is data, not a special authority path

A ChatGPT client can be registered through the generic Client action using its
validated CIMD client id:

~~~text
https://chatgpt.com/oauth/client.json
~~~

Example semantics:

~~~text
Agent displayName = ChatGPT
publisherId       = openai
Client kind       = PUBLIC
protocols         = [MCP]
oauthClientId     = https://chatgpt.com/oauth/client.json
~~~

No ChatGPT-specific governance action exists.

Other conforming Agents use the same actions with their own Client identity.

## 7. Separation from public protocol activation

EA-3C being installed and active does not expose public Agent access.

Production protocol surfaces remain separately gated:

~~~text
APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED
APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED
~~~

Therefore:

~~~text
governance management available
≠ OAuth enabled
≠ MCP enabled
≠ delegated Agent access granted
~~~

## 8. Acceptance

EA-3C machine acceptance requires:

1. the Foundation Feature is lifecycle-effective;
2. mutation Actions require Human confirmation;
3. service-level Human and authorization checks remain authoritative;
4. ChatGPT stable CIMD identity can be stored as a generic PUBLIC MCP Client;
5. READ Authority Grant creation is attenuated to current Human authority;
6. Grant records bind the current Enterprise Context;
7. Personal Context Grant creation fails closed;
8. governance read returns only records visible to the current authorizing Human;
9. disabling public OAuth/MCP does not disable Human governance management;
10. no new ChatGPT-specific business contract is introduced.

## 9. Production sequence

After EA-3C is deployed:

~~~text
Human login
→ select Enterprise Context
→ register ChatGPT Agent
→ register ChatGPT CIMD Client
→ create Ledger READ Grant
→ verify governance readback
→ enable External Agent OAuth
→ enable External Agent MCP
→ connect ChatGPT
→ run EA-001
→ revoke Grant
→ prove Tool access disappears immediately
~~~
