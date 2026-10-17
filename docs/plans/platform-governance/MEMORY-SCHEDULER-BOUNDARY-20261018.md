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
