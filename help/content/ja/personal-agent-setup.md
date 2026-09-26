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
  "locale": "ja",
  "title": "パーソナルエージェントをセットアップする",
  "summary": "LLM Provider をインストールまたは選択し、Provider が所有する資格情報を設定して、ベンダー設定を Agent 内に持ち込まずに利用可能にします。",
  "tags": [
    "personal-agent",
    "セットアップ",
    "llm-provider",
    "資格情報",
    "準備状態"
  ]
}
---
パーソナルエージェントでは「インストール済み」と「準備完了」を分けて扱います。

## パーソナルエージェントをインストール

「プラグイン」からパーソナルエージェントをインストールします。Agent Package は有効になりますが、LLM ベンダーを自動的に選択することはありません。

利用可能な LLM Provider がすでにあれば、すぐに準備完了になります。なければ**セットアップが必要**と表示され、主な操作は「開く」ではなく**セットアップ**になります。

## セットアップを完了

Setup Flow は次の4段階を確認します。

1. LLM Provider。
2. Provider の資格情報。
3. Provider の準備状態。
4. パーソナルエージェントの準備状態。

LLM Provider がない場合は選択またはインストールします。複数ある場合は明示的に選択し、Package 名の順序で自動選択しません。

## 資格情報を設定

資格情報は Provider が所有する設定画面で管理します。

OpenAI LLM Provider の場合：

1. 「Provider を設定」を開きます。
2. 「資格情報」で API Key を入力または置き換えます。
3. 保存します。
4. パーソナルエージェントのセットアップに戻ります。

保存済み API Key の平文がブラウザに再表示されることはありません。

> [!INFO] パーソナルエージェントは Provider-neutral
> モデル、エンドポイント、API 資格情報は選択した LLM Provider が所有します。パーソナルエージェントは解決済みの llm.inference Capability のみを利用します。

## 準備完了

Provider Runtime を解決できるようになると、Setup はパーソナルエージェントを準備完了として表示し、**パーソナルエージェントを開く**操作を提供します。
