# BEX-01 V3｜真实字段审核：改选后状态、筛选和统计同步（2026-10-16）

> 用户明确要求遵循原 V3 高保真原型，不按按钮/间距碎片化补丁推进。V3 原 HTML 见 [Platform Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)，其中字段选择 `changed()` 与 `render()` 即时重算行状态、统计、筛选。真实业务页面四列审查、建议/证据/批准已在 [Platform #984](https://github.com/jiangxng/EVO-App-Platform/pull/984) 接入。本批严格沿用通过 Eidos CI 的 [Eidos #195](https://github.com/jiangxng/eidos/pull/195) 新增的 **通用 opt-in 选择状态映射**，拒绝单独增加 BEX 私有脚本。
>
> **本 PR UI 文件：** `apps/object-extension/batch-page.ts`，仅精确同步 `vendor/eidos/src/runtime/contracts.ts`、`vendor/eidos/src/runtime/validate.ts`、`vendor/eidos/src/renderers/html/index.ts`、`vendor/eidos/src/app-host/page-controller.ts` 中 Eidos #195 的变更。真实 Host 回归于 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`，合同回归于 `tests/protocol/bex01-batch-extension-import.test.mjs`。

## 目标与完成条件

实施人员在真实 `/object-extensions/from-import?job=...&mode=batch` 审核来源列时，选择「不导入」「建议新建」「需要校对」或某个真实字段后，**不刷新页面**就看到同行状态、当前筛选数量及已接入的四统计相应变化。所有选择仅属于本页尚未批准的待提交状态，不能在浏览器里变成已创建/已保存。完成条件由真实隔离 Host 的 desktop 及 390px Chromium 验证，而非仅 UI 单测。

## 流程与步骤

原流程：初始查看需审核项→改选→只能依旧看旧状态或提交后才回看新状态。现流程：初始依据授权 Job/Recipe 提示→改选真实选项→Eidos 读取 Platform **明确声明的** `statusByChoice` 视图映射→同一行状态与筛选/统计立即更新→User 显式点击 `确认：批量创建并自动映射`→原 Host 负责创建字段/保存映射；之后返回 `/map`，仍需预检查和第二次独立确认导入。切换筛选本身从来不是写入操作。

## 导航与信息架构

延续同一四列审核路径与 Eidos 原 `tbody` 行 ID。选择器下拉中的真实 option value 是唯一态映射键；没有新导航、Agent 强制步骤或字段编辑弹窗。正在关注的行如果被人工选择「忽略」，默认关注筛选可将该行隐藏；「全部字段」始终可找回、撤销该决定。来源样本/候选字段用途与同名身份同格保留。

## 视觉与颜色

仍使用 Eidos generic ReviewTable 及 Task metrics；状态文字是可读中文（待新增/待确认匹配/不导入/需要校对），原 tone 和紧凑表格、390px 卡片布局均不改。四统计只响应对应的状态 key，不触发额外按钮或警告动画。视觉不制造“已导入/已创建”的成功状态，避免在业务未授权时给出虚假完成感。

## 记忆与注意力

系统继续从 Host Job 复用映射和已忽略列，不因筛选/展开/改选删除任何来源值。改选的当前状态就在原列标题旁，无需前后翻页比较。原 `exclusiveSelect` 禁止同一系统字段重复占用；同名字段选项依然必须显示用途和 ID，不能按名称合并。没有权限或提交失败由原 Host 返回，可调整后重试；本地反馈不声称持久化。

## 无障碍与跨年龄

原表格语义、label、原生 select、details/summary、键盘 `change` 与移动端 44px 触控目标不变。状态文字和筛选 aria-live 计数保持屏幕阅读器可理解的文本内容而非仅靠颜色。真实 Android/iOS、400% 缩放和辅助技术仍需人工验证；CI 无法取代。

## 安全与数据修复

只从既有 `choice_N.options` 建立状态表；Eidos #195 校验不认识的 value、非法状态 key/label/tone，一律拒绝。Platform 不修改 `OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010`、Host enterprise 授权、业务字段定义存储、Recipe、Import Job 源文件、二次导入/行修复、用户确认门禁。Eidos 事件监听器只更新 DOM；不能写数据、替用户选择或执行保存。本 PR 也不触及 PA05、治理窗口、Railway 分支。

## 证据与剩余问题

- Eidos #195 已由独立 CI、Eidos UI 设计审查门禁检验并合并；Platform 此次只同步精确四个通用源码变更，完整 Platform CI/真实 Host Browser 需在最终 HEAD 运行。
- 现有 synthetic 172×22 正式隔离 Host 浏览器测试新增演示：首条真实 `__CREATE__` → `__IGNORE__`，状态变「不导入」、统计和关注筛选减少；切到全部字段找回，再恢复建议新建，所有字段仍保持原值、原审批指令且最终供应商导入回归。截图只来自合成数据，不是客户原 Excel。
- V3 **仍待实现/独立签收**：批次固定值的真实可编辑 Host 命令；将新字段 schema 计划预览/批准做成更连续的同屏体验；完整已登录 Railway 人工视觉与原 Excel 数据签收。不能以 Eidos 单元测试或模拟 URL 代替此两项。
