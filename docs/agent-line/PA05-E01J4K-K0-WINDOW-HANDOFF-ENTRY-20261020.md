# PA05 / E01J4K–K0 新聊天窗口简短交接入口（2026-10-20）

**文档性质：** `WINDOW_HANDOFF_ENTRY / SNAPSHOT`（不是永久实时状态，也不是生产安全签收）。  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**本轮继续使用的文档分支：** `docs/pa05-e01j4k-account-scope-20261020`  
**PR：** [#1071 — K0 account-scope evidence](https://github.com/jiangxng/EVO-App-Platform/pull/1071)，**Draft / OPEN / 不合并、不触发生产部署**。  
**配套详细研究与来源索引：** [PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)。  
**继续遵循：** [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md)、[Agent HANDOFF](HANDOFF.md)、[PA05 总账](PA05-CERTIFICATION-BASELINE-20261015.md)、[K0 生产拓扑](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[J4K 决策记录](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。首次恢复仍须按 AI-BOOTSTRAP 的**完整**顺序，不把本快照当成最新 main。

## 一、本轮目标与用户不可变约束

- 从 J4J 原工程 [#1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) 继续，完成真实 CI、合并、main 与 Railway 核验，保留两条旧取消运行的真实因果边界；已完成研究 J2–J4I 不重做。
- 继续独立 K0：真实多 Worker/Host 停机证明、生产 Human IdP / Session 撤销、DBA 登录/凭据轮换、CLI/Runbook 和审计；只把可证实的结果记入认证总账。
- **禁止**把本地 POSIX 协作锁升级为分布式全局停机证明；完整 E01J4、PA05-05 E01–E05、W06 保持 `NOT_SIGNED`；production material WRITE 保持 `OFF`；不自动移除异常退出锁；不以环境布尔值/测试身份冒充生产 IdP。
- **不触碰** BEX、CP03、Eidos、2D、其他窗口分支；不覆盖 `project.status.json` 和自动生成的 `docs/roadmap/HANDOFF-LATEST.md`。
- **当前文档 PR #1071 与独立工程 PR #1074 均刻意 Draft：** 不在缺少授权的情况下合并到会触发 Railway 自动部署的 main，不运行生产 Validator，不停机/重启/扩缩容，不读取 Secrets/生产数据库。

## 二、截至本轮 2026-10-20 已复核的精确工程状态

| 对象 | 状态 / 证据 |
| --- | --- |
| J4J | [#1057 MERGED](https://github.com/jiangxng/EVO-App-Platform/pull/1057)，merge `e123924af8bdd1214a4aec6bfaf358c5afb9f445`；末工程 HEAD `1fba63927a80f2e9658b8608bb5a92a9849abcdf` **45/45 SUCCESS**；[三物理 PG18 #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722) **28/28 PASS / 0 skipped**；合并后 [main #39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987) 再次 **28/28**。仅 `ENGINEERING_BOUNDED_PASS`。 |
| J4J 旧取消 | 旧 HEAD `16e00238...` 上 [#39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878)、[#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769) 为 CANCELLED；工作流有 `cancel-in-progress:true`，但原 job log 返回 `BlobNotFound`，**具体取消原因未证实**。不得重写为“确定被新运行取消”。 |
| K0 研究 | 先前研究/证据 PR #1059、#1062、#1064、#1065、#1068 已合并；后续可见生产拓扑是所连 Railway 项目 **5 服务、无独立 Worker/Cron、无 Webhook/TCP proxy**；EVO Runtime 运行 API 而非 repo 中独立 Worker，Validator 是可重跑的一次性外部生命周期调用方。**仅范围内可见**，不等于组织全域。 |
| 当前 main | `eaa5e813b1e86a6460d988c76eb2076512c35127`（取证时），后续必须重新读取。 |
| 当前 Railway | Host deployment `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9` 对应上述 main，`SUCCESS / Online`，1 running / 0 crashed；不代表全 Worker 终止。 |
| 本文档线 | [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) 保持 Draft；归档前 HEAD `472947a87298a93a7ce01949ff22cc7ffb6a60a0`，**7/7 CI SUCCESS**。本交接新提交后以新 HEAD 为准。 |
| 另一工程线 | [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) `agent/pa05-host-shutdown-error-path-20261020`，HEAD `caccb1b60358b453ef471eaf6abecf1593e4965c`，**45/45 CI SUCCESS**；[Lightweight Host #39378563738](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39378563738) **201/201 PASS**；仍 Draft/未合并/未部署，**不要在本交接分支修改其源码**。 |
| 当前 main 的独立反证 | [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) 是 schedule 运行，`main@eaa5e813...` 的 `npm run test:all` **1815 tests / 1723 pass / 10 fail / 82 skipped**。主要涉及 App Host 表单、localization 和 manager lifecycle/缺 `enterprise.application-runtime-binding`。不能说“main 全绿”；独立记录，不跨线改它。 |
| 安全 Issues | [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 均 OPEN。 |

## 三、已确定的方案与研究结论

1. **三种证明分开：** (a) stale epoch 保护操作拒绝，(b) 完整权威 Worker 清单 + 独立逐实例终止回执 + PG 会话复核，(c) 真实 Human/operator IdP 及 DBA/Secrets 授权。J4J 只覆盖有限范围的协作排他。
2. **多 Worker 基线：** central fencing epoch + 完整可信 inventory + 外部 supervisor stop receipt + DB session re-query；heartbeat/Lease 超时、单一 PostgreSQL advisory lock、`pg_terminate_backend=true` 都不是进程停止证明。
3. **Railway 关机缺口：** 官方默认 drain 0 秒，SIGTERM 后可能 SIGKILL；当前 EVO Runtime、Host 使用 `npm start`，官方提示包管理器可能截获 SIGTERM。Host/EVO 可见变量名中无 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`，但 Settings-pane 有效值不可见，**不能断言实际设置一定是 0 秒**。
4. **#1074 有界修复：** 优先停止请求准入，清理步骤失败也尝试其余项，清理/HTTP close 不完整时非零退出以保留 J4J 锁；CI 是代码层证据，不是 Railway 实际信号/生产全局停机证据。
5. **权威拓扑仍缺：** 可见 Railway 一个工作区/一个项目与五个服务，不证明其他账户/云/Runner/子进程/队列消费者不存在；须由组织指定真实 stop authority 和 IdP/DBA/audit owners。

## 四、资料、冲突与新窗口下一步

- 详细资料、原始 URL、阅读等级、方案对比、已读文档章节、重要日志摘要、负证据和模块落点全部在 [详细索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)。**原 J4G–J4J 索引及 J4K 设计文档继续保留，不能用本文件替换。**
- **先做：** AI-BOOTSTRAP 顺序 → 刷新 main、#1071/#1074 HEAD、各自检查及 Railway → 检查定时 Ecosystem 失败是否已被其他窗口处置 → 保持 Draft/不部署。
- **再做：** 仅依据缺口继续 K0 无副作用核验、生产服务 Settings-pane 排空值与真实执行进程/子进程控制面、IdP/DBA/审计责任人证据；获得组织确认之前不进入生产 K1/K2。
- 如果需要后续实施 Host shutdown：**接续现有独立 [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074)**，不要在 #1071 重复开发。明确的发布/停机测试计划和授权是合并前置条件。
- **没有**新增截图、二进制附件、真实凭据或生产数据库备份；有保留期风险的 CI/job 与日志位置已写入详细索引。

**准确交接提交：** 请读取本交接所在分支的最新 HEAD，并以本次交接 commit 为稳定快照；不能把旧 `472947a8...` 当成最终 HEAD。
