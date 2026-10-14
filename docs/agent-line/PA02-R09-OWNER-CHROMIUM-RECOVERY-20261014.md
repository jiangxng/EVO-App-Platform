# PA-02 R09 — 隔离真实 HTTP / Chromium / PostgreSQL Owner WRITE 联合验收（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / CURRENT_PR_CI_PENDING  
**Based on:** `main@d09cfe7e4847ccd85b424f56e60165352482c274`; original [R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) and [living acceptance table](PA02-CURRENT-ACCEPTANCE.md).  
**Production:** Never deploy / no production WRITE. **Provider:** loopback Responses JSON, not a real vendor invoice.

## Why this specific test

#859 proved actual Chromium/Eidos Workbench → Node Host HTTP → PostgreSQL Run/Outbox for **READ_ONLY** only. #839/#841/#842 proved Host-fenced SQL Owner idempotency, receipts and cancellation using Node/PG composition but not the same real browser and HTTP action path. Do not add these proofs and call it a single integrated real Owner browser test.

## Scope and safeguards

- A unique disposable `pa02-sandbox:*` enterprise Context, dedicated `pa02_*` Run and SQL Object Extension schemas, fake local principal, no production credentials. The synthetic governance snapshot is **test-only** and never written to project/runtime repository or production. Ordinary `enterprise.context.create` uses `enterprise:ent_*`, which intentionally cannot enter PA-02's Owner sandbox.
- Existing `manager/server.ts`, `OWNER_SANDBOX` Host registered Object Extension Owner, original PostgreSQL Owner and Authorizer. Preserves `APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK=ISOLATED_NO_PRODUCTION_DATA`, rejects production, and does not modify the Host, Business Owner or Eidos code.
- Loopback Responses fixture proposes the **existing registered `pa02_object_extension_create`** tool, only when Host actually supplies that authorized descriptor. No generic catalog WRITE bypass, arbitrary Owner registration or unsafe fallback.
- Browser sends through the visible Eidos chat composer. It then checks independent SQL business row, immutable Owner evidence, Agent Receipt, durable Run; duplicate HTTP `thread.send`, repeated `run.events`, corrupt cursor snapshot, browser refresh, cross-Context READ denial must never duplicate Owner effects.
- One workflow `.github/workflows/agent-pa02-owner-chromium-recovery.yml` invokes real PostgreSQL18, compiled App Host, Chromium, the browser script and uploads screenshots/JSON/Host bootstrap logs. Initial code submission does **not** imply PASS; use exact HEAD job/log evidence before merge.

## Non-covered PA-02 gates

This test verifies **post-commit READ/replay and exact-once visible persisted Owner effect**, but does not simulate business commit ACK loss while browser disconnects or cancel during a transaction; #839/#842 separately cover those lower-level races. Therefore **R04/R07/R08 and the full WRITE cancellation/recovery matrix remain OPEN** until jointly verified. No real external LLM, price approval, currency hard-budget, production migration or PA-03+ changes. Historical 14 external links retain H (historical transferred) status; this PR adds no public-web research.
