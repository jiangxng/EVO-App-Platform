import type {
  ExternalAgentAuthorizationServerMetadataV010,
  ExternalAgentOAuthScopeV010,
  ExternalAgentProtectedResourceMetadataV010
} from "../contracts/external-agent-oauth.js";
import type {
  CapabilityOperationEffectV010
} from "../contracts/package.js";
import {
  EVO_EXTERNAL_AGENT_PLAN_SCOPE,
  EVO_EXTERNAL_AGENT_READ_SCOPE
} from "../contracts/external-agent-oauth.js";

export interface ExternalAgentOAuthProfileV010 {
  contractVersion: "0.1.0";
  publicBaseUrl: string;
  resource: string;
  protectedResourceMetadataUrl: string;
  issuer: string;
  authorizationServerMetadataUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  protectedResourceMetadata: ExternalAgentProtectedResourceMetadataV010;
  authorizationServerMetadata: ExternalAgentAuthorizationServerMetadataV010;
}

function normalizeBaseUrl(value: string): URL {
  const url = new URL(value.trim());
  if (
    url.protocol !== "https:"
    && !(url.protocol === "http:" && url.hostname === "localhost")
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_HTTPS_REQUIRED");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_INVALID");
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("EXTERNAL_AGENT_OAUTH_PUBLIC_BASE_PATH_FORBIDDEN");
  }
  url.pathname = "/";
  return url;
}

function withoutTrailingSlash(url: URL): string {
  return url.toString().replace(/\/$/, "");
}

export function externalAgentOAuthScopesForEffectsV010(
  effects: readonly CapabilityOperationEffectV010[]
): ExternalAgentOAuthScopeV010[] {
  const scopes = new Set<ExternalAgentOAuthScopeV010>();
  for (const effect of effects) {
    if (effect === "READ") scopes.add(EVO_EXTERNAL_AGENT_READ_SCOPE);
    if (effect === "PLAN") scopes.add(EVO_EXTERNAL_AGENT_PLAN_SCOPE);
    if (effect === "WRITE") {
      throw new Error("EXTERNAL_AGENT_OAUTH_WRITE_SCOPE_NOT_ENABLED");
    }
  }
  return [...scopes].sort();
}

export function createExternalAgentOAuthProfileV010(
  publicBaseUrl: string
): ExternalAgentOAuthProfileV010 {
  const base = normalizeBaseUrl(publicBaseUrl);
  const origin = withoutTrailingSlash(base);
  const resource = origin + "/mcp";
  const issuer = origin;
  const protectedResourceMetadataUrl =
    origin + "/.well-known/oauth-protected-resource/mcp";
  const authorizationServerMetadataUrl =
    origin + "/.well-known/oauth-authorization-server";
  const authorizationEndpoint = origin + "/oauth/authorize";
  const tokenEndpoint = origin + "/oauth/token";
  const scopes: ExternalAgentOAuthScopeV010[] = [
    EVO_EXTERNAL_AGENT_READ_SCOPE,
    EVO_EXTERNAL_AGENT_PLAN_SCOPE
  ];

  return {
    contractVersion: "0.1.0",
    publicBaseUrl: origin,
    resource,
    protectedResourceMetadataUrl,
    issuer,
    authorizationServerMetadataUrl,
    authorizationEndpoint,
    tokenEndpoint,
    protectedResourceMetadata: {
      resource,
      authorization_servers: [issuer],
      scopes_supported: [...scopes],
      bearer_methods_supported: ["header"],
      resource_name: "EVO External Agent MCP"
    },
    authorizationServerMetadata: {
      issuer,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: [...scopes],
      authorization_response_iss_parameter_supported: true,
      protected_resources: [resource]
    }
  };
}

export function assertExternalAgentOAuthResourceV010(
  profile: ExternalAgentOAuthProfileV010,
  resource: string | undefined
): void {
  if (!resource?.trim()) {
    throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_REQUIRED");
  }
  if (resource !== profile.resource) {
    throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
  }
}

export function assertExternalAgentOAuthScopesV010(
  requested: readonly string[],
  allowed: readonly ExternalAgentOAuthScopeV010[]
): ExternalAgentOAuthScopeV010[] {
  const unique = new Set(requested.map(item => item.trim()).filter(Boolean));
  const allowedSet = new Set<string>(allowed);
  for (const scope of unique) {
    if (!allowedSet.has(scope)) {
      throw new Error("EXTERNAL_AGENT_OAUTH_SCOPE_INVALID: " + scope);
    }
  }
  return [...unique].sort() as ExternalAgentOAuthScopeV010[];
}

function escapeQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function externalAgentOAuthBearerChallengeV010(input: {
  profile: ExternalAgentOAuthProfileV010;
  scopes?: readonly ExternalAgentOAuthScopeV010[];
  error?: "invalid_token" | "insufficient_scope";
  errorDescription?: string;
}): string {
  const parts = [
    `resource_metadata="${escapeQuoted(input.profile.protectedResourceMetadataUrl)}"`
  ];
  if (input.scopes && input.scopes.length > 0) {
    parts.push(
      `scope="${escapeQuoted([...new Set(input.scopes)].sort().join(" "))}"`
    );
  }
  if (input.error) {
    parts.push(`error="${input.error}"`);
  }
  if (input.errorDescription?.trim()) {
    parts.push(
      `error_description="${escapeQuoted(input.errorDescription.trim())}"`
    );
  }
  return "Bearer " + parts.join(", ");
}
