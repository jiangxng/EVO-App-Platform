---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.provider-ambiguous",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "troubleshooting",
  "title": "Provider 解析存在歧义",
  "summary": "处理同一 Capability 存在多个可执行 Provider 且没有适用显式绑定的情况。",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["故障排查", "provider", "歧义"],
  "contexts": {
    "errorCodes": ["PROVIDER_RESOLUTION_AMBIGUOUS"],
    "routes": ["/providers"]
  },
  "related": ["evo.provider.binding", "evo.provider.model"],
  "lastReviewedAt": "2026-09-26"
}
---
这个错误表示有多个可执行 Provider 能满足同一个 Capability，但没有显式绑定能够确定选择。

## 处理方法

1. 打开 Provider Bindings。
2. 选择受影响的 Capability。
3. 选择预期的 Provider。
4. 选择正确的作用域。
5. 在授权策略允许后保存绑定。

> [!INFO] 为什么 EVO 这样处理
> 系统不允许按字典序、安装顺序或当前健康状态静默决定平台行为。
