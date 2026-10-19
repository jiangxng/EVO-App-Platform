# PA-05｜本窗口详细参考资料、来源等级、决策与风险索引（2026-10-19）

**文档类型：** RESEARCH_SOURCE_DECISION_LEDGER / VERSIONED_WINDOW_ARCHIVE。  
**配套短入口：** [PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md)。  
**认证总账：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §§43–53。**此前完整网络索引：** [D14C5–D14C12 历史原始网址、章节、证据等级](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md)，[PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md](PA05-WINDOW-RESEARCH-REFERENCE-INDEX-20261016.md)，[PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md](PA05-WINDOW-RECOVERED-SOURCES-DECISIONS-20261015.md)。

本交接 **2026-10-19 核验**：仓库 `jiangxng/EVO-App-Platform` 的 main 初始为 `42ce894b4129089cbd8a270bd3473f0c93b7657b`（后续可前进）；[PR #997](https://github.com/jiangxng/EVO-App-Platform/pull/997) **已合并**，合并提交 `c9a4ce2b9ebbffbe469a1fbc48ed046acfa0ce62`，原工程分支已清理；[#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 仍 OPEN。**PA-05/W06 NOT_SIGNED，生产 material WRITE OFF，真实 PA05-05 E01–E05 未签收。**

## 0. 来源和访问等级：严格防止“回填已读”

| 标签 | 实际含义和日期 |
| --- | --- |
| **OFFICIAL-ORIGINAL-HISTORIC** | [历史 D14C5–C12 原始资料索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md) **明确记录 2026-10-16 已打开 PostgreSQL18 官网原始网页相应章节**，不是全文通读。此处保留其已记录的访问事件；**2026-10-19 没有再次逐页访问**。 |
| **REPO-ORIGINAL** | 2026-10-16 本轮工程曾通过 GitHub 读取指定源文件原文；2026-10-19 重新打开了明确列出的项目交接、基线、决策和部分 CI 来源。每个条目列实际范围；不能声称全仓已审计。 |
| **PR-VERIFY-20261019** | 2026-10-19 通过 GitHub PR 查询重新核对 merged/closed 和 merge SHA；这不是 2026-10-19 再次执行旧 PR 的测试。 |
| **CI-LOG-ORIGINAL** | 2026-10-16 工程期间实际查看 GitHub Actions job 日志；尤其 **2026-10-19 再次拉取** E01J1 最终 HEAD 真实三 PG18 日志原文。GitHub Actions artifact 通常短期保留：准确 run URL + marker 摘要是本篇持久化的回放索引。 |
| **H-DOC-CLAIM** | 工程决策文档提及网页或其他来源，但整理时没有重新打开，不能因为文件有 URL 就升级为“本轮已读原文”。 |
| **SUMMARY-ONLY** | 只看搜索结果摘要、未看原文。本窗口用于正式决策的**新增此类资料 0 条**。 |
| **TO-VERIFY** | 还没阅读或没真正运行的方向，仅可用于待办，不可写 PASS。 |
| **J-ENGINEERING** | 源于原始代码、可复现实验或威胁模型的**本窗口工程判断**；不是 PostgreSQL 官方对 EVO 系统的保证。 |

**重要时间区别：** 旧索引中 `W-ORIGINAL-PART-20261016` 的访问和本次 2026-10-19 的 GitHub 交接整理是两件事。最早 D14C5–C12 之前的 MCP/Anthropic 等外部资料如只见于旧索引，**原阅读等级一律继承，不称为本窗口额外打开**。本轮多数 E01A–J1 实现依靠仓库源代码与真实 CI，而非额外搜索结果或新的外网文章。

## 1. 已有 PostgreSQL 官方网络资料：原始 URL、章节、作用

下表 PG01–PG13 的访问等级均为 **OFFICIAL-ORIGINAL-HISTORIC**：历史索引记录 **2026-10-16** 已直接打开所列原文章节/内容；**2026-10-19 本次未重新打开官网**。章节和事实摘述根据 [前一份完整原文索引 §1](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md#1-本次真正打开的官方网络资料原始网址章节发现用途) 转存；不能据此推断生产 PostgreSQL 的实际配置。

| ID / 官网原始标题、网址 | 查阅日期、章节、来源事实（不是工程保证） | EVO 模块与具体用途 |
| --- | --- | --- |
| PG01 [PostgreSQL 18 — 5.8 Privileges](https://www.postgresql.org/docs/18/ddl-priv.html) | 2026-10-16 §5.8；表、schema、函数、PUBLIC 权限是独立控制面 | D14C5–C6 SQL Host/Business/DBA 最小权限；E01J2 必须真正测试受限 READ Worker 登录 |
| PG02 [PostgreSQL 18 — REVOKE](https://www.postgresql.org/docs/18/sql-revoke.html) | 2026-10-16 SQL REVOKE；角色链、公共授权需分别检查 | D14C6 漂移/继承；E01J2 防止业务账号通过其他 grant 修改 Owner epoch |
| PG03 [PostgreSQL 18 — System Information Functions](https://www.postgresql.org/docs/18/functions-info.html) | 2026-10-16 §9.27；服务器身份和事务相关查询，不等于客户端自报 GUC | D14C10/11 当前登录与事务识别；E01J2 不可信 Host ID 需要数据库端证明 |
| PG04 [PostgreSQL 18 — CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) | 2026-10-16 `SECURITY DEFINER` 及 `search_path` 安全条款 | D14C5–13 权限隔离/安全签发；E01J2 若做 SQL 入口必须固定 schema 与函数 EXECUTE |
| PG05 [PostgreSQL 18 — 13.4 Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/18/applevel-consistency.html) | 2026-10-16 §13.4；冲突行锁会串行事务，但不自动撤销已提交结果 | D14C7 撤权竞态；E01J1 `FOR SHARE`/ `FOR UPDATE` 的**同库**串行化；不证明跨库原子性 |
| PG06 [PostgreSQL 18 — SELECT](https://www.postgresql.org/docs/18/sql-select.html) | 2026-10-16 锁定行语法及权限；锁在事务内生效 | E01J1 原 Owner 行 SELECT/锁语义、两个进程在同一个物理中央 PG18 竞争 |
| PG07 [PostgreSQL 18 — 67.1 Transactions and Identifiers](https://www.postgresql.org/docs/18/transaction-id.html) | 2026-10-16 §67.1；事务 ID 与永久主机身份、命令签收不同 | D14C10 Host SQL 会话/事务 pin；E01J2 审查 epoch 和连接身份 |
| PG08 [PostgreSQL 18 — Cumulative Statistics System](https://www.postgresql.org/docs/18/monitoring-stats.html) | 2026-10-16 §27.2；`pg_stat_activity.backend_start`、`pg_stat_ssl.client_dn/issuer_dn/client_serial` 是服务器观测；DN 长度有截断限制 | D14C10–C13 活连接/TLS 身份；E01J2 实际 SQL Host 工作负载身份来源 |
| PG09 [PostgreSQL 18 — ALTER ROLE](https://www.postgresql.org/docs/18/sql-alterrole.html) | 2026-10-16 密码变更；改密码不能单独证明旧 backend 已断开 | D14C11/13 SQL 会话 epoch 截止；E01J2 旧合法连接撤权测试 |
| PG10 [PostgreSQL 18 — 20.1 The pg_hba.conf File](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html) | 2026-10-16 §20.1；首条匹配、hostssl、clientcert、IPv4/IPv6 有不同配置边界 | D14C12–13 CI 临时 Host mTLS；E01J2 SQL 角色+client cert |
| PG11 [PostgreSQL 18 — 18.9 Secure TCP/IP Connections with SSL](https://www.postgresql.org/docs/18/ssl-tcp.html) | 2026-10-16 §18.9；服务器 TLS 证书/CA/私钥与 CRL 配置不能由客户端声称 | D14C12–13 真证书/CRL；E01J2 服务器端确认的机器身份 |
| PG12 [PostgreSQL 18 — 20.12 Certificate Authentication](https://www.postgresql.org/docs/18/auth-cert.html) | 2026-10-16 §20.12；证书链与用户名/DN 映射由认证策略决定 | D14C12–13 Host 独立信任链；不能等同 TPM 或生产 workload attestation |
| PG13 [PostgreSQL 18 — 32.19 SSL Support](https://www.postgresql.org/docs/18/libpq-ssl.html) | 2026-10-16 §32.19.1–.3；verify-full/SAN 与 libpq SSL 规范 | D14C12–13 TLS 服务器身份校验；**测试 JS 驱动为 postgres.js/Node TLS，不可直接照搬 libpq 配置语法** |

**附加来源：** [PostgreSQL 18 — Connection Settings](https://www.postgresql.org/docs/18/runtime-config-connection.html) 在 [D14C13 决策文档](PA05-D14C13-HOST-TLS-CERTIFICATE-REVOCATION-20261016.md) 的“实际来源”中有链接，用于服务器 CRL 和 reload 语义。**等级 H-DOC-CLAIM（此轮未重新读原文）**；不得伪造查阅日期或升级为 2026-10-19 已读。E01J1 不依赖该页做新结论。

## 2. 直接查阅的 GitHub 原始文件与代码事实

**REPO-ORIGINAL**（2026-10-16 工程期部分直接打开；2026-10-19 重新读取了有关 handoff/baseline/E01J1 决策，其他行保留工程期原文访问，**不等于对当前 main 全文件再次审计**）。地址均是仓库的原始路径；锚定 2026-10-19 开始时 main `42ce894b...`，便于遇到未来更改时比较。

| 原始文件、可打开的固定快照链接 | 直接得到的来源事实 | 对应决策与下一次必须检查的差异 |
| --- | --- | --- |
| [AI-BOOTSTRAP.md](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/AI-BOOTSTRAP.md)、[`DEVELOPMENT-DELIVERY-WORKFLOW`](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) | 先读项目权威，沿已验证能力做短 PR、最终 HEAD CI、合并清理；生产部署另授权 | 本交接放独立 docs PR，不重构全局状态；新聊天相同步骤 |
| [manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/server.ts) | Host 原有 Catalog/Router/管理员授权接口、5 个直接生命周期及 Action 分发；E01D 默认 OFF，E01F/G/H 身份与真实依赖影响复核，E01I 重启失败关闭 | E01J2 只能在**实际受信任**路由与认证内接 READ SQL gate；警惕客户端假冒 Worker、安装前后的双存储状态 |
| [manager/service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/service.ts)、[manager/store.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/store.ts) | `planInstall` 可能一并安装/激活依赖；普通生命周期是内存或本地 JSON store，**不具备跨 Worker PG 原子安装** | E01G 依赖影响；E01I restart；E01J2 禁止声称 SQL 事务会自动回滚 AppManager 文件写入 |
| [manager/on-demand-host-read-admission.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/on-demand-host-read-admission.ts)、[apps/purchase-attention/host-optin.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/apps/purchase-attention/host-optin.ts) | 装载单个第一方 READ 包、原 Catalog/Action Router 登记；**登记 ≠ 安装 ≠ 执行真实数据 READ** | E01B–D；E01J2 需要把真实 business Handler READ 放在安全授权临界区 |
| [manager/pa05-protected-read-lifecycle-impact.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/pa05-protected-read-lifecycle-impact.ts) | 真实 AppManager 依赖方案 + 当前异步 Provider 权限复核；防止检查期间计划变化 | E01G/H；没有解决异步返回之后到本地安装之间的竞态 |
| [manager/pa05-read-owner-shared-sql-gate.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/pa05-read-owner-shared-sql-gate.ts) | `FROZEN/ACTIVE` SQL epoch、Host 清单、`FOR SHARE` READ 回调、`FOR UPDATE` 撤权；**未 import 至生产 Host** | E01J1；E01J2 首要新增 SQL least-privilege、合法 Host 绑定、真实 READ Handler 与实际网络切断实测 |
| [manager/agent-plugin-write-lifecycle-gate.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/manager/agent-plugin-write-lifecycle-gate.ts)、[apps/object-extension/pa05-physical-sql-guard.ts](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/apps/object-extension/pa05-physical-sql-guard.ts) | **WRITE Owner** 原有数据库角色、证书/epoch、Owner/Verifier 与 Worker 物理隔离已独立证明 | 借鉴模式，但**不能**将 object-extension WRITE 15/15 / 12/12 归于 Purchase Attention READ |
| [.github/workflows/agent-pa05-cross-database-admission.yml](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/.github/workflows/agent-pa05-cross-database-admission.yml) | 3 个真实 PG18 服务；E01J1 测试混入前 12 个 WRITE 案例，总测试升至 15 个 | 持续要求标记、zero skipped、准确最终 HEAD 结果，而非只 grep 宽泛 SUCCESS |
| [tests/agent-line/pa05-e01j-shared-read-owner-pg.test.mjs](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/tests/agent-line/pa05-e01j-shared-read-owner-pg.test.mjs)、[fixtures/pa05-e01j-sql-host-worker.mjs](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/tests/agent-line/fixtures/pa05-e01j-sql-host-worker.mjs) | 2 个 **forked OS process**，同一 SQL Owner 锁，撤权前 READ 等待，撤权后旧 epoch 拒绝；无中央连接时禁止本地 fallback | 不可替换成两个 JS 对象模拟；E01J2 要加入真实受限 SQL 登录与原 READ Handler/中途分区 |
| [`PA05-CERTIFICATION-BASELINE`](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md) §§43–53、[`Agent HANDOFF`](https://github.com/jiangxng/EVO-App-Platform/blob/42ce894b4129089cbd8a270bd3473f0c93b7657b/docs/agent-line/HANDOFF.md) | 历史文档有写入时的 `candidate` 快照，即使对应 PR 后来 merged；当前需依据 live GitHub PR 校正 | 本次新短入口明确 #997 merged，不能反向修正/覆盖别人维护的全局 handoff |

## 3. 实际完成的子工程：PR、合并 SHA、直接 CI 证据

**访问等级：PR-VERIFY-20261019。** 下表 PR 的 `merged=true` 与 merge SHA 于 2026-10-19 从 GitHub 原始数据**逐一重新核验**。Actions 编号来自本窗口 2026-10-16 实际日志检查和决策记录；只有 E01J1 最终 run 于 2026-10-19 **再次打开了原始 job log**。这不是重新跑所有历史 CI。

| 工程与稳定子文档 | PR 已合并 / merge commit（前缀） | 当时真实新证据／日志原始入口 |
| --- | --- | --- |
| D14C13 [真实 TLS CRL + 存活连接 SQL 撤权](PA05-D14C13-HOST-TLS-CERTIFICATE-REVOCATION-20261016.md) | [#976](https://github.com/jiangxng/EVO-App-Platform/pull/976) · `22d830dd3408` | [三 PG18 #38894476282](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38894476282)，12/12、零跳过；区分 revoked 新握手和旧 TLS backend SQL 权限拒绝 |
| E01A [Host readiness](PA05-E01A-HOST-COMPOSITION-READINESS-20261016.md) | [#980](https://github.com/jiangxng/EVO-App-Platform/pull/980) · `7376991c4569` | [专项 Actions #38896985054](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38896985054)；默认 Host 与第一方 Purchase Attention 清单边界 |
| E01B [插件拥有的 opt-in READ Handler](PA05-E01B-OPTIN-REAL-HOST-PURCHASE-READ-20261016.md) | [#982](https://github.com/jiangxng/EVO-App-Platform/pull/982) · `cd1163033a32` | [Actions #38899521487](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38899521487)；依赖/按需装载，禁止默认 Host 静态扩展 |
| E01C [可信运行时登记](PA05-E01C-TRUSTED-ON-DEMAND-HOST-REGISTRATION-20261016.md) | [#983](https://github.com/jiangxng/EVO-App-Platform/pull/983) · `a3044ec10517` | [READ #38902744248](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38902744248)，8/8 新测试，最终 7/7 相关 CI |
| E01D [管理员授权管理入口](PA05-E01D-ADMIN-HOST-READ-ADMISSION-20261016.md) | [#985](https://github.com/jiangxng/EVO-App-Platform/pull/985) · `3395fe276c27` | [READ #38904377720](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38904377720)，新 5/5，最终 44/44 CI；登记但不安装 |
| E01E [真正 Node Host HTTP](PA05-E01E-DISPOSABLE-REAL-HOST-HTTP-20261016.md) | [#986](https://github.com/jiangxng/EVO-App-Platform/pull/986) · `f70e0a047a72` | [READ #38906164984](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38906164984)，3/3 HTTP；发现旧 `/v1/install` 无 Bearer 可安装 |
| E01F [直接生命周期和 Action 旁路修复](PA05-E01F-LIFECYCLE-AUTHORIZATION-20261016.md) | [#990](https://github.com/jiangxng/EVO-App-Platform/pull/990) · `ddfe805ac5f5` | [READ #38907986248](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38907986248)，4/4 HTTP；5 条直接路由+5 种 Action，身份/策略失败拒绝，最终 44/44 CI |
| E01G [依赖间接安装/重新启用](PA05-E01G-TRANSITIVE-READ-LIFECYCLE-20261016.md) | [#992](https://github.com/jiangxng/EVO-App-Platform/pull/992) · `e8f39d666890` | [READ #38910629602](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38910629602)，6/6 真实 AppManager plan；最终 44/44 CI |
| E01H [撤权与计划竞态](PA05-E01H-AUTHORIZATION-RACE-20261016.md) | [#994](https://github.com/jiangxng/EVO-App-Platform/pull/994) · `aa5bf6312e2a` | [READ #38913166647](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38913166647)，6/6 两次授权/漂移；最终 44/44 CI |
| E01I [异常持久化重启失败关闭](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) | [#995](https://github.com/jiangxng/EVO-App-Platform/pull/995) · `20c8a94772f8` | [READ #38915496275](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38915496275)，真正 Child Host 4/4；最终 44/44 CI |
| E01J1 [2 Host + 3 PG18 共享 READ epoch](PA05-E01J-SHARED-READ-OWNER-EPOCH-PG-20261016.md) | [#997](https://github.com/jiangxng/EVO-App-Platform/pull/997) · **`c9a4ce2b9ebb`**；最终 PR HEAD **`882979d3160c61bbd81531b03195a32cb852b3cc`** | [最终真实 PG18 #38918563740](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38918563740)，**15/15 PASS、0 failed、0 skipped**；该精确 HEAD 的其他相关 READ/WRITE/Platform/Lightweight/Continuity/Human UI 工作流成功 |

## 4. 最易丢失的真实 E01J1 日志、负例及附件定位

**CI-LOG-ORIGINAL（2026-10-19 已再次读取最终准确 HEAD 运行的 job log）：** [GitHub Actions #38918563740](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38918563740)，job `117032265838`，PR HEAD `882979d3160c61bbd81531b03195a32cb852b3cc`，此处保留原关键机读 marker：

```text
PA05_E01J_SHARED_READ_OWNER_PG={
  "physicalClusters":3,"actualSeparateHostProcesses":2,
  "samePhysicalPgAuthority":true,
  "oldReadHeldBlocksRevokeCommit":true,
  "revokeAdvancesEpochAndFreezes":true,
  "oldEpochDeniedBothWorkers":true,
  "explicitRecertificationRequired":true,
  "unregisteredHostRejected":true,
  "productionHostBusinessHandlerIntegrated":false,
  "sqlRoleSeparationCertified":false,
  "productionWriteEnabled":false
}
PA05_E01J_READ_INVENTORY_PG={
  "hostInventoryPinned":true,
  "unauditedHostAdditionDenied":true,
  "operatorMustApproveTwice":true,
  "staleEpochDenied":true,
  "runtimeDbPrivilegeIsolationCertified":false
}
PA05_E01J_PARTITION_FAIL_CLOSED={
  "unavailableAuthorityDenied":true,
  "invalidEndpointDenied":true,
  "noLocalFallback":true,
  "runtimePartitionDuringActiveReadCertified":false
}
tests 15; pass 15; fail 0; skipped 0
```

这些 marker 中的 **`false` 是特意保留的正式“未通过 / 未集成”证据，不能把它们删除或改成 true**。`withReadAdmission` 的 callback 仅为隔离试验中的操作，**不是** Purchase Attention 真实业务 READ；测试连接使用 PG18 CI 角色，**不是**真实 Host 最小权限登录。旧工程提交中发生的 TypeScript `postgres.js` row/generic 返回类型失败发生在正式 PG 测试前，已在同一个 PR 修正；不要把初次失败误写为“安全门禁失败后被弱化”。比较失败与修复的历史 PR commits 可在 [#997 提交记录](https://github.com/jiangxng/EVO-App-Platform/pull/997/commits) 查看。

**易失附件 / 截图说明：** CI 工作流使用 GitHub Actions artifact `pa05-xdb-reservation-pg-evidence`（`pa05-xdb.log`，`.github/workflows/agent-pa05-cross-database-admission.yml`，配置 retention-days 14）。归档后可能因保留期自动过期，所以本篇保存 run/job ID、必要原始 marker、准确 SHA 和源测试路径。**本窗口没有生成独立截图、未上传其他研究附件，更没有长期保留任何一次性 CA/Host 私钥。** 不可编造沙盒附件、图像或下载地址。

## 5. 采用 / 排除方案及适用条件（严格区分原文事实和项目判断）

| 议题 | 来源事实（官网/真实代码/CI） | 本窗口采用的 **J-ENGINEERING** | 排除与限制 |
| --- | --- | --- | --- |
| Host 可选业务装载 | 原 Catalog、AppManager 和 Router 可复用，E01A–C 测试显示默认并未安装 Purchase Attention | 一次由 Host 管理员与 Provider 批准的按需注册，之后仍须独立安装与真实 READ 权限 | 排除默认 import/自动安装、代理自行注册操作；实验 E01A–D 不等于生产 Human |
| READ 生命周期身份 | E01E 真实 HTTP 观察 `trustApproved:true` 而未带 Bearer 也能原接口安装 | E01F 以管理员真实 bearer + 独立 Provider 策略覆盖直达与 Action 入口 | 排除将客户端确认布尔值当成身份；只保护目标包，其他插件通用授权另审 |
| 依赖传播与竞态 | `planInstall` 安装/激活依赖，策略 Provider 异步，E01G/H 重现实际依赖漂移 | 安装计划按真实目标 owner 审核，许可延迟时二次 Provider/plan 复核 | 排除仅核主包、按首次 ALLOW 执行；本地二次检查**不**确保最终安装原子 |
| JSON startup | `manager/store.ts` 普通安装只用内存或本地 JSON；E01D 授权不随 JSON 持久化 | E01I 拒绝启动未经重新认证、包括残留 disabled/orphan Owner，不篡改历史状态 | 排除自动恢复注册/静默清除状态；不构成多 Worker 权威 |
| SQL READ 中央版本 | PG05/06 的单库行锁语义和 E01J1 真实两进程/三物理库测试 | 单一中央 SQL row 锁 + FROZEN/ACTIVE epoch + Host inventory；旧 epoch 拒绝；隔离能力**暂不接生产** | 排除 JS 本地锁、仅声明相同 Host ID 便授权；不能说跨三物理库 global atomic |
| SQL WRITE 与证书 | D14C13 真 CA/CRL、pg_stat_ssl SQL 后端的旧证书会话可存活，SQL epoch 截止已实测 | 保留独立 WRITE Owner PKI/SQLOwner 事实，将 READ 身份与数据库角色隔离作为 E01J2 新增证据 | 排除“吊销证书立刻终止已有 TCP 会话”或拿 WRITE PASS 证明 READ Handler |
| 真实生产 E01 签收 | #979/#988/#913 仍 OPEN，E01J1 标记 `productionHostBusinessHandlerIntegrated:false` | E01J2 先实现可核验 READ SQL Host 身份/受限角色与 Handler 真实使用，再做 Human/Provider/EVO 数据端到端 | 排除仅工程测试 15/15 就关闭 W06 或开生产 WRITE |

## 6. 资料/工程状态冲突与必须保留的区别

1. **旧文档写 `candidate / pending`，PR #997 实际已经 merged：** 旧段落是写入时快照，实际查验 [PR #997](https://github.com/jiangxng/EVO-App-Platform/pull/997) 为 2026-10-16 合并，精确 merge `c9a4ce2b...`；这既不意味着当时的工程没完成，也不等于 PA05-05 实际已签收。本次短交接记录最终 GitHub 状态。
2. **首次 PG18 编译失败 vs 最终 15/15 PASS：** 严格 TS 返回类型、数据库 row mapping 修复于同一 #997 PR；不允许删除失败记录或把修正误写为弱化安全；最终 CI 见 §4。
3. **E01E HTTP 安装成功 vs E01F 后禁止无 Bearer：** 两者发生于不同工程 SHA，后者是明确修复与新负向测试，不是同一状态下来源自相矛盾。
4. **E01H 本机双重授权 vs E01J1 PG SQL 行锁：** 前者只覆盖授权 await 中的状态变动；后者在同一中央数据库事务里串行化 READ/撤权。二者均不证明当前 AppManager 本地安装与 SQL 的双存储原子性。
5. **E01I 本地重启拒绝 vs E01J1 SQL Host epoch：** E01I 是旧 JSON 状态失败关闭；E01J1 是新的中央独立门禁。没有受信任的生产 Host wiring，不能自动“看到 SQL ACTIVE 就重启业务插件”。
6. **PG18 真三物理库 vs 全局事务：** E01J1 使用三个实际不同 physical system identifiers，但 READ epoch 的事务**只发生在中央那个数据库**；不等于第三方系统、Worker A/B 两库同时一致。先前 W06 明确区分网络隔离与 SQL 票据悬挂。
7. **证书授权 vs 活连接安全：** D14C13 的新握手 CRL 与存活后端 SQL policy/epoch 是**两个不同控制面**。不能因官方 CRL 配置就称旧活连接物理退出。
8. **官网已读等级 vs 本次新查阅：** 2026-10-16 的旧索引官方访问事实与 2026-10-19 的 GitHub 交接核验不可合并成“本次又查阅 13 篇”；早期 MCP/Anthropic 索引也不得升格阅读等级。
9. **全局项目主线 vs Agent 专项：** `project.status.json` / 生成 `HANDOFF-LATEST.md` 并未因这些 PA05 PR 更新为生产签收；Agent baseline、专项 `HANDOFF.md` 才是研究/工程进展账。并行 BEX/CP03/Eidos/2D 有独立 owner。

## 7. 后续优先阅读与实际工程落点（未读/未验绝不写 PASS）

| 优先 | 要继续核验的来源方向（已读基础与待读区别） | 真正的下一验收条件 | 对应模块 |
| --- | --- | --- | --- |
| **P0 E01J2** | 先复读已读 PG01–04、PG08–12 **相关章节**并核对当前 PG18 实际授权与 `pg_stat_ssl`；还须**新增真实最小角色/可信 Host 证明，TO-VERIFY** | 独立 Host/Business/DBA 角色，受限业务连接无法更新 owner epoch、inventory、伪造 Host 身份、抢旧 epoch；真实 Host 证书撤销/重发后端权限不绕过 | `manager/pa05-read-owner-shared-sql-gate.ts`、现有 D14C13 SQL 证明与 E01J 新安全测试 |
| **P0 E01J2/3** | 原 `apps/purchase-attention/host-optin.ts` 和业务源 `trading-reference` 真实数据/权限原文（前期读过，最新 HEAD 要重核） | **真实** Purchase Attention READ Handler 在有审计且不可伪造的 SQL/Host 执行边界内运行；撤权后旧 Worker 无法继续发新读，分区时 fail closed；实际数据属于真正企业而非 fixture | `manager/server.ts`、Host Router/AppManager、`apps/purchase-attention`、`tests/agent-line` |
| **P0 全局原子边界** | PostgreSQL [Advisory Locks](https://www.postgresql.org/docs/18/explicit-locking.html) 等官方资料可**未来读取；TO-VERIFY**（本轮未打开该网址）；已有 PG05/06 只够保证同库锁 | 定义统一 Worker/epoch 生命周期、控制平面 outage、跨进程崩溃/已进入操作中断时是否拒绝；不能拿 SQL tx 包裹普通本地文件写入便称原子 | `manager/service.ts`、`manager/store.ts`、E01I/J 门禁 |
| **P1 实际产品认证** | #979 E01–E05 checklist、真实 Owner/Provider/Browse 验收流程（**真实生产证据尚未获取**） | 两个独立可信 Human/Agent 登录、真实企业事实/READ/Provider 输出、用户浏览器验收和可撤销授权/操作收据 | `manager/server.ts`、Personal Agent、Eidos Host 展示（需 owner 协调） |
| **P1 W06** | #913 全局 PKI/worker 执行与网络分区验收，继承 D14C13 证据但不可代替本阶段 READ | 生产候选 CA/Host workload attestation、网络隔离已签发票据、物理 Business Owner 正式确认；此前 WRITE OFF | `apps/object-extension`、`manager/pa05-cross-database-*`，原 W06 issue |

**本索引没有新增 screenshot 或研究附件。** 如果后续遇到网页消失，优先保留原始网址、官方章节位置、历史决策文本和实际测试 marker；没有读过的完整网页不要凭摘要臆造内容。新版或与历史文档冲突时必须写新增核验日期，区分“来源事实”和“工程判断”。

## 8. 跨聊天准确接续步骤

1. **先查最新 main / issue / 未结 PR，不能直接复用 2026-10-16 工程分支。** 截至本篇最初核查 main `42ce894b4129089cbd8a270bd3473f0c93b7657b`；已合并 #997，合并 SHA `c9a4ce2b9ebbffbe469a1fbc48ed046acfa0ce62`，原工程 branch deleted。
2. 启动顺序：`AI-BOOTSTRAP.md` → `project.status.json` → 其 `handoff` → `LLM.md` → `llm.foundation-map.json` → `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` → [短入口](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md) → 本索引 → baseline §§43–53 → E01J1 original decision → #988/#979/#913。
3. 复用 E01A–J1 已合并工程和现有真实 PG18 workflow；只针对 E01J2 的新权限/实际 Handler/分区事实作新的研究和测试。确保 **READ 数据 Owner 与 WRITE Object Extension 的认证账严格分开**，production WRITE OFF。
4. 一个活跃工程 PR；精确最终 HEAD 受影响 CI 通过后合并、清理。不能碰并行 BEX/CP03/Eidos/2D 或全局 `project.status.json` / 生成 HANDOFF-LATEST。真实部署、迁移、生产凭据或业务数据操作另需用户明确授权。
