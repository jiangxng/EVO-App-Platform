# BEX-01 E4｜窄屏核对表来源与状态同行（2026-10-16）

> **仅同步 Eidos 通用 CSS**：`vendor/eidos/src/design-language/productive-workbench-css.ts` 中 ReviewTable 的窄屏卡片单段；对应已合入 [Eidos PR #193](https://github.com/jiangxng/eidos/pull/193)，`main@3909414267a8507905749cc7f63824f4b64c917f`。本 PR 其余修改只有现有 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 测量回归及本设计记录。**不覆盖 vendor 其他模块，不新增 Platform 私有 CSS 或改 Host 行为。**
>
> 证据起点：[Platform #978](https://github.com/jiangxng/EVO-App-Platform/pull/978) 隔离 Host 172×22 的 [run #38895420715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715) 与 [artifact #12044215349](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715/artifacts/12044215349)：390px 时内部滚动层 9,139px。与 Eidos [Human UI 设计规范](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md) 一致。数据全是 synthetic，不是客户原 Excel。

## 目标与完成条件

对供应商等使用通用 Eidos ReviewTable 的业务页面，手机用户在同一卡片第一行看见字段名称及其只读状态；已存在的来源值、证据展开、映射 select 保持不变，22 行全部可以操作。判定标准：手机同一行状态、控件高度≥44px、桌面表格不变、默认筛选及映射值不丢失、真实隔离 Host 完整导入回归，移动端内部滚动高度较 #978 原基线 9,139px 减少。

## 流程与步骤

原手机布局逐字段排列“字段名→样例→目标选择→状态”，状态单独一行；新布局在字段名右方立即显示状态，之后样例与目标选择纵向排布。工作流程不变：查看来源→人工核对→集中处理拟建字段→明确预检查→独立确认导入。手机上仍可筛选需要关注/全部字段，仍允许通过现有批量字段审核统一处理，不要求逐字段反复跳页。

## 导航与信息架构

继续使用同一个 `/data-import/jobs/:id/map`、既有面包屑和 Host Job 导航；没有新页面或工具按钮。新增排版只在 Eidos `@media(max-width:700px)` 的通用 ReviewTable 内生效。Eidos 负责通用卡片关系，Platform 负责字段状态和业务说明。保留已有 `tbody` ID、字段 key、同名目标的真实 fieldId 和历史 Recipe。

## 视觉与颜色

Eidos #193 通过 `minmax(0,1fr) auto` 两列标题、原色彩 token、`--eidos-space-xs` 间距保留正负状态色；去掉只读状态单独的“状态”视觉标题；证据/编辑选择依旧全宽。原始 table `th/td` 和字段状态文字不删，仅改变小屏 CSS，屏幕宽度高于 700px 的桌面表格不受影响。不创建 BEX-only 皮肤；不牺牲 44px 触控尺寸。

## 记忆与注意力

状态贴近来源列名使用户无需扫到卡片最下方回忆这行是否已处理。原始三个来源示例继续可展开；状态筛选不清空所有 22 项映射。批量字段审核入口与已处理字段同样保持，不因为视觉简化而自动创建扩展字段。不将 9,139px 全部归咎于状态标题；减少多少以真实 Chromium 新证据为准。

## 无障碍与跨年龄

DOM 表格结构、行列头与表单键盘焦点、原生 select、details/summary 保留；只读状态仍有明确文字（非只靠颜色）。手机触控控件不少于 44px，`minmax(0,1fr)` 支持较长中文字段名回行；不增加固定遮挡底部按钮。400% 文本放大、真实 Android/iOS 和屏幕阅读器仍属 Human 验收，不能由单次 390px Chromium 冒充。

## 安全与数据修复

样式完全不触及 Platform 的 Job、源行及表头持久化、原 fieldId、AI 建议、权限、Host 提交、三条主体类型缺失行修正、双“开户银行”人工识别和明确批准门禁。CI 使用授权范围内独立隔离 Host 合成数据；生产 Railway 与客户文件无写入。不以 CSS 提升换取删除字段、跳过判断或默认接受 AI。

## 证据与剩余问题

1. Eidos [#193](https://github.com/jiangxng/eidos/pull/193) 已通过自有 CI 和 UI 门禁合入；Platform 使用完全相同的上游特定 CSS 片段，不同步任何其他 Eidos 文件。
2. Platform 本 PR 的精确 HEAD `BEX-01 Real Host Chromium Supplier Journey` 测试将检查 22 源字段、状态同行几何、全 44px 可触控、相较旧 9,139px 的新滚动高度、已存在的真实映射/批量定义/三条人工修正/供应商详情数据持久化。保留滚动截图及 JSON 度量用于事后验证。通过结果按实际 CI 填写，不预先宣称已绿。
3. 客户原 Excel `往来账户2026_10_08_10_15_23.xlsx` 和用户已登录 Railway `/map` 全页视觉未可得，E4-03/E4-04 尚不能 Human 签收；绝不拿 synthetic 代表真实客户数据。


## 精确 PR HEAD 的真实 Host 结果（2026-10-16）

- **平台 PR #981** 初次 HEAD `5a6c5f5bb6b2ba59b9e1f2c85823cd4d15d25136` 的 [BEX-01 Real Host Chromium Supplier Journey run #38897640003](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38897640003) 为 SUCCESS；[artifact #12045030445](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38897640003/artifacts/12045030445) 已实际取回，独立 JSON 文件为 `v3-e4-mobile-inline-status-measurement.json`，另有完整滚动分段截图。其他 Platform CI、Template Store、Human UI Review、Project Continuity、Lightweight Host Architecture 检查均为 SUCCESS。本文追加后需重新以最终 PR HEAD 的 CI 确认，不冒用旧 HEAD 的状态。
- **真实测量**：390px 手机 Eidos 内部滚动层 `9139px → 8155px`，减少 **984px / 10.77%**；同源合成 22 条来源卡片全部保留且可见，状态/字段名几何同行；映射 select 最小 **44px**；滚动连续截图 **16 → 15 张**。桌面 1280px 内部滚动层仍为 **3981px**、连续截图仍为 **6 张**。
- **实际截图观察**：手机卡片第一行左为业务字段名称，右为「已匹配／待新增／不导入」等完整可读文字；来源值、展开入口、可编辑选择仍在同一卡片，底部「保存映射并预检查」与 AI 自助入口仍可见。长期大量字段行和部分长中文名称自然换行，仍需使用者对 V3 视觉做人工判断。
- 以上只证明**隔离 Host synthetic 172×22 的 UI 和业务回归**，不代表客户原 Excel、生产登录页面、真实员工现场或 Human V3 签收。
