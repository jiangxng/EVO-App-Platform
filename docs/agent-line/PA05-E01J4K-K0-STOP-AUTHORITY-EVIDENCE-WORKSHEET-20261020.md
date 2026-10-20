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
