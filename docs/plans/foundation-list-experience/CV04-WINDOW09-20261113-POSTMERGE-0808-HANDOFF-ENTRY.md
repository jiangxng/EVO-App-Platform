> **2026-11-13 新窗口恢复增量**：[聊天要求 / 源码与原证分层核对 / 仍缺证据](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md)。仅作为当前增量追溯；以下 Window 09 交接原文及历史快照不作回写。

# EVO-App-Platform / CV04 Window 09 / 自动续跑 #08/08 — 2026-11-13 最终交接入口

> **当前接续权威入口（截至 #08/08 工程交接起点）**。准确仓库 [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，唯一合并基线 `main`。截至本交接 PR 建立前，受保护 `main@e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447` 已通过 **4 SUCCESS + 1 预期东京 deploy SKIPPED**。**本交接自身合并会生成更新的 main SHA；下一窗口必须重新查询 `refs/heads/main`、main check-runs、东京工作流和 PR 证据，禁止把此处固定快照称为永久最新。**

**配套**：[本轮已访问资料与决策索引](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)；[前一窗口最终交接](CV04-WINDOW08-20261112-FINAL-POSTMERGE-HANDOFF-ENTRY.md)；[长期原始 CV04 研究索引 `1–26](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。旧 `Window 08` 记录、Railway 历史运行证据与原始 PR/Actions 都不删除也不倒改。

## 1. 本轮目标与已经完成的决策

- **目标**：将历史 Railway 发布文档和旧执行路径同现行腾讯云东京 DEV/PREVIEW 严格分离；修复遗留 Actions/脚本的真实外呼风险；固化防回退门禁，最后留下可复验交接。
- **选择**：保留原 eidos + platform 架构、既有 CI、现行 `main → Actions → GHCR SHA 镜像 → 腾讯云东京 Lighthouse`；在既有 Project Continuity CI 中防止旧 Railway 验收工作流再启用，不另起一个框架。
- **不选择**：未经授权就把原 Railway `HOST` 换成东京地址、无证据地认为 401/旧 Principal 可代表生产浏览器验收、直接断开或销毁旧 Railway、为了续跑制造重复测试/PR。
- 本轮 #01–#07 已完成可安全独立执行的工程修复；#08 只做来源、里程碑及证据交接，不声明生产 Owner 已批准。

## 2. 五个已合并 PR：复用而非重复开发

| 实际 PR / 合并 main SHA | 本轮结果 / 精确边界 |
| --- | --- |
| [#1300](https://github.com/jiangxng/EVO-App-Platform/pull/1300) → `59fe344ab732ba564ff45b34e59e0c4ef3d9214b` | #01：更正腾讯东京当前发布说明，把 Railway Google OIDC 现行 runbook 标为历史、早期 Railway 在线报告限定为原时点快照 |
| [#1301](https://github.com/jiangxng/EVO-App-Platform/pull/1301) → `e1c24f2355065de0f7f9fd0e482b1c2bd364acfe` | #02：直接只读核对旧 Railway 配置 `live` 与运行实例 `offline` 的区别；记录两个 GitHub Source 仍关联和不可误认已解绑 |
| [#1302](https://github.com/jiangxng/EVO-App-Platform/pull/1302) → `37448159ba4ae83aca55c79a50b96d9a6373acfb` | #03：把十个仍指向旧 Railway URL 的生产浏览器/性能 Actions 从活动 `.github/workflows/` 移入 [完整历史 YAML 归档](../../archive/railway-live-production-proof-actions-20261113/README.md)，**10/10 Git Blob SHA 不变**，原脚本不删除 |
| [#1303](https://github.com/jiangxng/EVO-App-Platform/pull/1303) → `0c5642a50cabe640c13c449c66652f5175aaf683` | #04：七个遗留 CLI 浏览器脚本去除默认 Railway `HOST`；未显式指定地址即 fail-closed；补原有 Protocol 回归。全量核对 **191/191 活动 Actions**，剩余 Railway 字符串仅历史分支/文档清理身份，不是硬编码旧服务地址 |
| [#1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304) → `e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447` | #07：将“十份 YAML 不可重新进入活动 Actions / 活动 Actions 不可直连 `*.up.railway.app`”回归接入**无路径过滤的 Project Continuity CI**，防范 workflow-only PR 绕过 Platform CI。PR 与 main 实际验证绿 |

- **#05–#06**：通过现有 Railway 只读连接器核对旧服务状态、URL、GitHub Source、Webhook/HTTP 指标的取证局限；继续使用 [既有 Operator Issue #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6843295356)，**没有创建第二个退役 Issue**。只读工具未提供有效的 GitHub Autodeploy 开关状态。
- **所有 #1300–#1304 已 MERGED**（#08 再次逐个读取 PR 元数据）；各自合并提交与精确受保护 main check-runs 已重新比对。对应最终证据应读各 PR 的原始 comments 和 [配套研究索引第 2 节](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)。
- **#08 交接 PR 的 HEAD、main CI、东京跳过判断、Branch Hygiene**：在本文件独立 PR 真正通过并合入后，追加到 PR 最终评论；不能在此预写一个尚未发生的 PASS。

## 3. 现行运行现实，不混淆代码与物理镜像

| 观察点（2026-11-13） | 可靠结论 | 不能推出 |
| --- | --- | --- |
| 受保护代码 `main@e0d7aee63b1963d1f0457e5f5f6d8b8fffc4a447` | 检查 4 SUCCESS + 1 正常 SKIPPED；新增 Continuity 防回退 Step 在 main 成功 | 源码提交已在服务器以该 SHA 运行 |
| [东京真实部署 #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425) | 原始 deploy Job #131655719480 有本地健康、公网 HTTPS、未授权 Basic Auth 401 检验；已实际运行过 `ghcr.io/jiangxng/evo-app-platform:b58e660fdc01f98e0840247115f7ca3b8c43c0b3` | CV03/CV04 生产正式权威已签署，或目前东京业务浏览器全链路经正式 Principal 认证 |
| [最新一次 Tokyo #43363628979](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43363628979) | `preflight=SUCCESS / deploy=SKIPPED`；原始日志 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`，本轮文档/工具/CI 变更没有重部署 | 看到绿色 Workflow 就等于有新镜像 |
| Railway `EVO Ledger Runtime MVP / production`（旧命名） | 只读 API 五服务 `offline`，无 active deployment/pending work；GitHub Source、旧域名、部分持久卷仍在 | Railway 旧数据/消费者已无用、曾关闭 Autodeploy、可安全删库或解绑 |

现行发布权威阅读：[腾讯云东京部署入口](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)；[Tokyo CI-Gated Workflow](../../../.github/workflows/evo-tokyo-dev-deploy.yml)。

## 4. 未完成 ≠ 本轮失败：两个必须由真实 Owner 解除的阻断

**阻断 A — Railway 旧服务退役**：[PA05/K0 Operator Issue #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 仍 **OPEN/NOT_SIGNED**。已验证旧 Ledger Configurator source 为 `jiangxng/EVO-App-Platform/main`、EVO Runtime 为 `jiangxng/EVO/main`，后者仍配有 `node dist/scripts/migrate.js` 的部署前命令。**尚无有效 Autodeploy Enabled/Disabled、旧消费者、旧数据已备份/恢复、PID1/停机授权的独立证明**。后续必须让真实 Infra Operator 在 Railway 控制台取有效开关、作用范围、时间/操作者、备份/回滚证据；未经确认不得断开、重新部署或删除 PostgreSQL/卷。

**阻断 B — CV03/CV04 正式授权**：[Owner Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) **OPEN / PENDING OWNER SIGNOFF**；五个已勾选条目只属于决策问题，**不等于五名 Owner 的签署**。#1184 仍 OPEN（本轮查到 reviews=[]），以下三份 Owner 文件不动：`COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`（均在本目录）。

- **CV03 维持** `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403 / 未注册 GET 404。
- **CV04 维持** 正式后台跨页 `dictionary.collection.export.job.*` **OFF／未注册**；字典/我的客户/我的供应商**当前页 CSV**是不同的已上线能力，不应被本次历史 Actions 归档删除或冒充后台 EXPORT 已正式上线。
- 已有隔离 PostgreSQL、Worker、Signer 或 Chrome 验证不替代：实际 PA05/AuthorizationProvider Source、同 PG ACID T0/Outbox/Epoch/SourceGeneration、Producer KMS、两物理 Host Fail-Closed、真实撤权与多角色批准。

## 5. 下一窗口可直接执行的最短路径

1. 先取 `refs/heads/main` 和对应 **all check-runs**，核对 [#1304](https://github.com/jiangxng/EVO-App-Platform/pull/1304) 以及本交接 PR 的合并 SHA；打开 [东京工作流](../../../.github/workflows/evo-tokyo-dev-deploy.yml) 的最新实际 Run/日志区分 `preflight PASS` 与 `deploy SKIPPED`，避免凭 Git HEAD 代替服务器版本。
2. 优先查 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 是否获得真实 Operator 的 Autodeploy 和旧生产数据/消费者/备份/回滚收据；没有便保留 `UNVERIFIED`，不得重复只读重扫后声称已签署。
3. 并行查 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 的**独立具名审批 PR、环境、角色、日期和回滚演练**；证据未足继续冻结 SAVE/EXPORT；不得自行签字。
4. 当真实受权浏览器身份与东京测试企业/Principal 已就绪，**只按需**从 [归档](../../archive/railway-live-production-proof-actions-20261113/README.md) 恢复仍有价值的专项测试，保留 Basic Auth/401/撤权负例，使用现有 Eidos + Platform，禁止伪造 200。
5. 若没有新外部来源或明确工程缺口，暂停重复 PR；可把待批准问题附加在现有 Issue，允许主线与生产闸门维持安全关闭。

> **本交接是可复验的执行入口，不是部署、上线或生产签字。** 详见 [证据等级、冲突、来源地址、模块映射及下一步 Owner 收据模板](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)。
