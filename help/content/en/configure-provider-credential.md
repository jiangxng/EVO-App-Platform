---
{
  "helpVersion": "0.1.0",
  "id": "evo.secrets.configure-provider-credential",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "how-to",
  "title": "Configure an LLM Provider API Key",
  "summary": "Store or replace an LLM Provider credential from Workbench without adding it to Railway variables.",
  "audiences": ["admin", "operator", "agent"],
  "tags": ["secrets", "api key", "llm", "provider", "credentials"],
  "contexts": {
    "routes": ["/settings/openai-llm-provider"],
    "capabilities": ["secrets.resolve", "llm.inference"],
    "actions": ["secret.value.manage", "app-platform.update-settings"]
  },
  "related": ["evo.settings.secrets", "evo.provider.model", "evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
LLM Provider credentials are configured in Workbench and stored through the Host Secrets Provider.

## Configure the OpenAI API Key

1. Open Settings.
2. Open OpenAI LLM Provider.
3. Enter the API Key in the Secret field.
4. Provide administrator authentication when the current bootstrap administration phase requires it.
5. Save.

The page never loads an existing API Key back into the browser. When a credential already exists, the field remains blank and acts as a replacement field.

## Remove the credential

Enable Remove API Key and save. Removing the required credential makes the OpenAI runtime unavailable until a new credential is configured.

> [!WARNING] Secret values are not ordinary Settings
> Model and API Base URL use the ordinary Settings store. API Key values are encrypted through the Host Secrets Provider and are not returned in save responses.

> [!INFO] No provider redeploy
> Replacing the API Key refreshes the OpenAI Provider runtime; changing the credential does not require editing Railway variables or redeploying the service.
