# EVO-App-Platform / Window10 研究资料与决策交接入口（2026-11-13）

> **换窗口首读此页**。准确仓库：[jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，工作基线 **受保护 `main`**；本次整理前核实 `main@dfc04e3321658cf0924a984bb66e8c5682adeea2`。这个 SHA 是研究快照、**不是永久最新**；本交接 PR 自身的合并提交/CI/东京预检/过程分支须以该 PR 的最终评论为准，再读 GitHub `main`。
>
> **详细证据和网络来源**：[Window10 研究资料、原始网址与决策索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)；**七步工程实绩**：[Window10 #07/07 里程碑](CV04-WINDOW10-20261113-0707-FINAL-HANDOFF-ENTRY.md) 与 [精确 CI/原证索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md)；**旧窗口研究与聊天恢复**：[Window10 Context Delta](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md)、[Window09 研究索引](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)。不要将完整历史资料再次复制到一个文件。

## 一、本轮目标与用户明确要求

1. 在已有 **Eidos + Platform / Domain Owner + ActionRouter + Personal Agent** 上推进列表型应用通用体验，保留 Import/Export、视图/筛选/排序、图表/看板和 AI Native 方向，不再新建第二套应用/权限框架。已交付的当前页 CSV 不能冒称正式后台跨页 EXPORT。
2. 连续自动推进**真正可安全执行的工程工作**，每步留可复验 PR、Commit、CI 与交接；独立分支、Draft PR、精确 HEAD 全绿、Ready、保护分支合并、主线验收、东京发布判定、过程分支清理；不得直接 push main、重复造 PR 或覆盖其他窗口文件。
3. 当前窗口在 #01–#07 后要保存**研究资料与决策遗产**，重心是本窗口查阅过的网络来源、原始 URL、查阅日期、原文/摘要/待验证等级、适用条件、冲突与后续行动。**没有访问过的资料不能补造**，搜索摘要不能写成已读全文。

## 二、已采用的决定、完成的实际工作

- **现行开发/预览部署**：`main → GitHub Actions → GHCR immutable SHA → 腾讯东京 Lighthouse`；旧 Railway 是待受权处理的历史资源，不因为 offline 就能删卷/解绑 GitHub Source。参阅 [东京发布说明](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)。
- **生产权威方向**：方案 A，真实 PA05 Lifecycle + AuthorizationProvider 在**同一个 PostgreSQL ACID T0** 内保证完整 Scope、`authorityEpoch/sourceGeneration`、不可变 Outbox、DENY/撤权水印和可回滚；先有 DBA/安全/业务独立 Owner 收据，再考虑 Human SAVE 与正式跨页后台 EXPORT。现状 **`N1=NOT_CERTIFIED`、SAVE OFF、EXPORT OFF/未注册**。
- **已完成工程**：#1307（CV04 PR/Main 路径对称）、#1308（CV03 对称）、#1309（CV03/CV04 传递依赖/双侧同时遗漏负例）、#1310（防止代码注释中的安全语句伪装有效门禁），全部 MERGED；#1311 文档最终交接已 MERGED。新研究交接**不重复上述工程**。
- **本轮来源结果**：[Railway 官方 GitHub Autodeploy 文档](https://docs.railway.com/deployments/github-autodeploys)、[Central Station Autodeploy GraphQL 问答](https://station.railway.com/questions/public-api-field-for-automatic-deploymen-f058a664)、[GraphiQL 入口](https://railway.com/graphiql) 只取得搜索片段/入口信息（S），**没有登入真实 Railway GraphQL 取 `enabled`**。反之，GitHub 代码/PR/Issue/Actions 及 Railway 连接器控制面属于 A/B 直接证据，见索引。
- **东京镜像**：#1307–#1311 合并只涉及安全检查/CI/文档，东京预检均明确 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`；最后从**原始部署日志**证实的物理镜像是 `ghcr.io/jiangxng/evo-app-platform:b58e660fdc01f98e0840247115f7ca3b8c43c0b3`，但本轮未 SSH 测量当前容器 digest，**不得等同实时部署**。

## 三、仍未决，必须停在真实外部证据门槛

| 优先级 | 阻断及目前已知 | 下一位实际 Owner 的动作 |
| --- | --- | --- |
| P0 · Railway | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) **OPEN / NOT_SIGNED**；五服务曾只读见 `offline`，两个 Source GitHub 关联仍在；`serviceInstanceAutoDeployStatus` 仅搜索线索 | Infra Operator 用真实受权控制台/API读有效 Autodeploy 开关，核验 PID1、drain/overlap、历史数据库/卷消费者、备份恢复、旧迁移 preDeployCommand；提交具名、时间、环境、原证、rollback 收据；**此前不改、不删、不复活** |
| P0 · 生产授权 | [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) **OPEN / PENDING OWNER SIGNOFF**，五个 checkbox **不是五人 APPROVED**；[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) OPEN，11-13 本窗口查询 Reviews **0** | PA05 / AuthorizationProvider / PostgreSQL DBA / Security-Ops / Domain 真实具名 Owner 提供批准 PR、正式 T0/权限/KMS/两物理 Host/撤权及回滚证据，再决定新产品接线 PR |
| P1 · 技术边界 | CV03/CV04 Source Gate 已增加路径/传递依赖/注释伪证据保护，但仍**不是 AST 控制流、物理授权或跨 Host 实测证明** | 只针对**新增可复现独立缺陷**补工程；不为了续跑数量扩大测试范围或绕过 Owner |

## 四、接续时必须正确解释的四个冲突

- **旧 Railway `online` vs 本轮 `offline`**：对应不同日期快照，不能推断今天的 Autodeploy 状态、旧数据已迁走或无消费者。
- **#1212 五个勾选 vs Review 0**：前者是“已选问题/方案”，不等于五个真实签字；#1184 的审批仍未发生。
- **“CI SUCCESS” vs 生产发布**：#1307–#1309 合并后的旧 commit 在 #07 重新查询还见到后来增加的 `Continuity CANCELLED` 项；保留当时验收与后续追加的全部记录。#1311 主线 `3 SUCCESS + 1 东京 SKIPPED`（合并后当时的核验）也不等于镜像已更新。
- **安全源码中存在字符串 vs 有效执行**：#1310 修复了“注释伪证据”误绿，但词法检查仍不证明完整语义/运行时/受权生产。

## 五、下一窗口可执行的最短步骤

1. 以受保护 `main` 为唯一基线；先读本页 + 详细索引，然后读 #1311 最终评论、#1307–#1310 已合并 PR 和新交接 PR 的实际 merge SHA/CI；**先核对是否有其他并行 PR**。
2. 向 #1092 的真实 Operator 与 #1212 的真实 Owner **只收新的独立可核验证据**；如果不存在，明确保留 `UNVERIFIED / NOT_SIGNED / NOT_CERTIFIED`，**停止无价值重复轮询**。
3. 如有真实授权，先补**只读控制面/设计审查与恢复证据**，再另行决定受控生产变更；禁止自动迁移 PG、启用 SAVE/EXPORT、删除 Railway 资源、借 Tokyo 401 演示冒称真实业务权限通过。
4. 所有继续开发复用现有文档、模块与 CI，保持 PR/主线/东京/分支清理原证链；在新窗口把新证据附回已有 Issues/PR，不改 #1184 管理的三份 Owner 文档。

> **交接边界**：本页及配套长索引只保存调查资料与可核实事实，不是新的生产执行授权。原始 PR/Actions 日志及截图位置详见详细索引，**本轮没有创建新的截图/上传附件**。
