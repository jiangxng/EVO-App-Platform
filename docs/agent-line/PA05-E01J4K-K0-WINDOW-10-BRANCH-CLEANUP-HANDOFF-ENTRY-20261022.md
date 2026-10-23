# PA05 / E01J4J–E01J4K / K0 — WINDOW-10 分支清理与证据归档：简短交接入口

**记录日：2026-10-22（GitHub 在线核验）；性质：事实/研究交接，不是生产 K0 签收。**
**下钻资料：** [WINDOW-10 详细参考索引与决策记录](PA05-E01J4K-K0-WINDOW-10-BRANCH-CLEANUP-RESEARCH-REFERENCE-INDEX-20261022.md)。
**遗产：** [WINDOW-09 生产和分支审计](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-09-LIVE-STATE-BRANCH-AUDIT-20261021.md)（位于 [#1071 Draft 分支](https://github.com/jiangxng/EVO-App-Platform/pull/1071)，尚未合并） / [WINDOW-08 短入口](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-08-CONTINUATION-HANDOFF-ENTRY-20261021.md) / [WINDOW-08 原始研究来源索引](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)（后两篇亦在 #1071 分支）。不重查已经归档的 PostgreSQL18 / OAuth / Linux / Kubernetes Lease / Railway 通识。

## 1. 先看结论：66/66 目标远端分支已消失，不能冒领删除动作

- 原窗口 GitHub 清理审计：2026-10-21 有 **89** 条远端分支、**16** 个开放 PR；创建清理 PR 前后短时达 **90** 条。对精确 PR HEAD 和主线祖先逐条核验：**68** 条精确匹配已合并 PR，其中 **66** 条满足完整删除条件，**2** 条因不属于 main 祖先而保留。另有全部开放 PR 以及未证归属/未合并 BEX 分支保留。
- **清理实施凭据：** [PR #1096](https://github.com/jiangxng/EVO-App-Platform/pull/1096) 已于 **2026-10-21T06:32:39Z** 合并，merge commit `5159c863945879771541e580c40f0eb2e408519d`；其修改仅为 [repository-hygiene/retired-branches.json](../../repository-hygiene/retired-branches.json)，新增 **66** 条姓名+精确 SHA 的退休记录（原 30 → 96；其中 78 有 SHA），不代表 PR merge 自身删除了分支。
- **2026-10-22 GitHub 远端核验：** 当前 main 清单中的 66 条目标 ref **全部不存在**（66/66 absent），既有 30 条历史退休 ref 也全部不存在，16 个开放 PR 的 **17** 个 main/head/base 预留引用均应持续保护。先读到 **26** 条远端分支，随后本交接建立独立文档分支，读到 **27** 条；数量变化不能直接代替逐条删除证据。
- **重要负证据：** [一次性审计 Run #39558345948](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948) / [job #119083359962](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948/job/119083359962) 原始日志 `RETIREMENT_RESULT`：`execute=false, eligible=0, deleted=0, skipped=66`，其中 **65 条 ABSENT、1 条 PR_PROOF_CHANGED**（`test/bex01-v3-stale-review-source-identity-20261019`）。其成功仅证明执行时未删除且已无法按核验条件删除，**并非这次 Run 删除了 66 条**；实际删除执行者/独立 DELETE 收据仍待确认。PR #1096 [评论 #6310071905](https://github.com/jiangxng/EVO-App-Platform/pull/1096#issuecomment-6310071905) 简写“66 ABSENT”，需以原始 job 的 65+1 为准。
- 新旧 main：核验期间先为 `main@eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`（包含 [#1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097)），**在独立文档分支创建后**又读到 `main@ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95`（并行窗口推进）；最新状态每次重新读取，不将历史 SHA 当作实时主线。

## 2. 用户明确要求、已确认选择

用户反复要求“**通过聊天窗口直接清理 GitHub 分支**”，并说明过去窗口完成过 100 多条；不要无谓要求再次授权、不要把当前能力缺口错误归因于 OpenAI 政策改变。GitHub 插件本次确已连接，读取到权限 **Allow all actions**，但本次公开可调用 GitHub 工具列表没有 `delete_ref`、`workflow_dispatch`。**授权级别≠工具调用能力**；过去批量删除方法尚未逐次追溯。现有仓库包含大量历史 `ref-retirement` GitHub Actions 工作流，属于可继续追索的执行机制线索，而不是旧窗口具体实现的证明。

采用基于 PR 精确 SHA / no active PR / main ancestor / 执行前再次取 HEAD 的 **fail-closed** 退休规则；禁止 `update_ref` 假扮删除、直接批量删除所有曾显示 merged 的分支。独立文档分支仅做记录，不改 `main`、不推送生产、不修改业务、铁路/Railway、全局权威文件或其他 Owner 工作；已有 #1096 合并事实单独记录，不由本交接再次合并。

## 3. 不要误删的剩余分支

- 当前共有 **16 个 OPEN PR，17 个活跃主线/head/base 预留 ref**；其中 PA05 的 [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) / [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) / [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) / [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 继续 OPEN Draft，**均不可合并、删除或解释为 K0 签收**。#1081 为旧缺陷的负例证明，CI 绿色不等于可合并。
- 明确排除的两条 `docs/fast-feedback-pivot-workflow-20261021`（#1089，当时 compare `behind_by=2`）、`feat/bex01-resume-pending-import-20261015`（#921，`behind_by=5`）仍存在。其余非活动 PR ref 应逐 Owner 复核，不能“分支少了就全删”。
- #1096 已合并但清理自身分支 `chore/verified-merged-ref-retirement-20261021` 仍存在，而且已被另一个操作新增一次性审计工作流（截至记录时 HEAD `52e23806fbcd126e2901bf8ab5aa841841d60c59`，与 PR 合并前 `bd8ecc...` 不同）：**不要按旧 SHA 直接删它**。

## 4. PA05 K0 工作线保持原安全门禁

K0、完整 E01J4、PA05-05 E01–E05、W06 **NOT_SIGNED**；production material WRITE **OFF**；[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 2026-10-22 复核均 OPEN。真实生产 Operator 有效 draining/overlap、PID1→Node SIGTERM、独立 Supervisor/TTL/cgroup、所有 Worker/Runner/Caller、PG backend 消失、Human IdP/DBA/Secrets/Audit 权威签收均不可由分支清理替代。生产 Railway **本窗口未重新查询**：2026-10-21 [WINDOW-09](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-09-LIVE-STATE-BRANCH-AUDIT-20261021.md) 的部署 ID 仅为历史快照，绝不冒充今天已验证。

## 5. 下一窗口依次做什么

1. 先读本入口和对应详细索引，再看 [#1096 的最终评论](https://github.com/jiangxng/EVO-App-Platform/pull/1096#issuecomment-6310071905)、[一次性 Job 原始日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948/job/119083359962)、[主线 SHA 钉住的退休名单](https://github.com/jiangxng/EVO-App-Platform/blob/5159c863945879771541e580c40f0eb2e408519d/repository-hygiene/retired-branches.json)。**禁止对 66 条已消失分支重复执行删除**。
2. 如用户仍需要“删除动作是谁完成”的证据，查 GitHub Actions 的真正 `execute=true` 日志或合法 GitHub Audit Log 的 ref delete 事件，并标记证据可见范围；不能从 `execute=false` 推断执行者。不能拿不到日志就臆测 OpenAI 政策。
3. 对剩余 9 条非保留 ref 做 Owner 分组，而不是直接删；尤其保护 BEX 未合并和刚更新的 #1096 清理分支；任何新一轮候选必须重新取最新 refs/开放 PR/merged SHA/祖先证明。
4. 若接续 PA05 K0，则依原 #1092 Operator 门禁补 R5-01/02/03 与联合 shutdown / 真实后端会话等证据；不要让本次分支卫生工作假装完成 PA05 签收。
5. 此文档工作线只建 **独立 docs branch + Draft PR**，不更改 `docs/agent-line/HANDOFF.md` / `project.status.json` / `docs/roadmap/HANDOFF-LATEST.md`，也不合并本交接 PR。

**来源阅读等级、原始 URL、精确状态、方案对比、冲突、逐项核验方法和先前继承素材见详细索引。**

## 6. WINDOW-11 接续时间片（2026-10-22；完整证据见本交接详细索引第 7 节）

直接复核当前 `main@ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95`；远端 **28 branches / 18 OPEN PR / 19 distinct reserved refs / 9 nonreserved refs**，[#1099](https://github.com/jiangxng/EVO-App-Platform/pull/1099) 与 [#1100](https://github.com/jiangxng/EVO-App-Platform/pull/1100) 均 Draft。主线 `retired-branches.json` 96 项中后添 **66/66** 仍 ABSENT（78 项带 SHA pin），**不重删**。PA05 四 Draft、#1092 OPEN、K0 等 NOT_SIGNED / production material WRITE OFF 均未改变。

新增原始日志负证据：[#1096 后 Branch Hygiene run #39556063751](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39556063751)、[#1097 后 run #39557023257](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39557023257) 均有 job SUCCESS，但原始日志明确 `SKIP_NOT_APPLICABLE`；[一次性审计 #39558345948](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948) 仍是 `execute=false,deleted=0,65 ABSENT+1 PR_PROOF_CHANGED`。已检索 GitHub Actions 近期 1,400 条 run 和 workflow_dispatch 记录，**未取得真实 DELETE 执行者的独立原始收据**，不能推定 CLI/人员/权限政策。继续沿用已有工作流，不创建新的清理器；剩余 9 条不因空闲就删。此次仅更新本 Draft #1099 下的交接记录，不改 main、生产或全局权威文件。

## 7. WINDOW-11 M09–M11 收口（2026-10-22，明细见研究索引第 8 节）

最新直接核验主线 **`main@2811789dd7df7e5deb90ac8c772811b82d71820f`**（[#1101](https://github.com/jiangxng/EVO-App-Platform/pull/1101) merge），远端 **28** 分支 / **18** OPEN PR / **19** distinct reserved refs；新增退休清单 **66/66 ABSENT**，不再删除。其余 **9** 条非活动 PR 预留分支全部按 current SHA、精确关联 PR、main 祖先完成审计：**7 条非祖先**；**2 条祖先**中，BEX `feat/bex01-v3-eidos-live-field-review-status-20261016` 没有精确 merged PR proof，治理 `fix/governance-oidc-transaction-budget-20261022` 对应刚合并 #1101，跨 Owner 仍 HOLD。**合格且经本线授权可删除 0 条**，故 M10 不触发广域 prune、不造新工具、不碰其它窗口。

新增原始负证据：[Branch Hygiene Run #39711586400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39711586400) / job #119603927782 在 #1101 merged 后虽 SUCCESS，真实日志为 `SKIP_NOT_APPLICABLE`，不证明实际 DELETE。此次 `M09 9/9 COMPLETE / M10 NO_ELIGIBLE_DELETE / M11 REFS_RECHECK_COMPLETE`；[#1099](https://github.com/jiangxng/EVO-App-Platform/pull/1099) 仍保持 Draft，原始 66 次删除执行者仍 UNVERIFIED。PA05 四条 Draft、K0 NOT_SIGNED、production material WRITE OFF 均不变。
