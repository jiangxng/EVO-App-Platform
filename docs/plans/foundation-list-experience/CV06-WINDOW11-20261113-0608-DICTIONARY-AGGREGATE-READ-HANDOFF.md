# CV-06 / Window11 / 自动续跑 #06/08 — 字典合法聚合 READ 最小纵切

> 2026-11-13。本工程基线受保护 `main@4aad085933497b279be831ec834fddc46c0b31f8`（#1319 已合并并有东京 CI-Gated Preview 原始健康记录）。本页在开发分支内写作，准确 PR/HEAD/CI/main/Tokyo 终态由**同 PR 的原始结果及最终评论**补记；本页绝不预填“已上线”。

## 1. 真实缺口与原项目权威（证据 A/B、方案 D）

- [现行近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) `CV-06｜受控多视图：Kanban + Chart` 明确要求 Domain Owner 的合法聚合 READ、不可从当前页编造全集计数、企业/字段重授权、隐私阈值、Schema/metric/时间口径、可选 Eidos 渲染及无写入型拖动。
- [架构采纳决定](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) 第 4/7 节明确业务事实与合法 Aggregate 由领域 Owner，Eidos 只可视化，Platform 仅通过已治理 Capability/Host ActionRouter，**禁止创建新 List Framework 或在 UI 聚合当前页**。
- 已读取 `apps/business-dictionary/collection-query.ts`：`dictionary.collection.query` 返回有权 Collection 当前一页与 `pageInfo.total`，允许 `view=all|draft|published` + 全集受限 search/sort，但没有独立维度聚合 READ；旧 `dictionary.list` / 发布、`CV04` 当前页 CSV 已存在，不重复开发。
- 已读取 `apps/business-dictionary/actions.ts`、`repository.ts`、`contracts/reference-data/dictionary-operations.ts`、`catalog/seed.ts`：原业务插件有实际 scoped `repository.list(contextId)`，Host 每次在加载 repo 前后 `canRead` 校验，Capability Operation 提供当前 Principal/Enterprise READ 授权和 Agent discover/describe/invoke；**新增的是单个 Owner READ，不是新授权系统**。

## 2. 本次实际工程决定（D）

- **Domain Owner**：新增 `apps/business-dictionary/collection-aggregate.ts` 的 `aggregateBusinessDictionaryStatesV010`，实现一个明确的度量 `dictionary.count.by-state`，维度 `state (DRAFT/PUBLISHED)`、单位 `dictionary`、`asOf` 当前仓库读取、Schema Ref、Metric ID、`AUTHORIZED_ALL_MATCHING_ROWS` 作用域。
- **复用原查询白名单**：用同一批已按企业上下文授权的 `repo.list(contextId)` 结果，调用**现存** `queryBusinessDictionaryCollectionV010` 校验全部参数，对 DRAFT/PUBLISHED 计算带相同 search/filter 的 pageInfo.total；严格忽略调用者的 page/pageSize 影响（参数仍严格验证）。不能从 Eidos 当前页或 Personal Agent 的 10 行 preview 数值推导全集。
- **隐私和上限**：Owner 小集合内存扫描硬上限 10,000 条，超过立即拒绝；每个非零桶若样本小于 3 则返回 `count:null, countKind:SUPPRESSED`，只要有桶被压制，`total:null` 以免减法直接反推。空桶可显示零；这是*最小披露阈值，不是形式化差分隐私*，模型不得解释成统计保密证明。无敏感选项文本、真实企业 ID 或其他列投影；`asOf` 是读请求时刻（并非会计账期或 DB 事务快照号）。
- **原 Platform/Agent 管道**：只新增 `dictionary.collection.aggregate.state`，仍 effect `READ`、Enterprise 数据作用域、既有 `dictionary.read` Authorizer、Host ActionRouter、Feature 生命周期，注册到原业务插件贡献；不允许 Personal Agent `invoke.write` 或 `evo.collection.read.preview` 假装这份聚合是记录页。
- **不新增 UI**：此切片只建立合法聚合事实合同，未建 Eidos Chart/Kanban renderer，也没有任何看板拖拽/数据写入。Eidos owner 应先决定可复用的图表/看板表现和无障碍文字替代，再按独立 PR 采用。不要在 Platform 私绘 bar/pie，也不要为满足步骤数伪造临时图形。

## 3. 回归、风险和退出约束

在原必跑的 `tests/protocol/**/*.test.mjs` 中添加 Owner 契约+真实 Host Human/Agent 集成：
- 同一授权集合，page=0 与 page=30 聚合完全一致；view 与 search 变化后计数遵循真实 Owner 过滤，两个企业数据各自隔离。
- 小样本 1～2 各状态和总数被压制；空桶零可返回；敏感 option 值、Context ID 不出现在度量。
- 非法 sort/view/search/字段/page、不同企业快照、10,001 条内存输入、无效 `asOf` 拒绝；真实授权撤回、切企业、Feature 停用同样失效。
- Human 与 Agent search/describe/invoke.read-plan 从原 Host 取同口径、无 WRITE；旧 CV05 Eidos 页面预览不能错误接受聚合操作。

**失败/回滚**：先确保 `npm run test:platform`、Lightweight Host、Continuity exact HEAD 全绿；再 Ready→protected main→Tokyo 运行时判定→SHA-safe Branch Hygiene。若引入新度量后存在隐私或大集合代价问题，只撤回该可选 Operation，原字典查询/导入/导出不受影响。

## 4. 不变边界及未完成清单

- #1092 Railway Operator 无签收不操作旧资源；#1212 CV03 生产 Owner 尚无具名五方批准，`N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式跨页后台 Export OFF；#1184 其他窗口三份 Owner 文件不修改。
- **CV06 未全部完成**：Eidos owner 图表与看板合同、合法图表展示、两企业受权结果图表可读文本、390px Human 真实点击、可选 contribution 关闭后表格继续可用均待后续正式工程。只有本次 Owner 聚合 READ 可标 `CODE_MERGED`（需真实 CI/merge 后）。
- **CV05 的权限预览/浏览器**：#1314～#1319 前五步已完成相应范围；真实在线 LLM 和正式 Google 身份/Human 签收仍独立待验，不把 CI 涂改为用户体验签署。

参考：[Window10 研究入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md)、[来源/决策索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)、[Window11 #05 Eidos CSS 修复](CV05-WINDOW11-20261113-0508-VIEW-SWITCH-TOUCH-HANDOFF.md)、[已有 CV06 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。
