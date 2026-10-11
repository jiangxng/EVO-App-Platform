import { createPrivateKey, randomUUID, sign } from 'node:crypto';
import type {
  FinanceOwnerPreflightInputV010, FinanceOwnerPreflightV010
} from './finance-intent-admission.js';

/** Transport is configured by the installed trusted provider, not user input.
 * Private key is supplied by the Host secret boundary and NEVER serialized.
 */
export interface TrustedFinanceOwnerInstallationV010 {
  readonly installationId: string;
  readonly issuer: string;
  readonly keyId: string;
  readonly endpoint: string;
  readonly hostEnterpriseId: string;
  readonly contextId: string;
  readonly evoEnterpriseId: string;
  readonly active: true;
}
export const FINANCE_OWNER_AUDIENCE_V010 =
  'evo:trading-finance-owner:read-only:v0.1.0';
export const FINANCE_OWNER_TYP_V010 = 'evo-finance-delegation+jwt';
export const FINANCE_OWNER_PATH_V010 =
  '/api/v1/plugins/trading-finance/readonly-verifications';

export function createTrustedRemoteFinanceOwnerPreflightV010(options: {
  /** Missing/deactivated installation means fail closed before any network. */
  resolveInstallation(): TrustedFinanceOwnerInstallationV010 | undefined;
  /** Resolve from the Host server-side SecretsProvider, never a request value. */
  resolveSigningPrivateKey(installationId: string, keyId: string): Promise<string> | string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  /** Isolated CI only, cannot activate plain HTTP in production. */
  allowLoopbackHttpInTest?: boolean;
}): FinanceOwnerPreflightV010 {
  return {
    async verify(input: FinanceOwnerPreflightInputV010) {
      const install = options.resolveInstallation();
      if (!install || install.active !== true) {
        throw new Error('TR01B2D3_OWNER_INSTALLATION_NOT_ACTIVE');
      }
      if (install.hostEnterpriseId !== input.hostEnterpriseId ||
        install.evoEnterpriseId !== input.evoEnterpriseId ||
        install.contextId !== input.contextId) {
        throw new Error('TR01B2D3_OWNER_INSTALLATION_SCOPE_MISMATCH');
      }
      const url = new URL(install.endpoint);
      const testHttp = options.allowLoopbackHttpInTest === true &&
        process.env.NODE_ENV === 'test' &&
        ['127.0.0.1','localhost','::1'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !(testHttp && url.protocol === 'http:')) ||
        url.username || url.password || url.search || url.hash ||
        url.pathname !== FINANCE_OWNER_PATH_V010) {
        throw new Error('TR01B2D3_OWNER_ENDPOINT_NOT_TRUSTED');
      }
      if (!install.issuer.trim() || !install.keyId.trim() ||
        !install.installationId.trim() ||
        !input.actorSubjectId.trim() || !input.correlationId.trim() ||
        !['HUMAN','AI'].includes(input.actorType)) {
        throw new Error('TR01B2D3_HOST_IDENTITY_INVALID');
      }
      const key = createPrivateKey(await options.resolveSigningPrivateKey(install.installationId, install.keyId));
      if (key.asymmetricKeyType !== 'ed25519') {
        throw new Error('TR01B2D3_SIGNING_KEY_INVALID');
      }
      const now = options.now?.() ?? Math.floor(Date.now()/1000);
      const claims = {
        iss: install.issuer, aud: FINANCE_OWNER_AUDIENCE_V010,
        iat:now, nbf:now, exp:now+45, jti:randomUUID(),
        purpose:'TR01B2D3_FINANCE_READONLY',
        installationId:install.installationId,
        hostEnterpriseId:input.hostEnterpriseId,
        contextId:input.contextId,
        evoEnterpriseId:input.evoEnterpriseId,
        actorSubjectId:input.actorSubjectId,
        actorType:input.actorType,
        correlationId:input.correlationId,
        intent:{...input.intent,evoEnterpriseId:input.evoEnterpriseId}
      };
      const header = {alg:'Ed25519',typ:FINANCE_OWNER_TYP_V010,kid:install.keyId};
      const parts = [header,claims].map(v => Buffer.from(JSON.stringify(v)).toString('base64url'));
      const signingInput = parts.join('.');
      const assertion = signingInput+'.'+sign(null,Buffer.from(signingInput),key).toString('base64url');
      const response = await (options.fetchImpl ?? fetch)(install.endpoint,{
        method:'POST',
        headers:{'content-type':'application/json','accept':'application/json'},
        body:JSON.stringify({assertion}),
        signal:AbortSignal.timeout(5000),
        redirect:'error'
      });
      if (!response.ok) {
        throw new Error('TR01B2D3_OWNER_REMOTE_DENIED_'+response.status);
      }
      const body: unknown = await response.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('TR01B2D3_OWNER_RESPONSE_INVALID');
      }
      const v = body as Record<string,unknown>;
      if (v.contractVersion !== '0.1.0' || v.verified !== true ||
        v.executionAllowed !== false ||
        v.verificationKind !== 'OWNER_DATABASE_READ_ONLY' ||
        v.evoEnterpriseId !== input.evoEnterpriseId ||
        v.orderNo !== input.intent.orderNo ||
        !Array.isArray(v.reasonCodes) || v.reasonCodes.length !== 0) {
        throw new Error('TR01B2D3_OWNER_RESPONSE_INVALID');
      }
      return {
        contractVersion:'0.1.0',verified:true,
        evoEnterpriseId:input.evoEnterpriseId,
        orderNo:input.intent.orderNo,reasonCodes:[]
      };
    }
  };
}
