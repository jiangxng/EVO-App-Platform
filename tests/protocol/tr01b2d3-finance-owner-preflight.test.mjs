import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPECTED_FLAGS,
  evaluateFinanceOwnerCatalog
} from '../../tools/tr01b2d3-finance-owner-catalog-preflight.mjs';

const valid = () => ({
  ...EXPECTED_FLAGS,
  session_login: 'isolated_finance_runtime',
  effective_login: 'isolated_finance_runtime',
  function_owner_superuser: false
});

test('B2D3 catalog preflight never claims production or finance write', () => {
  const result = evaluateFinanceOwnerCatalog(valid(), { strictOwner: true });
  assert.equal(result.automatedStatus, 'PASS');
  assert.equal(result.productionCertification, 'NOT_CERTIFIED');
  assert.equal(result.executionAllowed, false);
});

test('B2D3 privilege escalation and untrusted PUBLIC schema are rejected', () => {
  for (const id of [
    'key_select', 'key_update', 'nonce_installation_select',
    'nonce_update', 'schema_create', 'public_schema_create',
    'function_public_execute', 'cost_run_insert',
    'allocation_instruction_insert', 'function_owner_membership'
  ]) {
    const row = valid();
    row[id] = !row[id];
    const result = evaluateFinanceOwnerCatalog(row);
    assert.equal(result.automatedStatus, 'FAIL', id);
    assert.ok(result.failedChecks.includes(id), id);
  }
});

test('B2D3 actual session login and all catalog fields are required', () => {
  const mismatch = valid();
  mismatch.effective_login = 'elevated_role';
  assert.ok(evaluateFinanceOwnerCatalog(mismatch)
    .failedChecks.includes('DISTINCT_SESSION_LOGIN_REQUIRED'));
  assert.ok(evaluateFinanceOwnerCatalog({ ...valid(), function_execute: undefined })
    .failedChecks.includes('function_execute'));
  assert.equal(evaluateFinanceOwnerCatalog(null).automatedStatus, 'FAIL');
});

test('B2D3 SECURITY DEFINER superuser owner is never production-admissible', () => {
  const row = { ...valid(), function_owner_superuser: true };
  assert.equal(evaluateFinanceOwnerCatalog(row).automatedStatus, 'PASS');
  assert.equal(evaluateFinanceOwnerCatalog(row).ownerReview,
    'SUPERUSER_OWNER_PRODUCTION_BLOCKER');
  const strict = evaluateFinanceOwnerCatalog(row, { strictOwner: true });
  assert.equal(strict.automatedStatus, 'FAIL');
  assert.ok(strict.failedChecks.includes('SECURITY_DEFINER_OWNER_MUST_NOT_BE_SUPERUSER'));
  assert.equal(strict.executionAllowed, false);
});
