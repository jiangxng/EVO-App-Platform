import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANES,evaluateSixLaneInventory,privateTlsGate,migrationGate,
  oidcSessionGate,keyCustodyGate,multiInstanceGate,releaseRollbackGate}
  from '../../tools/tr01b2d3-six-lane-admission.mjs';

const observed=JSON.parse(readFileSync(new URL(
  '../fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json',
  import.meta.url),'utf8'));
const copy=x=>structuredClone(x),digest='a'.repeat(64);
const reference={sha256:digest,reviewedBy:'security_reviewer',observedAt:'2026-10-11T11:00:00Z'};
function synthetic(){
  const o=copy(observed);
  o.services.push({purpose:'FINANCE_OWNER_READONLY',name:'finance-owner',
    entrypoint:'node dist/apps/api/src/finance-owner-readonly-main.js',
    publicDomains:[],privateHostname:'finance-owner.railway.internal',replicas:2});
  o.network={endpoint:'https://finance-owner.railway.internal/api/v1/plugins/trading-finance/readonly-verifications',
    tlsRejectUnauthorized:true,peerServiceIdentityCheck:true,customPrivateCaMounted:true};
  o.services.find(x=>x.purpose==='EVO_GENERAL_RUNTIME').preDeployCommands=[];
  o.migration={...o.migration,reviewedSqlSha256:'sha256:'+digest,
    separateMigrationPrincipal:'owner_migrator',financeRuntimePrincipal:'owner_runtime',
    preDeploymentExecutionDisabled:true,transactionalMigration:true};
  o.identity={issuer:'https://sso.enterprise.com/issuer',clientRegistration:'finance_web',
    audience:'finance_host',enterpriseClaimMapping:'enterprise_mapping',
    pkceS256:true,stateAndNonceBound:true,signatureAndJwksRotationChecked:true,
    managedHttpOnlySecureCookie:true,sessionRevocationEnforced:true,
    actorFromServerSession:true,staticSessionFallback:false};
  o.signing={hostSecretScope:'INSTALLATION',ownerCanReadHostPrivateKey:false,
    keyPointerSymlinksRejected:true,missingKeyFailsClosed:true,
    keyProviderType:'AUDITED_EXTERNAL_VAULT',keyReference:'finance_owner_secret',
    plaintextKeyInManifest:false,separateTrustOperator:true,
    revocationEnforcedWithoutRestart:true,rotateThenRevokeAudited:true};
  o.services.find(x=>x.purpose==='POSTGRES_PRIMARY').primaryNonceUniqueConstraint=true;
  o.chaos={duplicateJtiOneAcceptOneDeny:true,revocationInterlockBothDeny:true,
    dbUnavailableDenies:true,upstreamUnavailableDenies:true,crossNodeReplayDenied:true};
  o.release={imageDigest:'sha256:'+digest,appCommit:'a'.repeat(40),evoCommit:'b'.repeat(40),
    onlyDraftNoMainMerge:true,financeExecutionAllowed:false,b2d4WritesEnabled:false,
    rollbackRevokesSigningKey:true,rollbackRestoresPrivateIngress:true,
    preservesOriginalEconomicDigest:true};
  o.evidence=Object.fromEntries([
    'tlsPeerHandshake','dbOwnerStrictCatalog','operatorMigrationApproval',
    'realOidcSessionNegativeTests','vaultPolicyReview','keyRotationLive',
    'realMultinodeFaults','rollbackDrill','separateReleaseApprover'
  ].map(k=>[k,copy(reference)]));
  return o;
}
const denied=(r,code)=>{
  assert.equal(r.candidateStatus,'BLOCKED');
  assert.ok(r.reasons.includes(code),JSON.stringify(r.reasons));
  assert.equal(r.executionAllowed,false);
  assert.equal(r.deploymentAuthorized,false);
};

test('PRIVATE_TLS - real Railway production snapshot denies absent owner',()=>{
  denied(privateTlsGate(observed),'OWNER_DEDICATED_SERVICE_MISSING');
  assert.equal(privateTlsGate(synthetic()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  for(const endpoint of [
    'http://finance-owner.railway.internal/api/v1/plugins/trading-finance/readonly-verifications',
    'https://evo-runtime-production.up.railway.app/api/v1/plugins/trading-finance/readonly-verifications',
    'https://admin:pw@finance-owner.railway.internal/api/v1/plugins/trading-finance/readonly-verifications',
    'https://finance-owner.railway.internal/api/v1/plugins/trading-finance/readonly-verifications?allowInsecure=1'
  ]){
    const bad=synthetic();bad.network.endpoint=endpoint;
    denied(privateTlsGate(bad),'HTTPS_PRIVATE_ENDPOINT_MISMATCH');
  }
  const pub=synthetic();pub.services.at(-1).publicDomains=['finance-owner.up.railway.app'];
  denied(privateTlsGate(pub),'OWNER_PUBLIC_EXPOSURE_NOT_DENIED');
  const insecure=synthetic();insecure.network.tlsRejectUnauthorized=false;
  denied(privateTlsGate(insecure),'PRIVATE_CA_AND_PEER_AUTH_NOT_EVIDENCED');
});

test('MIGRATION - actual automatic Railway predeploy migration blocks security role transition',()=>{
  denied(migrationGate(observed),'EVO_AUTO_MIGRATION_NOT_ISOLATED');
  assert.equal(migrationGate(synthetic()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const auto=synthetic();
  auto.services.find(x=>x.purpose==='EVO_GENERAL_RUNTIME')
    .preDeployCommands=['node dist/scripts/migrate.js'];
  denied(migrationGate(auto),'EVO_AUTO_MIGRATION_NOT_ISOLATED');
  const same=synthetic();same.migration.separateMigrationPrincipal='owner_runtime';
  denied(migrationGate(same),'PRIVILEGED_MIGRATOR_AND_RUNTIME_MUST_DIFFER');
  const unsigned=synthetic();delete unsigned.evidence.operatorMigrationApproval;
  denied(migrationGate(unsigned),'OPERATOR_AND_RUNTIME_DATABASE_WITNESSES_MISSING');
});

test('OIDC_SESSION - invalid issuer, missing PKCE and static session fallback are denied',()=>{
  denied(oidcSessionGate(observed),'OIDC_REAL_ISSUER_REQUIRED');
  assert.equal(oidcSessionGate(synthetic()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  for(const issuer of [
    'http://sso.enterprise.com','https://localhost',
    'https://sso.invalid/oidc','https://user:password@sso.enterprise.com',
    'https://sso.enterprise.com/oidc?next=evil'
  ]){
    const x=synthetic();x.identity.issuer=issuer;
    denied(oidcSessionGate(x),'OIDC_REAL_ISSUER_REQUIRED');
  }
  const insecure=synthetic();insecure.identity.pkceS256=false;
  denied(oidcSessionGate(insecure),'OIDC_PKCE_AND_SIGNATURE_CONTROLS_REQUIRED');
  const fallback=synthetic();fallback.identity.staticSessionFallback=true;
  denied(oidcSessionGate(fallback),'HOST_MANAGED_SESSION_ISOLATION_REQUIRED');
  const noIdp=synthetic();delete noIdp.evidence.realOidcSessionNegativeTests;
  denied(oidcSessionGate(noIdp),'REAL_IDP_SESSION_NEGATIVE_WITNESS_MISSING');
});

test('KEY_CUSTODY - absent vault, owner key exposure and missing rotation evidence denied',()=>{
  denied(keyCustodyGate(observed),'EXTERNAL_KEY_CUSTODY_NOT_EVIDENCED');
  assert.equal(keyCustodyGate(synthetic()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const leak=synthetic();leak.signing.ownerCanReadHostPrivateKey=true;
  denied(keyCustodyGate(leak),'HOST_SECRET_BOUNDARY_REQUIRED');
  const file=synthetic();file.signing.keyProviderType='LOCAL_ENCRYPTED_FILE';
  denied(keyCustodyGate(file),'EXTERNAL_KEY_CUSTODY_NOT_EVIDENCED');
  const audit=synthetic();audit.signing.rotateThenRevokeAudited=false;
  denied(keyCustodyGate(audit),'KEY_ROTATION_AUDIT_AND_SEPARATION_REQUIRED');
  const witness=synthetic();delete witness.evidence.vaultPolicyReview;
  denied(keyCustodyGate(witness),'VAULT_AND_ROTATION_WITNESS_MISSING');
});

test('MULTI_INSTANCE - independent owner nodes and database/replay outage proof required',()=>{
  denied(multiInstanceGate(observed),'TWO_INDEPENDENT_OWNER_WORKERS_REQUIRED');
  assert.equal(multiInstanceGate(synthetic()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const single=synthetic();single.services.at(-1).replicas=1;
  denied(multiInstanceGate(single),'TWO_INDEPENDENT_OWNER_WORKERS_REQUIRED');
  const noUnique=synthetic();
  noUnique.services.find(x=>x.purpose==='POSTGRES_PRIMARY').primaryNonceUniqueConstraint=false;
  denied(multiInstanceGate(noUnique),'SHARED_POSTGRES_NONCE_AUTHORITY_UNVERIFIED');
  for(const k of Object.keys(synthetic().chaos)){
    const x=synthetic();x.chaos[k]=false;
    denied(multiInstanceGate(x),'FAIL_CLOSED_MULTINODE_NEGATIVE_MATRIX_INCOMPLETE');
  }
  const noWitness=synthetic();delete noWitness.evidence.realMultinodeFaults;
  denied(multiInstanceGate(noWitness),'INDEPENDENT_MULTINODE_FAULT_WITNESS_MISSING');
});

test('RELEASE_ROLLBACK - no production authorization from a self-reported checklist',()=>{
  const before=LANES.slice(0,5).map(()=>({candidateStatus:'CANDIDATE_CONTROLS_PRESENT'}));
  denied(releaseRollbackGate(observed,[]),'FIVE_INDEPENDENT_LANES_NOT_ADMITTED');
  assert.equal(releaseRollbackGate(synthetic(),before).candidateStatus,
    'CANDIDATE_CONTROLS_PRESENT');
  const badImage=synthetic();badImage.release.imageDigest='latest';
  denied(releaseRollbackGate(badImage,before),
    'IMMUTABLE_IMAGE_AND_BOTH_REPOSITORY_COMMITS_REQUIRED');
  const write=synthetic();write.release.financeExecutionAllowed=true;
  denied(releaseRollbackGate(write,before),'FINANCE_WRITE_FENCE_REQUIRED');
  const undo=synthetic();undo.release.rollbackRevokesSigningKey=false;
  denied(releaseRollbackGate(undo,before),'ROLLOUT_AND_ROLLBACK_FENCE_REQUIRED');
  const badReview=synthetic();delete badReview.evidence.separateReleaseApprover;
  denied(releaseRollbackGate(badReview,before),
    'REAL_RELEASE_APPROVAL_AND_ROLLBACK_WITNESS_MISSING');
  assert.equal(releaseRollbackGate(synthetic(),before).deploymentAuthorized,false);
});

test('SIX_LANE_AGGREGATE - live inventory blocked and synthetic ideal cannot certify',()=>{
  const live=evaluateSixLaneInventory(observed);
  assert.equal(Object.keys(live.lanes).length,6);
  assert.equal(live.status,'BLOCKED');
  assert.equal(live.productionCertification,'NOT_CERTIFIED');
  for(const id of LANES)assert.equal(live.lanes[id].candidateStatus,'BLOCKED',id);
  const hypothetical=evaluateSixLaneInventory(synthetic());
  assert.equal(hypothetical.status,'CANDIDATE_ONLY');
  assert.equal(hypothetical.productionCertification,'NOT_CERTIFIED');
  assert.equal(hypothetical.deploymentAuthorized,false);
  assert.equal(hypothetical.executionAllowed,false);
  const exfil=synthetic();exfil.privateKeyPem='-----BEGIN PRIVATE KEY-----\nSENSITIVE\n-----END PRIVATE KEY-----';
  assert.ok(evaluateSixLaneInventory(exfil)
    .failedChecks.includes('SENSITIVE_VALUE_IN_REDACTED_INVENTORY'));
  assert.equal(evaluateSixLaneInventory(null).status,'BLOCKED');
});
