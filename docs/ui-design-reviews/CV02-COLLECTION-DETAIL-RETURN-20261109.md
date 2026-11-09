# CV-02 真实列表→详情→返回当前筛选：Eidos UI 设计审查（2026-11-09）

**状态：CODE_IN_REVIEW / REAL_BROWSER_PENDING / HUMAN_NOT_SIGNED**。
源码：`apps/counterparty/page.ts`、`apps/counterparty/projection-query.ts`、`apps/business-dictionary/page.ts`、`manager/server.ts`。
依赖：Eidos owner #209 与 Platform #1167 的 CatalogBrowser table.views；本轮不修改 Eidos UI Renderer。

## 目标与完成条件

从客户/供应商或字典的**真实分页、搜索和视图条件**进入详情，点击现有 Eidos Context Navigation 返回其原始业务视图和页码。不得绕过 Host / 领域 owner 权限。证明两种业务 owner 的成功路径、旧 URL 兼容和恶意 returnTo 被拒绝。真实浏览器和 Human 待签收。

## 流程与步骤

Human：当前已授权企业 → 选择我的供应商 / 已发布字典 → 搜索、排序、分页 → 打开某条记录 → 查看详情 → 点击面包屑原业务页 → Host 重新校验当前 Context/权限，恢复筛选与页码。Personal Agent 对相同集合仍用原授权 Capability READ，不依赖这些 URL 获权。

## 导航与信息架构

导航所有权：Eidos 现有 `CatalogBrowserV010.contextNavigation`。Counterparty 保留原单体 `counterpartyDetailRouteV010`（可直接打开仍回目录）；列表行在有服务器分页时仅增加可选、编码的 `returnTo` 参数。Dictionary Detail 在需要时接受带返回目录的 URL；旧 URL 仍被支持。Host 校验路由并传入 page，Eidos 不读数据、不判断 Enterprise grant。

## 视觉与颜色

功能密度与既有 V3 业务体验不冲突：无新页头、按钮、弹框或虚构历史状态。返回入口仍是原 Eidos 的上下文导航，沿用现有 tokens 和中文业务术语。不会因为新增 returnTo 渲染其他 UI 颜色。

## 记忆与注意力

原先返回到无过滤的默认目录会丢失用户筛选/分页，使用户重复寻找对象；现在从详情返回原业务范围与当前查询。浏览器焦点准确复原尚需真实客户端状态支持，本批仅保持 URL 可表达的视图与分页，不虚称恢复焦点。

## 无障碍与跨年龄

复用 Eidos Context Navigation 的稳定可见按钮/链接和键盘行为，不增加隐藏自制返回控件。中文清晰、不会让用户复制 URL 才能回到工作；浏览器按键及移动窄屏仍须人验。

## 安全与数据修复

`returnTo` 只接受供应商/客户四条投影视图或字典目录自身的有界合法路由。外站 URL、双斜线、错误业务页、未知字段、重复筛选键、过大页数等失败封闭。Host 先按当前 Principal/Enterprise Context 查询有权 subject/Dictionary；再显示详情及 safe return；返回请求仍经过 Host 全部授权。禁止跨企业 Context IDs、身份或保存个人信息进 URL。

## 证据与剩余问题

测试 `tests/protocol/cv02-collection-detail-return.test.mjs` 覆盖两个业务域往返、旧 URL、错误 URL、回到正确 page 的正反例。CI、Chrome/Human 在 PR 最终 HEAD 核验；返回后具体**行焦点**以及字典详情进入更深层的编辑表单后回到同一筛选，暂属于后续工作，不宣布全部体验关闭。

## 页面模式与导航归属

Eidos 原 Catalog Browser 的 list/table + detail，列表位于业务域而非系统全局导航。Parent 对象是 Counterparty 投影或 Dictionary Directory，不新增第二个 UI Shell、breadcrumb component、history store。正向目标为业务数据详情，返回仍走 Host route。

## 功能、布局、颜色对照

功能：进入/退出/查询条件恢复通过路由参数及领域校验，审批/编辑/导入保持旧受权操作。
布局：Eidos contextNavigation 的原面包屑位置不变，没有重复“返回”按钮。
颜色：Eidos 既有 Business Office tokens 原样使用，本次不改 CSS、不引入其他色号。

## 入口、退出与恢复矩阵

| 入口 | 目标 | 退出 | 异常恢复 |
| --- | --- | --- | --- |
| 客户/供应商 filtered table | 合法当前行详情 | 返回原四类投影视图 + search/sort/page | 无权行 404；非法 returnTo 400；撤权后无法重开 |
| 字典已发布/草稿 table | 合法 Dictionary Detail | 返回原目录 view/search/sort/page | 跨应用/恶意 URL 拒绝；失效字典 404 |
| 旧直接 Detail URL | 原详情内容 | 返回旧目录 | 无 returnTo 不影响旧 URL 或 Host |
| Feature 停用/企业切换 | 无详情 | 无可用越权链接 | Host 重新拒绝，而不是使用旧 HTML 数据 |

## 浏览器与 Human 证据

功能：源码+协议单测提交，CI 待最终 HEAD；真实页面闭环待签收。
布局：沿用 Eidos 现有 CatalogBrowser 上游组件，真实差异截图待取得。
颜色：未修改 Eidos Design Tokens，真实视觉颜色对照待取得。
入口：当前有权的业务列表行/详情。
退出：现有 Eidos Context Navigation。
异常恢复：非法 route 400 / 无权数据拒绝；浏览器验证待完成。
桌面：真实企业身份 Chromium 可复现证据尚未取得。
移动：390px 真实手机/Chromium 证据尚未取得。
Human：尚未签收。
