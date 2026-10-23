# PA-05 新窗口简短交接入口（2026-10-16）

**Document class:** SESSION_HANDOFF_ENTRY / FIXED_SNAPSHOT（仅 [Agent] 独立工作线；不替换全局状态）  
**记录基线：** [EVO main@5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7](https://github.com/jiangxng/EVO-App-Platform/commit/5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7)，已合并 [PR #954](https://github.com/jiangxng/EVO-App-Platform/pull/954)；**这是写包时的快照，不是永久最新 HEAD**。  
**详细资料、阅读等级、PR/CI 证据与取舍：** [PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md)。  
**现行 PA05 专项事实：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §22–§34；[安全阻断 Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913)（本次核验 OPEN）。  
**原历史研究遗产：** [旧 PA05 恢复入口](PA05-WINDOW-RECOVERY-HANDOFF-20261015.md) · [原来源/决策索引](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md)；保留、不覆盖。

## 1. 新窗口首先做什么

按 [AI-BOOTSTRAP](../../AI-BOOTSTRAP.md) 指定顺序读取：`AI-BOOTSTRAP.md` → `project.status.json` → 其中 handoff 指向的生成文档 → `LLM.md` → `llm.foundation-map.json`，再读 [Agent 专项 HANDOFF](HANDOFF.md)、本入口、详细索引、[PA05 基线](PA05-CERTIFICATION-BASELINE-20261015.md) §22–§34 和 #913。开始任何新分支前**重新查询** main HEAD、Agent/并行 PR、当前 CI、Issue；不能从本页推断新的生产状态。

## 2. 本窗口目标和用户已定要求

- 目标：接续 **EVO-App-Platform / Personal Agent PA-05 插件标准认证**，在真实业务 Owner、可靠 WRITE、跨独立数据库协调及可验证 Human/Agent 效果中推进；上一项实际工作为 **PA05-04D14C4**。
- 用户授权：对已有明确工程目标自主连续推进，不为每一步重复询问；先复用本仓代码、已通过的 PG18/CI、PR/证据；不能为了好看的 PR 数量而重复旧研究。
- 开发边界：一项有界闭环一个独立 `agent/pa05-...` 分支与 PR，准确 HEAD CI → 合并 main → 确认源分支清理；并行 BEX/CP-03、Eidos、2D、插件治理**不能被本线覆盖或抢改**；不修改 `manager/server.ts` 默认生产路径、`project.status.json`、自动生成的 `docs/roadmap/HANDOFF-LATEST.md`，除非另行授权并走权威流程。
- 安全/验收：Owner/Receipt/UNKNOWN 必须以持久证据和独立核验为准，不以模型文字、HTTP 成功或“绿 CI”编造业务终态；跨独立物理数据库不等于共享 PostgreSQL 原子事务；网络分区/特权账号绕过必须显式 fail-closed 并保留反例。
- **PA-05 `IN_PROGRESS / NOT_SIGNED`，PA05-W06 NOT_SIGNED，生产 material WRITE OFF**；**Issue #913 OPEN**。不部署、不迁移现有文件 Provider 数据、不自行开启生产 WRITE。
- 产品顺序：PA-05 → PA-06；BEX/CP-03 主线完成后再联动 PA-03 I01–I10。PA-02 R10 真实费用签收依据 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 单独处理；PA-04 的外部 Human/Provider 验收不因本轮过关。

## 3. 已完成、直接可复用（无需重做）

| 真实工程门禁 | 已合并的一手证据 | 意义与证明上限 |
| --- | --- | --- |
| D9–D10 跨物理数据库中央预留及远端 SQL 准入 | [#935](https://github.com/jiangxng/EVO-App-Platform/pull/935)、[#938](https://github.com/jiangxng/EVO-App-Platform/pull/938) | 三个独立 PG18；中央 PENDING + D10 本地凭据、受限 Worker；**不是 XA/全局原子事务** |
| D11–D13 实际 PA-02 Owner、核销、中央 Host 登录与并发 | [#941](https://github.com/jiangxng/EVO-App-Platform/pull/941)、[#943](https://github.com/jiangxng/EVO-App-Platform/pull/943)、[#945](https://github.com/jiangxng/EVO-App-Platform/pull/945) | PA-02 实际 handoff、冻结后独立 Owner 证据核销、中央 LOGIN/ACL；不能宣称多实例全局 fail-stop |
| D14A 远端持久单调冻结、断网反例 | [#946](https://github.com/jiangxng/EVO-App-Platform/pull/946) | 已本地 FROZEN 的远端拒绝旧票；**失联且仍 ACTIVE 的远端旧票仍可能执行** |
| D14B1–B3 Host 真登录、事务级撤销、权限漂移与密码轮换 | [#948](https://github.com/jiangxng/EVO-App-Platform/pull/948)、[#949](https://github.com/jiangxng/EVO-App-Platform/pull/949)、[#950](https://github.com/jiangxng/EVO-App-Platform/pull/950) | 中央撤销与新预留同事务排序；不同 Host/Worker LOGIN，危险 GRANT/NOINHERIT 拒绝；生产凭证分发/实际机器身份未认证 |
| D14C1–C2 Host 无票写入漏洞和业务表完整覆盖 | [#951](https://github.com/jiangxng/EVO-App-Platform/pull/951)、[#952](https://github.com/jiangxng/EVO-App-Platform/pull/952) | Host/Worker 均需票；可选域表触发器/多表覆盖防绕过；未自动安装到全部现有业务插件 |
| D14C3–C4 首个真实 Object Extension 插件接入及物理表防绕过 | [#953](https://github.com/jiangxng/EVO-App-Platform/pull/953)、[#954](https://github.com/jiangxng/EVO-App-Platform/pull/954) | 实际 `evo-object-extension` 原 Owner + 三张真实 PostgreSQL 业务表、原 Verifier、受限 SQL 登录；直接原 Owner 的**无来源调用**在 D14C4 显式受保护表中由 PG 拒绝。隔离可选，**不等于已改默认生产路由** |

**最新真实验收:** PR #954 提交的七个准确 HEAD GitHub CI 全成功，三物理 PG18 专项零跳过；[Actions run 38734730714](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38734730714) / Job `116421030937` 的 `PA05_ACTUAL_OBJECT_PHYSICAL_SQL_FENCE_PG` 显示 `originalRawOwnerDeniedEvenWithValidTicket:true`、`realGuardedOwnerAtomicBusinessAndEvidenceCommit:true`、`privilegedTableOwnerCanStillDisableTrigger:true`、`productionWriteEnabled:false`。详见索引 §2–§5，不能只看历史基线标题中的“candidate”。

## 4. 下一项真正值得做的事

**PA05-04D14C5 / C4 后续**（暂定任务名称，**尚无实现或 PR**）：围绕已出现的**真实** Object Extension 业务 Owner SQL 凭证安全边界，查明哪些不受信调用方可以取得 business-owner LOGIN，及 custom transaction GUC 能否由持有该登录凭证者伪造；研究、验证并在现实可行范围内封堵**旧票复用／Host 权限绕过**。新机制必须不依赖模型自称、不重复已有 PA02/D10/Owner 引擎；先在真实 PG18 中做拒绝/成功的最小反例，明确 privileged DBA 不可从应用层消除。若暂不能在当前信任/部署拓扑下安全封堵，保留 Issue #913 的阻断，而不是“修复”成形式逻辑。之后**其他实际插件**逐一提交真实域表契约与 Owner 证据，PA05-05 再做真实 Provider+有凭证 Human/Agent 端到端签收。

不可遗漏的 P0 障碍：失联但 ACTIVE 的远端可使用早期有效凭据；DB 超级用户或表 Owner 可以停用 SQL 触发器；custom GUC/业务 SQL 账号被盗会导致来源冒用；真正 Host launch/Provider/生产凭证/真实网络分区/正式授权均未完成。**隔离 CI PASS ≠ production SIGNED**。

## 5. 本次文档交付、分支与交接纪律

本窗口仅新增本入口、详细参考索引，并在 [Agent HANDOFF](HANDOFF.md) 顶部加导航，**不覆写** 10-15 已冻结的历史研究包、113KB 专项基线、总状态及任何其他窗口文件。编写起点 `main@5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7`；交接文档的创建分支 `docs/pa05-d14c4-research-decision-handoff-20261016` 是**过程分支**，以最后 PR 的合并状态与最新 main 为准，不作为永久开发分支。两条更早的 `docs/pa04-window-research-decision-handoff-20261015`、`docs/pa05-window-recovery-20261015` 仍存在且未自动删除：须按 `.github/workflows/branch-hygiene.yml` 安全流程核对后删除，不得误称已清理。

**阅读遗产的边界：** 本窗口直接查询 GitHub 的源码、PR、Actions 和 PostgreSQL18 实测日志；未直接使用网页搜索打开任何新的外部官方/行业原文。旧 14 条公开外链仅由先前已存的 PA04/PA05 参考索引**转引**，阅读等级与首次查阅日期不能虚构。无本窗口截图、浏览器 HAR、私有数据库快照或正式 Provider 凭证可归档。详细来源及缺失说明都在[详细索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md)。
