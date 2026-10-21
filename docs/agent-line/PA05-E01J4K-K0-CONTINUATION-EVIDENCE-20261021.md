# PA05 / E01J4K / K0 — 2026-10-21 接续核验、启动期异常与外部监督者门禁

> **Document class:** HISTORICAL_SNAPSHOT + UNSIGNED_CURRENT_GATE_EVIDENCE。新增窗口证据，不替换 [2026-10-21 最终短交接](PA05-E01J4K-K0-WINDOW-FINAL-HANDOFF-ENTRY-20261021.md) / [研究遗产](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md) / 2026-10-20 原始两份文件。仅对本节列出的精确 SHA / 环境 / 时间片成立。**K0、完整 E01J4、PA05-05 E01–E05、W06 NOT_SIGNED；production material WRITE OFF。**

## 1. 本窗口已恢复的项目权威和实际范围

- 严格依 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 读取 `project.status.json` → 当前引用的 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`；并读取 `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md`、Agent `HANDOFF.md`、[PA05 认证总账 §§62–86](PA05-CERTIFICATION-BASELINE-20261015.md)、[K0 拓扑](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[K0 证据表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) 及 [J4K 已选方案](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)。
- **权威层级差异，不是授权:** 全局 `project.status.json.projectContinuity` 的最近结构化快照仍为 2026-10-10 `TR-01B2D2`，包含当时的旧 Railway deployment；这份快照不代表 PA05 的当前执行签收。**依用户安全边界不改** `project.status.json` 或生成的 HANDOFF-LATEST，不借 K0 跨线重绘 TR-01/BEX/CP03/Eidos/2D 的权威。
- 继承原 PostgreSQL18 / OAuth / Lease / NIST 官方研究的真实阅读等级；本轮没有重读其原文，也没有将已存索引伪称新原始证据。

## 2. 2026-10-21 控制面重新核验（非推测）

| 对象 | 本次连接器原始证据 | 结果与证据边界 |
| --- | --- | --- |
| GitHub main | [branch API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) | `386f267bcc115fd4e64af74724f2a3aa55199878`，保护分支；[同 SHA check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/386f267bcc115fd4e64af74724f2a3aa55199878/check-runs) 40/40 SUCCESS；不是旧 schedule 全套 `test:all` 的同范围复跑 |
| Railway Ledger Configurator | 已连接 [Railway 项目](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)，`environment_status`、`list_deployments`、`describe_service`（只读） | `0cf816e7-3c09-4837-a192-81a682df55be`，`main@386f267b...`，SUCCESS / Online，1 running / 0 crashed，0 warning/critical、无 staged/pending；旧 `5c88b3df...` 为 REMOVED |
| Railway 已连接环境 | 同上 `production` environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` | 可见五服务：Ledger Configurator、Experience Compiler、App Host Validator（0 running）、EVO Runtime、Postgres；只代表本已连接项目，并非组织级 Worker/caller 全集 |
| Host / EVO Runtime 配置 | `describe_service` 只读、仅变量名称 | 两者 `startCommand=npm start`；Host V2、sfo 1 replica；有效 draining / overlap / PID1 进程树及 SIGTERM 传播未返回；Host 变量名不含 `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` **不能推出有效值为零**；两服务 tracing/auto instrumentation OFF |
| [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) 交接 Draft | 交接完成准确 HEAD `375fa97b6ec070bc18b846b91b80b247e20fb4ab` | 7/7 SUCCESS（**本文件后推进 HEAD，必须另查新提交**） |
| [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) Host shutdown Draft | `caccb1b60358b453ef471eaf6abecf1593e4965c` | 45/45 SUCCESS；没有合并或部署 |
| [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 真实负面 Draft | `a1e8a0941ff5b796816aaea0904b89533191a239` | 5/5 SUCCESS；通过表示旧错误时序被成功复现，不是安全合格 |
| [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) PROCESS 修复 Draft | 新 HEAD `6b79d3e3f558a0c46193424edd625700145d19af` | 5/5 SUCCESS；新增隔离启动期第十项真实正向测试，见 §3 |
| 历史真实负证据 | [Ecosystem Certification #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) | `main@eaa5e813...` 定时 run 仍 `completed/failure`、attempt 1，先前原始日志 1815 total / 1723 PASS / **10 FAIL** / 82 SKIPPED。不同 HEAD 的 40/40 或 5/5 不抹除此记录 |
| 认证 issues | [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) / [#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) / [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) | 三者重新读取 GitHub issue，全部 OPEN |

**阅读等级：** 以上为 `ORIGINAL_GITHUB_CONNECTOR_DIRECT_READ_20261021` 与 `ORIGINAL_RAILWAY_CONNECTOR_READ_20261021`；Railway 未暴露的部分必须记 `UNVERIFIED`。

## 3. 第十项本地启动期专项：实际工程、原始日志与限度

**改动归属：** #1082 原活动工程分支；没有创建替代 PR。仅更新 `tests/fixtures/pa05-k0-delayed-process.mjs`（commit [`f23ed262`](https://github.com/jiangxng/EVO-App-Platform/commit/f23ed262c84dbcd910ce355a1de06772d3f5d791)）和 `tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs`（commit [`6b79d3e3`](https://github.com/jiangxng/EVO-App-Platform/commit/6b79d3e3f558a0c46193424edd625700145d19af)）；无生产 Runtime 源码变化，也没有触碰 #1074 顶层 shutdown 代码或 #1081 的负面测试。

- **隔离情形：** 仅特殊测试 package `pa05-k0-activate-hang-process` 的 `activate()` 不返回；child 自带 5 秒 self-exit 保险，父 Host 在测试期间存活。原有九项 fixture 正常逻辑不变。
- **原始 CI:** [Platform run #39530562128 / job #118995237822](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39530562128/job/118995237822)，`ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_20261021`。job `1102 total / 1101 PASS / 1 SKIPPED / 0 FAIL`；新增 `ok 775`：
  ```json
  {"scope":"isolated-local-child","boundedShutdown":true,"startupSettledByChildExit":true,"noActiveRuntime":true,"globalStopCertified":false}
  ```
- 该 job 同时确实输出前九项 `PA05_K0_BOUNDED_*` 的独立 JSON marker（共 **10**），新工程 HEAD [check-runs](https://api.github.com/repos/jiangxng/EVO-App-Platform/commits/6b79d3e3f558a0c46193424edd625700145d19af/check-runs) **5/5 SUCCESS**，均为本次直接读取。
- **判定:** `ISOLATED_PROCESS_LIFECYCLE_TEN_CASE_BOUNDED_PASS`（仅特定父 Host 活着、一次性 CI Linux runner、非生产、允许测试 child 自退出）。未通过此测试验证父进程自身 SIGKILL，未识别真实生产 PID1，也未覆盖所有 fork/spawn/IPC 极端异常。该案例以 PROCESS_STARTING 事件作为启动时序屏障，没有单独的 child `activate-entered` 外部签名回执，因此不能扩大为“所有 activation hang 的过程被完整枚举”。用例内 3500ms 是测试断言阈值，**不是**可用于生产的全局 stop deadline。

## 4. 针对父进程死亡的新增定向原文研究（2026-10-21）

| 原始资料与位置 | 阅读等级 | 原文事实 | EVO 的判断及限制 |
| --- | --- | --- | --- |
| [Linux man-pages — PR_SET_CHILD_SUBREAPER(2const)](https://www.man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html)，DESCRIPTION | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | 孤儿子孙进程归属到最近存活的 ancestor subreaper；该监督者可收到 SIGCHLD 并 `wait`，设置不会由 fork 自动继承 | **subreaper 能收尸≠强制让仍存活的 child 退出**；候选独立监督者，必须另有 child 枚举/终止授权/确认流程。没有证据 Railway 当前设此项 |
| [systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html)，KillMode/TimeoutStopSec | `ORIGINAL_MAN_PAGE_DIRECT_READ_20261021` | `KillMode=control-group` 对 unit 剩余进程组处理；`mixed` 对主进程 SIGTERM、后续对全组 SIGKILL；`process` 仅处理主进程存在漏下子进程危险；time budget 由实际 unit 设置影响 | **只能作为类比和候选实验平台约束**，绝不冒称 Railway 使用 systemd 或已配置特定 KillMode |
| [Node.js child_process 文档](https://github.com/nodejs/node/blob/main/doc/api/child_process.md)，ChildProcess `close` / `exit` / `error` / `disconnect` | `ORIGINAL_NODE_SOURCE_DOC_DIRECT_READ_20261021` | `close` 在进程结束及 stdio 关闭后发出，与 `exit`/spawn error 不同；发送消息、spawn、kill 也可触发 `error` | #1082 `liveChildren` + `closed` 是**父 Host 活着时的局部过程证据**；无法在父 Host SIGKILL 后出具独立可信回执 |

### 风险选择与安全实验前置门禁

**继续采用：** K0→K6 已选中央 fencing epoch + 组织权威 Worker/caller 清单 + 独立 stop receipt + PostgreSQL session 再核查 + 真正 Human IdP/DBA/审计与 Secret rotation/revocation。新增资料没有推翻已选方案。

**后续可实施但本轮没有实施的安全实验：** 在独立、获授权且非生产的 OS/cgroup 隔离中先启动一个**不随受测 Host 死亡的外部 supervisor**，预登记测试 child 身份（PID + 进程启动时刻/进程树/cgroup/namespace）、核实 supervisor 能枚举并终止所有测试子孙、避免 PID 重用误杀、测试或控制异常时自动 TTL 收尾；只有监督者自身能强制回收并记录可核实退出后，才允许在该平台执行父 Host SIGKILL、重启动期 fork freeze、截止时间与 stop receipt 负面试验。若任一前置能力不具备则保持 `NOT_EXECUTED`。不能在普通共享 GitHub Runner 未配置独立回收权威时直接杀父进程。

**不能采用：** 单次 `pg_terminate_backend=true`、单机文件锁、Lease 超时、本地 `close`、空 runtime map、单一 GitHub CI SUCCESS、Railway 默认设置或测试 IdP 作为 `STOP_CONFIRMED`。

## 5. 分支安全退役审计（不等于实际删除）

原 [2026-10-20 研究索引 §8.2](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 的九条 `docs/pa05-*` 历史已合并分支，今天对每个已知 tip 实施独立 `compare_commits(expected_tip, actual_branch)`、`compare_commits(expected_tip, main@386f267b)`、相应 PR 元数据核查：

- #974 `a5fc71ab`；#1050 `a4d258e2`；#1052 `82f65991`；#1059 `5bf4c9c6`；#1062 `991e34f6`；#1064 `6bcb960b`；#1065 `fe27267a`；#1068 `8fee1e9b`；#1022 `ac261172`。
- **九条全部：** GitHub 原 PR `merged=true`、PR head 与预期 SHA 相同、现存 branch ref 与预期 SHA 完全一致、tip 为当前 main 的共同祖先；没有发现新增独有提交。
- **仍非最终删除签收：** 本次未完整复核所有当前 OPEN PR 引用与每条分支保护状态（早期归档已有旧时间片审计），当前连接的 GitHub action set 又**没有 delete-ref / branch delete / workflow dispatch**。故远端清理 `NOT_EXECUTED`；不得用 force-ref/reset、删文件、关闭 PR 等办法替代。#1071/#1074/#1081/#1082 活动 Draft 分支明确排除。

## 6. 下一最小真实门禁、owner 和安全红线

1. **Host Runtime owner:** 评估 remaining early spawn/IPC fail paths 和 child activation telemetry；对 #1082 新增测试只按十项 bounded PASS 定级，任何新修复继续在现有 Draft 分支迭代。
2. **Infra/SRE owner:** 提供 Railway 真实 production effective draining/overlap、PID1→Node SIGTERM、全实例/PROCESS child/重启扩缩容权威库存、owner 签名及可独立监督的停机 SLA/receipts；没有证据不触发生产操作。
3. **Identity/Security/DBA/Audit owner:** 生产 Human issuer/audience/MFA/撤销 SLA、实际 DB role/session/grants、broker 凭据轮换与审计签名、外部 Runner/Validator/CLI caller 准入；此轮没有读取生产 Secrets/SQL。
4. **安全治理:** 原 [K0 工作表 R1–R8](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md) 任何缺失项继续 UNKNOWN/DENY，不能填 0 或“没有”；只做只读查证。
5. **Git/CI:** 四条 Draft 不合并、不触发生产部署；不能关闭旧 Ecosystem 10 FAIL；继续不动 BEX/CP03/Eidos/2D/全局 `project.status.json`。后续合规删除能力就绪仍须再次核 SHA、开放 PR 引用和保护状态。

**本次实际未执行：** 生产 Validator、生产 SQL、生产 Secret 值读取、生产停机/重启/扩缩容、Railway draining/tracing 修改、父 Host SIGKILL、自动孤儿/异常锁清理、分支删除、PR 合并。认证总门禁 **全部 NOT_SIGNED**。
