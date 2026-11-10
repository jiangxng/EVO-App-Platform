# CV-03 / N1-04b — 企业/主体 SQL 只读隔离 + 撤权事件 epoch 栅栏（2026-11-10）

> **状态：ISOLATED_PHYSICAL_SECURITY_EVIDENCE，生产授权 = NOT_CERTIFIED，Saved View WRITE = OFF。**
> 延续 [N1-04a 签名时效/撤权竞态](CV03-N104-SQL-PERMIT-REVOCATION-ISOLATED-GATE-20261110.md) 与 [N1-03 原 Provider SQL-only 模式](CV03-N103-EXPLICIT-SQL-GATEWAY-PROVIDER-ISOLATED-HANDOFF-20261110.md)。本轮不触及正式 Host、PA05 真实 Feature 注册、线上 PostgreSQL、Railway 或用户数据。

## A. 两个实际填补的隔离工程风险

**1）原 Provider 仍保留资源及回执表裸 SELECT。** N1-04a 的 SQL runtime 只限制直接写入，尚不能防止一个共享 SQL 登录跨企业、跨个人查看 Saved View 与历史回执。因此新增 [按认证 SQL 登录限定租户的受控读取函数](../../../tools/cv03-n1-isolated-tenant-read-gateway.mjs)，并在[现有 Provider](../../../providers/enterprise-context/resources-postgres.ts)内增加完全显式的 `readMode: "SQL_ROLE_SCOPED_ISOLATED_V010"`：

- 只能与已有 `receiptWriteMode: "SQL_GATEWAY_ISOLATED_V010"` 同用；不接入生产 Host，也不能用一个跨多用户共享 SQL 登录冒充真实主体。
- PostgreSQL `SECURITY DEFINER` 读取函数使用 **`session_user`（实际 SQL 登录）**，**不能使用 `current_user`（函数 Owner）**，经独立 Owner 维护的 `cv03_n1_read_scope(SQL login, context, owner subject, enterprise)` 校验。缺映射或 disabled 一律零结果。资源同时核验 `namespace = evo.saved-view.personal.<subject>`、payload owner/enterprise；receipt 核验原 receipt Principal、Enterprise 和原资源的 owner/enterprise。
- SQL runtime 对 `resources`、`cv03_resource_receipts`、`cv03_n1_read_scope` 无直接 SELECT/INSERT/UPDATE 权限，仅允许显式 `EXECUTE` 单独 get/list/receipt 函数。**函数缺失或被撤权时 Provider 失败，不回退裸 SELECT。**
- 独立的 [真实 PG18 两身份回归](../../../tests/agent-line/cv03-n104b-tenant-read-isolation.test.mjs) 创建两家企业 A/B 的两个独立 SQL LOGIN、A 企业另一位人员，以及历史回执，实测同主体成功、跨企业/跨主体 resource 和 receipt 皆不可见；关停 A read scope 后 A 的 GET/LIST/Receipt 立即不可见，不影响 B。历史 receipt digest 沿用原 `committedFromReceiptRow` 校验。测试用数据为随机独立 schema 下 DBA 构造的 fixture，**不代表签名写入或身份管理已完成生产接线**。

**2）授权镜像遇到乱序/漏事件可能被旧的 ENABLE 复活。** N1-04a 只测试拥有一条当前授权镜像。现在在 [原隔离 SQL Gateway 生成器](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs)里把测试镜像拓展为 `authority_epoch` 和 `mirror_healthy`：

- 新的 **Owner-only `cv03_n1_apply_owner_policy_epoch`** 只接受正序事件。首次从 epoch=1 启动；当前 epoch 之后的重复或旧编号返回 `STALE_IGNORED`；遇到 epoch 跳号时自动把 `enabled=false`、`mirror_healthy=false`、记录最高 epoch，并返回 `GAP_FAIL_CLOSED`。
- SQL 写入函数必须同时满足 `enabled=true AND mirror_healthy=true`，并以 `FOR SHARE` 锁保护授权检查和资源/回执同事务。一个已发现的事件缺口不能通过补发旧的 ENABLE 或只修改 enabled 标志重新开放写入；**需要权威 Owner 的完整快照重新同步与独立评审**。
- 新增真实 PG18 回归：模拟先收到 revoke epoch 2，再收到旧 enable epoch 1；模拟跳过 epoch 3 收到 enable epoch 4；之后即使 DBA 误把 `enabled` 修改为 true 仍被 `mirror_healthy=false` 阻断；普通 SQL runtime 对该 Owner 函数的执行权被拒绝。

## B. 可验收级别（明确不能跨越）

| 维度 | 证明 | 未获生产签收的部分 |
| --- | --- | --- |
| 物理读取隔离 | 两个真实隔离 PostgreSQL LOGIN、不同企业/用户、原 Provider GET/LIST/receipt 三通路 + 直接 SELECT 拒绝 | **真实 PA05 用户、Human/Agent 到 SQL identity 的权威绑定及动态连接池隔离**。生产不能按一个测试 SQL 用户对应一个实际 Human 的假设直接部署 |
| 撤权顺序 | Owner 输入模拟有序 epoch、旧 epoch 防重放、发现跳号后锁定不健康、错误修复不解锁 | **真实 PA05 Feature、主体撤权、切换企业、停用插件的可信事件生产者、投递、认证、回放、顺序与全量恢复**；没有到达 DB 的事件无法被 DB 自行感知 |
| 双进程与故障恢复 | N1-03 原 PG18 双 OS 进程 CAS、丢 ACK 重启 readback、原旧回执重放仍保持测试 | 真实生产两 Host、事件总线断链故障、失联 fail-closed 与回滚时序 |
| KMS、SQL DDL 与密钥 | 模拟 NOLOGIN 表 Owner、最小 SQL grants、隔离短效签名/镜像 | 正式密钥托管/轮换、`SECURITY DEFINER`、pgcrypto/扩展授权、migrations 和备份恢复的**生产 DB/安全 Owner 签收** |
| 人机页面/Agent | 无改动 | N2 正式 Feature、N3 Human 页面、N4 桌面+390px 浏览器、N5 外部 LLM/授权 receipt 均不属于此轮 |

**重要安全结论**：本轮不声称“真实 PA05 撤权同步已经实现”。真实授权失效事件若**从未送达** DB，即使 test mirror 存在 epoch 机制也无法凭空发现。架构上须定义可信签发/事件认证、最长故障闭锁窗口、授权 epoch 的正式一致性规则与运行身份，不满足时生产 WRITE **不得启用**。

## C. 执行和代码所有权

- 本 PR 的 PG18 workflow 在 **仅 `CV03_N1_ONLY_ISOLATED_GATEWAY_TEST=YES_CI_LOCAL` 且 DSN 强制 `127.0.0.1/localhost:cv03proof`** 的随机 schema 上运行两套真实 SQL 权限负例，并要求 0 skipped；工具脚本只生成 SQL，**绝不自动建库或向生产迁移**。
- 影响文件仅 SQL read Gateway builder、N1-04a 隔离 epoch builder、原 Provider 显式读取分支、两份隔离 PG18 测试、CI workflow、本交接以及 README 导航。没有其他框架或业务 Feature 注册、没有 Railway 改动；并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 及权威 CV 计划文件不改。
- 下一项 **N1-04c** 应由 Platform Host / PA05 Owner 制定实际身份/租户对 SQL runtime 的安全映射、可信权限 epoch 同步及断链错误处理；DB Owner 审批迁移、授权 GRANT 和实际读写最小权限、密钥轮换、备份/恢复，再提交脱敏的生产物理验收。**N1 继续 NOT_CERTIFIED**，正式 保存表单 404、保存命令 WRITE 403。
