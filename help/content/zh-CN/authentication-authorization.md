---
{
  "helpVersion": "0.1.0",
  "id": "evo.authorization.authentication-vs-authorization",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "Authentication 与 Authorization",
  "summary": "Authentication 建立 Principal；Authorization 决定该 Principal 是否可以执行操作。",
  "audiences": ["admin", "developer", "operator", "agent"],
  "tags": ["身份认证", "授权", "principal", "policy"],
  "contexts": {
    "capabilities": ["authorization.check"],
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED"],
    "actions": ["provider.binding.update", "provider.health.probe", "provider.governance.audit.read"]
  },
  "related": ["evo.provider.model", "evo.troubleshooting.authorization-denied"],
  "lastReviewedAt": "2026-09-26"
}
---
Authentication 回答“谁在操作”；Authorization 回答“这个 Principal 是否可以对指定资源和作用域执行指定操作”。

## 当前 P0 流程

过渡期 bootstrap credential 只用于认证 bootstrap-admin Principal，本身不直接授予权限。

随后系统解析有效的 authorization.check Provider，并评估 AuthorizationCheck。

> [!WARNING] 默认拒绝
> Authorization Provider 缺失、歧义、不可用、报错或返回 DENY 时，特权操作都会 fail closed。
