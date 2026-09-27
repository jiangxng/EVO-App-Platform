---
{
  "helpVersion": "0.1.0",
  "id": "evo.memory.governance",
  "ownerPackageId": "evo-app-platform",
  "ownerFeatureId": "evo-memory-governance.system",
  "locale": "zh-CN",
  "kind": "administration",
  "title": "Memory 治理、保留策略与 Legal Hold",
  "summary": "在不修改 immutable Memory 的前提下管理 Context Memory 的保留、隐私分类、Legal Hold、定时操作与 Provider 健康状态。",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["context-memory", "retention", "legal-hold", "dlp", "privacy", "scheduler"],
  "contexts": {
    "packageIds": ["evo-app-platform", "host-context-memory-provider", "remote-context-memory-dlp-provider"],
    "featureIds": ["evo-memory-governance.system"],
    "capabilities": ["context.memory.governance", "context.memory.dlp-classification", "context.memory.semantic-retrieval"],
    "commands": ["context.memory.retention-policy.set", "context.memory.legal-hold.set"]
  },
  "related": ["evo.personal-agent.world-model", "evo.provider.health", "evo.provider.configure-credential"],
  "lastReviewedAt": "2026-09-27"
}
---
Context Memory 本体始终保持 immutable。保留策略、隐私分类与 Legal Hold 都是独立的 append-only 治理证据。

## Memory 工作区

在 Workbench 中打开 **Memory**。

- **记忆治理**：查看当前 Context 的有效状态、隐私等级、保留期限与 Legal Hold。
- **记忆搜索**：只接收 Host Reader 已授权的 Memory；RESTRICTED / EXPIRED 会在排序或界面搜索之前被过滤。
- **记忆来源健康状态**：查看 Memory Read、Governance、Semantic、DLP 与 Intake Provider 的健康状态，不显示任何 Secret 明文。

## Retention Policy

Retention Policy 采用 append-only 事件。策略可以按 Memory kind 和 privacy class 限定范围。多个有效策略同时匹配时，以最早到期时间为准。

定时 Retention 不删除也不修改 Memory。本次保留期限到达后，scheduler 只追加一个 `EXPIRED` governance event。

## Legal Hold

Legal Hold 同样使用 append-only 事件。`PLACED` 会阻止由 retention 导致的过期；`RELEASED` 只释放对应的 hold，其他仍处于 active 的 hold 继续有效。

Legal Hold 不会让已经明确 RESTRICTED 或明确 EXPIRED 的 Memory 自动恢复可见。

## DLP 分类

DLP Provider 可替换，远程凭据统一从 Host Secrets 解析。

DLP 分类遵循：

- 永远不修改 Memory 本体；
- 整个分类批次完成并通过校验后才写 governance event；
- Provider 缺失、失败或返回非法结果时 fail-closed；
- 永远不能覆盖 Human 明确设置的 privacy governance。

## Scheduled Operations

设置 `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS`（最小 60000）启用周期执行。

如果需要定时 Source Intake，必须显式配置 `APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON`。Scheduler 不会自行猜测或扩大 Context 范围。

定时 Intake 使用 SERVICE actor，只能产生 Pending Proposal。Proposal 仍必须经过 Human Review + Accept 才能形成 durable Memory。

## Enterprise 权限

Enterprise 的 Retention Policy 与 Legal Hold 修改仅允许 active OWNER / ADMIN，并同时要求 Human action、显式 confirmation 与 `authorization.check` ALLOW。
