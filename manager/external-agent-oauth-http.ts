import type {
  ExternalAgentGovernanceStoreV010
} from "../contracts/external-agent-access.js";
import {
  EXTERNAL_AGENT_OAUTH_SCOPE,
  type ExternalAgentOAuthTokenResponseV010
} from "../contracts/external-agent-oauth.js";
import type {
  IdentitySessionV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  listEffectiveDelegatedCapabilityOperationsV010,
  type EffectiveDelegatedAuthorityDependenciesV010
} from "./external-agent-delegated-access.js";
import type {
  ExternalAgentOAuthServiceV010
} from "./external-agent-oauth-service.js";

export interface ExternalAgentOAuthAuthorizationHttpResultV010 {
  status: 303;
  location: string;
}

export interface ExternalAgentOAuthJsonResultV010 {
  status: number;
  body: Record<string, unknown>;
}

export interface ExternalAgentOAuthHttpAdapterV010 {
  authorize(input: {
    url: URL;
    session: IdentitySessionV010;
    correlationId: string;
  }): Promise<ExternalAgentOAuthAuthorizationHttpResultV010>;
  token(input: {
    form: URLSearchParams;
    correlationId: string;
  }): Promise<ExternalAgentOAuthJsonResultV010>;
  revoke(input: {
    form: URLSearchParams;
  }): ExternalAgentOAuthJsonResultV010;
}

export interface ExternalAgentOAuthHttpAdapterOptionsV010 {
  oauth: ExternalAgentOAuthServiceV010;
  governanceStore: ExternalAgentGovernanceStoreV010;
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  buildHumanRequestContext(
    session: IdentitySessionV010,
    contextId: string,
    correlationId: string
  ): PlatformRequestContextV010;
}

function required(
  params: URLSearchParams,
  key: string,
  code: string
): string {
  const value = params.get(key)?.trim();
  if (!value) throw new Error(code);
  return value;
}

function requestedScopes(params: URLSearchParams): string[] {
  const value = required(
    params,
    "scope",
    "EXTERNAL_AGENT_OAUTH_SCOPE_REQUIRED"
  );
  return value.split(/\s+/).filter(Boolean);
}

function redirectError(
  redirectUri: string,
  state: string | undefined,
  error: string,
  description?: string
): ExternalAgentOAuthAuthorizationHttpResultV010 {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  if (description) target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  return {
    status: 303,
    location: target.toString()
  };
}

function tokenError(
  error: string,
  description?: string,
  status = 400
): ExternalAgentOAuthJsonResultV010 {
  return {
    status,
    body: {
      error,
      ...(description ? { error_description: description } : {})
    }
  };
}

function tokenSuccess(
  token: ExternalAgentOAuthTokenResponseV010
): ExternalAgentOAuthJsonResultV010 {
  return {
    status: 200,
    body: token as unknown as Record<string, unknown>
  };
}

function errorCode(error: unknown): string {
  return error instanceof Error
    ? error.message.split(":")[0]?.trim() || "server_error"
    : "server_error";
}

function oauthErrorFromCode(code: string): string {
  if (
    code.includes("CLIENT")
    || code.includes("REDIRECT_URI")
  ) return "invalid_client";
  if (
    code.includes("SCOPE")
  ) return "invalid_scope";
  if (
    code.includes("PKCE")
    || code.includes("CODE_")
    || code.includes("AUTHORIZATION_CODE")
  ) return "invalid_grant";
  if (
    code.includes("RESOURCE")
  ) return "invalid_target";
  return "access_denied";
}

export function createExternalAgentOAuthHttpAdapterV010(
  options: ExternalAgentOAuthHttpAdapterOptionsV010
): ExternalAgentOAuthHttpAdapterV010 {
  return {
    async authorize({ url, session, correlationId }) {
      const clientId = required(
        url.searchParams,
        "client_id",
        "EXTERNAL_AGENT_OAUTH_CLIENT_ID_REQUIRED"
      );
      const redirectUri = required(
        url.searchParams,
        "redirect_uri",
        "EXTERNAL_AGENT_OAUTH_REDIRECT_URI_REQUIRED"
      );
      const state = url.searchParams.get("state")?.trim() || undefined;

      // Validate client metadata + redirect URI before any redirect to the client.
      let resolvedClient;
      try {
        resolvedClient = await options.oauth.resolveClientMetadata(clientId);
      } catch (error) {
        throw error;
      }
      if (!resolvedClient.metadata.redirect_uris.includes(redirectUri)) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_NOT_REGISTERED");
      }

      if (url.searchParams.get("response_type") !== "code") {
        return redirectError(
          redirectUri,
          state,
          "unsupported_response_type"
        );
      }

      const resource = required(
        url.searchParams,
        "resource",
        "EXTERNAL_AGENT_OAUTH_RESOURCE_REQUIRED"
      );
      const scopes = requestedScopes(url.searchParams);
      if (!scopes.includes(EXTERNAL_AGENT_OAUTH_SCOPE)) {
        return redirectError(
          redirectUri,
          state,
          "invalid_scope",
          "evo.capabilities is required."
        );
      }
      const codeChallenge = required(
        url.searchParams,
        "code_challenge",
        "EXTERNAL_AGENT_OAUTH_CODE_CHALLENGE_REQUIRED"
      );
      const codeChallengeMethod = required(
        url.searchParams,
        "code_challenge_method",
        "EXTERNAL_AGENT_OAUTH_CODE_CHALLENGE_METHOD_REQUIRED"
      );
      if (codeChallengeMethod !== "S256") {
        return redirectError(
          redirectUri,
          state,
          "invalid_request",
          "PKCE S256 is required."
        );
      }

      const governance = options.governanceStore.snapshot();
      const candidates = governance.grants
        .filter(grant =>
          grant.clientId === resolvedClient.registration.clientId
          && grant.agentId === resolvedClient.registration.agentId
          && grant.authorizingPrincipalSubjectId === session.principal.subjectId
          && grant.state === "ACTIVE"
        )
        .sort((a, b) => a.grantId.localeCompare(b.grantId));

      const effective = [];
      for (const grant of candidates) {
        const catalog = await listEffectiveDelegatedCapabilityOperationsV010({
          dependencies: options.delegatedAuthority,
          grantId: grant.grantId,
          agentId: grant.agentId,
          clientId: grant.clientId,
          correlationId
        });
        if (catalog.active && catalog.operations.length > 0) {
          effective.push(grant);
        }
      }

      if (effective.length === 0) {
        return redirectError(
          redirectUri,
          state,
          "access_denied",
          "No current delegated Authority Grant is available."
        );
      }
      if (effective.length > 1) {
        return redirectError(
          redirectUri,
          state,
          "interaction_required",
          "Multiple delegated Authority Grants are available; Human selection is required."
        );
      }

      const grant = effective[0]!;
      let requestContext: PlatformRequestContextV010;
      try {
        requestContext = options.buildHumanRequestContext(
          session,
          grant.contextId,
          correlationId
        );
      } catch {
        return redirectError(
          redirectUri,
          state,
          "access_denied",
          "The delegated Context is no longer available."
        );
      }

      try {
        const issued = await options.oauth.issueAuthorizationCode({
          requestContext,
          grantId: grant.grantId,
          oauthClientId: clientId,
          redirectUri,
          resource,
          scopes,
          codeChallenge,
          codeChallengeMethod: "S256",
          correlationId
        });
        const target = new URL(issued.redirectUri);
        target.searchParams.set("code", issued.code);
        if (state) target.searchParams.set("state", state);
        return {
          status: 303,
          location: target.toString()
        };
      } catch (error) {
        const code = errorCode(error);
        return redirectError(
          redirectUri,
          state,
          oauthErrorFromCode(code)
        );
      }
    },

    async token({ form, correlationId }) {
      const grantType = form.get("grant_type")?.trim();
      const clientId = form.get("client_id")?.trim();
      const resource = form.get("resource")?.trim();
      if (!clientId || !resource) {
        return tokenError(
          "invalid_request",
          "client_id and resource are required."
        );
      }

      try {
        if (grantType === "authorization_code") {
          const code = form.get("code")?.trim();
          const redirectUri = form.get("redirect_uri")?.trim();
          const codeVerifier = form.get("code_verifier")?.trim();
          if (!code || !redirectUri || !codeVerifier) {
            return tokenError(
              "invalid_request",
              "code, redirect_uri and code_verifier are required."
            );
          }
          return tokenSuccess(
            await options.oauth.exchangeAuthorizationCode({
              code,
              oauthClientId: clientId,
              redirectUri,
              resource,
              codeVerifier,
              correlationId
            })
          );
        }

        if (grantType === "refresh_token") {
          const refreshToken = form.get("refresh_token")?.trim();
          if (!refreshToken) {
            return tokenError(
              "invalid_request",
              "refresh_token is required."
            );
          }
          return tokenSuccess(
            await options.oauth.refreshAccessToken({
              refreshToken,
              oauthClientId: clientId,
              resource,
              correlationId
            })
          );
        }

        return tokenError("unsupported_grant_type");
      } catch (error) {
        const code = errorCode(error);
        return tokenError(
          oauthErrorFromCode(code),
          code
        );
      }
    },

    revoke({ form }) {
      const token = form.get("token")?.trim();
      if (token) options.oauth.revokeToken(token);
      // RFC 7009 style non-disclosure: unknown tokens still receive success.
      return {
        status: 200,
        body: {}
      };
    }
  };
}
