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
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED", "AUTHENTICATION_UNAVAILABLE", "OIDC_TRANSACTION_LIMIT_REACHED"],
    "actions": ["provider.binding.update", "provider.health.probe", "provider.governance.audit.read"]
  },
  "related": ["evo.provider.model", "evo.troubleshooting.authorization-denied"],
  "lastReviewedAt": "2026-10-22"
}
---
Authentication 回答“谁在操作”；Authorization 回答“这个 Principal 是否可以对指定资源和作用域执行指定操作”。

## 当前 P0 流程

过渡期 bootstrap credential 只用于认证 bootstrap-admin Principal，本身不直接授予权限。

随后系统解析有效的 authorization.check Provider，并评估 AuthorizationCheck。

> [!WARNING] 默认拒绝
> Authorization Provider 缺失、歧义、不可用、报错或返回 DENY 时，特权操作都会 fail closed。

## OIDC 登录容量与重试

通用 OIDC Provider 默认每个运行实例最多保留 1000 个未消费的登录 state。达到上限时，新登录返回 HTTP 503 `AUTHENTICATION_UNAVAILABLE`，已有有效登录不会被挤掉。完成或取消一个未完成登录，或在其默认 10 分钟有效期过后重试。系统不自动重试，也不新增后台清理定时器；下一次登录或回调会清理过期 state。

即使登录被拒绝或缺少授权码，回调也会消费其已知 state；失败后请重新开始登录。未完成登录是临时事务，Host 重启后需重新开始；已签发 Session 的历史与撤销记录仍独立持久保留。此容量限制不授予业务权限，也不代表已实施 Session 历史保留策略。
