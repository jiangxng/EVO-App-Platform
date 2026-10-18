# 记忆调度器归属与停止边界

日期：2026-10-18（香港）。基线 main `943a816e1013c2bb9b0b78aaf54e6228401ffce0`。属于 A01；本批实现关闭时的停止/有限等待，不宣称插件启停治理或全平台按需装载完成。未部署，不修改其他窗口 Agent 状态、业务合同或数据。

## 来源与读取范围

本批无新增外网资料。以下为仓库原文，均固定于上述基线；项目判断与实现增量见后文。

| 来源路径 | 阅读情况 | 对本批的约束 |
|---|---|---|
| `.clinerules/01-delivery.md`、`02-project-understanding.md`、`AGENTS.md` | 完整 | 有界交付、保存证据、不扩展到其他窗口 |
| `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` | 完整 | 同一闭环一条分支、CI后合入、清理 |
| `docs/architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md` | 完整，截断部分已分段补读 | interval不是后台资格；未知归属不能擅停保留治理；停止要有限等待 |
| `docs/architecture/MEMORY-OPERATIONS-RETENTION-LEGAL-HOLD-DLP-P1.3-v0.1.md` | 完整 | §4保留治理、§6 DLP、§9调度/租约/显式采集范围；保留immutable Memory和Proposal-only |
| `manager/context-memory-scheduler.ts`、`manager/context-memory-operations.ts`、`providers/context-memory/package.ts` | 完整 | 直接核对任务、租约及能力声明，不以文档代替代码 |
| `manager/server.ts` | 局部：调度配置/构造、各Memory Provider resolver、shutdown | 不声称通读整个Host；核对真实接线 |
| `tests/protocol/context-memory-p1-3-operations.test.mjs` | 查阅既有保留/Legal Hold/DLP/调度测试；本批运行完整文件 | 保持现有语义；测试通过不等于多进程排他证明 |

## 已确认事实

1. 配置 `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS>=60000` 就注册 process 级 interval，没有依据记忆插件状态决定注册/清除。此前四组合审计的最小安装配置组观察到1个interval，未观察到tick执行，不能说当时已发生业务写入。
2. 一个tick混合保留评估、DLP重分类、来源采集。保留评估直接使用Host存储，按已有Memory枚举Context；DLP/source在调用时经过有效Provider与binding解析。来源采集只读显式Context列表，一Context一页100条，进入Proposal管线而非直接接受为Memory。
3. `host-context-memory-provider.default` 提供read/inventory/write/governance服务，但manifest未声明该scheduler的后台生命周期。不能据此把整组调度算作该包已管理的资源。
4. 原shutdown只clearInterval并直接release租约，不等异步DLP/intake结束；scheduler无stop入口。此时释放所有权并不等于业务已结束。
5. 内存租约只约束同实例；文件TTL租约没有心跳续租及写入fence。长tick超过TTL可能与其他实例重叠；读取过期记录到unlink也不是原子CAS。本批没有解决跨进程排他，P1.3“durable TTL lease”不能读作生产多实例唯一执行保证。
6. retention为逻辑过期证据，不物理删除Memory。Legal Hold优先及人类隐私覆盖必须保持；停用读写服务不代表已有数据保留责任自动消失。

## 采用与排除的方案

以下为项目工程判断，不冒充来源原文决定。

| 方案 | 决定 | 条件与限制 |
|---|---|---|
| 整个scheduler随记忆服务停用 | 不直接采用 | 会把存量保留责任和可选采集混同，必须先界定责任 |
| 只因配置interval就永久允许运行所有工作 | 排除为长期设计 | 配置不是插件资格；停用/换binding后在途操作也需明确语义 |
| Host保留存量治理责任，可选DLP/采集由有效Provider及受管生命周期控制 | 目标方向 | 仅必要存量治理可作有记录的Host例外；空数据/无工作不得维持无意义timer；不新增“万能记忆插件” |
| 停止时立刻释放租约/声称强制取消远程写入 | 排除 | Promise未结束、外部结果未知，释放不等于完成 |
| 先阻止新轮次，当前操作有限drain，结束才release | 本批实现 | 不取消已进入的一个DLP批次/一个采集页；超时失败显式，保留pending，不修改真实TTL |

## 本批实现与验证

`createContextMemorySchedulerV010`新增终止性`stop(timeoutMs=5000)`：立即拒绝新tick，不开始下一个Context或采集阶段；当前已开始的DLP/采集操作允许结束并保存原操作证据。租约仍只在tick finally释放。超时抛出明确错误，不提前释放；后续可再次stop等待同一在途Promise，无隐式restart。未停止时保留原去重及并发拒绝行为。

Host清除interval后等待stop；失败记录`Context Memory scheduler shutdown incomplete`并使最终退出码非零，其他资源仍继续清理。停止完成前不把依赖关闭当作该任务已完成。超时后进程最终退出并不等于远端业务撤销；文件租约依旧可能自然过期，必须结合下一步fence合同看待。

新增5项确定性测试：DLP中停止、采集中停止、超时后仍占有内存租约、异步失败释放与报告、空闲/非法期限。现有P1.3测试继续验证Legal Hold、保留事件、DLP失败不写治理、来源范围与游标。真实Host四组合审计覆盖空闲进程关闭；在途关闭用组件受控Promise验证，不冒充真实远端故障或多进程测试。Lightweight CI持续运行新测试。

本地构建、18项定向测试及静态门禁通过（既有边269，无新增）；四组合真实Host均正常退出、零捕获出站。配置调度的最小组仍1个interval，其他组0个，未声称本批减少常驻资源。[本批证据](evidence/memory-scheduler-stop-20261018.json)记录源码hash和运行结果。最终CI/合并标识见本批PR。

## 剩余实施顺序与完成条件

不新增验收大项，仍计入A01。下一批按下列两项依次推进，不再重复归属研究：

1. **工作资格及生命周期接线**：分别计算存量治理、有效DLP、显式来源采集的工作资格；无工作不注册timer；安装/停用/换binding后同步资格，阻止新请求，明确已开始操作drain和失败状态。验证最小空安装零timer、有存量治理仍按政策运行、停用采集不继续开启新页、重新启用和重启保持游标/保留证据。不将UI按钮隐藏算作停止。
2. **文件租约限制收口**：明确单实例适用约束，或采用已有权威存储可提供的续租/fence合同后才宣称多实例安全；不能复制Agent协调器为第二套权威。验证超TTL、并发接管、旧持有者迟到结果与重启。与Agent owner的公共合同交界只作必要对齐，不接管PA05开发。

这两项是剩余具体工作，不保证恰好两个PR。完成后再核对A01原始行为矩阵是否真正收口；其他未覆盖历史资源不能因本批stop通过而宣告合格。整体仍7项、4闭环、3部分。


## 2026-10-18 后续增量：按工作资格管理定时器

实施基线 main `f97b57ceb94719aebaab80b4638ff3bf87678824`（#1009）。上文为首批事实；本节更新定时器资格，不把首批“配置组仍1个interval”当作当前结果。

### 已实现

- `createContextMemoryScheduleDriverV010`只有在调度已配置且`hasWork`为真时注册单个unref interval。空闲时不另起轮询器。每次tick之前重查资格；解析失败清除timer并明确报告，避免让已成功保存的绑定/记忆操作因调度重算而被误报失败。shutdown先dispose驱动，再沿用#1009有限drain。
- Host当前工作资格：有存量Memory，或显式配置采集Context且有效source/evidence Provider匹配sourceId。仅有Context列表、已安装包或环境变量均不足以启动空采集。来源枚举没有跨Context扩展。
- 成功保存Memory、生命周期事件、绑定保存/删除、P1.2 Provider运行时配置刷新后重算资格。首次存入Memory可唤醒治理；停用最后一个有效采集来源可清除空存储Host的timer；重新启用可恢复。沿用原存储、游标及权威操作，没有影子状态和新插件。
- 每个新采集Context之前再查资格；失效时当前已进入的一页允许完成并保留回执/游标，后续Context不开始。此策略不是强制取消，也不是跨进程事务回滚。
- 存量Memory治理是明确的Host保留责任：不随读写Provider停用而丢失。当前仍按既有周期评估存量数据；本批没有进一步按政策截止时间安排唤醒、按批分片或迁移Memory存储。

### 验证与限制

构建及24项定向测试通过（4项驱动/资格测试、2项真实Host启动重启测试、既有18项停止/P1.3测试）。真实Host验证：显式采集Context但无来源/无Memory，首次启动及重启均0 timer；存在合成存量Memory且无记忆Provider安装时为1 timer，原Memory字节语义保持，启动未执行tick/未创建lease文件。动态资格变化、排队callback再检查、解析失败恢复、采集页在途停用由受控组件测试覆盖；**尚未用真实管理员HTTP完成安装/停用/换binding与采集游标的完整联合验收**，不将组件测试冒充这一证据。

[四组合原始摘要与源码hash](evidence/memory-scheduler-demand-20261018.json)：全部0 timer，均347加载模块、96归档文件、正常退出、零捕获出站。相比#1009，配置调度的空最小组从1个timer变为0。Lightweight CI加入对应回归，并将该空最小配置组的零timer作为阻断断言；不以降低模块数代替资源验收。

事件唤醒覆盖本进程的Host受管写入口；直接外部修改共享文件或另一进程写入不触发本进程回调，需重启或后续一致性通知合同。Provider运行时健康变化若没有生命周期/绑定/配置事件，也不是完整事件订阅；不宣称多实例热同步。本批保留原DLP治理规则，尚未为每种远程调用提供资源冻结/代际写入屏障。文件TTL租约没有续租/fence的问题仍在。

下一步：优先补真实管理员HTTP的安装/停用/重新启用、binding切换与在途采集联合验收；结合暴露的问题收口资源停止语义。然后明确文件租约单实例适用边界或使用既有权威合同迁移。上述工作仍属于原A01，不增加新专项，不重做已完成的资源归档和停止修复。整体仍7项、4闭环、3部分。


## 2026-10-18 联合验收增量：真实Host HTTP生命周期与绑定

基线 main `cdf60f6def3a22aef0f792c9ba9461e5ef1d14df`（#1010）。沿用前两批生产实现；本批只增加真实Host回归与CI，不重复修改调度算法、Provider合同或授权规则。

### 可复现入口

`npm run build` 后运行：

`node --test tests/integration/context-memory-scheduler-http.test.mjs`

测试以独立临时文件启动真实`dist/manager/server.js`和本地HTTP Experience Compiler来源。通过真实`/v1/disable`、`/v1/enable`、`/v1/uninstall`、`/v1/install`及`/v1/actions`绑定命令操作；没有直接改生命周期状态来模拟这些动作。初始绑定文件为显式fixture；自动配置安装的现有行为保持。

测试专用preload记录实际scheduler interval，并通过IPC触发其真实callback，以避免每页等待60秒；不把生产周期改小、不替换业务scheduler、不绕过HTTP生命周期或绑定授权。HTTP来源请求真实经过fetch，来源仅允许127.0.0.1。测试源返回合成空页和nextCursor，**不证明含真实记录的Proposal业务审批或外部服务兼容**。生产不加载该preload，无生产测试开关。

### 本批验证结果

| 场景 | 断言 |
|---|---|
| 初始匹配来源/证据及显式Context | 只有一个60000ms timer；真实请求limit=100，首个Context为a |
| 错误绑定管理凭据 | HTTP403，timer保持；不把无关包的历史生命周期鉴权声称为本批修复 |
| 一页HTTP仍挂起时停用来源包 | disable返回后timer为0；页返回后只保存一个成功操作及page:2游标，不发起Context b |
| 停用状态下重启 | timer仍0，page:2游标仍在；配置未强制重新激活已安装但停用的包 |
| 重新启用并触发下一轮 | timer恢复1；Context a携带page:2，随后才请求b；来源结束后游标重置 |
| source切到本地而evidence仍指向EC | timer为0；两者匹配本地后恢复1，采集不再访问HTTP源 |
| 本地来源停用/启用、卸载/重新安装 | timer依次0/1、0/1；不删除既有游标 |
| 完成与退出 | 5条操作均成功，4条按source/Context隔离的游标记录保留；lease文件释放，无durable Memory新增，正常退出 |

该测试并入已有Lightweight Host CI。观察的是两个真实Host进程先后重启，**不是两个并发Host的跨进程排他证明**。失效绑定触发的既有明确诊断是预期行为，不放宽绑定校验或以静默回退另一个来源来通过测试。

上节“尚未用真实管理员HTTP联合验收”的缺口已由以上场景补齐。存量保留/Legal Hold/DLP行为继续由既有P1.3回归覆盖；本批无LLM调用、无UI或部署变化。本地25项定向测试全部通过；[原始输出与测试hash](evidence/memory-scheduler-http-20261018.json)已保存。最终CI与合并标识见本批PR。

### A01下一项

现在转向已经登记的文件租约限制：先将现有实现的单实例适用条件与跨进程风险写成可执行验收，验证超TTL接管及旧持有者迟到；在已有权威合同基础上决定限制部署模式还是迁移。不得把本批正常退出和游标恢复算作多实例安全。整体仍7项、4闭环、3部分；A01收口前还需对照原始范围复核，不能由本批一个回归自动关闭整项。
