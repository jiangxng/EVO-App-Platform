# EVO 插件 Human Experience 统一交付门禁（2026-10-28）

> **性质：**在既有 Eidos 规范下增加 Platform 交付约束，不另立视觉系统、不改 Eidos tokens、不把 BEX-01 V3 静态 HTML 当通用组件。适用新插件、已有插件新页面/导航/权限提示/表单/主操作、LLM 自动开发和 Review。新增协议或公用样式归 Eidos owner；Platform 仅审查业务语义、集成与交付证据。

## 1. 起因与真实证据（不要把代码预期当 Human PASS）

- **U / 用户页面截图，2026-10-28：**东京预览 `企业上下文` 目录，已出现一个真实企业。页面展示了技术分类 `ACTION`，当前/默认企业描述重复，归档企业与进入企业在同一卡片操作区，创建企业和“我的权限”以额外通用卡片拼接；创建/权限两卡重复显示“请先切换到个人空间”。顶部企业切换与下方创建卡的关系需用户自行猜测。原图来自当前用户对话，**未保存为仓库附件，不虚构链接**。
- **P1 / 代码：**[企业目录页面模型](../../apps/enterprise-context-governance/context-page.ts) 的 `category: "ACTION"`、重复 `status/summary/badges`、把权限查询加入普通 `items`；[通用 Eidos CatalogBrowser 渲染器](../../vendor/eidos/src/catalog-browser/render.ts) 原样输出 `item.category`，不会自动将内部枚举翻译成业务标签。
- **P1 / CI：**[旧 UI 门禁](../../tools/ui-design-review-gate.mjs) 只要求八个章节、任一 UI 改动路径和文档存在；[M0 审查](../ui-design-reviews/evo-permissions-m0-create-eligibility-20261028.md) 按该规则 PASS，但没有原型级布局/配色对照或已认证浏览器截图。**CI PASS ≠ Eidos 一致性 PASS ≠ Human PASS**。
- **权限边界：**此截图来自企业上下文（非个人空间），原先拒绝创建的逻辑可能正确；截图已足以判定该目录的导航、语言和信息层级不合格，**不能据此推断权限接口失效**。M0 的“我的权限”页和创建页仍待单独真实操作；既有 M0–M3 四里程碑不扩项。

## 2. 唯一上游设计权威与 V3 的正确用法

- 权威：Eidos `docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md` → `EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md` → `EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md` → `EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md` → `EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`。均位于 [jiangxng/eidos](https://github.com/jiangxng/eidos)，修改跨插件公共规则须归 Eidos owner。
- 用户认可的 V3 方法与原型：`docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`、`BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md`、BEX-01 V3 设计交接及证据。V3 是**可验证的页面品质案例**，并非所有插件都必须采用导入工作台的页面结构。
- **不可遗失的五条：功能就近、信息就地、系统记忆、异常驱动、操作连续。**用户看到的是业务对象/状态/决定，不是 Host、Context、`ACTION`、`ACTIVE` 等内部语法。需要技术诊断时应进“高级信息”。

## 3. 开发前强制产物：先页面定义，后功能代码

每次插件新增或修改 Human Experience，先在对应 PR 的 `docs/ui-design-reviews/<scope>-YYYYMMDD.md` 提交以下明确决定，不能只填写“复用 Eidos”：

1. **Human 任务和 Page Archetype：**谁、哪项业务任务、当前对象及完成/异常/恢复、唯一主操作。选已有目录/表格/详情/表单/工作台/上下文工具中的合适模式；无法复用时列出缺口并请 Eidos owner 决定公共能力，**不能靠创建新卡片模板绕过**。
2. **导航归属：**说明是 primary work / app-domain / business admin / settings / contextual / search-long-tail 中哪一层；是否真的需要持续入口；是否和顶部企业选择器、现有入口重复。插件被安装、页面可路由 ≠ 必须放全局导航。
3. **业务语言和信息层级：**移除默认渲染中的内部枚举、技术名称、重复状态；统一企业名/当前身份/权限状态的展示位置。创建受限时将原因和合法下一步放在操作附近，不制造第二个死路卡片。
4. **实现归属：**复用已批准的 Eidos renderer/tokens/导航/控件；插件只贡献业务对象、动作、权限/状态语义；Host/Provider 仍为真实授权 Authority。不复制 V3 HTML/CSS、不维护插件私有按钮颜色或 Shell。
5. **三轴对照：**对“功能、布局、颜色”分别给出和已有可编辑原型/已批准模式的差异、明确结论、未完成项；有固定 V3 原型源码时优先比对源码，不允许把截图当作源码。
7. **页面闭环测试（含返回）：**每一条新增/修改导航和操作路径都要列出 `入口 → 当前动作 → 目标页 → 返回父级 → 错误/取消恢复` 的矩阵，包含权限拒绝、无数据和实际角色；从已有 Eidos `contextNavigation` / 页面 action 契约实现，不复制导航组件。导航/主动作的源码 diff 必须同 PR 修改至少一份 `tests/**/*.test.mjs` 回归测试（结构性 CI 校验），测试须执行往返而不只是检查正向 route。**不能仅靠 UI review 文档通过证明路径已完成。**

6. **证据等级：**标出 `代码静态`、`自动 UI/Chromium`、`桌面中文截图`、`390px/窄屏截图`、`真实 Host`、`Human 签收`。缺的写“未取得”；不能让 CI 文档合规替代用户操作证据。

## 4. PR 阶段性完成条件（不制造另一套 UI 权威）

- **设计准备：**已有 Experience 模式与导航归属清楚、Eidos/V3 对照来源真实、业务词汇和主次操作约定明确；未准备时不直接拼页面。
- **代码完成：**权限/状态/前端后端契约与回归测试通过；新增/修改插件 Experience 必须补全审查文档和机器门禁。禁止新增直接面向用户的 `category: "ACTION"` 等原始技术分类。
- **可发布体验：**至少桌面和窄屏可操作的中文实机截图/自动浏览器结果；对照功能、布局、颜色三轴。不可在没有证据时说“100% 还原 V3”；仅有单屏图片或无浏览器的 DOM 断言不算全面验证。
- **Human：**由真实预览/业务身份完成实际操作，权限反馈、导航、失败恢复与业务结果逐项确认；没有此证据就保留待签收、不得宣称 UX/Human PASS。
- **多窗口：**方案与证据写 GitHub PR 文档，保留版控源码和来源分级。开新窗口先读规则和交接，不依赖聊天记忆。并行 Eidos、BEX、PA05、EC 的 owner 文件不能擅自重写；门禁迭代应只在独立分支提 Draft PR，required CI 与现有分支影响另行核验。

## 5. 当前 M0 最小补救（不增加权限里程碑）

- 本次提供的目录截图使 **M0 Human UI 导航/可读性发现缺陷，尚未签收**；**不得**把截图当作“我的权限”和创建表单已验收。
- 推荐的设计方向（待 Eidos/实际原型比对后实施）：企业列表主体保持列表/表格语义；创建企业动作按当前 Personal Context 权限放在稳定的页级或企业切换处；“我的权限”在与当前账号和权限语义一致的位置提供一次清晰入口；当前/默认状态各有唯一展示；归档属于低频危险操作，不应与进入企业同级。实际按钮/导航布局要按 Eidos owner 和客户端运行验证决定。
- 只允许在权限 M0 范围内修复误导性提示/业务信息层级；不借机开发 M1/M2/M3、套餐、众包或移动端全站改造。使用独立功能 PR，提交时重新检查最新 main、M0 原测试和东京部署边界。

## 6. 原始来源与查阅等级

| 来源 | 本轮状态 | 用途 |
| --- | --- | --- |
| 当前用户企业目录截图（2026-10-28） | U：实图可见，未取得当前登录页点击录屏 | M0 目录真实 UX 问题 |
| EVO `context-page.ts`、`render.ts`、`ui-design-review-gate.mjs`、M0 review | P1：GitHub main 原文已读 | 定位重复状态/技术字段及形式化 CI |
| Eidos Human Authority、Navigation、Productive、Business Office、UI Review Checklist | P1：GitHub eidos main 原文或相关完整章节已读 | 唯一可用设计权威 |
| EVO V3 原型及 Business Office 高保真参考 | P1：已核对源码与已有评审结论；V3 测试/Human 各有边界 | 业务页面对照方式 |
| 竞品、套餐等外部官网 | 本轮未重新查证 | 不增加设计与开发范围 |

**与权限专项的关系：**权限固定状态仍仅由 `docs/plans/platform-governance/EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md` 维护；本文件是**跨插件交付要求**，不是权限第五里程碑或另一份 M0 状态表。
