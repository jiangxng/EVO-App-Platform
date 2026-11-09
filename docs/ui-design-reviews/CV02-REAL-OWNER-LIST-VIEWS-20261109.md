# CV-02 两个真实业务 Owner 接入 Eidos 列表视图（2026-11-09）

**性质：实施证据与实际验收清单；本 PR 代码已提交，尚待 CI/Host Human 签收。**
**基线：** Platform `main@3403175366660c7b9f2521869dfc8c51ef0641fb`，Eidos #209 → Platform #1167 已合并。

## 目标与完成条件

本批让供应商/客户与字典列表的当前业务数据通过 Eidos `CatalogBrowser.table.views` 切换，并保留权限、主操作及旧 API。验收需要代码/CI 通过；真实 Human/390px 仍单独验收。

## 流程与步骤

进入列表 → 选择“全部/我的”或“全部/草稿/已发布” → 使用服务端搜索/排序/分页 → 查看详情 → 从原导航返回列表；失效状态不得暴露其他企业数据。

## 导航与信息架构

业务列表位于相应插件业务域，不增加全局导航。Eidos 统一负责视图切换；`apps/counterparty/page.ts`、`apps/business-dictionary/page.ts` 只声明目标路由及可见选项，Host 负责 Context/Feature/权限检查。避免页级“只看我负责的”与新增视图按钮重复。

## 视觉与颜色

维持当前 Eidos Business Office 的按钮、表格、卡片和色彩 token；没有自定义 CSS、色号或第二套版式。数据字典的 Draft/Published 使用原 Eidos 状态风格。V3 参考方法是业务密度、清晰行动与失败恢复，不直接复制其导入工作台版式。

## 记忆与注意力

当前视图 `aria-current`、可读名称和搜索结果量让用户知道正处于哪个范围；切视图保留合法搜索/排序但重置页码，防止落入空页。数据字典路由状态保存在 URL，不等于永久 SavedView。详情返回保留搜索状态尚待独立实现。

## 无障碍与跨年龄

原生 `nav`、语义表格、已有 Eidos 按钮焦点/键盘路径；中英文标签清楚。不会用颜色单独表达已选状态。尚待 Chromium + 390px 的键盘/触屏/读屏实证。

## 安全与数据修复

Host 先校验启用的业务 Feature、企业身份与 membership；字段白名单/排序/分页交由现有 owner Collection Query；拒绝外部 route、未知 view、重复参数及非法页码。Eidos 只展示经过授权的数据，Agent 只走同一受管 READ。无隐式迁移；回滚 UI 适配即恢复旧页面。

## 证据与剩余问题

现有测试 `tests/protocol/cv02-business-collection-views.test.mjs` 覆盖两真实业务 owner、负例和旧路由兼容。CI 待最终 HEAD；实际 Agent 搜索→调用、详情返回定位、桌面与窄屏用户签收仍 OPEN，不以静态 Eidos HTML 证明可用。

## 页面模式与导航归属

Eidos 既有 `catalog-browser.layout=list` + `table`，非全新 List Framework；业务域导航分别是 Customer/Supplier 与 Business Dictionary，Parent/Back 使用已有 `contextNavigation`。数据字典系统视图是 read-only，不具备新建 SavedView/审批权限。

## 功能、布局、颜色对照

功能：既有页面动作与搜索/分页保留，新增 Eidos 原生视图切换；详情返回筛选恢复待实测。
布局：页级创建/导入仍由业务 owner 控制，视图导航位于 Table Search 之前，不额外复制 Header。
颜色：沿用 Eidos tokens 和历史 V3 业务工作台已批准视觉方向，不新增自定义配色。

## 入口、退出与恢复矩阵

| 入口 | 动作与目标 | 退出/返回 | 异常恢复 |
| --- | --- | --- | --- |
| 供应商/客户 | 切换全部/我的，搜索分页 | 进入详情后按 Eidos 父级导航返回 | 无权数据由 Host 拒绝，Feature 停用无入口 |
| 业务字典 | 切全部/草稿/已发布 | 详情返回字典目录 | 错误查询 400；登录身份/企业改变重新授权 |
| 原有无 Table 页面 | 旧责任范围按钮或本地搜索 | 维持原路由 | 旧入口与详情兼容 |

## 浏览器与 Human 证据

桌面：待真实 Host/中文 Chromium 截图及操作验收。
移动：390px 真实触屏与布局待验收。
Human：未签收，不能称体验完成。
入口：现有业务插件 route；Feature 开启后才有效。
退出：原 Context Navigation 到父列表/上级。
异常恢复：非法查询拒绝；未授权无数据；筛选详情返回位置仍待验证。

## 本批功能和架构

- **Counterparty:** `apps/counterparty/page.ts` 的现有四个 Business Projection（客户、我的客户、供应商、我的供应商）通过 **现有 `CatalogBrowser.table.views`** 提供两个受管业务范围的切换。分页/搜索/排序链接在切换时保留允许的查询语义并重置 page=0。若已有 Table，将重复的顶部“只看我负责的”按钮移入视图导航；没有服务端表格的旧路径保留原按钮。企业/角色/field grants 均由 `ProjectionService` 与 Host 在返回页面前授权，视图 route 不扩大权限。
- **Business Dictionary:** 原本只有本地浏览器筛选的 Catalog list，现由已有 `queryBusinessDictionaryCollectionV010` 生成有界、只读、server-owned `CatalogBrowser.table`；三个系统视图“全部/草稿/已发布”由字典业务 owner 在 **已经经过 Enterprise membership 检查的集合** 中过滤，随后通过原 Collection Query 执行搜索/排序/分页。保留原“新建”、详情、字典选项、草稿/发布和旧的调用方兼容性。
- **Route 安全:** `apps/business-dictionary/directory-query.ts` 仅解析本地 /business-dictionaries 路由的明确白名单参数（view/search/sort/direction/page/pageSize），拒绝未知 view、重复键、非法排序字段/页大小和任意外部 route。Host 先检查 Feature 开启与有效 Enterprise Context/membership，才使用此参数调用 domain owner。无权访问不得通过 URL 直接读到数据。
- **Eidos:** 所有列表、搜索、表格、view navigation 直接使用**已有 Eidos CatalogBrowser**；不新增独立表格渲染器、JS、CSS、Host SQL 引擎、通用权限或保存视图服务。

## 本批非目标

不实现 SavedView 持久化、企业共享视图、图表/看板、Excel 导出、泛化业务过滤 AST、Agent WRITE、离线大数据索引；不把本人请求的“AI 原生”理解成通过 Agent 执行字典发布。Internal Personal Agent 现有 search/describe/invoke.read-plan 的授权 Collection READ 保持不变，依然从业务 owner 的真实数据与字段权限读取。

## 可重复测试

`tests/protocol/cv02-business-collection-views.test.mjs`：
- Dictionary 当前企业目录“草稿/已发布”分类、搜索、排序、分页、视图切换重置页码、当前项 `aria-current`、旧页面兼容；
- Counterparty 客户/供应商全量与我的投影视图同一 Eidos 表格切换，隐藏字段不进 HTML，避免按钮重复；
- 外部路由、假 view、重复字段、非法 sort/page、越权 SQL 参数失败封闭；
- Eidos renderer 的页面契约，用户操作路径继续使用 Host `data-eidos-route`。

建议命令：`npm run build && node --test tests/protocol/cv02-business-collection-views.test.mjs tests/protocol/counterparty-projection-navigation.test.mjs tests/integration/business-dictionary-plugin.test.mjs`；最终以 PR CI 的精确 HEAD 为准。

## CV-02 明确保留的 Human / Agent 缺口

1. **真实账号/两企业、管理员/成员/只读权限**：进入两个列表、改变系统视图、搜索分页、切 Enterprise/撤权/Feature 停用；出错及时提示，不能泄漏旧 Context 缓存。
2. **列表→详情→返回筛选与焦点恢复**：此批保留原已有详情路由，尚未新增专用 returnTo 状态，因此原页上下文恢复门禁**未通过/待实现**；不能因此宣称 CV-02 完结。
3. **真实 Personal Agent**：运行 “列出我的香港供应商” 与 “列出已发布字典”，核对 authorized READ 的实际结果与 Human。只声明操作为 Agent-visible 不算 Agent 实际成功。
4. **真实 desktop/390px**：Eidos 颜色、按钮、表格与窄屏卡片的功能/布局/颜色三轴 + 独立 Human；自动 UI gate 不等于真实体验签收。
5. **大数据**：Dictionary 是有限小目录后内存只读集合过滤；Counterparty owner 的读模型亦不能因分页 API 存在就被称为索引/10k 认证。

**发布状态：** 代码/单测 PR 可以合 main；不自动部署生产或更新全局 `project.status.json`。关闭 CV-02 需单独证明上述真实 Human/Agent 门禁。
