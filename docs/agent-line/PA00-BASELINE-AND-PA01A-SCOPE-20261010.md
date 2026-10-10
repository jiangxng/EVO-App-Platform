# PA-00 首轮盘点与 PA-01A 实施范围

Document class: HISTORICAL_SNAPSHOT
Date: 2026-10-10
Status: STATIC_AUDIT_COMPLETE / OPERATIONAL_BASELINE_PENDING
Owner: independent Agent line
Code baseline: `301cf0a45e59591adcb6a33e6d30fb68a94db443`

## 阶段结论

完成源代码、已有验收入口和并行冲突范围的首轮盘点。未访问生产数据库/环境变量，未测性能；PA-00整体不能称生产基线已完成。可以先推进不依赖部署变更的PA-01A请求身份修复；PA-02开始数据库写入前仍需完成实际环境绑定、迁移量与恢复基线。

主线已合入#571，#572在检查时是状态交接候选。原建设总纲记录的#569是历史研究快照，不能用它重排当前主线。2D线#563/#566/#568与Eidos#138–140独立推进。

## 已有与缺口

| 范围 | 实际代码证据 | 决定 |
|---|---|---|
| Run绑定 | manager/server.ts: agentRunFile由APP_PLATFORM_AGENT_RUN_FILE或lifecycle同目录派生；有路径则JSONL，否则memory | 已证明主服务构造路径，无Postgres Run选择；部署实际变量不作假设 |
| Receipt绑定 | 同文件agentActionReceiptFile及JSONL/memory构造 | 与Run一并规划，不能只迁Run而遗留写入核验 |
| Conversation | configuredConversationAuthority支持JSONL/镜像/POSTGRES；POSTGRES缺连接失败 | 保留AF-01/02；源默认JSONL不推翻历史生产POSTGRES证据 |
| Run公共端口 | contracts/agent-run.ts中create/append/get/list/events同步返回 | 新持久端口需异步兼容；现有同步接口不能直接塞异步数据库实现 |
| Receipt公共端口 | manager/agent-action-receipt-store.ts同步append/list与全量materialize | 数据库唯一约束、事务和分页需单独设计 |
| 页面上下文 | AgentInteractionContextV010为Record；现有parser作JSON roundtrip与16000字符上限 | 现有入口保留，新增协议通过显式兼容适配 |
| 线程重复请求 | thread-turn-action-handlers.ts按主体/context/thread/clientTurnId寻找Run，只比较message | **实质缺口：同键同文本但不同importJobId仍返回/恢复旧任务** |
| 查询限制 | 重复请求只在limit=100的Run列表中找 | 长期正确性需要存储级唯一键/直接查询，PA-02解决；本次修复不冒称完全幂等 |
| 取消 | Run有CANCELLED；server realtime suffix包含.cancel，但run handler仅start/resume/get/list | 取消事件占位不等于取消执行闭环 |
| 实时 | manager/server.ts发布agent.run RUN_STATE_CHANGED | 复用已有通道；需再核实持久cursor/outbox，不能另起第二套全局事件总线 |
| 导入 | page.ts agent.personal + taskKind及job/target；现有Contextual Agent测试 | 沿已有入口，不新建导入聊天应用 |
| UI | Eidos Chat typed parts，Host与vendor有工作区适配 | UI变更先owner Eidos，禁止整包vendor覆盖 |

## 候选请求到既有结构的映射

| 候选字段 | 既有落点 | 注意 |
|---|---|---|
| requestId | clientTurnId，线程内去重入口 | 未来数据库唯一性同时绑定主体/企业/thread |
| userIntent | values.message / Run.input.message | 文本相同不能证明任务相同 |
| source view/action | interactionContext.source | 来源不授予权限 |
| taskKind | interactionContext.context.taskKind | taskKind不触发任意动态代码 |
| resourceRef | 当前importJobId/targetId等业务引用 | 首期保留旧字段，不强行重写全部插件 |
| resourceRevision | 当前未证明通用版本字段 | 后续提案应用绑定领域版本 |
| principal/tenant | Host requestContext/resolvedContext | 不接受客户端新协议充当身份 |
| structured result | reply messageParts + Run/receipts | 需分开提案与已应用效果，不能解析自然语言刷新 |

## PA-01A：先修复任务身份完整性

在已有thread.send入口解析interactionContext，并在复用旧Run前同时检查message与context。对象键序变化视为同一JSON对象；字段、数组顺序、目标作业变化视为不同输入。校验失败不继续旧Run、不新建任务、不增消息、不额外调用模型。保留既有错误码CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED与无context旧请求兼容。

最小修改：agents/enterprise-agent/thread-turn-action-handlers.ts；tests/integration/p1-7b-thread-backed-turn.test.mjs；Agent线证据。现有P1.7B CI已监听这两个文件，无需修改共享package.json或全局CI配置。没有新增权限，没有WRITE能力扩张。

验收：相同请求复用；JSON键顺序变化复用；同键不同作业拒绝；context增加/删除拒绝；畸形context拒绝；拒绝后Run/消息/provider调用数量不增加。

## PA-01后续与PA-02

PA-01B：统一版本化请求/结果schema和旧入口适配；必须一起处理source刷新/dirty guard与结构化提案。
PA-02A：定义异步Run/Receipt端口及唯一键；先做隔离数据库与恢复证据，不切生产。
PA-02B：租约/fencing/outbox与未知写入核验；PA-02C：真正取消。
最终路径由这些真实约束修订，不能把总纲里的候选接口直接当现成API。

## 并行与验证边界

- manager/server.ts是主线和多插件共享热点：本切片只读。
- 2D crop/CAS与vendor/eidos/src/diagram、workbench shell：避开。
- project.status.json、全局HANDOFF：不改。
- 实际环境/压测/浏览器/生产部署：本次未执行，仍OPEN。
- 性能目标与工期尚待实际实现速度校准；不要把首轮静态盘点耗时当企业化总工期。
