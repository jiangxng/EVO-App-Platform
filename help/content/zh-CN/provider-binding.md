---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.binding",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "how-to",
  "title": "配置 Provider 绑定",
  "summary": "在明确的作用域内把 Capability 绑定到 Provider。",
  "audiences": ["admin", "operator", "agent"],
  "tags": ["provider", "绑定", "作用域", "优先级"],
  "contexts": {
    "routes": ["/providers"],
    "actions": ["provider.binding.update"],
    "errorCodes": ["PROVIDER_RESOLUTION_AMBIGUOUS"]
  },
  "related": ["evo.provider.model", "evo.provider.health", "evo.troubleshooting.provider-ambiguous"],
  "lastReviewedAt": "2026-09-26"
}
---
Provider binding 是 Host 所有的策略，用来为一个 Capability 和作用域选择 Provider。

## 作用域优先级

更具体的绑定覆盖更宽泛的绑定，顺序如下：

1. USER
2. WORKSPACE
3. COMPANY
4. ENTERPRISE
5. INSTALLATION
6. SYSTEM

## 保存绑定

1. 打开 Settings，并进入 Provider Bindings。
2. 选择 Capability 与 Provider。
3. 选择作用域；非 SYSTEM 作用域填写 Scope ID。
4. 如需要，提供管理员身份认证。
5. 在授权策略允许后保存绑定。

> [!WARNING] 不允许静默回退
> 若显式绑定的 Provider Runtime 不可用，解析会失败，而不是自动选择另一个 Provider。
