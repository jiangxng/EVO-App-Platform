# List Foundation MVP #04→#05/06 · 跨窗口恢复与最小实施交接（2026-11-18）

> **状态：RECOVERED + #1353/#1354 已合并并完成东京 DEV/PREVIEW 发布；#03/07 在线 LLM 独立验收工具候选待 CI；LIVE_LLM_UNVERIFIED，不是商业上线或 Human 签收。**
> 当日 GitHub 受保护基线：Platform `main@4efbbc7043d695955b19b3e6866bc10aac2abd36`，Eidos `main@1350e8f6557d0622331aae882da12b170c483994`。本次独立分支 `feat/cv05-mvp-agent-exact-view-navigation-20261118`，不得直接 push main。

## 1. 用户明确要求 / 决定（C）与 owner 边界（A）

- 按现有 Eidos + Platform 继续 List Foundation MVP，共用 Domain Owner 的 Collection/权限，支持 Human 与 Personal Agent；**不新建第二套列表、看板、NL/SQL 执行器或授权系统**。新能力优先补直接可验证的缺口。
- #04 的表格/独立授权图表/只读看板沿同一受管路由切换，搜索、系统 View、排序、列、页码、详情返回与企业作用域不丢失；图表使用单独 Host 授权的全匹配集合聚合，小桶隐藏；看板只呈现 `AUTHORIZED_CURRENT_PAGE`，不拖拽/写状态。
- 只用短期独立分支 + Draft PR + 精确 HEAD CI；受保护 main 合并后验证主线/东京 SHA、Basic Auth 401/健康，再由 Actions 安全清理已经合并的过程分支；不误删并行工作。
- #05 重点为**真实模型自然语言 → 已授权 query/preview → Eidos 可点击准确筛选列表 + 歧义与失败恢复**。必须区分真实 LLM、scripted inference、真实 Owner/ActionRouter、Chromium 与 Human 体验各自的证据等级。先做最小可闭环，不解锁正式 SAVE/EXPORT/WRITE。

## 2. 已完成与证据分层

| 范围 | 实际代码/合并（A） | 已验证证据（B）与限制 |
| --- | --- | --- |
| #04 Eidos Owner | [eidos #219](https://github.com/jiangxng/eidos/pull/219)，main `1350e8f...` | Owner 2/2 checks、Human UI *Review workflow*；这不是物理设备真人商业签收 |
| #04 Platform | [#1352](https://github.com/jiangxng/EVO-App-Platform/pull/1352)，main `4efbbc7...`，真实 Domain Directory / Eidos / Host 采纳 | [最终原始回执](https://github.com/jiangxng/EVO-App-Platform/pull/1352#issuecomment-6969443680)：PR 52/52、merged-main 45/45、真实隔离 Host Chromium 1280/390 切换；PG18 首次 37/38 失败，定向 38/38 复验成功，不能抹掉原失败 |
| #04 东京预览 | SHA 固定镜像 `ghcr.io/jiangxng/evo-app-platform:4efbbc7043d695955b19b3e6866bc10aac2abd36` | [Tokyo Run #44239359204](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44239359204) 据上述最终回执为 SUCCESS/healthy/HTTPS/401；本恢复窗口未独立执行 SSH/Human 登录 |
| #04 分支 | [Branch Hygiene #44239238925](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44239238925) | 回执记录按 exact HEAD 删除 #1352 merged branch，未触碰其他分支 |
| 旧 CV05 Agent | [#1314](https://github.com/jiangxng/EVO-App-Platform/pull/1314) 现有 `evo.collection.read.preview`；[#1315](https://github.com/jiangxng/EVO-App-Platform/pull/1315) Eidos Chat 导航；[#1317](https://github.com/jiangxng/EVO-App-Platform/pull/1317) 脚本模型→真实 Host→Eidos 二次授权；原 `tests/cv05/real_host_agent_list_chromium.py` | 脚本化 provider ≠ 真实在线 LLM；自动 Chromium ≠ 真人 Google 登录及物理读屏器签署 |

## 3. 本 #05 切片：发现真实缺口，禁止重复造轮子

- 直接复查 `agents/enterprise-agent/{collection-read-preview,reply-presentation,capability-fabric-tools}.ts` 与 `apps/{business-dictionary/directory-query,counterparty/projection-query}.ts`：Owner 已支持 `subjectType/status` 筛选、字典 `presentation` 路由；但 Agent Chat 的动作白名单仍停在旧 `view/search/sort/page`，可能丢失**合法成功预览的跳转按钮**。
- 采取最小改动：Chat 导航识别 Domain 当前合法的公共参数；`presentation` 只作为 **Dictionary-only 路由提示**，`input` 保持 Owner 授权的结构化查询，先 Host READ 后 Eidos 再授权，Chart 仍需独立授权聚合，Board 仍只展示当前页；不借此启用个人 Saved View 或其它列表展示。
- 增量回归在原 `tests/integration/cv02-personal-agent-authorized-collection.test.mjs`：Supplier 真实 Owner 的 `subjectType` 组合筛选；脚本模型驱动 Dictionary `board` → Chat URL → parser → Host 二次 READ；非法 presentation、非字典展示提示和未授权 status 负例。**本段在 PR CI/合并以前只表示已提交实现，不表示验证成功**。

## 4. 现存缺口（U）与下一步

- 真实在线模型的**歧义识别、缺字段追问、失败解释/恢复**尚无可复现 provider/人类质量签收证据。后续仅围绕原模型/Tool/Chat 旅程补真实 provider 的成功/歧义/失败实测或可执行验收，不自造“准确率”；离线模型只能标记为脚本夹具。
- 登录/物理键盘/390px 实机/读屏器 Human 签收仍为 [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) OPEN，用户已确定**优先演示 MVP，正式身份准入推迟到上线前**。CV03 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) N1 NOT_CERTIFIED / Human SAVE OFF；CV04 正式后台 EXPORT OFF；PA05 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) Operator NOT_SIGNED；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不触碰。
- 若 CI 失败，在当前 PR 精确 HEAD 定位并修复；通过后 Ready→受保护 main，重查 main SHA/东京 CI-Gated 发布及 SHA-safe Branch Hygiene。**不在恢复窗口清理无合并证据的旧分支。**

来源/采用取舍/未恢复项，见 [研究与证据索引](CV05-MVP-0506-20261118-RESEARCH-EVIDENCE-INDEX.md)。


## 5. 自动续跑 #01/07（2026-11-18）· CV05 歧义与失败恢复闭环

> 这是 #05/06 的后续小切片，原 #04/06 和 #1353 已合并，固定基线为 `main@d289f8bf4e6b535080a7d195140b35860c01c02e`；本切片独立分支 `feat/cv05-mvp-ambiguity-recovery-20261118`。以下为**代码变更的预期验收**，在准确 HEAD CI / 合并完成之前不写“通过”。

- **确认未重复实现：** 原 Provider-backed Personal Agent `provider-model.ts` 已有 Host 的动态 Tool Catalog、会话历史与模型系统规则；`runtime.ts` 已有成功 READ 去重与失败 Observation，`evo.collection.read.preview` 与 Eidos `navigate` 在 #1314/#1315/#1353 已实现。不建第二 NL 解析器/模型/授权或路线解析器。
- **本轮新的模型指导（仅是指令，不是质量证明）：** 业务列表先依 Domain Owner 元数据与 Human 意图确定 Collection/字段；对象或视图有重大歧义时只问一个澄清问题，不猜测；失败、非法、撤权筛选不默默放宽，不用先前旧路线；得到用户明确修正后才重新走现有 Host READ；Board 当前有权分页、Chart 独立授权聚合。
- **本轮实际 Host/Eidos 契约：** `reply-presentation.ts` 以前只看最新一次 Preview Observation 是否成功。现在即使最后 Preview 成功，只要后续任何 Host 工具失败，也不提供陈旧的 `open-authorized-collection` 动作。失败 Activity 保留错误码；下次 Human 明确修正后可以通过新的 Preview 获取独立有权链接。
- **复用原测试夹具：** 在 `tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 增加（1）歧义问题→不执行任何 READ；下一轮对话历史澄清后真实供应商 Owner 查询与新 Host 路由复读；（2）真实 Owner 拒绝未授权 `status`，当前轮无导航；用户显式移除状态并改为已授权 `subjectType`，下一轮重新查询；（3）先有权获取字典 Board，随后其他 Host Inspection 失败，聊天动作必须隐藏。使用真实 ActionRouter/Owner/Chat，但 Provider 推理**明确标记 scripted**。
- **真实 LLM 非自动冒充：** 本轮不能从 CI 中已有 scripted provider 证明自然语言质量。在未证实有可用在线 `llm.inference` 绑定和安全隔离的实际身份前，明确标记 `LIVE_LLM_UNVERIFIED`；不得读取/写入生产密钥、越过 #1343、#1212 或用演示预览代替登录上线。只有获得真实 Provider 的请求/回应、模型版本、脱敏测试记录与独立确认结果时，才能升级相应验收等级。

**唯一继续方向：** 同 PR 修复其准确 HEAD CI 发现的错误，Protected Main 合并后核验 Tokio 当前实际 SHA、HTTPS/401 和 Actions 精确分支清理；之后针对在线 LLM 的真实澄清质量做独立可审计的实测，不开启 N1 SAVE/后台 EXPORT/WRITE。


## 6. 自动续跑 #02/07 · 已核对的东京部署与分支清理

- [#1354](https://github.com/jiangxng/EVO-App-Platform/pull/1354) 已合入主线：`main@8e2347fb05bab6dd3bab2dac980334ce33d690e9`，PR HEAD `5654b7900d16118c9ac760b31b51f04a936a4a39` 22/22 SUCCESS，合并主线 19/19 SUCCESS。
- [CV05 合并后主线真实 Chromium #44290582355](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290582355) 原始日志显示 Supplier/Dictionary 1280/390 4/4 和组合筛选回归通过。
- [东京 CI-Gated #44290644461](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290644461) 预检与部署 SUCCESS：真实 VPS `evo-tokyo-dev-evo-1` 的镜像 `ghcr.io/jiangxng/evo-app-platform:8e2347fb05bab6dd3bab2dac980334ce33d690e9`（healthy），`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`；映像 Build manifest `sha256:6773819873c87e45795b44e15e4d956cfcb4a6a7a455495eb85edc11d9af1897` 并非独立读取的运行容器 digest。
- [Branch Hygiene #44290585623](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290585623) 日志 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv05-mvp-ambiguity-recovery-20261118 @ 5654b7900d16118c9ac760b31b51f04a936a4a39`。最终签收回执见 [#1354 评论](https://github.com/jiangxng/EVO-App-Platform/pull/1354#issuecomment-6976838749)。
- 这只签收 #05 既有 Scripted Provider + 真实 Host/Owner + Eidos + 东京 DEV/PREVIEW；**没有真实在线模型意图推理证据**。

## 7. 自动续跑 #03/07 · 实际在线推理隔离验收工程候选

- 独立分支：`feat/cv05-live-llm-isolated-acceptance-20261118`，固定创建基线 `main@8e2347fb05bab6dd3bab2dac980334ce33d690e9`。后续若有真实 PR 合并/发布，用其新的准确 SHA 作为执行证据，不用旧 SHA 冒充。
- 已核实两个真实 Provider（OpenAI/DeepSeek）均存在，但其现有自动化测试都使用 `fetchImpl` 假回应；GitHub CI 未找到真正联网的 CV05 语义验收。不得把合成推理称为在线成功。
- **本轮只增加 opt-in 测试工具，非业务实现重做：** [独立在线验收方案](CV05-MVP-0506-20261118-LIVE-LLM-ACCEPTANCE.md)、只在手动 `workflow_dispatch` 启动的 Actions 工作流、需明确测试费用同意与独立 QA 密钥的本地 Launcher、保留真实 Domain Owner/ActionRouter 的五个联网业务断言，以及常规 CI 无网络的准入负例测试。
- **当前事实状态：** 新代码待本 PR 准确 HEAD CI；没有专用 `CV05_LIVE_LLM_TEST_API_KEY` 是否存在的可信证据，更无实际 `/responses` 远程模型调用记录。因此 `LIVE_LLM_UNVERIFIED`，不可说 L01–L05 PASS。Manual workflow 绝不自动触发，也不能默默使用服务器的生产凭据。
- 不放宽权限、不增加 WRITE、不开放 SAVE/后台 EXPORT、不解除 #1343 / #1212 / #1092，不改变 #1184。工程完成后按完整 CI→精确 HEAD→受保护主线合并→东京镜像及 HTTPS/401→Actions 分支治理收口；下一轮才在专用测试身份与密钥具备时运行真实模型质量验证。
