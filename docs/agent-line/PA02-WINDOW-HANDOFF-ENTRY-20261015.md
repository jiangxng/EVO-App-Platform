# PA-02 新窗口研究与决策交接：简短入口（2026-10-15）

**Document class:** SESSION_HANDOFF_ENTRY / HISTORICAL_SNAPSHOT  
**仓库：** https://github.com/jiangxng/EVO-App-Platform  
**编制起点主线：** `main@991ac3e030884b69586b3c1732db9953dc17ef91`（#880 已合并）。**该 SHA 不代表本资料 PR 合并后的或未来永久 HEAD。**  
**接续分支：** 交接 PR 合并、过程分支自动退休后从**当时最新 `main`**接续；绝不恢复本次历史短分支。  
**详细来源与研究索引：** [PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)。  
**既有历史交接：** [2026-10-14 短入口](PA02-WINDOW-CLOSURE-HANDOFF-ENTRY-20261014.md)／[2026-10-14 详细资料索引](PA02-WINDOW-CLOSURE-REFERENCE-INDEX-20261014.md)，保留历史、不改写。  
**原始范围权威：** [Personal Agent Construction Blueprint](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md) §25 R01–R10；[交付规则](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)。阶段真实签收详见 [PA02-FINAL-SIGNOFF-AUDIT-20261015.md](PA02-FINAL-SIGNOFF-AUDIT-20261015.md) 与 [PA02-CURRENT-ACCEPTANCE.md](PA02-CURRENT-ACCEPTANCE.md)。

## 1. 此窗口目标、用户要求与确定的边界

原任务是**继续 PA-02 持久执行阶段的 R01–R10 收尾**，在既有 `main` 上解决真实 HTTP/Chromium/PostgreSQL/受治理业务 Owner 断线恢复、R10 费用门禁与最终证据，而非重新做 PA-00/PA-01 或扩张 PA-03～PA-06。

用户已明确：**不要重复已验收研究和实现；单一独立闭环一条短 branch/PR、同 PR 修复、CI 全绿后 merge main 并确认分支退休；每轮用“已通过／未通过／还差什么”报告，不能用 PR 数倒计时冒充进度；不覆盖 BEX、2D、治理、Eidos 的其他 owner 文件；不直接推 main、不绕过必需检查、绝不自动部署或启用生产 WRITE；项目状态以仓库事实而非聊天记忆为准。** R10 货币硬预算是原始 PA-02 验收条款，不可通过改名/删条件冒签。

本次换窗特别要求将**实际看过的网页和搜索摘要**与仅历史转引的链接分级、保留原始网址/查阅日期、方案比较和限制、截图/CI 位置、确切分支/提交、能执行的下一任务。结论必须另有详细索引，不能把所有研究堆进一篇入口。

## 2. 当前可靠状态（编制基线，非未来承诺）

| 原始项目 | 截至主线 `991ac3e0...` 的结论 | 仍缺的真实门禁 |
| --- | --- | --- |
| R01–R09 | **隔离开发证据 PASS**：真实 Host/PG/Chromium/SQL Owner 分层与复合故障；#859 5/5、#863 7/7、#865 8/8、#868 9/9，均 merged | 不将模拟 Owner ACK 丢失称作公网真实网络故障或生产 WRITE 授权 |
| R10 模型失败/次数/时间/usage | **PASS**：3 连续错误、24 Run slices、72h deadline，Provider usage `REPORTED` 或 `UNAVAILABLE` 真实区分 | token 数≠实际账单 |
| R10 合成费用安全基础 | **已 merge 且 CI PASS**：#869 PG 原子 worst reserve、#870 Host 模型调用前费用门禁、#872 完整请求可信 input 上界负向、#874 cache-write 未批准时金额 `UNKNOWN` 保留 | **所有价/quote 均为隔离测试替身；真实绑定模型／获批币种／价格版本／所有计费类别／可证最大收费与供应商账单仍无授权证据** |
| PA-02 整体 | **IN_PROGRESS / NOT_DEV_COMPLETE / NOT_PRODUCTION_READY**（#875 完整审计已合并） | [Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879)：R10 真实费用授权的唯一签收阻断 |
| 分支卫生 | #877/#880 的精确 SHA 退休清单已合入；本窗口本次交接以前的 `agent/*` 功能短分支已按 PR 自动清理 | **四条历史 PA-02 docs 分支仍实际存在**，需要 [Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/branch-hygiene.yml) 手动 `Run workflow → execute=true` 并核对 `DELETED` 日志；清单合并≠分支删除 |

**最新事实查询顺序：** 先重新查 `main`、开放 PR、当前 branches 与检查结果；编制时只有 BEX #846/#860/#866/#878 开放，不能把该瞬间永久化。旧资料与持续文档里创建时的 `CI_PENDING` 是历史文字，后续 merged/最终 CI 覆盖其“现在”含义。

## 3. 本窗口新做的证据与决策（不重做）

- **真实 Chromium/Host/PG/Owner 合并闭环：** #859 READ-only 5/5 → #863 governed WRITE 7/7 → #865 post-commit 浏览器掉线/取消 8/8 → #868 SQL 真提交后**受控测试包装器**丢 Host ACK、Chromium reload/取消/独立 Receipt 核验 9/9。采用旧 Run/fencing、Owner Evidence、Run Outbox、同 Run 恢复；**不再新建 executor、断线不重复业务 WRITE**。这是隔离开发证据，不是生产真实网络事故。
- **R10 技术路线：** #856/#857 消除供应商缺 usage 变 0 的错误；#869/#870 持久 worst-case 金额预留与 Host 阻断；#872 核心差异是**完整模型请求**（system/developer/user/history/tools）组装后才索取可信计费输入上界，quote 无法核实时模型调用/PG 虚构费用均为 0；#874 追加 cache-write 计费若无批准费率则金额保留 `UNKNOWN`、禁止后续收费推理。**真实 Provider 价表/账单从未自动接入**。
- **分支与签收：** #875 明确 `R10 NOT_SIGNED`；#877/#880 将四条历史 docs ref 精确 SHA 放入已有安全 retirement manifest，但**没有运行人工删除**；创建 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 记录需供应商/企业有权 owner 证明的全部事实。
- **外网资料事实边界：** 这次独立新增的 W01 OpenAI input token count 官方接口（当时原文相关完整可读）、W02 DeepSeek Chat 参数（仅相关段）、W03 OpenAI Responses create 尝试失败、W04 OpenAI pricing 仅搜索摘要；**前序 14 条 H01–H14 全是历史转引，本窗口未读原文**。原网址与用途、访问级别、易变风险全在[详细索引 `1–`2](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)。

## 4. 新窗口首先做什么／不得做什么

1. 按 `AI-BOOTSTRAP.md` 的完整顺序读 `project.status.json`、其 handoff、`LLM.md`、`llm.foundation-map.json`；然后本短入口、[详细来源索引](PA02-WINDOW-RESEARCH-REFERENCE-INDEX-20261015.md)、[PA-02 审计](PA02-FINAL-SIGNOFF-AUDIT-20261015.md)、[原证据总账](PA02-R01-R10-EVIDENCE-LEDGER-20261014.md)。同步读当前 GitHub main/开放 PR/branch protection/并行 owner。
2. 查看 [R10 Issue #879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 有没有**真正新增**经授权的实际 Provider/model/tier/区域、合同计价版本与币种、完整计费类别、可保证单次最大收费输入/输出及供应商账单。**若没有，保持 R10 OPEN，不做合成费率“继续验收”或再造计费执行器**；若已有，再复用现有 Host/Worker/PG cost port 做最小真实计费正向+负向闭环，准确 CI 后合并。
3. 四条历史 docs ref 的退休须走**已有** `branch-hygiene.yml` 手动 `workflow_dispatch execute=true`；如当前连接没有 dispatch 权限，就仅报告且给有权限者具体操作，**不能谎称删除**；BEX/治理 refs 一律不动。
4. **不可改**：`project.status.json`、全局 `docs/roadmap/HANDOFF-LATEST.md`、其他 owner 的 BEX/2D/gov 资料；不重做 PA-00/PA-01、R01–R09、#839～#875 技术闭环；不提前 PA-03～PA-06；不部署、不启用生产 WRITE。

## 5. 本包来源与未保存的东西

详细索引分：**GitHub 已读源码/CI／本次 4 个官网 URL 阅读等级／14 条未读历史外站 URL／Railway 只读元数据／方案取舍／冲突／截图及 artifact 位置／下一步模块映射**。

没有在新位置永久重新上传 GitHub Actions 二进制截图、trace 与所有原始 log；已保存原始 Actions URL、artifact ID、截图文件名及源码可重跑路径，GitHub artifact 可能过期。14 个旧外站的**原文与截图本就未获得**；W03/W04 原网页正文不可得；真实供应商合同/计费凭证没有获得，绝不可冒称已经保存。此包只在本次 GitHub PR **实际 merged 并取得 SHA 后**才能宣布已保存到 main。

**后续提交标识：** 此文件编制时的准确起点为 `991ac3e0...`。本交接 PR 的最终 head、merge SHA、分支删除状态**必须从实际 GitHub 操作结果写在聊天最终答复**，不要在历史快照预填。
