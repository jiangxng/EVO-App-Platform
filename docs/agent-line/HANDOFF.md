# 独立 Agent 线交接入口

Document class: LIVING_RUNBOOK

更新时间：2026-10-10。用户已授权启动并持续推进Agent线，要求留存进度；常规工程无需逐项确认。不得影响业务主线和2D线。

## 当前状态

- PA-00：首轮静态盘点已完成；实际环境绑定/容量/恢复基线仍待测，不能整体标生产基线PASS。
- PA-01A：首个真实缺陷修复已实现，本地目标测试10/10 PASS；准确head仓库CI 16/16成功。未合并、未部署。
- 规划/进度 PR：[#570](https://github.com/jiangxng/EVO-App-Platform/pull/570)，分支 `docs/personal-agent-blueprint-20261010`。
- 实现 PR：[#575](https://github.com/jiangxng/EVO-App-Platform/pull/575)，分支 `agent/pa01a-contextual-turn-identity-20261010`，当前实现head `f5efab9b110b3e79635c7f904ef7a7d94fd6b137`。

## 本轮完成

1. 核实manager/server.ts实际Run/Receipt构造路径为JSONL或内存；Conversation有独立PostgreSQL authority，不重做AF-01/02。
2. 确认Run/Receipt同步公开端口会影响后续数据库迁移设计；记录已有实时事件通道，避免另起重复系统。
3. 发现同clientTurnId、同文字但不同导入作业会错误复用旧Run；PA-01A已在复用前验证完整interactionContext。
4. 新增6项回归，连同4项旧测试共10/10通过；修改前代码同套测试5项失败，已证明覆盖真实缺口。
5. 实施仅改Agent handler、对应集成测试与专属证据，未改共享Host、2D/vendor、主线状态或部署。

## 资料入口

- [建设总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)：研究快照，不自动成为当前契约。
- [PA-00盘点与PA-01A范围](PA00-BASELINE-AND-PA01A-SCOPE-20261010.md)：代码证据、协议映射、冲突文件、剩余基线。
- [PA-01A实现证据](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01a-contextual-turn-identity-20261010/docs/agent-line/PA01A-CONTEXTUAL-TURN-IDENTITY-20261010.md)：本地测试方式与未覆盖限制。

## 下一步（无需重做研究）

PA-01A、PA-01B1、PA-01B2 已实现并通过对应准确 head CI；最新检查点见文末。下一步为 PA-01B2 隔离环境真实浏览器验收，随后再进入 PA-02；生产迁移前仍需实际环境与恢复证据。

## 未完成/限制

现有去重只查询100个Run，未解决永久唯一键或多进程幂等。真正取消、数据库Run/receipt、outbox与租约尚未实现。本地使用Node24对12个固定版本真实依赖模块作TS变换后执行原集成测试，不是完整tsc/npm构建；完整构建以仓库CI为准。没有浏览器、真实LLM、生产或数据库验证。

## 边界与主线快照

盘点代码基线 `301cf0a45e59591adcb6a33e6d30fb68a94db443`（#571）；创建#575时main已到 `39109addd721c017cd6276c60ee4b3062ab3f6b7`。不因主线继续前进反复重写研究快照，接续时定向核对差异。

2D #563/#566/#568涉及Agent crop CAS与vendor；本线不改图形写入。独立分支/PR/进度，不修改project.status.json或docs/roadmap/HANDOFF-LATEST.md，不推main、不自行部署/purge/生产迁移。共享契约/模块更改前核查owner和开放PR。

## 新窗口读取顺序

读仓库AI-BOOTSTRAP与当前主线状态（只读），再读本文件、PA-00记录、#575真实代码/检查结果，然后按当前任务读取总纲。不要根据旧聊天重建状态或重复已经通过的工作。

## PA-01A仓库验证闭环

准确head `f5efab9b110b3e79635c7f904ef7a7d94fd6b137`，本次返回的16项PR工作流全部SUCCESS。

- [P1.7B完整构建与线程集成测试](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345349)：npm ci及npm run test:conversation-thread:p1-7b步骤均SUCCESS。
- [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345337)：SUCCESS。
- [Project Continuity CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014345295)：SUCCESS。

因此首切片状态为 IMPLEMENTED_CI_PASS_NOT_MERGED_NOT_DEPLOYED；仍不等于完整PA-01或生产验收。实现分支中的静态证据文件原先写CI_PENDING，此处的准确head运行链接为后续验证记录，避免仅为状态文字反复触发实现分支CI。PR#575仍为Draft以明确等待集成，未阻断其他主线。

## PA-01B1最新检查点

PR [#577](https://github.com/jiangxng/EVO-App-Platform/pull/577)，分支 `agent/pa01b-assistance-contract-20261010`，head `15f059da4d841e2bc1b6b84b0171bb1be0827797`，叠加于#575（PR base是PA-01A分支，不是main）。

后端已支持版本化assistanceRequest，沿现有thread.send执行；请求编号与clientTurnId绑定、来源与资源版本随Run保存、send/resume返回assistanceResult。旧入口兼容；重复请求仍比较完整任务身份。Run成功不代表业务写入成功，结果只引用真实receipt IDs。

本地23/23目标集成测试通过（含新增13项），覆盖持久事件重建、调用方修改隔离、版本/身份字段/输入冲突/大小深度等。P1.7B仓库完整构建及49/49测试通过；17项仓库工作流全部SUCCESS。未合并/部署。详细契约：[PA-01B1记录](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b-assistance-contract-20261010/docs/agent-line/PA01B1-ASSISTANCE-CONTRACT-20261010.md)。

下一步PA-01B2：Eidos owner实现页面transport及source匹配/未保存输入保护，之后窄范围vendor消费。当前导入按钮仍走可用旧协议，不声称页面已经切换，也不自动刷新覆盖。不要把后端契约称为整个PA-01完成。

### PA-01B1仓库验证记录

准确head `15f059da4d841e2bc1b6b84b0171bb1be0827797`：[P1.7B运行38014789592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014789592)，job114102554558的npm ci、tsc构建和测试均SUCCESS，49 tests /49 pass /0 fail。共返回17项工作流，17项全部SUCCESS，包含[Platform CI 38014789600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38014789600)。未测试浏览器和生产。

PA-01B2接入前需注意：旧基线Eidos源文件与Platform vendor存在既有差异，已查询的upstream page-controller/workbench shell未找到对应interactionContext/refreshSourceOnComplete文本；personal-agent-thread-chat读取未获得可用源码。先比较真实Host/vendor实现与upstream owner，不整包覆盖或凭名称假定两仓同步。

## PA-01B2 最新检查点（2026-10-10）

状态：IMPLEMENTED_CI_PASS_BROWSER_PENDING_NOT_MERGED_NOT_DEPLOYED。

- 平台 PR [#579](https://github.com/jiangxng/EVO-App-Platform/pull/579)，分支 `agent/pa01b2-page-assistance-20261010`，准确 head `db555162370b3c3c992c7aef88f605f9ebf2d0cd`，base 为 #577 分支。依赖顺序 #575 → #577 → #579，不应直接把 #579 单独合入主线。
- Eidos owner PR [#142](https://github.com/jiangxng/eidos/pull/142)，分支 `agent/pa01b2-contextual-refresh-20261010`，准确 head `f1057a64e26377ecf719c34ea83ff74b9dee9dc9`。两仓均 Draft。
- 已接入页面按钮→侧栏→版本化 assistanceRequest→真实 thread transport→assistanceResult 返回链路。requestId 使用 UUID，复用线程发送身份；不混发旧 interactionContext，不静默降级丢失上下文。
- 仅请求、来源、任务、Run、终态和当前挂载实例全部匹配，且无未保存原生表单修改时刷新。已有或等待期间的修改保留；离开后重进同一路径、失败/取消/暂停/旧结果均不刷新。按钮等待期间禁用，异常恢复。
- 通用 helper 在 Eidos owner 实现，平台 narrow vendor 消费。既有 Host transport 上下游差异未整包覆盖，2D/crop 未改。

### 精确提交验证

- 平台 [P1.7C 38015600526](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015600526)：npm ci、完整 tsc 构建成功，63 tests /63 pass /0 fail（含本地 23 项 transport/guard 测试）。
- 平台准确 head 返回的 10 项工作流全部 SUCCESS，包括 [Platform CI 38015600547](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015600547)、跨项目 CI、P1.8A/P1.8C 和 Continuity CI。
- Eidos [release-check 38015597223](https://github.com/jiangxng/eidos/actions/runs/38015597223)：完整类型检查/构建与 235 tests /235 pass /0 fail。首次 CI 发现日文/繁体文案缺 key，已补齐四种语言并重新通过。
- 上述 Node/CI 证据不等于真实浏览器验收。未访问生产、未执行真实 LLM 或数据写入、未合并/部署。

### 下一步（先补验收，不重做研究）

在隔离测试环境使用此堆叠分支及匹配后端做真实浏览器检查：①干净来源页成功刷新；②已有/等待中修改保持；③离开后回到同一路径不刷新；④失败不刷新；⑤普通聊天与导入字段匹配回归。确认真实业务写入凭证与 Run 成功不是同一概念。

当前 dirty 保护范围为原生 input/textarea/select，测试用 DOM 替身；自定义富文本/画布需要显式 dirty 接口，不能称为已全面保护。程序保存未重挂载时可能保守阻止刷新。后续再进入 PA-02 Run/receipt 异步端口与持久化设计，不跳过环境/恢复基线。

平台实施说明：[PA01B2](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b2-page-assistance-20261010/docs/agent-line/PA01B2-PAGE-ASSISTANCE-20261010.md)。本文件为持续状态入口，实施说明中的初始 CI_PENDING 以此处准确 head 证据为准，避免仅改状态反复跑实现 CI。
