# PA-02 R01–R10 最终签收审计 — R10 真实计价授权待定（2026-10-15）

**Class:** CURRENT_DELIVERY_SIGNOFF_AUDIT / NOT_SIGNED / NO_PRODUCTION_AUTHORIZATION  
**Current evaluated main:** `03cf2a15bb4c0af35cc4084c785cbe056dbb940b` (#874 main merge；不是永久 HEAD)。  
**Original scope:** [PA-00～PA-06 建设总纲 §25 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，[原始证据总账](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)，[持续进度表](PA02-CURRENT-ACCEPTANCE.md)。

## 原始 R01–R10 的最终分级（仅隔离开发范围）

| 原 R Gate | 独立证据状态 | 不能越过的范围 |
| --- | --- | --- |
| R01 双 Worker | **PASS (isolated PostgreSQL)** #799/#800 | 非生产多地域自动切换 |
| R02 旧 Worker 复活 | **PASS (fencing/lease negative)** #800/#842 | 非全部外部业务回滚 |
| R03 模型失败 | **PASS (durable 3-attempt ceiling)** #845 | 非真实收费供应商可用率 |
| R04 业务 WRITE ACK 丢失 | **PASS (governed SQL Owner + Chromium post-commit simulated ACK loss)** #839/#842/#868，后者 9/9 | 不冒充公网真实 TCP 中断 |
| R05 Outbox 重投 | **PASS (PG Outbox / Eidos / HTTP governed WRITE)** #844/#847/#859/#863 | 非生产 SSE 全域 RPO/RTO |
| R06 事件缺口 | **PASS (authority snapshot recovery)** #844/#847/#859/#865 | 丢失游标不伪造新 Run |
| R07 部分成功后失败 | **PASS (durable Receipt preserved)** #842/#865 | 不支持撤销已提交 SQL 效果 |
| R08 运行中取消 | **PASS (before-write and after-commit, Owner verify)** #842/#863/#865/#868 | 业务事务中真正跨机故障不在本次声称范围 |
| R09 断线重连 | **PASS (real Chromium/HTTP/PG)** #859 5/5、#863 7/7、#865 8/8、#868 9/9 | 测试模型为 localhost loopback |
| **R10 步数/时间/Provider usage** | **PASS (24 slices / 72h / truthful REPORTED or UNAVAILABLE)** #845/#848/#856/#857 | Token 计量不等于货币硬限额 |
| **R10 真实费用预算** | **NOT SIGNED** #869/#870/#872/#874 仅测试专用合成费率/请求 quote/PG 负向证明 | **未验证真实供应商批准价格/所有计费类别/输入与输出界限/供应商费用回执** |

**总判定：`PA-02 = IN_PROGRESS / NOT_DEV_COMPLETE / NOT_PRODUCTION_READY`。** 原 R10 要求费用硬预算，不得通过其他九项的通过率或合成账本将其忽略。生产部署、真实 WRITE 与旧 Human file Provider 迁移不属于本次开发签收，不因本表取得授权。

## 最新四条费用交付与可复核 CI

- [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) merge `bfb3d35883c6f0d112048a359803b2fd492081ff`：PG18 每 Run 原子保留最坏费用、未知不放回、并发不重复；14/14 CI。
- [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) merge `f5c90d21981fb2f5876e27a7940493d77fe4608f`：Host→同一 Worker→模拟 Provider 请求前预留、超限不调用，18/18 CI。
- [#872](https://github.com/jiangxng/EVO-App-Platform/pull/872) merge `b34863eddcaff75e8c5522da5206cf2828dc8ec5`：[PG18 #38651279340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38651279340) 24/24、最终 18/18 工作流，通过全模型请求组装后的**测试专用**可信输入上界过滤。
- [#874](https://github.com/jiangxng/EVO-App-Platform/pull/874) merge `03cf2a15bb4c0af35cc4084c785cbe056dbb940b`：[PG18 #38652026320](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38652026320) 26/26、最终 18/18 工作流；缓存写入额外收费未批准时 `REPORTED` usage 与 `UNKNOWN` monetary ledger 正确区分，保留费用全额。

**这些是同一阶段在不同已合并准确源码上的分层真实 CI 证据，不是假称单次统一最终 main 的所有故障被同时运行。** 每个 PR 源分支已实际核验自动删除；并行 BEX/插件治理 PR 未修改。

## 真实费用门禁的唯一剩余授权集（不替客户自行代签）

| 必须验证的权威事实 | 当前缺口 | 最终进入原 Worker 的准入证明 |
| --- | --- | --- |
| 当前企业实际绑定的 Provider、精确 modelId、API 端点、区域和服务 tier | **未得到有效运行时及合同一致性一手凭证** | Host Provider Registry 绑定快照 + 供应商/模型请求证据 |
| 币种、合同价/有效期/定价版本，含 cached read、cache write、长上下文/附加费 | **未获企业 owner 批准** | Host 版本化批准记录且与实际 Provider 合同逐项一致 |
| 当前完整模型请求的**可计费输入严格上界**、输出上限及账单适用性 | **仅 synthetic quote 通过，真实 Provider 无可信 attestation** | 与实际 Provider 序列化请求相同内容的可信计数/官方适用规则，并证明额外费用上限 |
| 实际调用的 Provider `usage` 与收费费用凭据（含异常/重复调用） | **仅测试 loopback usage，非供应商账单** | 原始返回模型 ID/usage/计费类别 + 供应商账单对账 |
| Run 超额、重复请求、后 ACK 丢失、费用未知的持续拒绝 | **代码 PG/Host 负向已 PASS；缺上列真实口径才不能正向验收** | 完整批准策略绑定后的隔离 Host/PG/HTTP 正向及超限负向 CI |

**在上述证据缺失时的决定：** 不打开真实付费模式、不把任何网站公开广告价硬编码为已批准费率、不将未报告的额外费用当 0、不释放 UNKNOWN 费用，也不为了签收而重写已有持久 Run / Host / Owner。

## 来源分级、权限与下一窗口接续

- GitHub 已合并源码、日志、SHA 为 G-FULL/G-PART/G-LOG/M，确切链接见以上与总账；本轮独立新网页阅读记录见 [完整请求 quote 专项](PA02-R10-ACTUAL-REQUEST-INPUT-QUOTE-20261015.md)，OpenAI 计数接口官方页的相关原文已读，DeepSeek 参数页只读相关段，OpenAI Pricing 分类只看搜索摘要，**均非企业合同批准**。
- 已连接 Railway 只读元数据中可见的服务环境变量名**不足以验证实际 LLM Provider Binding**；值被隐藏，没有读取密钥、生产 Run 数据或实际供应商账单。其他交接档的 14 条外站仍为 H／历史转引，不因为本轮其他 URL 被访问而升格。
- 下个工程窗口若拿到**具体企业授权的价格口径与真实 Provider 签名/原始凭据**，只在原 Host/Worker/PG 账本内以一闭环短分支测试并合并；否则当前阶段维持 `NOT_SIGNED`，不借 PA-03～PA-06 新范围填满缺口。
- **当前 GitHub 工具缺少安全删除任意历史 ref 的直接动作**；历史 `docs/pa02-window-closure-research-handoff-20261014` 与 `docs/pa02-acceptance-branch-reconcile-20261014` 等 ahead=0 仅作为可清理候选，不能宣称已删除。BEX release/open PR 与治理分支归其他 owner；不触碰。项目级 `project.status.json` 与主线 handoff 未修改。

**签收结论：`REVIEWED / R10_APPROVAL_EVIDENCE_REQUIRED / PA02_NOT_SIGNED`。正式 `DEV_COMPLETE` 标记等待 R10 真实计价和费用硬拒绝最终一手验收之后再做，不预先写 PASS。**
