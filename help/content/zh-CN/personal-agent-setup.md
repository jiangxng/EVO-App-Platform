---
{
  "helpVersion": "0.1.0",
  "id": "evo.personal-agent.setup",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "kind": "how-to",
  "audiences": [
    "user",
    "admin",
    "operator",
    "agent"
  ],
  "contexts": {
    "packageIds": [
      "enterprise-agent"
    ],
    "featureIds": [
      "enterprise-agent.default"
    ],
    "capabilities": [
      "agent.personal",
      "llm.inference"
    ],
    "routes": [
      "/enterprise-agent/setup",
      "/settings/openai-llm-provider"
    ]
  },
  "related": [
    "evo.personal-agent.world-model",
    "evo.secrets.configure-provider-credential",
    "evo.provider.model"
  ],
  "lastReviewedAt": "2026-09-26",
  "locale": "zh-CN",
  "title": "设置个人 Agent",
  "summary": "安装或选择 LLM Provider、配置 Provider 自己的凭据，并让个人 Agent 就绪，而不是把供应商配置放进 Agent。",
  "tags": [
    "personal-agent",
    "设置",
    "llm-provider",
    "凭据",
    "就绪状态"
  ]
}
---
个人 Agent 将“已安装”和“已就绪”明确分开。

## 安装个人 Agent

从“插件”安装个人 Agent。安装会激活 Agent Package，但不会静默替你选择某个 LLM 供应商。

如果已经存在可用的 LLM Provider，个人 Agent 可以直接变为“已就绪”。否则产品会显示**需要设置**，主操作是**开始设置**，而不是误导性的“打开”。

## 完成设置

Setup Flow 会检查四个阶段：

1. LLM Provider。
2. Provider 凭据。
3. Provider 就绪状态。
4. 个人 Agent 就绪状态。

没有 LLM Provider 时，选择或安装一个 Provider。存在多个 Provider 时必须明确选择；平台不会按照 Package 名称顺序替你决定。

## 配置凭据

Provider 凭据在 Provider 自己的设置页面配置。

以 OpenAI LLM Provider 为例：

1. 打开“配置 Provider”。
2. 在“凭据”中输入或替换 API Key。
3. 保存。
4. 返回个人 Agent 设置。

已保存的 API Key 明文永远不会重新加载到浏览器。

> [!INFO] 个人 Agent 保持 Provider-neutral
> 模型、端点和 API 凭据属于所选 LLM Provider。个人 Agent 只消费解析后的 llm.inference Capability。

## 已就绪

当 Provider Runtime 可以正常解析后，Setup 会把个人 Agent 标记为“已就绪”，并提供**打开个人 Agent**。
