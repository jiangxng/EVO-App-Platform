# BEX-01 / CP-03 V3｜简短交接入口（2026-10-15，本窗口最新）

> **用途：换聊天窗口后先读本页（约一屏业务结论 + 准确 GitHub 落点），再读 [详细参考与决策索引](BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)。** 沿用 `docs/plans/foundation-list-experience/` 原有 BEX 文档体系；此前 [界面研究交接入口](BEX-01-UI-RESEARCH-HANDOFF-ENTRY-20261015.md)、[视觉认知原始索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[原流程研究索引](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md) **原样保存**，本篇只记录本窗口最终增量，不篡改早期快照。2026-10-15 以 GitHub 当前实际状态为准，下一窗口仍需刷新 HEAD。

## 1. 核心目标与用户已确定决定

本窗口经历了 **BEX 认知负担研究 → 静态/可操作原型 → 高保真视觉纠偏 → 国内优秀企业软件参考 → Eidos 核心交互原则正式落地 → V3 可体验 HTML → 第一项真实 Host 功能合并**。

用户明确：
- **否定开发说明书式原型。** 页面不能反复写“（演示选择）”“三条模拟问题行”“非 Host”“Schema”等工程提示；高保真界面应像真实软件，只使用普通业务人员能理解的文案。**来源为合成数据、尚未连接 Host 的事实放在 PR 和研究证据里，不得冒充真实导入。**
- **认可高保真视觉方向**：“赏心悦目”“就是这种感觉”；重视简洁、留白、中文业务表达、信息有秩序、复杂功能完整却不用到处找，不是要求复制飞书品牌/页面。
- **不限于飞书，也要借鉴简道云等中国优秀企业软件。** 具体关注智能匹配与人工修正、Excel 数据预览/字段配置/结果、近场动作、上下文持续、减少工作记忆成本。
- **EVO 长期原则必须正式进入 Eidos 设计语言**：
  > **让复杂留在系统内部，让简单发生在用户面前。**  
  > **功能就近、信息就地、系统记忆、异常驱动、操作连续。**
- **先做高保真再进实际业务**，复用成熟 Host 业务契约与 Eidos 组件；界面需要能直接操作并有截图/测试，不靠屏幕静态图或漂亮 CSS 冒充产品交付。
- 多窗口不能冲突：不动 PA05、Eidos 共享运行代码、Railway、他人 PR 文件；尤其不要覆盖正在修改导入页的 #860、Host/批量审核相关的 #878。

## 2. 准确 GitHub 交接快照

| 事项 | 当前已核实（2026-10-15） | 判断边界 |
|---|---|---|
| EVO 仓库 | https://github.com/jiangxng/EVO-App-Platform | `main@60366faca3481e90bf37bb23a6f2f08ac37b5a05`（本轮最后核验快照；后续其他窗口有 Ledger/平台变更，#921 的准确合并提交仍是 `1695d4ab31985ba88f723d5dc4954dacc1677317`） |
| 高保真/研究活动分支 | `docs/bex01-v2-human-design-review-20261015`， [Draft PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | 本次交接文档存于**此分支**；PR 本轮开始前 HEAD `2452a5f61ea837c1b749b9bd497e1e055c17d393`；**本次提交后需以最终 GitHub HEAD 为准** |
| Eidos 仓库 | https://github.com/jiangxng/eidos | [PR #186](https://github.com/jiangxng/eidos/pull/186) **MERGED**；`main@4c2f36040bdca102b67ba65acb7b35998261ab7d`，四份正式设计语言文档已更新 |
| 正式导入恢复入口 | [EVO PR #921](https://github.com/jiangxng/EVO-App-Platform/pull/921) **MERGED** | `main` 合并 SHA `1695d4ab31985ba88f723d5dc4954dacc1677317`；真实 `/data-import` 未完成 Job 在前，`继续导入 · 文件名` 导航到映射/预检；**只导航，不自动提交** |
| 并行实现 | [#860](https://github.com/jiangxng/EVO-App-Platform/pull/860)、[#878](https://github.com/jiangxng/EVO-App-Platform/pull/878) 均 **OPEN**；[#846](https://github.com/jiangxng/EVO-App-Platform/pull/846) **OPEN / Draft** | #860 涉及 `apps/data-import/page.ts` 映射段与 Object Extension、Host；#878 涉及 `manager/server.ts`。先处理 owner/集成顺序，避免把它们误记为已完成 |
| 实际业务数据 | 原始 `往来账户2026_10_08_10_15_23.xlsx`、Job `import-33ff3446-80c5-4992-b5c6-710f415535b3` | **本窗口未取得真实 Excel 二进制和授权 Job JSON；没有验证全部真实值、目标 field ID、真实企业提交或 Railway** |

## 3. 已经实现/已经证明的能力

1. **视觉品质范例与完整方法**：[Business Office 高保真品质参考](BEX-01-BUSINESS-OFFICE-HIGH-FIDELITY-QUALITY-REFERENCE-20261015.md) §1–§7。白色业务表面、克制状态色、清晰阅读顺序、问题附近直接操作、桌面表格/手机逐项卡片。用户明确认同**视觉方向**，不等于整个真实业务已 Human 签收。
2. **V2 高保真原型**：`BEX-01-IMPORT-V2-HUMAN-REVIEW-PROTOTYPE-20261015.html`。真实 Chromium [run #38682435919](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919) 14/14 PASS。因 CI 中文字体方框与手机控件隐藏，曾根据**实际截图**修复并重测；截图见 [artifact #11948338743](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38682435919/artifacts/11948338743)。
3. **V3 交互原型**：`BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`。加入“继续未完成的导入”→完整来源核对→就地处理三项异常→字段创建审批→预检→明确提交。独立 Chromium [run #38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184) V3 **15/15 PASS**；[artifact #11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518) 附 HTML 和截图；同 run V2 14/14 PASS。**原型内容是 22 列/172 条的合成测试场景，并未真的解析或写入客户 Excel。**
4. **Eidos 已正式立规**：`docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`、`EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`、`EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`、`EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`（路径相对于 eidos `docs/product/`）。
5. **首项 Host 真功能落地**：#921 仅改导入目录及配套测试/审查/工作流；同步新 main 后通过 6 项工作流，定向协议 + 原导入契约 **19/19 PASS**，实际浏览器回归通过；最新准确运行：[专项 #38702419912](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38702419912)、[Host Chromium #38702419909](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38702419909)、[Platform #38702419976](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38702419976)。不等于 V3 完整界面已集成。

## 4. 继续实施时绝对保留的业务边界

- 读取原 Excel 并保留**全部真实来源列和原值**；同企业已合法确认 Recipe/映射优先复用，再用稳定规则/AI 给**建议**；不让 Agent 覆盖已经确认的 Human 决定。
- 本轮真实 Excel 曾遇到**两个都显示“开户银行”**的不同业务字段，真正归属需看 field ID、用途与实际历史来源；**不凭同名合并、自动删掉或重复新建**。
- **真实三行缺失 `subjectType`** 必须逐行核对身份；`SUPPLIER` 只是关系角色，不能推断成 `ORGANIZATION` 或 `PERSON`。
- 用户能反悔、撤销忽略、恢复草稿；已占用目标不能重复；待创建 Schema 必须单独确认；合法预检后仍要独立明确提交；已完成/部分提交绝不当作可安全再提交作业。
- **权限、Owner、Host Persisted Draft、企业隔离必须在正式业务实现中成立**；HTML 的浏览器 `localStorage` 只能用于离线体验，不能当成企业持久草稿。用户不应该被迫通过 Agent 聊天才能完成简单确定动作。

## 5. 下一窗口的任务顺序和验收账

| 顺序 | 要做的事 | 完成标准 |
|---|---|---|
| ① | 读取 `AI-BOOTSTRAP.md`、指定权威、Eidos 最新设计语言、本短入口与详细索引；刷新 main、#909/#860/#878/#846 | 不重复已完成研究，不推翻已定五项原则，不覆盖并行 PR |
| ② | 与 #860/#878 的 owner 协调/核实是否合并、比对其已实现的字段复用、扩展字段批量创建和 Host 能力 | 先复用并保留已验证契约，确认唯一实现分支及集成次序 |
| ③ | 将 V3 **高保真“就地异常处理 + 全列核对 + 字段创建方案”** 落入真正的 Eidos/Host 导入页，不复制静态 HTML/CSS | 真实数据模型、当前企业授权、恢复历史选择、回退纠错、唯一主操作；同页面少跳转但不省略授权 |
| ④ | 用隔离 Host + Chromium、专项协议/安全回归和真实用户 Excel/授权 Job 分层验收 | 验证 22 列原值、两个银行 field ID、3 条类型错误、Recipe/权限/幂等/不重复建字段；报告真实 Human 门槛 |
| ⑤ | 在所属实际实现 PR 完成最小闭环、对齐最新 main、CI 通过后合并；是否部署单独处理 | 不把 PR 数/HTML 演示或合并误报为 Railway 已发布；明确 DEV_COMPLETE vs 真实业务签收 |

**不能当作当前真相的旧段落：** 原交接入口 §8–§13 与认知文档 §7–§11 是先前研究**时间序列快照**；最新业务进度以本页、详细索引 §决策及 GitHub 当前事实为准。原用户附件在聊天里，临时 `/mnt/data` 路径不是稳定项目资料；GitHub Actions 截图 artifacts 有保留期限，链接和重要摘要见详细索引。

## 6. 稳定接续定位

- **短入口（此文件）**：`docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md`
- **详细索引**：`docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md`
- **本轮保存分支**：`docs/bex01-v2-human-design-review-20261015`（PR #909 Draft；仓库中的最终提交 SHA 在提交后核实）。
- **不修改**：main、其他并行 PR、Eidos 已合并的设计规范、PA 工作、实际企业数据、Railway。
