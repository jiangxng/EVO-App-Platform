# CV-04 / 2026-11-12 — 隔离真实 Host 企业切换、插件停用与 Personal Agent 同权 CSV 增量验收

> **ENGINEERING_SLICE / 非生产账号 / 初始测试设计**。本项紧接 [#1263 真实 Chromium 下载基线](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md)及[最新恢复交接](CV04-WINDOW-20261112-CONTEXT-RECOVERY-HANDOFF-ENTRY.md)，复用既有 `manager/server.ts`、Host ActionRouter、原 Dictionary/Counterparty Owner、Eidos 下载、内部 Personal Agent Capability Tools。**新 PR 测试结果不得从此设计文档推断**；CI/主线/证据须以后续真实 run 补充。

## 目标、分层与允许改变范围

- 用户已免除日常 List 工程逐步审批，PR/CI/真实验收仍严格执行。当前不是生产许可：`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、N1 NOT_CERTIFIED，正式 POST SAVE 403、未注册 GET 404、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) Owner 签核继续独立；[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 三份受管文件不修改。
- **G 已读现有源**：`tools/cv04/real-host-csv-browser-fixture.mjs`、`tests/cv04/real_host_csv_download_chromium.py`、`tests/integration/cv02-personal-agent-authorized-collection.test.mjs`、`tests/protocol/cv04-counterparty-my-page-csv-export.test.mjs`、`tests/protocol/cv04-dictionary-current-page-export-action.test.mjs`，`apps/counterparty/projection-actions.ts` 与 `apps/business-dictionary/actions.ts`、`agents/enterprise-agent/capability-fabric-tools.ts`、`manager/server.ts`。继续由原业务 Owner 保证数据授权，不另开 Endpoint/共享列表引擎。
- **D 本次增加**：同一测试 subject 在两个完全临时企业合法建立 Context，两个 owner 各自产生不同记录；Chromium 1280px、390px 正式 UI 与真实 HTTP/Blob 下载在 A、B、A 同一浏览器存储中切换。A 原下载 6 场景不变；B 额外 6 次新下载、两次上下文切换，确认 A 行在 B 的 HTML/CSV 不出现，反向 B 行不被 A 复活；新截图/机器报告留 Actions artifact。
- **D Personal Agent 集成**：从已存在 CV-02 真实 repository、ActionRouter、Manager、AuthorizationProvider、Owner 及内部 `search/describe/invoke.read-plan` fixture 新增专门的 CSV 操作测试：Dictionary 与 My Suppliers 对应同一 Human Owner 授权页字节、B 企业不能发现 Dictionary A Operation、失去授权后不再发现/调用、disable Feature 后不能复活、字段超范围/以 WRITE 调用均失败关闭。
- **D 真实安装 Host 插件停用**：12 次下载及上下文检查之后，向隔离 Host 发真实 `POST /v1/disable` 停用 Dictionary，使用此前合法 UI Command 构造**陈旧 Action POST**，确认 `ACTION_FEATURE_NOT_ACTIVE`、没有 Blob。此场景**不是**静态 Unit mock 的 Feature 标志翻转。
- **运行边界**：Chromium 使用 test Local Experience 静态 HUMAN 身份，没有 Tokio 真实账号/生产 OAuth、没有第二名员工或真实物理手机；内部 Personal Agent tool registration 是实际工具链，没有外部 LLM 自然语言思考。测试的 `setAuthorizationOnline(false)` 是**隔离测试 provider 拒绝/不可用注入**，不是 PA05 正式 PostgreSQL grant/revoke event，绝不标为“已验证真实账号撤权”。

## 预期机器门禁（须读实际 CI 日志）

1. 新 `tests/integration/cv04-personal-agent-authorized-csv.test.mjs` 至少三项真实 Owner/Agent/权限拒绝测试 PASS；终端应出现 `CV04_AGENT_HUMAN_OWNER_CSV_PARITY_PASS`、`CV04_AGENT_ENTERPRISE_REVOKE_FEATURE_FAILCLOSED_PASS`、`CV04_AGENT_EXPORT_BOUND_FIELDS_AND_EFFECT_PASS`。
2. [原 CV04 浏览器 Workflow](../../../.github/workflows/cv04-real-host-browser-csv.yml) 在 PR 的**精确 HEAD** 对 `npm ci` / build / Agent tests / 启动真实 Host / 1280px+390px 下载执行无 SKIP；旧 `CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6` 保留，新增 `CV04_REAL_HOST_CHROMIUM_ENTERPRISE_SWITCH_TERMINAL_PASS=6`、`CV04_REAL_HOST_CHROMIUM_DISABLED_FEATURE_DENY_TERMINAL_PASS=1` 和 JSON 全部范围检查。
3. 原项目 Protocol/Core、Continuity、Lightweight Host 等 HEAD checks 通过之后合入 main，再核主线浏览器、东京 deployment preflight（仅测试/文档变更应 SKIP deploy）和 SHA-safe Branch Hygiene。**初始文件不等于测试已通过**。
4. 如果主线运行时或原 Owner 实际拒绝与预期不同，保留失败 run、先辨别测试 fixture 的合同错误还是安全 bug；严禁删掉失败场景拿 CI 绿色冒充权限已测。

## 仍未完成 / 下一段工程

- **P 真实员工/权限撤销**：需要实际登录会话、Enterprise A/B 的真成员/角色授权与真实撤权事件（不是同 subject 两个自建测试上下文）；撤权前后的同一 Human session、Host/action、Agent 权限与下载结果对照，保留脱敏证据，绝不查询生产私密数据。
- **P Human 体验**：物理手机 Safari/Android、键盘、读屏、正式东京账号、真实外部 LLM Agent 聊天任务/失败恢复。1280/390px 自动 Chromium 是工程自动验收，不能标 HUMAN_PASS。
- **P 安全跨页导出**：先有 Domain Owner 独立 `EXPORT` 权限、行列敏感等级、稳定 Snapshot/query Budget、审计、异步任务 TTL/重试/下载重新鉴权，再由 Human/Agent 共用合法的 Host Operation；READ 当前页 CSV 绝不自动升级为全量/大数据。
- **P 其它 List 能力**：继续原 ImportTarget/Recipe 的列表入口、CV-05 语言旅程、CV-06 Kanban/Chart、CV-07 第三插件和综合交付认证。

## 来源与证据等级

- 本次新增第三方网页研究 **无**；不改变 [2026-11-06 原 EX01–EX08/内部 H01–H10](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[2026-11-12 研究恢复索引](CV04-WINDOW-20261112-RESEARCH-DECISION-REFERENCE-INDEX.md) 的访问等级。
- G=本次读取原 GitHub 源；D=本测试用例设计；P=尚未取得 CI/真实登录/生产安全签核；历史 #1263 6/6 的 G 仅证明原始基线。


## 2026-11-12 / 首版失败与修复（G；实际读取原始 job log）

- [首次 CI #43159005352](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159005352) / job `130985513274` **FAILURE**：`tests/integration/cv04-personal-agent-authorized-csv.test.mjs` 的首项断言错误读取 `describe.operation.binding.type`。公开 Agent `describe` 只给当前授权的公开元数据，内部 `ActionHost binding` 不应暴露；这是新增测试的错误假设，**不是实际 CSV Owner 导出失败/不是越权**。修复为验证 `operationId` 和 effect；第二、三项权限负例当时已 PASS。首次失败记录保留。
- [修复后精确 PR HEAD `ef3eccd047c977f094f29fa1911976907b48e33f`](https://github.com/jiangxng/EVO-App-Platform/commit/ef3eccd047c977f094f29fa1911976907b48e33f)，[真实 Host/Chromium Actions #43159104298](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159104298)、job `130985826587` **SUCCESS**。本轮已**直接读取该 job 原始日志**而非从源码推断：Agent/Human 同权限、字典+我的供应商 CSV 内容一致并且 `tests 3 / pass 3 / fail 0`；终端标记：
  - `CV04_AGENT_HUMAN_OWNER_CSV_PARITY_PASS=dictionary.collection.page.export.csv`
  - `CV04_AGENT_HUMAN_OWNER_CSV_PARITY_PASS=counterparty.collection.my-suppliers.page.export.csv`
  - `CV04_AGENT_ENTERPRISE_REVOKE_FEATURE_FAILCLOSED_PASS`
  - `CV04_AGENT_EXPORT_BOUND_FIELDS_AND_EFFECT_PASS`
  - 原有六个 `CV04_PHYSICAL_CHROMIUM_DOWNLOAD_PASS:{dictionary,my-customers,my-suppliers}:{1280,390}`
  - 新增六个 `CV04_PHYSICAL_CHROMIUM_ENTERPRISE_SWITCH_PASS:{dictionary,my-customers,my-suppliers}:{1280,390}`
  - `CV04_REAL_HOST_DISABLED_FEATURE_STALE_EXPORT_DENIED_PASS`
  - **`CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6`**
  - **`CV04_REAL_HOST_CHROMIUM_ENTERPRISE_SWITCH_TERMINAL_PASS=6`**
  - **`CV04_REAL_HOST_CHROMIUM_DISABLED_FEATURE_DENY_TERMINAL_PASS=1`**
  - `CV04_REAL_HOST_BROWSER_ARTIFACT_CONTRACT_PASS`
- 实际 [Actions Artifact `13916613561`](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159104298)（名称 `cv04-real-host-eidos-csv-chromium-evidence`，812207 bytes，`sha256:254dabb61e8730bf66d9040b107819f44ad28d6db6ef71d9fdb782c600b6fdb1`），含隔离 Host bootstrap、12 张真实 Chromium 截图、JSON、fixture。当前 GitHub 显示保存至 2027-02-10；到期可能无法再下载，索引不等于永久保存截图。
- **精确证据界限**：同一测试 subject 自建两企业、浏览器真实 context 切换/Blob 文件、实际 installed Host disable 已证实；`setAuthorizationOnline(false)` 是隔离 Agent/Owner 的 authorization provider fail-closed 试验，**不代表实在 PG 授权事件或两个真实账号的成员撤权**。物理手机/东京员工账号/外部 LLM Agent Run/完整 List 与独立 EXPORT Job 仍 P。此 PR 没有业务运行时代码变化、未开启 SAVE、未改 #1184。
- 以上是首个通过的**工程 HEAD** 日志，后续若增补 docs/CI 行变更须在最终 HEAD 再跑 workflow 并核实，不提前称当前整个 PR/main 全绿。


## 2026-11-12 / 受保护 main 最终回归、真实 artifact 与分支清理（G）

> 本节以实际 GitHub PR、原始 Job Log、Actions Artifact 元数据和主线 Check Runs 为证据，**更新上文「初始测试设计 / PR CI 待完成」的历史状态**；不把自动真实 Chromium 解释成真实东京账号的人工验收。

- [工程 PR #1266](https://github.com/jiangxng/EVO-App-Platform/pull/1266) Draft→Ready 后按 **expected head SHA** `f3ecf25e8fe05d559ca08d6cc9985378767aef3a` 合入 protected `main`，merge **`ff569b2d7c930fa90e61ec28a07421057a4601aa`**。最终 PR HEAD **6/6 CI SUCCESS**，含 `real-host-desktop-phone-csv`、`protocol-and-core`、`lightweight-host`、`human-ui-design-review`、`continuity`；首次失败及正确修复见上节，不从 2/3 的早期测试称 3/3。
- [最终工程 HEAD 浏览器 #43159376481](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159376481) SUCCESS。由于本工程仅新增测试、独立 CI 和文档，**业务运行时未修改**；新浏览器测试确实独立运行而非 SKIP。
- [合并后 protected-main 浏览器 #43159697144](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159697144) job `130987690574` **SUCCESS**；已直接读取原始 job log，确认 3 项 Agent 集成 PASS，十二个真实 Eidos/Host/Chromium CSV 下载标记（A 原有 6 + B 新增 6）、Enterprise A→B→A 的 UI/CSV 隔离和恢复、真实 installed Host disable 后旧 Dictionary Action 无 Blob/拒绝，完整终端标记：
  - `CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6`
  - `CV04_REAL_HOST_CHROMIUM_ENTERPRISE_SWITCH_TERMINAL_PASS=6`
  - `CV04_REAL_HOST_CHROMIUM_DISABLED_FEATURE_DENY_TERMINAL_PASS=1`
  - `CV04_REAL_HOST_BROWSER_ARTIFACT_CONTRACT_PASS`
- [主线 Chromium Artifact `13916604056`](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159697144)，名称 `cv04-real-host-eidos-csv-chromium-evidence`，**845055 bytes**，SHA-256 `6aee244a718942e1d4eb67379cc9723c9d4ee8dfc11d4ebd8621946453580ed5`；含浏览器 12 张截屏、机器结果、测试 Host bootstrap。GitHub 当前元数据显示过期时间 **2027-02-10**，不是永久附件。
- 保护主线同一 merge SHA `ff569b2d...` 的 **Continuity、Protocol/Core、Lightweight Host、真实 Chromium CSV 均 SUCCESS**；东京 [EVO Tokyo Dev #43159726320](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159726320) `preflight` job `130987784449` **SUCCESS**、`deploy` **SKIPPED**，已读原始 preflight `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=ff569b2d7c930fa90e61ec28a07421057a4601aa`。**不可将新 test main SHA 写成已发布东京镜像 SHA**；此前实际部署业务运行时的记录仍见 [Counterparty CSV 部署](CV04-COUNTERPARTY-MY-PROJECTION-PAGE-CSV-20261112.md)。
- [Branch Hygiene #43159698037](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43159698037) job `130987693023` SUCCESS；本次已读**原始日志** `DELETED_VERIFIED_MERGED_PR_BRANCH test/cv04-real-owner-enterprise-agent-revoke-20261112 @ f3ecf25e8fe05d559ca08d6cc9985378767aef3a`，GitHub matching-ref 列表空。
- **可以精确表述的新状态**：`CV04_ISOLATED_REAL_HOST_EIDOS_CHROMIUM_TWO_ENTERPRISE_CSV_AND_AGENT_TOOL_AUTOMATION_PASS`。同一个静态本地测试 subject 自建两个企业，不等于真实东京登录员工，隔离权限 provider 的拒绝注入不等于真实 PA05 PostgreSQL grant/revoke，内部 Agent 注册工具不等于外部 LLM 自然语言运行；物理手机、Human 签收、独立 EXPORT 权限及后台跨页任务仍 P。
- **生产边界不变**：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403 / 未注册 GET 404、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 真实 Owner 签核独立未解决；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 三份受管文件未被修改。**正常 List 开发无需逐项审批**仅限常规工程流程。
