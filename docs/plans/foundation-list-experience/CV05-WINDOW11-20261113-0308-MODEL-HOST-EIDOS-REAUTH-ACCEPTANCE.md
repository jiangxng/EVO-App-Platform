# CV-05 / Window11 自动续跑 #03/08 — Agent → Host → Eidos → 二次授权纵向验收

> 2026-11-13。基线为已合并并完成东京预览发布的 `main@05582907046d3d32af7df15dbd09152ae3660b04`（PR #1316）。本切片仅新增可复现的真实业务 Owner/Host 自动化旅程验收，**不把模拟推理等价成真实 LLM 质量或 Human 验收**。

## 已核实的现有能力（G）

- #1314 已提供 Host-governed `evo.collection.read.preview`，真实 Dictionary 和 My Customers/Suppliers Owner/ActionRouter 返回有限有权页；#1315 原 Eidos Chat v0.2 `proposal/action` 增加“在列表中打开”。
- #1316 修复东京 CI-Gated Preview 运行时路径遗漏 `agents/`；原 [东京 Run #43415624921](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43415624921) 记录镜像 `ghcr.io/jiangxng/evo-app-platform:05582907046d3d32af7df15dbd09152ae3660b04`，SSH local health、public HTTPS、Basic Auth 未登录 401 均 PASS。并不推断真人对话已验证。
- 现有 `tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 仅分别验证了 Host READ、预览回执、静态 Chat HTML。尚无**同一轮** Provider 调用 → Runtime 多步决策 → 原 Host Catalog → Owner → 原 Eidos Chat Action → 新页面重新授权的自动证据。这是覆盖缺口，无需重造应用代码。

## 本切片实际验收设计（D）

在**原** `tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 增加两条同一测试夹具中的纵向回归，继续由既有 `npm run test:platform` 强制运行：

1. 中文用户指令 → **脚本化 LlmInferenceProvider** 返回顺序工具决策 `evo_capabilities_search` → `evo_capabilities_describe` → `evo_collection_read_preview` → final。必须经过生产 `createProviderBackedAgentModel`、`createEnterpriseAgentRuntime`、`createEnterpriseAgentHostToolCatalogV010`；不伪造 Owner READ、消息 Observation 或 Chat 结果。确认 My Suppliers 只含 A 企业责任人自己的记录且隐藏列不可读。
2. 把真实 Runtime Reply 通过 `presentPersonalAgentReplyV020` 和 Eidos `renderChatMessageToHtml` 显示为既有按钮；从该按钮 route 用实际 Domain Parser 恢复 query 并经**新的真实 ActionRouter 调用**重新读取，确认当前企业同等结果；切换企业返回该企业的空投影，禁用插件后旧链接不能再读。
3. Dictionary 同样走上述 4 步并核验 B 企业没有字典读权、停用插件拒绝；再尝试以旧指令驱动模型发起授权已不存在的查询，Runtime 只能记录 Host 失败，不产生新的 Eidos 行动卡。
4. 只是可控 scripted inference 验收，**不宣称真实 LLM 对“供应商/客户”自然语言的推断准确率**，也不称已真实点击 DOM/完成浏览器 390px、键盘焦点或 Human 登录；后续仍需已登录用户实测并签署。不会生成真实账号或使用外域/公开样本数据。

## 不变边界及关联资料

研究、证据等级和决策继续参考 [Window10 研究交接入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md)、[Window10 来源/决策索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)、[Window11 #01 预览交接](CV05-WINDOW11-20261113-0108-COLLECTION-READ-PREVIEW.md)、[Window11 #02 Eidos 导航交接](CV05-WINDOW11-20261113-0208-EIDOS-CHAT-NAVIGATION.md)。

#1092 Operator OPEN、#1212 Owner OPEN（`N1=NOT_CERTIFIED`）、PR #1184 由其他窗口管理。CV03 Human SAVE、CV04 正式后台 EXPORT 仍关闭。只有 CI/PR 原始日志与实际主线 SHA 才能证明后续合并和发布；本文件在生成时不先写“CI 绿/东京已发布”。禁止重复开发已合并能力。

下一步按独立 Draft PR → exact HEAD CI → 受保护 main 合并 → 东京准确判定 → Branch Hygiene 安全清理；若测试发现真实缺陷，只在本 PR 最小修补。
