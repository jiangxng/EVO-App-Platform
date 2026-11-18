# List Foundation MVP #04/06 恢复资料、方案取舍与 #05 来源索引（2026-11-18）

> 证据层级：**C** 用户本次提供的旧窗口记录；**A** 已读当前仓库代码/文档或合并 PR；**B** 原始 PR/Workflow/CI 日志或完成记录（以链接所载的时点为界）；**D** 本窗口选择；**S** 历史研究摘要，未在此窗口复抓网页正文；**U** 原件未取得或条件未验证。不把 C/S 当成 A/B。

## 1. 可以直接复用的历史研究（不重新全网搜索）

| 原始来源 | 旧研究结论及采用理由 | 本窗口证据 |
| --- | --- | --- |
| [Microsoft SharePoint Server 2019 视图](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library)；[2019 阈值](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 采纳筛选、个人视图、列布局和服务端预算；不复制 SharePoint 单体业务事实库，也不把 5,000 行阈值硬编码进 EVO | **S**：旧 [EX01/02 已核查索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)，本次未再抓外部正文 |
| [Odoo 19 视图架构](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | 采纳同一数据上声明式 List/Search/Kanban/Graph 的分层；不复制业务模型或把前端当前页当聚合全集 | S：原 EX03 |
| [Power Apps Grid](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control)；[SAP Fiori List Report/Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 采纳一套查询和列表→详情返回；暂不追求全部复杂 Grid/行内编辑 | S：原 EX04/05 |
| [明道云视图](https://help.mingdao.com/view/introduction/)；[明道云应用](https://help.mingdao.com/application/introduction/) | 采纳对象与表现、角色/统计分离；拒绝任意私有 JS 插入 Eidos Host | S：原 EX06/07 |
| [WAI-ARIA Grid APG](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 只读表格用语义 table，若支持交互 grid 需完整键盘/读屏流程；不把 CI 的自动点击当 Human 签收 | S：原 EX08 |

另见 [原架构归属决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[原近期八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[2026-10-12 业务列表计划](PLAN.md)；这些早期文件的 “PLANNED” 是当时快照，不能覆盖 #1352 最新合并事实。

## 2. 实际采用 / 拒绝方案（D，附代码来源 A）

1. **采用**：同一 Domain Owner 查询与授权，以路由携带 `view/search/sort/direction/page/pageSize`、合法企业字段和展示 hint；Eidos 只显示，Host 每次 READ 重新认证。代码：[Dictionary](https://github.com/jiangxng/EVO-App-Platform/blob/4efbbc7043d695955b19b3e6866bc10aac2abd36/apps/business-dictionary/directory-query.ts)、[Counterparty](https://github.com/jiangxng/EVO-App-Platform/blob/4efbbc7043d695955b19b3e6866bc10aac2abd36/apps/counterparty/projection-query.ts)。
2. **采用**：Eidos #219 上游原生只读 Board，再由 Platform #1352 窄化采纳而不是覆盖整份 vendor；**拒绝**复制 Platform 私有 Kanban 和拖拽状态写入。[Eidos #219](https://github.com/jiangxng/eidos/pull/219)、[Platform #1352](https://github.com/jiangxng/EVO-App-Platform/pull/1352)。
3. **采用**：CV06 图表单独 `dictionary.collection.aggregate.state` 权限；**拒绝**前端将某分页行拼成全量图表或解密小桶数据。[#1320](https://github.com/jiangxng/EVO-App-Platform/pull/1320) Owner、[#1321](https://github.com/jiangxng/EVO-App-Platform/pull/1321) Host/Eidos；详见 [原 CV06 研究恢复](CV06-WINDOW11-20261113-0708-EIDOS-AUTHORIZED-CHART-HANDOFF.md)。
4. **采用**：`evo.collection.read.preview`、原 Provider-backed Agent Runtime、Host ActionRouter、Eidos Chat `navigate`，不建新 Agent 路由器、推理/SQL 执行器或数据存储。[#1314](https://github.com/jiangxng/EVO-App-Platform/pull/1314)、[#1315](https://github.com/jiangxng/EVO-App-Platform/pull/1315)、[#1317](https://github.com/jiangxng/EVO-App-Platform/pull/1317)；[当前 Agent preview 源](https://github.com/jiangxng/EVO-App-Platform/blob/4efbbc7043d695955b19b3e6866bc10aac2abd36/agents/enterprise-agent/collection-read-preview.ts)、[当前 Reply 显示源](https://github.com/jiangxng/EVO-App-Platform/blob/4efbbc7043d695955b19b3e6866bc10aac2abd36/agents/enterprise-agent/reply-presentation.ts)。
5. **拒绝**：把未经认证的 `personalViewId` 直接从 Agent 扩展到聊天导航白名单。CV03 私人 Saved View 的真实 Host 权限/持久化仍由其 Owner 处理；#05 当前只透传公开 Domain Query/展示 hint，保留用户批准及 CV03 N1 门禁。

## 3. #04 工程与部署已验证来源（B）

- [#1352 详细工程回执](https://github.com/jiangxng/EVO-App-Platform/pull/1352#issuecomment-6969443680)：精确 PR HEAD `0efe8a82...` 52/52，主线 SHA `4efbbc...` 45/45；CV05 Chromium 真实隔离 Host 1280/390，图表→Board→Table；PG18 原 37/38 失败后仅重新运行该 job 得 38/38 PASS，不修改 SQL 授权门禁。
- [Tokyo #44239359204](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44239359204)（预览部署，非产品签收）；[Branch Hygiene #44239238925](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44239238925)（已合 #1352 源分支 exact HEAD 删除）。
- [Eidos #219](https://github.com/jiangxng/eidos/pull/219) 合并 `1350e8f...`、2/2 上游门禁成功；Platform/Eidos 当前 `main` ref 在 2026-11-18 本次查询分别与上述 SHA 一致。
- 自动测试的 scripted inference、静态 Human 主体、隔离 PostgreSQL 和真实 Chromium 需要分别记账，**不得写成线上真实 LLM 或真实 Google 身份通过**。

## 4. 当前 #05 核对结论与仍缺原件（U）

- A：原 `reply-presentation.ts` 拒绝新的 `status/subjectType/columns/presentation` URL 参数；因其仅依赖 Agent 已完成的 Host READ，合法新路由也可能不显示 Chat action。原 `collection-read-preview.ts` 不接受展示模式选择；这才是当前可直接关闭的闭环缺口。
- D：本 PR 修复 Chat 白名单与 Dictionary-only 可选 `presentation`，并在同一集成测试中覆盖精确筛选、Board 重新授权、非法模式/无权 status 拒绝；**不自动保证图表授权**，由展示页面独立请求聚合决定。
- U：完整旧聊天逐字附件/私有截图与所有过去会话页面并未作为本轮可读取的原始文件提供，故 C 仅引用本次用户粘贴的旧会话内容；不能为没看过的原文补链接。此前竞品官方正文用旧索引 S 级而非冒充今日重查。
- U：真实 LLM 的自然语言语义判别、歧义追问、用户取消/失败恢复、真实 Google 登录和 Human 设备签收仍未完成。后续应沿原 Agent 运行/回复/工具链补**可独立报告的在线质量验收**，不以模拟 Provider 夸大。
- U / 权限门禁：[Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)、[Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、[Human #1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) 均 OPEN；同仓库并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不能作为当前分支的变更目标。

**后续顺序：** 本 PR exact HEAD 构建/协议/Agent/真实 Host Chromium CI → 受保护 main → 主线 Tokyo SHA 观察 → Branch Hygiene Actions → #05 剩余真实 LLM 歧义/错误/恢复验收；无证据不扩范围或签商业发布。
