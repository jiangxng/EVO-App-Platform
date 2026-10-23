# PA-05 旧窗口恢复与下一窗口接续（2026-10-15）

**Document class:** SESSION_HANDOFF_ENTRY / HISTORICAL_SNAPSHOT（固定快照，后续以 GitHub 当前状态和 `PA05-CERTIFICATION-BASELINE-20261015.md` 为准）  
**负责窗口：** [Agent]；**保存基线：** [main@ad0b4172eb1cf0086d4836b57203a62107ee1323](https://github.com/jiangxng/EVO-App-Platform/commit/ad0b4172eb1cf0086d4836b57203a62107ee1323)（2026-10-15）。  
**研究／PR／CI／方案索引：** [PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md)  
**当前专项工作记录：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md)  
**原安全阻断：** [Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913)，仍 OPEN。  
**全局项目权威：** [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) → `project.status.json` → 生成的 [HANDOFF-LATEST](../roadmap/HANDOFF-LATEST.md) → `LLM.md`。本交接**不替代**全局权威；全局持续记录 TR-01 交易主线，PA-05 是独立并行窗口。

## 1. 能确认的用户明确要求与冻结决定

1. 保持 [Agent] 独立窗口，不代改 BEX/CP-03、2D、Eidos、插件治理；共享 Host 改动必须是同一门禁所需的有界更改。**不碰 `manager/server.ts`、`project.status.json`、生成的全局 handoff**，不推 main，不私自部署或放开生产 WRITE。
2. 对旧聊天研究实行**证据恢复优先**：复用已经保留的原始资料、PR、代码、决策与通过的测试；缺失内容注明，按实际问题定向查，不再从零设计 Agent Runtime、插件 SDK、Receipt/Owner、记忆架构。
3. 按工程闭环而不是 PR 数计算进度：一个有界任务一条短分支/PR，多次提交后准确 HEAD CI、合并 main、确认源分支安全清理；不得为了更多“进度”重复已通过功能。
4. 产品路线由用户指定：**先 PA-04 → PA-05 → PA-06；BEX/CP-03 完成后回到 PA-03 I01–I10 做 Agent 导入真实闭环及联合总结**。BEX 导入界面完成不自动等于 PA-03 完成。
5. PA-02 R10 的**真实货币计价与账单签收**按用户方案 B 暂缓，阻断 [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 保留；首次考虑本地开源模型，仅是尝试方向，具体模型/Tokenizer/硬件/成本未获确认。
6. WRITE 风险始终 **fail closed**：UNKNOWN/REQUESTED 未经独立 Owner 核验不得编造终态或自动重试；Plugin disable/upgrade/uninstall 的安全冻结不能靠一次 `listPending` 检查；不能把同一 PG 数据库的跨 Schema 证明说成跨独立物理数据库、多 Host 全局证明。
7. PA05-05 未通过真实 Provider/身份/Human 与 Agent 端到端验收前不得签收 PA-05；当前 **PA-05 IN_PROGRESS / NOT_SIGNED；生产 material WRITE OFF**。

## 2. 恢复的工程进展（聊天提出 ≠ 合入实现 ≠ 验证范围）

| 工作闭环 | 代码／合并事实（GitHub 已核） | 验证及证明上限 |
| --- | --- | --- |
| PA05-01 / M01 | [#903](https://github.com/jiangxng/EVO-App-Platform/pull/903) 双真实业务 Owner READ parity；[#907](https://github.com/jiangxng/EVO-App-Platform/pull/907) Trading Reference 用兼容新增 Capability 修复命名空间，保留旧 ID | 隔离 READ Human/Agent 同结果、权限拒绝及 Manifest；不是已安装真实用户认证 |
| PA05-02A/B | [#908](https://github.com/jiangxng/EVO-App-Platform/pull/908) 限定 JSON Schema certification fixture；[#910](https://github.com/jiangxng/EVO-App-Platform/pull/910) opt-in READ gateway、执行后权限重检 | 不支持的 Schema fail closed；非完整 Draft 2020-12，默认生产调用链并未全部改走 gateway |
| PA05-03 | [#911](https://github.com/jiangxng/EVO-App-Platform/pull/911) 独立 `evo-purchase-attention` 只读业务插件，复用 Trading Reference Owner 和 Action Host，无 Agent Core 改动 | opt-in 第三业务逻辑/依赖/直接 Human 与 Agent 同效果；未默认安装或接入真实 Provider/Human |
| PA05-04A/B/C | [#912](https://github.com/jiangxng/EVO-App-Platform/pull/912) 真 PG18 沙盒 Owner/receipt；[#915](https://github.com/jiangxng/EVO-App-Platform/pull/915) 同事务冻结；[#917](https://github.com/jiangxng/EVO-App-Platform/pull/917) Host 生命周期入口接线 | UNKNOWN 不盲重放、Owner 核验及竞态保护的隔离证明；尚不足以覆盖所有 Worker/Host 部署 |
| PA05-04D1–D3 | [#918](https://github.com/jiangxng/EVO-App-Platform/pull/918)、[#919](https://github.com/jiangxng/EVO-App-Platform/pull/919)、[#920](https://github.com/jiangxng/EVO-App-Platform/pull/920) | 覆盖所有声明的 Owner、外部安装/启用、启动预冻结与 version pin；不宣称全局分布式 |
| PA05-04D4 | [#923](https://github.com/jiangxng/EVO-App-Platform/pull/923) / `28912c50...` | **真实隔离 PG18 36/36、0 skip**；两个业务 Worker Schema 与单一中央 Owner 行锁；另一 Schema UNKNOWN 拦停用。CI workflow 原始日志含 `PA05_SHARED_SCHEMA_OWNER_PG`。**仅同一数据库** |
| PA05-04D5–D7 | [#924](https://github.com/jiangxng/EVO-App-Platform/pull/924) / [#926](https://github.com/jiangxng/EVO-App-Platform/pull/926) / [#928](https://github.com/jiangxng/EVO-App-Platform/pull/928) | SQL trigger 防旧 Worker 绕过、受限 SQL LOGIN/权限审计、`SESSION_USER` 绑定；真 PG18 38/38 → 40/40 → 40/40。仍为 opt-in |
| PA05-04D8 | [#930](https://github.com/jiangxng/EVO-App-Platform/pull/930) 已合并，main `ad0b4172eb1cf0086d4836b57203a62107ee1323` | **真 PG18 40/40、0 skip；准确 PR HEAD 7/7 workflow success**。原始 Job `38709029820` 有 `PA05_PG_WRITE_STATE_INTEGRITY`，拒绝伪造终态、变更 effect/run/tenant 身份、错误 LOGIN 或附加 DELETE 权限。限单库 opt-in 实验 |

**验收证据分级：** 上表合并状态为本次直接查 GitHub PR/main 的元数据；#923/#930 的关键 PG marker 与 7/7 运行结果为本次读取 GitHub Actions 事实；中间阶段计数来自 [Issue #913 的逐轮维护评论](https://github.com/jiangxng/EVO-App-Platform/issues/913) 和专项已保存基线，并非本次逐条重新运行测试。用户聊天所说的 36/36、40/40 与仓库证据一致；不能上升为已取得真实企业 Provider/生产资格。

## 3. 恢复的方案选择与安全边界

- **已采用并合入：** 一个数据库内部中央 Host Owner 生命周期门禁、受信 Worker Schema 完整 inventory、单事务 SQL 行锁、Host 冻结、SQL 更新完整性和 Worker 身份/最小权限认证。都是明确 opt-in，沿用 PA-02 已有 Owner/receipt，不自建第二套执行器。
- **已排除：** 仅靠停用前查询 pending 的 TOCTOU 检查；各 Schema 各自独立一把锁却宣称共享保护；仅检查 `UPDATE OF state` 的 SQL trigger；允许普通 Worker 声称成功终态；仅根据插件安装/CI 绿灯就生产开放 WRITE。
- **尚未定案：** 多个**相互独立数据库**及未加入同一信任 inventory 的多 Host 的协调模式与权限信任根（中央业务级协调者、共享权威服务或其它方案均未获工程/生产签收）。不同数据库无公共 PostgreSQL 事务，不能复用同库行锁证明充当全球强一致性。需单独设计与失联/脑裂/角色变化的可重放安全验证。
- **其他保留：** 真实 Provider/有凭证 Human→Agent 同结果、租户与 Principal 变动、Owner 实际回执、插件更新/回滚/重启/失联恢复以及生产 Worker 登录权限配置与漂移复核，均未签。

## 4. 仍剩两个主要闭环（不是保证只需两个 PR）

| 主要闭环 | 当前真实状态 | 下一道最小门禁 |
| --- | --- | --- |
| PA05-04D **跨独立数据库／多 Host 全局协调与权限管理**，Issue #913 | **OPEN**；同库跨 Schema/SQL 完整性是子问题已通过 | 先形成跨数据库的故障与权威边界模型，证明未注册 Host、分区、Owner crash/recovery、全局 freeze admission 和无法绕过的身份/ACL；小闭环隔离实证，不启用生产 |
| PA05-05 **真实 Provider、Human/Agent 综合验收** | **NOT_STARTED / NOT_SIGNED**（工程实测以最新基线为准） | 真实身份/资源授权、真实 Provider、两业务直接/Agent 效果、业务 Owner 回执、停用/升级/恢复及真实浏览器验收；签收另获 Human/生产授权 |

其它外部依赖仍开放：PA-02 R10 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879)、PA-04 C01–C06 独立 Human/生产门禁、之后 PA-06 与 BEX 完结后的 PA-03；**当前绝不能把“PA05-04D 工程已通过 SQL 专项”改成 PA05-W06 或整阶段 SIGNED。**

## 5. 并行窗口／交接纪律

- 本次取证时 main `ad0b4172...`；**其他开放 PR** 均属 BEX/CP-03：#929、#909、#878、#860、#846。Agent `pa05` 搜索未见待接续开发分支；本恢复仅使用独立文档分支 `docs/pa05-window-recovery-20261015`。
- 不改 [PA05-CERTIFICATION-BASELINE](PA05-CERTIFICATION-BASELINE-20261015.md) 既有专项历史结论，不改交付快照以外文件的权威状态。需要进入下一工程闭环时，从再次确认的**最新 main**起一条 `agent/pa05-...` 分支。
- **遗失事项明确标记：** 未找到“旧聊天全文”可独立逐句重放的上传附件/完整转录；已恢复的历史私下讨论只得到少量上下文摘要。原始未归档截图、短期 CI artifact、真实 Provider 秘钥/账单、人体验收录像及跨库环境证据均不可恢复或不存在于当前可见来源，**不补造**。
- 关于先前查阅的公开网页：完整来源等级、网址和采用/放弃比较已经有历史 [PA04 源索引](PA04-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md) 与 [PA02 源索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)。这次没有重新访问外站原文，也没有新的公网研究结论。

**继续开发入口：** 先读本入口与[详细恢复索引](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md) → 当前 [PA05 基线](PA05-CERTIFICATION-BASELINE-20261015.md) → #913 的完整要求与讨论 → 最新 main/开放 PR → 针对跨独立数据库安全边界开始新的受限工程闭环。
