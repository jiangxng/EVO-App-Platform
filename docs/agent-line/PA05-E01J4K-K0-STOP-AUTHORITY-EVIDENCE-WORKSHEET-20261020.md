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


## 10. 2026-10-20 — PROCESS 局部停机屏障修复：已执行正向测试，K0 仍未签收

### 10.1 独立工程与真实 CI 证据

新独立 [Draft PR #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 为 `agent/pa05-k0-process-runtime-stop-barrier-20261020`，首轮 HEAD `41b4fec7f153fe1df2df671a6f6030bd36d2b167`（以 [该提交](https://github.com/jiangxng/EVO-App-Platform/commit/41b4fec7f153fe1df2df671a6f6030bd36d2b167) 为稳定可复核快照）。以 `main@ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9` 创建；未修改 #1074 所覆盖的 `manager/server.ts` 或 `manager/host-shutdown.ts`，未合并、未部署。仅三文件：`manager/plugin-runtime-host.ts`、本地一次性 PROCESS fixture、正向回归 `tests/protocol/pa05-k0-process-shutdown-barrier.test.mjs`。PR 文件列表已由 GitHub 原始信息确认。

- **实际执行证据：** [Platform CI #39428680055 / job #118647684472](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39428680055/job/118647684472)，日志 `ORIGINAL_GITHUB_ACTIONS_RAW_JOB_LOG_READ_THIS_WINDOW`，2026-10-20T13:15:11Z。该 HEAD **5/5 commit checks SUCCESS**，`npm run test:platform` 日志为 **1087 total / 1086 passed / 0 failed / 1 skipped**。
- **正向测试 #759 `ok`：** `PA05_K0_BOUNDED_STOP_BARRIER={"scope":"isolated-local-child","shutdownReturnedWithChildAlive":false,"shutdownSkippedInFlightStop":false,"stopFinishedAfterwards":true,"globalStopCertified":false}`；在旧版 [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 中，同样真实 Node child 的反例为前两项 `true`。
- **正向测试 #760 `ok`：** `PA05_K0_BOUNDED_START_DENIED={"scope":"isolated-local-child","postShutdownForkDenied":true,"globalStopCertified":false}`；旧版 #1081 曾实测 `spawnedAfterShutdown=true`。
- **工程实现的静态事实：** 新 runtime 在 `shutdown()` 开始时立即 `shuttingDown=true`，拒绝后续 `start/invoke`，外部完整性校验 `await` 后再核对；单 package 同时 stop 时拒绝新 fork；已发起 `stop()` 的 promise 与 active map 单独跟踪并一起 await；`cleanupRecord` 只删除同一 `RuntimeRecord` 身份，避免旧 child 误删新登记。

### 10.2 证据定级与仍需修复/验收的缺口

| 边界 | 有界结论 |
| --- | --- |
| #1081 两项负面反例 → #1082 同项正向回归 | `ISOLATED_PROCESS_STOP_BARRIER_BOUNDED_PASS`，**真实子进程、单 Host/单机**；是特定测试通过，不是整个 PROCESS lifecycle 所有并发均无缺陷 |
| 超时路径 | **NOT_COVERED**：当前源码在 `invoke` timeout 时可在 `child.kill("SIGKILL")` 的 OS exit 完成前删除 map 记录；该异常 child 不属于此次以显式 `stop()` 建立的 in-flight stop map。需要下一阶段**精确子进程实例注册/退出**或等价完整跟踪，针对 timeout/SIGKILL→shutdown、child error、不同代际同包子进程做进一步隔离负面测试与修复 |
| 外部完整性校验途中关机 / 父进程被 SIGKILL | 新代码含校验后再检查 `shuttingDown`，但尚无专门可阻塞 verifier 的确定性 CI；父进程 SIGKILL 不可能靠本机 promise 等待提供独立终止回执 |
| Railway / 生产身份 / DB 权限 | `NOT_VERIFIED`：生效 draining 与 npm→Node SIGTERM、完整容器 PID/子进程/Runner 清单、可信 orchestrator receipts、`pg_stat_activity`/Role grants、Human IdP/MFA/DBA/Audit Owner/Secret 轮换，均不是此 PR 的测试对象 |

**决策：** 不把 #1082 的 5/5 GitHub checks 改写成全域 `STOP_CONFIRMED`，也不提前合并。既有 #1074 顶层 Host cleanup error path 与 #1082 内部 PROCESS stop barrier 依然两条独立 Draft 工程线。K0、完整 E01J4、PA05-05 E01–E05、W06 `NOT_SIGNED`；production material WRITE `OFF`；#988/#979/#913 保持 OPEN。没有生产操作。


## 11. 2026-10-20 — 超时 child close、代际串行与异步验证停机屏障：有界 CI 正向证据

**证据等级：`ORIGINAL_GITHUB_SOURCE_COMMITTED_THIS_WINDOW` + `ORIGINAL_ACTIONS_RAW_JOB_LOG_READ_THIS_WINDOW`。** 本节只覆盖 disposable GitHub Runner 上的本地 Node PROCESS，绝非 Railway 或可信多 Worker 实例回执。

### 11.1 先前超时 SIGKILL 与代际缺口：HEAD `c1e03419`

[Draft PR #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 的 [独立工程提交 `c1e0341951e00c9965780190e203ccfd2fa5a22d`](https://github.com/jiangxng/EVO-App-Platform/commit/c1e0341951e00c9965780190e203ccfd2fa5a22d) 扩展 PROCESS runtime 的 **所有已 fork child** 跟踪：每个实际 ChildProcess 的 `close` 独立 promise / liveChildren Set，不再把 active map 删除或发送 SIGKILL 视为 OS child 已经关闭；timeout 代际在 `retiring` 中保留，后代 start 等前代 `close`。同一条 shutdown barrier 在实际停止中 await liveChildren promises。

- 该 SHA **5/5 exact-HEAD GitHub checks SUCCESS**；[Platform CI #39430410538 / job #118653676285](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39430410538/job/118653676285) 原始日志 `2026-10-20T13:27:25Z`，协议 **1089 tests / 1088 passed / 1 skipped / 0 failed**。
- `ok #761`、`PA05_K0_BOUNDED_TIMEOUT_REAPED`：`timeoutChildClosedBeforeShutdown=true`，证实**本地测试 child** 在 `shutdown()` 完成前已关闭。
- `ok #762`、`PA05_K0_BOUNDED_GENERATION`：`priorChildClosed=true`、`newChildReady=true`、`staleCleanupDidNotDeleteReplacement=true`。断言是旧 PID 不再存活、再返回新 PID 和 READY 状态，旧 record identity-safe cleanup 未误删新登记。
- 先前 `ok #759/#760` 停机重叠与 shutdown 后 fork 拒绝继续通过。所有测试日志 `globalStopCertified=false`。

### 11.2 新增异步 Sigstore verifier 与 stop/fork 竞争：HEAD `12dcfa1a`

[最新工程提交 `12dcfa1aec30e32247a865fe7c44267350e2f237`](https://github.com/jiangxng/EVO-App-Platform/commit/12dcfa1aec30e32247a865fe7c44267350e2f237) 用 per-package **`starting` 单飞 Promise** 串行完整性验证；`stop()` 在 await pending verifier **之前登记停止意图**，防止验证返回后偷跑 fork；`shutdown()` 等待所有 pending start 完成拒绝/清理。所有新增逻辑仅位于 `manager/plugin-runtime-host.ts` 与隔离测试，不影响 #1074 的 `manager/server.ts` 和 Host 顶层关闭实现。

- 该 SHA **5/5 exact-HEAD GitHub checks SUCCESS**；[Platform CI #39431045554 / job #118655876047](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39431045554/job/118655876047) 原始完整日志 `2026-10-20T13:31:53Z`，协议 **1091 tests / 1090 passed / 1 skipped / 0 failed**。
- `ok #763`，`PA05_K0_BOUNDED_ASYNC_FORK_SINGLETON`：`verifyCount=1`、`forks=1`；并发的同包 start 只走一次本地 verifier/fork。
- `ok #764`，`PA05_K0_BOUNDED_ASYNC_STOP_FENCE`：`forks=0`、`lateForkDenied=true`；stop 在 verifier pending 时阻止其后续 fork。
- 之前的 `ok #759–#762` 四项正向回归在同一真实日志再次通过。所有专门回执均 `scope="isolated-local-child"`、`globalStopCertified=false`。

### 11.3 分层结论与仍不得签收的事项

| 层次 | 本轮真实结论 | 不得误用 |
| --- | --- | --- |
| **本地 PROCESS 六项专门关闭/启动并发场景** | `ISOLATED_PROCESS_LIFECYCLE_BOUNDED_PASS`，六项真实 Node child 回归通过，单次 CI、指定 Linux runner 与源码 SHA | 不是所有异常时序或平台安全认证；不能证明跨 Host shutdown |
| **缺少的局部异常覆盖** | 仍需独立验证 **父进程突然 SIGKILL**、子进程及 IPC 断开、反复并发重入/异常回调，以及 `shutdown` 等待尚未返回的外部 verifier 时的 deadline 行为 | 本地 promise 与 OS `close` 不构成外部编排/独立签名终止收据 |
| **生产 K0 阶段** | Railway 有效 drain/npm PID1→SIGTERM、组织级 Worker/Runner 和数据库 session 清点、中心 fencing/freeze owner、Human IdP、DBA/rotation/审计都仍 **`UNVERIFIED`** | 不运行生产 Validator/SQL、不开关生产服务、不开 WRITE、不清异常锁 |

[#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) 文档、[#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) Host 顶层修复、[#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 负面复现、[#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) PROCESS 修复 **全部保持 Draft、未合并、未部署**。K0/完整 E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`；material WRITE `OFF`；Issues #988/#979/#913 OPEN。


## 12. 2026-10-20 续跑 #07 — verifier 等待取消与本地 IPC 异常关闭（真实有界 CI）

**结论：`ISOLATED_PROCESS_LIFECYCLE_NINE_CASE_BOUNDED_PASS`，不是生产 `STOP_CONFIRMED`。** 作为 [独立工程 Draft #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 的第三次工程增量，commit [`c15ce1f5225272b26d14f5b564a2a6b9f0582270`](https://github.com/jiangxng/EVO-App-Platform/commit/c15ce1f5225272b26d14f5b564a2a6b9f0582270) 仅修改 `manager/plugin-runtime-host.ts`、已有 disposable child fixture 和本地 PROCESS 测试；它没有修改 #1074 的顶层 Host shutdown 路由/错误路径，也未进 main 或生产。

### 精确原始来源与实测结果

[Platform CI #39432525667 / job #118660946764](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39432525667/job/118660946764)：**原始 GitHub Actions job log 本轮已直接读取**，2026-10-20T13:41:47Z，`npm run test:platform` **1094 total / 1093 PASS / 1 SKIPPED / 0 FAIL**；本地九项 `ok #759–#767`，所有 K0 日志均 `globalStopCertified=false`。

| 局部专项回归（新增三项） | 原始可复核日志字段 | 正确解释 |
| --- | --- | --- |
| `ok #765`：shutdown 期间外部 verifier 一直等待 | `PA05_K0_BOUNDED_VERIFIER_SHUTDOWN`: `boundedShutdown=true`、`lateForks=0` | 本机 Host 取消自己的 pending start wait，并保证 verifier 迟到返回后也不再 fork；**不表示真实远端 verifier 已停止** |
| `ok #766`：stop 期间 verifier 一直等待 | `PA05_K0_BOUNDED_VERIFIER_STOP`: `boundedStop=true`、`lateForks=0` | 单包 stop 立即撤销本地待启动准入，不被无界 verifier 阻塞；**不代表对外部请求的取消已确认** |
| `ok #767`：一次性子进程主动 IPC disconnect | `PA05_K0_BOUNDED_IPC_DISCONNECT`: `disconnectedChildClosed=true` | Pending invocation 拒绝，随后本地 Node child 已 close；**不是父 Host 死亡后的独立 supervisor 证据** |

**原有六项 #759–#764 均在同一 HEAD 的 raw job log 中重新 `ok`**：stop/shutdown overlap、post-shutdown no-fork、timeout SIGKILL → close、同包 generations 先旧后新、异步 verifier single-flight、stop-in-verifier fencing。该提交的全部 exact-HEAD CI 应按实时查询确认；不能以 protocol job 单独代表其他 jobs 都已结束。

### 源码方案、限制与未解决的问题

- 事实：新实现增加 per-package `cancelVerifying` 的 Promise rejection 通道，以 `Promise.race(externalEvidencePromise, localCancellation)` 满足本地 stop/shutdown 可完成；取消不会放行 late verifier fork，且 race 双方均有 rejection 处理以避免异步未处理异常。
- 重要限制：`verifyExternalEvidence` 当前公开签名仍无 `AbortSignal`，因此只能取消 **Host 等待与其后续 fork 授权**，不能证明实际外部 verifier 的网络请求/资源已停止。真实远程验证方的取消、超时上限、审计回执需其 owner 单独定义。
- 尚未实现和验收：父 Host 突然被 SIGKILL 的独立 OS/编排级 Worker 子孙清点与回收；容器 PID1 与 npm→Node 生产 SIGTERM；有效 Railway draining；跨 Worker stop/freeze 回执；现存 PostgreSQL backend/revocation；真实 operator Human IdP/DBA/audit。直接在 runner 杀死父进程可能产生临时孤儿；本轮**未做故意遗孤实验**，不得把缺失证据写成已通过。
- 仍有更狭窄的局部边界待评估：子进程 `activate()` 永远不发 `ready` 时 `startOne()` 的等待、child spawn error 与 cleanup、极端非合作 child 的终止预算。九项场景不证明所有可能时序已穷举。

**责任隔离：** #1071 文档 Draft；#1074 顶层 Host shutdown Draft；#1081 两项负面复现 Draft；#1082 PROCESS 本地修复 Draft，四者均不得未经授权合并/生产部署。K0、完整 E01J4、PA05-05 E01–E05、W06 `NOT_SIGNED`；production material WRITE `OFF`，Issues #988/#979/#913 OPEN。


## 13. 2026-10-21 — K0 接续控制面核验、启动期第十项隔离正证据与外部监督门禁

**证据归档：** [2026-10-21 新增接续与来源分级记录](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)；本节为原工作表的增量字段，不覆盖 §§1–12、[2026-10-20 原交接](PA05-E01J4K-K0-WINDOW-RESEARCH-REFERENCE-INDEX-20261020.md)、[2026-10-21 最终交接](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)，不构成独立运维停机收据。

**2026-10-21 直接读取的 GitHub/Railway 控制面（不是继承的旧推测）：**

- GitHub 当前 `main@386f267bcc115fd4e64af74724f2a3aa55199878`，同 SHA **40/40 check-runs SUCCESS**。该检查不能抹除旧 [Ecosystem schedule #39393603504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39393603504) 的 **10 FAIL / 82 SKIPPED**；旧 run 仍 `failure`，范围和 SHA 不同。
- Railway 已连接生产 Ledger Configurator deployment `0cf816e7-3c09-4837-a192-81a682df55be` 对应 `main@386f267b`，**SUCCESS/Online/1 running/0 crashed**；原交接 deployment `5c88b3df...` 现 `REMOVED`。五服务仅为已连接项目的有限控制面清单。
- Host 与 EVO Runtime 的 startCommand 均为 `npm start`；生产有效 draining/overlap、真实 PID1→Node SIGTERM、完整组织 Worker/PROCESS 子进程/外部 Runner 与数据库会话及 IdP/DBA/凭据签发仍 **UNVERIFIED**。Railway 返回变量**名称**缺少显式 draining 变量，不等于生产生效值确定为零。
- 四条 Draft [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) / [#1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) / [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) / [#1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) 继续隔离；#988/#979/#913 **OPEN**。

**隔离启动期新证据：** #1082 原 Draft 分支在 `6b79d3e3f558a0c46193424edd625700145d19af` 新增第十项一次性 Node PROCESS 测试，子进程特殊 fixture 的 `activate()` 不返回、额外自退出保险 5 秒、父 Host 正常存活；[Platform CI run #39530562128 / job #118995237822](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39530562128/job/118995237822) 的**原始 job log 已直接读取**，`1102 total / 1101 PASS / 1 SKIPPED / 0 FAIL`，该 HEAD **5/5 exact checks SUCCESS**。原日志新 `ok #775` marker：

```json
{"scope":"isolated-local-child","boundedShutdown":true,"startupSettledByChildExit":true,"noActiveRuntime":true,"globalStopCertified":false}
```

同一 job 另外九个既有局部测试 marker 均实际出现，共 **10 项**；最新标签只允许 `ISOLATED_PROCESS_LIFECYCLE_TEN_CASE_BOUNDED_PASS`。**不能**把 3500ms 测试断言写为生产 stop deadline，也没有父 Host SIGKILL 及外部 supervisor 的子进程完整退出回执；没有活跃生产 PID 观察或生产运行演练。

**外部监督先决条件（定向新增原文查阅，而非已落地）：** Linux [PR_SET_CHILD_SUBREAPER](https://www.man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html) 可收养/等待孤儿但不能凭此杀掉仍存活 child；[systemd.kill](https://man7.org/linux/man-pages/man5/systemd.kill.5.html) 的 control-group/mixed/process 差异提供可选隔离实验参考，但**不能冒称 Railway 使用 systemd**；[Node child_process 文档](https://github.com/nodejs/node/blob/main/doc/api/child_process.md) 的 `close` 事件仍只是父 Host 活着时的局部退出观察。阅读等级与完整事实/项目判断分界见新增接续记录 §4。

**R1–R8 阻塞持续：** 必须先有组织批准且独立于受测 Host 的监督者、完整 PID/启动时刻/cgroup/namespace 身份枚举、可证明的 TTL 回收和结束凭证，才可能尝试非生产父 Host SIGKILL。生产 draining/PID1、全部 Worker/外部调用者、冻结/停止权威、SQL Session、实际 Human IdP/MFA、凭据轮换与 DBA/审计签名依然未知；UNKNOWN/DENY 不可写成 0/STOP_CONFIRMED。

**历史分支：** 九条已合并 `docs/pa05-*` 过程分支逐条重新比较准确 tip、关联已合并 PR 和 `main@386f267b` 祖先关系，保持可安全退休候选；当前 GitHub 连接器无 delete-ref/branch-delete/workflow-dispatch，且本轮未重扫全部 open PR 引用/保护位，故**远端删除 NOT_EXECUTED**。活动四条 Draft 均不得清理。

**仍然：** K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 均 `NOT_SIGNED`，production material WRITE `OFF`，#988/#979/#913 `OPEN`；未读取生产 Secrets/SQL，未启动生产 Validator，未停机/重启/扩缩容、改 draining 或清锁，未合并 PR。


## 14. 2026-10-21 — 第十项真实激活 IPC/PID 正反验证与独立 supervisor 候选（非生产签收）

**准确日志及阅读等级：** [#1082 工程 HEAD `96caf490dbb5f6ad697a7388baef90dfca0c2287`](https://github.com/jiangxng/EVO-App-Platform/commit/96caf490dbb5f6ad697a7388baef90dfca0c2287)；[Platform CI #39532710142 / job #119002307849](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39532710142/job/119002307849) **`ORIGINAL_ACTIONS_RAW_LOG_DIRECT_READ_20261021`**，`1102 tests / 1101 PASS / 1 SKIPPED / 0 FAIL`，10 个 `PA05_K0_BOUNDED_*` marker 均出现。第十项正式增强了初版 §13 的薄弱时序证据：**真实 child `activate(host)` 发送 scoped Host storage IPC，报告自身 PID；测试实测退出前 PID alive、Host shutdown 后 PID absent**。原 marker：

```json
{"scope":"isolated-local-child","activationEnteredByRealHostIPC":true,"activationCalls":1,"observedChildPidClosed":true,"boundedShutdown":true,"startupSettledByChildExit":true,"noActiveRuntime":true,"globalStopCertified":false}
```

**边界：** 局部测试有父 Host 存活与 child 5 秒 self-exit 保险；`boundedShutdown` 为 CI 有限时间断言，不是生产 deadline，更不是 parent SIGKILL 后子孙全域清理。准确演进、原始来源网址、为何修正 PROCESS_STARTING-only 证据及方案比较见[本轮接续索引 §§7–8](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)。**如未证实精确 HEAD 5/5，不能提前记所有工作流均绿**。

**新增并已实际打开的原始外部来源：** [Linux cgroup v2 Kernel 官方](https://docs.kernel.org/admin-guide/cgroup-v2.html) `cgroup.kill` 和 `cgroup.events populated`；[pidfd_open(2)](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)、[pidfd_send_signal(2)](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html)、[PR_SET_CHILD_SUBREAPER](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html)、[systemd.kill(5)](https://man7.org/linux/man-pages/man5/systemd.kill.5.html)。适用性由 K0 设计归纳，**不能把 Kernel/systemd 的可用接口推断成 Railway 当前确实已配置/可用。**

**R1–R8 门禁继续 DENY：** 测试前必须由独立 Supervisor 自证其身份、隔离 cgroup 与进程树枚举、真实可终止和 TTL 清理能力，才能做 parent SIGKILL；本轮未执行。生产有效 draining/npm PID1、完整 Worker/外部 Runner、真实 PostgreSQL session/role、IdP/MFA/DBA/Secret/audit owner 仍 UNVERIFIED，`STOP_CONFIRMED` 不签发。

**当前外部控制面：** 2026-10-21 只读刷新 GitHub `main@524106df36af45b89d15eebd4c0c4f308b1718fc` **40/40 checks SUCCESS**；Railway Host deployment `35d45d8d-d44c-4bce-a51c-9cd36b9405f2` SUCCESS/Online；#1074 独立 Draft PR 当前 GitHub mergeability `dirty`，不触及该 PR 或本项目主线冲突。旧 Ecosystem Certification 10 FAIL 仍是不同 SHA/范围的独立反证。

**结论不变：** `ISOLATED_PROCESS_LIFECYCLE_TEN_CASE_BOUNDED_PASS` 仅限被测本地 PROCESS；K0 / 完整 E01J4 / PA05-05 E01–E05 / W06 `NOT_SIGNED`、production material WRITE `OFF`，#988/#979/#913 `OPEN`。不合并 Draft、不部署/访问生产 SQL/Secrets/Validator、不改 draining、不清残留锁/历史分支。


## 15. 2026-10-21 — 第十一项非合作 deactivate 真实 stop 截止测试（bounded only）

[#1082 本地隔离工程 HEAD `156609a7bf9429fa2e1fcc4ca4e42a7349da1964`](https://github.com/jiangxng/EVO-App-Platform/commit/156609a7bf9429fa2e1fcc4ca4e42a7349da1964) 在不改 production runtime 的前提下，为 disposable PROCESS fixture 增加 `deactivate()` 永久 pending、child 5 秒自退出保险；父 Host 存活且可监督。直接阅读 [Platform CI run #39533283090/job #119004106488](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39533283090/job/119004106488) **原始 job log**（2026-10-21），协议 **1103 total / 1102 PASS / 1 SKIPPED / 0 FAIL**、11 项本地 `PA05_K0_BOUNDED_*` 均有 marker，新 `ok #776`：

```json
{"scope":"isolated-local-child","nonCooperativeDeactivate":true,"childClosedBeforeFixtureFuse":true,"elapsedMs":753,"globalStopCertified":false}
```

**来源事实**：该 Linux Runner 一次观察到 `stop()` 等待约 753ms、child PID 实际不存活、之后可正常 `shutdown()`；源码在 stop 后设 750ms 本地 SIGKILL fallback，测试使用 `<3000ms` 有界断言、5 秒自退出保险。**项目判断**：该用例补齐“正常父 Host 下的非合作 deactivate 局部回收”覆盖，但**753ms 不是正式生产超时预算 / SLA**，也无真实容器 PID1/drain、多 Worker/parent SIGKILL 外部回执或生产身份 SQL 证明。扩展原有第十项证据见 [2026-10-21 接续索引 §9](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)。

**认证持续拒绝：** 此 HEAD 精确 CI 未全绿前仍以已经通过的早期十项为有界已确认；完成后仅可记 `ISOLATED_PROCESS_LIFECYCLE_ELEVEN_CASE_BOUNDED_PASS`。R1–R8 UNKNOWN / DENY；K0 / E01J4 / PA05-05 E01–E05 / W06 `NOT_SIGNED`，production material WRITE `OFF`。不启动 parent SIGKILL、不运行生产 Validator/SQL/Secrets、不合并 Draft、不改 Railway/drain、不清异常锁或远端活动分支。


## 16. 2026-10-21 — 独立 supervisor 只读前置检查：cgroup v2 可见≠清理权威

**新增测试与精确 CI：** [#1082 HEAD `eb129cc2b156294d34c0a04fb73a6ebbedd4b34f`](https://github.com/jiangxng/EVO-App-Platform/commit/eb129cc2b156294d34c0a04fb73a6ebbedd4b34f) **5/5 exact commit checks SUCCESS**；[Platform CI #39535199087/job #119010190494](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39535199087/job/119010190494) 原始 job log 本窗口直接读取：**1105 total / 1104 PASS / 1 SKIPPED / 0 FAIL**。新增 `tests/fixtures/pa05-k0-external-supervisor-preflight.mjs`、`tests/protocol/pa05-k0-supervisor-preflight.test.mjs` 是**2 项只读 / 拒绝型 preflight 测试**，不是又通过了两个实际停机用例；原 PROCESS 生命周期保持 **11 项 local bounded PASS**。

- GitHub Runner 实测 `linux=true`，`cgroupV2Detected=true`，`ownCgroupLocated=true`，`eventsReadable=true`，`cgroupKillPresent=true`，`observedPopulated="1"`；并非 Railway 生产配置。
- 所有真正外部授权/隔离/回收/独立监督/TT L/签名退出回执证据均 `false`；`parentSigkillExperimentAuthorized=false`、`globalStopCertified=false`。使用全部 `true` 的未经认证 claim 仍抛出 `PA05_K0_PARENT_SIGKILL_DENIED`。
- **实验门槛拒绝的真实原因：** `cgroup.kill` 文件存在仅是可见性，既未确认有写权限，也不能证明正在作用于唯一专属测试 cgroup。当前 `populated=1` 更说明不能把此现有 cgroup 当作“测试 child 已全部退出”回执。安全独立 supervisor 尚未建立，未运行危险 SIGKILL。

新旧来源等级、原始 JSON、所需真正 Infra 证据表和 #1074 冲突原文对照见 [2026-10-21 接续研究记录 §10](PA05-E01J4K-K0-CONTINUATION-EVIDENCE-20261021.md)。**新有界结果**：`ISOLATED_SUPERVISOR_CAPABILITY_HINTS_READ_ONLY_AND_UNTRUSTED_CLAIMS_DENIED`；与 `ISOLATED_PROCESS_LIFECYCLE_ELEVEN_CASE_BOUNDED_PASS` 两者均不可升级为可信多 Worker stop。

**K0→K6 不变：** 中央 fencing epoch、外部逐实例/逐 Worker 停机收据、外部 Caller 的受保护入口否决、PG session 重新查询、真实生产 Human/DBA 权威和凭据轮换签名。R1–R8 UNKNOWN/DENY 继续，生产 draining/PID1/OS 独立 supervisor/组织范围清单仍未验证；禁止在未获独立清理保障时运行 parent SIGKILL。K0/完整 E01J4/PA05-05 E01–E05/W06 `NOT_SIGNED`；WRITE `OFF`，#988/#979/#913 OPEN。
