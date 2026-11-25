# CV07 · 东京 DEV/PREVIEW 只读业务准入盘点（2026-11-19）

> **接续补证 / 不替代 Human 业务验收。** 配套 [当前研究交接入口](CV07-WINDOW-20261119-RESEARCH-HANDOFF-ENTRY.md)、[资料与决策索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)、[Item 主线工程回执](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md) 和 [第三插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md)。不改历史八步计划，不触碰 #1184。

## 1. 接续现场确认的原证

- GitHub Connector **G/已读源码与 Run**：受保护 `main@625c2d23fcb58e24aa142705b6ab6792ed440249`；PR [#1370](https://github.com/jiangxng/EVO-App-Platform/pull/1370) 已 merge，准确研究交接 HEAD `02feeb9fd13b497c2a2ba0be98d33628a41dcbc8`。
- [最新东京 #44517114989](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44517114989) `preflight SUCCESS/deploy SKIPPED`；原始 preflight Job #135535886204 实际输出 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=625c2d23fcb58e24aa142705b6ab6792ed440249`。不能把该文档提交当成新部署。
- [最近实际东京部署 #44509954215](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509954215) 运行镜像 `ghcr.io/jiangxng/evo-app-platform:702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf`，当时容器 healthy、本地/公网健康与未授权 401 PASS。这是 **2026-11-19 当次部署日志**，不能独立证明本文件完成时 VPS 的实时状态。
- [Branch Hygiene #44517073649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44517073649) 原日志精确 `DELETED_VERIFIED_MERGED_PR_BRANCH docs/cv07-window-20261119-research-handoff-20261119 @ 02feeb9fd13b497c2a2ba0be98d33628a41dcbc8`，未清其他窗口分支。
- **新增源码级判断 D：** [东京 Compose](../../../deploy/tencent-tokyo/compose.yaml) 显式 `APP_PLATFORM_STARTUP_PROFILE: clean`，而 [manager/startup-defaults.ts](../../../manager/startup-defaults.ts) 明确 clean 不会自动安装可选业务插件，既有安装保留。源代码中 `ITEM_FEATURE_ACTIVE` 守卫必须先通过，否则 Item 页面返回 404。所以**镜像包含 Item 代码并不证明现有容器已安装、启用 Item**。这是需要现场只读盘点的原因，而不是宣布 Item 未安装。
- 当前交互终端未获得合法东京 Basic Auth + 真实业务会话；网页访问工具无法读取该外站，无法区分网络访问限制和服务器故障。不能据此编造 401、登录成功、当前企业样本或 390px 人验结果。

## 2. 本轮最小工程补证：独立只读 Action

新增 [CV07 Tokyo Preview Read-Only Inventory](../../../.github/workflows/cv07-tokyo-preview-readiness.yml)，**仅在受保护 main 的本 workflow 文件变化 push 或授权手动 workflow_dispatch** 运行，并使用既有 `evo-tokyo-dev` Environment 的 SSH 身份。PR 分支不运行 SSH、不授权 fork；不修改原 CI-Gated 发布策略。

工作流通过 pinned SSH 在现有实例执行 **read-only**：

1. 由当前 `docker compose` 查实际 EVO 容器和镜像 tag、健康状态；
2. 使用容器内 Node 仅解析现有 `/data/platform-state.json` 的 `installedPackages/activeFeatures`，确认 `evo-item`、`evo-item.default` 是否在**持久态**存在；
3. 仅检查 `/data/enterprise-resources.json` 是否存在 ACTIVE 的 `evo.item/items/item.subject`，输出 **YES/NO**，不输出业务行、企业 ID、资源数量、用户信息或原始 JSON；
4. 从独立 Runner 再查 HTTPS /health 和未授权根路径 401。失败要记录为未通过，不能绕过 Basic Auth 或省略真实会话。

**证据边界：** 文件持久态 YES 不等于运行时授权可执行，更不等于当前用户有权读取、合法企业上下文存在、Human 登录成功、真实 OIDC 或 390px 人验完成。NO 应推动现有受控插件安装/企业数据准备，而不是私自改造默认 clean 或直接向数据文件注入种子。工作流只标记 `CV07_TOKYO_AUTHORIZED_BUSINESS_SESSION=UNVERIFIED` 与 `HUMAN_ACCEPTANCE=NOT_SIGNED`。

> 本文创建时此新增 Action 尚未运行，绝不提前填写返回值、PR CI、合并/部署或分支清理结果。必须按最新准确 SHA/Run 的实际原始日志回填。

## 3. 下一实际操作与必须保留的拒绝条件

- **先取得新 Action 的实际运行标识**，独立核对现场 `ITEM_PACKAGE_INSTALLED / ITEM_FEATURE_ACTIVE_IN_PERSISTED_STATE / ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE` 三项。
- 如果 Item 未安装或无可读数据：由已获授权的 DEV/PREVIEW Operator 在现有 Host 安装/Feature 管理和企业上下文下操作；记录脱敏前后状态，不启用生产 OIDC / Saved View WRITE / Export / Agent WRITE，不直接编辑持久态快照。
- 如果三项都有：仍需合法 Basic Auth + 应用 Principal/Enterprise 实操；在 [原人工五步入口 §4](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md) 验证全部 Item、搜索排序分页、详情返回、我的 Item/企业切换、390px。此次审计不代表用户已能直接验收。
- **开发者复制性**：使用 [第三插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md) 由独立于框架实现的作者提交一条新合法 Collection，准确 CI/PR 才签；不能以 Item 既有测试冒充。
- 正式 CV03 Saved View、CV04 Export、Human OIDC、PA05 Operator、Agent WRITE 和生产放行维持独立门禁。DeepSeek 余额/付费模型不作为本轮阻塞；未来私有模型沿用 `llm.inference`。
- 仅按准确 PR HEAD CI 完成后普通合并 main；由既有 Branch Hygiene 依据 PR+SHA 清理**本分支**，不清理无关分支与 #1184。

**最终状态词：** `CODE/CI/DEPLOYED_PREVIEW` 有历史准确 SHA 原证；`TOKYO_ITEM_LIVE_INVENTORY_PENDING`、`MVP_USER_ACCEPTANCE_NOT_READY`、`INDEPENDENT_PLUGIN_AUTHOR_PENDING`。新增 Action 成功后也只有第一项可按日志提升，其他两个必须继续标明未验。

## 4. 2026-11-19 · 本轮已合并并真正完成的只读东京盘点（新增 G 级原证）

本节是上面 §2 最初“尚未运行”的**后续实际执行回执**，不是倒改历史快照。

- [PR #1371](https://github.com/jiangxng/EVO-App-Platform/pull/1371) Draft→准确 HEAD `0a7a54c7562b6a5313520a318602c39e47f672e3` 的 4/4 checks SUCCESS（其中 Continuity 两次）；普通 merge commit `d47c646728c07f9cc42cb35f16dffc3585f7cc6b` 到 protected main。
- **[只读 Inventory #44519919359](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44519919359) SUCCESS / Job #135545585162 原始日志**，东京实际正在运行的镜像为 `702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf`，容器 `healthy`；`CV07_TOKYO_ITEM_PACKAGE_INSTALLED=NO`；`CV07_TOKYO_ITEM_FEATURE_ACTIVE_IN_PERSISTED_STATE=NO`；`CV07_TOKYO_ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE=NO`。同时 `CV07_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`CV07_TOKYO_BASIC_AUTH_BOUNDARY_PASS`，未授权根路径 401。
- 同主线 [Continuity #44519919395](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44519919395) SUCCESS；[东京 #44519966972](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44519966972) preflight SUCCESS、deploy SKIPPED，原始 Job 输出 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=d47c646728c07f9cc42cb35f16dffc3585f7cc6b`；本次没有重发运行镜像。
- [Branch Hygiene #44519920778](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44519920778) 原日志精确 `DELETED_VERIFIED_MERGED_PR_BRANCH ci/cv07-tokyo-readonly-preview-inventory-20261119 @ 0a7a54c7562b6a5313520a318602c39e47f672e3`，未触碰其他 Owner/PR #1184。
- **现行执行跟踪：[Issue #1372](https://github.com/jiangxng/EVO-App-Platform/issues/1372)** 已记录合法 DEV Operator、Host 安装 Item/启用 Feature、有权企业数据准备和用户五步只读验收清单。**源证结论不是“Item 源码未实现”，而是“东京 clean 启动当前真实业务状态未具备验收前置条件”。** 不能直接修改持久态 JSON、绕过 Basic Auth 或用本地 fixture 假作线上数据。
- 合法业务登录/Principal 授权与 390px 实际公网操作依然 **UNVERIFIED/HUMAN_NOT_SIGNED**；独立非框架开发者第四个新 Collection 复用仍无实际 PR/CI。没有关闭正式 CV03 SAVE、CV04 EXPORT、Human OIDC、PA05 Operator、生产 WRITE，也没有启动 DeepSeek 收费测试。

**新状态：** `TOKYO_ITEM_INSTALLED=NO`、`TOKYO_ITEM_ACTIVE=NO`、`TOKYO_ITEM_RESOURCES_PRESENT=NO` (**实时只读回执当次有效**)；`MVP_USER_ACCEPTANCE_BLOCKED_BY_PREVIEW_PROVISIONING`；`INDEPENDENT_PLUGIN_AUTHOR_PENDING`。下一次以新 Action/合法业务会话重核，不把历史状态永远视为当前。

## 5. 2026-11-25 自动续跑：东京业务前置条件的二级只读盘点（执行前记录）

- **新核验主线起点**：protected `main@51f66be5c3bd3e96ca52ec43e30c18388bb78f41`，2026-11-19 后未有 CV07 runtime 新提交；Issue [#1372](https://github.com/jiangxng/EVO-App-Platform/issues/1372) 仍 OPEN。2026-11-24 的 Ecosystem Certification 成功是结构化平台 CI，不是东京 Item 实操签收。
- **原证来源（G 源码）**：[Item manifest](../../../apps/item/package.ts) 的 `enterprise.directory`、`enterprise.resources`、`enterprise.responsibility` 必需能力；[Responsibility package](../../../apps/responsibility/package.ts) 依赖 `enterprise.resources`；[企业上下文 Provider](../../../providers/enterprise-context/package.ts)、[企业成员关系 Provider](../../../providers/enterprise-relationship/package.ts)；[Host 治理存储](../../../manager/enterprise-context-governance-store.ts) 的 `contexts/relationships` 与 ACTIVE Owner。
- **本切片唯一变更**：扩展已合并且 11-19 成功的 [东京只读 workflow](../../../.github/workflows/cv07-tokyo-preview-readiness.yml)，从现有容器内部 **read-only** 检查三类依赖的安装/持久 Feature 标志、有无 ACTIVE 企业、有无 ACTIVE OWNER 关系、Item 有无落在 ACTIVE 企业里；仅输出 `YES/NO`。不读 HTTP 用户会话、不请求 Basic Auth、不输出企业、主体或 Item ID，不修改 JSON/数据库、插件生命周期或启动设置。
- **状态判断**：运行成功后可区分 `NO_ITEM_PLUGIN`、`NO_DEPENDENCY_FEATURE`、`NO_ENTERPRISE`、`NO_ACTIVE_OWNER`、`NO_ITEM_IN_ACTIVE_ENTERPRISE`。这些只是**持久状态存在性**而非当前登录主体授权；即使全 YES，也必须单独完成合法登录/Owner READ/人验。原八步及 CV03 SAVE/CV04 EXPORT/OIDC/Agent WRITE 门禁不变。
- **执行治理**：独立短分支 → Draft PR → 准确 HEAD CI → 受保护 main 普通 merge → 由该 workflow 在 main 变更自动运行，读取实际 Job logs → 东京 runtime 变更规则应 SKIP → Branch Hygiene 精确清理。**本段写入时尚未有 2026-11-25 新 Run，绝不预填盘点结果。**

## 6. 2026-11-25 · 东京二级现场已证及最小 Host 安装切片（当前 PR 结果待 CI）

[CV07 Tokyo 二级 Inventory #45527898227](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45527898227) 的真实 Job #138915679109 **SUCCESS**，2026-11-25T01:44 UTC 只读 VPS 原日志（本机持久态而非真人登录）：
- 正在运行的镜像 `702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf`，healthy、HTTPS/401 PASS。
- `ENTERPRISE_RESOURCE_PROVIDER_PACKAGE_INSTALLED=YES`、`FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`；
  `RESPONSIBILITY_PACKAGE_INSTALLED=YES`、`FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`；
  `ENTERPRISE_RELATIONSHIP_PROVIDER_PACKAGE_INSTALLED=YES`、`FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`。
- `ACTIVE_ENTERPRISE_CONTEXT_PRESENT=YES`、`ACTIVE_ENTERPRISE_WITH_OWNER_PRESENT=YES`。
- `ITEM_PACKAGE_INSTALLED=NO`、`ITEM_FEATURE_ACTIVE_IN_PERSISTED_STATE=NO`、
  `ITEM_RESOURCE_IN_ACTIVE_ENTERPRISE_PRESENT=NO`、`ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE=NO`。
- `AUTHORIZED_BUSINESS_SESSION=UNVERIFIED`、`HUMAN_ACCEPTANCE=NOT_SIGNED`。不可将有效 OWNER 关系冒充当前操作者已获权限。

**新增取舍（D、仅 DEV/PREVIEW）：** 不修改 `clean` 全局默认，不建立新管理员/安装器，不通过 SSH/HTTP 绕过 Basic Auth。复用既有 [Host startup defaults](../../../manager/startup-defaults.ts) 的 `explicit=true` 与 `pa05WriteLifecycleHost.bootstrapActivation("INSTALL", "evo-item")`，在**东京专用 Compose** 中显式设置 `APP_PLATFORM_CV07_TOKYO_ITEM_BOOTSTRAP=DEV_PREVIEW_ONLY`；Host 启动仅在 `clean`、精确东京公网 Base URL、关闭 Managed Session/OAuth/MCP 的预览边界允许安装。原 Manager 负责依赖/权限计划；若已有 Item 但 Feature 已由 Operator 停用，拒绝擅自重新启用；若安装结果未激活，拒绝宣称启动成功。没有创建 Item/企业数据，未开启正式 CV03 SAVE/CV04 EXPORT/Human OIDC/PA05 Operator/Agent WRITE。

**本段写入时**新增安装 PR 的准确 HEAD CI、主线合并、东京实际镜像和安装盘点结果还未得到；必须继续逐级验收，不得预签。安装成功仍需要在合法预览身份中确认当前企业有可供 READ 的 Item，执行五步真实操作；独立第三方作者实操仍未完成。

## 7. 2026-11-25 东京 Item 显式安装：真实合并与物理发布回执（实发证据 G）

- **最小安装工程 [PR #1375](https://github.com/jiangxng/EVO-App-Platform/pull/1375)**：准确 PR HEAD `d9694369976b4c5b0c055ff04742979b52cdee6c` 52/52 CI SUCCESS，普通 merge commit **`a97462eb024baec7ede0145e20997d945a5fb068`** 到受保护 main。仅针对东京 DEV/PREVIEW Compose 的显式 opt-in，保留 `clean` 默认、既有 Manager/PA05 安装通道和生产 WRITE 关闭；新增独立协议测试。实际 Branch Hygiene [#45528525559](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45528525559) Job #138917754596 精确删除 `feat/cv07-tokyo-explicit-item-preview-bootstrap-20261125 @ d9694369976b4c5b0c055ff04742979b52cdee6c`。
- **真正东京部署（不是 SKIP）**：[Tokyo Actions #45528654377](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45528654377)，preflight Job #138918181406 SUCCESS，deploy Job #138918774786 SUCCESS。2026-11-25T01:53 UTC 原日志 `docker compose ps` 显示实际运行 `ghcr.io/jiangxng/evo-app-platform:a97462eb024baec7ede0145e20997d945a5fb068`，容器 `Up 6 seconds (healthy)`，`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=a97462eb024baec7ede0145e20997d945a5fb068`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。运行日志的成功没有逐项列出 Item 安装状态，**不得单凭 healthy 自称 Item 已安装**。
- **本次后续补证：** 让原 [CV07 Tokyo Read-Only Inventory](../../../.github/workflows/cv07-tokyo-preview-readiness.yml) 除自身 main 变更及授权手动触发外，在**本仓库 main、成功完成的 Tokyo Release** 后自动做布尔值只读现场核验；拒绝 fork/其他分支/未成功 Release 的 workflow_run，继续复用既有 `evo-tokyo-dev` Environment。它仍不触发业务写入或用户会话，且源级新增 workflow_run 不证明有过新的运行。
- **尚待当次现场签收：** 2026-11-25 新镜像下 Item Package/Feature 是否真正 installed+active，是否有当前有权企业 Item 业务数据，是否存在合法业务登录及 Human 390px 操作；均需另读 Actions/人验原证。缺数据不私自造默认样本，不将 Basic Auth 的 401 认证边界改为公开演示。外部独立插件作者的接入测试仍未签署。

## 8. 2026-11-25 · 真实 Item installed/active 后撤回一次性启动开关

- **真正 Item 安装原证（G，非登录推断）**：[Tokyo 只读 #45529717616](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45529717616)，Job #138921726527 SUCCESS，2026-11-25T01:59:45Z 实际容器镜像 `a97462eb024baec7ede0145e20997d945a5fb068`，healthy；`CV07_TOKYO_ITEM_PACKAGE_INSTALLED=YES`、`CV07_TOKYO_ITEM_FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`，三项依赖都 installed+active YES，ACTIVE 企业/Owner 关系 YES；但 `CV07_TOKYO_ITEM_RESOURCE_IN_ACTIVE_ENTERPRISE_PRESENT=NO`、`CV07_TOKYO_ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE=NO`，合法业务会话 `UNVERIFIED`，Human `NOT_SIGNED`。
- **自动闭环 [PR #1376](https://github.com/jiangxng/EVO-App-Platform/pull/1376)** 合并 `main@a794697d983c9a49358d993ec3b6bd3c7f698b1e`；只读 Inventory 新增可信成功东京 Release 的 `workflow_run`，保留 main-only push/manual、SSH Environment、不读业务数据。PR HEAD Lightweight Host 曾因已有 EOG 测试导入 barrier 暂时超时而 FAIL；单 Job 精确重跑 SUCCESS，完整 HEAD 4/4 绿；该测试波动不当作此次功能性缺陷已被修改。该次合并 Tokyo #45529745102 `preflight SUCCESS/deploy SKIPPED`；运行镜像仍是 `a97462eb...`。
- **本切片选择（D）**：初次安装开关 `APP_PLATFORM_CV07_TOKYO_ITEM_BOOTSTRAP=DEV_PREVIEW_ONLY` 只为从 clean 空实例导入 Item，且原代码在未来 Operator 有意停用后重启时会 fail-closed；持久态 Item 已确认 ACTIVE 后，应将该 Compose **一次性 override 撤回**，恢复启动默认为 `OFF`。不 uninstall、不 disable、不改 `/data/platform-state.json`，也不改默认 clean、安全/人验门禁；下一次真实发布应继续使用相同持久卷并保留 Item installed/active。不能把此前 #45529717616 的事实直接当作撤回开关后已经实证。
- **本段写入时**撤回开关的独立 PR HEAD CI、新 main SHA、东京发布和复查结果尚待原件；严禁将本段预期写成 PASS。后续业务数据需要合法业务主体使用 Host Item Owner create/import 才能形成，不由部署工作流造虚假样本。独立非框架开发者 Collection 实操仍待实际 PR/CI，正式 CV03 Saved View/CV04 Export/Human OIDC/Agent WRITE/PA05 Operator 独立关闭。

## 9. 2026-11-25 · 最终东京无安装开关重启与持久 Item 实证（G）

- [PR #1377](https://github.com/jiangxng/EVO-App-Platform/pull/1377) 在准确 HEAD `98648c397869fa4a0e0423dedadc823e5ff6c4f8` 的 4/4 CI SUCCESS 后普通合并到受保护 `main@429c176ca4e9ac3edea0164dbd1b788f76d64344`。在东京 Compose 中**撤回**一次性安装的 `APP_PLATFORM_CV07_TOKYO_ITEM_BOOTSTRAP=DEV_PREVIEW_ONLY`，没有卸载已安装 Item，也不更改 `clean` 或业务存储；保留 Host 默认 `OFF`，尊重未来管理员真实停用。
- [东京实际再部署 #45530298019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45530298019)：preflight SUCCESS / deploy SUCCESS，Job #138924547097 原日志 `docker compose ps` 为 `ghcr.io/jiangxng/evo-app-platform:429c176ca4e9ac3edea0164dbd1b788f76d64344`，`Up 6 seconds (healthy)`，`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。
- **最关键的物理重启后回执**：[自动只读 Tokyo Inventory #45530800299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45530800299)，Job #138925305275，2026-11-25T02:08:35Z SUCCESS，同一新镜像 `429c176...`、healthy。其现场持久态：`CV07_TOKYO_ITEM_PACKAGE_INSTALLED=YES`、`CV07_TOKYO_ITEM_FEATURE_ACTIVE_IN_PERSISTED_STATE=YES`；Enterprise Resource Provider、Responsibility 和 Enterprise Relationship Provider 安装/激活均 YES；ACTIVE 企业、ACTIVE OWNER 关系 YES；**`CV07_TOKYO_ITEM_RESOURCE_IN_ACTIVE_ENTERPRISE_PRESENT=NO`、`CV07_TOKYO_ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE=NO`**；`AUTHORIZED_BUSINESS_SESSION=UNVERIFIED`、`HUMAN_ACCEPTANCE=NOT_SIGNED`。
- [PR #1377 Branch Hygiene #45530260627](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45530260627) Job #138923511298 原日志精确 `DELETED_VERIFIED_MERGED_PR_BRANCH deploy/cv07-tokyo-retire-one-time-item-bootstrap-20261125 @ 98648c397869fa4a0e0423dedadc823e5ff6c4f8`，无其他过程分支批量删除。

**真正结论：** CV07 Item 第三插件已经在东京 DEV/PREVIEW 经原 Host 生命周期**安装且经无安装开关的物理重启后仍 ACTIVE**。这不代表在线企业里已有 Item 数据，也不代表合法 Principal 能执行查询或 Human 已验收。现存唯一 Item 在线业务阻塞为**有权业务用户经原 Host create/import 正常准备一组非敏感 Item，再在真实企业授权下验证列表/分页/详情返回/「我的 Item」/企业切换/390px**。独立非框架开发者第四个 Collection 仍需真实 PR+CI，由他人签，不用框架作者自验替代；原正式 CV03 Saved View、CV04 Export、Human OIDC、PA05 Operator、Agent WRITE 门禁保持不变。追踪 [Issue #1372](https://github.com/jiangxng/EVO-App-Platform/issues/1372)，现有用户完成提醒不重复创建。

**研究分层**：以上仅 Github Connector 直接读取 GitHub Actions 原始 Job 日志、受保护 main 与对应源码，标 G（当次 SHA/Run）；没有在本轮直接访问真实业务登录会话，未取得用户屏幕/敏感 credentials、实际人验录像、独立开发者接入签名，不标成已阅/已通过。
