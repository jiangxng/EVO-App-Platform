# 独立 Agent 线交接入口

Document class: LIVING_RUNBOOK

更新时间：2026-10-10。用户已授权启动并持续推进Agent线，要求留存进度；常规工程无需逐项确认。不得影响业务主线和2D线。

## 2026-10-11 换窗入口

请先读 [研究与决策交接入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md)，再按任务读 [详细参考索引](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) 与 [方案比较和缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md)。最新任务为PA-01B2隔离环境真实浏览器验收；下方早期“下一步PA-01B2”是历史检查点。精确代码head未变，未合并/部署。外部链接阅读深度与未归档附件已明确分级，不据旧总纲重启PA-00。

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


## 2026-10-11 新窗口接续：PA-01B2 原生 Chromium 预检

**新增门禁状态：NATIVE_CHROMIUM_HELPER_CI_PASS / FULL_APPHOST_BACKEND_BROWSER_PENDING / NOT_MERGED / NOT_DEPLOYED**。PA-00及PA-01A/B1/B2既有实现不重复启动；下一步仍为隔离环境中完整 App Host + 匹配后端的五组真实浏览器验收。

- 已按准确ref顺序复读本线四份交接文档并只读核查Platform/Eidos main、AI-BOOTSTRAP/LLM/owner和并行PR。Platform main当前为 `653a1646bf4178b5b068b85323189304f89e76fa`；旧Platform生产/continuity快照仍指向较早版本，**没有因此修改或重排TR业务主线**。Agent实现堆叠 #575→#577→#579 和Eidos #142仍开放Draft；文档 #570仍开放。
- 本地基于 #579 的 `contextual-assistance.ts` 严格验证Git blob `38cb45a81691d863d9c6ba79a377fb8c6e9a7699`，在隔离 Chromium `144.0.7559.96` 使用真实DOM/Playwright完成 10/10 helper预检（草稿、来源、终态、普通聊天封装、字段匹配）；它不是完整页面/真实Run验收。
- 新增独立 [Draft PR #638](https://github.com/jiangxng/EVO-App-Platform/pull/638) (`agent/pa01b2-native-chromium-preflight-20261011`)，base为#579实现分支，不碰原实现分支或main。head `793b2fb430fd1e82c52309fd4b705be2301f1cad`。真正GitHub Runner从该head构建后，原生 [Chromium CI run 38095315018](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018) 已 **SUCCESS, 10/10 PASS, Chromium 141.0.7390.37**；完整Job `114339888058` npm ci、build、Playwright、浏览器脚本、artifact上传全部成功。artifact [11685148470](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018/artifacts/11685148470)（report + 屏幕辅助图）。同时对应[Continuity CI 38095314949](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095314949) SUCCESS。**该CI只验证构建产物 helper 与真实原生DOM，不包含真实App Host或真实后端**。
- 固定证据见 [PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md](PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md)。新增PR没有改业务逻辑、vendor整包、项目全局状态或生产环境；原外部14项研究阅读等级仍保持待验证。

### 尚未完成的真实浏览器验收（继续按此顺序）

1. 隔离运行#579以及#577/#575所需的匹配Host后端，使用原生浏览器启动真实Eidos Workbench与已授权导入job；不得访问生产。
2. 干净页严格关联只刷新一次；请求前/等待中草稿保留并显示提示；离开重回同route旧响应不刷新；失败及非成功态不刷新；普通聊天与实际数据导入映射/Recipe二次导入不回归。
3. 保存准确代码heads、浏览器/运行命令、网络请求与真实Run/receipt、断言、截图、失败控制与清理；无此证据不标 `BROWSER_PASS`。
4. 完成后再进入PA-02A异步Run/receipt端口；不得把CI、本预检或Run文字成功升级为业务写入或生产认证。

