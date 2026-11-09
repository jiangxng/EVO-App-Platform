# CV-02 两个真实业务 Owner 接入 Eidos 列表视图（2026-11-09）

**性质：实施证据与实际验收清单；本 PR 代码已提交，尚待 CI/Host Human 签收。**
**基线：** Platform `main@3403175366660c7b9f2521869dfc8c51ef0641fb`，Eidos #209 → Platform #1167 已合并。

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
