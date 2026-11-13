# EVO-App-Platform / CV04 Window10 · 2026-11-13 自动续跑 #01/07～#07/07 原证/研究/决策索引

> **短接续入口**：[Window10 最终里程碑](CV04-WINDOW10-20261113-0707-FINAL-HANDOFF-ENTRY.md) · [上下文恢复增量](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md) · [上一轮 Window09 研究决策索引](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)。本文是**新完成工作的 delta**，不会复制旧 Window08/09 长篇原始材料。观察基线：`main@3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`，此索引自己的 Docs PR 合并结果必须在 PR 评论另行验证。

## 1. 本轮来源等级及不允许的推断

| 等级 | 定义 | 本轮实际使用 / 不能推出 |
| --- | --- | --- |
| A / 直接读取源码原文 | GitHub `fetch_file` 实际返回的工作流、测试、检查器、Host 代码，含 Blob/commit SHA | 证实源码对应的表达式和路径，**不**证明远程物理 Host 正在执行该版本 |
| B / 原始结构与执行记录 | GitHub `main` ref、PR 及 merge SHAs、每提交 check-runs、Jobs/原始 log、Issues/Reviews、只读 Railway 控制面返回 | 证实在观察时点的 GitHub 状态和 Job 输出，**不**推断之后仍在线或 Owner 已签署 |
| S / 索引和候选外部资料 | Railway 官方文档检索/Station GraphQL 回答链接；未完成受权 live GraphQL 查询及账号设置页面 | 仅给 Operator 一个查询线索，**不是**本项目的有效 Autodeploy 开关值 |
| U / 尚无独立受权原证 | 真实 Owner 审批、生产同 PG T0/KMS/DBA/两 Host；Railway 停机参数、PID1、旧消费者、卷恢复、有效 Autodeploy | 一律标为 UNKNOWN / NOT_SIGNED / NOT_CERTIFIED |
| D / 工程判断 | 沿用 Eidos+Platform、现有 Continuity、隔离 Issue、禁用未认证 SAVE/EXPORT | 不替代来源事实与正式产品放行 |

## 2. #01、#02 两项没有独立工程 PR 的真实成果

| 来源与访问粒度 | 原始链接 / 时间线 | 结果及局限 |
| --- | --- | --- |
| B · GitHub Issue + Railway read-only · 11-13 | [#1092 评论 6844353274](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6844353274)；Railway 项目 `aee4643e-912b-4ca1-ae95-fe4ec64f5601` / production `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` | 五服务 `offline`，现有 source/GitHub integration 关联未解除；`get_staged_changes` 无 staged patch/pendingWork。没有真实有效开关状态、PID1、备份/恢复或消费者原证 |
| S · web 索引线索 · 11-13 | [Railway Central Station / Public API field for Automatic Deployments](https://station.railway.com/questions/public-api-field-for-automatic-deploymen-f058a664)、[GitHub Autodeploy 官方入口](https://docs.railway.com/deployments/github-autodeploys)、[GraphiQL](https://railway.com/graphiql) | 候选 `serviceInstanceAutoDeployStatus(projectId, environmentId, serviceId)` 返回 `enabled/canEnable/reason`；**当前连接器不提供已授权 GraphQL 调用，尚未验证现场参数/类型或账户 enabled 值**。需要真实 Operator 读取与签署 |
| B + A · GitHub Issue / 精确文件 · 11-13 | [#1212 评论 6844429680](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6844429680)、[Owner PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)、[Reviews API](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews) | 当前 Issue OPEN/待签，PR OPEN/reviews []；直接读取 CV03 admission、Host startup/Action Deny、CV04 Export Owner test-only。列出独立具名审查收据要求，**不**转换为批准 |

## 3. 四项已合并工程 PR 的不可变身份与证据

| 轮次 / 原始 PR | 精确合并 SHA | 实际工程变化（源代码 A） | 原始 final comment / HEAD CI |
| --- | --- | --- | --- |
| #03 [#1307](https://github.com/jiangxng/EVO-App-Platform/pull/1307) | `c2991296ff670fa3a3615e2eec182b9f4c358b57` | `.github/workflows/cv04-next05-owner-source-release-gate.yml` 的 PR/main 13/13；在 `project-continuity.yml` 不过滤路径地运行 `tests/protocol/cv04-owner-release-workflow-paths.test.mjs` | [评论/原始证据](https://github.com/jiangxng/EVO-App-Platform/pull/1307#issuecomment-6844618248)；精确 PR HEAD **6/6 SUCCESS** |
| #04 [#1308](https://github.com/jiangxng/EVO-App-Platform/pull/1308) | `bc17e7c81ca381daf9ffec38fdb8fb973ca2bd47` | `.github/workflows/cv03-n105c09-owner-release-evidence.yml` 的 PR/main 14/14；对 PA05 Lifecycle、AuthorizationProvider 推送路径缺口的负向断言 | [评论/原始证据](https://github.com/jiangxng/EVO-App-Platform/pull/1308#issuecomment-6844787906)；精确 PR HEAD **6/6 SUCCESS** |
| #05 [#1309](https://github.com/jiangxng/EVO-App-Platform/pull/1309) | `7e46942532cf0e4f0594d727a9ff9d737685ba4c` | 真实调用链 CV04 → CV03/N105c09 → CV03/N105a；新增两侧同时漏掉源码的负例；PR/main 路径提升 CV03 16/16、CV04 24/24，复用现有工具导出 source lists | [评论/原始证据](https://github.com/jiangxng/EVO-App-Platform/pull/1309#issuecomment-6844999486)；精确 PR HEAD **7/7 SUCCESS**；新增回归 7/7 |
| #06 [#1310](https://github.com/jiangxng/EVO-App-Platform/pull/1310) | `3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1` | `tools/cv03-n105a-authority-boundary-preflight.mjs` 增加词法注释屏蔽；CV03/CV04 正面安全证据必须来自非注释源码；旧 Host/Catalog 非法注册仍保持保守 raw-text 拒绝 | [评论/原始证据](https://github.com/jiangxng/EVO-App-Platform/pull/1310#issuecomment-6845213440)；精确 PR HEAD **7/7 SUCCESS**；CV03 7/7、CV04 6/6 对抗测试 |

**源码观察位置**：
- [无路径过滤 Project Continuity](../../../.github/workflows/project-continuity.yml) · [路径与传递依赖测试](../../../tests/protocol/cv04-owner-release-workflow-paths.test.mjs)。
- [CV03 Owner Release Gate](../../../tools/cv03-n105c09-owner-evidence-release-gate.mjs) · [N105a preflight 与 `maskJsTsSourceCommentsV010`](../../../tools/cv03-n105a-authority-boundary-preflight.mjs)。
- [CV04 NEXT05 release source gate](../../../tools/cv04-next05-production-authority-release-gate.mjs) · [CV03 对抗测试](../../../tests/agent-line/cv03-n105c09-owner-evidence-release-gate.test.mjs) · [CV04 对抗测试](../../../tests/agent-line/cv04-next05-production-authority-release-gate.test.mjs)。

## 4. 2026-11-13 #07 对已完成 merge SHA 的**当前** Check Runs 重新查询

这些是 GitHub API **重新查询时的全部返回项目**，不与前几轮 final 评论在运行当时的较少项集合混合：

| Merge / 当前重新查询 | SUCCESS | SKIPPED | CANCELLED | 解释 |
| --- | ---: | ---: | ---: | --- |
| [#1307 commit](https://github.com/jiangxng/EVO-App-Platform/commit/c2991296ff670fa3a3615e2eec182b9f4c358b57) | 5 | 1 | 1 | 取消项额外名为 `continuity`；另有一项已成功的 Continuity |
| [#1308 commit](https://github.com/jiangxng/EVO-App-Platform/commit/bc17e7c81ca381daf9ffec38fdb8fb973ca2bd47) | 5 | 1 | 1 | 同上 |
| [#1309 commit](https://github.com/jiangxng/EVO-App-Platform/commit/7e46942532cf0e4f0594d727a9ff9d737685ba4c) | 6 | 1 | 1 | 同上，此外两项独立 Owner gates SUCCESS |
| [#1310 commit](https://github.com/jiangxng/EVO-App-Platform/commit/3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1) | 6 | 1 | 0 | 全部完成；Tokyo preflight SUCCESS、deploy SKIPPED |

`Project Continuity` 使用 `concurrency: cancel-in-progress: true`，与上述取消现象相容，但本窗口**没有每次取消操作的独立触发因果日志**，不标为已证明原因；不可因一个 CANCELLED 忽略其他真实成功的 check-run，也不可称所有当前项均 SUCCESS。若未来 Tokyo runtime PR 的 release preflight 读取到取消检查，需要重新阅读其真实 `EVO_TOKYO_MAIN_CI_FAILED` 检查逻辑与触发时序，不能基于历史 docs-only SKIP 推出未来部署必成功。

**本轮东京确证来源**：[东京 #1307 主线](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43368973317)、[#1308](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43370198550)、[#1309](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43371738697)、[#1310](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43373385491) 都有 preflight SUCCESS / deploy SKIPPED 的相应 Job。#1310 原始 preflight `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=3f9f165e8908438a0bb5f0c47fa9d6b05c9d10b1`。最新本窗口不含物理 SSH/容器 digest 测量；最后真正已部署镜像见 [Job #131655719480](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)。

## 5. 本窗口采用/拒绝方案与真实下一步

| 项目 | 方案与理由（D） | 对方必须提交的未知证据（U） |
| --- | --- | --- |
| 长期列表、Eidos、Agent | 沿用现有 Eidos + Platform、Domain Owner、Host ActionRouter、Personal Agent 同源授权；当前页 CSV 与正式异步后台 Export 明确分离 | Domain 真实批准及以后正式 Action 行为回归，不能引用已有隔离 PG 作为已上线 |
| SAVE/EXPORT 真实权威 | 先同一正式 PostgreSQL ACID T0/immutable Outbox/authorityEpoch/sourceGeneration/全 Scope DENY，后真实业务最小接线；默认 fail-closed | [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 独立具名 APPROVED + 环境、职责、SHA/Source、DBA/非超级权限、Signer/KMS、故障/双 Host、回滚/PITR |
| 旧 Railway | 保留 10 YAML 只读归档、7 CLI 显式 HOST，不能凭 offline 或 Source attached 猜 Autodeploy；Operator 签署前不做数据清理/断 Source | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 有效 Autodeploy / deploy trigger / drain+overlap+PID1、数据消费者与备份/恢复/rollback 原证 |
| CI 治理 | 在既有 Continuity 里复用路径+传递源码覆盖与注释伪证据负例，不造第二套门禁、不要无止境找微观测试 | 只有新的**可重现独立缺口**或新增真实 Owner/Operator 证据，才继续工程变更 |
| 无法认证的事 | 不执行正式 DDL/DML、生产身份/KMS、迁移、Railway 重启或卷删除；不替 #1184 Owner 修改文件或自行审核 | 真实负责人的显式授权 + 独立批准；没有便停止自动续跑 |

**证据记录要素**：每份独立 Owner/Operator 收据至少具名 reviewer/role、UTC 观测时间、目标 project/environment/service / PostgreSQL 主库或 Host identity、关联 commit SHA、原证 URL、有效作用域与回滚 Owner；不在公开 Issue 放凭证、Business SQL 或私密主数据。

本索引是 **#07 提交前的完成事实与未签约状态**；要验证本文件所处 Docs PR 的真实结果，查看其独立 Final 评论与即时 main/Actions。旧索引层级与原始记录不删不重写。
