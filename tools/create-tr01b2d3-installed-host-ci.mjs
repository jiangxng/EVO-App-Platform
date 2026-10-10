#!/usr/bin/env node
/**
 * Disposable product-Host CI. Actually instantiate installed platform packages,
 * append-only managed identity Sessions and the Host AES-GCM encrypted Secrets
 * Provider. Starts against the original EVO tenant and ephemeral owner key.
 * Test-only credentials are NEVER a product login or production OIDC claim.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPackageCatalog } from '../dist/catalog/catalog.js';
import { createFileLifecycleStore } from '../dist/manager/store.js';
import { createAppManagerService } from '../dist/manager/service.js';
import { createJsonlManagedIdentitySessionEventStoreV010,
  createManagedIdentitySessionServiceV010 } from '../dist/manager/identity-session-store.js';
import { createEncryptedFileSecretStoreV010 } from '../dist/manager/secret-store.js';
import { tradingFinanceOwnerProviderPackageV010 } from '../dist/providers/trading-finance-owner/package.js';
import { hostManagedSessionProviderPackage } from '../dist/providers/managed-session/package.js';
import { hostEnterpriseContextProviderPackage } from '../dist/providers/enterprise-context/package.js';
import { hostEnterpriseContextGrantProviderPackage } from '../dist/providers/enterprise-context-grant/package.js';
import { hostStaticAuthorizationProviderPackage } from '../dist/providers/authorization/package.js';
import { hostEncryptedSecretsProviderPackage } from '../dist/providers/secrets/package.js';
const dir=resolve('/tmp/tr01b2d3-host-product');
mkdirSync(dir,{recursive:true,mode:0o700});
const install=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const signingKey=readFileSync('/tmp/tr01b2d3-host-signing-key.pem','utf8');
const packages=[
  hostManagedSessionProviderPackage,hostEnterpriseContextProviderPackage,
  hostEnterpriseContextGrantProviderPackage,hostStaticAuthorizationProviderPackage,
  hostEncryptedSecretsProviderPackage,tradingFinanceOwnerProviderPackageV010
];
const manager=createAppManagerService(createPackageCatalog(packages),
  createFileLifecycleStore(dir+'/state.json'));
for(const pkg of packages){
 const plan=manager.planInstall(pkg.packageId);
 if(plan.blockers.length)throw new Error('TR01B2D3_INSTALL_BLOCKED:'+JSON.stringify(plan.blockers));
 manager.install(pkg.packageId);
}
const secretStore=createEncryptedFileSecretStoreV010(dir+'/secrets.enc.json',
  dir+'/secrets.master.key');
const ref={
 contractVersion:'0.1.0',namespace:'evo-trading-finance-owner',
 key:'host-ed25519-signing-pkcs8',
 scope:'INSTALLATION',scopeId:install.installationId
};
secretStore.put(ref,signingKey);
const sessions=createManagedIdentitySessionServiceV010({
 store:createJsonlManagedIdentitySessionEventStoreV010(dir+'/identity-sessions.jsonl')
});
const issue=(subjectId,actorType='HUMAN',ttlSeconds=300)=>sessions.issue({
 principal:{contractVersion:'0.1.0',subjectId,actorType,
   identityProviderId:'ci-issued-managed-auth-provider'},
 ttlSeconds,assurance:['CI_ISSUED_MANAGED_SESSION']
});
const human=issue('host-authenticated-user');
const ai=issue('host-authorized-ai','AI');
const ungranted=issue('host-ungranted-person');
const revoked=issue('host-revoked-person');
if(!sessions.revoke(revoked.session.sessionId,'CI_REVOKE_BEFORE_PRODUCT_REQUEST')){
 throw new Error('TR01B2D3_SESSION_REVOKE_FAILED');
}
const expired=issue('host-expired-person','HUMAN',0.001);
const result={hostPort:4100,hostEnterpriseId:install.hostEnterpriseId,
 contextId:install.contextId,evoEnterpriseId:install.evoEnterpriseId,
 packageId:tradingFinanceOwnerProviderPackageV010.packageId,
 tokens:{human:human.token,ai:ai.token,ungranted:ungranted.token,
  revoked:revoked.token,expired:expired.token}
};
writeFileSync(dir+'/private-fixture.json',JSON.stringify(result),{mode:0o600});
const policy={
 contractVersion:'0.1.0',
 rules:[{
  id:'tr01b2d3-only-scoped-finance-readonly',
  effect:'ALLOW',
  actions:['trading-reference.finance.cost.request',
    'trading-reference.finance.allocation.request'],
  subjectIds:['host-authenticated-user','host-authorized-ai'],
  actorTypes:['HUMAN','AI'],
  scope:{enterpriseId:install.hostEnterpriseId},
  resourceTypes:[
   'trading-reference.sales-order','counterparty.subject',
   'item.subject','warehouse.subject',
   'trading-reference.shipment-business-data',
   'trading-reference.source-order-business-data',
   'trading-reference.customer-receipt-business-data'
  ]
 }]
};
const context={contractVersion:'0.1.0',contexts:[{
 contextId:install.contextId,enterpriseId:install.hostEnterpriseId,
 displayName:'CI TR01B original order enterprise'
}]};
const grants={contractVersion:'0.1.0',grants:[
  {grantId:'host-finance-human-grant',subjectId:'host-authenticated-user',contextId:install.contextId},
  {grantId:'host-finance-ai-grant',subjectId:'host-authorized-ai',contextId:install.contextId}
]};
const env={
 PORT:'4100',NODE_ENV:'test',
 APP_PLATFORM_STATE_FILE:dir+'/state.json',
 APP_PLATFORM_MANAGED_SESSION_ENABLED:'true',
 APP_PLATFORM_MANAGED_SESSION_FILE:dir+'/identity-sessions.jsonl',
 APP_PLATFORM_SECRETS_FILE:dir+'/secrets.enc.json',
 APP_PLATFORM_SECRETS_KEY_FILE:dir+'/secrets.master.key',
 APP_PLATFORM_FINANCE_OWNER_INSTALLATION_JSON:JSON.stringify({
  installationId:install.installationId,issuer:install.issuer,keyId:install.keyId,
  hostEnterpriseId:install.hostEnterpriseId,contextId:install.contextId,
  evoEnterpriseId:install.evoEnterpriseId,endpoint:install.endpoint,
  active:true
 }),
 APP_PLATFORM_EVO_RUNTIME_SCOPE_MAP_JSON:JSON.stringify({
  [install.hostEnterpriseId]:install.evoEnterpriseId
 }),
 APP_PLATFORM_AUTHORIZATION_POLICY_JSON:JSON.stringify(policy),
 APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON:JSON.stringify(context),
 APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON:JSON.stringify(grants),
 APP_PLATFORM_PUBLIC_BASE_URL:'http://localhost:4100'
};
writeFileSync(dir+'/private-host-env.json',JSON.stringify(env),{mode:0o600});
if(!sessions.resolveToken(human.token)||sessions.resolveToken(revoked.token)){
 throw new Error('TR01B2D3_SESSION_FIXTURE_INVALID');
}
console.log('TR01B2D3_INSTALLED_MANAGED_SESSION_AND_ENCRYPTED_SECRET_FIXTURE_READY');
