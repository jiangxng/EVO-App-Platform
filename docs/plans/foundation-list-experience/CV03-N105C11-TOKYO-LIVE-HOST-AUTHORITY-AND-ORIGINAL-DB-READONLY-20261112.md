# CV-03 / N1-05c-11 — 东京运行中 Host 真实授权来源 + 原库 PostgreSQL 目录只读盘点

> 2026-11-12；接续 [N1-05c-10 生产切换 Owner 契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)。目的：**用真实运行时有限证据减少 Owner 签署未知项**；不重复已完成的合成 `cv03_n105b_qa` SQL 测试，不接线、不迁移、不放开 SAVE。方案 A、`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403 和未注册 GET 404 不变。

## G 源码、边界与本轮新能力

- 2026-11-12 原文读取 [`manager/server.ts`](../../../manager/server.ts)：实际运行 Host 使用 `APP_PLATFORM_STATE_FILE`（文件/内存），ProviderBinding 从 `APP_PLATFORM_PROVIDER_BINDINGS_FILE` 或生命周期同目录的 `provider-bindings.json` 读取；`resolveAuthorizationProvider` 动态选择有效 Provider；静态授权来自内置规则和 `APP_PLATFORM_AUTHORIZATION_POLICY_JSON` / overlay。`host.static-authorization` 是内建 Provider ID；**Provider 的存在/Feature active 并非 PostgreSQL 授权事实**。
- [`providers/authorization/package.ts`](../../../providers/authorization/package.ts) 明确静态 `authorization.check`、`host-static-authorization-provider.default` Feature ID；它与正式 Saved View 的 `host-enterprise-context-provider.personal-saved-views` 不同。
- [`deploy/tencent-tokyo/compose.yaml`](../../../deploy/tencent-tokyo/compose.yaml) 的东京 `evo` 容器挂载 `/data/platform-state.json`；现有 `postgres:17-alpine`、`evo_dev`、`evo` 管理登录和本机 `evo-data`；`APP_PLATFORM_CONVERSATION_AUTHORITY=POSTGRES` 只证明**对话**使用 PG，不证明 Saved View 授权来源已迁移。
- 新增 [`cv03-n105c11-tokyo-live-authority-readonly.yml`](../../../.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml) 独立 Actions：PR 仅对源嵌入 shell/Node 语法检查；受保护 main + 固定 SSH 主机身份时，检查**实际运行容器**中已有 lifecycle/binding 文件的可用性及已激活静态授权/Saved View Feature 和 auth binding **数量**（不记录任一企业/用户/policy 内容），以及**原 `evo_dev`** 当前 SQL SESSION_USER、database Owner、Owner 是否超管、schema 数量、PG 17 版本与 WAL archive_mode、是否存在非 QA 命名 T0 函数；全程 `BEGIN TRANSACTION READ ONLY` + `default_transaction_read_only=on`。
- 实际 Host 绑定结果仍可能随运行时 Provider 激活和健康变化；读取文件**不能**代表 `resolveAuthorizationProvider` 在一次真实请求中一定选中哪个 Provider。任何计数 0 也不证明所有授权来源均不存在；PostgreSQL 非 QA 函数名检查仅覆盖既有 N105b 函数名字，不覆盖未知命名对象。
- SQL 使用既有 `evo` 管理身份进行目录查询，因此其角色权限**不是**要授权给正式 Producer 的最小权限；不以查询成功认定 signed Host principal。脚本既不输出 env 值、DB 密码、任意 Provider ID、业务对象名/行，也不新增 Docker 文件、PG 对象、HBA、数据库用户、network listener 或容器。

## 验收和现实限制

| 验收 / 证据要求 | 允许得出的结论 | 禁止得出的结论 |
| --- | --- | --- |
| PR 精确 HEAD 源语法与项目 CI 全绿 | 有可复现的只读元数据采集程序，已通过代码检查 | 当前东京 Runtime 或 DB 物理已验收 |
| **main** 触发的 `live-host-and-pg-catalog` 真实 Actions 原始日志含 terminal marker | 既有 Host 容器文件元数据与原库 PG catalog 在当时读得；SAVE OFF、未注册 Feature 未激活 | PA05/Provider 已统一 T0，数据库已上线正式 Schema、生产签名已批准 |
| 原始 PG session 是 `evo` 且 Owner roles 为超级用户 | **当前原库宿主访问具有高权限风险**，Owner 应单独提供生产最小权限 Principal | 可以把 `evo` 超管 SQL 登录直接作为签名 Producer |
| 原始 PostgreSQL `archive_mode` 值 | 实际 WAL archiving 设置的一个片段 | 已证明或否定全部 offsite PITR / backup 体系 |
| Provider file/binding 计数及 Feature active | 当前持久生命周期与 ProviderBinding 的局部拓扑 | 请求路径的动态 Provider 确定身份或所用授权事实源 |

凡主线 Actions 红灯要读取**原始 job log**与实际拒绝标记，不能将绿色 CI 提前当物理证据。纯 docs PR 不会触发东京 runtime 发布；这个只读 workflow 若触发也不会部署镜像。

## Owner 签收输入与下一步（D/P）

- **PA05 + AuthorizationProvider Owner**：以本次文件/Feature/binding 状态为现状输入，逐个决定哪些字段转入真实同一 PG T0，原 FileLifecycleStore 保留哪些**非授权**状态；最终有效 Provider ID 必须由正式 Host/Owner 具名批准并提供签名，不靠静态文件计数推断。
- **DB Owner**：确认实际 `evo_dev` schema、owner、least-privilege SQL LOGIN、T0/Outbox schema、迁移、向后/向前回滚、完整 Scope/tombstone snapshot 和离线恢复 watermark；本脚本无法替代 DDL/GRANT 签收或 PITR 演练。
- **Security/Ops**：正式签名 Producer/KMS/key custody、旧身份撤销、异物理 Host partition、冷启动与事故回滚责任仍待独立证据。
- **Domain Owner**：继续保留现有 Eidos + Platform 行为与 Human/Agent 分主体授权；不触碰 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 的 Owner 受管文档。
- 独立审批和完整 Scope 恢复契约没有取得前，正式 Host T0/AuthorizationProvider 最小接线仍 **BLOCKED**；Issue [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 保持 OPEN。

## 本次来源分级

- **G 已读项目原文（2026-11-12）**：上面的 Host/Provider/Compose、现有东京只读流程 [N105b original DB inventory](../../../.github/workflows/cv03-n105b-tokyo-db-readonly.yml) 和 [N105c 原库 ACL read-only](../../../.github/workflows/cv03-n105c-tokyo-original-db-acl-readonly.yml)。本轮是新的**在运行 Host Lifecycle/Provider + 原数据库 Owner 关联盘点**，并非再次测试 QA Producer/HBA。
- **G 历史引用，未本轮重读原始日志**：PG17 QA、SCRAM、双 Host SQL LOGIN、两 Node OS 进程、原库 ACL/HBA：见 [N105c 详细研究索引](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)。
- **P**：真实生产 schema/Signer、Owner Reviews、完整 Scope/PITR/跨物理 Host 失败注入。此 PR 不新增第三方来源，无外部原文访问等级升级。


## 2026-11-12 N1-05c-11a — 首次合并后物理红灯与安全诊断修复

- N1-05c-11 工作流初版 [PR #1251](https://github.com/jiangxng/EVO-App-Platform/pull/1251) 合入受保护 `main@c288ebe1cc83931ed65c9588073f6505441d991b`。精确 PR HEAD `cac3c09f89210774ddb143b58cf0627ff81d26c8`：源语法、Continuity、Human UI、Lightweight Host SUCCESS，PR 物理 Job 正常 SKIPPED。
- 原始首次 `main` 物理 [Actions #43139984310](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43139984310) 的 `live-host-and-pg-catalog` **FAILURE**（退出 1）。读过 Job 原始日志后只能确认进入远端检测 shell，初版 `proof="$(ssh ...)"` 在远端失败时没有输出已捕获 stdout，**无法准确判断在哪一阶段失败**。不能将这次运行标为业务状态 PASS、SQL 目录核验成功或 Owner signoff。
- N1-05c-11a 仅增强**非敏感阶段** `VERIFY_PREVIEW`、`READ_LIVE_HOST_STATE`、`READ_PG_CATALOG`、`VERIFY_PG_CATALOG` 的 ERR terminal 输出，并标注 Host/SQL 子阶段通过的时点。**不对东京执行 DDL/DML、SSH/HBA/SQL 角色/密钥变更或镜像重新部署**。失败的修复顺序由新的真实日志而非推测决定。
- 此差异是故障可观察性整改，不是 N1-05c-01～08 的重复 QA；任何新的主线只读作业必须重新检查确切 SHA、完整 terminal marker、实际 PG catalog 和 Host 元数据，仍不构成正式数据库授权源。

## 现场证据（合并后由实际 Actions 填写，不能预填 PASS）

- PR：待创建；精确 HEAD CI：待核验。
- main 合并 SHA：待核验；东京实际 Actions：待运行/检查；Branch Hygiene：待核验。
- 不允许以本文件的说明取代实际 Actions 原始日志。

## 2026-11-12 N1-05c-11b — 原库 SQL 元数据格式校验收敛（不是权限变更）

- [PR #1252](https://github.com/jiangxng/EVO-App-Platform/pull/1252) 已合入 `main@b69aad2e64e27af833fe36e5114e6416071e7159`；之前的独立 PR 检查除物理 main-only SKIP 外已全绿。实际东京 [Actions #43140674109](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43140674109) 物理只读 job **FAILURE**，读取原始日志后有阶段证据 `CV03_N105C11_HOST_STAGE_COMPLETED_NO_WRITE` 和 `CV03_N105C11_SQL_READONLY_QUERY_COMPLETED`，终端 `CV03_N105C11_READONLY_FAILURE_STAGE=VERIFY_PG_CATALOG`。**没有成功的完整元数据指纹，更没有生产认证。**
- N1-05c-11b 的针对性改动：PostgreSQL `pg_is_in_recovery()` 与 `rolsuper` 原先以隐式 `||` 字符串化输出，校验假定 `true/false`；现用明确 `CASE ... THEN 'true' ELSE 'false'` 统一表述，**没有更改所查询的字段或 SQL 权限**。对九项 catalog expectation 分别输出固定标识 `CV03_N105C11_CATALOG_<NAME>_PASS/MISMATCH`，不输出未知 Owner 名称/凭据或业务记录；即使还有数据漂移，也能精确识别哪项值需要 Owner 复查。
- 以上是**故障诊断 + 格式兼容修复 D**，并非已证实前次失败一定由布尔值导致；必须以新的受保护主线 Actions 原始日志证明。SQL 依然是 PGOPTIONS read-only + `BEGIN TRANSACTION READ ONLY` + ROLLBACK；Host SAVE OFF、未注册 404、Issue #1212 OPEN 和真实 Owner 审批等待均不变化。

## 2026-11-12 N1-05c-11c — 实际无输入的伪完成根因与修复（G / 非认证）

- 前两次红灯之后，[`#1253`](https://github.com/jiangxng/EVO-App-Platform/pull/1253) 已合并至 `main@95fe71e8a850b760dd1db1dee8c16582a1bb489f`。原始 [Tokyo Actions #43141342020](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43141342020) 显示固定诊断 `CV03_N105C11_CATALOG_ORIGINAL_DATABASE_MISMATCH`，原始 SQL SELECT 语句**未达到真实输出的验证条件**，不可将此次 Job 当作 PG owner 目录事实。
- **关键源码 G 根因**：工作流在通过 shell heredoc 喂入 `node -` 与 `psql` 时使用了 `docker compose exec -T --interactive=false`。Compose 的 `--interactive=false` **关闭被调用进程的 stdin**；两项命令可直接读到 EOF 并以 0 返回，于是原先 `HOST_STAGE_COMPLETED` 和 `SQL_READONLY_QUERY_COMPLETED` 只是包装 shell 的执行进度，**不是 Node/SQL 实际执行成功证据**。这解释首个 SQL catalog 标记完全缺失，亦解释 #1252 观察到的“SQL 子阶段已完成”不能代表 SELECT 的确输出了查询结果。
- 新的 fix PR 移除**仅这两处 heredoc 消费者**的 `--interactive=false`，仍用 `-T` 禁止伪终端；Host 结果先通过实际输出的 `CV03_N105C11_HOST_METADATA_READONLY_PASS` 和 `CV03_N105C11_HOST_SAVE_MODE_OFF_PASS` 才进入 PG；PG 结果要求非空并逐条对比九个查询常量、最终 terminal marker。PR 的源码语法测试也防止把 `--interactive=false` 重新引回。SQL 仍具有 `PGOPTIONS default_transaction_read_only=on` + `BEGIN TRANSACTION READ ONLY` 双重只读边界。
- **不应抹掉旧失败**：#43139984310、#43140674109、#43141342020 均保留 RED 状态，不能追认其 Host/SQL 元数据已验证。真正的物理 G 必须来自此修复合入后新的 protected-main 原始日志；本次不更改正式 Provider、PG Owner/Producer、HBA、业务数据或 SAVE 状态。
