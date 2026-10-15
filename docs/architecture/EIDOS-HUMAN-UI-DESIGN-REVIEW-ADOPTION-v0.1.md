# Eidos Human UI 设计必检规范的 Platform 采用

**状态：** 2026-10-15 Platform 采用政策。上游规范属于 `jiangxng/eidos`，本仓库仅管控业务 UI 工作流和审核证据；本文件不是第二套颜色/导航系统。

## 1. 来源权威与责任边界

| 关注点 | 正式权威 | Platform 的职责 |
|---|---|---|
| 完整 Human Journey / 恢复 | Eidos Experience Architecture Constitution | 业务对象、数据权限、状态、合法修复 |
| 导航/信息架构 | Eidos Enterprise Navigation & IA | 具体应用导航放置，不重复暴露插件入口 |
| 交互密度/按钮/文字 | Eidos Productive Design Language | 当前业务工作台的入口/反馈/一次提交 |
| 配色与视觉 | Eidos Business Office Visual Language v0.2，Eidos tokens | 只引用既有 tokens，不写插件 CSS 与私有主色 |
| 认知负荷、跨年龄适配 | Eidos Human UI Design Review Checklist v1.0 与研究索引 | 历史信息复用，草稿保存，错误恢复，例外优先 |
| BEX-01 业务专项研究 | BEX-01 研究 PR #899 内的流程/视觉/认知资料 | 维持 Excel 原始列，批量审核、Agent、主体类型与供应商提交边界 |

Eidos 上游稳定入口（待 PR #183 完成合并后以其 main 为准）：
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-VISUAL-COGNITIVE-RESEARCH-REFERENCE-INDEX-v1.0.md

当前 Platform vendored Eidos 代码快照可能滞后于上游文档；不因此私自整体同步或改写 vendor。

## 2. 执行与证据

- 所有涉及界面的 LLM 工作都必须按照 `.clinerules/03-human-ui-design-review.md` 先检查、再设计、再实施，不能把研究留在一个即将超长的聊天里。
- 代码 PR 按 `docs/ui-design-reviews/*.md` 留下每次具体检查：目标、流程、导航、视觉配色、记忆注意力、跨年龄可访问性、数据安全/纠错、真实证据和剩余问题。
- GitHub Action `human-ui-design-review-gate.yml` 只对识别出的 UI 源文件变更要求随 PR 提交上述记录。文档与实现分开验收，不把通过机械关卡当成用户体验签收。
- UI 内容在 `apps/**`、`manager/**`、`vendor/eidos/**` 的语义变化都有明确 review 义务；机器识别只是一层防遗漏，不可能证明所有自由文本中是否有 UI 改动。漏检应补充检测范围，不应绕过工作规则。
- 对正处于其他窗口的 PA-02/PA-04/Eidos 通用功能 PR，不擅自修改业务代码；如果新门禁拦截原有界面 PR，应由所属窗口补做 review note（或说明无 UI 变化并补精确识别例外），不能替该窗口合并、重写实现。
- 全部检查不能要求用户为常规业务显式承担机器内部步骤；不要牺牲风险/业务双确认、审计、安全，去追求「点击数最少」。

## 3. BEX-01 的对照示例，不扩展本次整改范围

`import-33ff3446-80c5-4992-b5c6-710f415535b3` 页面曾出现 22 个未匹配字段及多层技术控件。正式设计建议先加载以前保存的字段映射，再推荐需要的字段；只让用户对真实歧义做判断，完整源列可展开，原始值保留；在同一工作面完成集中审核、预检查、明确导入，错误可修复、暂停可继续。此例是**待用户确认的设计提案**，不应被描述为最新 Railway 已部署体验。

## 4. 恢复与后续

- 界面治理：从 Eidos PR #183 和本 Platform 规则/CI PR 出发；
- 业务设计研究：沿用 EVO PR #899 的独立资料线及其正式交接入口；
- 实际 BEX V2 实现：属于未来专项 PR，需使用此强制记录、Chromium 和原 Excel 验收；
- 发布：仅经测试/审查的固定提交更新当前 Railway 开发环境，不部署移动 main。
