# CV-02 · Collection 表头排序状态与无障碍评审

> 2026-11-17。对应 Eidos PR #212 已合并，Platform PR #1332。本文件是工程 UI 评审，不是实际登录用户的 Human 签收。涉及原文件 `apps/business-dictionary/page.ts`、`apps/counterparty/page.ts`、`vendor/eidos/src/catalog-browser/contracts.ts`、`vendor/eidos/src/catalog-browser/render.ts`，原 `tests/protocol/cv02-business-collection-views.test.mjs` 继续复用。

## 目标与完成条件

现有 Owner 对整套查询排序后返回 Eidos 表格，但表头缺少当前排序字段和方向提示。仅在 Owner 明确提供的可见排序列显示 ↑/↓ 并向辅助技术输出 `th[aria-sort=ascending|descending]`，无明确排序时不猜测默认顺序；不重排当前分页数据，不重新定义查询权限。

## 流程与步骤

Human 进入原 Dictionary 或 Counterparty 列表 → 点击现有可排序列按钮 → Host 走原授权与 Domain 全查询 → Domain 映射返回的 sort/direction → Eidos 在结果页展示状态。重新搜索、分页、返回详情仍按原 Owner route 重新查询，不能只在浏览器本地修改排序表现。

## 导航与信息架构

不添加入口、菜单、跳转或私有列表组件；按已有 sortRoute 调用导航。隐藏列不显示 `aria-sort`；个人 Saved View 的授权、列配置与 SAVE 门禁保留其各自 Owner。表头排序状态只是已生效查询的展示，不具备额外权限。

## 视觉与颜色

现有按钮后出现单字符升/降序箭头，避免新增不一致图标系统。未改颜色、边框、Eidos Productive Tokens 或 390px 响应式切换；已有原生按钮与 focus-visible 样式保持不变。

## 记忆与注意力

使用当前页面真实查询状态持续标记当前字段与方向；筛选/返回时不会误把上一页状态缓存为当前页面的排序。至多一个可见表头显示方向，降低记忆负担和误判。

## 无障碍与跨年龄

表头以 `scope=col` 与 `aria-sort` 标识状态，箭头标记 `aria-hidden=true`，避免视觉和朗读重复。用户继续使用原生 button 的 Tab/Enter/Space。屏幕阅读器、真实手机与不同年龄段 Human 仍待独立评测，不能凭机器测试登记完成。

## 安全与数据修复

Eidos 守卫拒绝无 sortRoute 的方向声明、非法方向和多个冲突活动列。输入的真实排序来自已经通过 Domain 校验的字段；Host ActionRouter 对每次查询重新授权。拒绝、撤权、停插件与错误时沿用原业务页安全状态；无新 WRITE、SQL/浏览器排序、跨企业访问。N1 NOT_CERTIFIED；CV03 Human SAVE OFF；CV04 后台正式 EXPORT OFF；#1092 / #1212 未签署。

## 证据与剩余问题

上游 [Eidos PR #212](https://github.com/jiangxng/eidos/pull/212) 已通过 release-check 和 UI Gate 并合并 `3683dc7fd6f7a72c11626c9df2a56f565f9499c3`。Platform 沿用真实 Dictionary/Counterparty 回归测试确认升降序、唯一 aria-sort、未排序状态，其他 Platform/Chromium 结果以精确 PR HEAD Actions 为准，不预填。尚缺真实登录 Human、屏幕阅读器、完整列配置和跨视图手动验收。

## 页面模式与导航归属

Eidos CatalogBrowser 仍是统一 Table 呈现 Owner；Dictionary/Counterparty 各自保留合法列表查询、排序、权限和导航。没有创建第二个 List Framework 或在各业务插件复制表头组件。

## 功能、布局、颜色对照

功能：只增加当前排序的准确可视和辅助技术提示，原服务器排序语义不变。
布局：原表头按钮与原 Eidos 桌面 Table，390px 沿用授权移动卡片，不增加独立排序栏。
颜色：沿用 Eidos Token、原焦点和背景，不新增私有 CSS 或硬编码颜色。

## 入口、退出与恢复矩阵

入口：字典/供应商原列表表头排序按钮。
退出：原列表详情与返回工作区/父级路由不变。
异常恢复：非法排序、权限拒绝、过期视图仍在 Host/Domain 层按原规则处理；不会显示伪造的成功排序状态。

## 浏览器与 Human 证据

桌面：沿用现有真实隔离 Host Chromium 1280px 自动化；未取得真实登录 Human 签名。
移动：沿用 390px 自动化与原 Eidos 卡片视图，真实物理手机尚未验收。
Human：**未签收**。此 Review 和 CI 的 PASS 只表示工程材料/自动化有界通过，非生产验收。
