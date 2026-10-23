# BEX-01 V3 E3｜真实 /map 任务上下文与异常驱动 Human 审查（2026-10-16）

## 目标与完成条件
基于已正式合入 Eidos main 的 [E3 #191](https://github.com/jiangxng/eidos/pull/191) 可复用 `reviewTask`，让用户在真实 `/data-import/jobs/:id/map` 页面识别文件、来源行列总数、工作步骤、映射处理状况以及需核对的列。以同页准确处理为目标，绝不把静态 V3 原型当作真实导入结果。

## 流程与步骤
上传文件 → E3 文件上下文、步骤和映射统计 → 点击需要核对问题跳到该来源列 → 直接在 E2 四列表格做选择 → 原有保存/预检查/独立提交。E3 的问题跳转**只是焦点导航**，不能自动覆盖映射、执行 AI 推荐或提交供应商。

## 导航与信息架构
沿用原 URL / 业务 Form `evo-data-import.mapping`，不增加二级应用或重复的“审核工作台”。业务逻辑只在 `apps/data-import/page.ts` 生成：来源对象、由真实 Job 行列数生成的指标、四项映射状态统计、最多 12 个实际需要核对的来源列及对应 `map-source-N` 的原有 group ID；所有显示与控件结构来自 Eidos E3 公共 `reviewTask`。

## 视觉与颜色
Eidos Business Office Visual v0.2 + Productive Design Language 的原生体验：文件上下文卡片、三个步骤、四个简洁统计、浅色业务工作区域、真正的四列表格。E3 CSS 原封引入 pin 的 `vendor/eidos/src/design-language/productive-workbench-css.ts`，没有 BEX 特定样式、颜色或自绘页面。未完成项以语义警示强调，不对所有待新增列滥用错误色。

## 记忆与注意力
系统从 Job 重建映射和来源证据，字段选择保留原控件名称和已保存 Host 状态。E3 只提供进度展示和当前问题直达：如果目标行被筛选隐藏，Eidos 标准事件将切换“全部字段”再定位到原映射选择。进入/退出不会静默修改选项。不能把“被建议”写成“已批准”；指标明确根据已保存或当前来源状态生成，而非前端假设。

## 无障碍与跨年龄
Eidos `reviewTask` 来源标题与工作步骤按原生标题及列表显示；“核对本列”是语义按钮，定位后焦点进入已有 select；桌面及 390px 手机真实 Chromium 通过已安装 Host 验证。Eidos 统一中文、响应式、内容换行和状态语义。测试环境的合成来源值不能代替客户实际 Human 验收。

## 安全与数据修复
不改动 `apps/data-import/actions.ts`、Service、权限、持久化或 Host SQL；`subjectType` 三条异常仍必须由 Human 逐行确认，不自动写入固定 ORGANIZATION；重复银行字段必须按实际字段 ID 和用途核对。E3 状态与统计不构成 Host 提交授权。来源数据不因过滤和跳转而更改，预检查及提交仍需原有明确操作。

## 证据与剩余问题
- Eidos #191 独立源头与 CI/Human 门禁已签收；Platform 本 PR 只消费正式公共 `reviewTask`。
- 变更路径：`apps/data-import/page.ts` 及 `vendor/eidos/src/{runtime,renderers,design-language,app-host}` 的最小 E3 能力增量。
- CI：`tests/protocol/data-import-human-experience.test.mjs` 断言当前 Job 文件/行/列和准确指标；`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py` 必须打开真实 `/map`，桌面和手机核对概览、问题按钮和映射值不变，并继承 172 行/18 扩展字段完整旧验证。
- 不宣称原型完全实现：当前版本仍保留顶部部分技术性的 Job/批量审核输入；文件信息/问题概览/字段表的视觉比例与用户认可的 V3 原型应在真实页面截图中进一步比对。若测试失败，不合并或上线。
