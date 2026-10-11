# TR01B2D3｜十二条生产准入工程线（2026-10-11）

**LIVING_RUNBOOK｜B2D3 OPEN｜`productionCertification: NOT_CERTIFIED`｜`deploymentAuthorized:false`｜`executionAllowed:false`。** 本文件不是安全发布批准或 B2D4 写权限授权。

## 继承前 6 条 / 新增后 6 条

既有六线见 `docs/roadmap/TR01B2D3-SIX-LANE-PRODUCTION-ADMISSION-20261011.md`，其源代码、CI、真实 Railway 脱敏快照保留，不重复定义生产权限。本次不是简单扩充十二个勾选框：新逻辑采用组合式程序化拒绝门槛，含**可执行的跨作用域身份比较、结构化安全事件白名单投影、双仓不可变提交与 SLSA 构建来源字段一致性检查**及专门负向测试。

| 编号 | 工作线 | 代码门禁 | 实际独立生产阻断条件 |
| --- | --- | --- | --- |
| 1 | PRIVATE_TLS | 独立只读 Finance Owner 私网入口、应用层 CA/SAN/peer 身份、TLS 真握手与负控 | 未部署独立 Owner / 实际证书与同一身份域未验 |
| 2 | MIGRATION | 实际 EVO preDeploy 自动迁移阻断、受控迁移账号、严格安全函数 owner | 当前 Railway EVO Runtime 仍设自动执行 `node dist/scripts/migrate.js` |
| 3 | OIDC_SESSION | HTTPS IdP issuer、PKCE、真实 session、禁用静态回退 | 生产 IdP 和企业会话负控未证 |
| 4 | KEY_CUSTODY | Host 私钥隔离、Vault、Operator 分权、撤销轮换 | 无真实 KMS/Vault 现场证据 |
| 5 | MULTI_INSTANCE | 独立多节点、nonce 主库唯一性、故障拒绝 | 无独立 Finance Owner 节点 |
| 6 | RELEASE_ROLLBACK | 双仓 SHA / 镜像摘要、无财务写、人工审批、回滚 | 真实部署/回滚未签收 |
| 7 | WORKLOAD_ISOLATION | 只读 Owner 专属进程与路由、工作负载与 DB 角色分别隔离，拒绝 Host 机密卷、通用 API、自动迁移权限 | 生产 Owner 服务不存在；不可把公开 EVO Runtime 充作私有 Owner |
| 8 | TENANT_AUTHZ | 对已验证主体/已签发委托的 hostEnterprise、evoEnterprise、context、installation、actor、aud、purpose 逐一比较；拒绝跨企业与伪装 | 需要真实企业双租户/授权 Provider 与 Owner 重新核验的现场负控 |
| 9 | BUILD_PROVENANCE | SLSA/in-toto predicateType、subject digest、App/EVO 两仓 commit、SBOM 一致性；隔离 untrusted PR 与发布机密，要求外部签名验证引用 | **字段格式检查不是签名验证**；生产镜像 digest、真实签名、SBOM 与 builder 身份尚未独立核实 |
| 10 | AUDIT_PRIVACY | 白名单事件仅含必要 eventCode/disposition/actorType/correlationId/installationId/observedAt，并固定 executionAllowed=false；拒绝 token、私钥、DB DSN、审计篡改 | 需实际不可篡改日志汇聚、Reader/Operator 分权、保留与合规审查 |
| 11 | BACKUP_RECOVERY | PITR、加密异地副本、RPO/RTO 实测界限、隔离目标恢复、nonce 唯一性、恢复不复活 revoked trust、财务写禁用 | 缺生产备份恢复演练与独立核对记录 |
| 12 | INCIDENT_OBSERVABILITY | Pager/负责人、重放失败率、TLS 到期、主库 nonce 权威不可用、撤销日志延迟告警；故障时拒绝新委托、人工撤销与回滚演练 | 真实告警投递/值班确认/事故桌面推演尚未验证 |

## 工程实现与边界

- **十二线聚合**：`tools/tr01b2d3-twelve-lane-admission.mjs` 导入原有六线，不重新发明原有认证或业务链路；新增独立 `workloadIsolationGate`、`tenantAuthorizationGate`、`buildProvenanceGate`、`auditPrivacyGate`、`backupRecoveryGate`、`incidentObservabilityGate`。CLI 读取**脱敏** JSON，真实快照 BLOCKED 退出码 2。对所有路径固定 `deploymentAuthorized:false` 和 `executionAllowed:false`，即便假设静态字段全部成立也只能为 `CANDIDATE_ONLY`。
- **纯逻辑诊断函数**：`matchVerifiedDelegationScope` 仅比较**已经**通过 Host Session 与 Owner 签名验证的 identity；不验证 JWT/权限、不取代 `finance-intent-admission.ts` 或实际 Owner 授权。生产验收必须调用真实进程执行 cross-tenant 错误账号/企业/Context 的完整 HTTP 负控。
- **审计投影**：`projectFinanceSecurityAuditEvent` 采用严格 allowlist，未知正文、JWT、私钥、数据库 DSN 不拷贝进输出。当前是预检/测试 helper，**并未接入生产日志汇聚**，不能据此宣称生产日志已经安全；需人工检查所有真实日志路径。
- **构建来源**：`provenanceShapeMatchesRelease` 只做 SLSA/In-Toto 字段与两个仓库锁定版本的一致性验证。JSON 中 `signatureVerifiedOutOfBand` 及 `evidence.*` 引用都只是候选声明，非签名校验结果。发布前必须从实际 provenance 文件及可信 builder/CI 身份独立验签，不信任候选清单自填的 PASS。
- **真实 Railway 数据**：使用已有用户授权只读连接器采集的 `tests/fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json`（历史快照）。当时五个正式服务、无 Finance Owner、通用 EVO 有 preDeploy 自动迁移；今后上线前必须重新读取真实环境，不能把 10 月 11 日快照当现在状态。
- **未做的事**：无主线 `main` 合并；无生产服务/证书/变量/DB 授权/备份/密钥变更；无 B2D4 财务写入；不更改 `project.status.json`、`HANDOFF-LATEST.md`、Agent/Eidos/2D 的并行分支。

## 资料/决策原始索引

| 编号 | 来源和查阅状态（2026-10-11） | 来源事实 | 本项目采用的工程判断 |
| --- | --- | --- | --- |
| S1 | [SLSA Build Provenance 原文](https://github.com/slsa-framework/slsa/blob/main/spec/build-provenance.md)：**已读网页原文相关摘要与构建来源字段**，不是完成其全部 603 行审读 | Provenance 使用 `https://slsa.dev/provenance/v1` predicate，包含产物 subject、builder/source 等材料 | 固定两个仓库 commit + image digest + SBOM，另由可信独立流程验签；**不宣称达到某个 SLSA 等级** |
| S2 | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)：**已读原文相关章节**（Data to exclude, at rest, in transit, monitoring） | 建议移除或保护 access token、session、个人敏感信息、DB connection string、密钥，保障篡改检测/日志访问控制与告警 | 用 allowlist 减少记录字段，生产需单独验证不可篡改 sink、操作分权和保留期 |
| S3 | [NIST SP 800-61 Rev.3 最终发布](https://csrc.nist.gov/pubs/sp/800/61/r3/final)：**已读摘要**，未逐页阅读下载 PDF | 2025-04 最终版，将事件响应融入企业整体风险管理，已取代 Rev.2 | 将值班通知、遏制失效、人工撤销、现场桌面推演变成独立门禁；具体阈值与值班人员必须由运营确定 |
| R1 | [Railway Private Networking](https://docs.railway.com/networking/private-networking/how-it-works)：**前轮已读原文**与用户授权只读 Railway inventory | 私网内部域名与 WireGuard；实际生产无专用 Owner | 坚持应用层 HTTPS + peer 身份，不因内部通道加密而降低现有 Host 的 HTTPS 要求 |
| P1 | 本项目 `finance-intent-admission.ts`、`finance-owner-remote.ts`：**已读源码** | Host 逐资源授权、服务器端企业映射、已签委托绑定及只读反馈 | 保护跨企业隔离的完整 HTTP 真实负控，不用新诊断 helper 替换已有主实现 |

来源事实与本项目安全口径是两回事；任何后续方案改变需要补充新的技术证据，而不能只修改一个字段。

## CI 运行/证据约定

```bash
node --test tests/protocol/tr01b2d3-six-lane-admission.test.mjs \
  tests/protocol/tr01b2d3-private-tls-probe.test.mjs \
  tests/protocol/tr01b2d3-twelve-lane-admission.test.mjs

node tools/tr01b2d3-twelve-lane-admission.mjs \
  tests/fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json
# 当前历史快照按设计退出码 2；生产阻断是成功捕获风险的表现
```

新 `.github/workflows/tr01b2d3-twelve-lane-admission.yml` 创建十二个独立命名 Job + 一个总门禁，按项运行正反向测试和历史真实阻断预检；无生产数据库连接或 Railway 发布权限。具体 GitHub run ID、失败/修复提交在 PR 评论保存。**CI 绿灯不是生产认证。**

## 下一次有权限的生产验收顺序

独立工作负载和最小数据库身份先落地（必要时隔离预生产部署）→ 私网 TLS/证书/IdP 与 Key Vault 集成 → 双企业实际 HTTP 负控及 Operator/审计 → 构建 provenance 验签 → 备份恢复演练 → 多节点混沌/监控告警 → 发布审批与回滚双人验收。未经审批继续 `STOP`、`NOT_CERTIFIED`。
