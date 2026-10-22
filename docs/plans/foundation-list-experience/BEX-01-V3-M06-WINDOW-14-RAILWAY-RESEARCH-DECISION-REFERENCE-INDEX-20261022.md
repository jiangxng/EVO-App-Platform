# BEX-01 V3 / M06｜Window 14 研究资料与决策详细索引：Railway、GitHub、RawGitHack（2026-10-22）

> **配套**：[简短交接入口](BEX-01-V3-M06-WINDOW-14-RAILWAY-DELIVERY-HANDOFF-ENTRY-20261022.md)。本索引是本窗口新增的**可审核增量资料**，沿用 [Window 13 原研究索引](BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) 及 [Window 12 历史索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md)；不会把旧文档写成“当前状态”。本文件仅保存文献和决策，不触发任何部署、权限或生产状态变更。

## 0. 证据等级与时间口径

- **R 原始内容已读**：GitHub/厂商页面原始内容被工具真正打开并读过相关段落；“已读”只承诺所列范围，不指整站。
- **RM API 原始元数据实查**：GitHub PR/check/commit/branch、Railway 服务/部署等结构化实时接口；直接支持 SHA、状态和资源名称，但不是用户视觉验收。
- **S 搜索返回正文片段/摘要**：搜索系统抓取到来源正文/节选，**未成功独立打开该页**；不能把摘要标成“已读完整原文”或保证实时刷新。
- **H 历史项目文档已读**：已读取旧交接或阶段文档；文档说当年做了某事，只支持“当年有该记录”，不能证实现在还存在。
- **U 用户提供**：用户本人分享链接、指令或截图；无需伪装网络查询。
- **D 待验证**：本轮未读、无法获取、尚未授权的客户事实/部署状态/HTTP 可达性；不能填为 PASS。
- **[F] 来源事实**；**[J] 本轮选择与判断**；**[U] 用户约束**。实查日期统一为 **2026-10-22**（用户时区参考 Asia/Tokyo；Github/Railway API 时间常为 UTC）；历史源码/事件原始时间独立标注。若用户实际设备无法访问 status.railway.com，仅代表该客户端连接失败。

## 1. 本轮读取的 GitHub / Railway 一手资料索引

| 编号、原始标题与 URL | 查阅日期／等级／读到的范围 | [F] 核心发现 | 对应模块、用途及限制 |
|---|---|---|---|
| **G01 GitHub 当前 main**：[branch API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) | 10-22 **RM**：读取实际 branch commit SHA，建交接支线前再次查 | 本窗口 BEX 合并收束曾为 **9dc903c9238222623566174d0342c62c464ec23f**；建本交接分支时已前进至 **59d31034f4ad7fd2715e1ac26395abbba94a31d1**；不是同一个时间点。 | 发布需读实时最新 main，不把历史 9dc 借作当前。 |
| **G02 四个业务/文档 PR 原始元数据**：[1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060)、[1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077)、[1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086)、[1100](https://github.com/jiangxng/EVO-App-Platform/pull/1100) | 10-22 **RM**：每条 head、base、draft、mergeable、merge result、CI/check-runs 逐项核查 | 按顺序合并 main 为 [60ba2e3](https://github.com/jiangxng/EVO-App-Platform/commit/60ba2e31139933148dd1c6d0e5f6d713fe03dfcd)、[e496ebd](https://github.com/jiangxng/EVO-App-Platform/commit/e496ebd576ac71f56816bce7d4e3a4e24b88f616)、[90745c5](https://github.com/jiangxng/EVO-App-Platform/commit/90745c500c0577d31d49e7685491eb38c91095b6)、[9dc903c](https://github.com/jiangxng/EVO-App-Platform/commit/9dc903c9238222623566174d0342c62c464ec23f)。合并前各精确 head checks 分别为 12/12、17/17、17/17、5/5 success。 | BEX Platform 业务线；说明 git **已合并**，不是 Railway **已部署**，更不是 M06 Human PASS。 |
| **G03 Required continuity 与并行 main 对齐**：[PR #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060)、[Github compare API](https://api.github.com/repos/jiangxng/EVO-App-Platform/compare/main...feat/bex01-v3-real-fidelity-clean-mainline-20261020) | 10-22 **RM**（合并之前） | #1060 原先 GitHub merge API 405：required status check continuity expected。随后比较分叉后两边变更文件无重叠，将最新 main 合入原 PR 分支、重跑后 12/12 success；其余同法对齐、检查后依序合并。旧分支此后删除，compare URL 未必仍有效。 | 分支治理/保护规则案例；**不推荐**用户下次随意重组任意冲突树，只在先证实差异可安全合并情况下按 PR 流程处理。 |
| **G04 已合并过程分支清理**：[GitHub Actions run 39722539584](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39722539584)；[清理 workflow 源](https://github.com/jiangxng/EVO-App-Platform/blob/9dc903c9238222623566174d0342c62c464ec23f/.github/workflows/bex01-pr-branch-cleanup-on-merge.yml) | 10-22 **R/RM**：读过清理 workflow/结果，逐一 GET 原 branch 得 404 | 四条旧 feat/docs 过程分支均被删，workflow 只在关联 PR 全部 merged to main、无开放后继依赖，且 main 包含相关 branch 时才清理。 | 已闭环的 branch hygiene，不再以旧 branch 为开发地址。 |
| **G05 已在 main 的 Window 13 入口/索引**：[入口](https://github.com/jiangxng/EVO-App-Platform/blob/9dc903c9238222623566174d0342c62c464ec23f/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-13-HANDOFF-ENTRY-20261022.md)、[详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/9dc903c9238222623566174d0342c62c464ec23f/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) | 10-22 **R**：入口全文、索引主要章节实际读取 | 前窗口实测 V3 交互/Host/Eidos、M04/M05/M06 OPEN、CI evidence、原型 source-first 原则。文中当时 #1086 Draft、未发布是历史事实；本窗口正式将它们合入。 | BEX 研究脉络保留，不覆盖原文；M06 用户三维 100% 最终签收仍不能从 CI 推定。 |
| **G06 #909 V3 原型设计资产**：[PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)、[V3 静态源固定快照](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | 10-22 **RM/H**：读取 PR 正文与 Window 13 已读源章节索引，Library 找到 2026-10-15 原型 HTML、ZIP、PNG 名称；**本轮未完整重读 290 行源码，也未重新打开用户历史 PNG** | #909 当前仍 open Draft，原型是合成 172 记录/22 列设计稿，不进行真正的 Host 权限与数据写入；用户的 BEX M06 真实测试属于另一层。 | 若继续 M06 三维验收，以 #909 固定原型与 main 真实 Host 逐项对照；不可自动等价。 |
| **G07 TR-01B2D3 演示的固定提交**：[commit bd67f320](https://github.com/jiangxng/EVO-App-Platform/commit/bd67f320dce5ed6d4a023b58546b619ce4a03aa0) | 10-22 **R/RM**：取回提交原文及文件 patch；原始提交日期 **2026-10-11** | 提交名为“independently probe public static CDN delivery”，修改 [.github/workflows/tr01b2d3-online-stage-preview.yml](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/.github/workflows/tr01b2d3-online-stage-preview.yml)，对 index.html 与 static-demo.mjs 做 curl/grep 静态 CDN 探测。 | 证明历史发布手法和自动化设计，**不证明现在旧 CDN URL 仍可达**。 |
| **G08 TR-01B2D3 演示源页面与脚本**：[index.html](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/index.html)、[static-demo.mjs](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/static-demo.mjs) | 10-22 **R**：HTML 包含 title、页面正文、footer，脚本部分函数及判断逻辑实际读取 | 标题「EVO · 可信财务委托阶段演示」，页眉 BROWSER SIMULATION；合成销售/发货/应收/收款，只读签名校验、重放/撤销/越权/篡改/nonce 不可用等选择；浏览器 WebCrypto，强制 executionAllowed:false，不与真实财务 Postgres 交互。 | 这是 **TR01 阶段模拟页面**，**不是 BEX 供应商导入 V3**；不能借它证明真正 Eidos/Host、Finance Owner 服务端已部署。 |
| **G09 TR-01B2D3 当年的决策与部署记录**：[TR01B2D3-STAGE-DEMO-ONLINE-20261011.md](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/docs/roadmap/TR01B2D3-STAGE-DEMO-ONLINE-20261011.md) | 10-22 **R/H**：文档全文已读；文档创建时点 2026-10-11 | 文档称独立 Railway 预览项目 EVO Plugin Platform Preview 因 **Free plan resource provision limit exceeded** 未能创建 Railway Bun Function；于是使用公开 GitHub + RawGitHack 呈现静态网页。状态 **TR01B2D3 OPEN、NOT_CERTIFIED**。 | 解释用户为何没有授权新网站也能打开“外网预览”；该旧 Railway 项目目前未出现在当前账号项目列表，**不能断言已删除/无权限/同一账号**。 |
| **G10 用户当年打开的网址**：[固定 RawGitHack CDN URL](https://rawcdn.githack.com/jiangxng/EVO-App-Platform/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/index.html) | 10-22 **U/R**：URL 用户提供；对应 GitHub 固定提交与 HTML 已读；**外网 GET 端到端未重新验证** | 路径能精确映射到 G07–G09 的 GitHub 静态演示。 | 这是找回的历史静态地址；新窗口不再进行无目标的其他托管商猜测。 |
| **G11 实际 Railway 资源/部署**：[Railway 项目控制台](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601)、[现有网页](https://ledger-configurator-production.up.railway.app) | 10-22 **RM（Railway OAuth 插件）**：两连接实例均列同一项目；读取 projects、services、environments、describe_service、list_deployments 和实际 source | 当前列表仅 EVO Ledger Runtime MVP 项目、production 环境、五服务；Ledger Configurator 源 main；最新 SUCCESS 仍为 **eef6774**，2026-10-21 06:41 UTC；原域名与 /data 卷还在。 | 精确暴露「代码合并≠发布」：本次读的是平台 metadata，不能冒充网站浏览器交互检查；两个账户连接不代表存在两份独立 Railway 部署。 |
| **G12 Railway 触发新构建的 API 结果**：[Railway 产品入口](https://railway.com/) | 10-22 **RM**：多次通过授权连接器 connect_service_source 指向已存在的 main repo | 一致失败 **Deploys have been paused temporarily**；操作未成功创建新部署、无 staged patch；没有使用 redeploy 旧镜像替代真实 main 构建。 | 发布阻断是**实测平台拒绝**，更高可信于搜索公告“可能恢复”说法；不要声明新版本 SUCCESS。 |

## 2. 本轮查阅的外部网页与实时性等级

| 编号、来源标题／原始网址 | 查阅日与状态 | [F] 实际获得的信息 | 对 EVO 的用途和局限 |
|---|---|---|---|
| **W01 RawGitHack 官方 FAQ**：[CDN for your source code](https://raw.githack.com/) | **2026-10-22 R：真正打开页面，读 L10–L66** | L14–L17：固定 tag/SHA 生产型 CDN URL 会按 URL 长缓存；L19–L24 开发型 branch URL 更新更快；L28–L36：该站是返回正确 MIME 的缓存代理，HTML 可能先有一次确认页；L50–L62：第三方、无服务可用性保证。 | 验证无需登录另外的托管商、公开源码可外网访问；**不能运行 Node 服务、Postgres 或私有凭据**。不作为全宿主测试部署。 |
| **W02 Railway 10/21 官方安全披露**：[Security Disclosure: Wednesday October 21st](https://blog.railway.com/p/security-disclosure-wednesday-october-21st) | **2026-10-22 S：搜索取得大段正文；独立 open 发生 cache miss；非完整原文逐节阅读** | 2026-10-21 发布。Railway 声称可能有未授权方访问部分环境变量内容、建议轮换环境变量/API keys/数据库和 registry secrets、检查日志；安全调查期间部署暂停。 | **立刻提高安全优先级**，但用户是否实际受影响仍未知；不得将一般披露等同“本账号一定泄漏”。 |
| **W03 Railway 10/22 GitHub 连接与存储密钥处理**：[Redeploy Buckets and Reconnect GitHub After the Credential Reset](https://blog.railway.com/p/security-disclosure-recommendation-redeploy-buckets-and-reconnect-github-after-the-credential-reset) | **2026-10-22 S：搜索返回多段操作步骤，open 失败；不能称全文已读** | 官方表述 Railway 重置它保存的 **GitHub tokens** 以及存储桶访问密钥；恢复 GitHub 自动构建要检查 Account Settings GitHub 授权、Railway GitHub App、项目 Source repo/branch 和 Autodeploy，再触发新部署。 | 纠正本窗口之前“无需重新连 GitHub”的旧建议：**现在必须核查 Railway 侧是否需要用户重新连接**；Railway ChatGPT OAuth 仍可读项目并不证明 Railway↔GitHub 凭据也已恢复。 |
| **W04 Railway 10/22 PostgreSQL 专项**：[Rotate PostgreSQL Database Credentials](https://blog.railway.com/p/security-disclosure-recommendation-rotate-postgresql-database-credentials) | **2026-10-22 S：搜索正文节选，open cache miss** | 官方建议按模板在 Postgres Database→Config 正常 regenerate，区分引用变量与复制的连接串；DB 重启会断开现有连接、消费者随后需重部署；不应擅自手改 Postgres 密码或手工 ALTER USER 造成状态分裂。 | 当前项目确有 Postgres，但**没有读取其密钥值**，故需先由安全/运营 Owner 判定影响面、备份与重连次序再动。 |
| **W05 Railway 10/22 GitHub 访问异常检查**：[Check for Anomalous GitHub Access](https://blog.railway.com/p/security-disclosure-recommendation-check-for-anomalous-github-access) | **2026-10-22 S：搜索正文片段；未打开全文** | 建议复核 GitHub security log、已授权 OAuth/GitHub Apps、SSH/PAT、Repo Deploy keys/Webhooks/Secrets、Railway 审计记录；撤销不认识的访问。 | 给下一窗口风险核查方向；**未认定** EVO/GitHub 有被入侵。 |
| **W06 Railway 官方故障条目**：[Builds are temporarily paused](https://status.railway.com/incident/QH8L8B3E) | **2026-10-22 S/D：搜索返回状态节选，直接打开 URL 工具 cache miss；用户 Chrome 浏览器 ERR_CONNECTION_CLOSED** | 搜索抓取版本写 2026-10-21 调查中、多个区域构建受影响；**不能据此声称 10-22 此刻全球仍为 INVESTIGATING**。 | 即便官网状态页不可读，Railway 插件新部署失败仍是本项目可靠的当次事实；保持时间与来源区分。 |
| **W07 Railway 10/20 前一轮事件**：[New builds temporarily paused](https://status.railway.com/incident/JUA1PC5H)、[Railway Central Station 讨论](https://station.railway.com/questions/production-deploys-paused-for-12-hours-4517b150) | **2026-10-22 S：二手索引/社区正文，未直接打开完整 status 原文** | 社区中 Railway 自动回复称 **10-20 20:56 UTC 已恢复的上一轮事件**，暂停期间操作未排队，恢复后要重触发。此条与 **10-21 新事件 QH8L8B3E** 时间不同，不能混为同一事件。 | 发布恢复后主动从当前 main 新构建；旧 push/被拒的提交不会自动证明已发出新 deployment。 |
| **W08 故障的第三方记录**：[IsDown 10/21 incident](https://isdown.app/status/railway/incidents/673332-builds-are-temporarily-paused)、[UptimeRobot 10/21](https://uptimerobot.com/is-it-down/railway/2026-10-21) | **2026-10-22 S：搜索摘录，未用它们替代官方现状** | 索引 10-21 Railway API/构建异常及 07:24 UTC 左右公开调查公告，最新抓取时间与今天不一定一致。 | 官方网页用户无法访问时的二级线索；不能作为当前 Railway service 的部署 SHA 证据。 |

**未重复访问、只沿用历史索引的来源**：飞书 Aily、简道云、Microsoft Lists、Airtable、NN/g 等属于 BEX-01 设计窗口老研究，用户此次的问题是**发布与托管**而不是重新设计字段映射；原始查阅等级继续以 Window 12/13 的文档为准，不能杜撰本轮读过官网。

## 3. 方案比较与最终采用

| 议题 | [F] 来源与事实 | [J] 本轮决定、选择理由 | [J] 排除、适用前提 |
|---|---|---|---|
| **公网发布目标** | Railway 已有真实 Node Host、插件、Postgres 和 /data 卷；RawGitHack 是静态 CDN。 | **采用 Railway main 发布完整 EVO 测试**：真实企业上下文、权限和数据操作需要后端。 | RawGitHack 仅适合合成静态原型；不能当真实导入、Eidos 插件运行验收。 |
| **静态预览的可取之处** | TR01 静态 GitHub 文件确有固定 SHA CDN，可在无新服务授权时分享。 | 保留为**非正式 UI 评审**辅助渠道，测试不含秘密、无需后端。 | 无法提供真实业务写入/多租户授权；网页和脚本公开，第三方无 SLA。 |
| **直接把末端 PR 覆盖 main** | 四层 PR 依赖、main 有并行提交、最初 continuity 被保护规则阻断。 | 采用逐层变更对齐、自动 checks、受保护 PR 合并。 | 排除 force push / 绕过规则 / 无视并发 main。 |
| **Railway 拒绝时改用 Redeploy** | Railway 新建构建拒绝；旧 deployment 成功但 commit 为 eef6774。 | 保留旧服务稳定运行，拒绝误报，恢复后重新构建当前 main。 | 旧 build Redeploy 不会包含已合并的新 BEX 代码。 |
| **发生 10/21 安全披露后是否重连 GitHub** | W03 指出 Railway 重置了 GitHub tokens；ChatGPT 与 Railway OAuth 仍可列服务。 | **需核查 Railway 控制台独立的 GitHub 集成并在有提示时重连**，随后核对 Source/Autodeploy。 | 排除“OAuth 可读服务＝Railway GitHub Autodeploy 一定正常”的混淆；尚未在账号 UI 完成这一步。 |
| **凭据安全如何处理** | W02/W04 提醒潜在泄漏、官方 Postgres regenerate 会造成服务连接中断。 | 由安全/运营负责人先评估依赖、审计、备份、轮换与消费者重部署顺序，再选择可回退窗口。 | 排除自动删除 volumes、暴露明文 keys、无依赖分析直接大规模重置。 |
| **M06 签收** | G05/G06：实际 Host 是受权数据操作；静态原型 synthetic；四 PR 合并/CI 绿。 | M06 Human 仍需要按功能/布局/颜色分别确认，M04/M05 使用真实客户资料须另经授权。 | 禁止用 CI 成功、PR merged、网站可打开单独推论 Human PASS 或真实客户导入 PASS。 |

## 4. 资料冲突、开放问题与下一步值得查阅的方向

1. **「已经合并」与「已经上线」不是一回事**：GitHub main 至少为 G01 的 59d3103，而 Railway Latest SUCCESS 仍是 eef6774。部署必须以 Railway commit 与健康/业务验收核对，不能光看 PR。
2. **10-11 Railway 预览项目 vs 10-22 当前账号**：G09 历史证据写当时的独立 EVO Plugin Platform Preview 曾存在但创建 Function 失败；G11 现在仅列一个项目。原项目是否删除、使用其他 Railway workspace/account、权限变化均**未查到**。与 RawGitHack 的已确认静态 URL 不应混淆。
3. **用户 Chrome 无法打开 status.railway.com vs 工具获得 Railway 状态**：截图（U）属于浏览器网络；Railway MCP 状态是登录后结构化 API；W06 只是搜索索引，且直接 GET cache miss。分清“浏览器不可达”“某次 API 部署拒绝”“全球最新公告”三个不同命题。
4. **10-20 vs 10-21 两轮故障**：W07 旧事件曾已恢复，但 W06/W02 显示后续事件。前者的已恢复不意味着本次账户新部署可用。
5. **GitHub token reset 更新了操作前提**：早期 ChatGPT 曾说用户无需重新授权，W03 新公告相反。下一窗口应先看 Railway UI Account Settings、GitHub app installation、service Source/Autodeploy，再决定是否用户需点击授权；不要擅自向用户索取 token。
6. **环境变量受影响范围未知**：W02 只说明可能的未授权读取；项目有 DB 和授权变量，但未取得密钥、异常登录或账号通知的实证。继续查 Railway Audit Logs、Email/incident notice、Github Security log，并与安全负责人确认轮换。
7. **Build 恢复具体时刻未知**：本交接没有成功 HTTP 在线跑最新 EVO，也没获状态页实时原文；下一窗口直接尝试受权构建与检查各步骤，比复制过期摘要更可靠。
8. **Human 业务签收尚独立开放**：#909 原型为 Draft、客户 XLSX/授权 Job 未在本轮取用；继续按历史 M04/M05/M06 门禁处理。

## 5. 容易丢失证据与截图/附件位置

| 证据 | 已知精确位置 | 本轮保存状态 |
|---|---|---|
| Railway 账号插件设置截图 | 用户在本会话上传 **image(20261022-043214).png**，显示已连接 Railway 账号与技能 use-railway | **会话用户附件，未复制到 GitHub**；仓库交接留文件名和用途 |
| Chrome 无法访问状态页截图 | 用户在本会话上传 **image(20261022-050015).png**，含 ERR_CONNECTION_CLOSED | **会话用户附件，未复制到 GitHub**；说明用户网络端现象 |
| RawGitHack 固定外网旧链接 | [rawcdn 固定 URL](https://rawcdn.githack.com/jiangxng/EVO-App-Platform/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/index.html)，对应 G07–G09 原始 commit/workflow/docs | **完整精确地址已永久写入此索引**；历史 smoke probe 记录已在 GitHub，**今日实时访问待验证** |
| 静态演示目录源码 | [demos/tr01b2d3-isolated-stage](https://github.com/jiangxng/EVO-App-Platform/tree/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage) | GitHub 固定 SHA 持久可追索；HTML/JS/未部署 Bun 函数均在同目录 |
| BEX V3 设计原稿 | [#909 固定 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，Library 文件 **EVO-供应商导入-高保真体验版-V3.html**、**EVO-供应商导入-V3-体验包.zip**、**EVO-V3-导入首页.png**、**EVO-V3-字段核对桌面.png**（2026-10-15） | GitHub 原稿位置已记录，Library 用户个人附件未上传 GitHub；此轮没有生成新 PNG |
| BEX 真实 Host 对照证据 | [GitHub Actions Chromium artifact 12399603120](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39717491272/artifacts/12399603120)，历史版本 [artifact 12328632650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706/artifacts/12328632650) | **H**：来自此前本会话交接/Window13 研究遗产，未在本轮重新下载 PNG；Artifacts 可能到期，后续应按 exact SHA 重新生成或归档 |
| 本轮四 PR 合并的 CI 和分支删除 | G02、G04 精确 URL、merge SHA、workflow run ID | 已进入 GitHub 永久历史，CI 与 Artifacts 过期策略不同，不得假设永久保留所有截图 |

## 6. 直接映射到项目模块、文档与实际行动

- **发布／Railway Host**：Ledger Configurator、GitHub main、Railway service ID a8622238-480e-4da3-be6f-60fd0f3e18db；下一步先核对授权重连与安全条件，再启动**真正新 build**；检查 /health 与公网业务访问，验证部署 commit。保留现有 Postgres 和 /data 卷。
- **Eidos/Platform**：BEX-01 V3 的真实导入映射与 Host 路由，以 [Window 13 入口/索引](BEX-01-V3-M06-WINDOW-13-HANDOFF-ENTRY-20261022.md) 和 #909 原型为设计对照源；不要为了简单外网演示替换 Host/Eidos 通用组件。
- **业务 Gate**：M01–M03 旧历史报告工程通过；M04（客户真实 XLSX/字段身份）、M05（授权真实 precheck/commit）、M06（功能/布局/颜色 Human 审核）保留独立门禁；用户此次只授权 **测试部署**，不能误认为授权自动导入客户账本。
- **TR01 B2D3 静态例子**：只用 G07–G10 作为 RawGitHack 机制案例，不要将演示代码接入真的金融结算或宽松授权。
- **跨窗口并发**：当前本交接独立 **docs-only** 分支；不修改 #909、Window 12/13、项目状态文件、已有自动化工作流，不删除任何新窗口分支；需要进一步源码改动必须另开 Owner 正式分支、对齐最新 main 并走保护检查。

## 7. 后续读取优先顺序

1. **运行时真实状态**：GitHub main（G01）、Railway list/describe/deploy（G11）、当前平台是否仍拒绝新构建（G12）。
2. **安全重连**：W02/W03/W04/W05 的**官方完整原文**，尤其 Railway Github app reconnect、实际 workspace Audit Log、Postgres 轮换与回退；此前网页 open cache miss，若可访问应升格阅读等级。
3. **外网功能验收**：拿到新 SUCCESS commit 后访问 /health、身份登录、Eidos 宿主、插件安装运行、V3 供应商导入用户路径，并对照 #909 原型/Window13 未签收事项。
4. **不要再做的工作**：无目的再次搜索“此前另一个网站”、重新猜测 Vercel/Netlify、重建已删除旧 feat 分支、把 TR01 静态示例包装成 BEX V3 生产验证、重做 Window 13 的原型对照来源研究。
