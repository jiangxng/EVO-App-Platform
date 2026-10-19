# PA05-05/E01J4I — 一次性可信 Host 启动前恢复边界（2026-10-19）

**DECISION_RECORD / BOUNDED_ENGINEERING_CANDIDATE，非生产认证**。接续已合并的 E01J4G [PR #1053](https://github.com/jiangxng/EVO-App-Platform/pull/1053) 与 E01J4H [PR #1055](https://github.com/jiangxng/EVO-App-Platform/pull/1055)。J2–H PostgreSQL18 研究、实施、失败原始证据不得重做、改写为新结果。基线为 `main@da8188c78b1dc784e19776b20459e9b44da6de2a`；本项 [工程 PR #1056](https://github.com/jiangxng/EVO-App-Platform/pull/1056)。

## 1. 本轮发现的真实缺口（GitHub 源码亲读，2026-10-19）

J4F [受限恢复](../../manager/pa05-read-owner-prestartup-recovery.ts)和 J4G [Provider/Secret 认证组合](../../manager/pa05-read-owner-trusted-prestartup.ts)已有工程证明；J4H [审计落盘](../../manager/pa05-read-owner-prestartup-audit.ts)也通过真实 SIGKILL。但是 J4G 仍要求外部维护调用方供应 `manager` 和 `audit`，尚不能一次性读取 Host 的真实 `APP_PLATFORM_STATE_FILE` 状态并安全串行运行。普通 `manager/store.ts` 使用 JSON 文件及 rename，不能视为跨 Worker 事务共识。

## 2. 选择的最小工程：默认不挂接的一次性 Host 内部组合

新建 [`manager/pa05-read-owner-one-shot-prestartup.ts`](../../manager/pa05-read-owner-one-shot-prestartup.ts)：

- 在受信维护主管调用、显式 `OPT_IN` 且进程 `umask 077` 的前提下接受**注入的可信 Catalog、Request Session/Authorization/Secrets Provider**；不是从客户端、环境布尔值、Agent 文本或 SQL URL 推断操作员。
- 坚持绝对路径、相同父目录的原始 persisted state 与独立审计文件；须由进程拥有、目录 0700、普通单硬链接 state 0600、无 symlink；缺少原状态时必须拒绝，**不降级为内存账本或空账本**。该文件权限和进程 umask 保障原 Store 后续 rename 写出的状态也保持私有。
- 创建 `O_CREAT|O_EXCL|O_NOFOLLOW` 的专用 one-shot 锁，仅串行本工程内部维护实例；运行前再次用 fstat 校验 state inode，结束后仅在锁 inode 仍相同时清理。拒绝损坏的 state、已有锁、错误权限、非法 bearer。失败只回显统一安全码，不回显路径、凭据或数据库 URL。
- 其内部 `createFileLifecycleStore` + `createAppManagerService` + J4H 审计，再交 J4G→J4F/J4E，最终仍只能对已有的 PostgreSQL `FENCED UNINSTALL` 恢复，而不能任意删除或自动授权 READ。

**明确非保证：** 专用锁**并非**主 Host 的跨进程全局锁；Host 在线 Worker 不使用此锁。因此仅可由真正受信运维在所有 Host 写入者已停机、独立确认后调用。本切片故意不制作真正可运行的生产 CLI、不供给/选择生产 IdP/DBA/凭据、不触发 Host startup、HTTP 或 Agent Action。真实生产操作员身份颁发和撤销、值班交接、集中审计、跨 Worker、JSON+PG 非原子仍 OPEN。

## 3. 实际工程与验证索引

| 项目文件或证据 | 准确说明 |
| --- | --- |
| `manager/pa05-read-owner-one-shot-prestartup.ts` | 唯一新增内部一次性入口，复用 J4G/H/F/E |
| `tests/agent-line/pa05-e01j4i-one-shot-host-pg.test.mjs` | 权限/umask/路径/锁/symlink/损坏状态/身份失效在 DB 和 Secrets 之前拒绝 |
| `tests/agent-line/pa05-e01j4f-prestartup-recovery-pg.test.mjs` | 在原实际三 PostgreSQL18 场景继续真实 DB FENCE、重新持久安装、独立 one-shot file-store 反认证恢复与落盘审计，旧 J4F/G/H marker 不删除 |
| `.github/workflows/agent-pa05-cross-database-admission.yml` | 原 26 个 suite 不重做功能；加一 suite，要求 **27/27、0 skipped**、原所有标记和新增 `PA05_E01J4I_ONE_SHOT_HOST_PG`/`PA05_E01J4I_ONE_SHOT_DENIAL` |

**访问等级：**以上为本轮已读 GitHub 原始源码/CI；无新增 PostgreSQL 官网原文，延续既有研究索引阅读等级。不可把参考链接当成已读原文。

## 4. 独立遗留 P0 / 生产不可签收项

- 2026-10-19 J4G 合并后 main 自动 CI [#39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) 实际触发 E01J2 `postgres.js 3.4.9` `connection.js:255` 连接断链时的 null write 崩溃；不可用成功的隔离 CI 抹掉这一负证据。J4H 后 main [#39273862092](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39273862092) 26/26/0 skipped 不能说明 TCP 原进程竞态已修复。
- PA05-05 E01–E05 真实 Human、Agent、Provider、企业业务数据、浏览器签收，以及完整 E01J4/W06 **NOT_SIGNED**；生产 WRITE OFF，Issues #988/#979/#913 OPEN。
- 本 PR 只动 PA05 的 manager 独立入口、测试/CI、Agent 文档；不修改 BEX/CP03/Eidos/2D、`project.status.json`、全局 HANDOFF 或生产配置；不手动部署 Railway。

## 5. 下一闭环

先按最终精确 HEAD 验证 CI、真实三个 PostgreSQL18 27/27 且 0 skipped；通过再合并 main 和清理工程分支。后续若要将 Host 内部入口升级为真正操作员工具，需**真实**组织批准的 IdP/Session 颁发、Host 全节点停机排它证明、DBA角色最小权限及密钥轮换、审计链路留存和安全运维流程，不能以此次 fixture 替代。若需改变已确认方案，须在总账追加新证据与理由。


## 6. 两次首轮失败和真实原始通过日志（2026-10-19）

**失败历史不删除：** 首轮 PR HEAD `7d704040b88a16de1ead8330ce255dea64b2c27d` 在 TypeScript 编译被 `ReturnType<typeof lstatSync>` 重载引发的可选/`bigint` mode 类型门禁拒绝，**未执行真实 PG18**；同 PR 修正为明确 `node:fs.Stats`。次轮 `6fdf50a18f8d2abf04d69c61c7aca2f8b74b0c3c` [三 PG18 #39275960370](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39275960370) job `118140198664` 为 **27 tests / 26 PASS / 1 FAIL / 0 skipped**：J4I 夹具在验证锁冲突时没有预先设置维护进程安全 `umask 077`，收到了更早的正确配置拒绝，而不是期待的锁冲突码。没有降低产品实现的安全门禁；将 strict umask 提前设置后复测。

**第一次完整真阳性：** 第三轮 HEAD `6776496d4d6d45d44202a101e379baf122ae8990` 的 [三独立 PostgreSQL18 #39276317824](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39276317824)，job `118141428946`，GitHub 原始日志亲读：**27/27 PASS，0 failed，0 skipped**；`PA05_E01J4I_ONE_SHOT_HOST_PG` 与 `PA05_E01J4I_ONE_SHOT_DENIAL` 实际出现，二者如实包含 `noProductionMaintainerCli:true`、`productionIdentityCertified:false`、`distributedHostLockCertified:false`、`pa05Signed:false`。同 HEAD 包括 Lightweight Host、READ、WRITE、Platform 和 Continuity 的 **8/8 相关 CI SUCCESS**。本次仅可认定 J4I 隔离工程 BOUNDED_PASS，不签 E01J4/PA05-05/W06。

此记录补充后 PR HEAD 将前进，只有**新准确最终 HEAD** 全部相关 CI 成功才可合并；不要将早期 HEAD 的通过断言套用到最后提交。
