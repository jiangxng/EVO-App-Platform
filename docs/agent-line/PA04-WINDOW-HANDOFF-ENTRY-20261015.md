# PA-04 → PA-05 新聊天研究与决策交接：简短入口（2026-10-15）

**Document class:** SESSION_HANDOFF_ENTRY / HISTORICAL_SNAPSHOT  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**本包编制主线（固定快照）：** `main@615fbf3f7d79e2155245b313b0767bbbcaacb9a3`，[#901](https://github.com/jiangxng/EVO-App-Platform/pull/901) 已合并。**该 SHA 不是本交接 PR 合并后的 HEAD，更不是未来最新 main**。  
**编写分支（短期）：** `docs/pa04-window-research-decision-handoff-20261015`，PR 合并后应自动删除；下个窗口**从最新 main 开新分支**，不要恢复历史交接分支。  
**详细研究与网址索引：** [PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)  
**正式验收材料：** [PA04-C01-C06-CONVERGENCE.md](PA04-C01-C06-CONVERGENCE.md)／[PA04-C01-C06-READINESS-LEDGER.json](PA04-C01-C06-READINESS-LEDGER.json)／[PA04-CURRENT-ACCEPTANCE.md](PA04-CURRENT-ACCEPTANCE.md)。  
**原始工作包权威：** [Personal Agent Construction Blueprint](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) §15、§19、§21、§22.1、§26.2；[交付规则](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。

## 1. 用户明确要求与阶段决定

- **顺序由用户确定：先 PA-04 → PA-05 → PA-06；等 BEX/CP-03 对象导入开发线完成，再回到 PA-03 I01–I10，并联合四阶段作最后总结/验收收敛。** PA-03 原计划就是“Agent 参与的导入端到端”（精确匹配→Recipe→建议→采用→预检→提交→学习），**不等于** BEX 字段映射/导入 UI 已完成；两线相关但验收责任独立。
- PA-02 技术阶段先封存复用；R10 真实**货币**费用审核依用户方案 B 暂缓，绝不据此豁免。实际状态：[#879](https://github.com/jiangxng/EVO-App-Platform/issues/879) OPEN；`R10 NOT_SIGNED`；PA-02 仍 `IN_PROGRESS / NOT_DEV_COMPLETE / NOT_PRODUCTION_READY`。首次上线**尝试本地开源模型**，但模型、硬件、Tokenizer、性能/成本和生产批准都尚未确定；本地运行并非零成本。
- 不与另一窗口争改 BEX、CP-03、2D、Eidos 或插件治理；不擅改 `manager/server.ts`、`project.status.json`、项目全局 `HANDOFF-LATEST.md`。以独立功能闭环、短 branch+PR、准确 HEAD CI、合并 main、确认分支删除为交付原则；不得未经授权部署或启用生产 WRITE。
- 用户要求新窗口**直接接续已研究的决策资产**，不重做已验证实现，不靠聊天记忆猜阶段状态，也不能把隔离测试通过写成真实用户/上线签收。

## 2. 本窗口已完成的 PA-04 工程闭环（全部已合并）

| PR | 交付的确定性内容 | 明确未证明的事项 |
| --- | --- | --- |
| [#889](https://github.com/jiangxng/EVO-App-Platform/pull/889) | C02 源消息完整序列 + 摘要 SHA-256 内容指纹，遮蔽/同数替换不得复用旧摘要 | 原文删改与所有索引传播 |
| [#891](https://github.com/jiangxng/EVO-App-Platform/pull/891) | C01 完整模型请求 Token 上界及输出预留的调用前拒绝 | 真正本地模型 tokenizer/模板认证 |
| [#892](https://github.com/jiangxng/EVO-App-Platform/pull/892) | C01 受控移除较旧普通对话；保留当前指令、Host 权限/工具、近四条对话及原始持久 Run | 藏于很早聊天中的决定尚未自动提升为可信 Working State |
| [#893](https://github.com/jiangxng/EVO-App-Platform/pull/893) | C02 PostgreSQL18/内存按源撤销，清理派生摘要/检查点，tombstone 防旧 Worker 复活 | 原消息、Memory、EC、附件、备份的合法完整删除链 |
| [#895](https://github.com/jiangxng/EVO-App-Platform/pull/895) | C03 可选 Host 源版本核验、旧 READ 重新调用、持久 refresh/audit，失权或未知时阻断 | 实际业务插件资源版本与授权接线 |
| [#897](https://github.com/jiangxng/EVO-App-Platform/pull/897) | C06 Memory 搜索/回忆/清单/审计响应前，按用户与来源授权拦截标题/正文/引用/URL | 历史回答展示、真实下载、所有资源来源授权 |
| [#898](https://github.com/jiangxng/EVO-App-Platform/pull/898) | C04 Memory Proposal Human-only 审核下沉服务；人工纠正、supersession、审计 | 实际 Human UI 与企业事实 Owner 真相验收 |
| [#900](https://github.com/jiangxng/EVO-App-Platform/pull/900) | C05 文档/READ 数据标记低信任；可选 Host 逐工具/目标审批；注入外发被阻断 | 正式网络出口/重定向/业务插件安全接线 |
| [#901](https://github.com/jiangxng/EVO-App-Platform/pull/901) | C01–C06 统一证据、签收台账和 PostgreSQL18 同环境回归 **42/42，0 fail**；最终 **5/5 CI** | 六项均未完整真实环境签收；本次是回归证据汇合 |

**可靠阶段结论：PA-04 的独立工程收敛已完成；但 C01–C06 共六项全部仍有实际环境门禁，`PA-04 IN_PROGRESS / NOT_SIGNED`。** 不以 9 个 PR 或 42/42 测试冒充完成率或上线批准。#901 合并提交 `615fbf3f7d79e2155245b313b0767bbbcaacb9a3`；专项综合 CI [run 38673188190](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38673188190)；九个短分支均已在合并后确认退休。

## 3. 来源真实性声明（换窗必须保留）

**本窗口直接阅读与核对的资料为 GitHub 仓库文档、源码、PR/Issue、GitHub Actions 原始日志/元数据。** 具体可复核的稳定 SHA、各资料原始 URL、日期、阅读等级及章节见[详细索引](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)。

原总纲 §30.3 的 Anthropic、Microsoft、AG-UI、A2UI、A2A、MCP、Temporal、W3C、OpenTelemetry、OWASP 等原始官网 URL **本窗口没有直接访问**；只是阅读了项目总纲对其的转引。前窗口 R10 手册声称访问过部分 OpenAI/DeepSeek 文档，**那是历史来源等级，不是本窗口的新访问**。不要补造“今天已读全文”的事实，也不要将设计推导当官网结论。

本窗口**没有新制网络截图、未上传本地研究附件**。GitHub Actions 中的文字/短期 artifact、测试样例、权限/账单证据须依原 URL 重查，不能想象永久有效。详见详细索引中「容易变化或不可重取的资料」。

## 4. 下个窗口的第一批任务：PA-05

1. 先按 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 指引核对最新 `main`、所有开放 PR、分支与全局 authority；先读本入口、详细索引和 PA-04 真实验收台账。**编制快照时开放 PR 仅 BEX #846/#860/#878/#899**（此事实随时间变化）。
2. 从原总纲 §21.1–21.3、§26.2 原文确认 PA-05 目标：**插件 SDK/认证夹具、第二个业务插件、跨业务效果一致**；新插件应无需修改 Agent 核心。交易与 2D 仅在已认证能力范围内逐步接入。不把 PA-05 错误理解成 PA-03 导入或 PA-06 企业发布。
3. 盘点现有 plugin manifest / capability catalog / Host Tool Owner / Agent Tool Catalog / Eidos / EC 契约和已有认证用例，明确哪些已实现、哪些缺“直接操作与 Agent 操作效果一致”“授权/幂等/版本/停用恢复”。**只做增量**，先给第二业务插件候选与最小独立验收范围；不要凭空重造 SDK、Run 执行器或插件目录。
4. 一旦选择实际代码改动，从**新的 main**建一个独立 `agent/pa05-...` 短分支、一个 PR，重合文件先与其他 owner 协调；通过相关 CI 后合并删分支。PA-04 真实环境待验项保留清单，不能被 PA-05 测试顺手写成 PASS。
5. PA-05 后做 PA-06；末尾等待 BEX 并联核对 PA-03 的 Agent 端到端 I01–I10，再整体签收。保持 PA-02 R10 OPEN，除非真实费用准入事实出现。

## 5. 保存边界

本入口和详细索引是 **HISTORICAL_SNAPSHOT**；原 `PA04-CURRENT-ACCEPTANCE.md`／C01–C06 ledger 为动态执行事实，不能因换窗而变更 authority。本次交接只新增两份 `docs/agent-line/` 文档。编制时未保存的生产截图、业务 Provider 认证、Human 签收及外站实际阅读原文均**不存在本次新交付**，不得补写为已保存。
