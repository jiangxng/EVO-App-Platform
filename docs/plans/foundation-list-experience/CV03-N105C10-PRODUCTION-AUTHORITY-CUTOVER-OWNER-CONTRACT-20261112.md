# CV-03 / N1-05c-10 — 真实 PA05 / AuthorizationProvider 生产权威接线前置契约与 Owner 决策请求

> 2026-11-12；基线 `main@de70a6c5c6a7ae32e2068ef83a75999e6768982b`，本文件为**生产接线前置决策包（G/D/P）**，不是 Owner 审批、生产 schema、生产迁移或 N1 认证。延续 [正式 N1 决策及验收计划](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)、[Owner Gate](CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md)、[上一窗口交接](CV03-N105C-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md) 和 [N1-05c-09 门禁](CV03-N105C-09-OWNER-RELEASE-EVIDENCE-GATE-20261111.md)；**不重复 N1-05c-01～08 东京隔离 QA**。
>
> 结论：用户已选择**方案 A**（同一真实 PostgreSQL ACID T0）；但没有 PA05、AuthorizationProvider、DB、Security 的独立真实签署，**不得把本文件中的候选字段/步骤当作已经批准的生产配置**。Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍需真实 Owner Review；并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的三份受管文档不作修改。

## 1. 本次 G：从正式源码确认需要迁走的授权权威边界

| 正式源码（本次直接读取，2026-11-12） | 实际观察 G | 方案 A 对应的迁移条件 D |
| --- | --- | --- |
| [`manager/server.ts`](../../../manager/server.ts) 启动段 | `APP_PLATFORM_STATE_FILE` 选择 `createFileLifecycleStore` 或 `createMemoryLifecycleStore`，`enterpriseResourceRepository` 选择独立文件/内存；启动先检查未注册 Saved View Feature 和 `SAVE_MODE=OFF`。 | **仅为 Saved View 所依赖的 Feature+Authorization 持久权威建立明确切分**；不能顺手迁移所有企业资源、其它 Plugin lifecycle 或更改默认 Eidos 导航。 |
| [`manager/service.ts`](../../../manager/service.ts) `deactivateFeature`、`disable`、`uninstall` | 本地 `store.deleteActiveFeature` 早于 `onLifecycleEvent`；解除整包还包含 `deleteInstalledPackage`；本接口无 PostgreSQL 事务参数。 | 不能把旧入口的回调视为 T0；正式 Saved View 操作要先让 **Owner-owned T0 同时提交权威状态、epoch、generation、不可变 Outbox**，才能确认结果/继续局部投影。整包卸载绝不是单 Feature 的停用。 |
| [`manager/store.ts`](../../../manager/store.ts) | FileLifecycleStore 有单机锁、版本检查和 fsync；不是远端 PostgreSQL/多 Host 的授权事务。 | 文件可保存非授权的其他 Plugin 配置，但 **被迁移 Scope 的 ALLOW/DENY 不允许继续由文件或内存单独签发**；本地快照只作经水印验证的派生投影。 |
| [`manager/provider-resolution.ts`](../../../manager/provider-resolution.ts) 和 [`manager/server.ts`](../../../manager/server.ts) Provider 段 | ProviderBindingStore 目前提供内存/文件实现；`resolveAuthorizationProvider` 根据活跃 Provider + binding 动态选择 runtime；静态规则来自 `APP_PLATFORM_AUTHORIZATION_POLICY_JSON`、overlay 与内置规则。 | **先由 Owner 给出实际部署的 providerId、binding scope、来源及策略覆盖顺序**。默认静态 ALLOW 和动态 Provider “HEALTHY”不能为已迁移 Saved View Scope 绕开数据库 epoch/fence。 |
| [`providers/authorization/runtime.ts`](../../../providers/authorization/runtime.ts) | 现有 Static Provider `check` 对规则执行 DENY/ALLOW/NO_MATCH，并无权威 epoch + Outbox 同事务存储。 | 保持现有 `AuthorizationProviderV010.check` 和 Host ActionRouter 外部契约；在**真正的 Owner 授权来源**中解决持久 Scope 与 lease 健康，不能自造一个并行框架。 |
| [`manager/server.ts`](../../../manager/server.ts) lifecycle event / Action 路由；[`manager/cv03-personal-saved-view-host-admission.ts`](../../../manager/cv03-personal-saved-view-host-admission.ts) | `pluginEvents.publish` 与有界 `lifecycleEventLog` 发生在 Manager 回调；正式 Saved View `collection.saved-view.personal.save` 当前由 Host 返回 **403**；未注册页面 GET **404** 保持。 | 发布事件仅从 T0 已提交 Outbox 派生、可幂等重放；**不能**把事件先发布的成功作为 DB 原子提交证明。 |
| [`manager/cv03-n105b-authority-t0-pg.ts`](../../../manager/cv03-n105b-authority-t0-pg.ts) 与 [`manager/cv03-n105b-pa05-host-lifecycle.ts`](../../../manager/cv03-n105b-pa05-host-lifecycle.ts) | `UNMOUNTED` 的 opt-in deny/fence adapter，有单请求 SQL Owner 函数端口、scope echo、receipt 校验；当前仅独立 QA 证明其限定行为。 | 可复用接口形状，**不可复用** QA schema、SQL LOGIN、合成 authority row、临时凭据；正式接线另开 Owner 审核 PR。 |

这里的“文件/内存 vs SQL”是**已读取源码中实际可见的边界**，不是对未知生产外部授权系统的否定性证明。没有本次独立读取过的 PostgreSQL 原始日志不重新标记“已读”。

## 2. 待 Owner 冻结的唯一 T0 事实合同（D：候选，不是 DDL 授权）

**作用域**：只针对 `host-enterprise-context-provider.personal-saved-views` Feature 及 `collection.saved-view.personal.save` 操作；继续由现有 Domain Owner/Eidos + Platform 标识业务资源。凡影响正式权限的 ALTER 都要精确归属可信 Owner：安装/激活、停用、撤权、切企业、轮换来源、卸载；Human 与 AI **不可混同**。

- **Canonical scope 候选**：`installationId`、`packageId`、`featureId`、`contextId`、`enterpriseId`、`principalSubjectId`、`actorType`、`operationId`。实际 PK/NULL/通配与 Actor/subject 映射，**待 AuthorizationProvider 与 DB Owner 定义**；不能从请求 JSON 自报 Host、Principal、Enterprise。
- **同一提交边界**：T0 内 lock/CAS 真实 source generation 与当前 epoch，写入**当前启用或 DENY/tombstone、递增 `authority_epoch`、不可逆 `source_generation` fence、不可变 Outbox、幂等 operation/receipt**。任一环节失败必须整体 ROLLBACK；不可在文件写完、event 发出但 DB 未提交时 ACK。
- **整 Feature/整包停用**：使用**覆盖将来、离线、未知主体**的 package/feature 级持久 DENY fence；禁止循环逐 actor 写 DENY 假装原子性。旧 session、旧 generation 和旧租约无权为此作用域恢复 ALLOW。现有同 Package 默认 Feature/Provider 不受影响。
- **生产身份**：DB 自身根据真实 `SESSION_USER`、受信 Producer→Host/actor/enterprise 映射和批准的签名工作负载身份判定，`SECURITY DEFINER` 最小权限且无直接表/Outbox/Receipt DML 或 `SET ROLE` 旁路；Host 自传的 `trustedHostId` 或返回行 echo **不是**身份认证。SQL schema 名/Owner/Principal/GRANT 与 KMS 都待真实 Owner 冻结。
- **完整恢复**：信任的不可变 generation、全 Scope 集合、全量 DENY/tombstone 和单调 watermark 应来自**同一正式权威源**；先校验完整性、签名、缺号和旧 Producer fence，再释放该 generation 内确有授权的 Scope。没有枚举到的离线企业/未来主体、快照缺失、事件 gap、主库分区、Signer 轮换期间都默认 DENY，**不得**把“某个 QA 表 row count=0”解释为恢复完成。
- **事件语义**：可重复投递 Outbox，但每个 `operationKey + generation + scope` 最多一个**有效状态改变**；ACK 丢失后重放同 receipt、同 epoch、同 event ID。不以进程内 event log 或 `pluginEvents.publish` 代替不可变事件证明。

## 3. 安全迁移 / 回滚顺序（Owner 提案，未获执行许可）

| 关口 | 实际动作、观测和拒绝条件 | Responsible Owner | 本轮状态 |
| --- | --- | --- | --- |
| M0 / Inventory | 在**正式环境只读**盘点已部署 Provider ID/binding/策略来源、真实 PA05 Feature 状态、租户/Actor/subject/operation 全 Scope、PG 主库及凭据授权边界；具名签认来源与变更窗口 | PA05 + AuthorizationProvider + DB | **PENDING** |
| M1 / DBA-controlled migration | DBA 给出版本化目标 schema/owner/GRANT、只读备份与完整回滚演练、Outbox 保留/PITR、两套角色及 signed Producer；隔离于原业务表及现有 QA | DB + Security | **PENDING** |
| M2 / fenced backfill | **先永久拒绝该 Feature 的旧 ALLOW 入口**，对全部正式 Scope 由真实 source 生成有水印的完整快照与 DENY/tombstone；无完整枚举/一致性/epoch 校验即暂停，不让 FileStore 和 Pg 并行双主写授权 | PA05 + AuthorizationProvider | **PENDING** |
| M3 / opt-in read-reconcile | 在不开放 SAVE 情况下验证真实 Host 冷启动、两个物理 Host 的 Provider source/epoch/lease 与相同 Scope；离线、缺号、切企业、旧凭据拒绝，默认企业其他 Feature 不变 | PA05 + Security + Domain | **PENDING** |
| M4 / single-T0 cutover | 由正式 Host Writer/Provider Owner 在同一 T0 commit 权威状态/epoch/generation/Outbox，并以版本化路由只允许单源写；演练 SIGKILL、DB outage、ACK loss、跨机 replay | PA05 + AuthorizationProvider + DB | **PENDING** |
| M5 / rollback | **不能**简单切回还持有旧 ALLOW 的 FileStore！先维持 SQL package fence/DENY 与 Host SAVE OFF，撤销新 Producer/禁发旧 lease，恢复上一个可信 generation 的**完整**状态+watermark，核验后由所有 Owner 再决定重试 | PA05 + DB + Security | **PENDING** |
| M6 / release | Domain Owner/Human 390px 与真实 Agent tool 端到端；生产回滚、外部 Host 故障证据、签名/密钥轮换、确切 Head CI 与真实 Owner Review 均符合 N1-05f，再**单独发布 PR**审核 SAVE OFF/403/404 | all Owners | **BLOCKED** |

重要安全不变量：只读 inventory 和本决策文档不能替代 M1～M5。不得写/迁移 `evo_dev` 原业务数据、不得以合成 `cv03_n105b_qa` 充数，不部署生产秘钥，也不因 PR CI 绿灯跳过审批。

## 4. #1212 待逐项回答的具体签署问题（P）

| 真实责任主体 | 签署中必须回答的最小决策，不得用勾选框或 AI 自签 |
| --- | --- |
| **PA05 Lifecycle Owner** | 哪个正式 `Feature`/Package 的 `activate/deactivate/disable/uninstall` 入口受 T0 管？本地 FileLifecycleStore 的非权威字段如何保留？谁负责单 Writer/跨 Host fence？持久状态迁移和失败恢复的精确顺序是什么？ |
| **AuthorizationProvider Owner** | 正式 `providerId`、runtime resolution、binding scope 与持久 policy source 的实际 ID 是什么？如何把 Human/AI/enterprise/subject/operation revoke 与 epoch 在真正 T0 中保证生效？哪些既有静态 ALLOW 被覆盖而哪些保留？ |
| **DB Owner** | 正式 PG primary/数据库/schema/Owner/SQL LOGIN（只公开非敏感标识）、实际 DDL/GRANT/SECURITY DEFINER/Outbox/完整 Scope snapshot、PITR/RPO/RTO、向前及回滚迁移步骤是什么？如何证实无直接 DML/越权？ |
| **Security/Ops Owner** | 哪个实际 Host principal / workload signer / KMS key ownership & rotation policy？丢失/旧 Producer 和网络分区后如何拒绝？谁签不同**物理 Host**恢复测试与事故 SLO？ |
| **Domain Owner / Human+Agent** | 真实 Saved View Domain Owner 标识/Capability Operation 是否维持？字段权限、企业切换、Human/AI 独立授权、390px 与真实 Agent 调用的明确验收、上线回退负责人是谁？ |

**签署证明最小格式**：具名 Owner 的真实 GitHub `APPROVED` Review（或经授权的版本化 Decision + 可核验的审批链接），角色、UTC 日期、环境标识、适用源 SHA、权威选择及风险接受范围、回滚负责人；若同一人兼任多个角色要明确逐角色承担。应先核验签署人是否实际有对应权责。**当前无人可由 AI 代签**。

## 5. 本轮验收状态和下一步

- **G 本轮已做**：核验 GitHub `main@de70a6c5c6a7ae32e2068ef83a75999e6768982b`；直接读取上述正式源码、上一窗口交接和 #1212/#1184 的活状态；#1212 仍 OPEN 且五项勾选不构成签署，#1184 OPEN，PR Reviews 空（仅 2026-11-12 时点观察）。保留 [N1-05c-09 protected-main Owner evidence Action](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43054986490) 作为**历史已归档**门禁证据，不重复跑 QA。
- **D 本轮交付**：把方案 A 的 source-of-truth 分界、唯一 T0 事务、整包 fence、完整 Scope 恢复和不放开 SAVE 的迁移/回滚条件压成可签署契约；**不声明数据库表、凭据或 Key 已获批准**。
- **P 真正阻塞**：五类 Owner 对 M0～M6 的具名决策、原生产 schema/Producer、KMS 与跨物理 Host 证据；未取得前**不执行正式 Host 最小接线**。
- **固定发布状态**：`N1=NOT_CERTIFIED`，`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，正式 SAVE POST **403**，未注册 Page GET **404**；本轮不变。
- **下一可执行工程 PR（需 Owner 批准后）**：只围绕**单 Saved View Feature**的真实 PG T0 + Provider/Manager 最小接线，另备 DBA migration/rollback + 多机 fault matrix；禁重做同机 synthetic QA，也不碰 PR #1184 文档。

### 本轮来源等级

- **已读原文 G（2026-11-12）**：`manager/server.ts`（与本范围对应的启动、Provider、Manager callback、Action 片段，**非全文件通读**）、`manager/service.ts` 相关函数、`manager/store.ts` 相关段、`manager/provider-resolution.ts` 原文、`providers/authorization/runtime.ts` 原文、`manager/cv03-personal-saved-view-host-admission.ts` 原文、两份 `cv03-n105b-*` 原文、上述 N1/Owner/交接文档、GitHub #1212 Issue 与 comments、#1184 PR metadata/reviews。
- **沿用旧 G 但本轮没重读原始物理日志**：N1-05c 东京 PG17.11 Action #43051604400、#43054986490 等，参见 [上轮原始资料索引](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)，不可重新声称本次现场复核。
- **未访问原文/待验证 P**：生产 PG/Key/身份、实际 Owner signoff、跨物理 Host 和 DR。**本轮没有新增外部网页研究，也未冒充已读历史链接。**
