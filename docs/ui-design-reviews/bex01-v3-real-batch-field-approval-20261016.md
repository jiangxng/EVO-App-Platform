# BEX-01 V3｜真实 Host 集中审核页面：证据—建议—选择—状态同一决策行（2026-10-16）

> **V3 原型权威：** [Platform Draft PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 的 `docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`，已读取原 HTML 的页面布局、`mappingRows`、筛选、错误区、字段创建确认、预检查及人工授权等完整相关段落。用户本轮提供的四张截图进一步确认：四列并不是排版装饰，**每一行是一个可以得到证据、理解建议、作出决定并识别结果的审核单元**。该记录不替代原型，也不把 prototype localStorage 模拟存储当作 Host 行为。
>
> **实际 UI 源码：** `apps/object-extension/batch-page.ts`；测试 `tests/protocol/bex01-batch-extension-import.test.mjs`、`tests/bex01/live_supplier_chromium.py`、`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`。不改 `vendor/eidos`、PA05 或治理窗口中的其他文件。

## 目标与完成条件

供应商实施人员在已有 `/data-import/jobs/:id/map` 返回的「集中审核未匹配字段」入口中，无须在两套不一致的审查范式之间切换。原真实 `/object-extensions/from-import?job=...&mode=batch` 曾采用 18 组展开式竖向 Form；现在应用**已有 Eidos ReviewTable**：来源列名｜原始示例｜对应系统字段决策｜状态，默认只看真正需要关注的项，支持全部/已忽略。列表行可就地展开原始值、同名候选用途、字段名称和类型，同时严格保留业务上「一次集中确认新建字段」的权威提交动作。

## 流程与步骤

保留 Stage → /map 核对 → 集中审核未匹配来源 → **人工批准创建企业扩展字段并自动映射** → 返回 /map → 预检查 → **独立确认导入供应商数据**。新表格默认显示需校对、建议新建和待确认匹配，已明确忽略的只在全部/不导入筛选中出现。底层同一组 `choice_N`、`label_N`、`type_N`、`sample_N`，既不删除预填建议也不主动提交。系统显示「待新增」仅代表建议，不代表字段已被批准或创建。

## 导航与信息架构

与原型一样，问题入口及选择就在同一业务任务中。顶部以文件名、记录数、未匹配列数和待处理分组标识任务；不再将 UUID 当成人员识别任务的名称。筛选不创建新版本、不删除隐藏字段，任务问题按钮对准真实来源行。Eidos 已有 E2 四列表和 E3 任务摘要原语在 Platform 两条业务路径复用；不复制 V3 HTML、CSS 或新增专用容器导航。

## 视觉与颜色

原 Eidos 表格结构与配色、中文字号、四列相对层级、窄屏卡片式栅格、44px 触控目标均沿用，不做 Platform 私有 CSS。每个来源行默认只呈现**一个**代表样例；详细的非空数、三项原始样本、两个同名候选字段真实用途，以及业务字段名/类型的编辑均由同一行证据折叠层提供。只读状态显示「待新增」「需要校对」「待确认匹配」「不导入」，不使用颜色作为唯一提示。页顶四统计是业务语义而不是装饰。

## 记忆与注意力

原始 `DataImportJob` 的全部列/行和既有 Recipe 不变。已有映射和被忽略的决定继续从授权 Host Job 恢复，避免重新判断。示例放在选择旁，歧义候选的目的、类型及稳定 ID 仍可按需展开，绝不默认依据同名选择。「需要关注」默认聚焦可审事项，「全部字段」保持访问隐藏行的可恢复性。新建字段集中批准，避免 20 个弹窗。

## 无障碍与跨年龄

遵循 Eidos ReviewTable `th`/四列标题/读屏表格语义与 `details/summary` 原生键盘操作，原选择器排他约束仍在。390px 会变成每字段卡片并保留 44px 最小触控，不在移动端删掉来源或编辑项。中文过长内容和同名用途允许在本行折叠/换行；最终真实移动设备、200%/400% 缩放和读屏器仍需 Human 验收。

## 安全与数据修复

本 PR 不改变 `OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010`、值 `__CREATE__/__REVIEW__/__IGNORE__`、Host enterprise 授权、一次确认创建字段、已用目标字段排他、人工行修正、dry run、commit 或审计。**批次固定值**只在授权 Job 确实保留 `CONSTANT` 映射时显示为只读事实（例如 `subjectType=ORGANIZATION`）；绝不凭 V3 模拟值自行给企业数据设置常量、回填缺失主体类型或越权导入。可编辑常量的真实 Host 路径仍需单独实现和签收。使用的合成测试不是客户原始 Excel。

## 证据与剩余问题

- 原型已读原始 HTML（本 PR 不是仅基于搜索摘要）；V3 图片由用户再次确认每列结构与认知角色。
- 通过真实 `renderToHtml` + `validateUidl` 合同检查 5 列样本、同名银行冲突、建议状态、筛选、全部来源一次渲染及原值保留；通过现有真实隔离 Host 172×22、桌面/390px 浏览器回归与最终字段创建/供应商读取证明实际路线，不以这组 synthetic 模拟客户签收。
- **未涵盖的 V3 差异：** 批次固定值编辑/保存的独立 Host 命令、选择改变后无需保存即可更新视觉状态、同一页完成字段计划预览及人工签收、真客户 Excel 与已登录 Railway 的 Human 视觉验收。这些属于后续批次，在没有真实合同/证据前不伪称完成。
- 不能因为此次 PR 的测试通过，就把 E4-03 原客户数据或 E4-04 用户视觉签收标记为完成。
