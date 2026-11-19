# CV07 / List Foundation · 本窗口研究与决策简短交接入口（2026-11-19）

> **START_HERE / CURRENT_HANDOFF**。首先读[详细参考索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)，其 §1–§3 有完整原始 URL、阅读层级、日期、固定 SHA、Run/Job、截图/Artifacts 位置；§4–§5 分别记录采用与排除方案、冲突及下一步查阅。然后读[CV07 工程/东京原证](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md)和[第三插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md)。**仅新增入口/索引，不修改其他窗口交接或 11-06 历史八步原计划。**

## 1. 用户本窗口明确目标与固定执行约束

1. **主线：继续 Foundation List Experience**；围绕 Eidos + EVO 插件 Platform + Domain Owner + 原 Host/Personal Agent 的**可复用列表体验**（多视图、受权搜索/排序/分页、详情返回、Chart/只读 Board、Agent 有权 READ）。不建立第二套 List/Grid/BaseList、业务库、Host 授权或 Agent 框架。用户希望“能验收时通知我”，**没有要求目前虚报全部完成**。
2. **优先级决定：未来倾向部署私有模型**；DeepSeek 余额预警、本地预算估算、真实付费 L01–L05 **不是当前 List Foundation 可演示 DEV/PREVIEW 的关键研发阻塞**。此前用户批准单次收费 QA 费用不超过 USD 2，已经设置 DeepSeek 余额提醒，并在 GitHub 截图中配置独立的 \`cv05-live-qa\` 环境级 Key、仅 main；但**本窗口没有发起任何收费模型 Run，未验收真实 L01–L05**，#1359 保持独立待办。未来私有模型走原 \`llm.inference\` Adapter/Host/Agent。
3. **治理：** 新改动必须**独立短分支→Draft PR→准确 HEAD CI 全绿→Ready→受保护 \`main\` 普通 merge commit→合并后主线 CI→东京物理部署或合法非运行时 SKIP→Actions 按精确 PR HEAD 清理过程分支**。不直接 push main、不批量清理、**不修改并行 PR #1184** 或其他 Owner 窗口。
4. **安全门禁不变：** Human OIDC [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、CV03 生产级 Saved View WRITE [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、CV04 正式后台 EXPORT、PA05 Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、生产 WRITE 不因 DEV/PREVIEW 通过自动开放。

## 2. 本轮已经真正执行与签下来的原证

| 工作 | 原件与结论 | 边界 |
| --- | --- | --- |
| 第三业务插件 Item | 前序 [#1365](https://github.com/jiangxng/EVO-App-Platform/pull/1365)–[#1367](https://github.com/jiangxng/EVO-App-Platform/pull/1367) 合并；原 Item + Responsibility + Host Owner/Eidos + 有权 Query/列表导航 | Item 已接入，不等于 Warehouse 或第四插件已完成 |
| 新发现并修复的真实问题 | [PR #1368](https://github.com/jiangxng/EVO-App-Platform/pull/1368)，准确 HEAD \`9a0b75d0f792f0b164e334002286bfb0f9543157\` **6/6 CI SUCCESS**，合并 \`702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf\` | 原分页前为所有合法 Item 读扩展/反复过滤责任；现先**完整授权→合法查询/选当前页→仅装配当页扩展**；旧无分页调用兼容 |
| 1k/10k 原始主线性能 | [Actions #44509904752](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904752) 成功；1k：seed 92.93 ms，4 次样本 p95=max 54.79 ms，RSS 108.1 MiB；10k：seed 791.24 ms，p95=max 457.03 ms，RSS 374 MiB；两组各 23 次页内扩展装配 | **内存 EnterpriseResource + 真 Item Owner/静态 Host 授权**，非 PostgreSQL/生产 SLA。Artifact 名 \`cv07-item-owner-1k-10k-receipts\`，Runner 路径 \`artifacts/cv07-item-scale/receipts.json\`，保留 30 天 |
| 合并后 Host Chromium 1280/390 | [Actions #44509904650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904650) SUCCESS；原日志明确 \`CV07_ITEM_REAL_HOST_CHROMIUM_PASS:1280\`、\`390\`、\`BROWSER_ACCEPTANCE_PASS=2\` | **隔离本地真实 Host/Eidos + Chromium**，不是公网东京真实业务账号 |
| 合并后主线工程验收 | \`702a74e...\` 的 Platform [#44509904648](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904648)、Continuity [#44509904652](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904652)、Lightweight [#44509904709](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904709)、Scale/Chromium 全部 SUCCESS | 代码/CI PASS ≠ 真 Human、正式生产或 Live LLM |
| **东京实际物理部署** | [Tokyo #44509954215](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509954215)：\`preflight SUCCESS / deploy SUCCESS\`，VPS 确认实际容器镜像 \`ghcr.io/jiangxng/evo-app-platform:702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf\`、healthy、本地/公网 HTTPS、未授权 401 PASS | **已发布 DEV/PREVIEW**，未证明真实东京企业用户/Item 样本可操作 |
| 源级证据与演示验收步骤 | [PR #1369](https://github.com/jiangxng/EVO-App-Platform/pull/1369) HEAD \`fee5994cc4b812897d3faac9b2ed6921ac673a5c\` 3/3 CI SUCCESS，普通合并到 **受保护 main \`67cf16acf9209bb24ad833c5c3d669cae4279519\`**，合并后 Continuity/Lightweight SUCCESS | [Tokyo #44512382159](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44512382159) 正确 \`EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE\`，所以实际运行镜像仍是 \`702a74e...\`，不是文档主线 SHA |
| 分支与治理 | [Branch Hygiene #44509904385](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904385) 和 [#44512343435](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44512343435) 原日志精确删除 #1368/#1369 过程分支，再查均 404 | 其他窗口分支、特别 #1184 未改动 |

研究性质的外部资料已归档[详细索引 §1](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)：GitHub 环境与 Actions 官方文档的此前 **O 原文记录**、OpenAI/DeepSeek 的 **S 摘录与局部 O**、SharePoint/Odoo/Power Apps/SAP/明道云/WAI-ARIA 的 2026-11-06 **H 历史研究**，均保留原始 URL 和核验等级；当前只读 GitHub 原始证据则标 **G**。不补造尚未抓取的官方完整 API 页或截图。

## 3. 已采用决策、未采用路线和仍未解决事项

**采用（工程判断，非资料本身）：** 现有 Eidos CatalogBrowser table、当前 Owner 授权的有界 Collection READ、Host/Agent 有权 Operation；Item 作为第三实例，完整授权先于筛选/分页，页内才 Hydrate；原 CI-Gated 东京自动部署及 SHA 固定分支清理。Chart 由合法 Owner 全部匹配集合再聚合，Board 只读当前页。详见索引 §4。

**明确排除：** 新 List 框架/通用 SQL Agent/新 Grid、未授权字段索引/旧 URL 复用授权、把 1k/10k 内存测试当 PG 性能认证、把 localhost Chromium 或公网 401 当真人业务验收、因为文档 main SHA 更新而再部署同镜像、按名称批量删分支、把付费模型研究拖成当前 CV07 阻塞。

**剩余真实缺口（不得自动签收）：** 
- **P0 / 人工真实预览准入：** 预览地址来自[现有东京 Workflow](../../../.github/workflows/evo-tokyo-dev-deploy.yml)：\`https://evo.43.167.252.197.sslip.io/\`；本轮**没有**合法 Basic Auth + 真实业务身份登录/Item 插件实际安装/可查询企业样本原证。不要请求凭据贴到对话，不绕过 401；需已授权预览操作者真实核验。
- **P1 / 用户五步只读验收：** 已在 [CV07 主线验收入口 §4](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md) 准备「Item 全部列表→搜索/排序/分页→详情返回保持状态→我的 Item/换企业→390px」。在 P0 可操作后记录实测、人验问题；当前为 **HUMAN_ACCEPTANCE_PENDING**，**不要现在发送“完整 List Foundation 开发完成”提醒**。
- **P2 / CV07 独立开发者复用验证：** 按[新插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md) 由**非框架开发者**接入一条新合法 Collection，提供真实 PR/CI，不能仅用教程代签。
- **P3 / 全八步原设计边界：** [2026-11-06 八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 的 CV03 Saved View、CV04 Export、Agent WRITE/Human 等正式阶段仍独立受限；**只读演示 MVP**与“原八步全功能完成”必须分别签。CV00 ADR/Eidos owner 具名确认等若要求全范围退出仍需证据。
- **P4 / 资料时效：** DeepSeek Responses 中英文模型 ID 与定价摘录冲突，前窗已记录，待日后模型工作线重核官方文档，当前不投入。
  
**仍启用的条件提醒：** 已直接读取 Automation 注册，任务标题 **\`List Foundation 开发完成验收提醒\`**，ID \`6afe7c895684819185e1ce2232c53d5a\`，每天东京约 13:36 仅在完整可操作验收条件成立时通知；下次显示 2026-11-20 13:36 JST，**不要创建重复提醒**。

## 4. 本研究交接提交/未来窗口启动顺序

**本研究交接自己的代码：仅新增这两份 docs 文件**；在独立分支 \`docs/cv07-window-20261119-research-handoff-20261119\`，经 Draft PR、准确 HEAD CI 后以普通 merge commit 合入受保护 \`main\`，后查最新实际 SHA/东京正确跳过/精确 Branch Hygiene。**这段描述是交接流程要求，不在创建文件阶段假称 PR 已合并；最终 PR/merge SHA 请依据独立 GitHub 原证填写在 PR 评论并在新窗口重查。**

**新窗口顺序**：① 本文 + [参考索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)；② 读取最新 protected main SHA/打开 PR/东京 Actions；③ [CV07 工程实证及 5 步入口](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md)；④ 检查合法实际预览 Item 业务账号、安装、数据和 UX，不做虚假验证；⑤ 独立第三方插件复用验证与全八步剩余门禁；⑥ 有真实可用路径时由既有自动化通知用户验收。

**本次没有入库的原件：** 用户 GitHub/DeepSeek 管理后台截图原图、官方外站完整网页快照、实际东京有权业务会话与真实数据、独立开发者实际接入记录、人工验收录像、在线收费 L01–L05 原始响应。它们本来就未采集；不能虚构文件名或凭据。
