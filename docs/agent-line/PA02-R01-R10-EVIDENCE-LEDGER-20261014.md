# PA-02 R01–R10 最终证据总账（未签收；2026-10-14）

**Class:** CURRENT_EVIDENCE_LEDGER / NOT_MILESTONE_SIGNOFF  
**Initial evaluated main:** `996cb2de2e63a657438adfa12aba05044e70fed0`（[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865)）。每次接续须重新查 `main` / CI /开放 PR，此 SHA 是本次审计快照而非永久 HEAD。  
**原始范围唯一锚点：** [个人 Agent 建设总纲 §25 的 R01–R10](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)；实施边界遵循 [交付规范](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。  
**结论：** 既有各项工程闭环为已合并隔离开发证据；**R10 硬货币费用预算没有验收，不得宣布 PA-02 DEV_COMPLETE / PRODUCTION_READY / DEPLOYED**。生产 WRITE 未获授权，不在本总账隐式启用。

## 原始十项与真实证据分级

| 原始 Gate | 已合并的一手源码/CI/负向证据 | 现时结论与不可偷换的限制 |
| --- | --- | --- |
| **R01 双 Worker 领取** | [#800](https://github.com/jiangxng/EVO-App-Platform/pull/800) [PG18 38347246849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38347246849)：24 个 lease 竞争仅 1 有效持有者；另 [#799](https://github.com/jiangxng/EVO-App-Platform/pull/799) [38346000622](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38346000622) 独立 Node SIGKILL 恢复 | **通过（隔离 DB 及其后 Host 构件分层证据）**；未做生产多节点 RPO/RTO，不以实验性 Coordinator 证明生产切换 |
| **R02 旧 Worker 复活** | [#800](https://github.com/jiangxng/EVO-App-Platform/pull/800) 旧 fence 拒绝 renew/start/complete；[#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) [38515066568](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38515066568) 正式 Host 原子取消、旧 worker 失租拒绝 | **通过（隔离负向）**；不能把旧 worker SQL fence 当外部系统回滚 |
| **R03 模型失败** | [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845) [38518119905](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38518119905) 15/15；连续第 3 次封顶，未发生假成功；失败次数持久不随重连归零 | **通过（持久模型负向）**；mock/Provider 异常回归非真实供应商 SLA |
| **R04 外部写响应丢失** | [#839](https://github.com/jiangxng/EVO-App-Platform/pull/839) [38511466369](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38511466369) 13/13，真实 PostgreSQL Owner 业务提交后 ACK 丢失，经独立不可变证据复核且不重试业务执行；[#842](https://github.com/jiangxng/EVO-App-Platform/pull/842) 与取消原子协调 | **隔离 Node/Host Owner 证明通过；“同浏览器会话 + ACK 真丢 + 旧 fence/取消”复合门禁仍未直接执行**。#865 的浏览器断开发生在 Owner 已向 Host 返回之后，不能冒充 Owner→Host ACK 丢失 |
| **R05 Outbox 重投** | [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844) [38516903528](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516903528) PG 同事务 Outbox 5/5；[#847](https://github.com/jiangxng/EVO-App-Platform/pull/847) Eidos 去重；[#859](https://github.com/jiangxng/EVO-App-Platform/pull/859) 浏览器 READ；[#863](https://github.com/jiangxng/EVO-App-Platform/pull/863) [38548975998](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975998) 真实 Owner SQL WRITE 7/7 | **通过（DB/消费/实际浏览器分层）**：同 Run 重复 eventId/Outbox 读不重复业务 WRITE |
| **R06 事件缺口** | #844 PG 缺口后授权 Run 快照；#847 Eidos 有界消费/缺口 fail-safe；[#859](https://github.com/jiangxng/EVO-App-Platform/pull/859) [38545777724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38545777724) READ 恢复；[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) [38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829) 写入后取消仍保留回执的缺口快照 | **通过（隔离真实 HTTP + PostgreSQL/Workbench）**；异常游标走权威快照，不生成第二 Run |
| **R07 部分成功后失败** | #842 [38515066568](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38515066568) 不可逆 Owner 效果 + 取消事件保留；[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) [38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829) 浏览器在后续模型回复前断线，已提交效果与 receipt 最终可见 | **通过（已有业务提交后续中断的真实隔离浏览器）**；不是 SQL 事务内任意部分业务可撤销 |
| **R08 运行中取消** | #842 原子取消：在途业务结果核验/旧 fence/回执保留；#863 [38548975998](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38548975998) 未来 WRITE 前取消不落库；#865 [38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829) **业务已提交**后取消，Run=CANCELLED 仍含真实 Receipt | **通过（受控非生产 Host/Chromium/PG 组合的已发生/未发生两侧）**；未直接模拟浏览器与数据库事务内部同步竞争 |
| **R09 断流重连** | #859 READ-only Chromium/PG 5/5；#863 governed SQL Owner 7/7；[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) **最终 HEAD `48b8c122fbdc8087db6d91961802a11e99831706`** [CI 38549835829](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38549835829) 8/8；同 Run 浏览器断线、后取消、重复/缺口/刷新无业务重发 | **通过（明确的浏览器断线和非生产业务 Owner）**；它不替代 R04 的 Owner→Host ACK 丢失独立证据 |
| **R10 预算耗尽/循环** | #845 24 persistent slices、3 次连续模型失败；[#848](https://github.com/jiangxng/EVO-App-Platform/pull/848) [38532998079](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38532998079) 72h 持久截止；[#856](https://github.com/jiangxng/EVO-App-Platform/pull/856) 持久 Provider usage；[#857](https://github.com/jiangxng/EVO-App-Platform/pull/857) 缺 usage 必须 `UNAVAILABLE`，绝不伪造 0 | **步骤/时间/usage 真实性已实现并局部验过，但原 R10“费用”硬预算未实现，** `NOT_SIGNED`。没有经授权的已绑定供应商/模型费率版本、确定上限的最坏情况预留、持久结算/超限阻断，不准虚构价格或声称完整预算可用 |

## 当前唯一影响最终签收的实质缺口

1. **R10 货币费用硬限额（阻塞阶段签收）：** 只能从已绑定且 Host 批准的 Provider/model、真实 usage、带计价版本与币种的价格契约出发，建数据库持久账、每次模型调用**之前**的原子最坏情况预留及剩余额度硬拒绝；实际缺失/畸形 usage 必须显式 UNKNOWN/fail-closed，不能作为 0 元。若模型的输入输出可计费上界不能由可信 Provider 契约验证，拒绝金钱预算下的下一次付费调用，而不是仅事后预警。价格不能引用未批准的公共广告费率。
2. **高保真跨层故障证据（独立风险，不可假称已测）：** #839/#842 在真正业务 Owner 层验证了 SQL 已提交但 ACK 丢失与取消/Fencing 原子修复；#865 验证了同一浏览器已提交业务后断线/取消。**没有在同一 Chromium/Host Run 的同一次故障中实际切断 Owner→Host 的提交 ACK 并同时制造旧 Worker 失租**。如最终验收标准要求此更严联合场景，则作为额外完整门禁保留 OPEN；绝不为追求绿色放松 Owner Authorizer。
3. **最终证据审查/签收：** 本总账是不同准确提交/运行的证据整合，不是“同一最终 HEAD 全部重新实测”；完成费用与任何补验收后，核最新 main、相关 CI、历史迁移/生产限制，才记录 `DEV_COMPLETE`。生产部署、业务数据迁移、WRITE 开启需要单独授权。

## 研究来源与持续维护边界

- 既有 GitHub 项目源码/PR/Actions 阅读与历史外部 14 链，沿用 [PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md) 的阅读等级；**本轮没有打开那些 14 个网站**，所以仍为 **H / 历史转引**，不是已读原文。没有补造新外站查阅日期。
- 在 `docs/agent-line/PA02-CURRENT-ACCEPTANCE.md` 维护项目/状态/剩余验收固定进度；已合并历史 PR 的初版 `CI_PENDING` 文字只是创建当时的快照，不优先于最终合并 SHA/Job 日志。
- 过程分支：[#859](https://github.com/jiangxng/EVO-App-Platform/pull/859)、[#863](https://github.com/jiangxng/EVO-App-Platform/pull/863)、[#865](https://github.com/jiangxng/EVO-App-Platform/pull/865) 的 `agent/*` 源 ref 合并后自动删除。历史 docs/治理 branch 有 ahead=0 但 GitHub 工具缺少删除 ref；发布使用的 BEX release branch 与 BEX owner 的独有提交分支不能清理。禁止通过强制修改 ref 冒充删除。
- **无生产部署、无生产 WRITE、未修改** `project.status.json`、生成的全局 `HANDOFF-LATEST.md`、BEX/2D/插件治理 owner 的文件，未提前纳入 PA-03～PA-06。


## 2026-10-14：后续精确增量证据（不回写历史当时结论）

- **R04/R08/R09 额外复合场景已合并：** [#868](https://github.com/jiangxng/EVO-App-Platform/pull/868) 最终 HEAD `9d0f6d6e1bb7c743e6da6d502c40ab8a71e71f4c`，main merge `d72c14856e391a7e6a077c93af57df5f8eae8b9a`，[Chromium + real HTTP Host + PostgreSQL18 Owner 38551397649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38551397649) 9/9 PASS。受控 test-only 包装器在 **SQL business + immutable Owner 事务真实提交之后** 丢弃向 Host 的业务 ACK；浏览器同 Run reload、调用正式取消、恢复后的权威快照保留一份已发生业务 Receipt，无盲重复 WRITE。业务网络 TCP 真断路与生产不在本层证据范围，详见 [R04 专项](PA02-R04-OWNER-ACK-LOSS-CHROMIUM-20261014.md)。此前“没有在浏览器模拟 Owner ACK 真丢”的限制只对本增量以前有效；**旧 Worker 独立进程 SIGKILL 与浏览器同故障**仍未直接复合证明。
- **R10 独立 PostgreSQL 货币预留原语：** [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) 首轮代码 HEAD `c8651aa5ff60b07f14c6c96c84364d9df0f68754`，[真实 PG18 Agent worker CI 38552517889](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38552517889) 3 项新测试全部通过。范围严格为合成测试费率下的原子最大费用预留、并发单赢家、重启未知保留/额度超限拒绝、版本漂移、缺少定价 fail-closed。**尚未接入正式 Host/Worker 真实推理调用，不是实际供应商收费账单或金额硬限额**；最终 HEAD CI 与 PR 合并另核。来源及限制见 [R10 专项](PA02-R10-MONETARY-RESERVATION-PROOF-20261014.md)。
- **阶段状态不变：** R10 仍 `NOT_SIGNED`，PA-02 仍 `IN_PROGRESS`；未获批准的真实模型上界、计价口径和生产 WRITE 授权不能由测试中杜撰。历史 14 条外站 H 级转引不提升。


## 2026-10-14：#869 合并与 #870 Host 实际调用前费用预留接线（不等于真实供应商硬预算）

- [#869](https://github.com/jiangxng/EVO-App-Platform/pull/869) 最终 HEAD `ea650242960fb6a0f44b700344a3c7660e0861c5` 的 14/14 CI SUCCESS，合并 `bfb3d35883c6f0d112048a359803b2fd492081ff`，并核对删除源 Agent 分支；PG18 合成费率原子预留服务构件已成为 main 中可复用基础。
- [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) **首次源码 HEAD** `4138ef7dc4d6380bf9fea9bd0bb4d15bf99013cf` [Host+PG18 Actions 38553690645](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38553690645) Worker 23/23，18/18 工作流 SUCCESS。既有 Host→Fenced Worker→真实 Provider **模拟**的模型调用前执行数据库原子预留，预算不足则 Provider 只调用一次，Host 重启仍不能发第二次。失去 usage 或 provider 异常进入货币 UNKNOWN/全额占额而非盲目收费重试；未批准模型身份在推理前零调用。仅使用 `SYNTHETIC_PA02_TEST_ONLY` 合成费用，详见 [#870 专项](PA02-R10-HOST-COST-PREFLIGHT-20261014.md)。本条在 PR 最终 HEAD 全绿前不声称已合并。
- **R10 最终仍 NOT_SIGNED**：普通 Server/生产 Host 未配置任何真实获批准 Provider/model/区域/服务等级/缓存和长上下文的版本化费率，实际用户提示的最大可收费输入 token 未证明、输出硬上限供应商实际履约未验证；没有供应商真实费用结算凭证，不能以测试示例批准费用；生产 READ/WRITE 均不因此启用。R01–R10 总账暂未宣告 `DEV_COMPLETE`。旧公共网页 H 级转引未在此 PR 中访问、不补写为已读原文。


## 2026-10-15：R10 静态输入额度不能替代实际模型请求的可信计费上界

- [#870](https://github.com/jiangxng/EVO-App-Platform/pull/870) 最终 Head `9491009c8671fb9d747a41c7ced383671436867f` **18/18 CI SUCCESS**，main 合并 `f5c90d21981fb2f5876e27a7940493d77fe4608f`，Agent 过程分支已确认删除；在合成价格下证明原 Host/Worker 模型调用前持久最坏费用预留和未知保留。本行纠正旧条目“未合并”的历史描述，原始流水不删改。
- **新增风险**：旧预留金额来自 Host 候选策略里的 `maxBillableInputTokens`，但 Agent 实际请求包含系统/开发者指令、历史、工具 schema 与工具观察数据，不能由静态填写数证明该请求的**真实可计费输入上界**。新 [#872](https://github.com/jiangxng/EVO-App-Platform/pull/872) 从同步最新 main（含治理 #871）建立短分支，要求在已组装实际 `LlmInferenceRequestV010` 后检查可信上界，**再**调用同一个 PostgreSQL 费用预留，再调用模型，拒绝时没有账本占额或供应商调用。初版准确 HEAD `9864c64d1e1ecb79b640d5795fab8c927048b0b7` **18/18 CI SUCCESS**，真实 [PG18 Agent Worker 38650954272](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38650954272) job `116149313153` **24/24 PASS**，新增 quote 缺失/超额/NaN 的 Provider 调用 0 与费用预留 0。最终 PR HEAD/合并状态需再核；证据与新查阅官网等级见 [R10 Actual Request Quote](PA02-R10-ACTUAL-REQUEST-INPUT-QUOTE-20261015.md)。
- 这仍然**只有测试替身提供合成可信 quote，没有正式绑定模型的供应商计费上界证明、审批价目和真实账单**；正式 `manager/server.ts` 未启用预算/生产 WRITE，R10 `OPEN`、PA-02 `NOT_SIGNED`。外站历史 14 条 H 类引文不因为本轮单独查阅的新网页而升级。
