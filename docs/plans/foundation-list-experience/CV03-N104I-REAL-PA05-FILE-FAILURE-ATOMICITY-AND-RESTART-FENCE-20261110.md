# CV-03 N1-04i / 真实 PA05 FileLifecycleStore 写入失败原子性与 Host 重启镜像失联证明

> 2026-11-10；从主线 `62a32723e177ff67464d7b83d7ff703e5777c7aa` 接续；[PR #1206](https://github.com/jiangxng/EVO-App-Platform/pull/1206)。**生产 N1 仍 NOT_CERTIFIED / SAVE OFF、POST 403、未注册 Page GET 404 不变**。

## 1. 本窗口新读到的 G 级原源码事实

- [`manager/store.ts`](../../../manager/store.ts) 在本 PR 前，`createFileLifecycleStore` 的四个方法 `saveInstalledPackage/deleteInstalledPackage/saveActiveFeature/deleteActiveFeature` 均**先修改 live Map，再写 `.tmp` 并 `renameSync`**。发生 EISDIR/EACCES/ENOSPC 等写失败时，同一 Manager 的可见状态可能领先于持久化文件；重启时恢复旧值。这是**实际实现顺序**，不只是想象的 PostgreSQL 场景。
- [`manager/service.ts`](../../../manager/service.ts) 的 `disable` 调用 `store.deleteActiveFeature` 后发 `onLifecycleEvent`；回调不是与另一套数据库中的授权 outbox 同事务。因此真实文件即使写成功，DB 事件仍可能因通信/进程崩溃遗漏。
- [`tests/manager/manager.test.mjs`](../../../tests/manager/manager.test.mjs) 原已有 FileLifecycleStore 的安装/停用/重启回读正例，但没有“**文件写失败之后同一 Manager 的内存状态必须与新进程一致**”的全部四个失败负例。
- [`tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs`](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) 原 N1-04f～04h 使用真实 Manager 决策，却用 memory LifecycleStore；其 PG18 原子测试不说明真实**文件持久化**与数据库镜像的跨存储一致性。

以上为本轮直接核查的 G / 源码；没有新增外部厂商研究，没有把过去的 EX01–EX08 升级为新阅读事实。

## 2. 实际修复：同一文件型 LifecycleStore 的单次写入故障原子性

修改现有 `manager/store.ts`（非另起权限体系）：

1. 四种 mutation 先创建候选 Map，使用候选值生成文件 JSON，再调用 `writeFileSync(tmp)` + `renameSync(tmp,file)`。
2. **仅持久化函数成功返回后**才发布新的内存 Map；任何 I/O 例外沿用原有异常行为，但保留该实例的原状态，防止 Manager 在失败后继续发布并不存在于磁盘的权限/Feature 事实。
3. 每次 snapshot 继续返回结构化克隆；保持现有 FileLifecycleStore 的 JSON 格式和公共同步 API 不变，没有修改管理器的能力/权限判定语义。
4. 只证明**单进程内写入失败原子性**，**没有**解决多进程同时写同一路径、写入时断电的 fsync 目录持久性、文件与 PostgreSQL outbox 的跨存储事务或 Producer fencing。因此不可把此修复标为真实 PA05 授权 outbox 完成。

直接 [Manager 文件用例](../../../tests/manager/manager.test.mjs) 使用真实临时目录，将 `lifecycle.json.tmp` 制造成目录以使写入失败，轮流覆盖所有四种 mutation。每次都要求：(a) 同一 store 的 snapshot 不变化；(b) durable 文件字节不变化；(c) 新的 `createFileLifecycleStore(file)` 重开结果相同。清理障碍后正常 `deleteActiveFeature` 能正确落盘并重新读取。

## 3. 真实 PA05 重启 + 旧 SQL 镜像矛盾的 PG18 负例

原 [N1-04f/04h 联合 PostgreSQL 18 用例](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) 改用**真实 FileLifecycleStore**，保留原完整 Manager / 已安装 Personal Saved View Feature / AuthorizationProvider，测试仍在 localhost 隔离 `cv03proof` 数据库和随机 `cv03_*` schema，不会访问生产 Primary。

完整时序：
- 真实 Manager 安装 Feature、读到 Human ALLOW 并与原 N1-04f 权威夹具 T0/outbox 配套。
- 真实 `manager.disable()` 将活跃 Feature 从文件持久化删除；构造一个**新的 Manager 实例**打开相同文件，确认有效 Capability Operation 消失，原 Action Host 授权评估返回 DENY。
- 在 DB 中故意保留或模拟未过期的旧 `enabled=true` Mirror lease。确认**新进程 Manager DENY、SQL Mirror 仍 ALLOW**，明确这是跨存储漏投撤权时的真实不一致风险。
- Trusted isolated DB Owner 通过已存在的 N1-04h generation1→generation2 CAS/全 Scope DENY tombstones/租约取消操作将 SQL Mirror 立即关闭；旧 Host、旧快照被 fencing。
- 新 Manager 重新启用 Feature 后，在新 Producer/generation2 只能通过真实授权探测、新 T0/outbox、签名 T3 Snapshot 解除指定 Human Scope 的 unhealthy latch；AI/其它 Enterprise 继续拒绝。

**重要负面结论**：当前真正 Host 启动代码没有自动调用数据库 rotation/quarantine 或核对完整已知 Scope；PG18 fixture **人工执行 trusted owner rotation** 才修复状态冲突。这恰恰是生产 Owner 仍必须解决的缺口；不得把现有测试等同于 Host 重启安全接线。

## 4. 范围、验收与后续阻塞

| 项目 | 本 PR 改动 | 仍缺 |
| --- | --- | --- |
| PA05 FileLifecycleStore 单次 I/O 错误 | 真实模块 Copy-on-Persist、四种负例与重启回读 | 跨进程锁、fsync/断电持久性 |
| Manager 真实生命周期重启 | 使用真实文件、停用后重开并失权 | 文件状态与授权 Provider 真实权威仍非同一事务 |
| SQL 授权镜像恢复 | 已有 N1-04h SQL Owner generation fencing；扩大为文件存储失联回归 | 生产 Host 可信启动阻断、自动主动 fencing/核对完整 Scope |
| 生产安全准入 | **NOT_CERTIFIED** | 实际 AuthorizationProvider 持久源、跨库 outbox/原子性、真实多 Host SQL/KMS 身份、快照全 Scope watermark/tombstone、DB Owner、真实 Human/外部 LLM |

本 PR 不改并行 #1184 的 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md` 等三份 Owner 文件，不部署 CI SQL fixture，不动正式 CV-03 SAVE/Post/Get 路由。扩展原 PG18 workflow：始终执行 `tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs` 和原 PostgreSQL security suite，避免新增测试仅在未运行的脚本里伪绿。

**必须以 PR 最终 HEAD 的 Actions 日志确定通过/跳过数量**。成功后才合并 main、由既有 `branch-hygiene.yml` 验证 SHA 清理独立分支。未获得真实 PA05/AuthorizationProvider/DB 安全 Owner 对跨源事务和 startup fencing 的决定前，N1 不得提升为 production READY。


### 追加的 CI 范围诊断（同日）
首个中间提交的 PG18 workflow 误包含旧 `tests/manager/manager.test.mjs` 全量套件：该运行报告 38 tests / 31 pass / 7 fail / 0 skip。新增单次 I/O 回归和真实重启 SQL 用例本身成功；其余 7 个失败包括旧 Proof B `enterprise.application-runtime-binding` 缺失、旧体验投影期望，与本轮新文件测试不同。**不能直接声称这些失败已在 main 基线确认存在，亦不能标记为新代码回归通过**。已撤销对旧 Manager 测试文件的修改，并将新增 I/O 回归单独置于 `tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs` 由 PG18 workflow 执行。旧全量 Manager 套件的基线对齐留给管理器 Owner 专项，不在本 N1 修复窗口偷偷重写断言。最终以最新 HEAD 的 PostgreSQL + Platform CI 全绿作为本轮门禁。
