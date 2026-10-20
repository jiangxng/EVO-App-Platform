# PA-05｜E01J4G–J4J 新聊天窗口简短交接入口（2026-10-20）

**文档类别：HISTORICAL_SNAPSHOT / AGENT_WINDOW_HANDOFF_ENTRY。** 配套完整原文来源与决策索引：[E01J4G–J4J 详细参考索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)；[独立 Agent 当前入口](HANDOFF.md)；[PA05 认证总账 §§62–66](PA05-CERTIFICATION-BASELINE-20261015.md)。老资料请继承 [J2–J4F 前窗口原始参考索引](PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)，**不重做**。

## 1. 必须先核的事实（不是永久实时状态）

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
| **[J4J PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057)** | **28/28 真实 PG18 成功、45 工作流中 2 CANCELLED、仍 OPEN** | 仅 opt-in 时正常 Host 与 J4I 共用独占锁；真实 Node Host 默认 OFF、二号 Host 排斥、维护拒绝、SIGTERM 正常释放、SIGKILL/非零退出留锁；**未取得全 Worker/多节点停机证明** |
| 完整 E01J4 / E01–E05 / W06 | **NOT_SIGNED** | 需要真实组织 IdP/Session 撤销、DBA 凭据和轮换、独立安全运行手册/CLI、集中审计、多 Worker 证明、完整 Human/Agent/Provider E2E |

- J4J 代码入口：`manager/pa05-read-owner-cooperative-host-lock.ts` + `manager/server.ts`，默认开关 `APP_PLATFORM_PA05_E01J4J_COOPERATIVE_HOST_LOCK=OFF`（不设置同样 OFF），显式 `OPT_IN` 才在读取原 `APP_PLATFORM_STATE_FILE` 之前锁定与 J4I 相同目录。**绝不可拿文件锁当生产多副本/分布式一致性锁**。
- J4J 测试：`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`，CI `.github/workflows/agent-pa05-cross-database-admission.yml` 目标 28/28 且 0 skipped。因为 `manager/server.ts` 共享 Host 变更，引发广泛 GitHub 检查；PR 必须全部适用门禁完成方可合并。
- 保留真实负证据：J4G 后 main 的 [#39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) 曾触发 `postgres.js 3.4.9` TCP `null.write` 原进程崩溃（21/20/1）；**后续 CI 绿并不表示修复**。J4I 开发过程还真实遇过 TypeScript Stats 重载和测试 `umask` 位置错误，均在 #1056 原 PR 修正、详细历史索引保留。
- 用户明确要求持续“继续”推进、保留验收里程碑、真实 CI、不把假权限/假生产身份签成 PASS；一个活动 PR/短闭环，完成再合并并删除工程分支；**不得触碰 BEX/CP03/Eidos/2D、`project.status.json` 或生成的 `HANDOFF-LATEST`**，不得自行启用生产 WRITE。

## 3. 最紧迫的下一实际任务

1. 按 `AI-BOOTSTRAP.md` → `project.status.json` → 所指 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json` → `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` 恢复项目权威；随后读取本短入口、详细索引、总账 §66 和 PR #1057 的**实时 HEAD/CI**。不要误把 10-19 的 queued 快照当今天状态。
2. **沿用原 PR #1057，不新开同功能分支**。因本次新增交接文档造成 HEAD 变化，检查准确 HEAD 的 GitHub Actions。原工程 HEAD 已有 28/28 真 PostgreSQL18，但当时 2 条 cancelled；检查取消原因、是否必需门禁，针对性完成检查。若新 HEAD 再起 CI，则用新 HEAD 的**全部实际结果**，不得复用旧 43/2 作为新 HEAD 已完成。
3. 全部适用 CI 成功后依现有规范合并 main，核对 merge SHA、主线 CI、Railway 自动部署及工程分支是否清理，写回认证 §66/HANDOFF 的**真实精确结果**。若不满足门禁则 PR 保持 OPEN；不跳过/伪造全绿。
4. J4J 工程闭环后再研究独立可信多 Worker 停机/租约/控制平面、真实 Human IdP 和 DBA role/credential custody。缺组织授权时只做边界评估，不处理真实秘密/生产 DB；E01J4/W06 继续 NOT_SIGNED。

## 4. 资料与保存约束

配套 [详细索引](PA05-E01J4G-J4J-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 明确每条标题、原始 URL、访问日期、主题、阅读等级（**已读 GitHub/API 原文、已读外部官网原文、历史转引、未验证**）、正/负原始测试、方案取舍、证据冲突、源代码及文档映射。历史 PostgreSQL 官网原文只可经旧索引继承；本窗口未重读，不补造来源。没有新增截图/附件或生产凭据。本交接只在**当前 PA05 工程分支**存档，不覆盖并行窗口的权威文件。

**新窗口请特别留意**：本档的原始工程 HEAD `16e002...` 是 28/28 真实正证据锚点，不是归档完成后最新 HEAD。当前活跃 PR #1057 是否可合并，取决于**实际最新 HEAD** 的完整门禁。
