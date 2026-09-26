---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.provider-unavailable",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "troubleshooting",
  "title": "显式 Provider 不可用",
  "summary": "在不触发静默 failover 的前提下诊断不可用的 Provider。",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["故障排查", "provider", "不可用", "健康状态"],
  "contexts": {
    "errorCodes": ["PROVIDER_RUNTIME_UNAVAILABLE"],
    "routes": ["/providers"]
  },
  "related": ["evo.provider.health", "evo.provider.binding"],
  "lastReviewedAt": "2026-09-26"
}
---
系统存在显式 Provider binding，但被选择的 Provider Runtime 当前不可用。

## 诊断

- 确认 Package 已安装且所属 Feature 处于激活状态。
- 检查 Provider health。
- 必要时执行经过授权的主动健康探测。
- 检查 Provider 配置与所需凭据边界。

> [!WARNING] 绑定仍然具有权威性
> EVO 不会因为所选 Runtime 不可用就静默切换到另一个 Provider。
