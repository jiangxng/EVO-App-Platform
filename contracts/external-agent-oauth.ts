export const EXTERNAL_AGENT_OAUTH_SCOPE = "evo.capabilities";
export const EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE = "offline_access";

export type ExternalAgentOAuthCodeChallengeMethodV010 = "S256";

export interface ExternalAgentOAuthAuthorizationCodeV010 {
  contractVersion: "0.1.0";
  codeId: string;
  codeHash: string;
  oauthClientId: string;
  clientId: string;
  agentId: string;
  grantId: string;
  authorizingPrincipalSubjectId: string;
  resource: string;
  redirectUri: string;
  scopes: string[];
  /**
   * Authority ceiling captured when the authorization code is issued.
   * Legacy records may omit this field.
   */
  operationIds?: string[];
  codeChallengeMethod: ExternalAgentOAuthCodeChallengeMethodV010;
  codeChallenge: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
}

export interface ExternalAgentOAuthAccessTokenV010 {
  contractVersion: "0.1.0";
  tokenId: string;
  tokenHash: string;
  oauthClientId: string;
  clientId: string;
  agentId: string;
  grantId: string;
  resource: string;
  scopes: string[];
  /**
   * Immutable operation ceiling for this access token.
   * Runtime authority can shrink below this set but cannot expand above it.
   */
  operationIds?: string[];
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface ExternalAgentOAuthRefreshTokenV010 {
  contractVersion: "0.1.0";
  refreshTokenId: string;
  tokenHash: string;
  oauthClientId: string;
  clientId: string;
  agentId: string;
  grantId: string;
  resource: string;
  scopes: string[];
  /**
   * Immutable operation ceiling for the refresh-token family.
   * Rotation carries forward only the current intersection.
   */
  operationIds?: string[];
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
  revokedAt?: string;
  replacedByRefreshTokenId?: string;
}

export type ExternalAgentOAuthEventTypeV010 =
  | "AUTHORIZATION_CODE_ISSUED"
  | "AUTHORIZATION_CODE_CONSUMED"
  | "ACCESS_TOKEN_ISSUED"
  | "ACCESS_TOKEN_REVOKED"
  | "REFRESH_TOKEN_ISSUED"
  | "REFRESH_TOKEN_ROTATED"
  | "REFRESH_TOKEN_REVOKED";

export interface ExternalAgentOAuthEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  type: ExternalAgentOAuthEventTypeV010;
  occurredAt: string;
  oauthClientId: string;
  clientId: string;
  agentId: string;
  grantId: string;
  codeId?: string;
  tokenId?: string;
  refreshTokenId?: string;
}

export interface ExternalAgentOAuthSnapshotV010 {
  contractVersion: "0.1.0";
  authorizationCodes: ExternalAgentOAuthAuthorizationCodeV010[];
  accessTokens: ExternalAgentOAuthAccessTokenV010[];
  refreshTokens: ExternalAgentOAuthRefreshTokenV010[];
  events: ExternalAgentOAuthEventV010[];
}

export interface ExternalAgentOAuthStoreV010 {
  snapshot(): ExternalAgentOAuthSnapshotV010;
  save(next: ExternalAgentOAuthSnapshotV010): void;
}

export interface ExternalAgentClientIdMetadataDocumentV010 {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: "none";
}

export interface ExternalAgentProtectedResourceMetadataV010 {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: ["header"];
  resource_name: string;
}

export interface ExternalAgentAuthorizationServerMetadataV010 {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string;
  response_types_supported: ["code"];
  grant_types_supported: ["authorization_code", "refresh_token"];
  code_challenge_methods_supported: ["S256"];
  scopes_supported: string[];
  client_id_metadata_document_supported: true;
  authorization_response_iss_parameter_supported: true;
  protected_resources: string[];
}

export interface ExternalAgentOAuthTokenResponseV010 {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface EffectiveExternalAgentOAuthAccessV010 {
  contractVersion: "0.1.0";
  token: ExternalAgentOAuthAccessTokenV010;
  grantId: string;
  agentId: string;
  clientId: string;
  resource: string;
  operationIds: string[];
}
