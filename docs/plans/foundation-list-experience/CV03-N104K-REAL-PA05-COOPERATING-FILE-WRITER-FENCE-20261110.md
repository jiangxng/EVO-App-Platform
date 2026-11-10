# CV-03 / N1-04k — 真实 PA05 FileLifecycleStore 协作写者 fencing 与独占暂存文件

> 2026-11-10，基线 `main@104c1faf82e3ee80a9e27ef00d9e37d54f465ba3`，#1207 已合并。
> **真实 PA05 文件存储安全修复，非 PG 权威事务**。生产 N1 继续 `NOT_CERTIFIED`，`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403、未注册 Page GET 404 不变。

## 1. 来源证据 / 尚存缺口

本轮直接核查的 **G / 原项目代码**：
- [`manager/store.ts`](../../../manager/store.ts) 在 N1-04i 修复后已实现“持久化成功才更新单个存储实例的内存 Map”，但仍使用固定 `<state>.tmp` 和 `writeFileSync(path)`，会跟随**预置的同路径符号链接**；没有协作写锁，两个先后打开同一路径的 Manager 实例可能在撤销/重新启用后互相覆盖旧状态。
- [N1-04i 独立文件 I/O 回归](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs) 原利用固定 `.tmp` 目录来诱发写入失败；换为独占随机 staging 后应改由“崩溃残留 lock”诱发明确的失败关闭。
- [N1-04j 真实 Host 恢复态隔离](../../../manager/cv03-personal-saved-view-host-admission.ts) 防止未经认证 Saved View Feature 从本地持久状态直接激活；但本地 FileLifecycleStore 仍不应让**更旧进程**通过文件写入重放曾被撤销的 Feature。
- 原 [PA05 E01J4J 协作 Host lock](../../../manager/pa05-read-owner-cooperative-host-lock.ts) 是**另一个可选、面向 one-shot 维护与特殊 PA05 状态文件的启动边界**。本轮写锁属于 FileLifecycleStore 每次 mutation 的更小同步区域；它不替代 E01J4J，更不替代分布式数据库授权 Owner。

上述为本次实际读到的源码 G，设计取舍为 D。没有重新浏览外部 EX01–EX08 研究资料，不能声称新厂商证据或已经完成多 Worker 认证。

## 2. N1-04k 工程实现

直接修改既有 [`manager/store.ts`](../../../manager/store.ts)，不再创建第二套独立的 PA05 生命周期权威：

1. 用 `O_CREAT|O_EXCL|O_NOFOLLOW` 创建每次 mutation 的 `<state>.lifecycle-write.lock`，只容许**同一文件系统/路径下遵循该锁协议的协作写者**序列化。预置文件/符号链接/崩溃残留锁 `LIFECYCLE_STATE_WRITE_LOCKED` 失败关闭，不自动强删或偷偷获取“锁权限”。
2. FileLifecycleStore 首次加载精确磁盘 JSON、文件 `dev+inode`，每次持锁写入前重新读取/比较；若磁盘已被另一协作进程修改，抛 `LIFECYCLE_STATE_STALE_WRITER_REOPEN_REQUIRED`，当前 store 标记为隔离态。此后它的 `getInstalledPackage/getActiveFeature/snapshot` 拒绝从旧缓存继续充当本机授权状态：`LIFECYCLE_STATE_REOPEN_REQUIRED`。恢复需要重新构建 store/Manager 并通过既有 Host 正式准入，**不是原实例透明重试**。
3. 每次用不可猜测的 `<state>.tmp.<pid>.<UUID>` + `O_EXCL|O_NOFOLLOW` 暂存，禁止复用固定 `.tmp` 路径/跟随符号链接覆盖无关文件。成功后 `fsyncSync` 暂存文件，再 `renameSync` 到目标；在 POSIX/Linux 目标上再 fsync 父目录后才更新实例内存 Map。Windows 上不声明等同 POSIX 目录 fsync 保证。
4. `rename` 后但提交/目录 fsync/lock cleanup 不确定的异常，阻止继续使用该实例作为“可信已提交状态”。解锁前检查自己的锁文件 inode/dev，不能删除被替换的其他写者锁。错误锁/崩溃孤儿需要独立人工判断，不自动破锁。
5. 保持 LifecycleStore 公共 API、PA05 Feature/CapabilityOperation 语义、存储 JSON schema 与正式 Host SAVE 禁止策略不变。原 N1-04i 的“单次文件失败先持久化候选、再发布 Map”不变。

### 验收（真实文件系统与 Node 跨进程）

- [N1-04k 独立安全回归](../../../tests/agent-line/cv03-n104k-pa05-file-writer-fencing.test.mjs)：两个先后打开的 FileLifecycleStore 先由 A 撤销 Feature，再由旧 B 重提 ALLOW → 必须拒绝，B 的 snapshot 也应因 stale 被隔离，新进程读取仍为 DENY。
- 真实第二个 Node 子进程通过该 FileLifecycleStore 删除 Feature；父进程缓存此前旧 ALLOW，子进程退出后父进程尝试重写 → 必须拒绝并禁止旧缓存读取。不是简单同进程 Map 模拟。
- 固定旧 `.tmp` 路径上预置指向“受保护文件”的符号链接，新 random staging 正常工作、受保护文件及旧符号链接不变；写锁符号链接与恶意主体生命周期文件 symlink 不能被接纳。
- [N1-04i 原 I/O 失败回归](../../../tests/agent-line/cv03-n104i-file-lifecycle-io.test.mjs) 保留四种 save/delete 写失败的原内存/磁盘/重开一致性验证，只把注入故障改为预置写锁（而非旧 `.tmp` 目录）。
- 原 N1-04f～04j PostgreSQL18、真实 PA05 文件 disable/reopen、Owner generation fencing、真实 Host 启动 quarantine 继续回归，不因新锁改变原状态。
- 真实测试数字以最终 PR HEAD 的 PG18 Actions 日志为准，不提前标记 PASS。

## 3. 明确仍未证明的安全性质

这是**协作写者+本地文件版本**的失败关闭，不是强制限制具有路径写权限的非协作进程。OS 用户、容器、volume、symlink parent swap、跨 NFS mount 及恶意目录所有者需另外的 Host/安全 Owner 防护。两个进程可在任何写入前仍读取各自旧缓存；只有检测到冲突才隔离。不能将 `readFileSync` 当成每个业务请求的实时授权 Provider。

**最关键：没有**把文件 Map、正式 AuthorizationProvider 的授权事实与 PostgreSQL 的权限镜像/outbox 纳入同一 ACID 事务。Host 停用/撤权事件可能仍在远端 SQL 漏投（N1-04i 实测），N1-04j 的本机 startup 拒绝亦不会自动失效其它 Host 的旧租约。真实多 Host Host 身份、生产 KMS、SQL GRANT、全量 snapshot/watermark/离线 tombstone、主动启动 DB owner fencing、端到端 Human/外部 LLM/部署都未认证。生产 `N1=NOT_CERTIFIED` 不得提升，SAVE OFF/403、GET 404 不变。

## 4. 治理与交接

- 直接读取仓库证据 G、设计取舍 D 已增量记录原 [N1-04d 决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md) 第 12 节；不改并行 PR #1184 受管三份文件。
- 不新增正式 Feature/页面/路由，保留 Eidos+Platform 现有 Host 与 PA05 架构。所有 Actions (特别是 Platform CI、PA05、PG18、Host 架构、continuity) 应在 exact HEAD 通过再合并，已有 `branch-hygiene.yml` 精确 SHA 认证后再退休本分支。
- **下一阶段应停止用单纯文件锁取代 DB Owner 签收**：须取得 PA05/AuthorizationProvider/安全 DB Owner 对事实源、跨库 outbox、可靠撤权同步与生产可信身份的合并方案。可继续做具体工程验证，但不得伪造已获生产认证。
