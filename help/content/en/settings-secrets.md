---
{
  "helpVersion": "0.1.0",
  "id": "evo.settings.secrets",
  "ownerPackageId": "evo-app-platform",
  "locale": "en",
  "kind": "concept",
  "title": "Settings vs Secrets",
  "summary": "Keep ordinary configuration separate from credentials and sensitive material.",
  "audiences": ["user", "admin", "developer", "agent"],
  "tags": ["settings", "secrets", "credentials", "configuration"],
  "contexts": {
    "routes": ["/settings"]
  },
  "related": ["evo.workbench.overview", "evo.provider.model", "evo.secrets.configure-provider-credential"],
  "lastReviewedAt": "2026-09-26"
}
---
Settings are ordinary typed configuration owned by a Package. Secrets are credentials or sensitive values that require a secure boundary.

## Settings examples

- model ID;
- API base URL;
- ordinary feature preferences.

## Secret examples

- API keys;
- passwords;
- OAuth client secrets;
- private keys;
- long-lived bearer tokens.

> [!WARNING] Do not persist secrets as ordinary Settings
> A masked input control does not turn an ordinary Settings store into a secret store.


## Workbench credential entry

Packages may declare Secret requirements. Workbench can render those requirements with Eidos secret controls, but the submitted value is routed to the Host Secrets Provider rather than the ordinary Settings Store. Stored plaintext is never loaded back into the browser.
