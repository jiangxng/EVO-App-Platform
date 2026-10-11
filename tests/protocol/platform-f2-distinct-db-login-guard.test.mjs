import test from 'node:test';
import assert from 'node:assert/strict';
import {validateF2DisposablePostgresTargetV010}
  from '../../tools/platform-f2-distinct-db-login-ci.mjs';

const fixture=()=>({
  NODE_ENV:'test',F2_DISPOSABLE_POSTGRES:'1',
  DATABASE_URL:'postgresql://postgres:ephemeral@127.0.0.1:5432/f2_ci_platform'
});

test('F2 independent LOGIN harness rejects production and accidental Railway DSNs before connecting',()=>{
  assert.equal(validateF2DisposablePostgresTargetV010(fixture()),null);
  const cases=[
    {NODE_ENV:'production'},
    {F2_DISPOSABLE_POSTGRES:'0'},
    {DATABASE_URL:'postgresql://postgres:x@db.railway.internal:5432/f2_ci_platform'},
    {DATABASE_URL:'postgresql://postgres:x@127.0.0.1:5432/evo_production'},
    {DATABASE_URL:'postgresql://owner:x@127.0.0.1:5432/f2_ci_platform'},
    {DATABASE_URL:'postgresql://postgres:x@127.0.0.1:5432/f2_ci_platform?sslmode=disable'},
    {DATABASE_URL:'invalid'}
  ];
  for(const item of cases)
    assert.notEqual(validateF2DisposablePostgresTargetV010({...fixture(),...item}),null,
      JSON.stringify(Object.keys(item)));
});

test('F2 harness cannot be mistaken for an economic Owner test',async()=>{
  const {readFileSync}=await import('node:fs');
  const body=readFileSync(new URL('../../tools/platform-f2-distinct-db-login-ci.mjs',
    import.meta.url),'utf8');
  assert.match(body,/productionCertification:'NOT_CERTIFIED'/);
  assert.match(body,/executionAllowed:false/);
  assert.match(body,/financeTablesTouched:false/);
  assert.doesNotMatch(body,/evo\/dist|cost_run\s*\(|allocation_instruction\s*\(|ledger_balance\s*\(/);
});
