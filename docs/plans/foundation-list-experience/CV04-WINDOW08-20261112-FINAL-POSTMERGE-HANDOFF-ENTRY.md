# CV-04 / Window 08 / 自动续跑 #07/07 — 2026-11-12 主线最终交接入口

> **阅读优先级最高，核验基线是 `main@1fbf937f24c801b8812340f2da26d76adcc94ad8`（#1295 已合并）。** 这里的 SHA 是 2026-11-12（香港/北京时间）本轮开始时的真实 protected main，交接 Docs PR 合并后 `main` 会变化；下一窗口必须再次查询最新 `main`。新交接是唯一最新事实入口，保留 [Window 07 原入口](CV04-WINDOW-20261112-POSTMERGE-0707-HANDOFF-ENTRY.md) 的历史稿及 [原有完整研究与决策索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md) §1–22，不复制七十千字资料。

## 1. 冻结的产品安全边界和真实现场

- 仓库 [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，唯一合并基线 `main`；最后确认 `1fbf937f24c801b8812340f2da26d76adcc94ad8` 的原始 GitHub check-runs **9/9 SUCCESS**，包含东京 `preflight` 和真正 `deploy`。东京 [workflow #43250322812](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250322812)，原始 [deploy job #131295528291](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43250322812/job/131295528291)：真实运行容器镜像 `ghcr.io/jiangxng/evo-app-platform:1fbf937f24c801b8812340f2da26d76adcc94ad8`，`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS` 均实际输出。**预览镜像健康不是正式 EXPORT 生产认证**。
- 产品可用的是字典、我的客户、我的供应商**当前页 CSV**；正式 **跨页 Job EXPORT OFF / 未在 `manager/server.ts`、`catalog/seed.ts` 注册**。隔离 `NODE_ENV=test + isolatedTestOnly` 的 Owner/PG/Worker/Gateway/轮询器虽已集成多项回归，但真实 Human/Personal Agent 没有正式跨页 EXPORT 功能。
- 共享 CV03：`N1=NOT_CERTIFIED`；`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`；正式 SAVE POST 403、未注册 GET 404。Owner [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍 **OPEN / PENDING OWNER SIGNOFF**：五个勾选 checkbox 是**选择方案/责任列表，不是具名生产审批**。并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) **OPEN、reviews []**（截至本轮 GitHub API 实时核验）。不得修改其管理的三份文件：
  - `docs/plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`
  - `docs/plans/foundation-list-experience/CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`
  - `docs/plans/foundation-list-experience/CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`
- 真正的源权威、PA05 生命周期/AuthorizationProvider、同 PostgreSQL ACID T0、全 Scope+Epoch+Source Generation+不可变 Outbox、DENY/tombstones/watermark、非超管 Producer/Worker/Signer/KMS、两台**不同物理** Host、故障恢复及具名 Owner 批准**均未完成生产认证**。东京旧库 `evo` 曾读到 SQL superuser、正式 CV04 非 QA 命名对象 0/0：这是有限名称+当时环境的**只读负证据**，不是未知授权源的全域证明。

## 2. 本窗口可复用的最新工程成果（均为独立 PR，按已合并先后）

| PR / 受保护 main merge SHA | 已交付与验收边界 | 下一窗口不要误判 |
| --- | --- | --- |
| [#1288](https://github.com/jiangxng/EVO-App-Platform/pull/1288) → `63b22c4c81c51165a2f99486f0345be2e6efb3ea` | Window 07 交接入库，先前隔离 signed PG/LEASE、Source Owner/东京只读证据已收口 | 属于历史交接，下一轮应读本文件和研究索引后半部 |
| [#1289](https://github.com/jiangxng/EVO-App-Platform/pull/1289) → `0fedfad19319155c27210173c19411877224c899` | Source Owner 关闭门禁扩展到 `download` 具体操作 | 已被下一 PR 的全前缀门禁覆盖 |
| [#1290](https://github.com/jiangxng/EVO-App-Platform/pull/1290) → `b4c0868af6f8e893690ac59cc89234576e698360` | 对整个 `dictionary.collection.export.job.` **源码**命名空间 fail-closed，覆盖 `expire` 和未来后缀 | 源码字符串检查 ≠ 动态运行时/真实 SQL 授权证明 |
| [#1291](https://github.com/jiangxng/EVO-App-Platform/pull/1291) → `b1cabf7f4fdbfee1d88a1de4efcce1286c329af5` | 现有东京 GET-only Catalog 验收同步检查全前缀；[真实东京原始只读 job #131260449146](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43240834882/job/131260449146) 看到新 `...NAMESPACE_ABSENT_PASS` | 当时真实 Runtime 镜像仍是 `81262c...`，并非 #1291 新部署；SQL PG 检查只读且仅已知前缀 |
| [#1292](https://github.com/jiangxng/EVO-App-Platform/pull/1292) → `b84162a7df704fe4dbb94984241381129346e650` | 将 #1291 原始东京/Source/Branch Hygiene 的 B 级终态回填原研究索引 §18 | Docs-only，部署正常 SKIPPED |
| [#1293](https://github.com/jiangxng/EVO-App-Platform/pull/1293) → `7257a44bafe8b508a6d57ea3c08914f581cc4848` | Domain Owner旧 Worker 的 Audit/READY/FAILED 绑定自身 `attempt + leaseUntil` 防重领污染；Owner **9/9** | 单进程模拟竞争不等于生产双物理 Host |
| [#1294](https://github.com/jiangxng/EVO-App-Platform/pull/1294) → `98953c7c9d42a1c7ef057aeb24efc371592518ed` | 在上述 Owner 续写围栏补 `clock()<leaseUntil`，即使尚未重领过期 Worker 也拒绝；Owner **10/10**，东京真实部署 SUCCESS | 测试钟仍不能代替正式 DB-time 签名租约 |
| [#1295](https://github.com/jiangxng/EVO-App-Platform/pull/1295) → `1fbf937f24c801b8812340f2da26d76adcc94ad8` | 在快照持久化前验证 `requested fields ⊆ Owner readableFieldIds ⊆ known Dictionary fields`；Owner **11/11**，真实 PG 加密 CAS **5/5**，东京真实部署 **9/9 main checks** | 目前字典五字段本就固定公开，不声称已存在生产泄漏或具备动态个人列 ACL |

- #1293～#1295 的真实原始 Actions 执行、精确 HEAD 和合并 SHA、东京新镜像、Branch Hygiene 已分别追加至各 PR 的最终评论；所有对应临时分支已被 Actions 以精确 HEAD 删除。
- #1295 最终验收评论：[issuecomment-6828317905](https://github.com/jiangxng/EVO-App-Platform/pull/1295#issuecomment-6828317905)。#1294 的终态在 [PR #1294](https://github.com/jiangxng/EVO-App-Platform/pull/1294)，#1293 同理。**不要用上述 9/9/11/11 冒称 #1212 已签署。**

## 3. 生产准入剩余唯一主路径：选择 A，真实 Owner 层先行

**已经选择**：在**同一个正式 PostgreSQL ACID T0** 中提交可信 PA05/AuthorizationProvider 来源、完整 scoped 权威、`authorityEpoch`、`sourceGeneration`、全量 DENY/tombstones、不可变 Outbox/receipt、水印和原子回滚；继续使用原 Eidos + Platform + Domain Owner/ActionRouter，避免新列表框架及并行授权中心。参阅 [CV03 生产权威 Owner 前置契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)（该文件为**提案，不是审批**）。

| 顺序 | 实际下一步、缺少的独立证据 | 必须负责的真实 Owner |
| --- | --- | --- |
| 0. 具名决策 | #1212 中真实 reviewer/role/date、独立 APPROVED PR 链接，目标环境和来源 SHA（不贴秘密）；确认 PA05 生命周期、AuthorizationProvider 真实持久来源、Domain 行为不变。**缺任一项停在此关** | PA05 Lifecycle / AuthorizationProvider / Domain |
| 1. 生产只读盘点 | 实际 Provider/binding/policy precedence、企业/主体/Actor/operation 完整 Scope、package/feature disable fence、真实 DB 主库/Schema/身份；必须由 Owner 签认而非 QA 生成 | PA05 / AuthorizationProvider / DB |
| 2. T0/身份设计及审议 | DBA-owned 最小权限 SQL role+GRANT/REVOKE、signed Host Producer/Worker、Signer/KMS custody/rotation、无 superuser/raw DML 旁路、immutable Outbox 和 rollback/PITR；评审迁移流程，**此文不执行 DDL/KMS** | DB / Security-Ops / PA05 |
| 3. 受控 opt-in 迁移/故障演练 | T0 commit/rollback、全 Scope/generation/watermark + tombstone 重放/缺号/旧凭据拒绝；断连默认 DENY；两台**实际不同物理 Host** 和真实 PG 故障/恢复。旧 File/Static ALLOW 禁止双主 | PA05 / AuthorizationProvider / Security-Ops |
| 4. 正式业务最小接线 | 上述独立签署后，另开可审查、可回滚 PR；复用现有 Domain Owner + Host ActionRouter + Personal Agent，以真实 Human/AI 身份在不同企业验证撤权、禁用、查询/状态/下载审计，以及 390/1280px | Domain / Security-Ops / 平台维护人 |
| 5. 显式产品放行 | 前 0–4 完成且独立 Owner 审批，才考虑注册 `dictionary.collection.export.job.*`、切换 CV03 SAVE，分别由产品/安全变更流程许可 | 真实 Owner 和产品发布责任人 |

**排除方案**：用 CI 测试角色/临时 HMAC、东京 `evo` superuser、文件或静态 Provider、Host 回调/EventLog、局部 QA mirror 或本窗口自行“批准”代替真正 T0；先发布 EXPORT 再补权限；新增并行队列/签名网关/框架；循环逐 Actor 写 DENY 假装整包停用原子性。

## 4. 下一窗口执行入口（先核验，不重复低价值工程）

1. 重新读取本文件、[原研究决策索引 §16–22](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md) 及 [Owner 最小租约/投影修复 NEXT-06/NEXT-06b/NEXT-07](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)，检查最新 `main`、#1212、#1184 reviews、相关 open PR，避免与别的窗口覆盖。
2. 源码地图：`apps/business-dictionary/export-jobs.ts`（唯一 Owner）、`collection-query.ts`、`export-job-pg-store.ts`、`export-job-pg-audit.ts`、`export-job-pg-sql-lease.ts`、`export-job-pg-maintenance.ts`、`export-job-pg-dispatch.ts`；`tools/cv04-isolated-signed-export-gateway.mjs`；`manager/cv03-n105b-authority-t0-pg.ts`、`manager/cv03-n105b-pa05-host-lifecycle.ts`（UNMOUNTED）。
3. 不重复开发已有 PG/Worker/Gateway/轮询/Source Release Gate/东京只读；只在找到新的**实际可复现、独立可验**缺陷时独立 PR，记录负向反例。否则主动聚焦拿真实来源/Owner 身份，**没有证据则明确阻断而非无限造测试**。
4. 工程治理保持：仅从最新 main 建独立分支 → Draft PR → **精确 PR HEAD** 全绿 → Ready → Merge → **受保护 main** 检查 → 东京 preflight/如真实触发则 deploy/镜像健康 → Actions Branch Hygiene 精确 SHA 删除。文档提交的东京 deploy SKIPPED 是合理结果；源码变更可能真实发布，但预览成功仍不等于产品 EXPORT 放行。
5. 资料记录等级：**A** 已从 GitHub 读取原文源码/原文段落；**B** 原始 GitHub PR/Issue/Commit/Actions 结构数据和 Job log；**C** 依赖 Owner 真实生产系统、尚未取得/认证。仅搜索摘要：无。本轮没有新查阅外部第三方文章，也没有本轮新截图；GitHub 不可变 SHA、PR comments 和 Actions job URL 是可回溯的证据位置。

## 5. 交接终点的严格边界

本交接仅整理已经合并并核验的事实，不修改 #1184 管理文件，不创造新 Owner 签署、不操作正式 PG DDL/DML/密钥、不激活 CV03 SAVE 或跨页 EXPORT。该 docs-only PR 完成后需**另行记录它自己的 PR HEAD/最终 main/东京 preflight + deploy 状态与 Branch Hygiene**；在完成前不能将它写作已通过。
