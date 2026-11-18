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

## 页面模式与导航归属

使用现有 Eidos `CatalogBrowser.layout=list` + `table.quickFilterGroups`，属于 Counterparty 业务域一级列表的**查询工具**，而不是新的导航模块。全部客户/供应商与我的客户/供应商仍是同一套 Eidos Scope Views；状态、主体类型是两个就近的正交过滤维度。业务人员切换筛选无需去 Agent/设置，创建/导入依旧只在业务允许处出现。没有重复的“筛选中”悬浮卡片或第二个列表表头。

## 功能、布局、颜色对照

| 维度 | 现有已实现状态 | 本次可复核增量 / 未完成项 |
| --- | --- | --- |
| **功能** | 搜索 AND 状态、分页/列设置、详情返回、当前页 CSV 已存在 | 增加主体类型严格精确匹配并组成三条件 AND、同权 Human/Agent/CSV、非法条件和字段撤权反例；未做 CV03 保存视图 |
| **布局** | 同一 Eidos 目录及 Scope Views、桌面表格、390px 紧凑列表 | 在搜索与列表数据之间使用两个独立 44px Group，窄屏可折行；不搬 V3 导入工作区的布局过来 |
| **颜色** | 统一 Eidos Productive/Business Office tokens | 沿用 `--eidos-primary` / `--eidos-focus` / `--eidos-border`，selected 有边框/文本和 `aria-current`，不增加私有色 |
| **风险** | 旧浏览器假过滤禁止；非法页/排序/字段权限拒绝 | 本次强制真实 Owner/Host 查询；实际商业客户数据和独立 Human 12 通道仍待上线前 |

## 入口、退出与恢复矩阵

| 入口 | 业务动作与目标 | 退出/返回 | 异常与恢复 |
| --- | --- | --- | --- |
| 我的供应商 | 搜索 Hong → 状态启用 → 主体机构 → 当前页结果 | 进入供应商详情 → 原 `returnTo` 回当前筛选/列设置/页码 | 无结果显示 0，切类型/状态回第 0 页；无权字段不显示筛选 |
| 全部供应商 | 两组筛选与“我的”视图切换 | 切回我的供应商，带合法查询状态，重新授权 | 责任范围改变拒绝/裁剪，不缓存全量结果 |
| 客户/我的客户 | 同一两组 UI 与 API 合同 | 原详情父级导航保留当前状态 | 不合法/重复主体类型参数拒绝，无权限不能用筛选总数推断 |
| 真实 Agent/当前页 CSV | Agent READ 查询同两条件 + search，CSV 下载当前授权页 | 重新打开真实列表后按当前 Host 权限查询 | 撤权、跨企业、停用 Feature fail-closed；不执行保存/跨页 EXPORT |

## 浏览器与 Human 证据

- **代码/接口**：实际 Platform 既有 `pageCounterpartyProjectionV010`、Capability Manifest、真实 Owner/ActionRouter 与 CSV；新增协议测试和上游 Eidos #218 同步采用，合并前必须确认精确 HEAD 全绿。
- **自动 Desktop**：既有 CV05 真实隔离 Host+Chromium 1280px 验证两筛选组、44px 按钮、Enter 导航、状态与主体类型同时保留，以及返回原结果；最终截图/日志以 CI 原件为准，不能预写 PASS。
- **自动 Mobile**：同一 Chrome fixture 390px Touch tap、按钮宽高、横向溢出、查询重授权；原生 Playwright 触控不是实体手机。
- **真人 Human**：0/12 / NOT_SIGNED，真实 Google 登录、实体键盘/手机、NVDA/VoiceOver 和独立审核仍处于 #1343 上线前门禁，**不是当前 MVP 普通开发阻断**。
- **当前不涉及**：个人 Saved View 保存、审批、Agent WRITE、CV04 后台跨页 EXPORT、生产 RBAC/KMS/Secrets、生产登录或旧 Railway 退役。

## 三轴与平台验收摘要（供机械门禁精确核对）

功能：已新增 Owner/ActionHost 服务端 status AND subjectType AND search + 分页/CSV/Agent READ；正式个人 Saved View 未开放。
布局：复用 Eidos Catalog 页内两组筛选，1280/390 允许折行、不增加全站工具栏。
颜色：复用 Eidos 产品 token；选中项以边框、字重、aria-current 标识，不仅靠颜色。
入口：客户、供应商、我的客户、我的供应商的既有业务列表入口，需真实当前企业/责任权限。
退出：原有 Eidos Context Navigation 到详情和父列表；returnTo 重新授权原筛选与列布局。
异常恢复：非法/重复 query、字段撤权、企业上下文变更、Feature 停用全部 fail-closed，用户可清除单一筛选回原结果。
桌面：1280px 真实 Host+Chromium 定向测试已编写，待准确 HEAD Workflow 成功后作为自动证据。
移动：390px 真实 Host+Chromium Touch 定向测试已编写，实体手机仍待商业验收。
Human：真实登录和独立人工签署 NOT_SIGNED 0/12；本次自动化与 Eidos UI Gate 不代签。
