# CV-04 / 2026-11-12 — Dictionary EXPORT 共享 PG 加密 CAS 隔离纵切

> **ENGINEERING_CODE / REAL-POSTGRES-CI-PENDING / NO HOST REGISTRATION**。继承 [CV04 Dictionary Owner 持久任务](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)及[跨页安全执行合同](CV04-BOUNDED-EXPORT-CONTRACT-20261112.md)。本轮优先复用 [CV-03 原有异步 PG Enterprise Resource CAS 适配器](../../../providers/enterprise-context/resources-postgres.ts)，而不是绕过已有签名/授权架构添加另一套业务库。

## 为什么不能直接把文件仓库换成 PostgreSQL

- 原 Owner 依赖同步 `EnterpriseResourceRepositoryV010.get/putIfRevision`；现有真正共享 PostgreSQL 的 `EnterpriseResourceConditionalAsyncRepositoryV010` 是异步合同，且原始资源 JSONB 会存**明文**。裸 `SHARED_POSTGRES_TRANSACTION` 并不代表数据保密或业务授权已获批准。
- CV-03 `SQL_GATEWAY_ISOLATED_V010` 在缺少受信 Host 签名时正确拒绝 `putIfRevision`：**禁止**把它当成另一个普通导出任务写入入口。本 CV-04 阶段只使用明确准备的 `cv03_*` 测试 schema 中的现有普通 PG CAS 适配器，**不修改 CV-03 生产 SQL gateway、认证/ACL/T0 或 N1 SAVE 门禁**。
- 生产运行必须分开证明：统一 T0 数据/授权权威、两个不同 SQL 角色的行级/函数权限、加密密钥生命周期、Host 授权再核验、不可改写审计账本、真实 Worker 停机/抢占和安全清理。**本次能提供的只有隔离 PostgreSQL 多连接级别证据**。

## 新增设计与实施范围

1. [`export-jobs.ts`](../../../apps/business-dictionary/export-jobs.ts) 将内部 CAS `get/putIfRevision` 统一升级为 async/await，**不另写业务状态机**；原同步文件测试同一套 Owner 语义和 `request/status/run/download`，而真实 PG 适配器无退化为同步内存的“模拟成功”分支。
2. [`export-job-pg-store.ts`](../../../apps/business-dictionary/export-job-pg-store.ts) 是薄存储包装器，底层必须是已有 `SHARED_POSTGRES_TRANSACTION` 资源适配器。AES-256-GCM + 每次独立 96-bit nonce 对 `pages/csv/csvSha256/fields/policy` 加密；认证 AAD 绑定**规范化资源地址**、原任务 Scope/Actor、状态、attempt、TTL、snapshotId 与**元数据审计事件**，防止直接修改 PG JSONB 的密文或状态后仍被应用接受。
3. PG 中可见的结构仅用于定位与治理的必要元信息（主体、企业、任务状态/时间、audit eventId、阶段、数字与失败码）。真实 Dictionary 可读行、字段内容、CSV 数据/敏感 Options 不落成明文 JSONB。密钥由可信调用方显式传入 32-byte buffer，**不能**从任务资源或 Action 输入获取；错误 keyId、错误密钥和恶意 SQL 元数据篡改均拒绝。
4. **同一 PG CAS revision 内**维护任务与元数据审计历史，任何更改/删除旧事件都由包装器拒绝并被 AES-GCM AAD 认证保护；不同连接同时抢同一 QUEUED Job 只有一个能成功推进。此为 *CAS 日志与抗篡改检测*，不是 DB 级独立 append-only 审计表，也不能抵御获得真实加密密钥和写权限的受信服务恶意篡改。
5. **上线门禁保持关闭**：本包装器仅在 `isolatedTestOnly=true && NODE_ENV=test` 可构造，且 Owner 拒绝原始 PG 明文存储和任何非测试环境。未新增 `catalog/seed.ts` Capability、`manager/server.ts` Host action、Eidos 按钮、东京真实 EXPORT 权限或外部 Agent 工具。即使主线预览镜像因代码变更自动发布，功能也不可从产品入口调用。

## 真实 PostgreSQL 证据矩阵（CI 结果应以后续原始日志为准）

- [专属测试](../../../tests/agent-line/cv04-dictionary-export-job-pg-encrypted.test.mjs) 在 GitHub Actions 使用 disposable **PostgreSQL 16** 服务，显式创建安全限定的 `cv03_*` Schema，两个独立 PostgreSQL 连接与重新构造的 Node Owner 实例，验证：已授权任务创建/运行/下载、跨连接状态可见、连接重启仍可解密、数据库直接查询看不到行/字段明文。
- 两连接同时尝试 CAS claim 同任务，要求恰一成功；系统级独立 EXPORT 权限/有效企业关系仍由真实 Owner 反复检查。跨主体、同主体 AI 与跨企业读取他人任务拒绝，授权撤回后完成任务也拒绝下载。
- 使用不同 key/keyId，以及对底层 JSONB 元数据直接篡改的反例，必须在取数据前失败；已经提交的审计事件不能经受管写入回退。
- 旧的文件 CAS Owner 8 项回归必须继续通过；Docker/PG 的测试环境与正式东京生产库完全隔离。**不将两连接的结果描述为两个独立 VPS、真实 OIDC 会话或签名 PA05 生产 DB 认证**。
- 项目 CI 仍须执行 Protocol/Core、Lightweight Host、Continuity 与原 Chromium，并以保护主线最终 SHA、东京预检/部署真实结果和 SHA-safe Branch Hygiene 收口。

## 下一步（独立且尚未实现）

- 使用隔离 Host 真 Bearer session /真实不同 Principal，把受治理的 `dictionary.export` Action 显式纳入 Capability Operation **且不从 READ 自动继承**。需要正式 PG Role-bound Host-to-Owner admission/批准凭据、持久 Worker heartbeat/lease、速率/配额、任务隔离，数据密钥托管/轮换与 DB 独立审计表（建议 immutable event ledger + 脱敏 proof）。
- 真实跨物理 Host 数据源权威一致性、下载时权限撤销、审计留存和过期主动清理的运维认证，先于任何 GUI/API 公开激活。再验 Human/Agent 跨企业真实会话与物理手机 /东京 QA。
- `N1=NOT_CERTIFIED`, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, 生产 SAVE POST 403 / 未注册 GET 404 的边界必须保持；并行 PR #1184 的三份受管文件不修改。

来源分级：本次已直接读取现有 GitHub PG Resource Contract/源码/真实 PG 测试、Owner Service、Workflow；没有补造已读外部网页。CI 成功前本页状态只是已提交代码，不能提前写 `POSTGRES_MACHINE_PASS`。


## 首轮真实 GitHub Actions PostgreSQL 证据（2026-11-12；G）

- [精确工程 HEAD `6183c308bba8c748dabcaae44abfec96282c7480` Actions #43168086100](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43168086100)、job `131014564007` **SUCCESS**。已直接阅读完整原始 job log，确认 GitHub runner 启动 disposable PostgreSQL 16，`npm run build` 完成，实际使用创建的 `cv03_*` Schema 与真实数据库连接执行测试，并非 skip：
  - `CV04_PG_ENCRYPTED_OWNER_TWO_CONNECTION_RESTART_AUDIT_PASS`
  - `CV04_PG_ENCRYPTED_OWNER_TWO_WRITER_CAS_PASS`
  - `CV04_PG_ENCRYPTED_OWNER_WRONG_KEY_REVOKE_TAMPER_FAILCLOSED_PASS`
  - `CV04_PG_ENCRYPTED_OWNER_CAS_AUDIT_PREFIX_PROTECTED_PASS`
  - **`tests 5 / pass 5 / fail 0 / skipped 0`**
- 同一 workflow 再运行原本文件 CAS Dictionary Owner regression，原始日志 **`tests 8 / pass 8 / fail 0 / skipped 0`**（含原 205 行三页任务、同主体 Human/AI、授权撤回、TTL 与任务租约恢复）；`CV04_PG_EXPORT_NOT_ENABLED_IN_LIVE_HOST_PASS` 确保没有把 Export command 加到 Host/Manifest。
- 证据边界：以上证明**同一 runner 上两个独立 PostgreSQL connections**的强一致 CAS、AES-GCM 同密钥进程重建恢复、wrong-key/元数据篡改拒绝；**不是两个独立 VPS、不是安全生产 DB SQL Role/Row Level Security/正式 Owner 签收，也不是外部 KMS/独立 immutable SQL 审计链或正式东京帐号**。明文 JSONB 不包含业务单元格/CSV；PG 的必要索引与审计元数据仍可见。
- 上述仅是首轮**已实际完成的 CI**。任何后续 doc/代码更新将产生新的 PR HEAD，必须以最终精确 HEAD 所有 CI 成功、合并后 main、东京部署真实检查和 Branch Hygiene 的记录收口，不能沿用首轮宣称最终主线已验收。
