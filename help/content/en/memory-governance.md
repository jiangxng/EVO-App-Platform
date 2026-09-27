---
{
  "helpVersion": "0.1.0",
  "id": "evo.memory.governance",
  "ownerPackageId": "evo-app-platform",
  "ownerFeatureId": "evo-memory-governance.system",
  "locale": "en",
  "kind": "administration",
  "title": "Memory governance, retention and Legal Hold",
  "summary": "Operate Context Memory retention, privacy classification, Legal Hold, scheduled operations and Provider health without changing immutable Memory.",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["context-memory", "retention", "legal-hold", "dlp", "privacy", "scheduler"],
  "contexts": {
    "packageIds": ["evo-app-platform", "host-context-memory-provider", "remote-context-memory-dlp-provider"],
    "featureIds": ["evo-memory-governance.system"],
    "capabilities": ["context.memory.governance", "context.memory.dlp-classification", "context.memory.semantic-retrieval"],
    "commands": ["context.memory.retention-policy.set", "context.memory.legal-hold.set"]
  },
  "related": ["evo.personal-agent.world-model", "evo.provider.health", "evo.secrets.configure-provider-credential"],
  "lastReviewedAt": "2026-09-27"
}
---
Context Memory records stay immutable. Retention, privacy classification and Legal Hold are separate append-only governance evidence.

## Memory workspace

Open **Memory** in the Workbench.

- **Memory Governance** shows the active Context’s effective state, privacy class, retention deadline and Legal Hold status.
- **Memory Search** only receives Memory that the Host Reader has already authorized. Restricted and expired Memory is removed before ranking or UI search.
- **Memory Source Health** shows Provider health for Memory read, governance, semantic retrieval, DLP and intake. Secret values are never displayed.

## Retention policy

Retention policy events are append-only. A policy may target Memory kinds and privacy classes. If multiple active policies match, the earliest applicable deadline wins.

Scheduled retention does not delete or rewrite Memory. When a deadline is reached, the scheduler appends an `EXPIRED` governance event.

## Legal Hold

Legal Hold is also append-only. `PLACED` prevents retention-driven expiration. `RELEASED` releases only the matching hold; another active hold still protects the Memory.

Legal Hold does not make explicitly restricted or explicitly expired Memory visible.

## DLP classification

The DLP Provider is replaceable. Remote credentials are resolved through Host Secrets.

DLP classification:

- never changes the Memory record;
- stages the whole classification batch before writing governance events;
- fails closed if the Provider is unavailable or returns invalid data;
- never overrides explicit Human privacy governance.

## Scheduled operations

Set `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS` to at least 60000 to enable periodic execution.

For scheduled source intake, set `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON` explicitly. The scheduler never invents or broadens Context scope.

Scheduled intake runs as a service actor and may only create Pending Proposals. A Human must still review and accept a Proposal before durable Memory can be created.

## Enterprise authority

Enterprise retention policy and Legal Hold changes require an active OWNER or ADMIN relationship, Human action, explicit confirmation and an `authorization.check` ALLOW decision.
