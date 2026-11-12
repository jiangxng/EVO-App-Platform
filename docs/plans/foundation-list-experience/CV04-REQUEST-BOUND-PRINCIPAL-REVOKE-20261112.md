# CV-04 / 2026-11-12 — 真实 Host 请求身份与企业关系撤销纵切

> **ENGINEERING_DESIGN / EVIDENCE_PENDING**。继承 [#1266 双企业 Chromium/内部 Agent 工具验收](CV04-TWO-ENTERPRISE-AGENT-OWNER-CSV-ACCEPTANCE-20261112.md) 和 [CV-04 基线](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md)。本阶段只验证隔离的真正 Host 请求身份与真实业务治理事件；**未使用东京真实登录账号、Google OIDC 或正式 PostgreSQL PA05 权威**，不得表述成生产撤权获批。

## 本轮原始依据（2026-11-12 GitHub 直接阅读）

- [Bearer Session Provider](../../../providers/request-session/runtime.ts)：`APP_PLATFORM_BEARER_SESSIONS_JSON` 的请求期 Bearer Token，`sessionId + principal.subjectId + actorType` 由 Host 解析，而不是浏览器 Action body 伪造；通过 `manager/request-context.ts` 产生 Host Scope。
- [Host 启动与路由](../../../manager/server.ts)：配置 Bearer Session Provider 可在启动时注册/激活，`/v1/actions` 用 `resolveRequestIdentitySession(request)` + `createPlatformRequestContextV010`，并在 Capability Operation/Domain Owner 路径再次检查许可。企业状态真实存储于隔离 `enterprise-governance.json`；`EnterpriseContextGrantProvider` 读取最新 grants。
- [Enterprise Governance Action](../../../manager/enterprise-relationship-actions.ts) 和[真实 Governance Store](../../../manager/enterprise-context-governance-store.ts)：`enterprise.relationship.invite` → `invitation.accept` 生成 ACTIVE relationship/grant，`enterprise.relationship.revoke` 记录 REVOKED 和追加 `RELATIONSHIP_REVOKED` Event，同时撤掉该 Principal 的对应 grant；不直接修改测试 fixture 的权限 Boolean 代替真实 revoke。
- [Dictionary Owner](../../../apps/business-dictionary/actions.ts) / [现有受限当前页 CSV](../../../foundation/collection-query/page-csv.ts)：继续由原业务 Owner 查询、字段白名单与 Host 的 Action，不新造业务事实或绕过 Eidos。

## 实际测试目标（代码已经提交，但须精确 HEAD Actions 真运行后才称 PASS）

新增 [隔离真实 Host 请求身份脚本](../../../tools/cv04/real-host-request-principal-revocation.mjs) 与 [独立 CI](../../../.github/workflows/cv04-request-principal-revocation.yml)，真实启动 `dist/manager/server.js`，随机生成三个临时 Bearer Token、两个不同 Human Principal（OWNER、MEMBER）及与 MEMBER 同 Subject 的 AI Principal。系统级临时 Host Static Authorization policy 仅供此非生产测试；业务活动依旧经过原 Host AuthorizationProvider、Owner 和 Enterprise Context grant。

1. 没有 Token 和错误 Token 请求要被真实 Host 拒绝；不能退回体验静态 Session。
2. OWNER 通过真实 Host 创建两个不同 Enterprise 并安装 Dictionary、各建一个已发布的专属资料；未被邀请的 MEMBER 不得指定 A Context 导出。
3. OWNER 执行真实 `enterprise.relationship.invite`；MEMBER 用自己的 Request Bearer 在 PERSONAL Context 接受，产生真正 ACTIVE relationship/grant。MEMBER HUMAN 和其 AI 以各自请求 Session 读取 A 的当前页 CSV，字段/内容完全一致；B 的不同企业不能读取。
4. OWNER 用真实 `enterprise.relationship.revoke` 撤销该 MEMBER 的 relationship，检查隔离持久 Governance 状态追加 revoke event、grants 已标记 REVOKED；**已建立的 MEMBER Human/AI Bearer Session 不变，但再次请求 A CSV 必须拒绝且不返回 Blob**。
5. OWNER 对 A/B 的合法下载仍成功，两个企业没有字段/行混合。测试所有临时数据/Token 都在 GitHub Runner 临时文件/内存中，artifact 只保留脱敏日志、机器报告。

**预期验证标记：** `CV04_REQUEST_SESSION_NO_BEARER_DENIED_PASS`、`CV04_REQUEST_SESSION_DIFFERENT_HUMAN_AI_OWNER_PARITY_PASS`、`CV04_REQUEST_SESSION_CROSS_ENTERPRISE_DENIED_PASS`、`CV04_REAL_GOVERNANCE_EVENT_STALE_BEARER_DENIED_PASS`、`CV04_OWNER_CONTINUES_CROSS_ENTERPRISE_ISOLATED_PASS`，最后 `CV04_REQUEST_BOUND_PRINCIPALS_GOVERNANCE_REVOKE_PASS`；缺任一项不得认定通过。

## 明确权限/实施限制与下一步

- 本轮 Bearer **是 Host 提供的测试请求认证机制**，与 Google OIDC 真用户登录不同；**真实企业关系撤权是同 Host 的真实 Governance Store 事件**，但不是多 Host/PA05 正式授权源的 PostgreSQL T0、Outbox KMS 签名事件，不能替代 N1-05f 的 Owner 安全签核。
- 本阶段特意不修改生产 Host、Business Owner 代码；如拒绝缺口确实存在，保留失败 log 后按原 Owner 代码修复，不通过无条件 Mock 成功绕过权限。
- List 下一步：独立 `EXPORT` 权限与服务端有界跨页 Job、审计、快照/下载时重复鉴权、TTL 与幂等；原来 100 行当前页 CSV 仍是有边界 READ，不等于全量 EXPORT。
- 真实 Tokyo 登录/正式撤权、外部 LLM、实机移动端/Human 仍 **PENDING**。保留生产 `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / 未注册 GET 404；不修改并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的受管文件。继续独立分支、Draft PR、精确 HEAD CI、合并 main 与 SHA-safe Branch Hygiene。
