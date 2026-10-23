# PA-05｜本聊天窗口研究资料与决策交接入口（2026-10-19）

**文档类型：** AGENT_WINDOW_RESEARCH_HANDOFF_ENTRY（简短入口；不是全局项目状态）。  
**详细资料、网址、访问等级及证据索引：** [PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)。  
**既有认证总账：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §§43–53；**既有旧研究遗产：** [D14C5–D14C12 索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md) 和 [短入口](PA05-D14C5-D14C12-RESEARCH-HANDOFF-ENTRY-20261016.md)。

> **时间/权限说明：** 本入口根据 2026-10-16 本窗口的源码、真实 GitHub Actions、PostgreSQL18 工程决策和 2026-10-19 重新读取的最新 GitHub 状态整理。历史官网网页的阅读等级请看详细索引；**2026-10-19 本次整理没有重新打开那些外部网站，绝不回填“本次已读原文”**。本交接只归档事实与研究，不开启生产运行。

## 1. 接续时的准确事实（2026-10-19 复核）

- **仓库：** https://github.com/jiangxng/EVO-App-Platform ；此文档分支启动时核验的 **main：`42ce894b4129089cbd8a270bd3473f0c93b7657b`**。main 是移动目标；接续时必须再查询，不能把此 SHA 当成永久 latest。
- **E01J1 [PR #997](https://github.com/jiangxng/EVO-App-Platform/pull/997) 已 MERGED**，合并提交 `c9a4ce2b9ebbffbe469a1fbc48ed046acfa0ce62`，最终工程 HEAD `882979d3160c61bbd81531b03195a32cb852b3cc`。旧工程分支 `agent/pa05-e01j-shared-read-sql-gate-20261016` **已删除**，不应复活；本次新分支只作研究交接。
- **E01J1 最终准确 HEAD [PG18 CI #38918563740](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38918563740)：15/15 PASS，0 failed，0 skipped**。三个**物理独立** PostgreSQL18 数据库，两个**独立 Node OS 进程**共用中央 READ Owner 行锁：READ 事务持有 `FOR SHARE`，另一进程撤权 `FOR UPDATE` 等待读完后推进 epoch 并冻结；两个旧 Worker 版本都被拒绝；宿主清单变化和中央连接不可用失败关闭。这是 **E01J1 隔离 SQL 工程通过**，绝不是业务 READ Handler 或真实安装全局签收。
- 最终 HEAD 的相关 READ/WRITE、PG18、Platform、Lightweight Host、Human UI、Continuity **7 项相关工作流 SUCCESS**；Branch Hygiene 成功。不要把同一提交上的跳过的 BEX 退役工作流算成失败或安全通过。
- **Issue [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 均 OPEN。** PA-05/W06 `IN_PROGRESS / NOT_SIGNED`；PA05-05 E01–E05 真实环境签收 **0/5**；production material WRITE **OFF**。本窗口未获新的 Railway 部署/生产 WRITE 授权，也未执行部署。
- 真实 main 在 #997 后已有其他并行进展；**不得把 2026-10-16 旧 `HANDOFF.md` 的 candidate 段落、老 PR HEAD 或本聊天内容当作最新状态**。原始主线 `project.status.json` 和生成 `docs/roadmap/HANDOFF-LATEST.md` 由各自 owner 管理，本线不手改。

## 2. 用户明确目标与不可越界要求

推进 EVO-App-Platform / Personal Agent **PA-05 插件标准认证**，先巩固真实物理数据库安全和跨业务 READ 插件，再做 Human/Personal Agent/Provider/浏览器/企业数据真正验收。强调“**可用、可核验，不拿 PR 数或 0 skipped 模拟试验冒充真实签收**”；源码、真实 SQL 和实际 Host HTTP/进程证据优先。不重复已经完成的网络研究与工程。每一独立闭环：**最新 main → 唯一短分支/PR → 完整受影响 CI（准确 HEAD）→ 合并 main → 安全退役分支**。其他窗口并行修改 BEX/CP03/Eidos/2D，不能覆盖；原则上不动全局权威文件、生产 Railway、production WRITE。

## 3. 已合并的工程能力与应复用的决策

| 范围 | 已完成（工程级，不等于 Human/生产） | 原始 PR／归档 |
| --- | --- | --- |
| D14C13 | 真实 Host TLS 客户端证书吊销/续签，旧已连接 TLS backend SQL 权限通过 DBA epoch 截止；区分 TLS 握手拒绝和存活连接权限撤销 | [#976](https://github.com/jiangxng/EVO-App-Platform/pull/976) · [原始决定](PA05-D14C13-HOST-TLS-CERTIFICATE-REVOCATION-20261016.md) · 基线 §43 |
| E01A–C | Host 默认轻量不预装业务包；Purchase Attention 独立插件 Owner；经可信授权后按需装载/登记到原 Catalog/Router，登记≠安装 | [#980](https://github.com/jiangxng/EVO-App-Platform/pull/980) / [#982](https://github.com/jiangxng/EVO-App-Platform/pull/982) / [#983](https://github.com/jiangxng/EVO-App-Platform/pull/983) · [E01C](PA05-E01C-TRUSTED-ON-DEMAND-HOST-REGISTRATION-20261016.md) |
| E01D–E | 默认 OFF 的管理员 + 独立 Provider 策略准入；隔离实际 Host Node 进程和真正 HTTP 注册、安装/停用验证；发现旧安装接口无管理员 Bearer 的缺口 | [#985](https://github.com/jiangxng/EVO-App-Platform/pull/985) / [#986](https://github.com/jiangxng/EVO-App-Platform/pull/986) · [E01E](PA05-E01E-DISPOSABLE-REAL-HOST-HTTP-20261016.md) |
| E01F–G | 修复 Purchase Attention 五个直接生命周期入口和五个插件商店 Action 旁路；再通过真实 AppManager 安装计划阻止间接安装、停用 Feature 被依赖重新激活 | [#990](https://github.com/jiangxng/EVO-App-Platform/pull/990) / [#992](https://github.com/jiangxng/EVO-App-Platform/pull/992) · [E01G](PA05-E01G-TRANSITIVE-READ-LIFECYCLE-20261016.md) |
| E01H–I | 同一 Host 的异步授权两次复核与依赖计划漂移拒绝；本地 JSON 持久化出现未重认证 READ Owner 时，真正重启进程失败关闭且不改写状态 | [#994](https://github.com/jiangxng/EVO-App-Platform/pull/994) / [#995](https://github.com/jiangxng/EVO-App-Platform/pull/995) · [E01H](PA05-E01H-AUTHORIZATION-RACE-20261016.md) / [E01I](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) |
| E01J1 | **单一中央 PG18** READ Owner `FROZEN/ACTIVE` epoch、可信 Host 清单、同库行锁、真正双 Node 进程撤权串行化；未接生产业务/原 AppManager | [#997](https://github.com/jiangxng/EVO-App-Platform/pull/997) · [E01J1](PA05-E01J-SHARED-READ-OWNER-EPOCH-PG-20261016.md) · 基线 §53 |

## 4. 已确认方案取舍（只列要点；详见参考索引）

**采用：** 保留轻量 Host、插件 Owner 自主性；复用原 Catalog/Action Router/AppManager 和现有 Host 双重授权；只对真实影响的目标 READ Owner 施加检查；真实 PG18 epoch + 行锁用于可观察的单中央事务；单独区分 D14C13 WRITE 和 E01J1 READ 证据；每项安全负例在 CI 中可反证。

**排除：** 仅凭 JSON `trustApproved:true` 充当 Human 身份；客户端 GUC、自报 Host ID 或旧 SQL 票据当可信来源；启动时静态导入所有业务插件；仅对被请求的主包授权而忽略其依赖；把一次旧密码/证书更换当作旧会话自动断开；把 JSON 状态、单进程二次授权或 WRITE 插件的 PG18 结果说成 READ 多 Worker 全局原子安装。**限制：** E01J1 使用了测试用受信任 Host ID 和特权数据库测试角色，不能冒称生产可信身份/SQL 最小权限。

## 5. 未决问题及最值得继续推进的方向

**下一工程子阶段：E01J2（先核对最新仓库是否已有同等实现/活跃 PR）。** 应以 E01J1 已有的 `manager/pa05-read-owner-shared-sql-gate.ts` 和真正多进程 PG18 测试为基础，先解决 **可信 Host 工作负载身份和受限数据库角色**：业务 Worker、Host、DBA 权限隔离；数据库侧不可由普通业务连接伪造 epoch/Host ID；真正已签发会话与吊销验证。之后设计在同一可核验授权边界内调用**真实 Purchase Attention READ Handler**，证明撤权/存活连接/网络隔离下无法继续读取；原 AppManager 安装、启停与独立数据库状态之间的原子性另设计，**不能以局部 SQL `FOR SHARE` 宣称双存储事务原子**。再验证实际生产候选企业数据、Human/Agent 双独立认证、Provider/model、浏览器验收和 W06。

额外 P0：审计其他插件通用安装入口及依赖、startup restore；实际中央数据库断网**发生在读操作进行中**时的进程行为；冻结恢复、ABA、同一 Host 多连接、假冒 Host ID、数据库角色拥有者绕过、事务读回调非 SQL I/O 等边界。官网 PostgreSQL18 权威章节和 E01J1 既有决策文档的“**不宣称**”标记需一起保留。

## 6. 项目位置、证据与新窗口读取顺序

- 先按 `AI-BOOTSTRAP.md` → `project.status.json` → 其 `handoff` → `LLM.md` → `llm.foundation-map.json` → `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` 的强制顺序，再读本短入口和[详细索引](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)。
- 工程真实位置：`manager/server.ts`、`manager/store.ts`、`manager/service.ts`、`manager/on-demand-host-read-admission.ts`、`manager/pa05-protected-read-lifecycle-impact.ts`、`manager/pa05-read-owner-shared-sql-gate.ts`；`apps/purchase-attention/host-optin.ts`；`tests/agent-line/pa05-e01e-real-host-http.test.mjs`、`pa05-e01i-startup-restoration.test.mjs`、`pa05-e01j-shared-read-owner-pg.test.mjs` 及其 `fixtures/pa05-e01j-sql-host-worker.mjs`；`.github/workflows/agent-pa05-cross-database-admission.yml`。
- 易失证据：准确 GitHub PR HEAD、Actions run 编号、marker、原始日志见[参考索引](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md) §3–4。GitHub Actions artifact 保留期有限；索引保存结果摘要和断言，**没有新增本地截图、附件或私钥**。
- **本交接提交后需重新确认**文档 PR/分支、提交 SHA、最新 main 和 CI；新窗口以最终合并 SHA 及 PR merged/closed 为准，不复活旧工程分支。

**移交要求：** 新窗口不重复 E01A–J1 已完成工程，不将 E01J1 15/15 当 E01 实际签收；先查是否已有 E01J2 独立线，再按一项真实验证闭环继续。保持 #988/#979/#913 OPEN 与 production WRITE OFF，除非未来明确完成真正的签收流程。
