import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FINANCE_OWNER_DEPLOYMENT_INVARIANTS,
  evaluateFinanceOwnerDeploymentDescriptor
} from '../../tools/tr01b2d3-deployment-descriptor-validate.mjs';

const fixture = JSON.parse(readFileSync(
  new URL('../fixtures/tr01b2d3-deployment-descriptor-staging-candidate.json',
    import.meta.url),'utf8'));
const clone = () => structuredClone(fixture);
const set = (obj, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  let cursor = obj;
  for (const key of keys) cursor = cursor[key];
  cursor[last] = value;
};
test('B2D3 staging descriptor is only a static candidate, never actual deployment verification', () => {
  const result = evaluateFinanceOwnerDeploymentDescriptor(clone());
  assert.equal(result.candidateStatus, 'CANDIDATE_CONFIGURATION_PASS');
  assert.equal(result.failedChecks.length, 0);
  assert.equal(result.productionCertification, 'NOT_CERTIFIED');
  assert.equal(result.executionAllowed, false);
});

test('B2D3 all mandatory deployment guard properties are fail-closed', () => {
  for (const [path, expected] of Object.entries(FINANCE_OWNER_DEPLOYMENT_INVARIANTS)) {
    const changed = clone();
    set(changed,path, typeof expected === 'boolean' ? !expected : 'UNTRUSTED');
    const result = evaluateFinanceOwnerDeploymentDescriptor(changed);
    assert.equal(result.candidateStatus,'FAIL_CLOSED',path);
    assert.ok(result.failedChecks.includes('REQUIRE_'+path.replaceAll('.','_')),path);
    assert.equal(result.executionAllowed,false);
  }
});

test('B2D3 requires separate login identities, immutable image, real deployment names', () => {
  const shared = clone(); shared.database.operatorPrincipal=shared.database.runtimePrincipal;
  assert.ok(evaluateFinanceOwnerDeploymentDescriptor(shared)
    .failedChecks.includes('SEPARATE_DATABASE_ROLE_IDENTITIES_REQUIRED'));
  const wrongImage = clone(); wrongImage.owner.imageDigest='latest';
  assert.ok(evaluateFinanceOwnerDeploymentDescriptor(wrongImage)
    .failedChecks.includes('IMMUTABLE_IMAGE_DIGEST_REQUIRED'));
  const bogusProduction = clone(); bogusProduction.environment='production';
  assert.ok(evaluateFinanceOwnerDeploymentDescriptor(bogusProduction)
    .failedChecks.includes('REAL_HTTPS_IDP_ISSUER_REQUIRED'));
  assert.ok(evaluateFinanceOwnerDeploymentDescriptor(bogusProduction)
    .failedChecks.includes('PRIVATE_OWNER_HOSTNAME_REQUIRED'));
});

test('B2D3 never accepts credential values embedded in redacted descriptor', () => {
  for (const credential of [
    ['privateKeyPem','-----BEGIN PRIVATE KEY-----\nSECRET\n-----END PRIVATE KEY-----'],
    ['password','sensitive'],
    ['connection','postgresql://finance:password@localhost/finance'],
    ['operatorToken','Bearer eyJhbGciOiJFZERTQSJ9.test-token']
  ]) {
    const changed=clone();changed.unexpected={ [credential[0]]:credential[1]};
    const result=evaluateFinanceOwnerDeploymentDescriptor(changed);
    assert.equal(result.candidateStatus,'FAIL_CLOSED');
    assert.ok(result.failedChecks.includes('INLINE_SECRET_OR_DATABASE_URL_FORBIDDEN'));
  }
  const result=evaluateFinanceOwnerDeploymentDescriptor(null);
  assert.equal(result.candidateStatus,'FAIL_CLOSED');
  assert.equal(result.executionAllowed,false);
});
