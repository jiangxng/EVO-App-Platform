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
  "locale": "en",
  "title": "Set up Personal Agent",
  "summary": "Install or choose an LLM Provider, configure Provider-owned credentials, and make Personal Agent ready without putting vendor settings inside the Agent.",
  "tags": [
    "personal-agent",
    "setup",
    "llm-provider",
    "credentials",
    "readiness"
  ]
}
---
Personal Agent separates installation from readiness.

## Install Personal Agent

Install Personal Agent from Plugins. Installation activates the Agent package but does not silently choose an LLM vendor for you.

If a usable LLM Provider already exists, Personal Agent can become Ready immediately. Otherwise the product shows **Needs setup** and the primary action becomes **Set up** rather than **Open**.

## Complete setup

The Setup Flow checks four stages:

1. LLM Provider.
2. Provider credentials.
3. Provider readiness.
4. Personal Agent readiness.

When no LLM Provider is installed, choose or install a Provider. When multiple Providers are available, choose explicitly; the platform does not pick one by package-name order.

## Configure credentials

Provider credentials are configured on the Provider-owned Settings page.

For OpenAI LLM Provider:

1. Open Configure Provider.
2. Enter or replace the API Key under Credentials.
3. Save.
4. Return to Personal Agent setup.

Saved API Key plaintext is never loaded back into the browser.

> [!INFO] Personal Agent stays provider-neutral
> Model, endpoint and API credentials belong to the selected LLM Provider. Personal Agent only consumes the resolved llm.inference capability.

## Ready

When the Provider runtime can be resolved, Setup marks Personal Agent Ready and offers **Open Personal Agent**.
