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
