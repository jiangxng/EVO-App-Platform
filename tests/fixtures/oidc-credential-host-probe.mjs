// Synthetic OIDC authority + real crypto decryption counts before Host import.
import crypto from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
let decryptions = 0, requests = 0, tokens = 0, hold = false, release;
const decipher = crypto.createDecipheriv;
crypto.createDecipheriv = (...args) => {decryptions++; return decipher(...args);};
syncBuiltinESMExports();
const issuer = 'https://oidc-credential.invalid';
const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
const jwk = {...publicKey.export({format: 'jwk'}), kid: 'synthetic-key', use: 'sig', alg: 'RS256'};
const response = value => new Response(JSON.stringify(value));
globalThis.fetch = async (url, init = {}) => {
  requests++;
  if (String(url) === issuer + '/.well-known/openid-configuration') return response({issuer,
    authorization_endpoint: issuer + '/authorize', token_endpoint: issuer + '/token', jwks_uri: issuer + '/jwks',
    token_endpoint_auth_methods_supported: ['client_secret_basic']});
  if (String(url) === issuer + '/jwks') return response({keys: [jwk]});
  if (String(url) !== issuer + '/token') throw Error('UNEXPECTED_OIDC_HOST_FETCH');
  const authorization = new Headers(init.headers).get('authorization');
  if (authorization && !['synthetic-client:synthetic-oidc-v1', 'synthetic-client:synthetic-oidc-v2'].includes(
    Buffer.from(authorization.slice('Basic '.length), 'base64').toString('utf8'))) throw Error('OIDC_HOST_BASIC_INVALID');
  tokens++;
  if (hold) {
    const barrier = new Promise(resolve => {release = resolve;});
    process.send?.({kind: 'oidc-token-held'}); await barrier;
  }
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({alg: 'RS256', kid: jwk.kid});
  const now = Math.floor(Date.now() / 1000);
  const payload = encode({iss: issuer, aud: 'synthetic-client', sub: 'synthetic-human',
    iat: now, exp: now + 600, nonce: new URLSearchParams(init.body).get('code')});
  const signature = crypto.sign('RSA-SHA256', Buffer.from(header + '.' + payload), privateKey).toString('base64url');
  return response({id_token: header + '.' + payload + '.' + signature});
};
process.on('message', message => {
  if (message?.kind === 'oidc-credential-snapshot') process.send?.({id: message.id, decryptions, requests, tokens});
  if (message?.kind === 'oidc-hold') {hold = message.value; if (!hold) release?.(); process.send?.({id: message.id});}
});
