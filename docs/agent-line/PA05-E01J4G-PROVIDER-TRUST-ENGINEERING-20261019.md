# PA05-05 / E01J4G — 请求绑定 Provider 可信恢复组合（2026-10-19）

**文档类别：DECISION_RECORD / ENGINEERING_EVIDENCE（本轮代码实施决策）。** 已接受的 [E01J4G 生产信任缺口评估](PA05-E01J4G-PRODUCTION-OPERATOR-TRUST-BOUNDARY-20261019.md)不被本文件覆盖。工程结果以 PR #1053 最终 HEAD GitHub CI 为准，**生产真实 IdP/凭据/维护 CLI 仍 NOT_SIGNED**。

## 1. 最小实施范围与依据

- 仓库事实：`manager/server.ts` 的在线管理员 Provider 授权在 E01I 启动阻断前不能通过 HTTP 访问；J4F `recoverPa05ReadOwnerPrestartupUninstallV010` 原本要求可信调用方传入 `authorizeHostOperator()`，但测试仅用环境变量布尔谓词。J4E 已实现 DBA `SECURITY DEFINER` + `session_user` 的最小权限 SQL；J4F 原 PostgreSQL18 24/24 证据不重复。
- 本轮新增 `manager/pa05-read-owner-trusted-prestartup.ts`。仅可由**已可信加载的内部 Host 维护环境**调用，不新增启动 Hook、HTTP/API/Agent Tool、CLI 或生产密钥。显式 `mode:OPT_IN`；请求绑定的 `identity.session.request` Provider 验证 bearer，要求 HUMAN、有效且未过期的有界 Session；`authorization.check` Provider 对 `host.plugin.lifecycle.prestartup-uninstall-recovery` 与精确 `evo-purchase-attention@hostId` 作即时 ALLOW，拒绝 obligations 与 Provider 异常。继承 J4F/J4C 的再授权策略，不缓存上一次 ALLOW。
- 完成认证且写入 **非秘密 AUTHORIZED 审计事件**后，才用 `secrets.resolve` Provider 读取 `INSTALLATION / hostId` 范围的 `pa05-read-lifecycle/operatorDatabaseUrl`；随后调用原 J4E SQL operator 函数、J4F pending→ASSERT→AppManager UNINSTALL→COMPLETE。只输出非秘密 COMPLETED 审计。秘密、Bearer/SQL URL/数据库异常不在错误或审计中回显。可能 SQL FENCE 已提交而本地失败时报告 UNKNOWN，不自动回滚中央 READ revoke。
- 既有 E01I 隔离保持不变；READ Owner 不会自动重新安装或授予权限。生产 credential issuer、DBA 配置、操作员身份来源和独立可运行入口 **未实现/未签收**；即使独立测试通过也不宣称生产可用。

## 2. 原始源码与测试索引（2026-10-19 GitHub）

| 证据 | 原始项目路径 / 用途 |
| --- | --- |
| 代码新增 | [manager/pa05-read-owner-trusted-prestartup.ts](../../manager/pa05-read-owner-trusted-prestartup.ts)：Host 内部信任组合，复用现有平台三类 Provider |
| 新增负面 | [tests/agent-line/pa05-e01j4g-operator-trust-pg.test.mjs](../../tests/agent-line/pa05-e01j4g-operator-trust-pg.test.mjs)：错误/过期/非 HUMAN 身份、无策略、错误 Host、义务未满足、Provider/audit/Secrets 故障 fail closed，不暴露 token/SQL URL |
| 实 SQL 正面 | [tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs](../../tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs)：保留 J4F 的真 SIGKILL 和原 E01I，增加第二次真实 PG18 使用 Provider 授权+Host-scoped secret 的 J4G 恢复，证实 central approved_epoch 仍为 0 |
| CI 门禁 | [.github/workflows/agent-pa05-cross-database-admission.yml](../../.github/workflows/agent-pa05-cross-database-admission.yml)：三独立 PostgreSQL18，**25/25、0 skipped**，必须同时有 `PA05_E01J4G_PROVIDER_DENIAL` 与 `PA05_E01J4G_TRUSTED_SQL_RECOVERY_PG`，且保留旧 24 项的 marker |
| 第一轮真实结果 | [Actions #39269428201](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39269428201)：**原始 job log 25/25 PASS, 0 skipped**，J4G 两个 marker 均出现，但最终 CI **FAILURE**，原因是工作流尾部仍检查旧 `ℹ tests 24 / ℹ pass 24`；不是 SQL 测试失败。本 PR 同分支更新为 25 并补 marker 检查，最终证据必须以新 HEAD 重跑为准 |

以上源码和 Actions 是 **2026-10-19 本轮亲读 GitHub 原始内容/日志**；未访问 PostgreSQL 官方原文、没有访问生产 DB 或生产 Secrets。既有官网知识仍按前期历史索引的访问等级。

## 3. 明确保留的阻断项

- 本工程只证明接口组合与隔离 Host/PG18。生产操作员的真正 OIDC/工作负载可信来源、DBA role/证书/密钥托管与轮换、值班维护 CLI/运行手册、审计持久落盘签名、临时操作员离职撤销等仍需要实际生产证据。
- `postgres.js 3.4.9` TCP 断链原进程崩溃、静默黑洞、跨 Worker 全局状态与 PostgreSQL+JSON 非原子、PA05-05 E01–E05/W06 **仍 OPEN/NOT_SIGNED**。
- 不部署 Railway，不启用 production material WRITE，不变更 BEX/CP03/Eidos/2D 或全局项目状态文件。原研究资料、J2–F 决策、17→24/24 原始测试不重写。

## 4. 首轮完整 GitHub CI 修复后原始 PASS（最终 HEAD 仍以 PR 核验）

**2026-10-19：** 原 PR #1053 内工作流旧 24 项计数修正及强制 J4G markers 后，代码/文档审查 HEAD `b00faf208cfc0d8b77471e6adbe21935485fb174` 的 [三 PostgreSQL18 Actions #39270223784](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39270223784)，job `118120255282` **原始日志已读**：`ℹ tests 25`、`ℹ pass 25`、`ℹ fail 0`、`ℹ skipped 0`，两条 `PA05_E01J4G_PROVIDER_DENIAL`、`PA05_E01J4G_TRUSTED_SQL_RECOVERY_PG` 均真实输出，job SUCCESS。同 HEAD 的 Platform/protocol-and-core、WRITE、READ、Lightweight Host、Human UI、Continuity 已核对 **8/8 SUCCESS**。历史首次 #39269428201 的 25/25 测试成功但脚本失败保留，不将旧 FAIL 擦除。

这只能签 **E01J4G 工程可复用信任组合的隔离验证**；真实生产身份源/凭据/CLI/DBA、全局 E01J4、PA05-05 E01–E05 与 W06 均未签收。最终 PR HEAD 若因文档补充再前进，需在新 HEAD 重跑 CI 才能合并。
