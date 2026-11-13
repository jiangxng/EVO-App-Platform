# EVO-App-Platform / Window10 研究资料、原始网址与决策索引（2026-11-13）

> **配套简短入口**：[Window10 研究接续](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md)。本索引是 **2026-11-13 本窗口已经实际使用的资料增量**，不是重新搜索全网或重做前面 86K 字历史研究。核验基线 `main@dfc04e3321658cf0924a984bb66e8c5682adeea2`，之后每个新窗口重新验证 ref 与时间敏感状态。此前 [Window09 原始研究](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)、[Window10 #01–#07 工程证据](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md)、[恢复增量](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md) 均保留为独立文档；本文仅补网络来源的证据等级、冲突与实施映射。

## 1. 来源/认识论分层（新窗口必须保留）

- **A｜本窗口已读原文**：GitHub `fetch_file` 返回的具体源码、Markdown、工作流、回归用例及其 Blob SHA。能证明“仓库里该 SHA 的文本”，不能证明“运行时已执行该版本”。
- **B｜直接获取的原始结构/执行记录**：GitHub REST 的 ref/PR/Issue/Review/Check Runs/Actions Job stdout，以及连接 Railway 工具的 read-only Service/Environment/Deployment 配置。**直接控制面只读 ≠ 真实 Operator 签字**；GitHub Job 成功 ≠ 实际 Tokyo SSH 当前状态。
- **S｜仅搜索摘要/页面入口**：Railway 官方 GitHub Autodeploy 页面、其章节候选、Railway Central Station 问答、Railway GraphiQL 网页入口。上轮尝试获取 Railway 官方正文失败 `pageFound=false` 或 text/markdown 格式不可读；本窗口**未真实登录打开 GraphiQL、未执行账户受权 live GraphQL**。不可把索引摘录升级成已读原文。
- **U｜未获得或未验证**：有效 Autodeploy `enabled`、实际 drain/overlap/PID1/历史消费者/备份；真实生产 AuthorizationProvider 权威/PG DBA 最小权限/KMS/Signer/双物理 Host、#1212 独立签署。绝不编造通过、时间或截图。
- **C｜用户明确要求**：连续实际推进、独立分支/PR、CI 验证与交接、源证等级、复用 Eidos+Platform、生产独立审批。属于目标/约束，不是产品上线证明。
- **D｜工程判断**：当前采用/排除方案及下一步次序。任何 D 都不应冒充 A/B 或真实 Owner 的批准。

## 2. 本窗口网络公开参考资料（特别保留原始 URL 与是否阅读正文）

| 序号 · 查阅日 | 标题 / 原始网址 | 状态 | 主题、实际获得的关键发现（G） | 项目具体用途 / 边界 |
| --- | --- | --- | --- | --- |
| N01 · 2026-11-13 | **Railway Docs — Controlling GitHub Autodeploys**；https://docs.railway.com/deployments/github-autodeploys | **S · 仅搜索摘要/文档入口**；之前通过 Railway `search_docs` 找到标题和章节，`fetch_docs` 未成功获得全文；恢复窗口的网页 direct-open 亦受资源格式阻碍 | 搜索结果中出现 GitHub Source 部署联动、Autodeploy Disable/Enable 管理的章节线索；Repo/Branch 仍连接**不能推出**某一服务当前 `enabled=true`，Wait for CI 是另一类设置。未独立读全页、未验证账号真实状态 | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) Operator 检查清单和危险误推断的排除；**不**写服务的开关值 |
| N02 · 2026-11-13 | **Railway Docs — Disable Automatic Deployments**（同一文档的章节锚点）；https://docs.railway.com/deployments/github-autodeploys#disable-automatic-deployments | **S · 仅章节索引/摘要**（不是第二次读到了全文） | 存在专门说明自动部署停用的章节线索；当时没有从服务控制台读取生效值/继承关系 | 供 Operator 查明服务级/环境级有效配置，按现行产品 UI/Schema 实测，不凭旧文档照抄操作 |
| N03 · 2026-11-13 | **Railway Central Station — Public API field for Automatic Deployments**；https://station.railway.com/questions/public-api-field-for-automatic-deploymen-f058a664 | **S · 搜索结果问答摘要**；没有验证为当前实际 schema 的可执行合同 | 搜索片段提示 GraphQL 字段 `serviceInstanceAutoDeployStatus`，候选参数 `projectId, environmentId, serviceId`，响应候选字段 `enabled, canEnable, reason`。这只是定位 read-only 查询的线索，参数类型、权限、版本和实际值均未在本项目 live API 验证 | 在 #1092 提出由真实 Operator 通过受权 GraphQL **只读**查询并提供时间/作用范围/真实值；不可自行执行 mutation 或把候选 GraphQL 当源证 |
| N04 · 2026-11-13 | **Railway GraphiQL**；https://railway.com/graphiql | **S · 候选官方查询入口链接**；**未在本窗口登录查询、未确认 schema** | 可供 Operator 验证 N03 的字段和实际环境值；没有任何本项目的查询返回字节 | Operator 可使用已管理的身份验证方式；不要在公共 Issue 放 token、cookie 或配置秘密 |

**不是本窗口已读的新网页**：未浏览或下载外部截图、未独立读取旧 Railway 卷/数据库、未访问生产 UI 的真实授权会话、未获得实际 Autodeploy `enabled` 值。以上四条只按 S 级保留；**不能凭 URL 的存在推定页面正文已阅读或内容始终不变**。原始问答/页面如失效，先查 [#1092 完整搜索线索和观察日志](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6844353274)，同时保留本索引的文字摘录及日期。

## 3. 本窗口直接查阅的 GitHub 项目来源及不可变执行原证

| 编号 · 查阅日 | 标题 / 原始来源 URL | 状态 | 主题与关键证据（G） | 当前用途/模块 |
| --- | --- | --- | --- | --- |
| G01 · 11-13 | **Protected main + PR #1306 recovered context**；https://github.com/jiangxng/EVO-App-Platform/pull/1306；https://github.com/jiangxng/EVO-App-Platform/commit/f770b19d86b1b02f50ed2343a3df19e09979886d | **B · PR/ref 直接读取** | 旧聊天恢复增量入库，原始研究与用户要求分层；是本轮继续工作的起点 | `docs/plans/foundation-list-experience/CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md`；后续 PR 不能把历史聊天摘要改写成不存在的逐字聊天 |
| G02 · 11-13 | **Railway Operator task #1092**；https://github.com/jiangxng/EVO-App-Platform/issues/1092；[本轮 read-only 证据评论](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6844353274) | **B · Issue/评论直接读取** | 五旧服务在该观察时点 `offline` / active deployments 0 / pendingWork 0；EVO Runtime Source 仍 `jiangxng/EVO@main`，Ledger Configurator Source 仍 `jiangxng/EVO-App-Platform@main`；Runtime 有历史 `node dist/scripts/migrate.js` 预部署命令，未获有效 Autodeploy 值 | PA05/K0 R5-01~03、Railway 退役前的 Operator 真实签字；**不可误认已关闭自动部署** |
| G03 · 11-13 | **CV03 N1 production Owner task #1212**；https://github.com/jiangxng/EVO-App-Platform/issues/1212；[本轮源码核验评论](https://github.com/jiangxng/EVO-App-Platform/issues/1212#issuecomment-6844429680) | **B · Issue/评论直接读取；A · 关联源文件已读** | `OPEN / PENDING OWNER SIGNOFF / N1=NOT_CERTIFIED`；五个已勾 checkbox 只是决策项；无独立具名批准凭据 | 冻结 CV03 Human SAVE 与 CV04 正式后台 EXPORT；Owner 真实审批材料入口 |
| G04 · 11-13 | **并行 Owner 文档 PR #1184 + Reviews REST**；https://github.com/jiangxng/EVO-App-Platform/pull/1184；https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls/1184/reviews | **B · 元数据与 Review API 直接读取** | 本窗口末再次读到 PR OPEN/未 MERGED，Review 列表长度 0 | 不修改其管理的三份 Owner 文档；不得将其状态或 Issue checkbox 当正式 Owner 签字 |
| G05 · 11-13 | **CV04 Owner trigger parity** [PR #1307](https://github.com/jiangxng/EVO-App-Platform/pull/1307)；[最后验收](https://github.com/jiangxng/EVO-App-Platform/pull/1307#issuecomment-6844618248) | **A · workflows/tests 已读；B · PR/Actions Job 原始记录** | CV04 `pull_request`/main push 13/13，防漏触发测试加入无路径过滤的 Continuity | `.github/workflows/cv04-next05-owner-source-release-gate.yml`、`.github/workflows/project-continuity.yml`、`tests/protocol/cv04-owner-release-workflow-paths.test.mjs` |
| G06 · 11-13 | **CV03 Owner trigger parity** [PR #1308](https://github.com/jiangxng/EVO-App-Platform/pull/1308)；[最后验收](https://github.com/jiangxng/EVO-App-Platform/pull/1308#issuecomment-6844787906) | **A/B · 源/测试/原始 Actions** | CV03 main 7 漏检路径修正为 PR/main 14/14，PA05/AuthorizationProvider 主线变动负例能阻断 | `.github/workflows/cv03-n105c09-owner-release-evidence.yml`，同一个 Continuity 测试 |
| G07 · 11-13 | **Transitive Owner dependencies** [PR #1309](https://github.com/jiangxng/EVO-App-Platform/pull/1309)；[最后验收](https://github.com/jiangxng/EVO-App-Platform/pull/1309#issuecomment-6844999486) | **A/B · 源/测试/原始 Actions** | CV03 16/16、CV04 24/24，按实际工具导出的源码依赖清单检查；**两侧同时删路径**也 RED，原始 Continuity 7/7 | 已有三条门禁工具导出 `SOURCE_FILES` 列表 + Continuity 防回退，后续不重复造框架 |
| G08 · 11-13 | **Comment-spoofed safety anchors** [PR #1310](https://github.com/jiangxng/EVO-App-Platform/pull/1310)；[最后验收](https://github.com/jiangxng/EVO-App-Platform/pull/1310#issuecomment-6845213440) | **A/B · 源/测试/原始 Actions** | 原 `includes()` 可被 `/* guard */` 注释伪造；新 `maskJsTsSourceCommentsV010` 对安全正面证据过滤注释；CV03 对抗测试 7/7、CV04 6/6，通过 CI。**词法**非 AST/物理证明 | `tools/cv03-n105a-authority-boundary-preflight.mjs`、`tools/cv03-n105c09-owner-evidence-release-gate.mjs`、`tools/cv04-next05-production-authority-release-gate.mjs`；原 CV03/CV04 测试 |
| G09 · 11-13 | **Window10 #07/07 final handoff** [PR #1311](https://github.com/jiangxng/EVO-App-Platform/pull/1311)；[真实终态评论](https://github.com/jiangxng/EVO-App-Platform/pull/1311#issuecomment-6845407187) | **A/B · 交接文件已读、GitHub 原始 CI/Job** | 受保护 `main@dfc04e3321658cf0924a984bb66e8c5682adeea2`：3 SUCCESS + 1 预期东京 deploy SKIPPED；保留旧提交上后来出现的额外 `Continuity CANCELLED` 记录、原始成功记录及因果未知 | [Window10 工程事实入口](CV04-WINDOW10-20261113-0707-FINAL-HANDOFF-ENTRY.md) 和 [完整工程索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md) |
| G10 · 11-13 | **东京 Preview 真实发布与跳过**；[实际 Deploy Run #43355000425](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425) / [Deploy job #131655719480](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43355000425/job/131655719480)；[本窗口 Docs Run #43374774456](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43374774456) / [preflight job #131718588035](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43374774456/job/131718588035) | **B · 原始 Actions Job 日志（此前窗口已读真实部署、当前本窗口重读 docs skip）** | 已由真实部署日志证明的 GHCR `b58e660fdc01f98e0840247115f7ca3b8c43c0b3`；Docs Run 原始 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=dfc04e3321658cf0924a984bb66e8c5682adeea2`，没有本轮新镜像。未重查当前 VM 容器 hash | `.github/workflows/evo-tokyo-dev-deploy.yml`、[东京权威说明](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md) |
| G11 · 11-13 | **Window09 Railway archive and existing source provenance**；[Window09 research index](CV04-WINDOW09-20261113-RESEARCH-DECISION-REFERENCE-INDEX.md)、[archive README](../../archive/railway-live-production-proof-actions-20261113/README.md) | **A · 文档原文在前窗口已读；本窗口用已存索引，不冒充重新逐文件校验** | 十份旧生产浏览器 Workflow 完整归档、7 CLI 需要显式 HOST、191/191 活动 Actions 的先前扫描；本窗口没有重新哈希十份 YAML 或重新跑 191 文件全扫描 | 避免历史 Railway 自动工作流复活与误导性旧链接，不重新做已经收口的 #1300–#1305 |

## 4. 易变信息的足够复核材料：Railway 服务、Query、章节与日志

### 4.1 Railway 只读服务快照（B / 2026-11-13 本轮 #01；**不是未来实时值**）

- 项目 `EVO Ledger Runtime MVP`：projectId `aee4643e-912b-4ca1-ae95-fe4ec64f5601`；production environmentId `98b8b20c-d791-4073-a11d-bb1f7f0a1cb3`。
- Ledger Configurator：serviceId `a8622238-480e-4da3-be6f-60fd0f3e18db`；GitHub Source `jiangxng/EVO-App-Platform@main`；曾附卷 `ledger-configurator-state`。
- EVO Runtime：serviceId `4ab51d1b-ea96-4c61-8d91-a65547bda049`；GitHub Source `jiangxng/EVO@main`；`preDeployCommand=["node dist/scripts/migrate.js"]`。
- PostgreSQL：serviceId `11b37b3b-3ad6-4967-817c-83f232ffba16`，卷 `postgres-volume`；App Host Validator：`3e8fe409-83bb-4e37-9a25-69d341cac92b`；Experience Compiler：`472c1e8d-94ff-4e58-8bb0-bb06e6efe8b1`，卷 `experience-compiler-state`。
- 五服务连接器观察 `offline`，`activeDeployments=[]`，`pendingWork=[]`；无 staged patch。配置里 `checkSuites:false` 不等于 `Autodeploy OFF`；保留旧 Source ≠ `Autodeploy ON`；多个卷仍挂载 ≠ 已确认安全可删除。
- **冲突时序**：#1092 在 2026-10-21 创建时记录当时部署 Online/单实例；本窗口 2026-11-13 观察 Offline。**不同日期不同来源快照，并非互相排斥**；需要 Operator 新一次读控制面并签收。

### 4.2 S 级候选只读 GraphQL 查询（非本窗口执行过的 API）

从 N03 搜索摘录得到字段名称及选择集线索，供真实 Infra Operator **在自己的受权账户下检查现行 Schema**，不要当作完成执行的脚本：

```graphql
query ReadAutodeploy($projectId: String!, $environmentId: String!, $serviceId: String!) {
  serviceInstanceAutoDeployStatus(
    projectId: $projectId
    environmentId: $environmentId
    serviceId: $serviceId
  ) {
    enabled
    canEnable
    reason
  }
}
```

**注意：变量类型 `String!` 也只是未验证的候选模板**，必须先核对真实 GraphQL schema、受权作用域、项目/环境/服务身份和返回值。对 Ledger Configurator 与 EVO Runtime 的两个准确 serviceId **分别读取**；含错误/权限不足不等于 `enabled=false`。将 `UTC observation / original source / effective value / canEnable / reason / reviewer+role / impact / rollback owner` 以不含密钥的收据附回 #1092，绝不直接进行 `mutation`、断开 Source、重启服务、执行迁移或删除卷。

### 4.3 Actions/历史证据可复核位置（B，避免虚构截图）

| 事件 / 原始位置 | 可保存的最小证据与限制 |
| --- | --- |
| #1307 Main Tokyo [Run 43368973317](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43368973317) | preflight SUCCESS / deploy SKIPPED；原始 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE` |
| #1308 Main Tokyo [Run 43370198550](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43370198550) | 同上 |
| #1309 Main Tokyo [Run 43371738697](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43371738697) | 同上 |
| #1310 Main Tokyo [Run 43373385491](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43373385491) | 同上 |
| #1311 Main Tokyo [Run 43374774456](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43374774456) | 2026-11-13 原始 preflight 末尾有 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=dfc04e3321658cf0924a984bb66e8c5682adeea2`，deploy Job SKIPPED；完整终态见 #1311 最终评论 |
| 原始履历/截图、附件 | 本窗口**没有**生成 Railway Console、东京 SSH、业务真实授权的截图或附件；不存在可以安全推断的 sandbox/仓库截图路径。原始 GitHub Job 与 Issue 评论是持久证据入口，历史截图若有只从已存原索引查，未在本窗口重读图像 |

**后续重复访问提醒**：GitHub Actions 原始日志/Job 可能因保留期与权限变化无法永远读取；本索引保留了不可变 Commit/Run/Job ID、明确 marker、各 PR Final 评论作为备份摘录。不能在本窗口声称创建了日志 ZIP、截图或 Artifact 附件。

## 5. 方案比较：采纳、排除、条件、局限（D；事实 G 另按上表取证）

| 方案问题 | 选择（D）与原因 | 不采用的方式及原因 | 适用/解除条件 |
| --- | --- | --- | --- |
| 列表与 AI Native 架构 | **采用既有 Eidos + Platform + Domain Owner + Host ActionRouter + Personal Agent**；已有客户/供应商/字典多视图、详情返回状态、Agent/Human READ 和当前页 CSV，避免平行 Owner | 排除另建列表/Agent 框架、绕开已有 Host 权限的业务私有 API；否则统一撤权/企业隔离难一致 | 功能新增仍需真实 Domain 权限与 390/1280px 及 Actor/Enterprise/Subject/Operation 负例；已实现的功能不能外推至正式后台 Export |
| 生产权威 | **候选 A 为本项目已选择的接线方向**：同一正式 PostgreSQL ACID T0 把 PA05 全 Feature/Package 生命周期、AuthorizationProvider 真来源、Epoch/SourceGeneration、不可变 Outbox/全范围 DENY 同事务提交 | 排除 File/Static ALLOW 双主、仅局部 SQL mirror、用 CI HMAC/PG fixture 代表真实身份；排除在未有审批时直接切换生产 | 需 #1212 五方独立有权 Owner 审查 + 正式 DBA 角色、真实 KMS signer、撤权/分区/双物理 Host/rollback/PITR 收据；否则 N1=NOT_CERTIFIED |
| 正式 SAVE/EXPORT 发布 | **维持 OFF**，保留当前页 CSV 的独立已交付范围，拒绝未认证正式跨页 Job/Personal SAVE 注册 | 排除先打开 SAVE/EXPORT 再补数据库签名/Agent 认证；风险是越权、重放、跨企业泄漏 | 上述真实 Owner 跨层签署后，通过**新的受审 PR**独立启用并在实际 Host 回归 |
| 旧 Railway 退役 | 先**只读盘点 + 独立 Operator 签收**，保留原 YAML 与卷；执行动作必须具有数据消费者/备份/恢复证明 | 排除 `offline=已经自动部署禁用`、`checkSuites:false=autodeploy off`、推断没有消费者就解绑/删库、使用旧 URL 作为 Tokyo 主流程 | #1092 Operator 核实 effective setting、PID1/drain/overlap、旧消费者及卷备份恢复；逐服务受权变更且有 rollback |
| Tokyo 发布 | 采用既有受保护 main/Actions/GHCR immutable SHA/东京 Preview，按真实变更做 CI-gated deploy | 排除把 Docs/CI 成功写成新的物理部署、把旧 Railway 现场 401 或未授权演示当真实业务 Principal 200 | runtime/deployable 改动才触发实际 GHCR/SSH；保留 Run/Job marker 与真实镜像 digest |
| CI 完整性 | 沿用无路径过滤的 **Project Continuity** + CV03/CV04 Owner gate；#1307–#1310 先后修复路径不对称、传递依赖、注释伪证据 | 排除再造第二套发布框架或把 `includes()` 源码锚点当 AST/运行时保证；CI 的取消项也不能装作不存在 | 只对**新发现可复现缺陷**补独立负例并按 PR/Main/东京/分支验收；真正生产证明另取 Owner |

## 6. 资料之间的冲突、未决与下一步最高价值查证

1. **旧 Railway 在线/本轮 offline**：来源时间不同；需新 Operator 按 service+environment+deployment+UTC 读取真实 `enabled`、effective drain/overlap、Node PID1 信号/启动进程。若后续想退役，优先旧卷备份/恢复和所有仍连接消费者清单。没有收据不动控制面。
2. **S 级 Railway 文档 vs 受权真实有效配置**：文档标题与论坛问答只是定位帮助。必须阅读已登录页面或做受权只读 GraphQL 并保留真实 response（脱敏），不能把变量 `String!` 模板或 `checkSuites:false` 当明确配置答案。
3. **Issue #1212 checkbox 已选 vs 独立 Owner 0 Review**：可把“选用方案 A”作为工程意向，但**不**代表有迁移与生产 SAVE/EXPORT 的完整审批。真实 PA05、AuthorizationProvider、DB、Security/Ops、Domain 五类 Owner 需逐一签发原证。
4. **Main SHA vs 物理 Tokyo 镜像**：Docs/CI gate PR 东京部署均跳过；`b58e...` 是最后见过的实际部署日志标记，本窗口未再次 SSH 获取活动容器 digest；下次需要当前物理证明时需受权新观测。
5. **PR 完成时 6/6 或 7/7 GREEN vs 后续出现的 `Continuity CANCELLED`**：#1307/#1308/#1309 主线历史提交在 #07 重读的额外结果分别为 5 SUCCESS+1 SKIPPED+1 CANCELLED / 5+1+1 / 6+1+1；当时各已通过的独立 Continuity 原证保留。未查询每个 cancel 的单独触发因果，不把猜测写入事实。
6. **词法安全源码断言 vs 真实授权执行**：#1310 减少注释伪证据，仍不能取代 AST 控制流审查、认证运行时、真实 KMS/Producer/跨物理 Host。今后如果有确定的词法绕过，先给精确复现再升级检查；不要无端扩展虚假生产认证。
7. **旧聊天摘要 vs 用户原始完整聊天**：本窗口恢复的是用户已提供的当前要求、现有交接和可读取的上下文摘要；未取得此前旧聊天完整逐字归档，不能杜撰原话或引用不存在的截图。

**最值得接下来查阅的顺序（D）**：
- 首先 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 是否出现**真实 Infra Operator** 的 Autodeploy/PID1/备份恢复新收据（非重复只读扫描）；
- 然后 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 是否有独立具名 Review、实际部署中的 Provider/binding/DB roles/KMS/两 Host 可证资料；
- 若有**新的产品需求或代码缺陷**，先检查 [Window10 最终工程交接](CV04-WINDOW10-20261113-0707-FINAL-HANDOFF-ENTRY.md) 和当前 main，再从已有测试/文档延伸；否则**明确停在 BLOCKED，不为自动续跑新建重复 PR**。

## 7. 项目模块/文档/分支/任务映射（确保资料进入执行链）

| 本轮主题 | 仓库模块/现有文档 | 已完成 PR 与准确分支边界 | 下一项应交付（需先满足前提） |
| --- | --- | --- | --- |
| PA05/AuthorizationProvider 生产权威 | `manager/server.ts`、`manager/store.ts`、`manager/service.ts`、`providers/authorization/runtime.ts`、`providers/enterprise-context/*`、`manager/cv03-n105b-authority-t0-pg.ts`、`manager/cv03-n105b-pa05-host-lifecycle.ts`；[N105C10 Owner 合同](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md) | #1308–#1310 只修复 **门禁/测试**，不执行真实 PG authority mount | #1212 真实五 Owner approvals + DBA/安全环境收据 → 新受控接线/验收 PR |
| CV03 Human SAVE | `manager/cv03-personal-saved-view-host-admission.ts`、`manager/server.ts`、`.github/workflows/cv03-n105c09-owner-release-evidence.yml`、`tools/cv03-n105a-authority-boundary-preflight.mjs` | #1308 parity，#1309 transitive，#1310 comment masks，均 MERGED | 在生产 Owner 认证之前 **OFF**，不得注册 WRITE Feature |
| CV04 正式后台 Export | `apps/business-dictionary/export-jobs.ts`、`export-job-pg-store.ts`、`export-job-pg-sql-lease.ts`、`export-job-pg-dispatch.ts`、`tools/cv04-isolated-signed-export-gateway.mjs`、`.github/workflows/cv04-next05-owner-source-release-gate.yml` | #1307 parity，#1309 transitive，#1310 comment masks，均 MERGED | 真实 signed producer/T0/权限/Domain 与 Agent 验收后再启用后台 `dictionary.collection.export.job.*`；当前页 CSV 独立保持 |
| CI 防回退 | `.github/workflows/project-continuity.yml`、`tests/protocol/cv04-owner-release-workflow-paths.test.mjs`、`tests/protocol/legacy-railway-proof-host-opt-in.test.mjs` | #1307–#1310 及历史 #1304；CI 原始链接在 §3、§4 | 仅对确证新增缺口继续；不能用 CI 代替五 Owner |
| Railway/东京发布 | [Tokyo Runbook](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)、`.github/workflows/evo-tokyo-dev-deploy.yml`、[归档旧 Railway README](../../archive/railway-live-production-proof-actions-20261113/README.md) | #1300–#1305 历史已合并；#1311 Docs 最终交接；本轮无 Railway 控制面 mutation | #1092 Operator 提交收据之后方可单独审批退役；新东京 runtime PR 按实际部署 Job 验证 |
| 接续文档 | [#07/07 Short](CV04-WINDOW10-20261113-0707-FINAL-HANDOFF-ENTRY.md)、[七步证据索引](CV04-WINDOW10-20261113-0707-EVIDENCE-DECISION-INDEX.md)、[恢复 Delta](CV04-WINDOW10-20261113-RECOVERED-CONTEXT-EVIDENCE-DELTA.md)、[Window09 历史](CV04-WINDOW09-20261113-POSTMERGE-0808-HANDOFF-ENTRY.md) | 当前研究交接 PR 独立文档分支（其提交/CI/Merge 用 PR Final 评论证明） | 新窗口先读短入口再读本文，按当前 `main` 及真实 Owner/Operator 证据决定是否可以执行 |

### 当前研究交接自己尚待产生的可变原证

本文创建时新 Docs PR、HEAD checks、merge SHA、Tokyo preflight/skip、branch hygiene **都还没有发生**，所以没有预写任何 PASS。提交并核验之后，应在**该 PR 的最终评论**另记全部真实身份，避免让文档在合并后自相矛盾。截止本页编制，**无本轮新增截图、文档附件或凭证**；若截图由后续 Operator 取得，只需在现有 #1092（脱敏）记录其原始可访问位置与 UTC。
