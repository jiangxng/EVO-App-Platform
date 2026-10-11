# TR01B2D3｜Finance Owner 生产部署配置候选检查与证据边界

**Document class:** LIVING_RUNBOOK（2026-10-11），**Gate:** B2D3 OPEN，`executionAllowed:false`。本文只定义声明式部署候选安全限制，不声称能从 JSON 证明真实生产私网、证书、数据库或 IdP 处于该状态。

## 为什么需要第三道预检

前两道检查分别是：[EVO #111](https://github.com/jiangxng/EVO/pull/111) 针对真实 Postgres migration 后 `SECURITY DEFINER` 拥有者的角色加固，以及 [App #633](https://github.com/jiangxng/EVO-App-Platform/pull/633) 使用真实隔离 runtime LOGIN 的最小权限 Catalog 检查。它们**不能**确保 Operator 实际部署了独立 Finance Owner 容器，也不能独立证明 Host 只走 TLS/私网、调用由真实生产 OIDC 主体发起、签名私钥正确托管。

为避免配置遗漏，新增无密钥、无网络、不改生产状态的**声明式配置检查**。它只对 Operator 提供的脱敏配置作静态约束判定；要求独立签发可追溯的运行证据才能推进正式验收。

## 运行方式（无秘密配置）

```bash
node --test tests/protocol/tr01b2d3-deployment-descriptor.test.mjs
node tools/tr01b2d3-deployment-descriptor-validate.mjs <redacted-descriptor.json>
```

参考结构：`tests/fixtures/tr01b2d3-deployment-descriptor-staging-candidate.json` 是**刻意模拟**的 staging 候选，带有无效域名和虚构镜像哈希，只用于测试；绝不能直接部署或将其作为真实生产证据。工具本身不读取任何数据库/证书/凭据：缺少清单、格式错误、内嵌数据库 DSN/私钥/token、服务不是独立只读运行、启用财务写入、采用静态信任回退或暴露公网，均默认拒绝。

`CANDIDATE_CONFIGURATION_PASS` 仅表示**Operator 自述字段符合声明式结构**。输出永远附带 `productionCertification:NOT_CERTIFIED`、`operatorEvidence:REQUIRED_FROM_REAL_DEPLOYMENT`、`executionAllowed:false`。所有敏感字段只能以引用和现场脱敏证明的方式在独立安全凭据流程中核查，不要提交 GitHub。

## 上线前需要外部独立取证

| 现场门槛 | 独立于候选 JSON 的真实证据 | 允许状态 |
| --- | --- | --- |
| 进程/镜像 | 生产部署 manifest、immutable image digest、实际启动命令与环境变量（脱敏）、运行时 OS workload identity、只读独立服务路由表、错误命令端点 404 | OPEN |
| 数据库/函数 | 实际 PostgreSQL `session_user/current_user`、独立 Operator、`--strict-owner` 无修改 Catalog 查询、DDL 与函数 owner 审核、实际 runtime 无 Cost/Allocation 写权限 | OPEN |
| 传输/网络 | 真实服务 DNS、私网访问控制和可到达性、Host→Owner 证书链/域名验证、反代身份约束、实际 mTLS 对等身份策略（部署采用时）和证书轮换 | OPEN |
| 登录/企业范围 | 真实生产 OIDC issuer/audience，真实受管 Session 签发/过期/撤销，Host 授权与 enterprise/context 映射独立审计，恶意 claims fail-closed | OPEN |
| 密钥与撤销 | Host 私钥存储/访问策略、EVO 公钥信任、kid 指针权限、轮换/撤销审计及回滚演练；不把私钥写入候选描述符 | OPEN |
| 多机故障 | 实际两个独立工作节点和主库 nonce authority，网络分区/数据库不可用/代理失败时拒绝，负载均衡及跨版本回滚 | OPEN |
| 财务边界 | 检查只读 response `executionAllowed:false`，无财务写端点和 CostRun/AllocationInstruction 新记录；B2D4 始终独立审批 | OPEN |

## 原始证据与工程判断

- **已独立读取 PostgreSQL 官方原文 2026-10-11：** [ALTER FUNCTION](https://www.postgresql.org/docs/18/sql-alterfunction.html) § Description / OWNER TO / search_path；[CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html) § Writing SECURITY DEFINER Functions Safely；[GRANT](https://www.postgresql.org/docs/18/sql-grant.html)。它们说明数据库 owner/schema/执行权限规则，**没有**为 EVO 验证网络部署合格。
- **已读取仓库源码：** EVO `finance-owner-readonly-main.ts` 和 `finance-owner-readonly-app.ts` 的真实启动/路由范围；App Platform `finance-owner-remote.ts` 强制 HTTPS、Host server-side secrets 和只读 response；`finance-owner-key-pointer.ts` 使用权限限制、防 symlink、失败不回退。
- **本轮工程决定（不是外部规范原文）：** 候选 descriptor 必须 FAIL_CLOSED，始终 `NOT_CERTIFIED`；应用单独的 Operator 现场验收流程取证，绝不允许“JSON 自证生产 PASS”。
- **尚未访问/未认证的外部服务：** 用户生产 IdP 配置、生产 KMS/Secret Manager 和私网 LB/mTLS ingress 真实实例。不能凭模拟 staging JSON 生成现场证据。

## 可追溯交接 / CI

将本轮固定到 App Platform #634（叠加 #633 → #627 → #594）和 EVO #111（叠加 #108）；每个 PR 均独立 Draft，禁止误向 main 合并。安全配置静态测试由 `.github/workflows/tr01b2d3-finance-owner-deployment-preflight.yml` 触发；最终 CI run ID 写入对应 PR 评论，勿改 `project.status.json`、`HANDOFF-LATEST.md`、并行 Agent/2D Designer。下一次复核应先按 `AI-BOOTSTRAP.md` 读取权威状态，再读取本条证据链。
