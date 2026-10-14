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
