# CV-03 / N1-05b｜2026-11-11 新窗口简短研究与决策交接入口

> **文档类型：** CV03_WINDOW_POSTMERGE_HANDOFF_ENTRY（2026-11-11）
> **详细资料、原始网址、来源等级、决策与冲突：** [本窗口研究资料与决策详细参考索引](CV03-N105B-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)。
> **写文档前准确主线：** `main@981b91879e52e7e44e6af50338a7df9542257d17`（已合入 PR #1219）。本交接文件由独立文档 PR 合入后，**新窗口必须再次拉取 main 的最新 40 位 SHA**，不可将此旧基线或已删过程分支当成最新。
> **工程事实 G / 设计与用户决策 D / 待真实认证 P** 严格分开；生产 `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403、未注册页面 GET 404 不变。

## 1. 这一窗口的目标、明确用户决定

本轮接续此前的 **Eidos + EVO App Platform + PA05 Manager + AuthorizationProvider + Domain Owner** 的 Personal Saved View 生产授权线，强调“实际执行代码、精确 HEAD 的 CI、合并 main 与清理过程分支”，不是只汇报进度；不另造新的业务列表框架或通用数据库，也不覆盖其他窗口 Owner 文档。

用户明确说过：**“同意方案 A”**；随后多次“继续”推进 N1-05b-01～05；最终明确 **“开发权限：LLM 主导，所以你有全部权限”**、**“测试环境：现在用的是东京的腾讯云，你可以查一下历史记录”**、**“最终验收：你随时可以发布”**。因此无需重复询问架构选型、是否可开发/发布、是否继续使用 Railway。允许按既有 GitHub CI / 受控环境治理执行开发与东京预览部署；**用户放行执行 ≠ 已获得独立 DB/Security 签名，也 ≠ 已通过生产 N1 认证**。

### 截至本轮的真实结论

| 事项 | 核实状态与边界 |
| --- | --- |
| 方案 A | **已由用户明确选定（D）**：同一个 PostgreSQL T0 提交 Saved View 所需授权状态/epoch/generation 与不可变 Outbox，保留现有 Manager/Provider/Domain Owner。 |
| 方案 B | 未选择；未证实正式跨文件+DB 的无旧 ALLOW 失效窗口协议。 |
| N1-05a | PR [#1211](https://github.com/jiangxng/EVO-App-Platform/pull/1211)、[#1213](https://github.com/jiangxng/EVO-App-Platform/pull/1213) 已合并；决策资料及工程 preflight 已入库；**实际 Owner 生产签收仍缺**，[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 继续 OPEN。 |
| N1-05b-01～05 | PR #1214～#1218 已合并：单范围 DENY port；全范围 Feature 冻结的候选 T0 port；停用共享 Package 误伤修复；真实 Manager Feature 级停用；正式 Host 激活前硬拒绝。**客户端/本地边界已交付；真实 PG T0 函数尚不存在**。 |
| N1-05b-06 | PR [#1219](https://github.com/jiangxng/EVO-App-Platform/pull/1219) **已合入**，新增只读物理查验工作流；真实东京 Actions [#43012098340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098340) **SUCCESS**，且仅 SELECT/READ ONLY。 |
| 东京真实预览 | 腾讯云 Lighthouse `evo-dev-tokyo-01`、PostgreSQL 17.11、`evo_dev`，由 GitHub `evo-tokyo-dev` Environment 和 CI gated workflow 自动部署；[#42958911243](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42958911243) 发布 `eb5a0e2...` 实际通过本机 HTTP、公网 HTTPS、未认证 401。 |
| 最新数据库阻塞 | 当前 SQL 登录 `evo` 拥有 `SUPERUSER/CREATEDB/CREATEROLE=true`；N1-05b 目标函数数 **0**、专用 Schema 数 **0**，DB 当前约 **8,025,779 字节**。这是东京**实际执行的 SQL**，不是推测或 PG18 隔离夹具。 |
| 最近 main | 写文档前 `981b91879e52e7e44e6af50338a7df9542257d17`；该 SHA 只改文档/CI，东京自动部署预检 [#43012135657](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012135657) 明确跳过无 runtime 变更，**真实预览镜像仍是 `eb5a0e2...`**。 |
| 过程分支 | #1214～#1219 已合并；[#43012098785](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43012098785) Branch Hygiene 对 #1219 成功；旧过程分支不得恢复。 |
| 并行 Owner | [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍 OPEN，不修改其三份受管文档（详细索引有路径）。 |

## 2. 主要源码、测试与已有文档（不要重复实现）

| 模块 / 现有文档 | 已有能力 / 接续要求 |
| --- | --- |
| `manager/service.ts`、`contracts/package.ts` | 原有 `AppManagerService` 已加 `planDeactivateFeature` / `deactivateFeature`，只处理目标 Feature，并审查同包/跨包依赖和备选 Capability。 |
| `manager/cv03-n105b-authority-t0-pg.ts` | **UNMOUNTED** PostgreSQL DENY / `fencePackage` 单调用接口，期待 DBA 安装的函数；不是实际存在的 SQL authority。 |
| `manager/cv03-n105b-pa05-host-lifecycle.ts` | **UNMOUNTED** Host-only 适配器：先 Host operator + 候选 T0 全范围 DENY，后真实 Manager 单 Feature 停用；Package UNINSTALL 明确不支持。 |
| `manager/server.ts`、`manager/cv03-personal-saved-view-host-admission.ts` | 正式 Host 禁止未经认证 Saved View 激活、重启恢复与 SAVE。不要因为“现在可发布”删除门禁。 |
| `providers/enterprise-context/package.ts`、`providers/enterprise-context/personal-saved-views.ts` | Saved View 与基础企业资源位于 **同一 Package 不同 Feature**；禁止对 Saved View 用 `manager.disable(packageId)` 误停默认 Provider。 |
| `deploy/tencent-tokyo/compose.yaml`、`.github/workflows/evo-tokyo-dev-deploy.yml` | 现有 PostgreSQL 17 / EVO / Caddy + SSH pin + GHCR SHA + GitHub CI gated 自动东京预览发布；部署不是生产安全认证。 |
| `.github/workflows/cv03-n105b-tokyo-db-readonly.yml` | 可再运行 **只读** SQL 身份/函数/Schema 检查；不是迁移器。 |
| [N1 正式权威及验收计划](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)、[N1-05a 决策门禁](CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md)、[N1-05b 增量工程记录](CV03-N105B-01-APPROVED-A-DENY-T0-SEAM-20261111.md) | 原有规划的**权威继承链**；本两份窗口交接文件只是索引，不取代此三份实施文档，也不修改任何其他 Owner 的决策。 |

## 3. 当前唯一值得优先开展的工作

1. **从最新 main 和这两份交接文档接续**，查看 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 最近签收、东京目标环境/角色、并行 #1184；不重新做 #1214～#1219。
2. **以现有东京 Lighthouse 为基础准备隔离的 QA 数据库/独立角色/权限验证**，先核对备份、剩余磁盘、容器配置、现有业务库所有权与最小变更/回滚。不得使用 `evo_dev` 原业务表做破坏性实验，不要将 `evo` 超级用户当低权限 Producer。
3. 在**单独受管 PR**中按方案 A 实施**真实 PostgreSQL authority+outbox 原子 T0**，经真正 DBA/SQL principal 与测试环境角色验证、并发/掉电/重放/旧 generation/失联/直接 DML 拒绝等，再考虑把原 `UNMOUNTED` port 接入 Host。
4. 只有完成 N1-05c～f（Host Principal/KMS、恢复、真实 Human+Agent、安全评审与回滚）才能通过独立 release PR 修改 SAVE OFF/403/404。用户允许运行发布流程，不等于这些门禁已自动签收。

### 明确未决 / 不要猜

- **P：** 原生 PA05/AuthorizationProvider 当前真正生效的持久授权来源及其迁移，正式 SQL owner/schema、细粒度 Producer 登录/EXECUTE-only GRANT 与 denied DML、KMS/签名密钥、完整在线/离线 Subject Scope、generation/epoch、双 Host restart/outbox replay、水位与恢复 SLO。
- **P：** 东京当前已部署的 PG17 是**预览**数据库，不能用 PG18 CI 隔离测试代替它的实测，也不能用其 `evo` 超级用户证明权限阻断。
- **G：** #1212 曾因打勾被关闭，缺独立签收而重新 OPEN；打勾 ≠ 具姓名/岗位/日期/环境/回滚证据的独立 Owner 验收。
- **G / 附件：** 此窗口没有新建真实截图或下载原始日志附件；**易失 Actions 原始 job 日志的可访问 URL、日志关键标记与读取时间**见详细索引，若即将过期应按团队合规方式归档脱敏摘录。

## 4. 项目边界与新窗口操作纪律

- **准确工作分支是 `main`**；独立新 PR 请从当时最新 main 建 **新**分支；原 `docs/cv03-n105b-tokyo-db-readonly-preflight-20261111` 等已清理分支不可继续。
- 仍沿用 **Draft PR → exact-head CI → Ready → 合并 main → Branch Hygiene 核实删除**。不直接 push main、不过度发布纯文档变更，不泄露 GitHub Environment SSH 密钥、数据库口令、KMS/令牌。
- 不修改 PR #1184 的三份受管文件、`project.status.json` 或并行线文档；只修改真实任务相关模块。
- **不要把任何 “测试成功” 写成 “生产认证成功”**。该交接本身不增加 N1 生产授权。

## 5. 可直接粘贴到新窗口的接续指令

> 请接续 `EVO-App-Platform / CV-03 / N1-05b / 方案 A`，仓库 `https://github.com/jiangxng/EVO-App-Platform`，**准确分支 `main`**。先取最新 SHA，文档写入前基线 `981b91879e52e7e44e6af50338a7df9542257d17`，不得误用为永久最新版本。优先读取 `docs/plans/foundation-list-experience/CV03-N105B-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md` 和 `docs/plans/foundation-list-experience/CV03-N105B-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md`，再读取 `CV03-N105B-01-APPROVED-A-DENY-T0-SEAM-20261111.md`、N1-05a / N1 生产方案及 Issue #1212。已经完成 #1214～#1219，不重做；腾讯云东京 Lighthouse 实际 PG17.11，现有 `evo_dev` SQL 登录 `evo` 为超级用户，T0 function/schema 计数均 0（Actions #43012098340 的真实只读证据）。下一步在同一东京宿主隔离 QA DB/受限角色，制定真实且可回滚的方案 A T0+Outbox 物理实施与强制失败关闭测试；不碰原业务数据，不打开 SAVE。用户授权 LLM 主导开发、测试和受控部署；按独立分支、Draft PR、exact-head CI 全绿、合并 main、Branch Hygiene。PR #1184 受管文件不要修改。`N1=NOT_CERTIFIED`、SAVE_MODE OFF、SAVE POST 403、未注册 GET 404 必须保持，直至真实 SQL/身份/安全/恢复证据齐备。
