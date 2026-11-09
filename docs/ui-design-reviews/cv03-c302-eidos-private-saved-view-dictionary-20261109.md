# CV-03 / C3-02 已授权私人视图：Eidos 业务字典表格小范围采用（2026-11-09）

> **状态：ENGINEERING_CI / NOT HUMAN_PASS / NOT PRODUCTION_ENABLED。** 只审查 `apps/business-dictionary/page.ts` 的 optional `authorizedPersonalViews` 接口和 Eidos 已有 `table.views`；具体 UI 原仓机制由 #209 的 scoped forward port 提供，不向 Eidos 再发起重复框架开发。最新 Main 合并 #1180、#1182、#1183 的隔离存储/签名回执代码；真实生产 Host 尚未注册新 Feature。工程 PR [#1185](https://github.com/jiangxng/EVO-App-Platform/pull/1185)。

## 目标与完成条件

在不改变已有 Dictionary 的全部/草稿/已发布系统视图、列表结果、字段与按钮的前提下，允许由**已认证 Host READ 结果**输入额外个人视图导航候选。测试输出本身不能证明已发布、登录或完整保存体验。只读导航不宣称授予任何业务权限，面向用户显示“我的香港供应商”等个人设置名称。

## 流程与步骤

1. Host 每次按实际 Principal、当前 Enterprise Context、Collection READ、Schema 和字段重新授权，取回只含个人所有的 View 候选（这一 Host 绑定属于后续工作，本 PR 不伪造）。
2. 业务字典原 Collection QUERY 按当前安全路由检索分页。仅当当前结果与 View 配置的 `collectionId`、`schemaRef`、`readableFieldIds` 兼容时，调用新的 opt-in `authorizedPersonalViews` 页面输入。
3. 页面沿用 Domain Owner 的 `businessDictionaryDirectoryQueryRouteV010` + `parseBusinessDictionaryDirectoryRouteV010` 重新合成/校验局部路由，然后在原 Eidos `table.views` 追加 `personal:<viewId>` 项；无法确认的/过期视图不出现。
4. 页面重进、换企业或撤权必须由 Host 重新取数。页面不会从浏览器、模型、URL 中恢复未授权配置。本 PR 不提供写按钮。

## 导航与信息架构

原有三项系统 Tab 继续存在，不改变 Eidos DOM 结构；新增的个人 Tab 只在 Host 显式提供且与现行 Collection 匹配时出现，使用 Eidos 原导航属性和 `aria-current`。选中个人 Tab 时不同时选中系统 Tab，避免多个 `aria-current=page`。此处的保存视图路由仍是已在 Dictionary 中存在的可解释查询路由，**不是独立免授权 viewId 读取接口**，页面的数据仍由 Owner 按 Principal 重新读取得到。

## 视觉与颜色

不增加 CSS、主题色、第二条工具栏、特殊徽章、独立列表布局；继承 Eidos Catalog Browser 密度、表格、按钮和查询工具栏。长标签受 120 字符上限约束，真实截断/换行仍须 desktop + 390px 截图复核。

## 记忆与注意力

用户可将常用查询作为有权且有效的导航候选，降低重复输入；系统 Tab 与个人候选仍在一个导航序列。页面匹配失败时**不猜测用户原有查询配置、不自动选择个人视图**。按当前列表/分页行数展示，不缓存业务结果或历史数据。

## 无障碍与跨年龄

沿用 Eidos 原生导航/选中语义，禁止双重选中。新增视图文本来自经 Host 审核的有界个人标题并经既有 Eidos HTML escaping 处理；Keyboard Tab/Shift+Tab、focus-visible、窄屏横向内容、读屏及真实字号仍为 browser/Human 验收开放项。

## 安全与数据修复

项目代码仅接受 Host 传入的 `authorizedPersonalViews`；不添加源字段泄漏或 SQL、未授权列、旧 Schema 的入口。视图 query 必须为原 Dictionary Owner 允许的 `view/search/sort/direction`，合法页面 URL 由既有 Route Builder 重建。旧 Schema、来源变化、被删除源/插件停用等需要 Host 以当前 Collection READ 过滤；缺少该 Host 输入直接沿用旧系统 Tab。报错恢复：不渲染不合规个人候选，不修改实际业务事实或全局主题。

## 证据与剩余问题

- [同 PR 协议回归](../../tests/protocol/cv03-eidos-private-view-tabs.test.mjs)：有权页 + 真实 Eidos HTML、仅一个选中视图、旧页面零改动、旧 schema/隐藏字段/未知 query/非法 id/超长路由负例。最终以 #1185准确 HEAD Platform CI 为准。
- 没有实际 Browser 截图、设备录制、Human signoff、真实 LLM/Agent 创建后浏览器立即显示证明。也未实现 SAVE UI/Host 页面装配，不能申称 CV-03 已完成。
- 回滚：停止传 `authorizedPersonalViews` 即恢复原行为，无需迁移或替换 Eidos；默认 Host 未使用该可选字段。

## 页面模式与导航归属

本页为现有 Eidos CatalogBrowser `layout=list` + `table.views`，原有业务字典目录/详情/返回路径由 Dictionary Owner 拥有。个人候选展示只复用同页面及原 Host Route；任何新的页面/私有导航路由均不属于本 PR。无需新增 Eidos renderer。

## 功能、布局、颜色对照

功能：保持字典原全部/草稿/已发布、搜索、排序、分页、详情、创建/发布权限；只附加真正经授权的个人视图导航，未接保存按钮。
布局：沿用既有 CatalogBrowser 紧凑密度、同一张表格、同一导航和分页；390px 实际效果未证实。
颜色：只用现有 Eidos 设计 Token 和原选中态，无新颜色或样式选择。

## 入口、退出与恢复矩阵

入口：已授权 Host 传入当前企业个人视图候选，用户在原业务字典目录看到 Eidos view Tab。
退出：通过现有系统 Tab、列表详情与返回 route 导航；若取消 personal 选中则系统 Tab 继续正常工作。
异常恢复：撤权/停用/换企业/Schema 过期时，Host 不再注入候选；本地不持久化 View 配置，页面继续显示系统视图，所有 READ 仍需原 Host 授权。

## 浏览器与 Human 证据

桌面：未获得真实浏览器截图/点击流程或 Human 签收；仅原 Eidos render HTML 协议机器断言。
移动：390px 真实响应式、触摸、键盘焦点与读屏体验未签收；不得标为完成。
Human：未进行正式测试或验收，需独立上线页面并授权真实账户和真实 Eidos 浏览器后签收。

**架构合规：** Eidos 呈现、Platform 负责 Host/个人资源/认证、Domain Owner 负责当前有权查询和路由；没有第二套 List Framework、第二套授权、LocalStorage 偏好或独立数据库。
