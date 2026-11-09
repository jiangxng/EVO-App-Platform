# CV-03 / C3-01：现有 Enterprise Resource Provider 的条件写入纵切（2026-11-09）

> **状态：CODE_MERGED / CI_PASS / PRODUCTION_MULTI_HOST_NOT_CERTIFIED。** 实际代码和测试位于 [PR #1177](https://github.com/jiangxng/EVO-App-Platform/pull/1177)；按该 PR 的最终准确 HEAD/CI 判定。**本文件不代表 Saved View 已保存成功，不授权生产 Agent WRITE，不关闭完整 C3-01 跨主机正式后端门禁。**
>
> **来源**：[CV-03 技术决策](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)、[唯一 CV-00~07 状态表](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[旧窗口恢复索引](CV-20261109-RECOVERY-HANDOFF-ENTRY.md)。

## 1. 已实现的契约范围

- 扩展原 `contracts/enterprise-resource.ts`，**不新建列表/业务数据库/Agent API**：可选 `putIfRevision({ expectedRevision: null | number })` 和 `archiveIfRevision({ expectedRevision: number })`。`null` 为原子创建（归档 ID 也仍占用），具体数字为比较当前 revision 后更新；不匹配返回 `ENTERPRISE_RESOURCE_REVISION_CONFLICT`。
- 仅条件写入的资源携带 `revision: 0,1,2...`；之前未带 revision 的旧事实继续原有行为，允许以 `expectedRevision: 0` 显式升级；升级后不允许旧 `put`、`putMany` 或 `archive` 绕过比较写，返回 `ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED`。
- `archiveIfRevision` 版本递增，标记 ARCHIVED 而非删除；已归档拒绝重复归档，拒绝用 create-if-absent 复活同一 ID。
- `conditionalWriteConsistency` 只是**具体 Provider 的保证级别标签**，不是授权凭据或服务器部署认证：Memory = `PROCESS_LOCAL`，File = `SAME_FILESYSTEM_LOCK`。缺少方法或未满足真实持久 Store 要求时，调用方 fail closed。

## 2. 文件 Provider 的受限原子性与实际故障语义

- 本次在已有文件 Provider 的修改入口（`transaction`、`put`、`putMany`、`archive` 以及两个条件写入）采用**同一路径、同文件系统上的原子目录创建写锁**。锁持有时读取最新快照、验证 revision、写唯一临时文件并在同路径原子 rename。不同 Repository 对同一文件路径的写入不再执行未经锁保护的 read-modify-write。
- 同一锁已被持有时抛出 `ENTERPRISE_RESOURCE_STORE_BUSY`，不会猜测另一写是否成功；调用者需要独立 readback/receipt 判定后再选择操作。崩溃留下的锁**不自动抢占**，防止误删活跃写者的锁；人工恢复必须确认无活跃进程和文件一致性。
- 通过两个独立 OS 进程同 revision 更新的正反向回归验证“同一文件路径不能双成功”；验证新 Repository 重启读回、并发冲突、旧接口禁止绕过。
- **明确不保证**：两台云主机各自的本地文件/非原子共享卷、远程对象存储、第三方分布式 Provider 的全局 CAS；以及操作系统崩溃/断电的 fsync 级持久性。文件锁的保证范围是**同一共享文件系统且锁/rename 原子语义成立**，并不是通用多 Worker 生产认证。

## 3. 自动验收/负例

| 层级 | 真实代码或检查 | 状态判定 |
| --- | --- | --- |
| Provider contract + TypeScript | `npm run build` 及 Platform protocol/core | 以最终 PR CI 为准 |
| Memory 单实例 CAS | 创建/重复、按版本更新、旧版本冲突、非法版本、归档和跨 Context 检查 | `tests/protocol/cv03-resource-conditional-write.test.mjs` |
| 兼容性 | 无版本旧记录仍可写；条件迁移后旧无条件 `put/putMany/archive` 禁止覆盖 | 同上 |
| File 多 Repository | 两个 Repository 同路径，锁 BUSY、冲突、归档、另一个 Repository 读回 | 同上 |
| File 多真实 Node 进程 | 两个独立进程对同一 revision 提交，**仅一个成功**；结果必须能由重启实例读取 | 同上 |
| 正式分布式 Store | 真正不同主机/Worker/Provider 的单一持久权威及 crash/retry/readback | **NOT_VERIFIED / BLOCKING** |
| Saved View Human/Agent WRITE | 真实 Host Operation 授权、幂等 receipt、Personal Agent 工具、Eidos、手机 | **NOT_IMPLEMENTED / C3-02~04** |

## 4. 下一条最小工程闭环

1. 合并前要求 #1177 最终 HEAD 的 Build、Protocol/Core、Lightweight Host 与相关插件 CI 全绿；查 PR 文件 diff，确认未添加业务私有代码到 Host/Eidos。
2. 确认正式线上 Enterprise Resource **实际落地的存储拓扑**。如是独立节点本地文件，`SAME_FILESYSTEM_LOCK` 不能证明全局安全，**不得开放 Saved View WRITE**；应由现有 Provider owner 选择支持原子比较写的正式数据库/共享权威，实现同契约并做跨 Worker/崩溃恢复测试。
3. 再启动 C3-02 Personal Saved View：当前 Principal/Enterprise scope、来源 owner query/字段/schema 校验和真实 Host `invoke.write` + receipt；Eidos 只消费有权视图配置。共享视图 C3-03、自然语言与 Human 390px C3-04 独立验收。

**禁止误报**：本 PR 仅解除“存储合同完全没有条件写入”的第一段代码缺口，不能把 Memory/`SAME_FILESYSTEM_LOCK` 当正式多主机原子性，不能因此将 CV-03 从 PLANNED 直接标 HUMAN_PASS。

## 5. 已合并工程与正式环境实况（2026-11-09 本窗口复查）

- **实际合并**：[Platform #1177](https://github.com/jiangxng/EVO-App-Platform/pull/1177) 已合并到 `main@1cb6730841e8b3fd8841360c947b71bfc28c84f5`。最终 PR HEAD `b6328fb3a5c9f5c927d511491f92abec1beec268` **9/9 GitHub 检查完成且成功**：Platform `protocol-and-core`、`lightweight-host`、连续性、UI 设计门禁及相关插件 CI。此为机器证据，不是生产部署/真实 Agent/Human 证明。
- **GitHub Host 路径**：[manager/server.ts](../../../manager/server.ts) 中 `APP_PLATFORM_STATE_FILE` 决定生命周期 State Store；`APP_PLATFORM_ENTERPRISE_RESOURCES_FILE` 若未设置，则资源文件路径为该 state file 同目录 `enterprise-resources.json`；两者都未配置则退回**进程内存**资源。若正式环境真实文件路径不在持久挂载卷内，则重启读回仍不成立。
- **Railway 配置只读观察**：本窗口通过已连接的 Railway 项目 `EVO Ledger Runtime MVP` 的 `production` 环境核对 `Ledger Configurator` 服务：源仓 `jiangxng/EVO-App-Platform` main、地区 `sfo`、部署配置单副本、挂载卷 `ledger-configurator-state` 至 `/data`；该服务变量**名称**包含 `APP_PLATFORM_STATE_FILE`，未列出独立 `APP_PLATFORM_ENTERPRISE_RESOURCES_FILE`。未读取/存储任何 secrets 值，**故不能确认实际 State 文件路径是否在 /data**；也未登录该 Host 执行保存/恢复测试。
- **部署结果与限制**：Railway 该服务返回的最近部署记录为 `FAILED`（创建时间 2026-10-08），不是本次 PR 发布证明。单副本 + Volume **不等于**多副本共享持久存储；File Provider `SAME_FILESYSTEM_LOCK` 不具备跨节点不同本地卷的全局 CAS 保证。
- **C3-01 结论**：条件写入公共 API、单机/同文件系统互斥与测试已合入；**正式存储拓扑认证仍 OPEN**。C3-02 Human/Agent Saved View WRITE 不得据此默认打开；首先需要验证部署文件路径/重启恢复/跨 Worker 共享性，或由已认证的数据库 Provider 提供真正跨实例的条件提交。即使单实例可读回，也不等于未来横向扩容安全。

