# CV 旧窗口恢复与专项交接入口（2026-11-09）

> **状态：HISTORICAL_CONTEXT_RECOVERED / REPOSITORY_RECONCILED / NO_FEATURE_IMPLEMENTATION。** 本文是旧长聊天无法直接续接时的**证据索引与窗口交接**，不是 CV-02 Human 签收、CV-03 开发完成或生产发布证明。**唯一实施状态表**仍是 [CV-00～CV-07 八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)；本文件不另建一条状态线。
>
> **仓库**：https://github.com/jiangxng/EVO-App-Platform 。**本窗口职责**：专项——恢复上下文、整理研究和核对证据，不接管 BEX、PA05、Eidos UI 或 CV-03 代码主线。
>
> **复核快照**：2026-11-09 Platform `main@d5eb20f1b7ef4a682855e857cc33681b56e40d82`；这正是 #1175 merge SHA。**来源限制**：在本窗口可读取的附件中未取得 2026-11-06～09 旧长聊天原始完整导出；依据本次用户交接原文、可恢复的先前对话结论、仓库一手文档/PR/源码重建。无法回查的逐字讨论、先前搜索快照和截图标为**未恢复**，不编造。
>
> **证据伴随文件**：[研究来源与实现证据对照](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)。原始 2026-11-06 [参考资料索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 与 [架构决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) 保持权威和历史阅读日期。

## 1. 证据层级（每项严格分开）

- **CHAT_REQUIREMENT / AGREED_DIRECTION**：用户在对话明确提出或接受的方向；尚不等于产品已实现。
- **DESIGN_RECORDED**：已进入 GitHub 文档的技术方案/ADR/候选接口；尚不等于 SDK 契约或业务功能。
- **CODE_MERGED**：GitHub PR 确认为 merged，相关源码已进入指定 `main`；尚不等于部署或人体验收。
- **CI_RECORDED / SOURCE_REVIEWED**：仓库状态表、PR 或可查 Actions 有自动检查记录；注明是历史记录还是本次核查。不能把有测试代码直接等同于实测环境通过。
- **DETERMINISTIC_HOST_TEST**：使用固定 Principal/内存企业资源、真实 owner 和 Host/Personal Agent 工具的自动回归，不等于真实用户登录、LLM 自然语言调用或生产数据验收。
- **REAL_BROWSER / HUMAN / PRODUCTION**：须有独立账号、实际浏览器、390px、真实 Agent Run/receipt 与用户签收；**本轮未取得**，不得自动升级。

## 2. 已恢复的用户明确要求与已确认决定

| 要求/决定 | 来源与恢复状态 | 工程约束 |
| --- | --- | --- |
| 客户、供应商、业务字典以及后续业务应用大量属于**列表/集合型体验**，应抽象共同交互而非反复私绘 | 2026-11-06 用户原始需求与 [架构设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)；**CHAT_REQUIREMENT + DESIGN_RECORDED** | 提取 Collection 查询、Schema、View、Renderer、Operation 的共用职责，但不造万能业务表 |
| **仅在现有 Eidos 与 EVO App Platform 上实现**，不是新列表框架或第二插件体系 | 用户已明确确认；[架构设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md) §1、§4；**AGREED_DIRECTION** | Eidos 拥有统一 UI/导航/设计 Tokens；Platform 拥有 Feature/授权/ActionHost；领域插件拥有事实、合法查询与写入 |
| **Personal Agent 必须可操作；AI 原生**不是单纯 AI 按钮 | 用户确认与八步计划；**AGREED_DIRECTION** | Human/Agent 同一个 owner READ/权限，Agent 通过受管 search/describe/invoke；持久 WRITE 经 Host 授权、回执与适用的 Human 确认 |
| 不重复开发已有导入、字典发布、往来投影/权限、UI 核心和 Agent 网关 | 用户要求与 CV-00 对账、#1163/#1165；**DESIGN_RECORDED + 部分 CODE_MERGED** | 旧 API/数据与 BEX V3 流程兼容，按需装载、停用后动态拒绝 |
| 使用已有 Eidos/V3 功能、布局、颜色与统一页面质量标准；覆盖桌面、390px 手机、导航返回、焦点和错误恢复 | 旧计划和 [Human 体验门禁](../../governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md)；**AGREED_DIRECTION** | CI 绿不替代真实登录和 Human 签收 |
| 保存计划、设计思路、真实参考资料和分步验收结果到项目并经 PR 进入 `main` | 用户原话及 [2026-11-06 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)；**部分已 CODE_MERGED** | 八步 CV-00～07 是唯一近期进度来源；本恢复材料仅作为同体系补充 |
| 多窗口并行需独立分支、准确 HEAD、PR/CI、合并后清理过程分支，不直接 push `main` | 仓库工作约束；**用户明确治理要求** | 本窗口只提恢复文档 PR，不抢 CV-03 Provider/业务代码 ownership |

## 3. 本次实际核验的版本化交付（不是聊天完成宣称）

| 阶段/PR | 合并 SHA / 类型 | 已证明 | 不得宣称 |
| --- | --- | --- | --- |
| [#1163](https://github.com/jiangxng/EVO-App-Platform/pull/1163) | `8ff2932013e25f63382a25606dfacc254a03c3dc` · CODE_MERGED | Dictionary 受管 `dictionary.collection.query`、有限 Schema/分页白名单与旧 `dictionary.list` 并存 | 真实自然语言 Agent 或 Human 通过 |
| [#1165](https://github.com/jiangxng/EVO-App-Platform/pull/1165) | `d3076e9dc037bc85f2508aa515d2296cddaa520f` · CODE_MERGED | Counterparty 受权投影适配，第二 owner 的集合查询，旧投影不变 | CV-01 所有用户场景已签收 |
| [Eidos #209](https://github.com/jiangxng/eidos/pull/209) / [Platform #1167](https://github.com/jiangxng/EVO-App-Platform/pull/1167) | Eidos `127150c30193b57b38d1d9cc62443ddfa90e2349`；Platform `ef9275cad7f02af786b424801a282733bbe8e746` · CODE_MERGED | 既有 Catalog Browser `table.views` 与 Platform 指定采用 | 自带安全业务查询、Saved Views、真实手机通过 |
| [#1169](https://github.com/jiangxng/EVO-App-Platform/pull/1169) | `79d2fe3f1789b20ced440dff031815694961c654` · CODE_MERGED | Counterparty 客户/供应商/我的投影，以及 Dictionary all/draft/published 真实 Owner 视图；Host query 白名单 | 已实现视图持久保存或字典发布 Agent WRITE |
| [#1170](https://github.com/jiangxng/EVO-App-Platform/pull/1170) | `33d32d5dbb240974edb2e4eb3ccf2bc73f99d3dc` · CODE_MERGED | 从筛选/排序/分页列表进入详情后，经受限 `returnTo` 返回原查询，Host 校验非法路由 | 实际浏览器 focus、390px 操作或完整用户体验通过 |
| [#1172](https://github.com/jiangxng/EVO-App-Platform/pull/1172) | `03a9f68751e7e25c2a9f62d46b00adadbee8ab77` · CODE_MERGED / DETERMINISTIC_HOST_TEST | Dictionary + Counterparty 两真实业务 owner，Agent `search/describe/invoke.read-plan` 与 Human ActionRouter 结果对照；隔离内存环境、固定身份 | 登录真实账号、连接外部 LLM、浏览器、生产环境 |
| [#1173](https://github.com/jiangxng/EVO-App-Platform/pull/1173) | `870bd80bbe3279e5ebe60ee356f598870ede708b` · CODE_MERGED / DETERMINISTIC_HOST_TEST | 真实字典 Repository + Host + 内部 Personal Agent 查询一致性，字段不泄漏，换企业、撤权、停用插件失败关闭；`tests/protocol/cv02-real-owner-agent-human-collection.test.mjs` 纳入 `npm run test:platform` 必跑 glob | 模型自行选择正确工具、手机操作或 Human 签收 |
| [#1175](https://github.com/jiangxng/EVO-App-Platform/pull/1175) | `d5eb20f1b7ef4a682855e857cc33681b56e40d82` · DESIGN_RECORDED / CODE_MERGED（仅文档） | 现有 Enterprise Resource 缺跨实例 CAS 证明、Saved View 存储/Agent WRITE 的实施门禁进入 main | C3-01 条件写入已完成、个人/共享视图已能保存 |

**交叉核对**：实际读取了 `contracts/enterprise-resource.ts`、`providers/enterprise-context/resources.ts`、`tests/protocol/cv02-real-owner-agent-human-collection.test.mjs` 与 `package.json`。协议测试通过真实模块调用；Platform 的 `test:platform` 确有 `tests/protocol/**/*.test.mjs`。PR 文档写过“5/5”等历史 CI 数量，本窗口未重新执行完整测试，不用这些数量推断部署或 Human PASS。

## 4. 唯一八步工作计划：当前准确进度

| 里程碑 | 当前级别（截止本快照） | 未结门禁 |
| --- | --- | --- |
| CV-00 重复开发/契约盘点 | **IN_REVIEW**；已有源码对账、架构文档及 PR | Eidos owner/ADR 正式签收与跨仓库边界确认 |
| CV-01 两个 Owner 有权 Collection READ | **CODE_MERGED / CI 证据已记录** | 真实用户/LLM 任务、必要的 Human 签收 |
| CV-02 Eidos 视图/列表/详情返回 | **IN_PROGRESS / 代码与确定性 Agent/Host 回归已合并** | 真实登录、自然语言查询、desktop + 390px、键盘焦点/返回恢复、Human 签收 |
| CV-03 系统/个人/企业 Saved View | **PLANNED / STORAGE_ATOMICITY_GATE_OPEN** | C3-01~04 均未取得正式代码/验收闭环；#1175 仅决策 |
| CV-04 导入/导出安全复用 | **PLANNED** | ImportTarget/Recipe、服务端授权导出及其端到端验收 |
| CV-05 Agent 自然语言任务/恢复 | **PLANNED** | 真实 LLM Run、受管 Query/WRITE/Receipt/重放 |
| CV-06 受控看板与合法聚合图表 | **PLANNED** | 单个 Kanban/Chart 与 owner 服务器统计语义 |
| CV-07 第三业务插件与交付认证 | **PLANNED** | Item/Warehouse 验证、性能、安全、Human、插件接入模板 |

**不得混淆**：多个系统视图导航已实现 ≠ 用户/企业视图已经持久化；确定性 Personal Agent 工具调用通过 ≠ 模型自然语言对话通过；Repository 提供 `transaction` ≠ 跨 Worker 可比较原子提交。

## 5. 关键研究与方案取舍（不重复开题）

已找回 2026-11-06 的 **EX01–EX08 官方网址、阅读范围、采用/拒绝的理由**、历史 H01–H10 内部设计和源代码地图；直接使用 [恢复参考与证据索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) 和原 [研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。

落地方案：**业务受管 Collection READ + View Definition（仅配置）+ Eidos Renderer + Platform Capability Operation/授权 + Personal Agent 共用 Operation**。放弃单一通用业务事实库、巨型 BaseList 继承树、复制 Odoo/SharePoint 内部协议、脚本任意注入、全能 Grid 首轮打包、Agent 自由 SQL / 独立 WRITE API。原因是 owner 主权、插件轻量边界、安全与实施量；候选 SDK 类型只按 owner PR 版本推进。

## 6. 下一窗口连续实施任务与独立门禁

1. **先收 CV-02 Human 缺口**（Eidos UI/Agent owner，勿由恢复窗口虚报）：至少两企业与有/无权角色，在真实 Host 登录执行 Counterparty / Dictionary 的搜索-分页-详情-返回-换企业/撤权/停用；桌面与 390px、Tab/焦点/中文组词检查。记录浏览器/Run/版本/截图与 Human 结论。Agent 以中文任务寻找当前有权集合，和 Human 行/字段/计数比对。
2. **C3-01（第一工程门禁）**：由现有 Enterprise Resource/Provider owner 定义并实现真正后端条件提交（新增/按 revision 更新/归档的等价操作）；验证**两个独立实例面对同一正式共享存储**对同版本写入只有一个成功、冲突明示、重启 readback；单实例 transaction/本地文件 `rename` 不能算多实例 CAS；不支持的 provider 必须 fail-closed。先评审正式 store 现状和 owner，再动 API；不能用 `get→put` 冒充。
3. **C3-02（Personal）**：在 C3-01 通过的 Provider 上实现受管个人 Saved View READ/WRITE（当前 Principal + Enterprise Context、schema/filter 字段检查、Host receipt/idempotency）和 Eidos 使用；Person/Enterprise 不接受来自模型或 URL 的伪造 scope。真实 Human 与 Agent `invoke.write` 分别通过。
4. **C3-03（Enterprise）**：另设共享视图管理权限、并发冲突、撤权与 schema 失效修复，不允许共享视图扩大源数据的行/列权限。
5. **C3-04（人机交付）**：真实自然语言“保存我的香港供应商视图”→ 受权 PLAN/READ/WRITE → receipt/readback → 页面切换/重启恢复；未知写入结果禁止盲目重试，desktop+390px Human 独立签收。
6. 然后按唯一八步表推进 CV-04~07，优先复用 BEX V3 导入与现有 Plugin Protocol，不重设框架。

**持续集成/窗口规则**：准确 main HEAD → owner 单一短分支 → 最小可验证 PR → 必要 CI 全绿 → 合并 main / 过程分支安全清理 → 更新唯一八步表。恢复专项文件绝不关闭功能或 Human 门禁。

## 7. 目前确实无法恢复、需要后续来源的项目

- **旧长聊天完整原文与其中未入库的网页检索快照/截图**：当前对话没有提供可直接读取的导出文件，Library 中未找到这段原始记录。仅能恢复现在给出的交接文字、部分历史会话结论及仓库已经归档的索引；无法保证逐句、逐条网址无遗漏。
- **外部官方资料 2026-11-09 的网页当前版本**：原研究明确记录 2026-11-06 访问/阅读级别；本恢复窗口复用而未重新逐页浏览，不能以本记录声称第三方全部功能最新无变化。
- **真实浏览器 390px/焦点、登录用户、外部 LLM Run 和 Human 签收、正式多 Worker 存储 CAS 测试**：现有源码及自动回归不提供对应证据，状态 OPEN/NOT_TESTED。
- **恢复窗口以外的并行 owner 变更**：下一开发窗口必须重新读 main/Eidos/Provider owner HEAD，按真实版本纠正本快照；历史 SHA 是审计锚点，不是永远最新。

**最小接续阅读顺序**：本入口 → [当前八步状态](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) → [研究/取舍证据](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) → [CV-03 代码门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md) → 相应 owner 实际代码/PR。不要重做已完成的全行业调研。
