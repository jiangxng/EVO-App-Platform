# PA-01B1 — Versioned assistance request and correlated result

Document class: DECISION_RECORD (proposed implementation, not released)
Date: 2026-10-10
Status: IMPLEMENTED_LOCAL_TARGETED_PASS / CI_PENDING / NOT_MERGED / NOT_DEPLOYED
Dependency: PA-01A PR #575, head f5efab9b110b3e79635c7f904ef7a7d94fd6b137.
Branch: agent/pa01b-assistance-contract-20261010.

## Decision and reason

Introduce an additive opt-in envelope at existing enterprise-agent.thread.send values.assistanceRequest. Reuse existing Host scope, durable thread, Run, model and tool execution instead of a new endpoint or task execution engine. Preserve message/clientTurnId/interactionContext legacy calls.

The large blueprint's AssistanceRequest/Result fields were candidates. This first executable subset adopts existing contractVersion 0.1.0 naming and typed Run state. It does not invent a Task table, declare WRITE certification, or pretend presentation preferences and generic proposed-change application are implemented. Frozen public schemas must be agreed with Eidos consumption before this draft becomes a released contract.

## Request example

```json
{
  "threadId": "conversation-thread:1",
  "assistanceRequest": {
    "contractVersion": "0.1.0",
    "requestId": "assist:mapping-1",
    "taskKind": "data-import.mapping",
    "userIntent": "帮我匹配字段",
    "source": {
      "pageId": "mapping",
      "actionId": "ai-auto-map",
      "resourceRef": "import-job:1",
      "resourceRevision": "17"
    },
    "context": {
      "importJobId": "job-1",
      "targetId": "counterparty.subject"
    }
  }
}
```

These values accompany the existing authorized AppAction command, not an unauthenticated new HTTP API. source/resource/context are client claims to be re-read and checked by domain tools; they never construct Host identity, grant permissions or authorize navigation.

requestId maps to clientTurnId; userIntent maps to the visible message; source/context/taskKind adapt into the existing interactionContext. The validated envelope is independently preserved in Run.input.assistanceRequest so restart, duplicate send and resume retain correlation. Optional explicit message/clientTurnId must match the envelope. Mixing interactionContext and assistanceRequest is rejected rather than choosing a hidden precedence.

## Validation

Version exactly 0.1.0. Top-level and source fields are closed; no principal/tenant/permission injection there. JSON-only context, finite numbers, maximum depth16 and 2000 visited values; reject prototype keys. Envelope JSON serialization at most16000 characters. requestId/pageId/actionId240, taskKind128, userIntent8000, route2048, resourceRef512, resourceRevision240 characters. Required strings nonempty and trimmed. Revision without resource is invalid. context.taskKind, if provided, must agree.

These are bounded initial contract limits, not file-upload limits. Large files go through authorized references. Context may contain business fields whose names resemble enterprise IDs; they are not trusted scope.

## Result semantics

Existing result fields thread/run/message/messageParts remain. Versioned calls additionally return assistanceResult on send and resume:

```json
{
  "contractVersion": "0.1.0",
  "requestId": "assist:mapping-1",
  "taskKind": "data-import.mapping",
  "source": {
    "pageId": "mapping",
    "actionId": "ai-auto-map",
    "resourceRef": "import-job:1",
    "resourceRevision": "17"
  },
  "runId": "agent-run:1",
  "runState": "SUCCEEDED",
  "actionReceiptIds": []
}
```

SUCCEEDED describes the Run, not proof of a business commit. Receipt IDs are copied from authoritative Run state; none are inferred from model prose. Source revision is the submitted base revision, not a newly written revision. No automatic page navigation/refresh or effect application is enabled here. Legacy calls omit assistanceResult.

## Implementation and evidence

Files: contracts/agent-assistance.ts; additive optional field in contracts/agent-run.ts; parser/adapter in agents/enterprise-agent/assistance-request.ts; existing thread handler; existing integration suite; dedicated P1.7B workflow path filters.

Local Node24 execution of actual pinned modules via TypeScript transform:23/23 targeted tests PASS (previous10 plus13 new). Includes send/retry/resume correlation, legacy compatibility, envelope persistence through JSON event materialization, caller mutation isolation, unknown version, invalid/mixed inputs, forged top-level identity, excessive size/depth and unsafe prototype keys. Local TS transform is not type checking; normal tsc/npm build remains a CI requirement. Existing P1.7B workflow now watches both new files and the Run contract.

## Remaining work and continuation

PA-01B1 is the backend compatibility slice. PA-01B2 must implement Eidos-owned page transport and source-match/dirty-state handling, then consume through a narrow App Platform vendor update after checking 2D changes. Business proposals still need typed artifacts, version-aware validation/application and real Human-browser proof. Do not claim the Data Import AI button already emits the new envelope: it still uses its working legacy path.

PA-02 retains durable unique-key/idempotency work (existing lookup limit100), cancellation and distributed Run/receipt migration. No database migration or production change in this PR. Planning and living progress remain #570 / docs/agent-line/HANDOFF.md. Do not update global project status or mainline handoff.
