import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runSimulatedScenario} from '../../demos/tr01b2d3-isolated-stage/static-demo.mjs';

test('B2D3 synthetic WebCrypto static demo: real Ed25519 verify, finance writes always disabled',async()=>{
  const answer=await runSimulatedScenario('verified');
  assert.equal(answer.final.status,'VERIFIED_READONLY');
  assert.equal(answer.final.code,'OWNER_FACTS_VERIFIED_NO_EXECUTION');
  assert.equal(answer.final.assertionVerified,true);
  assert.equal(answer.final.readOnlyFacts.classification,'SYNTHETIC_FIXTURE');
  assert.equal(answer.final.executionAllowed,false);
  assert.equal(answer.final.financeWrites,0);
  assert.equal(answer.final.productionCertification,'NOT_CERTIFIED');
  assert.equal(answer.final.executionEnvironment,'BROWSER_ONLY_NOT_PRODUCTION');
});

test('B2D3 static demo rejects actual Ed25519 tamper, valid-signature cross-tenant, revoked and outage',async()=>{
  const expectations=[
    ['replay','NONCE_REPLAY'],['revoked','SIGNING_KEY_REVOKED'],
    ['cross_tenant','ENTERPRISE_SCOPE_MISMATCH'],
    ['tampered','INVALID_SIGNATURE'],['db_down','NONCE_AUTHORITY_UNAVAILABLE']
  ];
  for(const [scenario,code] of expectations){
    const {first,final,testOutcome}=await runSimulatedScenario(scenario);
    assert.equal(final.status,'DENIED',scenario);
    assert.equal(final.code,code,scenario);
    assert.equal(final.executionAllowed,false,scenario);
    assert.equal(final.productionCertification,'NOT_CERTIFIED',scenario);
    assert.equal(testOutcome,'BROWSER_NEGATIVE_CONTROL_PASS',scenario);
    if(scenario==='replay')assert.equal(first.status,'VERIFIED_READONLY');
  }
  await assert.rejects(runSimulatedScenario('finance_write'),/UNKNOWN_SCENARIO/);
});

test('B2D3 static page cannot pretend to have live server Owner, database, real identities or production approval',()=>{
  const text=readFileSync(new URL('../../demos/tr01b2d3-isolated-stage/index.html',import.meta.url),'utf8');
  assert.match(text,/BROWSER SIMULATION/);
  assert.match(text,/NOT_CERTIFIED/);
  assert.match(text,/浏览器/);
  assert.match(text,/static-demo\.mjs/);
  assert.doesNotMatch(text,/fetch\('\/api\/demo\/run'/);
  assert.doesNotMatch(text,/生产认证 CERTIFIED/);
  assert.doesNotMatch(text,/真实财务执行已开启/);
});
