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

个人 Agent 可以查看 Host 已解析的当前 Context、平台快照、有效 Capability、Package catalog、Provider、Provider 健康状态、Provider binding，以及权威 Platform Help。

当前 Context 可通过 `context.current.get` 读取。`context.available.list` 只返回 Host 当前提供的 Context 引用。

配置 Host Enterprise Context Provider 后，个人 Agent 可以通过 Chat 的 Context 选择器在 Personal Context 与可用 Enterprise Context 之间切换。选中的引用在真正使用前仍会由 Host 再次校验。请求不能仅通过提交任意企业/Context ID 来创建企业上下文。

## 安装工具

Package 安装继续遵守 Host 强制执行的安全顺序：

1. 对目标 Package 执行 app.install.plan。
2. 确认计划无副作用且没有 blocker。
3. 对同一个 Package 执行 app.install.execute。

> [!WARNING] 模型不是安全边界
> 未出现在当前 Tool Catalog 的工具会 fail closed。安全检查以及后续授权由 Host 强制执行，而不是依靠 Prompt。

## 凭据

个人 Agent 永远不会收到已保存 API Key 的明文。LLM 凭据始终留在 Host Secrets Provider 与 LLM Provider Runtime 边界内部。


## Host Enterprise Context Provider

P0.5 的第一个真实 Enterprise Context 来源是 Host Enterprise Context Provider（`enterprise.directory`）。运维可通过 `APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON` 提供 Host 管理的 Context 定义。

这个参考来源可以被替换。未来的企业目录、身份、HCM 或客户自定义 Provider 可以实现相同的平台边界，而无需修改个人 Agent。

P0.5 中 Enterprise Context 只用于只读推理上下文；它不会创建“企业 Agent”，也不允许自动复制到 Personal Context Memory。


## Principal、Session 与企业授权关系

P0.6 会先解析权威 Principal，然后个人 Agent 才解析 Context 并构建 Tool Catalog。

参考 `identity.session` Provider 可通过 `APP_PLATFORM_STATIC_SESSION_JSON` 配置。它是部署级参考实现，不是最终的登录/Session 系统。

Enterprise Context 是否可见，不再只取决于企业目录中是否存在。Host 会把 Enterprise Context Directory 与当前 Principal 的 `enterprise.membership` Grant 做交集。参考 Grant Provider 使用 `APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON`。

如果某个 Context 存在于企业目录，但没有授权给当前 Principal，那么它不会出现在 Context 选择器中，不会由 `context.available.list` 返回，也不能通过手工提交 Context ID 来选择。

在已授权的 Enterprise Context 中，个人 Agent 会获得只读工具 `enterprise.context.profile.get`；在 Personal Context 中该工具不存在。

> [!IMPORTANT] Session 与 Grant 属于 Host 权威
> 浏览器提交的值只能在 Host 已授权的 Context 中进行选择，不能建立身份、企业关系或权限。

P0.6 仍然不会引入通用 Context Memory 写入，也不会扩大自主 WRITE 权限。
