# PA05 / E01J4J–E01J4K / K0 — WINDOW-10 分支清理研究资料与决策参考索引

**日期：2026-10-22；SOURCE_GRADED / OBSERVATION_ONLY / NOT_K0_SIGNOFF。**
**简短入口：** [WINDOW-10 HANDOFF ENTRY](PA05-E01J4K-K0-WINDOW-10-BRANCH-CLEANUP-HANDOFF-ENTRY-20261022.md)。
**范围：** 本聊天窗口 2026-10-21 的 GitHub 分支清理、GitHub 插件能力追查、2026-10-22 的远端最终核验。PA05/K0 的长期研究资料只继承 [WINDOW-08 原文归档](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) 和 [WINDOW-09 运行审计](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-09-LIVE-STATE-BRANCH-AUDIT-20261021.md)，**未在 WINDOW-10 重新阅读其外部 PG18/OAuth/Linux/Kubernetes/Railway 所有原文**。

## 1. 本轮目标、命令与不可变原则

用户明确多次命令：**清理 GitHub 中已完成的分支并实际执行删除**；用户确认 GitHub 插件已安装、以往 ChatGPT 聊天窗口曾清理 **100 多条分支**；不接受仅因有插件却反复转回手动操作，也不应无证据推断是 OpenAI 改了权限政策。用户后续“继续 #01 / #02”，最后要求换窗口时制作**短入口+详细研究来源索引**，保存 GitHub，保留确切 SHA 与未决问题，不覆盖并行窗口。

项目分支治理：只把 **已合并 PR 的确切 HEAD SHA / 没有开放 PR 作 head 或 base / HEAD 为 main 的祖先 / 当前 ref HEAD 未变 / 按工作流规则不受保护** 的 ref 列入候选；无关 Owner 需要单独审计。**绝不修改** PA05 四条 Draft、BEX/CP03/Eidos/2D、`project.status.json`、`docs/roadmap/HANDOFF-LATEST.md`、Railway deployment 或 production secrets/SQL。独立 docs 分支和 Draft PR，**不得把文档 PR 自动并入 main**。

证据标记：
- **DIRECT_GITHUB_ORIGINAL**：本窗口通过已连接 GitHub 工具读取 API 正文、文件全文、PR/Issue 原始元数据或 GitHub Actions 原始 job log；时间片均明确标注。
- **DIRECT_CONNECTOR_METADATA**：本窗口查看实际已连接插件权限、工具说明和插件搜索目录返回；不是 GitHub 公共网页，也无固定外部页面原始 URL。
- **PRIOR_INDEX_ONLY**：此前窗口已经归档的来源，本窗口仅阅读其索引/交接文件；不能称本窗口重新读过第三方原文。
- **SEARCH_SNIPPET_ONLY**：本轮没有新增仅凭公开搜索摘要认定的第三方结论。
- **UNVERIFIED / INFERENCE**：没有原始执行收据或没有权限直接核验，不可写成已知事实。本文“采用/排除”属于项目决策，而不是 GitHub 官方来源的观点。

## 2. 本窗口实际访问的在线原始资料索引（都为 2026-10-21 或 2026-10-22）

| 编号 | 标题 / 原始地址 | 查阅日、阅读等级 | 真实发现与对项目用途 |
| --- | --- | --- | --- |
| G-01 | GitHub 仓库 main ref： https://api.github.com/repos/jiangxng/EVO-App-Platform/git/ref/heads/main | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，完整当前 JSON | 10-21 清理计划基准 `main@9a382666ffad515d55422d0ffdb9f4cb7dd64aef`；10-22 先读到 `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`，本交接分支创建后又读到 `ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95`。动态变化：只可用新的时间片核验，不可把 10-21 值冒充当前值。 |
| G-02 | 远端分支列表： https://api.github.com/repos/jiangxng/EVO-App-Platform/branches?per_page=100&page=1 | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，完整 JSON | 10-21 先 89、清理 PR 创建后 90；10-22 清理后 26，本交接新 branch 出现后 27。计数不是删除归因，必须逐条比对退休清单名称。 |
| G-03 | 开放 PR 列表： https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=open&per_page=100&page=1 | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，完整 JSON | 16 个 OPEN PR；main + 所有 head/base 合并为 17 个预留引用。直接保护 PA05 4 Draft、BEX 交叉基线。 |
| G-04 | 已关闭 PR 原始 JSON，前三页： https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=closed&per_page=100&page=1 ，[page=2](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=closed&per_page=100&page=2) ，[page=3](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=closed&per_page=100&page=3) | 10-21，DIRECT_GITHUB_ORIGINAL，正文元数据（仅最近三页，**非整个 PR 历史**） | 为旧 branch HEAD 与 `merged_at` / PR head SHA 匹配提供依据；仅 merged ≠ 可以删除，且不代表其它较旧未列出的 PR 不存在。 |
| G-05 | 单条 commit ancestry 比较：GitHub 已连接 `compare_commits(repo_full_name, base=branch HEAD, head=main)` 操作返回；**本轮无工具返回的规范浏览器 URL，故不伪造“实际访问”的网页地址** | 10-21，DIRECT_GITHUB_ORIGINAL（原始 compare 结构化结果） | 对 68 个合并 PR HEAD 候选逐条独立比对：66 条 `behind_by=0` 且 `merge_base_commit.sha=branch SHA`，2 条祖先校验不通过。后续必须复核 current main/HEAD，不能沿用旧 compare。 |
| G-06 | 清理 [PR #1096](https://github.com/jiangxng/EVO-App-Platform/pull/1096) / [原始 REST PR](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1096) | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，PR 元数据、变化文件、检查状态 | 10-21 创建 `chore/verified-merged-ref-retirement-20261021`；唯一修改退休 JSON；提交 `bd8ecc9eb2d87b230956fb887834e02caef37abc`；4/4 当时的 CI 成功。后于 **2026-10-21T06:32:39Z** MERGED，merge commit **`5159c863945879771541e580c40f0eb2e408519d`**。已合并不证明是它执行删除。 |
| G-07 | [合并时的精确退休清单](https://github.com/jiangxng/EVO-App-Platform/blob/5159c863945879771541e580c40f0eb2e408519d/repository-hygiene/retired-branches.json) / [当前路径](https://github.com/jiangxng/EVO-App-Platform/blob/main/repository-hygiene/retired-branches.json) | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，JSON 全文/结构 | `retiredBranches` 从 30 → 96，先前 12 带 SHA，本轮 66 带 SHA，现共 **78 条 SHA pinned**；后 66 条 `reason` 以 `Verified merged PR #` 开头，含精确 40 字符 SHA 和首次验证 main SHA。此文件是**66 条完整清单的永久可复用原件**，不要从聊天摘要重新拼装。 |
| G-08 | [主线 Branch Hygiene 工作流](https://github.com/jiangxng/EVO-App-Platform/blob/eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff/.github/workflows/branch-hygiene.yml) | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，全文约 198 行 | `safe-retired-branch-audit` 仅在 `workflow_dispatch` 运行，`execute` 默认 false；用精确 SHA、active PR 保留、restricted pattern、`compareCommits` 检查、删除前 re-read ref；`retire-merged-agent-pr` 属另一狭义安全路由。**不要**把 CI job 跳过解读为删除动作。 |
| G-09 | [一次性核验工作流原文](https://github.com/jiangxng/EVO-App-Platform/blob/52e23806fbcd126e2901bf8ab5aa841841d60c59/.github/workflows/verified-merged-ref-retirement-20261021.yml) | 10-22，DIRECT_GITHUB_ORIGINAL，全文 | 它位于 **#1096 已合并之后仍存在的清理工作分支**，不是 main；`const EXECUTE = false`，仅由该分支工作流文件 push 触发。文本中虽写有受控 `deleteRef` 路径，因 EXECUTE=false **不会执行删除**。安全设计：66 pinned、PR proof、active PR、HEAD/ancestry、限定目标仓库、非并行执行。 |
| G-10 | [一次性 Run #39558345948](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948) / [job #119083359962 与原始日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948/job/119083359962) | 10-22，DIRECT_GITHUB_ORIGINAL + **DIRECT_CI_RAW_LOG**（全文 113 行，RETIREMENT_RESULT 原始 marker） | 2026-10-21 06:54:15–06:54:53Z、push、SUCCESS。实际 `RETIREMENT_RESULT={execute:false, eligible:0, deleted:0, skipped:66}`，跳过详情 **65 `ABSENT` + 1 `PR_PROOF_CHANGED`**；异常 branch 为 `test/bex01-v3-stale-review-source-identity-20261019`。因此不提供删除者收据；独立 live branches 复核仍为 66/66 absent。 |
| G-11 | [#1096 post-merge 核验评论 #6310071905](https://github.com/jiangxng/EVO-App-Platform/pull/1096#issuecomment-6310071905) | 10-22，DIRECT_GITHUB_ORIGINAL，评论全文 | 评论记录 PR merge、曾观测的 25 branches、16 OPEN PR 与 17 reserved、66 targets absent、一次性审计 execute=false。**来源间差异：**评论写“skipped=66 ABSENT”，原始 job 实际为 65 ABSENT+1 PR_PROOF_CHANGED；以原始日志最精确，评论其余独立观测可保留。 |
| G-12 | [PR #1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097) | 10-22，DIRECT_GITHUB_ORIGINAL，REST PR 原始元数据 | 于 2026-10-21T06:41:46Z merged，merge SHA `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`；与 #1096 是不同工作线。main 再次推进到 ee9...，尚未对本交接重读其具体内容，**不要声称了解其业务影响**。 |
| G-13 | PA05 [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)、[#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | 10-21、10-22，DIRECT_GITHUB_ORIGINAL，状态与 HEAD；旧 CI 详见 WINDOW-09（非本轮重读所有日志） | 四个均 OPEN Draft、unmerged。`#1071@77275a1751160b9638191e22e83a40237fe25586`、`#1074@e2e4af922c87b985f9834b592b86556d0e28abac`、`#1081@a1e8a0941ff5b796816aaea0904b89533191a239`、`#1082@eb4743e8ed34cf3cd748c3f79781d092c62712f4`。#1081 绿色 CI 为缺陷负例，不能合并。 |
| G-14 | K0 Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[READ 授权 #988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[Human E2E #979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[生命周期 #913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | 10-22，DIRECT_GITHUB_ORIGINAL，读取各 Issue 原始状态与标题，非全部长评论本轮重读 | 四 Issue 均 OPEN，均无被指派人（最新可见快照）；因此分支清理不能提升 K0 门禁，也不能宣称生产 material WRITE 已放开。 |
| G-15 | [上一窗口 WINDOW-09 直接审计](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-09-LIVE-STATE-BRANCH-AUDIT-20261021.md)、[WINDOW-08 短入口](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-08-CONTINUATION-HANDOFF-ENTRY-20261021.md)、[WINDOW-08 研究原始索引](https://github.com/jiangxng/EVO-App-Platform/blob/77275a1751160b9638191e22e83a40237fe25586/docs/agent-line/PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) | 10-22，**PRIOR_INDEX_ONLY**（直接读交接文档本身；所列外部原文不重读） | 继承真实生产部署时间片、真实 Operator R5 门禁、历史 Google/OAuth/PG18/Railway 等研究路径。注意这三份位于 OPEN Draft #1071 的 HEAD **77275a...**，不是已合并 main；只能用精确分支/SHA permalink，不得用 main 的相对链接误导。 |
| G-16 | [远端工作流目录（清理分支）](https://github.com/jiangxng/EVO-App-Platform/tree/52e23806fbcd126e2901bf8ab5aa841841d60c59/.github/workflows) | 10-22，DIRECT_GITHUB_ORIGINAL **仅目录文件名列表**；多数工作流未逐篇读 | 发现大量历史 `*retirement*.yml`、`prune-merged-inactive-branches.yml` 和当次一次性工作流，作为“旧窗口为什么能完成 100+ ref 清理”的潜在技术线索，**不能据目录名单断言旧窗口的具体 executor、权限策略或实际 delete log**。 |

### 2.1 插件本身的可用性与来源等级

本窗口通过 ChatGPT Plugin Management **直接读取** GitHub 的设置：app-specific `Allow all actions`，全局默认 `Allow low-risk actions`；搜索插件目录返回已安装/启用的 GitHub，描述有“hybrid GitHub connector and CLI workflow”。这仅证明授权配置和安装状态，**不证明当前会话含可调用 CLI / 删除工具**。实际列举本会话的 GitHub connector 调用名，发现可读取 refs/PR/CI、创建分支、更新文件、建/合 PR；**无** `delete_ref`、`workflow_dispatch`。该管理数据没有回传可永久定位的公开原始 URL：证据为 **DIRECT_CONNECTOR_METADATA / NO_PUBLIC_URL**，不虚构一个。尚未查到 OpenAI 官方权限政策变更公告，故“老板改了权限”是**待验证的推测**，不是结论。

### 2.2 继承的外部网络研究，而非本轮再次检索

PG18 真实 Session / backend 消失、Railway 有效 draining/overlap、Linux PID1/Node SIGTERM、Supervisor/cgroup、Kubernetes Lease、OAuth/IdP/凭据轮换/NIST 等第三方资料都已按“原始网址/查阅日期/原文或摘要”分级存放于 **WINDOW-08 / WINDOW-07 索引**；本 WINDOW-10 的工程决策没有重新打开那些第三方官方原文，也未新抓取截图。**阅读等级：PRIOR_INDEX_ONLY / 不再加新的“已读原文”标记**。原文位置详见 G-15，不重做旧通识研究。

## 3. 数字复盘：证据链及快照为何会不一致

| 时间/阶段 | 直接来源事实 | 谨慎解读 |
| --- | --- | --- |
| 2026-10-21 清理前 | `main@9a382666...`，89 → 90 远端 ref，16 open PR；68 exact merged-head matches | 只有头相同≠提交被 main 吸收；逐条 compare。 |
| 祖先与所有权检查 | 66 pass、2 fail：`docs/fast-feedback-pivot-workflow-20261021` (#1089, 2 unique)；`feat/bex01-resume-pending-import-20261015` (#921, 5 unique) | 两条必须保留；其它 BEX 未归属/closed unmerged 的工作不能抢删。 |
| #1096 创建 | branch `chore/verified-merged-ref-retirement-20261021`，`bd8ecc9...`；唯一改 `repository-hygiene/retired-branches.json`；当时 4/4 CI success | 修改的是授权/退休元数据，不是逐条 git ref 删除动作。 |
| #1096 merged | 2026-10-21 06:32:39 UTC，`5159c863...`；主线退休 JSON 96 条 | 不证明合并本身或 `retire-merged-agent-pr` 删除了 66。 |
| 一次性审计 06:54 UTC | Run 39558345948 / job 119083359962：`execute:false; eligible:0; deleted:0; skipped:66`，**65 ABSENT、1 PR_PROOF_CHANGED** | 这一次动作删除了 **0** 条，已消失的 66 个 ref 的具体操作者未知。不能拿“SUCCESS”直接等于删除成功。 |
| #1096 评论 06:59 UTC | 该评论另一次核实 66/66 目标 ref absent，远端当时 **25** 条 | 与 06:54 job 对具体 skip reason 略有简写冲突；评论是交叉快照，不是删除日志。 |
| 2026-10-22 本窗口 | 在当前 main 96 项 manifest 与远端 refs 名称交叉核验：66/66 后加项 absent，30/30 历史项 absent，**26** 条远端分支、16 个开放 PR。 | 已能把清理**结果**确认，但不能归属**执行者**。 |
| 创建本交接 branch 后 | 远端**27** 条，其中新的独立 docs branch 1 条；此时 `main` 由 `eef6774...` 继续推进到 `ee9cc39...` | 远端数与 main 会被并行工作线推进；不能冻结为永久不变的“现在”。 |

## 4. 退休机制的安全门禁与决策比较

| 方案 | 核实的事实 | 本线决策 / 理由 / 条件 |
| --- | --- | --- |
| **A. 精确 SHA-pinned manifest + Branch Hygiene** | G-07/G-08 全文含 `execute` 默认 false、开放 PR head+base 保护、拒绝漂移、祖先证据、执行前再次取 ref | **采用的仓库长期机制**。具备可审计、失败关闭、可复查理由；只有显式执行者能在生产仓库授权环境触发且日志保全时，才可把 `execute=true` 视为删除执行证据。 |
| **B. PR #1096 合并退休清单** | G-06/G-07 已确认合并且 66 SHA 存 main | **已完成“清理授权资料归档”**；仅提交 JSON，并不等同删除。这里合并已由外部动作发生，本 WINDOW-10 不应重合并。 |
| **C. 一次性 push 审计** | G-09/G-10 原文 `EXECUTE=false`；成功日志 deleted=0 | **可用来核验负证据/先前缺席，不可冒充删除者**。即使文件包含永不执行的 `deleteRef` 代码路径，也不改变本次运行结果。 |
| **D. 使用 GitHub connector 的 `update_ref` 假装删除** | 当前工具可移动分支指针，而没有真正 delete-ref 动作 | **排除**：移动 HEAD 不会删除 ref，且造成数据损伤/误导。 |
| **E. 只要 PR merged 就全清** | 两个合并 PR 的原分支仍有未吸收提交 (`behind_by` 2 与 5)；另有 BEX closed-unmerged 和无已定位 PR branches | **排除**：违反 main 祖先、Owner 责任和未决修改保留。 |
| **F. 让并行主线自动执行清理或改生产部署** | main 的任何变动可能触发其他系统部署，且用户明确分窗隔离 | **排除**：避免借清理任务修改生产和全局权威状态。 |
| **G. 对剩余 9 条非活动 PR 预留 ref 立刻重删** | 当前剩余非保留候选包含 #1096 自身已变化的 branch、两条 divergence、BEX 未合并和未证归属、另一条刚合并文档、并行治理分支 | **排除自动执行**；先让对应 Owner 做新的精确 HEAD/PR/ancestor 核验。 |

### 4.1 本窗口审计时可特别识别的 9 条 PA05 历史分支

以下 9 条曾是本线强相关、已合并且逐条 ancestor 证实的精确候选；**2026-10-22 已全部不在远端**。以下完整 pin 同时存在 G-07，不要复刻删除：

| 原 PR | 已消失分支 | 原精确 HEAD |
| --- | --- | --- |
| #974 | `docs/pa05-d14c5-d14c12-research-decision-handoff-20261016` | `a5fc71ab12d4854875df51ca42223a66e4bdb24f` |
| #1050 | `docs/pa05-e01j2-j4f-window-research-handoff-20261019` | `a4d258e2927dc57fde96e415233ffd187d0ebde6` |
| #1052 | `docs/pa05-e01j4g-production-operator-trust-gate-20261019` | `82f65991aba943dd3319a96790a0284745d1bef7` |
| #1059 | `docs/pa05-e01j4j-final-evidence-20261020` | `5bf4c9c6ce59076dcbb91b9dd776b4d4a409b0f7` |
| #1065 | `docs/pa05-e01j4k-k0-postmerge-evidence-20261020` | `fe27267af40d14e393e6a6df2965cd3f043fb9c4` |
| #1064 | `docs/pa05-e01j4k-k0-topology-evidence-20261020` | `6bcb960b87855a5b91be4d00388a15052c59249c` |
| #1068 | `docs/pa05-e01j4k-postmerge-evidence-20261020` | `8fee1e9b4638df44451dcecbdf4752959cbfea7b` |
| #1062 | `docs/pa05-e01j4k-trusted-multiworker-stop-20261020` | `991e34f6caa011b05ec99c506919b9d121d7d975` |
| #1022 | `docs/pa05-window-research-handoff-20261019` | `ac2611725611c8a4f47364755b0a26cc51282147` |

### 4.2 剩余 9 个当时未被 OPEN PR 占用的 ref（不代表可删除）

（本交接自身 docs 分支是新建，不计入此快照）
1. `chore/verified-merged-ref-retirement-20261021`：#1096 归档的原 branch，后来追加一次性审计，HEAD `52e23806...`，不可以原 `bd8ecc...` pin 删除。
2. `docs/fast-feedback-pivot-workflow-20261021`：merged #1089 但历史 main ancestry 不通过。
3. `docs/prototype-source-first-fidelity-delivery-20261021`：merged #1097，最新未按本轮所有权规则归类，不接管。
4. `feat/bex01-e3-real-map-task-overview-20261016`：未在所查最近关闭 PR 页及 open refs 获得足以退休的证据；保留。
5. `feat/bex01-resume-pending-import-20261015`：merged #921 但 ancestry 不通过。
6. `feat/bex01-v3-batch-four-column-review-20261016`：PR #987 closed **unmerged**。
7. `feat/bex01-v3-eidos-live-field-review-status-20261016`：未获足够 Owner/PR/ancestry 证据。
8. `feat/bex01-v3-review-workbench-fidelity-20261020`：未获足够 Owner/PR/ancestry 证据。
9. `fix/governance-evo-request-budget-20261022`：本次 refs 曾见其 HEAD 与 `main@eef6774...` 相同，但它来自另一个窗口，尚未得到归属和是否使用结论；保留。

## 5. 资料矛盾、技术证据边界及待验证事项

1. **删除结果 vs 删除执行者**：66 条在远端不存在是已核事实；哪个用户/Job/工具最初发出真正的 `git.deleteRef` 请求 **尚无独立日志可归因**。#1096 合并 06:32Z，06:54Z 一次性 audit 明确 `deleted=0`；如果真需要归属，查两者之间及之前的 exact run logs、仓库/org 审计事件（需权限）。**不猜 ChatGPT CLI、GitHub 插件或某个人。**
2. **原始日志 vs 二次评论**：#1096 评论简写“66 ABSENT”与 job 的 65 ABSENT / 1 PR_PROOF_CHANGED 不一致；以 G-10 原始 `RETIREMENT_RESULT` 分类型为准；两者在当前 66/66 ref absent 结论上不冲突。造成 PR_PROOF_CHANGED 的具体关联机制未在此逐项追溯，不要推断丢了该 branch。
3. **CI 绿灯 vs 实际执行**：#1096 曾为 4/4 checks SUCCESS；merged 后其它 event/job 可能列 skipped；不能把 CI 成功或 Run success 当作某次 66 refs 已删除。记录带 HEAD 和 event 名称。
4. **GitHub 插件授权 vs tool exposure**：当前 “Allow all actions” 已读；未看到 delete-ref/dispatch action 也属事实，不能由此推断用户账户不允许删除或平台“老板改权限”；技术执行路径本次仍不明。
5. **25、26、27 refs**：分别是 2026-10-21 PR 评论、本窗口创建 docs 分支前、本窗口创建 docs 分支后；**不是数据冲突**，是并行变化。main 也在本窗口从 eef...→ee9...；后续再读。
6. **PA05 K0**：Issue #1092 目前 OPEN、无独立 Owner 签收，需 R5-01 生产确切部署 effective draining/overlap、R5-02 PID1/Node/PROCESS 信号链、R5-03 隔离且独立 Supervisor/cgroup/TTL、完整 Worker/Runner/Caller、真实 PG session、IdP/DBA/secret rotation/audit 与 Host→PROCESS 联合 stop barrier。**本次没有去核验新生产 Railway deployment**，不得用 WINDOW-09 旧时间片签收今天。K0、完整 E01J4、PA05-05 E01–E05、W06 NOT_SIGNED / production material WRITE OFF。
7. **屏幕/附件**：本窗口没有保存新截图或 PDF/图片附件；GitHub PR comments、JSON commit 和 CI 原始日志为更高可靠的可重新读取资料定位。历史截图、Linux/PG18/Railway 长篇查阅位置仍按 WINDOW-08/09 文档索引，不可补造。

## 6. 项目模块、权威路径及下一步（落地映射）

| 模块 / 资料所有者 | 可复用事实与路径 | 下一窗口动作 |
| --- | --- | --- |
| GitHub Branch Hygiene | `.github/workflows/branch-hygiene.yml`；`repository-hygiene/retired-branches.json`；[#1096](https://github.com/jiangxng/EVO-App-Platform/pull/1096)；immutable SHA `5159c863...` | **先承认 66/66 已消失，不重新删除**；如需执行者出处，取 delete receipts；不误删保留 refs。 |
| 批量一时核验 | 清理 branch 上 `.github/workflows/verified-merged-ref-retirement-20261021.yml` / [Run #39558345948](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948) / Job #119083359962 | 记录 `execute=false`、`deleted=0` 和 65+1，不把 SUCCESS 等价于 DELETE。 |
| PA05/K0 工程治理 | `docs/agent-line/`；[#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)、[#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | 维持四 Draft 不合并/不删；#1081 负例 CI，不转正。接续 WINDOW-08/09 原 research 线而非重复背景研究。 |
| Production Operator | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) / WINDOW-08 原始证据工作表 | 只读最新 Operator 有效签收与 Railway 生产精确部署，满足授权隔离才进行下一高风险实验；READ/Writes 分权。 |
| 其它 Owner | BEX stack / CP03 / Governance / Eidos / 2D | 不擅自删剩余 ref；新一轮审计必须先确认每条分支的 Owner、真实 head、PR 占用和 unique commits。 |
| 本轮交接本身 | 本文件 + 配套 ENTRY，独立 `docs/pa05-e01j4k-k0-window10-cleanup-handoff-20261022` 分支 | 创建 Draft PR，**只新增两文件**，不得覆盖 `docs/agent-line/HANDOFF.md`、`project.status.json` 或 `docs/roadmap/HANDOFF-LATEST.md`，不自动合并。 |

**最终统一规则：** 只把“原始证据确实支持的事实”写为已完成；当前分支清理“结果已成” ≠ “本对话执行 66 次删除”；当前 PA05 安全停机“工程局部通过” ≠ “K0/生产签收”。

## 7. WINDOW-11 接续核验增量（2026-10-22，非 K0 签收）

> **证据等级：** 下列仅为本次通过已连接 GitHub 工具直接读取的原始 JSON、工作流 YAML 与 Actions job log（DIRECT_GITHUB_ORIGINAL / DIRECT_CI_RAW_LOG）；“未找到删除者”仅限已检查范围，不能证明其它 GitHub API、CLI、人员或审计系统未曾执行删除。WINDOW-08/09 的外部研究仍为 PRIOR_INDEX_ONLY。

### 7.1 GitHub 当前状态（WINDOW-11 精确时间片，不覆盖 WINDOW-10 原快照）

- [main 原始 ref](https://api.github.com/repos/jiangxng/EVO-App-Platform/git/ref/heads/main) 再读为 `ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95`（此次与交接末次一致；不宣称未来不变）。
- [branches 当前列表](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches?per_page=100&page=1)：**28** 条远端分支；[OPEN PR 原始列表](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=open&per_page=100&page=1)：**18** 个开放 PR，其 head/base 连同 main 合并为 **19** 个不同预留 ref，剩余 **9** 条不被该预留集合占用。数量较 WINDOW-10 最终 27/16 增加；其中 [#1099](https://github.com/jiangxng/EVO-App-Platform/pull/1099) 本交接和 [#1100](https://github.com/jiangxng/EVO-App-Platform/pull/1100) 均为 OPEN Draft；**PR 非占用不等于分支可删除**。
- [main 退休清单](https://github.com/jiangxng/EVO-App-Platform/blob/ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95/repository-hygiene/retired-branches.json) 实读仍为 **96 项、78 SHA-pinned、66 条新添 Verified merged PR 记录**；与本次 28 条远端分支按名称交集核验：**66/66 ABSENT**。不再次执行删除。
- 9 条非 OPEN PR 预留 ref 按当前实际名称为：`chore/verified-merged-ref-retirement-20261021`、`docs/fast-feedback-pivot-workflow-20261021`、`docs/prototype-source-first-fidelity-delivery-20261021`、`feat/bex01-e3-real-map-task-overview-20261016`、`feat/bex01-resume-pending-import-20261015`、`feat/bex01-v3-batch-four-column-review-20261016`、`feat/bex01-v3-eidos-live-field-review-status-20261016`、`feat/bex01-v3-review-workbench-fidelity-20261020`、`fix/governance-oidc-transaction-budget-20261022`。后一名称不同于 WINDOW-10 的 `fix/governance-evo-request-budget-20261022`，只记录最新存在的 ref，不无证断言是同一分支重命名。
- [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)、[#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 均在当前 OPEN PR 原始列表中并仍为 Draft。[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 原始 Issue 仍 OPEN、可见 2 条旧评论；未获得新的 Operator 签收。Railway 生产部署 **本次没有读取**。K0/完整 E01J4/PA05-05 E01–E05/W06 NOT_SIGNED；production material WRITE OFF。

### 7.2 定向寻找“真正发出 DELETE”的执行收据

- 再读 [Run #39558345948 / job #119083359962](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39558345948/job/119083359962) 原始日志：`execute=false, eligible=0, deleted=0, skipped=66`，其跳过明细 **65 ABSENT + 1 PR_PROOF_CHANGED**；与 WINDOW-10 一致，不将 success 解释为 DELETE。
- 新增原始负证据：[Branch Hygiene 运行 #39556063751](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39556063751) 对应 #1096 merge 后的 job **#119075990896**；[运行 #39557023257](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39557023257) 对应 #1097 merge 后的 job **#119079062090**。两份 **已读取原始 job log**，均实打 `SKIP_NOT_APPLICABLE`，而非 `DELETED_VERIFIED_MERGED_AGENT_BRANCH`。两次 job SUCCESS 不构成 66 次删除凭据。
- [仓库 Actions 原始 runs 列表](https://api.github.com/repos/jiangxng/EVO-App-Platform/actions/runs?per_page=100&page=1) 经分页检索 **1–14 页、1,400 条**，所覆盖时间范围约为 2026-10-22T02:13Z 至 2026-10-21T02:27Z；对 run 名称中 retirement / prune / hygiene 等关键词与 06:32–06:54 时间段做了查找，**没有由此获得 66 条的实际 DELETE 收据**。该查找并未逐篇下载 1,400 份 job 原始日志，不能推出其它 workflow 或 CLI 未执行删除。
- 通过 [Actions workflow_dispatch 筛选](https://api.github.com/repos/jiangxng/EVO-App-Platform/actions/runs?event=workflow_dispatch&per_page=100&page=1) 原始 JSON 再读到 repo 可见历史 **total_count=2**，两条均早于 2026-10-19；没有 2026-10-21 的 `workflow_dispatch` run。这里不排除 `push`、外部 CLI/API 或其它独立执行路径。
- 直接查阅 [.github/workflows/branch-hygiene.yml](https://github.com/jiangxng/EVO-App-Platform/blob/ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95/.github/workflows/branch-hygiene.yml)、[bex01-retire-verified-branches.yml](https://github.com/jiangxng/EVO-App-Platform/blob/ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95/.github/workflows/bex01-retire-verified-branches.yml)、[prune-merged-inactive-branches.yml](https://github.com/jiangxng/EVO-App-Platform/blob/ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95/.github/workflows/prune-merged-inactive-branches.yml) 全文：仓库已有受保护/祖先/HEAD 再校验的执行机制，无需重复开发。后者为广域清理动作，不应绕开 Owner 和本线 fail-closed 原则擅自触发。

### 7.3 本窗口决策与下一步范围

**仅核验与归档；删除操作 0 次，创建新清理器 0 个，合并 PR 0 个。** 66 条已 ABSENT、不重删。9 条非开放 PR 占用 refs 仍由各自 Owner 负责，尤其 BEX、治理及 #1096 原工作分支；没有重新审成完整新候选，因而不执行删除。#1099 继续 Draft；仅在其既有独立 docs 分支更新本交接文档，**不触碰** `project.status.json`、`docs/roadmap/HANDOFF-LATEST.md`、`docs/agent-line/HANDOFF.md` 或 Railway/Secrets/SQL。证据缺口仍为实际删除执行者/独立原始 DELETE 收据；若要再追溯，优先具审计权限的 GitHub audit-log ref deletion 与明确 `DELETED` 的 job 原日志，避免广泛重复旧研究。

## 8. WINDOW-11 / M09–M11：剩余 9 条分支复核与不误删收口（2026-10-22）

**证据等级**：下列数字直接来自本轮连接 GitHub 的 live main ref、完整 28 条 branches 列表、18 条 OPEN PR 列表、按分支名查询的 PR REST 原始 JSON、9 次 `compare_commits(base=branchHead, head=main)` 返回，以及 GitHub Actions 的 Job 原始日志；是 **DIRECT_GITHUB_ORIGINAL** / **DIRECT_CI_RAW_LOG**。没有将旧研究索引、CI SUCCESS 或自身判断视为实际删除事实。

### 8.1 当前主线和逐条结果

- [main ref](https://api.github.com/repos/jiangxng/EVO-App-Platform/git/ref/heads/main) 已从 WINDOW-11 前段 `ee9cc39cb50329e38a653ffa54ae52f8e3e4fa95` 继续推进到 **`2811789dd7df7e5deb90ac8c772811b82d71820f`**，即 [PR #1101](https://github.com/jiangxng/EVO-App-Platform/pull/1101) 的 merge SHA；下表是此精确 main 时间片下的 compare 结果。
- 远端 **28 branches**，**18 OPEN PR**，head/base + main 的 **19 distinct reserved ref**，余下 **9** 条目前无 OPEN PR 引用。原退休清单仍有 **96** 条，其中 66 条新增的精确已合并记录全部 **ABSENT (66/66)**；不重删。
- `behind_by` 使用 **base=分支 HEAD SHA，head=main SHA**：`behind_by>0` 表示该分支有未被 main 祖先图吸收的提交；不能因为原 PR merged 或工作内容重叠而删除。零值仍需合并 PR 证明、Owner/活动保护、当前 ref 不漂移和执行前二次核验。

| 当前非预留 branch | 当前 HEAD | 关联 PR（REST 原文） | compare `behind_by` / `merge_base` | 本线处理 |
| --- | --- | --- | --- | --- |
| `chore/verified-merged-ref-retirement-20261021` | `52e23806fbcd126e2901bf8ab5aa841841d60c59` | [#1096](https://github.com/jiangxng/EVO-App-Platform/pull/1096) MERGED，PR head **`bd8ecc9...`** 与当前 ref 不同 | **1**；`bd8ecc9...` | **HOLD**；一次性审计追加提交未进 main，不用旧 pin |
| `docs/fast-feedback-pivot-workflow-20261021` | `1cf75f4e4ad74e7e31985dd618c084ebd79469cf` | [#1089](https://github.com/jiangxng/EVO-App-Platform/pull/1089) MERGED、head 匹配 | **2**；`6bea66e...` | **HOLD**；仍有独有提交 |
| `docs/prototype-source-first-fidelity-delivery-20261021` | `a9ff24615c5a1101a13e4f80691d899deeb774bf` | [#1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097) MERGED、head 匹配 | **2**；`5159c86...` | **HOLD**；不能将 PR 合并等同当前 head 祖先 |
| `feat/bex01-e3-real-map-task-overview-20261016` | `e0a3bbf6a670aff9c643f0ea0a978f45d4daac76` | 按精确 head 名称检索无 PR | **2**；`66f29a9...` | **HOLD**；未吸收、Owner/BEX |
| `feat/bex01-resume-pending-import-20261015` | `6733d7cc9011474337e8b60070fbc63854983ed9` | [#921](https://github.com/jiangxng/EVO-App-Platform/pull/921) MERGED、head 匹配 | **5**；`7cc5ba3...` | **HOLD**；旧结论重新验证仍不满足祖先门禁 |
| `feat/bex01-v3-batch-four-column-review-20261016` | `50e2fac22186d67b2f744da353dae2914e7a9b29` | [#987](https://github.com/jiangxng/EVO-App-Platform/pull/987) CLOSED **UNMERGED**，说明被 #984 supersede | **6**；`3395fe2...` | **HOLD**；PR 未合并，内容重叠不构成精确删除许可 |
| `feat/bex01-v3-eidos-live-field-review-status-20261016` | `1f5ec1a9171391847bf4e9794e0e10964b53d08c` | 按精确 head 名称检索无 PR | **0**；merge base = 当前 HEAD | **HOLD**；虽为 main 祖先，仍无已合并 PR 的精确证明，BEX Owner 未签退 |
| `feat/bex01-v3-review-workbench-fidelity-20261020` | `07608117964350895cef893e423e5d78745c080d` | 按精确 head 名称检索无 PR | **1**；`71d63ce...` | **HOLD**；未吸收，BEX Owner |
| `fix/governance-oidc-transaction-budget-20261022` | `fad5559569a078e6f4dd73de29625b1f1959b451` | [#1101](https://github.com/jiangxng/EVO-App-Platform/pull/1101) **2026-10-22T02:28:40Z MERGED**，精确 PR head 匹配，merge SHA=`2811789...` | **0**；merge base = 当前 HEAD | **HOLD / 技术候选**；本轮可证 PR+祖先，但属于刚合并的并行治理 Owner 分支，未取得独立退休授权，不接管 |

**重要解释**：7 条 `behind_by>0`；另外 2 条 `behind_by=0`，但一条没有可证 PR，另一条是刚合并的跨窗口治理分支。本轮没有经 Owner 与安全门禁共同确认的 **可执行目标（0）**。本表中的 HOLD 是本线 fail-closed 决策，不是 GitHub 官方要求“不准删”。

### 8.2 使用既有工作流的边界与近期执行收据

- [Branch Hygiene workflow 原文](https://github.com/jiangxng/EVO-App-Platform/blob/2811789dd7df7e5deb90ac8c772811b82d71820f/.github/workflows/branch-hygiene.yml) 已实现 SHA pin、开放 PR head/base 保护、祖先检查和执行前二次 getRef；[BEX 专项工作流](https://github.com/jiangxng/EVO-App-Platform/blob/2811789dd7df7e5deb90ac8c772811b82d71820f/.github/workflows/bex01-retire-verified-branches.yml) 与 [全域 prune](https://github.com/jiangxng/EVO-App-Platform/blob/2811789dd7df7e5deb90ac8c772811b82d71820f/.github/workflows/prune-merged-inactive-branches.yml) 已存在。**不建新工具**，也不通过广域 prune 意外处理其它 Owner 分支。
- [#1101 merge 后 Branch Hygiene run #39711586400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39711586400) job **#119603927782** 原始日志明确 `2026-10-22T02:28:48Z SKIP_NOT_APPLICABLE`；虽然 job SUCCESS，这个运行没有删除刚合并的治理分支，也不是清理 66 条的 DELETE 收据。
- 本轮 **没有调用删除、workflow dispatch、移动 ref、更新生产**。当前会话可用的 GitHub 动作没有明确 `git.deleteRef` / `workflow_dispatch` 调用；但本轮本就没有合格的跨 Owner 删除目标，不绕过现有动作边界触发风险更高的工作流。不得以“插件权限策略改变”作为推测解释。
- `M09=9/9 已核验`，`M10=0 个已获许可目标、未执行删除（按规则不触发）`，`M11=再次复核 28 remote refs / 18 OPEN PR / 66 ABSENT，删除结果 0`。若后续 Owner 给出明确签退，仅按 **新 main、新 PR 预留、新 HEAD / SHA 与日志** 通过已有工作流执行，并保存真正 `DELETED` 的原始 Job 收据。

### 8.3 PA05/K0 约束与范围

[#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)、[#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 仍 OPEN Draft。[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) OPEN，没有新增生产 Operator 原始签收。Railway/Secrets/SQL 均未访问或改变；K0、完整 E01J4、PA05-05 E01–E05、W06 仍 **NOT_SIGNED**，production material WRITE **OFF**。只更新 [交接 Draft #1099](https://github.com/jiangxng/EVO-App-Platform/pull/1099) 原两份文档，不合并、不另建 PR、不动全局权威文件。
