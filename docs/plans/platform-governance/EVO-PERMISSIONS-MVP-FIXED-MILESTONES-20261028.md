# EVO 权限管理 0→1 固定进度表（当前专项）

**基线：2026-10-28。范围已锁定：只解决平台“创建企业资格”查询、授予/撤销和创建者成为企业 OWNER 的闭环。** 本专项只有 M0—M3 四个里程碑，任何新功能必须另行明确批准；套餐、众包、复制部署、集中多租户都不是这次交付的功能。

## 唯一固定验收状态表（每次汇报保留全部行）

| 验收项目 | 可衡量的完成标准 | 当前状态 | 下一步 | 验收证据 |
| --- | --- | --- | --- | --- |
| **M0 权限预检与友好提示** | 真实服务端可判定创建资格；至少覆盖“允许、无权限、未登录、撤销后”4 种场景；未授权者提交前看到中文说明，API 仍拒绝；不暴露 STATIC_POLICY_NO_MATCH 原文。 | **已部署东京，待 Human 验收**：功能 PR #1130 HEAD `66df22f4` 检查 47/47 成功、合并 `fd0e5ad5`；发布修复 PR #1132 合并 `ba1498e9`，Actions #40632097615 SUCCESS、VPS 就绪和公网 HTTPS/401 PASS。 | 真实浏览器验证当前共享预览身份的创建资格、未授权引导与“我的权限”；其余身份场景已自动测试，M1 才能多人实测。 | [功能 PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130)、[部署 #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615)、4 状态自动测试；Human 待签收 |
| **M1 可信身份与平台管理员** | 至少验证 3 个独立主体：平台 Owner、用户 A、用户 B；仅可信部署初始化流程能设定首个 Owner；A/B 和共享 demo-user 均无法自封管理员；退出、账号禁用后不能再写入。 | **未开始开发** | 复用现有身份能力，完成平台 Owner 初始化与正反向测试 | PR、登录/禁用/越权测试、审计 |
| **M2 权限管理页面 0→1** | 平台 Owner 可在“平台管理→权限管理”查看用户；仅能授予或撤销“创建企业”资格；授权/撤销立即生效且重启后仍有效；至少有两条授予/撤销审计记录；非 Owner 写入被拒、B 不受 A 授权影响。 | **未开始开发** | 建立可持久、可审计授权与最小管理页，验证撤销和重启 | PR、授权/撤销/重启/越权测试、管理页截图 |
| **M3 企业创建完整闭环** | A 获权后能创建企业甲并成为甲 OWNER；刷新后仍可见；B 不能越权访问甲；撤销 A 创建资格后不能创建新企业，但甲及其 OWNER 不消失；创建过程不自动装业务插件；CI、合并、部署、公网、Human 各自验证。 | **未开始本专项端到端验收** | 完成正反向集成测试，受控东京发布并做真实浏览器验收 | PR、测试、合并 SHA、Actions、公网检查、Human 签收 |
| **权限管理 0→1 整体** | M0–M3 全部逐项通过，安全负向测试无回归，记录完整后立即收口，不追加套餐/众包功能。 | **进行中**：M0 功能、CI、合并、东京发布已完成；M0 Human 未完成。M1–M3 未开始。 | M0 Human 验收后再进入 M1；不超前扩项 | 固定状态表、PR #1130/#1132、Actions #40632097615、Human 签收（未取得） |

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
