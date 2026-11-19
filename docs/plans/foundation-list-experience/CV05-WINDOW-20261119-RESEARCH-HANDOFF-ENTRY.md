# CV05 MVP #05/06 · 研究资料与决策简短交接入口（2026-11-19）

> **首先读本文件，再读[详细参考资料索引](CV05-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)**，最后核查[#1359 尚未完成的管理员与真实 LLM 验收](https://github.com/jiangxng/EVO-App-Platform/issues/1359)。这是本窗口跨聊天的研究/决策交接，而非再次实现列表功能。保留[前七轮工程最终交接](CV05-MVP-0506-20261118-WINDOW-0707-FINAL-HANDOFF.md)、[11-18 在线测试 runbook](CV05-MVP-0506-20261118-LIVE-LLM-ACCEPTANCE.md)及[11-06 竞品资料原索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。

## 1. 目标、用户明确要求、已执行范围

**总目标：** 在现有 Eidos + EVO-App-Platform 插件/Domain Owner/Host/Personal Agent 架构内，完成 Foundation List Experience 的多视图、Agent 可操作的**有权查询**、Eidos 精确列表导航、歧义/失败/撤权恢复。重点是不重复造列表或授权引擎；把独立数据查询、Chart 聚合、只读 Board、Human 与 Agent 的权限和证据分级落实在原有体系。

**明确工程规则：** 短期独立分支 → Draft PR → 精确 HEAD CI 全绿 → Ready → 受保护 `main` 合并 → 合并后 CI → 东京 DEV/PREVIEW 实际 SHA/健康/HTTPS/Basic Auth 401 或**正确非运行时 SKIP** → Actions 精确删除已合并的过程分支；不能直接 push main、不能误删其它窗口分支（特别是并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)）。不要只报进度，要实际完成可执行步骤、证据留仓。

**本次用户补充的研究交接要求：** 原始 URL、查阅日期、关键发现、用途，明确原文/摘要/历史转引/未验证；保留采用与排除方案、冲突、失效风险、网页/日志/附件位置与下一步具体代码及 PR 关联；用**简短入口 + 详细索引**两份文档，不覆盖其它窗口成果。

## 2. 工程事实的最新核验（创建本交接分支时）

| 项目 | 经 GitHub 直接核验的状态 |
| --- | --- |
| Repo | [jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)；受保护分支 **`main`** |
| 创建本研究交接时的准确基线 | `main@8038a03333bded27e309b9b00b940c10502f79c3`；此新研究 PR 合并后以**新的 merge SHA** 为准 |
| 上一轮已合并 | [#1354](https://github.com/jiangxng/EVO-App-Platform/pull/1354)、[#1355](https://github.com/jiangxng/EVO-App-Platform/pull/1355)、[#1356](https://github.com/jiangxng/EVO-App-Platform/pull/1356)、[#1357](https://github.com/jiangxng/EVO-App-Platform/pull/1357)、[#1358](https://github.com/jiangxng/EVO-App-Platform/pull/1358)、[#1360](https://github.com/jiangxng/EVO-App-Platform/pull/1360)，均 MERGED |
| 真实业务 Host/Owner + scripted 推理/协议 | [#1358 Platform 原证 #44300440715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44300440715)：**1461 tests / 1460 PASS / 0 FAIL / 1 SKIP**；OpenAI/DeepSeek 真实 Responses Adapter 分别通过 12 次**预设模型动作 + 合成 HTTP**，并验证真实 Owner、撤权旧链接 |
| 东京 DEV/PREVIEW 最近一次实际部署 | [Run #44294553561](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44294553561)，镜像 `ghcr.io/jiangxng/evo-app-platform:f704394474fcf4d11d66d3714c060491a178e698`，原证 healthy / HTTPS / 401；随后测试/文档提交的东京预检均跳过非运行时部署，**最新 main 不等于物理容器 SHA** |
| 本窗口最终未完成 | [Issue #1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) 仍 OPEN；`ENVIRONMENT_POLICY_NOT_VERIFIED / LIVE_LLM_UNVERIFIED`，没有在线 L01–L05 真实 API 运行回执 |

## 3. 本窗口研究最重要的结论与证据等级

- **O（2026-11-19 已读官方章节）**：[GitHub Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)、[Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)、[Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)（还查阅 Triggering a workflow）。**事实：**手动 Run 可选其它 ref，Environment 控制面可限制分支/访问 Secret，未建立的 Environment 可能被自动创建且无保护规则。**决策：**代码中的 `main` 守卫只是纵深防御，真正独立保护需管理员配置 `cv05-live-qa` 仅 `main` 并将 QA Key 限于 Environment 作用域。
- **S（2026-11-19 仅官方搜索结果摘录）**：[OpenAI Responses Create](https://developers.openai.com/api/reference/resources/responses/methods/create)、[DeepSeek Responses](https://api-docs.deepseek.com/api/create-response/)、[DeepSeek Responses Guide](https://api-docs.deepseek.com/guides/responses_api/)。完整 API 长页面打开失败/超时，**不能标“已读全文”**；“均支持 Responses”不等于模型、对话、工具参数与流式行为完全相同，首次在线测试还需核对当前模型与费用。
- **H（只读既有索引、未重新访问外站）**：[11-06 原参考索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) EX01–08：SharePoint 2019、Odoo 19、Power Apps、SAP Fiori、明道云、WAI-ARIA Grid；按历史索引采纳“数据/视图分离、列表→详情、Owner 聚合权限”，不照搬单一业务数据库、超大 editable Grid、5000 固定行数、任意插件 JS 或看板拖拽写入。
- **G（已读 GitHub 原始代码与 CI）**：`agents/enterprise-agent/{provider-model,runtime,host-tool-catalog,reply-presentation}.ts`、`providers/{openai,deepseek}/runtime.ts`、`tests/integration/cv02-personal-agent-authorized-collection.test.mjs`、`.github/workflows/cv05-live-llm-isolated-acceptance.yml`；以上证明既有**代码/离线协议**能力，**不**证明线上模型自然语言质量。
- **U（未取得）**：GitHub Environment 的真实部署分支规则、Secret 是否存在及其作用域/额度；真实在线 L01–L05 和物理 Human/OIDC/读屏认证。无截图/附件可支持这些未核实的事实。

查阅的**全部单项 URL、查阅/检索层级、章节、冲突及设计对照**请看[详细参考索引](CV05-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md) §1–§7。

## 4. 方案决定及禁止的捷径

**采用：** 原 Eidos 多视图、Domain Owner 授权与字段/企业裁剪、Host ActionRouter/Preview、独立授权 Chart 聚合、只读当前页 Board、可恢复 Agent Chat 路由；使用现有 OpenAI/DeepSeek Provider Adapter。真实在线评测只能走现有 **manual-only** Actions 工作流 `cv05-live-llm-isolated-acceptance.yml`，在单独测试身份、经核实的 Environment-only Secret、明确测试费用授权后进行。

**不采用：** 再开发一个 BaseList/NL SQL/数据库权限框架；把禁止的 `status` 条件偷偷去掉；让模型或旧聊天 URL 代替新的 Owner READ；把模拟 Provider 输出、Chromium 自动点击、CI 全绿或东京 DEV 健康冒充真人/真实 LLM/商业发布；使用生产 `OPENAI_API_KEY`/`DEEPSEEK_API_KEY` 或任意非官方 API URL；绕过 GitHub 环境密钥控制面。

**适用条件：** 以上只针对 Foundation List MVP 的 READ/展示/安全恢复；不自动放行个人 Saved View 持久化、编辑/WRITE、正式 CV03 Human SAVE、CV04 后台 EXPORT、真实 OIDC 或生产发布。保留 [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、[#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 的独立准入。

## 5. 最重要的未决问题与实施顺序

1. **P0 / 管理员控制面阻塞 [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359)：** 在 GitHub Settings → Environments 核实 `cv05-live-qa` 存在，并配置 `Selected branches and tags: main ONLY`；Environment secrets 内存在独立、可撤销、限额的 `CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY`，repo/org 级没有同名或旧密钥暴露，审批测试费用及适用模型。当前 GitHub connector 不支持 Environment 管理，浏览器也未提供 GitHub Settings 页面，**不能假称已配置**。
2. **P1 / 真实语义 L01–L05：** 只有在 P0 完成且明确获授权时，从受保护 `main` 手动 Run 一次（必要时按批准的 Provider 分别运行）。保存原始 Actions URL、准确 SHA、模型、脱敏 Token 与全部 PASS/FAIL；失败按原证窄改，不用 synthetic 冒充。
3. **P2 / 当前 API 原文重读：** 首次真实模型前重新读取 OpenAI/DeepSeek 最新完整 Responses、函数工具、多轮历史、模型列表、成本/限额及差异；本窗口这部分只有 S 级摘录，不足以签兼容性。
4. **P3 / 其它门禁：** 真实 Human/OIDC、N1 SAVE、EXPORT、PA05 Operator 和正式生产的独立验收按现有 Issues 留待相应工作线；不要因本研究交接另开重复架构线。

## 6. 不要丢失的参考原件与附件状况

- **章节位置：** [详细索引](CV05-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md) §1 GHD01–04、API01–03、§2 EX01–08、§3 SRC01–09、§6 GitHub Actions 运行与截图现状。重要 GitHub 证据通过 URL/Run/Job/固定 SHA 可回查；外部官方页面会更新，未来需重新核对日期。
- **已保存到 GitHub：** 2026-11-18 七轮最终交接、在线模型验收 runbook、历史研究索引、PR 原始回执、Issue #1359；本次新简短入口与详细索引通过**独立 docs 分支/PR**保存，最终 merge SHA 以本 PR 原证为准。
- **未保存/不存在：** 没有新制网页截图、GitHub Environment 设置截图、在线模型原始响应、密钥、视频或额外附件；不编造文件路径。管理员日后将**脱敏截图说明/设置信息及真实 Run URL**补到 #1359，不能上传 Secret 值。

**新窗口执行入口：** 先读取本文件和[详细索引](CV05-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)，再核对受保护 `main` 当前实际 SHA、[#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) 状态。没有管理员证据就停止付费 LLM 验收，但可继续仓库文档/权限边界的非收费调查；不要重复本窗口已合并成果，不触碰并行工作线。
