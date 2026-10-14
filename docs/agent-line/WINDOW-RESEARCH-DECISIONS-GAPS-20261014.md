# PA-02 本窗口决策、方案比较与未决门禁（2026-10-14）

**Document class:** HISTORICAL_SNAPSHOT / DECISION_RATIONALE  
**配套文件:** [简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261014.md) · [逐条来源/阅读等级/附件索引](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md)  
**代码事实基线：** `main@e4ce338e483af9b6ad17ea811ad6b052cbffafeb`；后续 `main` 可能发生非 Agent 变更。

## A. 必须保留的 Owner 决定

1. **进度来自可运行闭环而不是 PR/分支数量。** 同一可交付需求只保留一个活动分支 + 一个 PR，在原分支修复/重测；CI 与影响验收通过尽快入 main 并清理；大的 PA-02 里程碑可以顺序含多个短闭环。已验证旧能力可直接复用，不因换聊天或为“深度研究”重复造原语。这是**用户明确决定**，不是参考文章推论；正式规则在 `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`。
2. **不用生产数据证明可靠性。** 开发阶段以可重放的隔离 PostgreSQL 18 / 真实领域仓库预览断言为主；对企业 WRITE、身份授权、取消、生产部署须保留各自独立门禁。Host 默认 OFF/READ-only，不自行上线。
3. **允许与其他窗口并行，但不覆盖公共权威/其他 owner**：本轮不接管 Eidos、2D、Ledger Runtime、BEX、Governance，也不修改 `project.status.json` 或 `docs/roadmap/HANDOFF-LATEST.md`。
4. **本次交接保留真实访问级别**：GitHub 原文与 CI 日志属于实际读取，公共外部14项来自以前的索引只能称历史参考，不能伪称这次网页原文已读。

## B. 来源事实（直接代码／测试）与本轮工程判断的界线

| 编号 | 源码/CI 支持的事实（不外推） | 本轮工程判断（方案含义） |
| --- | --- | --- |
| F1 | `#816` 使 Host 的可选 PostgreSQL READ Run 经正式 Thread 入口接线，兼容路径默认关闭；历史临时 Agent 3 分支合为一个，后经 #816 入 main | 可复用，未来不再另建 Async Run/Thread 管理器 |
| F2 | `#825` + `#828`：受控 WRITE 先持久化 PREPARED/REQUESTED 与 Owner 归属，再 INVOKING，未知回执走 Owner verifier；Worker 通过恢复/新 fence 后写入观察和 Receipt 引用；PG18 隔离测试覆盖丢应答与不盲重发 | **模型返回成功≠业务写成功**；未知情况下必须封存而非重发，Owner 独立验证才允许终结 |
| F3 | `#829`：`manager/agent-trusted-owner-registration.ts` 从现行 Capability Operation 与 Host authorization 校验 Owner package、操作、AI principal、企业 scope、请求的目标资源；`manager/capability-operation-access.ts` 提供共享检查逻辑 | Tool 权限与插件生命周期必须在每次 WRITE 之前重验，不能只信模型的 toolId、Owner 名称、或“声明为 WRITE” |
| F4 | `#832`：`apps/object-extension/agent-owner-preview.ts` 的实际 create-only 业务写入与 Owner 证据在同一个本地 `EnterpriseResourceRepository.transaction` 提交；重复幂等键只核证据；本地文件重开后可核结果；已验证9/9专项通过 | 真实领域插件可以形成 Owner 适配，但当前只能定位 **single-process developer preview** |
| F5 | `providers/enterprise-context/resources.ts` 的 `transaction` 是进程内 snapshot/回滚，file 实现是读 JSON、写临时文件、rename；公共 `EnterpriseResourceRepositoryV010` 仅给可选同步 transaction，没有跨进程 compare-and-swap 或共享锁契约 | 两个进程可读到同一旧快照并各自写；**不能**推出跨进程 exactly-once，也不能声称 PostgreSQL 的 Agent 表事务会自动包含另一个资源文件事务 |
| F6 | `apps/data-import/capability-manifest.ts`、`apps/object-extension/capability-manifest.ts` 中已有 `writeSafety: HOST_REQUIRED` 的声明；Data Import COMMIT 可能先提交目标行再单独保存 Job Receipt；常规 Object Extension UPSERT 可以覆盖同一 ID | Capability 的安全标签是**要求 Host/Owner 实现**，并非实际完成了可恢复幂等；不能直接给普通 Action Router 加 Agent 权限就当可靠业务 WRITE |

## C. 采用与排除的方案对照

| 议题 | 本轮采用；理由 | 本轮排除或推迟；理由 | 适用条件及上限 |
| --- | --- | --- | --- |
| 分支与 PR | **顺序短闭环**：#816→#825→#828→#829→#832；逐项通过门禁后合并与清理；每项都有具体增量 | PA-02 永远占一条分支/单 PR；或每个函数都另开多个长期分支：都增加冲突与重复劳动 | 允许真正不同 owner 的独立工作并行；在共享 Host/agent 文件前必须先核查 |
| 真实 WRITE 模型 | **受控 Owner port + 持久意图/Receipt + fence + verifier**，复用 PA02A/B/C 公共能力 | Worker 直接 `catalog.invoke` 调用通用 Action 后凭 HTTP 200/文本认定写成功：在 ACK 丢失时无法证实是否已提交 | Owner 具有稳定幂等 key、源身份绑定、独立查证终态及副作用恢复接口 |
| 首个领域 Owner | **Object Extension 新建定义 + 原仓库 + immutable evidence**：结构紧凑，可校验真实业务对象、单事务回滚、重启后的可读证据 | 先拿 Data Import COMMIT 作为多节点写入示范：批次/多对象/Receipt 关系复杂且可能部分成功；风险更高。也不再以仅有沙盒表的测试冒充业务插件集成 | 目前**只能单进程演示**；create-only；不能覆盖已存在定义；未供正式 Host 自动注册 |
| 当前存储能力 | 在已存在的 `EnterpriseResourceRepository.transaction` 下实现最小证明，不改变平台存储权威 | 把 JSON file rename 当跨进程锁、跨服务事务或宕机 exactly-once：原实现无此保证 | 本轮合并是研究增量，不是发布资格 |
| 后续多进程可靠性候选 | **优先评价真实业务 Owner 同库事务/唯一约束**，一次提交业务行+不可变回执，查询结果由 Owner 独立完成 | 单靠 Agent 的 PostgreSQL fence/Receipt 覆盖另一个业务资源文件；两个数据库/文件之间无共同原子提交，fence 不能代替 Owner 自己的幂等 | 候选而非已通过的技术选型；须先与资源 Provider/存储 owner 核定边界与迁移兼容 |
| UI/外部框架 | 先复用现有 Thread、Run、Eidos Workbench、权限与 Capability Fabric | 再引进 Temporal、新自主多 Agent 架构、直接改 Eidos 或重新发明 Host 权限系统：本轮无相应业务门禁，也未重新核外部规范版本 | 后续只有出现不可由现有契约实现的硬需求且经研究验证，才重新比较 |
| 质量证据 | 读取准确 PR head、合并 SHA、GitHub Actions 以及测试源文件，确认新场景实际执行 | 仅凭“CI Success”而未看测试命令、跳过/误合并路径就声明覆盖：#832 首轮曾出现新增测试**没被测试命令执行**，后来修复并核对日志 | 完整测试日志仍可能到期；稳定断言应留在仓库 |

**重要：** 上表左栏有用户直接决策、源码/CI事实，也有本窗口提出的工程取舍。候选 SQL Owner 事务方案不是“已由外部来源证明最优”，仅是待测试的下一研究方向。

## D. 已发现冲突／未完全解决的权威差异

1. **历史快照滞后于 main**：`PA02-STAGE-GATES-SNAPSHOT-20261013.md` 反映 10-13 的“尚未正式接线”等状态；10-14 的 #816/#825/#828/#829/#832 后一部分已实现。该快照保留，不应重写旧事实。新窗口按 GitHub 当前源码/PR 优先。
2. **实现文档中的旧状态字段**：`PA02B-GOVERNED-OWNER-WRITE-HANDOFF-20261014.md` 标题区域仍写 `CI_PENDING`，其后有多节已合并增量，**前面的静态状态不是今天准确的最终 CI**；最新核验以本次入口和 PR 为准。不要因为文档旧文字而重新开发已合入模块。
3. **“原子”一词有范围差异**：单进程 Resource transaction 保证同一进程快照的业务对象+证据一起提交；不提供多个进程对同一文件的串行化、全节点共享锁或崩溃后的持久化原子性。不能混同 PostgreSQL 多 Worker Proof。
4. **Owner evidence 与后来业务变更**：当前预览验证 `evidence.definition` 与“此刻的业务对象”是否相等；若人工后来合法修改，该旧提交仍曾成功，但 verifier 会返回 `UNRESOLVED`。这是**保守拒绝旧成功的语义**；未来正式 Owner 必须明确“历史提交发生过”和“当前对象仍一致”要怎样区分。不可把两者合并为一个状态。
5. **安全声明与执行语义**：插件 manifest 的 `writeSafety` 与实际可恢复幂等行为不可相互替代；普通 UPSERT/COMMIT 不一定有原子 Receipt。在接入生产之前需 owner 端幂等与验证证据。
6. **旧外部参考版本与实际决策**：历史14网页（Temporal、MCP、A2A、AG-UI、W3C、OWASP 等）仅曾在前次报告收录。本窗口未打开，因此无法用它们的现行文字为新的可靠性或前端标准下权威断言；必须选择性再核查。

## E. 尚未解决的问题与继续查阅顺序（按价值排序）

1. **先明确资源 Owner 存储正确归属**：在 `providers/enterprise-context/resources.ts` / `contracts/enterprise-resource.ts` 下，能否新增共享事务型存储实现或以 Plugin Owner 私有 PostgreSQL 表+可验证查询满足契约？谁管理迁移、授权作用域和既有文件数据？先读当前 Provider / Enterprise Context 架构和开放 PR。不能因为 Agent 方便直接重写全平台存储。
2. **在多进程真实业务数据库中验证 exactly-once 的“业务端语义”**：两独立 Node Worker/连接竞争同一 `idempotencyKey`；一个在提交后丢 ACK、另一恢复；旧 fence/租约不影响已提交业务；唯一约束不同请求冲突拒绝；重启、网络分区、真实企业 Principal/Context；跨租户不可见。记录业务行和不可变 Owner 证据都落在一个事务的证据。
3. **ACK 丢失和超时后的 terminal policy**：业务对象后来被 Human 修改、归档、迁移时如何证明原历史效果；Owner `verify` 应使用**不可变的提交凭证而非当前对象等值比较**；定义 FAILED/DENIED/UNKNOWN 的可核证条件，不凭异常文本自动判失败。
4. **正式 Host 可选注入门禁**：`manager/server.ts` 当前无真实 Object Extension Owner 注册；从当前插件有效贡献、授权、可信 adapter、原有资源 Provider 隔离建立仅指定插件/企业可选配置，默认 OFF，应用/许可证/权限 owner 决策后方可启用。生产授权单独。
5. **端到端用户体验与真实取消**：真实 Thread 发送/恢复→Worker 动态工具发现→Owner 写入→Run/Receipt→用户回复/状态；测试长任务、进程崩溃、同 Turn 重试、超时、取消、租约转移、PostgreSQL服务异常，不能仅依赖隔离模块测试。
6. **仅在确有需求时补看公共外部标准原文**：Temporal Workflow execution 与 PostgreSQL 官方事务/唯一键/隔离级别是两个不同层面的选型参考；历史网页里 Temporal 链接可以去核，PostgreSQL 原文链接**未在本窗口访问、不收录为已读**。如后续会扩展外部 Agent，再核 A2A/MCP 安全，若改 UI 再核 W3C/AG-UI；避免无边界全网研究。

## F. 具体模块、分支与下一步验收账

| 模块/原文件 | 当前事实/下一操作 |
| --- | --- |
| `apps/object-extension/agent-owner-preview.ts` | 复用单进程证据逻辑与测试**作为基线**；新闭环重点证明多进程原子存储而不是复制预览或偷偷去掉 `singleProcessDevelopmentOnly` |
| `apps/object-extension/repository.ts`、`contracts/enterprise-resource.ts`、`providers/enterprise-context/resources.ts` | 先确认业务 Owner / Provider 的存储权威；评估支持原子 idempotency receipt 的可替换实现 |
| `manager/agent-trusted-owner-registration.ts`、`manager/capability-operation-access.ts` | 已有权限与插件门禁，可复用；只在可信 Owner 真实 ready 且授权明确时做 Host 接线 |
| `agents/enterprise-agent/pa02b-governed-owner-write-handoff.ts`、`pa02-governed-worker-write-port.ts`、`pa02-async-read-worker.ts` | 保留原有 fence/UNKNOWN/Run receipt 语义，不再建立第二套执行器 |
| `manager/server.ts`、`manager/agent-async-read-worker-runtime.ts` | 暂不擅自启用生产 WRITE；正式可选接线另立安全验证闭环 |
| `tests/agent-line/pa02-object-extension-preview-owner.test.mjs`、`.github/workflows/agent-pa02-async-read-worker.yml` | 已真实执行9/9专项场景；多进程成功/失败/崩溃门禁需要**新的**针对性测试。旧 push 分支过滤已从 Workflow 移除 |
| `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` | 每项闭环一活动短分支 + 同一个 PR，多次提交，CI 合格即合 main 并安全清理 |
| `main`（2026-10-14采样） | `e4ce338e483af9b6ad17ea811ad6b052cbffafeb`；本交接自身合入后 HEAD 会变；不得把历史 Agent 分支当活动分支 |

**下一步任务建议**：不是再“接入第二个 Provider”，而是**让第一个真实 Object Extension Owner 的业务写入与不可变证据具备跨进程、跨故障可靠性**，然后才考虑 Host 的真实业务 opt-in。这一选择是对已有工作缺口的收敛，不等于系统唯一可能的架构。
