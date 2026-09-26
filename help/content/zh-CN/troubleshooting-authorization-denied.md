---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.authorization-denied",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "troubleshooting",
  "title": "授权被拒绝",
  "summary": "判断特权操作是在身份认证、Provider 解析还是策略判断阶段被拒绝。",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["故障排查", "授权", "policy"],
  "contexts": {
    "errorCodes": ["AUTHORIZATION_PROVIDER_UNAVAILABLE", "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED", "STATIC_POLICY_NO_MATCH", "STATIC_POLICY_EXPLICIT_DENY"]
  },
  "related": ["evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
特权操作可能在授权评估前或评估过程中失败。

## 判断失败阶段

- Authentication 错误表示无法建立 Principal。
- Provider resolution 错误表示 authorization.check 无法被确定性解析。
- Policy denial 表示有效 Authorization Provider 返回 DENY。
- 静态策略没有匹配规则时同样默认拒绝。

不要通过修改前端绕过这一决定。Authorization 在服务端强制执行。
