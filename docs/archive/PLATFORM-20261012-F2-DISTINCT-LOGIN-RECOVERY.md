# Platform F2 — 独立 PostgreSQL LOGIN 负例回收

> 2026-10-12。固定在 Platform 分支收敛，不修改 EVO Runtime / Agent / 2D/EOG，也不使用 Railway 生产数据。这里证明 **实际 PostgreSQL 数据库安全边界的小子集**；不证明财务语义或 Finance Owner 已认证。

## 来源与取舍

- 原始 V1 [固定分支源码](https://github.com/jiangxng/EVO-App-Platform/blob/1d6149bd05136d642e49aab5196d12ab243cbe4e/tools/certify-tr01b2d3-distinct-db-logins.mjs)：321 行。使用真实独立 LOGIN + strict catalog，但耦合旧 `../evo/dist`、Finance Owner 旧 listener 和信任表。
- 原始 V2 [固定分支源码](https://github.com/jiangxng/EVO-App-Platform/blob/3e7d5182bc5f4ae03ca638c76524872086a0cbec/tools/certify-tr01b2d3-distinct-db-logins.mjs)：309 行。Finance-only listener 只挂只读路由，非 finance /commands /demo 路由返回 404；依赖 Draft EVO HTTP。
- 原始 V3 [固定分支源码](https://github.com/jiangxng/EVO-App-Platform/blob/ff2fd23e83ebf72a5fc0c21757f729fd800594ac/tools/certify-tr01b2d3-distinct-db-logins.mjs)：287 行。复用完整 EVO HTTP API 进程，不应作为隔离 Finance 服务器的基础。
- 更早 [PostgreSQL Role Separation（SET ROLE）](https://github.com/jiangxng/EVO-App-Platform/blob/1d6149bd05136d642e49aab5196d12ab243cbe4e/tools/certify-tr01b2d3-postgres-role-separation.mjs) 只有模拟切换角色，不等于凭独立数据库凭证登录。
- 现有 main 已有 `tools/tr01b2d3-finance-owner-catalog-preflight.mjs` 静态权限评估与 `tests/protocol/tr01b2d3-finance-owner-preflight.test.mjs`；并未保证在现代 main 上建立两个真实 LOGIN。

## 本次实际回收

只新增 `tools/platform-f2-distinct-db-login-ci.mjs`、其协议测试和独立 GitHub Actions workflow。工作流使用 **PostgreSQL 16 一次性容器**、随机 LOGIN 用户名与密码、独立真实连接，验证：
1. runtime/operator 的 `session_user=current_user`，不同于管理员且无超级用户、CREATE ROLE/DB、BYPASS RLS / INHERIT 权限；
2. runtime 只能读取专属 fixture，不能读取/变更操作员的 key registry、伪造 audit、写入 fixture 或建表；
3. operator 只在自己的 fixture 内有有限 UPDATE 与 audit INSERT，不能读取或修改 runtime fixture；
4. **不重新连接时**管理员撤销 runtime 的 SELECT，下一次 SELECT 被 PostgreSQL SQLSTATE 42501 拒绝；
5. 脚本同时要求 `NODE_ENV=test`、`F2_DISPOSABLE_POSTGRES=1`、本地 loopback PostgreSQL、`f2_ci_*` 数据库和 postgres CI 管理用户，避免误操作真实 Railway/EVO。

**严格不做：** 不导入旧 Host Core、旧 Finance Owner、EVO `/dist`、旧只读核验 SQL，不创建或修改 EVO 的 `business_data/posting_input/ledger/cost/allocation` 表。该 test fixture 仅验证数据库权限隔离，不代表 Finance owner HTTP 404 / 真实 EVO 签名已恢复；那些与 EVO #108 / Platform #594 继续维持 Draft 分离。

## 验收标签

- `CODE_PRESENT`：PR 创建后才成立。
- `CI_PROVEN`：新增独立真实 PostgreSQL workflow SUCCESS，且 Platform CI/Continuity 成功才成立。
- `RUNTIME_DEPLOYED`：**未部署**；仅 disposable CI。
- `USER_ACCEPTED`：**不适用/未取得**；不能称为采购应用人验。
- `productionCertification=NOT_CERTIFIED`，`executionAllowed=false` 固定不变。

如工作流不能运行，按失败日志在本 PR 继续修复；不要把失败改写为 PASS。旧 14 条历史 ref 必须保留到 F0–F4 整组完成后逐项核对。
