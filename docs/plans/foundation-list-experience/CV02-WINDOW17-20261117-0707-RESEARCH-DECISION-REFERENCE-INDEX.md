# CV-02 Window17｜2026-11-17 #01–#07 研究资料、原始证据与方案取舍索引

> **性质：SOURCE-GRADE RESEARCH INDEX / DECISION RATIONALE / HUMAN_NOT_SIGNED。**
> 2026-11-17 本窗口新增核验，合入前受保护主线基线为 Platform `main@cb5bfd5ca28d26d99c4687c409c962975fdf848f`。交接 PR 合并后应以 GitHub 实际新 SHA 为准，不能把该快照称为永远最新。简短入口：[Window17 交接](CV02-WINDOW17-20261117-0707-RESEARCH-HANDOFF-ENTRY.md)。
> **网络来源边界：** 本窗口确实访问 GitHub 仓库原始源文件、PR 原说明/元数据、Issues、Actions 原始 Job 日志和 artifact 元数据；**没有**在本窗口打开下列 SharePoint/Odoo/SAP/明道云/W3C 外部官方网页，也**没有**取得东京 VPS 私有运行配置、真实登录账号、物理手机、读屏器或真人签署。仅链接旧索引不算重读旧网页。未下载/人工目视打开 Actions 截图压缩包，不写成“截图已目视审查”。

## 0. 阅读分级和证据等级

| 标签 | 具体含义 | 可以据此断言什么 |
| --- | --- | --- |
| **G 已读原文** | 2026-11-17 通过 GitHub Connector 实际读取仓库文件内容、PR 正文、Issue 内容；PR 页以其当时完整描述/元数据为准，不能自动当作逐行审过 PR diff | 仅相应文本或代码中的事实；有时再按具体 Run 验证 |
| **L 已读原始日志** | 2026-11-17 实际取回指定 Actions Job 原日志并搜索终端 marker | 对应准确 SHA/Job 的 CI 或部署动作；不等于 Human |
| **M 仅摘要/元数据** | GitHub PR 简述/合并字段、Actions artifact 名称/id/大小/digest/过期时间等；**不是**原截图或全部改动逐行验收 | 某项证据存在、来源位置与声明范围；保留待核实边界 |
| **H 历史索引转引，本轮未重读原网站** | 2026-11-06、11-09、Window14 已存研究结论及原网址；本轮只读**本仓库索引** | 保留历史取舍，不宣称本窗口重开网页或仍为最新版 |
| **P 待验证/未取得** | 实际 IdP/Host session、VPS 环境、真实设备、签字、访问受限外部资源 | 任何 PASS / 已批准 / 已上线声明都不成立 |

“已读原文”在 GitHub PR、源代码、日志与外部网站间分别标明；所有源检查日期为 **2026-11-17**。原研究的原阅读时间单独标注，避免改写历史。

## 1. 本窗口直接查阅：源代码和运行架构 G

| ID / 标题 / 原始网址 | 日期·等级 | 已核实的关键发现和章节/定位 | 对本项目的实际用途 |
| --- | --- | --- | --- |
| G01 [Eidos focus helper（Platform vendor）](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/vendor/eidos/src/app-host/catalog-route-focus.ts) | 11-17 G 已读原文 | 全文仅 37 行；`CatalogRouteFocusIntentV010` 限于 quick-filter 的 exact actionId / server-search；capture 只从 slot 内当前 focused 控件取值；restore 只定位既存按钮/输入框并 `preventScroll` | 禁止把任意 CSS selector、Principal、行数据/企业信息带进焦点状态；复用已有 Eidos 而非第二列表 |
| G02 [实际 Eidos Workbench Shell](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/vendor/eidos/src/workbench/shell.ts) | 11-17 G 已读导入/结构及既有 UI 评审 | 文件顶部实际 import `catalog-route-focus` + superseding request gate；运行入口链路在 Eidos #217 / Platform #1341 原描述中核验 `manager/app-host-client.ts → manager/desktop-workbench-runtime.ts → Eidos Workbench Shell`；本轮**没有逐行读完整个 shell** | 聚焦真正桌面工作台，不把 Browser Shell 的早期变更错误认作产品路径 |
| G03 [Counterparty 状态/角色/路由常量](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/apps/counterparty/constants.ts) 与 [页面定义](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/apps/counterparty/page.ts) | 11-17 G 已读关联定义 | 原路由 `/counterparties/customers`、`/counterparties/suppliers`、`/counterparties/my-customers`、`/counterparties/my-suppliers`；Eidos 页面复用原表、服务端搜索与状态过滤 | 人工测试 C1–C4 使用精准业务路由，禁止造演示替身页面 |
| G04 [真实 Chromium 脚本](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/tests/cv04/real_host_csv_download_chromium.py) | 11-17 G 读取文件开头及已存测试/工作评论；**不是全文件重读** | 开头直接标注 disposable actual Host、`productionUsed=False`、`127.0.0.1`，浏览器 viewport 1280/390、触屏模拟、真实 Eidos JS/ActionHost/Blob CSV；本轮原日志复核 4 个 focus marker/6 个 CSV 下载 | 证明可执行工程链路而非“真人手机、键盘、读屏” |
| G05 [Tokyo Compose](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/deploy/tencent-tokyo/compose.yaml) | 11-17 G 全文 87 行 | **22–43 行**：`APP_PLATFORM_MANAGED_SESSION_ENABLED: "false"`、OAuth/MCP false、仅共享 `demo-user` 的 `enterprise.context.create` 受限 Overlay；`APP_PLATFORM_PUBLIC_BASE_URL` 为东京预览；Postgres 17-alpine 是 DEV 运行存储，不能用来认证 CV03 权威 | #1343 身份阻塞的**仓库配置**依据；不能擅自切换/复制到生产，也不等于已现场读出 VPS 最终 env |
| G06 [Caddyfile 模板](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/deploy/tencent-tokyo/Caddyfile.template) | 11-17 G 全文 | 仅 /health 旁路；其它路由采用 Basic Auth 后 proxy 至 Host；密码 hash 是 bootstrap 后生成而不是本仓库模板明文 | 区分匿名 401 防护和按人企业身份认证；不要在 GitHub 留口令 |
| G07 [东京 CI-Gated 工作流](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/.github/workflows/evo-tokyo-dev-deploy.yml) | 11-17 G 已读配置关键区段 | **181–265 行**上传 Compose、按准确 SHA GHCR 构建/SSH `docker compose up -d --wait`，真实本机 /health，公网 HTTPS 和匿名 401；文档/测试-only 变更可跳过 deploy | 主线合并之后只核查该 SHA 的 preflight/deploy 判断；不把 SKIPPED 说成失败 |
| G08 [Host 启动、Session 存储与身份约束](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/manager/server.ts) | 11-17 G 已读定向原文 | **1274–1353 行**读取 managed-session flag；启用时必须有持久 Session file，User Directory 可用持久文件。**3043–3099** login Flow 需要真实绑定的 IdentityAuthenticationProvider 和 User Directory，未就绪 fail-closed；**3190–3280** 解析 request session 时不可将缺失 Provider 静默退回 demo identity；**6975–7056** 关闭 managed mode 时 `/auth/login`、`/auth/session` 等返回 `404 AUTHENTICATION_NOT_ENABLED`（源码预期，未进行远程带凭据 HTTP 验证） | 说明“只改一个 flag”不构成安全登录；未来 Owner 应执行有权的 IdP/Session/撤权与企业 Grant 端到端 |
| G09 [Authentication Flow](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/manager/authentication-flow.ts) + [Session Cookie](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/manager/session-cookie.ts) | 11-17 G 定向阅读 | `/auth/callback` 校验 HTTPS/public origin，Human Principal，经 Host Session 发 cookie，logout/revoke；cookie 为 `__Host-evo_session` 且受 HttpOnly/Secure 约束；不声称已实测东京真实 IdP | 正式企业身份接入的候选代码资产，避免另造登录平台 |
| G10 [OIDC Host Runtime](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/providers/oidc/host-runtime.ts) + [Provider Package](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/providers/oidc/package.ts) | 11-17 G 重点阅读 | 有 Generic OIDC package，需 issuer/clientId、Secrets Provider、Provider Runtime Binding/health，失效则移除 Runtime；“代码存在”不是“东京有已绑定且健康的外部 IdP” | 授权后只接现有 Host Provider 契约，避免临时硬编码 Google/导入 Railway 秘钥 |
| G11 [现有东京 demo 授权测试](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/tests/protocol/enterprise-context-creation.test.mjs) | 11-17 G 已读测试、实际新增并合并 | 原 demo-user/其他用户/AI/其他写操作 DENY；#1344 新增 20 行断言 managed session、OAuth/MCP disabled、受限创建 grant、Caddy Basic Auth，**未修改部署或身份准入** | 防止后续误用 shared demo 构成正式 Human 登录；正式获批的身份切换需独立 PR 同步修改测试 |
| G12 [旧身份登录单元测试](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/tests/protocol/authentication-flow.test.mjs)、[Managed Session 测试](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/tests/protocol/managed-request-session.test.mjs) | 11-17 G 定向阅读 | 测试 Provider 使用 `test.identity` 和假 URL；JSONL Session 重启持久化、cookie/request-bound resolver 与拒绝测试是协议夹具 | 不可用 test.identity / in-memory principal 取代实际 OIDC/Human 收据 |
| G13 [东京当前运维入口](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/docs/operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md) | 11-17 G 已读原文 | 当前是腾讯云东京 Lighthouse 预览，Railway 文档是历史；不能因为 HTTPS/401 成功宣称企业登录、生产数据或 CV03 授权 | 新窗口只查东京当前 run，避免返回旧 Railway 作为默认发布环境 |
| G14 [2026-09-30 Google OIDC Railway 旧 Runbook](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/docs/runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md) | 11-17 G 读前言与认证相关关键段 | **2026-11-13 新页首明确标注 `HISTORICAL_RAILWAY_OIDC_RUNBOOK / DO_NOT_EXECUTE_FOR_TENCENT_TOKYO`**；其下仍保留 2026-09-30 “LIVING RUNBOOK”、旧 Railway Callback/Client 示例，为历史审计，不可执行。原章 `3` Client 注册、`Gate A/B/C`、``9–10` External Agent 条件另见旧文 | 消解“旧文写 HUMAN LOGIN PASS”与当前东京预览 managed-session OFF 的表面冲突：环境不同、时间不同，旧 PASS 不能迁移 |
| G15 [东京旧企业创建授权决定](https://github.com/jiangxng/EVO-App-Platform/blob/cb5bfd5ca28d26d99c4687c409c962975fdf848f/docs/runbooks/EVO-TOKYO-DEV-ENTERPRISE-CREATE-AUTH-20261028.md) | 11-17 G 已读全文 26 行 | 明确 Basic Auth + compatibility-local Principal `demo-user` 只为创建验证企业，禁止真实客户数据和生产复制；静态 deny-first 规则先前导致 `STATIC_POLICY_NO_MATCH` | 为当前身份阻塞和最小权限解释提供历史上下文 |
| G16 [本轮 Human 空白执行包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md)、[已知旧 UI 评审](../../ui-design-reviews/CV02-20261117-COUNTERPARTY-OWNER-ROUTE-FOCUS-ACCEPTANCE.md) | 11-17 G 已读 | C1–C4 四原路由；H01–H11 包括真实 Tab/Enter/Space、页面状态和服务器搜索、CSV、撤权/换企业、物理手机与读屏；12 通道初始 `NOT_RUN`。旧评审 `真实 Workbench Owner 修正` 已指出 Browser→Workbench Owner 纠偏 | 后续实际签署的唯一执行包和设计限制；不可自动把表格填 PASS |

## 2. GitHub PR / Issue 原始网址（G 原说明和 M 元数据）

| ID / 标题 / 原始网址 | 11-17 阅读级别 | 关键发现 / 对项目用途 |
| --- | --- | --- |
| R01 [Eidos #215：Browser Shell Catalog 焦点](https://github.com/jiangxng/eidos/pull/215) | G PR 描述、M 合并信息；非全部 diff | 已于 11-17 合并 `62f7d481…`，原 Browser Shell 提议解决重查焦点；**不是**真实桌面 Workbench 的完整修复 |
| R02 [Eidos #216：hash 导航前抓取焦点](https://github.com/jiangxng/eidos/pull/216) | G PR 描述、M 合并信息 | 已合并 `e656d044…`；焦点捕获在 hash 导航前，修正 #215 捕获时机；仍未落到真实 Workbench |
| R03 [Eidos #217：真实 Workbench 共享 helper](https://github.com/jiangxng/eidos/pull/217) | G PR 描述、M 合并信息；结合 G01/G02 源码 | 已合并 `4c2bfea1…`；复用 `catalog-route-focus.ts` 于 Browser/Workbench，same-path 单次受管焦点意图，原 Read Gate 拒绝过时请求。**最终采用** |
| R04 [Platform #1335：有权 Counterparty status AND search](https://github.com/jiangxng/EVO-App-Platform/pull/1335) | G PR 正文、M 合并字段 | 合并 `359114a5…`；先 Principal/Enterprise/Responsibility/Field READ，再 ACTIVE/INACTIVE 与关键词 AND，最后排序/total/page；无 status grant 则拒绝；CSV/Agent READ 同源。**无需重新开发** |
| R05 [Platform #1340：首轮键盘证据及保留的失败](https://github.com/jiangxng/EVO-App-Platform/pull/1340#issuecomment-6938754854) | G 原始评论、M 阶段证据 | Tab→Enter 与搜索 Enter 在原 Host Chromium 有 4/4，原 INACTIVE/ALL 仍为 pointer click；此前 #1337–1339 原焦点链路失败，不可抹掉。不能称 100% 完整物理键盘 |
| R06 [Platform #1341：真正 Workbench 修复](https://github.com/jiangxng/EVO-App-Platform/pull/1341) 和 [原终局工程评论](https://github.com/jiangxng/EVO-App-Platform/pull/1341#issuecomment-6939437298) | G PR/评论与相关源码、M 合并字段，L 对应 Actions | 合并 `a211b5bfcfbed4ceadc942dff3df27bb5fc3327b`；此轮真实路由焦点回归 4/4、CSV 6/6、东京实际部署；删除错误 Browser-only 试验 |
| R07 [Platform #1342：真实 Human 验收执行包](https://github.com/jiangxng/EVO-App-Platform/pull/1342) | G PR/新文档、M 合并字段 | 合并 `86fd62875b40abc99643c19a916d837db337fddf`；四条路由、11 步、12 通道、独立测试者和审核人；仅文档，Human NOT_SIGNED |
| R08 [Issue #1343：真实 Human 签收任务](https://github.com/jiangxng/EVO-App-Platform/issues/1343) + [#07/07 终局评论](https://github.com/jiangxng/EVO-App-Platform/issues/1343#issuecomment-6940047632) | G Issue/评论原文、M 状态（最后本轮核对仍 OPEN） | 目前 `BLOCKED_IDENTITY_CONFIG / HUMAN_NOT_SIGNED`，无新 Owner/真人签收，12 通道 0/12；此为下一窗口唯一现场任务 |
| R09 [Platform #1344：预览身份 fail-closed 测试](https://github.com/jiangxng/EVO-App-Platform/pull/1344) | G 原 PR 正文/新增源码，M 合并字段，L 实际协议日志 | 合并 `cb5bfd5ca28d26d99c4687c409c962975fdf848f`；锁住 demo-only preview 与关闭的 managed/OAuth/MCP、Caddy；**不是**实际 IdP 认证或生产登录 |
| R10 [CV03 Owner 决策 #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[PA05 Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) | G Issue 内容定向、M OPEN 状态/PR 标题 | 三个边界独立；CV03 N1 NOT_CERTIFIED、人类 SAVE OFF，Operator 未签；不能因 CV02 自动化绿或过往 Issue 勾选项擅自关单或覆盖并行文档 |

## 3. Actions 原始 Job 日志、Artifact、截图位置（最易过期的证据）

| ID / 名称 / 原始网址 | 11-17 等级 | 日志标记、精确 SHA 与可持续查证的信息 |
| --- | --- | --- |
| L01 [#1341 合并后真实 Host Chromium Run 44023278978 / Job 133837500940](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023278978/job/133837500940) | L 已读原 Job 日志 | 主线 **`a211b5bf…`**；`CV02_OWNER_ROUTE_FOCUS_RESTORED_PASS` × my-customers/my-suppliers × 1280/390（4 组）；`CV02_OWNER_COMBINED_FILTER_CHROMIUM_PASS` 同 4 组；`CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6`。实际 Chromium/Host 的模拟宽度，非真人 |
| A01 [同 Run 的可下载浏览器 artifact](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023278978) | M **仅附件元数据，未下载、未目视打开截图** | 名 `cv04-real-host-eidos-csv-chromium-evidence`，**artifact ID 14301647261**，大小 **1,443,050 bytes**，SHA256 digest **a76493a81a9f495189199df567bf2f17586bbf928feb7e0c8a63214f0a29cbe5**；创建 2026-11-17 05:20:37Z，API 给出的过期 **2027-02-15 05:19:20Z**，当次 `expired=false`；下载 API URL `https://api.github.com/repos/jiangxng/EVO-App-Platform/actions/artifacts/14301647261/zip`（需有权账户）。**实际图像内容/具体文件数量待下载检查，不能声称已截图审过**；到期前由有权限的证据管理员保存原包/hash 到授权存储 |
| L02 [实际东京 DEV 部署 Run 44023312229 / Job 133838239733](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023312229/job/133838239733) | L 原 Job 日志 | `ghcr.io/jiangxng/evo-app-platform:a211b5bfcfbed4ceadc942dff3df27bb5fc3327b`；`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=a211b5…`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`；**只证明 DEV runtime 和匿名 401，不证明真实 IdP** |
| L03 [PR #1342 精确 HEAD 4 项 CI](https://github.com/jiangxng/EVO-App-Platform/pull/1342/checks) / [合并后主线 run #44024978914](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44024978914) | G Check-Runs 状态；L Branch Job 原日志 | PR HEAD `e378586…` 4/4 SUCCESS；合并后 `86fd6287…` Continuity/Lightweight SUCCESS；[东京 #44025009523](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44025009523) preflight PASS、deploy SKIPPED 且 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`；[Branch Hygiene #44024978529](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44024978529) 原日志删除精确分支 |
| L04 [#1344 PR Platform CI Run 44026330767 / Job 133847441648](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44026330767/job/133847441648) | L 原 Job 日志 | 精确 PR HEAD `3593d36ef2ca8950f56e4474b40e3fc1165e3ff6`；`ok 597 - Tokyo demo-only preview cannot be mistaken for signed-in enterprise Human identity`，`ok 598` 旧 demo 授权场景；最终 HEAD 9/9 SUCCESS |
| L05 [#1344 合并后 Platform CI Run 44026606661 / Job 133848346609](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44026606661/job/133848346609) | L 原 Job 日志 | 合并主线 `cb5bfd5ca28d26d99c4687c409c962975fdf848f`；新用例 `ok 597` 再次通过，**1438 pass / 0 fail / 1 skipped**；此为协议机器测试，不是 Human |
| L06 [#1344 合并后 Tokyo Run 44026641541](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44026641541) | L 预检原 Job 日志、G Jobs 状态 | `preflight SUCCESS` / `deploy SKIPPED`，`EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=cb5bfd5…`；**没有**由这个测试-only merge 重新部署一份镜像 |
| L07 [#1344 Branch Hygiene Run 44026607775 / Job 133848349650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44026607775/job/133848349650) | L 原日志 + G Git ref 查 404 | `DELETED_VERIFIED_MERGED_PR_BRANCH test/cv02-tokyo-preview-identity-failclosed-20261117 @ 3593d36…`；按精确 PR HEAD 清理，未删并行分支 |
| L08 [#1344 合并后主线 Checks](https://github.com/jiangxng/EVO-App-Platform/commit/cb5bfd5ca28d26d99c4687c409c962975fdf848f/checks) | G GitHub Check Runs 原状态 | 8 SUCCESS（Continuity、Platform、Lightweight、4 个 Plugin CI、东京 preflight）+ 1 deploy SKIPPED；不是所有检查都叫“8/8”，应保留跳过语义 |

**原始附件与聊天文件关系**：唯一核实存在的截图/JSON 浏览器证据是上表 **A01 GitHub Actions artifact**，本窗口**没有**将其下载到 ChatGPT 容器，也没有可交付的新 PNG/PDF 附件；其存在不等于机器截图经过 Human 审核。原始失败 log 从 [#1340 首轮评论](https://github.com/jiangxng/EVO-App-Platform/pull/1340#issuecomment-6938754854) 与 #1337–#1339 对应 Actions 重入即可；不能擅自清除/重写失败历史。

## 4. 外部网页的**历史参考**（本窗口未打开：H，不得冒充已读）

这些网址由此前 [2026-11-06 研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[2026-11-09 恢复索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) 和 [Window14 恢复](CV02-WINDOW14-20261117-POSTMERGE-CONTEXT-RECOVERY-HANDOFF.md) 保留。本窗口 2026-11-17 **仅实际阅读了项目内转述**，**未打开官网原文、未看新的搜索摘要**，日期为历史 2026-11-06（原索引所述）/本轮转引 11-17。

| ID / 官方标题与原始 URL | 阅读级别 | 可复用的**历史**启示 / 适用限制 |
| --- | --- | --- |
| EX01 [Microsoft SharePoint 列表/库视图](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | H 历史索引转引；本轮待复核官网 | 视图设置与业务事实分离；不可把 SharePoint Server 2019 与 Microsoft 365 实现混同 |
| EX02 [SharePoint Server 2019 limits](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | H；待复核官网 | 服务端分页与阈值研究，不把其 5,000 行限制照搬 EVO |
| EX03 [Odoo 19 View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | H；待复核官网 | 模型/视图/渲染分离，不引入 Odoo XML/Python、也不默认为每个插件配图表 |
| EX04 [Power Apps Grid control](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | H；待复核官网 | 列布局/多设备密度；不把高级内联编辑和无限滚动列为当前 CV02 必备 |
| EX05 [SAP Fiori List Report / Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | H；待复核官网 | 列表→详情→返回；沿用 Eidos，避免平行导航 |
| EX06 [明道云视图](https://help.mingdao.com/view/introduction/) | H；待复核官网 | 同数据源多视图；不是业务万能表 |
| EX07 [明道云应用](https://help.mingdao.com/application/introduction/) | H；待复核官网 | 对象/权限/视图/分析分层，禁止非受管 HTML/JS 注入 |
| EX08 [W3C WAI-ARIA APG Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | H；**实际用户设备行为待验证** | 先保证原生只读 table/button/search 控件焦点和语义；不凭 ARIA 属性/Chromium 代码测试代替 NVDA/VoiceOver |

更多 H01–H10 内部架构研究及其准确原址、旧阅读范围，请直接用 [2026-11-09 索引 `2](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)；本轮未重读其全部参考源，不重复造一份未经检验的历史书目。

## 5. 已采纳、排除与条件性方案（区分来源事实 G/L 与分析判断 D）

| 方案/范围 | G/L 原始依据 | D 本窗口决定与理由 | 限制、被排除替代方案 |
| --- | --- | --- | --- |
| 已采纳：Counterparty 仅 status + search 服务端组合筛选 | R04 PR 合并正文、实际 Host Chromium L01 | 沿既有 Domain Owner 有权行列投影后 AND；四原业务视图及 Human/Agent/CSV 同源 | 不新增通用 SQL 过滤器、客户端猜 total，不按隐藏字段反推权限；其他列表需各自 Owner 认证 |
| 已采纳：Eidos **Workbench** 使用共享焦点 helper | G01/G02 + R01/R02/R03/R06、L01 真 Chromium | 实际运行代码使用 Workbench，绑定 same business path 和真实旧控件 ID，读请求过时即取消；共享 helper，零敏感 scope 持久化 | 明确排除“只修 Browser Shell”与复制/深覆 vendor；已失败路径保留原日志 |
| 已采纳：复用现有全流程浏览器+当前页 CSV | G04 + L01/A01 | 真实 Host 与 Chromium 非 Mock、严验过滤/字段/下载及聚焦，机器级证据可重跑 | 不把 390px emulation 说成实体手机；未执行完整物理 Space/读屏器；非跨页后台 EXPORT |
| 已采纳：真实 Human 需要独立签署 | G16、Issue R08 | H01–H11 / 12 通道明确保留 NOT_RUN/FAIL/BLOCKED，独立身份/设备/审核者；#1343 是唯一收据入口 | 不使用 “Human UI Design Review Gate” 代真人、也不让 AI/CI 自动签署；可用样例数据必须真实授权 |
| 已采纳：东京 demo 预览继续 fail closed | G05–G15 + R09、L04/L05 | 以一条源码级回归锁定 managed-session/OAuth/MCP false、demo grant 和 Basic Auth，避免某次部署不小心半开身份 | **不是**正式 OIDC 上线方案；日后经批准的身份迁移须有独立 PR 同时更新相应测试/配置和回滚 |
| 条件性候选 A：单独合规 identity-enabled 测试环境 | G08–G14 + R08 | **D 推荐给 Identity/Security/Ops 评估**：保持当前公共演示站隔离，避免污染共享 demo-user，便于真人授权和隐私保护 | 需成本/环境/IdP/数据许可/主机部署签署；本窗口没有批准或创建该环境 |
| 条件性候选 B：在东京 DEV 做有计划的身份 cutover | G05–G14 + R08 | 可复用现有 Host/OIDC/Session 契约，但**只有真实 Authority 方案、Provider/Key/持久化/降级退出/回滚、Grants 批准**才能考虑 | 不能直接设 flag=true、复制 Railway Client/Redirect/KMS/秘钥、放宽 demo ALLOW；未测试，不宣称已完成 |
| 排除：为“连续执行”越过生产 CV03/CV04 门禁 | G13、R10、CV03 原计划 | CV03 SAVE 的 N1 Owner 权威与 PostgreSQL/outbox 独立，CV04 正式 EXPORT Host/DB/KMS 独立；CV02 UI CI 与它们无互认关系 | N1 NOT_CERTIFIED / SAVE OFF、正式 EXPORT OFF，#1212/#1092 OPEN、并行 #1184 不触碰 |

## 6. 冲突、缺口与下轮最值得查证的资料

1. **历史 Browser Shell vs 真 Workbench**：早先 R01/R02 的通过不能证明实际桌面焦点；R03 + G02 + L01 是最终判据。新窗口先核对 Platform/Eidos 是否后来变更挂载路径；禁止重新采用错误的 vendor 位置。
2. **旧 Railway 文档的 “LIVING RUNBOOK / HUMAN LOGIN PASS” vs 当前东京 managed-session OFF**：G14 顶部于 11-13 已标历史不可执行；旧证据属于另一环境，不是实质协议矛盾。若转正必须由 Identity Owner 核对当前 Provider 与密钥托管/回调；**任何私有 Provider 状态仍 P 待验证**。
3. **“CI Human UI Review SUCCESS” vs 实体 Human NOT_SIGNED**：它们验证的对象不同；H11 要独立签署、实体手机/实体键盘/读屏器和真实企业 Grant，且不得公开 PII。
4. **源码 Compose vs VPS 现场配置**：G05/G07/L02 提供“提交并部署的版本”证据，**没有直接审计当前 VPS 环境变量、运行中 IdP 或浏览器认证会话**。下一步获权 Operator 应在不暴露 Secrets 的前提下复核实际运行 SHA/Provider 状态/HTTPS Session；不可以源码推定私有临时 override 不存在。
5. **12 通道合格条件 vs 机器 4/4 / CSV 6/6**：缺实体 Space、读屏体验、独立企业双身份、身份撤权/换企业和人工视觉意见；这些是 **P 外部依赖**，不可通过再多 Chromium fixture 关闭。
6. **安全 Owner 已勾决策项 vs N1 仍 OPEN**：[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 是否具名/含环境/权限及生产签收需要实际 Owner 核实；不能凭 checklist 勾选解除 `NOT_CERTIFIED`。[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 也独立保持 OPEN。
7. **最新运行时 vs GitHub 最新 main**：合并后 main `cb5bfd5…`，东京最近原日志实发 runtime 是 `a211b5b…`；#1342/#1344 文档/测试变更被明确 SKIPPED，不能误报为东京已部署最新 main 镜像。
8. **Actions 证据保留期**：A01 metadata 显示 2027-02-15 到期；有权负责人若需长期审计，须在到期前下载原始包、记录已验证 hash/文件清单、受控备份并标注下载日期；本窗口没有访问 ZIP 内图片。
9. **外部厂商/W3C 网页更新**：EX01–EX08 当前可访问性、版本、章节和实时建议全部 **未在本窗口验证**；只有在具体设计需要变更时再打开官方页定向核实，不重复全面竞品研究。

### 推荐的定向研究和执行顺序

- **优先 P1：#1343 收到实际 Owner 回复时**，由被授权的 Identity/Security/Ops 查询合规测试环境的当前 Host `/auth/session` / Provider Binding / 持久化 Session/撤权/回调/真实权限，核对部署 SHA、Issuer、Client 绑定（不披露机密），完成独立批准。
- **P2：业务 Owner** 给出合法 Counterparty READ grants/状态字段与受限身份测试资料，确保真实用户可以做四条页面/H09 负例；最小权限、无真实客户敏感数据泄漏。
- **P3：Human/无障碍** 借真实设备完成 H01–H11/12 通道、合法 CSV、Focus Space/Enter、NVDA/VoiceOver；以私有脱敏证据 + 人类审核回执更新 #1343。失败才开修复 PR，不预设问题。
- **P4：只有在 Eidos 实际交互要求升级时**，重新阅读 EX08 Grid APG 对应 keyboard interaction 章节；只有在跨插件视图设计变更时才重新打开 EX01–EX07。未产生新结论就只复用旧索引。

## 7. 对应模块、已有文档、工作分支、交接边界

- **Eidos/Platform**：`vendor/eidos/src/app-host/catalog-route-focus.ts`、`vendor/eidos/src/workbench/shell.ts`、`manager/desktop-workbench-runtime.ts`、`apps/counterparty/{projection-query,projection-actions,page,constants}.ts`、`tests/cv04/real_host_csv_download_chromium.py`、`tests/protocol/enterprise-context-creation.test.mjs`。
- **Identity/Deploy**：`manager/{server,authentication-flow,identity-session-store,request-authentication}.ts`、`providers/oidc/{host-runtime,package}.ts`、`deploy/tencent-tokyo/{compose.yaml,Caddyfile.template}`、`.github/workflows/evo-tokyo-dev-deploy.yml`。
- **单一业务计划/设计**：[CV-00–07 八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[Window14 旧恢复](CV02-WINDOW14-20261117-POSTMERGE-CONTEXT-RECOVERY-HANDOFF.md)、[Human 执行包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md)、[现行东京发布入口](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)，以及本文件的[简短入口](CV02-WINDOW17-20261117-0707-RESEARCH-HANDOFF-ENTRY.md)。
- **已合入分支**：#1341 `feat/cv02-eidos-focus-continuity-adoption-20261117`、#1342 `docs/cv02-human-accessibility-signoff-kit-20261117`、#1344 `test/cv02-tokyo-preview-identity-failclosed-20261117`，均由 Branch Hygiene SHA-safe 清理，不能再复用删掉的分支。原 #1337–1340 只用于失败源证；不做平行恢复开发。
- **本交接文档工作分支**：`docs/cv02-window17-0707-research-handoff-20261117`，从 `main@cb5bfd5ca28d26d99c4687c409c962975fdf848f` 创建，**只能走 PR**，CI 成功后受保护 main 合并并核验清分支；不可直接 push main。交接文件创建期间本条属于待合并，不可预先称已合并。
- **绝对边界**：不手改自动生成的 `docs/roadmap/HANDOFF-LATEST.md` / `project.status.json`，不覆盖 #1184 受管材料；#1212/#1092 仍 OPEN，正式生产 Save/Export 不开。
