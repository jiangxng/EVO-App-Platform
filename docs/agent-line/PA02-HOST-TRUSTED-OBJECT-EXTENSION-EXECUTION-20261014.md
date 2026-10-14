# PA-02 — Host Action → 已注册 Object Extension Owner WRITE，隔离执行证据（2026-10-14）

**Document class:** DECISION_RECORD / IMPLEMENTATION_EVIDENCE  
**Scope:** PA-02 工作包 1（真实 Host 受治理执行链）；保持 PA-02 原始 R01–R10，不增加数据库/插件平台专项。  
**起点:** `main@6b4a6baa5ad8cf4faab9349f8ae8dbda59f82920` (#837)。  
**权威:** [PA-02 最初的 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) · [项目交付工作流](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) · [Owner 门禁](PA02B-GOVERNED-OWNER-WRITE-HANDOFF-20261014.md)。

## 原始缺口与实现

`manager/agent-async-read-worker-runtime.ts` 已经服务于正式 Host 的 `run.start / run.resume / run.get / run.cancel` 及 `thread.send` 可选 PostgreSQL READ 执行链，却未装配已有的 Owner WRITE。原来的 `agents/enterprise-agent/pa02-governed-worker-write-port.ts` + `pa02b-governed-owner-write-handoff.ts`、`manager/agent-trusted-owner-registration.ts` 和 `apps/object-extension/agent-owner-postgres.ts` 已通过各自 CI，本轮直接复用，不新增 Agent 调度器、模型工具框架或业务数据表。

本批在现有 Host 异步执行器 **仅由可信 Host 显式注入** `AgentTrustedOwnerBindingV040`：复用同一个 Run/Fencing/Coordinator/Receipt/Owner Reconciler，在 real Run Worker 中以原有正式 Capability Operation 的 id/package/schema 识别且仅替换同名已授权 Catalog WRITE 工具的描述；没有出现在原授权 Catalog 里的操作绝不添加。模型无法选择 Owner；Material WRITE 不经 `catalog.invoke`，而由既有准入、不可变 input digest、持久化 PREPARED/INVOKING、真实领域 Owner 和独立验证进行。重复消息/ACK 丢失不能重发 Business Owner。

启动配置显式分级：`OFF` 无数据库/Worker；`READ_ONLY` 不能附带 Owner；`OWNER_SANDBOX` 同时要求 Host 可信 Owner Binding、`APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK=ISOLATED_NO_PRODUCTION_DATA`、schema `pa02_*`、环境非 `NODE_ENV=production`、原有 PostgreSQL URL 与 READ_MODE 不冲突。**本次未在 `manager/server.ts` 为任何部署配置 OWNER_SANDBOX/注入业务 Owner，也没有自动 Host 启用入口**；代码专用于经过 Host-side 构造的隔离执行证明。默认仍安全保持 READ-only。

## 本轮唯一新增 E2E

`tests/agent-line/pa02-host-object-extension-owner-execution.test.mjs` 经正式 `createPersonalAgentRunActionHandlersV010` 调用真实 `run.start/get` → 可选 PG Host Worker → 有效的 Object Extension Capability Operation → Host 注册器资源级 AI 再授权 → 已存在的 PG 业务 Object Extension 实体 + 不可变证据 → 丢失业务 ACK 后 Owner 验证 → Run 真实 Receipt 和最终用户回复。再次发相同 Host actionId 不得重复执行或推理；变更企业无法读取；卸载插件后旧 Binding 执行授权拒绝。实际 SQL 验证 domain 事实一份、Agent Receipt SUCCEEDED 一份、Owner evidence 一份。另复核 READ_ONLY 不支持注入 Owner、生产模式下拒绝 sandbox。

测试合并前需在现有 [PA-02 PostgreSQL18 CI](https://github.com/jiangxng/EVO-App-Platform/blob/main/.github/workflows/agent-pa02-async-read-worker.yml) 中执行并核对准确 PR head；原 #816/#825/#828/#829/#832/#836/#837 测试继续回归。

## 阶段收尾范围与尚未完成

这只关闭 **正式 Host Runtime 受治理 WRITE 接线证明**，不代表 `manager/server.ts` 实例化业务 Owner，也不代表普通 Human Object Extension 文件 Provider 与 Agent PostgreSQL Owner 已经统一权威。**不接生产 WRITE、不迁移正式企业数据、不部署、不允许 READ_ONLY 默默变 WRITE。**

PA-02 下一步按原始 R01–R10：让真实 Server 受控模式在单一企业资源权威下启用，完成 `thread.send` 工作台入口的 Owner WRITE 和掉线恢复/取消联动；补 R03/R05/R06/R07/R10 实验缺口。整个 Provider 生产迁移和其他插件拓展不自动纳入 PA-02；生产准入仍独立。

**CI evidence（已在源码头 `81da67db8eeed8e036c88038da31b9c9da5867ac` 验证）：** [PostgreSQL18 real Host/Worker/Owner CI #38511340118](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511340118)：`npm run build` 成功，**13/13 tests PASS，0 fail，0 skipped**，正式标记 `PA02_HOST_OBJECT_EXTENSION_GOVERNED_WRITE` 证实业务 Owner invoke=1、实际 Agent Receipt、真实 Owner 业务资源、丢 ACK 校验、Host action 幂等、异租户不可见、插件卸载拒绝、无 catalog WRITE 旁路、无生产 Server 模式。另 [Host Async READ CI #38511339896](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511339896)、[Lightweight Host Architecture #38511340095](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511340095)、[Platform CI #38511340024](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511340024)、[Continuity #38511339940](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511339940) 均成功。最终 PR head 在合并前仍须有真实 CI；此证据不能推断生产启用、浏览器体验或 PA-02 阶段验收。
