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
