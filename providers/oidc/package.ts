import type { PackageManifestV010 } from "../../contracts/package.js";
import { SECRETS_RESOLVE_CAPABILITY } from "../secrets/package.js";
import {
  IDENTITY_AUTHENTICATION_CAPABILITY,
  IDENTITY_AUTHENTICATION_CONTRACT,
  IDENTITY_AUTHENTICATION_CONTRACT_VERSION
} from "../authentication/capability.js";

export const GENERIC_OIDC_PACKAGE_ID = "generic-oidc-identity-provider";
export const GENERIC_OIDC_FEATURE_ID = "generic-oidc-identity-provider.default";
export const GENERIC_OIDC_PROVIDER_ID = "generic.oidc";

export const genericOidcIdentityProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: GENERIC_OIDC_PACKAGE_ID,
  displayName: "Generic OIDC Identity Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  secrets: [{
    key: "clientSecret",
    label: "OIDC Client Secret",
    description:
      "Optional confidential-client secret. Stored only in the Host Secrets Provider and never returned to the browser.",
    scope: "INSTALLATION",
    required: false
  }],
  features: [{
    contractVersion: "0.1.0",
    featureId: GENERIC_OIDC_FEATURE_ID,
    packageId: GENERIC_OIDC_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [SECRETS_RESOLVE_CAPABILITY],
    providesCapabilities: [IDENTITY_AUTHENTICATION_CAPABILITY],
    contributions: [
      {
        kind: "eidos.settings",
        settings: {
          contractVersion: "0.1.0",
          namespace: GENERIC_OIDC_PACKAGE_ID,
          title: "Generic OIDC Identity Provider",
          description:
            "OpenID Connect Authorization Code + PKCE identity configuration. Browser Session lifecycle remains Host-owned.",
          properties: [
            {
              key: "issuer",
              label: "OIDC Issuer",
              description:
                "Canonical HTTPS issuer URL used for OpenID Provider discovery and ID Token issuer validation.",
              type: "string",
              defaultValue: "",
              scope: "INSTALLATION"
            },
            {
              key: "clientId",
              label: "Client ID",
              description:
                "OIDC client identifier registered for this EVO installation.",
              type: "string",
              defaultValue: "",
              scope: "INSTALLATION"
            },
            {
              key: "scopes",
              label: "Scopes",
              description:
                "Space-separated OIDC scopes. The openid scope is always enforced.",
              type: "string",
              defaultValue: "openid profile email",
              scope: "INSTALLATION"
            }
          ]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: GENERIC_OIDC_PACKAGE_ID,
          locale: "en",
          messages: {
            "settings.title": "Generic OIDC Identity Provider",
            "settings.description": "OpenID Connect login settings. EVO Host keeps ownership of the browser Session.",
            "settings.saveLabel": "Save",
            "settings.issuer.label": "OIDC Issuer",
            "settings.issuer.description": "Canonical HTTPS issuer URL.",
            "settings.clientId.label": "Client ID",
            "settings.clientId.description": "OIDC client identifier registered for this EVO installation.",
            "settings.scopes.label": "Scopes",
            "settings.scopes.description": "Space-separated OIDC scopes. openid is always included.",
            "settings.secret:clientSecret.label": "OIDC Client Secret",
            "settings.secret:clientSecret.description": "Optional confidential-client secret. Saved values are never displayed again.",
            "settings.secret-status:clientSecret.label": "OIDC Client Secret status",
            "settings.secret-remove:clientSecret.label": "Remove OIDC Client Secret",
            "settings.secret-remove:clientSecret.description": "Remove the stored client secret when saving.",
            "settings.adminToken.label": "Bootstrap administrator verification",
            "settings.adminToken.description": "Temporary verification used only before normal signed-in administration is available."
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: GENERIC_OIDC_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "settings.title": "通用 OIDC 身份提供方",
            "settings.description": "OpenID Connect 登录设置。浏览器会话仍由 EVO Host 管理。",
            "settings.saveLabel": "保存",
            "settings.issuer.label": "OIDC Issuer",
            "settings.issuer.description": "用于发现与 ID Token issuer 校验的标准 HTTPS Issuer URL。",
            "settings.clientId.label": "Client ID",
            "settings.clientId.description": "为当前 EVO 安装注册的 OIDC Client ID。",
            "settings.scopes.label": "Scopes",
            "settings.scopes.description": "空格分隔的 OIDC scopes；系统始终包含 openid。",
            "settings.secret:clientSecret.label": "OIDC Client Secret",
            "settings.secret:clientSecret.description": "可选的 confidential-client secret。保存后不会再次显示明文。",
            "settings.secret-status:clientSecret.label": "OIDC Client Secret 状态",
            "settings.secret-remove:clientSecret.label": "删除 OIDC Client Secret",
            "settings.secret-remove:clientSecret.description": "保存时删除当前 Client Secret。",
            "settings.adminToken.label": "引导阶段管理员验证",
            "settings.adminToken.description": "仅在正式登录后的管理授权尚未启用前使用的临时验证。"
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: GENERIC_OIDC_PACKAGE_ID,
          locale: "ja",
          messages: {
            "settings.title": "汎用 OIDC ID プロバイダー",
            "settings.description": "OpenID Connect ログイン設定です。ブラウザーセッションは EVO Host が管理します。",
            "settings.saveLabel": "保存",
            "settings.issuer.label": "OIDC Issuer",
            "settings.issuer.description": "Discovery と ID Token issuer 検証に使用する正規 HTTPS Issuer URL。",
            "settings.clientId.label": "Client ID",
            "settings.clientId.description": "この EVO インストール用に登録された OIDC Client ID。",
            "settings.scopes.label": "Scopes",
            "settings.scopes.description": "スペース区切りの OIDC scope。openid は常に含まれます。",
            "settings.secret:clientSecret.label": "OIDC Client Secret",
            "settings.secret:clientSecret.description": "任意の confidential-client secret。保存後は再表示されません。",
            "settings.secret-status:clientSecret.label": "OIDC Client Secret の状態",
            "settings.secret-remove:clientSecret.label": "OIDC Client Secret を削除",
            "settings.secret-remove:clientSecret.description": "保存時に現在の Client Secret を削除します。",
            "settings.adminToken.label": "ブートストラップ管理者確認",
            "settings.adminToken.description": "通常のサインイン後の管理認可が有効になる前だけ使用する一時的な確認です。"
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: GENERIC_OIDC_PACKAGE_ID,
          locale: "zh-TW",
          messages: {
            "settings.title": "通用 OIDC 身分提供者",
            "settings.description": "OpenID Connect 登入設定。瀏覽器工作階段仍由 EVO Host 管理。",
            "settings.saveLabel": "儲存",
            "settings.issuer.label": "OIDC Issuer",
            "settings.issuer.description": "用於探索與 ID Token issuer 驗證的標準 HTTPS Issuer URL。",
            "settings.clientId.label": "Client ID",
            "settings.clientId.description": "為目前 EVO 安裝註冊的 OIDC Client ID。",
            "settings.scopes.label": "Scopes",
            "settings.scopes.description": "以空格分隔的 OIDC scopes；系統永遠包含 openid。",
            "settings.secret:clientSecret.label": "OIDC Client Secret",
            "settings.secret:clientSecret.description": "可選的 confidential-client secret。儲存後不會再次顯示明文。",
            "settings.secret-status:clientSecret.label": "OIDC Client Secret 狀態",
            "settings.secret-remove:clientSecret.label": "刪除 OIDC Client Secret",
            "settings.secret-remove:clientSecret.description": "儲存時刪除目前 Client Secret。",
            "settings.adminToken.label": "引導階段管理員驗證",
            "settings.adminToken.description": "僅在正式登入後的管理授權尚未啟用前使用的暫時驗證。"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: GENERIC_OIDC_PROVIDER_ID,
          capability: IDENTITY_AUTHENTICATION_CAPABILITY,
          providerContract: IDENTITY_AUTHENTICATION_CONTRACT,
          providerContractVersion: IDENTITY_AUTHENTICATION_CONTRACT_VERSION,
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://generic.oidc"
          },
          metadata: {
            protocol: "OpenID Connect",
            flow: "authorization_code",
            pkce: "S256",
            idTokenAlgorithm: "RS256",
            browserSessionOwner: "HOST"
          }
        }
      }
    ]
  }]
};
