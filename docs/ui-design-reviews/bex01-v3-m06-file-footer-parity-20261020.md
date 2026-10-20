# BEX-01 V3 M06｜文件卡与底部功能视觉复核（2026-10-20，增量）

> 范围：仅 #1077 叠加 PR。继承 #1075/Window 02、#1058 和 #909，不改历史。无 Human 视觉签收，不等同于真实客户验收。

## 基准与已亲自打开的证据
- 原型 HTML 精确 SHA [#909](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，本轮直接核对 fileinfo、stage、issues、mappingRows 和 actionbar 源码，**R**。
- 原型 Chromium run [38704093619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619) artifact 11957646429：本轮实际下载并打开 `01-desktop-overview.png` (1280×1668)、`03-complete-field-table.png` (1280×2643) 和 `10-mobile-overview.png` (780×5350)，**R**。
- Host run [39391932514](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) artifact 12250007262：本轮下载 73 个文件，实际打开 `v3-prototype-parity-issues-desktop.png` (1280×900)、其 390px phone 对照、submit desktop、首屏 desktop。截图为隔离 synthetic Host，**R**，不是客户签收。

## 已确认差异
1. 原型有醒目的绿调 XLSX 方形标记、文件名、工作表/172行/22列以及“文件已读取”状态；Host 原先只显示文件名/行列/状态，缺格式标记。真实 Host 来源对象没有可靠的工作表名称字段时**不能编造“供应商清单”**。
2. 原型两阶段 stepper；#1060 已实现两阶段，不能复活旧三阶段。
3. 原型三类问题/四列映射在当前 1280/390 Host 已呈现结构，但原型与 Host 仍有容器间距、标题、汇总位置、操作区方面的视觉残差。机器成功不等于 100%。
4. 原型 actionbar 为“返回文件 / 恢复初始选择 / 预检查并继续”；生产 UI 必须使用真实 Host 导航和本地初始选择恢复，不能伪造自动保存。现有 Host 预检提交仍保持显式保存/校验/授权。

## 本 PR 实际动作与安全边界
- `reviewTask.subject.iconLabel`：通用 XLSX/CSV 装饰标记，由 Platform 的 Job 来源 kind 决定，不按文件名推断；沿用 Eidos owner #203 已公开的兼容方案，后续合并需与 owner 复核。
- `reviewTask.footer.back`：严格校验内部路径；渲染 `data-eidos-context-route`，使用已有 Eidos Host 导航委托至 `/data-import` 任务文件列表；不修改 Import Job。
- `reviewTask.footer.resetLabel`：原生 form reset 按本次 Host-loaded 的 initialValue 恢复所有控制值与排他选项，再更新筛选、状态、指标。只作用浏览器未保存的选择；**不会撤销 Host 已保存 mapping，也不会预检、创建 Schema 或提交**。因此真实文案提示须明确，不直接抄原型“更改将自动保存”。
- 390px 表格 → 卡片/可逆聚焦需完整复测；不得降低浏览器断言；不修改 Railway、main 或 `project.status.json`。

## CI 跟踪（不得把历史绿灯搬到新 HEAD）
- #1077 首次 HEAD `6e21ed8d…` 的 Human UI / continuity 因 PR 缺同路径 review doc 失败；此次补齐该 review doc。
- 同一 HEAD In-Context Resume 失败源于新 validator 的转义多写导致 `/[\\r\\n]/` 把路由普通字母视作拒绝条件；本次更正为显式字符码检查。没有削弱本应拒绝的外部 URL 和换行。
- 此后新的精确 HEAD 结果需重新核验；不宣称当前 PASS。

## 未完成
- PR 精确 HEAD Platform CI + 全部 Chromium V3 step 完成，实际触发并逐图检查新 artifact。
- 工作表信息层级（需真实、可信来源字段）、底部动作 Chromium 行为测试和完整滚动状态核对。
- Eidos owner 对通用 footer/reset 契约单独复核，#1077 仍 Draft。
- Human 视觉签收 **OPEN**；真实客户 Excel/授权 Import Job/银行两 fieldId/三条主体身份仍缺证据。总里程碑 **3/6**。


## 目标与完成条件

使用 #909 原型实现 BEX-01 V3 审核工作台，操作人为人工审查供应商 Excel 映射的业务人员。以真实 Host 1280px 和 390px 下的文件卡、三问题、字段映射、完整底部操作为交付对象；最终条件是源码、精确 HEAD CI、真实 Chromium 与用户 Human 视觉签收分别通过。客户文件验收另在 M04，未经签收不能开始。

## 流程与步骤

顶层只有“选择文件 → 核对并导入”；进入核对页可检查来源文件、四项汇总、三类问题、原始 22 列，逐项做选择，显式保存并预检，再明确授权提交。新增返回文件和恢复本地选择，不触发预检、Schema 创建或真实供应商提交。Agent 自动匹配保持可选入口，无法代替两条同名开户银行的 Human 决策。

## 导航与信息架构

`apps/data-import/page.ts` 的 `reviewTask.footer.back.route` 由 Platform 使用正式 `DATA_IMPORT_DIRECTORY_ROUTE`，通过 `vendor/eidos/src/renderers/html/index.ts` 渲染成已有 `data-eidos-context-route` 内部导航，复用 Eidos page-controller；不自建假链接、不改历史侧栏偏好。移动端保持原活动栏/可逆聚焦和浏览器历史语义。

## 视觉与颜色

源卡首先使用与 Eidos #203 一致的通用 iconLabel，XLSX/CSV 装饰块采用现有 Eidos 变量和间距，不硬编码供应商意义；文件标题、来源行列、已读取状态仍有明确层级。底部保留一个主要业务提交按钮、两个次要按钮与真实保存提示。桌面与 390px 继续采用已有四列转卡片机制，不缩小表格蒙混测试。

## 记忆与注意力

编辑中的非持久修改与服务器已有 Import Job 分开：返回文件不丢失 Host 已保存内容；恢复初始选择只恢复本次从 Host 加载的映射初值，并同时刷新排他候选、审核指标和筛选。无需用户记住修改前所有字段，但也不暗示自动保存。不能将 synthetic fixture 的“供应商清单”工作表编造为真实来源。

## 无障碍与跨年龄

文件类型标记是装饰性 `aria-hidden`；文件名仍为文字。返回与重置是原生 `button type=button/reset`，可键盘触达。手机下必须达到触控尺寸、保持无横向溢出、可查看四列信息对应的卡片。测试需验证 1280px/390px 点击后状态和导航，不以年龄推断用户能力。

## 安全与数据修复

导航只允许内部 Host 路由；`vendor/eidos/src/runtime/validate.ts` 对外部 URL 和换行拒绝。重置不调用 Host action、不提交未授权数据、不覆盖真实 mapping、Recipe、银行 fieldId、主体类型或 Import Job。两条同名开户银行需真实 fieldId 与用途及 Human 确认，主体类型不从 SUPPLIER 推断。预检和提交按原 Host 权限与审计门禁处理。

## 证据与剩余问题

2026-10-20 已下载 #909 原型 artifact 11957646429 与 #1060 合成 Host artifact 12250007262 并实际对照部分桌面、390px、底部和问题状态截图。精确 HEAD `6e21ed8d…` 首轮 Human UI/continuity 因没有 8 节复核记录而失败；本次补齐是门禁要求，不是伪造人工签收。另已提交 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 的真实返回/重置桌面与手机断言。最终合格必须等到新精确 HEAD Platform CI、BEX Chromium 全步骤及新截图核验；当前 Human 视觉 OPEN、M04/M05 OPEN、总进度 3/6。Eidos 通用 footer 契约仍应由 Eidos owner 另行复核。


### 本轮追加 UI 复核：可信工作表信息

调整 `apps/data-import/page.ts` 文件摘要时，文件名与真实来源工作表名仍分层显示，实际 XLSX parser 与 `DataImportSourceV010` 才是唯一受信来源。文件未带名称时只展示可信行列数；不把原型的演示工作表或 synthetic fixture 误当客户证据。业务核对阶段、排他字段映射和 Host 提交完全不变。1280px 桌面和 390px 移动断言核查“工作表：Visual review”，属于隔离 Chromium 证据，不代表已完成人工 100% 视觉签收。


### 本轮追加 UI 复核：四列审核区的标题与解释

根据 #909 已读原型，字段审核表应由独立的“字段对应关系”标题和用途说明引导，避免上一段问题卡与下一段可编辑表格在认知上相连。变更 `vendor/eidos/src/runtime/contracts.ts`、`vendor/eidos/src/runtime/validate.ts`、`vendor/eidos/src/runtime/render-model.ts`、`vendor/eidos/src/renderers/html/index.ts`、`vendor/eidos/src/design-language/productive-workbench-css.ts`，增加仅在业务方声明时呈现的通用 heading。文案由 `apps/data-import/page.ts` 给出，安全验证限制标题和说明长度并转义 HTML。四列、选择器、Host 命令与手机响应式保持不变。新增双端 Chromium 断言核验标题，Human 仍 OPEN。


### 本轮追加 UI 复核：首屏注意力与认知负担

查看最新 `v3-prototype-parity-issues-phone.png` 后确认正式手机 390px 把多段操作说明挤入首屏，使核心人工问题与字段选择滞后。按 Eidos 注意力规范和 #909 已读原型，`apps/data-import/page.ts` 首屏短句区分复用映射、EC 建议和普通核对，不改变底层事实。复杂业务约束仍在问题卡、任务指导与显式 Host 预检查；这是文案的有界移动，不是删除审计、安全或源数据。新增真实浏览器文案断言；Human 待签收。


### 本轮追加 UI 复核：阶段视觉与真实问题计数（2026-10-20，后续增量）

根据 [#909 原型](https://github.com/jiangxng/EVO-App-Platform/pull/909) 的已读 HTML 和上一轮下载的 1280px/390px Chromium，当前顶栏两阶段虽存在但默认点状图标太小，完成、当前阶段的注意力层级不足，问题标题旁缺“3 项待处理”。只为明确选择 Workbench 的表单增强调度视觉；绝不改变路由、步骤状态和 Host 指令。变化的通用 UI 实现：`vendor/eidos/src/renderers/html/index.ts` 继续渲染真实状态与 `aria-current="step"`；`vendor/eidos/src/design-language/productive-workbench-css.ts` 增强 24px 已完成勾号／当前序号、连接线、移动端换行。Eidos `reviewTask.issuesCountSuffix` 由 Platform 设置后，Eidos 从 `issues.length` 派生实际数量，拒绝空内容和不当范围；**不是静态“3”**。#204 owner 的三张独立编号问题卡原样保留，关于与 #909 连续问题框的视觉冲突继续留给 Human 决策。新增真实桌面/390px Host 断言与截图，未获得 Human 视觉签收，不代表100%还原。


### M06 自动续跑 #02：四列表工具栏认知说明与底注

对照 #909 原型，Eidos 通用 `UidlFormReviewTableV010` 在声明时展示 toolbarHint 和 footnote。栏位仍显示真实筛选可见数，不复制静态原型数字；Platform 通过两句短文本分别解释“为什么优先展示部分列”和“排他选择／不导入不删除源数据”。界面文字在 Eidos 转义、校验，不绕开 Host 显式保存。桌面、390px mobile 将增加选择筛选时计数动态变化和底注内容断言，证明是活控件而非截图复制。
