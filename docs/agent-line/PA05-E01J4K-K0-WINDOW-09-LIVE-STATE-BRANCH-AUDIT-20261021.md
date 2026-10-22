# PA05 / E01J4J–E01J4K / K0 — WINDOW-09 实时核验、分支退休审计与下一执行门禁

**日期：2026-10-21；证据等级：DIRECT_CONNECTED_GITHUB_AND_RAILWAY / UNSIGNED；状态：审计归档，不是生产认证。**
前置交接： [WINDOW-08 短入口](PA05-E01J4K-K0-WINDOW-08-CONTINUATION-HANDOFF-ENTRY-20261021.md) · [WINDOW-08 来源及决策索引](PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)。此前 PostgreSQL18、OAuth、Linux、Kubernetes Lease、Railway 原文研究按原索引保留，未重做。

## 1. 实时生产与 GitHub 版本（只读；时间片不是恒定当前值）

本窗口首次只读重查时：GitHub `main@4e21fa8d0380168f9da0ae8a364020da1b9a3f90`，Railway Ledger Configurator production `7e794aba-21ec-4dab-b55c-601fa071e59d` SUCCESS、1 running / 0 crashed / no pending；该部署来自并行 #1094，而非 PA05 Draft。**在同一次窗口执行期间另一工作线又推进 main 与 Railway：** 再次实时读到 `main@9a382666ffad515d55422d0ffdb9f4cb7dd64aef`，同一 Railway service 最新 `963dd693-5fe3-427f-8ab9-9e1cd67ffce9` SUCCESS、source commit 与 main 一致；旧 `7e794aba...` 已 REMOVED。需要后续针对新部署刷新健康/生效设置；不得沿用旧 ID 出具 Operator 证据。

原始只读资源： [GitHub main ref](https://api.github.com/repos/jiangxng/EVO-App-Platform/git/ref/heads/main)；[Railway Project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)（project `aee4643e-912b-4ca1-ae95-fe4ec64f5601` / production environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` / Ledger service `a8622238-480e-4da3-be6f-60fd0f3e18db`）。只读配置显示 RAILPACK、`npm start`、1 configured replica，**不显示该 deployment 的 effective drainingSeconds/overlapSeconds 或真实 PID1/Node 信号链**；不能从缺变量名或默认值推出生产实际值。

## 2. 四条精确 Draft 与 CI（变更前观测）

| PR | 当前 HEAD（此表记录写入前） | 只读精确 check-runs | 含义 |
| --- | --- | --- | --- |
| [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) | `27c0ca34d6acfd7080dfa169d44f787af6ddd692` | 7/7 success | 文档 Draft，首次 E01J2 job 曾超时，单 job 重跑成功，根因未确认 |
| [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) | `e2e4af922c87b985f9834b592b86556d0e28abac` | 45/45 success | Host shutdown 局部通过，前序顺序 await 可阻断尾部 child stop |
| [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | `a1e8a0941ff5b796816aaea0904b89533191a239` | 5/5 success | **旧缺陷负例证据；禁止合并** |
| [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | `eb4743e8ed34cf3cd748c3f79781d092c62712f4` | 5/5 success | 11 项真正局部 PROCESS，不是实际生产 Worker 全局停止 |

四条均 OPEN + Draft + unmerged；没有合并、发布、改写 Head。**本次文档提交之后 #1071 会得到新 HEAD，旧 7/7 不自动适用，须对新 HEAD 重新核查 CI。** #1074+#1082 无联合运行验收。

## 3. GitHub 分支清理：真实只读分类及执行边界

一次 GitHub refs + open/closed PR（closed 最近三页）核验共 **89** 条远端 refs，**16** 个开放 PR 占用 **17** 条保留 ref（包括 main 及被开放 PR 用作 base 的 BEX 阶梯分支）；另外 **68** 条 exact head 匹配已合并 PR 的遗留分支（此数量仅表示 PR 已合并、head SHA 相符，**不等于 68 条都经过独立 ancestry 认证或全部归本工作线管理**）；**1** 条 BEX 已关闭但未合并（#987），以及 **3** 条 BEX 本次未找到对应 PR，全部保留给 BEX owner。

现行 [Branch Hygiene](../../.github/workflows/branch-hygiene.yml) 使用手工 `workflow_dispatch.execute=true`、[退休清单](../../repository-hygiene/retired-branches.json) 中精确 SHA、未被开放 PR 引用、可证 HEAD 为 main ancestor、删除前再读 ref。清单目前共 **30** 条历史退休记录，**12** 条带有效 SHA；本轮实时 89 条 refs 中与该 30 条名称交集为 **0**：**标记删除的分支已经不存在，不可再次声称“删除成功于本窗口”**。无 SHA 的旧 manifest 条目只是历史理由，非删除授权。

以下 **9 条 PA05 文档旧分支**各自 GitHub PR 已 merged、branch HEAD = PR head SHA、无开放 PR head/base 占用，且已逐条以 `compare(base=branch SHA, head=main@9a382666...)` 验证 `behind_by=0`、`merge_base.sha=branch SHA`；是本工作线可交给退休流程的**精确候选**（执行时仍必须按当前 HEAD 重查）：

| 已合并 PR | 远端分支 | 冻结 SHA |
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

**操作缺口明确：本窗口 GitHub 连接器只有只读 refs/PR/compare 及其它常规写入操作，没有 delete-ref，也没有触发带 execute=true 的新 workflow_dispatch 操作。以上 9 条仅完成可清理认证，未真正删除；禁止写作 DELETED。** 正式执行应由可授权的 GitHub Operator 经现有 Branch Hygiene 流程提交精确 SHA-pinned manifest、确认最新 main 与所有开放 PR 后手动执行；不合并 #1071 或直接推送 main 来绕过现有审批。其它 Owner 的 59 条已合并候选未经逐条 ancestry / 归属核对，不接管、不删。

## 4. #1092 外部证据与最小下一门禁

直接读取 [Issue #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 及全部 issue comments：OPEN、没有指派负责人；已有一条本项目作者的旧证据补充，**无独立 Infra/Runtime/DBA/IdP Owner 去敏原始签收**。需要权威 Operator 针对**最新精确 deployment** 提交 R5-01 实际 effective draining/overlap 值与覆盖来源（GraphQL schema 先 introspect，禁止猜字段），R5-02 PID1→Node→PROCESS SIGTERM 真实回执；R5-03 须先证明获授权独立非生产空间、独占 cgroup/进程树、独立 Supervisor 与 TTL 回收，才可以设计 parent-host 异常死亡实验，**目前禁止 SIGKILL**。

工程侧下一小门禁只读审查 #1074/#1082 在最新 main 上的依赖安全停机时序，强调 Host 顶层 watchdog 触发前 PROCESS child stop 实际被调度且受外部退出回执约束；不要复刻已有 11 个 PROCESS 测试或非生产 Node SIGTERM。Caller 清单继续区分 READ、material WRITE 与 lifecycle，根据真实 command code/Principal 归档，不把所有 POST 定性为 WRITE。议题 #988、#979、#913 独立 OPEN。

**终态：K0、完整 E01J4、PA05-05 E01–E05、W06 均 NOT_SIGNED；production material WRITE OFF；未触发生产 SQL/Secrets、停机/重启/Validator、配置修改、清锁、Draft 合并或活动分支删除。** 
