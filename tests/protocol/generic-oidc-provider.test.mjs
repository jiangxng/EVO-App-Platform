import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {configureGenericOidcProviderRuntimeV010} from '../../dist/providers/oidc/host-runtime.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';

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
    iat: 1790755000,
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

test("failed discovery is shared only in flight; a new explicit login retries and successful discovery stays cached", async () => {
  const authority = fakeAuthority();
  let discoveryCalls = 0, fail;
  const failure = new Promise((_resolve, reject) => { fail = reject; });
  const identityProvider = provider(authority, {fetchImpl: async (url, init) => {
    if (String(url).endsWith('/.well-known/openid-configuration')) {
      discoveryCalls++;
      if (discoveryCalls === 1) return failure;
    }
    return authority.fetchImpl(url, init);
  }});
  const begin = () => identityProvider.begin({contractVersion: '0.1.0', callbackUrl, returnTo: '/'});
  const first = begin(), second = begin();
  assert.equal(discoveryCalls, 1);
  const rejected = Promise.all([assert.rejects(first, /synthetic-discovery-failure/),
    assert.rejects(second, /synthetic-discovery-failure/)]);
  fail(Error('synthetic-discovery-failure'));
  await rejected;
  assert.equal(discoveryCalls, 1, 'no automatic retry');
  const recovered = await begin();
  const cached = await begin();
  assert.equal(discoveryCalls, 2);
  assert.notEqual(new URL(recovered.redirectUrl).searchParams.get('state'),
    new URL(cached.redirectUrl).searchParams.get('state'));
});

test("failed JWKS fetch consumes the callback; only a new login can retry and authenticate", async () => {
  const authority = fakeAuthority();
  let jwksCalls = 0;
  const identityProvider = provider(authority, {fetchImpl: async (url, init) => {
    if (String(url) === issuer + '/jwks' && ++jwksCalls === 1) throw Error('synthetic-jwks-failure');
    return authority.fetchImpl(url, init);
  }});
  const complete = authorize => identityProvider.complete({contractVersion: '0.1.0', callbackUrl:
    callbackUrl + '?code=synthetic&state=' + encodeURIComponent(authorize.searchParams.get('state'))});
  const failed = await beginLogin(identityProvider, authority);
  await assert.rejects(complete(failed), /synthetic-jwks-failure/);
  await assert.rejects(complete(failed), /OIDC_STATE_INVALID/);
  assert.equal(jwksCalls, 1, 'consumed callback cannot replay token exchange or key request');
  assert.equal(authority.calls.filter(call => call.url === issuer + '/token').length, 1);
  const next = await beginLogin(identityProvider, authority);
  const result = await complete(next);
  assert.match(result.principal.subjectId, /^oidc:[A-Za-z0-9_-]{16}:subject-123$/);
  await assert.rejects(complete(next), /OIDC_STATE_INVALID/);
  const cached = await beginLogin(identityProvider, authority);
  await complete(cached);
  assert.equal(jwksCalls, 2, 'successful JWKS stays cached');
  assert.equal(authority.calls.filter(call => call.url.endsWith('/.well-known/openid-configuration')).length, 1);
});

async function configuredHost(options = {}) {
  const registry = createProviderRuntimeRegistry();
  const authority = fakeAuthority({token: nonce => idToken({nonce, exp: Math.floor(Date.now() / 1000) + 600,
    extra: {iat: Math.floor(Date.now() / 1000)}})});
  const state = {epoch: 0, active: true, token: 'synthetic-v1', fault: '', describes: 0, resolves: 0};
  const secrets = {async describe() { state.describes++; if (state.fault === 'describe') throw Error('synthetic-describe-failure');
      await options.pause?.('describe'); return {configured: state.token !== undefined}; },
    async resolve() { state.resolves++; if (state.fault === 'resolve') throw Error('synthetic-resolve-failure');
      await options.pause?.('resolve'); return state.token; }};
  state.secrets = secrets;
  await configureGenericOidcProviderRuntimeV010({settings: {issuer, clientId}, registry,
    resolveSecrets: () => state.secrets, isCurrent: () => state.active, epoch: () => state.epoch,
    fetchImpl: options.fetchImpl ? (url, init) => options.fetchImpl(url, init, authority) : authority.fetchImpl});
  const runtime = registry.get(GENERIC_OIDC_PROVIDER_ID);
  return {state, authority, registry, runtime,
    begin: () => beginLogin(runtime, authority),
    complete: authorize => runtime.complete({contractVersion: '0.1.0', callbackUrl:
      callbackUrl + '?code=synthetic&state=' + encodeURIComponent(authorize.searchParams.get('state'))})};
}

test('Host OIDC decrypts only at token exchange, rotates per new login and keeps public-client contract', async () => {
  const host = await configuredHost();
  const start = await host.begin();
  await host.registry.runHealthProbe(GENERIC_OIDC_PROVIDER_ID);
  assert.equal(host.state.describes + host.state.resolves, 0);
  await assert.rejects(host.runtime.complete({contractVersion: '0.1.0', callbackUrl: callbackUrl + '?state=invalid&code=bad'}), /OIDC_STATE_INVALID/);
  assert.equal(host.state.describes + host.state.resolves, 0);
  await host.complete(start);
  host.state.token = 'synthetic-v2'; await host.complete(await host.begin());
  host.state.token = undefined; await host.complete(await host.begin());
  const calls = host.authority.calls.filter(call => call.url === issuer + '/token');
  assert.equal(calls.length, 3);
  for (const [i, token] of ['synthetic-v1', 'synthetic-v2'].entries()) {
    assert.equal(new Headers(calls[i].init.headers).get('authorization'),
      'Basic ' + Buffer.from(clientId + ':' + token).toString('base64'));
    assert.equal(new URLSearchParams(calls[i].init.body).has('client_id'), false);
  }
  assert.equal(new Headers(calls[2].init.headers).has('authorization'), false);
  assert.equal(new URLSearchParams(calls[2].init.body).get('client_id'), clientId);
  assert.equal(host.state.describes, 3); assert.equal(host.state.resolves, 2);
});

test('Host OIDC missing/corrupt/empty Secrets never downgrade to public client; new login can recover', async () => {
  for (const fault of ['missing', 'describe', 'resolve', 'empty']) {
    const host = await configuredHost(); const start = await host.begin();
    const original = host.state.secrets;
    if (fault === 'missing') host.state.secrets = undefined;
    else if (fault === 'empty') host.state.token = '  ';
    else host.state.fault = fault;
    await assert.rejects(host.complete(start), /SECRETS_PROVIDER_REQUIRED|synthetic-.*-failure|OIDC_CLIENT_SECRET_EMPTY/);
    assert.equal(host.authority.calls.filter(call => call.url === issuer + '/token').length, 0);
    await assert.rejects(host.complete(start), /OIDC_STATE_INVALID/);
    host.state.secrets = original; host.state.fault = ''; host.state.token = 'synthetic-recovered';
    assert.equal((await host.complete(await host.begin())).principal.actorType, 'HUMAN');
  }
});

for (const stage of ['describe', 'resolve']) test('Host OIDC rejects context changes while waiting for ' + stage, async () => {
  for (const change of ['epoch-roundtrip', 'disabled', 'secrets-replaced', 'runtime-replaced']) {
    let enter, release;
    const entered = new Promise(resolve => {enter = resolve;});
    const barrier = new Promise(resolve => {release = resolve;});
    const host = await configuredHost({pause: async step => {if (step === stage) {enter(); await barrier;}}});
    const start = await host.begin(), pending = host.complete(start);
    await entered;
    if (change === 'epoch-roundtrip') {host.state.active = false; host.state.epoch++; host.state.active = true; host.state.epoch++;}
    if (change === 'disabled') host.state.active = false;
    if (change === 'secrets-replaced') host.state.secrets = {...host.state.secrets};
    if (change === 'runtime-replaced') host.registry.replace(GENERIC_OIDC_PROVIDER_ID, {providerId: GENERIC_OIDC_PROVIDER_ID});
    const rejected = assert.rejects(pending, /OIDC_CONTEXT_CHANGED/); release(); await rejected;
    assert.equal(host.authority.calls.filter(call => call.url === issuer + '/token').length, 0);
    if (stage === 'describe') assert.equal(host.state.resolves, 0, 'invalidated metadata cannot trigger decryption');
  }
});

test('Host OIDC binds begin/complete to one context and rejects late token/JWKS responses', async () => {
  const host = await configuredHost(); const start = await host.begin(); host.state.epoch++;
  await assert.rejects(host.complete(start), /OIDC_CONTEXT_CHANGED/);
  assert.equal(host.state.resolves, 0);
  for (const endpoint of ['/token', '/jwks']) {
    let enter, release;
    const entered = new Promise(resolve => {enter = resolve;});
    const barrier = new Promise(resolve => {release = resolve;});
    const next = await configuredHost({fetchImpl: async (url, init, authority) => {
      if (String(url) === issuer + endpoint) {enter(); await barrier;}
      return authority.fetchImpl(url, init);
    }});
    const pending = next.complete(await next.begin()); await entered;
    next.state.epoch++; const rejected = assert.rejects(pending, /OIDC_CONTEXT_CHANGED/); release(); await rejected;
    if (endpoint === '/token') assert.equal(next.authority.calls.some(call => call.url === issuer + '/jwks'), false);
  }
});

test('OIDC token deadline includes Secret wait and prevents late token request after abort', async t => {
  const active = new Set();
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {assert.equal(delay, 8000); const handle = {callback}; active.add(handle); return handle;});
  t.mock.method(globalThis, 'clearTimeout', handle => assert.equal(active.delete(handle), true));
  let enter, release;
  const entered = new Promise(resolve => {enter = resolve;}); const barrier = new Promise(resolve => {release = resolve;});
  const host = await configuredHost({pause: async stage => {if (stage === 'resolve') {enter(); await barrier;}}});
  const pending = host.complete(await host.begin()); await entered;
  assert.equal(active.size, 1); [...active][0].callback();
  const rejected = assert.rejects(pending, /Abort/); release(); await rejected;
  assert.equal(active.size, 0); assert.equal(host.authority.calls.some(call => call.url === issuer + '/token'), false);
});

