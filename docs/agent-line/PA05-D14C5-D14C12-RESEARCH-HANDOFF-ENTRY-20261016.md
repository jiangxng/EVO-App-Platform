# PA-05｜D14C5–D14C12 研究与决策接续入口（2026-10-16）

**类型：** AGENT_LINE_WINDOW_CONTINUATION / SHORT_ENTRY（不是项目主线状态、生产发布许可或工程新功能）。  
**详细资料索引：** [PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md)（原始网址、查阅等级、章节、取舍、冲突与短期证据）。  
**不可替代的实证基线：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §35–42、[Issue #913](https://github.com/jiangxng/EVO-App-Platform/issues/913)、[Agent HANDOFF](HANDOFF.md)。较早的 [PA05 旧窗口入口](PA05-WINDOW-HANDOFF-ENTRY-20261016.md) / [旧索引](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md) 固定停在 D14C4，**不是本篇最新进度**；不要修改、抹平其历史来源等级。

## A. 经核实的接续状态和不可改变的决定

- **仓库：** [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，工作于独立 **Agent PA-05 插件标准认证建设线**。本次整理前的真实 main：`84c07bbd9aa8fe0c679ca35d1ccc5b122734a3a0`，D14C12 [PR #972](https://github.com/jiangxng/EVO-App-Platform/pull/972) 已 **MERGED**；其原分支 `agent/pa05-d14c12-host-mtls-postgres-20261016` 经 [Branch Hygiene #38886854990](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886854990) 明确删除。若本交接 PR 合并，**必须以新 PR 的 merge SHA 而非这个旧 SHA 作为下一窗口基准**。
- D14C5 [#959](https://github.com/jiangxng/EVO-App-Platform/pull/959) → C6 [#961](https://github.com/jiangxng/EVO-App-Platform/pull/961) → C7 [#962](https://github.com/jiangxng/EVO-App-Platform/pull/962) → C8 [#963](https://github.com/jiangxng/EVO-App-Platform/pull/963) → C9 [#965](https://github.com/jiangxng/EVO-App-Platform/pull/965) → C10 [#967](https://github.com/jiangxng/EVO-App-Platform/pull/967) → C11 [#969](https://github.com/jiangxng/EVO-App-Platform/pull/969) → C12 [#972](https://github.com/jiangxng/EVO-App-Platform/pull/972)：**八个实际工程 PR 都已合并**；不是八个待做任务，不能重复实现。
- **最新实际工程验收（C12）：** 最终候选 HEAD `735b75e80b93206f66aaa821ebbc2c885654501a`，合并 main `84c07bbd...`，[三独立 PG18 Actions #38886594068](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38886594068) **12/12 PASS、0 fail、0 skipped**，变更触发的 **6/6 CI SUCCESS**；真实 Host 证书/密码正例、无证书拒绝、另张合法 CA 签发但证书身份不匹配拒绝，旧 D9–D14C11 回归持续通过。CI 成功不等于生产部署/完整签收。
- **本窗口用户既定要求：** 持续推进到单个可测试且可合并的闭环；沿用原 first-party Object Extension Owner + immutable receipt + verifier、D9/D10 tickets；**禁止**新造业务引擎、假成功、模糊跳过的测试；真实 PostgreSQL18 **三物理不同 cluster ID** 验证；一个短分支/一个 PR/精确 HEAD 全绿再合并清分支；并行 BEX/CP03、Eidos、2D 与 Agent 分离；不推送未经批准的生产变更。研究交接须保留原网址与证据等级而非用聊天记忆顶替仓库。
- **不得签收：** [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) **OPEN**，PA-05 和 PA05-W06 **IN_PROGRESS / NOT_SIGNED**，生产 material WRITE **OFF**。生产机器/工作负载证明、PKI/密钥发行保管及撤销、真实其他业务插件、PA05-05 凭证 Human→Agent→Provider/Owner 端到端、分区下仍 ACTIVE Worker 的旧票、特权 DBA/DLL 变更、全局跨库原子撤销尚无签收。
- **本交接不得碰：** `project.status.json`、自动生成的 `docs/roadmap/HANDOFF-LATEST.md`、Railway 发布配置、BEX/CP03/Eidos/2D 共享文件；旧窗口的两份来源历史快照只链接、不覆盖。

## B. 已完成的安全门禁——只记结论，细节请见详细索引

| 实际已合并阶段 | 解决问题 | 不应扩大的结论 |
| --- | --- | --- |
| **D14C5** | 真实独立 Host SQL LOGIN、一次一 Effect permit、原业务表 + 不可变 Owner receipt | GUC/token 不是机器身份 |
| **D14C6** | Host/Business 角色 GRANT、NOINHERIT、PUBLIC EXECUTE 权限漂移，每次在 SQL 核实 | 不能对抗 DBA 修改触发器和 DDL 时序 |
| **D14C7** | 许可撤销与真实业务提交争抢同一 SQL 行锁，区分 REVOKED/COMMITTED | 不能撤销已提交结果 |
| **D14C8** | 许可绑定完整批准业务资源 JSONB、Owner evidence、摘要/时间/身份 | 仍有“同内容抢先执行”与来源信任 |
| **D14C9** | **Owner 外部** Host 独立登记不可变命令，签许可时 SQL 比对完整原始命令 | 不等于可信生产 machine/workload |
| **D14C10** | Host 许可绑定受限 Business SQL 的真实 backend PID + XID；别的连接原样重放失败 | 原合法连接被控制仍未解决 |
| **D14C11** | DBA 同事务修改 Host/Business SQL 密码和旧 session 水位；轮换前已认证连接、RR 快照失败关闭 | 无协调的人工密码修改不会自动更新水位 |
| **D14C12** | 临时 PG18 CA + `hostssl` 客户端证书，SQL `pg_stat_ssl` 核实确切 DN/issuer/serial | **测试证书≠生产 PKI/硬件身份证明**；只限定测试 IPv4/HBA 范围 |

## C. 代码与 CI 唯一复用入口

- 原业务资源、Owner 单事务与 verifier：[`apps/object-extension/agent-owner-postgres.ts`](../../apps/object-extension/agent-owner-postgres.ts)。
- 真实业务表 SQL trigger、Host SQL 身份/角色/epoch/证书校验：[`apps/object-extension/pa05-physical-sql-guard.ts`](../../apps/object-extension/pa05-physical-sql-guard.ts)。
- 独立 Host SQL 申请/签发/绑定/撤销，opt-in 证书 TLS 客户端：[`apps/object-extension/pa05-host-sql-permit.ts`](../../apps/object-extension/pa05-host-sql-permit.ts)。
- 三独立库实测：[`tests/agent-line/pa05-object-extension-host-permit-pg.test.mjs`](../../tests/agent-line/pa05-object-extension-host-permit-pg.test.mjs)；[CI](../../.github/workflows/agent-pa05-cross-database-admission.yml)；仅测试使用的 [PKI/HBA 脚本](../../scripts/ci/pa05-host-mtls-setup.sh)；真正结果需查 Actions 日志（详细索引附 run IDs/markers）。
- D9/D10/跨库 Freeze/Owner settlement 等复用既有 `manager/pa05-cross-database-*.ts`，本交接不扩写这些成熟契约。**有别于临时测试证书，真实产品生产配置尚不存在这套完备的 PKI 交付通道。**

## D. 下一窗口最小可推进事项（规划候选，非未经审查的事实）

1. **先完成认证缺口盘点，不是直接宣布 D14C13 通过：** 复读 [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) + §35–42 + 本包详细索引，确认 D14C12 的证书切换、撤销、CA/HBA/IPv6 策略、存活 TLS 后端是否会持续持旧身份；如需 D14C13，设计**真实旧证书吊销/换证/旧连接仍存活**的负向门禁，只在同一个原 PG18 测试与独立 PR 中最小实现。不要把临时 CA 测试转成生产认证已部署。
2. **推进另外一个真实插件 Owner 的跨插件覆盖**：先确认插件 SQL/Provider 的真实受控资源、表和原 Owner/Verifier 契约，再复用 D9–D14C12，杜绝复制 Object Extension 的专属 schema/接口为伪通用基建。
3. **PA05-05**（后续单独门禁）：合法用户真实凭据、Human/Agent、真实 Provider/业务 Owner、WRITE 停用与未知状态核验、恢复/升级/回滚和实际浏览器验证；仅在 Human/生产授权后考虑启用生产 WRITE。

## E. 恢复操作

新窗口严格依序阅读 `AI-BOOTSTRAP.md` → `project.status.json` → `project.status.json.handoff` → `LLM.md` → `llm.foundation-map.json` → `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`；再读**本入口 → 详细参考索引 → 认证基线 §35–42 → #913**。以 GitHub **当时实际** main、PR、CI 覆盖本文整理时状态；在最新 main 另开 `agent/pa05-...` 分支，只推进一项可验收工作；CI 满足后合并、确认新 main 和安全清理分支。跨窗口缺失截图/CI artifact/私钥不可补造。
