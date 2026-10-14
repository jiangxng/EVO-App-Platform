# PA-02 本窗口研究资料与决策：简短接续入口（2026-10-14）

**Document class:** HISTORICAL_SNAPSHOT / SESSION_RESEARCH_HANDOFF  
**Repository:** [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)  
**准确内容基线（本窗口工作结束后的 `main`）:** `e4ce338e483af9b6ad17ea811ad6b052cbffafeb`（PR [#832](https://github.com/jiangxng/EVO-App-Platform/pull/832)）  
**下一窗口有效开发分支:** `main`；不是旧 `agent/*` 分支。先读取 GitHub 当前 HEAD；本交接包经过文档 PR 合并后，`main` SHA 应较上述业务基线更新。交接文档的合并 PR 是本轮交接的唯一新开发分支，合并后应清理。

**详细文件（别在入口重复读全文）：**
- [本窗口资料来源／浏览级别／截图附件与证据索引](WINDOW-RESEARCH-SOURCE-INDEX-20261014.md)
- [研究结论／方案比较／排除路线／冲突与未决门禁](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md)
- [项目级开发交付规则](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)；[Agent 补充约定](AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md)
- [PA-02 历史阶段门禁快照（**2026-10-13 的历史状态，非最新完成清单**）](PA02-STAGE-GATES-SNAPSHOT-20261013.md)
- [PA-02B 2026-10-14 实施增量及生产限制](PA02B-GOVERNED-OWNER-WRITE-HANDOFF-20261014.md)

## 1. 本轮目的和用户明确要求

用户要求不要长时间在 PA-02 原地重复劳动；基于已验证的代码/公共契约直接推进到**真正可用**。不要为每个细节开独立分支，也不应让一个巨大功能阶段永远占据一个不合并的 PR。采用“**一个可验证交付闭环 = 一条短期活动分支 + 一个 PR + 同分支多次提交/修复 → 必需 CI → 及时合并 main → 证据核验 + 删除分支**”。一个大阶段可以依次完成多个闭环。其他窗口可能并行，不能覆盖其他 owner 的文件、不能更改全局项目权威状态，不能为求快绕过安全门禁、随意在生产启用 Agent WRITE 或自行部署。

本次用户额外指定：**保存本窗口已经实际查阅的资料及其阅读等级；优先保留网络研究遗产；不要把历史来源升级为亲自阅读；使用项目既有文档分类、分开短入口和详细索引；GitHub 保存并给出新窗口可复制指令。**

## 2. 当前可持续复用、不要重做的成果

| 闭环 | 已合并 PR → merge SHA | 已闭合的局部能力；不是完整 PA-02 验收 |
| --- | --- | --- |
| 项目治理 + Host READ | [#823](https://github.com/jiangxng/EVO-App-Platform/pull/823) → `11a43553`；[#816](https://github.com/jiangxng/EVO-App-Platform/pull/816) → `73f5ed57` | 项目级开发规则；保留主线 Thread/Host 契约，接入可选 PostgreSQL 持久 READ Run |
| Owner WRITE 失联恢复 | [#825](https://github.com/jiangxng/EVO-App-Platform/pull/825) → `f120ea1a` | PostgreSQL 沙盒真实业务写入、应答丢失、UNKNOWN 隔离、Owner 查询结果与不可盲重发 |
| Worker WRITE/Run | [#828](https://github.com/jiangxng/EVO-App-Platform/pull/828) → `2baa389c` | 可选可信 Owner port，正式 Fenced Worker 与持久 Run 观察/回执索引连通，默认 READ-only |
| Host 插件授权注册 | [#829](https://github.com/jiangxng/EVO-App-Platform/pull/829) → `8f200333` | 当前 Capability Operation / AI 身份 / 企业 Context / INPUT 业务记录重新授权，失效即拒绝 |
| 真实领域 Owner 预览 | [#832](https://github.com/jiangxng/EVO-App-Platform/pull/832) → `e4ce338e` | 真实 Object Extension 仓库、资源文件事务保存业务定义+证据、重开核验、拒绝重复和跨身份伪证；仅单进程预览 |

**证据边界：** #832 合并前最后专项日志 [Actions run 38503765340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38503765340) 确证**9/9 测试通过**；最终 PR head 的 4/4 检查均通过（详见来源索引）。该运行不代表生产业务 WRITE 或多进程原子性。

## 3. 当前准确的未闭合门禁

PA-02 仍是 **`IN_PROGRESS / NOT_PRODUCTION_READY`**。真实业务插件适配的当前实现 `apps/object-extension/agent-owner-preview.ts` 显式要求 `singleProcessDevelopmentOnly: true`；`providers/enterprise-context/resources.ts` 只是**进程内事务 + 文件临时写后 rename**，没有多进程原子 CAS / 互斥及完整宕机一致性证据。该预览**没有注册进 `manager/server.ts`**，生产 WRITE 仍关闭。不可把普通 Object Extension UPSERT 或 Data Import COMMIT 通过声明式 `writeSafety: HOST_REQUIRED` 就当成已支持可靠多节点写入。

**下一项最有价值的研发闭环：** 在既有 Object Extension Owner / 企业资源存储的正确 owner 边界内，设计并证明**跨进程共享、同事务提交领域业务事实与不可变 Owner 幂等证据**（真实两个或更多 Worker，抢占、断连、重启、ACK 丢失、冲突键、错企业/主体与取消）。先核 owner 与事务后端选型，不创建另一个通用 Agent 存储；完成后再考虑 Host 可选注册、实际 User 操作体验。具体取舍见[决策与未决门禁](WINDOW-RESEARCH-DECISIONS-GAPS-20261014.md)。

## 4. 来源使用边界与交接动作

- **本窗口没有通过公共 Web 搜索逐页打开任何外部技术文章。** 14 条外部网页来自仓库 [2026-10-13 历史来源索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md#3-外部网络资料仅继承已有14条全部h--待逐页核验)，在本包全部标为“历史转引／待原文核验”，不凭历史摘要伪称已读。
- 本窗口**实际读取**的是 GitHub connector 返回的仓库源码、文档、PR 与 CI 断言/日志；阅读等级与固定原址逐条见详细索引。没有在本窗口生成截图或下载临时附件。GitHub Actions 日志可能随保留策略失效，关键断言应以已合并测试文件与本包短摘要复现。
- 另一个窗口 BEX/治理/项目导览会推进 `main`。新的开发必须先查看现行 `AI-BOOTSTRAP.md` → `project.status.json` → `LLM.md`，再读本入口、资料索引、决策文档并核对 PR/分支/CI。全局 `project.status.json` 与 `docs/roadmap/HANDOFF-LATEST.md` 本交接不作变更。
- 本入口是**2026-10-14 历史快照**。若未来实际实现与本文冲突，以最新 `main`、项目权威和有效测试证据为准；不要回头覆盖旧快照，也不把文档提交冒充功能进度。
