# TR01B2D3｜六条生产准入工程线与真实 Railway 阻断证据

**Document type: LIVING_RUNBOOK (2026-10-11). Gate: TR01B2D3 OPEN; executionAllowed=false.** 本文不是生产上线批准、数据库迁移计划执行令，也不关闭 B2D3。

## 研究来源 / 等级

1. **已读取一手官方原文（2026-10-11）：** [Railway Private Networking / How It Works](https://docs.railway.com/networking/private-networking/how-it-works)：Railway 服务 private DNS、WireGuard 内部通道及内部 HTTP 推荐；它不能代替本项目 Host↔Finance Owner 已确定的 HTTPS+应用对等身份验证。[PostgreSQL 18 ALTER FUNCTION](https://www.postgresql.org/docs/18/sql-alterfunction.html)：函数 OWNER 迁移要求的角色权限。该两份原文与本次各个门禁的业务口径要分开。
2. **实际环境直接观察（2026-10-11；Railway 用户授权连接器、只读资源和服务配置）：** `docs/roadmap/TR01B2D3-RAILWAY-PRODUCTION-READONLY-INVENTORY-20261011.md`；参照 `tests/fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json` 的**脱敏历史快照**。这不是自动刷新的实时来源，精确采集秒数没有记录，故不虚构时间戳。未读取任何变量值或密钥。
3. **已读取源码（固定 B2D3 Draft）：** `apps/trading-reference/finance-owner-remote.ts`、`apps/trading-reference/finance-owner-key-pointer.ts`、`manager/secret-store.ts`、`tools/certify-tr01b2d3-cross-instance-races.mjs`、`tools/certify-tr01b2d3-host-https-identity.mjs`；EVO `202610110010_finance_key_lock_definer_least_privilege.sql`。
4. **此前实际 CI：** EVO #108（已集成 #111）27/27；App Platform #594（已集成 #627、#633、#636）39/39。均为 CI 临时资源，**不是**生产现场证明。
5. **本轮工程判断（非上游事实）：** 将实际生产准入拆分为六个明确 fail-closed 的负控门槛，单个证据引用或静态配置声明无法自证生产合格。

## 六条线：代码、可复现证据、真实缺口

| # | 工程线 | 实现与负控 | 现有生产阻断 |
| --- | --- | --- | --- |
| 1 | Private TLS | `privateTlsGate`：要求独立只读进程、无公网域名、精确私网 HTTPS URL、CA+peer identity；`tr01b2d3-private-tls-probe.mjs` 进行**真实 TLS 握手**，负控证书主机名不符、CA 不信任、未监听端口 | Finance Owner 私网服务未存在；没有现场 CA/SAN/mTLS 证明 |
| 2 | DB Migration | `migrationGate`：旧 EVO pre-deploy 自动迁移阻断，SQL digest、专用迁移账号≠运行时账号、严格 Owner Catalog 与独立审批证据 | Railway 实测通用 EVO `preDeployCommand=node dist/scripts/migrate.js`，不可凭 CI 擅自合入/迁移 |
| 3 | OIDC/Session | `oidcSessionGate`：HTTPS issuer、registered audience/client、PKCE S256、JWKS、tenant server mapping、secure managed cookie、无 static session fallback | 变量名不是 IdP 的真实部署验收；缺少 IdP/企业/会话现场负控证据 |
| 4 | Key Custody | `keyCustodyGate`：Host 私钥与 Owner 隔离、外部受审计 Vault、指针失败拒绝、Operator 分权及轮换/撤销证据 | 当前源码有加密本地文件 SecretStore，**不等于已集成 KMS/Vault**；不可伪称已有生产外部密钥托管 |
| 5 | Multi-instance | `multiInstanceGate`：至少两独立 Finance Owner 节点、共享 PostgreSQL 唯一 nonce、重放/撤销、DB outage、upstream outage 的拒绝证明 | 生产 Owner 为零实例；现有双进程 PostgreSQL CI 不等于跨生产工作节点验收 |
| 6 | Release/Rollback | `releaseRollbackGate`：依赖前五线、固定两个仓库 commit 和 image digest、明确无财务写权限、回滚撤销 key 与恢复私网、独立操作者证据 | 缺少独立上线批准和真实回滚演练，**禁止直接合并 main/部署** |

### 它能证明什么、不能证明什么

- 真实 Railway 快照一运行就返回 `status:BLOCKED`，包括 `OWNER_DEDICATED_SERVICE_MISSING` 和 `EVO_AUTO_MIGRATION_NOT_ISOLATED`；此阻断是**成功测试出不合格条件**，不是服务发生事故。
- CI 中构造的 synthetic perfect 候选即使符合全部静态字段，也只能得到 `CANDIDATE_ONLY`，永远 `productionCertification:NOT_CERTIFIED`、`deploymentAuthorized:false`、`executionAllowed:false`。人工提供的 `sha256` 证据引用只有**基本格式检查**，并没有签名验真或现实环境核验，不能自证通过；上线前要独立对照真实资源。
- 负控拒绝 `http://` 私网绕过、公开 Owner 地址、错误 CA/主机名、OAuth 静态退回、权限混用、无密钥撤销、失效 DB、任意镜像标签、财务写入打开，以及在脱敏清单中混入 PEM/数据库 DSN。
- 旧的 SQL 权限、真实 OAuth/HTTPS、重放并发验收继续保留；本次工具不更改它们，不重复认领已验证过的 CI 为新的生产证明。

## 运行 / CI

```bash
node --test tests/protocol/tr01b2d3-six-lane-admission.test.mjs \
  tests/protocol/tr01b2d3-private-tls-probe.test.mjs
node tools/tr01b2d3-six-lane-admission.mjs \
  tests/fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json
# 故意退出码 2：当前真实生产环境被挡住，不能误当上线通过
```

`.github/workflows/tr01b2d3-six-lane-admission.yml` 启动 **六个独立 GitHub Job**，分别运行定向正反向断言，另外各自断言当前真实资源清单应返回阻断与 `NOT_CERTIFIED`。PR 必须记录精确 head SHA、对应 CI job/run、已知失败和更正。不在 CI 部署 Railway 或修改数据库。

## 下一次现场验收与依赖关系

优先由正式 Operator 在隔离环境完成：1. 定义私网 TLS 服务身份与证书轮换方法；2. 将受控安全迁移与当前 EVO 通用运行时 pre-deploy 分离，保留审计/回滚；3. 提供真实 IdP/企业映射/会话现场证据；4. 确认实际 Vault/KMS 集成及密钥权限；5. 分开实例测试故障；6. 复查只读 Finance Owner 与原始 Sales/Cash/Cost/Replay 事实及双仓不可变版本。无批准时仍应 STOP，不能调用财务执行或 B2D4。

本窗口只处理 B2D3 安全准备。**不得修改** `project.status.json`、`HANDOFF-LATEST.md`、Agent/2D Designer 主线、任何生产资源或财务业务数据。原始研究和新判断都留在 GitHub 相应功能分支；下一轮按 bootstrap/handoff 文档继续。
