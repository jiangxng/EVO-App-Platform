# List Foundation MVP #01 — Counterparty 三条件服务端组合筛选（2026-11-18）

> 真实 UI 更新文件：`apps/counterparty/page.ts`、`vendor/eidos/src/catalog-browser/render.ts`、`vendor/eidos/src/design-language/productive-workbench-css.ts`、`vendor/eidos/src/catalog-browser/contracts.ts`。Eidos Owner [PR #218](https://github.com/jiangxng/eidos/pull/218) 已合并 `75dd85082d3fbc6171d27e9f913dfa6657f6decb`。本次只对既有 Platform Catalog 作定向引入；这是机器工程证明，不等于真实 Human 独立验收。

## 目标与完成条件

客户/供应商/我的客户/我的供应商四个既有 Eidos 列表，在当前 Enterprise、Responsibility、行和字段授权下，支持**服务端搜索 AND 状态 AND 主体类型（机构/个人）**，结果总数与分页按完整授权集合计算；同一 Owner 查询供 Human、Personal Agent 和当前页 CSV 复用。用户不再先单独按状态筛选，再凭眼睛排除主体类型。

## 流程与步骤

在“我的供应商”搜索“Hong”→状态选择“启用”→主体类型选择“机构”→Owner 查询返回；切换为“个人”时保留 search、status、sort、columns、pageSize，只将主体类型更新，页码重置 0；详情返回继续保持完整 URL 范围。选“全部主体”只清此维度，不动 status。每次点击均经真实 Host/Owner 重新授权，不在当前浏览器页过滤。

## 导航与信息架构

复用原表格视图区和 Eidos `table.quickFilterGroups`，两组独立的 `nav`，无新顶部全局菜单。既有单组 `quickFilters` **保留兼容**：如果只授予 status 或只授予 subjectType，就只出现已授权的一组；两字段同时有权才使用多组模式；一个都不可读则不出现筛选器。导航含精确 allowlist URL、不得通过 URL 创建字段 grant。

## 视觉与颜色

使用 Eidos 原生紧凑 Productive Workbench CSS 和上游 #218 的共享导航控制：两组标题区分属性，已选态有边框和 `aria-current`；无第二套插件 CSS、私有配色和“等待实现”按钮。桌面表格维持现有密度，390px flex-wrap；主动作仍由原业务 owner 决定，不把筛选误标为 create/save。

## 记忆与注意力

两个维度均显示当前已选状态，避免用户记忆隐含筛选；状态、主体类型、search、合法 sort/columns 在换视图、改列、分页、详情返回与浏览器导航中通过既有参数复用。仅是临时查询意图，**不是 CV03 Saved View 持久保存**，不保存到生产共享资源。切换选项回到 page=0，避免旧页索引显示空白引发误解。

## 无障碍与跨年龄

原生 button 与独立 `aria-label` group，`aria-current="page"` 标示被选中而不依赖颜色；清晰 `:focus-visible`，Eidos `--eidos-touch-target` 最少 44px，手机自动换行不撑出横向滚动。已有工作台焦点恢复帮助键盘操作者继续操作。实际真人实体手机、NVDA/VoiceOver 等上线前验收仍在 #1343，不能因单元/Chromium PASS 误报 SIGNED。

## 安全与数据修复

仅允 `subjectType=ORGANIZATION|PERSON` 且字段可读；非法、空、重复或 SQL 风格路由在 Domain 严格拒绝；每次先按 Principal/企业/责任/字段裁剪再三条件 AND，禁止受限字段用筛选总数反推；User/App Agent 都通过同一个 ActionRouter/业务服务。当前页 CSV 继承相同查询及授权列，不扩大跨页 EXPORT、Agent WRITE。插件停用/撤权/换企业时不出残留数据；原非法 returnTo 仍拒绝。若回滚只停用新多组 UI 与可选 subjectType 参数，不需要迁移数据。

## 证据与剩余问题

定向协议/集成测试复用 `tests/protocol/cv02-business-collection-views.test.mjs` 和 `cv04-counterparty-my-page-csv-export.test.mjs`，包括实际 Owner 库、Human/Agent 同权、CSV 和撤权/禁用/企业切换拒绝。后续需要检查现有 CV05 隔离真实 Host 1280/390 Chromium 的两组按钮、真实 Eidos 交互与 44px；合并以精确 HEAD PR/Actions 为准。本工程**不**完成个人 Saved View WRITE、业务导入旅程、Kanban、外部 Google 登录、真实真人 Human 签收、正式 CV04 后台导出，也不改 #1184/#1212/#1092 安全门禁。
