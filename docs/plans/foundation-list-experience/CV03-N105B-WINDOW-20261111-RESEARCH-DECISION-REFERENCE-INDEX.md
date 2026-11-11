# CV-03 / N1-05b｜2026-11-11 研究资料、原始网址与决策详细参考索引

> **文档类型：** CV03_WINDOW_RESEARCH_DECISION_REFERENCE_INDEX / SOURCE_PROVENANCE  
> **简短交接入口：** [CV03 N1-05b post-merge entry](CV03-N105B-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md)  
> **写作前确切主线：** `main@981b91879e52e7e44e6af50338a7df9542257d17`，对应 #1219 的合并提交，**不是永久最新 SHA**；编制与本窗口访问日期 **2026-11-11**（GitHub Actions 时间戳为 UTC）。
>
> **证据标签：** G = 实际 GitHub 原文/源码/Actions 原始日志等可复核事实；D = 用户已确认选项或根据 G 的工程判断；P = 仍需真实独立 Owner、SQL 实际资源或物理验收。  
> **访问等级：**「已读原文」= 本窗口实际通过 GitHub Connector 获取仓库文件、Issue 正文/评论或 Actions 原始日志（若只读相关段，注明节选）；「仅看摘要/元数据」= 实际读取 PR/目录/搜索结果等但**未检查原始 diff/正文**；「待验证」= 仅有路径、方案要求或历史引用，**本窗口未访问其原文或现场证据**。**本窗口未使用通用网络搜索引擎，故没有可冒充“已读”的外部官方网页搜索资料；历史外部来源另见旧研究索引，不复制其阅读等级。**

## 1. 用户明确目标、批准项与未批准项

1. **目标：** 基于现有 Eidos、EVO Platform、PA05 Manager、AuthorizationProvider、Domain Owner，完成 CV-03 Personal Saved View 的生产兼容授权事务。Human 与 Personal Agent 使用真实同源业务事实和独立的 Subject/ActorType/Enterprise 权限；不得绕过 Host ActionRouter，不能另起通用列表/授权框架。
2. **用户原话（本窗口）：**「同意方案 A」；多次「继续」要求持续实际执行，PR/CI/main/分支清理；「开发权限：ＬＬＭ主导，所以你有全部权限，毋庸置疑」；「测试环境：现在用的是东京的腾讯云，你可以查一下历史记录」；「最终验收：你随时可以发布」。
3. **已确认 D：** 方案 A——真实授权状态/`source_generation`/`authority_epoch` 和 immutable outbox 处于**同一个 PostgreSQL ACID T0 提交边界**；保留 PA05/Provider/Domain Owner 既有 API；首选现有腾讯云东京 Lighthouse，而不是新购 Railway。
4. **执行授权的边界：** 用户已授权工程及预览环境受控发布，**并未提供已实施的 KMS/Producer、独立 DB/Security 审核凭据或完成 N1-05c～f 的技术证据**；这些不是一项“口头同意”即可变为通过的物理验收。默认 `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 POST SAVE 403、未注册 Page GET 404。
5. **工程纪律：** 不直接推 main；独立 Draft PR + exact SHA CI + merge + 安全删过程分支；不覆盖 PR #1184 的三份 Owner 文档；不修改生产业务表、数据库卷、Secrets 或其他工作线以制造进度。

## 2. 实际访问的研究来源清单（原始 URL、时间、主题、关键发现及实施用途）

以下日期是**本窗口查阅日期（2026-11-11）**，不是文档原始创建日。文件使用**固定 commit URL**，避免 main 前进后源码位置发生变化；Issue/PR/Actions 使用原始 GitHub URL。所有「原文」均指相应 Repo 原文/Actions 日志，**不是第三方新闻报道**。

### A. 架构、实际代码与已存档方案

| ID、原始标题 / 网址 | 本窗口访问等级及日期 | 主题、来源 G 发现；具体用途 |
| --- | --- | --- |
| A01 [CV03 N1 生产授权权威集成决策与验收](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/plans/foundation-list-experience/CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md) | **已读原文**，11-11 | ``A–E：LifecycleStore(file/memory) 与 AuthorizationProvider/SQL 没有共同事务；定义 N1-05a～f、T0/SQL/Recovery 故障矩阵、Not Certified。**下一窗口的权威验收基线，不得另写竞品方案替代。** |
| A02 [CV03 N1-05a Owner Decision Gate](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/plans/foundation-list-experience/CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md) | **已读原文**，11-11 | ``Source graph / Candidate A&B / Owner signoff matrix：真实 Manager file 与 AuthorizationProvider 的断裂、A 推荐/B 候选，Owner 表仍 PENDING。**确认方案 A 用户选定不等于真实 DB/Security 签收。** |
| A03 [CV03 N1-05b-01～06 增量方案与工程记录](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/plans/foundation-list-experience/CV03-N105B-01-APPROVED-A-DENY-T0-SEAM-20261111.md) | **已读原文**，11-11 | ``N1-05b-01～06：单范围 DENY → 全 Feature 范围冻结 → 共享 Package 误停 → Feature 级生命周期 → 激活前 DENY → 东京物理只读清查。**直接继承已合并接口及限制，不重复开发。** |
| A04 [manager/service.ts — AppManagerService](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/service.ts) | **已读原文相关函数/节选**，11-11 | ```resolveFeature` / `planInstall` / `install` / `enable` / `activateForEvent` / `planDeactivateFeature` / `deactivateFeature` / `planDisable` / `disable`。Package disable 影响所有 Feature，新增单 Feature 操作审查同包及跨包依赖；Host preactivation callback 否决未认证 Feature。**N1-05b Host T0 接线只调用 Feature 级方法，不对共享 Package 作 uninstall。** |
| A05 [manager/store.ts — LifecycleStore](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/store.ts) | **已读相关源码节选**，11-11 | 本地 file/memory `deleteActiveFeature` 与状态快照/锁，不是 PostgreSQL 事务。**QA 中必须验证 local crash-after-SQL-commit 后保持 DENY、恢复重放；不能当作权威 outbox。** |
| A06 [manager/server.ts — 真实 Host](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/server.ts) | **已读相关原文节选**，11-11 | 实际 `createAppManagerService` 传入 deny callback；`assertCv03HumanSaveNotEnabledV010`、恢复 Feature 检查、未授权 command gate；原有事件回调仍为进程内。**生产 SAVE hard gate、首次/重启/再激活路径和发布风险核验的目标文件。** |
| A07 [manager/cv03-personal-saved-view-host-admission.ts](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/cv03-personal-saved-view-host-admission.ts) | **已读原文**，11-11 | 写操作 `collection.saved-view.personal.save` 被强制拒绝；恢复已激活但未认证 Saved View Feature 会拒绝 Host 启动；`SAVE_MODE` 只允许 OFF。**独立上线 PR 才可能解除；现阶段必须保留。** |
| A08 [manager/cv03-n105b-authority-t0-pg.ts](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/cv03-n105b-authority-t0-pg.ts) | **已读原文及修改章节**，11-11 | 仅是 UNMOUNTED、deny-only Host-side SQL function 调用端；`commitDeny` 单 Scope、`fencePackage` 全 Saved View Feature 范围单次函数调用并核验回执。**不是已部署的 `SECURITY DEFINER` DB function、也不能证明后端原子性。** |
| A09 [manager/cv03-n105b-pa05-host-lifecycle.ts](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/manager/cv03-n105b-pa05-host-lifecycle.ts) | **已读原文**，11-11 | UNMOUNTED Host-only adapter 先 operator 检查 + 未来 DBA 全范围 DENY/outbox，再调用真实 Manager `deactivateFeature`；故障后同 key replay；拒绝 Package UNINSTALL。**新窗口只在真实 DB role/T0 可验证后连接 Host。** |
| A10 [providers/enterprise-context/package.ts](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/providers/enterprise-context/package.ts) / [personal-saved-views.ts](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/providers/enterprise-context/personal-saved-views.ts) | **已读相关原文/Manifest 章节**，11-11 | `host-enterprise-context-provider.default` 与 `host-enterprise-context-provider.personal-saved-views` 是**同 Package 不同 Feature**。**真实 Manager 的测试须保留默认企业上下文、资源与定义；不可整包停用。** |
| A11 [CV-03 N1-05b Opt-in PG Deny T0 Contract Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/.github/workflows/cv03-n105b-authority-t0-contract.yml) | **已读原文**，11-11 | `npm ci` + TypeScript build + 目标 Node 测试，**不连接实际 DB**。**不得把绿色的模拟回执单测当真实 T0 证据。** |
| A12 [CV03 N1-04l 前窗口研究交接入口](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/plans/foundation-list-experience/CV03-N104L-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261111.md) | **已读原文**，11-11 | 给出 N1-04e～l 的研究遗产、PG18 isolated 与 PA05 文件屏障局限。**用于不重复前窗口工程；先前的外部网页来源以其配套索引历史等级为准，不冒称本窗口访问。** |

### B. 腾讯云东京实际部署、现场数据库与 Actions（本窗口新增关键证据）

| ID、原始标题 / 网址 | 本窗口访问等级及日期 | 主题、来源 G 发现；具体用途 |
| --- | --- | --- |
| B01 [EVO 东京验证环境：腾讯云 Lighthouse 独立部署](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/runbooks/EVO-TOKYO-DEV-DEPLOYMENT-20261027.md) | **已读原文**，11-11 | ``0–4、6–8：实例 `evo-dev-tokyo-01`、东京、当时 2vCPU/4GB/60GB、IP 衍生域名、环境 `evo-tokyo-dev`、SSH pinned host/secret、GHCR SHA、Docker/PG/Caddy、预览不等于 production。**确立现有环境复用，不重买 Railway。**历史首次失败需与最新成功日志区分。 |
| B02 [deploy/tencent-tokyo/compose.yaml](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/deploy/tencent-tokyo/compose.yaml) | **已读原文**，11-11 | `postgres:17-alpine` / DB `evo_dev` / `postgres-data` volume / internal network / `evo` preview Host / Caddy，未暴露 5432；现有 Session/preview policy 不是生产身份。**QA 数据库/role 必须在不伤业务卷的前提下隔离。** |
| B03 [deploy/tencent-tokyo/bootstrap.sh](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/deploy/tencent-tokyo/bootstrap.sh) | **已读原文**，11-11 | 初始 Docker、SSH/host identity、预览 Basic Auth 配置及随机 PostgreSQL 口令；重复执行有环境状态风险。**不要再次 bootstrap 或输出/重建 secrets。** |
| B04 [东京 CI 全绿自动预览发布说明](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/operations/EVO-TOKYO-CI-GATED-PREVIEW-RELEASE-20261028.md) | **已读原文**，11-11 | `workflow_run` 监听受保护 main continuity，验证 SHA、CI、发布；纯 docs 跳过镜像。**已自动部署，不必要求用户每次手动发布。** |
| B05 [东京验证环境历史发布结果 2026-10-28](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/runbooks/EVO-TOKYO-DEV-RELEASE-RESULT-20261028.md) | **已读原文**，11-11 | 先前 `35baedca...` 成功、HTTP health/HTTPS/401；Human 页面和备份/恢复仍未证明。**历史基线，不可作为 11-11 镜像实时状态。** |
| B06 [东京 CI-Gated Preview Release Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/.github/workflows/evo-tokyo-dev-deploy.yml) | **已读原文**，11-11 | ``preflight 23–95`：protected main、runtime diff、exact check runs；`deploy 96–284`：GitHub Environment SSH、GHCR immutable SHA、`.last-health-pass-sha` rollback、本机 health、HTTPS/401。**新窗口先检查部署是否真触发、是 deploy 还是 preflight-skipped。** |
| B07 [东京 #42958911243 / job #130321040832 原始发布日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958911243/job/130321040832) | **已读 Actions 原始日志**，11-11 | `2026-11-11 04:26:49–58 UTC` PostgreSQL 容器 `Up 2 weeks (healthy)`；`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=eb5a0e2...`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。**真实 Tokyo 镜像健康的本窗口最强可核验部署证据。**不是浏览器功能/安全签收。 |
| B08 [CV03 N1-05b Tencent Tokyo PostgreSQL Read-only Inventory Workflow](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/.github/workflows/cv03-n105b-tokyo-db-readonly.yml) | **已读原文/本窗口新建并合并**，11-11 | 限定 main、使用原 Environment 严格 SSH 主机身份、`BEGIN TRANSACTION READ ONLY` / `ROLLBACK`，只取 DB 元数据、role 能力、函数/schema 个数、健康与 401。**可复核的只读物理 preflight**，不能当迁移。 |
| B09 [现场东京数据库 #43012098340 / job #130494003592 原始日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340/job/130494003592) | **已读 Actions 原始日志**，11-11 | `2026-11-11 11:27:37–38 UTC`，PG `server_version_num=170011`（17.11），DB `evo_dev`，role `evo` 为 `super=true, createdb=true, createrole=true`，DB size `8025779` 字节，N1-05b 函数计数 0、Schema 计数 0；`CV03_TOKYO_READONLY_SQL_PASS`；公网边界 PASS。**下一步隔离 QA DB/低权限 SQL 登录的直接证据。** |
| B10 [东京部署 #43012135657（PR #1219 合并后）](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012135657) | **已读 Workflow jobs + preflight 原始日志**，11-11 | 主线文档/CI 合并到 `981b9187...` 后，preflight `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=981b...`，deploy job **SKIPPED**。**防止误称最新 docs merge SHA 镜像已重新发布；现有健康镜像仍为 `eb5a...`。** |
| B11 [#1219 合并后的 Branch Hygiene #43012098785](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098785) | **已核对 Workflow 状态及远端 branch 列表**，11-11；**未重新逐行读取该 Job 原始日志** | Workflow SUCCESS，`docs/cv03-n105b-tokyo-db-readonly-preflight-20261111` 分支搜索为 0。**此分支不能作为新窗口基线；直接使用 main。** |

### C. 决策讨论、PR 与验收记录（注意与“读过原始 diff”区分）

| ID、原始标题 / 网址 | 本窗口访问等级及日期 | 关键发现和项目用途 |
| --- | --- | --- |
| C01 [Issue #1212 — N1-05a Owner decision and production authority signoff](https://github.com/jiangxng/EVO-App-Platform/issues/1212) | **已读 Issue 原文与实际评论**，11-11 | 条目打勾但缺具名岗位/日期/具体资源/回滚/Producer/KMS 真实证据；Issue 曾被关闭又重新打开，目前 OPEN。**这是 N1-05b 真实 T0/安全生产验收的协调门禁，不能以打勾和用户架构同意关闭。** |
| C02 [#1212 本轮最终东京实测交接评论](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6794613430) | **已读本窗口提交正文及 Issue 最终引用**，11-11 | 汇总腾讯云替代 Railway、PG17.11、`evo` 超级用户、函数/schema=0、下一步 QA role。**新窗口的 Issue 状态入口**，不是独立 DBA 生产签字。 |
| C03 [#1211 N1-05a 初始工程](https://github.com/jiangxng/EVO-App-Platform/pull/1211) / [#1213 后续边界](https://github.com/jiangxng/EVO-App-Platform/pull/1213) | **仅看 GitHub PR 元数据/描述，未逐行检查本轮原始 diff**，11-11 | 均 MERGED，提供既有 preflight、Owner 决策文件和 Provider 边界依据。**不能重做 #1211/#1213；源码事实以 A01–A11 为准。** |
| C04 [#1214 N1-05b-01](https://github.com/jiangxng/EVO-App-Platform/pull/1214) / [#1215 N1-05b-02](https://github.com/jiangxng/EVO-App-Platform/pull/1215) | **读取 PR 元数据/描述；对应新源码及测试章节已读，未逐行读 PR diff**，11-11 | 均 MERGED；DENY 单 Scope 客户端、全范围 `fencePackage()` + 先 T0 后 Manager 组合，**尚无实际 DB 函数**。Actions [#42953740540](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42953740540) 7/7、[#42954857154](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42954857154) 15/15，是注入 SQL/Manager 的工程测试。 |
| C05 [#1216 N1-05b-03](https://github.com/jiangxng/EVO-App-Platform/pull/1216) / [#1217 N1-05b-04](https://github.com/jiangxng/EVO-App-Platform/pull/1217) | **读取 PR 元数据/描述；对应源码原文相关章节已读**，11-11 | 均 MERGED；修复停 Saved View 误关整包，新增 Manager 单 Feature 停用。Actions [#42955776861](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42955776861) 17/17、[#42957283348](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42957283348) 25/25。**下一步保留共享 Package 默认能力。** |
| C06 [#1218 N1-05b-05](https://github.com/jiangxng/EVO-App-Platform/pull/1218) / [专项 CI #42958513093](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958513093) | **已读取代码相关章节及 Actions Job 原始测试汇总；PR 仅元数据**，11-11 | MERGED，真实 Host 在激活前拒绝未认证 Saved View，专项 31/31；该 PR HEAD 共 48/48 Actions 成功。**不自动解除 SAVE 生产门禁。** |
| C07 [#1219 N1-05b-06](https://github.com/jiangxng/EVO-App-Platform/pull/1219) | **已读取新建 workflow 和 PR 元数据/合并状态；原 PR diff 未另行读取**，11-11 | MERGED，HEAD `f5bb6694b2f7fb820fae7f7ad20975b43fd7e854`，merge `981b91879e52e7e44e6af50338a7df9542257d17`；真实只读核验见 B09。**非生产 schema 上线 PR。** |
| C08 [#1184 并行 Owner 的 C3-02 文档 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | **仅看 PR 元数据及 Changed Files 列表；未读其新 diff**，11-11 | 当前 OPEN，不得修改其三份文件：`COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`（均位于 `docs/plans/foundation-list-experience/`）。 |

### D. 引用但没有在本窗口新读原文的研究/资料（避免补造）

| ID、原始路径或页面 | 等级、原因、待验证用途 |
| --- | --- |
| D01 [CV03 N1-04l 历史研究详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/981b91879e52e7e44e6af50338a7df9542257d17/docs/plans/foundation-list-experience/CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md) | **本窗口仅确认路径/由入口引用，详细正文未再读取**；其中关于旧 PG18、官方网页的“已读原文/仅摘要”是**前窗口历史声明**，新窗口要用原索引和实际来源复核，不能重新盖成本窗口“已读”。 |
| D02 未来腾讯云控制台中的实时 CPU/可用磁盘、备份有效性与 DB 容量余量 | **待验证**；本轮只有历史机器规格、实时 `pg_database_size`，**没有读取宿主总剩余容量、异机备份/快照或 Tencent API 控制台**。新窗口 QA DB 前优先取证。 |
| D03 未来 DBA/AuthorizationProvider/PA05/Security 独立签收、正式 SQL LOGIN/KMS/EXECUTE-only GRANT 与恢复 SLO | **待验证/不存在足够证据**；#1212 只是协调 Issue。不可填入臆造人员、签名、凭据、SQL 角色或 Producer 源。 |
| D04 ``cv03_n105b_commit_deny_t0` / `cv03_n105b_fence_package_t0` 生产数据库函数原文或 GitHub 迁移 SQL | **待验证/本次实测目标库函数计数为 0**；仅有客户端的**候选 API**，没有真实 T0 Schema。 |
| D05 真实 Human 浏览器及外部 Personal Agent 对正式 Saved View SAVE 的线上验收截图 | **待验证/未生成**；正式 SAVE 仍 OFF/403，网页功能的实际渲染及授权签收不可由 health 或 CI Node Mock 代替。 |

**阅读统计说明：** 本窗口**没有**新的独立公开网页（例如 PostgreSQL 官方手册、腾讯云官方开发文档）的 `web` 搜索摘要/原文访问；本轮材料来自受授权 GitHub 仓库原文、PR/Issue 元数据与 GitHub Actions 原始日志。若下一窗口进行真正 SQL 函数设计，必须按需查阅**实际当前版本**的 PostgreSQL 17 官方 `SECURITY DEFINER`、`SESSION_USER`、`GRANT/REVOKE`、事务隔离、`search_path` 与函数安全配置文档，**不能把它们写成已读**。

## 3. 难以重新访问的 Actions 关键原始证据摘录（脱敏，保留原日志入口）

GitHub Actions 原始 Job 日志和短期 artifact 可能过期。**本索引的以下标记已从本窗口原始日志读取并摘出**；不复制 token、SSH key、数据库口令或敏感环境变量，也没有制作截图。建议需要复审时通过上方 job URL、日志行全文、时间戳查原文。下列时间均 **UTC**。

### 3.1 真实东京 EVO 预览版本健康 — B07

- Run URL：`https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958911243`
- Job URL：`https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958911243/job/130321040832`
- `2026-11-11T04:26:56 UTC`：Docker 中 `evo-tokyo-dev-postgres-1` 为 `postgres:17-alpine`，`Up 2 weeks (healthy)`。
- `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=eb5a0e2a0ab2aa4a0aa6b88c08def173a133b74e`
- `EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`
- `EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`
- **结论 G：** 该 SHA 的东京真实预览主机健康；**不能推出** Saved View 已获生产 WRITE、Human 浏览器真实完成、PG 最小权限或可恢复数据库备份。

### 3.2 真实东京 PostgreSQL 只读 SQL — B09（本轮最重要证据）

- Run URL：`https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340`
- Job URL：`https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340/job/130494003592`
- `2026-11-11T11:27:37–38 UTC`，执行 `BEGIN TRANSACTION READ ONLY` + `ROLLBACK`：
  - `CV03_TOKYO_PG_VERSION_NUM=170011` → PostgreSQL **17.11**；
  - `CV03_TOKYO_DB_NAME=evo_dev`；
  - `CV03_TOKYO_DB_ROLE=evo`；
  - `CV03_TOKYO_ROLE_PRIVILEGES=super=true,createdb=true,createrole=true`；
  - `CV03_TOKYO_DB_SIZE_BYTES=8025779`；
  - `CV03_TOKYO_N105B_FUNCTION_COUNT=0`；
  - `CV03_TOKYO_N105B_SCHEMA_COUNT=0`；
  - `CV03_TOKYO_READONLY_SQL_PASS`；
  - `CV03_TOKYO_HEALTHY_DEPLOY_SHA=eb5a0e2a0ab2aa4a0aa6b88c08def173a133b74e`；
  - `CV03_TOKYO_PUBLIC_READONLY_HEALTH_AND_401_PASS`。
- **结论 G：** 可连到实际已有 Postgres，数据库角色权限过大、N1-05b 尚未安装；只读 preflight 成功不表示可以将现有 `evo` 账户复用为正式最小权限 Producer。
- **不在日志里的事实：** 是否已有真正异机备份；容器宿主剩余磁盘；生产认证角色；具体安全值班人员。这些是 P 待验证。

### 3.3 文档合并后的预览发布跳过 — B10

- Run URL：`https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012135657`。
- `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=981b91879e52e7e44e6af50338a7df9542257d17`；preflight SUCCESS、deploy SKIPPED。
- **结论 G：** 文档与 workflow 新增并没有使东京重新发布新运行时镜像；**源 main SHA 与已部署镜像 SHA 暂时不同并不表示部署失败**。

### 3.4 真实物理 vs 注入客户端测试的不可混淆性

| 工程 Run | 真实可证明内容 | 不能证明内容 |
| --- | --- | --- |
| [#42953740540](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42953740540) | N1-05b-01 客户端 7/7 unit tests；单 scope DENY 调用形状 / 错误回执失败关闭 | 数据库函数已安装、SQL GRANT/真实原子 T0 |
| [#42954857154](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42954857154) | N1-05b-02 15/15，真实 Manager + 注入的 SQL Executor，撤权先于本地操作 | 全 Scope SQL inventory/生产 outbox |
| [#42955776861](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42955776861) | N1-05b-03 17/17，共享 Package 保护 | 真实 SQL 生效 |
| [#42957283348](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42957283348) | N1-05b-04 25/25，真实 Manager Feature 级依赖 | 跨 Worker 权威撤销 |
| [#42958513093](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958513093) | N1-05b-05 31/31，真实 Host 来源激活前 DENY；PR HEAD 48/48 Actions 成功 | 授权启用、PG Producer 真实身份 |
| [#43012098340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340) | N1-05b-06 **腾讯云现场 READ ONLY PG SQL**，角色/函数/schema/容量可核查 | 执行任何 DDL/DB role 创建/数据迁移 |
 
## 4. 方案比较与取舍：把“来源事实 G”与“设计判断 D”分开

| 选项 | 来源事实 G | 本轮决定 D、理由 | 适用条件 / 反对理由 / 限制 |
| --- | --- | --- | --- |
| **A：现有 PA05 + Provider 权威与 immutable Outbox 统一在 PostgreSQL T0** | 当前本地 LifecycleStore、Runtime AuthorizationProvider、Node 事件发布与 SQL Resource store 不是同一个提交；客户端 port 已交付，PG 真实函数 0。 | **用户明确选定**。统一一个 commit boundary 使授权撤销与待投递事件同成同败、支持 epoch/generation 与幂等重放；保留业务层 API。 | 必须实际实施可信 SQL LOGIN、事务函数、完整 offline scope、不可变 outbox、独立 provider source/rollback、default-deny READ；没有实际 PG SQL/DML denial 与多 Host 试验不得认证。 |
| **B：文件与 SQL 跨存储的正式 fail-closed 协议** | `onLifecycleEvent` 在本地变更之后触发，不是 durable cross-store T0。 | **不采用**，现有实现无法保证网络断开/旧 ALLOW 时的全范围拒绝。 | 只有有 Owner 批准、可度量为零/可接受旧 ALLOW 窗口、完整故障恢复的正式协议才可重新评估；当前无该证据。 |
| **直接把 PG18 isolated `cv03_n104f_test_*` / CI key 部署生产** | PG18 fixture 是隔离验证，东京现场是 PG17.11 且目标 schema/function 0。 | **明确排除**。测试证明协议思路，不证明真实 DB 角色、Producer/KMS/Sql DML。 | 只能作为测试设计参考，不得复制测试密钥、角色或表名充数。 |
| **Saved View 停用直接调用 `AppManagerService.disable(packageId)`** | 真实 Enterprise Context Provider Package 包含 DEFAULT + opt-in Saved View；`disable()` 会停整个 Package 的活跃 Feature。 | **排除并由 #1216/#1217 修复**。Feature 范围撤权和单 Feature 停用才符合业务影响边界。 | 当前 `deactivateFeature()` 仍只是 local manager；真正 SQL T0、重启/重新激活 fence 仍要独立验证。 |
| **继续用 Railway/新购服务器做主测试** | 旧资料曾涉及 Railway；但当前腾讯云东京 Lighthouse 实机已部署、自动发布、PG17.11 READ ONLY 证据齐全。 | **排除为默认路线**，不重复购置；选现有东京，节省切环境和成本。 | 东京是**预览**，隔离 QA DB 与权限/备份、容量回滚验证后才能动真实 PG；不得无意替换现有服务。 |
| **使用当前 `evo` 超级用户做签名 Producer** | 现场 `rolsuper/rolcreatedb/rolcreaterole = true`。 | **排除**，无法证明 DB 层阻止不可信直接 DML；必须新设最小权限角色或可信的隔离执行服务。 | 实际角色配置、`EXECUTE`/`REVOKE`、search_path/函数拥有者与连接池身份仍是下一工作包；不要直接收紧当前 `evo` 影响预览。 |
| **拿 CI PASS、/health 200 或用户授权发布等价 N1 认证** | 工程测试、健康与用户授权均真实存在；N1-05b 实施的 SQL function/schema 实测不存在，#1212 Owner 实际签收仍缺。 | **明确拒绝**混用“开发/发布授权”与“物理安全验收”两个概念。 | 可以继续 QA 与预览版本发布；不可开放正式 SAVE 或宣称安全验收通过。 |

## 5. 跨资料冲突、变化与解决记录

1. **“Railway 是下一测试环境” vs “当前东京腾讯云”**：先前助手建议创建 Railway 测试库，**用户明确纠正**；由 B01–B09 的已读真实仓库与现场 PG 数据支持改用腾讯东京。**已解决，更新后者为当前事实**。
2. **旧 2026-10-27 Runbook 写“首次尚未发布/SSH preflight FAIL” vs 11-11 成功**：历史文档写作时正确，但其状态已过期；以 B07 最新发布 Job 为准，不要重演首次 bootstrap/密钥排障。**已解决（按时间轴区分）**。
3. **原先方案声称 Owner Issue 全部打勾/短暂 CLOSED vs “仍 PENDING”**：#1212 文本缺具名签名、具体环境、物理 GRANT/回滚。Issue 现 OPEN；**打勾与有效独立签收不等价**。**组织性签收仍未决**。
4. **PG18 isolated Atomic CAS/T0 演示 vs PG17.11 现场**：前者是模拟/隔离或不同部署，不可拿来证明物理 Tokyo PG 用户和表；B09 实测无函数。**未决：真实 QA PG17 SQL 实现与 role denial**。
5. **原始 #1215 套用 Package disable vs #1216/#1217 共享 Package 实证**：前者会误停默认企业 Provider；已纠正为单 Feature API + 强制拒绝卸载，共享能力留存。**工程冲突已解决**，真实 SQL 未解决。
6. **#1217 已支持 Feature deactivation vs 后续 install/enable/event 可能重新激活**：#1218 在正式 Host 添加 preactivation hard deny，局部绕过已关闭。**仍需证明跨 Host/数据库的 authoritative epoch fence**。
7. **“main 已到 981b...” vs “东京镜像为 eb5a...”**：由 B10 证实 docs/CI-only 自动发布正确跳过；**两个 SHA 指不同对象、不是事故**。
8. **用户“随时可发布” vs 当前 `N1=NOT_CERTIFIED`**：授权可以执行受控发布流程，但不代表已经验证应用最小权限、Producer/KMS、撤权全范围或 SAVE 可开。**边界仍保留**。
9. **N1-05b Host port 命名 `fencePackage` vs 真正的 Feature 范围冻结**：函数名是候选命名，物理语义必须锁定 Saved View Feature 的**所有 Subject/Enterprise/Actor/未来 Scope**，不可错误冻结其他 Provider 或仅逐主体循环；正式 SQL contract 仍待确认。

## 6. 实施清单：PR、精确 HEAD/merge SHA、模块、下一步

| 阶段与 PR | PR exact HEAD → main merge SHA | 已执行 G 交付 | 接续映射 |
| --- | --- | --- | --- |
| N1-05a [#1211](https://github.com/jiangxng/EVO-App-Platform/pull/1211) | `20974008d7f64c35c95499d450e7a7b29eae5807` → `d27794869fc192cb85078edd5ea6970f4b6d41ae` | Authority boundary preflight 和 Owner 决策门禁 | `docs/.../CV03-N105A-*`，Issue #1212 |
| N1-05a [#1213](https://github.com/jiangxng/EVO-App-Platform/pull/1213) | `35715ef783f3bc9d08651247f611be993aaffc77` → `74c25b5958086b99d0c2dafa45127358cf248c28` | Host/Provider source evidence、验证 | 不能冒认 production identity |
| N1-05b-01 [#1214](https://github.com/jiangxng/EVO-App-Platform/pull/1214) | `dec8af3f6e4a93483169402d68978a418acaba85` → `51ef8290e03de0d9b396228e64b6b2f6173a48b9` | DENY-only SQL function client + 7/7 | `manager/cv03-n105b-authority-t0-pg.ts` |
| N1-05b-02 [#1215](https://github.com/jiangxng/EVO-App-Platform/pull/1215) | `6cd1f19abe2eff9b0389e32ba8c9611466629786` → `9d5de8d52e20a91b332d71df3e8815e518178cb7` | 全范围功能冻结 port + 本地 lifecycle barrier + 15/15 | `manager/cv03-n105b-pa05-host-lifecycle.ts` |
| N1-05b-03 [#1216](https://github.com/jiangxng/EVO-App-Platform/pull/1216) | `c060bb6757a37447130812ea1fc32f5b8b6675d9` → `527663631710cb50e83a8797f8e8da59c9c17fd3` | 共享 Package 误停 hard reject + 17/17 | 保存 default Enterprise Provider |
| N1-05b-04 [#1217](https://github.com/jiangxng/EVO-App-Platform/pull/1217) | `1fe7085f53afab36238aba3a3160aa31f432e9ea` → `2b3ff8d519d149e31858ff65beb5934c81458686` | Manager Feature-only planning/disable + 25/25 | `contracts/package.ts`、`manager/service.ts` |
| N1-05b-05 [#1218](https://github.com/jiangxng/EVO-App-Platform/pull/1218) | `75fa9e0dc4cb70eaf97248d9136fccc8095c9caf` → `eb5a0e2a0ab2aa4a0aa6b88c08def173a133b74e` | 正式 Host 启动/激活前拒绝，31/31；48/48 Actions | `manager/server.ts`、`manager/service.ts` |
| N1-05b-06 [#1219](https://github.com/jiangxng/EVO-App-Platform/pull/1219) | `f5bb6694b2f7fb820fae7f7ad20975b43fd7e854` → `981b91879e52e7e44e6af50338a7df9542257d17` | **实际 Tokyo PG17.11 READ ONLY** + role/function/schema evidence；#43012098340；Branch Hygiene #43012098785 | `deploy/tencent-tokyo`；QA DB/角色/物理 T0 下一步 |

### 下一轮最小可执行任务（优先顺序）

1. **刷新最新主线、Issue #1212 与并行 PR #1184**，保留本交接基线及新文档的合并 commit；不得因换窗口重复实现 #1214～#1219。
2. **东京资源只读评估：** 当前 Docker PostgreSQL、可用内存/磁盘、备份或快照是否能恢复、服务/DB 用户隔离、当前预览上数据写入路径；确认创建独立 QA DB/roles 不影响 `evo_dev` 或卷和 Caddy。
3. **隔离 QA 物理授权：** 在既有服务器使用明确命名的**QA 数据库/Schema/非超级用户**、严控 `EXECUTE`/`USAGE` 与默认权限；回滚清单、审计 trace 先落库。不得使用当前 `evo` role 或匿名 Agent SQL login 当最小权限证明。
4. **真实 T0 原子与 outbox：** 用实际 PostgreSQL SQL 函数+DB session identity 绑定重写/验证 `cv03_n105b_*` 候选接口，实现全 Scope deny/fence 与不可变 outbox 一事务，并在真实 DB 角色上测试失联、回滚、旧 epoch、双 Host、direct DML 拒绝。与既有 PA05/AuthorizationProvider 的真实持久权威同步，不能只执行模拟 Executor tests。
5. **安全与发布：** #1212 要求有名字/岗位/日期、环境资源、测试证据及恢复/回滚 Owner；N1-05c～f 独立阶段通过前不移除 SAVE OFF/403/404。实际发布采用东京的 SHA gated workflow 而不是无意触发 main 一切变更重启。
6. **资料继续查阅方向（此前未读）：** PostgreSQL 17 官方文档的 `SECURITY DEFINER`、函数 `search_path`、`SESSION_USER/CURRENT_USER`、transaction locking/serialization、function `GRANT EXECUTE`、role inheritance 与 revocation，以及腾讯云 Lighthouse 当前存储快照/备份与 CI SSH 权限现实配置；记录本轮之后真实访问的 URL/时间/章节再补索引。

## 7. 易失资料、截图/附件、保存范围与明示缺失

- **强证据已经入 GitHub**：准确 PR、merges、两份本次交接、Issue #1212 近期评论、现有 N1-05b 工程文档以及东京的 Actions 原始 job URLs。尤其上方 `B09` 已摘录实际 SQL 所有关键结果，避免后续 Actions 过期后忘记 `evo` 是超级用户和 N1 function/schema 计数=0。
- **没有新截图可定位**：本窗口未生成/上传腾讯云控制台或真实 Human 页面截图、未导出 GitHub Actions artifact 到仓库；**不能声称存在截图/附件路径**。需要长期证据时应新建独立脱敏存档并标记是截图还是日志。
- **不保存任何敏感值**：GitHub Environment `EVO_TOKYO_SSH_PRIVATE_KEY`、`EVO_TOKYO_SSH_KNOWN_HOSTS` 实值、PG password、token、Session/Producer/KMS key 均未写入文档；IP 派生公共预览地址已在原公开 runbook。
- **外部研究仅保留访问事实**：没有把此前窗口的官方 PostgreSQL/Railway/SharePoint 文档虚构成本窗口已读。历史引用只能由本次 A12/D01 追到旧索引再核对。
- **不会覆盖并行文件**：PR #1184 的三份 `docs/plans/foundation-list-experience/` 受管文件、`project.status.json`、其他窗口 Agent/PA05/BEX/eidos 文档均不在本次修改范围。
- **本交接创建时还有一步**：本两份文档须以独立 PR + exact-head CI 合并 main；PR 合并后的**最终 merge SHA 和 Branch Hygiene 状态应在本窗口交付回复中核验**。本文件保存的 `981b...` 是**文档编制前**的主线，不要把它冒充文档 PR 的合并后 HEAD。
