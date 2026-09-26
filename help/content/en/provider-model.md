---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.model",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "concept",
  "title": "Provider model",
  "summary": "Understand replaceable platform services and deterministic Provider resolution.",
  "audiences": ["admin", "developer", "agent"],
  "tags": ["provider", "capability", "resolution"],
  "contexts": {
    "routes": ["/providers"],
    "capabilities": ["llm.inference", "authorization.check", "plugin.remote-credential"]
  },
  "related": ["evo.provider.binding", "evo.provider.health", "evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
A Provider is an installable implementation of a replaceable platform capability.

## Why Providers exist

The platform can support multiple implementations of capabilities such as LLM inference, authorization or remote credentials without hard-coding one vendor into Core.

## Resolution

Provider selection is deterministic and scope-aware. Multiple executable Providers with no applicable binding fail closed as ambiguous.

> [!WARNING] Health is not policy
> Provider health may inform readiness and operator visibility, but it never silently changes an explicit binding.
