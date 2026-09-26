---
{
  "helpVersion": "0.1.0",
  "id": "evo.personal-agent.world-model",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "en",
  "kind": "concept",
  "title": "Personal Agent and Context Memory",
  "summary": "Understand EVO's person-first model: one Personal Agent, Personal Context and governed Enterprise Contexts.",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["personal-agent", "context", "context-memory", "enterprise-context", "human-decision"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal", "agent.personal.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.enterprise-agent.tools", "evo.authorization.authentication-vs-authorization", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
EVO's first point of view is the human. The MVP has one Agent type: Personal Agent.

## Personal Context

Personal Context belongs to the human's long-lived working identity. It may contain permitted preferences, reusable experience and Personal Context Memory.

## Enterprise Context

Enterprise Context is governed enterprise-specific working and learning material. It may expose business data, history, documents, tools and Enterprise Context Memory.

Enterprise Context is not a second Agent and does not own the human's identity.

## Context Memory

Personal Context Memory and Enterprise Context Memory are separate long-lived assets. Access to Enterprise Context does not automatically permit enterprise-confidential facts to be copied into Personal Context Memory.

## Human decision authority

Personal Agent may observe, analyze, explain and propose.

Material decisions remain with the human unless a future explicit delegation contract grants otherwise.

> [!INFO] Compatibility naming
> The current Package, route and command still use the enterprise-agent machine identifier for compatibility. The product-facing Agent is Personal Agent.
