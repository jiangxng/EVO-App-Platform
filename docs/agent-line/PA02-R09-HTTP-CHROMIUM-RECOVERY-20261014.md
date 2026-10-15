# PA-02 R05/R06/R09 — 真正 HTTP + Chromium + PostgreSQL 恢复验收（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / GATE_PENDING_CI
**Based on:** `main@161acb810a60009def818abaf70846e683321be2`; [原始验收矩阵](PA02-CURRENT-ACCEPTANCE.md)、[原总纲 R05/R06/R09](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)、[既有 Eidos 消费测试](../../tests/app-host/pa02-thread-outbox-recovery.test.mjs)。
**Production:** DO NOT DEPLOY. **Owner WRITE:** not enabled in this isolation run.

## 为什么不能复用以前的“浏览器 PASS”

`pa01b2_full_host_chromium.py` 虽跑过真实 Chromium、Workbench 和真实 Host，但它的 Run 使用的不是 PA-02 `PostgreSQL Fenced` Authority；`tests/app-host/pa02-thread-outbox-recovery.test.mjs` 的 Eidos 客户端则是模拟 Host 返回值。两者**不能合并推断为真实 HTTP/Chromium/PG 同一 Run**，也不能证明业务 WRITE 只发生一次。

## 本轮实现的可验证边界

- **实际 App Host 进程** `dist/manager/server.js`，采用仓库既有 `createPersonalAgentExperienceProfileV010` 隔离身份与企业上下文/数据、正式 `APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE=READ_ONLY`、单独 PostgreSQL18 测试 schema；不启用生产工作模式。
- **实际 Chromium / Eidos Workbench** 使用真实页面 `/?surface=desktop#/enterprise-agent`、标准聊天输入组件，经 `/v1/actions` 真实 HTTP 发送，核对 Run 来自持久 Worker 且包含 #856/#857 真实 Provider usage 证据。
- **真实 Host PG Outbox** 从受权 `enterprise-agent.run.events` API 分页读取与重复读取事件；检查连续序号、`MODEL_USAGE_RECORDED`、同一 Run 终态；错误游标触发快照重置，不二次模型调用；浏览器刷新不重发同一 Human turn；跨 Context 访问必须拒绝。
- **本机模型模拟** 提供 Responses 协议 JSON，模拟有明确 usage 的固定数据。它是*网络调用的测试双身*，不是供应商实际计费或真实外部 LLM 的证明。CI 将捕获真实 App Host、Browser 网络证据、截图与 JSON 报告。
- 使用隔离测试文件 `tools/agent-line/pa02-http-chromium-fixture.mjs` 和 `tests/agent-line/pa02_http_chromium_recovery.py`，不修改 `manager/server.ts`、正常 Eidos 消费器或 PA-02 执行器；真实业务 Object Extension Owner WRITE 并不在这批证明里。

## 通过条件 / 不能偷换的门槛

工作流 `.github/workflows/agent-pa02-http-chromium-recovery.yml` 应当在 PostgreSQL18 + Playwright Chromium 全部 PASS 并上传 `artifacts/agent-pa02-chromium-read/r09-http-browser-report.json` 和截图。最终使用准确 PR Head Action IDs 追加证据，创建时不预填 PASS。

即使这批浏览器成功，**R04、R07、R08 和包含业务 WRITE 的 R09 联合验收仍 OPEN**。确认取消后不继续 WRITE、Owner 回执、响应丢失核验、Outbox 重复后不二次 WRITE 要在 `OWNER_SANDBOX` 受治理的真实 SQL Owner/Host/Chromium 通路中证明。禁止用 READ_ONLY CI 代替这些风险门槛。

外部网页：本批**没有新增查阅网络来源**，沿用交接历史原文与 H 级外链分级。
