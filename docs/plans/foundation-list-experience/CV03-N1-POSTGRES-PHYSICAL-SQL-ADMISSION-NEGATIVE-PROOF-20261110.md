# CV-03 N1 — PostgreSQL 生产物理授权：最小 SQL 身份负向证明（2026-11-10）

> **N1 状态：PHYSICAL_ADMISSION_BLOCKED；本 PR 仅 READ-ONLY AUDIT + CI-ONLY NEGATIVE TEST，不代表生产准入或 Saved View 上线。**
> 基线：Platform `main@e7c3c713fdcbabec3255bbb70013b4c3df93bfa9`，承接 [七轮交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md)和[11-10 恢复](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md)。正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF` 保持不变，未改 `manager/server.ts`、生产存储或 secrets。

## 1. 本轮审计的真实证据和纠偏

- **CODE**：[`resources-postgres.ts`](../../../providers/enterprise-context/resources-postgres.ts) 的 `preparePostgresConditionalResourceSchemaV010` 显式创建 `resources` 和 `cv03_resource_receipts`、不可变 UPDATE/DELETE trigger；`putIfRevisionWithReceipt` 在 Node 内验 HMAC，再经同一 PostgreSQL 事务 INSERT/UPDATE resource 和 INSERT receipt。隔离正向测试通过不等于 SQL 登录物理授权已签收。
- **新的物理边界风险**：如果普通运行时 SQL 登录能直接对 `resources` INSERT/UPDATE 和对 `cv03_resource_receipts` INSERT，SQL 本身**不验证 Host HMAC**。这样即使该登录无 `SUPERUSER`/DDL、也无法修改或删除已有 receipt，仍能**绕过 Node 发行器并直接插入伪造的新资源/成功回执**。这不是生产入侵证据，而是当前源码权限模型下必须关闭的设计门禁。
- **Railway 只读元数据（2026-11-10）**：可访问的 `EVO Ledger Runtime MVP` / production 包含 PostgreSQL 18（服务镜像 `postgres-ssl:18`）及一个来源为 `jiangxng/EVO` 的 `EVO Runtime` 服务；**未据此证明该 PG 是 `EVO-App-Platform` 正式 Host Saved View 权威**。没有读取或展示密码/DSN，也没有查询生产表、部署、更改配置或执行 SQL。
- **环境证据不足**：未取得 Platform 正式 Host 服务定位、真实生产 SQL runtime Principal/Schema/GRANT、物理连接目标、单主库路由、密钥签发/验证的 owner 批准。因此 N1 不能标 PASS；也不可拿其他 EVO Runtime 的数据库代替 Platform 授权。

## 2. 本次实际工程增量

| 文件 | 实际作用 | 验证级别 |
| --- | --- | --- |
| [`tools/cv03-n1-postgres-role-audit.mjs`](../../../tools/cv03-n1-postgres-role-audit.mjs) | **只读 SELECT** 检查当前连接的 runtime_role、主库/只读状态、特权角色、Schema/表 DDL 与 INSERT/UPDATE/DELETE、receipt 不可变触发器；不接收 Action/模型参数、不打印 secret | 审计器始终输出 `NOT_CERTIFIED`，不会生成“可以开启 WRITE”的结果 |
| [`tests/agent-line/cv03-postgres-runtime-role-admission.test.mjs`](../../../tests/agent-line/cv03-postgres-runtime-role-admission.test.mjs) | 在**随机、独立的 CI PostgreSQL schema/临时登录**中，授予正常 Node adapter 需用的最小基础 DML，验证 DDL/trigger 篡改被拒，同时通过原生 SQL INSERT 证明未校验 HMAC 的资源与回执可被伪造；检查审计器必须报告 BLOCKED | **NEGATIVE_PHYSICAL_SQL_PROOF**；绝非部署漏洞利用、生产安全扫描、合法 Write 的证据 |
| [PG18 isolated workflow](../../../.github/workflows/cv03-resource-postgres-atomic.yml) | 将上述测试加入已有 `Postgres 18` service CI，与已有两进程 CAS/同事务 receipt/Host 负例并行验收 | 以本 PR 最终 HEAD GitHub CI 为准，不能仅以代码存在宣布 PASS |

### 审计器使用边界（运维 Owner 本地执行）

由真实 Platform Host 运行身份对应的 SQL 登录设置**仅本地环境变量**，不可使用迁移 admin 账号冒充 runtime，不要贴密码/URL 到 PR 或日志：

```bash
# 变量内容只能在私有运行环境中设置，绝不提交到仓库。
# CV03_N1_RUNTIME_DATABASE_URL=<该 Host runtime SQL 登录 DSN>
# CV03_N1_SCHEMA=<已批准的隔离 cv03_ schema>
node tools/cv03-n1-postgres-role-audit.mjs
```

输出仅安全字段与 blocker codes，工具不会写数据库；**退出码 2 属预期的 fail-closed**，不能将该工具改成“全部绿→自动解锁”的部署开关。缺任何 env 只输出 `NOT_CERTIFIED`。此处绝不要求或记录现有生产密钥内容。

## 3. 生产授权方案必须由 Provider/安全 Owner 单独审查

1. **分离角色**：Schema/trigger/function owner 与应用 runtime 登录必须物理不同，runtime 不得为 owner / 具有 membership、SUPERUSER、CREATEROLE、CREATEDB、BYPASSRLS、schema CREATE 或修改历史回执权限。
2. **防伪落库**：不能只用 `REVOKE UPDATE/DELETE` 加不可变 trigger，仍有可直接 INSERT 的绕行。需经独立审计的 **数据库强制受管写入入口**（例如带确切 Host 准入与绑定验证的受限 SECURITY DEFINER API，且正确审核 search_path、执行角色、GRANT、密钥边界与全事务 CAS），或同等可证明不容普通 SQL 登录跳过的物理策略；否则继续 OFF。不要仅添加 PostgreSQL trigger 口头宣称签名验证完成。
3. **重构后复验**：新真实 runtime SQL 登录对资源和 receipt 的**直接 DML 必须被拒绝**，但通过受控写入入口的有效 Host proof 能完成 Resource+Receipt 单事务；无签名、错 keyId、跨人/企业、撤权/停用、修改 digest、重复 key、冲突与丢 ACK 均失败关闭。要求两独立 Host 真实主库路径、重启 readback、迁移/备份/回滚以及角色轮换。
4. **N2 的前置依赖**：未取得物理边界独立 PASS 和 Host key custodian / rotation 审批，禁止移除 `manager/server.ts` 的 403/404、禁止注册正式 Human Save PageSource/Feature、禁止修改 Railway/Tokyo 生产配置。
5. **所有证据显式分层**：SQL 隔离负向测试通过只证明风险存在并被门禁识别；真实生产网络/权限审计与 Human/Agent/Eidos 验收继续 OPEN。原 [CV-00～07 权威计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 与并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的 ownership 保持不变。

## 4. 下一纵切

**N1-02（Provider/DB 安全 Owner）**：先独立设计物理 SQL permit enforcement 与生产角色拓扑，在隔离 PG 上完成**正向受管写入 + 负向直写拒绝**的可执行证明，再由真实 Platform 运行/运维 Owner 用脱敏信息核验目标库、role grants、migration、签名密钥托管和跨 Host 可靠性。N1 未闭合时，本窗口不接 N2/3 页面开放，不尝试部署或更换现有数据库。
