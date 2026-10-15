# Human 界面设计必检工作规则（Eidos 权威采用）

对所有修改导航、配色、页面、业务表单、列表、按钮、移动体验、提示文案、Agent 交互入口的 LLM **必须先执行界面设计检查**。不能先做页面再事后补几句 UX 口号。

**先读完整权威（不得只读搜索片段）：** Eidos `docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`、`EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`；依任务继续读 Navigation & IA、Productive Design Language、Business Office Visual Language（颜色）、Mobile、Icon、Eidos tokens。现有研究索引：`EIDOS-VISUAL-COGNITIVE-RESEARCH-REFERENCE-INDEX-v1.0.md`；业务专项按其交接索引复用，不重复做旧研究。

**检查顺序不可跳过：**
1. 目标、谁来操作、上下文与完成/失败条件；
2. 最少必要步骤、直接操作与 Agent 协作、确认及合法修复；
3. 导航归属、路径与可发现性、避免重复导航；
4. 字体/层级/色彩/分组/留白/密度、一个主要操作；遵守 Eidos 现有 tokens，不硬编码新风格；
5. 认知与注意力：以前决定直接显示，系统记住草稿/来源/历史，用户不需跨页记忆；中断可继续、错误可撤销。不同年龄均默认可用，不按年龄推断能力；
6. 可访问性与多端：文字缩放、对比度、焦点与键盘、触控目标；
7. 角色、权限、副作用、安全/审计、来源数据保留、失败恢复；
8. 项目内的实际 UI 运行、浏览器/人工体验证据与剩余问题。

**任何 UI 代码 PR 必须同 PR 提交/修改 `docs/ui-design-reviews/<scope>-<YYYYMMDD>.md`，按 Eidos 检查清单完整填写 8 节，并引用至少一处本次真正改动的 UI 文件路径**。对常见 UI 源文件的改动，GitHub CI 检查这份记录及全部 8 个标题。CI 不会判断内容是否真实，也无法覆盖未走仓库 PR 的外部 LLM；仍须 reviewer/用户以实际业务流程验收。文档 PR 不等于交付/上线。

**不改变既有分工**：Eidos 决定通用导航/视觉/认知交互规范；EVO Platform 决定业务路径与权限；插件只给出领域语义；不要复制或直接覆盖另一窗口的 Eidos/PA 公共源码。详见 `docs/architecture/EIDOS-HUMAN-UI-DESIGN-REVIEW-ADOPTION-v0.1.md`。
