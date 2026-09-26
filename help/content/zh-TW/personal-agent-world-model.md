---
{
  "helpVersion": "0.1.0",
  "id": "evo.personal-agent.world-model",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "zh-TW",
  "kind": "concept",
  "title": "個人 Agent 與 Context Memory",
  "summary": "理解 EVO 以人為第一視角的模型：一個個人 Agent、個人上下文與受治理的企業上下文。",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["personal-agent", "context", "context-memory", "enterprise-context", "human-decision"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal", "agent.personal.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.enterprise-agent.tools", "evo.authorization.authentication-vs-authorization", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
EVO 的第一視角是人。MVP 只有一種 Agent：個人 Agent。

## 個人上下文

個人上下文屬於人的長期工作身分，可包含經允許保存的偏好、可重複使用的經驗，以及 Personal Context Memory。

## 企業上下文

企業上下文是受治理的企業工作與學習資料，可提供業務資料、歷史、文件、工具與 Enterprise Context Memory。

企業上下文不是第二個 Agent，也不擁有人的身分。

## Context Memory

Personal Context Memory 與 Enterprise Context Memory 是兩個獨立的長期資產。能夠讀取企業上下文，不代表可以自動把企業機密資訊保存到 Personal Context Memory。

## 人類決策權

個人 Agent 可以觀察、分析、說明並提出意見或方案。

除非未來有明確的授權委託契約，重要的最終決策仍由人類完成。

## 安裝與設定

個人 Agent 明確區分「已安裝」與「已就緒」。

安裝完成後，Host 會檢查是否存在可用的 `llm.inference` Provider。如果仍需設定，Plugin Store 會顯示 **需要設定**，並開啟 Eidos Setup Flow，而不是讓使用者進入無法工作的聊天介面。

1. 安裝個人 Agent。
2. 如有需要，選擇或安裝 LLM Provider。
3. 在 Provider 自己的 Settings 頁面設定模型、Endpoint 與 API 憑證。
4. Host 重新評估 Provider 就緒狀態。
5. 就緒後開啟個人 Agent。

當存在多個 LLM Provider 時，EVO 不會按照 Package 名稱順序偷偷替使用者選擇。

## Eidos 原生體驗

個人 Agent 使用 Eidos Chat v0.2。Side Panel 可以顯示目前 Context、就緒狀態、建議問題以及可觀察的工具活動。

工具活動只表示 Host 實際執行過的動作，例如讀取 Context 或搜尋說明，不是模型的私有推理過程。

Provider/設定問題會顯示為 readiness/setup 狀態，而不是偽裝成 Agent 的聊天回覆。

個人 Agent 新介面同時以英文、簡體中文、日文與繁體中文交付。

> [!INFO] 相容命名
> 目前 Package、route 與 command 為了相容仍保留 enterprise-agent 機器識別；產品面向使用者的名稱是個人 Agent。
