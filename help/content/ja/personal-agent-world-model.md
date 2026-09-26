---
{
  "helpVersion": "0.1.0",
  "id": "evo.personal-agent.world-model",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "ja",
  "kind": "concept",
  "title": "パーソナルエージェントと Context Memory",
  "summary": "人を第一視点とする EVO のモデル、Personal Context、管理された Enterprise Context を理解します。",
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
EVO の第一視点は人です。MVP には 1 種類の Agent、Personal Agent だけがあります。

## Personal Context

Personal Context は人の長期的な作業アイデンティティに属します。許可された好み、再利用可能な経験、Personal Context Memory を保持できます。

## Enterprise Context

Enterprise Context は、管理された企業固有の作業・学習資料です。業務データ、履歴、文書、ツール、Enterprise Context Memory を提供できます。

Enterprise Context は第二の Agent ではなく、人のアイデンティティを所有しません。

## Context Memory

Personal Context Memory と Enterprise Context Memory は別々の長期資産です。Enterprise Context を参照できることは、企業機密情報を Personal Context Memory に自動保存できることを意味しません。

## 人の意思決定権

Personal Agent は観察、分析、説明、意見や提案の作成を行えます。

将来、明示的な委任契約が導入されない限り、重要な最終判断は人が行います。

## インストールとセットアップ

Personal Agent は「インストール済み」と「利用可能」を区別します。

インストール後、Host は利用可能な `llm.inference` Provider があるか確認します。設定が必要な場合、Plugin Store は **セットアップが必要** と表示し、利用不能な Chat を開く代わりに Eidos Setup Flow を開きます。

1. Personal Agent をインストールします。
2. 必要に応じて LLM Provider を選択またはインストールします。
3. Provider 所有の Settings 画面でモデル、Endpoint、API 認証情報を設定します。
4. Host が Provider の準備状態を再評価します。
5. Ready になったら Personal Agent を開きます。

複数の LLM Provider がある場合、EVO は Package 名順で暗黙に選択しません。

## Eidos ネイティブ体験

Personal Agent は Eidos Chat v0.2 を使用します。Side Panel には現在の Context、準備状態、候補プロンプト、観測可能なツール活動を表示できます。

ツール活動は Context の読み取りや Help 検索など、Host が実際に行った処理を示すもので、モデルの非公開推論ではありません。

Provider/設定の問題は Agent の偽の会話メッセージではなく、readiness/setup 状態として表示されます。

Personal Agent の新しい UI は英語、簡体字中国語、日本語、繁体字中国語で提供されます。

> [!INFO] 互換性のための名称
> 現在の Package、route、command は互換性のため enterprise-agent という機械識別子を保持しますが、製品上の名称は Personal Agent です。
