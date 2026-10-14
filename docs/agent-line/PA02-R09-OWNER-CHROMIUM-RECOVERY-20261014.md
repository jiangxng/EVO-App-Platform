# PA-02 R09 — 隔离真实 HTTP / Chromium / PostgreSQL Owner WRITE 联合验收（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / VERIFIED_INITIAL_HEAD_CI_NOT_YET_MERGED  
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

## 首轮真实 GitHub Runner 原始验收（2026-10-14）

- 初版确切 code HEAD `fe7343734cd8fe2c545438345ccce6c251d6a472`；[Agent PA-02 Governed Owner Chromium CI #38547645499](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38547645499) job `115797557596` **SUCCESS**。同一 head 的 Continuity #38547645485、Lightweight Host #38547645340 也 SUCCESS。**以后若文档再提交，应以最终 PR HEAD 再核 CI，不冒称初版覆盖后续提交。**
- 实际 job 原始日志 `PA02_OWNER_REAL_BROWSER={\"passed\":6,\"total\":6,\"sqlOwner\":true,\"productionUsed\":false}`；六项 PASS 是真实工作台 WRITE、同 Human Turn 重发幂等、Outbox 重读、缺口后权威 Receipt 快照、真实浏览器刷新不重发、跨 Context 权限拒绝。业务 Owner SQL resource=1、不可变 Owner Evidence=1、Agent Receipt=1、模型 mock 响应=2，真实回执 ID 与 Run 关联。
- [Artifact 11884923046](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38547645499/artifacts/11884923046)：`owner-http-browser-report.json`、`pa02-owner-workbench.png`、`pa02-owner-reloaded.png`、`bootstrap.log`。测试服务和数据库只在临时 GitHub Runner 内。
- **剩余仍 OPEN：** 业务已提交后丢失 ACK 且与浏览器掉线同时发生、进行中取消后旧 Worker 失租的真实 HTTP/Chromium 联合场景。原有 #839/#842 分别证明过底层恢复逻辑，不能据此把未执行的联合浏览器场景称作已验证。R10 货币预算与最终签收仍 OPEN。
