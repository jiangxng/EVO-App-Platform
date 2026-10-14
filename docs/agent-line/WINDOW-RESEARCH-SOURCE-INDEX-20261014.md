# PA-02 本窗口原始资料、研究证据与附件索引（2026-10-14）

**Document class:** HISTORICAL_SNAPSHOT / SOURCE_LEDGER  
**时间口径:** 2026-10-14（GitHub CI 记录为 UTC；本交接以中国香港/北京时间 UTC+8 记日期）。  
**对应:** [简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261014.md) · [方案比较及未决](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md)  
**本窗口原文基线:** `EVO-App-Platform/main@e4ce338e483af9b6ad17ea811ad6b052cbffafeb`（在新文档 PR 合并前采样）。GitHub 旧 PR、workflow、source commit 链接保留，不把已经删除的 `agent/*` 分支 URL 作为永久证据。

## 1. 访问状态——不得跨级

- **G-FULL（已读仓库原文／全文）：** 本窗口用已连接 GitHub 原始文件内容读取过完整源码或短文档。此处的“原文”是 **GitHub 仓库原文，不是公共互联网上的外部文章**。
- **G-PART（已读原文片段）：** 明确读过函数/段落或查看了文件开头与关键片段，没有通读整体。给出关键锚点供新窗口重取。
- **G-LOG（已读 CI 原始日志和实际断言）：** 在 GitHub Actions Job 中读取过日志，看到实际测试命令/测试条目/通过结果；日志可能到期。
- **M（已取 GitHub PR、SHA、checks 元数据）：** 已确认 PR merged、head、commit/check 等，不等于逐行审查每份 PR。
- **H（历史索引转引／本窗口待核原文）：** 旧窗口曾收录的外部 URL，本窗口**没有打开对应外部网页**；其下“关键发现”只是**之前笔记的摘要**，不能提升为当前来源事实，也不能断言原网页仍有该章节。
- **S（仅搜索结果摘要）：** 本窗口**0 条**。本窗口未调用公共 Web 搜索，不能把 H 写成 S。
- **U（未验证）：** 多进程原子/生产环境/业务插件正式上线等尚未现场证明。项目内部代码的 CI 绿不升级为生产验收。

**重要来源校验：** 此次 GitHub connector 直接返回文件正文、PR、Actions 检查和 Job 日志；2026-10-13 的旧索引 `WINDOW-RESEARCH-SOURCE-INDEX-20261013.md` **本窗口已读取其正文**，但其中列的 14 个外站没有在本窗口重读。2026-10-11 原始长表本窗口仅通过旧索引链接发现，未逐项全文打开。

## 2. 实际访问的仓库一手来源（固定提交 URL）

下表所有“查阅日期”均是**本窗口 2026-10-14**，除非行内另注。链接指向当时准确源码提交，阅读类别区别全文/片段/元数据。

| ID／等级 | 资料标题与原始网址 | 直接阅读到的关键事实/章节位置 | 本项目具体用途 |
| --- | --- | --- | --- |
| G01 G-FULL | [项目开发交付工作流](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)、[Agent 补充规范](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md) | `核心原则/每个闭环的验收账`：一个独立闭环、一短分支/PR、多提交、复用已验证契约、及时合并/清理、生产门禁分离 | 约束所有 PA-02 后续 PR；新窗口不再恢复历史三分支 |
| G02 G-PART | [AI-BOOTSTRAP](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/AI-BOOTSTRAP.md)、[LLM.md](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/LLM.md) | `Mandatory startup order`、`Project development delivery rule`；LLM 开头的 Architecture/State/Context/Extension 宪法，要求 current repository 为事实权威 | 新聊天首读项目权威，再转入本资料包；不能把聊天记忆冒充当前状态 |
| G03 G-FULL / G-PART | [PA-02 10-13 门禁快照](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/agent-line/PA02-STAGE-GATES-SNAPSHOT-20261013.md)、[PA-02B 10-14 增量](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/agent-line/PA02B-GOVERNED-OWNER-WRITE-HANDOFF-20261014.md) | 旧快照 `当前GitHub合并状态/剩余实施`；增量 `Host可信注册`、`首个真实插件Owner预览`。上方 `CI_PENDING` 是历史静态字段 | 对齐已闭环与真正 OPEN，不能因旧快照措辞重复开发 |
| G04 G-FULL | [文档生命周期规范](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md) | `2 文档类别`、`5 supersession`、`7 fresh-chat`：历史快照冻结，当前规范可改、决策历史另存 | 本次使用单独短入口 + 来源索引 + 决策缺口历史快照，不改 `project.status.json` |
| G05 G-PART | [最新项目导览](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/architecture/PROJECT-ORIENTATION-v0.1.md)、[架构/开发索引](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/architecture/PROJECT-ARCHITECTURE-AND-DEVELOPMENT-INDEX-v0.1.md) | 开头与 `模块职责/owner`；提示 App Platform 是 Package 控制面，Eidos 是 Experience，Provider 与业务 Owner 不可乱放到 Core | 定位下一步属于业务 Owner／资源 Provider，不擅自改 Eidos、EVO Core |
| G06 G-FULL | [Host 可信 Owner 注册](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/manager/agent-trusted-owner-registration.ts) | `createHostRegisteredAgentOwnerRegistryV040`：需要 Host 登记可信 Owner/verifier、有效 WRITE Capability、权限、AI 身份、企业/资源；插件失效或绑定变化即拒绝 | 下轮直接复用 Host 权限策略，不新建一套授权 |
| G07 G-FULL | [Host capability 操作权限检查](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/manager/capability-operation-access.ts) | `checkCapabilityOperationActionV010` / `createCapabilityOperationActionPreExecuteV010` 同一权限原语，可检查 INPUT 资源 ID | 为 Owner WRITE 保持 Action Host 的 AI 授权与生命周期一致 |
| G08 G-FULL | [Worker 受控 WRITE port](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/agents/enterprise-agent/pa02-governed-worker-write-port.ts)、[Owner Handoff](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/agents/enterprise-agent/pa02b-governed-owner-write-handoff.ts) | 原模型决策与请求摘要→持久 Receipt/effect ID，`INVOKING/UNKNOWN` 则只恢复查询，Owner 端需幂等；可信身份/原始参数必须匹配 | 正式领域 Owner 必须遵守的 Host 接口 |
| G09 G-PART | [PA-02 Worker 实现](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/agents/enterprise-agent/pa02-async-read-worker.ts)、[Host async 运行时](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/manager/agent-async-read-worker-runtime.ts) | `governedWrite` 可选；默认向模型仅曝光 READ；Host async Worker 有 PG Run/Receipt 处理但尚未为真实 Object Extension Owner 默认开启 | 下轮禁止建第二套 Worker、避免误启用生产 WRITE |
| G10 G-FULL | [企业资源仓库契约](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/contracts/enterprise-resource.ts)、[现有企业资源 Provider](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/providers/enterprise-context/resources.ts) | `EnterpriseResourceRepositoryV010.transaction?`、`createRepository`、`createFileEnterpriseResourceRepositoryV010`：进程内 snapshot + file temp/rename；没有跨进程 CAS/互斥的契约与证据 | **当前真正阻塞生产业务 WRITE 的具体缺口**；要先与 Provider owner 确认 |
| G11 G-FULL | [Object Extension 原仓库](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/object-extension/repository.ts)、[常规 Object Extension Action](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/object-extension/actions.ts) | `save` 调用 Enterprise Resource put，`archive`；Action upsert 普通保存，可以覆盖同一 Extension；本身不携不可变 Owner Receipt | 解释为什么预览 Owner 单独限定为 create-only，不能调用普通 Action 假装 exactly-once |
| G12 G-FULL | [Object Extension 能力声明](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/object-extension/capability-manifest.ts)、[定义合同](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/contracts/foundation-object/extension.ts) | `UPSERT/ARCHIVE WRITE` 的 `writeSafety HOST_REQUIRED` 只是安全责任声明；`assertObjectExtensionDefinitionV010` 是结构验证 | 不向 Agent 曝露未证明幂等的原 Action；使用现有领域验证 |
| G13 G-FULL | [Object Extension 预览 Owner](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/object-extension/agent-owner-preview.ts)、[预览独立测试](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/tests/agent-line/pa02-object-extension-preview-owner.test.mjs) | `createObjectExtensionSingleProcessPreviewOwnerV010`、`invoke`、`verify`；单事务业务创建+证据，拒绝重复、冲突与跨身份伪造；测试涵盖文件重开、失败回滚、原业务后来被改则拒绝旧核验 | 下一阶段无需重做的领域 owner 起点；安全限制 `singleProcessDevelopmentOnly:true` |
| G14 G-PART | [Data Import WRITE 能力清单](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/data-import/capability-manifest.ts)、[Data Import Service](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/data-import/service.ts) | `commit(commitInput)`：目标 `commitPreparedRows`/`commitRow` 与 Job/row Receipt 的处理路径；可能多步有 partial errors，并非 Owner 原子事务 | 明确推迟以 Data Import COMMIT 作为第一个可跨进程 WRITE 的证明 |
| G15 G-PART | [Counterparty Repository](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/counterparty/repository.ts)、[Warehouse Repository](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/warehouse/repository.ts)、[对应 READ capability](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/apps/counterparty/capability-manifest.ts) | 与企业 Resource Repository 共用存储，现行投影能力主要 READ；不是天然跨进程幂等 Owner | 对比首个适配候选并限制当前范围，不改 Supplier BEX 专项 |
| G16 G-FULL | [Agent PostgreSQL Worker 测试](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/tests/agent-line/pa02-governed-worker-write.test.mjs)、[Host Owner 权限测试](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/tests/agent-line/pa02-host-trusted-owner-registration.test.mjs) | 前者含 Worker 模型决策→受控 WRITE→PG Receipt→Run；后者含 owner/mode/scope/resource 授权失效的负向断言 | 作为未来真实 Object Extension Owner 接线的回归基础 |
| G17 G-FULL | [Worker 工作流](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/.github/workflows/agent-pa02-async-read-worker.yml) | `node --test … pa02-object-extension-preview-owner.test.mjs …` 真实列入测试命令；旧绑定一条已经删除的固定 Agent push 分支已清理 | 防止 CI 只显示 SUCCESS 却没有运行新增场景 |
| G18 G-FULL | [2026-10-13 上一研究资料索引](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/agent-line/WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)、[上次简短入口](https://github.com/jiangxng/EVO-App-Platform/blob/e4ce338e483af9b6ad17ea811ad6b052cbffafeb/docs/agent-line/WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md) | `分级口径/外部网络14条/易流失 CI 附件`：旧索引作者曾收录14外链，并明确未重读，不应按本窗源码等级提升 | 保留外部研究遗产索引，同时不谎称实际浏览过外站 |

**分级补充：** 某些文件在本窗口早期作为完整 GitHub 返回内容阅读，后期又只查看片段；以上只为此窗口总体访问等级，不推断作者阅读过同仓全部源码。新窗口如需要 precise function 行号应使用上述 blob 中函数名/锚点，而不是凭旧滚动输出假设固定行数。

## 3. 已取回的 PR / GitHub Actions 原始证据（M / G-LOG）

| 编号／级别 | 原始 PR／CI 页面 | 查阅日 | 最重要的事实及限度 | 具体用途 |
| --- | --- | --- | --- | --- |
| M01 PR 元数据 | [#823](https://github.com/jiangxng/EVO-App-Platform/pull/823) merge `11a4355316051f3f0d4b31e0aca86807f054734f`；[#816](https://github.com/jiangxng/EVO-App-Platform/pull/816) merge `73f5ed5795fa0b0ca496e83fb74949e5b705f9a2` | 10-14 核验，#823 原合并 10-13 | 旧 Agent 3 分支收敛到 #816，业务 Host READ 集成并入 main；CI/主线冲突在 PR 内解决 | 不重新开三个实验分支；恢复历史直接看 PR/commit |
| M02 PR 元数据 | [#825](https://github.com/jiangxng/EVO-App-Platform/pull/825) merge `f120ea1a0e03160cfa3ed4f797b5fe44dddc3b77` | 10-14 | 受控 Owner WRITE handoff 的隔离真实 PG 沙盒，首次丢应答验证；没有正式插件适配 | 复用写入意图与 UNKNOWN 原语 |
| M03 PR 元数据 | [#828](https://github.com/jiangxng/EVO-App-Platform/pull/828) merge `2baa389c6a31b37d1fe243e8cd4c2acf25b62745` | 10-14 | Fenced Worker 加可选 WRITE→Run Receipt 和观察；正式 Host READ-only 默认不变 | 复用 Worker，不写另一套 |
| M04 PR 元数据 | [#829](https://github.com/jiangxng/EVO-App-Platform/pull/829) merge `8f20033371edc32e47ede10d5bb94eea490385aa` | 10-14 | 权限检查和能力目录的 trusted Owner 注册已入 main；**没有**真实业务生产 Owner 自动安装 | Host 接线基线 |
| M05 PR 元数据 | [#832](https://github.com/jiangxng/EVO-App-Platform/pull/832) head `b1f350cd548c150ef7254cef224fde421585cd74`；merge `e4ce338e483af9b6ad17ea811ad6b052cbffafeb` | 10-14 | 实际领域插件 Object Extension 单进程 Owner 预览合入 main，合并后 Agent source branch 在分支目录已不存在 | 本轮最重要交付及后续复现起点 |
| G-LOG-01 测试日志 | [#832 首次真实执行新测试的 Job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38503765340)、[最终 head 的 read-worker Job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504167905/jobs/115657707213) | 10-14 | 首次原工作流没有将**新文件放进 node --test 命令**：成功但仅7项。修复命令后亲自读日志 `PA02_OBJECT_EXTENSION_OWNER_PREVIEW`：`tests 9; pass 9; fail 0; skipped 0`。最终 head 的 Worker Job 再 SUCCESS | 证明新功能实际验过；**不能拿旧绿灯冒充新覆盖** |
| M06 最终 checks | [#832 最终 Host 架构 Job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504167943/jobs/115657707403)、[Continuity Job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504167914/jobs/115657707309)、[源分支退休](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504272697) | 10-14 | 同一最终 PR head 4 个常规执行检查 success，合并后 Branch Hygiene retire success，其他同一运行 2 个 audit 检查 skipped（条件不适用），不是失败 | 支持合并/清理事实；避免混淆 4/4 业务门禁和合并后的条件跳过 |
| M07 历史集成 | [#816 PostgreSQL 回归](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38383960087)、[#825 和 #828／#829 PR](https://github.com/jiangxng/EVO-App-Platform/pull/829) | 10-14 所用历史资料 | READ/Owner/Worker/Host 几轮迭代 CI，存在曾修复的 fixture 顺序/TS 类型等问题；不当作今天仍需重做的问题 | 若新回归失败，定向排查而非整阶段重建 |

### CI 原始日志的高价值恢复锚点

- `tests/agent-line/pa02-object-extension-preview-owner.test.mjs` 中两个 test 名称分别是：`PA02 real Object Extension Owner: one atomic business write, evidence, replay and reconnect`；`PA02 Owner preview refuses non-transactional repositories and rolls back on evidence failure`。GitHub Actions 日志中可搜 `PA02_OBJECT_EXTENSION_OWNER_PREVIEW`。输出明确标注 `crossProcessConcurrencyProven:false`、`productionEligible:false`，不可截去这两个否定项。
- `apps/object-extension/agent-owner-preview.ts` 的 `createObjectExtensionSingleProcessPreviewOwnerV010`、`readEvidence`、`owner.invoke`、`verifier.verify` 是未来改造的具体入口；证据资源类型 `agent.owner-evidence.preview`；安全开关 `singleProcessDevelopmentOnly:true`；测试前后文件快照和异常回滚用来证明单进程性质。
- `providers/enterprise-context/resources.ts` 的 `createRepository`（`transaction<T>`）、`createFileEnterpriseResourceRepositoryV010`（`readFileSync/writeFileSync/renameSync`）是待补多进程不变量的关键位置。
- 以上是**章节/符号定位锚点，不是截图或本地复制的完整 CI 日志**。若 GitHub Actions 达到日志保留期限，利用固定源码测试及提交重跑，不依赖临时容器路径。

## 4. 14 条外部网络资料：历史转引，不是本窗口 Web 阅读（H）

**来源溯源:** [2026-10-13 历史索引 `3](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md#3-外部网络资料仅继承已有14条全部h--待逐页核验) 和其中引用的 2026-10-11 原索引。历史资料声称较早研究源于 2026-10-10/11；**具体原始逐页访问时间与究竟读全文或搜索摘要，在本窗口不可证实**。本窗口 2026-10-14 仅阅读这些链接的**仓库内旧索引文字**，没有访问外站原文。下表每一条级别均是 **H＝旧报告转引／现待核**。下述要点是**历史报告摘要，不是本轮独立认定的来源事实**。

| H-ID／标题与原始 URL | 历史记录日期／关键发现（转述，不视为已验证） | 对 EVO 当前项目的作用 / 重新核验优先级 |
| --- | --- | --- |
| H01 [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 旧记录 10-10/11；Workflow 组合优先于无边界自主 Agent | `agents/enterprise-agent/*` 编排；只在计划重新设计工作流时核原文；本轮没有采用其具体算法 |
| H02 [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 旧记录 10-10/11；上下文高信噪比与选择性加载 | `manager/conversation-context-*` / Context Assembly；如研究压缩/长期记忆时再核 |
| H03 [Anthropic: Managed agents](https://www.anthropic.com/engineering/managed-agents) | 旧记录 10-10/11；运行长期任务与状态分离 | PA-02 运行生命周期；实际产品架构/文章日期待核，不能据历史索引引入依赖 |
| H04 [Microsoft: Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | 旧记录 10-10/11；工具元数据驱动动态调度 | Capability Fabric / Tool Catalog 描述；不替代授权 |
| H05 [AG-UI: Events](https://docs.ag-ui.com/concepts/events) | 旧记录 10-10/11；Agent frontend event | Eidos streaming；没决定兼容此协议，待核版本 |
| H06 [A2UI: Catalogs](https://a2ui.org/concepts/catalogs/) | 旧记录 10-10/11；受约束组件目录 | Eidos 体验约束，若实施生成 UI 才核 schema |
| H07 [A2A: Specification](https://a2a-protocol.org/latest/specification/) | 旧记录 10-10/11；任务委托、取消、artifact | External Agent 互操作；`latest` 易变，需锁具体版 |
| H08 [MCP: Security best practices（版本路径 2025-11-25）](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 旧记录 10-10/11；token audience / passthrough / SSRF | External Agent OAuth/MCP 安全；要锁正式版本原文核验 |
| H09 [Microsoft HAX: Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/) | 旧记录 10-10/11；能力可解释、可纠错、人类控制 | PA-02 状态展示、Eidos confirmation；仍未逐页重读 |
| H10 [Temporal: Workflow execution](https://docs.temporal.io/workflow-execution) | 旧记录 10-10/11；持久执行、历史回放 | **与 PA-02 有关**：作为选型对比对象；本轮选择复用既有 PostgreSQL/Owner，不代表 Temporal 不可用；下一步如考虑替换引擎须读原文版本 |
| H11 [W3C: WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 旧记录 10-10/11；触摸目标尺寸 | Eidos 触屏可用性；不是本轮 Owner 存储的直接依据 |
| H12 [W3C: WCAG 2.2 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | 旧记录 10-10/11；状态提示与无障碍 | Agent 思考/取消/回执 UX；未来 Eidos/Workbench 验收时读原文 |
| H13 [OpenTelemetry: GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | 旧记录 10-10/11；LLM 可观测追踪命名 | Agent 监控与数据脱敏；实际 semconv 版本待核 |
| H14 [OWASP: LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 旧记录 10-10/11；Prompt Injection 风险 | Host 工具/Owner 必须执行外部于模型的授权；本轮架构判断由项目代码支持，**不声称已重读 OWASP** |

**S/搜索摘要记录：0。** 上面全部没有本窗口的“全文已读”“仅搜索摘要”证明，因此严格归为 H，不应该用当前日期冒称 2026-10-14 外站访问。**未来真正需要看外站时**：先选最相关的一两条，记录固定版本、HTTP访问日期、章节/事实与项目契约的差异，而不是逐个翻14条形成无关研究。

## 5. 易失证据、截图及附件位置

| 来源等级 | 原始位置与可恢复对象 | 本次窗口阅读／保存情况；限制 |
| --- | --- | --- |
| G-LOG / M | [Object Extension 新专项第一次实测 run 38503765340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38503765340)，[最终 read-worker job 115657707213](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504167905/jobs/115657707213) | 实际读过前者日志中新增两条测试 + `tests 9/pass 9`，最终head从 GitHub checks 证实 success；**没有截图** |
| M | [#832 分支清理 run 38504272697](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504272697) | 已取 GitHub 元数据：retire merged agent PR SUCCESS，原 Agent 分支不在合并后分支列表；无需截图证明业务效果 |
| H（旧研究附件） | [旧 PA-01B2 Native 浏览器](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018/artifacts/11685148470)、[Full Host Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/artifacts/11686346415) | 只从 10-13 索引继承 artifact ID；本窗口**没有重新下载或查看截图/文件**，不能把它们说成 #832 业务 Owner 的截图。若 artifact 过期，以 [PA01B2 原验收文件](PA01B2-FULL-HOST-CHROMIUM-ACCEPTANCE-20261011.md) 为保底 |
| H（旧授权附件） | [allow/deny 浏览器 artifacts](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340)（旧索引给出 artifact `11687112571` / `11686147677`） | 属 PA-01B3，未在本轮重读；与 PA-02 Owner 证据不同 |
| H（旧环境临时路径） | 旧索引记有 `/mnt/data/pa01b2-browser-proof/` 的 `existing-draft.png`、`inflight-draft.png`、`index.html`、`artifacts/agent-pa01b2-chromium/report.json` | **历史容器路径，不保证新聊天有相同文件**。本窗口未核对该路径存在，绝不能提供未经验证的下载链接 |
| U（本轮没有产生） | PR #832 专门截图、浏览器录屏、CI logs 的永久仓库副本 | **均未制作/未保存**；本轮是文件仓库+Node/PG测试，不是 UI 截图验收。GitHub 工作流日志可能到期，关键测试被保存在代码中可重跑 |

## 6. 未在本窗口访问/验证的候选原文（不要当本轮 source）

- PostgreSQL 官方 transaction isolation、unique constraint、`INSERT … ON CONFLICT`、advisory lock、故障恢复与 crash durability 的确切官方章节；**本窗口未打开外部官网，原始 URL 未索引为“已查阅”**。下一步应按真实 Owner 存储问题定向核文档和特定版本。
- 生产 Railway 数据库/部署设置、真正运行中的插件注册、两独立业务进程并发写入、业务 Owner 的长时间 UNKNOWN 清账政策；本窗口均未直接测试。
- 旧索引提到的四仓更完整外部资料不代表本窗口已读。参阅 [旧来源索引 `4](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md) 的历史链接，不要在此伪补一份“本窗查阅的外站清单”。

此索引只是证据与访问等级；实际采用/排除方案以及下一项具体研发任务在 [决策与缺口文档](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md)。
