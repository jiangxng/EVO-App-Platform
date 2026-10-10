#!/usr/bin/env node
/**
 * TR01B2D3: production PRE-ADMISSION, not deployment or execution permission.
 * Composes existing six checks with six new *independent* safeguards.
 * Self-reported evidence references are only structural candidate input.
 */
import { readFileSync, lstatSync } from 'node:fs';
import { LANES as PREVIOUS_LANES, evaluateSixLaneInventory }
  from './tr01b2d3-six-lane-admission.mjs';

export const ADDITIONAL_LANES=Object.freeze([
  'WORKLOAD_ISOLATION','TENANT_AUTHZ','BUILD_PROVENANCE',
  'AUDIT_PRIVACY','BACKUP_RECOVERY','INCIDENT_OBSERVABILITY'
]);
export const TWELVE_LANES=Object.freeze([...PREVIOUS_LANES,...ADDITIONAL_LANES]);
const validId=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9._:-]{2,127}$/u.test(x);
const sha=x=>typeof x==='string'&&/^sha256:[a-f0-9]{64}$/u.test(x);
const commit=x=>typeof x==='string'&&/^[a-f0-9]{40}$/u.test(x);
const ref=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  /^[a-f0-9]{64}$/u.test(x.sha256??'')&&validId(x.reviewedBy)&&
  typeof x.observedAt==='string'&&!Number.isNaN(Date.parse(x.observedAt))&&
  x.observedAt.endsWith('Z');
const owner=o=>Array.isArray(o?.services)?
  o.services.find(s=>s?.purpose==='FINANCE_OWNER_READONLY'):undefined;
const host=o=>Array.isArray(o?.services)?
  o.services.find(s=>s?.purpose==='APP_PLATFORM_HOST'):undefined;
const general=o=>Array.isArray(o?.services)?
  o.services.find(s=>s?.purpose==='EVO_GENERAL_RUNTIME'):undefined;
const evidence=(o,key)=>ref(o?.evidence?.[key]);
function denied(f){
  return {candidateStatus:f.length?'BLOCKED':'CANDIDATE_CONTROLS_PRESENT',
    reasons:f,productionCertification:'NOT_CERTIFIED',
    deploymentAuthorized:false,executionAllowed:false};
}
function requireTest(f,condition,reason){if(!condition)f.push(reason)}
function onlyPurpose(s,purpose){return s?.purpose===purpose}

export function workloadIsolationGate(o){
  const f=[],s=owner(o),h=host(o),g=general(o);
  requireTest(f,!!s&&!!h&&!!g,'SEPARATE_HOST_OWNER_EVO_SERVICES_MISSING');
  requireTest(f,s?.entrypoint==='node dist/apps/api/src/finance-owner-readonly-main.js'&&
    s?.isolatedReadOnly===true&&s?.commandRoutesEnabled===false&&
    s?.businessMutationRoutesEnabled===false,
    'OWNER_ENTRYPOINT_OR_READONLY_SURFACE_INVALID');
  requireTest(f,Array.isArray(s?.publicDomains)&&s.publicDomains.length===0&&
    s?.privateHostname!==g?.privateHostname&&s?.privateHostname!==h?.privateHostname,
    'OWNER_MUST_BE_PRIVATE_AND_SEPARATE');
  requireTest(f,validId(s?.workloadIdentity)&&
    s?.workloadIdentity!==h?.workloadIdentity&&s?.workloadIdentity!==g?.workloadIdentity&&
    validId(s?.databaseRuntimePrincipal)&&
    s?.databaseRuntimePrincipal!==g?.databaseRuntimePrincipal&&
    s?.databaseRuntimePrincipal!==o?.migration?.separateMigrationPrincipal,
    'OWNER_WORKLOAD_AND_DATABASE_IDENTITY_NOT_ISOLATED');
  requireTest(f,s?.mountedHostSecrets===false&&
    s?.migrationPermission===false&&
    s?.canCreateDatabaseRoles===false&&s?.networkIngressHostOnly===true,
    'OWNER_SECRET_MIGRATION_OR_INGRESS_BOUNDARY_INVALID');
  requireTest(f,evidence(o,'ownerRouteIsolationProbe')&&
    evidence(o,'ownerRuntimeOsIdentity')&&evidence(o,'ownerDbRoleIsolation'),
    'OWNER_RUNTIME_ISOLATION_EVIDENCE_MISSING');
  return denied(f);
}

/** Diagnostic-only comparison of already verified identities; does NOT
 * authenticate a JWT and MUST NOT substitute for Host/Owner authentication.
 */
export function matchVerifiedDelegationScope(binding,session,claims){
  if(!binding||!session||!claims)return false;
  const keys=['hostEnterpriseId','contextId','evoEnterpriseId'];
  if(!keys.every(k=>validId(binding[k])&&binding[k]===session[k]&&
    binding[k]===claims[k]))return false;
  if(!validId(binding.installationId)||binding.installationId!==claims.installationId||
    !validId(binding.issuer)||binding.issuer!==claims.iss||
    !validId(session.actorSubjectId)||session.actorSubjectId!==claims.actorSubjectId||
    !['HUMAN','AI'].includes(session.actorType)||
    session.actorType!==claims.actorType)return false;
  if(claims.purpose!=='TR01B2D3_FINANCE_READONLY'||
    claims.aud!=='evo:trading-finance-owner:read-only:v0.1.0'||
    !validId(claims.correlationId))return false;
  return true;
}
export function tenantAuthorizationGate(o){
  const f=[],t=o?.tenantAuth;
  requireTest(f,t?.denyCrossHostEnterprise===true&&
    t?.denyCrossEvoEnterprise===true&&t?.denyWrongContext===true&&
    t?.denyActorSpoofing===true,'TENANT_AND_CONTEXT_DENIALS_REQUIRED');
  requireTest(f,t?.actorDerivedFromManagedSession===true&&
    t?.allResourcesAuthorizedSeparately===true&&
    t?.conditionalObligationsFailClosed===true&&
    t?.ownerRevalidatesFactScope===true,
    'RESOURCE_LEVEL_TENANT_AUTHORIZATION_REQUIRED');
  requireTest(f,t?.untrustedClientEnterpriseIgnored===true&&
    t?.readonlyResponseExecutionAllowed===false,
    'TENANT_INPUT_OR_FINANCE_WRITE_FENCE_INVALID');
  requireTest(f,evidence(o,'liveCrossTenantNegativeCases')&&
    evidence(o,'authorizationProviderConfiguration'),
    'LIVE_CROSS_TENANT_WITNESSES_MISSING');
  return denied(f);
}

/** Pure consistency check of declared SLSA/in-toto fields.
 * The actual cryptographic verification MUST occur in an independent
 * release pipeline; JSON-provided verification claims are not trusted.
 */
export function provenanceShapeMatchesRelease(provenance,release){
  if(!provenance||!release)return false;
  return provenance.predicateType==='https://slsa.dev/provenance/v1'&&
    sha(provenance.subjectDigest)&&provenance.subjectDigest===release.imageDigest&&
    commit(provenance.appSourceCommit)&&
    provenance.appSourceCommit===release.appCommit&&
    commit(provenance.evoSourceCommit)&&
    provenance.evoSourceCommit===release.evoCommit&&
    typeof provenance.builderId==='string'&&
    provenance.builderId.startsWith('https://')&&
    sha(provenance.sbomDigest);
}
export function buildProvenanceGate(o){
  const f=[],p=o?.supplyChain,r=o?.release;
  requireTest(f,provenanceShapeMatchesRelease(p,r),
    'ARTIFACT_DIGEST_PROVENANCE_OR_DUAL_SOURCE_PIN_MISMATCH');
  requireTest(f,p?.dependencyReviewCompleted===true&&
    p?.reproducibleLockfiles===true&&
    p?.untrustedPrCannotAccessReleaseSecrets===true&&
    p?.runtimeImageNotBuiltFromMutableTag===true,
    'DEPENDENCY_BUILD_AND_RELEASE_ISOLATION_MISSING');
  requireTest(f,p?.signatureVerifiedOutOfBand===true&&
    p?.builderIdentityAllowlisted===true&&
    p?.provenanceSubjectWasChecked===true,
    'INDEPENDENT_ATTESTATION_VERIFICATION_NOT_CLAIMED');
  requireTest(f,evidence(o,'externalSignatureVerification')&&
    evidence(o,'sbomAndVulnerabilityReview')&&
    evidence(o,'immutableArtifactRegistryDigest'),
    'INDEPENDENT_SUPPLY_CHAIN_PROOF_MISSING');
  return denied(f);
}

/** Allowlist-only audit event projection for unit-tested diagnostics.
 * DO NOT send raw assertions, token, key material, DB URLs or intents.
 * This helper does not replace a production audit sink or access control.
 */
export function projectFinanceSecurityAuditEvent(event){
  const codes=new Set(['OWNER_REQUEST_DENIED','NONCE_REPLAY_DENIED',
    'OWNER_KEY_REVOKED','OWNER_TLS_FAILED','OWNER_DB_UNAVAILABLE',
    'OWNER_READONLY_VERIFIED']);
  if(!event||!codes.has(event.eventCode)||
    !['DENIED','VERIFIED_READONLY'].includes(event.disposition)||
    !['HUMAN','AI','SERVICE'].includes(event.actorType)||
    !validId(event.correlationId)||!validId(event.installationId)||
    typeof event.observedAt!=='string'||Number.isNaN(Date.parse(event.observedAt))){
    throw new Error('TR01B2D3_AUDIT_EVENT_INVALID');
  }
  if(event.disposition==='VERIFIED_READONLY'&&
    event.eventCode!=='OWNER_READONLY_VERIFIED')throw new Error('TR01B2D3_AUDIT_DISPOSITION_MISMATCH');
  if(event.disposition==='DENIED'&&
    event.eventCode==='OWNER_READONLY_VERIFIED')throw new Error('TR01B2D3_AUDIT_DISPOSITION_MISMATCH');
  return Object.freeze({
    eventCode:event.eventCode,disposition:event.disposition,
    actorType:event.actorType,correlationId:event.correlationId,
    installationId:event.installationId,
    observedAt:new Date(event.observedAt).toISOString(),
    executionAllowed:false
  });
}
export function auditPrivacyGate(o){
  const f=[],a=o?.audit;
  requireTest(f,a?.structuredSecurityEvents===true&&
    a?.correlatesHostOwnerOperator===true&&
    a?.immutableAuditSink===true&&
    a?.auditReaderSeparatedFromOperator===true,
    'INDEPENDENT_STRUCTURED_AUDIT_REQUIRED');
  requireTest(f,a?.rawAssertionsLogged===false&&
    a?.tokenOrPrivateKeyLogged===false&&
    a?.databaseUrlLogged===false&&
    a?.unauditedVerboseErrors===false,
    'SENSITIVE_AUTH_AND_DATABASE_LOGGING_FORBIDDEN');
  requireTest(f,Number.isInteger(a?.retentionDays)&&
    a.retentionDays>0&&a.retentionDays<=3650&&
    a?.accessReviewsEnabled===true&&a?.tamperAlertEnabled===true,
    'AUDIT_RETENTION_ACCESS_AND_TAMPER_CONTROLS_MISSING');
  requireTest(f,evidence(o,'logRedactionFieldProof')&&
    evidence(o,'auditImmutabilityAndReadAccess'),
    'AUDIT_PRIVACY_WITNESSES_MISSING');
  return denied(f);
}
export function backupRecoveryGate(o){
  const f=[],b=o?.recovery;
  requireTest(f,b?.pitrEnabled===true&&
    b?.backupsEncrypted===true&&
    b?.offEnvironmentCopy===true&&
    b?.backupOperatorSeparateFromFinanceRuntime===true,
    'INDEPENDENT_ENCRYPTED_POINT_IN_TIME_BACKUP_REQUIRED');
  requireTest(f,Number.isInteger(b?.rpoTargetSeconds)&&b.rpoTargetSeconds>0&&
    Number.isInteger(b?.observedRpoSeconds)&&b.observedRpoSeconds>=0&&
    b.observedRpoSeconds<=b.rpoTargetSeconds&&
    Number.isInteger(b?.rtoTargetSeconds)&&b.rtoTargetSeconds>0&&
    Number.isInteger(b?.observedRtoSeconds)&&b.observedRtoSeconds>=0&&
    b.observedRtoSeconds<=b.rtoTargetSeconds,
    'RPO_RTO_DRILL_EVIDENCE_INSUFFICIENT');
  requireTest(f,b?.restoreIntoIsolatedTarget===true&&
    b?.nonceUniquenessCheckedAfterRestore===true&&
    b?.trustAuditConsistencyChecked===true&&
    b?.restoreCannotReenableRevokedTrust===true&&
    b?.financeWritesRemainDisabled===true,
    'RESTORE_NONCE_TRUST_AND_READONLY_FENCE_REQUIRED');
  requireTest(f,evidence(o,'actualIsolatedRestoreDrill')&&
    evidence(o,'postRestoreRevocationNegativeCase'),
    'INDEPENDENT_RECOVERY_WITNESSES_MISSING');
  return denied(f);
}
export function incidentObservabilityGate(o){
  const f=[],m=o?.incident;
  requireTest(f,validId(m?.onCallRoutingId)&&
    m?.namedIncidentCommander===true&&
    m?.onCallAcknowledgementTested===true&&
    m?.incidentTriageRunbookApproved===true,
    'ONCALL_AND_IR_READINESS_MISSING');
  requireTest(f,m?.replaySpikeAlert===true&&
    m?.ownerAuthorizationFailureAlert===true&&
    m?.tlsExpiryAlert===true&&
    m?.dbNonceAuthorityUnavailableAlert===true&&
    m?.keyRevokeAuditLagAlert===true,
    'REQUIRED_FINANCE_SECURITY_ALERTS_MISSING');
  requireTest(f,m?.denyNewDelegationOnOutage===true&&
    m?.hostDisableSwitchFailClosed===true&&
    m?.manualOperatorRevocationPlaybook===true&&
    m?.doNotAutoEnableFinanceWrites===true,
    'INCIDENT_CONTAINMENT_MUST_FAIL_CLOSED');
  requireTest(f,evidence(o,'syntheticPageReceipt')&&
    evidence(o,'readOnlyIncidentTabletop')&&
    evidence(o,'incidentRollbackEscalationReview'),
    'INCIDENT_DRILL_AND_PAGING_WITNESSES_MISSING');
  return denied(f);
}
export const ADDITIONAL_EVALUATORS=Object.freeze({
  WORKLOAD_ISOLATION:workloadIsolationGate,
  TENANT_AUTHZ:tenantAuthorizationGate,
  BUILD_PROVENANCE:buildProvenanceGate,
  AUDIT_PRIVACY:auditPrivacyGate,
  BACKUP_RECOVERY:backupRecoveryGate,
  INCIDENT_OBSERVABILITY:incidentObservabilityGate
});
export function evaluateTwelveLaneInventory(o){
  const old=evaluateSixLaneInventory(o);
  if(!o||!Array.isArray(o.services))return{
    status:'BLOCKED',lanes:old.lanes,failedChecks:['INVALID_INVENTORY'],
    productionCertification:'NOT_CERTIFIED',
    deploymentAuthorized:false,executionAllowed:false};
  const extra=Object.fromEntries(ADDITIONAL_LANES.map(k=>[k,ADDITIONAL_EVALUATORS[k](o)]));
  const lanes={...old.lanes,...extra};
  const failedChecks=[
    ...old.failedChecks,
    ...Object.entries(extra).flatMap(([k,v])=>v.reasons.map(reason=>k+':'+reason))
  ];
  return {status:failedChecks.length?'BLOCKED':'CANDIDATE_ONLY',
    lanes,failedChecks,productionCertification:'NOT_CERTIFIED',
    deploymentAuthorized:false,executionAllowed:false};
}
if(process.argv[1]?.endsWith('/tr01b2d3-twelve-lane-admission.mjs')){
  try{
    const file=process.argv[2];
    if(!file||process.argv.length!==3)throw Error('INPUT_FILE_REQUIRED');
    const s=lstatSync(file);
    if(!s.isFile()||s.isSymbolicLink()||s.size>128*1024)throw Error('INVALID_INPUT');
    const output=evaluateTwelveLaneInventory(JSON.parse(readFileSync(file,'utf8')));
    console.log('TR01B2D3_TWELVE_LANE_ADMISSION='+JSON.stringify(output));
    if(output.status==='BLOCKED')process.exitCode=2;
  }catch{
    console.log('TR01B2D3_TWELVE_LANE_ADMISSION='+JSON.stringify({
      status:'BLOCKED',failedChecks:['INVALID_OR_UNREADABLE_DESCRIPTOR'],
      productionCertification:'NOT_CERTIFIED',
      deploymentAuthorized:false,executionAllowed:false}));
    process.exitCode=2;
  }
}
