# BEX-01 V3｜集中审核恢复四列决策表（2026-10-16）

> 原型来源为 [Draft PR #909 的已保存 V3 高保真 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，并结合用户 2026-10-16 上传的四张目标/现状局部截图。重点不是组件数量，而是**异常驱动、来源就地、建议与人工确认分离、企业模型新增需治理**。现状 main 中 /map 已使用 Eidos 四列表，但集中审核仍是纵向 ReviewGroups 大表单，缺少相同决策语义。
>
> 本 PR 精确改变的 UI 所有者：`apps/object-extension/batch-page.ts`。其余只是两个真实隔离 Host Chromium 回归测试 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`、`tests/bex01/live_supplier_chromium.py`。不修改 Eidos 底层 HTML/CSS，也不更改业务 command、Job、Excel、权限或审核执行器。

## 目标与完成条件

实施/业务人员面对 17–20 项未匹配来源字段，需要在同屏一次看清来源列、样本、系统建议选择和「待新增/需要校对/待确认/不导入」状态。沿用 Eidos 标准四列 ReviewTable，默认只看需要关注，随时查看全部；每条保持唯一 `choice_N`，由业务 Human 决定复用真实已有字段、创建企业扩展或不导入。

## 流程与步骤

原流程从 /map 跳到集中审核后进入 18–20 个纵向分组的大表单，来源、候选、选择和状态不在一个可扫描表格；新流程在同一跳转目标按四列逐行核对，来源样本在第二列，选择在第三列，状态在第四列，详情仍随本行按需展开。只读状态来自 Host 当前保存的决定，非按钮。提交依旧触发既有受控 `OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010`，明确确认后才对企业字段创建与映射生效，供应商数据仍需独立导入确认。

## 导航与信息架构

保留 /map 中「集中审核 N 个未匹配字段」入口与现有 batch route、返回映射路由和 Host contextNavigation；在 batch 页面使用 Eidos 已有的 `reviewTable` 展示同一 `reviewGroups`，不是新建插件 UI、不把企业字段治理混为普通映射，也不复制另一套样式。此 PR 不假装解决全部 V3 端到端差异（例如是否需要真实可编辑批次固定值），仅把最明确的决策表结构落地。

## 视觉与颜色

四列为「来源列名 / 示例值 / 对应系统字段 / 状态」，与主映射页一致，复用 Eidos #192–#194 既有视觉、窄屏卡片及状态语义色 token。只读异常状态为文字加语义色，不以背景色代替文字；移动端沿用通用响应式而非独立图层；控件触控命中范围及键盘焦点由 Eidos 通用实现保留。

## 记忆与注意力

默认筛选「需要关注」把已明确不导入的来源折叠出当前任务，让人聚焦异常；「全部字段」可以复核未遗漏列。详情展开就近显示字段名称、数据类型及原值，候选重复字段仍有用途/fieldId 证据，且未丢失任一 `choice_N`。筛选仅控制可视性，不能重置已有选择。未匹配表格仍覆盖所有来源列，Job 中完整 Excel 数据不可变。

## 无障碍与跨年龄

使用已有原生 table、行表头、td 的 `data-heading`、select 与 details/summary；键盘焦点和 44px 触控保持 Eidos 通用规范。状态有真实文本，读屏器无需依赖颜色判断。移动端真实设备、缩放 400%、屏幕阅读器及中文文本溢出仍需最终 Human 视觉签收，不以合成 Chromium 自动测试代替。

## 安全与数据修复

一条来源列只可映射到一个目标字段，重复目标排他仍由 Eidos+Host 校验；不自动采用可能冲突的同名银行字段、不自动新建企业扩展、不忽略缺失值、不写回原 Excel。创建企业字段仍需受控 command 和独立确认，后续预检查/人工行修复/供应商提交均不绕过。支持返回与重新进入，保留原 Job 和审计痕迹。

## 证据与剩余问题

来源已读：#909 原始 HTML 表格标题/筛选与字段状态实现；本仓库现有 `apps/data-import/page.ts` 和 `apps/object-extension/batch-page.ts`、Eidos `src/renderers/html/index.ts`。后续本 PR 需经 UI 门禁、Platform CI、真实隔离 Host Chromium 真实路径 desktop/390px 正式通过才能合并。
仍未签收：已登录 Railway /map 完整真实作业页面、客户原始 Excel、V3 的批次固定值是否允许真正持久化及同名银行字段的人类实际确认。这些都不得用合成 172×22 测试冒充。

## 源码与首轮浏览器对照后的二次收敛

首轮隔离 Host Chromium [run #38905997281](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905997281) 已通过（[原始截图 artifact #12048087606](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38905997281/artifacts/12048087606)）；截图表明四列/筛选已实际渲染，但 UI 仍暴露 `Import Job` UUID、将三条样本与非空统计同时铺在默认格里、唯一目标候选也反复显示 fieldId，偏离 V3 的简洁决策层。故本 PR 随后追加真实来源文件名（提交值依旧 importJobId）、可读审核方式、单条默认样本（详细证据仍完整）、仅同名目标显示技术 fieldId。需要以新的最终 HEAD 浏览器回归和截图再次验证，不直接沿用第一次测试结果。原 Excel 和用户登录生产页面仍待 Human 签收。
