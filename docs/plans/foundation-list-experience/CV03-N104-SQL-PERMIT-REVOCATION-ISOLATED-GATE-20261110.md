# CV-03 N1-04a — PostgreSQL 签名时效、撤权镜像及不降级门禁（2026-11-10）

> **状态：ISOLATED_SECURITY_ENGINEERING_PROOF；PRODUCTION_ADMISSION=NOT_CERTIFIED。** 原 Host 的 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF` 以及 GET 保存页 404 / POST 保存命令 403 均未改变。本工程仅针对 N1-03 已存在的 **SQL_GATEWAY_ISOLATED_V010** 路径，不启用 N2 Feature。
>
> 基线：`main@30a24bce811b6bc19a77216b406a8a67e8cdc092`，接续 [N1-01 物理写入绕行](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md)、[N1-02 SQL 受控写入](CV03-N102-SIGNED-SQL-GATEWAY-ISOLATED-PROOF-20261110.md)、[N1-03 原 Provider + 双进程恢复](CV03-N103-EXPLICIT-SQL-GATEWAY-PROVIDER-ISOLATED-HANDOFF-20261110.md)。保持既有 Eidos + Platform / Domain Owner / PA05 的权限分层，不添加第二套业务框架。

## 1. 新增可执行的**隔离**安全边界

| 责任域 | 具体实现 | 安全结论 |
| --- | --- | --- |
| DB 物理可信签名 | 测试 SQL Gateway 对验证密钥行取 `FOR SHARE`，与运维禁用 key 的 `UPDATE` 串行化 | 不能在同一 DB 事务内已禁用密钥又成功提交新签名；但**生产 KMS、key 轮换/灾备尚未验收** |
| 签发时效 | 独立 PostgreSQL `clock_timestamp()` 核验签名的 `requestedAt`：有效期最长五分钟、只容许最多 30 秒正向时钟偏差，非法日期/时间缺失拒绝；原 Host receipt 的 `requestedAt` 与原 input `recordedAt` 已绑定到签名摘要 | 对**新 WRITE 调用**拒绝过期/过远未来 permit。**已提交历史回执仍可经独立读 API 读取**，并非重放写权限。时间阈值只是隔离默认候选，生产必须由安全 Owner 审批 |
| 物理撤权检查 | 在**测试 schema** 中增加仅 DB owner 可写的 `cv03_n1_operation_policy(context_id,principal_subject_id,operation_id,enabled)`；SQL 函数对 `collection.saved-view.personal.save` 做 `SELECT ... FOR SHARE`，无行/失效立即拒绝。无 `SELECT/INSERT/UPDATE/DELETE` 权限的普通 runtime 不能私自启用 | 即使原 Host HMAC 有效，**签名后数据库镜像已撤权则拒绝提交**。并通过在运维事务尚持有 UPDATE 行锁时并发进入 gateway，证明待锁结束后看到最新已撤销状态 |
| 原始业务边界 | 限制 `evo.saved-view.personal.<principalSubjectId>` namespace 必须严格等于 receipt 主体，而不是只看宽松前缀 | 不能把一个人的签名用于另一个人的 Personal namespace |
| 不允许降级 | 模拟**完全没有受控 SQL 函数**的情形，即使用有表 INSERT 权限的特权连接实例化显式 Gateway Provider，也必须失败而无资源新增；不切回原 `putIfRevision` / raw DML | 守住 N1-03 的 no-fallback 不变量；不会让缺失 Migration 变成静默不安全保存 |
| 身份、原子性及恢复 | 保持 N1-03 的真实双 Node OS Worker 一赢一输、丢 ACK 后重建 Provider 回读、旧回执在新版资源上的幂等重放 | 仍属 **隔离 PG18**，不代表两个已部署生产 Host 或 Human 验收 |

实现仅变更 [SQL 试验生成器](../../../tools/cv03-n1-isolated-signed-sql-gateway.mjs) 与 [现有 PG18 集成测试](../../../tests/agent-line/cv03-n1-signed-sql-gateway.test.mjs)。生成器**不会自动执行 DDL**；测试具备 `CV03_N1_ONLY_ISOLATED_GATEWAY_TEST=YES_CI_LOCAL` 且 DSN 必须指向本机 `cv03proof`，在随机 schema 中初始化 NOLOGIN owner 和受限 runtime，结束后清理，永不接触 Railway/PostgreSQL 生产实例。

## 2. 不可将隔离撤权镜像等同 PA05 生产授权

最重要的剩余缺口：SQL 里 `cv03_n1_operation_policy` 的授权状态由 **测试管理员主动维护**，尚无正式 PA05 Feature 安装/停用、用户撤权、退出企业、切换 Enterprise Context、Human/Agent 统一 ActionRouter 与数据库物理准入之间的**真实、可靠、可恢复且可证先后顺序的事件同步协议**。

- 如果真实 Feature 撤权已发生而 DB policy 未收到，**本 SQL 镜像依然可被误认为已授权**。因此未完成外部撤权事件同步、故障关闭和重放边界验收前，**绝对不能把此测试模式接到正式 Host**。
- 生产中应定义单一授权权威与顺序栅栏，例如**签发短效 permit + 经数据库审计的明确授权 epoch / revocation watermark**；撤权事件落库前无法保证“撤权即刻拒绝”时，必须拒绝新签发、停用 Feature WRITE 或给出经审批的一致性语义。需要测试撤权、切企业、停用插件三种行为，并分别检查 Human 与 Personal Agent。
- N1-03 的 runtime 在隔离测试下具备资源/回执表 SELECT，以供既有原 Provider 回读；**此权限目前并不提供跨企业行级 RLS**。生产不可将这种跨企业明文读取权限授予业务 App SQL 主体；需以 tenant-bound read gateway 或经审计的 RLS/授权代理完成读边界，再谈生产数据库角色。
- `SECURITY DEFINER` 的函数所有权与 `pgcrypto` 安装和可替换性、search_path、triggers、grants、备份/恢复、密钥保管及轮换还需 DBA 安全审查。N1-04a 不给生产角色创建或变更权限。

## 3. 本次 CI 门禁和下一批 N1-04b 实施前提

**本次**要求准确最终 PR HEAD 的 `isolated-postgres-resource-cas` 展示新增 PASS 标识、无 `skipped`、原 N1-01/02/03 仍绿；项目连续性、轻量 Host 和 Human UI 审查也必须全部成功。CI 日志如有失败必须修正后复跑；源码存在不能冒充真实运行。

**N1-04b 的真实外部依赖（不能模拟成已经实现）：** Platform Host/PA05 Owner 定义授权权威和撤权同步；DB Owner 选择生产认证身份、部署实例与 SQL schema，审批安全 migration、只读访问隔离、备份回滚、密钥 KMS 与轮换；经脱敏审计拿到真实生产 role/GRANT/DDL、DNS/单 Primary 路由；最后真实 Human/Personal Agent 的撤权/换企业/停用插件/跨主机回读验证。未签收以前不得删除 403/404，也不得发布 Railway。

## 4. 文件所有权与交接

本窗口只维护 `tools/cv03-n1-isolated-signed-sql-gateway.mjs`、对应隔离 PG18 test、此 N1-04a 交接及 README 链接。保持 [并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的状态与文档归属不受干扰。遵循独立分支/PR、CI 绿、合 main、删除过程分支；不涉及正式 Provider/Host/生产证书更新。
