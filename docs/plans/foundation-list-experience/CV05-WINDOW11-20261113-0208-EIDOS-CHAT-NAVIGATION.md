# CV-05 / Window11 #02/08 — Eidos Chat List 导航闭环

> 2026-11-13，工程切片与决策续接。精确基线为已合并并真实东京部署的 `main@8945a50dfbe93cf553c9cee4a2f57c0867bcff2c`（#1314，48/48 PR Checks SUCCESS，主线部署 [Run #43411514038](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43411514038) 已查看原始健康/401日志）。本切片来自用户要求“快速回到 List Foundation 主线”，并非对 #1092/#1212 的重复阻断工程。

## 已确认资产（G）

- CV05 #01/08 已合并 `agents/enterprise-agent/collection-read-preview.ts` 和 `evo.collection.read.preview`，可返回当前 Owner 有权页 + 有界行 + Eidos 业务列表路由。
- 现有 `agents/enterprise-agent/reply-presentation.ts` 会把 Host Observation 变成 Eidos Chat v0.2 的 Activity/Evidence/Proposal；`vendor/eidos/src/chat/render.ts` 与 `page-controller.ts` 已实现按钮 DOM 和 `navigate` 行为（精确路由由 Application Domain 再授权），无需另造组件。
- #1314 研究记录保留：[`CV05-WINDOW11-20261113-0108-COLLECTION-READ-PREVIEW.md`](CV05-WINDOW11-20261113-0108-COLLECTION-READ-PREVIEW.md)。

## 新增采用决策（D）

只增强 **Agent 真实有权 READ → Eidos Chat 可点击原列表** 的最后一跳。当前 Host 成功/最新 Observation 同时满足明确 kind、operationId、route 与 `PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN` 才生成原 `proposal` Chat Part（只是组件类型，不代表 SAVE/WRITE 提案）。中文可见页码与精确总数、英文/日文文本；目标按钮走原 Eidos `type=navigate`。不复制搜索引擎、不让模型构造 URL、不开放新菜单。单独限定 Dictionary 和 My Customers/Suppliers，未来第三 Owner 只有通过同样合同和测试后才加入白名单。

## 验收与边界

1. Protocol 新测试验证 Eidos 真实 Renderer 输出本地 navigate 按钮，拒绝外域/伪造/未知参数/错误 Owner/错误计数、READ 后失败覆写先前成功。
2. Integration 使用真的 My Supplier Repository/Projection Owner/ActionRouter 与已合并 CV05 Preview 回执，串到 Chat 呈现和 Eidos HTML；可复现非敏感字段泄漏的负例。
3. UI 决策/屏幕矩阵：[CV05 Agent → Eidos Navigation Review](../../ui-design-reviews/CV05-AGENT-COLLECTION-EIDOS-NAVIGATION-20261113.md)。真人登录 LLM、390px 设备、点击后新页面二次授权属 HUMAN_PENDING，绝不以 CI 抬升认证。

#1092 Operator OPEN、#1212 N1=NOT_CERTIFIED、PR #1184 Owner 边界不变。CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF。仅独立 Draft PR、exact SHA Actions、Ready 后受保护 main 合并、Tokyo 主线 CI-Gated 发布、SHA safe Branch Hygiene；不修改并行工作线文件。