# PA05-05 / E01J4J — Host/J4I 协作排他锁与停机证据界限（2026-10-19）

**DECISION_RECORD / SOURCE-GROUNDED BOUNDED ENGINEERING**，不是完整 E01J4/W06 认证。本轮 GitHub 启动基线 `main@5919e0147232fef1ddfc4f7e9a38b67969100bcf`；上一工程 [PR #1056](https://github.com/jiangxng/EVO-App-Platform/pull/1056) 保留 27/27、0 skipped 原始验证；本轮 [PR #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057)。不重做 J2–I PostgreSQL 已有研究/工程。

## 1. 本轮发现的未闭合真实危险（源代码亲读）

J4I `manager/pa05-read-owner-one-shot-prestartup.ts` 使用 `stateFile+".pa05-one-shot.lock"` 的 O_EXCL 排他文件，但普通 Host `manager/server.ts` 在读取 `APP_PLATFORM_STATE_FILE`、创建原始 `createFileLifecycleStore`、之后执行 E01I 隔离之前完全没有竞争这把锁。故 J4I 对另外一个维护进程有效，**不能阻止仍在线的 Host 也写同一个 JSON 状态**。不能由“文件锁存在”推断所有 Host/Worker 离线，更不能推断分布式共识。

## 2. 决定和所属边界

此切片作为 **Host 内部 PA05 安全接线**；通用 `createFileLifecycleStore`/跨项目 Core 全局锁协议**不改**。新增 `manager/pa05-read-owner-cooperative-host-lock.ts`，正常 Host 在 `manager/server.ts` 读取状态**之前**、仅当环境 `APP_PLATFORM_PA05_E01J4J_COOPERATIVE_HOST_LOCK=OPT_IN` 时对与 J4I 相同状态路径取得 O_CREAT|O_EXCL|O_NOFOLLOW 锁，要求原 state 已存在且安全、目录由 OS 用户拥有且 0700、state 0600、进程 umask 077；其余情况 fail closed。默认 `OFF`，不改变当前生产 Host 行为，不新增 API/Agent action，不启用 READ Owner/WRITE。

Host 通过 `process.once("exit")` 在正常关闭、受控 SIGTERM/SIGINT 以及 E01I 异常退出时，仅对确切持有 inode 解除锁；真实 SIGKILL 意味着锁保持不确定，**严禁按 PID 自动窃取锁**。如无法确定是否仍有在线 Host，手动移锁只能在另一个真实授权和全体进程确认流程中进行，**本工程不提供清理命令**。J4I 保持原文件排他功能及 fail-closed 策略。

## 3. 真实验证计划与证据来源

- 新 `tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs` 通过**真正独立 Node 子进程启动当前 manager/server.js**、HTTP /v1/catalog ready 判据验证 Host 已在线，在同一共享路径运行 J4I 失败于锁，身份 Provider 和 Secrets 均未访问；正常 SIGTERM 后锁删除，J4I 可进入身份拒绝；另一个 Host 真 SIGKILL 后锁仍存在，阻止再启动及维修，测试只在临时目录内主动清理。
- 严格复用已有三独立 PostgreSQL18 J2–I 测试，新增一项，CI 目标 **28/28 PASS，0 failed、0 skipped**，新的 `PA05_E01J4J_COOPERATING_HOST` marker 必须出现。因 `manager/server.ts` 改动触发全 Host/浏览器相关 CI，应以**真实的准确 HEAD CI 全部成功**为合并条件，而不只检查 PA05。
- 本轮研究来源等级：直接阅读 GitHub `manager/server.ts`、`manager/pa05-read-owner-one-shot-prestartup.ts`、测试、`docs/agent-line/PA05-CERTIFICATION-BASELINE-20261015.md` §§64–65；没有重新浏览历史 PostgreSQL 官网或把旧网址清单谎称本轮阅读。

## 4. 严格不宣称的保障

1. **没有已认证跨 Worker 全局停机**：OPT_IN 仅证明在**同一可信 POSIX 文件路径**上所有*自愿参与*的 Host 无法与 J4I 并发，未参加的进程完全不受约束。跨机器挂载文件锁/O_EXCL 原子性、部署扩缩容、leader 选举、Worker 持久注册与租约、活跃 READ 查询截止均未证明。
2. **没有生产操作员和 DBA**：独立 Human 可信身份发行/撤销、专用 SQL LOGIN 授权、证书/密钥托管、真正维护 CLI/Runbook、签名/多节点审计均 NOT_SIGNED。一个 Node 测试进程的 SIGTERM/SIGKILL 不等于生产维护批准。
3. `postgres.js 3.4.9` TCP 断链原进程崩溃 [历史 main CI #39271124305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39271124305) 仍是 P0，J4J 不修复它；PostgreSQL+JSON 非原子也不改。生产 material WRITE OFF、#988/#979/#913 OPEN，PA05-05 E01–E05 与 W06 NOT_SIGNED。
4. 不手动部署 Railway，不操作生产密钥/DB，不改 BEX/CP03/Eidos/2D、`project.status.json` 或自动生成的全局 HANDOFF。

## 5. 下一次门禁

本地单 Host 合作协议完成后，下一步需要真实生产**所有 Writer/Worker**参与且有可查询的独立运维控制平面或共享租约/排他证明，以及签发/撤销操作者身份和受控 DBA 凭据；不能直接凭本项目 J4J 通过而执行生产修复或签收 E01J4。若要选择特定 IdP、DBA/Credential provider 或跨节点控制平面，需另取得真正运维配置/组织决策证据。
