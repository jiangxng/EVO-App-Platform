import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  ExternalAgentAuthorityGrantV010,
  ExternalAgentClientRegistrationV010,
  ExternalAgentGovernanceStoreV010
} from "../contracts/external-agent-access.js";
import {
  EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE,
  EXTERNAL_AGENT_OAUTH_SCOPE,
  type EffectiveExternalAgentOAuthAccessV010,
  type ExternalAgentAuthorizationServerMetadataV010,
  type ExternalAgentClientIdMetadataDocumentV010,
  type ExternalAgentOAuthAccessTokenV010,
  type ExternalAgentOAuthAuthorizationCodeV010,
  type ExternalAgentOAuthEventV010,
  type ExternalAgentOAuthRefreshTokenV010,
  type ExternalAgentOAuthStoreV010,
  type ExternalAgentOAuthTokenResponseV010,
  type ExternalAgentProtectedResourceMetadataV010
} from "../contracts/external-agent-oauth.js";
import type {
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  listEffectiveDelegatedCapabilityOperationsV010,
  type EffectiveDelegatedAuthorityDependenciesV010
} from "./external-agent-delegated-access.js";

const SUPPORTED_SCOPES = [
  EXTERNAL_AGENT_OAUTH_SCOPE,
  EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE
] as const;

export interface ExternalAgentOAuthServiceOptionsV010 {
  store: ExternalAgentOAuthStoreV010;
  governanceStore: ExternalAgentGovernanceStoreV010;
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  resourceIdentifier: string;
  authorizationServerIssuer: string;
  resourceName?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  randomBytesImpl?: (size: number) => Buffer;
  id?: () => string;
  authorizationCodeTtlSeconds?: number;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
}

export interface ExternalAgentOAuthAuthorizationCodeIssueInputV010 {
  requestContext: PlatformRequestContextV010;
  grantId: string;
  oauthClientId: string;
  redirectUri: string;
  resource: string;
  scopes: string[];
  codeChallenge: string;
  codeChallengeMethod: "S256";
  correlationId: string;
}

export interface ExternalAgentOAuthAuthorizationCodeIssueResultV010 {
  code: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: string;
}

export interface ExternalAgentOAuthAuthorizationCodeExchangeInputV010 {
  code: string;
  oauthClientId: string;
  redirectUri: string;
  resource: string;
  codeVerifier: string;
  correlationId: string;
}

export interface ExternalAgentOAuthRefreshInputV010 {
  refreshToken: string;
  oauthClientId: string;
  resource: string;
  correlationId: string;
}

export interface ExternalAgentOAuthServiceV010 {
  protectedResourceMetadata(): ExternalAgentProtectedResourceMetadataV010;
  authorizationServerMetadata(): ExternalAgentAuthorizationServerMetadataV010;
  inspectClientMetadata(
    oauthClientId: string
  ): Promise<ExternalAgentClientIdMetadataDocumentV010>;
  resolveClientMetadata(
    oauthClientId: string
  ): Promise<{
    registration: ExternalAgentClientRegistrationV010;
    metadata: ExternalAgentClientIdMetadataDocumentV010;
  }>;
  issueAuthorizationCode(
    input: ExternalAgentOAuthAuthorizationCodeIssueInputV010
  ): Promise<ExternalAgentOAuthAuthorizationCodeIssueResultV010>;
  exchangeAuthorizationCode(
    input: ExternalAgentOAuthAuthorizationCodeExchangeInputV010
  ): Promise<ExternalAgentOAuthTokenResponseV010>;
  refreshAccessToken(
    input: ExternalAgentOAuthRefreshInputV010
  ): Promise<ExternalAgentOAuthTokenResponseV010>;
  resolveAccessToken(
    accessToken: string,
    resource: string,
    correlationId: string
  ): Promise<EffectiveExternalAgentOAuthAccessV010>;
  revokeToken(token: string): void;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256")
    .update(verifier, "ascii")
    .digest("base64url");
}

function requireHttpsUrl(
  value: string,
  code: string,
  options: { allowRootPath?: boolean; allowLocalhost?: boolean } = {}
): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(code);
  }
  const localhost = options.allowLocalhost === true
    && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !localhost) throw new Error(code);
  if (url.hash) throw new Error(code);
  if (url.search) throw new Error(code);
  if (options.allowRootPath !== true && url.pathname === "/") {
    throw new Error(code);
  }
  return url.toString().replace(/\/$/, "");
}

function requireResource(value: string): string {
  return requireHttpsUrl(value, "EXTERNAL_AGENT_OAUTH_RESOURCE_INVALID", {
    allowRootPath: true
  });
}

function requireRedirectUri(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_INVALID");
  }
  const loopbackHost =
    url.hostname === "localhost"
    || url.hostname === "127.0.0.1"
    || url.hostname === "[::1]";
  if (
    url.protocol !== "https:"
    && !(loopbackHost && url.protocol === "http:")
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_INVALID");
  }
  if (
    url.hash
    || url.username
    || url.password
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_INVALID");
  }
  return url.toString();
}

function isNativeLoopbackIpRedirect(url: URL): boolean {
  return (
    url.protocol === "http:"
    && (
      url.hostname === "127.0.0.1"
      || url.hostname === "[::1]"
    )
  );
}

export function redirectUriMatchesRegistrationV010(
  registeredRedirectUri: string,
  requestedRedirectUri: string
): boolean {
  const registered = new URL(requireRedirectUri(registeredRedirectUri));
  const requested = new URL(requireRedirectUri(requestedRedirectUri));

  if (registered.toString() === requested.toString()) {
    return true;
  }

  if (
    !isNativeLoopbackIpRedirect(registered)
    || !isNativeLoopbackIpRedirect(requested)
  ) {
    return false;
  }

  return (
    registered.protocol === requested.protocol
    && registered.hostname === requested.hostname
    && registered.pathname === requested.pathname
    && registered.search === requested.search
  );
}

function redirectUriRegistered(
  registeredRedirectUris: readonly string[],
  requestedRedirectUri: string
): boolean {
  return registeredRedirectUris.some(registered =>
    redirectUriMatchesRegistrationV010(
      registered,
      requestedRedirectUri
    )
  );
}

function normalizeScopes(scopes: readonly string[]): string[] {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new Error("EXTERNAL_AGENT_OAUTH_SCOPE_REQUIRED");
  }
  const normalized = scopes.map(item => item.trim()).filter(Boolean);
  if (
    normalized.length !== scopes.length
    || new Set(normalized).size !== normalized.length
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_SCOPE_INVALID");
  }
  if (!normalized.includes(EXTERNAL_AGENT_OAUTH_SCOPE)) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CAPABILITY_SCOPE_REQUIRED");
  }
  if (normalized.some(scope => !SUPPORTED_SCOPES.includes(
    scope as typeof SUPPORTED_SCOPES[number]
  ))) {
    throw new Error("EXTERNAL_AGENT_OAUTH_SCOPE_UNSUPPORTED");
  }
  return [...normalized].sort();
}

function requirePkceVerifier(value: string): string {
  const normalized = value.trim();
  if (
    normalized.length < 43
    || normalized.length > 128
    || !/^[A-Za-z0-9._~-]+$/.test(normalized)
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_PKCE_VERIFIER_INVALID");
  }
  return normalized;
}

function boundedExpiry(
  now: Date,
  ttlSeconds: number,
  grant: ExternalAgentAuthorityGrantV010,
  ceiling?: string
): string {
  const ttlEpoch = now.getTime() + ttlSeconds * 1000;
  const grantEpoch = Date.parse(grant.validUntil);
  const ceilingEpoch = ceiling === undefined ? Number.POSITIVE_INFINITY : Date.parse(ceiling);
  const epoch = Math.min(ttlEpoch, grantEpoch, ceilingEpoch);
  if (!Number.isFinite(epoch) || epoch <= now.getTime()) {
    throw new Error("EXTERNAL_AGENT_OAUTH_GRANT_EXPIRED");
  }
  return new Date(epoch).toISOString();
}

function tokenValue(
  prefix: string,
  randomBytesImpl: (size: number) => Buffer
): string {
  return prefix + randomBytesImpl(32).toString("base64url");
}


function sortedOperationIds(
  operations: readonly { operationId: string }[]
): string[] {
  return operations
    .map(item => item.operationId)
    .sort((a, b) => a.localeCompare(b));
}

function attenuatedOperationIds(
  currentOperations: readonly { operationId: string }[],
  ceiling: readonly string[] | undefined
): string[] {
  const current = sortedOperationIds(currentOperations);
  if (ceiling === undefined) return current;
  const allowed = new Set(ceiling);
  return current.filter(operationId => allowed.has(operationId));
}

function oauthEvent(
  type: ExternalAgentOAuthEventV010["type"],
  input: {
    id: () => string;
    at: string;
    oauthClientId: string;
    clientId: string;
    agentId: string;
    grantId: string;
    codeId?: string;
    tokenId?: string;
    refreshTokenId?: string;
  }
): ExternalAgentOAuthEventV010 {
  return {
    contractVersion: "0.1.0",
    eventId: "external-oauth-event:" + input.id(),
    type,
    occurredAt: input.at,
    oauthClientId: input.oauthClientId,
    clientId: input.clientId,
    agentId: input.agentId,
    grantId: input.grantId,
    ...(input.codeId ? { codeId: input.codeId } : {}),
    ...(input.tokenId ? { tokenId: input.tokenId } : {}),
    ...(input.refreshTokenId ? { refreshTokenId: input.refreshTokenId } : {})
  };
}

async function fetchJson<T>(
  fetchImpl: typeof fetch,
  url: string,
  code: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error(code + "_HTTP_" + response.status);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function validateClientMetadata(
  oauthClientId: string,
  metadata: ExternalAgentClientIdMetadataDocumentV010
): ExternalAgentClientIdMetadataDocumentV010 {
  if (metadata.client_id !== oauthClientId) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_METADATA_ID_MISMATCH");
  }
  if (
    !Array.isArray(metadata.redirect_uris)
    || metadata.redirect_uris.length === 0
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_REDIRECT_URI_REQUIRED");
  }
  const redirectUris = metadata.redirect_uris.map(requireRedirectUri);
  if (new Set(redirectUris).size !== redirectUris.length) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_REDIRECT_URI_DUPLICATE");
  }
  if (
    metadata.grant_types !== undefined
    && !metadata.grant_types.includes("authorization_code")
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_AUTHORIZATION_CODE_REQUIRED");
  }
  if (
    metadata.response_types !== undefined
    && !metadata.response_types.includes("code")
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_CODE_RESPONSE_REQUIRED");
  }
  if (
    metadata.token_endpoint_auth_method !== undefined
    && metadata.token_endpoint_auth_method !== "none"
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_AUTH_METHOD_UNSUPPORTED");
  }
  return {
    ...structuredClone(metadata),
    redirect_uris: redirectUris
  };
}

export function createExternalAgentOAuthServiceV010(
  options: ExternalAgentOAuthServiceOptionsV010
): ExternalAgentOAuthServiceV010 {
  const resourceIdentifier = requireResource(options.resourceIdentifier);
  const authorizationServerIssuer = requireHttpsUrl(
    options.authorizationServerIssuer,
    "EXTERNAL_AGENT_OAUTH_ISSUER_INVALID",
    { allowRootPath: true }
  );
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EXTERNAL_AGENT_OAUTH_FETCH_UNAVAILABLE");
  const now = options.now ?? (() => new Date());
  const randomBytesImpl = options.randomBytesImpl ?? randomBytes;
  const id = options.id ?? randomUUID;
  const codeTtlSeconds = options.authorizationCodeTtlSeconds ?? 300;
  const accessTtlSeconds = options.accessTokenTtlSeconds ?? 900;
  const refreshTtlSeconds = options.refreshTokenTtlSeconds ?? 2592000;

  for (const [value, code] of [
    [codeTtlSeconds, "EXTERNAL_AGENT_OAUTH_CODE_TTL_INVALID"],
    [accessTtlSeconds, "EXTERNAL_AGENT_OAUTH_ACCESS_TTL_INVALID"],
    [refreshTtlSeconds, "EXTERNAL_AGENT_OAUTH_REFRESH_TTL_INVALID"]
  ] as const) {
    if (!Number.isInteger(value) || value <= 0) throw new Error(code);
  }

  async function inspectClientMetadata(
    oauthClientIdInput: string
  ): Promise<ExternalAgentClientIdMetadataDocumentV010> {
    const oauthClientId = requireHttpsUrl(
      oauthClientIdInput,
      "EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID"
    );
    return validateClientMetadata(
      oauthClientId,
      await fetchJson<ExternalAgentClientIdMetadataDocumentV010>(
        fetchImpl,
        oauthClientId,
        "EXTERNAL_AGENT_OAUTH_CLIENT_METADATA"
      )
    );
  }

  async function clientMetadata(
    oauthClientIdInput: string
  ): Promise<{
    registration: ExternalAgentClientRegistrationV010;
    metadata: ExternalAgentClientIdMetadataDocumentV010;
  }> {
    const oauthClientId = requireHttpsUrl(
      oauthClientIdInput,
      "EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID"
    );
    const snapshot = options.governanceStore.snapshot();
    const registration = snapshot.clients.find(
      item => item.oauthClientId === oauthClientId
    );
    if (!registration) throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_NOT_REGISTERED");
    if (registration.state !== "ACTIVE") {
      throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_NOT_ACTIVE");
    }
    if (registration.kind !== "PUBLIC") {
      throw new Error("EXTERNAL_AGENT_OAUTH_CIMD_PUBLIC_CLIENT_REQUIRED");
    }
    if (!registration.protocols.some(item => item === "MCP" || item === "OPENAPI")) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_PROTOCOL_UNSUPPORTED");
    }
    const agent = snapshot.agents.find(item => item.agentId === registration.agentId);
    if (!agent || agent.state !== "ACTIVE") {
      throw new Error("EXTERNAL_AGENT_OAUTH_AGENT_NOT_ACTIVE");
    }

    return {
      registration: structuredClone(registration),
      metadata: await inspectClientMetadata(oauthClientId)
    };
  }

  async function requireCurrentDelegatedAuthority(input: {
    grantId: string;
    agentId: string;
    clientId: string;
    correlationId: string;
  }) {
    const catalog = await listEffectiveDelegatedCapabilityOperationsV010({
      dependencies: options.delegatedAuthority,
      grantId: input.grantId,
      agentId: input.agentId,
      clientId: input.clientId,
      correlationId: input.correlationId
    });
    if (!catalog.active || !catalog.grant) {
      throw new Error("EXTERNAL_AGENT_OAUTH_DELEGATED_AUTHORITY_INACTIVE:" + catalog.reason);
    }
    if (catalog.operations.length === 0) {
      throw new Error("EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS");
    }
    return catalog;
  }

  function createAccessAndRefresh(input: {
    snapshot: ReturnType<ExternalAgentOAuthStoreV010["snapshot"]>;
    grant: ExternalAgentAuthorityGrantV010;
    oauthClientId: string;
    clientId: string;
    agentId: string;
    resource: string;
    scopes: string[];
    operationIds: string[];
    at: Date;
    refreshCeiling?: string;
  }): {
    nextSnapshot: ReturnType<ExternalAgentOAuthStoreV010["snapshot"]>;
    response: ExternalAgentOAuthTokenResponseV010;
  } {
    const occurredAt = input.at.toISOString();
    const accessToken = tokenValue("evo_at_", randomBytesImpl);
    const accessRecord: ExternalAgentOAuthAccessTokenV010 = {
      contractVersion: "0.1.0",
      tokenId: "external-access-token:" + id(),
      tokenHash: sha256(accessToken),
      oauthClientId: input.oauthClientId,
      clientId: input.clientId,
      agentId: input.agentId,
      grantId: input.grant.grantId,
      resource: input.resource,
      scopes: [...input.scopes],
      operationIds: [...input.operationIds],
      createdAt: occurredAt,
      expiresAt: boundedExpiry(
        input.at,
        accessTtlSeconds,
        input.grant
      )
    };

    let refreshToken: string | undefined;
    let refreshRecord: ExternalAgentOAuthRefreshTokenV010 | undefined;
    if (input.scopes.includes(EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE)) {
      refreshToken = tokenValue("evo_rt_", randomBytesImpl);
      refreshRecord = {
        contractVersion: "0.1.0",
        refreshTokenId: "external-refresh-token:" + id(),
        tokenHash: sha256(refreshToken),
        oauthClientId: input.oauthClientId,
        clientId: input.clientId,
        agentId: input.agentId,
        grantId: input.grant.grantId,
        resource: input.resource,
        scopes: [...input.scopes],
        operationIds: [...input.operationIds],
        createdAt: occurredAt,
        expiresAt: boundedExpiry(
          input.at,
          refreshTtlSeconds,
          input.grant,
          input.refreshCeiling
        )
      };
    }

    const events = [
      ...input.snapshot.events,
      oauthEvent("ACCESS_TOKEN_ISSUED", {
        id,
        at: occurredAt,
        oauthClientId: input.oauthClientId,
        clientId: input.clientId,
        agentId: input.agentId,
        grantId: input.grant.grantId,
        tokenId: accessRecord.tokenId
      }),
      ...(refreshRecord ? [
        oauthEvent("REFRESH_TOKEN_ISSUED", {
          id,
          at: occurredAt,
          oauthClientId: input.oauthClientId,
          clientId: input.clientId,
          agentId: input.agentId,
          grantId: input.grant.grantId,
          refreshTokenId: refreshRecord.refreshTokenId
        })
      ] : [])
    ];

    return {
      nextSnapshot: {
        ...input.snapshot,
        accessTokens: [...input.snapshot.accessTokens, accessRecord],
        refreshTokens: refreshRecord
          ? [...input.snapshot.refreshTokens, refreshRecord]
          : input.snapshot.refreshTokens,
        events
      },
      response: {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: Math.max(
          1,
          Math.floor(
            (Date.parse(accessRecord.expiresAt) - input.at.getTime()) / 1000
          )
        ),
        scope: input.scopes.join(" "),
        ...(refreshToken ? { refresh_token: refreshToken } : {})
      }
    };
  }

  return {
    protectedResourceMetadata() {
      return {
        resource: resourceIdentifier,
        authorization_servers: [authorizationServerIssuer],
        scopes_supported: [...SUPPORTED_SCOPES],
        bearer_methods_supported: ["header"],
        resource_name: options.resourceName?.trim() || "EVO Agent Access"
      };
    },

    authorizationServerMetadata() {
      return {
        issuer: authorizationServerIssuer,
        authorization_endpoint: authorizationServerIssuer + "/oauth/authorize",
        token_endpoint: authorizationServerIssuer + "/oauth/token",
        revocation_endpoint: authorizationServerIssuer + "/oauth/revoke",
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: [...SUPPORTED_SCOPES],
        client_id_metadata_document_supported: true,
        authorization_response_iss_parameter_supported: true,
        protected_resources: [resourceIdentifier]
      };
    },

    inspectClientMetadata,
    resolveClientMetadata: clientMetadata,

    async issueAuthorizationCode(input) {
      if (input.codeChallengeMethod !== "S256" || !input.codeChallenge.trim()) {
        throw new Error("EXTERNAL_AGENT_OAUTH_PKCE_S256_REQUIRED");
      }
      const resource = requireResource(input.resource);
      if (resource !== resourceIdentifier) {
        throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
      }
      const scopes = normalizeScopes(input.scopes);
      const redirectUri = requireRedirectUri(input.redirectUri);
      const resolvedClient = await clientMetadata(input.oauthClientId);
      if (!redirectUriRegistered(
        resolvedClient.metadata.redirect_uris,
        redirectUri
      )) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REDIRECT_URI_NOT_REGISTERED");
      }

      const governance = options.governanceStore.snapshot();
      const grant = governance.grants.find(item => item.grantId === input.grantId);
      if (!grant) throw new Error("EXTERNAL_AGENT_OAUTH_GRANT_NOT_FOUND");
      if (grant.clientId !== resolvedClient.registration.clientId) {
        throw new Error("EXTERNAL_AGENT_OAUTH_GRANT_CLIENT_MISMATCH");
      }
      if (grant.agentId !== resolvedClient.registration.agentId) {
        throw new Error("EXTERNAL_AGENT_OAUTH_GRANT_AGENT_MISMATCH");
      }
      if (
        input.requestContext.principal.actorType !== "HUMAN"
        || input.requestContext.principal.subjectId
          !== grant.authorizingPrincipalSubjectId
      ) {
        throw new Error("EXTERNAL_AGENT_OAUTH_AUTHORIZING_HUMAN_MISMATCH");
      }
      if (
        input.requestContext.context?.activeContext.contextId
        !== grant.contextId
      ) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CONTEXT_MISMATCH");
      }

      const authorityAtIssue = await requireCurrentDelegatedAuthority({
        grantId: grant.grantId,
        agentId: grant.agentId,
        clientId: grant.clientId,
        correlationId: input.correlationId
      });
      const operationIds = sortedOperationIds(
        authorityAtIssue.operations
      );

      const at = now();
      const code = tokenValue("evo_code_", randomBytesImpl);
      const codeRecord: ExternalAgentOAuthAuthorizationCodeV010 = {
        contractVersion: "0.1.0",
        codeId: "external-auth-code:" + id(),
        codeHash: sha256(code),
        oauthClientId: resolvedClient.registration.oauthClientId!,
        clientId: grant.clientId,
        agentId: grant.agentId,
        grantId: grant.grantId,
        authorizingPrincipalSubjectId: grant.authorizingPrincipalSubjectId,
        resource,
        redirectUri,
        scopes,
        operationIds,
        codeChallengeMethod: "S256",
        codeChallenge: input.codeChallenge,
        createdAt: at.toISOString(),
        expiresAt: boundedExpiry(at, codeTtlSeconds, grant)
      };
      const snapshot = options.store.snapshot();
      options.store.save({
        ...snapshot,
        authorizationCodes: [...snapshot.authorizationCodes, codeRecord],
        events: [
          ...snapshot.events,
          oauthEvent("AUTHORIZATION_CODE_ISSUED", {
            id,
            at: at.toISOString(),
            oauthClientId: codeRecord.oauthClientId,
            clientId: codeRecord.clientId,
            agentId: codeRecord.agentId,
            grantId: codeRecord.grantId,
            codeId: codeRecord.codeId
          })
        ]
      });
      return {
        code,
        redirectUri,
        scopes: [...scopes],
        expiresAt: codeRecord.expiresAt
      };
    },

    async exchangeAuthorizationCode(input) {
      const resource = requireResource(input.resource);
      if (resource !== resourceIdentifier) {
        throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
      }
      const oauthClientId = requireHttpsUrl(
        input.oauthClientId,
        "EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID"
      );
      const redirectUri = requireRedirectUri(input.redirectUri);
      const verifier = requirePkceVerifier(input.codeVerifier);
      const snapshot = options.store.snapshot();
      const record = snapshot.authorizationCodes.find(
        item => item.codeHash === sha256(input.code)
      );
      if (!record) throw new Error("EXTERNAL_AGENT_OAUTH_CODE_INVALID");
      if (record.consumedAt !== undefined) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CODE_ALREADY_USED");
      }
      const at = now();
      if (Date.parse(record.expiresAt) <= at.getTime()) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CODE_EXPIRED");
      }
      if (
        record.oauthClientId !== oauthClientId
        || record.redirectUri !== redirectUri
        || record.resource !== resource
      ) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CODE_BINDING_MISMATCH");
      }
      if (pkceChallenge(verifier) !== record.codeChallenge) {
        throw new Error("EXTERNAL_AGENT_OAUTH_PKCE_VERIFICATION_FAILED");
      }

      const catalog = await requireCurrentDelegatedAuthority({
        grantId: record.grantId,
        agentId: record.agentId,
        clientId: record.clientId,
        correlationId: input.correlationId
      });
      const grant = catalog.grant!;
      const operationIds = attenuatedOperationIds(
        catalog.operations,
        record.operationIds
      );
      if (operationIds.length === 0) {
        throw new Error("EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS");
      }

      const consumed: ExternalAgentOAuthAuthorizationCodeV010 = {
        ...record,
        consumedAt: at.toISOString()
      };
      const interim = {
        ...snapshot,
        authorizationCodes: snapshot.authorizationCodes.map(item =>
          item.codeId === record.codeId ? consumed : item
        ),
        events: [
          ...snapshot.events,
          oauthEvent("AUTHORIZATION_CODE_CONSUMED", {
            id,
            at: at.toISOString(),
            oauthClientId: record.oauthClientId,
            clientId: record.clientId,
            agentId: record.agentId,
            grantId: record.grantId,
            codeId: record.codeId
          })
        ]
      };
      const issued = createAccessAndRefresh({
        snapshot: interim,
        grant,
        oauthClientId: record.oauthClientId,
        clientId: record.clientId,
        agentId: record.agentId,
        resource: record.resource,
        scopes: record.scopes,
        operationIds,
        at
      });
      options.store.save(issued.nextSnapshot);
      return issued.response;
    },

    async refreshAccessToken(input) {
      const resource = requireResource(input.resource);
      if (resource !== resourceIdentifier) {
        throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
      }
      const oauthClientId = requireHttpsUrl(
        input.oauthClientId,
        "EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID"
      );
      const snapshot = options.store.snapshot();
      const record = snapshot.refreshTokens.find(
        item => item.tokenHash === sha256(input.refreshToken)
      );
      if (!record) throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_INVALID");
      if (record.oauthClientId !== oauthClientId || record.resource !== resource) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_BINDING_MISMATCH");
      }
      if (record.revokedAt !== undefined) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_REVOKED");
      }
      if (record.consumedAt !== undefined) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_REPLAY");
      }
      const at = now();
      if (Date.parse(record.expiresAt) <= at.getTime()) {
        throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_EXPIRED");
      }
      const catalog = await requireCurrentDelegatedAuthority({
        grantId: record.grantId,
        agentId: record.agentId,
        clientId: record.clientId,
        correlationId: input.correlationId
      });
      const grant = catalog.grant!;
      const operationIds = attenuatedOperationIds(
        catalog.operations,
        record.operationIds
      );
      if (operationIds.length === 0) {
        throw new Error("EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS");
      }

      const issued = createAccessAndRefresh({
        snapshot,
        grant,
        oauthClientId: record.oauthClientId,
        clientId: record.clientId,
        agentId: record.agentId,
        resource: record.resource,
        scopes: record.scopes,
        operationIds,
        at,
        refreshCeiling: record.expiresAt
      });
      const replacement = issued.nextSnapshot.refreshTokens.at(-1);
      const consumed: ExternalAgentOAuthRefreshTokenV010 = {
        ...record,
        consumedAt: at.toISOString(),
        ...(replacement
          ? { replacedByRefreshTokenId: replacement.refreshTokenId }
          : {})
      };
      const next = {
        ...issued.nextSnapshot,
        refreshTokens: issued.nextSnapshot.refreshTokens.map(item =>
          item.refreshTokenId === record.refreshTokenId ? consumed : item
        ),
        events: [
          ...issued.nextSnapshot.events,
          oauthEvent("REFRESH_TOKEN_ROTATED", {
            id,
            at: at.toISOString(),
            oauthClientId: record.oauthClientId,
            clientId: record.clientId,
            agentId: record.agentId,
            grantId: record.grantId,
            refreshTokenId: record.refreshTokenId
          })
        ]
      };
      options.store.save(next);
      return issued.response;
    },

    async resolveAccessToken(accessToken, resourceInput, correlationId) {
      const resource = requireResource(resourceInput);
      if (resource !== resourceIdentifier) {
        throw new Error("EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH");
      }
      const snapshot = options.store.snapshot();
      const record = snapshot.accessTokens.find(
        item => item.tokenHash === sha256(accessToken)
      );
      if (!record) throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_INVALID");
      if (record.resource !== resource) {
        throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_RESOURCE_MISMATCH");
      }
      if (record.revokedAt !== undefined) {
        throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_REVOKED");
      }
      const at = now();
      if (Date.parse(record.expiresAt) <= at.getTime()) {
        throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_EXPIRED");
      }

      const catalog = await requireCurrentDelegatedAuthority({
        grantId: record.grantId,
        agentId: record.agentId,
        clientId: record.clientId,
        correlationId
      });
      const operationIds = attenuatedOperationIds(
        catalog.operations,
        record.operationIds
      );
      if (operationIds.length === 0) {
        throw new Error("EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS");
      }
      return {
        contractVersion: "0.1.0",
        token: structuredClone(record),
        grantId: record.grantId,
        agentId: record.agentId,
        clientId: record.clientId,
        resource: record.resource,
        operationIds
      };
    },

    revokeToken(rawToken) {
      const hash = sha256(rawToken);
      const snapshot = options.store.snapshot();
      const at = now().toISOString();
      const access = snapshot.accessTokens.find(item => item.tokenHash === hash);
      if (access && access.revokedAt === undefined) {
        options.store.save({
          ...snapshot,
          accessTokens: snapshot.accessTokens.map(item =>
            item.tokenId === access.tokenId
              ? { ...item, revokedAt: at }
              : item
          ),
          events: [
            ...snapshot.events,
            oauthEvent("ACCESS_TOKEN_REVOKED", {
              id,
              at,
              oauthClientId: access.oauthClientId,
              clientId: access.clientId,
              agentId: access.agentId,
              grantId: access.grantId,
              tokenId: access.tokenId
            })
          ]
        });
        return;
      }

      const refresh = snapshot.refreshTokens.find(item => item.tokenHash === hash);
      if (refresh && refresh.revokedAt === undefined) {
        options.store.save({
          ...snapshot,
          refreshTokens: snapshot.refreshTokens.map(item =>
            item.refreshTokenId === refresh.refreshTokenId
              ? { ...item, revokedAt: at }
              : item
          ),
          events: [
            ...snapshot.events,
            oauthEvent("REFRESH_TOKEN_REVOKED", {
              id,
              at,
              oauthClientId: refresh.oauthClientId,
              clientId: refresh.clientId,
              agentId: refresh.agentId,
              grantId: refresh.grantId,
              refreshTokenId: refresh.refreshTokenId
            })
          ]
        });
      }
    }
  };
}
