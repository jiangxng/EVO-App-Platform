# PA-01A — Contextual turn identity

Document class: HISTORICAL_SNAPSHOT
Date: 2026-10-10
Status: IMPLEMENTED / LOCAL_TARGETED_PASS / REPOSITORY_CI_PENDING / NOT_DEPLOYED

## Problem and change

A retried clientTurnId was checked against message text only. The same text with a changed import job/context could reuse or advance the old Run. thread.send now parses bounded interactionContext before the duplicate branch and compares both text and the parsed JSON object. Node isDeepStrictEqual accepts object-key reordering while preserving array order and field/value differences. Existing no-context retries remain compatible. Existing CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED remains the conflict code.

No API, database, business permission, diagram, vendor or production configuration change. This is the first small Agent-line implementation, not the full assistance protocol or durable idempotency design.

## Evidence

Base: 301cf0a45e59591adcb6a33e6d30fb68a94db443.
Local environment: Node v24.19.0. Twelve actual runtime dependency modules were fetched at this SHA; TypeScript was transformed with Node stripTypeScriptTypes(mode=transform) into a local isolated dist. No application mocks were substituted for the handler/runtime/store; the existing test harness uses in-memory stores and a deterministic fake model.
Command: node --test tests/integration/p1-7b-thread-backed-turn.test.mjs.
Result: 10/10 PASS (4 existing + 6 new cases). The same expanded suite against the original handler gave 5 PASS / 5 FAIL, reproducing changed/removed/added/array-reordered/malformed context retries.

This local check is execution evidence, NOT full tsc or npm ci/build evidence. The existing Agent CI - Thread-backed Turns P1.7B workflow watches the changed paths and runs npm ci plus the repository build and integration suite. Its actual result must be recorded before calling repository CI PASS.

## Remaining limits

- Existing duplicate lookup searches at most 100 scoped runs; no permanent unique-key guarantee added.
- No multi-process transaction, distributed idempotency, lease or recovery improvement claimed.
- Requests without clientTurnId retain existing behavior.
- Context is task data, never authorization. Existing Host principal/context checks remain authoritative.
- No Eidos/browser acceptance, live model, PostgreSQL or production deployment performed.
- Full PA-00 operational configuration/performance baseline still pending; this bounded fix does not depend on production changes.

## Continuation

Agent-line planning and living handoff are in PR #570 / docs/personal-agent-blueprint-20261010, docs/agent-line/HANDOFF.md. Recheck current main and parallel PRs; do not update global project.status.json/HANDOFF or merge/deploy this branch without the appropriate integration scope. Next: record exact-head CI, then define PA-01B versioned assistance request/result compatibility using the existing interactionContext and typed message parts.
