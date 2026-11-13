> **2026-11-13 最终研究资料/决策交接（换窗口优先）**：[简短入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md) · [详细网络来源与决策索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)。以下 #07/07 原工程交接保留不倒改；新文档自身的合并 SHA/Actions/分支清理以其 GitHub PR Final 评论和实时 main 为准。

# EVO-App-Platform / CV04 Window10 · 自动续跑 #07/07 最终里程碑与交接入口（2026-11-13）

> **历史快照而不是永久最新 HEAD。** 本交接开始时直接读取的受保护 `main` 为 [`3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`](https://github.com/jiangxng/EVO-App-Platform/commit/3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1)，对应 [PR #1310](https://github.com/jiangxng/EVO-App-Platform/pull/1310) 已 MERGED。本文件自己的 Docs PR **尚待创建、验收和合并**；完成后以该 PR 最终评论、重新获取的 `main` 和 Actions 为准，不得将此段预写为其自身的 CI PASS。
>
> **并读**：[本轮研究、原证和决策索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md) · [Window10 恢复上下文增量](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md) · [Window09 上一轮最终交接](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md)。历史 86K 研究及原始 Actions/PR 证据保持不变，不复制或倒改。

## 1. 本窗口已经完成什么

本轮 #01–#06 从受保护 `main` 连续执行了可安全、独立验证的工作；#07 用**一个文档交接 PR**收口，没有自行取得生产 Owner 身份，没有因「继续」自动授权 SAVE/EXPORT，也没有为了完成次数创建重复功能。

| 步骤 | GitHub 原始里程碑 / 合并 SHA | 已交付成果 | 可验证上限 |
| --- | --- | --- | --- |
| #01/07 | [Operator #1092 新证据](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6844353274)；无工程 PR | Railway 旧 5 服务只读状态及仍关联 GitHub Source；定位 `serviceInstanceAutoDeployStatus` 的候选 read-only 查询入口 | `effective autodeploy enabled` **未实查**，旧服务 offline **不等于**已关闭自动发布/可销毁卷 |
| #02/07 | [Owner #1212 源码核验](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6844429680)；无工程 PR | 复查实际 SAVE OFF / EXPORT test-only 代码，列明五类独立具名 Owner 最小签署收据 | #1212 仍 OPEN，勾选问题不是签署；未重新执行东京现场权限测试 |
| #03/07 | [PR #1307](https://github.com/jiangxng/EVO-App-Platform/pull/1307) → [`c2991296ff670fa3a3615e2eec182b9f4c358b57`](https://github.com/jiangxng/EVO-App-Platform/commit/c2991296ff670fa3a3615e2eec182b9f4c358b57) | CV04 Owner 发布门禁 PR/Main 监听路径 13/13 一致；既有无路径过滤 Continuity 中加入路径对称回归 | 仅 CI 防回退，不是生产准入 |
| #04/07 | [PR #1308](https://github.com/jiangxng/EVO-App-Platform/pull/1308) → [`bc17e7c81ca381daf9ffec38fdb8fb973ca2bd47`](https://github.com/jiangxng/EVO-App-Platform/commit/bc17e7c81ca381daf9ffec38fdb8fb973ca2bd47) | CV03 Owner 路径 14/14；增加针对 PA05 Lifecycle 与 AuthorizationProvider 漏检的负例 | 仅触发路径完整性 |
| #05/07 | [PR #1309](https://github.com/jiangxng/EVO-App-Platform/pull/1309) → [`7e46942532cf0e4f0594d727a9ff9d737685ba4c`](https://github.com/jiangxng/EVO-App-Platform/commit/7e46942532cf0e4f0594d727a9ff9d737685ba4c) | 修复两侧**同时漏掉**的传递依赖；CV03 16/16、CV04 24/24；复用真实导出的源码列表及 7/7 回归 | 路径过滤不再只验证左右相等 |
| #06/07 | [PR #1310](https://github.com/jiangxng/EVO-App-Platform/pull/1310) → [`3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`](https://github.com/jiangxng/EVO-App-Platform/commit/3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1) | 源码前置检查拒绝“注释里保留安全语句”的正面伪证据；CV03 7/7、CV04 6/6 对抗测试 | **词法源检查，不是 AST/控制流/物理数据库/独立 Owner 证明** |
| #07/07 | 本交接及配套索引（对应 Docs PR 的终态在 PR 评论记录） | 复核 4 PR、原始 Check Runs、东京部署跳过、Operator/Owner 阻断；提供下一窗口最短入口 | 本文件创建时**不预写其自身的未来合并与验收结果** |

#1307–#1310 四项工程 PR 已逐一直接读取，**均为 MERGED**，最终合并 SHA 如表。原 PR 的 Final 证据分别位于 [#1307](https://github.com/jiangxng/EVO-App-Platform/pull/1307#issuecomment-6844618248)、[#1308](https://github.com/jiangxng/EVO-App-Platform/pull/1308#issuecomment-6844787906)、[#1309](https://github.com/jiangxng/EVO-App-Platform/pull/1309#issuecomment-6844999486)、[#1310](https://github.com/jiangxng/EVO-App-Platform/pull/1310#issuecomment-6845213440)。已恢复旧窗口的 PR #1300–#1306、Railway 十个 Workflow 原件和七 CLI 强制 HOST 修复，全部沿用前述历史交接，不重复开发。

## 2. 真实 CI 状态和东京镜像不能混为一谈

- [#1310 精确 main `3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`](https://github.com/jiangxng/EVO-App-Platform/commit/3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1) 重新查询得到 **6 SUCCESS + 1 预期 SKIPPED**：CV03/CV04 Owner gates、Platform Core、Lightweight Host、Project Continuity、东京 preflight 均成功；东京 deploy 跳过。
- **旧提交的最新查询存在额外取消记录，必须保留**：#1307、#1308 的最新全量 Check Runs 各为 **5 SUCCESS + 1 SKIPPED + 1 CANCELLED**；#1309 为 **6 SUCCESS + 1 SKIPPED + 1 CANCELLED**（取消项均名为额外 `Continuity`）。这些记录是在原 Final 评论之后查询出现；**不可把今日全量查询称为 100% SUCCESS**，亦不能忽略同一提交仍有完成的成功 Continuity。现有 `Project Continuity` 含 `cancel-in-progress: true`；**本次未独立确认每个取消事件的具体触发因果**。
- 每个 PR 自身的**精确 HEAD** 已在合并前验收：#1307 6/6、#1308 6/6、#1309 7/7、#1310 7/7 SUCCESS；原始 HEAD、最终评论和 Actions 保留。
- [#1310 东京 preflight 原始日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43373385491/job/131714147807) 输出 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`，部署 Job **SKIPPED**。本窗口四次 CI/安全门禁修复均未新建 Tokyo 运行镜像。
- 最近一份**已由真实部署 Job 日志证实**的东京镜像仍是 `ghcr.io/jiangxng/evo-app-platform:b58e660fdc01f98e0840247115f7ca3b8c43c0b3`，来源 [Tokyo 真实部署 #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)；**本窗口未 SSH 读取当前容器 digest**，不能当作实时现场保证。现行部署权威入口 [东京部署说明](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)。

## 3. 仍 BLOCKED：两个不可自行签署的外部依赖

**A / Railway 旧资源安全退役：** [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 当前 **OPEN / NOT_SIGNED**。#01 只读取到五服务 offline、无 active deployments/pending work，Ledger Configurator 仍关联 `jiangxng/EVO-App-Platform@main`，EVO Runtime 仍关联 `jiangxng/EVO@main` 且历史迁移 preDeployCommand 仍在；有效 `Autodeploy Enabled`、真实 PID1/Node 信号、drain/overlap、旧消费者、卷/DB 备份恢复、独立 Supervisor **没有 Operator 原证**。**不得**自行解除 GitHub 集成、删卷、删库、复活服务或迁移。

**B / 正式 CV03/CV04 生产授权：** [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 当前 **OPEN、PENDING OWNER SIGNOFF、N1=NOT_CERTIFIED**；[并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 当前 OPEN、[Reviews API](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews) 返回 `[]`。五项 checkbox 是架构问题确认，不等于五位真实审批者。需同一正式 PG ACID T0 的 PA05/AuthorizationProvider 全 Scope+epoch/sourceGeneration+不可变 Outbox、最小权限 DBA 角色、真实 Producer/KMS、两物理 Host、回滚/PITR、Domain Owner，和具名独立审批原始链接/时间/环境。
- CV03 Human SAVE：`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、`N1=NOT_CERTIFIED`、正式 POST 403 / 未注册 GET 404（**本轮只复核源码与先前现场证据，未重新真实发起 HTTP**）。
- CV04 正式后台跨页 `dictionary.collection.export.job.*`：继续 **OFF / 未注册**；当前页 CSV 是**另外**的已交付能力，不能用它代表后台 Job 已认证。
- 不修改 #1184 独立 Owner 管辖的 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`。

## 4. 下一窗口最短执行顺序 / 停机条件

1. 首先读取 **本文件 + [配套证据索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md) + [恢复增量](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md)**；实时查受保护 `main`、最新 check-runs、正在进行的 PR 和东京预检/部署。冻结本文创建时 SHA 为历史起点，不作为未来当前 HEAD。
2. 如果 #1092 有**新**具名 Operator 原证，优先核验实际有效 Autodeploy、GitHub 触发、消费者/数据/备份/恢复、PID1/停止顺序，再判断是否具备安全退役条件。只读调研和控制台开关变更分开授权。
3. 如果 #1212 有**新**真实 Owner 审批，依次验证 PA05/AuthorizationProvider、DB 身份与 T0、KMS、完整作用域及双物理 Host，才另开产品接线 PR；**不得**把绿 CI、PR #1184 合并或 Issue checkbox 当作 SAVE/EXPORT 放行。
4. 若新任务是列表/Agent 产品需求，复用既有 Eidos + Platform + Domain Owner + Host ActionRouter，不发明第二个授权中心。可检查真正新的可复现缺陷，但不得重复 #1307–#1310 的测试/工作流修复。
5. 无新增外部证据或明确缺陷时，**停在阻断点**，让原 Issues 保持 OPEN；不为了自动续跑次数造 PR、发布或操作生产资源。

> **终点声明**：本窗口完成的是 CI Source Gate/多窗口证据治理，不是 Tokyo Runtime 新镜像上线、K0 Operator 退役签署、CV03 N1 正式授权，或 CV04 正式后台 Export 发布。完整阅读粒度、原始 GitHub 来源及风险见 [证据/决策索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md)。
