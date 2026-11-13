# EVO-App-Platform / CV04 Window 10 — 旧窗口工作上下文、来源等级与执行状态恢复增量（2026-11-13）

> **性质：恢复增量，不是重新研究 / 权限批复 / 部署完成声明。** 当前恢复观察基线为受保护 main **59078f362273cc83b524c6ee88498811c9a293a2**，复核时点 2026-11-13（UTC+08）。应在每个接续窗口重新读 main、PR 和 Actions。原证据以 [Window 09 短入口](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md)、[Window 09 研究索引](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md) 和 [11-12 86K 历史索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md) 为权威；本文件**不复制、修改或取代**它们。2026-11-13 新窗口恢复范围 = 用户提供的 #08/08 消息、可检索的此前聊天摘要/明确要求、仓库已存交接原文、GitHub 当前 PR/Issue/Actions/源码、定向 Railway 官方文档检索。**未取得完整原始旧聊天逐字导出**，不能把摘要复原成未经证实的旧聊天原句。

## 1. 旧聊天要求 / 已确认决策（C = 聊天要求，非实现证明）

| 编号与来源 | 恢复的明确要求 / 决定 | 当前执行边界 |
| --- | --- | --- |
| C01 · 2026-11-06 用户历史要求（此前聊天上下文） | 不是另一套框架；在现有 Eidos + Platform 中抽象列表型业务应用共享的导入/导出、视图、筛选/快速筛选、图表/看板、权限与移动体验；个人 Agent 必须能通过现有受管动作操作，重视 AI Native；形成分步可验收文档、参考资料和入库成果。 | 是产品设计指令，不代表每项多视图/看板功能已实现或正式生产认证。复用 CV02/CV03/CV04 既有 PR，不再平行发明 Owner / Agent 平台。 |
| C02 · 2026-11-11～13 用户后续准入要求（此前聊天/本次复述） | 不必为可以安全独立推进的列表基础工程反复人工审批；但真实生产授权、Railway Operator、PA05、AuthorizationProvider、DB/Security 的法定/独立 Owner 签署不得由工程 CI 自批。方案 A：真实同一个 PG ACID T0 下的权威+不可变 Outbox/epoch/sourceGeneration；关闭未认证操作。 | “无需逐步工程审批”**不等于**可自行打开 N1/SAVE/EXPORT、生产迁移、重启/删除旧资源。Owner Gate #1212、Operator Gate #1092 继续 BLOCKED。 |
| C03 · 2026-11-13 Window 09 八步（用户本次提供的旧窗口 #08/08 完成记录） | 历史 Railway 流程与当前东京 DEV/PREVIEW 严格分离；十份旧 Workflow 原文留存；七脚本显式 HOST；每 PR 持续防回退；不重复清理已归档 Railway；下一窗口先核查合并 SHA/镜像/Owner，再动工。 | #1300–#1305 已合并。只有新的可重现缺口或外部授权新证据才值得开下一条工程 PR。 |
| C04 · 2026-11-13 当前恢复请求 | 先恢复旧研究及明确决定，再与代码、PR、Actions 分层对照；留在现有 docs 体系；独立分支/PR，不碰 #1184 文件；缺失来源定向检索、不得猜测。 | 本文标注 C=聊天，A=源码/文档原文，B=GitHub 元数据/执行原日志，S=检索片段，U=未获证明，D=我们的方案判断。 |

## 2. 从“聊天提出 → 已实现 → 已验证”逐项对照

| 事项 / 用户意图（C） | 代码、文档或合并事实（A/B） | 本次重新核验与证据上限 |
| --- | --- | --- |
| 复用 Eidos 列表与 Agent 受管 READ | [#1169](https://github.com/jiangxng/EVO-App-Platform/pull/1169)（往来/字典 Eidos View）、[#1170](https://github.com/jiangxng/EVO-App-Platform/pull/1170)（详情返回视图条件）、[#1173](https://github.com/jiangxng/EVO-App-Platform/pull/1173)（Human/Agent READ 验收）均 MERGED，精确合并 SHA 分别为 79d2fe3f1789b20ced440dff031815694961c654、33d32d5dbb240974edb2e4eb3ccf2bc73f99d3dc、870bd80bbe3279e5ebe60ee356f598870ede708b。 | B：本次复核 PR merged/merge SHA；**未在本窗口重跑浏览器或自然语言 Agent**。历史“已验证”范围遵从对应 PR 原证据。 |
| 当前页 CSV 是现有业务能力 | [#1263](https://github.com/jiangxng/EVO-App-Platform/pull/1263) MERGED，SHA 8a7d3d6811ba7eccfd3d1d4984a82d77dc8d81ed；既有 Host + Chromium 1280/390px 验收记录。 | B：本次核对合并；不将当前页 CSV 扩大解释成后台跨页正式 EXPORT。 |
| 隔离 PG 导出审计/鉴权/Host-Worker Gateway/TTL | [#1272](https://github.com/jiangxng/EVO-App-Platform/pull/1272)、[#1273](https://github.com/jiangxng/EVO-App-Platform/pull/1273)、[#1274](https://github.com/jiangxng/EVO-App-Platform/pull/1274)、[#1275](https://github.com/jiangxng/EVO-App-Platform/pull/1275)、[#1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277) 均 MERGED；实现路径/原始 PG Job markers 和限制详见 [11-12 索引 §2–5](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。 | B：本次复核这些 PR 的合并状态与 SHA；旧窗口有隔离 PG CI 原证，但本窗口未重跑。**不构成**正式真实 PA05/T0 + 五方 Owner 生产认证。 |
| Railway→东京部署入口及风险剥离 | [#1300](https://github.com/jiangxng/EVO-App-Platform/pull/1300) MERGED 59fe344ab732ba564ff45b34e59e0c4ef3d9214b；[#1301](https://github.com/jiangxng/EVO-App-Platform/pull/1301) MERGED e1c24f2355065de0f7f9fd0e482b1c2bd364acfe。 | B：本次读取两 PR 的合并元数据；旧 Railway offline 与 Source 仍连接是**历史只读取证**，本次未重新调用 Railway 控制面。 |
| 十份旧 Actions 不得继续自动执行 | [#1302](https://github.com/jiangxng/EVO-App-Platform/pull/1302) MERGED 37448159ba4ae83aca55c79a50b96d9a6373acfb；[归档 README](../../archive/railway-live-production-proof-actions-20261113/README.md) 已读原文。 | A/B：归档路径/原件列表本次已直接读取；10/10 Blob SHA 相同来自旧窗口 GitHub 原始核验，本次**未逐一重新哈希**。 |
| 遗留 CLI 不应静默请求旧 Railway | [#1303](https://github.com/jiangxng/EVO-App-Platform/pull/1303) MERGED 0c5642a50cabe640c13c449c66652f5175aaf683；[协议回归源码](../../../tests/protocol/legacy-railway-proof-host-opt-in.test.mjs) 已读原文。 | A/B：当前回归源代码检查 HOST 强制非空、无 HOST 子进程退出；旧窗口已经运行实测，本窗口未重跑 CLI 子进程。 |
| Workflow-only PR 仍应阻断 Railway 回退 | [#1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304) MERGED e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447；原 Project Continuity CI 增加无 paths 过滤的守卫。 | A/B：协议测试源已读、PR 已复核；精确 main checks 见 Window09 原索引。 |
| 八步最终收口、保存原始证据 | [#1305](https://github.com/jiangxng/EVO-App-Platform/pull/1305) MERGED main **59078f362273cc83b524c6ee88498811c9a293a2**；[最终评论](https://github.com/jiangxng/EVO-App-Platform/pull/1305#issuecomment-6843989707)；三份文档变更。 | B：本次独立查询 GitHub main ref、commit changed files、全部 4 个 check-runs：**3 SUCCESS + 1 SKIPPED**；[#43365567557 preflight 原始 Job 日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43365567557/job/131689037098) 确有 EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE；旧过程分支搜索为空。 |
| 东京“实际镜像”必须与源码 HEAD 分开 | [东京真实 Deploy #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)；物理**最后经部署日志证实**的 GHCR tag：ghcr.io/jiangxng/evo-app-platform:b58e660fdc01f98e0840247115f7ca3b8c43c0b3。 | B：本次重读原始 Job 日志包含该 tag，main 的本次文档提交明确 SKIP。**未独立 SSH/查询服务器当前容器 digest**，故是“最后已证实部署”，非持续实时服务保证。 |
| CV03/CV04 正式生产授权 | [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) OPEN；[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) OPEN 且 [Reviews API](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews) 返回 []。 | B/U：本次重新读取。五个已勾选“决策问题”不是五方独立批准。N1=NOT_CERTIFIED、SAVE OFF（正式 POST 403 / 未注册 GET 404）、CV04 后台跨页 EXPORT OFF/未注册继续为项目 Gate；**未在本次真实生产发 HTTP 复测**。 |
| 旧 Railway 资源的安全退役 | [Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) OPEN，未获有效 Autodeploy 开关、消费者、备份/恢复与 PID1/stop 收据。 | B/U：本次重读 Issue；旧窗口只读观察五服务 offline 和 Source 关联，不能推出新 Push 不会自动部署、旧消费者清零、可以解绑/删除卷。 |

## 3. 来源索引与阅读级别（本恢复窗口真实访问；旧来源不升级）

| 等级 / 访问日 | 标题与原始网址 | 关键结论及用途 |
| --- | --- | --- |
| A · 2026-11-13 | [Window09 final handoff](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md)、[Window09 研究和决策索引](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)、[Window08 上一交接](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md) | 全文或当前工作所需的有界原文已读；复用旧窗口原始决策、精确合并和资料层级，不反推未在仓库保存的聊天句子。 |
| A · 2026-11-13 | [11-12 大索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)、[N1 Owner T0 候选合同](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md) | 恢复 PG/Worker/Lease/Gateway 的源码地图、方案 A 的限制与真实独立 Owner 决策顺序；历史来源仍按原索引的读原文/片段等级。 |
| A · 2026-11-13 | [Railway 原始 YAML 归档入口](../../archive/railway-live-production-proof-actions-20261113/README.md)、[显式 HOST 与归档防回退测试](../../../tests/protocol/legacy-railway-proof-host-opt-in.test.mjs) | 已读实际当前文本；再确认原目录、guard 代码；未在本恢复窗口重新跑脚本或独立对 10 个 Blob 做 SHA 校验。 |
| B · 2026-11-13 | [GitHub main@59078f](https://github.com/jiangxng/EVO-App-Platform/commit/59078f362273cc83b524c6ee88498811c9a293a2)、[PR #1300–#1305 汇总入口](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)、[东京 main run #43365567557](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43365567557)、[东京旧实际 deploy #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425) | 直接读 GitHub 结构元数据及实际日志；证实 3 success+1 skipped、物理 last-deployed tag 与源码 SHA 不同。 |
| B · 2026-11-13 | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1184 Reviews](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews) | 直接复核 OPEN、Review []，授权不可自动放行。 |
| S · 2026-11-13 **本恢复窗口新增定向查询** | [Railway / Controlling GitHub Autodeploys](https://docs.railway.com/deployments/github-autodeploys)、[Disable automatic deployments 章节](https://docs.railway.com/deployments/github-autodeploys#disable-automatic-deployments) | 本次 web 检索结果展示了较完整官方索引摘录：服务 Settings 可 Disable/Enable；Repo/branch 连接并不自动证明账号实际 Enable 状态，Wait for CI 是另外的设置。**原网页正文 direct-open 因 text/markdown 资源格式失败，仍标 S 而不是 A 原文已读**。不能据此推断本项目实际启用/关闭。 |
| D / U | 方案取舍与真实环境状态 | D 是依据上述事实作出的工程选择；U 是真实 Operator/Owner、有效设置、消费者、备份、两物理 Host 和生产 Principal 仍未取得的外部事实；绝不能写成原始来源核验 PASS。 |

历史详细项目地址、原始 PR/Action Job/SHA、章节位置及已读层级继续见 [Window09 索引 §1–5](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md) 与 [11-12 大索引 §1–5、后续 §16–26](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)；本文件**不为未访问的资料编造访问日或截图路径**。

## 4. 采用、排除方案（G=来源事实；D=工程判断）

- **采用（D）：** 当前 Eidos+Platform、Domain Owner+Host ActionRouter+Personal Agent 受管动作；同一个真实 PostgreSQL ACID T0 权威/epoch/sourceGeneration/不可变 Outbox 是已选择的生产接线方向，但其所有权、schema、SQL roles、Producer/KMS 和 rollback 仍**待 Owner 批准**。已做的隔离 PG/签名 Gateway/租约不是正式应用已上线。
- **采用（D）：** 腾讯东京 DEV/PREVIEW 使用现有 GitHub Actions→GHCR SHA→东京 Lighthouse；历史 Railway 10 YAML 保留不可执行归档，7 CLI 显式 HOST fail-closed、Project Continuity 对 PR 全路径扫描。G：历史旧地址与当前 Basic Auth/demo Principal 不同；禁止直接 URL 替换假装浏览器业务 PASS。
- **排除（D）：** Railway offline=可销毁、Source attached=Autodeploy Enabled、0 HTTP buckets=无消费者、CI all-green=生产签署、#1212 checkbox=实名 APPROVED、当前 main SHA=服务器已部署这些错误推论。
- **不再做（D）：** 无新需求/外部收据时继续拆碎开发相同 PG Gateway、复制 86K 研究材料、重归档已收口 Workflows、另建第二个 Railway 退役 Issue；既有 #1092/#1212 是明确继续入口。

## 5. 未能恢复/验证的关键项与后续行动（U；按依赖顺序）

1. **真正原始旧聊天全量逐字记录：未获得可读取原件。** 已使用用户本次提交的 #08/08 摘要、此前聊天可恢复摘要、仓库当前 Window08/09 原始交接。若历史聊天涉及未入库的孤立网页、工具输出、未提供的截图、私有 Railway 控制台原始画面，不能凭摘要补造；仅在出现具体决策冲突时定向补查。
2. **Railway Infra Operator #1092：** 两旧 Source 的真实有效 Autodeploy 值、触发分支/Watch paths、相关消费者、卷/旧数据、备份/PITR/恢复演练、生产 PID1/SIGTERM/独立 Supervisor 停机签字均未取得。所需非密证据为 service/env/deploy ID、观察 UTC、有效开关与来源、操作者+审核者、作用范围、回滚收据；不能改 Production 服务、解绑 Source、清卷或主动验证造成真实 deploy。
3. **生产 Owner #1212 与并行 #1184：** 缺 PA05 Lifecycle、AuthorizationProvider、DB/PG、Security/Ops、Domain 五方独立具名 Approval PR/环境/时间，缺真实 T0 全 Scope+Outbox、KMS Producer、两物理 Host fail-closed、真实撤权/切企业验收。#1184 三份受管文件禁止覆盖；未满足时 CV03 N1=NOT_CERTIFIED、SAVE OFF、CV04 后台 EXPORT OFF。
4. **业务浏览器与发布状态：** 最后能从 GitHub job 证实的物理东京镜像是 b58e660...；持续运行容器 digest/真业务身份+会话、401/200、撤权、390/1280px 的新环境验收未在本窗口重新取得。需有授权的测试企业/Principals 后才定向恢复历史专项证明。
5. **只有在外部证据到位或发现新的可复现源代码缺陷时**从新 main 建独立分支、Draft PR、精确 HEAD CI、Ready、Merge、main CI、Tokyo preflight/deploy 的真实日志、Branch Hygiene；否则保持现有 Gate，不以新 PR 数量代替进展。

## 6. 文件所有权与可接续入口

- CV04 Domain：apps/business-dictionary/export-jobs.ts、export-job-pg-store.ts、export-job-pg-audit.ts、export-job-pg-sql-lease.ts、export-job-pg-maintenance.ts、export-job-pg-dispatch.ts；tools/cv04-isolated-signed-export-gateway.mjs。状态以 11-12 大索引、最新源文件及 Owner 为准。
- CV03 T0：manager/cv03-n105b-authority-t0-pg.ts、manager/cv03-n105b-pa05-host-lifecycle.ts；目前正式生产接线并未凭隔离 QA 获准。参考上面的 [N1 Owner T0 候选合同](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)。
- 当前东京与历史 Railway：docs/operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md、.github/workflows/evo-tokyo-dev-deploy.yml、.github/workflows/project-continuity.yml、docs/archive/railway-live-production-proof-actions-20261113/。
- 并行 #1184 受管的 **三份文件不改**：COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md、CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md、CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md。
- 本文件只作**新增旧聊天恢复追溯**及相邻 Window09 入口的链接，不改变代码、workflow、密钥、数据库、部署或任何 Owner Gate。

> **恢复结论：** 八步工程/最终交接已由 GitHub 合并记录与执行原证确认；原研究与技术决策大多已保存在仓库，可直接复用。新增恢复工作只补“C/A/B/S/U/D 证据对照与当前实际复核范围”，不伪称已取得缺失的真实外部授权。