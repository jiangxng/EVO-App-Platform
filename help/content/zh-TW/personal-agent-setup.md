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
  "locale": "zh-TW",
  "title": "設定個人 Agent",
  "summary": "安裝或選擇 LLM Provider、配置 Provider 自己的憑據，讓個人 Agent 就緒，而不把供應商設定放進 Agent。",
  "tags": [
    "personal-agent",
    "設定",
    "llm-provider",
    "憑據",
    "就緒狀態"
  ]
}
---
個人 Agent 會把「已安裝」與「已就緒」分開處理。

## 安裝個人 Agent

從「插件」安裝個人 Agent。安裝會啟用 Agent Package，但不會在沒有告知你的情況下替你選擇 LLM 供應商。

如果已經有可用的 LLM Provider，個人 Agent 可以立即變為「已就緒」。否則產品會顯示**需要設定**，主要操作是**開始設定**，而不是誤導性的「開啟」。

## 完成設定

Setup Flow 會檢查四個階段：

1. LLM Provider。
2. Provider 憑據。
3. Provider 就緒狀態。
4. 個人 Agent 就緒狀態。

沒有 LLM Provider 時，選擇或安裝一個 Provider。存在多個 Provider 時必須明確選擇；平台不會按照 Package 名稱順序替你決定。

## 配置憑據

Provider 憑據在 Provider 自己的設定頁面配置。

以 OpenAI LLM Provider 為例：

1. 開啟「配置 Provider」。
2. 在「憑據」中輸入或替換 API Key。
3. 儲存。
4. 返回個人 Agent 設定。

已儲存的 API Key 明文永遠不會重新載入瀏覽器。

> [!INFO] 個人 Agent 保持 Provider-neutral
> 模型、端點與 API 憑據屬於所選 LLM Provider。個人 Agent 只使用解析後的 llm.inference Capability。

## 已就緒

當 Provider Runtime 可以正常解析後，Setup 會把個人 Agent 標記為「已就緒」，並提供**開啟個人 Agent**。
