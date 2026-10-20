# PA-05｜E01J4G–J4J 新聊天窗口简短交接入口（2026-10-20）

**文档类别：HISTORICAL_SNAPSHOT / AGENT_WINDOW_HANDOFF_ENTRY。** 配套完整原文来源与决策索引：[E01J4G–J4J 详细参考索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)；[独立 Agent 当前入口](HANDOFF.md)；[PA05 认证总账 §§62–66](PA05-CERTIFICATION-BASELINE-20261015.md)。老资料请继承 [J2–J4F 前窗口原始参考索引](PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)，**不重做**。

## 0.1 最终合并后验收（2026-10-20，优先于下方历史快照）

- **PR #1057 已 MERGED**：最终工程 HEAD `1fba63927a80f2e9658b8608bb5a92a9849abcdf`，合并/main SHA `e123924af8bdd1214a4aec6bfaf358c5afb9f445`。
- 最终工程 HEAD：45/45 checks SUCCESS；[PR-head 三 PostgreSQL18 #39360366722](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39360366722)，job `118424890768`，28/28 PASS、0 failed、0 skipped。J4J 正向/负向 marker 实际存在。
- 合并后 main：39/39 checks SUCCESS；[main 三 PostgreSQL18 #39361578987](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39361578987)，job `118428747522`，28/28 PASS、0 failed、0 skipped。
- Railway 自动部署 `91ac2596-8e4f-4863-a208-5eca3d5c4931` 对应 `main@e123924...`，SUCCESS / Online，1 running / 0 crashed，0 warnings / 0 critical；没有待处理部署。工程分支 `agent/pa05-e01j4j-cooperative-host-lock-20261019` 已自动删除。
- 旧 HEAD `16e002...` 的 43 SUCCESS / 2 CANCELLED 是历史快照。两项旧取消的具体原因未能证实：两 workflow 均启用 `concurrency.cancel-in-progress: true`，但旧 job 日志现返回 BlobNotFound；不伪造原因。最终 HEAD 45/45 与 main 39/39 全绿。
- **认证边界不变：** J4J 仅 ENGINEERING_BOUNDED_PASS，不代表多 Worker 全局停机；完整 E01J4、PA05-05 E01–E05、W06 仍 NOT_SIGNED；真实生产 IdP/DBA/CLI/集中审计与 PG+JSON 原子性未证明；#988/#979/#913 OPEN，production material WRITE OFF。

## 1. 原始交接开始时的历史快照（已由 §0.1 最新事实取代）

- **GitHub：** https://github.com/jiangxng/EVO-App-Platform 。2026-10-20 交接开始时 `main@5919e0147232fef1ddfc4f7e9a38b67969100bcf`；E01J4J 当前**唯一活动工程分支** `agent/pa05-e01j4j-cooperative-host-lock-20261019`，原始工程 HEAD `16e00238026f015fc233f38207b8d0c38ee480db`，对应未合并 [PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057)。本轮为了保存交接文档已追加提交，**新窗口必须以 GitHub 实际 HEAD/merge 状态替换原始工程 HEAD**；不要直接使用旧 SHA 合并。
- **最新真实结果（本次交接于 2026-10-20 再次读取原始 GitHub API/log）：** 原工程 HEAD 的 45 项 GitHub Actions **43 SUCCESS / 2 CANCELLED / 0 FAILURE / 0 QUEUED**；物理三 PostgreSQL18 [Actions #39281032761](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032761) job `118155037302` **28/28 PASS，fail 0，skipped 0**，新增 `PA05_E01J4J_COOPERATING_HOST` marker 真出现。这不是全 PR 45/45 成功。取消项 [#39281032878](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032878)（Memory Review）、[#39281032769](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39281032769)（Personal Agent P1.3.1 Experience），取消原因未判定，不能忽略。
- **GitHub 平台事件已恢复**：2026-10-19 官方 Actions/Pages/Webhooks [原始 incident #8tzbpcnl75jp](https://www.githubstatus.com/incidents/8tzbpcnl75jp) 从 **15:49 UTC** 开始调查，**16:56 UTC** 标记 Resolved；2026-10-20 官方首页 All Systems Operational。旧聊天的“45/45 QUEUED”是当时的历史状态，**不可作为现在的阻断描述**。完整事件的逐阶段时间和证据等级见详细索引。
- **Railway：** Ledger Configurator 仍是 `main@5919e014...`，部署 `5b921757-ca9e-4b48-9eba-595a5b6f6459` SUCCESS、Online，1 运行/0 crashed（10-20 连接器复核）；**没有手动部署、更改生产密钥或启用生产 material WRITE**。
- **未关闭：** #988 / #979 / #913 均保留 OPEN（10-19 原始检查）；完整 PA05-05 **E01–E05 NOT_SIGNED**、整个 **E01J4 NOT_SIGNED**、PA-05/**W06 NOT_SIGNED**；生产 WRITE **OFF**。后续必须重新检查 Issue 状态。

## 2. 固定阶段、已确认工程方案和测试边界

| 工程阶段 | 当前可靠结果 | 采用方案与不得声称的内容 |
| --- | --- | --- |
| E01J2–J4F（历史窗口） | **17→24/24，工程 BOUNDED_PASS** | SQL Host/Worker 授权、真实 TCP 断链、SQL FENCE、E01I 启动隔离、OS SIGKILL 恢复，继承旧研究，不重复 |
| [J4G PR #1053](https://github.com/jiangxng/EVO-App-Platform/pull/1053)，合并 `9a3edf8d` | **25/25，MERGED** | 受信 HUMAN Session + Host-scoped Authorization + Secrets Provider；生产 IdP/真实 DBA 未签 |
| [J4H PR #1055](https://github.com/jiangxng/EVO-App-Platform/pull/1055)，合并 `da8188c7` | **26/26，MERGED** | 0700/0600 + fsync 本地非秘密审计；不能当签名或跨 Host 审计 |
| [J4I PR #1056](https://github.com/jiangxng/EVO-App-Platform/pull/1056)，合并 `5919e014` | **27/27，MERGED** | 原持久状态 + 专属一轮维护锁，独立受控恢复已 FENCED UNINSTALL；锁不约束正常 Host |
| **[J4J PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057)，MERGED** | **ENGINEERING_BOUNDED_PASS；PR HEAD 45/45 SUCCESS，main 39/39 SUCCESS；两次真实三 PostgreSQL18 均 28/28、0 skipped** | 仅 opt-in 时正常 Host 与 J4I 共用独占锁；真实 Node Host 默认 OFF、二号 Host 排斥、维护拒绝、SIGTERM 正常释放、SIGKILL/非零退出留锁；**未取得全 Worker/多节点停机证明** |
| 完整 E01J4 / E01–E05 / W06 | **NOT_SIGNED** | 需要真实组织 IdP/Session 撤销、DBA 凭据和轮换、独立安全运行手册/CLI、集中审计、多 Worker 证明、完整 Human/Agent/Provider E2E |

- J4J 代码入口：`manager/pa05-read-owner-cooperative-host-lock.ts` + `manager/server.ts`，默认开关 `APP_PLATFORM_PA05_E01J4J_COOPERATIVE_HOST_LOCK=OFF`（不设置同样 OFF），显式 `OPT_IN` 才在读取原 `APP_PLATFORM_STATE_FILE` 之前锁定与 J4I 相同目录。**绝不可拿文件锁当生产多副本/分布式一致性锁**。
- J4J 测试：`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`，CI `.github/workflows/agent-pa05-cross-database-admission.yml` 目标 28/28 且 0 skipped。因为 `manager/server.ts` 共享 Host 变更，引发广泛 GitHub 检查；PR 必须全部适用门禁完成方可合并。
- 保留真实负证据：J4G 后 main 的 [#39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) 曾触发 `postgres.js 3.4.9` TCP `null.write` 原进程崩溃（21/20/1）；**后续 CI 绿并不表示修复**。J4I 开发过程还真实遇过 TypeScript Stats 重载和测试 `umask` 位置错误，均在 #1056 原 PR 修正、详细历史索引保留。
- 用户明确要求持续“继续”推进、保留验收里程碑、真实 CI、不把假权限/假生产身份签成 PASS；一个活动 PR/短闭环，完成再合并并删除工程分支；**不得触碰 BEX/CP03/Eidos/2D、`project.status.json` 或生成的 `HANDOFF-LATEST`**，不得自行启用生产 WRITE。

## 3. 下一项独立安全门禁（J4J 工程闭环之后）

1. 先刷新 #988 / #979 / #913 的实际状态与现有 PA05 认证总账；不得把 J4J 的本地 POSIX 文件锁升级成多 Worker/多节点全局停机证明。
2. 研究可信多 Worker 停机证明所需的权威控制平面/租约、独立身份、故障与网络分区边界；优先复用已归档研究，只对缺口和冲突定向查证。
3. 单独建立真实生产 Human IdP/Session 撤销、DBA 登录权限/凭据轮换、运维 CLI/Runbook 与集中审计的证据门禁。缺少组织授权时只定义契约和负测试，不访问真实秘密或生产 DB。
4. 保持完整 E01J4、PA05-05 E01–E05 与 W06 为 NOT_SIGNED；production material WRITE OFF；不自动删除异常退出后遗留的锁。
5. 保持一个短闭环分支/PR，准确 HEAD 的全部适用 CI 通过后再合并；不修改 `project.status.json`、生成的 `HANDOFF-LATEST`、BEX/CP03/Eidos/2D 或其他窗口。

## 4. 资料与保存约束

配套 [详细索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 明确每条标题、原始 URL、访问日期、主题、阅读等级（**已读 GitHub/API 原文、已读外部官网原文、历史转引、未验证**）、正/负原始测试、方案取舍、证据冲突、源代码及文档映射。历史 PostgreSQL 官网原文只可经旧索引继承；本窗口未重读，不补造来源。没有新增截图/附件或生产凭据。本交接只在**当前 PA05 工程分支**存档，不覆盖并行窗口的权威文件。

**新窗口请特别留意**：本档的原始工程 HEAD `16e002...` 是 28/28 真实正证据锚点，不是归档完成后最新 HEAD。当前活跃 PR #1057 是否可合并，取决于**实际最新 HEAD** 的完整门禁。
