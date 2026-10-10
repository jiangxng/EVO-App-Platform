# 独立 Agent 线交接入口

Document class: LIVING_RUNBOOK

更新时间：2026-10-10。用户已授权启动并持续推进Agent线，要求留存进度；常规工程无需逐项确认。不得影响业务主线和2D线。

## 当前状态

- PA-00：首轮静态盘点已完成；实际环境绑定/容量/恢复基线仍待测，不能整体标生产基线PASS。
- PA-01A：首个真实缺陷修复已实现，本地目标测试10/10 PASS；仓库CI待确认。未合并、未部署。
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

先查询#575准确head的仓库CI；失败则修复，再记录真实运行ID。随后PA-01B处理版本化协助请求/结果与现有interactionContext/messageParts的兼容，不把小修复称作整个PA-01完成。PA-02生产迁移前补实际环境与恢复证据。

## 未完成/限制

现有去重只查询100个Run，未解决永久唯一键或多进程幂等。真正取消、数据库Run/receipt、outbox与租约尚未实现。本地使用Node24对12个固定版本真实依赖模块作TS变换后执行原集成测试，不是完整tsc/npm构建；完整构建以仓库CI为准。没有浏览器、真实LLM、生产或数据库验证。

## 边界与主线快照

盘点代码基线 `301cf0a45e59591adcb6a33e6d30fb68a94db443`（#571）；创建#575时main已到 `39109addd721c017cd6276c60ee4b3062ab3f6b7`。不因主线继续前进反复重写研究快照，接续时定向核对差异。

2D #563/#566/#568涉及Agent crop CAS与vendor；本线不改图形写入。独立分支/PR/进度，不修改project.status.json或docs/roadmap/HANDOFF-LATEST.md，不推main、不自行部署/purge/生产迁移。共享契约/模块更改前核查owner和开放PR。

## 新窗口读取顺序

读仓库AI-BOOTSTRAP与当前主线状态（只读），再读本文件、PA-00记录、#575真实代码/检查结果，然后按当前任务读取总纲。不要根据旧聊天重建状态或重复已经通过的工作。
