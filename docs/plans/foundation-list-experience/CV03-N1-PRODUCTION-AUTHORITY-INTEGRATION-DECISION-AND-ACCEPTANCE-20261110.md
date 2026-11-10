# CV-03 / N1 正式授权权威集成决策与可执行验收门禁

> 2026-11-10 / N1-04l 最后一轮阶段性收口。范围：现有 **Eidos + Platform + PA05 + AuthorizationProvider + Domain Owner** 的 Personal Saved View / Collection View，不新建通用列表框架。此文为**待正式 Owner 签收的工程建议与逐项验收合同**，不是已经完成的生产实施记录或批准文件。
>
> **当前唯一可执行生产判定：`NOT_CERTIFIED`。** `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`；Saved View 正式 SAVE 403；未注册 Page GET 404。不能以 PG18 隔离夹具、CI Human UI Gate 或这份文档打开开关。

## A. 实际源码权威图（G）与已证实的断裂

```text
Human / Personal Agent request
    -> Host identity and active enterprise (current Principal + ActorType)
    -> existing PA05 Manager / Capability Operation registration
           |                                          |
           v                                          v
      LifecycleStore (file/memory)            AuthorizationProvider (resolved runtime)
           |                                          |
           +--- manager.service event callback -------+
                    |
                    v
           manager/server.ts pluginEvents / realtimeEvents
                    |  (bounded in-process publication)
                    X  NO shared durable atomic transaction to SQL authority/outbox
                    |
          independent PostgreSQL Resource Repository / SQL mirror
```

1. [真实 Manager](../../../manager/service.ts) `disable()` 先 `store.deleteActiveFeature`，之后才调用 `onLifecycleEvent`；中间 Host 崩溃、事件生产/发布失败、远端不可用，当前没有**同一权威事务中的持久未投递记录**可供重启可靠重放。
2. [正式 Host](../../../manager/server.ts) 的 `createAppManagerService` 回调发布本机事件；`resolveAuthorizationProvider()` 通过当前有效 Service Provider Runtime 动态解析，不是一个已经与 LifecycleStore/SQL Event Outbox 共享 ACID 的独立持久授权表。
3. [真实 FileLifecycleStore](../../../manager/store.ts) N1-04i～l 解决单文件写入失败、协作写者覆盖和过期缓存读取；仍不是企业级授权权威源，更不能为离线的另一 Host 或 PostgreSQL mirror 执行原子撤权。
4. [SQL runtime role audit](../../../tools/cv03-n1-postgres-role-audit.mjs) 明确返回 `NOT_CERTIFIED`：常规 PostgreSQL Resource adapter 的无签名直接 DML、PG role/receipt 抽象的生产权限仍不满足 DB 强制收据认证。
5. 隔离 SQL N1-04e～h 工具在 **随机测试 schema / test SQL LOGIN / CI-only keys** 上证明 actor scope、T0 原子 outbox、T3 签名快照、生成代际 fencing 等候选协议；不是正式部署迁移、生产 Producer/KMS 或已经证明可靠的 PA05 权威事实源。
6. N1-04i 在真实 PA05 文件重启与 PostgreSQL fixture 之间明确构造了 **PA05 DENY、SQL Mirror 仍持有旧 ALLOW/lease** 的实际不一致；隔离 Owner 手动 generation-rotate 能拒绝已知 Scope，但正式 Host 没有自动生产级 Owner fencing 接线。

**设计推论 D**：继续添加仅在测试 PG schema 自洽的 Owner 表，无法消除生产跨存储断裂。必须先统一真正权威事实源与可靠 outbox/fencing 的提交边界。

## B. 待三方 Owner 签收的推荐方向（不能冒充已批准）

**推荐方案：仍在现有 PA05 Manager / AuthorizationProvider / Eidos-Platform 内，使用受控 PostgreSQL 的同一 ACID 事务管理 Saved View 所依赖的生产授权生效事实、`source_generation`、`authority_epoch` 和不可变的投递 outbox。** 不改变现有业务 List/Capability Operation 合约，而是给真正的生产 Owner 提供可验证的持久写入和恢复机制。其物理 Schema、SQL 角色与表归属必须由 PA05/DB/Security Owner 决定，不可复制 `cv03_n104f_test_*` 测试表充数。

| 决策 | 推荐方案 | 需要 Owner 实际回答 |
| --- | --- | --- |
| **权威来源** | 明确唯一 source-of-truth，PA05 激活/停用与授权 epoch 变更经同一受控事务写入，outbox 在该事务追加 | PA05 Owner + Authorization Owner：现有 Provider 的正式权威从哪读？能否与 PG 授权事实同事务？哪些插件/应用保持旧文件存储？ |
| **操作提交** | `T0` 原子写入 Actor+Enterprise+Operation 的 enabled/denied 状态、epoch、generation 和不可变 outbox；提交前绝不对外 ACK | DB Owner：表 owner、迁移顺序、primary/replica、权限、rollback 与 backfill 策略 |
| **身份** | Producer 的真实 Host principal、ActorType、enterprise/subject 经不可伪造的运行时认证与 pool SQL scope 绑定 | Security Owner：IdP/Host workload identity、KMS/HMAC key custody/rotation、SQL roles、不可信应用不能直接 DML |
| **撤权** | 正式 `disable()/revoke()/switchEnterprise()/pluginUninstall` 同步写入权威 DENY/tombstone 或先全域失败关闭；不可因为事件网络不可达继续接受旧权限 | PA05 + DB Owner：撤权传播窗口、租约 TTL/SLO、过期 Fence 的拒绝语义 |
| **恢复** | 每个 generation 有持久水印与完整 Scope 快照；重启/断线/缺号或主脑切换在完成 authoritative reconcile 前 SQL 不健康，不释放 ALLOW | Security Owner：离线 Scope 枚举、tombstone 保留、旧 generation 防重放与双 Host fencing |
| **域资源** | 继续采用 Domain Owner Saved View 名称空间和 PostgreSQL 原子资源+Receipt，HUMAN/AI 同权威但独立 actor scope | Domain Owner：原 LIST/WRITE/READ 审批、页面与 Agent Command 现有 API 不变，变更仅限受信持久层 |

**不推荐**：把 `onLifecycleEvent` 之后的进程内 `pluginEvents.publish` 当作可靠 DB outbox、直接授予 Host SQL LOGIN `INSERT/UPDATE resources`、仅靠 `SAVE_MODE=ON` 开门、静默清理事故残留锁文件、把 N1-04f 模拟 HMAC 秘钥和测试 `cv03_*` 表部署到生产。

## C. 分步可执行工作包与 Done 条件

| 阶段 | 实际动作（必须交付代码/迁移/Actions 证据） | 可验收条件 | 当前 |
| --- | --- | --- | --- |
| **N1-05a — 冻结真实 Owner 决策** | PA05+Authorization+DB/Security 三方在项目正式决策文件签收 source-of-truth、Host identity、生产 Schema/Key/role 和恢复模型；列回滚/灾难恢复与多 Worker 责任 | 签收含 Owner、时间、具体资源、禁止测试密钥；无签收不得做生产写迁移 | **OPEN** |
| **N1-05b — 真实权威 T0** | 在现有 Manager/Provider 不改业务 API 的前提下，使 WRITE/REVOKE 能在同一生产兼容 PostgreSQL 事务提交 authority epoch + immutable outbox。持久状态与事件只有一个 commit boundary | 实测强制终止/ROLLBACK 前后：旧权限不可因事件 ACK 复活；跨进程 restart 重放 exactly one effective event；离线事件必可恢复 | **OPEN** |
| **N1-05c — SQL 身份与 Signed DML** | 主机信任身份、role、ActorType/Enterprise、签名/密钥轮换落地到正式 DB Owner SQL；剥离直接资源和 Receipt DML | 不可信和普通 Host/Agent SQL 登录物理拒绝 unsigned INSERT/UPDATE；多 Host、AI/Human 与跨企业越权拒绝；安全 Owner 独立复核 | **OPEN** |
| **N1-05d — 冷启动/切换 Fence** | Host 在 HTTP 和任意 Saved View 请求前与当前可信 Owner 核对 generation+source watermark；SQL mirror epoch/gap/tombstone/lease 健康由正式 Owner 持久维护；未接通即 fail closed | SIGKILL/DB 故障/事件 gap/旧主脑/离线 Source/签名 key 撤销场景逐项失败关闭；可信完整快照后仅应恢复授权 Scope | **OPEN** |
| **N1-05e — 真正 Human+Agent 端到端** | 使用正式 Eidos Collection View/Domain Owner 真实表，授权 Human/Personal Agent 同操作与不同 actor scope、切企业、撤权、重启并打开详情/返回原视图 | 功能、布局及移动端（含 390px）Human 验收、真实外部 LLM 受控工具调用，CI/evidence 定向且无敏感字段泄漏；无“想象 UI”证据 | **OPEN** |
| **N1-05f — 审核切换发布** | 正式生产兼容迁移、可回滚路径、事故告警、最小权限、本机/远端 SQL Producer 认证、SLO 验证及事后证据包 | 所有 Owner/安全/人类签收、同 SHA CI 全绿、可执行 rollback、实际部署与监控。**到此才能提交移除 SAVE OFF/403/GET 404 的独立上线 PR** | **OPEN** |

## D. 直接可执行的故障矩阵（禁止用模拟证据替代）

用**真实 Manager、真实 AuthorizationProvider 持久权威、真实生产兼容 PG Schema/SQL LOGIN、正式 Host 子进程**运行下列场景，并保留 exact commit SHA、Actions Job、失败日志/拒绝状态、角色 GRANT 查询以及安全 Owner 签收：

- **T0-A**：撤权之前/之后两个时间点分别 `SIGKILL`，确保写入权威状态与 outbox 同成功同失败；不得出现 PA05 已 DENY、SQL 仍可接纳旧 ALLOW 的未受控窗口。
- **T0-B**：提交已完成，但投递 ACK 丢失，两个新 Host 重启同时投递，至多一个有效生效 epoch；重复/旧 generation 永不续租。
- **T0-C**：真实 Provider 独立撤销、PA05 `disable`、`uninstall`、enterprise switch 和 Actor Human↔AI 在数据库断线、网络恢复与授权 lease 尚未过期时均失败关闭。
- **SQL-D**：未认证无签名直接资源/Receipt DML、测试密钥、SQL `SET ROLE`、借用 pooled connection、Actor/subject/enterprise 混淆、跨租户历史 Receipt 读取皆物理拒绝。
- **Recovery-E**：事件 epoch 跳号、generation 轮换、Producer 双活、旧快照重放、缺 tombstone、只恢复部分 Scope、离线企业注销后重新出现；任何 incomplete 状态在真实 SQL READ/WRITE 均为 DENY。
- **Recovery-F**：操作员控制的完整签名快照含全部 Scope+Watermark，恢复后同主体 Human 与 AI 仍独立，明确 DENY 范围不被 ALLOW 继承。
- **Runtime-G**：正式 Host 持久文件出错/协作 lock 持锁/其它进程撤权时拒绝本地旧缓存；网络恢复前不得用“本机文件已恢复”自行宣布 PostgreSQL 生产授权一致。

## E. 与已完成 N1-04e～l 的关系及交接

| 证据类别 | 可直接复用 | 绝不可宣称 |
| --- | --- | --- |
| PG18 isolated `cv03_*` | N1-04e Actor scope、N1-04f T0/T3、N1-04g Outbox 验证、N1-04h Producer fencing 的失败注入测试结构 | **生产 SQL 身份、实际 LifecycleStore 原子权威、上线 KMS/迁移** |
| 真实 Host/文件工程 | N1-04i 单次持久化、N1-04j 正式 Host 冷启动 opt-in Feature 失败关闭、N1-04k 文件旧写者 fencing、N1-04l 文件旧读者 fencing | **远端 SQL 旧租约已同步撤销** |
| 正式 Host Admission | `manager/cv03-personal-saved-view-host-admission.ts` 硬门禁；`manager/server.ts` 实际未注册 Saved View WRITE Handler/Feature | **SAVE 已可投产或 Human/AI 已可真实使用 WRITE** |

对下一窗口最有效的接续：先从合并后 `main` 和该决策/交接文件入手，检查正式 PA05/DB Owner 是否批准同一持久权威源；**未批准则停止扩展测试级 SQL Owner，不要自行宣称生产 N1 合格**。推荐下一条工程 PR 应只围绕 **N1-05a 的真实 source-of-truth 与迁移边界签收**展开，或在真实权限可达时直接实施 N1-05b；不要在不知真实 DB/KMS 的情况下为满足“连续执行”而修改生产 SAVE MODE。

本轮来源仍只有项目 G 原文与工程 D 决策，没有新增外部研究或私有生产密钥。项目正式人类/安全签收未发生。并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的三份 Owner 文档不得覆写；该 PR 的职责由其原 Owner 收口。文档和本轮真实代码合并仍需 exact HEAD Actions 全绿并由 Branch Hygiene 安全清理后才能报告完成。
