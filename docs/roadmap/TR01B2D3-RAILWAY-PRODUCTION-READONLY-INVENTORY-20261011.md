# TR01B2D3｜Railway 生产环境只读清点与部署预检（2026-10-11）

**文档类别：HISTORICAL_SNAPSHOT**。**结论：真实生产 Finance Owner 独立部署仍未存在，B2D3 OPEN / NOT_CERTIFIED。**

## 证据等级与取得方式

- **R01 Railway 用户授权连接器读取的实时资源元数据（2026-10-11）**：调用 `list_projects`、`describe_environment`，针对 `EVO Ledger Runtime MVP / production` 进一步以 `describe_service` 读取 EVO Runtime、Ledger Configurator、Postgres。仅查看服务/网络/部署/变量**名称**，未调用读取变量值、机密、日志、SSH、部署或变更接口。不是依靠对仓库状态推测生产。
- **W04/W05 本轮打开的官方原文（2026-10-11）**：[Railway Private Networking / How It Works](https://docs.railway.com/networking/private-networking/how-it-works)，`Internal DNS`、`Supported traffic`、`Encryption & security` 与 `Build VS. Runtime`；[Railway Variables](https://docs.railway.com/variables)，`Sealed variables`；[Railway Lock Down Production](https://docs.railway.com/guides/lock-down-production-project)。
- **G 本轮已读源码**：App Draft #594 `apps/trading-reference/finance-owner-remote.ts`（非 localhost 测试必须 HTTPS 且验证 response `executionAllowed:false`）；EVO Draft #108 的隔离 read-only main/app；EVO `scripts/migrate.ts` 逐迁移事务，Additive #111 `202610110010_finance_key_lock_definer_least_privilege.sql`。
- **CI 历史**：[EVO #111 CI #38094924409](https://github.com/jiangxng/EVO/actions/runs/38094924409)、[App strict Catalog #38095179803](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095179803)。只证明临时 PostgreSQL，不能替代 R01 生产清点。
- **未核对**：真实 Vault/KMS secret policy、主库实际 GRANT/function owner、生产服务证书/CA/mTLS、IdP 客户配置、网络访问控制、Host↔Owner 实际流量。不得冒充 R01 已验证这些内容。

## 当日真实可见生产布局（脱敏）

项目 `EVO Ledger Runtime MVP`、环境 `production`、区域均为 `sfo`，配置无待提交 staged change；服务清单：

| 服务 | 源与部署特征 | 可用于 B2D3 的确切事实 |
| --- | --- | --- |
| `Ledger Configurator` | `jiangxng/EVO-App-Platform:main`，单实例，`npm start`，有外部 public domain、`/data` volume | 当前是正式 App Host，不是 Draft #594 安装的 finance-owner Host；不能以线上站点存在认定 B2D3 已生产启用 |
| `EVO Runtime` | `jiangxng/EVO:main`，单实例，`npm start`，外部 public domain；**preDeployCommand: `node dist/scripts/migrate.js`** | 当前通用 EVO API，不是专用 `finance-owner-readonly-main`，绝不能复用其公开域名冒充私有金融入口 |
| `Postgres` | `ghcr.io/railwayapp-templates/postgres-ssl:18`，单实例、持久卷、私网 | 已有数据库基础设施，但无权因此断言 Finance Runtime/Operator 真实最小权限已部署或存在可用多副本主库证明 |
| `Experience Compiler` | 单实例、持久卷 | 与 B2D3 财务只读服务隔离 |
| `Ledger Configurator App Host Validator` | 单实例 Function | 校验资产，不是独立 Finance Owner |

**重要负面事实：** 当日 production 服务清单没有单独的 `Finance Owner` 服务，**不能**将 EVO #108 独立 read-only 可执行代码的 CI 当作已部署服务。没有进行生产配置更改或探测私有 URL。

## 真实运行条件与工程推论（显式区分事实/判断）

1. **Railway 一手文档事实：** Railway 私网中服务 DNS 通常为 `<service>.railway.internal`，使用 WireGuard 加密，官方一般建议内部 `http://`（不是浏览器公开 HTTP）。此传输加密并不自动完成应用层 HTTPS 服务器证书/私有服务对等身份的逐请求认证。
2. **已确认 EVO B2D3 现行合约：** Host `finance-owner-remote.ts` 生产禁止 HTTP，且要求 HTTPS + Ed25519 委托。**工程判断：** 若在 Railway 使用 `http://finance-owner.railway.internal:PORT`，现有 Host 必须拒绝；不能偷偷启用 `NODE_ENV=test`、`allowLoopbackHttpInTest` 或 `NODE_TLS_REJECT_UNAUTHORIZED=0` 规避。下一轮应优先设计真正运行在私网内的应用层 TLS 终端/sidecar，加部署 CA 信任与证书 SAN/域名匹配；如选 mTLS，需要真实双向证书和 peer identity 验收。该方案尚未生产测试。
3. **当前 Railway 实测部署配置：** 通用 EVO Runtime `preDeployCommand` 会在部署前运行完整 migration；因此 **即使未来合并 EVO B2D3 的 #108/main，新的角色/函数所有权迁移也可能自动执行**。必须先完成 Operator 数据库角色授予/审批、生产迁移顺序、安全回滚和部署路径，不能将此 child PR 本身视为生产迁移批准。
4. **预期目标拓扑（工程建议，不是已部署资源）：** `Ledger Configurator Host` → 私有 TLS/可验 peer 的 `Finance Owner readonly` 独立服务/工作负载 → 真实受限 PostgreSQL runtime LOGIN；独立 Operator LOGIN 仅经受控 CLI grant/revoke。Finance Owner 不分配 public domain；与通用 EVO Runtime 保持不同入口与数据库身份。
5. **运行前验收条件：** 对可见的每个真实属性收集部署 manifest/镜像 digest、身份与 DB Catalog、私有 DNS 和网络 ACL、TLS/mTLS 现场 handshake、IdP 与 managed Session、KMS 访问与轮换审计、多机器 nonce/撤销测试，再另行确认是否允许 B2D3 production。**尚无一项可因这份只读清单直接标为通过。**

## 此结果如何继续交接

- 现有安全交付：App #627（基础 Catalog）、#633（严格 Owner，EVO #111 pinned）、#636（候选部署描述符）与 EVO #111，皆只保证候选/CI，不改变 `project.status.json`。
- 后续的部署方案应选择**与现有 HTTPS 合约相容的 Railway 私网 TLS 拓扑**，并在真实受限登录环境运行 `--strict-owner`，不能使用 postgres/Operator 超级权限代替。
- 本文件是截至 2026-10-11 的生产状态**历史快照**；后续应重新读取 Railway 实时元数据，而非把它冻结成未来权威。没有生产变更、成本/核销写入、Agent、2D Designer 工作线。
