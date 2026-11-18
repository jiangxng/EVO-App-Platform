# List Foundation MVP #04→#05/06 · 跨窗口恢复与最小实施交接（2026-11-18）

> **状态：RECOVERED + #05 小切片待准确 HEAD CI；不是商业上线或真人/在线 LLM 签收。**
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
