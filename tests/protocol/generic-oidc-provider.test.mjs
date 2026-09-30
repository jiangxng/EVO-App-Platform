import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";

import {
  createGenericOidcIdentityAuthenticationProviderV010,
  createGenericOidcIdentityHealthProbeV010
} from "../../dist/providers/oidc/runtime.js";
import {
  GENERIC_OIDC_PROVIDER_ID,
  genericOidcIdentityProviderPackage
} from "../../dist/providers/oidc/package.js";

const issuer = "https://idp.example";
const clientId = "evo-client";
const callbackUrl = "https://evo.example/auth/callback";
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048
});
const publicJwk = publicKey.export({ format: "jwk" });
publicJwk.kid = "kid-1";
publicJwk.use = "sig";
publicJwk.alg = "RS256";

function encode(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function idToken({
  nonce,
  aud = clientId,
  iss = issuer,
  exp = 1790766000,
  sub = "subject-123",
  kid = "kid-1",
  key = privateKey,
  extra = {}
}) {
  const header = encode({ alg: "RS256", typ: "JWT", kid });
  const payload = encode({
    iss,
    sub,
    aud,
    exp,
    iat: 1790762000,
    nonce,
    name: "Alice",
    email: "alice@example.com",
    email_verified: true,
    ...extra
  });
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`, "utf8"),
    key
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function fakeAuthority(options = {}) {
  let tokenNonce = "";
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url) === issuer + "/.well-known/openid-configuration") {
      return jsonResponse({
        issuer,
        authorization_endpoint: issuer + "/authorize",
        token_endpoint: issuer + "/token",
        jwks_uri: issuer + "/jwks",
        response_types_supported: ["code"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["client_secret_basic"]
      });
    }
    if (String(url) === issuer + "/jwks") {
      return jsonResponse({ keys: [publicJwk] });
    }
    if (String(url) === issuer + "/token") {
      const token = options.token
        ? options.token(tokenNonce)
        : idToken({ nonce: tokenNonce });
      return jsonResponse({
        access_token: "must-not-become-evo-session",
        token_type: "Bearer",
        expires_in: 3600,
        id_token: token
      });
    }
    throw new Error("UNEXPECTED_FETCH " + String(url));
  };
  return {
    fetchImpl,
    calls,
    captureAuthorization(url) {
      const parsed = new URL(url);
      tokenNonce = parsed.searchParams.get("nonce");
      return parsed;
    }
  };
}

function provider(authority, overrides = {}) {
  let seed = 0;
  return createGenericOidcIdentityAuthenticationProviderV010({
    issuer,
    clientId,
    scopes: "openid profile email",
    fetchImpl: authority.fetchImpl,
    now: () => new Date("2026-09-30T09:00:00.000Z"),
    randomBytesImpl(size) {
      seed += 1;
      return Buffer.alloc(size, seed);
    },
    ...overrides
  });
}

async function beginLogin(identityProvider, authority) {
  const start = await identityProvider.begin({
    contractVersion: "0.1.0",
    callbackUrl,
    returnTo: "/ledger/runtime",
    locale: "zh-CN"
  });
  return authority.captureAuthorization(start.redirectUrl);
}

test("generic OIDC Provider manifest exposes identity.authenticate without owning browser Session", () => {
  assert.equal(genericOidcIdentityProviderPackage.type, "PLATFORM_PROVIDER");
  assert.equal(
    genericOidcIdentityProviderPackage.features[0].providesCapabilities.includes(
      "identity.authenticate"
    ),
    true
  );
  assert.equal(
    genericOidcIdentityProviderPackage.features[0].providesCapabilities.includes(
      "identity.session.request"
    ),
    false
  );
  assert.equal(
    genericOidcIdentityProviderPackage.secrets[0].key,
    "clientSecret"
  );
});

test("OIDC begin uses discovery, Authorization Code, PKCE S256, state and nonce", async () => {
  const authority = fakeAuthority();
  const identityProvider = provider(authority);
  const authorize = await beginLogin(identityProvider, authority);

  assert.equal(authorize.origin, issuer);
  assert.equal(authorize.pathname, "/authorize");
  assert.equal(authorize.searchParams.get("response_type"), "code");
  assert.equal(authorize.searchParams.get("client_id"), clientId);
  assert.equal(authorize.searchParams.get("redirect_uri"), callbackUrl);
  assert.equal(authorize.searchParams.get("code_challenge_method"), "S256");
  assert.ok(authorize.searchParams.get("code_challenge"));
  assert.ok(authorize.searchParams.get("state"));
  assert.ok(authorize.searchParams.get("nonce"));
  assert.match(authorize.searchParams.get("scope"), /openid/);
});

test("OIDC callback validates ID Token and returns bounded Human Principal only", async () => {
  const authority = fakeAuthority();
  const identityProvider = provider(authority);
  const authorize = await beginLogin(identityProvider, authority);
  const state = authorize.searchParams.get("state");

  const result = await identityProvider.complete({
    contractVersion: "0.1.0",
    callbackUrl:
      callbackUrl + "?code=code-1&state=" + encodeURIComponent(state)
  });

  assert.equal(result.principal.actorType, "HUMAN");
  assert.equal(result.principal.identityProviderId, GENERIC_OIDC_PROVIDER_ID);
  assert.match(result.principal.subjectId, /^oidc:[A-Za-z0-9_-]{16}:subject-123$/);
  assert.equal(result.principal.displayName, "Alice");
  assert.deepEqual(result.principal.claims, {
    email: "alice@example.com",
    emailVerified: true
  });
  assert.equal(result.returnTo, "/ledger/runtime");
  assert.deepEqual(result.assurance, [
    "OIDC",
    "AUTHORIZATION_CODE",
    "PKCE_S256",
    "ID_TOKEN_RS256"
  ]);

  const tokenCall = authority.calls.find(call => call.url === issuer + "/token");
  assert.ok(tokenCall);
  assert.match(String(tokenCall.init.body), /grant_type=authorization_code/);
  assert.match(String(tokenCall.init.body), /code_verifier=/);
  assert.equal(
    JSON.stringify(result).includes("must-not-become-evo-session"),
    false
  );
});

test("OIDC state is single-use and callback replay fails closed", async () => {
  const authority = fakeAuthority();
  const identityProvider = provider(authority);
  const authorize = await beginLogin(identityProvider, authority);
  const callback =
    callbackUrl + "?code=code-1&state="
    + encodeURIComponent(authorize.searchParams.get("state"));

  await identityProvider.complete({
    contractVersion: "0.1.0",
    callbackUrl: callback
  });

  await assert.rejects(
    () => identityProvider.complete({
      contractVersion: "0.1.0",
      callbackUrl: callback
    }),
    /OIDC_STATE_INVALID/
  );
});

test("OIDC rejects nonce mismatch, wrong audience and expired ID Tokens", async () => {
  for (const [name, tokenFactory, expected] of [
    [
      "nonce",
      () => idToken({ nonce: "wrong-nonce" }),
      /OIDC_ID_TOKEN_NONCE_MISMATCH/
    ],
    [
      "audience",
      nonce => idToken({ nonce, aud: "another-client" }),
      /OIDC_ID_TOKEN_AUDIENCE_MISMATCH/
    ],
    [
      "expiry",
      nonce => idToken({ nonce, exp: 1 }),
      /OIDC_ID_TOKEN_EXPIRED/
    ]
  ]) {
    const authority = fakeAuthority({
      token: tokenFactory
    });
    const identityProvider = provider(authority);
    const authorize = await beginLogin(identityProvider, authority);

    await assert.rejects(
      () => identityProvider.complete({
        contractVersion: "0.1.0",
        callbackUrl:
          callbackUrl + "?code=" + name
          + "&state=" + encodeURIComponent(authorize.searchParams.get("state"))
      }),
      expected
    );
  }
});

test("OIDC rejects issuer mismatch and unsupported ID Token algorithm", async () => {
  const authority = fakeAuthority({
    token(nonce) {
      const header = encode({ alg: "none", kid: "kid-1" });
      const payload = encode({
        iss: issuer,
        sub: "subject-123",
        aud: clientId,
        exp: 1790766000,
        nonce
      });
      return header + "." + payload + ".";
    }
  });
  const identityProvider = provider(authority);
  const authorize = await beginLogin(identityProvider, authority);
  await assert.rejects(
    () => identityProvider.complete({
      contractVersion: "0.1.0",
      callbackUrl:
        callbackUrl + "?code=bad-alg&state="
        + encodeURIComponent(authorize.searchParams.get("state"))
    }),
    /OIDC_ID_TOKEN_ALG_UNSUPPORTED/
  );

  const mismatchFetch = async (url, init) => {
    if (String(url) === issuer + "/.well-known/openid-configuration") {
      return jsonResponse({
        issuer: "https://wrong-issuer.example",
        authorization_endpoint: issuer + "/authorize",
        token_endpoint: issuer + "/token",
        jwks_uri: issuer + "/jwks"
      });
    }
    return authority.fetchImpl(url, init);
  };
  const mismatch = createGenericOidcIdentityAuthenticationProviderV010({
    issuer,
    clientId,
    fetchImpl: mismatchFetch
  });
  await assert.rejects(
    () => mismatch.begin({
      contractVersion: "0.1.0",
      callbackUrl,
      returnTo: "/"
    }),
    /OIDC_DISCOVERY_ISSUER_MISMATCH/
  );
});

test("confidential OIDC client uses HTTP Basic while secret is not exposed in redirect", async () => {
  const authority = fakeAuthority();
  const identityProvider = provider(authority, {
    clientSecret: "super-secret"
  });
  const authorize = await beginLogin(identityProvider, authority);
  assert.equal(authorize.toString().includes("super-secret"), false);

  await identityProvider.complete({
    contractVersion: "0.1.0",
    callbackUrl:
      callbackUrl + "?code=code-secret&state="
      + encodeURIComponent(authorize.searchParams.get("state"))
  });

  const tokenCall = authority.calls.find(call => call.url === issuer + "/token");
  assert.match(tokenCall.init.headers.authorization, /^Basic /);
  assert.equal(
    Buffer.from(
      tokenCall.init.headers.authorization.slice("Basic ".length),
      "base64"
    ).toString("utf8"),
    clientId + ":super-secret"
  );
});

test("OIDC health probe validates discovery issuer binding", async () => {
  const authority = fakeAuthority();
  const probe = createGenericOidcIdentityHealthProbeV010({
    issuer,
    clientId,
    fetchImpl: authority.fetchImpl
  });
  const health = await probe();
  assert.equal(health.state, "HEALTHY");
});
