# CV04 / Window 09 / 2026-11-13 — #01/08～#08/08 研究资料与决策证据索引

> **配套短入口**：[Window 09 最终交接](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md)。继承 [历史完整索引 `1–26](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)，原本的 86K 字历史证据不复制、不替换、不倒改。2026-11-13 本窗口以 GitHub/Railway 连接器读取项目源记录；本 `#08/08` 的核验起点是受保护 `main@e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447`（本轮交接 PR 合并后会有新 SHA）。

## 1. 来源等级与本轮真实访问范围

- **A / 已读原文**：在本轮实际拉取的 GitHub `fetch_file` 内容（源文件、现行文档、Workflow）、完整或有界片段；不是只有搜索摘要。对于 191 个活动 Workflow 的原文逐份扫描，完成于 #04/08，#08 再读文件树与最终 Continuity 门禁。
- **B / 控制面或执行原证**：GitHub PR 元数据、精确 SHA/check-runs、Actions Job 和原始日志，Railway 当前只读 `get_service_config / environment_status`；这不等于真实 Operator 签署、实时业务流量或服务器 PID1 证明。
- **S / 仅搜到标题、摘要或候选 URL**：本轮 #08 尝试 Railway 官方 `search_docs` 能取得 `Controlling GitHub Autodeploys` 的章节名称/URL；对完整页面调用 `fetch_docs` 返回 `pageFound=false`，外部页面读取亦受资源格式限制。**这一次不标成已读官方全文，也不从搜索摘要断言账户的开关值**。既有索引 `26` 对更早窗口的阅读记录保留原 provenance。
- **D / 项目判断**：采用、排除方案与后续动作属于本轮工程判断，而非来源直接的事实。`NOT_SIGNED / UNVERIFIED / PENDING` 保持原始语义。

| 编号、查阅日、等级 | 已访问资料原始地址 / 阅读粒度 | 实际关键发现（G=来源事实） | 本项目的具体用途 |
| --- | --- | --- | --- |
| S01 · 11-13 · B | [GitHub `main` Ref](https://github.com/jiangxng/EVO-App-Platform/tree/main)、[合并 #1300](https://github.com/jiangxng/EVO-App-Platform/pull/1300)、[#1301](https://github.com/jiangxng/EVO-App-Platform/pull/1301)、[#1302](https://github.com/jiangxng/EVO-App-Platform/pull/1302)、[#1303](https://github.com/jiangxng/EVO-App-Platform/pull/1303)、[#1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304)；每项查 PR merged、HEAD、merge SHA 和主线 check-runs | G：五项均 MERGED，精确 merge SHA 下述第 2 节；#1304 的受保护 main 检查 4 成功 + 1 部署跳过 | 事实性的里程碑表，防止“绿灯=已发布”的误报 |
| S02 · 11-13 · A | [当前东京发布权威文档](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)、[东京 CI-Gated 源码](../../.github/workflows/evo-tokyo-dev-deploy.yml)、[现有 Compose](../../deploy/tencent-tokyo/compose.yaml)（Compose 本窗口沿用先前查阅证据） | G：东京 DEV/PREVIEW 与旧 Railway 区分；预检只对 runtime/deployable 改动发布镜像，文档/测试路径可以 SKIPPED | 新窗口发布/验收的默认入口，不能借用旧 OAuth 配置 |
| S03 · 11-13 · A/B | [历史原文归档及入口](../../archive/railway-live-production-proof-actions-20261113/README.md)、[原 CI 不可回退测试](../../../tests/protocol/legacy-railway-proof-host-opt-in.test.mjs)、[Project Continuity](../../../.github/workflows/project-continuity.yml)；[PR #1302 精确合并](https://github.com/jiangxng/EVO-App-Platform/pull/1302)、[PR #1304 最终证据](https://github.com/jiangxng/EVO-App-Platform/pull/1304#issuecomment-6843647844) | G：10 个活动旧 YAML 移往 `docs/archive`，Git Blob SHA 10/10 相同；7 个 CLI 需要显式 `HOST`；新 Continuity 逐 PR 扫描活动 YAML 禁止 `*.up.railway.app`，主线实际 GREEN | CI 防回退 + 历史证据保全，不重复造另一套框架 |
| S04 · 11-13 · B / 原日志 | [2026-11-13 实际东京部署 #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425)、[deploy Job #131655719480](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480) | G：日志实际输出 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`；物理 SHA `b58e660fdc01f98e0840247115f7ca3b8c43c0b3` | 区分真实部署 vs 文档合并 SHA |
| S05 · 11-13 · B / 原日志 | [#1300 东京 run #43356987396](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43356987396)、[#1301 #43358315626](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43358315626)、[#1302 #43360356465](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43360356465)、[#1303 #43361538014](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43361538014)、[#1304 #43363628979](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43363628979) | G：每项最新 main preflight SUCCESS，deploy SKIPPED；已直接核对精确 main 检查。#1304 preflight 明确 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=e0d7aee...` | 排除“已发五个新生产镜像”的错误认知 |
| S06 · 11-13 · B / Railway 直接连接器只读，无外部固定浏览 URL | Railway 项目 ID `aee4643e-912b-4ca1-ae95-fe4ec64f5601`，环境 ID `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`；`environment_status`、`get_service_config` 两旧服务 | G：五个服务 `offline`、`activeDeployments=[]`、`pendingWork=[]`，Ledger Source 为 `jiangxng/EVO-App-Platform@main`；EVO Runtime Source 为 `jiangxng/EVO@main`，`preDeployCommand=["node dist/scripts/migrate.js"]`；`staged=null` | Operator 停机/解绑决策待批；**offline 不等于删除，source 关联不等于 Autodeploy 一定启用** |
| S07 · 11-13 · B / 当前 GitHub 原记录 | [Operator Task #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6843295356)、[Owner Task #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[Owner PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 及 [Reviews API](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews) | G：两个 Issue OPEN，#1184 OPEN 且 reviews=[]；#1212 勾选问题不是具名批准；#1092 已追加 Autodeploy/迁移触发调查，未签署 | CV03/CV04 正式权限保持关闭、业务文档所有权不跨越 |
| S08 · 11-13 · A | [此前 Window08 交接](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md)、[原 CV04 大索引 `22–26](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md) 已取关键段落/标题；[旧 OIDC runbook](../../runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md) 已在 #1300 改为历史状态（本 #08 未独立逐字复读） | G：已有 CSV 当前页能力、正式后台跨页 EXPORT OFF、CV03 SAVE OFF，历史研究与多窗口 SHA 不能替换当前 Main/Server 事实 | 避免重复研究旧阶段或把过去 Railway 的快照当现行部署 |
| S09 · 11-13 · S（**非已读原文**） | [Railway / Controlling GitHub Autodeploys](https://docs.railway.com/deployments/github-autodeploys)、[Disable automatic deployments 章节](https://docs.railway.com/deployments/github-autodeploys#disable-automatic-deployments)；Railway `search_docs` 返回候选章节，`fetch_docs` 未成功取得全文 | G：仅证实文档入口和章节标题可被搜索索引找到；不能据此认定本账户开关/复核状态 | 真实 Operator 应在控制台查看有效设置、来源优先级，不应依赖搜索摘要 |

**没有访问的来源不得包装成已读**：未读取铁路内部 GitHub integration 开关的实际数据库、未查询旧持久卷原始字节、未查业务密钥/凭证/原始 PostgreSQL 数据、未接入独立物理 Host PID1。以上皆明确待授权。

## 2. 连续 #01～#08 的不可变工程证据

| 自动续跑 / PR | 已完成动作 | PR Merge SHA / main check-run 原始结论 | 时间与限制 |
| --- | --- | --- | --- |
| #01 → [#1300](https://github.com/jiangxng/EVO-App-Platform/pull/1300) | 标注 Railway 旧 OIDC Runbook、BEX 历史报告，完善东京当前发布入口 | `59fe344ab732ba564ff45b34e59e0c4ef3d9214b`；4 SUCCESS + 1 SKIPPED（按当时最终 Main） | 11-13，文档级 |
| #02 → [#1301](https://github.com/jiangxng/EVO-App-Platform/pull/1301) | 旧 Railway 运行与 Source 只读核对入库，区分 `config live` 与 `runtime offline` | `e1c24f2355065de0f7f9fd0e482b1c2bd364acfe`；5 SUCCESS + 1 SKIPPED（含追加 Continuity） | 11-13，不解绑 |
| #03 → [#1302](https://github.com/jiangxng/EVO-App-Platform/pull/1302) | 10 份旧 Railway production-proof Action 原文归档、真实触发撤销 | `37448159ba4ae83aca55c79a50b96d9a6373acfb`；4 SUCCESS + 1 SKIPPED（随后额外 Continuity SUCCESS） | 11-13，未恢复旧专项浏览器证明 |
| #04 → [#1303](https://github.com/jiangxng/EVO-App-Platform/pull/1303) | 7 CLI 明示 `HOST` 才执行、实际未设置 HOST 负例、191/191 活动 Workflow 审计 | `0c5642a50cabe640c13c449c66652f5175aaf683`；4 SUCCESS + 1 SKIPPED（后有额外 Continuity） | 11-13，历史分支名保留 |
| #05～#06 → [#1092 既有 Owner Task](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6843295356) | 只读复核旧 5 服务、两个已注册域名、部署历史及指标有限性；不新建资源 | 无工程 PR；只读证据/待 Operator 处理 | `AUTODEPLOY_UNVERIFIED`，HTTP 7d 返回 0 data buckets **不等于零访问**；项目 Webhook 0 不等于 GitHub integration disabled |
| #07 → [#1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304) | Project Continuity 上线旧 Railway Workflow 禁入门禁，覆盖 workflow-only PR | `e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447`；**4 SUCCESS + 1 SKIPPED**，原 Continuity Job #131682611440 的新 Step SUCCESS | 11-13，未更换现行东京镜像 |
| #08 → 本交接 PR | 核对 #1300–#1304 merged/精确 Checks、当前东京实发镜像、#1184 Review/Owner Issue；提交本短入口与详细来源索引 | **等待本交接 PR 的真实 CI/Merge/东京/Branch Hygiene**，不提前声明 PASS | 合并后须在 PR 最终评论写准确证据 |

#1302、#1303、#1304 的原始最终 PR Comments：[1302](https://github.com/jiangxng/EVO-App-Platform/pull/1302#issuecomment-6843108088)、[1303](https://github.com/jiangxng/EVO-App-Platform/pull/1303#issuecomment-6843308869)、[1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304#issuecomment-6843647844)。#1301 [原最终评论](https://github.com/jiangxng/EVO-App-Platform/pull/1301#issuecomment-6842841993)。Blob SHA、Branch Hygiene 的不可变日志和实际 Tokyo 预检均可在这些位置追溯。

## 3. 决策矩阵（D = 我们的工程判断；G = 上面的事实）

| 候选方案 | 采用或排除及依据 | 限制或适用条件 |
| --- | --- | --- |
| **采用：腾讯东京作为唯一当前 DEV/PREVIEW 发布路径** | G：其 Actions/GHCR/HTTPS + Basic Auth 的真实 Job 已证实；避免把 Railway 历史报告标为最新 | 不是正式生产身份/EXPORT/SAVE 授权；务必核验新运行 SHA 而不是假设 |
| **采用：旧 10 YAML 原文归档、7 CLI 显式 HOST、Continuity fail-closed** | G：活跃旧 Action 实际引用旧域名；Platform CI 单独用 paths 过滤，会漏掉 workflow-only PR；新 Continuity 无该过滤且现已实际执行成功 | 被归档的专用浏览器/缓存/RUM 项不是新东京 PASS；必要时经独立受权验证后才恢复 |
| **采用：Operator #1092 / Owner #1212 作为唯一后续决策入口** | G：两个 Issue OPEN，#1212 五个 checkbox 不构成真实审批；避免大量新的孤立“观察 PR” | Operator 需环境/资源身份、审批者和日期、影响面、备份/回滚；Owner 需独立具名五方证据 |
| **排除：Railway Offline 即删资源/断 Source** | G：已发现旧域名/卷/Source 仍关联，控制面没有 Autodeploy 实际开关；EVO preDeploy 可在未来部署触发 SQL migration | 只有独立 Operator 核准、消费者清点与可恢复备份后才讨论解绑/销毁 |
| **排除：Railway→东京直接字符串替换 HOST、复用旧 Google OIDC** | G：东京 Basic Auth + demo Principal 与旧生产会话/OIDC 不同，未经准入可能被 401 阻断 | 必须先配置独立授权的非生产测试企业、Principals/Session、最小权限和撤权断言 |
| **排除：绿色 CI 或隔离测试自动开启后台 EXPORT / Human SAVE** | G：目前正式 Operation 仍 OFF/未注册，N1 NOT_CERTIFIED，真实权威 Source/Producer/KMS/双物理 Host 尚未签署 | 只有 #1212 具名证据闭环与生产验收后才能考虑新的发布决策 |

## 4. 冲突、未知与实际下一步 Owner 收据

1. **Railway 配置 `live` vs 五服务 `offline`：** 不冲突，前者是资源存在，后者是进程/Deployment 状态；没有运行 ≠ 没有自动触发潜力。
2. **Service Source `main` vs Autodeploy 开关：** 已连接 repo 和 `checkSuites:false` 都**不证明**有效开关 Enabled；找不到不等于 Disabled。真实 Railway Infra Operator 对 **Ledger Configurator 与 EVO Runtime** 分别提供控制台 settings screenshot 或已允许的只读原始设置，注明项目/环境/服务 ID、观察 UTC、开关值/触发策略、来源优先级、操作人/审核者。没有这些则填 `UNKNOWN`，不试探 push/deploy。
3. **Railway HTTP 指标空 vs 无消费者：** 7d `http_requests` 返回零数据桶，不能推导无任何历史访问、私人网络消费者、SQL 或定时外部任务。需要只读消费者发现、保密范围内迁移清单、有效备份/PITR/恢复演练与可审计回滚 Owner。
4. **GitHub Main 源码更新 vs 腾讯东京物理实例：** 当前 `e0d7aee...` 源码较新，物理 last-confirmed `b58e660...`。四轮 docs/tools/CI 的 SKIPPED 是**有意正确**；新窗口必须按实际新 deploy 原始日志更新 snapshot。
5. **#1212 五个勾选与 Owner 真实批准：** 名称已列出但未见独立 PA05 Lifecycle、AuthorizationProvider、PG/DB、Security/Ops、Domain Owner 五类对应 PR Review/文档签字与资源身份、失效回滚。不能填 PASS。
6. **#1184 并行文件所有权：** 仍 OPEN，Reviews API []。它管理的三份文件不得被自动续跑覆盖；最新 PR/文件映射见 [短交接 `4](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md)。

**最值得继续查阅的顺序**：独立 Operator Railway Source Autodeploy 有效开关/消费者/恢复证据 → #1212 五方具名实际生产权威契约与验收 → 真实合法的东京非生产浏览器 Principal/401+200，按需求恢复旧专项证明。没有外部证据时不制造功能或流程上的虚假进度。

## 5. 模块、归档与截图/原始日志位置

- 现行东京发布：`.github/workflows/evo-tokyo-dev-deploy.yml`、`deploy/tencent-tokyo/*`、`docs/operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md`；原始物理日志 [Tokyo #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)；文档/工具路径判断 [#43363628979](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43363628979/job/131682742222)。
- 旧 YAML 审计：`docs/archive/railway-live-production-proof-actions-20261113/`（10 份原文 + README）。七个已调整的 `tools/*-production-proof.mjs`、`tools/browser-surface-network-proof.mjs`；`tests/protocol/legacy-railway-proof-host-opt-in.test.mjs` 和 `.github/workflows/project-continuity.yml` 是统一回归与自动触发入口。
- CV04 业务：`apps/business-dictionary/export-jobs.ts`（Domain Owner）、`apps/business-dictionary/export-job-pg-store.ts`（隔离 PG/加密存储）、`manager/server.ts` / `catalog/seed.ts`（正式注册边界）；本轮**没有再次操作业务 Source 或启用权限**。CV03 权威契约详情见 [Window08 旧交接](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md) 与 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)。
- 旧 Railway Operator 原始连接器元数据**没有持久外链或截图附件**，需通过同一只读 Railway app 复查；两旧域名由 `list_domains` 查询见既有 #05/08 记录。**没有生成或声称存在未取得的 screenshot**。需要控制台 UI 截图应由有权限的 Operator 提供并放入 #1092 附件，不能编造路径。
- 分支治理：#1301 [Branch Hygiene #43358278356](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43358278356)、#1302 [#43360330991](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43360330991)、#1303 [#43361507577](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43361507577)、#1304 [#43363591601](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43363591601) 的真实 Job log 记录 SHA-pinned 过程分支删除；#1300 原理和结果见对应 PR 评论，#08 不复制未知日志正文。

> **工程结论**：这一阶段已经完成“当前预览发布权威入口可读 + 历史 Railway 验收退役 + 默认 Host fail-closed + workflow-only PR 防回退”。后续仍需 Owner 才能继续的是真实旧资源安全退役和正式生产权限认证；**不是**再开发一套列表基础框架、再次复制旧 Railway Runbook 或打开未批准的正式 EXPORT/SAVE。
