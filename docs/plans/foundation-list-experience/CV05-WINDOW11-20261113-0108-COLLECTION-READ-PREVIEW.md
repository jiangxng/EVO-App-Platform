# CV-05 / Window11 #01/08 — Personal Agent 有权 Collection 预览（2026-11-13）

> **实施记录，非生产认证。** 准确基线是受保护 `main@2efb54f453fc70383e54b50fb1fd611083e9a174`，在本窗口创建独立 `feat/cv05-agent-collection-read-preview-20261113` 与 [Draft PR #1314](https://github.com/jiangxng/EVO-App-Platform/pull/1314)。这个基线已包含并行 #1313，不触碰知行部署资产。准确 HEAD、CI、合并、东京及分支清理，以 PR #1314 **最终原证**为准；本文创建时未预先宣称通过。

## 1. 复用与本次实际增量（A：已阅读当前 main 原代码；D：最小新增决策）

- 已有 `agents/enterprise-agent/capability-fabric-tools.ts` 的授权 `search/describe/invoke.read-plan`、`manager/capability-operation-access.ts` 与 `actions/router.ts` 能为 Human/Personal Agent 执行同一真实业务 Owner READ；`tests/protocol/cv02-real-owner-agent-human-collection.test.mjs` 和 `tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 已有两 Owner 原生测试夹具。**不新造 NL/SQL 执行器、Repository、权限中心或 Eidos 渲染器。**
- 新增 `agents/enterprise-agent/collection-read-preview.ts`：严格只允许 `dictionary.collection.query`、`counterparty.collection.my-customers.query`、`counterparty.collection.my-suppliers.query`；复用原 Dictionary/Counterparty 路由解析器验证安全 query；从**实际 Host Owner 返回的当前有权页**生成最多 10 行预览、字段白名单、精确总数口径和 Eidos 既有列表 route。route 是 `PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN`，不是授权凭证；打开后仍由 Eidos/Host 重新授权。
- 原 Personal Agent 注册一个 READ 工具 `evo.collection.read.preview`：模型从用户自然语言提出结构化筛选候选；先 `search/describe`，再仅执行当前允许的 Operation，失败即拒绝。绝不调用 WRITE、保存个人视图、进入正式后台 Export、偷读跨页记录或把本页样本当全集。
- 新代码由现有 Dictionary Repository/Host 与 Counterparty Projection/Host 的正例+隐藏字段、越权排序、跨企业、撤权、Feature 停用负例覆盖；已有真实 Counterparty Agent 集成回归被纳入必跑 `test:platform`。

## 2. 尚未证明（U）及下一切片

本项不是完整 CV-05：**没有**承诺模型实际自然语言正确率、浏览器自动点击路由、真实登录及 390px Human 验收、生产 Google OIDC、可持久的 Agent Task 恢复或正式 SAVE。自然语言→结构化 Query 目前由既有 LLM/Capability 工具流程选择，新增适配器仅确定性校验 Owner 结果和路由，不宣称有新 NL 编译器。

后续只在精确 HEAD CI 成功且主线兼容后再推进有价值的最小 Agent/Eidos 用户旅程验收；任何新缺陷先复现再修补，避免再次制作授权门禁或孤立 PR。

## 3. 不变限制与交接索引

- [Window10 研究入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md) 与 [决策来源索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md) 保留；不复制或改写历史研究的原文/搜索摘要等级。
- [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) Operator 仍须真正受权签收；旧 Railway 资源不动。
- [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 真实五方 Owner 生产权威仍需独立签署，`N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；现有当前页 CSV 属于独立已交付功能。
- 并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 三份 Owner 文档、[#1313](https://github.com/jiangxng/EVO-App-Platform/pull/1313) 两份部署文件均不修改。
- 实际工程验收按 Draft PR → 准确 HEAD CI → Ready → 受保护 main 合并 → main Checks/东京判定 → SHA-safe Branch Hygiene；不把 CI GREEN 说成生产认证、把 main SHA 说成 Tokyo 物理镜像。
