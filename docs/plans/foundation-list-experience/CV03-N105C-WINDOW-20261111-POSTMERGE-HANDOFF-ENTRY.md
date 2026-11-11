# CV-03 / N1-05c / 2026-11-11 — Window #07 post-merge handoff entry

> **用途：** 从真实东京 PostgreSQL 预览 QA + 限定身份推进到生产授权决策前的最终交接；配套 [来源与决策详细索引](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)。  
> **写作基线：** `main@fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031`（#1247 已合并）。**此 SHA 不是本交接合入后的最终 main**，新窗口必须再次取最新主线 40 位 SHA。  
> **本轮明确不能改变：** `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 Saved View SAVE POST 403、未注册 Page GET 404、Issue #1212 OPEN；并行 Owner PR #1184 的三份受管文档不改动。

## 1 / 已确认要求和实际决策

- 仓库 [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)，准确工作主线 `main`。基于现有 **Eidos + Platform + PA05 Manager + AuthorizationProvider + Domain Owner**，不能换成另一套列表/授权框架。
- 用户已经选定 **方案 A（D）**：目标是将正式 Saved View 授权事实、`authority_epoch`、`source_generation` 与不可变 Outbox 置于**相同 PostgreSQL ACID T0**；保留 Human/Personal Agent 现有业务 ActionRouter 和分主体/企业/ActorType 授权。
- 用户允许主动执行独立 PR、CI、东京腾讯云预览发布与实际测试；**执行许可不等于第三方 PA05/DB/Security/Signed Workload 真实验收**。每次使用独立分支、Draft PR、精确 HEAD CI、Ready、合入 main、Branch Hygiene 精确 SHA 删除并记录；不直接修改 main。
- 因原始生产授权来源和真实签名没有独立 Owner 审批，本七次自动续跑严格把所有 QA 成绩解释为**有限物理证明**，没有打开 SAVE，没有把 synthetic `cv03_n105b_qa` 迁移成原业务 `evo_dev` 的权威源。

## 2 / 里程碑、物理成果、明确边界

| 工作段 | 完成 PR / 证据 | 已真实证明（G） | 未证明（P） |
| --- | --- | --- | --- |
| N1-05b QA 基线 | #1222–#1226；[Tokyo T0 #43018562251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43018562251)、[私有备份全恢复 #43020836019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43020836019) | 隔离 `cv03_n105b_qa` 中的 PG17 受限 T0/冻结/immutable Outbox + 同宿主恢复；原 `evo_dev` 数据不变 | 正式 PA05 Provider 真权威、异地 PITR |
| N1-05c-01 / 02 | #1227–#1235；[SQL Producer #43034999556](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43034999556)；[SCRAM #43028414842](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43028414842) | 实际 QA 密码 SCRAM、正确凭据成功/错误凭据拒绝、Host 绑定；TCP trust→SCRAM、EVO app 正常 | KMS/签名 Host 身份；当时仍有误连原 DB 的 OPEN CONNECT |
| N1-05c-03 / 04 | #1236–#1239；[原库 ACL #43036843959](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43036843959)、[深度 ACL #43039723598](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43039723598) | 原库 `PUBLIC CONNECT` 与 TEMP 仍开放；特定 QA role 表/列/序列/FDW/Server 写读权限测试为 0、原业务 schema 不变 | 无法凭 0 object privilege 证明全链路逻辑隔离 |
| N1-05c-05 | [#1240](https://github.com/jiangxng/EVO-App-Platform/pull/1240) / [#1241](https://github.com/jiangxng/EVO-App-Platform/pull/1241)；[Tokyo #43042027579](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43042027579) | **HBA 精确角色+数据库拒绝**：仅 QA Host01 → `evo_dev` 的 local/IPv4 被物理拒绝；QA T0 和原 EVO app 仍可连接；IPv6 规则已解析 | IPv6 独立客户端、生产广义 Host auth |
| N1-05c-06 | #1242 / #1243；[Tokyo #43044527299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43044527299) | 两个同一 QA Producer 的**独立 TCP 会话同时行锁等待**，仅重放同一已提交 receipt，Outbox/epoch 指纹不变；异 Actor/伪 Host/旧 generation 拒绝 | 两个独立 Host 身份、真实 ACK 丢失/网络分区 |
| N1-05c-07 | #1244 / #1245；[Tokyo #43048753191](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43048753191) | **两套 SCRAM SQL LOGIN、不同 Host 映射**，新账号 HBA 先拒绝原库再创建；并发不同 `session_user`、交叉凭据、伪 Host、直接 DML/SET ROLE 拒绝 | 两台机器、正式生产 KMS、故障回滚演习 |
| N1-05c-08 | [#1246](https://github.com/jiangxng/EVO-App-Platform/pull/1246) / [#1247](https://github.com/jiangxng/EVO-App-Platform/pull/1247)；[Tokyo #43051604400](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43051604400) | **两个真正 Node OS 进程**在同一 EVO 容器、SQL Owner FROZEN、仅终止 Host02 唯一 QA backend，失败关闭；新进程重认证仍 DENY，原 app 正常 | 不同机器/可用区、真实正式 Host request-path、网络分区、主库 failover |
| N1-05c-09 | [#1248](https://github.com/jiangxng/EVO-App-Platform/pull/1248)，[protected-main Owner gate #43054986490](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43054986490)，[验收门禁](../../../tools/cv03-n105c09-owner-evidence-release-gate.mjs) | 源码 + 真实 GitHub #1212/#1184 状态防“全勾选=获批”；主线独立 6/6 对抗测试、Issue OPEN、SAVE OFF，最终 marker `RELEASE_CERTIFICATION_NOT_GRANTED` PASS | **本身永远不构成生产授权签核** |

本轮 #1240～#1247 均通过 exact-head CI、合并 main、真实 Tokyo protected-main Actions 物理 PASS 且独立证据 PR 入库；Process Branch Hygiene 已逐一验证。#1248 也已精确-head 全绿并合并为 `4c5844b875d65a82642cfdc565a0611fa3722343`；主线只读 Issue/Source [Actions #43054986490](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43054986490) job `130641916971` **SUCCESS**，原始日志已读，6/6 对抗测试与活 Issue #1212 OPEN、checkbox 非审批、SAVE OFF、终端 `RELEASE_CERTIFICATION_NOT_GRANTED` 全部 PASS。**这些标记只证明 N1 被正确阻断，不是认证通过。**

## 3 / 真正运行时拓扑和最关键生产阻塞

```text
正式 Human / Personal Agent
   -> 现有 Host ActionRouter / AuthProvider runtime (动态解析)
   -> PA05 Manager Feature lifecycle (文件/内存状态)
        -> 本机 onLifecycleEvent / pluginEvents.publish (进程内)
        -> [X] 未与真实 Pg 授权 epoch + immutable outbox 在同一事务
   -> 正式 Saved View WRITE: 当前 Host startup OFF + action 403

独立东京 QA（仅测试）
   -> role Host01 / Host02, SCRAM TCP -> cv03_n105b_qa
   -> 受限 owner SECURITY DEFINER T0 + synthetic frozen source
   -> evo_dev: Host01/Host02 HBA first-match DENY
   -> [X] 未被正式 PA05 / AuthorizationProvider / Domain Owner 注册为权威
```

- **正式源码 G**：`manager/service.ts` 的 Feature disable 后才 `onLifecycleEvent`；`manager/server.ts` 的 Provider 仍经 `resolveProviderRuntimeV010` 动态解析，当前生命周期存储来自 `manager/store.ts`。`manager/cv03-n105b-authority-t0-pg.ts`、`manager/cv03-n105b-pa05-host-lifecycle.ts` 注明 **UNMOUNTED**。
- `manager/cv03-personal-saved-view-host-admission.ts` 对 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE` 只允许 OFF，正式 `collection.saved-view.personal.save` 路由拒绝，未注册 View GET 404。
- [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) **OPEN/PENDING OWNER SIGNOFF**。**五项 checklist 虽已打勾，但不是真实具名审批**；当前并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) OPEN，读取的 GitHub Reviews 为空（查验时点 11-11）。不覆盖其受管资料。
- 从此转入 PA05/Authorization/DB/Security 原生来源和 Owner 签收；**停止反复增加同机 QA synthetic Owner 表/身份以制造生产里程碑**。

## 4 / 下一窗口最值得实际实施的依赖顺序

1. 从新的最新 `main` 取得 exact SHA，读此简短入口、详细资料索引、[N1 正式权威决策和验收计划](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)、[N1-05a Owner gate](CV03-N105A-PRODUCTION-AUTHORITY-OWNER-DECISION-GATE-20261111.md)、Issue #1212 / PR #1184；复核 N1-05c-09 的 GitHub 活 Issue gate 和 CI，不重做 N1-05c-01～08。
2. 要求独立 PA05 Owner、实际 AuthorizationProvider Owner 确认唯一受权事实源、Feature 生命周期入口和从 file/memory 到 Pg 的**具体迁移与失败关闭顺序**；DB Owner 确认原正式 schema / PostgreSQL Principal / T0 + immutable Outbox / 回滚及 offsite PITR；Security Owner 确认签名工作负载身份、KMS/轮换和多机恢复。**每个角色签署实际 GitHub Review/Decision，引用真实环境和日期，不能以 LLM 自己写的“已审批”代替。**
3. 取得真实审批后，选择最小受控“单 Saved View Feature”接线 PR：将现有 `manager/cv03-n105b-*` opt-in 接口与正式 Provider 生命周期在同一真实 T0 内交付，不影响同 Package 默认企业上下文、Domain Owner 和列表式业务。以前所有 Tokyo QA 身份和 synthetic 数据都必须仍独立、不可复用为生产密钥。
4. 再做不同**物理 Host** partition/SIGKILL/replay、真实持久 SQL Role 授权、签名凭证、异地恢复、多主体真实 Human/Personal Agent（含移动端 390px），由 Owner 复核；N1-05f 完成后才能以单独正式发布 PR 审查关闭 SAVE OFF/403/404。

## 5 / 防止新窗口误读

- 这是 GitHub 工程源、Actions 和特定真实东京 QA 的物理证据；它们**未构成**生产 Owner 的共享持久授权源或 signed workload identity。
- 注意 GitHub Actions 的跳过：PR 上 Tokyo 物理 Job 因 `if: not pull_request` 会正确 SKIPPED；只有**main merge 触发且读取原始 job 日志**才是现场证明。东京自动发布的纯 docs SKIP 不等于部署了新镜像。
- 本轮外部参考仅继承旧索引的 PostgreSQL 官方 HBA 和产品规范，**不能把未本轮重读的网页标作“本轮已读原文”**；具体来源等级详见配套 index。
- 所有旧工作分支由 Branch Hygiene 删除，不能从旧分支延续；若新开窗口，只信最新 `main` SHA。

## 6 / 可直接复制的接续指令

> 接续 `EVO-App-Platform / CV-03 / N1-05c / 方案 A`；仓库 `https://github.com/jiangxng/EVO-App-Platform`，准确分支 `main`。先核验最新 main（本交接编写基线 `fe9759218ea2cf3f81f5cd1bfc4ba8295bc5e031` 仅供历史定位），优先读取 `docs/plans/foundation-list-experience/CV03-N105C-WINDOW-20261111-POSTMERGE-HANDOFF-ENTRY.md`、`CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md`、`CV03-N105C-09-OWNER-RELEASE-EVIDENCE-GATE-20261111.md` 和 N1 正式权威方案、Issue #1212。已完成 N1-05c-01～08 的真实东京 QA，勿重做；#1248 的 Owner Evidence Gate 已合并 `4c5844b875d65a82642cfdc565a0611fa3722343`，主线实时 Issue/Source Actions #43054986490 PASS（**只证明仍未批准**）。下一目标必须推进真正的 PA05/AuthorizationProvider 持久权威同一 T0、独立 Owner 的 SQL Principal/KMS 签收与不同物理 Host 恢复；不得再用 synthetic QA 假装生产认证。继续独立 Draft PR、exact-head CI、main merge、SHA-safe Branch Hygiene；PR #1184 Owner 文档不改，N1 NOT_CERTIFIED / SAVE OFF / POST 403 / GET 404 不变。
