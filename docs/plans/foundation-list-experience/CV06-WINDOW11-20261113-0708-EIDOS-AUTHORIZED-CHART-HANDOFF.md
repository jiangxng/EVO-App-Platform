# CV-06 Window11 #07/08 — Eidos 上游图表与 Platform 实际 Host 采用交接

## 明确前置及复用

- `EVO-App-Platform main@c32f493742fc399e829a0ea914e8f83bde3fa32f` 上 CV06 #06 已合并运行时 Domain Owner `dictionary.collection.aggregate.state`，完成全量有权集合、小样本隐藏、Host Agent/Human 同权、东京真实健康；不能重复构建查询或当前页统计。
- `jiangxng/eidos main@127150c30193b57b38d1d9cc62443ddfa90e2349` 原有 `src/visualization` 语义选择但无实际 bar chart；`capabilities/visualization/bar-chart/CAPABILITY.md`、`capabilities/data/kanban/CAPABILITY.md` maturity=planned，ECharts 只有备选 renderer 描述，不能冒充已支持。
- **Eidos 真 Owner PR [#210](https://github.com/jiangxng/eidos/pull/210)** 以 `release-check` 和八章节 Human UI Gate 2/2 完成，已合并 **`64b171a8f6ed7ae34db595cb4a14f4134456cae2`**。提供可选 `CatalogBrowserV010.authorizedChart`、展示与严格 admission、readable text 和 390px CSS；上游所有 changed 实际样式仍留 Owner，Platform 只固定其已合并 SHA。

## Platform 本 PR 实际代码

1. `vendor/eidos/src/catalog-browser/authorized-bars.ts` 直接复制 Eidos #210 的同名字节；`vendor/eidos/src/catalog-browser/{contracts,render}.ts` 定向吸收可选属性、验证与渲染钩子，保留 Platform 的既有导航与新图表之前 UI；`vendor/eidos/src/design-language/productive-workbench-css.ts` 只添加 scoped 图表 CSS，保留 #1319 44px View 按钮样式和已有 Portal/Chat 叠加。**不以整目录覆盖 vendor**。
2. `manager/cv06-dictionary-chart-presentation.ts` 只在真实 Human Enterprise Context、已有目录表格及无个人 View 猜测时，用原 `ActionRouter` 再调用 `dictionary.collection.aggregate.state`，校验 `collectionId/schemaRef/metricId/dimensionFieldId/scope/query/view/visibleFields/privacy`，将 AuthorizedAggregate 格式化为 Eidos-only 数据形状。拒绝/超限/停插件/版本不合时返回不带 Chart 的原目录，绝不换成异常占位图。
3. `manager/server.ts` 在原字典目录 GET source 身份、企业、Feature 和关系校验后启动第二次 Host command；使用原 `createPlatformRequestContextV010`，不信任 URL bearer 权限。CV03 只读 Saved View 仍按自己的独立 Owner 路径继续，避免在未经核准的私有列/筛选上显示不一致 Chart；SAVE 仍关闭。
4. `tests/protocol/cv02-real-owner-agent-human-collection.test.mjs`、`tests/cv05/real_host_agent_list_chromium.py` 在原 Host/CV05 夹具扩展，不创建第二个 Playwright Framework。成功矩阵、失败记录、主线 SHA、东京健康和 Branch Hygiene 后续只在该 PR 原始证据中最终追加，不预先填 SUCCESS。

## 后续未闭合项

这属于**CV06 首个 Chart 可视化纵切**，尚非 Kanban 或完整多视图；不应因本轮实现 Chart 就标 CV-06 所有条目 DONE。后续须先由业务 Owner 定义适合受管 Kanban 的枚举字段/无拖动写入，再由 Eidos Owner 审核可选表示；不允许把字典状态拖放直接触发发布草稿或修改事实。还需要真实登录 Human 的跨企业/移动端交互、读屏器和真实 LLM 语义解释检验。

#1092 Operator、#1212 Owner 仍独立 OPEN；`N1=NOT_CERTIFIED`，CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；#1184 三份 Owner 文件与 Zhixing/Railway 主线均不更动。GitHub 原始 SHA/CI 是工程证据，不是生产签字。


---

# 2026-11-16 旧窗口 #07/08 恢复核验增量（不覆盖历史交接）

> 范围：仅恢复已定决策、查阅来源、精确工程/CI/部署证据与 #08 下一步；不重造图表、授权或列表框架。C=聊天要求，A=代码/既存文档，B=GitHub PR/Actions 原始证据，S=旧窗口仅检索片段，U=未取得/未核实，D=方案取舍。旧正文反映开发时点，本节补录后验状态。

## 1. 明确要求与已确定方案（C / D）

- 用户 2026-11-06 起要求在 Eidos + Platform 的现有列表底座按需复用多视图、过滤、导入/导出、图表/看板与 Agent 同权授权；每项分步可验，不另起第二套 List Framework。旧 #07/08 特别指示：先核 main、Eidos 上游和 #06 真实聚合；上游缺图表时先做 Eidos owner，Platform 只窄化采用，避免重复开发。
- Domain Owner 对数据口径与最小披露负责，Host Principal / ActionRouter / Feature 对查询权限和企业上下文负责，Eidos 只负责静态可读图表；严禁从分页表格凑“全量”数字、绕开 Host 重新授权、将看板拖动解释为业务写入。授权失败、撤权、换企业、插件停用、隐私/Schema 不符时无图表，原合法列表保留。
- 开发用独立短期 PR → 精确 HEAD Gate → protected main → 东京 DEV/PREVIEW 原始 Deploy → Branch Hygiene Actions；不碰并行 #1184 Owner 管理文件，不据开发 CI 解锁 #1092、#1212、CV03 正式 SAVE / CV04 正式后台 EXPORT。当前 #07 的完成范围仅首个授权 Chart，不含 Kanban、任意统计维度、真实 Human/生产 LLM 认证。

## 2. 已研究来源、网址与取舍（复用旧证据，不重新全量搜索）

| 来源及可追溯地址 | 等级与研究结论 |
| --- | --- |
| [Window10 旧窗口恢复](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md)；[来源/决定索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md) | A：保存早期要求、决策及原网址；用户旧聊天完整逐字原件仍 U，不能把旧索引摘要补造成原话。 |
| [CV00–07 近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)；[Eidos/Platform 采纳边界](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) | A：领域授权聚合与表现 owner 分离；CV06 的 Chart+Kanban 是总目标，不是本步均已完成。 |
| [#06 Owner READ 设计](CV06-WINDOW11-20261113-0608-DICTIONARY-AGGREGATE-READ-HANDOFF.md)；[Platform #1320](https://github.com/jiangxng/EVO-App-Platform/pull/1320) | A/B：业务字典新增 dictionary.collection.aggregate.state，metric dictionary.count.by-state，DRAFT/PUBLISHED，AUTHORIZED_ALL_MATCHING_ROWS，同一授权 repo snapshot；10,000 行硬上限、非零 1–2 桶 count=null 且总数 null。这是最小披露阈值，不是差分隐私。沿用现成 dictionary.read / Host / Agent READ，不建新授权或当前页统计。#1320 合并 c32f493742fc399e829a0ea914e8f83bde3fa32f。 |
| [Eidos #210](https://github.com/jiangxng/eidos/pull/210)；[上游固定图表源](https://github.com/jiangxng/eidos/blob/64b171a8f6ed7ae34db595cb4a14f4134456cae2/src/catalog-browser/authorized-bars.ts) | A/B：原 Eidos visualization 仅语义建议，bar-chart / kanban 能力卡 maturity=planned，ECharts 仅备选 adapter，不可假装有 renderer。#210 先新增可选 CatalogBrowserV010.authorizedChart、受控桶数/小桶隐藏、文字替代与 390px 样式，protected merge 64b171a8f6ed7ae34db595cb4a14f4134456cae2。Kanban 仍计划中。 |
| [Platform #1321](https://github.com/jiangxng/EVO-App-Platform/pull/1321)；[呈现适配源码](https://github.com/jiangxng/EVO-App-Platform/blob/d3d07b7ed981fc8f6b92218091c47e53f7e34720/manager/cv06-dictionary-chart-presentation.ts) | A/B：只在合法 Human 企业上下文且无未证个人 View 时第二次 Host ActionRouter READ，严验 collection/schema/metric/scope/query/threshold/total。异常、Denied 或形状不合直接返回原 page；同上游 vendor 图表源 Blob SHA 6125823e8caac1bbd1391947fc75597bb58001e9；不拷贝 UI 框架。 |
| [#1321 初次 Chromium 失败诊断](https://github.com/jiangxng/EVO-App-Platform/pull/1321#issuecomment-6854805672)；[Host 修复提交](https://github.com/jiangxng/EVO-App-Platform/commit/6569af1c3887ede66e0b9117c304bdce522012b3) | A/B：关键反例——#1320 Owner/模拟 Host 测试通过却漏注册真实 manager/server.ts lazy dispatcher；#1321 首次 Chromium 图表缺失，随即在同一 PR 补命令并加入真实 /v1/actions 预检查，不掩盖失败、不拆成重复 PR。 |
| [Railway Autodeploy 官方文档](https://docs.railway.com/deployments/github-autodeploys)；[原索引中的候选 API 问答](https://station.railway.com/questions/public-api-field-for-automatic-deploymen-f058a664) | S：仅用于未来 #1092 Operator 只读排查；未本轮访问真实控制面，不能推断目前 AutoDeploy 开关或旧服务可安全删除。 |

## 3. 聊天提出 / 实际代码 / 已验证：本轮复核状态

| 范围 | 代码合并（A/B） | 有界的原始验证（B） |
| --- | --- | --- |
| #06 Owner READ | Platform #1320 main c32f493742fc399e829a0ea914e8f83bde3fa32f | [#1320 原始最终记录](https://github.com/jiangxng/EVO-App-Platform/pull/1320#issuecomment-6853772934)：PR 12/12、merged-main 11/11、当时东京服务健康；**该时真实 dispatcher 遗漏，不把此 PR 单独判为 HTTP/UI 通过**。 |
| #07 Eidos 真组件 | Eidos #210 main 64b171a8f6ed7ae34db595cb4a14f4134456cae2；本轮核实当前 Eidos main 同 SHA | 上游 HEAD release-check 与 UI Review 成功，源码 Blob 与 Platform 逐 SHA 一致；不存在 Eidos Kanban 实现证明。 |
| #07 Platform 真 Host 图表 | Platform #1321 main d3d07b7ed981fc8f6b92218091c47e53f7e34720；2026-11-16 复核保护 main 仍同 SHA | [#1321 最终工程记录](https://github.com/jiangxng/EVO-App-Platform/pull/1321#issuecomment-6855073273)：最终 PR HEAD 91eda6297cebe30f1503e6771309d60858f76a70 的 52/52 PR Checks SUCCESS，合并时 main 45/45 SUCCESS。 |
| 真 Host/浏览器和失败回退 | 源码对 DENIED、异常、错误 Scope/Schema、personal View、suppressed、旧 total 不一致不输出图表 | [真实 Host + Chromium job #131923790750](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43436767993/job/131923790750)：运行中 Host /v1/actions aggregate PASS；Supplier、Dictionary 各 1280/390px，4/4 PASS；企业 A→B→A 重新授权、suppressed 文字、44px touch 和导航/返回回归。属于测试 fixture+真实 Chromium，非线上真实登录/真人签署。 |
| 东京实际部署（历史时点） | #1321 合并 SHA 镜像 ghcr.io/jiangxng/evo-app-platform:d3d07b7ed981fc8f6b92218091c47e53f7e34720 | [东京 Run #43437425436](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437425436)：preflight/deploy SUCCESS，原日志有 main CI verified、Compose SHA image healthy、local health、HTTPS PASS、unauth 401 boundary PASS。GHCR build manifest digest sha256:bc035405a505719caba1037f598fc24ae00e89dfe54776673c5e9ba1d66cb6fd 是**构建清单**，非独立实时 SSH 容器 digest。 |
| 过程分支治理 | #1320、#1321、Eidos #210 已合并；本轮查询 #1321 源分支为 404 | [#1321 Branch Hygiene Actions #43437375710](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43437375710) 原 job 证实按精确 HEAD 删除。其他工作线分支一律不盲删。 |
| 11-14/15 最新定时检查 | 与 #1321 合并时的门禁是不同执行时点，本次无业务代码改变 | [11-15 Ecosystem Certification #43705726474](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43705726474) 的 full-suite FAILURE（2368 tests / 2227 PASS / 14 FAIL / 127 SKIP）；11-14 同名定时工作流也失败。失败跨 CV04 PG 防护、CV02 旧导航测试、App Host、locale、Manager 等，不可声称“当前全 CI 绿”，但现有日志也**不能直接证明 #07 Chart 回归**；另列既存 CI 风险。 |

## 4. 未恢复或未验收、#08 最小下一步

- **U 原始旧窗口全部逐字聊天**：当前会话/Library 检索未提供完整文件；只使用旧窗口恢复索引、历史可恢复摘要、GitHub 原文/Actions。不能为未见旧消息编造引用、截图或网页全文。此前 Railway 官方文档仍维持原索引的 S 级，不升级证据等级。
- **U 今日实时线上状态与人体验收**：未在 11-16 重新 SSH 读取东京物理容器 digest、通过真实 Google 身份操作、物理手机/读屏器签署，也没有在线 LLM 质量核验。11-13 确实部署 ≠ 11-16 持续运行和生产业务认证。
- **OPEN 外部授权**：[Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[并行 #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 复查仍 OPEN。N1 NOT_CERTIFIED；CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；不可由测试与 checklist 自行开闸。
- **#08 仅交接本次 #07 的原证及缺口**；Eidos Kanban / 真实 Human / 真实 LLM 仍未完成。若正式进入 Kanban，必须先 Domain Owner 定合法枚举、集合与只读无拖动写入，再 Eidos owner 实现、Platform 窄化采用。本轮不造 Kanban、不改业务/授权、不开独立 CI 修复 PR。
- **定时 Ecosystem Certification 14 项失败**单列当前基础设施/测试债，需在独立 Owner 工作线确认测试预期与触发环境，不应在 docs 恢复 PR 中顺手改 14 个测试掩盖真正问题。
- **本恢复入库操作**：单文件现有交接附录，独立 docs 分支/PR，严格保护 main。合并后现有 branch-hygiene.yml 在 PR closed(merged) 触发同仓、已合入、SHA pinned 的安全删除；无需另写或手工跨线清分支。
