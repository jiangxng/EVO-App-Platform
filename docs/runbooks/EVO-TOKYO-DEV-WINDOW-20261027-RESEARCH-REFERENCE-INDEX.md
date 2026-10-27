# EVO 东京验证环境｜本窗口研究资料、原始证据与决策参考索引（2026-10-27）

> 配套短入口：[EVO-TOKYO-DEV-WINDOW-20261027-HANDOFF-ENTRY.md](EVO-TOKYO-DEV-WINDOW-20261027-HANDOFF-ENTRY.md)。当前实施手册：[EVO-TOKYO-DEV-DEPLOYMENT-20261027.md](EVO-TOKYO-DEV-DEPLOYMENT-20261027.md)。所有时间均为 **2026-10-27** 窗口内查询（GitHub Actions 日志时间为 UTC）；项目仓库 `https://github.com/jiangxng/EVO-App-Platform`。本索引尽量保留实读证据，不给未查阅网页升格为“已读原文”，亦不把 GitHub CI 通过等同公网/业务级认证。

## A. 阅读分级和核验边界

- **P1｜已读原文**：GitHub Connector 读取仓库实际文件的相关原文、GitHub Actions 原始日志关键区间或 GitHub PR/commit 原始数据；限定于本窗口实际查阅的章节/步骤，不能声称完整人工审计全部文件。
- **P2｜仅见摘要/引用**：GitHub 已读历史文档中对另一来源的引用、当前会话先前的历史摘要或用户转述；**它是二手材料，不等于已读外部原文**。本窗口没有可以可靠确认为“单纯 Web 搜索结果摘要”的外部资料，因此“仅看搜索摘要”的严格条目数是 **0**。
- **P3｜待验证**：原始官网没有直接打开、外部实时可达性未获证实，或工具本次访问失败。即使 URL 看似权威，也不升级阅读等级。
- **U｜用户直接提供**：用户 VPS 终端输出、GitHub 界面截图、Actions 提示；不作为第三方官网原文，也不可凭此推断未显示的数据。URL 或附件 ID 以真实已出现为准。
- **事实 vs 判断**：标为 [事实] 的条目来自可复核文件/运行日志；标为 [方案判断] 的技术选择或建议是本窗口工程判断，尚需实测。

## B. GitHub 工程原始来源索引（P1 已读原文或指定片段）

| 编号 / 标题与原始 URL | 阅读等级与日期 | 主题及关键发现（来源事实） | 对 EVO 的直接用途 |
| --- | --- | --- | --- |
| G01 [EVO-App-Platform main](https://github.com/jiangxng/EVO-App-Platform/tree/main) | **P1**；2026-10-27，GitHub branch API / 实际 commit | 当前交接建档基线 `main@7b95c3b70d947c83476e9ca966c3252ade96e384`；其他并行 PR 仍存在。| 新窗口必须刷新基线，不能把文档 PR 的 head 视为部署的 main。 |
| G02 [部署初始 PR #1115](https://github.com/jiangxng/EVO-App-Platform/pull/1115) | **P1**；2026-10-27，PR metadata、patch/文件 | 合并 `737df25b14a96f8ddd8a1c1ca81103cccf90f7b4`；新增 Compose、Caddy 模板、bootstrap、manual workflow、runbook；没有直接改业务代码。| 确定部署 owner 和已经实现的基础，不要重建第二套发布系统。 |
| G03 [SSH 快速失败诊断 PR #1116](https://github.com/jiangxng/EVO-App-Platform/pull/1116) | **P1**；2026-10-27，PR 元数据和实际 workflow | 合并 `a8de4336f685442ed754c70d8ffa95799849dbd1`；SSH Secret/远端预检前移；单独非秘密错误码；Runner 固定 Ubuntu 24.04；GitHub Action major 升级。| 已验证 SSH 诊断改进，不应继续为早期 SSH 失败盲改私钥。 |
| G04 [HTTP readiness/首次回退 PR #1117](https://github.com/jiangxng/EVO-App-Platform/pull/1117) | **P1**；2026-10-27，PR 元数据、workflow 和 Compose | 合并 `7b95c3b70d947c83476e9ca966c3252ade96e384`，exact PR head `fd01acf4b498dad96f1a7dc95f265bba0500517f` 的可见 5 项检查均 SUCCESS。| 不要重做已经修复的 `curl (56)` 启动等待与 `:pending` 假回滚问题。 |
| G05 [EVO Tokyo workflow 原文](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/.github/workflows/evo-tokyo-dev-deploy.yml) | **P1**；2026-10-27，配置原文 | 工作流名 `EVO Tokyo Dev - Verified Manual Release`，`workflow_dispatch` 且 `main` 允许；GitHub Secrets → SSH/Docker 前置自检 → `npm run test:platform` → GHCR SHA 镜像 → SSH Compose/health；此时**没有 main push 自动部署**。| 实际修改自动触发、required CI、诊断/回滚的唯一当前 owner 配置。 |
| G06 [Compose 原文](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/deploy/tencent-tokyo/compose.yaml) | **P1**；2026-10-27，配置原文 | `postgres:17-alpine`、EVO、`caddy:2-alpine`；Postgres/EVO/Caddy 分离；EVO `127.0.0.1:4100`；DB 私网；卷 `postgres-data`、`evo-data`、`caddy-data`、`caddy-config`；EVO 容器内 Node HTTP health；Caddy 等待 EVO healthy。| 部署拓扑、持久化与端口边界真实依据；任何修复先与此对照。 |
| G07 [bootstrap 初始化脚本原文](https://github.com/jiangxng/EVO-App-Platform/blob/737df25b14a96f8ddd8a1c1ca81103cccf90f7b4/deploy/tencent-tokyo/bootstrap.sh) | **P1**；2026-10-27，配置原文 | Ubuntu apt 安装 Docker/Compose，建立 `evo-deploy`、`/opt/evo-tokyo`、随机本地 PG 密码与 Caddy 预览密码，生成专用 SSH key；首次仅准备文件，不启动业务。 | VPS 一次初始化由实测远端 preflight 证明已建立，无需重复执行或重置密钥。 |
| G08 [Caddy 模板原文](https://github.com/jiangxng/EVO-App-Platform/blob/737df25b14a96f8ddd8a1c1ca81103cccf90f7b4/deploy/tencent-tokyo/Caddyfile.template) | **P1**；2026-10-27，配置原文 | 裸 IP HTTP 302 到 `https://evo.43.167.252.197.sslip.io`，预览 Basic Auth；`/health` 路由是无 Basic Auth 的健康路径。| 公网验收要验证 HTTPS/TLS、认证保护及明确放行的 health 路由，而不只测本地端口。 |
| G09 [Dockerfile](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/Dockerfile) | **P1**；2026-10-27，文件原文 | 多阶段 Node 22.22.2 构建/运行，`npm ci`、`npm run build`，运行 `dist/manager/server.js`。 | 确认构建应在 GitHub Actions 而非 4GB VPS 上，应用 Node 22 与 Action Runtime Node 24 不是一回事。 |
| G10 [manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/manager/server.ts) | **P1，已读相关行段而非 10k 行完整审查**；2026-10-27 | `PORT` 默认 4100，`GET /health` 返回 `{"ok":true,"service":"evo-app-manager"}`；`APP_PLATFORM_STATE_FILE` 关系到本地持久化；`APP_PLATFORM_CONVERSATION_AUTHORITY` 支持 PG；OAuth/MCP 配置开关默认不意味着 Google 登录自然有效。| 确定 Host 真实健康探针、变量、数据库模式，不乱改核心业务。 |
| G11 [现有 Tokyo deploy runbook](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/docs/runbooks/EVO-TOKYO-DEV-DEPLOYMENT-20261027.md) | **P1，已读关键原文**；2026-10-27 | §0–5 记录部署方案/授权/验收表，§6 记录最初 SSH 失败及安全诊断码，§7 记录第一次容器/HTTP 失败与回退错误。历史 `状态` 头部可能滞后，**本轮成功需以 #40460609744 更新为准**。| 新窗口运行手册，保留故障来源，不把历史失败状态误当最新。 |
| G12 [AI-BOOTSTRAP.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/AI-BOOTSTRAP.md) | **P1，相关原文**；2026-10-27 | 新窗口先读 bootstrap → project.status → 指向 handoff → LLM → foundation map；聊天记忆不能当项目真实进展来源；主线交付应有分支/CI/交接。 | 强制恢复项目整体架构上下文而非只记住部署 PR。 |
| G13 [project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/main/project.status.json) | **P1，读取结构化字段**；2026-10-27 | 全局 milestone 仍是 `TR-01 Trading Reference Loop`，`handoff=docs/roadmap/HANDOFF-LATEST.md`；此专项不改全局状态。 | 防止基础设施专项抢占 PA05/BEX/TR01 主线 owner。 |
| G14 [HANDOFF-LATEST.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/roadmap/HANDOFF-LATEST.md) | **P1，读取相关开头/概览**；2026-10-27 | 本文件由 `project.status.json` 生成，开头仍含 2026-10-10 TR-01 B2D2 快照和生产 trusted Host→EVO delegate gate；**不是腾讯云最新部署账**。 | 全局上下文，不手动编辑、不把部署状态写为业务认证。 |
| G15 [DEVELOPMENT-DELIVERY-WORKFLOW-v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | **P1，主要原文**；2026-10-27 | 单 owner 分支/PR、定向快反馈、最终 exact HEAD 门禁、Human 与生产另授权、及时合并和可续接。 | 审查、变更管理、禁止直接越过他线 PR 合并。 |
| G16 [FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md) | **P1，主要原文**；2026-10-27 | 连续两次无有效进展换路线；先最小重现后成批修复，同一 owner PR；相关 CI 和真实验收分开。 | 本轮 SSH→HTTP→首部安全回退问题均用一次证据驱动修正，避免新窗口重复试同一错误。 |
| G17 [AGENTS.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/AGENTS.md) / [.clinerules/01-delivery.md](https://github.com/jiangxng/EVO-App-Platform/blob/main/.clinerules/01-delivery.md) | **P1，主要原文**；2026-10-27 | 不覆盖其他窗口 owner；多步工程使用固定验收表（项目／状态／下一步）；UI Human gate 独立。 | 专项进度、交接格式和隔离交付边界。 |
| G18 [Window 14 Railway 历史交接](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-14-RAILWAY-DELIVERY-HANDOFF-ENTRY-20261022.md) | **P1，仅仓库交接原文，不是 Railway 平台原始 API**；2026-10-27 | 历史 2026-10-22 Railway Ledger Configurator 来自 main、带 `/data` volume，曾因当时部署暂停未更新。列出当时存在的 EC、App Host Validator、EVO Runtime、Postgres 等服务。 | 为什么 Tencent 不能自动视为 Railway 全部服务原位迁移；旧状态非当前 2026-10-27 线上证明。 |
| G19 [PA05 / Agent HANDOFF](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/agent-line/HANDOFF.md) | **P1，已读相关顶部段落**；2026-10-27 | PA05 #1104 工程合并不等于生产 K0/W06 签收；WRITE OFF 等门禁仍需正式认证。 | 禁止将新 Host 启动成功用于冒充 PA05 多 Worker 停机、生产授权签收。 |

## C. Actions 原始日志、变更时序和现场证据（最重要的易变材料）

| 编号 / 原始 URL（完整运行链接） | 来源等级、检查日期 | 关键原始证据（真正从工具日志读取） | 开发/验收映射 |
| --- | --- | --- | --- |
| A01 [run #40456198877](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40456198877)，[job #122029979461](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40456198877/job/122029979461) | **P1：GitHub Job 原始日志关键区间**；2026-10-27 | 步骤 4 `npm ci/test:platform`、7 Docker image push SUCCESS；步骤 8 `Configure pinned SSH ...` exit 1；Private/Host Secrets 显示非空遮盖 `***`，无法判明具体哪项 ssh-keygen 失败；步骤 9–11 skipped。 | 触发 PR #1116；**这次未进入腾讯云**，不重复归因 Docker。 |
| A02 [run #40458456896](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40458456896)，[job #122037183518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40458456896/job/122037183518) | **P1：GitHub Job 原始日志，诊断输出约 05:59:55 UTC**；2026-10-27 | step 4 `Validate pinned SSH secrets` 报 `Known-hosts Secret must contain a complete verified line beginning '43.167.252.197 ssh-ed25519 '`，exit 1。用户随后确认曾手工删除前缀，后来修正。 | 证明属于 GitHub Environment `EVO_TOKYO_SSH_KNOWN_HOSTS` 内容而非 private key；**后续已经 PASS，不要再要求重设**。 |
| A03 [run #40459162831](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40459162831)，[job #122039424223](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40459162831/job/122039424223) | **P1：GitHub Job 原始日志，约 06:09:10–25 UTC**；2026-10-27 | SSH Secrets、远端 SSH、测试、GHCR、scp、docker login PASS；创建 `evo-tokyo-dev_internal` 和 4 volume；PG Healthy，EVO/Caddy Docker 标 Started；`curl: (56) Recv failure: Connection reset by peer`；旧 rollback `evo Pulling ...:pending` → `not found`。 | 触发 PR #1117 的真 HTTP 探针和首次部署回退条件修复；此轮 **GitHub 总体 FAILURE**。 |
| A04 **[run #40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744)**，[job #122044046191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744/job/122044046191) | **P1：GitHub 原始步骤、关键日志，约 06:21:40–06:23:30 UTC；最终 06:23:38 UTC 标记 SUCCESS**；2026-10-27 | `EVO_TOKYO_SSH_SECRET_FORMAT_PASS`、`EVO_TOKYO_REMOTE_PREFLIGHT_PASS`；PG Healthy、EVO Healthy、Caddy Healthy；真实 VPS localhost `{"ok":true,"service":"evo-app-manager"}`；`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=7b95c3b70d947c83476e9ca966c3252ade96e384`；Job 和 Workflow **SUCCESS**。 | **最新已确认完成**：GitHub→GHCR→VPS Compose + 本地 HTTP health。下一项是独立公网 TLS/Caddy/业务验收，**不要从上次失败重做**。 |
| A05 [Actions workflow 入口](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/evo-tokyo-dev-deploy.yml) | **P1：配置原文与真实 Dispatch 运行**；2026-10-27 | 名称 `EVO Tokyo Dev - Verified Manual Release`，此次成功事件为 `workflow_dispatch`；尚未实施自动 main push。 | 后续自动部署单独 PR；不应宣称已达到 Railway 完全自动部署。 |
| A06 [#1117 精确 HEAD 的 checks](https://github.com/jiangxng/EVO-App-Platform/commit/fd01acf4b498dad96f1a7dc95f265bba0500517f/checks) | **P1：GitHub Checks API**；2026-10-27 | 本窗口查到的 `human-ui-design-review`（含重复触发记录）、`lightweight-host`、`continuity` 共 5 条 SUCCESS；合并后 `main` 又通过必需的 continuity/lightweight-host 并进入真实运行。 | CI 合并门禁事实，与生产服务运行、Human UI 证据保持分离。 |

### C.1 重要日志摘录与重入定位

```text
# run #40458456896，原始 job 诊断输出
Known-hosts Secret must contain a complete verified line beginning '43.167.252.197 ssh-ed25519 '.

# run #40459162831，约 06:09:22–25 UTC
Container evo-tokyo-dev-postgres-1 Healthy
Container evo-tokyo-dev-evo-1 Started
Container evo-tokyo-dev-caddy-1 Started
curl: (56) Recv failure: Connection reset by peer
evo Error ... ghcr.io/jiangxng/evo-app-platform:pending: not found
DEPLOY_FAILED_PREVIOUS_IMAGE_RESTORED_IF_AVAILABLE
# 注意：此字符串来自旧脚本，不能证明旧镜像实际已恢复。

# run #40460609744，约 06:23:23–30 UTC
Container evo-tokyo-dev-postgres-1 Healthy
Container evo-tokyo-dev-evo-1 Healthy
Container evo-tokyo-dev-caddy-1 Healthy
{"ok":true,"service":"evo-app-manager"}
EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=7b95c3b70d947c83476e9ca966c3252ade96e384
```

所有这些均为 GitHub Actions 原始日志的**短摘录**；日志全文通过相应 run/job 链接复查，切勿把本交接视为替代原始生产审计归档。Actions 的显示日志/组织保留期可能变化；建议下载安全脱敏的 release evidence 到本专项 PR（**不保存 Secrets、令牌或整份含环境信息日志**）。

## D. 用户直接提供的原始证据（U，不是网络搜索结果）

| 标题 / 可复查位置 | 证据等级和日期 | 原始事实及使用限制 | 用途 |
| --- | --- | --- | --- |
| U01 Tencent Lighthouse 实例详情（用户文字） | **U**；2026-10-27，本聊天 | 运行中；东京一区；IPv4 `43.167.252.197`；实例名 `evo-dev-tokyo-01`；实例 ID `lhins-0pk1fw21`，密钥 ID `lhkp-k8q9mdbf`（**均不是登录私钥**）。 | 精确锁定目标实例；不要向用户索取云控制台密码或公私钥正文。 |
| U02 Ubuntu 浏览器终端回执 | **U：用户贴原始终端输出**；2026-10-27 | `ubuntu` 用户，`x86_64`，`Ubuntu 24.04.4 LTS`；Mem total 3.6Gi、available 3.2Gi；swap 1.9Gi；`/dev/vda2` 59G、空余 52G；**初检 Docker 未安装**。后续真实 Actions Docker preflight PASS，故旧初检不再代表当前安装状态。 | 判断 VPS 适合轻量 Host + PG、镜像应 GitHub 构建；无需再购买主机或重复系统安装。 |
| U03 GitHub Environment 设置截图 | **U：本聊天已查看的用户截图**；2026-10-27；窗口附件 `image(20261027-050549).png`，文件 ID `file_0000000072288209b0c7af58dd88c176`；网页入口 [Environments](https://github.com/jiangxng/EVO-App-Platform/settings/environments) | 环境 `evo-tokyo-dev` 已创建，Selected branches and tags 配 `main`；截图中管理员 bypass 可选项当时勾选，是否后来关闭不明。截图不是仓库文件；**新窗口附件路径不保证可用**。 | 环境权限已设，后续直接审阅现有环境，不让用户重新创建。 |
| U04 用户修改 Known Hosts Secret 的说明 | **U：用户明确确认**；2026-10-27 | 曾删除 `43.167.252.197 ssh-ed25519` 前缀、只留公钥体；之后根据操作指令修复，下一轮 run #40459162831 与 #40460609744 验证通过。 | 确切解释 A02 根因，**不再重复 SSH Secret 安装流程**。 |
| U05 用户明确运营要求 | **U：本窗口原始指令**；2026-10-27 | “请像 railway 那样，不需要我操作，我可以授权你登陆”“不用 codex 你能操作么？”；重视低成本、无域名/用 IP、按月、自动发布；最终要求专门研究与决策交接包。 | 把自动发布、低操作负担、公网体验作为剩余真实用户目标，不以提交多个 PR 替代验收。 |

## E. 已见链接但没有访问官方原文、及实时待验证来源

| 编号 / 标题与原始 URL | 查阅等级与日期 | 实际获知内容、未验证边界 | 进一步查阅的用途 |
| --- | --- | --- | --- |
| X01 [GitHub Changelog：Node 20 deprecation notice](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) | **P3，未读网页原文**；2026-10-27 在用户提供的 Actions annotation 中看到官方链接与警告 | annotation 指出 checkout@v4/setup-node@v4/docker v3/v6 使用 Node20 将由 Runner 强制 Node24；本窗口工程改为新版 Actions **是技术应对，未亲自验证官网全文内容**。此警告不是 run #40456198877 根因。 | 未来官方 Action 大版本与 Node Runtime 的正式迁移规范，避免自动部署后兼容回归。 |
| X02 [GitHub runner-images issue #14748（Ubuntu 26）](https://github.com/actions/runner-images/issues/14748) | **P3，未读 issue 原文**；2026-10-27 在 Actions annotation 中出现 | 原警告说 `ubuntu-latest` 2026-10-19 起迁移到 Ubuntu 26；本窗口部署工作流已 pin `ubuntu-24.04`，未独立审核官方 schedule/退役策略。 | 以后 Runner 更新窗口再核查，不因当时 Notice 盲目升级业务服务器 Ubuntu。 |
| X03 [Railway 2026-10-21 safety disclosure](https://blog.railway.com/p/security-disclosure-wednesday-october-21st) | **P2：只读仓库 Window14 二手摘要；官网未读原文**；2026-10-27 | [Window14](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-14-RAILWAY-DELIVERY-HANDOFF-ENTRY-20261022.md) 历史记录 Railway 曾暂停部署；不可据此说 2026-10-27 仍暂停。 | 未来如要关闭/迁移 Railway，先重新查实时服务/凭据状态。 |
| X04 [Railway GitHub reconnection & bucket credentials guidance](https://blog.railway.com/p/security-disclosure-recommendation-redeploy-buckets-and-reconnect-github-after-the-credential-reset) | **P2，仓库历史索引引用；官网未读**；2026-10-27 | 历史仓库文档指出 GitHub tokens 被 reset，需核实重连。此窗口未重新操作 Railway。 | 只有需要 Railway 重新发布或安全轮换时再读；不能作为腾讯云迁移已完成的证据。 |
| X05 [Railway rotate PostgreSQL credentials](https://blog.railway.com/p/security-disclosure-recommendation-rotate-postgresql-database-credentials) | **P2，仓库历史索引引用；官网未读**；2026-10-27 | 历史手册建议 PG 凭据轮换，**不能未经备份/变更窗口直接操作原 Railway production**。 | 未来安全审计或真正数据迁移的独立工作线。 |
| X06 [公网健康检查 URL](https://evo.43.167.252.197.sslip.io/health) | **P3：本窗口网页读取工具实际尝试访问，返回 `URL ... is not accessible via this tool`，并非 HTTP 失败码**；2026-10-27 | **未获得可信公网 HTTP 200 / TLS / DNS 证据**；不能说实际公网宕机，也不能说已可用。 | 下个窗口最小真实验收：普通浏览器 / `curl -Iv`、TLS 证书、Caddy 路由、防火墙，分别记录；必要时部署轻量只读日志诊断。 |
| X07 Google Web OAuth 的裸 IP / 回调约束 | **P3，先前讨论的工程判断，无可追溯已读 Google 官方原文 URL**；2026-10-27 | 初期决定用 IP 衍生域名/HTTPS，Google 登录暂不启用。**尚无真实 OIDC callback、IdP 配置和权限证据**。| 真正需要 Google 登录时先查 Google 当前政策并核准 redirect URI、session/Cookie、域名权属和 HTTPS；不要靠关闭身份校验绕过。 |

> **网络搜索摘要说明：**本窗口主要通过已连接 GitHub 工具读取仓库与 GitHub Actions 的第一手原始数据。不能追溯本窗口有任何已阅的普通 Web 搜索摘要；以上 X03–X05 是**仓库历史二手摘要**，并非本窗口官网原文。外部网页工具只尝试了 X06，不能冒充已读 X01–X05 官网。

## F. 方案比较、采用理由及适用条件

| 选择 / 对照 | 哪些是已核验事实 | 工程判断、采用／排除与理由 | 约束/转换条件 |
| --- | --- | --- | --- |
| **腾讯云 Lighthouse VPS vs Railway 原托管** | [事实] 用户已有东京 Ubuntu VPS；Actions #40460609744 验证了 App Platform Host 的 Compose 部署可用；Railway 项目历史包含多独立服务和卷。 | [方案判断] 采用 VPS 作为独立**验证**承载，成本确定性及 Docker 控制可满足开发需要；**不删除 Railway**，先并行。 | 不保证 Railway 等效托管全部服务；要核对各项目 owner、数据、凭据、网络后才切换正式验证域名。 |
| **GitHub 构建 vs 在 4GB VPS 构建** | [事实] GH Actions 成功 `npm run test:platform`、多阶段 Docker build；VPS 用户报可见 3.6Gi RAM。 | [方案判断] 采用 GitHub CI 负责构建/验证，VPS 仅拉镜像运行，减少长期占用和内存峰值。 | GHCR image/tag/权限、Runner Actions 升级和费用需要按后续增长观察。 |
| **Docker Compose 单机 vs Kubernetes / 多实例** | [事实] 一台 4 GB Ubuntu Host，Docker Compose 三服务和 4 数据卷已真实启动并本地健康。 | [方案判断] 采用 Compose，资源与管理复杂度更符合低成本开发阶段；排除首次就上 K8s。 | HA、异机备份、跨 Worker 排他和生产故障恢复不由单机 Compose 提供。 |
| **独立 SSH Key + GitHub Environment vs 用户提供私钥/云主密钥** | [事实] Actions #40460609744 的 SSH Secrets 前置检查和远端 SSH 均 PASS，Env 仅允许 main。 | [方案判断] 采用 GitHub environment scoped secret + pin server host-key，避免聊天传私钥，拒绝直接用腾讯云控制台 master-key；现有 SSH 已打通，不需要用户重复配置。 | `evo-deploy` 的 Docker 群组实质具高权限；后续可评估更小权限、OIDC/pull-agent、访问范围和密钥轮换。 |
| **IP 衍生 HTTPS host vs 裸 IP / 买正式域名** | [事实] Caddy 模板用 `evo.43.167.252.197.sslip.io`，裸 IP HTTP 302；尚无公网证书成功证据。 | [方案判断] 先不要求购买域名，用衍生 host 验证反向代理和浏览器 UI；不要在未加密 HTTP 送登录/密码。 | 依赖第三方 DNS/ACME，且不证明 Google OIDC 可用；长期企业验证需自有域名与可靠证书策略。 |
| **首次人工发布 → CI-gated 自动部署** | [事实] 现有 workflow 仍 `workflow_dispatch`；#40460609744 SUCCESS。 | [方案判断] 先保证首次真实部署、回退与防护，再将 `main` 自动发布打开；与用户最终“无需手工操作”目标相符。 | 必须先明确 required CI、PR 合并权限、失败通知、版本/数据回退、备份，再切换；当前**尚非完全 Railway 式自动发布**。 |
| **JSONL/PG 混合 vs 直接接 Railway DB** | [事实] Compose 本机启动隔离 PG 17，Host `APP_PLATFORM_CONVERSATION_AUTHORITY=POSTGRES`，`/data` 持久化。 | [方案判断] 首轮采用全新隔离 PG + 文件卷，避免跨云共享真实 Secrets 和危险生产数据迁移。 | 仍需持续重启读回、备份、迁移兼容和生产高可靠性验证。不能因为新 PG Healthy 就把它说成 Railway 原数据已迁移。 |
| **预览 Basic Auth vs 直接公开所有功能** | [事实] Caddy 模板对非 `/health` 页面启用 Basic Auth；Google 登录未作为首轮门禁。 | [方案判断] 在用户/组织身份尚未完整验收前增加外层预览防护；不会等同业务授权。 | Caddy 真实公网 401/200 行为仍需验收，Basic Auth 密码只保存在用户侧，不进聊天或文档。 |

先前成本候选（AWS Lightsail、阿里云、Contabo 等）是**用户早期方案讨论**，本窗口并未重新打开它们的 2026-10-27 官方报价/条款，不能在本索引写成当日经核验的价格/可用性。当前用户已购买腾讯云，继续全面比价不是这条部署线的最近真实阻塞。

## G. 来源冲突、未解问题与最高价值后续查阅

1. **运行时的“Healthy”与真实 HTTP**：run #40459162831 容器报 healthy 却 curl reset；原因是旧配置缺少 EVO 真实健康探针，不能用 Docker 进程运行状态代替服务健康。#1117 增加真实探针，run #40460609744 localhost JSON PASS。**真实根因究竟是 Node 初始化慢还是进程/端口短暂异常仍未有 Host 日志定论**；修复消除了虚假成功与无界回退，不要将推测上升为事故根因。
2. **旧运行手册状态行 vs 实时 Actions**：原 runbook 头仍称“SSH 预检失败/尚未部署”，它是历史保留而非最新状态；以 #40460609744 SUCCESS 和本交接快照为新事实；源 runbook 可增量更新，不改写旧失败证据。
3. **服务器本地成功 vs 公网可用性**：Actions health 仅证明 VPS loopback，web 工具访问 sslip hostname 失败并未返回 HTTP/TLS 证据；优先实际外网浏览器、`curl -v` 以及 DNS/443/80/Caddy ACME 记录。
4. **“像 Railway”自动发布 vs 当前 manual workflow**：已经具备镜像/SSH/Compose 自动执行流程，但每次新发布仍需手动 `Run workflow`；下一闭环是 gated main 自动触发且不会绕过 existing required CI。
5. **铁路原 production vs 新 VPS isolated validation**：当前并行，不迁移数据；Railway 2026-10-22 文档的“暂停部署”不说明当前 Railway 是否仍故障。若有真实切流需求，需重新用 Railway 连接器核对服务/域名/数据卷、备份、导出、验证和回滚，不采纳过期快照。
6. **企业登录/V3/PA05 多 Worker**：浏览器可打开不等于真实 Google OAuth 与 V3 100% Human 签收，也不等于 PA05 stop authority/WRITE 获生产批准；范围必须由对应 owner 继续签收。
7. **单机数据库安全**：目前卷持久化存在，尚无异机备份、故障恢复或敏感数据迁移证明；不得直接导入真实客户数据，或运行破坏性 SQL 清库进行验收。
8. **安全和可维护性**：预览 Basic Auth hash、Caddy HTTPS、公网 80/443 和 Docker 资源上限需实测；GitHub Environment admin bypass 设置当时为 enabled，是否改过未证实。后续需确保管理员/PR 保护、日志脱敏、镜像留存、磁盘增长监控。
9. **长期参考来源优先级**：先 Actions [#40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744) 原始运行 + [main Compose/workflow](https://github.com/jiangxng/EVO-App-Platform/tree/main/deploy/tencent-tokyo)，再查真实 VPS 公网日志；待需要 Google 登录时才查 Google 官方当前 OAuth redirect/cookie 条款；待需要自动发布时查 GitHub Environments/required-check、Actions 当前语义；待迁移 Railway 旧数据时再看 Railway 真实服务状态及安全披露原文。

## H. 资料到模块、工程状态及下一步的映射

| 具体模块/文件 | 已实施结论及来源 | 最新状态 | 不丢失的下一动作 |
| --- | --- | --- | --- |
| `Dockerfile` / `package.json` | G09、G10、A04：Node22 build、Host /health 已打通 | GitHub 构建及 VPS 本地健康 **PASS** | 首轮无必要改业务 Host；公网/真实页面失败才定位特定边界 |
| `.github/workflows/evo-tokyo-dev-deploy.yml` | G05、A01–A05：安全前置 SSH、GitHub build & GHCR、失败回滚条件 | `workflow_dispatch` 实测 **PASS** | CI 门禁/自动 `main` 发布由**下一独立短 PR**实现，先验收回退及通知 |
| `deploy/tencent-tokyo/compose.yaml` | G06、A03/A04：真实 PG/EVO/Caddy、容器内部 /health | VPS local health **PASS** | 真实资源使用/重启/持久化和 HTTPS 入口验证 |
| `deploy/tencent-tokyo/Caddyfile.template` | G08：sslip host、Basic Auth、/health | 实现已合并，**公网 OPEN** | 验证 443 证书、HTTP 302、401/200、health，必要时定向修复 |
| `deploy/tencent-tokyo/bootstrap.sh` | G07 + A04：独立 `evo-deploy` 身份、Docker/Compose、证书配置 | 一次初始化已足以通过运行链 | 不重复初始化、重置 key 或覆盖密码；只做读状态和必要补丁 |
| `docs/runbooks/EVO-TOKYO-DEV-DEPLOYMENT-20261027.md` | G11：实施详情、旧失败证明 | 历史 runbook 含过时状态头 | 用本交接最新版 run 作为真实线索；后续可增量改 live status，不清除故障证据 |
| `docs/runbooks/EVO-TOKYO-DEV-WINDOW-20261027-HANDOFF-ENTRY.md` | 本窗口独立简短入口 | 本文配套 | 新聊天优先入口 |
| `docs/runbooks/EVO-TOKYO-DEV-WINDOW-20261027-RESEARCH-REFERENCE-INDEX.md` | 以上原始 URL、等级、失败/成功摘录、决策比较 | 本文 | 只有证据真实变化才增量追加，不重做已调查项目 |
| `docs/roadmap/HANDOFF-LATEST.md` / `project.status.json` | G13–G14：全局 TR01 authority | **未由部署任务修改** | 严守交叉 Owner，不因腾讯云部署 SUCCESS 篡改业务签收 |
| BEX-01 / PA05 等独立 owner | G18–G19 及当前开放 PR | 用户要求保留并行开发 | 不修改/合并这些 PR；业务体验与认证单独验收 |

## I. 完成范围与仍未保存的资料

**已保存到 GitHub：** 两层交接文件（短入口 + 详细索引），本轮用到的 URL、原始失败/成功 run IDs、精确提交、方案比较、已读/摘要/待验证分级、风险和接续任务。原有 deployment runbook / workflow / Compose / PRs 本来就已在 main。

**无法从本聊天直接持久化到 GitHub 的私有证据：**（1）用户 GitHub Environment 页面原截图附件仅在当前聊天提供，路径及 file ID 已记录；（2）GitHub Environment Secrets 内容、VPS Caddy 预览密码、PG 数据库密码、SSH 私钥均**不复制入仓库和交接**；（3）VPS 实际 TLS/外网流量和应用持久化数据尚未经外部实测；（4）第三方官网文章的原文尚未读取，均保持 P2/P3；（5）独立铁路数据库/运行配置未取回，本专项无迁移证据。保持未证实，不臆造。

建议未来新窗口仅在本专项 PR/记录追加**新的** GitHub run、脱敏公网 HTTPS 验收、恢复验证和自动部署 PR，而不为“换窗口”重新查已经确认的 Node Dockerfile 或重复提交 ssh known-hosts 修复。
