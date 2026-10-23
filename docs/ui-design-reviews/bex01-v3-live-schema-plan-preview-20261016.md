# BEX-01 V3｜真实 Host 集中审核的字段方案预览（2026-10-16）

> 以用户 2026-10-16 四张「字段对应关系 / 集中审核 / 证据及建议」截图和原始 [V3 HTML #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 为准。原型思想是「来源证据 → 系统建议 → 人工决定 → 企业字段治理」，不是添加一张静态汇总卡。
>
> 所有者：Eidos 通用只读 preview 先由已合并的 [Eidos #197](https://github.com/jiangxng/eidos/pull/197) 负责；**本 Platform PR 从 #989 即时反馈分支派生，等待 #989 合并 main 后再对齐**。精确业务 UI 路径 `apps/object-extension/batch-page.ts`；Eidos Vendor 的契约/验证/渲染/控制器/样式采用 #197 的精确选定改动；测试 `tests/protocol/bex01-batch-extension-import.test.mjs` 与 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`。不改 Agent、PA05、导入或模型权限。

## 目标与完成条件

用户在按 V3 四列审核时，能在提交前看见**全批次目前真正打算执行的所有字段决定**，即拟新建企业字段、复用已有字段、本次不导入、尚待人工处理四类。显示真实 Excel 列名、所选目标，以及拟建字段的真实人类字段名和类型；即使筛选只看「需要关注」，预览仍覆盖全部 source row。任一原有 `choice_N` 或 `label_N/type_N` 变化，预览实时变化，但其本身不会保存或批准。

## 流程与步骤

先在 Eidos 四列核对页阅读源样本与候选用途；根据业务含义改变原生 select，页面就地更新行状态、筛选与统计（依赖独立 [Platform #989](https://github.com/jiangxng/EVO-App-Platform/pull/989)）；在**核对表之后、原有明确提交之前**检查「本批字段处理方案预览」。如仍有未决字段，继续回到相应行处理。最后点击原 `确认：批量创建并自动映射`，Host 仍重新验证同名字段、类型、单目标排他和角色权限，并对企业字段创建做审批。不把预览当提交。

## 导航与信息架构

不新增页面、弹层或工作流路由。Eidos `reviewPlan` 是当前四列表的只读延续，与 Host 的原始 `choice_N/label_N/type_N` 指向同一个字段身份。预览类别必须穷尽真实 `statusByChoice` 状态；不可因为筛选或折叠而隐藏未获批准的来源列，不能凭文本推导 fieldId。源文件与企业模型仍由对应 Platform Owner 管理。

## 视觉与颜色

沿用 Eidos spacing、color、type、border token；计数与逐条文字清楚区分，不创建第二个可编辑表格，不叠加产品专用 CSS。桌面允许宽度自适应，多列预览；390px 手机自动单列。将临时选择明示为「**仅预览当前未保存的选择**」，不能用成功色或“已创建”误导。

## 记忆与注意力

传统逐条审核要求人在脑中记住数十条「新建／复用」决定。方案预览集中显示完整分组及逐项信息，既让审核者回看风险，也为同名字段的人工用途判断保留上下文；用户不必反复上下滚动核数。编辑名称与类型也自动更新，避免预览和实际提交值不一致。

## 无障碍与跨年龄

保持已有 Eidos 原生选择与详情控件、44px 手机触控以及桌面键盘操作。预览为语义 section/ul/dl，计数采用 `aria-live=polite`；仅更新当前浏览器 DOM 文本而不抢焦点，所有状态有文字，不依赖颜色。长中文、390px、200–400% 缩放和真实用户端最终体验仍须 Human 检查。

## 安全与数据修复

Eidos 的 preview 只允许引用**当前 group 内的可编辑真实字段**，合法决策枚举必须覆盖全部可选状态；浏览器以 `textContent` 生成文本，防止 Excel 或扩展字段名包含 HTML 时产生注入。没有新 Host action、没有持久化假动作、没有自动建字段或数据导入。最后提交动作和企业权限保持原状；原始 Excel 全列和先前映射值不因筛选或预览丢失。

## 证据与剩余问题

Eidos #197 自身 CI 与 Human 门禁已通过。Platform 需以确切新 HEAD 运行原有 172×22 isolated Host Chromium：对提议→忽略→恢复、预览数变化、所有 18 行未因筛选遗漏、拟建字段名称修改实时反映、桌面与 390px 两种截图进行验证，同时全套 import protocol、权限、纠错与最终独立导入回归绿灯。#989 进入 main 之前**不合并**本 PR；另须检查同期 PA05/governance commit，避免挤掉并行成果。

真实客户 Excel、登入后 Railway 页面及用户本人视觉 V3 签收仍不能以 synthetic CI 代替。持久化未提交草稿跨页恢复不属于本 PR；需要独立 Host 草稿契约，而非冒充此只读预览已经保存。
