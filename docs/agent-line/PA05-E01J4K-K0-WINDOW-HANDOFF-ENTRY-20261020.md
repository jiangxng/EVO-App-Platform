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


## 五、2026-10-20 本窗口连续更新入口（取代上文实时状态，不改历史快照）

> **注意：** 上文第二节保存交接时 `eaa5e813...` 的历史准确状态。以下是新窗口续跑 #01–#03 的新证据时间片，所有 HEAD/CI/部署仍须在下次恢复时再刷新，不能将此节当永久最新状态。

- **截至 2026-10-20 新近只读观察：** [main](https://github.com/jiangxng/EVO-App-Platform/commit/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa) `91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa`（其他治理线 PR #1079 已合并）；该提交确切检查 39/39 SUCCESS；Railway Host deployment `9aa54df8-26ca-43aa-a598-9b547f276a5c` SUCCESS/Online/1 running。**#1074 Host shutdown 仍 Draft，未合并/部署**；曾有 [定时 Ecosystem 全套 10 FAIL/82 skipped](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504)，后续提交 check-runs 并非同范围复核。
- **文档继续归档：** [K0 生产拓扑 §§19–25](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[权威停机证据验收表 §§1–8](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)（新文件）、[研究资料与来源索引 §§8–14](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[PA05 认证总账 §§80–82](PA05-CERTIFICATION-BASELINE-20261015.md) 与本入口继续保持同一 Draft PR #1071。已在 GitHub CI 证明的早期文档 HEAD `30886a61860d28b29fcdb04ed5d6998b03d36d03` **7/7 SUCCESS**；`4fccc321854d1d974e54aae148b0ccae190029d7` 及本次最新 HEAD 需按确切 SHA 独立核验，不借用早先绿灯。
- **新的具体覆盖事实：** main [PROCESS runtime](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/plugin-runtime-host.ts) 在 stop 时先从 map 删除条目、再等待 child exit；shutdown 只快照剩余 map keys，Host 插件停用事件使用 `void stop`。源码可推导 stop/shutdown/fork 竞态，**未隔离复现，非生产故障事实**。 [PROCESS runtime 现有测试](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/tests/protocol/process-runtime-host.test.mjs) 测执行/隔离/超时恢复但没有专项 stop/shutdown overlap；[#1074 的测试](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/tests/agent-line/pa05-host-shutdown-error-path.test.mjs) 仅覆盖 Host 清理步骤和拒绝新 HTTP，**不要让两条工程职责重叠**。
- **控制面结论：** 当前可连接 Railway 项目 5 服务的 `get_tracing` 显示 tracing / auto instrumentation 全部 OFF；项目 Webhook 0、Host TCP proxy 0。有效 draining/overlap、容器 PID 1/npm 的 SIGTERM 传递、所有可执行子进程和外部调用者、独立 stop receipts、真实生产 IdP/DBA/审计责任与 SQL session re-query **仍未验证**。不得为了取证自行开启追踪、读生产 logs/Secrets/SQL 或试运行 Validator。
- **分支清理边界：** 九条历史 PA05 docs 已合并 PR 的远端过程分支在精确 SHA 祖先关系、未保护和无当前 open PR 引用方面均审计通过，**实际远端删除尚未执行**（GitHub 当前连接器无 delete ref/workflow dispatch）。当前 #1071 文档、#1074 工程分支均保留 Draft/活动状态；不要擅自误删。
- **下一窗最优先的未完成工作：** 如无权威 Infra/SRE、DBA、IdP 接口证据，保持只读；仅在独立**非生产**权限和工程分支获得批准后实施 PROCESS concurrency 隔离验证。在此之前不得假装具备全局 Worker 停机、临时 CLI 或生产 Operator 认证。K0 / E01J4 / PA05-05 E01–E05 / W06 `NOT_SIGNED`；material WRITE `OFF`；Issues #988/#979/#913 OPEN。

**最新准确分支 HEAD：** 重新查询 GitHub PR #1071，不以上述任何历史 SHA 冒充永久最终状态。


## 六、2026-10-20 续跑 #04：独立真实 Node child 负面复现（最新增量）

本交接原内容和第五节保存当时的正确快照；新独立 [Draft PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 记录一次性 PROCESS child 的 **stop/shutdown in-flight 子进程尚存**和 **shutdown 后 fork 新 child** 两项**真正执行的隔离竞态复现**。首个测试 HEAD `6eeb01b01c680d1e0c90999c5a79fcc6776493c0`、[Actions #39426909610 / job #118641659592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426909610/job/118641659592) 已读原始日志，两个子测试 `ok #759/#760`、`globalStopCertified=false`。精确负面 JSON、原始阅读等级、字段输出时序小修和适用限制见 [K0 验收表 §9](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[研究索引 §15](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 及 [K0 生产拓扑 §26](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)。不得将绿色 CI 当作安全功能已修复。

本次 main `ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9`（其他治理线 #1080）/ Railway 新 Host `5c88b3df-8a6c-4225-976d-cc2ccda97d9e` SUCCESS、Host Online/1 running。#1071、#1074、#1081 均保持 Draft 未部署；K0/E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`，material WRITE OFF。下次先核验三个 Draft 当前 HEAD 及 CI，再复用本轮原文证据；没有独立生产权限证明不得运行 Validator 或进入真实维护。


## 七、2026-10-20 续跑 #05：单机 PROCESS 停机修复有界通过

- **工程序列**：[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 旧版真实负面复现（两个命题为 true）→ 新独立 [Draft #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) `agent/pa05-k0-process-runtime-stop-barrier-20261020`，HEAD `41b4fec7f153fe1df2df671a6f6030bd36d2b167`，新增 PROCESS `shuttingDown` admission barrier、in-flight `stop()` 跟踪、实例同一性清理；[原始 CI job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39428680055/job/118647684472) **5/5 exact-head checks SUCCESS**，`ok #759/#760`，真实 child shutdown 等待完成并阻止 shutdown 后 fork；**仅 `ISOLATED_PROCESS_STOP_BARRIER_BOUNDED_PASS`**。
- **未闭合**：timeout 导致 map 提前删除并发送 SIGKILL、旧 Child 完整身份/退出收据、父进程异常停机、Railway effective draining + npm signal、全域 Runner/外部 SQL 连接及真实 Human IdP/DBA/audit 均未得到认证；下次优先隔离验证 timeout/child-generation 路径而非重复研究。#1071 文档、#1074 顶层 shutdown、#1081 负面证据、#1082 局部修复四条 PR **全保持 Draft / 不合并 / 不部署**。
- **回收约束**：九条先前已合并 PA05 docs 过程分支只完成安全审计、实际远端删除未执行（连接器无对应能力）；当前四条活跃 Draft 绝不可清。生产 material WRITE 始终 OFF，K0/E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`，Issues #988/#979/#913 OPEN。

具体证据和数据来源阅读等级：[工作表 §10](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[研究索引 §16](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[拓扑 §27](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)。此处保留历史时间片，不把当前线上 main 写成永久稳定状态。


## 八、2026-10-20 续跑 #06：超时退出与异步 verifier 并发已实证关闭（有界）

- **当前关联工程：** [Draft #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 独立 PROCESS runtime 修复 HEAD `12dcfa1aec30e32247a865fe7c44267350e2f237`（保持 Draft、未生产部署）；先前 `c1e03419...` 补充任何实际 fork child 的 `close` 跟踪、timeout SIGKILL 退出等待与代际防复用。两轮各 **5/5 exact SHA CI SUCCESS**，真实 [Platform #39431045554 / job #118655876047](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39431045554/job/118655876047) 六项 local PROCESS regression `ok #759–#764`，1091 total/1090 passed/1 skipped/0 failed；包含异步 Sigstore 单包并发验证 `verifyCount=1/forks=1`，在验证 pending 时 stop `forks=0`。**只是 `ISOLATED_PROCESS_LIFECYCLE_BOUNDED_PASS`，不是全球停机或生产认证。**
- **准确接续索引：** [K0 工作表 §11](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[拓扑 §28](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[研究与参考索引 §17](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[认证总账 §85](PA05-CERTIFICATION-BASELINE-20261015.md)。保留原 E01J4G–J4J PostgreSQL/OAuth/Lease/NIST 参考遗产，不重复造来源。
- **下轮实际待证：** 已有六项局部证据之外，独立 parent SIGKILL、IPC 错误、verifier 长时挂起/关闭截止时间、Railway effective drain 和真实 PID1，仍未获独立证据。组织 infrastructure/IdP/DBA/SQL/audit Owner 缺失时不进入生产 K1/K2，不开启 material WRITE 或清 stale lock。
- **生产状态快照：** 本轮只读 GitHub main `ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9`，Railway Host deployment `5c88b3df-8a6c-4225-976d-cc2ccda97d9e` SUCCESS；与最新 #1082 不同，#1071/#1074/#1081/#1082 均 Draft。**下次须重新核对，不能假设该 main 永远最新**。

K0/完整 E01J4/PA05-05 E01–E05/W06 均 `NOT_SIGNED`，production material WRITE `OFF`；Issues #988/#979/#913 OPEN。九条历史 PA05 docs merged 分支只审计未删除，当前 Draft 分支不动。


## 九、2026-10-20 续跑 #07：verifier 无限等待与 IPC 异常完成本地有界验证

- **最新工程线（非生产）**：独立 [Draft #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082)，HEAD `c15ce1f5225272b26d14f5b564a2a6b9f0582270`，增加本机 verifier Promise 撤销通道，使 stop/shutdown 可不等 verifier 的无限等待并防止 late fork；主动 IPC disconnect 的 disposable child invocation 失败后能够收尾。**注意这不证明 verifier 本身外部工作已取消。**
- **精确原始测试证据**：[Actions #39432525667 / job #118660946764](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39432525667/job/118660946764) 日志九项专项 `ok #759–#767`，1094/1093 PASS/1 SKIPPED/0 FAIL，`globalStopCertified=false`。完整 URL/阅读等级/测试限制见 [工作表 §12](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)、[拓扑 §29](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md) 和 [研究索引 §18](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)。
- **剩余真正未完成**：父 Host 突然死亡的组织编排器子进程回收与凭证/会话吊销；真实服务有效 drain、SIGTERM delivery / PID1；Human IdP/DBA/审计实际责任及签发；不可用一台机器的 Node Promise 代替全域 `STOP_CONFIRMED`。没有可监督清理保证时，本轮没有故意制造孤儿进程试验。
- **4 PR 均独立 Draft**：#1071 文档、#1074 顶层 Host 修复、#1081 两条旧负面复现、#1082 局部 PROCESS 修复；都没有合并/生产部署。九条已合并 docs 过程分支仍只完成 SHA 安全审计，远端实际删除未执行。认证维持 K0/完整 E01J4/PA05-05 E01–E05/W06 NOT_SIGNED、material WRITE OFF，Issues #988/#979/#913 OPEN。

下次应先刷新最新 GitHub main / PR exact HEAD/CI / Railway；后续只要不涉及真正可信 Infra/SRE/DBA/IdP 签名，不可宣称 K0 通过。
