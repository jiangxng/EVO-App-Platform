# PA05 / K0｜2026-10-22 合并后研究资料、事实与决策参考索引

> **Document class:** AGENT_LINE_RESEARCH_DECISION_REFERENCE_INDEX / SOURCE_PROVENANCE / 2026-10-22  
> **配套短入口：** [PA05/K0 交接入口](PA05-K0-WINDOW-20261022-POSTMERGE-HANDOFF-ENTRY.md)  
> **写作前主线快照：** `main@59d31034f4ad7fd2715e1ac26395abbba94a31d1`；不能视作永久最新版本。  
> **来源级别规则：** `已读原文` = 本轮直接读取原网页、GitHub 文件/PR 或 Actions 原始日志；`仅搜索摘要` = 只读取搜索引擎结果；`待验证` = 文件/URL 被提及，但未取得正文或当前接口拒绝抓取。先前对话原文未能重新取到的内容不冒充本轮已读。

## 1. 目标、用户指令、边界和本轮可交付物

- **最终目标：** PA05 完成开发阶段 Host shutdown / PROCESS 停机屏障工程整合，收拢 Draft 和过程分支，沿用插件架构与 Agent 线独立治理，同时为未来独立 Operator 认证保留原证据，不把局部 CI 伪装成全局 K0。
- **用户明确要求（按先后）：** “PA05 可以阶段性收口则先收口”；询问为何 #1104 仍 Draft；随后“好的继续”；最后明确“**合并吧，我们是插件模式开发，目前还在开发阶段，我不想太多分支，换窗口后由于记忆问题造成重复开发**”；本交接轮要求“短交接 + 详细参考索引”，独立 PR 保存、不影响其他窗口。
- **决定：** 允许 #1104 的工程代码在准确最终 HEAD CI 绿灯后**合并 main**；完整生产认证、安全停止的组织级证据仍按 #1092 `NOT_SIGNED` 保留；不开启 material WRITE，不动全局状态。
- **代码与文件实际结果：** [PR #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) 已 MERGED，准确原始 HEAD `08ab0c14c38891bdfd81f83a0f1df3b9306c2655`，merge commit `3bb68a6a6b2dcb11f1e10a9456a33e90f3440a85`。截至本交接前 `main@59d31034...`，此 merge commit 已是祖先；没有遗留开放 PA05 工程 PR。2026-10-22 下一轮仍须刷新并行主线变化。
- **Railway 不确定性：** 最近能只读访问的环境虽叫 `production`，用户强调产品仍处开发期；两句话并不矛盾。**开发阶段不等于部署配置安全**；主线代码合并不等于线上实时部署完成。
- **合并前验证：** 准确 HEAD 最初 **46/46 GitHub checks SUCCESS**，源码 19 个变更路径（原 18 个工程/测试/CI/候选文档 + 工程阶段修订文档），与同步时 main **0 个同名文件冲突**；后续因新增清理工作流，GitHub 同 HEAD 统计为 **51 项：47 SUCCESS、4 SKIPPED**（清理专用 Job 跳过），与合并前 46/46 并不冲突。**以每次检查时间戳、分组和原始 run 为准，不能把跳过项计入业务测试通过。**
- **过程分支：** 合并后 Branch Hygiene [run #39756394843, job #119749355229](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39756394843/job/119749355229) 原始日志含 `DELETED_VERIFIED_MERGED_AGENT_BRANCH agent/pa05-k0-consolidated-engineering-20261022 @ 08ab0c14c38891bdfd81f83a0f1df3b9306c2655`，GitHub 远端再次检查不存在 PA05 工程分支。另有更早的 [#1103](https://github.com/jiangxng/EVO-App-Platform/pull/1103)/[run #39719106363](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39719106363) 和 [#1105](https://github.com/jiangxng/EVO-App-Platform/pull/1105)/[run #39723079693](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39723079693) 分别实删已合并文档、已被整合的工程过程 refs；历史 PR 保留。
- **本轮未操作：** 没有手工 Railway 部署、重启、停止、缩放、配置写入；没有生产 SQL、Secrets、旧锁清理、PID1 注入、生产 SIGKILL；没有变更 BEX/CP03/Eidos/2D 或 `project.status.json`。用户要求本轮仅把交接材料保存到 GitHub 独立文档分支。

## 2. 外部参考网页索引：先区分真正原文与搜索摘要

所有日期均为 **2026-10-22** 的本窗口查阅/复核日期，不是网页发布日。官方页面会更新，以下保留章节定位与重要限制。

| 原始标题与网址 | 本窗口查阅状态 | 主题与实际读到的事实 | 项目用途和边界 |
| --- | --- | --- | --- |
| **GitHub Autodeploys · Railway Docs** — https://docs.railway.com/deployments/github-autodeploys | **此前搜索结论被引用；本次尝试直开失败，当前正文待验证**（网页工具报 `unsupported content-type: text/markdown`） | 前文据官方搜索结果概述：关联的 GitHub 分支在新提交后通常会进入自动部署，除非关闭相应设置；但本轮未读到网页正文。 | 确认 `main` 与线上发布潜在耦合，不能以“没有在 Railway 主动点部署”断言提交不会被部署。确切服务自动部署开关尚无直接证据。**下一窗口优先验证原文/实际配置**。 |
| **railway api · Railway Docs** — https://docs.railway.com/cli/api | **已读原文**，当前网页 §§ “Usage / Subcommands / Search the schema / Describe a type or field”，本轮抓取行约 395–518 | 官方给出 `railway api search` 搜索实时 GraphQL 类型与字段、`railway api describe serviceInstance`、`railway api describe ServiceInstance`，并明确需登录/权限；`ServiceInstance` 实际字段仍须先 introspect，不能猜 `drainingSeconds` 名称。 | 用于 #1092 R5-01 现场 Schema 发现与只读取证。不意味着我们已经执行 CLI、取得凭据或读取实际生效值。 |
| **Using Config as Code · Railway Docs** — https://docs.railway.com/config-as-code | **已读原文**，本轮 §§ “Using Config as Code / Understanding config source”，约行 388–429 | `railway.toml` / `railway.json` 可定义构建、部署配置；**代码配置优先于 Dashboard**，实际部署详情页会显示所用配置及来源。 | #1092 R5-01 须对同一准确 deployment 查生效来源，不应拿当前 Dashboard、默认值或历史服务快照代替部署实证。 |
| **NodeJS SIGTERM Handling · Railway Docs** — https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling | **本次补读原文**，§ “NodeJS SIGTERM Handling”，约行 389–408 | 官方指出从 NPM/Yarn/PNPM 启动时包管理器可能成为主进程、阻断 Node handler 的 SIGTERM；建议直接 `node ...` 启动以便 Node 接收信号。 | **新增有价值风险线索：** 本服务实际启动命令是 `npm start`，但不能据此断言真实 PID1 或平台 SIGTERM 已失败。#1092 R5-02 需真实部署的 PID1/PPID/startTicks 与信号交付证据。**未执行对现有在线服务启动命令的变更**。 |
| **Manage Services · Railway API** — https://docs.railway.com/integrations/api/manage-services | **待验证**；本次尝试打开失败（`unsupported content-type: text/markdown`），此前 #1092 原始请求文档已引用 | 目前不能从本窗口重新确认具体 `serviceInstance(serviceId, environmentId)` 示例字段。 | 仅作为 #1092 接续查阅方向，不可据其擅自编造 GraphQL schema 或实际 drain 配置。 |
| **Environments · Railway Docs** — https://docs.railway.com/environments | **仅看搜索摘要**（本交接轮） | 搜索摘要描述 Empty Environment（空白环境）与 Duplicate Environment（复制服务/变量/配置）、独立 staging/PR environment；本轮没有实际创建。 | #1092 R5-03 优先无敏感数据空白隔离环境；不是已获得 Supervisor/cgroup 权限或用户实际批准。 |
| **Deployment Actions · Railway Docs** — https://docs.railway.com/deployments/deployment-actions | **仅看搜索摘要**（本交接轮） | 搜索摘要提及 rollback/redeploy、旧部署回退及新部署的行为。 | 仅为日后变更回滚策略参考；本次没有执行 rollback、redeploy 或测试演练。 |
| **Railway 状态页** — https://status.railway.com/ | **前文曾引用状态搜索，但本交接回合未读原文**，当前状态待验证 | 用户当时报告“Railway 官网正在维护”；这个报告不是官方停服认证。随后铁路插件只读调用已能返回正常结果，不能由此推论网页版所有功能恢复。 | 避免下一窗口直接断言仍在故障或已全面恢复；需要时在明确时间再次核验。 |

**原文 vs 推论的边界：** Railway 官方“包管理器可能拦截 SIGTERM”是*通用平台排障信息*；“本项目实际存在此故障”是**未经证明的假设**，不得把前者当后者。与此同理，GitHub 分支挂接 `main` 不足以证明自动部署被启用或本次合并已上线。

## 3. GitHub 主证据索引（2026-10-22；本轮经插件直接读原始 PR、文件与 Actions 日志）

| 资料／精确位置与 URL | 原始读取级别 | 关键发现 | 对应模块／用途 |
| --- | --- | --- | --- |
| **PR #1104**, https://github.com/jiangxng/EVO-App-Platform/pull/1104 | **已读原文（PR metadata、变更路径、diff、HEAD/merge SHA）** | 从 Draft 转 Ready；原 `DO NOT MERGE` 因明确用户指令仅解除*开发阶段工程入 main*限制；2026-10-22 **MERGED** 于 `3bb68a6...`。19 文件：Host 和 PROCESS runtime、tests、CI 及两份专项文档。 | `manager/server.ts`、`manager/host-shutdown.ts`、`manager/plugin-runtime-host.ts`、PA05 tests 和 .github/workflows。下窗口**不再实现**这些修复。 |
| **精确集成 commit**, https://github.com/jiangxng/EVO-App-Platform/commit/08ab0c14c38891bdfd81f83a0f1df3b9306c2655 | **已读 GitHub Commit checks 和对应 CI 原始日志** | 合并前 46/46 checks green；因事后引入清理 Job，该相同 SHA 后续变为 47 成功、4 跳过，共 51。记录合并门槛以**合并时准确版本**为准。 | 开发阶段 CI 签收，不是 production K0。 |
| **Lightweight Host Job #119747958490**, https://github.com/jiangxng/EVO-App-Platform/actions/runs/39755977486/job/119747958490 | **已读原始运行日志** | Host shutdown/J4J 专项 6 PASS/0 FAIL；`PA05_E01J4J_COOPERATING_HOST` 包含真实 CI 中独立 Node Host 信号、同态锁、异常退出保留锁等布尔标记，但明确 `multiWorkerGlobalStopCertified:false`。 | `tests/agent-line/pa05-host-shutdown-error-path.test.mjs`、`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`。 |
| **Protocol/Core 前序同步 Job #119650320767**, https://github.com/jiangxng/EVO-App-Platform/actions/runs/39726129670/job/119650320767 | **已读原始运行日志，但不是最后 merge HEAD** | 当时测试统计 1214 PASS、0 FAIL、1 SKIPPED；`PA05_K0_BOUNDED_STOP_BARRIER`、`START_DENIED`、`TIMEOUT_REAPED`、`ASYNC_STOP_FENCE` 等成立，全部 `globalStopCertified:false`。不要把前序统计冒充最终 head 的准确测试数。 | `manager/plugin-runtime-host.ts`、`tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs` 等。最终 HEAD 的 Protocol/Core check 成功链接在 [run #39755977522](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39755977522)。 |
| **Branch Hygiene #39756394843**, https://github.com/jiangxng/EVO-App-Platform/actions/runs/39756394843/job/119749355229 | **已读原始日志 + 远端分支列表** | 明确 `DELETED_VERIFIED_MERGED_AGENT_BRANCH`，原 HEAD `08ab0c14...`；最后 PA05 源分支真正消失。与“GitHub PR 已 merged 后分支自动消失”的猜测区别开。 | 彻底消除 PA05 分支积压、防跨窗口重复开发；不删 BEX/CP03 其他分支。 |
| **#1103 / #1105 Cleanup**, https://github.com/jiangxng/EVO-App-Platform/pull/1103 / https://github.com/jiangxng/EVO-App-Platform/pull/1105 | **本窗口历史已检查 GitHub PR + 相应 Run 实际删除回执** | SHA pinned 删除已合并旧文档 refs 和替代工程 refs，包括关闭未合并的 #1074/#1081/#1082；源 PR 负面/正面历史仍在。 | GitHub cleanup workflow 和研究遗产。禁止以“分支已删除”为由否定证据或复建分支。 |
| **#1108 阶段收口**, https://github.com/jiangxng/EVO-App-Platform/pull/1108 | **已读 PR / 已合并专项文档原文** | 工程轮次阶段性归档，正式生产认证不签收；随后“允许开发合并”的 Owner 修订已写回专项文档及交接入口。 | [PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md](PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md)；[HANDOFF.md](HANDOFF.md)。旧段落写 #1104 Draft 属历史状态。 |
| **#1092 Operator 证据 Issue**, https://github.com/jiangxng/EVO-App-Platform/issues/1092 | **已读 Issue 正文与近期 comments** | 仍 OPEN、无 Assignee，R5-01 配置源、R5-02 生产 PID1 信号链、R5-03 可信外部独立 Supervisor/TTL 未签署；严禁推断默认值/生产身份。 | 后续**唯一 PA05 K0 外部认证入口**，与 #913 W06、#979 E01–E05、#988 身份边界联动。 |
| **早期交接与研究遗产 #1071/#1099**, https://github.com/jiangxng/EVO-App-Platform/pull/1071 / https://github.com/jiangxng/EVO-App-Platform/pull/1099 | **历史成果已合入，当前通过 GitHub 原始 PR / main 文档确认关联；本轮未逐篇重新阅读每份旧长研究文档** | 已整理底层 R5/Owner 研究，不得重新做 NIST、PG18、Supervisor 基础文献调查；保留原始文档的章节与来源级别。 | [既有 Window 07 索引](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) 、[Window FINAL 索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)。 |
| **GitHub 最新 main 只读快照**，https://github.com/jiangxng/EVO-App-Platform/commit/59d31034f4ad7fd2715e1ac26395abbba94a31d1 | **已读原始 ref 和 compare metadata** | `3bb68a6...` 是当时 main 的祖先；后续还有 Agent 专项 HANDOFF 与阶段收口文档 commit；其他窗口仍会推进主线。 | 不固定“最新 main”，每次接续重新获取 ref；只在独立分支变更自己新增的资料与交接行。 |

## 4. Railway 真实项目快照（连接插件：只读已观察，2026-10-22）

**来源类型：** 已读连接的 Railway 原始 `describe_service`、`list_deployments`、`environment_status` 结果；不是网页版截图，也不是实际执行生产信号/部署的证据。

- **对象：** project `aee4643e-912b-4ca1-ae95-fe4ec64f5601`；environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`（name `production`）；service `a8622238-480e-4da3-be6f-60fd0f3e18db`（Ledger Configurator）。
- **服务：** state `live`；source repo `jiangxng/EVO-App-Platform`，branch `main`，`checkSuites:false`；builder `RAILPACK`，build `npm ci && npm run build`，start `npm start`，health `/health`，region sfo one replica；`staged:null`（无连接工具报告的待处理修改）。
- **最近部署：** `5cfce97b-9745-4e62-9b64-d2b1e0a2eedf`，`SUCCESS / Online`，截至这次只读观察 active 1、crashed 0、pending 0；其 deployment meta `commitHash=eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`，创建 `2026-10-21T06:41:48.220Z`。
- **与 GitHub 比较：** #1104 merge commit `3bb68a6...` 晚于此部署 commit。**实际读取未见最新 main/#1104 对应的在线部署**。这不能证明自动部署关闭，也不能证明还在排队、出故障或已被人工取消。追查时核对部署列表、Webhook/触发记录和状态更新时间，避免要求用户无授权地手工重启。
- **缺失：** `drainingSeconds/overlapSeconds` 的此部署精确生效值及来源、真实 PID1/PPID/Node 信号接收、独立 Supervisor stop Receipt、签字凭据或平台发布策略开关；都不可从 `SUCCESS/Online` 推论。
- **保全：** 没有本窗口铁路网页/控制台截图，只有连接原始结构化结果可复现。对易变信息保留以上 ID、UTC 时间、meta commit 和观察结果；重访必须重新读取。

## 5. 方案比较：采用/排除、来源事实与判断分离

| 方案 | 事实依据 | 判断／决定 | 适用条件和限制 |
| --- | --- | --- | --- |
| **A. 完全等 #1092 签收后才允许 #1104 合 main** | 早期 Draft 的 `DO NOT MERGE` 和外部认证缺口确实存在；连接服务挂 `main`。 | **本轮排除作为永久工程合并门槛**：用户后来明确批准开发阶段合入，长期 Draft 使版本和聊天上下文分裂，容易重做。 | “不合并”仍可用于真实高风险、无批准的线上破坏性发布；本轮不是生产安全验收通过。 |
| **B. 精确 HEAD 合格 → 合 main → 清过程分支 → #1092 独立认证** | #1104 工程 CI 绿、19 文件边界可核对、独立 Issue 仍在。 | **已采用并实际完成**；保留 GitHub 提交和 Run 证据，后续不会恢复旧分支。 | GitHub 合并≠Railway 已发布，不能开启 material WRITE。 |
| **C. 为了 K0 补签 synthetic 测试或默认值推断** | CI 日志中的 `globalStopCertified:false`，Railway 真实生效配置未知。 | **明确拒绝**：这是拿本地安全属性代替独立生产身份，不合原 Issue 的 Owner 签收要求。 | 可以继续保留合成回归作为工程质量证据；绝不做正式 K0 认证。 |
| **D. 使用 CI SHA-pinned 清理旧分支 vs 广义分支自动批量删除** | [#1103/#1105](https://github.com/jiangxng/EVO-App-Platform/pull/1105) 的精确 SHA/PR/scope 实删收据，最后一支由 Branch Hygiene 验证祖先后删。 | **采用严格条件的归档与删除**；旧 PR 永久可追溯；不碰他人未合并分支。 | 不得泛化为“所有未活跃分支都能删”；要逐支确认 Owner 和证据。 |
| **E. Railway Online 视作 #1104 已发布 / npm start 视作真实 Node SIGTERM** | 只读最新部署 SHA 旧；官方警告包管理器信号传递可能存在问题。 | **均否定**，待部署身份和 PID1 原始实证。 | Online 仅是旧部署的健康快照，npm start 仅是命令，不证明 PID1 进程祖先和信号行为。 |
| **F. 由 Agent 执行 Railway 信号/数据库测试 vs 独立 Owner 隔离回执** | #1092 明确要求 R5-03 独立监督者、权限及 TTL，当前未签。 | **选择 Owner-授权、无真实数据、外部独立核验的路径**；本轮不执行破坏性测试。 | 没有 test 环境、监督者和回收权威前保持 `BLOCKED`。 |

**最重要的决策裁决：** 用户许可合并的是*代码主线*，不是“生产 K0 可信全局停机”和“生产 material WRITE”；研究/实现/合并/发布/认证是五个不同层次。

## 6. 冲突、动态事实和不可重新访问的关键证据

1. **旧材料 vs 新状态：** [HANDOFF.md](HANDOFF.md) 和 [PA05 阶段收口文件](PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md) 中的旧段落称 `#1104 Draft`；它们是合并前的历史快照。文档前部的 2026-10-22 最终状态段、#1104 MERGED metadata 及 Actions 删除日志**优先**；不要大规模改写历史原文造成研究遗产丢失。
2. **“46/46” vs “51（47/4）”：** 前者是合并当时所需 CI 运行集合，后者是同 SHA 事后加上的清理 workflow check runs，包括 4 个 skipped。两者为不同时间范围与工作流集合，不能叠加声称 51/51 正式业务测试全成功。
3. **源码原文 vs Railway 生效部署：** 代码中有 `process.once('SIGTERM', ...)`；Railway 本服务是 `npm start`；官方说明有 NPM 信号转发风险；**仍无该部署实际 PID1/Node 信号证据**。禁止从代码/一般文档认定真实平台安全。
4. **用户说官网维护 vs 连接插件可读：** 用户当时的 UI 体验可成立；后续连接只读 API 可读也成立；但并不能据此证明所有 Railway 系统功能恢复或故障根因。
5. **早期 #1074/#1082 代码 vs 已合并 #1104：** 旧 PR 分支已删，GitHub PR 原始 diff/logs仍可读，单一合并版已整合两者。若需修复新问题，从当前 main 切独立小 PR，不要 checkout 已退役 branch。
6. **没有新的截图/附件：** 本轮没有保存网页截图、Railway 控制台图片或打包附件；可靠遗产以原始 URL、GitHub Commit SHA、Actions Run/Job ID、Issue 评论和结构化只读 Railway 快照为准。对于无法保证长期可访问的日志，已保留关键日志 marker、布尔值和 UTC 时间；若要永久司法级存证，后续由 Owner 授权保存脱敏原始附件。
7. **时间：** 以上记录都为 2026-10-22 的快照，GitHub main、Railway 运行实例及配置会变化；每次接续都要重新读取，不能机械继承 deployment ID 作为“最新”。

## 7. 与项目模块、治理文档、分支及下一步任务逐项映射

| 项目对象 | 已有成果 | 继续动作 |
| --- | --- | --- |
| `manager/server.ts`, `manager/host-shutdown.ts` | #1104 已合 main；停机立刻拒绝请求、依序尝试清理、首个 await 前 5 秒保护、故障非零退出；本地测试正向 | 不重做；#1092 R5-02 实测铁路实例 SIGTERM/PID1，命令 `npm start` 注意实际信号路径 |
| `manager/plugin-runtime-host.ts` | #1104 已合 main；PROCESS stop/barrier、在途 verifier/fork fence、timeout child reaping、generation 保护 | 不重做；#1092 R5-03 独立 Supervisor/全 Worker/Runner/Caller 收据仍缺失 |
| `tests/agent-line/pa05-host-shutdown-error-path.test.mjs`, `tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs`, `tests/fixtures/pa05-k0-*.mjs` | 本地/CI 证据已有；保留 `globalStopCertified:false` | 新功能修复另开最小测试，不把 synthetic 升级为外部签收 |
| `.github/workflows/lightweight-host.yml` | #1104 追加 Host 停机回归，并保留原有治理测试 | 下一次改动仍必须保障所有原 CI，绝不覆盖其他工作线 |
| `docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md`，`docs/agent-line/HANDOFF.md`，`docs/agent-line/PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md` | 认证历史和工程阶段收口已在 main；旧状态通过最新注释更正 | 仅追加指针或证据，保持历史原文；绝不编辑 `project.status.json` |
| [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) | 尚未全面认证且尚未批准 WRITE | 先 Operator R5-01/02 只读取证；然后按审批独立试验 R5-03；逐项 Owner 签字 |
| `docs/agent-line/PA05-K0-WINDOW-20261022-POSTMERGE-HANDOFF-ENTRY.md` + 本文件 | **本轮新增交接包，进入独立 docs PR** | PR CI 后合 main，Branch Hygiene 按规则删除本轮 docs 分支；无旧分支遗留 |
| PA06、PA03、BEX/CP03 | 各工作线独立；避免代码交叉和主线冻结 | PA06 可非生产准备；PA03 Agent 导入要尊重 BEX/CP03 先决条件；K0 风险不能挪作完工证明 |

## 8. 最高价值的后续核验顺序

1. **Railway 发布追溯：** 准确回答为何读到的最近 SUCCESS deployment SHA 为 `eef6774b...` 而 Github main 已有 `3bb68a6...`，检查 GitHub 自动部署实际开关、Webhook 状态、deploy triggers、部署时间，不在没有授权时主动部署。
2. **Railway 真实信号链：** 使用官方 NodeJS SIGTERM Handling 风险提示做诊断依据；从同一 deployment 的只读进程身份、镜像与 PID1 追踪到实际 Node handler。必要的非只读实验由 Operator 另行批准。
3. **铁路 drain 和 overlap：** 根据 CLI `api describe/search` 先确认实时 schema，再回收生效数值、来源、版本、审核者；未暴露则按 UNKNOWN 留档，而不是把默认值填为零。
4. **独立 Supervisor / Worker-Caller Inventory：** 单独确认 OS/process tree、cgroup 独占权限、TTL 清理、DB backend 无活动、Caller/CI 身份；无外部独立回执前 #1092 不签。
5. **生命周期与真实权限：** #913/#979/#988 按各自独立 Owner 验收，保持生产材料 WRITE OFF。
6. **会话防重复：** 新窗口首先读取**本索引 + 简短入口 + 当前 main**。以已合入 PR 和实际日志为主，不从历史“4 Draft”“不许合并”段落推导当前开发任务。

**结论：** PA05 的这一轮工程任务“可复核地结束”，外部认证尾项“可追踪地保留”。没有必要再恢复已删工程分支或延后开始 PA06 的独立非生产工作。
