# PA05-05 / E01J4G — 生产操作员身份与启动前恢复信任门禁（2026-10-19）

**文档类别：DECISION_RECORD / SOURCE-GROUNDED_GAP_ASSESSMENT。状态：CONTRACT_REVIEW_COMPLETE；实际工程与生产身份均 NOT_SIGNED。**
此记录是交接后的**下一最小门禁界定**，不是第 25 个 PostgreSQL 测试或 PA-05 验收。仓库核对参考：`main@a7eb0a93793a05fc9d847f61c237cefc92e9dd00`（仅 2026-10-19 检查时）；[研究短入口](PA05-E01J2-J4F-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md) / [已读来源索引](PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md) / [认证总账 §§54–61](PA05-CERTIFICATION-BASELINE-20261015.md)。不重读已验收 PG18 学术/官网资料，不重新实现 J2–F。

## 1. 直接读取的仓库事实（GitHub 原始文件，2026-10-19）

| 原始文件 | 已读事实 | 尚不能推出 |
| --- | --- | --- |
| [manager/server.ts](../../manager/server.ts) `authorizeHostAdministration`、`authorizePa05E01fLifecycle`、`applyPa05ReadLifecycleMutation` | 在线 Host 接收 Authorization Bearer；由 `authenticateBootstrapAdministratorV010` 后经已解析的 `AuthorizationProviderV010` 作动作/资源检查；E01F/H 两次授权，J4D Host 自生成操作 ID；配置 `APP_PLATFORM_PA05_E01J4D_DATABASE_URL/SCHEMA/HOST_ID`，默认 `OFF` | Bootstrap Token 不是独立生产 OIDC/身份托管；Host 在线管理授权不能在 E01I **尚未监听**时直接用于离线恢复；环境中的 SQL URL 不是已有 Host `secrets.resolve` 绑定 |
| [providers/authorization/runtime.ts](../../providers/authorization/runtime.ts) | `authorization.check` 的静态 Provider 支持 deny-by-default、动作/Principal/资源匹配；缺失或未匹配不能默认允许 | Policy ALLOW 不能替代认证过的操作员 Principal，也不是实体本人认可 |
| [providers/request-session/runtime.ts](../../providers/request-session/runtime.ts)、[providers/session/runtime.ts](../../providers/session/runtime.ts) | 已有 request-bound bearer Session Provider 和静态参考 Session，含到期检查；其令牌/Session 数据为实现契约 | 参考 Provider 的本地配置本身不代表生产独立身份源、离线进程审计或可验证的维护人授权 |
| [manager/secret-store.ts](../../manager/secret-store.ts)、[providers/secrets/runtime.ts](../../providers/secrets/runtime.ts) | 现有 Host secret store / `secrets.resolve` 基础，文件实现 AES-256-GCM 与主密钥分离 | J4D/J4F SQL URL 尚未由该参考模型提供生产受控供应、隔离角色轮换/撤销和不回显验收 |
| [manager/pa05-read-owner-lifecycle-pg.ts](../../manager/pa05-read-owner-lifecycle-pg.ts) | PostgreSQL `session_user`、指定 Host ID、仅调用 DBA `SECURITY DEFINER` transition/pending 函数，业务 READ Worker 与生命周期操作员 SQL LOGIN 分权；`pending()` 不接受用户操作 ID | 生产角色/证书/CA/密钥、DBA 函数迁移与 `EXECUTE` 授权目前尚无签收 |
| [manager/pa05-read-owner-prestartup-recovery.ts](../../manager/pa05-read-owner-prestartup-recovery.ts) | J4F 仅在可信外部调用方通过 `authorizeHostOperator()` 后读取本地状态、查询既有 FENCED UNINSTALL、复用 J4C SQL ASSERT/COMPLETE 与 AppManager UNINSTALL；E01I 完全不改 | 任意实现返回 true 的回调不等于真实操作员身份；没有生产可执行的维护 CLI/审计系统 |
| [manager/pa05-read-owner-host-lifecycle.ts](../../manager/pa05-read-owner-host-lifecycle.ts) | SQL FENCE 优先，之后 JSON 本地修改，中央 COMPLETE；失败不得逆转中央 revoke | PostgreSQL 与本地 JSON 不共享 ACID 提交；多 Worker 全局共识仍未证明 |

旧 J4F [PR #1044](https://github.com/jiangxng/EVO-App-Platform/pull/1044) 的 [物理三 PG18 #39225474209](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39225474209) **24/24 PASS、0 skipped** 是历史真实测试结论，不因本记录变成 25/25；J4F marker 的 `actualProductionOperatorIdentityCertified:false`、`productionRepairCommandWired:false`、`productionSecretsProvisioned:false`、`multiWorkerAtomicityCertified:false` 仍是正式负证据。

## 2. 已确认的边界与本轮工程判断

**沿用已接受方案，不变更 E01I/J4E/J4F 的语义**。可信身份、授权策略、专用 SQL 角色与已持久化 DB 意图是**四项不同证明**：知道 Host ID、持有 SQL 密码、通过静态环境开关或拥有 FENCED 意图中的任何单项均不得视为合法维护操作员。维护必须由 Host 信任边界认证一个独立 HUMAN 管理员或经专门批准的维护工作负载，再通过现有 Provider `authorization.check` 对**单一 Purchase Attention / UNINSTALL / 特定 Host**作当时的 ALLOW 判断；认证/策略源不可用、已撤销、超时或身份类型不符时 fail closed。此处不私自选择最终生产 IdP/凭据产品，不制作或保存真实生产密钥。

**下一工程闭环目标（待实现，尚未 PASS）：** 提供默认 OFF 的独立启动前维护入口，复用现有身份/Authorization Provider 契约及 Host `secrets.resolve` 安全取用专用 DB 凭据；只允许确定且唯一的 FENCED UNINSTALL，由 J4F/J4E 完成；发布前由 DBA 迁移与角色授予流程、Human 操作步骤和明确审计证据签收。不得在进程尚未监听时假调用 Host HTTP；不得以 `APP_PLATFORM_*_AUTHORIZED=true` / test fixture env predicate 当认证；不得把 `DATABASE_URL` 明文写日志/交接/Git，或给 READ Worker 或 Agent 操作员 SQL LOGIN。不得为此开放生产 WRITE 或默认激活 Host 选项。

**审核要求：** 具体生产身份发行者及授信方式、DBA 角色/证书配置、密钥轮换和访问审计必须在投产前以真实组织授权另行核验；工程先使用 disposable identity/secret/db fixtures 作真实负面回归，不在仓库存放凭据。

## 3. 下一工程验收矩阵（均待实施，不伪报 PASS）

1. **操作员身份/授权：** 缺失凭据、错误/过期/撤销 Session、非 HUMAN 或未批准 maintenance Principal、Provider 不存在/多义/拒绝/故障、错 Host/资源/UNINSTALL 操作、重复或过期意图全部拒绝；不能用客户端 JSON、`trustApproved`、GUC、普通环境布尔值补足信任；记录可关联的非秘密审计信息与拒绝理由。
2. **凭据/DBA：** 可信 `secrets.resolve` 获取，不在 CLI 参数/进程输出/异常/日志暴露 SQL URL；DBA-owned 函数、`session_user`、schema USAGE + 最小 EXECUTE；Worker 不能调用、Operator 不能 SELECT/DML 中央表；错 role/失效 CA/失效凭据及不可达 SQL 都 fail closed；真实生产配置须独立签收。
3. **恢复顺序：** 原 E01I 先拦截已恢复安装；仅一条 SQL FENCED UNINSTALL，且 `approved_epoch=0`；校验后原 AppManager 卸载、SQL COMPLETE；中途 SIGKILL 之后另进程幂等继续，重启后不能意外恢复 READ；无 fence、DISABLE-only、双待处理、跨 Host/操作重放全部拒绝。
4. **剩余风险不混签：** 跨 Worker 全局安装状态、JSON+PG 双存储非 ACID、postgres.js 3.4.9 TCP 原进程崩溃及 silent blackhole 按独立门禁保留；PA05-05 E01–E05/PA-05 W06 只能由真实 Human/Agent/Provider/数据/浏览器证据签收。

## 4. 排除方案与冲突

- **不采用仅凭 SQL LOGIN 或 `session_user` = Human 授权：** 这是工作负载/数据库调用者鉴别，不回答“谁批准了此次恢复”。
- **不采用调用已经被 E01I 阻止启动的 Host HTTP 或跳过隔离：** 路由不可达；跳过隔离会复活未认证 READ Owner。
- **不采用测试开关、单纯环境布尔值、Agent 声称的 Principal、客户端提供操作 ID：** 缺可信来源或可导致重放；J4F 的 `pending()` 必须坚持由 DB 自发现。
- **不采用宣称 SQL+JSON ACID、自动回装或默认自动修复：** 与旧真实崩溃结果不符，也越过人工维护授权。
- **暂不选择实际 IdP/DBA 执行人员和部署方式：** 需要真实生产身份/授权与配置证据，不能从本次源码推断。

上述“工程验收矩阵/排除理由”为 **ENGINEERING-JUDGMENT**；文件中的函数名和调用顺序为 **GITHUB-ORIGINAL-THIS-WINDOW**；本记录未重新打开 PostgreSQL 官网原文，也未操作 Railway 密钥/生产数据库。

## 5. 交付边界与状态

- 本文档仅为 E01J4G 可信操作员及恢复安全契约核对。**CONTRACT_REVIEW_COMPLETE / IMPLEMENTATION_OPEN / PRODUCTION_NOT_SIGNED**，不增加新的隔离 SQL 通过数。
- 原 E01J2–F 工程 17/17→24/24 保留；完整 E01J4、PA05-05 E01–E05、PA-05/W06 **NOT_SIGNED**，#988/#979/#913 OPEN，production material WRITE OFF。
- 后续工程从**新的 main**、单活动分支/PR 实现并运行受影响真实 PG18 + Host/Provider/Secrets/WRITE/READ + 轻量 Host/Continuity CI，准确 HEAD PASS 才合并；已通过的测试只作自动回归、不另造旧能力。
- 严守范围：不改 Railway、BEX/CP03/Eidos/2D、`project.status.json` 或生成的全局 HANDOFF。生产身份与 DBA 上线配置不能靠这份决策记录获得批准。
