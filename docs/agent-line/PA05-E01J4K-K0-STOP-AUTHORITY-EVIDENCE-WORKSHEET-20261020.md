# PA05 / E01J4K K0 — 权威 Worker/外部调用者停机证据验收表（未签收）

**文档类别：** `CURRENT_GATE_EVIDENCE / UNSIGNED_OPERATOR_EVIDENCE_WORKSHEET`  
**编制日期：** 2026-10-20  
**状态：** `DRAFT_EVIDENCE_SCHEMA / K0_NOT_SIGNED / NO_PRODUCTION_PROCEDURE_AUTHORIZED`  
**范围：** `evo-purchase-attention` READ Owner 与其受保护 Host 生命周期/SQL 权限；不假定它已在生产启用。  
**上游权威：** [K0 当前生产拓扑](PA05-E01J4K-K0-PRODUCTION-WORKER-TOPOLOGY-20261020.md)、[J4K 可信停机决策](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md)、[PA05 认证总账](PA05-CERTIFICATION-BASELINE-20261015.md)。  
**使用限制：** 本文仅为需要组织证据时填写的**字段与拒绝标准**，不是执行停机、审计生产数据库、读取凭据或开启 WRITE 的授权。没有真实外部证据的格子必须保留 `UNVERIFIED`，绝不能填写“0 Worker”或 `STOP_CONFIRMED`。

## 1. 本轮已证实的起点与上限

| 证据主体 | 此刻已读事实 | K0 上限 |
| --- | --- | --- |
| Connected Railway | `EVO Ledger Runtime MVP` production：5 个已配置服务；Host 和 EVO Runtime 各 1 副本；Validator 0 running；无独立 Railway Cron；最新 Host `main@102319de812ce65682f0c6ccb1a930e10b4e22d4` deployment `dffc4413-07e5-4302-95ac-adcf737fbdfb` SUCCESS / Online | **仅一个可访问项目**；没有完整组织账户清单、所有实时子进程、可调用受保护接口的外部 Actor |
| Host startup | Railway 服务配置 `npm start`，Platform [package.json](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/package.json) 执行 `node dist/manager/server.js`；[server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/server.ts) 注册 SIGTERM/SIGINT | 没有容器 PID 1 或 npm→Node 信号传递的生产实测 |
| Lazy PROCESS children | [plugin-runtime-host.ts](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/manager/plugin-runtime-host.ts) `fork()` 子进程，`stop()` 第 646 行在等待 exit **之前**先从本地 `runtimes` map 删除条目；随后发 IPC shutdown、等 `exit`，750ms 后有 SIGKILL fallback，才 emit `PROCESS_STOPPED`。 | **空 map 不能证明所有子进程已经退出**；`PROCESS_STOPPED` 是 Host 本机日志，不是外部编排器出具的、跨宿主可信的终止回执。父进程异常死亡后缺独立完整子进程收据 |
| GitHub-hosted callers | 主仓源码已盘点 153 个 workflow 文件，10 个显式触达生产 Host 的 workflow；其中 [Web Version Skew / RUM](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/.github/workflows/web-version-skew-rum-production-proof.yml) 脚本 [POST `/v1/web-performance`](https://github.com/jiangxng/EVO-App-Platform/blob/102319de812ce65682f0c6ccb1a930e10b4e22d4/tools/web-version-skew-rum-production-proof.mjs)，是遥测写入；Browser lifecycle 观察到 `/v1/actions` 网络请求 | GitHub Runners 是**瞬时外部调用者**，不能因为没有常驻 Worker 服务就排除；普通浏览器/第三方调用方无法用“停止全部浏览器进程”签收，应以**受保护入口的独立拒绝与授权封锁**完成可达性治理 |
| Railway shutdown | [Deployment Teardown](https://docs.railway.com/deployments/deployment-teardown) 规定 SIGTERM、可配 draining、随后 SIGKILL；[Node SIGTERM](https://docs.railway.com/deployments/troubleshooting/nodejs-sigterm-handling) 警示 npm 包装层信号风险 | 实际 Host/EVO 的 Settings-pane `draining` / `overlap`、进程 PID 1、真实信号传递**全部 UNVERIFIED**；官网默认 0 秒不是实际有效配置证据 |
| 修复进度 | [J4J #1057](https://github.com/jiangxng/EVO-App-Platform/pull/1057) 已合并，局部协作 Host 排他 28/28 PG18 PASS；[shutdown #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) 独立 Draft / 45/45 CI SUCCESS / 未部署 | 不因本机测试、CI 或普通服务 Online 宣称全球停机与生产身份签收 |

上述来源均为 2026-10-20 本轮/上一窗口直接访问的**源码、API 或 Railway 官方原文**；旧 PostgreSQL18、OAuth、Lease 与 Vault 原文继续按[研究索引](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md) 标记 `ORIGINAL_READ_EARLIER_ARCHIVED`，不伪装本表重新阅读过。

## 2. 必须由真正权威方填写的 K0 来源表

每一行须留下**证据原始 URL/对象 ID、读取时间、有效范围、声明方身份和不可代替的复核方式**。未知不得填 0，不得只填口头“没有”。

| 门禁 / Owner 类型 | 实际证据必须包含 | 当前值 | 能否以现有连接器独立证实 |
| --- | --- | --- | --- |
| **R1. 组织基础设施边界** — Infrastructure owner | 所有 Railway 账号/Workspace/项目及其他云、服务器、Runner/队列、外部维护工具；生产用途分组、谁拥有枚举权限、枚举快照版本与完整性声明 | `UNVERIFIED`（仅连到 1 项目） | 否；当前连接器列出范围不是组织全域 |
| **R2. 可执行 Worker/子进程** — Host + Plugin runtime owner | 服务/Deployment/Replica/region，实例 nonce、PID/PPID、启动时间、包/Worker 角色、Host owner、受保护资源、supervisor 实例 ID；真实 PROCESS child 列表和退出时身份 | `UNVERIFIED` | 否；未读生产 runtime map 或 OS 进程表 |
| **R3. 外部调用入口** — Platform/CI/network owner | 所有生产生命周期 HTTP/Action/管理员/SQL 入口，GitHub Runner、Validator、浏览器与外部集成清单、调用方身份/角色/权限、请求有效路由及封锁办法 | `PARTIALLY_OBSERVED` | 仅源码范围；无法证明完整性或路由授权 |
| **R4. 停机与重启排他权** — orchestrator owner | 谁可冻结新部署、自动 restart/scale、手动启动、CI 运行、Cron/queue；平台可信调用/回执 API 与权限，隔离后拒绝新实例的证据 | `UNVERIFIED` | 否；配置中的单副本不是停止授权 |
| **R5. 有效 draining / Node 信号** — Railway operator | Host、EVO 等受影响服务 `effective draining seconds`、`overlap seconds` 来源与生效版本，真实 PID 1、SIGTERM→Node 与 children 传播的**受控非生产**测试原始证据 | `UNVERIFIED` | 否；现有 `describe_service`/`get_service_config` 不暴露有效 pane 设置；不能擅改生产 |
| **R6. SQL 会话与权限** — DBA | 真实角色/数据库/函数/grant/owner、禁用或替换 LOGIN 后现有会话处理、`pg_stat_activity` 重查的采集人/时刻、允许实例身份列表 | `UNVERIFIED` | 否；未访问生产 PostgreSQL 或凭据 |
| **R7. Human 操作员身份** — IdP owner | 真实 issuer/audience、经批准 Subject/组/权限、MFA/assurance、短期维护 Session、撤销 SLA 与 introspection/provider 故障时的拒绝证据 | `UNVERIFIED` | 否；现有测试 Provider 不能签生产 |
| **R8. DBA 凭据轮换/审计** — Security/DBA owner | `secrets.resolve` 生产 provider/broker 的批准、短期 scope、发放/到期/撤销、存活 SQL Session 处理、非秘密审计落点/保留/完整性与独立审批签字 | `UNVERIFIED` | 否；不读取 Secret 值 |

## 3. 分清“停止进程”和“封锁调用者”

**需停止并取得逐实例回执的对象：** 已知 Worker、在线 Host、由 Host fork 的可执行 PROCESS 子进程、外部部署平台中有执行 protected operation 能力的常驻 Worker。每一个都要有 `inventory item → supervisor stop command (authorized) → independently observed matching instance terminated` 的链路。

**需证明不能再触达受保护操作的对象：** GitHub Actions Runner、Validator、Human/browser/API 客户端及临时维护 CLI。它们可能在冻结之后才出现，不能用在某一秒“没有进程”来说明永不重启。必须有入口层/SQL 层**中央 epoch 拒绝、权限撤销或同等可信 deny-by-default 限制**以及防重启/扩缩容竞态；对每类调用路径提供真实负面测试。网络无法联系或 Lease 过期绝不是进程死亡证明。

**必须单列的 Host 子进程细节：** `plugin-runtime-host.ts` 的 `runtimes.delete(packageId)` 发生在 exit 等待之前（源码第 646 行）。若在停机进行中读取该 map，它可能遗漏一个正在退出的 OS 进程；应由可信独立枚举端在冻结后再次比较进程树，而不能用空 map 签字。本机 `PROCESS_STOPPED` 日志与子进程 `exit` 属于局部正证据，缺少外部可靠回执和组织全域 completeness。这个逻辑目前只是**源码静态观察**，没有声称在生产复现孤儿子进程。

## 4. 将来每次真实停止需要的独立非秘密证据包（字段草案）

该字段方案为**设计建议 / 尚未实施、未选编排器**，不是项目已上线 API。

1. **Operation:** `operationId`、`reason`、`scope`、审批链、`actorIssuer/actorSubject`（引用而非令牌）、有效时间界限。
2. **Inventory:** `inventoryRevision`、`enumeratorAuthority`、`observedAt`、`completeForScope` 的**独立签署来源**，所有 service/deployment/replica/process nonce/PID/PPID/package ID/SQL role/endpoint 映射；未知即 DENY。
3. **Freeze:** `fencingEpochBefore/After`、`orchestratorFreezeReceipt`、`restartScaleBlocked`、所有写入入口的旧 epoch 拒绝日志；新实例 race、失联节点、重复/缺失清单即 DENY。
4. **Per-instance stop:** `instanceId` / `startNonce` / `supervisorId` / `stopRequestId` / `exitObservedAt` / `terminationReason` / `receiptUri` / `receiptVerifier`；必须与冻结后的快照严格一一对应。父 Host 的 `PROCESS_STOPPED` 不能代替外部终止证明。
5. **DB reassessment:** `dbCluster/database`、角色与 application identity、会话采集时间/版本、观察前后差异、会话是否实际消失；`pg_terminate_backend=true` 或旧会话暂时不可见不是唯一依据。
6. **Identity / credentials:** Human issuer/audience/session 当前有效性、policy decision、DBA 凭据 lease/reference ID（非原值）、rotation/revocation、旧 SQL session 处理、可校验审计回执与签收人。
7. **Terminal verdict:** 逐项证据完整且互相一致，才允许被可信认证者**在另一次获得生产授权的执行中**签 `STOP_CONFIRMED`；任何空白、失联、不一致、timeout、审计缺失或外部 Owner 未签时只有 `DENIED` 或 `UNVERIFIED`，不可自动清锁、启用 WRITE 或解除 Fence。

## 5. 只读下一步与保留的否决条件

- 首先由 Railway 授权操作员**只读**提供 Dashboard Service Settings 有效 draining/overlap；由组织 infrastructure owner 签部署平台覆盖范围和 stop/restart freeze 责任；这两项是平台事实，不由模型或 CI 猜测。
- 在隔离的**非生产**环境验证 PID 1 和 `npm start` 的实际 SIGTERM 传播、PROCESS child 关闭/失联、5 秒 Host cleanup deadline 与配置排空预算是否匹配。测试不能触达生产 Host、生产 Secret 或生产数据库。
- 当前仅允许整理已存在的 GitHub/Railway 只读证据；没有真实人员签字、生产原始停止收据和数据库会话复核，不进入生产 K1/K2、不会运行 Validator、不会改变生产配置。
- 两个 [Draft PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) / [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) 保持独立、未合并。全部 E01J4、PA05-05 E01–E05、W06 `NOT_SIGNED`，K0 `NOT_SIGNED`，生产 material WRITE `OFF`；Issues [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) 保持 OPEN。

**无真实签署材料：** 目前没有实际 PID、进程 nonce、外部监督者退出回执、生产 Human IdP/DBA/审计签字、Settings-pane 影像或生产 SQL session 快照。本表不伪造这些字段。


## 6. 受保护 Host 入口覆盖矩阵：本次源码查阅（未签收）

**阅读级别：`ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW`，2026-10-20。** 精确读取当前生产对应 [`manager/server.ts` at main `6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1`](https://github.com/jiangxng/EVO-App-Platform/blob/6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1/manager/server.ts)，其 blob 为 `019b42a97aca18403245bf8480978638eacb65e5`。本表仅枚举**已找到的实际 route 分支**，不是网络扫描，也不是所有扩展/SQL 直连路径都已证明封闭。

| 分类与实际操作入口 | 源码证据（该 blob 行号） | 现有静态门禁 | 尚需真实的负面验收 |
| --- | --- | --- | --- |
| **PA05 注册** — `POST /v1/admin/pa05/read-plugin/admit` | 6982–7073 | 默认 `APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION=OFF` 返回 404；`OPT_IN` 后检查 Bearer bootstrap 身份、Authorization Provider，使用两次策略核查，并返回 `AVAILABLE_NOT_INSTALLED` | 未授权/过期操作员、Provider 拒绝/中断、生产 IdP 未签发时不能注册；注册并不等于 install/activate |
| **普通 HTTP** — `POST /v1/install`, `/v1/upgrade`, `/v1/enable`, `/v1/disable`, `/v1/uninstall` | 10105–10219 | 每条变更 route 调用 `authorizePa05E01fLifecycle`；DISABLE/UNINSTALL 的 PA05 受保护包在 J4D `OPT_IN` 时调用 SQL-fenced `applyPa05ReadLifecycleMutation`；ENABLE 经 `pa05WriteLifecycleHost.admitActivation` | 所有五条都应检查正确 packageId/间接依赖、身份与 authorization、旧 epoch、并发变更；不得以 HTTP 层成功替代 SQL 准入/真实身份证明 |
| **Agent/Action** — `POST /v1/actions` + `app-platform.install-package`, `enable-package`, `upgrade-package`, `disable-package`, `uninstall-package` | 9421–9452、9819–10063 | 单次入口在命令 dispatch 之前以 `pa05E01fProtectedActions` 匹配操作，若 `itemId` 为字符串才调用 `authorizePa05E01fLifecycle`；已审阅的对应 mutation handlers 缺 `itemId` 会拒绝。代码中存在多段 dispatch 分支，均在统一入口门禁之后 | 针对**每一个**命令与重复 dispatch 分支测试缺失/错误 itemId、间接依赖、过期/伪造凭据、Provider 故障、重启重入/并发竞态；不可凭当前静态片段宣布所有插件扩展动作已闭合 |
| **只作计划的 HTTP routes** — `POST /v1/install/plan`, `/v1/upgrade/plan`, `/v1/disable/plan`, `/v1/uninstall/plan` | 10099–10204 | 已读 handler 直接调用 `manager.plan*` 或 `installPlanWithDigest` / `upgradePlanWithDigest`；该 handler 无直接 install/disable/uninstall 执行调用 | 此处只认定路由表层为**规划**，不推断底层完全无副作用；需隔离测试证明没有受保护状态变更 |
| **SQL/Owner 准入** — J4D DISABLE/UNINSTALL 专用通道 | 3363–3415；J4J 本地锁在 1050–1073 | J4D 只有 `OPT_IN` 且有独立 DB URL/schema/Host ID 才组装 SQL authority；E01F Host 管理认证依赖 bootstrap+Provider，`session_user`/SQL 角色属于此前 J4E 证据。J4J 默认 OFF 且单本地文件系统有效 | 真实 PostgreSQL role grants、存活旧 backend、外部 CLI/其他应用数据库路径、凭据轮换与撤销需要 DBA 独立确认；J4J 锁不提供多 Worker stop receipt |

### 6.1 由来源事实推导的准入层限制

- **来源事实：** `authorizeHostAdministration`（第 3274–3311 行）先做 `authenticateBootstrapAdministratorV010`，再取 Authorization Provider 并调用 `authorizeProviderAdministrationV010`；无法解析 Provider 则拒绝。**判断：** bootstrap/策略组合只能证明已实现软件路径，不能签收真实 Human IdP/MFA/授权撤销 SLA。不得把 bootstrap token 冒充生产维护授权。
- **来源事实：** `authorizePa05E01fLifecycle`（第 3325–3357 行）对目标包及 INSTALL/ENABLE 的依赖影响调用稳定策略/影响范围核查；该 route 层不等于全组织或数据库的 Worker 清点。**判断：** 必须继续将 SQL 直接角色、外部进程和新建 Worker 当作待查的独立准入边界。
- **来源事实：** 当前 Host 的 PA05 E01D、J4D、J4J 开关在源码默认为 OFF；连接的 Railway `describe_service` 当前变量**名称**不包含上述开关或 J4D 独立 DB 连接参数。**判断：** 这是受限控制面与源码的合并证据，不等于生产数据已审计，也不等于受保护入口最终可删除。
- **外部调用者影响：** Railway Validator 的已读脚本目标为 `evo-ledger-runtime-configurator`，而不是 `evo-purchase-attention`。这不证明其始终不能调用其他命令或所有未授权请求都会被生产拒绝。已登记的 GitHub RUM POST 是**遥测**，不是 PA05 material WRITE。
- **负证据/未完成：** 目前不存在经本次任务亲自发出的生产 HTTP 请求、SQL 会话查询、真实操作员 Token、生产子进程列表或外部停机回执。K0 绝不允许把源码分支匹配视为 `STOP_CONFIRMED`。

### 6.2 归档判定

`SOURCE_ROUTE_INVENTORY_PARTIAL / PRODUCTION_INGRESS_REACHABILITY_NOT_SIGNED / TRUSTED_STOP_NOT_SIGNED`。此增量帮助 R3（外部调用入口）进一步收敛，但 R1、R2、R4–R8 保持 `UNVERIFIED`。新的入口范围不改变此前已选择的中央 epoch/fencing + 外部停机回执 + PG session 重查方案。


## 7. 新源码风险：PROCESS 清单与实际停机的并发时间窗（尚未复现）

**阅读级别：`ORIGINAL_GITHUB_SOURCE_READ_THIS_WINDOW`。** 精确基线：最新核验 `main@91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa` 的 [`manager/plugin-runtime-host.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/plugin-runtime-host.ts)，blob `7554a10065b907a1fd89c194505f7e5e9cb047f1`；[同 SHA 的 `manager/server.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/manager/server.ts)，blob `6d5878fc9030bd2de910106f6566b5f4adb9ead7`。

### 7.1 源码已证明的先后顺序（事实）

1. `plugin-runtime-host.ts` **第 643–677 行**：`stop(packageId)` 先 `runtimes.delete(packageId)`（646），后注册/等待 child `exit`（648–654）、IPC shutdown（656–658）、750ms SIGKILL fallback（660–664），`await stopped` 后才 emit `PROCESS_STOPPED`（666–671）。
2. **第 687–689 行**：`shutdown()` 在调用时一次性按 `[...runtimes.keys()]` 快照构造 `stop` promises，`Promise.all` 等待这些**当时仍在 map 里**的条目；不会凭此快照自动等待此前已从 map 删除、尚未退出的 child。
3. `server.ts` 生命周期事件处理部分（约 **2311–2312**）：收到 `FEATURE_DEACTIVATED` 或 `PACKAGE_UNINSTALLED` 时调用 `void processRuntimeHost.stop(event.packageId)`，上层没有等待该 promise 形成全局停机屏障。
4. `plugin-runtime-host.ts` **第 331–434 行**：`start()` 在现有 map 不含该包时做 admission / 完整性检查后执行 Node `fork()` 并重新登记；`invoke()` 第 591 行会调用 `start()`。已读该类中的 `start()` / `shutdown()` 片段**没有单独的全局 shutting-down admission flag**。

### 7.2 工程推导（不是已实证 defect）

- **时间窗 A：** 某个 lifecycle 事件触发异步 `stop()`；它先从 map 删除进程但尚未收到 child exit；与此同时 Host `shutdown()` 快照 map。该 Host shutdown 能遗漏该已退出 map、但仍在停止中的 child 的 await。不能把一次空 map 或 `shutdown()` resolved 单独当作 OS 全部停止证明。
- **时间窗 B：** `shutdown()` 对 map 做快照后，另一个受信调用路径若仍允许 `invoke()/start()`，该类自身没有在上述已读源码显示禁止新 fork 的统一入口屏障。**是否能在实际生产中触发，需检查所有调用方并做独立负面测试；这里不声称已复现。**
- 上述代码仍可在正常无并发路径按预期发 IPC shutdown、等 exit。识别时序风险**不推翻既有 J4J 的 28/28 本机工程 PASS 或 #1074 的 201/201 shutdown 测试**；只是两组旧测试没有形成外部可信编排器的全域子进程收据。

### 7.3 将来的隔离验证，不授权在生产执行

| 负面案例（disposable non-production） | 必要的结果 |
| --- | --- |
| lifecycle 触发 stop，在 map 删除之后、child 真实 exit 之前触发 Host shutdown | 全部 child 仍有可核验的 exit/kill 结束与可信独立枚举；不得凭 map 空输出 `STOP_CONFIRMED` |
| 在 shutdown 快照之后并发提交受信 `invoke/start` | 新 child 必须被准入屏障拒绝，或纳入新的可信停止清单；重启/扩缩容 race 也须拒绝 |
| child 不响应 IPC，SIGKILL 尚未产生 OS exit | 继续 `UNKNOWN/DENY`，直到独立实例终止回执；SIGKILL 发送返回值不等于已退出 |
| 父 Host 在任一等待点异常 SIGKILL | 外部 supervisor 仍能够列出、停止和验证所有孤儿/残余 child；不删除 J4J 异常锁 |
| 无法联系编排器、外部 Worker/DB 会话持续存活 | 不允许 `STOP_CONFIRMED`、不执行维护、material WRITE 仍 OFF |

**阶段决定：`SOURCE_TIMING_RISK_IDENTIFIED / ENGINEERING_REPRO_NOT_RUN / K0_NOT_SIGNED`。** 此处不擅改 #1074 Host shutdown 工程分支或任何生产行为。可将上述用例提交未来经授权的独立**非生产**核验线；真实跨进程停机仍需要组织编排器签发回执并由 DBA 重查 PostgreSQL sessions。


## 8. 2026-10-20 — Existing test scope, #1074 non-overlap, and observable caller limitations

**Evidence level: source file fully inspected for test-case coverage / Railway connector settings read-only.** No tests were run in this turn; no live production route was called.

| Reference and exact source | Already tested in source | K0 negative case NOT established |
| --- | --- | --- |
| [`tests/protocol/process-runtime-host.test.mjs` at live main `91ffb9bd...`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/tests/protocol/process-runtime-host.test.mjs), blob `41099d341c956b67fcf998fe05f841a5e6efed88`, **full 332 lines read** | Node child isolated invoke/storage/event, restricted fs and environment, timeout/crash recovery, unverified process and Sigstore admission. `host.shutdown()` is used in cleanup at 160/194/245/304/329 | **No explicit test** of `stop()` map deletion overlapping `shutdown()` snapshot, new `fork()` after shutdown begins, duplicate in-flight stop, independent child PID exit receipts after parent crash, or remote Worker death. Absence means *not covered by this file*, not “impossible” or a runtime-proven bug |
| [Draft PR #1074 `tests/agent-line/pa05-host-shutdown-error-path.test.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/caccb1b60358b453ef471eaf6abecf1593e4965c/tests/agent-line/pa05-host-shutdown-error-path.test.mjs), blob `7de61c117653c71866298c4061315ee991153117`, **entire 2713-byte file read** | Verifies every cleanup step attempted after injected exceptions; multiple failures; clean completion; shutting-down HTTP keep-alive 503 | **Does not cover PROCESS child map identity, remote Worker's supervised exit, or live Railway PID 1**. #1074 changed `manager/server.ts`, `manager/host-shutdown.ts`, this test and CI; it did **not** modify `manager/plugin-runtime-host.ts`. Avoid duplicate engineering on #1071 |
| [`tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs`](https://github.com/jiangxng/EVO-App-Platform/blob/91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa/tests/agent-line/pa05-e01j4j-cooperative-host-pg.test.mjs), blob `84785a29006e8f7e55096727d1ba8b8714dd513d`, **test-case/exit portions inspected** | Two co-operating Hosts excluded by exact inode file lock and abnormal SIGKILL stale state remains fail-closed | Not a global Host+lazy child+remote Runner termination proof; inherited J4J 28/28 PG18 engineering evidence remains bounded |

### 8.1 Railway observability coverage

**Actual read-only connector returns (2026-10-20):** `get_tracing` on the connected production environment `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3` showed `tracingEnabled=false`, `autoInstrumentationEnabled=false`, `autoInstrumentationActive=false` for **all five services**. `list_webhooks` returned **0** project webhooks; `list_tcp_proxies` for Ledger Configurator Host returned **0** public TCP proxies. Original service inventory and project: [Railway project](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601). These reads neither use nor expose Secrets.

**Scope:** Lack of Railway tracing means its distributed-trace data cannot currently constitute complete K0 caller attestation. No project webhooks or public Host TCP proxy does **not** prove absence of HTTPS traffic, private-network endpoints, connected PostgreSQL clients, GitHub runners, external organizations or internal process children. Do not switch on production instrumentation in K0 without a separate authorized change and privacy/cost review.

### 8.2 Task separation and next acceptance ownership

1. **#1074 engineering owner only:** maintain existing Draft Host cleanup failure/HTTP admission patch, keep 45/45 CI and 201/201 Lightweight Host evidence *bounded*. K0 document PR must not rewrite same source or merge/deploy this Draft.
2. **Future isolated PROCESS-runtime test owner, only with separately authorized branch:** add deterministic fault-injection cases from §7 for stop-before-exit + shutdown snapshot, start-after-shutdown, orphan child after Host death. Specify an externally observed child PID/nonce and bounded cleanup receipt rather than relying on `runtimes` empty; do not falsely assert such cases currently pass. Distinct target: `manager/plugin-runtime-host.ts` and `tests/protocol/process-runtime-host.test.mjs` or a new dedicated test file; **no implementation performed here**.
3. **Infrastructure / SRE:** attest organization/project/workspace + service/child + external runner enumeration, effective Railway drain, PID 1 signal path and independent stop/restart/scale freeze; allow testing on disposable isolated infrastructure only.
4. **Security / DBA / Human Owner:** attest real issuer/operator session and revocation, separate SQL role/session re-query, privileged credential rotation, audit signatures; never use test IdP/Lease expiry/one DB function as the whole proof.

**Verdict remains `COVERAGE_GAP_CONFIRMED_BY_SOURCE / PROCESS_RACE_NOT_REPRODUCED / K0_NOT_SIGNED`; material WRITE OFF, #988/#979/#913 OPEN, no production Validator/Secrets/SQL/mutation.**


## 9. 2026-10-20 — 隔离 Node 子进程负面竞态 **真实复现**（K0 仍未签收）

**从纯源码推断升级为已执行隔离反例；原生产安全结论未升级。** 新独立测试 [Draft PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081)，分支 `agent/pa05-k0-process-runtime-concurrency-proof-20261020`，首个实测 HEAD `6eeb01b01c680d1e0c90999c5a79fcc6776493c0`，仅包含一次性本地 child fixture 和测试，**不修改 production runtime**、#1074、生产服务或凭据。

### 9.1 可核查、保留期有限的真实执行原始证据

- **原始 CI：** [Platform CI run #39426909610](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426909610)，job [#118641659592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39426909610/job/118641659592)，GitHub Actions 日志 **ORIGINAL_JOB_LOG_READ_THIS_WINDOW，2026-10-20 13:02:06 UTC**，Node 22.22.2、`npm run test:platform`。首个 HEAD 精确 commit checks 5/5 SUCCESS；Platform 协议测试 1087 total / 1086 pass / 0 fail / 1 skipped。
- 日志测试 `ok 759`，`K0 NEGATIVE: stop drops map entry before OS child exit; shutdown snapshot misses pending stop`，约 446.575 ms；原始标记：

  ```json
  {"scope":"isolated-local-child","shutdownReturnedWithChildAlive":true,"shutdownSkippedInFlightStop":true,"stopFinishedAfterwards":true,"globalStopCertified":false}
  ```

  **已实证：** 在本地 PROCESS child 退出之前，Host shutdown 返回且没有等待此前触发的 stop promise。该特定标记中的 `stopFinishedAfterwards` 字段在**首个代码版本的输出时点先打印固定 true**，不能单独作为 child 已结束的原始回执；测试后续实际 `await stopPending` 并断言 stop settled。此表达在后续测试 HEAD 中已修订为等待结束后才打印；其精确 CI 与日志仍需单独验证。
- 日志 `ok 760`，`K0 NEGATIVE: PROCESS host permits a new child invocation after its shutdown() resolved`，约 450.201 ms；原始标记：

  ```json
  {"scope":"isolated-local-child","spawnedAfterShutdown":true,"globalStopCertified":false}
  ```

  **已实证：** 一个没有显式关闭准入标志的 PROCESS runtime Host 在 `shutdown()` 已返回后，调用 `invoke()` 能新 fork 并执行本地 child；测试 finally 清理 child。

### 9.2 工程判断、范围和变更隔离

- **新证据判定：** `ISOLATED_PROCESS_STOP_SNAPSHOT_RACE_REPRODUCED`、`ISOLATED_POST_SHUTDOWN_FORK_REPRODUCED`；不再仅标为“可能存在竞态/待复现”。这些是可执行的真实本地 Node 子进程，并非 Mock 或纯静态猜测。
- **未证明：** 生产 Railway npm/SIGTERM 实际链路、服务子进程存活清单、真正全域 Worker/Runner 编排冻结、PG session 已撤销、Human IdP/DBA 凭据授权以及恶意外部调用都没有被这些测试证明。**此测试通过表示负面风险重现，不表示 K0 通过**。不能用 `5/5 CI SUCCESS` 擦除这一负面发现。
- **责任边界：** #1074 继续只管 Host 顶层 shutdown/HTTP 503/错误路径；#1081 是独立 **Draft / non-production negative evidence**，当前不合并/部署。后续单独评审 PROCESS runtime 的 admission barrier、in-flight stop tracking 和独立进程退出证明；将现有负面测试改造成 **fail-closed 正向回归** 后再评估工程验收，不在 #1071 文档线实施代码。
- **K0 总体结论不变：** `K0 NOT_SIGNED`、完整 `E01J4 NOT_SIGNED`、`PA05-05 E01–E05 NOT_SIGNED`、`W06 NOT_SIGNED`；production material WRITE `OFF`，Issues #988/#979/#913 OPEN。


### 9.3 修正后测试 HEAD 及原始日志复核（作为最新精确证据）

[#1081 最新测试 HEAD `a1e8a0941ff5b796816aaea0904b89533191a239`](https://github.com/jiangxng/EVO-App-Platform/commit/a1e8a0941ff5b796816aaea0904b89533191a239) 的确切 GitHub check-runs **5/5 SUCCESS**。已直接读取 [Platform CI run #39427280985，job #118643113249](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39427280985/job/118643113249) 的完整原始日志（`ORIGINAL_GITHUB_ACTIONS_RAW_JOB_LOG_READ_THIS_WINDOW`，2026-10-20T13:05:32Z）：

- `ok 759`：`shutdownReturnedWithChildAlive=true`、`shutdownSkippedInFlightStop=true`、**`stopFinishedAfterwards=true` 在实际 `await stopPending` 后才输出**。
- `ok 760`：`spawnedAfterShutdown=true`。
- 两条均明确 `globalStopCertified=false`；整份 `test:platform` 1087 total / 1086 passed / 0 failed / 1 skipped。

因此 §9.1 首版固定字段的时序瑕疵**已通过后续新 HEAD 修复并重新真实跑通**，负面结论没有改变。永久保存新 HEAD、run/job 和标记（GitHub Actions job log 后续可能因保留期失效）；绝不把 5/5 测试绿灯记成 production stop certification。仍不合并、不部署 #1081；K0 `NOT_SIGNED`，material WRITE `OFF`。
