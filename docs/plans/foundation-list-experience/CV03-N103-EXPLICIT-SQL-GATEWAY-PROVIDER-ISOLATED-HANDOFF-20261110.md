# CV-03 N1-03 — 显式 SQL-only Provider 与独立 Worker / 丢 ACK 恢复（2026-11-10）

> **状态：ISOLATED_ENGINEERING_GATE（以最终 PR HEAD 的真实 PostgreSQL 18/Host CI 为准），PRODUCTION_ADMISSION=NOT_CERTIFIED，CV03 Human WRITE=OFF。**
> 本文承接 [N1-01 物理 SQL 直写绕行证据](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md)、[N1-02 隔离数据库强制签名 Gateway](CV03-N102-SIGNED-SQL-GATEWAY-ISOLATED-PROOF-20261110.md)和[七轮交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md)。这是现有 Enterprise Resource Provider 的**增量适配**，不是第二套业务框架。

## 本次实际代码

| 层 | 变更 | 边界 |
| --- | --- | --- |
| [原 Provider](../../../providers/enterprise-context/resources-postgres.ts) | 增加显式 `receiptWriteMode: "SQL_GATEWAY_ISOLATED_V010"`（未被正式 Host 设置）；`putIfRevisionWithReceipt` 仍校验原 Principal/Enterprise/Owner/digest 绑定，然后只调用 N1-02 的 PostgreSQL `cv03_n1_signed_save`，利用原 `stableResourceReceiptJsonV010` 给出完整输入/Host envelope/预期资源/完成回执；PG **独立** HMAC 验证与事务 CAS；返回值再以原 `committedFromReceiptRow` 的 SHA 真实性校验 | Runtime SQL 登录不需验证密钥；如 SQL 函数未安装、调用失败、预期资源不符、回执无效，**绝不回退旧直写** |
| 双模式兼容 | 原未选择模式时保持历史隔离直写测试行为；显式 gateway 模式下无符号 `putIfRevision`、`archiveIfRevision` 即时拒绝；如向 gateway 传入 `trustedHostReceiptKeys` 则构造阶段拒绝 | **默认仍不是生产 WRITE**：正式 Host 没安装 Save Feature，`manager/server.ts` 仍拒绝，既有直写仅为旧隔离用例。后续生产模式要单独评审/认证，不能把隔离枚举当发布开关 |
| [真实 PG18 回归](../../../tests/agent-line/cv03-n1-signed-sql-gateway.test.mjs) + [OS Worker](../../../tests/fixtures/cv03-n1-gateway-provider-child.mjs) | 在测试专用随机 Schema、NOLOGIN owner、仅 SELECT + EXECUTE 的 runtime 下，证明原 Provider 的显式 SQL-only 保存、签名/错误输入拒绝、历史回执回读、两个独立 Node 进程同一 revision 只成功一个、子进程提交后丢 ACK 再由新的 Provider readback + 同幂等键 replay | 子进程只拿合成签名 envelope 和临时 SQL 连接，不拿 Test Signer secret；测试限定 `CV03_N1_ONLY_ISOLATED_GATEWAY_TEST=YES_CI_LOCAL` 且数据库必须 `localhost/cv03proof`，不会指向 Railway |
| [原 PG18 专项 workflow](../../../.github/workflows/cv03-resource-postgres-atomic.yml) | 运行原 C3-01/C3-02、N1-01、N1-02 与 N1-03 的整组真实 Postgres 测试，检查每个 PR 的最终 HEAD | 单项 PASS 不等于生产授权通过 |

### 关于不可绕行的重要区分

- Gateway 的 SQL 运行账户可以对资源表及回执表只读（供现有 `get/list/getCommittedWriteByIdempotencyKey`）；**不能 INSERT/UPDATE/DELETE**。这允许保留老 Provider 的读接口，但**不代表数据库层已经实现业务行/列读取权限**；线上读查询仍必须在现有 Host/Domain Owner 执行权限校验，生产是否进一步使用 RLS/受限查询需单独审。
- N1-02 `SECURITY DEFINER` 函数及私有 verifier key 的 SQL 权限还只是隔离证明，且不具备正式的 Migration、备份恢复、密钥 KMS/轮换、在线 Feature 撤权再检、真正 Host permit issuer 绑定和生产签名人审批。
- 读回先检查历史 committed receipt，不用当前已变更的 Saved View 重算旧资源，避免提交后又更新导致旧重放无法恢复；未知 ACK 只能经原回执检索和幂等核对后判断，不得盲目重试。
- SQL 函数无法独自知晓刚刚撤权/停用的 **PA05 Feature** 及外部身份提供方状态；正式接线需要在签发与数据库提交间明确 TOCTOU 审批边界、permit 生命周期及撤权后的拒绝策略。**本次未证明真实撤权竞态已经解决**。

## 下一步 N1-04 / 正式物理准入

1. **Platform Host/PA05 + Provider 安全 Owner** 联合评审原 SQL-only 路径及受控函数内 scope/schema/业务字段白名单，明确生产级签名、TTL/撤权时序与确认/回执策略。真实数据库的 SQL role/GRANT/READ 封闭按脱敏物理证据验证；不能用测试 Postgres 身份冒充。
2. **DB 运维 Owner** 审批正式 Gateway Migration、对象所有者、`SECURITY DEFINER` 的函数搜索路径、schema DDL ownership、pgcrypto 扩展安装/版本、密钥保管/轮换、备份/还原/灾难恢复、同主库多 Host 的网络路由。
3. **再次工程测试** 两真实授权 Host 进程面对同一正式共享 Primary 的 CAS/冲突/重复回执和 Kill-After-Commit；失效签名、未知 keyId、篡改 Digest、跨主体/企业及 Feature 撤权时序必须失败封闭。
4. **仅在 N1-04 有独立正式签收后** 才可继续 N2 正式 Feature 注册和 Human/Eidos 页面接线；N2/3/N4/N5 不归本轮抢做。当前 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，Page GET 404，Saved View WRITE 403。

## 窗口治理

本阶段只修改上述 Provider、隔离 PG18 tests/fixture/workflow、本交接及 README 导航；不碰 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 并行文档文件、`manager/server.ts`、Railway/生产 SQL/secret 或已有用户数据。流程为精确 main HEAD → 独立分支 → Draft PR → 全部必要 CI 绿 → 按治理合并 main、自动清理过程分支。**任何隔离测试、确定性 Agent、软件设计审查均不等同真实 Human/390px/外部 LLM 签收**。
