# List Foundation MVP #04/06 — 业务字典表格、授权图表、只读看板切换（2026-11-18）

> 上游 Eidos Owner [PR #219](https://github.com/jiangxng/eidos/pull/219) 已 **MERGED**，准确合并 SHA `1350e8f6557d0622331aae882da12b170c483994`（release-check、Human UI Review 2/2 成功）。Platform 只对 `vendor/eidos/src/catalog-browser/{contracts,render}.ts` 和 `vendor/eidos/src/design-language/productive-workbench-css.ts` 定向吸收可选属性/验证/可访问布局，不覆盖 Platform 的 Eidos ContextNavigation、ColumnControls、QuickFilterGroups、密度/键盘等并行改进。其余真实逻辑在 `apps/business-dictionary/{directory-query,page}.ts`、`manager/server.ts`；本审查不是商业 Human 身份签收。

## 目标与完成条件

用户通过同一个有权的业务字典列表，保持服务器端 `view + search + sort + direction + page + pageSize + columns` 不变，切换表格、授权柱状图和只读 Kanban。图表只能来自经过第二次真实 Host ActionRouter READ 的 `dictionary.collection.aggregate.state`，具有 `AUTHORIZED_ALL_MATCHING_ROWS` 和 3 条以下小桶隐藏；看板只以同次 Dictionary Owner 当前页记录按 `state=DRAFT/PUBLISHED` 进行有限分组，显式标注 `AUTHORIZED_CURRENT_PAGE`，保留页码/详情返回/同企业状态。绝不把当前页总数冒充整库总数，也不创建可拖放/发布字典状态的写入口。

## 流程与步骤

1. Human 打开当前企业业务字典，使用系统 View（全部/草稿/发布）或已获真实 Host SavedView READ 的私人 Tab；调整搜索、排序、列次序和合法分页。
2. Eidos 原 `table.presentationViews` 显示表格、图表（仅当独立授权聚合成功）、看板（仅当 `state` 为当前 readable field）的路由型切换；`table.views` 继续承担业务系统视图，不与表示方式混淆。
3. 选择图表：原 ActionRouter 拿当前企业/Principal 的完整查询聚合，验证维度、Schema、桶、总数、抑制和真实 Dictionary Owner `pageInfo.total`；Eidos 仅渲染已授权的条形信息，隐藏与全量口径相矛盾的当前页表格和分页。没有授权或聚合异常则回表格并移除图表按钮，不伪造空统计。
4. 选择看板：Domain Owner 从当前页有权 `result.rows` 及原 `items` 按合法两种状态确定 `itemIds`；Eidos 验证所有 items 一一分配、无漏项/重复/跨页/未知 ID；看板卡片复用原 Detail 路由，无拖动/隐式业务更新，仍显示原分页。
5. 点击卡片详情再返回：Domain 原有 `businessDictionaryDetailRouteV010(returnTo)` 携带 `presentation`、查询、列、页；Host 每次重新判身份、企业、Feature、Owner 的列表 READ。
6. 切换企业 A → B → A 或撤销 Chart 权限：任何旧 HTML/前一企业图表无缓存授权含义；重复走原身份与 Collection/Host 聚合。无真实 SAVE 证据前只有只读个人 View 的显示，不能启用创建/分享私有视图。

## 导航与信息架构

页面 Archetype 仍是 Eidos Catalog Browser；按需选择 Table/Authorized Chart/Read-only Board，不出现第二套列表框架、独立 dashboard、临时 chart API、CSV 导出缓存或新的页面路径。展示 mode 是同一个原目录路由的 allowlist 参数 `presentation=chart|board`，表格为缺省值；旧 URL 完全兼容。模式导航路由由原 `businessDictionaryDirectoryQueryRouteV010` 生成，切换 View/排序/列设置/分页时保留显示方式；图表按钮只在真实授权聚合读成功后出现，看板按钮只在合法当前 Owner 页可分组时出现。

## 视觉与颜色

完全重用上游 Eidos #219 的按域样式：看板两状态列、窄屏自动单列、44px 展示模式按钮、选中 `aria-current="page"` 与 Eidos tokens。没有私有 React 看板、ECharts 依赖或在 Platform 新增另外一组 CSS/颜色；原 Catalog row cards 的 `primaryAction`、标题、状态颜色/文字仍来自同一 Owner 记录。桌面 1280px 原生表格，390px 卡片/看板纵排，不新增水平滚动。图表沿用 Eidos #210 已合并的 390px 最小披露条形组件。

## 记忆与注意力

用户切换呈现方式不丢失当前业务 View、搜索/排序/列、页和详情返回位置。Board 文案明确「当前页状态看板」「仅展示当前有权分页」，不把每列的可见卡片数误认为所有已授权记录；Chart 明确「授权总数」和 asOf，没有小桶重构，也不同时显示分页提示造成歧义。个人 Saved View ID 是不可信 URL 提示，只有 Host 提供的真实 Owner/Saved View READ 能启用相关 Tab；切到 Board 不自动保存个人视图偏好。

## 无障碍与跨年龄

表格 HTML table 保持 `th`、`aria-sort`；切换模式由 Eidos 原生 Button `aria-current` 表示选中，阅读模式不依赖图标/颜色，Kanban `section/h2/h3` 供屏幕阅读器顺序阅读。卡片打开详情仍用既有按钮/row-navigation，禁止拖拽手势与隐式 Publish。390px 触控通过真实 Chromium 流程点击，不使用模拟 `dispatchEvent` 假代替真实交互；此 CI 不等于真人实体设备、NVDA/VoiceOver 12/12 签收。

## 安全与数据修复

- Host 先检查 Business Dictionary Feature、Principal 企业关系/Owner 策略，才读取原 Owner Collection；展示模式参数只控制 Eidos，不生成数据权限。非法/重复/外站/大小异常的 `presentation` URL 由原 Directory parser fail-closed。
- Board 必须使用同一个 Owner `result.rows` 与 `items` 的当前页、最多 100 条、最多 8 组、每个 itemId 必须存在且正好分组一次；不给隐藏字段分组，`state` READ 失效时不提供 Board，不能跨企业或跨页拼数据。此 Board 不等于全量看板，不提供拖动业务写入。
- Chart 继续使用原独立 Host Command、READABLE FIELD、Scope、隐私阈值校验。Host 权限拒绝、Schema 变更、企业切换、插件关闭或抑制导致无法比较时，展示 mode 回落原表格，不保留旧授权图；绝不从当前表格计算全量柱。
- `page.table.search.route` 由现有 Domain Owner 生成，再经过原严格 parser 后构造三个 Owner routes；不信任 URL `personalViewId` 作为 owner 或用户身份。真实 SAVED_VIEW WRITE 仍关闭、正式后台 EXPORT 仍关闭；#1212 Owner、#1092 Operator、#1343 Human 证据独立保留。
- Legacy `presentation` 缺省 = `table`；Eidos 未提供 Kanban/Chart 的其他插件无任何 UI 变化。回滚可撤回上游可选属性/adoption 和 Dictionary 受限路由，不改底层数据/表/登录。

## 证据与剩余问题

- 上游真实 [Eidos PR #219](https://github.com/jiangxng/eidos/pull/219) 独立 release-check/UI Review 成功并合入 protected `main@1350e8f6557d0622331aae882da12b170c483994`；只定向使用其已合并模型，不替代 Owner 决策。
- 本 PR 新增 `tests/protocol/cv06-dictionary-display-modes.test.mjs`，核查 Owner 当前页 DRAFT/PUBLISHED 一一分组、查询状态/列/分页/详情来回、非法 mode/重复/外链拒绝、私人 ID 无法提升 Chart、无 Host Chart 自动回退表格；同时扩展 `tests/protocol/cv02-real-owner-agent-human-collection.test.mjs`，用**真实 ActionRouter + Owner 聚合**证明图表独立授权及撤权后 fail-closed、Board 仅取当前页。
- 修改 `tests/cv05/real_host_agent_list_chromium.py`：使用原 Host 桌面/390px fixture，真点击 Table → Chart → Board → Table，检查状态分组、抑制图表、网页横向溢出、换企业重新授权，不冒充真实 LLM；Eidos CSS 只来自 Owner 合并源。最终是否 PASS 仅以 GitHub Actions 当前准确 PR HEAD 的真实日志为准。
- 不在此 PR 直接注册跨页 Kanban/拖动状态、共享个人视图或新 Data Owner 查询，也不开放正式 CV03 SAVE、CV04 后台 EXPORT、Google 真实身份登录；实际真人签收 (#1343 0/12) 仍上线前独立任务。正式应用 MVP 状态应将此阶段描述为首个字典纵切，不代表 Item/Warehouse 自动获 Kanban 能力。

## 页面模式与导航归属

显示方式属于原业务字典 Page 的 Eidos 内部二级导航，由当前 Host/Domain Owner 返回同一 Collection 的真实路由；不能创建新顶层导航。系统视图与私人 Tab 使用既有表格 `views`，显示模式使用单独 `presentationViews`；两组不互相伪造选中状态。异常时恢复基本表格，不显示无权图表。所有动作默认无写入，创建/发布功能仍遵原 owner Manage 权限。

## 功能、布局、颜色对照

| 维度 | 先前 | 本次闭环 |
| --- | --- | --- |
| 功能 | Eidos 字典表格+系统/私人 View；全量授权柱状图作为随表装饰 | 同一有权查询在 Table/Chart/当前页 Board 三态之间切换；Chart 只独立授权，Board 只归类当前页；合法路由保留搜索/排序/列/分页 |
| 布局 | 原 Catalog 主区、详情返回、390px Card | Eidos Owner 复用 cards，1280 双状态列/390 单列；无第二套工作台或定制 React |
| 颜色 | 原 Eidos 标准 token 与授权图表状态 | 原样沿用 Eidos #219 及 #210，选中还用 `aria-current` 可读表示 |

## 入口、退出与恢复矩阵

| 场景 | 入口 | 退出/返回 | 异常恢复 |
| --- | --- | --- | --- |
| 有权完整字典目录 | 表格，合法搜索/系统视图 | 切图表、看板、表格保持同查询与原分页；详情再回原展示模式 | chart 被拒绝则原表格，无假统计 |
| 只有一个有权页面 | 表格第 N 页 | 看板只展示当前页有权 25 条以内，分页导航仍由 Owner 驱动 | 无结果时两列可显示空态，不虚构全库分组总数 |
| 已获 READ 的私人视图 | 原 SavedView 选项与有权列 | Board 只用本页 Owner rows，Chart 不通过私人 ID 获授权 | 未获真实 SavedView READ 的 ID 不显示个人 Tab |
| 换企业或撤权 | A → B → A / 撤销 aggregate | 每次重新 Host/Domain Owner 读取并按新授权展示 | A 的 HTML/图表不得被当成 B 的授权 |
| 无 `state` READ / 插件禁用 | 原有效表格 | Board 不可显示 / 返回其他合法目录 | Fail closed，无覆盖企业其他数据 |

## 浏览器与 Human 证据

桌面 1280px：扩展原独立 Host Chromium 脚本验证展示三态操作和状态分组，当前 PR 未得到终态前不写 PASS。
手机 390px：相同真点击与横向溢出验收，真实物理手机 Human 签收尚未完成。
Human：#1343 仍 0/12 NOT_SIGNED；CV03 LIVE SAVE 仍 OFF，N1 NOT_CERTIFIED。
