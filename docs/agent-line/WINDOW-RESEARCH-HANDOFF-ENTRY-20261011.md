# 独立 Agent 线：换窗交接入口 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT

## 先接住这些结论

本任务是长期企业个人Agent建设，独立于TR业务主线与2D线。完整30章总纲和四仓研究已保存；PA-00静态盘点、PA-01A身份修复、PA-01B1协作契约、PA-01B2页面接入/草稿保护已落代码。后3项对应CI已通过，**未合并、未部署，真实浏览器验收仍待完成**。不要重新从总纲§29的“只做PA-00”开始。

用户要求不把所有功能交给LLM，平台/插件统一接口、确定性执行、权限与真实结果核验；从字段匹配入口验证可复用基础。自动布局等固定业务能力不改成Agent专属功能。授权持续推进与留存进度，不意味着合并或生产操作授权。

## 文档与分支

交接全部在 **EVO-App-Platform / `docs/personal-agent-blueprint-20261010` / PR [#570](https://github.com/jiangxng/EVO-App-Platform/pull/570)**，不在main。请显式使用此ref读取。

1. 本入口：`docs/agent-line/WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md`
2. [详细参考索引](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)：四仓固定来源、14项外部参考、阅读等级、章节用途、CI原始链接与摘要。
3. [方案比较、决策与缺口](WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md)：用户要求、采用/暂缓原因、模块对应、未决事项及浏览器验收表。
4. [持续进度](HANDOFF.md)：实施历史与准确head证据。新进展继续更新此文件，不覆盖其他线handoff。
5. 按任务读[PA-00盘点](PA00-BASELINE-AND-PA01A-SCOPE-20261010.md)与[建设总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，不必全量重读。

实施前只读刷新涉及仓库的AI-BOOTSTRAP/AGENTS/权威边界及当前main与开放PR。原总纲快照不代表最新主线；此整理未接管或重新审计他线。

## 实现精确定位

| 仓库/PR | 实现分支 | 已验证head | PR base |
|---|---|---|---|
| jiangxng/EVO-App-Platform #575 | `agent/pa01a-contextual-turn-identity-20261010` | `f5efab9b110b3e79635c7f904ef7a7d94fd6b137` | `main` |
| jiangxng/EVO-App-Platform #577 | `agent/pa01b-assistance-contract-20261010` | `15f059da4d841e2bc1b6b84b0171bb1be0827797` | `agent/pa01a-contextual-turn-identity-20261010` |
| jiangxng/EVO-App-Platform #579 | `agent/pa01b2-page-assistance-20261010` | `db555162370b3c3c992c7aef88f605f9ebf2d0cd` | `agent/pa01b-assistance-contract-20261010` |
| jiangxng/eidos #142 | `agent/pa01b2-contextual-refresh-20261010` | `f1057a64e26377ecf719c34ea83ff74b9dee9dc9` | `main` |

平台依赖 #575 → #577 → #579；Eidos #142为通用helper owner。不要单独把#579当无依赖补丁合main。2026-10-11核对四项均open Draft，#570为open文档PR。#570/#575当时mergeable=false，具体冲突未诊断；集成前定向核查，交接期间不擅自rebase。

## 验证与下一步

PA-01A本地10/10、旧实现5失败，CI当时返回16项成功；B1完整构建49/49、17项工作流成功；B2平台完整构建63/63、10项工作流成功；Eidos类型检查/构建235/235。精确运行/job与限制见来源索引。CI通过不等于浏览器或生产通过。

**下一步：在隔离环境完成PA-01B2真实浏览器验收**，覆盖干净页成功刷新、已有/等待中草稿保留、离开后重回同route不刷新、失败/非成功结果不刷新、普通聊天与导入字段匹配兼容。使用#579匹配后端，保留准确head和运行证据。原生input/textarea/select之外的富文本dirty不冒称已覆盖。不得为验证直接切生产。

之后再进入PA-02A异步Run/receipt端口与存储唯一性；100条扫描去重、多进程租约/outbox、正式取消与环境恢复基线仍未完成。PA-01整体也还有提案/回执/统一交互验收，B2不代表整包结束。

## 证据可信度与保存边界

外部14项参考为原总纲保留研究摘要；缺失逐页原始阅读记录的标为待验证，不把链接列表当已读原文。优先复用已完成研究，仅对缺失/冲突/动态标准定向查证。改变已确认方案须写新增证据及理由。

不改`project.status.json`、`docs/roadmap/HANDOFF-LATEST.md`、2D/crop或他线交接。共享Host/vendor/server更改先核对owner与并行diff；不整包覆盖vendor、不推main、不合并、不部署、不purge/生产迁移。

代码、文档和测试已在GitHub；原网页完整快照与完整CI日志没有归档（有URL/摘要）；本地临时转译产物无需作为源码接续。真实浏览器/生产/DB恢复证据未产生。详见决策文件§6。
