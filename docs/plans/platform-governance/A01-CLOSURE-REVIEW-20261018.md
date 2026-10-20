# A01 收口复核：已解决问题、剩余责任与停止条件

日期：2026-10-18（香港）；核对 main `ca2279d5b64ec6550fd0e6fd28ccd07351ae5cb3`（#1012）。
入口：[固定7项进度表](CLOSEOUT-COUNTDOWN.md)。本批是代码对账、隔离复测与验收清单，没有修改运行代码、部署配置或其他窗口状态文件。

## 1. 明确结论

最初隔离审计列出的四类具体整改已有实现及回归：账本兼容服务、基础对象装配、全目录资源归档、记忆调度。**这四类完成不等于A01全平台按需装载完成。** 原审查还包括Host集中装配其他应用及Provider，当前仍能定位具体遗留，不能通过把它们改称“长期优化”关闭A01。

本批独立复测四种启动组合：7/16包仍均347个项目ESM模块，全部0 interval、96个归档文件、零捕获TCP出站、正常退出。[完整报告](evidence/a01-closure-audit-20261018.json)记录当前基线、源码hash与模块清单。历史362/612是另一提交的测量，不据此推算耗时、内存或生产收益。

347不要求归零，也不要求7包与16包必然出现不同数字：目录及轻量清单可以相同，已启用未使用也应懒装配。真正需验收的是不应启动的业务实现/资源不启动，以及实际使用与停用恢复仍正确。静态269条边是遗留依赖集合，含清单和常量，不能称269个违规点；本批没有调整基线或放宽CI。

## 2. 首轮四类问题的复核结果

| 原问题 | 当前结论与证据入口 | 明确限制 |
|---|---|---|
| 账本兼容服务提前创建 | 关闭这一处装载问题；#922，[说明](LEDGER-COMPATIBILITY-LAZY-LOADING.md)。真实Host首次/并发使用、旧配置保持及未用禁入断言 | 旧进程内共享配置保留；发布未知结果仍计A03，不算本项已解决 |
| 基础对象/扩展/导入过度装配 | 已整改所列adapter及调用链；#958/#975/#1000–#1006，[第7–15节](FOUNDATION-LOADING-BOUNDARY-20261016.md)。共享资源不复制、代际拒绝、Job/Recipe恢复、按单一目标装配 | 不宣称所有Item/Warehouse HTTP路径或跨进程WRITE冻结已验证；后者遵循原业务owner合同 |
| 全dist资源归档 | 关闭全目录复制问题；#1007/#1008，[归档边界](WEB-ASSET-ARCHIVE-BOUNDARY-20261017.md)。94 JS+CSS+.ready，hash完整性、双版本旧页请求 | 服务器归档清单不等于浏览器只下载当前插件；浏览器路径仍需单独验收 |
| 记忆调度常驻及停止/抢占 | #1009–#1012，[调度边界](MEMORY-SCHEDULER-BOUNDARY-20261018.md)。工作资格、真实HTTP启停/绑定/游标、有限drain、拒绝TTL接管 | 存量治理是已说明Host例外；单指定调度Host，异常需静默恢复；无多机自动接管承诺 |

这些是A01内部证据分组，不更改总表7项的分母，也不把一个PR等同一个验收项。

## 3. 尚不能关闭的具体依据

以下是本批查到的源代码事实和工程判断，均固定在页首提交。代码位置用函数/变量锚点，避免行号随其他窗口开发失效。

| 编号/责任 | 已确认事实 | 当前判定及完成条件 |
|---|---|---|
| R1 运行图装配：治理与2D owner边界 | `server.ts`顶层创建`enterpriseOperatingGraphDefinitionPersistence`、`enterpriseOperatingGraphService`、`eogExpectedSopService`，并执行`legacyGraphMigration`、`legacySopMigration`和`applyEogPreviewSeedV010`；manager兼容导出静态指向apps/eog-2d-designer实现。本次冷启动模块清单仍含service/model/page等 | 业务实现仍在冷路径；工厂创建闭包不等于已访问数据库。下一批先以调用者/配置场景分开正常图服务、兼容迁移和显式预览种子，确定按需入口或有依据的启动例外。验证2D/3D/观测/Human/Agent共享消费者，旧定义/投影不变；不重做图形产品功能 |
| R2 Agent会话资源：原Agent owner | `server.ts`的`if(conversationDatabaseUrl)`在启动阶段await `createPostgresConversationAuthorityV010`，随后同URL触发`createPostgresConversationContextArtifactStoreV010`，没有在这两个构造位置检查插件资格；前者工厂直接await建schema/迁移查询，后者构造启动SQL事务。JSONL Run/Thread工厂相反，把读取放在方法调用中 | 配置触发SQL初始化的代码事实已确认；本批没有连接数据库，不能称生产已发生。需原owner明确是否有独立必要Host职责；否则接入有效能力及使用触发，覆盖未安装/停用+已配置URL、首次并发、失败恢复、drain及既有迁移。**只是保存交接条件，未获owner接收/实现证据，不能标记已移交闭环** |
| R3 Provider启动登记：治理窗口，安全合同由各owner保持 | 静态集合仍含openai/deepseek、memory-intake、EC、semantic/DLP等runtime；Host在启动段按配置创建或登记部分provider。身份目录、授权、成员关系也存在启动登记 | 模块加载已观察，具体连接/订阅不能从import推断。逐类区分纯描述适配、必要安全机制及可选资源；有副作用才迁移，有保留理由须记范围与退出条件。禁止仅为减少数字卸载保护服务，禁止新增第二个Provider试点代替对账 |
| R4 跨层最终验收：治理窗口，复用各owner测试 | 四组合探针观测无业务请求的短启动窗口；动态目标禁入仅覆盖已整改模块。浏览器归档测试不追踪各有效页面的下载图；CI未提供所有资源副作用拦截 | R1–R3处理后按架构§9/§11.4补缺项证据：未装/停用/未使用、首次并发、停止竞态、失败恢复与重启；校验默认浏览器路由及代表性页面资源。复用现有测试，不建新的认证平台。不能把当前绿灯当作全面覆盖 |

R1–R4是**已知剩余责任清单，不是承诺还需4个PR**。后续发现与上述范围直接相关的新证据追加到对应行；超出原插件治理范围先说明，不无声扩大。当前不能诚实给出固定剩余PR数，因为R2需owner确认资源合同，R3尚无逐类副作用证据。

## 4. 明确保留与排除

- 保留通用EnterpriseResourceRepository和BusinessDefinitionRepository的共同权威。文件工厂是read/write闭包，并非构造即创建或读取全部业务文件；不能因为名字含Repository就各拆一份。基础对象前批已核对这一点。
- 保留必需身份、授权、生命周期与廉价清单。多个包实现同能力可合理替换，不靠合包掩盖加载问题。
- 记忆保留治理的Host例外限于已有数据责任及已验证工作资格；不推广为所有可选任务都可凭环境变量常驻。
- 不把ESM不可即时卸载当作停用失败；要检查实际资源和后续调用。也不把模块已加载当作远端请求已执行。
- 本批排除部署、真实企业数据迁移、交易示例、第二个Provider试点、新BI功能、重做Agent持久执行。A03发布恢复和A05认证迁移仍在原行，不能挪到A01重复计数。

## 5. 下一批唯一优先任务

**先处理R1运行图装配的调用链与迁移边界。** 交付一个有界PR：保存全部实际消费者、旧数据迁移触发条件、是否属于必要Host例外的决定；若边界清晰且无其他窗口冲突，连同最小装配修正及对应行为回归提交。不得仅把同步工厂包成立即执行的动态import，也不得为懒加载删旧迁移或改图数据语义。

R2提供可直接交给Agent窗口的定位：读取本文件R2及`server.ts`的conversationDatabaseUrl构造段、`manager/conversation-postgres-store.ts`的createPostgresConversationAuthorityV010、`manager/conversation-context-postgres-store.ts`的createPostgresConversationContextArtifactStoreV010；先决定资源资格和迁移职责，后提交四状态及停止/恢复证据。未在外部渠道发送消息，未改变该窗口状态表。

A01只有在R1–R3都有实现验收或明确、经证据支持的职责保留，并完成R4对应矩阵后才关闭。不能用文档重新分类代替实现，不能仅将问题写给其他owner就算完成。完成后停止追加本专项优化。

## 6. 来源、读取与复测记录

本批没有新增外网研究。以下为本仓原文，不是搜索摘要：

| 资料 | 读取范围 | 用途 |
|---|---|---|
| `ARCHITECTURE-REVIEW-20261014.md`、`PLUGIN-LOADING-AUDIT-20261015.md`、`LEDGER-COMPATIBILITY-LAZY-LOADING.md`、治理README | 完整 | 原范围与首轮四类问题，防止改分母 |
| `docs/architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md`、`tools/lightweight-host-validate.mjs` | 完整 | 原始验收矩阵、静态门禁能力及限制 |
| `FOUNDATION-LOADING-BOUNDARY-20261016.md` | 复用此前全文阅读；本批复核§1–3及各增量的结论/限制 | 共享仓库与业务adapter区分；没有把旧“待办”当当前缺口 |
| `MEMORY-SCHEDULER-BOUNDARY-20261018.md`、`CLOSEOUT-COUNTDOWN.md`及项目交付规则 | 复用上一批完整阅读并核对当前版本 | 最新租约决定及固定进度口径 |
| `manager/server.ts` | 局部：imports、顶层构造索引、基础对象、运行图迁移/种子、Agent会话SQL、Provider登记段 | R1–R3定位；未通读Host和所有消费者 |
| `providers/enterprise-context/business-definitions.ts` | 文件factory完整段 | 区分闭包与实际I/O |
| `manager/agent-run-store.ts`、`conversation-thread-store.ts` | JSONL factory及store构造入口 | 避免误称启动即读取全部事件 |
| `manager/conversation-postgres-store.ts`、`conversation-context-postgres-store.ts` | constructor及SQL调用定位 | 确认配置触发实际初始化；未运行真实SQL |
| `manager/enterprise-operating-graph-service.ts`、对应apps实现 | 兼容导出全文；apps工厂入口及依赖 | 定位静态业务实现与工厂成本，非完整业务审计 |
| `tools/plugin-loading-audit.mjs` | 完整 | 当前禁入断言、短窗口限制；执行四组合并保存原始报告 |

本批构建产物沿用#1012已构建并验证版本，server源码未变；报告保存源码与dist哈希。未重跑无改动业务全量测试。仅文档/证据变化按实际CI结果保存于本PR。开放PR #999/#909/#878/#846均属于BEX，无文件覆盖。


## R1后续实现入口

[运行图装配与兼容迁移](EOG-LOADING-BOUNDARY-20261018.md)已保存直接消费者清单并实现按旧文件/显式preview触发加载，保留启动迁移顺序和错误。共享graph/SOP service仍未改为首次使用装配，R1不标记完成。下一步以该文第4节为准。

共享graph/SOP实例已在上述文档第6节补充按首次方法调用装配；同步合同、独立创建、失败重试与消费者资格保持。模块静态加载仍在，R1不关闭；下一步聚焦静态页面/命令装配入口，不重做已完成实例委托。

## R3后续分类入口（2026-10-20）

R1页面/命令后续整改及24个保留入口对账见运行图文档第7～16节，旧SOP资格/冻结例外仍留R1。现已开始[Provider登记与实际副作用分类](PROVIDER-REGISTRATION-BOUNDARY-20261020.md)：首批核对原OpenAI/DeepSeek的轻量工厂、被动登记、显式网络/探测timer，新增资源回归，保留原同步闭包。Host启动Secret解析/迁移及共享加密存储的真实I/O单独记录，不能误写零访问；对应可选消费者资格、其他Provider分类与R2/R4仍未关闭。以该文第5节为下一批位置，不重复拆纯工厂或恢复SOP产品。


R3后续已在Provider边界第6节移除两处refresh隐式环境Key写入，改由原显式Secret保存路径负责持久化及审计；普通模型保存与删除后refresh不再自动迁移/复活。提前解析/解密、同步消费者资源资格与其他Provider类别仍保留，不能据此关闭R3。

R3 Provider边界第7节已接续LLM明文Key：启动仅describe，原同步选择保持，实际infer/probe通过既有fetchImpl端口解析并复核资格/配置/启停epoch/Abort；设置写入门禁与故障恢复单独验收。共享Secrets启动文件责任及其他Provider、R1/R2/R4不因此关闭；下一批按Provider文档第7节接续其余类别。

R3 Provider边界第8节已接续memory-intake/EC、semantic/DLP及共享identity/grant/relationship/authorization/remote-credential：保留无资源工厂和必要同步安全来源，新增构造/发现、请求期限与共享撤销回归。P12 refresh提前解析可选token已单列待整改，其他Provider和完整消费者资格仍待对账；下一步以第8节为准，R1/R2/R4及固定7项口径保持。

R3 Provider边界第9节已将DLP/EC可选apiToken移至原fetchImpl实际请求边界，保留未配置匿名/读取失败拒绝，增加有效选择、启停/绑定代际、写入计数及Abort保护。semantic提前解密及共享reader同步选择明确保留为下一批；配置自动安装与R1/R2/R4未关闭，固定7项不变。

R3 Provider边界第10节已接续semantic：token复用原请求helper，shared reader逐次调用原同步resolver，缺失/异常不回退旧对象，原直接注入/过滤/排序保持。Host零解密/词法页面与semantic服务合同正向调用分别验收，不新增产品入口或冒称HTTP semantic矩阵。三类P12提前token问题局部收口，配置安装、其他Provider及R1/R2/R4仍待核对，下一批按第10节接续。
