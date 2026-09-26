---
{
  "helpVersion": "0.1.0",
  "id": "evo.secrets.configure-provider-credential",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "how-to",
  "title": "配置 LLM Provider API Key",
  "summary": "直接在 Workbench 中保存或替换 LLM Provider 凭据，不需要把 Key 配置到 Railway Variables。",
  "audiences": ["admin", "operator", "agent"],
  "tags": ["secrets", "api key", "llm", "provider", "凭据"],
  "contexts": {
    "routes": ["/settings/openai-llm-provider"],
    "capabilities": ["secrets.resolve", "llm.inference"],
    "actions": ["secret.value.manage", "app-platform.update-settings"]
  },
  "related": ["evo.settings.secrets", "evo.provider.model", "evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
LLM Provider 凭据直接在 Workbench 中配置，并通过 Host Secrets Provider 保存。

## 配置 OpenAI API Key

1. 打开 Settings。
2. 进入 OpenAI LLM Provider。
3. 在 Secret 字段输入 API Key。
4. 在当前 bootstrap 管理阶段，如系统要求则提供管理员认证。
5. 保存。

页面不会把已经保存的 API Key 明文重新加载到浏览器。已有凭据时，输入框仍保持空白，只用于替换。

## 删除凭据

勾选删除 API Key 后保存。删除必需凭据后，OpenAI Runtime 会保持不可用，直到重新配置凭据。

> [!WARNING] Secret 不是普通 Setting
> 模型和 API Base URL 继续使用普通 Settings Store；API Key 通过 Host Secrets Provider 加密保存，并且不会出现在保存响应中。

> [!INFO] 不需要重新部署 Provider
> 替换 API Key 后会刷新 OpenAI Provider Runtime，不需要再进入 Railway Variables 修改 Key 或重新部署服务。
