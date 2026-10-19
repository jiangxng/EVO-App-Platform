# BEX-01 V3｜真实 Host 决策优先布局与高保真目标审查（2026-10-19）

> 本次实施是 **V3 100% 还原建设的第一项工程改动，并非 100% 完工声明**。原设计权威为 [#909 V3 HTML](https://github.com/jiangxng/EVO-App-Platform/pull/909) 和 2026-10-16 S01–S04 四张原始截图（ChatGPT 文件库原图已直接读取并在 M04 详细研究索引 §9.4 登记）。通用技术来源为**已合并的 [Eidos #196](https://github.com/jiangxng/eidos/pull/196)**：`reviewTask.presentation="decision-first"`。本次仅将已合并的 Eidos 上游改动准确前移到 Platform vendor 局部，不重做外站研究、不更新其他 Eidos owner 模块、不改真实客户数据。

## 目标与完成条件

V3 Human 工作台首先让用户核对当前来源列、原始样本、字段选择及状态。现有 `/data-import/jobs/:id/map` 与 `object-extension.batch-import` 页面 Eidos 默认完整任务概览在表格前，占据首屏，和用户的“异常优先、证据就地、操作连续”的高保真基准冲突。本次在原有四列审核表之前压缩任务概览为可展开摘要，完整辅助信息仍可取得。最终 V3 的 100% 样式、交互和 Human 签收是后续独立门禁，不能由此一项替代。

## 流程与步骤

从既有 Host Job 打开 /map 或批次审核：首先显示文件名及真实注意项数量的任务摘要 → 立即可见来源表及字段决策 → 如需检查历史，点击或键盘展开原生 details 查看原完整文件事实、步骤、统计、问题跳转、说明 → 折叠后继续做决定。原始字段选项和保存/授权命令不因展开、折叠发生变化。客户主体类型每条原值与审批路径维持既有规则。

## 导航与信息架构

两条实际 Host 页面均复用 Eidos `reviewTask` 合同，仅选用已经合并的通用 `presentation` 属性；无新增 BEX 私有 shell、React 皮肤、侧边栏或业务路由。/map 现有“集中审核”入口及返回方式不变；文件 ID、授权企业上下文、`choice_N` 的来源列身份和版本校验不变。不得把 Task Summary 的文本当正式批准。

## 视觉与颜色

采用上游 Eidos 44px 原生 summary、高对比边框、现有响应式 token。摘要层默认折叠，但展开时全部 steps/facts/metrics/issues/help 原样出现；状态数量附文字，不单用色彩。真实 ReviewTable 四列、默认需要关注筛选和移动卡片保持独立。**尚未检验 1280px/390px 的逐像素比例与截图偏差，仍需后续检查，不能称已经 100%。**

## 记忆与注意力

人的当前任务是逐列审核，不是重复阅读多屏上下文。来源文件名和待处理数仍可即刻识别，冗长统计与问题辅助是可还原的结构性信息而非删除。草稿保存、重入和已审核 Recipe 仍由 Host 负责；本布局不改变任何原始行值或已保存决策。

## 无障碍与跨年龄

原生 HTML `details/summary` 支持键盘、屏幕阅读器；summary 最小 44px 并有可见焦点，长中文名可换行，所有内层 focusGroupId 不删除。Eidos validator 严格白名单 `full/decision-first`，未知 `presentation` 被拒，默认值保持旧展示。窄屏审核卡片仍提供源列、示例、选择、状态，目标是无水平溢出；真机触摸、200%/400% 缩放和读屏器需要另行签收。

## 安全与数据修复

**仅展示层选择**。没有改变 `DATA_IMPORT_REVIEW_COMMAND_V010`、`OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010`、映射字段 ID、企业 Owner/Admin 权限、同名开户银行防误选、三条主体类型逐行纠错、Schema 创建批准、dry-run、Recipe、supplier commit、receipt 或审计。Eidos 通用合同既非授权源，也没有新脚本执行；Html 所有主体文字沿用 `esc` 转义。M04 未取得用户原 Excel 和受权 Job，仍 OPEN。

## 证据与剩余问题

- 上游 Eidos #196：已合并原文、源代码/完整补丁，明确只对 opt-in 生效。本次做最小 4 个 vendor 文件同步，保留已有 Platform Host overlays。
- Platform 真实业务：修改 `apps/data-import/page.ts` 和 `apps/object-extension/batch-page.ts`，使两个页面显式选择 decision-first；`tests/protocol/bex01-v3-decision-first-visual-review.test.mjs` 对 HTML native disclosure、完整事实保留、严格校验和真实表单进行回归。
- 按精确 PR HEAD 校验 Platform CI、BEX-01 Real Host Chromium、Human UI Gate、Continuity、Lightweight Host，核对原 1280px/390px 截图；如果出现新增失败必须修复后重跑。
- **仍有原 V3 的剩余差异**：实际已登录 Railway 页面与原型的字体、留白、标题、工具栏、字段确认区、底部操作区和跨路由连续性尚需逐项截图审查，不能将本项的自动化绿灯视作完整 100% 或用户签收。
- M01–M03 工程已完成；M04 的原 Excel、两个开户银行真实 ID、三条真实主体身份未验收；M05 真实最终导入待验证；M06 视觉和 Human 签收待验证。工程 3/6 不变。
