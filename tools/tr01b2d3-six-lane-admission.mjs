#!/usr/bin/env node
/**
 * TR01B2D3 independent, non-destructive six-lane readiness verifier.
 * Only a redacted inventory and human-referenced evidence are accepted.
 * "CANDIDATE_CONTROLS_PRESENT" never attests production or allows deployment.
 */
import { lstatSync, readFileSync } from 'node:fs';

export const LANES=Object.freeze([
  'PRIVATE_TLS','MIGRATION','OIDC_SESSION','KEY_CUSTODY','MULTI_INSTANCE','RELEASE_ROLLBACK'
]);
const OBJ=v=>v!==null && typeof v==='object' && !Array.isArray(v);
const SHA=/^sha256:[0-9a-f]{64}$/u, HEX=/^[0-9a-f]{64}$/u;
const safe=v=>typeof v==='string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/u.test(v);
const get=(o,...ks)=>ks.reduce((v,k)=>OBJ(v)?v[k]:undefined,o);
const witness=v=>OBJ(v)&&HEX.test(v.sha256??'')&&safe(v.reviewedBy)&&
  /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/u.test(v.observedAt??'');
const resource=(o,purpose)=>(Array.isArray(o?.services)?o.services:[])
  .find(s=>s?.purpose===purpose);
const check=(fail,cond,code)=>{if(!cond)fail.push(code)};
const result=fail=>({candidateStatus:fail.length?'BLOCKED':'CANDIDATE_CONTROLS_PRESENT',
  reasons:fail,productionCertification:'NOT_CERTIFIED',deploymentAuthorized:false,
  executionAllowed:false});
const parseUrl=s=>{try{return new URL(s)}catch{return undefined}};
function sensitive(v){
  if(Array.isArray(v))return v.some(sensitive);
  if(OBJ(v))return Object.entries(v).some(([key,value])=>
    /^(?:password|token|privatekey|secret|clientsecret|databaseurl|dsn|authorization|cookie|pem|credentialvalue)$/iu.test(key)||sensitive(value));
  return typeof v==='string' &&
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/|\bBearer [a-zA-Z0-9._-]{8,}/iu.test(v);
}

export function privateTlsGate(o){
  const f=[],owner=resource(o,'FINANCE_OWNER_READONLY'),dns=owner?.privateHostname;
  check(f,!!owner,'OWNER_DEDICATED_SERVICE_MISSING');
  check(f,Array.isArray(owner?.publicDomains)&&owner.publicDomains.length===0,
    'OWNER_PUBLIC_EXPOSURE_NOT_DENIED');
  check(f,owner?.entrypoint==='node dist/apps/api/src/finance-owner-readonly-main.js',
    'OWNER_WRONG_ENTRYPOINT');
  check(f,typeof dns==='string'&&/^[a-z0-9-]+\.railway\.internal$/u.test(dns),
    'OWNER_PRIVATE_DNS_MISSING');
  const url=parseUrl(get(o,'network','endpoint'));
  check(f,url?.protocol==='https:'&&url.hostname===dns&&
    url.pathname==='/api/v1/plugins/trading-finance/readonly-verifications'&&
    !url.username&&!url.password&&!url.search&&!url.hash,'HTTPS_PRIVATE_ENDPOINT_MISMATCH');
  check(f,get(o,'network','tlsRejectUnauthorized')===true&&
    get(o,'network','peerServiceIdentityCheck')===true&&
    get(o,'network','customPrivateCaMounted')===true,
    'PRIVATE_CA_AND_PEER_AUTH_NOT_EVIDENCED');
  check(f,witness(get(o,'evidence','tlsPeerHandshake')),'TLS_HANDSHAKE_WITNESS_MISSING');
  return result(f);
}
export function migrationGate(o){
  const f=[],evo=resource(o,'EVO_GENERAL_RUNTIME'),cmd=evo?.preDeployCommands;
  check(f,!!evo,'GENERAL_EVO_SERVICE_NOT_OBSERVED');
  check(f,Array.isArray(cmd)&&!cmd.some(c=>
    /(?:^|\s)(?:node\s+)?(?:dist\/)?scripts\/migrate(?:\.js|\.ts)?(?:\s|$)/u.test(c)),
    'EVO_AUTO_MIGRATION_NOT_ISOLATED');
  check(f,get(o,'migration','securityMigration')===
    '202610110010_finance_key_lock_definer_least_privilege.sql',
    'EXPECTED_ADDITIVE_SECURITY_MIGRATION_MISSING');
  check(f,SHA.test(get(o,'migration','reviewedSqlSha256')??''),
    'REVIEWED_SQL_DIGEST_MISSING');
  check(f,safe(get(o,'migration','separateMigrationPrincipal'))&&
    get(o,'migration','separateMigrationPrincipal')!==
      get(o,'migration','financeRuntimePrincipal'),
    'PRIVILEGED_MIGRATOR_AND_RUNTIME_MUST_DIFFER');
  check(f,get(o,'migration','preDeploymentExecutionDisabled')===true&&
    get(o,'migration','transactionalMigration')===true,
    'UNAPPROVED_PRODUCTION_MIGRATION_PATH');
  check(f,witness(get(o,'evidence','dbOwnerStrictCatalog'))&&
    witness(get(o,'evidence','operatorMigrationApproval')),
    'OPERATOR_AND_RUNTIME_DATABASE_WITNESSES_MISSING');
  return result(f);
}
export function oidcSessionGate(o){
  const f=[],host=resource(o,'APP_PLATFORM_HOST'),v=o?.identity,url=parseUrl(v?.issuer);
  check(f,!!host,'HOST_NOT_OBSERVED');
  check(f,url?.protocol==='https:'&&!url.username&&!url.password&&
    !url.search&&!url.hash&&
    !/(?:^localhost$|\.example$|\.invalid$|\.localhost$)/iu.test(url.hostname)&&
    url.hostname!=='127.0.0.1','OIDC_REAL_ISSUER_REQUIRED');
  check(f,safe(v?.clientRegistration)&&safe(v?.audience)&&
    safe(v?.enterpriseClaimMapping),'OIDC_AUDIENCE_CLIENT_AND_TENANT_MAPPING_REQUIRED');
  check(f,v?.pkceS256===true&&v?.stateAndNonceBound===true&&
    v?.signatureAndJwksRotationChecked===true,
    'OIDC_PKCE_AND_SIGNATURE_CONTROLS_REQUIRED');
  check(f,v?.managedHttpOnlySecureCookie===true&&v?.sessionRevocationEnforced===true&&
    v?.actorFromServerSession===true&&v?.staticSessionFallback===false,
    'HOST_MANAGED_SESSION_ISOLATION_REQUIRED');
  check(f,witness(get(o,'evidence','realOidcSessionNegativeTests')),
    'REAL_IDP_SESSION_NEGATIVE_WITNESS_MISSING');
  return result(f);
}
export function keyCustodyGate(o){
  const f=[],v=o?.signing;
  check(f,v?.hostSecretScope==='INSTALLATION'&&
    v?.ownerCanReadHostPrivateKey===false&&v?.keyPointerSymlinksRejected===true&&
    v?.missingKeyFailsClosed===true,'HOST_SECRET_BOUNDARY_REQUIRED');
  check(f,v?.keyProviderType==='AUDITED_EXTERNAL_VAULT'&&safe(v?.keyReference)&&
    v?.plaintextKeyInManifest===false,'EXTERNAL_KEY_CUSTODY_NOT_EVIDENCED');
  check(f,v?.separateTrustOperator===true&&
    v?.revocationEnforcedWithoutRestart===true&&v?.rotateThenRevokeAudited===true,
    'KEY_ROTATION_AUDIT_AND_SEPARATION_REQUIRED');
  check(f,witness(get(o,'evidence','vaultPolicyReview'))&&
    witness(get(o,'evidence','keyRotationLive')),'VAULT_AND_ROTATION_WITNESS_MISSING');
  return result(f);
}
export function multiInstanceGate(o){
  const f=[],owner=resource(o,'FINANCE_OWNER_READONLY'),
    pg=resource(o,'POSTGRES_PRIMARY'),v=o?.chaos;
  check(f,Number.isInteger(owner?.replicas)&&owner.replicas>=2,
    'TWO_INDEPENDENT_OWNER_WORKERS_REQUIRED');
  check(f,!!pg&&pg?.primaryNonceUniqueConstraint===true&&
    pg?.durablePrimary===true,'SHARED_POSTGRES_NONCE_AUTHORITY_UNVERIFIED');
  check(f,v?.duplicateJtiOneAcceptOneDeny===true&&
    v?.revocationInterlockBothDeny===true&&v?.dbUnavailableDenies===true&&
    v?.upstreamUnavailableDenies===true&&v?.crossNodeReplayDenied===true,
    'FAIL_CLOSED_MULTINODE_NEGATIVE_MATRIX_INCOMPLETE');
  check(f,witness(get(o,'evidence','realMultinodeFaults')),
    'INDEPENDENT_MULTINODE_FAULT_WITNESS_MISSING');
  return result(f);
}
export function releaseRollbackGate(o,previous){
  const f=[],v=o?.release;
  check(f,SHA.test(v?.imageDigest??'')&&/^[a-f0-9]{40}$/u.test(v?.appCommit??'')&&
    /^[a-f0-9]{40}$/u.test(v?.evoCommit??''),
    'IMMUTABLE_IMAGE_AND_BOTH_REPOSITORY_COMMITS_REQUIRED');
  check(f,v?.onlyDraftNoMainMerge===true&&v?.financeExecutionAllowed===false&&
    v?.b2d4WritesEnabled===false,'FINANCE_WRITE_FENCE_REQUIRED');
  check(f,v?.rollbackRevokesSigningKey===true&&
    v?.rollbackRestoresPrivateIngress===true&&
    v?.preservesOriginalEconomicDigest===true,'ROLLOUT_AND_ROLLBACK_FENCE_REQUIRED');
  check(f,Array.isArray(previous)&&previous.length===5&&
    previous.every(p=>p?.candidateStatus==='CANDIDATE_CONTROLS_PRESENT'),
    'FIVE_INDEPENDENT_LANES_NOT_ADMITTED');
  check(f,witness(get(o,'evidence','rollbackDrill'))&&
    witness(get(o,'evidence','separateReleaseApprover')),
    'REAL_RELEASE_APPROVAL_AND_ROLLBACK_WITNESS_MISSING');
  return result(f);
}
export const evaluate=Object.freeze({
  PRIVATE_TLS:privateTlsGate,MIGRATION:migrationGate,OIDC_SESSION:oidcSessionGate,
  KEY_CUSTODY:keyCustodyGate,MULTI_INSTANCE:multiInstanceGate,
  RELEASE_ROLLBACK:releaseRollbackGate
});
export function evaluateSixLaneInventory(o){
  if(!OBJ(o)||!Array.isArray(o.services))return{
    status:'BLOCKED',lanes:{},failedChecks:['INVALID_INVENTORY'],
    productionCertification:'NOT_CERTIFIED',deploymentAuthorized:false,executionAllowed:false};
  const five=LANES.slice(0,5).map(id=>({id,...evaluate[id](o)}));
  const last={id:'RELEASE_ROLLBACK',...releaseRollbackGate(o,five)};
  const lanes=Object.fromEntries([...five,last].map(v=>[v.id,v]));
  const failedChecks=Object.entries(lanes).flatMap(([id,v])=>v.reasons.map(s=>id+':'+s));
  if(sensitive(o))failedChecks.push('SENSITIVE_VALUE_IN_REDACTED_INVENTORY');
  return{status:failedChecks.length?'BLOCKED':'CANDIDATE_ONLY',lanes,failedChecks,
    productionCertification:'NOT_CERTIFIED',deploymentAuthorized:false,executionAllowed:false};
}
if(process.argv[1]?.endsWith('/tr01b2d3-six-lane-admission.mjs')){
  try{
    if(process.argv.length!==3)throw Error('FILE_REQUIRED');
    const s=lstatSync(process.argv[2]);
    if(!s.isFile()||s.isSymbolicLink()||s.size>128*1024)throw Error('INVALID_FILE');
    const r=evaluateSixLaneInventory(JSON.parse(readFileSync(process.argv[2],'utf8')));
    console.log('TR01B2D3_SIX_LANE_ADMISSION='+JSON.stringify(r));
    if(r.status==='BLOCKED')process.exitCode=2;
  }catch{
    console.log('TR01B2D3_SIX_LANE_ADMISSION='+JSON.stringify({
      status:'BLOCKED',failedChecks:['UNREADABLE_OR_INVALID_INVENTORY'],
      productionCertification:'NOT_CERTIFIED',deploymentAuthorized:false,executionAllowed:false}));
    process.exitCode=2;
  }
}
