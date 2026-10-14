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

## 2026-10-14：真实浏览器取消未来 WRITE 的独立门禁

- 第一次加入此场景的 [Actions run 38548226890](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548226890) 为 **6/7**：新测试错误地以为第一次 `run.cancel` 返回 `REQUESTED` 后仅轮询 `run.get` 就能完成取消；这与既有 #842 的正式取消恢复契约不符。没有发现能证明已造成额外业务 WRITE 的产品失败，不能将此失败粉饰为 PASS。
- 在同一 PR 修改浏览器测试：模型工具调用暂留在隔离 localhost Responses，用户透过正常 HTTP Action 发起取消；释放模型后重复调用正式 Host `run.cancel` 做持久 reconciliation，再断言 Run `CANCELLED`、无第二 Run 的业务 Receipt、实际 Object Extension SQL resource/owner evidence/agent receipt 仍各只有首次成功的一笔。
- 修正后准确 HEAD `56a8ac3548f83e0e97fd51e8a414437cb9017276` 的 [真实 Chromium + PG18 + Host/Owner Actions 38548540580](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540580) job `115800539441` **7/7 PASS**；同时 [Continuity 38548540523](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540523) 与 [Lightweight Host 38548540558](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540558) 均 SUCCESS。浏览器报告、截图、bootstrap 原始证据为 [Artifact 11885457660](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548540580/artifacts/11885457660)。**若后续为与最新 main 对齐追加 merge commit，仍要复核最终 HEAD 的必需检查。**
- 该取消场景是**尚未发送业务写入前**的有界取消，不是 SQL 事务写入中取消、commit 成功但 ACK 丢失，或浏览器与 Worker 同时断线后的完整 R04/R07/R08 联合场景。它们仍须单独以证据签收；不得宣称 PA-02 已全部完成。


## 2026-10-14：已提交业务效果后浏览器断线／取消联合门禁（新 PR 代码，CI 待证）

沿用 #863 的同一条真实 `Eidos Chromium → /v1/actions → App Host → PostgreSQL Fenced Run → 受治理 Object Extension Owner`，不修改正式 Host/Owner/Worker。新的独立场景：第三个 Human Turn 先从 Host 授权的模型函数调用提交**另一条隔离业务效果+独立 Owner 回执**；模型的下一次最终文本响应在 loopback 测试端暂缓。浏览器在这期间真实 reload（客户端 HTTP 中断），随后经正式 Host `run.cancel`、释放模拟模型、按已有 PA02C 取消协议继续 reconciliation。要求第三个 Run `CANCELLED` 且保留已提交的完整 Owner Receipt；Pg 业务行/独立 Owner evidence/Run receipt 各累计恰好 2，无第三次 WRITE；`run.events` 缺口快照仍为 CANCELLED 且有已提交 receipt。屏幕截图、报告进入同一类 Artifact。

**分级：** 这是业务效果已经提交、模型最终回复/浏览器 HTTP 尚未完成的断线取消；并**不等于 Host 与 SQL Owner 之间已经提交事务但 Owner ACK 真正丢失**，亦未强制模拟 SQL 事务内部取消。#839/#842 的独立 ACK 丢失/原子取消局部测试仍为那两项的一手证据。真实联合测试未通过之前不得把此场景标记 PASS，R10 货币硬预算与 PA-02 阶段最终签收维持 OPEN。外站 14 条 H 级别不变。
