# CV-03 / N1-04j — 正式 Host 的未认证 Saved View Feature 恢复启动隔离

> 2026-11-10，准确基线 `main@d9ad5dd2b669a656eb0b7d9b1f4c07fadac306c5`（#1206 已合并）。
> **真实 Host 启动拒绝**，不是生产 PA05 授权事务或 SQL Owner 自动 fencing。生产 N1=**NOT_CERTIFIED**，`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / 未注册 Page GET 404 保持原状。

## 1. 本轮从原代码直接获得的证据（G）

- [`manager/server.ts`](../../../manager/server.ts) 1097–1149 段：正式 Host 从 `APP_PLATFORM_STATE_FILE` 构建真实 `createFileLifecycleStore`，立即核查 PA05 Purchase Attention 的已安装或恢复 Feature，不允许未经认证的 READ owner 继续启动；但**原本没有针对 CV-03 Saved View opt-in Feature 的恢复检查**。`assertCv03HumanSaveNotEnabledV010(process.env)` 是独立 flag 启动门禁，并不检查磁盘上的 Active Feature。
- [`providers/enterprise-context/personal-saved-views.ts`](../../../providers/enterprise-context/personal-saved-views.ts) 实际 Feature ID 为 `host-enterprise-context-provider.personal-saved-views`；[原 Host enterprise context 包](../../../providers/enterprise-context/package.ts) **不包括**该可选 Feature，生产代码无正式注册。本轮不能把 `host-enterprise-context-provider.default` 错判为该 opt-in WRITE Feature。
- [`manager/cv03-personal-saved-view-host-admission.ts`](../../../manager/cv03-personal-saved-view-host-admission.ts) 原断言只处理 SAVE_MODE 非 OFF，以及对原 SAVE Command 的 Action Router 403，未检查恢复态。
- [既有真实 E01I 启动隔离](../../../tests/agent-line/pa05-e01i-startup-restoration.test.mjs) 已有 disposable Host subprocess/localhost `/v1/catalog` 双向验收方式；本轮复用而不创造第二套启动框架。
- [N1-04i 真实文件恢复交接](CV03-N104I-REAL-PA05-FILE-FAILURE-ATOMICITY-AND-RESTART-FENCE-20261110.md) 已证明：即使重新启动的 Manager 对某个 Feature 给出 DENY，跨存储的 SQL mirror 仍可能保留旧 ALLOW。**这一 SQL 镜像失联风险不是本轮启动门禁能够自动修复的**。

这些都是本次实际读到的代码（G）及由其得出的工程安全决定（D）；没有新增外部 EX01–EX08 厂商文献，不改变先前来源等级。

## 2. 已实施的范围

- 在现有 [CV-03 Host Admission](../../../manager/cv03-personal-saved-view-host-admission.ts) 定义纯检查 `assertCv03UnadmittedPersistedFeatureAbsentV010` 和固定 Feature ID。它对缺少有效 activeFeatures 或其中含有精确 Saved View opt-in Feature ID 的快照**抛出固定拒绝代码**：`CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED`。不依赖 HTTP、请求 actor、插件传入属性或环境开关。
- 在 [真实 server.ts](../../../manager/server.ts) 从 `APP_PLATFORM_STATE_FILE` 打开 FileLifecycleStore 后执行该断言，**在创建 HTTP server/监听端口之前**拒绝不受信的活跃 Feature。安全拒绝**不自动卸载**、不修改磁盘上的 operator lifecycle 文件，也不尝试凭本机单边状态修复数据库。
- 不因为 `host-enterprise-context-provider` 是已安装的正常宿主包而拒绝；不把正常 Default Feature 或只读 UI 页面模式当作 opt-in SAVE Feature。
- [新 N1-04j 实际 Host subprocess 回归](../../../tests/agent-line/cv03-n104j-real-host-startup-quarantine.test.mjs) 利用临时目录真实文件 + `dist/manager/server.js` + 独立 loopback 端口，断言：
  - 已持久化的 Saved View Active Feature，即使有 `APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE=READ_ONLY`，也**在 HTTP 启动前拒绝**。
  - 活跃 Feature ID 对但 `packageId` 冒用其他包，仍拒绝。
  - 只有普通宿主包 installed metadata（无活跃 Saved View），或宿主 Default Feature 正常活跃，仍能提供 `GET /v1/catalog` HTTP 200；允许 Host 原有正常启动默认服务安装写入生命周期文件，但必须保留原有 operator 安装/Default Feature 记录，并证明未激活未经认证的 Saved View Feature。
  - 检查原 Domain Owner Feature ID 与启动门禁常量一致；`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=ON` 仍被原独立门禁拒绝。
- 扩展原 [CV-03 PG18 工作流](../../../.github/workflows/cv03-resource-postgres-atomic.yml) 的路径与串行测试命令，确保新真实 Host 测试属于**必须实际执行**的回归，而不是只被加入仓库。

## 3. 明确未解决的生产准入

- **不能宣称跨存储强一致撤权。** 本 PR 是 Host 启动前的**本地状态隔离**：对未注册 Saved View opt-in Feature 做失败关闭；它不读取受控 SQL Primary，也不触发有可信凭证的 Owner generation rotation。
- **不能处理离线进程内的历史许可。** SQL 镜像的旧 ALLOW/lease 若已存在，并不会因某个 Host 拒绝启动自动撤销。N1-04h 的 SQL Owner fencing 是 PG18 隔离证明，真实 PA05/AuthorizationProvider 的权威事实源及 Host startup 跨存储协议依然 OPEN。
- 没有正式 Host KMS、签名密钥保管/轮换、SQL pool 身份、权限全量 Watermark/离线 tombstone、跨多 Worker 认证或生产 PostgreSQL schema 迁移。
- **不解除** `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、POST 403、Page GET 404；不触发生产部署或模拟真实外部 LLM、人类 390px 视觉签收。
- 仍需安全 Owner 在真正生产资源可控后批准完整 PA05 lifecycle/outbox + actor/enterprise Producer fencing 及自动启动准入；本地快照不能自证跨系统安全。

## 4. CI 与并行治理

- PR #1184 的受管三份文档不修改；只增量更新 11-10 原决策索引，并保持历史参考链接。
- exact HEAD 的 PostgreSQL18（本轮新增真实 Node subprocess 测试）+ Platform CI + Lightweight Host + Project Continuity + Human UI Design Gate 都要 **SUCCESS** 后才能合并 main。
- 合并后使用仓库现有 `branch-hygiene.yml` 的 `retire-merged-pr-safe` 验证分支精确 SHA，再清理；不直接 push main，不将 CI 的 UI Gate 冒充 Human 视觉认证。
