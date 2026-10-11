# TR-01B2D3｜Finance Owner 生产前安全配置与部署预检

**文档类别：LIVING_RUNBOOK。当前结论：B2D3 OPEN / 生产 NOT_CERTIFIED。** 本文不批准生产部署或 Cost/Allocation 财务写入，所有响应必须维持 `executionAllowed:false`。

## 权威资料及证据分类

- **外部一手原文（2026-10-11 复核）：** [PostgreSQL 18 CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html)，特别是 *Writing SECURITY DEFINER Functions Safely* 与默认 PUBLIC EXECUTE 的章节。固定 search_path、创建时同步撤销 PUBLIC 和函数 owner 最小权限均需要真实部署核查。此前交接来源索引的 W01/W02 关于 FOR SHARE/ON CONFLICT 权限仍有效。
- **迁移执行器已读源码（2026-10-11）：** EVO `scripts/migrate.ts` 对每个新 SQL migration 执行 `begin` → SQL 文件 → 记录 schema_migrations → `commit`，因此当前新建函数与文件末尾 REVOKE 在该执行器内同事务；不能据此假定生产曾使用相同执行器或拥有者账号。PostgreSQL 官方原文同时建议将 `pg_temp` 显式置于搜索路径末尾；当前函数只有 `pg_catalog` 并使用 fully-qualified `public.finance_trusted_signing_key`，需要真实函数定义与临时 schema 负控复核，不把“固定路径”当成完整审计。
- **仓库代码（不是生产证据）：** EVO Draft #108 的 `migrations/schema/202610100040_finance_runtime_key_lock_function.sql`、`apps/api/src/finance-owner-readonly-main.ts`、`finance-owner-readonly-app.ts` 和 App Platform Draft #594 的真实独立数据库 LOGIN CI。
- **既有 CI 证据：** App 37/37 工作流成功和 EVO #108 全套 CI 成功，覆盖签名、重放、撤销、隔离进程及 PostgreSQL 实验环境，但不代表真正生产 KMS/OIDC/网络及数据库授权。
- **仍待验证的一手运营资料：** 实际生产 IdP 租户、TLS/mTLS 服务入口、私网 ACL、密钥托管权限、主备数据库和多主机证据；本次没有冒充已经读取的生产资料。

## 自动化：只读 PostgreSQL Catalog 检查

运行于受控终端，在**独立 Finance Owner Runtime 真实 LOGIN** 下使用 `DATABASE_URL`：

```bash
node tools/tr01b2d3-finance-owner-catalog-preflight.mjs --strict-owner
```

该脚本在 READ ONLY 事务中查询 PostgreSQL Catalog；不读取任何密钥行、不插入 nonce、不调用 Cost/Allocation、不修改用户数据，日志只输出失败检查名称和受限状态，不输出连接字符串。不得使用 Operator/Migration/Superuser 的 DB URL 冒充 Runtime 结果。

预期：`automatedStatus=PASS` 且永远 `productionCertification=NOT_CERTIFIED`、`executionAllowed=false`。任何 `FAIL` 都阻止部署。CI 版本**故意不使用** `--strict-owner`：临时 PostgreSQL 初始化/迁移账号有可能是 Superuser；它会输出 `SUPERUSER_OWNER_PRODUCTION_BLOCKER`，只能被认定为隔离测试的权限门槛通过，不能转成生产 PASS。

检测范围：真实 session_user=current_user、NOINHERIT / 非特权账号、database/schema/PUBLIC CREATE 权限、SECURITY DEFINER 固定 search_path、PUBLIC EXECUTE 被撤销、仅授予 runtime 函数 EXECUTE、运行时不能直接读取/写入信任表与审计表、nonce 仅 INSERT + SELECT(issuer,jti)、BusinessData 只读、CostRun/AllocationInstruction 无 INSERT 权限。**不能替代** 人工检查函数主体、函数 owner 所属角色的实际继承授权、集群级默认 ACL、部署私网/TLS、运行进程身份和独立 Operator 权限。

## 生产验收清单（初始全部 OPEN）

| Gate | 要求及留存证据 | 状态 |
| --- | --- | --- |
| DB-A | 保留部署 schema 版本/函数 SQL 定义，核对 `SECURITY DEFINER` 函数 owner 为独立最小权限非 Superuser，审核 `pg_temp`/search_path、schema CREATE 与函数 CREATE + REVOKE PUBLIC 同事务执行及升级路径 | OPEN |
| DB-B | 使用实际生产 runtime LOGIN 运行严格只读预检，独立核对 Operator LOGIN 的最小授予、Grant/Revoke 审计及无 BusinessData/nonce/finance write 权限；不复用 Admin/Operator 凭据 | OPEN |
| PROC | 独立部署 `start:finance-owner-readonly`；强制 `EVO_FINANCE_OWNER_ISOLATED_READONLY=true`、`EVO_FINANCE_TRUST_AUTHORITY=POSTGRES`、专属 DB URL 和显式 HOST/PORT；无 startup trust JSON；通用 Command/Demo/财务写 API 404；容器身份、启动策略、镜像 digest、health 探针有证据 | OPEN |
| NET | 真实 Host→Finance Owner 私有服务发现、allowlist、TLS 证书链/域名验证、反代转发及 mTLS（如果部署要求）；拒绝匿名公网访问，验证证书轮换与故障恢复 | OPEN |
| AUTH | 真实生产 OIDC issuer、audience、callback、会话过期/撤销、principal 与 Enterprise Context、Host→EVO server-trusted tenant map；无测试 IdP/调试 fallback | OPEN |
| KEY | Host 私钥通过正式批准的 Secret Manager/KMS 托管及访问审计，EVO 仅保存公钥信任；检查 Operator 与 Runtime 身份隔离、kid 指针权限、热轮换/撤销/回滚及应急操作留痕 | OPEN |
| HA | 多机器、多实例、主库共享唯一 nonce、撤销提交可见性、网络分区/DB 故障的拒绝策略、LB 行为、无敏感日志和监控告警、回滚 | OPEN |
| FIN | 部署输出仍为 `executionAllowed:false`，没有财务写权限或新 CostRun/AllocationInstruction；B2D4 写入必须独立审批验收 | OPEN |

**边界：** 上述任何 CI success、Catalog PASS 或运行进程 404 都不能单独更新 `project.status.json` 或关闭 B2D3；生产凭据、证书签发、迁移 owner 权限调整和生产部署需独立 Human/Operator 授权。App #594、EVO #108 保持 Draft、不得擅自合并 main；与 Agent、Eidos/2D Designer 工作线隔离。
