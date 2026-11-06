# CV-02 Eidos 原仓 Catalog Browser 视图导航：Platform 定向采用（2026-11-06）

**阶段：ENGINEERING_IN_REVIEW / Human、真实浏览器、业务权限、390px 尚未验收。**
**Eidos owner PR：** https://github.com/jiangxng/eidos/pull/209 ，已合并上游 `127150c30193b57b38d1d9cc62443ddfa90e2349`。
**Platform 基线：** `main@d3076e9dc037bc85f2508aa515d2296cddaa520f`。本 PR 不改变业务事实、Agent、访问授权或 Data Import。
**架构计划：** [Eidos/Platform collection 分层](../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[CV-00～07 近期验收](../plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。

## 1. 接入方式与不重复开发

本批首先读取 Eidos 源仓合并的可选 `CatalogBrowserTableV010.views` 与导航实现，再将**这一个语义变更**定向 forward-port 到 Platform 当前的 `vendor/eidos/src/catalog-browser/{contracts,render}.ts`，保留已有 Context Navigation、page actions、density/紧凑模式等 Platform Host overlay。把来源精确记录到 `vendor/eidos/source.manifest.json` 的 scoped component pin；不虚称全部 vendored Eidos 已同步、不复制新的 `ListFramework` 或绕开 Eidos owner。

## 2. 页面目标、视觉和人机任务

- 复用 Catalog Browser 原表格、搜索、分页和业务按钮。在列表标题与查询区域新增可选视图导航：例如“全部供应商”“我的供应商”，仅由业务 owner 已授权的 `views[]` 决定候选。当前项标记 `aria-current="page"`，不引入新主题色、局部私有 CSS 或页面 Shell。
- 没有 views 的旧插件界面仍按原逻辑呈现；新增按钮使用既有导航 Action 与 Host 路由处理。
- 完整用户旅程（Platform 后续业务接入验收）：进入有权 Supplier Collection → 选“我的供应商” → 搜索/分页 → 进入详情 → 返回原列表与筛选 → 切企业/撤权 → 旧有权 URL 不得重新泄漏数据。移动端 390px、键盘和读屏必须由 Eidos + Platform 浏览器实际验收，不能从源代码自动 PASS。
- 缺插件或停用时不显示视图入口；候选视图不能让 User/Agent 获得未经授予的权限。

## 3. 负面用例、当前证明与不声称的部分

| 场景 | 验收结论 |
| --- | --- |
| Eidos view navigation 与现有 page actions、contextNav、密度、serverSearch/table 共存 | `tests/integration/cv02-eidos-catalog-views.test.mjs` 机器测试，CI 待核 |
| 非法外部 URL、协议相对 URL、重复 view id、多个 selected | Eidos assertCatalog 拒绝，测试覆盖 |
| 未配置 views 的历史页面 | 无新工具栏，测试覆盖 |
| 源仓 commit 与 Host overlay 来源可追溯 | Scoped pin + 测试；**不是**全仓统一来源升级 |
| 业务插件当前 view 声明/数据源、SavedView 存储、Agent 操作、授权服务端查询 | **本 PR 未实现**；CV-01/03/05 独立 owner 门禁 |
| 实际桌面/390px、视觉颜色、Human 验收 | **NOT_TESTED**，后续真实 Host/浏览器取证 |

**回滚：** 删除可选字段、视图导航渲染与对应 scoped pin，Host overlay 和旧页面行为不受影响。后续应在真实业务 PR 中做由 owner 授权的视图定义，不能在 Eidos 内硬编码客户/字典名称与规则。
