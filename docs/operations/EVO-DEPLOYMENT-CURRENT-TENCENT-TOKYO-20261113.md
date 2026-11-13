# 当前 EVO-App-Platform 发布权威入口：腾讯云东京 Lighthouse

> 核验日期：2026-11-13；起点 `main@160c6dbf90da293fe30e2d04930fa6311f4c6504`。**这是当前开发/预览部署的操作入口，不是生产业务授权认证。** 自此新工作线默认查腾讯云东京的受保护 main → GitHub Actions → GHCR SHA 镜像 → Lighthouse，而不是 Railway 的旧 Deployment。所有历史 Railway 记录保留其原始名称、时间和引用，禁止批量改写历史为“腾讯云”。

## 当前可执行发布路径

| 项目 | 当前事实与入口 |
| --- | --- |
| 触发和部署依据 | [CI-Gated 腾讯云东京工作流](../../.github/workflows/evo-tokyo-dev-deploy.yml) 验证精确 main SHA 与必需检查；正式 runtime 差异才触发 deploy，纯文档变更允许部署 SKIPPED |
| 不可变构建 | [Dockerfile](../../Dockerfile) → `ghcr.io/jiangxng/evo-app-platform:<40位SHA>`；不是 Railway/Railpack 构建 |
| 运行和基础设施 | `evo-tokyo-dev` GitHub Environment 的 pin SSH、`evo-dev-tokyo-01` 腾讯云东京 Lighthouse、[Compose](../../deploy/tencent-tokyo/compose.yaml)、[bootstrap](../../deploy/tencent-tokyo/bootstrap.sh)、Caddy 以及隔离的预览 PostgreSQL |
| 最近一次已读原始日志的实际发布（2026-11-13 UTC） | [main 东京 Workflow #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425) / [deploy Job #131655719480](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)：真正推送并在腾讯云运行 `ghcr.io/jiangxng/evo-app-platform:b58e660fdc01f98e0840247115f7ca3b8c43c0b3`；原始日志出现 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`，并明确容器 `healthy`。此前 `1fbf937f...` 是 2026-11-12 的历史实发镜像，不再声称是最新。这个 SHA 是**当次已证实运行快照**，每次使用前仍须查最新 protected main 与 Actions deploy。 |
| 本轮合并边界 | [#1298](https://github.com/jiangxng/EVO-App-Platform/pull/1298) 将现行发布入口改为腾讯云东京（纯文档）；[#1299](https://github.com/jiangxng/EVO-App-Platform/pull/1299) 仅清理两处部署脚本注释却触发了实际发布；其受保护 `main@b58e660fdc01f98e0840247115f7ca3b8c43c0b3` 的原始 check-runs **4/4 SUCCESS**（含 deploy、preflight）。旧 #1296/#1297 是历史文档 SHA，不代表当前运行镜像。 |

真正的部署完成标准是：**exact HEAD CI 全绿 → 受保护 main 精确 SHA 检查 → 东京 preflight → 实际触发 deploy 时，读取原始部署日志确认 GHCR tag、服务器本地和公网 HTTPS 健康、Basic Auth 未授权 401**。Doc-only `deploy SKIPPED` 不要求重建镜像。详见 [2026-10-28 CI-Gated 现行发布策略](EVO-TOKYO-CI-GATED-PREVIEW-RELEASE-20261028.md) 与 [最初安装手册](../runbooks/EVO-TOKYO-DEV-DEPLOYMENT-20261027.md)，后者标记的是**当时初次失败历史**，不能再据其第一行断言东京现在未部署。

## Railway 的剩余定位和处理规则

- **历史 OIDC 操作安全门槛**：[2026-09-30 Google OIDC Railway Live Cutover Runbook](../runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md) 仍保留当年 Railway 域名和 Redirect URI 原文，已标注 `HISTORICAL_RAILWAY_OIDC_RUNBOOK / DO_NOT_EXECUTE_FOR_TENCENT_TOKYO`。不能将旧 Railway Google Client / Session / OAuth 回调直接重定向到当前腾讯云东京预览；需正式 Identity + Security/Ops/Domain Owner 重新验收，**不因部署成功而启用身份功能**。
- **历史而非默认发布目标**：[BEX-01 Window14 Railway 交接](../plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-14-RAILWAY-DELIVERY-HANDOFF-ENTRY-20261022.md)、[TR01 Railway 只读盘点](../roadmap/TR01B2D3-RAILWAY-PRODUCTION-READONLY-INVENTORY-20261011.md)、[PA05 Railway PID1 取证](../agent-line/PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md)，以及旧 PR/部署 ID，均保留各自历史事实、网址、原始字段以供审计；**不因换部署入口批量改名或删除**。
- **2026-11-13 新增只读对照**：已连接 Railway `EVO Ledger Runtime MVP` 的 `production` 环境下确有 Postgres 模板、持久卷和 `Ledger Configurator` 使用本仓库 `main` 作为 source；该 App 的 `describe_service.latestDeployment` 字段指向 **2026-10-08 FAILED**（仅此字段，不代表全部部署历史的最新事件）。这只是连接器元数据：未读取变量值、业务数据库、当前流量或密钥；不能推定旧资源不再被使用，也不能推定它是 CV03 正式授权源。参见 [CV04 研究决策索引 §23](../plans/foundation-list-experience/CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。
- **2026-11-13 当前运行状态补充（直接只读核验）**：Railway connector `environment_status(includeSuccessful=true)` 对旧 `EVO Ledger Runtime MVP / production` 返回 **5/5 服务 `offline`、全部 `activeDeployments=[]`、`pendingWork=[]`**；但 `describe_environment` 仍有 5 个标记为 `live` 的资源配置，且 Ledger Configurator / EVO Runtime / Experience Compiler / Postgres 的对应资源/卷仍存在。`describe_service` 的 Ledger Configurator Source **仍连接 `jiangxng/EVO-App-Platform@main`**，Builder 为 RAILPACK，故不能仅凭 Offline 认定 GitHub 自动构建触发已被明确停用（本接口**没有验证**该开关）。`list_deployments` 对旧 App 的较新 2026-10-21 部署项返回 `REMOVED`，而 `describe_service.latestDeployment` 单一字段返回 2026-10-08 `FAILED`：二者不是可互换的“最新成功上线”证据。资源配置存在 `live` 与运行实例 `offline` **不是同一指标**。详见 [CV04 研究索引 §25](../plans/foundation-list-experience/CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。
- 当前仓库已有**实际腾讯东京发布 workflow**，其源文件和运行链路保持不变。默认新功能发布与当前主线验收，**只**走该东京预览目标；不得重启 Railway 旧发布链路或用 Railway 旧 SUCCESS 代替当次东京验收。
- **没有执行**跨云数据迁移、DNS 切流、Railway 服务或 PG 卷销毁、密码/Key 迁移。需要真正退役 Railway 时必须由实际 Operator 盘点现存服务/消费者、全量一致性备份、回滚及 DNS/证书/ACL，再单独审批实施。不能因为旧 App 最近一次 deploy FAILED 就判定其数据库可删除。
- `docs/roadmap/HANDOFF-LATEST.md` 是由 `project.status.json` 生成的历史快照，明确禁止手改；其中 Railway deployment 字段只代表 **2026-10-10** 左右的原 snapshot，不能作为 2026-11-13 的最新发布判断。本文件是**部署读法优先级**，不是覆盖业务 roadmap 结构化事实。

## 正式生产认证仍被阻断

腾讯云东京当前是 **DEV/PREVIEW**；Railway 环境标签 `production` 也不等于获批的授权主库。CV04 后台跨页 `dictionary.collection.export.job.*` 仍 **OFF/未注册**；CV03 `N1=NOT_CERTIFIED` 与 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF` 不变。严禁修改 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的三份受管文档；[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 的真实五方 Owner 具名批准、同 PostgreSQL ACID T0/Scope/Epoch/Source Generation/Outbox、Producer 最小权限、Signer/KMS、不同物理 Host 和回滚，未取得前不得正式接线。**更换部署入口不构成权限升级、正式数据切换或产品放行。**

## 来源与未来接续

- **A级（已读相关源码）**：东京部署 workflow、`deploy/tencent-tokyo/`、Host/Owner 的 release gate；不把源代码静态断言当动态运行事实。
- **B级（已读 API/原研究记录）**：GitHub main/PR/精确 check-runs、已有东京 deploy job 证据，Railway connector 当次只读服务元数据；Railway 结果无可公开固定原文 URL，本页不捏造。
- **C级（缺证）**：此刻远端服务器重新健康核验、正式应用和 DB 权威来源、跨云数据内容/迁移状态、Owner 人类签署及双物理 Host 生产 fail-closed。
- 每次新窗口**先查 GitHub main、东京 Actions 和当前 SHA 的真实 deploy**，而不是重新查询 Railway 旧 deployment 来判断是否发版；故障要在原工作流最小修复，不另建第二套部署系统。
