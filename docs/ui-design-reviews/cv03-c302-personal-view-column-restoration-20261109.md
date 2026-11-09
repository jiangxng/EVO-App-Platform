# CV-03 / C3-02：个人 Saved View 列选择与顺序在 Eidos 字典表格中恢复（2026-11-09）

> **工程测试阶段，尚未生产部署或取得桌面/390px Human 签收。** 本次精确修改 `apps/business-dictionary/page.ts` 及现有协议/真实 PostgreSQL Host→Eidos 测试，使用 #1187 的个人选择/安全路由，沿用 #1180/#1182/#1183 的原子保存与签名回执、#1186 的 Host 有权读取；不新增一套表格、视图引擎或权限框架。源代码完整性以最终 PR HEAD 的 CI 为准。

## 目标与完成条件

此前有权个人视图可恢复筛选和导航，但 `columns` 配置没有真正作用于页面。目标是在原 Eidos Catalog Browser 的表头和行 cells 中，仅恢复**当前已授权、当前 Collection schema 允许**的列，并严格按照保存时的顺序展示。系统视图、旧列表和普通详情不因该配置而减少字段或改变原按钮。

## 流程与步骤

用户从现有个人 Tab 进入 → Host 根据当前 Principal/Enterprise 取有权个人视图 → Domain Owner 校验当前 `collectionId/schemaRef/readableFieldIds` 与保存列配置 → Dictionary Page 仅选取此列集，在同一 Eidos `table.columns/table.rows.cells` 中展示 → 搜索、排序、翻页及详情返回通过 #1187 安全路由保持个人视图选择。改选系统 Tab 或撤权后立即恢复原完整可读表格。

## 导航与信息架构

不改变导航图、页面路径、表头位置、详情与返回路径；Eidos 仍然只有一套列渲染逻辑。本次的列配置属于**保存视图的展示投影**，不是数据列访问授权。所有业务查询仍由 Dictionary Collection Owner 用当前权限计算，个人配置不能解锁隐藏字段。

## 视觉与颜色

没有新增设计 Token、CSS、颜色、第二个表格、展开区域或悬浮按钮。只让原 Eidos 表头、行单元格按用户已经保存的列子集和顺序重新排列。少列可能改善移动端宽度，但 **390px 实际可用性必须另行浏览器验收**，不能把列数减少等同于手机体验通过。

## 记忆与注意力

保存时选择的字段和排列顺序随视图恢复，不要求用户每次重新隐藏/排序列。用户退出个人视图就回到熟悉的系统表格；被撤权或字段版本过期时拒绝旧配置，不借助 LocalStorage 或静默迁移猜测新的可访问列。

## 无障碍与跨年龄

Eidos 原有列标题、读屏表格语义、导航焦点和密度不变，表头与行 cells 顺序一致。对比度、键盘、读屏阅读顺序和跨年龄字号可读性需在真实桌面、390px 宽度和不同浏览器单独确认；目前只有结构与 HTML 自动化证据。

## 安全与数据修复

列配置在显示前再次验证为非空、最多 20、互不重复，且每列同时存在于真实 `readableFieldIds` 和 Dictionary Owner 的实际 Eidos 可展示字段列表。不能给 `options`、源对象内部状态、额外 JSON 字段或未经授权的列创建 HTML cells。恶意、旧 Schema 或伪造配置不应该触发异常页面，统一回退系统表格。不存在跨用户缓存或业务数据写入，生产 Feature 仍默认未注册，WRITE 严格关闭。

## 证据与剩余问题

- `tests/protocol/cv03-eidos-private-view-tabs.test.mjs`：保存列的顺序和 Eidos HTML DOM、`table.columns` 与 `table.rows.cells` 一致；切系统 Tab 时恢复全部原列；非法列拒绝；路由选择/分页/详情返回不回归。
- `tests/agent-line/cv03-personal-saved-view-postgres.test.mjs`：真实 Postgres18、原业务字典 Owner、Host 签名资源/receipt、ActionRouter 及 Eidos 页面串联，严格断言当前有权配置产生 `dictionaryId/displayName` 两列，没有 `state/optionCount` cells。
- 本批仍**未完成**实际保存列 UI、正式 PostgreSQL 数据迁移及签名密钥/SQL权限审计、Railway/Tokyo 真实环境部署、LLM 真实自然语言调用及任何 Human 浏览器验收。

## 页面模式与导航归属

页面仍是原 `apps/business-dictionary/page.ts` 所有的 Dictionary Directory，由原 Host 认证、Eidos `CatalogBrowserTableV010` 呈现。此为可选展示投影，不是新的页面模式、独立插件或浏览器本地状态。

## 功能、布局、颜色对照

功能：个人列选择和列顺序得到恢复；系统列表保留当前数据/按钮/页面行为。
布局：只更新现有 Eidos 表头和对应行单元格的可见子集，不修改宿主 Shell。
颜色：继承现有 Eidos 色彩与主题，无私有 CSS。

## 入口、退出与恢复矩阵

入口：拥有当前 Saved View READ 授权及匹配企业、Collection Schema 的个人视图 Tab。
退出：切到全部/草稿/已发布 Tab，回到原完整表格；详情通过原 `returnTo` 返回相同个人列配置。
异常恢复：撤权、停用、跨企业、非法列/旧 Schema 的视图都不改变表格，且不得显示被剔除的字段；恢复企业访问后再次经 Host 授权取数。

## 浏览器与 Human 证据

桌面：机器结构测试及 Eidos HTML 断言已有，**真实用户点击/视觉截图未验收**。
移动：390px 浏览器、触摸目标与表格横向行为没有针对本功能的设备实测。
Human：尚未签收，不得将 CV-03 判定为完成。

**回滚**：停止传入个人有权视图即可恢复全部原字段与 Eidos 表格逻辑；无数据变更或迁移。