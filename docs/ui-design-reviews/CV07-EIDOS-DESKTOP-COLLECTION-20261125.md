# CV07 · Eidos Collection 桌面优先布局复核与优化 — 2026-11-25

## 目标与完成条件

用户提供的业务字典桌面截图约 1096×528，暴露当前 Eidos Catalog Browser 将状态视图、展示模式、搜索/列设置分别独立换行、每层再附加 margin，明显浪费 PC 工作空间且控件层级失衡。Human 目标是**快速筛选、切换展示、搜索、处理字典**，不是遍历三条工具栏。OWNER/ADMIN 可看到创建/导入；只读角色不得因本次样式获得业务管理权。完成标准：宽屏上按功能聚为一条有明确分段的工作区工具栏，表格与空状态紧随其下；窄屏独立 44px 可触控、不横向溢出；所有 Owner routes、权限、提交与导入逻辑保持原样。

## 已读取的设计语言与权威顺序

- `jiangxng/eidos/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`：Authority stack, Human Directness, Functional Proximity, Visual/Responsive/Ownership。
- `jiangxng/eidos/docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`：Spatial 4px rhythm、Toolbar Placement（最多约三组）、Button Hierarchy（唯一 primary）、Density（桌面 32–36px、手机 44px）。
- `jiangxng/eidos/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`：中性背景/白色业务表面、克制品牌蓝、表格紧凑、桌面优先清晰扫描路径；不得复制其他品牌皮肤。
- `jiangxng/eidos/docs/product/EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md`：状态/展示属于当前业务工作面，非全局菜单；手机可重排但不得改变语义位置。
- `jiangxng/eidos/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`：代码与 Human 截图验收必须分级记录。
- 既有 EVO UI review `CV07-EIDOS-COLLECTION-DICTIONARY-IMPORT-20261125.md`：列控件弹层、移动响应原先已治理，但没有桌面工具条综合编排。

这些是已读文件正文，而非仅搜索摘要。当前 EVO vendored Eidos 比独立 `jiangxng/eidos` 主仓库实现更超前，**本次只改 EVO 当前实际运行的 vendored Catalog Browser / CSS**；不能直接覆盖 vendored 代码为上游较旧文件。独立 Eidos 的后续同步需审查冲突后另行安排。

## 流程与步骤

原步骤（实际截图）：页面标题/业务操作 → 状态按钮行 → 表格/图表/看板按钮行 → 一整行横向撑满的搜索/列设置 → 表格表头 → 缺失的空状态，仅有 0–0/0。新步骤：页面标题/业务主次操作 → **一组 work-surface controls**（左：状态 Tab 与分段展示模式；右：限制宽度的搜索与列设置）→ 业务表格。空间不足时同组自动换行，不能为了某个 390px 断点把 1096px 宽度先降级成多行按钮。

PC 工具栏示意：

```text
业务字典                                           [导入 CSV/Excel] [导出当前页 CSV] [新建字典]
维护本企业可复用的业务选项...

[全部  草稿  已发布]   [ 表格 | 图表 | 看板 ]           [搜索字典名称或编码    ][搜索] [列设置]
────────────────────────────────────────────────────────────────────────────────────────────
字典名称                       字典编码           状态      版本         字典项
               当前企业还没有业务字典。
```

对 700px 以下手机：语义顺序不变；状态/模式可以分组换行，搜索占可用宽度，列管理仍清晰可见；触控目标 44px，不继承 PC 的 36px 视觉密度。

## 导航与信息架构

Eidos 渲染一个 `data-eidos-catalog-workspace-controls`，包含原来的 Owner-backed `views`、`presentationViews`、server search、column controls；只有 DOM grouping 与 CSS 变动，不会引入重复菜单、假导航、前端排序或浏览器虚拟过滤。筛选和展示仍由业务 Owner 的 route 返回重新授权的集合；上层 import/create/export actions 留在标题右侧，唯一 primary 不变。

## 视觉与颜色

- **PC**：状态视图改为低强调的底部选中线 Tab；展示模式改为紧凑 segmented control；右侧搜索最大 360px，输入/按钮/列设置 36px；工作区仅一条克制的底部分隔线，减少重复盒子和跳变。
- **Phone**：专门覆盖为 44px touch targets 和可重排的表单；不改变 PC 尺寸。弹出的列设置面板继续有可聚焦控件，屏宽下不越界。
- Eidos 的颜色、边框、间距 token 均沿用，不写 Business Dictionary 独立 CSS，不引入新背景色或商业皮肤。不存在为了做手机而降低桌面密度的选择。

## 记忆与注意力

状态、展示模式和搜索仍展示当前选中状态，原筛选/排序/列顺序/分页/详情返回通过业务 URL 保留。三组不同任务的控制在视觉上明确分群，减少辨认。搜索框提示“搜索字典名称或编码”，不再误把标题“业务字典”当成用户要输入的词。空表格把已存在的 Domain emptyMessage 放进表格本身；有筛选时只说“没有符合当前筛选条件的业务字典”，不误导用户认为企业没有任何字典。异常/创建仍走 Domain Owner 既有入口。

## 无障碍与跨年龄

保留 semantic `nav`、`form role=search`、`details/summary`、表格 `thead/th/tbody` 和 keyboard `aria-current="page"`；现有 focus-visible 蓝色轮廓不变。桌面 36px 与手机 ≥44px 分离。中文提示直接使用 Eidos/业务本地化文案。文本放大、浏览器缩放、实际 390px 触屏、screen reader 需物理测试；CI 的 CSS 字符串匹配不是屏幕可用性证明。

## 安全与数据修复

变更不涉及企业 repository、授权、导入/导出/发布 Action、领域 Query、Agent WRITE 或业务数据。表格空状态只用已授权的 `emptyMessage`，绝不通过额外接口获取隐藏记录。搜索、排序、图表、列设置保留原路由和权限复核，失败后仍可原路返回。没有数据迁移、没有实测写入。

## 证据与剩余问题

实际修改源码：`vendor/eidos/src/catalog-browser/render.ts`、`vendor/eidos/src/design-language/productive-workbench-css.ts`、`apps/business-dictionary/page.ts`。代码评审和 UI review gate 应逐项对应，不能以截图替代实际源码引用。

- 起因证据：用户 2026-11-25 业务字典 PC 截图（约 1096×528，三段状态/模式/搜索分开，空表格仅 0–0/0）。
- 新增回归测试：`tests/protocol/cv07-eidos-desktop-collection-workspace.test.mjs`；真实业务字典 page render、view/mode/search/columns DOM 顺序、CSS desktop/mobile 不同命中高度、空/搜索无结果状态与有数据表格不显示伪空行。
- 交叉回归：原 CV03 Saved View、CV04 CSV export、CV06 Chart/Board、CV07 Dictionary import、供应商 1280/390 Chromium 不得改变。最终 HEAD 的 CI、Tokyo 当前镜像需在 PR 收据里记录。
- 真实浏览器截图/用户名登录操作尚未获得；不能宣称人工已通过。独立上游 Eidos 在同步前需要确认 vendored 演进分支/冲突，不能未经审查覆盖旧主仓库。

## 页面模式与导航归属

Business Dictionary 为 Eidos **Catalog Browser table/list work surface**，其 Owner 负责业务状态、表字段、允许的展示及分页；Eidos 负责控件布局/主次操作；Host 负责企业会话和 Feature/权限。移动端是同一语义体验的独立视觉实现，不是 PC 布局的上游约束。

## 功能、布局、颜色对照

功能：所有数据操作、当前筛选/列顺序/导入/导出保持原授权与行为；增加业务明确的搜索 hint 与准确空结果提示。
布局：桌面三段离散工具条 → 一条紧凑、功能分组的工作区控件；窄屏按可用空间重排；无结果在表格内部明示。
颜色：仍然是 Eidos soft neutral / white / primary-blue；状态 Tab 和 segmented switch 的选中/焦点才用蓝色。

## 入口、退出与恢复矩阵

入口：业务字典列表（有/无字典）→ 状态 Tab / 搜索 / 展示模式 / 列设置 → 原 Domain route。
退出：点击字典记录 → 详情 → 返回先前筛选与分页；或者页面右侧导入/导出/新建 → 原流程。
异常恢复：无结果显示“没有符合当前筛选条件...”并保留修改筛选入口；没有字典则提示当前企业未创建。Forbidden target、只读角色、停用插件仍由既有 Host gate 控制。

## 浏览器与 Human 证据

桌面：当前截图为问题复现，不是优化后验收。应在 1096/1280/1440px 正常 PC Workbench 浏览器检查工具条一行分组、搜索宽度、表格首屏。
移动：390px 44px 触控目标、无内层隐式溢出、弹层焦点与可读性仍待真实浏览器验证。
Human：NOT SIGNED。自动化/CI 通过仅证明机器合同和集成，尚需合法会话人工签收。

## CV07 Collection 桌面优化 固定进度表

| 项目 | 状态 | 下一步 |
| --- | --- | --- |
| 设计语言权威复核 | 已读 | 记录以上来源 |
| 共享 Eidos DOM / CSS | 待 CI | exact-HEAD build + test |
| 字典搜索/空态 | 待 CI | 状态/空/过滤回归 |
| PC 1096/1280 真实视觉 | 未签收 | 授权浏览器截图 |
| 390px 实机/Chromium | 未签收 | 真实焦点/溢出检查 |
| PR / 主线 / 东京部署 | 待运行 | 正常受保护主线流程 |
