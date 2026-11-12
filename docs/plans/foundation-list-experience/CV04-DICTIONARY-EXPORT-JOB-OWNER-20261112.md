# CV-04 / 2026-11-12 — Dictionary Owner / durable bounded export job staged implementation

> Status **ENGINEERING_CODE / AUTOMATED_TESTS_PENDING / NOT_ACTIVATED**. The existing [bounded cross-page CSV contract](CV04-BOUNDED-EXPORT-CONTRACT-20261112.md) remains the only serializer. This slice adds a real Dictionary Domain Owner **unregistered** export task service, not a public production export feature.

## Decision & source boundaries

- Reuse the actual [Dictionary repository](../../../apps/business-dictionary/repository.ts), [Owner's readable Collection Query](../../../apps/business-dictionary/collection-query.ts), [bounded CSV executor](../../../foundation/collection-query/authorized-cross-page-csv.ts), [Host Authorization Provider contract](../../../contracts/platform-services.ts) and [Enterprise Resource CAS](../../../contracts/enterprise-resource.ts). No second framework or direct frontend pagination. The original Eidos current-page READ CSV stays unchanged.
- **Explicit independent authorization**: action `dictionary.export` against `business-dictionary.definition` for each Actor/Enterprise. The service also checks current Enterprise membership and feature activation; a mere `dictionary.read` ALLOW must fail. Recheck at queue, each page, before completion, on status and when downloading. Same User HUMAN and AI are separate Actor scopes/jobs; no impersonation by passing a different jobId.
- **Durable state**: one scoped Enterprise Resource CAS record stores `QUEUED → RUNNING → READY/FAILED/EXPIRED`, idempotency digest, frozen readable/selected rows, audit timeline and optionally the bounded CSV. `request` uses **one** Owner `repository.list(contextId)` followed by bounded materialization from that immutable snapshot. STARTED/COMPLETED/REJECTED/READY/download-access events are stored without private row/cell values; a disk reopen test exercises state recovery. A previous RUNNING task may resume after its lease expires from persisted snapshot, up to two attempts, without new raw Owner fetch.
- **Hard safety limits**: one task ≤10 pages, ≤1000 rows, ≤100/page, ≤256 KiB serialized snapshot and CSV, ≤30 sec execution, 15 min TTL, max 3 successful download-attempt audits; idempotency conflict rejects changed input with the same key. TTL removes persisted payload upon a subsequent touch. Failed/revoked snapshots never return content. Data lives as **plaintext in the isolated test CAS resource file**, so this is **not** a production confidentiality certificate.
- **Critical production gate**: `SAME_FILESYSTEM_LOCK` is NOT a cross-host durable authority. This staging service refuses that mode unless explicitly `isolatedTestOnly=true` AND `NODE_ENV=test`; non-shared production construction throws `COLLECTION_EXPORT_SHARED_AUTHORITY_REQUIRED`. The shared PostgreSQL async authority, durable audit confidentiality/retention and multi-host lease recovery remain separate **NOT_CERTIFIED** gates. There is no new Host action/route/Eidos button/registered Capability Operation and therefore no live user or external Agent can call this service.
- **No silent SAVE unlock**: N1=NOT_CERTIFIED, `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`, formal save POST 403 and unregistered GET 404 unaffected. Parallel PR #1184 Owner-managed files are not touched.

## Automated acceptance (mark PASS only after actual final CI)

[Owner service implementation](../../../apps/business-dictionary/export-jobs.ts), [protocol denial matrix](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs), and [isolated CI](../../../.github/workflows/cv04-dictionary-export-job-owner.yml):

1. Explicit `dictionary.export` required; existing dictionary READ does not grant export; revoked/disabled relationship and feature deny existing finished-file download.
2. A file-backed Enterprise Resource repository captures 205 Owner-authorized dictionary rows across three pages, generates one CSV header, excludes private options, preserves formula-injection protection. The same idempotency key reproduces the same job, conflicting request fails; new service instance after file reopen retrieves the original content and durable audit events.
3. Different Human Subject, same Subject with AI Actor, and other enterprise must not steal the job. Authorized member AI may create its own isolated job with parity of public CSV data.
4. TTL expiration denies download and clears data; row/column/query budgets and invalid requests deny before any job; expired idempotency key cannot resurrect past data.
5. Simulated crash leaves persisted RUNNING record with expired lease; retry can finish the **same frozen snapshot**, not refetch newer private data. Shared multi-host fail-closed guarantee is separately verified.

## Next integration work / explicit unresolved risks

- **DO NOT deploy** merely because protocol tests pass. Need certified shared CAS + durable audit/encryption before enabling Host command. File-store locks are single-node only; local test uses plaintext.
- Register **distinct** Capability Operations for enqueue/status/download with independent EXPORT authorization (and write-safety/idempotency admission), plus real Host ActionRouter + Personal Agent request context; test actual endpoint with multiple Sessions and real Enterprise relationship revoke and disabled feature after queued/READY. Require rate limits, queue fairness/worker lease and operational retention; do not create a fire-and-forget parallel task without durable status.
- Investigate **concurrent fetch/auth/durable audit races** and CAS contention on multi-workers with a real PostgreSQL source; provide download-attempt audit and TTL purge independent of client polling. Test Google OIDC live account/physical phone separately. Production Owner signoff issue #1212 remains PENDING.
- Source grade: code/contract facts from GitHub directly read 2026-11-12; no new external research or production-side observations; current document is engineering design until CI and protected-main results are appended.


## 2026-11-12 首次专项 CI 结果（真实日志已读）

[精确工程 HEAD `c1170c1f0c002ded6bfdd625146572bc2f84714a` 的独立 Actions #43164923654](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43164923654)，job `131004460519`，**SUCCESS**。本轮直接读取该 job 原始日志而非推断：

- `CV04_DICTIONARY_EXPORT_OWNER_DURABLE_RESTART_205_ROWS_PASS`：205 行三页、文件 CAS 重启、相同 idempotency Key 与冲突拒绝、单一 CSV 表头、CSV 公式防注入、私密 Dictionary Option 未泄漏；日志显示单项约 5.8 秒。
- `CV04_DICTIONARY_EXPORT_OWNER_SEPARATE_GRANT_REVOKE_DOWNLOAD_GATE_PASS`：READ-only 不授予 EXPORT，授权撤销、关系撤销、插件 inactive 后原完成任务不能取文件。
- `CV04_DICTIONARY_EXPORT_OWNER_HUMAN_AI_SCOPE_ISOLATION_PASS`：不同主体、同主体不同 Actor 与不同企业 Job 不互认，合法独立 AI 使用同 Owner 产生相同公开 CSV。
- `tests 7 / pass 7 / fail 0`：另有 TTL 过期清除、无效输入/大行数/私密字段、非共享生产 Authority 构造拒绝和 RUNNING 过期 Lease 从持久快照恢复。
- `CV04_DICTIONARY_EXPORT_OWNER_NOT_PUBLICLY_REGISTERED_PASS`：GitHub CI 精确检查 Host/Manifest 没有打开后台导出操作。**这不是东京生产帐号已验收，不是已经部署的全量 EXPORT 下载**。

本轮未查阅新的外部网页，全部依据为 GitHub 源码、协议和 Actions 原始日志。待工程最终 HEAD 全项检查、受保护 main 后合并复测、分支清理完成，另在 PR 讨论记录最终 SHA；不要以此单次专项 success 替代主线全绿。

## 安全复核增量（CI 待验）

在最终合并前补充 **持久排队快照最大 262,144 字节**（防止 CSV 运行前就写入超量明文）与 **成功取文件审计最多 3 次** 的硬预算，并增加测试 `CV04_DICTIONARY_EXPORT_OWNER_SNAPSHOT_DOWNLOAD_BUDGET_PASS`。历史 #43164923654 的 7/7 已读原始日志不应冒充本次最新 HEAD 的 8/8；待最新 CI 再判定。正式状态仍是 **STAGED / NOT_REGISTERED**。

## NEXT-06 / 2026-11-12 — Owner 同 Job 过期租约的尝试归属保护

**G / A 直接阅读原实现**：[`export-jobs.ts`](../../../apps/business-dictionary/export-jobs.ts) 原 `run()` 在 RUNNING 已重新领取 attempt 2 时，旧 attempt 1 的 `append()` 与 `READY` 仅测试 `state === RUNNING`；`catch` 也仅以此条件尝试写 `FAILED`。原加密资源 CAS 和 Signed SQL Gateway 的外层物理 lease 仍有独立保护，但 **Domain Owner 自身不应允许旧尝试的失败处理覆盖新尝试**。这是源码可验证的 race，不是声称已发生生产漏洞（产品正式 Export 仍 OFF）。

**D / 原地最小修复**：在 `run()` 成功写下自己的 `RUNNING` 后冻结 **`attempt + leaseUntil`**；所有中途 Audit CAS、最终 READY 和错误处理都重新核对当前 RUNNING 同属这次尝试。发现被重领/过期改态时，旧 Worker 只能报 `COLLECTION_EXPORT_JOB_STALE_ATTEMPT` 或旧 CAS 冲突，且不能将新尝试写为 FAILED。复用原 Owner/Job Resource 和原审计历史，不引入新队列/另一套 CAS/Actor 授权或扩展 SQL 后门。

**验收方法**：在 [原 Owner 协议测试](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs) 增加一个确定性双尝试并发回归，分别阻塞旧 Worker 的审计读取和 CAS 提交；推进测试钟 16 秒后，由第 2 次尝试领取租约，保证旧执行不能写审计/FAILED，第 2 次最终 READY。沿用 [原专项 CI](../../../.github/workflows/cv04-dictionary-export-job-owner.yml)；原 8 项顶层测试增加至 9 项，必须 9/9 PASS、0 SKIP。

**限制与 P**：这是明确 `NODE_ENV=test + isolatedTestOnly` 的现有 Domain Owner 一致性修复，不替代真实 PA05/T0 outbox→签名 Worker 的跨 SQL 主体授权/撤权、完整 Scope/水印/生产 Producer/KMS、跨两物理 Host 或真实 Human/Agent 下载。#1212 仍待具名 Owner，#1184 受管文件不触碰。正式跨页 EXPORT OFF、CV03 `N1=NOT_CERTIFIED` 与 SAVE OFF 均未改变。

## NEXT-06b / 2026-11-12 — 无重领场景的超时 Worker Lease 时间围栏

**G · 本轮直接读 `apps/business-dictionary/export-jobs.ts` 原文**：已交付的 NEXT-06 `stillOwnsAttempt` 固定 Attempt 与 `leaseUntil`，防止发生 attempt 2 重领时 attempt 1 污染。然而当 Worker 执行超过 **15 秒** 而尚无任何其他 Worker 重领，原状态仍 `RUNNING`、Attempt/Lease 字面值未变，旧 Worker 可以继续写 AUDIT/READY，错误路径还可能把任务置为 FAILED。原独立 Signed SQL Gateway 拥有 DB-time 物理租约围栏，但未正式接入的 Domain Owner 同样必须在本地隔离测试中拒绝过期结果。

**D · 原地修复**：沿用已经存在的 `stillOwnsAttempt`，补上**每次续写时** `clock() < claimedLeaseUntil`。AUDIT、READY 和 catch FAILED 继续共用一个谓词，不增加新的队列、CAS、SQL 操作、认证 Provider 或背景服务。过期 Worker 不可写入成果或失效终态；原 `RUNNING` 与加密快照保留，待第二次合法、受限 attempt 2 从原持久快照恢复。

**验证**：在[原 Owner 回归](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs)加入单一确定性无竞争对手场景：第一次 RUNNING 提交后将隔离测试钟推进 16 秒，确认旧 run 拒绝、Audit 仍只含 `REQUESTED/STARTED`、任务仍 RUNNING 并保留快照；随后恢复第 2 次尝试到 READY。既有双 Worker race 测试和 PG/浏览器回归保持。原专项 Workflow 顶层测试要求 **10/10 PASS**，0 SKIP。

**C / P**：测试钟不等于生产 DB 时钟；正式租约的数据库墙钟、PA05 Epoch/SourceGeneration、Outbox、Signer/KMS 及不同物理 Host 故障仍需真实 Owner #1212 具名批准与认证。该代码仍只在 `NODE_ENV=test + isolatedTestOnly` 下使用，禁止启用新的后台 EXPORT；CV03 `N1=NOT_CERTIFIED` 和 SAVE OFF 未变。#1184 管理的三份文件不触碰。

## NEXT-07 / 2026-11-12 — 后台 Export 必须继承 Owner 的字段级可读结果

**G / 已直接阅读 A 级原实现**：[Dictionary Collection READ](../../../apps/business-dictionary/collection-query.ts)、[Export Owner](../../../apps/business-dictionary/export-jobs.ts)、[基础 CSV Serializer](../../../foundation/collection-query/page-csv.ts)。当前字典 Collection READ 的 `readableFieldIds` **固定为五项基础字段**，未发现线上对其他敏感字段的现时泄漏。但原 `request()` 将每页 `readableFieldIds` **直接换成调用方要求的字段**，仅验证源字段列表属于五项已知字段，没有证明**要求导出的每项字段**实际在该页 Owner `readableFieldIds` 中。一旦后续应用/列级政策收窄某页的可读字段，即使原 `page-csv.ts` 会拒绝不可读字段，提前的元数据覆盖也会让它无从察觉。

**D / 原地防升级修复**：复用原 Owner 的 Collection READ、原 Snapshot、原 CSV Serializer 和原资源 CAS，在 `export-jobs.ts` 中建立不关联授权身份的**纯字段投影函数** `projectAuthorizedDictionaryExportPageV010()`，先验证 `fieldIds ⊆ page.readableFieldIds ⊆ 已知字典基础字段`，再只复制获准字段并收窄本页 `readableFieldIds`；不允许使用请求参数自行创造“已可读”的元数据。原请求路径直接调用这一投影，不引入第二套鉴权或新框架，不改 Catalog/ActionRouter 注册。

**验收**：[原 Domain Owner 协议测试](../../../tests/protocol/cv04-dictionary-export-job-owner.test.mjs) 合成未来 Owner 仅公开 `dictionaryId`、但 raw `cells` 仍携带 `displayName=CONFIDENTIAL_OWNER_VALUE` 的受限 Collection READ 页面，确认要求 `displayName` 必拒绝、合法请求只留 `dictionaryId`、私有值绝不进入快照且源页面不变。原 Owner CI **11/11 PASS，0 SKIP**；保留原 205 行导出、双重 Worker 争用、Lease 超时恢复和 PG/Chromium 回归。

**范围限制**：该纯函数并不签发任何字段/主体/企业权限；真实 Owner 返回的 `readableFieldIds` 仍是授权事实的唯一来源。现有静态五字段模式不支持用户级差异授权，不能声称现已实现动态字段 ACL。正式跨页 EXPORT 仍 **OFF/unregistered**；CV03 `N1=NOT_CERTIFIED`、SAVE OFF；生产 PA05/T0、DB Producer/Signer/KMS、跨两物理 Host 和 #1212 具名 Owner 仍为阻断；#1184 三份受管文件未更改。
