---
{
  "helpVersion": "0.1.0",
  "id": "evo.enterprise-agent.tools",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "en",
  "kind": "concept",
  "title": "Personal Agent tools",
  "summary": "Understand how Personal Agent discovers and invokes Host-authorized platform tools.",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["enterprise-agent", "tools", "tool-discovery", "agent"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal.tool-discovery", "agent.enterprise.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.authorization.authentication-vs-authorization", "evo.provider.model", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
Personal Agent does not contain a fixed list of platform tools. The App Platform Host supplies the effective tool catalog for each Agent run.

## Tool effects

- READ tools inspect authoritative state without intended mutation.
- PLAN tools perform side-effect-free preflight or planning.
- WRITE tools change platform state.

A tool being visible to the Agent is not the same as authorization to execute it.

## Current observation tools

Personal Agent can inspect its Host-resolved current Context, the platform snapshot, effective Capabilities, Package catalog, Providers, Provider health, Provider bindings and authoritative Platform Help.

The current Context is available through `context.current.get`. `context.available.list` returns only the Context references currently offered by the Host.

When a Host Enterprise Context Provider is configured, Personal Agent can switch between Personal Context and the available Enterprise Contexts from the Chat Context selector. The selected reference is validated again by the Host before use. Request data cannot create an Enterprise Context by supplying arbitrary ids.

## Installation tools

Package installation keeps a Host-enforced safety sequence:

1. Run app.install.plan for the Package.
2. Confirm the plan is side-effect-free and has no blockers.
3. Run app.install.execute for the same Package.

> [!WARNING] The model is not the security boundary
> Unknown tools fail closed. Safety checks and future authorization are enforced by the Host, not by prompt instructions.

## Credentials

Personal Agent never receives saved API Key plaintext. LLM credentials stay inside the Host Secrets Provider and LLM Provider runtime boundary.


## Host Enterprise Context Provider

The first reference Enterprise Context source is the Host Enterprise Context Provider (`enterprise.directory`). Operators can supply Host-owned context definitions through `APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON`.

This reference source is replaceable. Future directory, identity, HCM or customer-specific providers can implement the same platform boundary without changing Personal Agent.

Enterprise Context use in P0.5 is read-only reasoning context. It does not create an Enterprise Agent and does not permit automatic copying into Personal Context Memory.
