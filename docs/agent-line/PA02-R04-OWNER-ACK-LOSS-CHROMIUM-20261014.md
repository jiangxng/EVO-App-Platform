# PA-02 R04/R08/R09 — 真实 SQL 提交后 Owner ACK 丢失与浏览器取消（2026-10-14）

**Document class:** DELIVERY_EVIDENCE / CI_PENDING  
**Baseline:** `main@996cb2de2e63a657438adfa12aba05044e70fed0` (#865 已合并)。  
**Original authority:** [PA-02 原 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)；[当前验收表](PA02-CURRENT-ACCEPTANCE.md)。

## 最小交付与为什么这不同于 #865

#863 和 #865 已分别验证真实 Chromium→Host→PG Owner 一次提交、重复读取/重连/缺口，以及 **Host 已收到业务 Owner 回复后** 浏览器掉线、取消、保留已提交业务效果。但没有真正模拟 Owner SQL 事务已提交、Host 收不到返回 ACK 的情况。

此次新增唯一、严格测试限定的故障注入，位置在 `manager/agent-pa02-sandbox-object-extension.ts` 的原受治理 Owner 外层：**只有** Host 明确 `OWNER_SANDBOX`、`NODE_ENV=test`、原有 `ISOLATED_NO_PRODUCTION_DATA`、隔离 `pa02-sandbox:*` Context 和独立 PG schema，且 `APP_PLATFORM_AGENT_RUN_PA02_TEST_POST_COMMIT_ACK_LOSS=ackLostProof` 才启用。原真实 Object Extension Owner `await invoke` 完成 SQL business row + immutable Owner evidence 原子事务后，特定隔离测试字段 `ackLostProof` 在包装层暂缓 6 秒并抛出运输 ACK 丢失异常。**不改变 SQL Owner、正式 Worker、fencing、业务验证、消息格式或生产 WRITE 默认关停的行为**。其他字段无任何模拟延迟。非 test 或错误参数立即拒绝；不使用任意模型参数启用故障。

## 要实测的同一个 Run

1. 真实 Eidos Chromium composer 发出 Human Turn，真实 HTTP Host 经 Fenced Run、已授权业务 Owner 创建隔离 Object Extension；fixture 在数据库中确认已提交的独立业务事实与 Owner evidence，且 Host 日志显示开始等待模拟 ACK 丢失，未执行异常分支。
2. 模拟真实浏览器断开原请求（reload），通过 **Host 正式** `enterprise-agent.run.cancel` 请求取消，故障时间窗覆盖业务 SQL commit 后、Host 尚未收到业务结果时。
3. 包装层抛出模拟 ACK 丢失；原先实现的 Host Writer 将不明返回进入 UNKNOWN/Owner Verifier 并做实际证据核验，按 PA02C 既有两段取消协议最终进入 `CANCELLED`，已提交 Receipt 必须仍可从 `run.get` 及 `run.events` 权威快照查询。
4. 严格断言 SQL business rows、immutable Owner evidence、Agent receipts 仅各新增一条；模型调用无盲重发；错误 Context 继续不可读。CI Artifact 保存完整 Chromium 截图、PG/Run 报告和 Host 日志。

测试入口沿用 `.github/workflows/agent-pa02-owner-chromium-recovery.yml`。 **提交/运行之前不宣称 PASS**，最终 PR Head 与 Merge SHA 以 GitHub CI 原文为准。已完成 #839/#842 的旧原子核验不重复实现。

**仍不覆盖：** 真正断开整条 PostgreSQL TCP 连接/任意外部业务系统、跨地区故障或生产权限。此处是受控、仅测试的真实 SQL 业务提交后丢失 Host 接口 ACK；另一个独立关口 R10 的真实供应商 usage、批准币种/费率与每次推理前持久硬费用预留仍 OPEN。R01–R10 总签收必须另行验证，不将此批当作 PA-02 DEV_COMPLETE。历史外站 14 条 H 级转引不升级。
