import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";
import type {
  IdentityAuthenticationProviderV010,
  IdentityAuthenticationResultV010,
  IdentityAuthenticationStartResultV010,
  PlatformPrincipalV010
} from "../../contracts/platform-services.js";
import { GENERIC_OIDC_PROVIDER_ID } from "./package.js";

export interface GenericOidcProviderOptionsV010 {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  scopes?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  randomBytesImpl?: (size: number) => Buffer;
  transactionTtlSeconds?: number;
}

interface OidcDiscoveryDocumentV010 {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported?: string[];
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
}

interface OidcTokenResponseV010 {
  id_token?: string;
  token_type?: string;
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface JwkSetV010 {
  keys?: Array<Record<string, unknown>>;
}

interface OidcLoginTransactionV010 {
  state: string;
  nonce: string;
  codeVerifier: string;
  callbackUrl: string;
  returnTo: string;
  createdAtMs: number;
}

interface JwtHeaderV010 {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface JwtClaimsV010 {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  azp?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
}

function base64Url(input: Buffer): string {
  return input.toString("base64url");
}

function randomBase64Url(
  bytes: number,
  randomBytesImpl: (size: number) => Buffer
): string {
  return base64Url(randomBytesImpl(bytes));
}

function sha256Base64Url(value: string): string {
  return base64Url(createHash("sha256").update(value, "utf8").digest());
}

function normalizeIssuer(value: string): string {
  const issuer = new URL(value.trim());
  if (issuer.protocol !== "https:" && issuer.hostname !== "localhost") {
    throw new Error("OIDC_ISSUER_HTTPS_REQUIRED");
  }
  issuer.search = "";
  issuer.hash = "";
  return issuer.toString().replace(/\/$/, "");
}

function requireHttpsEndpoint(value: string, code: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error(code);
  }
  return url.toString();
}

function discoveryUrl(issuer: string): string {
  return issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
}

function parseJwtPart<T>(encoded: string, code: string): T {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(code);
    }
    return parsed as T;
  } catch {
    throw new Error(code);
  }
}

function stableSubjectId(issuer: string, sub: string): string {
  const issuerDigest = createHash("sha256")
    .update(issuer, "utf8")
    .digest("base64url")
    .slice(0, 16);
  return `oidc:${issuerDigest}:${sub}`;
}

function limitedClaims(claims: JwtClaimsV010): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  if (typeof claims.email === "string") result.email = claims.email;
  if (typeof claims.email_verified === "boolean") {
    result.emailVerified = claims.email_verified;
  }
  if (typeof claims.preferred_username === "string") {
    result.preferredUsername = claims.preferred_username;
  }
  return result;
}

function displayName(claims: JwtClaimsV010): string | undefined {
  for (const candidate of [
    claims.name,
    claims.preferred_username,
    claims.email,
    claims.sub
  ]) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

function hasAudience(aud: string | string[] | undefined, clientId: string): boolean {
  if (typeof aud === "string") return aud === clientId;
  return Array.isArray(aud) && aud.includes(clientId);
}

function audienceCount(aud: string | string[] | undefined): number {
  if (typeof aud === "string") return 1;
  return Array.isArray(aud) ? aud.length : 0;
}

async function fetchJsonV010<T>(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit | undefined,
  errorPrefix: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, {
      ...init,
      redirect: "error",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) {
      throw new Error(`${errorPrefix}_HTTP_${response.status}`);
    }
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function createGenericOidcIdentityAuthenticationProviderV010(
  options: GenericOidcProviderOptionsV010
): IdentityAuthenticationProviderV010 {
  const issuer = normalizeIssuer(options.issuer);
  const clientId = options.clientId.trim();
  if (!clientId) throw new Error("OIDC_CLIENT_ID_REQUIRED");

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("OIDC_FETCH_UNAVAILABLE");

  const now = options.now ?? (() => new Date());
  const randomBytesImpl = options.randomBytesImpl ?? randomBytes;
  const transactionTtlSeconds = options.transactionTtlSeconds ?? 600;
  if (!Number.isFinite(transactionTtlSeconds) || transactionTtlSeconds <= 0) {
    throw new Error("OIDC_TRANSACTION_TTL_INVALID");
  }

  const scopeSet = new Set(
    (options.scopes ?? "openid profile email")
      .split(/\s+/)
      .map(item => item.trim())
      .filter(Boolean)
  );
  scopeSet.add("openid");
  const scope = [...scopeSet].join(" ");

  const transactions = new Map<string, OidcLoginTransactionV010>();
  let discoveryCache: Promise<OidcDiscoveryDocumentV010> | undefined;
  let jwksCache: Promise<JwkSetV010> | undefined;

  async function discover(): Promise<OidcDiscoveryDocumentV010> {
    discoveryCache ??= (async () => {
      const metadata = await fetchJsonV010<OidcDiscoveryDocumentV010>(
        fetchImpl,
        discoveryUrl(issuer),
        undefined,
        "OIDC_DISCOVERY"
      );
      if (metadata.issuer !== issuer) {
        throw new Error("OIDC_DISCOVERY_ISSUER_MISMATCH");
      }
      requireHttpsEndpoint(
        metadata.authorization_endpoint,
        "OIDC_AUTHORIZATION_ENDPOINT_HTTPS_REQUIRED"
      );
      requireHttpsEndpoint(
        metadata.token_endpoint,
        "OIDC_TOKEN_ENDPOINT_HTTPS_REQUIRED"
      );
      requireHttpsEndpoint(
        metadata.jwks_uri,
        "OIDC_JWKS_ENDPOINT_HTTPS_REQUIRED"
      );
      if (
        Array.isArray(metadata.response_types_supported)
        && !metadata.response_types_supported.includes("code")
      ) {
        throw new Error("OIDC_AUTHORIZATION_CODE_UNSUPPORTED");
      }
      return metadata;
    })();
    return discoveryCache;
  }

  async function jwks(forceRefresh = false): Promise<JwkSetV010> {
    if (forceRefresh) jwksCache = undefined;
    jwksCache ??= (async () => {
      const metadata = await discover();
      return fetchJsonV010<JwkSetV010>(
        fetchImpl,
        metadata.jwks_uri,
        undefined,
        "OIDC_JWKS"
      );
    })();
    return jwksCache;
  }

  async function validateIdToken(
    idToken: string,
    expectedNonce: string
  ): Promise<JwtClaimsV010> {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("OIDC_ID_TOKEN_INVALID");
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = parseJwtPart<JwtHeaderV010>(
      encodedHeader,
      "OIDC_ID_TOKEN_HEADER_INVALID"
    );
    const claims = parseJwtPart<JwtClaimsV010>(
      encodedPayload,
      "OIDC_ID_TOKEN_CLAIMS_INVALID"
    );
    if (header.alg !== "RS256") {
      throw new Error("OIDC_ID_TOKEN_ALG_UNSUPPORTED");
    }
    if (!header.kid) throw new Error("OIDC_ID_TOKEN_KID_REQUIRED");

    async function findKey(forceRefresh: boolean): Promise<Record<string, unknown> | undefined> {
      const set = await jwks(forceRefresh);
      return (set.keys ?? []).find(key =>
        key.kid === header.kid
        && key.kty === "RSA"
        && (key.use === undefined || key.use === "sig")
        && (key.alg === undefined || key.alg === "RS256")
      );
    }

    let jwk = await findKey(false);
    if (!jwk) jwk = await findKey(true);
    if (!jwk) throw new Error("OIDC_ID_TOKEN_SIGNING_KEY_NOT_FOUND");

    let publicKey;
    try {
      publicKey = createPublicKey({
        key: jwk as NodeJsonWebKey,
        format: "jwk"
      });
    } catch {
      throw new Error("OIDC_ID_TOKEN_SIGNING_KEY_INVALID");
    }

    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8"),
      publicKey,
      Buffer.from(encodedSignature, "base64url")
    );
    if (!validSignature) throw new Error("OIDC_ID_TOKEN_SIGNATURE_INVALID");

    const nowSeconds = Math.floor(now().getTime() / 1000);
    if (claims.iss !== issuer) throw new Error("OIDC_ID_TOKEN_ISSUER_MISMATCH");
    if (!claims.sub?.trim()) throw new Error("OIDC_ID_TOKEN_SUBJECT_REQUIRED");
    if (!hasAudience(claims.aud, clientId)) {
      throw new Error("OIDC_ID_TOKEN_AUDIENCE_MISMATCH");
    }
    if (audienceCount(claims.aud) > 1 && claims.azp !== clientId) {
      throw new Error("OIDC_ID_TOKEN_AZP_MISMATCH");
    }
    if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) {
      throw new Error("OIDC_ID_TOKEN_EXPIRED");
    }
    if (typeof claims.iat === "number" && claims.iat > nowSeconds + 60) {
      throw new Error("OIDC_ID_TOKEN_ISSUED_IN_FUTURE");
    }
    if (claims.nonce !== expectedNonce) {
      throw new Error("OIDC_ID_TOKEN_NONCE_MISMATCH");
    }

    return claims;
  }

  return {
    providerId: GENERIC_OIDC_PROVIDER_ID,

    async begin(input): Promise<IdentityAuthenticationStartResultV010> {
      const metadata = await discover();
      const callbackUrl = requireHttpsEndpoint(
        input.callbackUrl,
        "OIDC_CALLBACK_HTTPS_REQUIRED"
      );
      const state = randomBase64Url(32, randomBytesImpl);
      const nonce = randomBase64Url(32, randomBytesImpl);
      const codeVerifier = randomBase64Url(32, randomBytesImpl);
      const codeChallenge = sha256Base64Url(codeVerifier);

      transactions.set(state, {
        state,
        nonce,
        codeVerifier,
        callbackUrl,
        returnTo: input.returnTo,
        createdAtMs: now().getTime()
      });

      const authorizationUrl = new URL(metadata.authorization_endpoint);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("client_id", clientId);
      authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
      authorizationUrl.searchParams.set("scope", scope);
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("nonce", nonce);
      authorizationUrl.searchParams.set("code_challenge", codeChallenge);
      authorizationUrl.searchParams.set("code_challenge_method", "S256");

      return {
        contractVersion: "0.1.0",
        redirectUrl: authorizationUrl.toString()
      };
    },

    async complete(input): Promise<IdentityAuthenticationResultV010> {
      const callbackUrl = new URL(input.callbackUrl);
      const providerError = callbackUrl.searchParams.get("error");
      if (providerError) {
        throw new Error(`OIDC_AUTHORIZATION_ERROR:${providerError}`);
      }

      const state = callbackUrl.searchParams.get("state")?.trim();
      const code = callbackUrl.searchParams.get("code")?.trim();
      if (!state) throw new Error("OIDC_STATE_REQUIRED");
      if (!code) throw new Error("OIDC_AUTHORIZATION_CODE_REQUIRED");

      const transaction = transactions.get(state);
      transactions.delete(state);
      if (!transaction) throw new Error("OIDC_STATE_INVALID");
      if (transaction.callbackUrl !== callbackUrl.origin + callbackUrl.pathname) {
        throw new Error("OIDC_CALLBACK_MISMATCH");
      }
      if (
        now().getTime() - transaction.createdAtMs
        > transactionTtlSeconds * 1000
      ) {
        throw new Error("OIDC_TRANSACTION_EXPIRED");
      }

      const metadata = await discover();
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: transaction.callbackUrl,
        code_verifier: transaction.codeVerifier
      });
      const headers: Record<string, string> = {
        "content-type": "application/x-www-form-urlencoded"
      };

      const clientSecret = options.clientSecret?.trim();
      if (clientSecret) {
        const allowed = metadata.token_endpoint_auth_methods_supported;
        if (
          Array.isArray(allowed)
          && !allowed.includes("client_secret_basic")
        ) {
          throw new Error("OIDC_CLIENT_SECRET_BASIC_UNSUPPORTED");
        }
        headers.authorization =
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
      } else {
        body.set("client_id", clientId);
      }

      const token = await fetchJsonV010<OidcTokenResponseV010>(
        fetchImpl,
        metadata.token_endpoint,
        {
          method: "POST",
          headers,
          body
        },
        "OIDC_TOKEN"
      );
      if (token.error) {
        throw new Error(`OIDC_TOKEN_ERROR:${token.error}`);
      }
      if (!token.id_token) throw new Error("OIDC_ID_TOKEN_REQUIRED");

      const claims = await validateIdToken(token.id_token, transaction.nonce);
      const principal: PlatformPrincipalV010 = {
        contractVersion: "0.1.0",
        subjectId: stableSubjectId(issuer, claims.sub!),
        actorType: "HUMAN",
        identityProviderId: GENERIC_OIDC_PROVIDER_ID,
        ...(displayName(claims) ? { displayName: displayName(claims) } : {}),
        claims: limitedClaims(claims)
      };

      return {
        contractVersion: "0.1.0",
        principal,
        assurance: ["OIDC", "AUTHORIZATION_CODE", "PKCE_S256", "ID_TOKEN_RS256"],
        returnTo: transaction.returnTo
      };
    }
  };
}

export function createGenericOidcIdentityHealthProbeV010(
  options: GenericOidcProviderOptionsV010
) {
  const issuer = normalizeIssuer(options.issuer);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("OIDC_FETCH_UNAVAILABLE");

  return async () => {
    try {
      const metadata = await fetchJsonV010<OidcDiscoveryDocumentV010>(
        fetchImpl,
        discoveryUrl(issuer),
        undefined,
        "OIDC_DISCOVERY"
      );
      if (metadata.issuer !== issuer) {
        return {
          state: "UNAVAILABLE" as const,
          message: "OIDC discovery issuer does not match configured issuer."
        };
      }
      return {
        state: "HEALTHY" as const,
        message: "OIDC discovery metadata is reachable and issuer-bound."
      };
    } catch (error) {
      return {
        state: "UNAVAILABLE" as const,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
}
