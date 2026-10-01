import type {
  ExternalAgentGovernanceStoreV010
} from "../contracts/external-agent-access.js";
import {
  EXTERNAL_AGENT_OAUTH_SCOPE,
  type ExternalAgentClientIdMetadataDocumentV010,
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
  ExternalAgentGovernanceServiceV010,
  ExternalAgentGrantableOperationV010
} from "./external-agent-governance-service.js";
import {
  redirectUriMatchesRegistrationV010,
  type ExternalAgentOAuthServiceV010
} from "./external-agent-oauth-service.js";

export interface ExternalAgentOAuthConsentContextV010 {
  contextId: string;
  enterpriseId: string;
  displayName: string;
  operations: ExternalAgentGrantableOperationV010[];
}

export interface ExternalAgentOAuthConsentModelV010 {
  contractVersion: "0.1.0";
  kind: "evo.external-agent.oauth-consent";
  client: {
    oauthClientId: string;
    displayName: string;
    origin: string;
    registered: boolean;
  };
  request: {
    responseType: "code";
    clientId: string;
    redirectUri: string;
    resource: string;
    scope: string;
    scopes: string[];
    state?: string;
    codeChallenge: string;
    codeChallengeMethod: "S256";
  };
  contexts: ExternalAgentOAuthConsentContextV010[];
}

export type ExternalAgentOAuthAuthorizationHttpResultV010 =
  | {
      kind: "REDIRECT";
      status: 303;
      location: string;
    }
  | {
      kind: "CONSENT";
      status: 200;
      consent: ExternalAgentOAuthConsentModelV010;
    };

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
  approve(input: {
    form: URLSearchParams;
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
  governance: ExternalAgentGovernanceServiceV010;
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  buildHumanRequestContext(
    session: IdentitySessionV010,
    contextId: string,
    correlationId: string
  ): PlatformRequestContextV010;
  listHumanEnterpriseContexts(
    session: IdentitySessionV010
  ): Array<{
    contextId: string;
    enterpriseId: string;
    displayName: string;
  }>;
  now?: () => Date;
}

interface ValidatedAuthorizationRequestV010 {
  responseType: "code";
  clientId: string;
  redirectUri: string;
  resource: string;
  scope: string;
  scopes: string[];
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  metadata: ExternalAgentClientIdMetadataDocumentV010;
  registered: boolean;
  registration?: {
    clientId: string;
    agentId: string;
  };
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
  issuer: string,
  description?: string
): ExternalAgentOAuthAuthorizationHttpResultV010 {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  if (description) target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  target.searchParams.set("iss", issuer);
  return {
    kind: "REDIRECT",
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
  if (code.includes("SCOPE")) return "invalid_scope";
  if (
    code.includes("PKCE")
    || code.includes("CODE_")
    || code.includes("AUTHORIZATION_CODE")
  ) return "invalid_grant";
  if (code.includes("RESOURCE")) return "invalid_target";
  return "access_denied";
}

function clientDisplayName(
  metadata: ExternalAgentClientIdMetadataDocumentV010,
  clientId: string
): string {
  const name = metadata.client_name?.trim();
  if (name) return name.slice(0, 160);
  return new URL(clientId).hostname;
}

function durationMinutes(form: URLSearchParams): number {
  const value = Number(form.get("duration_minutes")?.trim() || "240");
  if (![60, 240, 1440].includes(value)) {
    throw new Error("EXTERNAL_AGENT_CONSENT_DURATION_INVALID");
  }
  return value;
}

function selectedOperationIds(form: URLSearchParams): string[] {
  const values = form.getAll("operation_id")
    .map(value => value.trim())
    .filter(Boolean);
  const unique = [...new Set(values)].sort();
  if (unique.length === 0 || unique.length > 200) {
    throw new Error("EXTERNAL_AGENT_CONSENT_OPERATION_SELECTION_INVALID");
  }
  return unique;
}

export function createExternalAgentOAuthHttpAdapterV010(
  options: ExternalAgentOAuthHttpAdapterOptionsV010
): ExternalAgentOAuthHttpAdapterV010 {
  const authorizationServerIssuer =
    options.oauth.authorizationServerMetadata().issuer;
  const resourceIdentifier =
    options.oauth.protectedResourceMetadata().resource;
  const supportedScopes = new Set(
    options.oauth.authorizationServerMetadata().scopes_supported
  );
  const now = options.now ?? (() => new Date());

  const redirectOAuthError = (
    redirectUri: string,
    state: string | undefined,
    error: string,
    description?: string
  ): ExternalAgentOAuthAuthorizationHttpResultV010 =>
    redirectError(
      redirectUri,
      state,
      error,
      authorizationServerIssuer,
      description
    );

  async function validateAuthorizationRequest(
    params: URLSearchParams
  ): Promise<ValidatedAuthorizationRequestV010> {
    const clientId = required(
      params,
      "client_id",
      "EXTERNAL_AGENT_OAUTH_CLIENT_ID_REQUIRED"
    );
    const redirectUri = required(
      params,
      "redirect_uri",
      "EXTERNAL_AGENT_OAUTH_REDIRECT_URI_REQUIRED"
    );
    const state = params.get("state")?.trim() || undefined;

    let metadata: ExternalAgentClientIdMetadataDocumentV010;
    let registered = false;
    let registration: { clientId: string; agentId: string } | undefined;
    try {
      const resolved = await options.oauth.resolveClientMetadata(clientId);
      metadata = resolved.metadata;
      registered = true;
      registration = {
        clientId: resolved.registration.clientId,
        agentId: resolved.registration.agentId
      };
    } catch (error) {
      if (
        !(error instanceof Error)
        || !error.message.startsWith(
          "EXTERNAL_AGENT_OAUTH_CLIENT_NOT_REGISTERED"
        )
      ) {
        throw error;
      }
      metadata = await options.oauth.inspectClientMetadata(clientId);
    }

    if (!metadata.redirect_uris.some(registeredRedirect =>
      redirectUriMatchesRegistrationV010(
        registeredRedirect,
        redirectUri
      )
    )) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_NOT_REGISTERED");
    }

    if (params.get("response_type") !== "code") {
      throw new Error("EXTERNAL_AGENT_OAUTH_RESPONSE_TYPE_UNSUPPORTED");
    }

    const resource = required(
      params,
      "resource",
      "EXTERNAL_AGENT_OAUTH_RESOURCE_REQUIRED"
    );
    if (resource !== resourceIdentifier) {
      throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
    }

    const scope = required(
      params,
      "scope",
      "EXTERNAL_AGENT_OAUTH_SCOPE_REQUIRED"
    );
    const scopes = requestedScopes(params);
    if (!scopes.includes(EXTERNAL_AGENT_OAUTH_SCOPE)) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CAPABILITY_SCOPE_REQUIRED");
    }
    if (scopes.some(item => !supportedScopes.has(item))) {
      throw new Error("EXTERNAL_AGENT_OAUTH_SCOPE_UNSUPPORTED");
    }

    const codeChallenge = required(
      params,
      "code_challenge",
      "EXTERNAL_AGENT_OAUTH_CODE_CHALLENGE_REQUIRED"
    );
    const codeChallengeMethod = required(
      params,
      "code_challenge_method",
      "EXTERNAL_AGENT_OAUTH_CODE_CHALLENGE_METHOD_REQUIRED"
    );
    if (codeChallengeMethod !== "S256") {
      throw new Error("EXTERNAL_AGENT_OAUTH_PKCE_S256_REQUIRED");
    }

    return {
      responseType: "code",
      clientId,
      redirectUri,
      resource,
      scope,
      scopes,
      ...(state ? { state } : {}),
      codeChallenge,
      codeChallengeMethod: "S256",
      metadata,
      registered,
      ...(registration ? { registration } : {})
    };
  }

  async function consentModel(
    request: ValidatedAuthorizationRequestV010,
    session: IdentitySessionV010,
    correlationId: string
  ): Promise<ExternalAgentOAuthConsentModelV010> {
    const contexts: ExternalAgentOAuthConsentContextV010[] = [];
    for (const context of options.listHumanEnterpriseContexts(session)) {
      try {
        const requestContext = options.buildHumanRequestContext(
          session,
          context.contextId,
          correlationId
        );
        const operations = await options.governance.listGrantableOperations(
          requestContext
        );
        if (operations.length > 0) {
          contexts.push({
            ...context,
            operations
          });
        }
      } catch {
        // A Context the Human can see may still not be allowed to delegate.
      }
    }
    if (contexts.length === 0) {
      throw new Error("EXTERNAL_AGENT_CONSENT_NO_GRANTABLE_CONTEXT");
    }

    return {
      contractVersion: "0.1.0",
      kind: "evo.external-agent.oauth-consent",
      client: {
        oauthClientId: request.clientId,
        displayName: clientDisplayName(request.metadata, request.clientId),
        origin: new URL(request.clientId).origin,
        registered: request.registered
      },
      request: {
        responseType: request.responseType,
        clientId: request.clientId,
        redirectUri: request.redirectUri,
        resource: request.resource,
        scope: request.scope,
        scopes: [...request.scopes],
        ...(request.state ? { state: request.state } : {}),
        codeChallenge: request.codeChallenge,
        codeChallengeMethod: request.codeChallengeMethod
      },
      contexts
    };
  }

  async function issueForGrant(
    request: ValidatedAuthorizationRequestV010,
    session: IdentitySessionV010,
    correlationId: string,
    grantId: string,
    contextId: string
  ): Promise<ExternalAgentOAuthAuthorizationHttpResultV010> {
    const requestContext = options.buildHumanRequestContext(
      session,
      contextId,
      correlationId
    );
    const issued = await options.oauth.issueAuthorizationCode({
      requestContext,
      grantId,
      oauthClientId: request.clientId,
      redirectUri: request.redirectUri,
      resource: request.resource,
      scopes: request.scopes,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: "S256",
      correlationId
    });
    const target = new URL(issued.redirectUri);
    target.searchParams.set("code", issued.code);
    if (request.state) target.searchParams.set("state", request.state);
    target.searchParams.set("iss", authorizationServerIssuer);
    return {
      kind: "REDIRECT",
      status: 303,
      location: target.toString()
    };
  }

  return {
    async authorize({ url, session, correlationId }) {
      let request: ValidatedAuthorizationRequestV010;
      try {
        request = await validateAuthorizationRequest(url.searchParams);
      } catch (error) {
        const redirectUri = url.searchParams.get("redirect_uri")?.trim();
        const state = url.searchParams.get("state")?.trim() || undefined;
        const code = errorCode(error);
        if (
          redirectUri
          && !code.includes("CLIENT")
          && !code.includes("REDIRECT_URI")
        ) {
          return redirectOAuthError(
            redirectUri,
            state,
            oauthErrorFromCode(code),
            code
          );
        }
        throw error;
      }

      if (request.registered && request.registration) {
        const governance = options.governanceStore.snapshot();
        const candidates = governance.grants
          .filter(grant =>
            grant.clientId === request.registration!.clientId
            && grant.agentId === request.registration!.agentId
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

        if (effective.length === 1) {
          try {
            return await issueForGrant(
              request,
              session,
              correlationId,
              effective[0]!.grantId,
              effective[0]!.contextId
            );
          } catch (error) {
            const code = errorCode(error);
            return redirectOAuthError(
              request.redirectUri,
              request.state,
              oauthErrorFromCode(code),
              code
            );
          }
        }
        if (effective.length > 1) {
          return redirectOAuthError(
            request.redirectUri,
            request.state,
            "interaction_required",
            "Multiple delegated Authority Grants are available; revoke duplicates before reconnecting."
          );
        }
      }

      try {
        return {
          kind: "CONSENT",
          status: 200,
          consent: await consentModel(
            request,
            session,
            correlationId
          )
        };
      } catch (error) {
        const code = errorCode(error);
        return redirectOAuthError(
          request.redirectUri,
          request.state,
          oauthErrorFromCode(code),
          code
        );
      }
    },

    async approve({ form, session, correlationId }) {
      const requestParams = new URLSearchParams();
      for (const key of [
        "response_type",
        "client_id",
        "redirect_uri",
        "resource",
        "scope",
        "state",
        "code_challenge",
        "code_challenge_method"
      ]) {
        const value = form.get(key);
        if (value !== null) requestParams.set(key, value);
      }

      const request = await validateAuthorizationRequest(requestParams);
      const decision = form.get("decision")?.trim();
      if (decision !== "approve") {
        return redirectOAuthError(
          request.redirectUri,
          request.state,
          "access_denied",
          "The Human declined this External Agent connection."
        );
      }

      const contextId = required(
        form,
        "context_id",
        "EXTERNAL_AGENT_CONSENT_CONTEXT_REQUIRED"
      );
      const context = options.listHumanEnterpriseContexts(session)
        .find(item => item.contextId === contextId);
      if (!context) {
        return redirectOAuthError(
          request.redirectUri,
          request.state,
          "access_denied",
          "The selected Enterprise Context is not available."
        );
      }

      try {
        const requestContext = options.buildHumanRequestContext(
          session,
          contextId,
          correlationId
        );
        const grantable = await options.governance.listGrantableOperations(
          requestContext
        );
        const grantableIds = new Set(
          grantable.map(operation => operation.operationId)
        );
        const selected = selectedOperationIds(form);
        if (selected.some(operationId => !grantableIds.has(operationId))) {
          throw new Error(
            "EXTERNAL_AGENT_CONSENT_OPERATION_NOT_GRANTABLE"
          );
        }

        const enrolled = await options.governance.ensurePublicCimdClient(
          requestContext,
          {
            oauthClientId: request.clientId,
            displayName: clientDisplayName(
              request.metadata,
              request.clientId
            )
          }
        );

        const minutes = durationMinutes(form);
        const validUntil = new Date(
          now().getTime() + minutes * 60 * 1000
        ).toISOString();
        const grant = await options.governance.createGrant(
          requestContext,
          {
            agentId: enrolled.agent.agentId,
            clientId: enrolled.client.clientId,
            allowedOperationIds: selected,
            validUntil,
            description:
              "OAuth Human consent for "
              + clientDisplayName(request.metadata, request.clientId)
          }
        );

        return await issueForGrant(
          {
            ...request,
            registered: true,
            registration: {
              clientId: enrolled.client.clientId,
              agentId: enrolled.agent.agentId
            }
          },
          session,
          correlationId,
          grant.grantId,
          contextId
        );
      } catch (error) {
        const code = errorCode(error);
        return redirectOAuthError(
          request.redirectUri,
          request.state,
          oauthErrorFromCode(code),
          code
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
      return {
        status: 200,
        body: {}
      };
    }
  };
}
