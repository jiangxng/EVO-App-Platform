# BEX-01 / CP-03 界面研究与治理 — 简短交接入口（2026-10-15）

> **先读本页，详细资料转到 [研究决策参考索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。** 这是新的窗口接续入口，而不是替代旧 `BEX-01-WINDOW-HANDOFF-ENTRY-20261015.md` 所保存的历史工程交接。主线当前状态仍需在接续时重新核对 GitHub main、PR、CI 与 Railway 固定版本。

> **治理核验补充（2026-10-15）：** Eidos [PR #183](https://github.com/jiangxng/eidos/pull/183) 已经在该仓库 main 合并为 `5d832200f10a423179928dc1cd467217c9167e79`，EVO Platform [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904) 已经合并为 `1970c06238ff1e45930219f499e028609305c2e5`。这两个治理 PR 的 CI 已通过，**代码 PR 中的检查记录门禁已经进入主线**；机械门禁仅核查有记录/栏目/改动文件链接，无法代替实际体验质量或 Human 验收。本 #899 仅归档研究与原型，未实施 BEX V2。

## 1. 本轮目标和已接住的用户要求

从 Excel 数据导入现场的“22 列重复下拉和创建按钮”出发，用户先要求**极少可见步骤、更多系统自动工作**，继而要求系统尊重视觉层级与颜色、不同年龄对注意力/记忆的差异，并提出 **LLM 以后凡做 Human UI 都必须经过完整界面设计检查**，不能因换窗口丢失前序研究。用户认可保留研究并做新一版设计，**未明确签收 V2 真实业务程序或同意改生产**。

**始终保留：** 先恢复历史/同企业合法映射→剩余列规则/AI 建议→真实业务字段集中审核与一次批量创建→dry-run→用户明确提交；原 Excel 每一列数据保留；单列只能映射一个目标，目标不能重复占用；用户可撤销忽略、恢复草稿、修复错误；对真实 3 行缺失 `subjectType` 不以供应商关系代填；历史两个同名“开户银行”不未经核实合并/删除；PA-02 原 Agent 自动匹配入口与上下文不破坏。

## 2. 核实到的权威位置

**导航和颜色研究权威在 Eidos，不是在 Platform 另起规则：**
- `jiangxng/eidos/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`：第一阅读入口；
- `EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md`：导航放置；
- `EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`：层级、密度、动作；
- `EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`：中性底/白内容/克制品牌蓝/状态色；
- `EIDOS-VISUAL-COGNITIVE-RESEARCH-REFERENCE-INDEX-v1.0.md` 和 `EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`：本轮补充的研究及必检规则，归入 [Eidos PR #183](https://github.com/jiangxng/eidos/pull/183)。
- Platform `docs/architecture/EIDOS-NAVIGATION-INFORMATION-ARCHITECTURE-ADOPTION-v0.1.md` 沿用 Eidos；本轮 Platform 新的设计必检约束由 [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904) 负责（AGENTS/.clinerules/CI），不覆盖其他窗口业务文件。

## 3. 当前 V2 设计（提案，不代表已上线）

- **用户感知两个阶段**：上传 → 核对并导入；预检查与最终业务提交可同页状态切换，但 Schema 创建确认/最终供应商导入仍必须分别明确。
- 系统承担记忆：历史映射/字段名称/来源样本和依据同屏可见，保存当前决定、允许离开后继续，不让 Human 跨多个页回忆上次选过什么。
- 视觉呈现：文件和结果优先；一屏只展示真正需要决定的例外；已处理/保留来源/建议新增摘要安静呈现；完整 22 来源列可一键展开为紧凑审阅表格，不能默认丢失/隐式新建。
- 对所有年龄统一可读、可缩放、可键盘操作的默认界面，不以年龄贴标签；优先沿用 Eidos 的现行颜色、spacing 与图标 tokens，不复制外部产品视觉风格。
- 原 HTML 静态交互稿（只是演示，不链接实际 Job）：[BEX-01-IMPORT-V2-COGNITIVE-PROTOTYPE-20261015.html](BEX-01-IMPORT-V2-COGNITIVE-PROTOTYPE-20261015.html)。

## 4. 必读文件（按此顺序，避免重做研究）

1. 本交接入口（短）。
2. [详细参考索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)（外部原始 URL、阅读状态、冲突、证据）。
3. [已有流程研究](BEX-01-IMPORT-UX-SIMPLIFICATION-RESEARCH-20261015.md)、[视觉研究](BEX-01-VISUAL-PERCEPTION-RESEARCH-DESIGN-20261015.md)、[注意力记忆研究](BEX-01-COGNITIVE-LOAD-ATTENTION-MEMORY-V2-20261015.md)（无需再次联网搜索全部旧资料）。
4. Eidos 的既有 Human Design/导航/配色规范与 PR #183 必检规范；Platform PR #904 采用规则。
5. 如开始业务代码实现，再读 `BEX-01-INLINE-EXTENSION-DISCOVERY-20261014.md`、前工程 handoff 及原 PR #894/#884 的真实验证证据。

## 5. 当前固定验收进度表

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 原导航/颜色权威定位 | ✅ GitHub 文档确认在 Eidos | 规范合并后复核引用 |
| 原流程研究复用 | ✅ 已保留 | 不重做 |
| 视觉感知与设计资料 | ✅ 已保存 16 项来源索引 | 按 Eidos 权威吸收 |
| 记忆注意力与跨年龄资料 | ✅ 已保存 8 项来源索引 | 继续核查重要原文全文 |
| 三层研究整合、V2 原型 | ✅ 源文件已提交本研究分支 | Human 设计审阅 |
| Eidos 通用 UI 必检权威 | ✅ PR #183 已合并；CI PASS | 新工作按规范执行 |
| Platform LLM 入口与 CI 审查门禁 | ✅ PR #904 已合并；CI PASS | 后续 UI PR 提供可检查的审查记录 |
| 原 Excel 现场问题及截图原件 | ⏳ 尚未完成真实数据读取与图片 GitHub 二进制保全 | 取原 Job/授权素材并验收 |
| BEX V2 业务代码及 Railway | ❌ 本轮没有实施/部署 | 用户签收设计后独立实施 PR |
| **本专项整体** | **设计研究及治理变更已提交；用户真实验收未完成** | **CI/合并状态核查→设计签收→实现→业务验收** |

## 6. 分支、PR 和接续起点

- 业务研究资料：EVO-App-Platform [PR #899](https://github.com/jiangxng/EVO-App-Platform/pull/899)，分支 `docs/bex01-import-ux-simplification-research-20261015`（原 Draft 设计线）。
- 统一 Eidos 规范：eidos [PR #183](https://github.com/jiangxng/eidos/pull/183)，分支 `docs/human-ui-visual-cognitive-review-gate-20261015`。
- Platform LLM/CI 采用：EVO-App-Platform [PR #904](https://github.com/jiangxng/EVO-App-Platform/pull/904)，分支 `governance/human-ui-design-review-gate-20261015`。
- 该页提交 SHA 以随后回复的**交接快照**为准，不能在同一 Markdown 中预写其尚未完成的最终提交。
- 原 Import Job `import-33ff3446-80c5-4992-b5c6-710f415535b3`；原 Excel `往来账户2026_10_08_10_15_23.xlsx` 未作为二进制源存入本研究线。
- 用户提供的原截图保留在**原聊天附件**；曾挂载 `/mnt/data/image(20261015-015021).png` 与 `/mnt/data/image(20261015-023214).png`，均属本次容器临时路径，不能作为下一窗口稳定 GitHub 链接。

## 7. 下一窗口最小任务

先核对上述 3 条 PR 的状态/最新 main，确认所有跨 repo LLM 界面门禁合并与可用，再用 V2 静态原型和同一份验收表进行用户设计评审。没有新的否决依据不要推翻历史 B 方案；真正实施时**先写本次 UI 审查证据**，只在 BEX 独立 PR 修改对应业务文件，不顺手接管 Eidos/PA-04，使用原 Excel 真实 Host+Chromium 验收，符合 CI 才精确发布到现有 Railway 开发环境。严禁把研究原型当已交付程序。
