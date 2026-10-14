# PA-02 — 正式 Server 隔离 Owner 接线和普通 Thread 端到端（2026-10-14）

Document class: DECISION_RECORD / INCREMENTAL_IMPLEMENTATION_EVIDENCE  
阶段范围：最初 [PA-02 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，本批仅是工作包 1 的剩余集成门禁。起点 `main@1d2712c9f312b5d0ce46d981c478797cf63b619c`（#839 已合入）。

## 为何本批必要

上一批 #839 的正式 Host Run Handler → Fenced Worker → 真实 Object Extension PostgreSQL Owner → Receipt 已在隔离 CI 通过。然而普通 Personal Agent Tool Catalog 把动态企业操作暴露为 **通用 Capability 搜索/描述/调用工具**，并不天然暴露 `enterprise.object-extension.definition.upsert` 这个独立模型 tool；简单把 Owner Binding 注入 Worker 并不能使正常 `thread.send` 找到业务工具。本批只补这个**现有 Capability 发现到受治理 Worker 的适配**，不改写 Agent 框架/业务主数据存储。

## 实施、边界和关键负向门禁

- `manager/server.ts` 显式 `OWNER_SANDBOX` 时懒加载一个 **已安装有效 Capability Operation** 的可信 Object Extension Owner，交给此前正式 Host 可选 PostgreSQL Worker，同源提供给 `thread.send` 和 `run.*`。`OFF` 和 `READ_ONLY` 完全不创建它；关停时释放连接。
- `manager/agent-pa02-sandbox-object-extension.ts` 复用 `createHostRegisteredAgentOwnerRegistryV040`、现有已授权 Capability 查询、业务插件的 PostgreSQL Owner/Verifier 和 Object Extension 契约验证。每次发现重新核查现行安装/插件生命周期/授权；每次业务执行依然通过既有 Owner Binding 的现行 Host 授权。**未在普通 Catalog 授权的操作不能凭模型提议执行**。
- `manager/agent-async-read-worker-runtime.ts` 的单个已签名 Host `discoverTrustedOwner` 门禁让真实 generic Capability Catalog 可选择增加完全匹配的这一个直接 WRITE descriptor；已有同 ID 或 modelName 冲突则不增加，旧 `catalog.invoke` WRITE 路径不允许绕过受治理 Owner。
- `OWNER_SANDBOX` 除已有 `APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK=ISOLATED_NO_PRODUCTION_DATA`、`NODE_ENV!=production`、独立 `pa02_*` Agent schema 外，还必须由 Host 指定 `APP_PLATFORM_AGENT_RUN_PA02_OBJECT_SCHEMA=pa02_*`（**预先人工准备，启动不迁移**），`APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_CONTEXT_ID=pa02-sandbox:...` 与 `APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_ENTERPRISE_ID=pa02-sandbox:...`。同一 context 的当前文件资源若已有 `evo.object-extension` 资源则拒绝；每次授权重新核查，不允许跨 Context 使用。两个 PG schema 不允许相同。普通 Host Object Extension 文件 Provider 未切换，本隔离演练**不提供双写/生产级锁与 Human 通用页面的数据一致性**。不准指向真实客户 Context；不允许生产 WRITE。
- **不在本批做**：全量 Provider 替换/迁移、第二插件、自动数据库 DDL、Railway 部署、真实企业写入、将 #839 重做。失败仍保留原始安全门禁。

## 正式入口专项验收

`tests/agent-line/pa02-host-server-sandbox-object-owner.test.mjs` 由真实 `createThreadBackedAgentTurnActionHandlersV010` 模拟普通工作台 `thread.send`，Catalog 只含通用 Capability READ 工具（**没有预置直接业务 WRITE**）；Host 经有效 Object Extension Capability 操作+AI Principal/enterprise scope 授权后注入唯一直接工具，真实 Worker 运行至 PostgreSQL 领域业务事实、独立不可变 Owner 证据和 Agent 成功 Receipt。相同用户 Turn 二次请求不能重复产生消息或业务写入；越界企业、撤权、卸载、文件资源冲突、生产运行模式在门禁层拒绝。测试在 PostgreSQL18 disposable schema 下完成，无业务生产数据。

该验收由 [Agent PA-02 Host Async READ Execution CI](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02-host-async-read-execution.yml) 自动执行，原 Host READ 回归保留；所有最终结果以合并 PR 准确 head 为准。

## 下一阶段门禁与完成定义

工作包 1 的“Server 装配 + 正常 Thread 运行路径”有了隔离 SQL 验收，但尚需隔离 **完整 Web Server/浏览器** 验证和 Worker 并发取消联动。PA-02 按原始 R01–R10 进入工作包 2–4；不把正式 Enterprise Resource 生产 Provider 切换变成 PA-02 功能收尾门槛，亦不声明 `PRODUCTION_READY`。

**代码最终候选 head 证据（`29749aae09c78258063946168a4a4b6f414b5e32`）：** [Agent PA-02 Host Async READ Execution #38512808964](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38512808964) PostgreSQL18、`npm run build`、**3/3 PASS、0 fail、0 skipped**，真实标记 `PA02_SANDBOX_SERVER_THREAD_OWNER`：普通 `thread.send`、Generic Capability catalog→Host 授权发现、真实 SQL Owner 领域资源+不可变证据、Agent Receipt SUCCESS、同 Turn 不重写、撤权/错企业/文件权威冲突拒绝、生产模式拒绝。 [Agent Worker #385128...](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38512660223) 只是早期相关回归快照；准确最终 head 需看 PR 检查。 [Lightweight Host Architecture #38512809007](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38512809007) 成功，证明无新增 Host eager business dependency。最终 doc-head CI 和 PR merge SHA 以 GitHub PR 凭证为准；本阶段不得声称 Human 浏览器或生产可用。
