---
{
  "helpVersion": "0.1.0",
  "id": "evo.settings.secrets",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "Settings 与 Secrets",
  "summary": "把普通配置与凭据、敏感材料严格分离。",
  "audiences": ["user", "admin", "developer", "agent"],
  "tags": ["settings", "secrets", "凭据", "配置"],
  "contexts": { "routes": ["/settings"] },
  "related": ["evo.workbench.overview", "evo.provider.model", "evo.secrets.configure-provider-credential"],
  "lastReviewedAt": "2026-09-26"
}
---
Settings 是 Package 所有的普通类型化配置。Secrets 是凭据或其他需要安全边界保护的敏感值。

## Settings 示例

- 模型 ID；
- API base URL；
- 普通功能偏好。

## Secret 示例

- API key；
- 密码；
- OAuth client secret；
- 私钥；
- 长期 bearer token。

> [!WARNING] 不要把 Secret 当普通 Setting 保存
> 使用密码输入框只会隐藏显示，并不会让普通 Settings Store 自动变成 Secret Store。


## Workbench 凭据录入

Package 可以声明所需的 Secret。Workbench 会使用 Eidos secret 控件呈现这些要求，但提交的值会进入 Host Secrets Provider，而不是普通 Settings Store。已经保存的明文不会再次加载到浏览器。
