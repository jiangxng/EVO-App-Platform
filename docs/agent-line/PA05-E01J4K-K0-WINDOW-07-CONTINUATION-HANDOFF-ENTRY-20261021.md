# PA05 / E01J4J–J4K / K0 — 2026-10-21 续跑 #02–#07 换窗口简短交接入口

> **先读本页，再读 [对应详细研究索引](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)**。这是 2026-10-21 的历史快照，不是生产签收或当前全局项目状态的替代文件。所有早期研究原始遗产仍保留，不从零重做 PG18/OAuth/Lease/NIST。
>
> 仓库 https://github.com/jiangxng/EVO-App-Platform · **文档分支** docs/pa05-e01j4k-account-scope-20261020 · [Draft PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)，**不合并**。本次详细索引初次入库 commit：`b8a207c4ed6a584b362f4d121d3e6aafed3dac44`；**整个交接包最终 commit 以本次最后提交/回复为准**。

## 1. 当前一句话结论及不能改变的边界

**本地 PROCESS 生命周期真实 11 项有界通过，Host shutdown Draft 冲突已解除，隔离外部 /proc 正常退出也已实测；但没有可信独立 Supervisor、全组织 Worker/Caller 停机收据、生产 Railway 有效 graceful draining/PID1 或真实 Human IdP/DBA/SQL session 权威签收。**

因此 **K0、完整 E01J4、PA05-05 E01–E05、W06 全部 NOT_SIGNED；production material WRITE OFF；Issues #988/#979/#913 OPEN**。不合并四 Draft、不触发生产部署/Validator/Secrets/SQL、服务停机/重启、配置/排空变更，不自动清异常锁、不动 project.status.json/BEX/CP03/Eidos/2D；没有经过授权的独立清理保障，**禁止父 Host SIGKILL 故障注入**。九条历史分支仅审计，未删除；四条活动 Draft 绝不清理。

## 2. 本窗口确认的最新状态（需重新核验，绝非永久最新）

| 对象 | 2026-10-21 最后已核精确快照 | 结论 |
| --- | --- | --- |
| GitHub main | `4d291fb31f7a5c429b20be14fb48df687c5a1dac` | GitHub 单 SHA 检查仅 **2/2 SUCCESS**，与历史 40/40 的范围不同 |
| Railway Ledger Configurator | deployment `abe8f368-a45f-4a09-aa07-0f8201bf838e`，同 SHA | SUCCESS/Online，1 running / 0 crashed；这个部署来自并行 main，不是本 K0 Draft |
| Railway 项目 | 已连接项目 `aee4643e-912b-4ca1-ae95-fe4ec64f5601`，仅 environment `production` | 五服务，没有已确认的受权独立 staging/test |
| [#1071 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1071) | 交接前 HEAD `9082a9e2bb2f6665e7cb0e777fc0571035e29f89`，7/7 CI | **现在又新增本交接文件，需以新 HEAD 独立核 CI** |
| [#1074 顶层 Host shutdown](https://github.com/jiangxng/EVO-App-Platform/pull/1074) | `c6d5fca90ebfc41ffa642dc5af2e756a224ec838`，45/45 CI | `dirty` 冲突已修复，GitHub `mergeable=true / behind`；仍 Draft、未生产 |
| [#1081 PROCESS 负面](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | `a1e8a0941ff5b796816aaea0904b89533191a239`，5/5 CI | 两类旧竞态反例真实复现；**绿色表示负例运行正确，不表示旧逻辑安全** |
| [#1082 PROCESS 工程](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | `eb4743e8ed34cf3cd748c3f79781d092c62712f4`，5/5 CI | 局部生命周期真实 **11 项**，其他各类测试分开计数，未合并生产 |

旧独立反例：[Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) **10 FAIL / 82 SKIPPED**（旧 SHA/不同范围）。不能以新 Draft 5/5 或少量 main 检查替代旧同范围修复证明。

## 3. 工程、研究与决策已保存在哪里

| 资料 | 核心内容及新窗口使用方式 |
| --- | --- |
| [本次详细研究参考索引](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md) | **先读**：来源原始 URL、时间、已读/摘要/待核分级；方案取舍、冲突、原始 CI job 与 SHA、易失摘要 |
| [2026-10-21 逐步续跑证据 §§1–19](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md) | 第十/十一项 PROCESS、preflight、合成签名/对账、#1074 合并冲突、Linux 外部 /proc、Railway 实际拓扑/PID1 等完整时间线 |
| [K0 停机权威证据工作表 §§1–22](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) | R1–R8 真正缺哪些组织证据；没有的字段必须 UNKNOWN/DENY，不得臆填 0 |
| [R5 Railway Draining/PID1 Operator 证据请求 §§1–5](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md) | 已把 **R5-01 实际 draining/overlap、R5-02 PID1→SIGTERM、R5-03 独立实验环境** 分开；列出 R5-01–R5-06 的 Owner、接受标准与顺序 |
| [PA05 认证总账 §§62–98](PA05-CERTIFICATION-BASELINE-20261015.md) · [Agent HANDOFF](HANDOFF.md) | 保留认证历史及本次有界进展，但 K0 和全部下游仍 NOT_SIGNED |
| [旧 2026-10-21 短入口](PA05-E01J4K-K0-WINDOW-FINAL-HANDOFF-ENTRY-20261021.md)、[旧最终索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)、[2026-10-20 原研究索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) | **全部保留**；包含此前已读 PG18/OAuth/Lease/NIST/Railway 资料的出处和历史反证，切勿另起炉灶 |

新增细分结果是：**11** 项真实单 Host Plugin PROCESS、**2** 项 cgroup preflight 只读、**6** 项离线签名回执、**10** 项模拟 Worker 对账、**1** 项真实 Linux 外部 /proc 正常关闭观察、**2** 项只读 PID1/祖先链。后四类不能合并为真实跨 Worker 或生产停机验证。最近 [Platform run #39541560856/job #119030399081](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39541560856/job/119030399081) 为 **1124 total / 1123 PASS / 1 SKIPPED / 0 FAIL**（#1082 精确 HEAD，已读原始日志）。

## 4. 本窗口研究最重要的决定 / 来源事实分界

- **已读官方来源事实**：Linux cgroup v2 可提供有条件组 kill 和 populated=0 信号；pidfd 稳定引用进程；subreaper 不是自动 kill。Railway 官方默认 graceful draining **0 秒**，Railpack startup command 走 shell，draining 和 overlap 不同。出处、章节、阅读等级见 [详细索引 §C](PA05-E01J4K-K0-WINDOW-07-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)。
- **项目实际已读事实**：生产 service config 显示 **RAILPACK + npm start**、单副本；仓库 Dockerfile 却是 exec-form Node，package start 调 Node；生产 effective draining 与 PID1/信号传递**没有现场受信回执**。Railway 项目当前仅 production。
- **工程判断**：优先采用“独立 Supervisor + 专属隔离 cgroup / 等效编排器 + 完整子孙身份 + TTL 救援 + 退出/SQL/Caller/IdP/DBA 签收”路线；平台默认 0 不等于生产已证实为 0。单次本地非合作 stop **753ms** 绝非生产 SLA。
- **拒绝/暂缓**：Lease/advisory/file lock、空 Map、单次 pg_terminate_backend=true、self-signed test key 或单一 CI 绿灯均不能签全域 STOP_CONFIRMED；不默认 Railpack 使用 Dockerfile CMD 或 systemd；Railway Sandbox 只是候选，当前**未创建、未授权、未验证**。

## 5. 下一窗口第一轮要做什么

1. 按仓库 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 的完整启动顺序恢复项目权威：AI-BOOTSTRAP → project.status.json → 其 handoff → LLM.md → llm.foundation-map.json，随后任务相关的 Agent HANDOFF、PA05 认证总账、拓扑、K0 原决策及本两份交接。**不修改 project.status.json**。
2. 同时只读刷新 GitHub main、四条 Draft PR HEAD / 精确 CI、Railway 生产 deployment 与服务状态、Issues；不要把本页 SHA 当持续有效状态。
3. 优先 **R5-01/R5-02**：经受信 Railway/Infra Operator 查真实生产 effective draining/overlap、build/image、PID1/PPID 和 SIGTERM 是否到达 Node；仅收集脱敏证据，不修改生产；不凭官方默认值填写实际值。
4. **R5-03**：取得合法授权的无生产数据独立测试环境和 Supervisor/专属 cgroup/TTL 回收/退出回执的真实能力。**不能回收孤儿时不做 parent SIGKILL**。验证设施后再制定受控负测、真实 Worker/Caller freeze 和数据库角色/会话/IdP/凭据/审计 Owner 验收。
5. 对新增来源/冲突定向研究并继续补入同一 PA05 索引/工作表；不重复 PG18/OAuth/Lease/NIST 常规原文、不重做已完成 11 项 PROCESS、避免增加无关 synthetic 回归。
6. 九条历史合并分支未删；未来仅在具合法 delete-ref 能力、重核每条实际 SHA/PR/保护时才清理；活动 Draft 不动。**结束汇报继续使用里程碑状态表**。

## 6. 尚未取得或未另存的材料

这次**没有**可供保存的生产 PID1/信号收据、effective drain 数值、完整组织 Worker/Caller 清单、Supervisor 可信退出签名、生产 SQL session / Human IdP / DBA / credential rotation/audit 证明。没有真实截图、视频、PDF 或附件位置；GitHub Actions 完整 raw log 未单独归档为附件，保留了原 run/job URL、测试 marker、时间和精确 SHA 于索引/逐步证据中，可能随保留期失效。**不要虚构链接或声称这些材料已经保存/已签收**。

**再次强调：所有生产 material WRITE 继续 OFF；K0、完整 E01J4、PA05-05 E01–E05、W06 全部 NOT_SIGNED，四条 Draft 不合并不部署。**
