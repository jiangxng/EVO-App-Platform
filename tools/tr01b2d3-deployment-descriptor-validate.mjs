#!/usr/bin/env node
/**
 * B2D3 deployment DESCRIPTOR check, not a live environment attestation.
 * Never reads or prints secrets; deliberately cannot produce production PASS.
 * Operator must compare this redacted descriptor with actual resources.
 */
import { readFileSync, lstatSync } from 'node:fs';

const EXPECTED = Object.freeze({
  schemaVersion: '0.1.0',
  assurance: 'CANDIDATE_ONLY',
  'owner.entrypoint': 'node dist/apps/api/src/finance-owner-readonly-main.js',
  'owner.isolatedReadOnly': true,
  'owner.trustAuthority': 'POSTGRES',
  'owner.staticTrustFallback': false,
  'owner.generalApiMounted': false,
  'owner.financeWritesEnabled': false,
  'owner.dedicatedWorkloadIdentity': true,
  'owner.explicitListen': true,
  'database.independentRuntimeLogin': true,
  'database.independentOperatorLogin': true,
  'database.noMigrationCredentialInOwner': true,
  'database.primaryNonceAuthority': true,
  'database.runtimeDbTlsVerified': true,
  'database.operatorCredentialInOwner': false,
  'database.runtimeCanWriteCostOrAllocation': false,
  'network.privateOwnerIngress': true,
  'network.publicOwnerIngress': false,
  'network.hostToOwnerHttps': true,
  'network.ownerTlsHostnameVerified': true,
  'network.ownerPeerIdentityVerified': true,
  'network.untrustedProxyIdentityAccepted': false,
  'network.onlyHostWorkloadAllowed': true,
  'identity.realExternalOidcConfigured': true,
  'identity.managedSessionRequired': true,
  'identity.staticSessionFallback': false,
  'identity.serverDerivedPrincipalAndEnterprise': true,
  'identity.expiredOrRevokedSessionDenied': true,
  'signing.hostSecretProvider': true,
  'signing.ownerHasSigningPrivateKey': false,
  'signing.keyPointerFailClosed': true,
  'signing.rotationAuditEnabled': true,
  'signing.revocationWithoutRestart': true,
  'operations.ownerResponseExecutionAllowed': false,
  'operations.b2d4WriteAdmissionEnabled': false,
  'operations.unreachableDependencyFailsClosed': true,
  'operations.secretRedactedObservability': true,
  'operations.rollbackRevokesActiveSigningKey': true
});

export const FINANCE_OWNER_DEPLOYMENT_INVARIANTS = EXPECTED;
const pathValue = (obj, path) => path.split('.').reduce(
  (value, key) => value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value[key] : undefined, obj);
const safeId = text => typeof text === 'string' &&
  /^[A-Za-z][A-Za-z0-9_-]{2,100}$/u.test(text);
const host = text => typeof text === 'string' &&
  /^[a-z0-9][a-z0-9.-]{2,200}$/u.test(text) &&
  !text.endsWith('.') && !text.includes('..');
const hexDigest = text => typeof text === 'string' && /^sha256:[a-f0-9]{64}$/u.test(text);

function embeddedCredentials(obj) {
  // Reject actual secrets, SQL DSNs and inline PEMs. This is a redacted
  // deployment descriptor, not a secret environment or a trusted manifest.
  if (Array.isArray(obj)) return obj.some(embeddedCredentials);
  if (obj && typeof obj === 'object') return Object.entries(obj).some(
    ([key, value]) =>
      /^(?:password|token|privateKey|privateKeyPem|clientSecret|databaseUrl|dsn|authorization)$/iu.test(key) ||
      embeddedCredentials(value)
  );
  return typeof obj === 'string' &&
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:postgres(?:ql)?:\/\/)|\bBearer [A-Za-z0-9._-]{8,}/iu.test(obj);
}

export function evaluateFinanceOwnerDeploymentDescriptor(input) {
  const failures = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    failures.push('DESCRIPTOR_REQUIRED');
  } else {
    for (const [path, wanted] of Object.entries(EXPECTED)) {
      if (pathValue(input, path) !== wanted) failures.push('REQUIRE_' + path.replaceAll('.', '_'));
    }
    if (!['staging','production'].includes(input.environment)) {
      failures.push('KNOWN_ENVIRONMENT_REQUIRED');
    }
    if (!safeId(pathValue(input, 'owner.serviceIdentity'))) {
      failures.push('OWNER_WORKLOAD_ID_REQUIRED');
    }
    if (!safeId(pathValue(input, 'database.runtimePrincipal')) ||
        !safeId(pathValue(input, 'database.operatorPrincipal')) ||
        pathValue(input, 'database.runtimePrincipal') ===
          pathValue(input, 'database.operatorPrincipal')) {
      failures.push('SEPARATE_DATABASE_ROLE_IDENTITIES_REQUIRED');
    }
    if (!hexDigest(pathValue(input, 'owner.imageDigest'))) {
      failures.push('IMMUTABLE_IMAGE_DIGEST_REQUIRED');
    }
    const serviceHost = pathValue(input, 'network.ownerPrivateHostname');
    if (!host(serviceHost) ||
      (input.environment === 'production' &&
      (serviceHost.endsWith('.example') || serviceHost.endsWith('.invalid') ||
        serviceHost.endsWith('.localhost') || serviceHost === 'localhost'))) {
      failures.push('PRIVATE_OWNER_HOSTNAME_REQUIRED');
    }
    const issuer = pathValue(input,'identity.oidcIssuer');
    if (typeof issuer !== 'string' || !issuer.startsWith('https://') ||
      (input.environment === 'production' &&
        (issuer.includes('.example') || issuer.includes('.invalid') || issuer.includes('localhost')))) {
      failures.push('REAL_HTTPS_IDP_ISSUER_REQUIRED');
    }
    if (!safeId(pathValue(input,'identity.oidcClientRegistration'))) {
      failures.push('OIDC_CLIENT_REGISTRATION_REFERENCE_REQUIRED');
    }
    if (embeddedCredentials(input)) failures.push('INLINE_SECRET_OR_DATABASE_URL_FORBIDDEN');
  }
  return {
    candidateStatus: failures.length ? 'FAIL_CLOSED' : 'CANDIDATE_CONFIGURATION_PASS',
    failedChecks: failures,
    productionCertification: 'NOT_CERTIFIED',
    operatorEvidence: 'REQUIRED_FROM_REAL_DEPLOYMENT',
    executionAllowed: false
  };
}

if (process.argv[1]?.endsWith('/tr01b2d3-deployment-descriptor-validate.mjs')) {
  try {
    const filename = process.argv[2];
    if (!filename || process.argv.length !== 3) throw Error('FILE_REQUIRED');
    const fs = lstatSync(filename);
    if (!fs.isFile() || fs.isSymbolicLink() || fs.size > 128 * 1024) {
      throw Error('INVALID_DESCRIPTOR_FILE');
    }
    const descriptor = JSON.parse(readFileSync(filename,'utf8'));
    const result = evaluateFinanceOwnerDeploymentDescriptor(descriptor);
    console.log('TR01B2D3_DEPLOYMENT_DESCRIPTOR_CHECK='+JSON.stringify(result));
    if (result.candidateStatus !== 'CANDIDATE_CONFIGURATION_PASS') process.exitCode=1;
  } catch {
    console.log('TR01B2D3_DEPLOYMENT_DESCRIPTOR_CHECK='+JSON.stringify({
      candidateStatus:'FAIL_CLOSED',failedChecks:['DESCRIPTOR_UNREADABLE_OR_INVALID'],
      productionCertification:'NOT_CERTIFIED',executionAllowed:false
    }));
    process.exitCode=1;
  }
}
