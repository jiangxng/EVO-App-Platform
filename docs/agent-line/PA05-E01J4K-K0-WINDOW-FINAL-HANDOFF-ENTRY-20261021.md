# PA-05 / E01J4J–J4K / K0 — 换窗口简短接续入口（2026-10-21）

> **性质：** 简短交接入口 / 历史证据快照 / 不构成生产签收。**先读本文件，再读[最终详细参考索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)**。完整窗口历史仍在[原 2026-10-20 入口](PA05-E01J4K-K0-WINDOW-HANDOFF-ENTRY-20261020.md)及[原详细资料索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)，未覆盖、未删减。

**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**本窗口归档分支：** \`docs/pa05-e01j4k-account-scope-20261020\`  
**文档 PR：** [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) — **OPEN / Draft / 不合并**。  
**工程 PR：** [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082)，均独立 Draft，不能合并或覆盖彼此。  
**核验时点：** 2026-10-21（GitHub/Railway 只读刷新）；不是永久最新状态。

## 1. 一句话状态与不可改变的红线

J4J 的协作 Host 排他已 **ENGINEERING_BOUNDED_PASS**，但不具备可信多 Worker 全局停机证明。随后 K0 的本地 PROCESS 风险先被实际负面测试复现，后在 #1082 新增 **9 项真实一次性 Node 子进程回归并全部通过**；这些只构成 \`ISOLATED_PROCESS_LIFECYCLE_NINE_CASE_BOUNDED_PASS\`，**尚未合并或部署**，也不替代外部编排、生产 SIGTERM、PostgreSQL 会话及操作员认证。

**K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 全部 \`NOT_SIGNED\`；production material WRITE \`OFF\`。** Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 均 **OPEN**。禁止生产 Validator、停机/重启/扩缩容、读取 Secrets/生产 SQL、自动删除异常锁、擅改 Railway draining、擅开生产追踪。不能动 BEX/CP03/Eidos/2D 或覆盖 \`project.status.json\`。

## 2. 精确 HEAD、CI 与生产时间片

| 对象 | 已核对的准确状态（本入口提交前） |
| --- | --- |
| \`main\` | \`ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9\` |
| Railway Ledger Configurator | deployment \`5c88b3df-8a6c-4225-976d-cc2ccda97d9e\` / SUCCESS / Online / 1 running / 0 crashed |
| [#1071 K0 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1071) | 归档前 HEAD \`bcf897fad0c9d8a1bb6501f17d496c0994e56e15\`，**7/7 CI SUCCESS**；**本交接 commit 产生后必须重新核新 HEAD 的 CI** |
| [#1074 Host 顶层 shutdown](https://github.com/jiangxng/EVO-App-Platform/pull/1074) | \`caccb1b60358b453ef471eaf6abecf1593e4965c\`，**45/45 SUCCESS**；201/201 Lightweight Host PASS；未部署 |
| [#1081 真实负面复现](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | \`a1e8a0941ff5b796816aaea0904b89533191a239\`，**5/5 SUCCESS**；成功复现旧 runtime 的 stop/shutdown 漏等、shutdown 后再 fork |
| [#1082 本地 PROCESS 修复](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | \`c15ce1f5225272b26d14f5b564a2a6b9f0582270\`，**5/5 SUCCESS**；[Platform job #118660946764](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39432525667/job/118660946764) **1094 total / 1093 PASS / 1 SKIPPED / 0 FAIL**；9 项专项 \`ok #759–#767\` |
| 独立负证据 | [Ecosystem schedule #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) 仍为失败：\`1815 total / 1723 PASS / 10 FAIL / 82 SKIPPED\`（基于旧 \`main@eaa5e813...\`）。后续不同范围提交检查不能宣称这 10 项已经解决 |

## 3. 已确认决策与三个工程边界

- **J4J / PR #1057** 已 MERGED。三真实 PostgreSQL18 **28/28 PASS**，最终工程 45/45；仅同一可信 POSIX 命名空间协作 Host 的本地排他，不是全域停机，也不移除异常退出遗留锁。
- **K0→K6** 继续采用中央 fencing epoch + **权威且完整** Worker/外部调用者库存 + 外部逐实例终止回执 + PostgreSQL session/role 二次核查 + 真实 Human IdP/DBA/凭据轮换/审计签收。Lease 超时、heartbeat、advisory lock、\`pg_terminate_backend=true\` 或本地 child \`close\` **不能独立替代**上述证明。
- **#1074 ≠ #1082**：#1074 仅 Host 顶层 cleanup 异常路径和 HTTP 请求拒绝；#1082 仅 \`manager/plugin-runtime-host.ts\` 的在途 stop、fork admission、timeout child close、代际串行、Sigstore verifier wait 取消及 IPC 断线。#1081 是未修复版本的负面基准，保持测试-only Draft；**三个工程 PR 不混改**。

## 4. 本窗口真正推进到哪里、下次从哪里继续

1. **已完成：** 发现并原始日志复现两项 PROCESS 竞态；#1082 按 2→4→6→9 个用例迭代完成本地隔离正向 CI。最后九项及日志 marker 均写入 [K0 证据验收表 §§9–12](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)，精确资料和来源等级在 [最终参考索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)。
2. **仍缺本地工程证据：** 父 Host 被 SIGKILL 后的**外部 supervisor** 子进程身份枚举/回收；child \`activate()\` 一直不返回、极端 IPC/spawn 异常，以及真实停止 deadline 的非生产边界。**不要无监管制造孤儿进程**。远端 verifier Promise 被取消的是 Host 等待和 fork 权限，**不等于**远端任务真正取消。
3. **K0 根本阻塞：** 组织全域 Worker/子进程/Runner 清单，重启扩缩容冻结责任、Railway *有效* drain/overlap 与 \`npm start\` 的 PID1 SIGTERM 实测、每实例外部 stop receipt、真实生产 Human IdP/MFA/撤销 SLA、DBA role/session/secret broker/轮换/审计。当前连接的 Railway 项目只有有限 5 服务可观察范围；不可据此断言其他 Worker 不存在。
4. **分支清理：** 9 条已合并 PA05 文档历史过程分支已核对精确 SHA、祖先关系及无开放 PR 引用，但**远端删除未执行**（当前可用 GitHub 接口无 delete-ref / workflow-dispatch）。详见[旧资料索引 §8.2](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)；活动的四条 Draft 均不可删除。

## 5. 新聊天的固定启动顺序

按仓库 [\`AI-BOOTSTRAP.md\`](../../AI-BOOTSTRAP.md) 全流程读取当前权威文件，再看 [Agent \`HANDOFF.md\`](HANDOFF.md)、[PA05 认证总账 §§62–86](PA05-CERTIFICATION-BASELINE-20261015.md)、本入口与最终参考索引；然后读取 [K0 拓扑 §§19–29](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[K0 停机证据表 §§1–12](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[J4K 已选方案](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)、[旧 J4G–J4J 索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)。

**下一轮：** 先刷新 main / 四条 PR HEAD+准确 CI / Railway 部署；若独立授权的隔离运行设施可安全保障孤儿清理，再做父 Host SIGKILL 与退出回执验证；否则聚焦只读获取生产真正 Infra/SRE/DBA/IdP owner 证明。不得先行合并、运行生产 Validator 或签 \`STOP_CONFIRMED\`。

**尚无 GitHub 之外的新增二进制截图/附件/独立生产权威凭证。** 以上证据均是可定位 GitHub PR/commit/job 原件或既有项目文档；未取得资料一律 \`UNVERIFIED\`。