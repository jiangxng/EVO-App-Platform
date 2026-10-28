# EVO 权限管理 0→1 固定进度表（当前专项）

**基线：2026-10-28。范围已锁定：只解决平台“创建企业资格”查询、授予/撤销和创建者成为企业 OWNER 的闭环。** 本专项只有 M0—M3 四个里程碑，任何新功能必须另行明确批准；套餐、众包、复制部署、集中多租户都不是这次交付的功能。

## 唯一固定验收状态表（每次汇报保留全部行）

| 验收项目 | 可衡量的完成标准 | 当前状态 | 下一步 | 验收证据 |
| --- | --- | --- | --- | --- |
| **M0 权限预检与友好提示** | 真实服务端可判定创建资格；至少覆盖“允许、无权限、未登录、撤销后”4 种场景；未授权者提交前看到中文说明，API 仍拒绝；不暴露 STATIC_POLICY_NO_MATCH 原文。 | **M0 Human 新版体验已发现缺陷，未签收**：原功能 #1130 47/47 CI PASS；修复 [#1135](https://github.com/jiangxng/EVO-App-Platform/pull/1135) 7/7 CI PASS、合并 main `821c737b`，东京 [Actions #40637385127](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40637385127) SUCCESS，部署 SHA `821c737b`，本地健康、HTTPS/401 PASS；但用户新实图证明企业概览无返回、目录操作拥挤、概览泄露开发术语。新的定向 [Draft PR #1136](https://github.com/jiangxng/EVO-App-Platform/pull/1136) 已提交完整往返+低频操作层级修复，CI/合并/东京部署/Human **分别待验**。 | 先完成 [#1136](https://github.com/jiangxng/EVO-App-Platform/pull/1136) 的准确 HEAD CI 与独立 PR 合并；仍须受控东京发布并由 Human 验收“我的企业→进入企业→我的企业”往返、低频归档与主操作分离、业务信息层级，再检查原创建资格路径。M1/M2 不提前启动。 | [M0 原功能 PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130)、[UX 修复 PR #1135](https://github.com/jiangxng/EVO-App-Platform/pull/1135) 7/7 CI 与 merge `821c737b`、[东京发布 #40637385127](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40637385127) SUCCESS/本地健康/HTTPS/401；Human 新页面待签收 |
| **M1 可信身份与平台管理员** | 至少验证 3 个独立主体：平台 Owner、用户 A、用户 B；仅可信部署初始化流程能设定首个 Owner；A/B 和共享 demo-user 均无法自封管理员；退出、账号禁用后不能再写入。 | **未开始开发** | 复用现有身份能力，完成平台 Owner 初始化与正反向测试 | PR、登录/禁用/越权测试、审计 |
| **M2 权限管理页面 0→1** | 平台 Owner 可在“平台管理→权限管理”查看用户；仅能授予或撤销“创建企业”资格；授权/撤销立即生效且重启后仍有效；至少有两条授予/撤销审计记录；非 Owner 写入被拒、B 不受 A 授权影响。 | **未开始开发** | 建立可持久、可审计授权与最小管理页，验证撤销和重启 | PR、授权/撤销/重启/越权测试、管理页截图 |
| **M3 企业创建完整闭环** | A 获权后能创建企业甲并成为甲 OWNER；刷新后仍可见；B 不能越权访问甲；撤销 A 创建资格后不能创建新企业，但甲及其 OWNER 不消失；创建过程不自动装业务插件；CI、合并、部署、公网、Human 各自验证。 | **未开始本专项端到端验收** | 完成正反向集成测试，受控东京发布并做真实浏览器验收 | PR、测试、合并 SHA、Actions、公网检查、Human 签收 |
| **权限管理 0→1 整体** | M0–M3 全部逐项通过，安全负向测试无回归，记录完整后立即收口，不追加套餐/众包功能。 | **进行中**：M0 原代码、CI、main、东京历史部署及公网边界 PASS，但用户已发现企业概览新 Human 缺陷；#1136 修复还未合并/发布/签收。M1–M3 均未开始。 | M0 Human 验收后再进入 M1；不超前扩项 | 固定状态表、PR #1130/#1132、Actions #40632097615、Human 签收（未取得） |

## 每项必须分清五个门禁

**代码已完成、CI 已通过、已合并 main、已部署东京、Human 已签收**是五件不同的事。不能用前一项代替后一项。每个 PR 记录独立分支、精确 HEAD、必需 CI、回退路径；涉及 UI 附 Eidos 设计评审。历史东京 /health 通过不能算 M0–M3 的业务签收。

## 防止范围漂移

本次不做：收费/套餐、众包任务结算、完整企业角色矩阵、全局任意权限编辑器、Agent 身份重构、跨实例联邦、复制部署自动同步、多租户基础架构改造、业务插件自动安装或 Railway 数据改动。只允许 M0–M3 真正需要的身份、权限、持久授权、审计、企业 OWNER 链路的最小修复。

不能把共享东京 demo-user 自动提升为生产平台超级管理员；不得删除现有卷或绕过服务端授权。若遇阻塞，汇报具体证据、风险、原里程碑的最小解除动作。**超出固定范围必须先征得用户同意，不自行追加里程碑。**

## 每次进展汇报的固定约定

1. 始终使用标题“EVO 权限管理 0→1 固定进度表（当前专项）”。
2. 每次保留本表 M0、M1、M2、M3、整体五行；只更新可验证状态、证据和下一步。
3. 汇报本次完成的 PR/准确 SHA/CI，标注线上部署和 Human 分别是否通过。没做就写未完成，不做数字进度倒计时。
4. 有阻塞写清原因和谁执行下一步；不可因耗时或难点引入新功能。
5. M3 Human 完成且四项验收全绿时本专项结束，后续需求另外立项。

## 单一事实来源

本文件是里程碑状态唯一维护位置。主规格：EVO-PERMISSIONS-MVP-0-TO-1-20261028.md；更宽的权限规划、SaaS 套餐研究与来源索引只作背景，**不能自动进入当前范围**。每个后续窗口及相关 PR 引用此文件，禁止另起一张相互矛盾的表。

## 自动续跑 #01 · 2026-10-28 12:00:30（增量记录）
- M0 Draft PR [#1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130)：只读创建资格 API、企业列表与创建页引导、我的权限、友好失败信息、4 状态测试、Eidos UI 评审；准确 PR HEAD 和最终 CI 以本 PR 页面为准。
- **本次只标 M0 进行中**；M1、M2、M3 未开始，未对东京发布或改动现有权限、Railway、数据卷。验收口径和四个固定里程碑不变。

### M0 准确 CI 核验（自动续跑 #01）
- [Draft PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130)，准确 HEAD `66df22f4a5091f06846f86d5ea6fb307a6263f11`：GitHub CI **45/45 SUCCESS**（含 protocol-and-core、human-ui-design-review、continuity、lightweight-host）；页面、API、负面测试和设计检查已提交。
- **代码已验证 ≠ 线上验收**：该 PR 目前仍为 Draft，未合并 main；未发布东京，尚无真实浏览器 Human 签收。不可把先前东京权限覆盖策略的健康通过当本次 M0 的业务验收。

## 自动续跑 #02 · 2026-10-28 · 证据增量（不修改 M0–M3 验收定义）

- M0 功能 PR [#1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 正式评审后 **46/46 CI SUCCESS**，已受保护 squash merge `main@fd0e5ad55040ee92de79b9652e4e4b1cd778bde0`。**代码与合并 PASS；真实东京部署和 Human 未通过/未验**。
- 第一次单次发布 PR [#1131](https://github.com/jiangxng/EVO-App-Platform/pull/1131) 5/5 检查成功、合并 `5c000657b74f02e30f9c0ebbace7778b93e4db46`，但 Actions [#40631492619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40631492619) 因工作流 `on.push` 重复定义被调度前拒绝，**0 jobs，未修改 VPS**。历史发布触发器的清理 PR #1128 仍未合并，导致重复键；此失败不能记作部署 PASS。
- 最小修复 [PR #1132](https://github.com/jiangxng/EVO-App-Platform/pull/1132) 删除旧 marker 的重复 `push`，保留唯一本次 M0 marker 并更新它以产生独立重试。此 PR 仍须准确 HEAD required CI 全绿、合并后验证实际 Actions、最后关闭单次 push 触发。
- 本轮未启动 M1/M2/M3，未修改授权策略/持久卷/Railway/并行 owner；M0 Human 四场景及真正可用个人身份仍独立待验。

## 2026-10-28 自动续跑 #03：M0 发布证据增量

- 代码：[PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 合并 `fd0e5ad55040ee92de79b9652e4e4b1cd778bde0`，准确 HEAD 47/47 CI 成功；新读 API `GET /v1/permissions/me/enterprise-create`，已有插件路由 `/enterprise-contexts/my-permissions`；服务端写入仍执行独立授权。
- 首发 [#1131](https://github.com/jiangxng/EVO-App-Platform/pull/1131) 合并后遇到两个遗留 `on.push` 定义，GitHub **未执行 VPS job**；[PR #1132](https://github.com/jiangxng/EVO-App-Platform/pull/1132) 通过 5/5 CI，合并 `ba1498e951a5abcea1244f3b78e6a574a580c20b`，删除旧触发条件并重试。
- 一手 [Actions #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) **SUCCESS**：部署步骤、严格公网 HTTPS /health 与未认证根目录 401 验证均为成功。**健康检查不能证明页面内权限操作已签收**。
- 单次发布触发器收口 [PR #1133](https://github.com/jiangxng/EVO-App-Platform/pull/1133) **4/4 CI PASS 并已合并**，提交 `e37fa1f224d8062076c25f4697b72084f8db0743`；最新 main workflow 已只保留 `workflow_dispatch`，没有触发新的东京部署。东京共享 `demo-user` 无法模拟多个正式用户，不能把其预览页面当作 M1–M3 的多用户验收。
- 本次仍保持四项固定里程碑，不新增权限点、角色/套餐/众包任务。Railway、数据卷不变。

## 自动续跑 #04 · 2026-10-28 12:28:53 — M0 独立发布证据复核（范围不变）

- 本轮从 **main 最新源码**重新核实，M0 功能已经在 [PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 合并 `fd0e5ad55040ee92de79b9652e4e4b1cd778bde0`；存在实际服务端 `GET /v1/permissions/me/enterprise-create`、`/enterprise-contexts/my-permissions`、目录按钮预检、未授权页面中文提示和提交时独立再次授权，故**不重复开发**。
- **本轮读取了一手部署 job 日志**：[Actions #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) / job `122630601414`，于 2026-10-28 UTC 04:25 明确输出 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=ba1498e951a5abcea1244f3b78e6a574a580c20b`，随后 `EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS` 与 `EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。发布步骤 SUCCESS。此 SHA 是**真实 VPS 已健康启动的 M0 版本**，main 之后单独合并收尾 PR #1133（`e37fa1f2`），没有据此声称 VPS 也换成 #1133。
- [M0 自动测试](https://github.com/jiangxng/EVO-App-Platform/blob/fd0e5ad55040ee92de79b9652e4e4b1cd778bde0/tests/protocol/enterprise-create-eligibility.test.mjs) 检验允许、拒绝、无会话、撤销/显式 DENY、深链引导且写入服务端仍检查。**但这些是代码/CI 证据，不是 Human 浏览器签收**。
- **状态保持**：M0“已部署东京，待 Human 验收”；M1/M2/M3 均未开始。当前共享 `demo-user` 无法证明三真实独立主体的 UI，不能借此跳到 M1。
- **唯一待签收动作**：在东京已认证浏览器打开“企业上下文 → 我的权限”及“创建企业”，确认权限提示是可理解中文、允许时能进入表单；若当前账号有授予权限，不必为检验拒绝而先去撤销真实授权。未授权/撤销等负向案例已自动测试，更多真人实测要等 M1 真实身份就绪。
- 本轮没有更改任何产品代码、授权、运行环境、数据卷或 Railway，也没有新增里程碑。将实际 Human 观察（截图或用户确认）补入本条即可给 M0 完成签收；若发现缺陷，仍只在 M0 范围修复。

## 2026-10-28 长窗口交接入口（不改变既有 M0–M3 验收定义）

- [本窗口简短交接入口](EVO-PERMISSIONS-M0-WINDOW-20261028-HANDOFF-ENTRY.md)；[研究与决策详细索引](EVO-PERMISSIONS-M0-WINDOW-20261028-RESEARCH-REFERENCE-INDEX.md)。均在当前 Draft PR #1129 的研究分支，尚未合并 main。
- 本表仍是**唯一权威里程碑记录**：M0 已部署，**Human 待签收**；M1、M2、M3 不提前标记完成。不把新建的交接文档计作产品功能。


## 接续核验 #05 · 2026-10-28 — M0 Human 页面门禁复核

> **唯一固定状态表结论不变**：M0 Human 待签收；M1–M3 未开始。本段是证据增量，不另建里程碑表。

### 本窗口实际读取的一手工程证据（P1，非 Human）

- 已按顺序从交接分支 docs/evo-platform-access-management-plan-20261028@7cc6f2fcab210b9652a6b0fe118317174c222c61 读取交接入口、详细研究索引、本文、M0 规格。读取 GitHub 分支 API 确认 main@e37fa1f224d8062076c25f4697b72084f8db0743；规划 [Draft PR #1129](https://github.com/jiangxng/EVO-App-Platform/pull/1129) 仍打开，未合并。
- [M0 PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 已合并 fd0e5ad55040ee92de79b9652e4e4b1cd778bde0。实际读取准确 M0 PR HEAD 66df22f4a5091f06846f86d5ea6fb307a6263f11 的 [check-runs](https://github.com/jiangxng/EVO-App-Platform/commit/66df22f4a5091f06846f86d5ea6fb307a6263f11/checks)：47 success、5 skipped（52 条记录）；不得把跳过项写成已执行测试通过。
- [发布 Actions #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) conclusion success；读取 [Job #122630601414](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615/job/122630601414) 日志，明确输出 EVO_TOKYO_DEV_LOCAL_HEALTH_PASS（发布 SHA ba1498e951a5abcea1244f3b78e6a574a580c20b）、EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS、EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS。这是当次发布时的服务和边界证据，**并非本窗口的网页登录或页面 Human 签收**。
- 实际查看发布 SHA 的 manager/server.ts、manager/enterprise-create-eligibility.ts、apps/enterprise-context-governance/package.ts 及 M0 UI 评审和负向测试：GET /v1/permissions/me/enterprise-create 依赖当前 Principal、个人上下文、Authorization Provider；企业目录、/enterprise-contexts/my-permissions、/enterprise-contexts/new 用相同只读资格预检；无许可时中文说明且不暴露 STATIC_POLICY_NO_MATCH；创建提交仍须后端再次授权。**这是代码证据，并不证明真实浏览器已正确呈现。**
- 研究索引原有官网 P1/P2/P3 标记继续有效；本轮没有额外读取外部官网原文，没有升级摘要等级，没有产生改变已确认产品选择的新证据。

### 待签收的最小 Human 页面验收

1. 在东京现有已授权预览浏览器登录后，切至**个人空间**；打开“企业上下文 → 我的权限”（/enterprise-contexts/my-permissions）。记录是否加载、状态（已授权／暂不可用）、对应中文解释是否清楚；确认没有空白或原始错误码。
2. 打开“创建企业”（/enterprise-contexts/new）。有资格应能进入现有企业名称、企业代码表单；无资格应显示解释，不能出现可提交表单；个人空间不正确时应说明切换要求。**为验收展示页面无需实际创建企业，不得擅自改动授权或撤权。**
3. 记录访问日期、当前身份类别（共享 demo-user 或真实用户）、看到的资格状态，并提供这两个页面的**脱敏截图或清晰的人工观察记录**；不要上传 Basic Auth 密码、Cookie、Token 等秘密。
4. 本窗口没有能进入 Basic Auth 及登录会话的浏览器通道，也没有收到页面实际观察或用户签收，因此 **M0 Human = 待签收**。收到证据再在本文唯一里程碑表中更新 Human；若发现缺陷，仅按 M0 范围最小独立 PR 修复。自动负向测试不得代替真人页签收。

本轮不改功能代码、不授予真实权限、不重做 VPS/SSH/Docker/443，不影响 Railway、PostgreSQL、持久卷、PA05/BEX/Eidos/EC 并行 owner，不提前启动 M1/M2/M3。


## 自动续跑 #01 · 2026-10-28 12:42:33 — 当前东京预览身份 M0 门禁再核验

- 接续本专项既定范围：**只继续核验 M0 Human 页面，M1/M2/M3 均不开始**。本次没有新增套餐、角色体系或其它功能。
- 一手 P1 源码/运行配置（[东京 Compose](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/deploy/tencent-tokyo/compose.yaml)、[东京创建权限验证](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/tests/protocol/enterprise-context-creation.test.mjs)）：预览静态策略仅对白名单 HUMAN subjectId=demo-user 允许 enterprise.context.create，未放开归档、Provider 管理、任意用户或平台 Owner 权限；managed session 关闭，Basic Auth 仍只是共享预览边界。**只能推导条件下的预期，不能从代码证明 VPS 当前身份或 Human 页面呈现。**
- 一手 P1 页面实现：[manager/enterprise-create-eligibility.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/manager/enterprise-create-eligibility.ts) 和 [manager/server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/manager/server.ts)；当当前会话为 preview demo-user、Personal Context、且授权 Provider 可用时，预期“我的权限”呈已授权，创建深链进入表单。处于企业上下文时应提示切换个人空间，权限拒绝时应为友好提示而非裸露技术错误。语言来自 API 请求 locale（未附时回退 en），**网页最终中文渲染仍须真实客户端验证**。
- 一手 P1 现有 UI 质量门禁：[human-ui-design-review-gate.yml](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/.github/workflows/human-ui-design-review-gate.yml) 和 [.clinerules/03-human-ui-design-review.md](https://github.com/jiangxng/EVO-App-Platform/blob/ba1498e951a5abcea1244f3b78e6a574a580c20b/.clinerules/03-human-ui-design-review.md) 明确是静态设计评审/文档门禁，**不自动运行已认证浏览器截图或点击**。不得把 CI 设计门禁认作 Human PASS。
- 现有工具没有现成的东京已认证浏览器会话，因此此次仍没有真实页面截图/操作证据。沿用上方 #05 的最少两页脱敏截图/实际人工观察要求，不要求真实创建企业、不撤销权限、不触发重部署。**唯一状态仍是 M0 Human 待签收**，其余代码、CI、合并、历史部署/公网门禁状态不变。

来源分级仍按详细研究索引：本次新增的是仓库 P1 源码/工作流材料；外部官方来源无新查证，P2/P3 不升级。此次只追加同一固定表，无产品代码或环境变更。


## Human 页面观察 #06 · 2026-10-28 — 用户企业目录实图及插件 UI 设计门禁缺口

- **U / 用户实际浏览器截图**：东京当前企业目录展示一个已存在企业、顶部企业选择器位于企业上下文，当前身份 UI 显示共享 demo-user（非正式独立账号）。企业卡、创建新企业卡、我的权限卡并列：创建和权限卡重复“请先切换到个人空间”；页面直接出现技术分类 ACTION；企业卡重复呈现当前/默认状态，归档企业与进入企业在同一区域。用户明确表示导航难理解、插件界面随意，与认可的 V3/Eidos 设计方向不一致。**页面真实截图尚未作为 GitHub 图片文件上传，本轮只记录脱敏观察，不虚构存储路径**。
- **结论**：这是一次真实的 **M0 企业目录 Human UI 负面反馈**；不能把此前 M0 CI、发布和自动化测试改写为失败，也绝不能将 Human 标 PASS。**M0 UI 导航/信息层级未签收，需要最小整改并再次实测**；/enterprise-contexts/my-permissions 以及 /enterprise-contexts/new 的实际页面尚无足够证据，不用当前目录截图冒充其 Human 验收。
- **P1 / 新核验代码证据**：[context-page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/e37fa1f224d8062076c25f4697b72084f8db0743/apps/enterprise-context-governance/context-page.ts) 在创建卡设置 category: "ACTION"，重复将资格提示置入两个独立卡片；[CatalogBrowser renderer](https://github.com/jiangxng/EVO-App-Platform/blob/e37fa1f224d8062076c25f4697b72084f8db0743/vendor/eidos/src/catalog-browser/render.ts) 把 category 直接渲染为可见文字。[M0 UI review](https://github.com/jiangxng/EVO-App-Platform/blob/e37fa1f224d8062076c25f4697b72084f8db0743/docs/ui-design-reviews/evo-permissions-m0-create-eligibility-20261028.md) 已完成八节，但没有 V3 三轴或浏览器截图。
- **修复归属**：跨插件共性问题由独立 [Draft PR #1134](https://github.com/jiangxng/EVO-App-Platform/pull/1134) 强化项目 UI 开发门禁，Eidos 仍为 UI Authority。**当前 M0 具体页面缺陷**应先由当前 Enterprise Context/Eidos owner 确认现有导航契约，再在专用 M0 最小功能分支修复、实际浏览器桌面和窄屏验证。未确认 owner 不直接覆盖公共 Eidos 或其他 EC/BEX 分支。
- **范围/环境**：不为改导航额外引入 M1/M2/M3、套餐、众包、支付、独立多租户、插件默认安装；不动当前授权策略、Railway、PostgreSQL、东京卷、SSH/443。新的外部官网证据未增加，保留原 P1/P2/P3 分级。


## Human 页面观察 #07 · 2026-10-28 — 已证实创建成功但平台权限语义混淆、无法返回

- **U 第二张用户实图**：在已选择企业空间的共享 `demo-user` 会话中，“我的权限”页面标题仅显示该名称，子卡显示“创建企业 / 暂不可用 / 请先切换到个人空间，再创建企业”，**没有应用内返回企业目录操作**。用户明确报告“已经可以创建企业”且认为这里不是所要求的“EVO 平台权限”。该报告给 M0 实际创建允许路径增加真实用户陈述证据，但未核验所建企业的 OWNER 关联和 M3 隔离验收。
- **P1 源码根因**：`manager/enterprise-create-eligibility.ts` 在企业空间先因 `PERSONAL_CONTEXT_REQUIRED` 返回 `allowed:false`，不进行个人空间权限 Provider check。因此 UI 的“暂不可用”表示**当前前置条件不满足**，不能解释为当前主体缺少平台授权；原页面标题“我的权限”会误导为全平台权限管理，而 `CatalogBrowser` 原本就支持返回导航 `actions`。
- **产品正确边界**：M0 只读查询 `enterprise.context.create` 当前可执行性（平台作用域资格预检），不是授予/撤销管理；真实 Platform Owner 初始化属于 M1，**EVO 平台管理→权限管理**授予撤销编辑 UI 属于 M2；新建后 OWNER 与隔离专项验收属 M3。用户本轮是**纠正现有方向误读**，不是增加第五里程碑。
- **最小整改 Draft PR [#1135](https://github.com/jiangxng/EVO-App-Platform/pull/1135)**：把可见标题修为“创建企业资格”、解释非授权管理页；增加返回企业列表；把“需切换个人空间”状态与真正拒绝区别开；企业目录中的创建/查看资格移到页级动作，消除 ACTION 卡片。修改仅限 M0 UI 文案/导航和测试、Eidos review，不变更授权 Provider/静态策略、企业创建 Handler 或环境。**已提交待准确 HEAD CI 与真实浏览器验收，不能写已合并/已部署。**
- **修正验收**：用户回到企业目录无需依赖浏览器历史；在企业空间，“创建资格”页应解释需个人空间但不假称撤权；在个人空间，应展示账号真实资格且有权时能进入创建表单。M0 Human 仍 **未 PASS**。保存截图原文仅在当前对话，尚未写为 GitHub 图像文件。
- **保护边界**：不为页面缺陷重复发布已部署成功的旧 SHA；不动 Railway/PostgreSQL/持久卷/其它 owner，不提前开发 M1/M2/M3。研究 P1/P2/P3 标记不变。


## 自动续跑 #01 · 2026-10-28 13:16:40 — M0 修复 CI 收口及合并，受控发布待触发
- **P1 GitHub 一手核验**：[PR #1135](https://github.com/jiangxng/EVO-App-Platform/pull/1135) 准确 HEAD `1aea1dbc5548ecfb7e10d066bc591ddebfa0862f`：7/7 检查项全部 SUCCESS（protocol-and-core、lightweight-host、test、human-ui-design-review、titles 与 2 项 continuity）。曾因新增 Host→插件静态依赖触发 lightweight-host FAIL，随后在同一分支修复并**重新以准确 HEAD 全绿**，不得以旧失败推断目前仍失败。
- PR 经 ready-for-review 后按 `expected_head_sha` 限定精确 HEAD，以 **squash merge** 合入 main `821c737b7612ef6d49446bf628728ddee9ec90ce`；无直接 push main。M0 页面改为“我的企业/查看创建资格/返回企业列表”，将 PERSONAL_CONTEXT_REQUIRED 明确标记为上下文前置而非撤权，目录动作不再作为虚假企业卡片；创建权限的真实 Provider、Session、Handler 未变。
- **东京原部署不等于此修复已发布**。GitHub `.github/workflows/evo-tokyo-dev-deploy.yml` 当前只有 `workflow_dispatch`、仅 main、无输入参数；本窗口 Github 连接仅支持读取/合并 PR，**没有运行 workflow_dispatch 的写操作**，因此没有触发或宣称新的部署。用户唯一必须完成的操作是进入 [EVO Tokyo Dev - Verified Manual Release](https://github.com/jiangxng/EVO-App-Platform/actions/workflows/evo-tokyo-dev-deploy.yml) → Run workflow → main → Run workflow。发布会在原环境执行 `npm run test:platform`、构建当前 main SHA 镜像、通过原有 VPS 本地健康、公网 HTTPS 与未认证 401 检查；不要在未核实 Actions 日志前宣称成功。
- **Human 门禁仍未关闭**：发布成功后核对页面标题“我的企业”、操作“查看创建资格”、资格页实际状态（当前企业空间须提醒选择个人空间，**不等于没有授权**）、“返回企业列表”能正常返回、在个人空间的“创建企业”允许入口。保留两张脱敏截图；不需重复新建企业、不改真实授权策略。M1/M2/M3 原样未开始。
- **环境与 owner**：未触发重新安装 SSH/Docker、443 排障、Railway、PG/持久卷变更；PR #1134 插件 UI 质量治理继续独立 Draft，不与 M0 合并混淆；P1/P2/P3 原分级保留。本次是分层工程事实核验，**并非新的人类页面视觉验收**。


## 自动续跑 #02 · 2026-10-28 13:19:19 — 东京发布实时 SUCCESS 与唯一 Human 门禁
- P1 **实时 GitHub Actions**：[EVO Tokyo Dev - Verified Manual Release #40637385127](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40637385127) 以 `workflow_dispatch` 从 `main@821c737b7612ef6d49446bf628728ddee9ec90ce` 执行，status=completed，conclusion=success。该工作流为真正 GitHub Actions 手动触发，不是本窗口调用的操作；本窗口仅发现并读取状态和脱敏日志。
- 发布 job `122647386894` 实际运行日志明确有 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=821c737b7612ef6d49446bf628728ddee9ec90ce`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`；镜像构建上传、远端 Compose 就绪、临时 SSH 凭据清理也全部 SUCCESS。未改 Railway、数据卷、PostgreSQL 或权限策略。
- **M0 代码/CI/main/东京部署/公网均已验证，但 Human 仍不合格／待新版重验**：旧用户截图证明目录信息层级与资格页返回有缺陷；#1135 已修复并上线但尚未收到新版已认证浏览器点击证据。下一步仅需在同一预览帐号操作“我的企业 → 查看创建资格 → 返回企业列表”，并在个人空间确认资格提示；不需要再次创建真实企业。
- M1 可信平台身份、M2 平台 Owner 授予撤销资格的真正“平台管理→权限管理”、M3 OWNER 与跨主体隔离专项验收仍**未开始**；不将本次“创建企业资格”只读页冒充平台授权管理，也不因用户曾成功创建企业就直接判 M3 PASS。P1/P2/P3 研究分级和并行 owner 边界不变。


## Human 反馈 #08 · 2026-10-28 — 进入企业无返回与低频操作拥挤（设计流程根因）
- **U / 两张真实东京最新截图**：第一张“我的企业”里“归档企业”“进入企业”在同一拥挤的卡片操作区，归档帮助信息占位且折行。第二张从“进入企业”到企业概览后，**没有稳定的返回“我的企业”操作**；界面出现 `ACTIVE`、`OWNER`、`Enterprise ID`、`Context ID`、`薄容器` 与“插件操作资源”等内部术语。用户明确指出：这种缺陷应由开发过程提前举一反三，不应由用户逐页发现。这些截图证明 **M0 Human 体验不合格**，但不证明后端权限服务失败。
- **P1 / 回归缺口定位**：旧 `tests/protocol/enterprise-create-eligibility.test.mjs` 只验证“目录→创建资格→目录”，没有覆盖“目录→ENTERPRISE 上下文选择→概览→返回”。既有八章 `ui-design-review` 的静态 CI 不证明完整 Human Journey。Eidos 已有 `CatalogBrowser.contextNavigation` / mobile parent 和 Host page-controller `[data-eidos-context-route]` 点击到 `onNavigate` 绑定，无需新造宿主框架。归档命令仍由 Host 验证 OWNER、确认并在成功时返回 `navigateTo: /enterprise-contexts`。
- **定向代码整改**：[Draft PR #1136](https://github.com/jiangxng/EVO-App-Platform/pull/1136) 将目录用已存在 Eidos `list/compact` 表达、保留“进入企业”唯一对象主动作、低频“归档/设默认”移至概览管理区域；概览增加 desktop/mobile 父级返回、只显示当前企业业务信息，去除默认页显的原始系统 ID/角色状态英文枚举及技术说明。原服务端授权、业务写入、归档确认、目标 context ID 没有更改。新增 `tests/protocol/enterprise-context-human-journey.test.mjs`，并更新既有归档测试保证没有功能丢失。
- **跨插件流程修复**：既有 [Draft PR #1134](https://github.com/jiangxng/EVO-App-Platform/pull/1134) 增补“入口→目的地→返回→异常恢复”矩阵和导航变更同 PR 必须更新测试的 CI 条件，更新 `AGENTS.md` 与 `.clinerules/03-human-ui-design-review.md`，既有 Eidos Authority 不变；当前只是 Draft 研究/治理，不冒充已经进入 main 的机制。
- **证据分层**：用户新截图为 U 的旧线上 Human 缺陷；#1136 新代码 PR 仍以**最终准确 HEAD CI**为准，未完成合并、东京发布和修复后 Human。因此 M0 **不得 PASS**。M1 平台 Owner、M2 EVO 平台授权/撤销管理、M3 OWNER/隔离专项仍未开始。P1/P2/P3 既有来源等级延续，未新增外部原文、未更换已确认方案。
