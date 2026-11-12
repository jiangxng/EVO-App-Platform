# CV-04 — 业务字典列表「导出当前页 CSV」Eidos UI 设计与验收记录

> 2026-11-12；针对当前 [PR #1259](https://github.com/jiangxng/EVO-App-Platform/pull/1259)，同 PR UI 设计门禁证据，**非 Human PASS / 非手机真机验收**。延续现有 [CV-02 业务列表设计](CV02-REAL-OWNER-LIST-VIEWS-20261109.md) 与 [CV-04 工程行为](../plans/foundation-list-experience/CV04-DICTIONARY-CURRENT-PAGE-EXPORT-HOST-EIDOS-20261112.md)。最新 Eidos Catalog Browser 原渲染器与样式复用，没有复制另一套 List UI、颜色或组件。

## 1. 当前实现与可见位置（G / D）

- 在原业务字典目录页 `CatalogBrowserV010.actions` 增加**非主操作**「导出当前页 CSV」；原「新建字典」仍是管理者唯一主操作，位置与语义不变。原表格视图导航、搜索、排序、分页、详情返回、加载空态保持。
- 按钮仅出现在 **Host 提供了当前合法分页 Selection + Collection Result** 时；老页面未带分页上下文不出现按钮，避免误导为“导出所有字典”。没有管理权限但有 READ 权限的成员可以导出**仅其 READ 已显示的当前页**；正式 Host ActionRouter 每次执行重新校验 Enterprise/Feature/READ，不因为按钮可见就授予额外权力。
- 在 Eidos 已存在的命令 Action 下载路径中，Host 返回 `download`（`text/csv;charset=utf-8`、可控文件名、当前页字符串），由现有 Blob/浏览器下载行为执行；无新页面表单、新浏览器事件监听器、新 API 下载 route 或弹窗。
- 本页个人视图受控路径只使用 Host 授权并验证过的 `table.columns` 传递显式 `fieldIds`，其他页面可继续沿用原渲染器与 owner 列配置。Excel/表格公式注入和内容体积由已合并 CSV 序列化器硬限制。
- 中文按钮名称「导出当前页 CSV」，英文「Export current page CSV」。用户在执行后 Eidos 状态区得到 Action result message；无选中行要求，因为任务针对**当前已过滤/分页集合**，不应误导为勾选导出。

## 2. 必验交互与屏幕矩阵

| 平台 | 要求 | 本 PR 实测等级 |
| --- | --- | --- |
| 桌面 Eidos 原列表 | 非主按钮与「新建」区分，点击下载 UTF-8 CSV，文件仅当前页，搜索/视图/排序不丢失 | Protocol/Render + Action Download 自动证据，**真人浏览器待验** |
| 390px 手机 | 操作无水平溢出或遮挡；按钮可触达，标题不能被导出覆盖；无二次页面或巨型操作栏 | 依赖既有 Eidos 通用动作布局，**实际手机/Chromium 390px 待验** |
| 键盘/屏幕阅读器 | 原 Eidos 命令按钮可键盘触发，Action result 状态可读；下载失败有错误提示 | 复用原 Action DOM/Host，**真实无障碍手工待验** |
| 多企业/撤权/停用插件 | 按钮在旧页残留时也不能导出；行动时重新检查身份、Membership、Feature | 新 Protocol 负例/原 Host 权限回归，**多账号真实浏览器待验** |
| Personal Agent | 可搜索授权 READ Operation，获取相同当前页数据；不能执行超范围 SQL/全量导出 | 合同 + 真实 ActionRouter 确定性集成，**真实 LLM 对话待验** |

## 3. 采用/拒绝的 UI 方案与风险

- **采用**：增加原 Eidos 现有 `CatalogBrowserV010` 顶部次要 Command，完全复用原 `actionResultDownloadV010`。理由：保持一致的按钮、键盘、移动布局和 ActionHost 审计；不新增前端权限假判断。
- **不采用**：给浏览器静态下载 URL 直接导出、遍历前端分页实现全量 CSV、只根据 URL 显示状态绕开 Host、把“下载”作为主操作替代“新建”；因为这些方案容易泄漏数据/造成错误数量口径或破坏 UI。
- **仍缺**：已授权但无独立 EXPORT Policy 的全量/敏感字段导出策略、批量/后台任务、390px 真机、实际人/Agent 会话；CV-04 不宣称 HUMAN_PASS，也不修改 N1 Saved View WRITE。

## 4. 当前阶段机器验收

- `tests/protocol/cv04-dictionary-current-page-export-action.test.mjs` 按真实 Dictionary Owner/ActionRouter/Eidos Render/Download 合同验证按钮/结果；`tests/protocol/cv02-business-collection-views.test.mjs` 保证旧详情、View 导航与非主按钮布局不倒退。最终 CI 以 PR 精确 HEAD 为准。
- 本条只是履行 Human UI Review Gate 的**同 PR 可审阅设计/回归证据**，不是视觉截图、实测 390px 或“用户已经验收”。如真实浏览器发现问题必须回到 Eidos Owner 原组件修复，不能复制一套 Platform CSS。

## 5. 来源

G：本轮已读项目原文 `apps/business-dictionary/page.ts`、`manager/server.ts`、`catalog/seed.ts`、`vendor/eidos/src/catalog-browser/{contracts,render}.ts`、`vendor/eidos/src/app-host/{page-controller,action-download}.ts`、既有 CV-02/04 Protocol tests（2026-11-12）。D：此次页面动作设计及权限继承边界。P：真人浏览器、390px、辅助技术实际操作。未访问新的第三方来源。

## 目标与完成条件

由拥有当前企业 `dictionary.read` 的 Human 在原字典 Directory（`apps/business-dictionary/page.ts`）完成「筛选→分页→导出当前页」，只得到当时可读列和可读行。Personal Agent 通过相同合法 READ Operation 获得同样范围。机器验收必须证明 Handler 真正返回 Eidos `download` 结构，不能仅检查按钮是否存在；真实 390px/Human 仍单独验收。

## 流程与步骤

先选择当前企业，进入业务字典目录，切换全部/草稿/已发布视图，执行搜索排序，翻页后点击次要操作「导出当前页 CSV」；原 Eidos page-controller 解析 Action result 并通过浏览器 Blob 下载，不刷新或重置当前页面。无 READ 权限、Enterprise 身份漂移或 Feature 停用时 Host 拒绝，不保留旧下载地址。

## 导航与信息架构

工作归属是现有 Business Dictionary app-domain 的当前列表页；不新增全局导航、第二个列表入口或通用下载菜单。导出成功后仍停在原筛选/分页目录；可以打开详情再按原 `returnTo` 回到同一目录。父级导航由原 Eidos Context Navigation/Directory 承担。

## 视觉与颜色

复用 Eidos Catalog Browser 原 action 列表和 Design Language tokens，导出属于次要 Command，管理者「新建」仍是唯一 primary；不得复写颜色和 CSS。对照业务字典原表格，功能差异仅一条受限下载动作；布局不插入新卡片/工具栏；颜色完全继承既有 Eidos 按钮语义。截图对照尚未取得。

## 记忆与注意力

不要求用户重做当前搜索、排序、系统视图和分页；点击下载之后原页面维持。名称明确包含「当前页」避免误导为全部导出。没有 Row 选择要求，也不在 status 输出全部 CSV 原文造成认知负担或数据曝光；优先展示成功/失败的简短 Action 信息。

## 无障碍与跨年龄

原 Eidos Command 行为是焦点可达按钮，中文动作词清楚且前后无歧义；成功状态沿用页面 Action 状态区。390px 应由 Eidos 原按钮容器响应式布局展示而非自行写 CSS，必须在正式预览上补截图和键盘/触摸操作证据；未验证的屏幕阅读器支持不得标 PASS。

## 安全与数据修复

URL 查询只是呈现意图：Host ActionRouter 重新核验 Enterprise Context、Membership、Feature 和 Operation；Dictionary Owner 重新查询筛选结果，不接受用户传入的任意 CSV/rows/私密字段。超长 cell、非法 fieldIds、公式风险和值越界按底座拒绝或转义。取消操作不修改任何字典，失败之后留在当前页面且可在权限恢复后重新执行合法 READ；不会自动重试 WRITE。

## 证据与剩余问题

G：本次已读原 Eidos `vendor/eidos/src/app-host/page-controller.ts` 与 `vendor/eidos/src/app-host/action-download.ts`、`apps/business-dictionary/page.ts`、`apps/business-dictionary/actions.ts` 和既有 Collection 协议。D：本次页面入口、主次操作与权限语义。P：真正中文桌面、390px、键盘/辅助设备、真实用户与 Agent 对话结果。机器通过也不等于 Human PASS。

## 页面模式与导航归属

采用当前 `CatalogBrowserV010` Directory 表格页及系统 View Tabs；属于应用内现有管理列表，不创造第二框架。原返回父级、详情页和企业切换器不变。业务字典导出不是企业上下文的一级导航能力。

## 功能、布局、颜色对照

功能：新增「导出当前页 CSV」且受真实 READ 权限/当前 query 控制，保留原新建与详情功能；全量/敏感字段导出待独立设计。
布局：沿用原页顶级次要 Action，管理主按钮不动；桌面/390px 的像素与触控实测尚未取得。
颜色：完全使用 Eidos 既有设计 tokens 与按钮样式；没有自定义状态色或独立 CSS，真实预览截图待补。

## 入口、退出与恢复矩阵

| 入口 | 当前动作 | 退出 / 返回父级 | 异常恢复 |
| --- | --- | --- | --- |
| 企业已授权字典目录 | 选择已发布视图→搜索→第 2 页→导出 | 下载后保持当前目录、第 2 页及视图，详情仍可回当前目录 | 无读权限时 Action DENY、页面不失去查询状态 |
| 有管理权的字典目录 | 导出当前页（非主）或新建（主） | 新建/详情仍走已有 Directory 返回路径 | Feature 停用时 Host 拒绝，不复用旧下载 |
| 只读成员的字典目录 | 导出有权当前页 | 留在 Directory，可继续分页 | 企业切换/撤权必须重查授权 |
| 旧无分页字典页 | 不显示误导性导出入口 | 老 Directory 行为不变 | 不凭旧无界数据进行下载 |

入口：原有 Enterprise Context 下 Business Dictionary Directory；有效系统 View 的真实分页表格。
退出：下载后停在原列表，详情与父级返回继续走既有 `returnTo` / Eidos Navigation。
异常恢复：授权/Feature/查询失效显示原 Action 错误提示、不修改数据、不默默导出旧缓存。

## 浏览器与 Human 证据

桌面：待实测实际预览 Chrome/桌面中文下载、列表页按钮排列和返回行为；已有协议 HTML Render + ActionDownload 自动检查但不是浏览器截图。
移动：390px Chromium/真机触控与布局截图待取得，不得宣称无溢出已验收。
Human：实际用户点击、企业身份、跨企业拒绝和下载文件核对尚未签收；仍为 HUMAN_PENDING。
