---
{
  "helpVersion": "0.1.0",
  "id": "evo.enterprise-agent.tools",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "个人 Agent 工具系统",
  "summary": "了解个人 Agent 如何发现并调用由 Host 提供的平台工具。",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["enterprise-agent", "工具", "tool-discovery", "agent"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal.tool-discovery", "agent.enterprise.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.authorization.authentication-vs-authorization", "evo.provider.model", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
个人 Agent 不再内置固定的平台工具列表。每次 Agent 运行时，App Platform Host 会提供当前有效的 Tool Catalog。

## 工具影响等级

- READ 工具只读取权威状态，不应产生状态变更。
- PLAN 工具执行无副作用的预检或规划。
- WRITE 工具会改变平台状态。

工具对 Agent 可见，并不等于该 Principal 已获得执行授权。

## 当前观察工具

个人 Agent 可以查看平台快照、有效 Capability、Package catalog、Provider、Provider 健康状态、Provider binding，以及权威 Platform Help。

## 安装工具

Package 安装继续遵守 Host 强制执行的安全顺序：

1. 对目标 Package 执行 app.install.plan。
2. 确认计划无副作用且没有 blocker。
3. 对同一个 Package 执行 app.install.execute。

> [!WARNING] 模型不是安全边界
> 未出现在当前 Tool Catalog 的工具会 fail closed。安全检查以及后续授权由 Host 强制执行，而不是依靠 Prompt。

## 凭据

个人 Agent 永远不会收到已保存 API Key 的明文。LLM 凭据始终留在 Host Secrets Provider 与 LLM Provider Runtime 边界内部。
