import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ADDITIONAL_LANES,TWELVE_LANES,evaluateTwelveLaneInventory,
  workloadIsolationGate,tenantAuthorizationGate,buildProvenanceGate,
  auditPrivacyGate,backupRecoveryGate,incidentObservabilityGate,
  matchVerifiedDelegationScope,provenanceShapeMatchesRelease,
  projectFinanceSecurityAuditEvent
} from '../../tools/tr01b2d3-twelve-lane-admission.mjs';

const real=JSON.parse(readFileSync(new URL(
  '../fixtures/tr01b2d3-railway-production-readonly-observed-20261011.json',
  import.meta.url),'utf8'));
const deep=structuredClone;
const stamp={sha256:'c'.repeat(64),reviewedBy:'synthetic_reviewer',
  observedAt:'2026-10-11T09:00:00Z'};
const proofNames=['ownerRouteIsolationProbe','ownerRuntimeOsIdentity','ownerDbRoleIsolation',
  'liveCrossTenantNegativeCases','authorizationProviderConfiguration',
  'externalSignatureVerification','sbomAndVulnerabilityReview',
  'immutableArtifactRegistryDigest','logRedactionFieldProof',
  'auditImmutabilityAndReadAccess','actualIsolatedRestoreDrill',
  'postRestoreRevocationNegativeCase','syntheticPageReceipt','readOnlyIncidentTabletop',
  'incidentRollbackEscalationReview'];
function candidate(){
  const o=deep(real);
  const h=o.services.find(s=>s.purpose==='APP_PLATFORM_HOST');
  const g=o.services.find(s=>s.purpose==='EVO_GENERAL_RUNTIME');
  h.workloadIdentity='host_identity';g.workloadIdentity='general_identity';
  g.databaseRuntimePrincipal='general_database_runtime';
  o.migration.separateMigrationPrincipal='approved_migrator';
  o.services.push({
    purpose:'FINANCE_OWNER_READONLY',name:'Finance Owner candidate',
    entrypoint:'node dist/apps/api/src/finance-owner-readonly-main.js',
    isolatedReadOnly:true,commandRoutesEnabled:false,businessMutationRoutesEnabled:false,
    publicDomains:[],privateHostname:'finance-owner.railway.internal',
    workloadIdentity:'owner_identity',databaseRuntimePrincipal:'finance_runtime',
    mountedHostSecrets:false,migrationPermission:false,
    canCreateDatabaseRoles:false,networkIngressHostOnly:true
  });
  o.tenantAuth={
    denyCrossHostEnterprise:true,denyCrossEvoEnterprise:true,denyWrongContext:true,
    denyActorSpoofing:true,actorDerivedFromManagedSession:true,
    allResourcesAuthorizedSeparately:true,conditionalObligationsFailClosed:true,
    ownerRevalidatesFactScope:true,untrustedClientEnterpriseIgnored:true,
    readonlyResponseExecutionAllowed:false
  };
  o.release={imageDigest:'sha256:'+'0'.repeat(64),
    appCommit:'a'.repeat(40),evoCommit:'b'.repeat(40)};
  o.supplyChain={
    predicateType:'https://slsa.dev/provenance/v1',
    subjectDigest:o.release.imageDigest,
    appSourceCommit:o.release.appCommit,
    evoSourceCommit:o.release.evoCommit,
    builderId:'https://github.com/actions/runner',
    sbomDigest:'sha256:'+'1'.repeat(64),
    dependencyReviewCompleted:true,reproducibleLockfiles:true,
    untrustedPrCannotAccessReleaseSecrets:true,runtimeImageNotBuiltFromMutableTag:true,
    signatureVerifiedOutOfBand:true,builderIdentityAllowlisted:true,
    provenanceSubjectWasChecked:true
  };
  o.audit={
    structuredSecurityEvents:true,correlatesHostOwnerOperator:true,
    immutableAuditSink:true,auditReaderSeparatedFromOperator:true,
    rawAssertionsLogged:false,tokenOrPrivateKeyLogged:false,
    databaseUrlLogged:false,unauditedVerboseErrors:false,
    retentionDays:90,accessReviewsEnabled:true,tamperAlertEnabled:true
  };
  o.recovery={
    pitrEnabled:true,backupsEncrypted:true,offEnvironmentCopy:true,
    backupOperatorSeparateFromFinanceRuntime:true,
    rpoTargetSeconds:3600,observedRpoSeconds:1200,
    rtoTargetSeconds:7200,observedRtoSeconds:2400,
    restoreIntoIsolatedTarget:true,nonceUniquenessCheckedAfterRestore:true,
    trustAuditConsistencyChecked:true,restoreCannotReenableRevokedTrust:true,
    financeWritesRemainDisabled:true
  };
  o.incident={
    onCallRoutingId:'finance_security_oncall',namedIncidentCommander:true,
    onCallAcknowledgementTested:true,incidentTriageRunbookApproved:true,
    replaySpikeAlert:true,ownerAuthorizationFailureAlert:true,tlsExpiryAlert:true,
    dbNonceAuthorityUnavailableAlert:true,keyRevokeAuditLagAlert:true,
    denyNewDelegationOnOutage:true,hostDisableSwitchFailClosed:true,
    manualOperatorRevocationPlaybook:true,doNotAutoEnableFinanceWrites:true
  };
  o.evidence=Object.fromEntries(proofNames.map(k=>[k,deep(stamp)]));
  return o;
}
const block=(x,code)=>{
  assert.equal(x.candidateStatus,'BLOCKED');
  assert.ok(x.reasons.includes(code),JSON.stringify(x.reasons));
  assert.equal(x.productionCertification,'NOT_CERTIFIED');
  assert.equal(x.deploymentAuthorized,false);
  assert.equal(x.executionAllowed,false);
};

test('WORKLOAD_ISOLATION actual Railway has no dedicated Finance Owner; forbid general API or privilege confusion',()=>{
  block(workloadIsolationGate(real),'SEPARATE_HOST_OWNER_EVO_SERVICES_MISSING');
  assert.equal(workloadIsolationGate(candidate()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const routes=candidate();routes.services.at(-1).commandRoutesEnabled=true;
  block(workloadIsolationGate(routes),'OWNER_ENTRYPOINT_OR_READONLY_SURFACE_INVALID');
  const publicOwner=candidate();publicOwner.services.at(-1).publicDomains=['owner.up.railway.app'];
  block(workloadIsolationGate(publicOwner),'OWNER_MUST_BE_PRIVATE_AND_SEPARATE');
  for(const key of ['mountedHostSecrets','migrationPermission','canCreateDatabaseRoles']){
    const x=candidate();x.services.at(-1)[key]=true;
    block(workloadIsolationGate(x),'OWNER_SECRET_MIGRATION_OR_INGRESS_BOUNDARY_INVALID');
  }
  const same=candidate();same.services.at(-1).databaseRuntimePrincipal='general_database_runtime';
  block(workloadIsolationGate(same),'OWNER_WORKLOAD_AND_DATABASE_IDENTITY_NOT_ISOLATED');
  const missing=candidate();delete missing.evidence.ownerRouteIsolationProbe;
  block(workloadIsolationGate(missing),'OWNER_RUNTIME_ISOLATION_EVIDENCE_MISSING');
});

test('TENANT_AUTHZ verified-only scope comparison rejects replay across enterprise, installation, context, actor',()=>{
  block(tenantAuthorizationGate(real),'TENANT_AND_CONTEXT_DENIALS_REQUIRED');
  assert.equal(tenantAuthorizationGate(candidate()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const binding={installationId:'install_01',issuer:'host_issuer',
    hostEnterpriseId:'host_enterprise',contextId:'ctx_01',
    evoEnterpriseId:'evo_enterprise'};
  const session={hostEnterpriseId:binding.hostEnterpriseId,contextId:binding.contextId,
    evoEnterpriseId:binding.evoEnterpriseId,actorSubjectId:'actor_01',actorType:'HUMAN'};
  const claims={...binding,iss:binding.issuer,actorSubjectId:session.actorSubjectId,
    actorType:session.actorType,purpose:'TR01B2D3_FINANCE_READONLY',
    aud:'evo:trading-finance-owner:read-only:v0.1.0',correlationId:'req_001'};
  assert.equal(matchVerifiedDelegationScope(binding,session,claims),true);
  for(const key of ['hostEnterpriseId','contextId','evoEnterpriseId']){
    const other=deep(claims);other[key]='other_enterprise';
    assert.equal(matchVerifiedDelegationScope(binding,session,other),false,key);
  }
  for(const [key,value]of [['installationId','install_other'],['iss','other_issuer'],
    ['actorSubjectId','actor_intruder'],['actorType','AI'],
    ['aud','foreign-audience'],['purpose','FINANCE_EXECUTE']]){
    const other=deep(claims);other[key]=value;
    assert.equal(matchVerifiedDelegationScope(binding,session,other),false,key);
  }
  const spoof=candidate();spoof.tenantAuth.actorDerivedFromManagedSession=false;
  block(tenantAuthorizationGate(spoof),'RESOURCE_LEVEL_TENANT_AUTHORIZATION_REQUIRED');
  const unknown=candidate();delete unknown.evidence.liveCrossTenantNegativeCases;
  block(tenantAuthorizationGate(unknown),'LIVE_CROSS_TENANT_WITNESSES_MISSING');
});

test('BUILD_PROVENANCE requires exact artifact digest, SBOM, dual-commit pin and independent attestation witnesses',()=>{
  block(buildProvenanceGate(real),'ARTIFACT_DIGEST_PROVENANCE_OR_DUAL_SOURCE_PIN_MISMATCH');
  const ok=candidate();
  assert.equal(provenanceShapeMatchesRelease(ok.supplyChain,ok.release),true);
  assert.equal(buildProvenanceGate(ok).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const mismatch=candidate();mismatch.supplyChain.evoSourceCommit='f'.repeat(40);
  block(buildProvenanceGate(mismatch),'ARTIFACT_DIGEST_PROVENANCE_OR_DUAL_SOURCE_PIN_MISMATCH');
  const wrongDigest=candidate();wrongDigest.supplyChain.subjectDigest='sha256:'+'e'.repeat(64);
  block(buildProvenanceGate(wrongDigest),'ARTIFACT_DIGEST_PROVENANCE_OR_DUAL_SOURCE_PIN_MISMATCH');
  const mutable=candidate();mutable.supplyChain.runtimeImageNotBuiltFromMutableTag=false;
  block(buildProvenanceGate(mutable),'DEPENDENCY_BUILD_AND_RELEASE_ISOLATION_MISSING');
  const unverified=candidate();unverified.supplyChain.signatureVerifiedOutOfBand=false;
  block(buildProvenanceGate(unverified),'INDEPENDENT_ATTESTATION_VERIFICATION_NOT_CLAIMED');
  const missing=candidate();delete missing.evidence.externalSignatureVerification;
  block(buildProvenanceGate(missing),'INDEPENDENT_SUPPLY_CHAIN_PROOF_MISSING');
});

test('AUDIT_PRIVACY allowlist projection cannot copy private keys, access tokens, caller-provided payload or unknown fields',()=>{
  block(auditPrivacyGate(real),'INDEPENDENT_STRUCTURED_AUDIT_REQUIRED');
  assert.equal(auditPrivacyGate(candidate()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const raw={eventCode:'NONCE_REPLAY_DENIED',disposition:'DENIED',
    actorType:'HUMAN',correlationId:'req_001',installationId:'install_01',
    observedAt:'2026-10-11T11:00:00Z',
    assertion:'eyJhbGciOiJFZERTQSJ9.eyJzb3VyY2UiOiJzZWNyZXQifQ.signature',
    databaseUrl:'postgresql://unsafe:secret@internal/finance',
    accessToken:'secret-token',privateKeyPem:'-----BEGIN PRIVATE KEY-----',
    intent:{customer:{sensitive:'not-for-logs'}}};
  const projected=projectFinanceSecurityAuditEvent(raw);
  const serialized=JSON.stringify(projected);
  for(const leaked of ['privateKeyPem','databaseUrl','secret-token','sensitive','assertion','customer']){
    assert.equal(serialized.includes(leaked),false,leaked);
  }
  assert.deepEqual(Object.keys(projected).sort(),
    ['eventCode','disposition','actorType','correlationId','installationId','observedAt','executionAllowed'].sort());
  assert.equal(projected.executionAllowed,false);
  assert.throws(()=>projectFinanceSecurityAuditEvent({...raw,eventCode:'ARBITRARY_DEBUG'}));
  assert.throws(()=>projectFinanceSecurityAuditEvent({...raw,correlationId:'Bearer unsafe tokens'}));
  const verbose=candidate();verbose.audit.rawAssertionsLogged=true;
  block(auditPrivacyGate(verbose),'SENSITIVE_AUTH_AND_DATABASE_LOGGING_FORBIDDEN');
  const stale=candidate();stale.audit.retentionDays=0;
  block(auditPrivacyGate(stale),'AUDIT_RETENTION_ACCESS_AND_TAMPER_CONTROLS_MISSING');
  const noWitness=candidate();delete noWitness.evidence.auditImmutabilityAndReadAccess;
  block(auditPrivacyGate(noWitness),'AUDIT_PRIVACY_WITNESSES_MISSING');
});

test('BACKUP_RECOVERY missing independent restore must block; nonce/revoked key must remain protected',()=>{
  block(backupRecoveryGate(real),'INDEPENDENT_ENCRYPTED_POINT_IN_TIME_BACKUP_REQUIRED');
  assert.equal(backupRecoveryGate(candidate()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const noPitr=candidate();noPitr.recovery.pitrEnabled=false;
  block(backupRecoveryGate(noPitr),'INDEPENDENT_ENCRYPTED_POINT_IN_TIME_BACKUP_REQUIRED');
  const overshoot=candidate();overshoot.recovery.observedRpoSeconds=4000;
  block(backupRecoveryGate(overshoot),'RPO_RTO_DRILL_EVIDENCE_INSUFFICIENT');
  const tooSlow=candidate();tooSlow.recovery.observedRtoSeconds=7201;
  block(backupRecoveryGate(tooSlow),'RPO_RTO_DRILL_EVIDENCE_INSUFFICIENT');
  const revoked=candidate();revoked.recovery.restoreCannotReenableRevokedTrust=false;
  block(backupRecoveryGate(revoked),'RESTORE_NONCE_TRUST_AND_READONLY_FENCE_REQUIRED');
  const writes=candidate();writes.recovery.financeWritesRemainDisabled=false;
  block(backupRecoveryGate(writes),'RESTORE_NONCE_TRUST_AND_READONLY_FENCE_REQUIRED');
  const missing=candidate();delete missing.evidence.postRestoreRevocationNegativeCase;
  block(backupRecoveryGate(missing),'INDEPENDENT_RECOVERY_WITNESSES_MISSING');
});

test('INCIDENT_OBSERVABILITY missing paging, TLS expiry, revoke alerts or containment fails closed',()=>{
  block(incidentObservabilityGate(real),'ONCALL_AND_IR_READINESS_MISSING');
  assert.equal(incidentObservabilityGate(candidate()).candidateStatus,'CANDIDATE_CONTROLS_PRESENT');
  const off=candidate();off.incident.onCallAcknowledgementTested=false;
  block(incidentObservabilityGate(off),'ONCALL_AND_IR_READINESS_MISSING');
  for(const key of ['replaySpikeAlert','ownerAuthorizationFailureAlert',
    'tlsExpiryAlert','dbNonceAuthorityUnavailableAlert','keyRevokeAuditLagAlert']){
    const bad=candidate();bad.incident[key]=false;
    block(incidentObservabilityGate(bad),'REQUIRED_FINANCE_SECURITY_ALERTS_MISSING');
  }
  const write=candidate();write.incident.doNotAutoEnableFinanceWrites=false;
  block(incidentObservabilityGate(write),'INCIDENT_CONTAINMENT_MUST_FAIL_CLOSED');
  const noDrill=candidate();delete noDrill.evidence.readOnlyIncidentTabletop;
  block(incidentObservabilityGate(noDrill),'INCIDENT_DRILL_AND_PAGING_WITNESSES_MISSING');
});

test('TWELVE_LANE_AGGREGATE real Railway snapshot BLOCKED across all twelve; evidence declarations never certify production',()=>{
  const result=evaluateTwelveLaneInventory(real);
  assert.equal(TWELVE_LANES.length,12);
  assert.equal(ADDITIONAL_LANES.length,6);
  assert.equal(Object.keys(result.lanes).length,12);
  for(const key of TWELVE_LANES)assert.equal(result.lanes[key].candidateStatus,'BLOCKED',key);
  assert.equal(result.status,'BLOCKED');
  assert.equal(result.productionCertification,'NOT_CERTIFIED');
  assert.equal(result.deploymentAuthorized,false);
  assert.equal(result.executionAllowed,false);
  const partial=evaluateTwelveLaneInventory(candidate());
  for(const key of ADDITIONAL_LANES)
    assert.equal(partial.lanes[key].candidateStatus,'CANDIDATE_CONTROLS_PRESENT',key);
  assert.equal(partial.status,'BLOCKED','prior six remain blocked without real operational evidence');
  assert.equal(partial.deploymentAuthorized,false);
  assert.equal(evaluateTwelveLaneInventory(null).status,'BLOCKED');
});
