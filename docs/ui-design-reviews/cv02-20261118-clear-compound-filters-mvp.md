# List Foundation MVP #01 — Counterparty 组合筛选一键清除 UI Review（2026-11-18）

> 工程范围：`apps/counterparty/page.ts` + `tests/protocol/cv02-business-collection-views.test.mjs`。只在原 Eidos Catalog Browser 上添加一个合法导航 action，不新造组件或私有 CSS。自动测试不代替用户对真实手机/读屏器的正式签收（#1343 仍 0/12）。

## 目标与完成条件

用户在客户、供应商、我的客户/我的供应商列表设置服务器端 `search AND status AND subjectType`，可一键「清除筛选条件」回到该作用域的**全部当前有权记录**。清除不会修改当前授权、Scope、排序方向、显示列顺序或每页大小；页码重置到 0，当前页 CSV 仍来自重新授权的 Owner 请求。没有有效搜索/筛选时，不显示多余按钮。

## 流程与步骤

进入「我的供应商」→ 输入 Hong → 选「启用」和「机构」→ 分页或排序/调整列 → 点击「清除筛选条件」→ Eidos 原 `navigate` Action 把用户带回 `/counterparties/my-suppliers?page=0...`（不带 search/status/subjectType）→ Host/Domain Owner 用当前 Principal/企业/责任/字段权限再次查询 → 显示当前作用域的全量有权 `pageInfo.total`，而非浏览器当前页的局部结果。详情返回仍携带该次新路由。

## 导航与信息架构

这一操作归属应用内 Counterparty Collection 的二级查询动作，不是平台全局导航。Eidos 原列表 `actions[]` 控件呈现普通非主操作；用户点击后只到同一业务 Scope 的第一页，仍通过已有 Host/Owner 做企业、责任范围和字段校验。已有创建、导入、CSV 动作保持当前权限与视觉层级；无重复导航入口。

## 页面模式与导航归属

入口仍为原 Counterparty Catalog `table`，原状态和主体类型 Quick Filter Groups、搜索、列设置、全部/我的 Scope Views 都继续使用 Eidos Owner 渲染。清除筛选只是列表 action，不是新 Search Engine、Server 认证、独立工具栏或 Saved View WRITE；不会创建跨企业链接。

## 视觉与颜色

文案在中文显示「清除筛选条件」，英文为 `Clear filters`；复用 Eidos 现有 action 视觉与焦点/hover tokens，**不新增颜色、按钮 CSS、图标或第二套 UI**。没有筛选时整个清除 action 不出现，避免占用窄屏注意力。当前列表的密度、列和原主动作顺序保持。

## 记忆与注意力

该动作只清**三项临时谓词**，刻意保留排序、`direction`、合法的 `columns`、`pageSize`、全部/我的范围，降低重新设置成本。清除跳到第 0 页避免旧分页导致假空白；点击后 Quick Filter Groups 的两个「全部」被选中，搜索栏为空。它不会删除用户真正保存的个人视图资源（CV03 正式 SAVE 仍 OFF）。

## 功能、布局、颜色对照

| 维度 | 已有基线 | 本轮增量 |
| --- | --- | --- |
| 功能 | 真实 Owner 三条件 AND 搜索、总数/分页、排序/列设置、当前页 CSV、Agent READ | 新增一次动作清除三项谓词，Owner 重新查询；不会顺带清排序和列设置 |
| 布局 | 原 Eidos Catalog Views、Quick Filter Groups、搜索、Column Controls | 复用 Catalog 顶部 `actions[]` 中非主动作；无新工具条 |
| 颜色 | Eidos Productive Workbench tokens、选中与 `:focus-visible` | 无私有颜色、硬编码像素或 CSS 改动 |
| 风险 | 不合法参数、撤权、跨企业、禁用 Feature 既有 fail-closed | 清除 URL 不授予新能力；只允许原 projection scope |

## 入口、退出与恢复矩阵

| 场景 | 入口 | 退出及预期 | 异常恢复 |
| --- | --- | --- | --- |
| 我的供应商 | 搜索/启用/机构组合筛选 | 一键清除三项，保留 `/my-suppliers` 与列、排序；总数服务端重算 | 旧页码转 0；无权主体类型仍按 Owner 拒绝 |
| 客户/供应商普通 Scope | 同组状态+主体类型筛选 | 清到本 scope 的当前授权行，而不是全局所有记录 | 切企业/撤权按原 Host 重授权 |
| 只有搜索条件 | 在原 Owner Search 输入关键词 | 清除后输入框为空、其它视图配置保留 | 无匹配时可返回当前有权列表 |
| 无任何筛选 | 普通列表 | 不显示「清除筛选条件」 | 旧非分页页面亦不显示 |
| 当前页 CSV / Agent | 在已过滤列表中读取 | 清除只改变下一次 Human 导航，CSV/Agent 各自用 Host/Owner 合法请求 | 不允许借此导出隐藏列或跨页 |

## 无障碍与跨年龄

使用原 Eidos `navigate` action，保留标准 button/keyboard Enter/Space 和 `:focus-visible`；中文文字含义直白，不以图标/颜色独自传递意义。桌面与 390px 均复用原 Catalog actions 自适应区域；无需增加水平滚动、浮层、手势。**本 PR 提供协议/Renderer 断言；现有浏览器 CI 将覆盖整体回归，但它们不等于真人实体手机、NVDA/VoiceOver 已签收**。

## 安全与数据修复

route 只能由原 `counterpartyProjectionQueryRouteV010` 构造，并由原 Host 严格 parse；原字段级 READ 与投影 Scope 由每次请求的 Domain Owner 判定，筛选、总数、排序、分页在授权后的集合运行。隐藏状态或主体类型不可通过新按钮推断，测试重用 `COUNTERPARTY_QUERY_STATUS_FORBIDDEN` 负例。没有扩大 CSV/Agent 操作、登录、生产权限、后台 EXPORT 或 Saved View SAVE。

## 浏览器与 Human 证据

- **Protocol**：现有 `tests/protocol/cv02-business-collection-views.test.mjs` 扩展客户/供应商/我的供应商三种路由，检查参数、Page 0、列配置、排序、实际 Owner 结果与清除按钮消失；无权字段/旧无分页模式继续拒绝/不显示。
- **Eidos render**：从现成 `renderCatalogBrowserToHtml` 检查动作输出，不新增 React/Playwright UI。
- **自动浏览器**：复用已有 real-Host desktop/390px CI；如专项 Workflow 出现相互冲突的截图、导航失败，则在此 PR 修复，不提前承诺此轮实际点击证据。
- **Human**：实体设备、实际在线 Google 身份、独立读屏认证属于 #1343 上线前，`HUMAN_NOT_SIGNED / 0/12`；不是内部 MVP 普通工程阻断。

## 证据与剩余问题

- 代码：原 `apps/counterparty/page.ts` 的确切 diff 新增声明式 clear-filters route；没有 Eidos runtime、业务 Data Owner 或 Host 权限修改。
- 协议测试：同 PR `tests/protocol/cv02-business-collection-views.test.mjs` 运行真实 Owner 过滤和 Eidos HTML，因初次测试错误将 UI `columns` 传入 Domain 查询而失败，已按原 allowlist 拆开；须以修复后的准确 HEAD CI 为最终证据。
- 目前未独立取得本次清除按钮的实体桌面/手机截图、真人读屏回执和真实 Google 企业登录；原有 CV04/CV05 Chromium 只证明其已覆盖的旧旅程，本轮会使用现有 workflow 回归，但不据此虚称新动作 Human PASS。
- 未来需求：若要把清除筛选放到所有业务插件，先由 Eidos owner 判断统一动作位置；当前只在 Counterparty 四路由实现，避免跨插件擅自复制 UI。

## 三轴与平台验收摘要

功能：重用 Owner page query 清除搜索+状态+主体类型，无新增字段/SQL，保留 sort/columns/pageSize/scope。
布局：现有 Catalog actions 区域不增新页面；桌面和手机共用原 Eidos 适配。
颜色：完全沿用 Eidos 原 token，不引入私人 CSS 或新色。
入口：四个 Counterparty 原业务列表（该次协议测试显式覆盖其中三个路由）。
退出：Eidos 内部 navigate to page=0，新 Owner 读取授权结果，旧 returnTo 后续沿用。
异常恢复：非法/隐藏字段、撤权、切企业、Feature 禁用保持 fail-closed。
桌面：当前 PR 自动 protocol/render + 既有浏览器回归，非独立 Human。
移动：390px 复用 Eidos action，真触控/手机待未来 Human。
Human：`0/12 NOT_SIGNED`；本 PR 不要求商业上线签署，也不冒充签署。

## 边界和回滚

只撤回 Counterparty page 中单个 action 与关联协议断言即可回退；不更改路由 parser、Host 权限、现有 status/subjectType 查询实现、Eidos vendor、生产功能开关。CV03 `N1 NOT_CERTIFIED` / SAVE OFF、CV04 正式后台 EXPORT OFF、#1212/#1092 OPEN、并行 #1184 和 #1343 门禁不变。
