# Agent / External Agent：新窗口研究与决策交接入口（2026-10-13）

Document class: LIVING_HANDOFF_POINTER。**本文件是本窗口截至2026-10-13的交接快照，不代表上线验收或永久最新状态**。详细证据见同目录 [资料索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)、[方案对账与待解决问题](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)。保留原始研究 [2026-10-11资料索引](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) 与 [总纲v1.0](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，但**不可照抄这些历史快照中的旧PR/分支状态**。

## 一、用户当前指令（最新决策优先）
1. EVO是**轻量插件宿主**，按需装载业务能力；未完成插件代码在**开发阶段可并入main**，未装载/未启用不自动影响既有功能（但仍须核验契约、编译、授权和CI）。
2. Agent / External Agent**不再长期囤积多个开发分支**；完成与未完成成果都可以**先对账、再合入各自仓库main、删除已合并分支**。禁止把“合入源码”误写成“功能完成/上线”。
3. 保持现有模块owner和隔离：Personal Agent/External Agent 属于EVO-App-Platform插件与Host权限体系；Eidos为通用交互；EC为知识研究/建议；EVO为确定性企业业务权威。**不接管TR业务主线、Ledger Runtime、2D专项，不改共享 project.status.json / HANDOFF-LATEST.md**。
4. 自动字段映射、页面Agent侧栏、结果严格关联、草稿不丢、复制/处理中提示是具体使用场景；LLM不取代授权/审批/业务提交/自动布局等确定性功能。

## 二、截至本窗口结束的实施事实（GitHub已复核）
| 仓库 | 2026-10-13查阅到的main SHA（仅快照） | 已合并入口与结果 |
|---|---|---|
| [EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform) | `61d5cb616327656206b9a8ca460e109c7422e524` | [#575](https://github.com/jiangxng/EVO-App-Platform/pull/575) PA-01整合；[#786](https://github.com/jiangxng/EVO-App-Platform/pull/786) Personal/External五条旧分支来源合并；[#782](https://github.com/jiangxng/EVO-App-Platform/pull/782) 旧PA-01分支清理 |
| [eidos](https://github.com/jiangxng/eidos) | `f412f1d03e684a3f3463d10eac51d6cc79032eff` | [#142](https://github.com/jiangxng/eidos/pull/142) PA-01通用helper；[#177](https://github.com/jiangxng/eidos/pull/177) 旧聊天UX改进经定向兼容后合入 |
| [Experience-Compiler](https://github.com/jiangxng/Experience-Compiler) | `5f06a6224b6ffe434a9a3c0793b0384943121ac9` | [#9](https://github.com/jiangxng/Experience-Compiler/pull/9) 三条旧Agent研究分支合入历史；**保留较新当前架构文档** |
| [EVO](https://github.com/jiangxng/EVO) | `d5ce051325c4572c7a5fd713560d7d7d06e4b401` | 本窗口只读，未修改 |

- 本窗口确认：上述四仓以 `agent` 与 `ea4a` 名称检索，**Agent/External Agent剩余分支为0**。搜索是命名范围检查，不保证没有以其他任意名称命名的相关工作。所有旧分支原始提交由被合并的PR历史可追溯；不要重新创建已删分支当作待合并任务。
- Platform #786 的合并提交 `f7d96e9a89365df70720427a89ac116eea321ebf`，其一次性删除工作流 [38189420287](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38189420287) SUCCESS；Eidos #177 合并 `f412f1d03e684a3f3463d10eac51d6cc79032eff`；EC #9 合并 `5f06a6224b6ffe434a9a3c0793b0384943121ac9`。
- 旧 [Platform #692](https://github.com/jiangxng/EVO-App-Platform/pull/692) 仍是**关闭但未合并的PR对象**，但它的实验源码及原始提交历史已在#786进入main。不能因旧PR字段 `merged=false` 就断言实验代码仍在未合并分支。
- **未部署生产**。PA-02A异步PostgreSQL只是隔离原语证明，**没有接入正式server**；External Agent可选manifest已合入，但**不能推断已被安装/对外开放**；Eidos聊天改进通过CI，不等于所有真实交互已人工验收。

## 三、下一窗口开工顺序
1. 读取本入口、[详细索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md) 与 [决策缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)，再按需要读现有 `docs/agent-line/HANDOFF.md` 历史记录、现行 `AI-BOOTSTRAP`/架构owner与相关开放PR。优先核对当前main与上述SHA差异。
2. **当前首个未完成门禁：** PA-02从Postgres孤立证明到真实Host异步Run/Receipt接线的设计和失败恢复验收。保留Sync V010兼容，先补真正跨进程重启、掉线、未知写入及Receipt终态审计；未经授权不做生产迁移。
3. External Agent：检查实际插件目录安装/激活、OAuth/MCP实际端点与授权，按零背景外部客户端做盲发现与只读/PLAN/WRITE隔离验收；不可把合入manifest当已接通。
4. Eidos：验证真实聊天复制、键盘IME、窄屏布局与原生/富文本dirty边界；Agent B3补显式DENY后回执终态查询、跨企业身份攻击测试，真实LLM质量另测。
5. 任何新实施遵循轻量宿主按需装载与插件隔离，测试CI绿色后再合main；**本交接不授权重新安排他线或直接上线**。

## 四、资料可用性边界
本窗口**实际直接获取过**GitHub文件正文、PR元数据、diff/比较、GitHub Actions日志、流水线结果和refs；14条外部AI/UI/协议文献沿用2026-10-11历史索引，**未在本窗口逐页重新打开**，统一保留“待验证（历史链接）”，没有可确证“只看搜索摘要”的新条目。截图/附件原始位置、可恢复摘要及未保存在GitHub的内容见详细索引§4–6。

此入口为Agent线增量文档，不修改旧研究原稿、全局状态或其他开发窗口交接。

## 2026-10-13 接续窗口增量（不改变上述原始交接快照）

- [PA-02A真正独立Node进程恢复专项](PA02A-CROSS-PROCESS-RECOVERY-20261013.md)：[Platform #799](https://github.com/jiangxng/EVO-App-Platform/pull/799) 在PostgreSQL 18隔离CI中新增 **SIGKILL旧业务进程→新Node进程读取并幂等复用**、跨企业实验scope隔离、事务回滚；首次测试head `fe699a2` 的 [run 38345829365](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38345829365) 成功。
- **没有接正式Host或生产数据库**。请求状态 `REQUESTED` 保留，不表示已实现unknown-write reconciliation、outbox、fencing、跨机器Worker恢复或数据库服务重启。PR合入/源branch删除及最终head CI状态以GitHub最新API为准，勿把此记录当合并凭证。


- **2026-10-13 PA-02B续做**：[Platform #800](https://github.com/jiangxng/EVO-App-Platform/pull/800) 新增独立PostgreSQL租约fencing与UNKNOWN写入隔离proof，[证据及限制](PA02B-FENCING-UNKNOWN-WRITE-20261013.md)。正式Host、跨机器Worker/业务owner幂等和PA-02C取消门禁未因代码存在而完成；具体CI与合并状态以GitHub为准。


- **2026-10-13 PA-02C继续**：[PR #801](https://github.com/jiangxng/EVO-App-Platform/pull/801) 新增[PA-02C持久取消隔离证据](PA02C-DURABLE-CANCELLATION-20261013.md)，并使PA-02B写入启动前核验已保存的取消请求。**这不是正式Host `RUN_CANCELLED` 事件或跨进程真实取消完成**。PA-02A Host接线、PA-02B外部owner幂等/未知写入核对、PA-02C真实Host取消仍属未完成，勿按标题升级产品状态。


- **2026-10-13 PA-02A Host桥继续**：[PR #802](https://github.com/jiangxng/EVO-App-Platform/pull/802) 增加无默认激活的Host可信Principal/Context→异步V020 Run bridge，利用V010 reducer复播隔离PostgreSQL事件，详见[阶段说明](PA02A-HOST-ASYNC-BRIDGE-20261013.md)。这不是 `manager/server.ts` 正式接入，更不是完整Receipt迁移、长期Worker和安全取消端到端验收。

## PA-02 本日阶段证据闭环索引（2026-10-13）

最新可靠性阶段状态与全部合并SHA、真实CI、剩余产品门禁见 [PA02阶段门禁快照](PA02-STAGE-GATES-SNAPSHOT-20261013.md)。四个Agent专项PR #799/#800/#801/#802均合main并删除过程分支；仅证明隔离可靠性前置能力。正式Host async Run/Receipt/Worker/CANCEL尚未接线或完整验收，PA-02整体状态仍为 **IN_PROGRESS / NOT_PRODUCTION_READY**；不复活历史分支，也不碰其它owner。


## 2026-10-13 新窗口恢复与GitHub增量核对（基线 `d0519983f4c182b60008966104a02717911d75de`）

**证据规则**：本节只表示聊天决策、GitHub PR实现及其特定测试范围，不把三者混同；旧章节保留作历史快照。来源沿用[资料索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)及[决策缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md)，2026-10-10/11的14项外部参考仍是H级历史链接，本轮没有重开原网页，不能升级成已读原文。

### 用户确认与窗口边界
- 2026-10-13用户已明确允许PA-02A/B/C独立线**修改 `manager/server.ts` 等共享Host核心文件**，以最新main为基线、小范围独立PR、经CI后合并；这撤销了旧窗口“共享Host文件一律不能改”的限制，**并未授权生产部署或生产运行模式切换**。
- 持续推进PA-02A→B→C，除真正需要人裁决的风险外不用中途人工截图签收。保持轻量宿主/按需插件、V010兼容、可隔离的开发能力默认OFF，不接管TR、Ledger、2D和其他owner，不改共享`project.status.json`/`HANDOFF-LATEST.md`。
- 不复活历史已删除开发分支；研究与方案沿用四仓文档和精确PR/commit记录。合main≠启用≠真实产品验证≠生产完成。

### 当前完成对照：不是仅停留在旧#813
| 来源与范围 | 代码实现 / GitHub核验 | 可以认定的验证，不可认定的内容 |
|---|---|---|
| 用户旧聊天转述 #810–#813 | [#810](https://github.com/jiangxng/EVO-App-Platform/pull/810)真实Node Worker SIGKILL后新进程恢复；[#811](https://github.com/jiangxng/EVO-App-Platform/pull/811)Run.get可注入异步读；[#812](https://github.com/jiangxng/EVO-App-Platform/pull/812)可信scope PostgreSQL读adapter；[#813](https://github.com/jiangxng/EVO-App-Platform/pull/813)真实Action Handler隔离测试。四PR GitHub显示merged；#813合并SHA `56a2ae529c29de85d877fd7e2347b47dff20aa67` | #813实际Action对PostgreSQL读与V010拒绝不得fallback的测试；不代表server已接线、WRITE或生产迁移 |
| [#814](https://github.com/jiangxng/EVO-App-Platform/pull/814) | merged `8920692`；**实际修改Host `manager/server.ts`**；`APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE=POSTGRES_READ_ONLY`可选装配，默认OFF | PR声明覆盖禁用状态、配置fail-closed、只读无DDL、租户隔离；不是V020全权威迁移 |
| [#815](https://github.com/jiangxng/EVO-App-Platform/pull/815) | merged `c6e520f`；Worker READ slice完成后安全释放fenced lease | 隔离PostgreSQL回归；无业务WRITE |
| [#816](https://github.com/jiangxng/EVO-App-Platform/pull/816) | **GitHub PR元数据 `merged=false`**，尽管对象含merge SHA字段；不能直接称此PR已正式合并，需要按当前main文件内容及ancestry核对是否已有等价接线 | PR描述了READ_ONLY Host异步start/resume/cancel方案，但此处不升级成该PR已合并或已启用 |
| [#818](https://github.com/jiangxng/EVO-App-Platform/pull/818) | merged `2d086d8`；进程SIGKILL后原子取消防Run复活 | PostgreSQL隔离Worker取消证明，不覆盖外部WRITE |
| [#819](https://github.com/jiangxng/EVO-App-Platform/pull/819), [#820](https://github.com/jiangxng/EVO-App-Platform/pull/820) | merged `5ebd742`, `da64043`；真正thread.resume Action异步fallback、PostgreSQL fenced READ测试 | 测试证明resume/同Turn去重/线程隔离；不是生产启动路径 |
| [#821](https://github.com/jiangxng/EVO-App-Platform/pull/821), [#822](https://github.com/jiangxng/EVO-App-Platform/pull/822) | merged `2a0f86e`, `d0519983f4c182b60008966104a02717911d75de`；真正thread.send Action支持可选原子Turn claim，并有PostgreSQL fenced READ与消息单次写入测试 | #822说明使用确定性provider及隔离PostgreSQL；无真实外部业务WRITE、无生产运行方式变更 |

**复核时间切片**：2026-10-13，GitHub main commit `d0519983f4c182b60008966104a02717911d75de`，已超过用户旧消息的 `56a2ae5`。以上是GitHub PR元数据+旧交接文档核对，不等于本窗口重新读取所有测试日志与全量源码，也不能擅称全部CI逐项重验或所有过程分支已删除。

### 旧研究恢复与方案的采用/搁置
- 保留原14项H级来源S1–S14（Anthropic agents/context、Copilot orchestration、AG-UI、A2UI、A2A、MCP Security、OAuth安全规范、HAX、Temporal、WCAG、OpenTelemetry、OWASP），逐项网址及适用性在[来源索引§3](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md#3-外部网络资料仅继承已有14条全部h--待逐页核验)，不是本窗口重新研究结果。
- **采用**：PostgreSQL持久Run/Receipt+Host可信scope+原子claim+fencing/UNKNOWN隔离+取消屏障，短PR渐进接线；确定性Host授权，业务owner负责核验结果。**暂不采用**：Temporal强依赖、默认多自主Agent、LLM代替工具授权、旧OAuth helper整包回退、旧Eidos CSS覆盖、新协议自称完全兼容。权衡与具体理由见[决策缺口§2](WINDOW-RESEARCH-DECISIONS-GAPS-20261013.md#2-比较与选择明确区分来源事实-vs-项目判断)。
- 外部标准原文的实际历史逐页阅读记录无法完整恢复；部分截图与已过期CI artifact需按原索引重新获取，不猜测它们的内容。旧窗口未保存的自由讨论不能伪造为已确认决策。

### 尚未闭合的门禁与下一步
1. **先核#816是否确实以其他合并路径包含在main**，并以当前`manager/server.ts`、Action Handler及测试源码为准，检查可选Host异步start/resume/cancel真实装配。勿因PR状态或单一merge SHA字段单独下结论。
2. 继续PA-02A完整Run/Receipt迁移与历史兼容、多进程及数据库中断测试；PA-02B真实业务Owner的幂等/UNKNOWN结果核验、Outbox/fence；PA-02C全Host取消与终态Receipt一致性，包括READ和WRITE边界。补跨企业攻击、真实隔离Host/沙盒场景、RPO/RTO/回滚门禁。
3. External Agent实际安装/激活、OAuth/MCP外部盲发现；Eidos手机/IME/dirty、DENY Receipt终态仍属其他关联验收，切勿以插件manifest或CI通过取代运行验证。
4. 保持`PA-02 IN_PROGRESS / NOT_PRODUCTION_READY`。只在CI与实际运行门禁满足时升级对应子项，**未经明确授权不部署生产**。

本节仅追加Agent独立线的恢复证据，不修改其他窗口权威文档。


## 2026-10-13 用户明确要求：Agent开发不得重复劳动或长期堆积过程分支

**适用**：PA-02及后续独立Agent线；本节是本窗口流程决定与当前分支实况快照，不代表已由GitHub CI强制执行。优先级高于本文件早期“需要更多PR实验”的建议，但不降低质量与安全门禁。

1. **同一开发任务默认只有一个活动开发分支**。在当前分支上连续推进、提交、运行CI、修复，达到有界交付后合入`main`、核对合并提交、立即清理已合并过程分支。下一项工作从最新`main`重新开短分支；不创建长期PA-02总开发分支，不为了每个函数、每个验收反复开枝。仅真正独立且存在可说明的并行理由时才例外，必须列owner、目标、交集和退出时点。
2. **开始工作先查现有分支/PR/代码/测试**：已经有分支就续用而不是复制；旧函数先按既有验证的契约复用，只针对改动影响或失败证据审查实现。已经验证的原语只需集成回归，不为反复“研究”或相同实验重复造功能与PR。
3. **禁止孤儿分支**：开发中的分支需能对应一个可追踪的PR/任务，明确它基于哪条分支及如何收敛。合并受阻时更新同一PR所在分支并重跑CI，不能另开新分支绕过合并门禁。删除前检查精确HEAD、PR已合并/等价提交真实进入main，**不能无证据清掉独有提交**。
4. **每一轮必须输出收敛账**：当前Agent未合并分支数、各自PR与独有提交去向、已合并未删除的分支数，是否确实关闭一项最终交付门禁；阶段退出条件按2026-10-10总纲的PA-02 R01–R10，不无限增加新门禁。合入源码≠真实功能完整≠生产上线。
5. **不修改他线所有权**：共享Host文件可按用户许可经PR修改，保持轻量默认OFF、CI和安全边界；不自行部署生产、不碰全局状态；Governance等其他窗口分支应由owner核验删除。

### 本窗口实际查到的待收敛分支（仓库2026-10-13快照）
- `agent/pa02-host-async-read-execution-20261013`：PR [#816](https://github.com/jiangxng/EVO-App-Platform/pull/816)仍OPEN，落后最新main；之前head 46项CI success，但合并基线检查需刷新。**优先将此PR作为Host集成的唯一提交流程**，保持现有PR，刷新main后重跑必要检查。
- `agent/pa02-thread-turn-durable-run-20261013`：直接在#816的head之后又有**两个提交**，没有关联开放PR。优先在精确审查后收敛回#816对应的同一工作线；在确认内容安全纳入并验证前**不能删除**。
- `agent/pa02-optin-host-async-20261013`：相对main另有两项独有提交历史，明显落后；没有关联开放PR。定向判断是否已有等价代码、是否需移植，不无凭据重做或丢弃。
- `docs/agent-pa02-context-recovery-20261013`：本窗口自己创建的文档分支，[#823](https://github.com/jiangxng/EVO-App-Platform/pull/823)；本规则**复用此分支追加**，不再另外开枝。通过CI后合并并清理。
- `feat/governance-provider-lifecycle-ui-20261013` / `fix/governance-revision-resource-lifecycle-20261013`：对应 [#817](https://github.com/jiangxng/EVO-App-Platform/pull/817)/[#796](https://github.com/jiangxng/EVO-App-Platform/pull/796)已经合并但远端引用仍在，由Governance owner按SHA/合并历史核对后清理。
- 本次GitHub列表合计7分支（包含`main`），其中3条PA-02开发线+1条本窗口Agent文档线。**本轮仅执行文档增量记录，没有自行删除上述仍含独有提交的分支；仓库级自动分支治理CI尚未实现。**
