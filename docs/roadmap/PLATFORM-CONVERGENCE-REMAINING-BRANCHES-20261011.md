# EVO App Platform 非 Agent / 非 2D 旧分支：逐条功能收敛矩阵

> 审查日期：2026-10-11；main 核查基准 56063b50802697fcbdddf772683a4b9d174907ba。
> 不包含 Agent、EOG、2D Designer、投影视图相关分支。属于“原先剩余的 30 条非专项功能分支”的功能范围矩阵，**不是实时 Git 分支列表**。参见 [入口](./PLATFORM-CONVERGENCE-WINDOW-HANDOFF-ENTRY-20261011.md) 与 [决策/缺口](./PLATFORM-CONVERGENCE-DECISIONS-GAPS-20261011.md)。

## A. 已完成可复核的功能收敛：16 条源分支

| 原源分支 | 当前的功能结论 | 主线 PR 与测试证据 | Git ref 状态 |
|---|---|---|---|
| feature/template-store-actions-v0.1 | 只恢复缺失的模板版本 ID codec，拒绝 malformed number；Seed/持久化用新版 | [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716)，tests/protocol/template-store-identity-convergence.test.mjs | 原 SHA 已纳入 main ancestry；待安全删除 refs |
| fix/template-store-copy-authorization-v01 | copy-action 内容已相同；新版静态授权 Rule ID 保留，不重引旧政策 | [#716](https://github.com/jiangxng/EVO-App-Platform/pull/716) | 同上 |
| feat/cp03-atomic-bulk-import | 新版 commitPreparedRows 原子事务已包含旧目标语义；不回退到 commitBatch | [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717)；tests/protocol/cp03-bulk-import.test.mjs | 同上 |
| feat/cp03-xlsx-human-import | 旧 2048 列保护/行限/多余数据列校验已移植，保留新版 ZIP decoder | [#717](https://github.com/jiangxng/EVO-App-Platform/pull/717)；tests/protocol/cp03-xlsx-resource-guards-convergence.test.mjs | 同上 |
| fix/login-assets-binary-v02 | 中间 base64 staging 不再是当前生效资源，最新版 PNG 检测与 skin 分离 | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| fix/login-assets-valid-binary-v01 | 中间分片不回主线，测试实际现存 PNG | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| improve/login-assets-cache-revision-v01 | rev 参数已存在于新版，新增 URL encoding 验证 | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| improve/login-assets-real-binary-v01 | 现行背景 PNG blob 与该旧版一致，当前 logo 路径保留 | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| improve/login-final-reference-v03 | 旧设计稿不覆盖当前中文 TUGE 标题、背景和双皮肤 | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| improve/login-final-tuge-v03 | 保留当前用户认可后续改进；旧蓝底 CSS 不是权威 | [#719](https://github.com/jiangxng/EVO-App-Platform/pull/719) | 同上 |
| feat/ea2b-ledger-capability-operations-20260930-v2 | 已由独立 package-owned capability-action-handlers.ts / capability-operations.ts 承接 | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721)；tests/configurator/capability-operations.test.mjs | 同上 |
| integration/evo-explicit-runtime-scope-proof | 当前跨项目工作流、EVO public API 及 enterprise auth 更完整；旧 scope 行为不回退 | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) | 同上 |
| integration/evo-runtime-observation-adapter | 使用当前 enterpriseId Observation typed contract，不恢复 scopeKey | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) | 同上 |
| fix/template-store-eidos-compliance-v0.1 | 当前 catalog-browser/detail + Eidos renderer 版本更新；新增跨模块回归，不替换 vendor CSS | [#721](https://github.com/jiangxng/EVO-App-Platform/pull/721) | 同上 |
| tr01/purchase-receipt-reversal-app-20261010 | 当前 Purchase/Receipt REVERSES lineage 与 fail-closed 验证更完整 | [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722) | 同上 |
| tr01/purchase-receipt-reversal-a2-20261010 | 主线已有 A2 逻辑和测试；原候选验收文档完整归档，另加 contract regression | [#722](https://github.com/jiangxng/EVO-App-Platform/pull/722) | 同上 |

上表“同上”指源提交历史已并入 main、**原 branch ref 删除尚未最终证明**。此前历史 Branch Hygiene 后续因 GitHub API 限额失败；后续如有并行清理成功，应以最新 branch 枚举核对。

## B. 仍有独立功能差异，尚不能整支合并/删除：14 条 TR-01 B2D3 系列

此处 14 条是最初 30 条中的剩余独立开发线，许多是 [PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 所在核心分支的后代；它们的 Git history 复杂、权限与 Host Core 修改面大。依据：GitHub compare main 与各 branch，及 compare 原 Host owner base 与这些 branches。这里记录的“内容类型”主要来自**Git compare 文件名单 / PR 元数据**，**不等于已完成逐函数安全审计**。

| 原始分支 / 阅读状态 | 由文件差异观察到的主题 | 建议独立验收动作 | 处理条件 |
|---|---|---|---|
| feat/tr01b2d3-host-owner-delegation-20261010 / PR #594，元数据 | 核心签名 Host delegation + Finance Owner + Postgres HTTP；含 manager/server.ts 和 Provider 等大面积代码 | **首要 P1**；分拆身份/签名/会话/租户与 finance owner owner check，审查 DENY，最小变更 CI | Draft 暂留；没有认证/授权/跨实例拒绝验证前不能并 |
| feat/tr01b2d3-definer-owner-strict-admission-20261011 / compare | 严格 owner/admission 判定、Deployment/Scope gate | 与 #594 提取独立严格拒绝测试 | 最小 PR，拒绝权限绕过 |
| feat/tr01b2d3-deployment-descriptor-gate-20261011 / compare | 部署描述符、验证门 | 是否与现有 Railway 环境约定冲突？ | 仅保留真正与运行 owner 配置相关的约束 |
| feat/tr01b2d3-finance-owner-prod-preflight-20261011 / compare | finance owner preflight | 术语 production 改为测试/准入证据，安全验证优先 | 不把预生产或演示 PASS 当生产事实 |
| feat/tr01b2d3-six-lane-production-admission-20261011 / compare | 六阶段 admission 和 private TLS probes | 列出每个 lane 的显式前提/实际证据 | 验证 Host/DB/EVO owner 权限闭环 |
| feat/tr01b2d3-twelve-lane-preprod-20261011 / compare | 十二阶段 gate / extra probes | 对比 six-lane，合并有用验收准则，去掉重复 | 不追加名义测试阶段、不得改投产环境定义 |
| feat/tr01b2d3-four-peer-business-plugins-stage-20261011 / compare | Sales/Shipment/Receivable/Cash package，catalog/manager 旧安装注册 | 与 main #703 六个独立 stage 包逐项比较 | 只收真正未实现的插件安装/生命周期，不重引 synthetic 的硬编码 |
| feat/tr01-trading-peer-purchasing-receiving-20261011 / compare | 六插件 Purchasing/Receiving 扩展与旧主线分支关系 | 先对比 main #703 和子 PR #698 的实际新旧 package blobs | 现行 package UI/权限无退化后才收敛 |
| demo/tr01b2d3-isolated-live-stage-20261011 / compare | demos/tr01b2d3-isolated-stage 的 HTML / Railway Function / static demo + 测试 | 判断是否仅 Demo 或可提升为重复可部署 E2E harness | 不新增生产架构服务，不把静态 demo 当正式 App Host |
| docs/tr01b2d3-mainline-recovery-20261011 / compare | 文件清单显示除了 docs 还带 Host/finance owner/Trading stage 等代码 | 提取确有独立价值的实证资料；代码与当前 main diff 逐文件核对 | 不因命名 docs/ 就整支合并/删除 |
| docs/tr01b2d3-railway-runtime-preflight-evidence-20261011 / compare | Railway preflight 证据连同财务接入旧树 | 证据与实际 Railway service/commit 对齐 | 不能抄旧生产/环境命名当新的认证 |
| test/tr01b2d3-cross-instance-nonce-revocation-race-20261011 / compare | 跨实例 nonce、撤销 race 检查工具 | 单独复跑对共享 Postgres/真实 HTTP 的冲突测试 | fail-closed 且可再现 |
| test/tr01b2d3-distinct-db-login-http-20261010 / compare | 独立 DB 身份及登录授权 HTTP | 认证成功与错误租户 DENY 都测，不能复用测试钥匙 | CI 配额/真实运行条件受控 |
| test/tr01b2d3-isolated-finance-owner-credential-http-20261011 / compare | 隔离 finance owner 凭证和 HTTP | 验证签名凭据作用域、旋转、隔离、回收和日志无泄漏 | 不读取或硬编码真实 secret |

### 关键祖先关系（2026-10-11 compare 时点）

除 demo/tr01b2d3-isolated-live-stage-20261011 对主 Host owner branch 为 diverged 外，其余上述大部分 TR-01 分支相对 feat/tr01b2d3-host-owner-delegation-20261010 呈 ahead，说明共同依赖大体量的**未入 main 的权限/finance owner 基底**。因此“直接把 14 条合成一个”不是 14 个独立小功能，而更可能意外一次性引入同一套未审核 Host 安全核心。**新窗口必须以 main 为单独基线，先拆出依赖图与最小功能契约。**

最少核查的对应文件（都来自 compare 或已知主线目录，不表示本窗口已阅读全文）：
- manager/server.ts / catalog/seed.ts：避免交叉覆盖 Agent、EOG、登录主线。
- apps/trading-reference/finance-owner-remote.ts、finance-owner-key-pointer.ts
- providers/trading-finance-owner/package.ts
- tools/certify-tr01b2d3-cross-instance-races.mjs、distinct-db-logins.mjs
- .github/workflows/cross-project-tr01b-sales-evo-postgres.yml
- demos/tr01b2d3-isolated-stage/index.html、static-demo.mjs
- tests/protocol/tr01b2d3-* admission、signing、private TLS probe

## C. 新窗口需要的“合并一项就删一项”流程

1. 从最新 main 创建功能独立分支；记录老分支 exact original head 与 merge base，比较公共代码和所需新增代码，不以 Git commits 数当功能差异。
2. 从源头拣选**可验证新增行为**，不恢复已被主线取代的 manager/server.ts、Eidos/Catalog 或旧 project.status.json。为真实权限测试准备 fail-closed 用例。
3. 小 PR 运行 Platform CI、Continuity CI 和相关插件/跨仓库/Postgres/浏览器专项；CI PASS 不等于公网 Human PASS。
4. CI 验证通过合并 main；保留原 source history 的可追踪 SHA/归档证据；确认 source branch 没有开放 PR head/base 依赖。
5. 使用 GitHub refs 幂等清理：固定旧 SHA、compare main ancestor、确认不受保护且未发生移动、限额与中途冲突可恢复、保护 Agent/2D；删除后复核 branch 枚举和运行日志。
6. 只有部署到既定公网集成测试 Host 并证明目标 SHA 与网页实际功能一致，才称在线验收完成。

注意最新已知 [Branch Hygiene 失败 run](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38113793947) 与功能 CI 成功同时成立。切忌为了赶进度直接执行无约束批量删除。

## D. 平行工作不可碰

- Agent：agent/*、docs/personal-agent*、docs/external-agent*、feat/external-agent*，以及已打开的 Agent PR。
- 2D/EOG/Projection：eog/*、feat/eog*、feat/2d*、feat/diagram*、docs/diagram*、architecture/sop-designer*、所有投影设计器与用户正在验收的 PR。
- 仓库之外的 EVO / Eidos：未经所属窗口审查的改动不要暗中混进 Platform 收敛 PR。
- 用户源品牌 TUGE Logo / 背景、实际 Railway 数据卷与数据库：不因清理分支而修改或删除。

**完成定义：**待办对象不仅是把剩余 14 个分支删除，而是逐个确认该功能在现代 main 能被真正安装、使用、授权、跨项目调用；实在没有价值的旧变更需留下明确“为何被更优当前实现覆盖”的证据，才可安全退休。


## 2026-10-11 新窗口：16 条历史 source ref 逐条安全审计（未删除）

审计定点 main `48e12e495abde9607ae413eab126f263c3d8aef6`，GitHub REST branches 返回 65 个 branch，开放 PR 集合为 12 个。**下表 16 条均仍存在、不是开放 PR 的 head/base**。每项直接调用 GitHub compare（base=旧 head SHA、head=该 main）返回 `status=ahead`、`behind_by=0`、`merge_base=旧 SHA`，故源提交是 main 的祖先。它们属于五个之前合并的功能级 PR 已审查过的源分支，不属于 Agent/2D。

| 原分支 | 2026-10-11 实时 ref SHA | compare ancestor | 清理进度 |
|---|---|---|---|
| feature/template-store-actions-v0.1 | f32e07698a0b54c72ca65fb3c81d36fed3551d0c | 是 | 待删除 |
| fix/template-store-copy-authorization-v01 | d36659c052f1281b7d33f9f30c8bef69f2907ffb | 是 | 待删除 |
| feat/cp03-atomic-bulk-import | 8fc2247ae40b1422a25f71e00471d5020cc7a343 | 是 | 待删除 |
| feat/cp03-xlsx-human-import | d0ef6f1c8b47716f35f4da26dd2f9d500e36c93d | 是 | 待删除 |
| fix/login-assets-binary-v02 | 4cd090be941219f95a26288ce8298dad4dcf77a0 | 是 | 待删除 |
| fix/login-assets-valid-binary-v01 | 844583709268ef09f0ed9282ebfe10dd415495b3 | 是 | 待删除 |
| improve/login-assets-cache-revision-v01 | 771e194f3b6c706e43fdaeb750d15f05317a8047 | 是 | 待删除 |
| improve/login-assets-real-binary-v01 | 9a1a14d9bb074bf56ff940217261295b1ea1bba9 | 是 | 待删除 |
| improve/login-final-reference-v03 | 8c2f70962bd231b6c749b00bfaf25986de8b3dcc | 是 | 待删除 |
| improve/login-final-tuge-v03 | 50e3768acede4060c02c90d029e6fa256b3c803c | 是 | 待删除 |
| feat/ea2b-ledger-capability-operations-20260930-v2 | 0cb910386a2e8c91584d7283c210127dc81b1e91 | 是 | 待删除 |
| integration/evo-explicit-runtime-scope-proof | 18db6c1744b4ad20ea44c46cde513b1c6728638e | 是 | 待删除 |
| integration/evo-runtime-observation-adapter | 2f939dc67a4bfbd30aac8bff2a0ca003b608daf7 | 是 | 待删除 |
| fix/template-store-eidos-compliance-v0.1 | ecf196d2c439a1ead243f7d13a3e94a449bf2e09 | 是 | 待删除 |
| tr01/purchase-receipt-reversal-app-20261010 | 81fcc46f4a3888b0107641c7bac5d58a3e19311b | 是 | 待删除 |
| tr01/purchase-receipt-reversal-a2-20261010 | b3163293f1bc203319d3a8bab9906b20d57bfda1 | 是 | 待删除 |

安全条件：实际删除时须重新读取精确 ref SHA、开放 PR head/base 和 main ancestry，且有 archive/provenance；预案 PR #728 的 workflow 是手工默认 audit，不能将本表当成执行记录。**本轮没有实际删除任何历史源 ref**。


## 2026-10-11 后续执行：历史源 ref 删除复核结项

本文件 A 部分表格原写“待安全删除”，属于**执行前的历史快照**。实际已在 [PR #740](https://github.com/jiangxng/EVO-App-Platform/pull/740) 经一次性 SHA 固定工作流合并和执行，先审计 [#38140337021](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140337021) SUCCESS，再正式执行 [#38140393664](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140393664) SUCCESS；随后逐条查实 A 部分 **16/16 Git refs 不存在**。故 A 表的“待删除”已经被本节状态 **DELETED_VERIFIED** 取代。Git 分支总量在该验证时点为 **54**，不能拿它代替独立功能待收敛数。

B 部分约 14 条 TR-01 B2D3 分支（包括 #594）**完全未动、未删**。各 Agent / 2D / EOG 与 open PR head/base **完全未动、未删**。#728/#731/#736/#740 等 squash 合并头与 main 历史 diverged，不能只按 `behind_by=0` 认定可删。后续需要独立功能评估、PR CI、主线合并及安全 refs 处置，Railway 测试 SHA 保持固定。


### 2026-10-11 剩余 14 条 TR-01 真实 compare 复查（不得按 Git 数量删除）

对最新核查基线 `ab8de6d3942d2905205061e079daa0086d55fccb`，再次调用 GitHub compare(main...source)。这 14 条全部返回 `diverged`，并非 main 的祖先；主线相对其共同分叉点领先约 196 commits，旧分支各含 57–132 个自有 commits（其中许多继承同一未验收 B2D3 Host 基底）。**此处是 commit 结构事实，不代表这 57–132 个都是真正独立产品功能。**

| 旧分支类型 | 分支数 | 本轮处理结论 |
|---|---:|---|
| Host owner #594 + 授权/admission/deployment/finance safety 派生 | 6 | 仍需严格身份/签名/租户/nonce/真实 Host 测试，不能整支覆盖 main |
| 六插件 peer / stage | 2 | 主线 #703 + #731 已有六包及公网 synthetic 预览；旧 UI/契约差异未按文件逐项结案 |
| TR-01 B2D3 test-only 命名的隔离/跨实例/独立 DB 验证 | 3 | compare 实际涉及 Host/Finance 代码，不能因叫 test/ 就删除 |
| docs/ 命名的 recovery/preflight | 2 | compare 实际带 Host/Finance 代码，仍需逐文件考古与证据归档 |
| demo/ 独立静态演示 | 1 | 只能讨论是否归档为 harness，不等同于真实用户业务 App |

优先级：复核 #594 的真实安全授权边界和跨实例 proof，逐功能抽最小 PR；不能让分支清理逆转已部署给用户测试的 `89320e11` Railway pinned SHA。最近 squash 合并的 #728/#731/#736/#740 对 main 的 compare 也是 `diverged`；无论功能是否已在 main，都不能通过本次 ancestor-only 删除器误删。


### 2026-10-11 第二批 squash PR heads 清理结果

在上述 16 条祖先分支清理后，本专项又把 5 条已 squash 合并、因此与 main `diverged` 的独立专项 PR head 采用**另一项安全判定**：PR 已真实 merged、精确 mergeCommitSha 在 main ancestry、原 head SHA 未移动且无任何开放 PR 使用，才可删。预检 PASS、[PR #743](https://github.com/jiangxng/EVO-App-Platform/pull/743) 合入、执行 [run #38140857767](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38140857767) SUCCESS，重新枚举 **5/5 refs 已不存在**：

- `fix/platform-branch-hygiene-leased-20261011`（原 PR #728）
- `feat/tr01-six-stage-host-preview-discovery-20261011`（#731；原公网测试 deployment 保留，因为其 main SHA 仍可访问）
- `fix/tr01-finance-signer-pointer-fd-20261011`（#736）
- `chore/retire-verified-platform-source-refs-20261011`（#740）
- `docs/platform-convergence-cleanup-results-20261011`（#741）

这两批累计 **21 个 Git refs 实际删除**，第二批执行后仓库总分支 **52（时点数，可随并行窗口变化）**。约 14 条 TR-01 B2D3 独立功能分支、所有 Agent/2D/EOG 和 open PR 使用分支仍受保护，不得继续按历史数量直接删。
