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


## Request-bound Session 与 Enterprise Context 创建

P0.7 新增了请求级参考 Session Provider：`identity.session.request`。参考 Host Bearer Session Provider 使用 `APP_PLATFORM_BEARER_SESSIONS_JSON`，并通过 HTTP Bearer 凭据解析当前 Principal。

参考 Bearer Provider 不会把裸 `sessionId` 当作认证凭据。

Enterprise Context 的创建属于受治理的 Material WRITE：

`enterprise.context.create`

Host 会要求：

1. 已由 Host 解析的 request Session 与 Principal；
2. 当前 Active Context 必须是 Personal Context；
3. Principal 必须是 HUMAN；
4. Action 带有明确确认意图；
5. `authorization.check` 对 `enterprise.context.create` 返回 ALLOW。

创建成功后，会原子生成 Enterprise Context、创建者的 ACTIVE OWNER Relationship、初始访问 Grant，以及从 CREATING 到 ACTIVE 的追加式 lifecycle event。

创建者属于不可修改的历史审计事实；OWNER 是独立的治理关系。未来所有权变化不能重写 `createdBySubjectId`。

任何动态创建且处于 ACTIVE 状态的 Enterprise Context，都必须至少存在一个 ACTIVE OWNER。

个人 Agent 的 WRITE 工具现在也会在执行前经过相同的 Host Material WRITE Authorization 边界；READ 与 PLAN 工具不受此门控影响。


## Enterprise Relationship 生命周期

P0.8 新增了受治理的成员与所有权生命周期。

企业成员关系从 `enterprise.relationship.invite` 开始。Invitation 本身不会授予企业访问权。目标 Human 必须在 Personal Context 中通过 `enterprise.relationship.invitation.accept` 接受；只有接受成功后，Host 才会原子创建 ACTIVE Relationship 与 ACTIVE Enterprise Context Grant。

OWNER 可以邀请 ADMIN、MEMBER、AUDITOR。ADMIN 只能邀请 MEMBER 或 AUDITOR，不能自行授予另一个 ADMIN。MEMBER 与 AUDITOR 不能邀请成员。

非 OWNER Relationship 可通过 `enterprise.relationship.revoke` 撤销，对应访问 Grant 会在同一次治理更新中撤销。OWNER Relationship 不能直接撤销，必须走 Ownership Transfer。

Ownership Transfer 是双方确认流程：

`enterprise.ownership.transfer.initiate → accept / decline / cancel / expire`

接受转移时，新 OWNER 激活与原 OWNER 的 OWNER Relationship / OWNER Grant 撤销在同一个原子提交内完成，因此 ACTIVE Enterprise Context 不会出现持久化的“无 OWNER”中间状态。

有效 Context 响应现在也会返回发给当前 Principal、尚未过期的待处理 Invitation 与 Ownership Transfer。

> [!IMPORTANT] Governance WRITE 有两道门
> Host Relationship 结构规则与 `authorization.check` 必须同时允许。即使策略 Provider 很宽松，也不能绕过 OWNER / ADMIN 的结构性治理约束。


## 受治理的 Context Memory

P0.9 通过可替换的 `context.memory.read` 与 `context.memory.write` Provider Capability 引入持久化 Context Memory。

每条 Memory 只属于一个 Personal 或 Enterprise Context，并携带不可修改的 Provenance 与 Attribution。已有 Memory 记录只追加不修改：纠正旧记忆时创建新记录，并通过 `supersedesMemoryId` 指向旧记录，而不是覆盖历史。

`context.memory.record` 用于在当前 Context 中写入经过确认的 Memory。Personal Memory 要求当前 Principal 就是该 Personal Context 的 owner；Enterprise Memory 要求存在 ACTIVE 的 OWNER、ADMIN 或 MEMBER Relationship，AUDITOR 只读。同时 `authorization.check` 必须返回 ALLOW。

`context.memory.promote` 会在另一个 Host 已授权 Context 中创建新的 Memory，同时保留原始 source Context 与 `sourceMemoryId`。Promotion 必须明确确认、同时具备源 Context 与目标 Context 的 Memory 写权限，并且授权 Provider 明确 ALLOW；默认拒绝。

个人 Agent 获得只读工具 `context.memory.search`。Host 会把该工具绑定到当前已解析的 Active Context，模型不能自行提交另一个 Context ID 去读取任意 Memory。

> [!IMPORTANT] Memory 不是自动保存的聊天记录
> P0.9 不会静默持久化模型对话，也不会自动同步 Personal 与 Enterprise Memory。持久化写入必须经过受治理且由 Human 确认的 Action。
