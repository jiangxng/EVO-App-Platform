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
