import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createFileContextMemorySchedulerLeaseV010 as lease, createContextMemorySchedulerV010 as scheduler} from '../../dist/manager/context-memory-scheduler.js';
const moduleUrl = new URL('../../dist/manager/context-memory-scheduler.js',import.meta.url).href;
function fixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'memory-file-lease-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  return join(dir,'claim.json');
}
function contender(path, time=1001) {
  const child=spawnSync(process.execPath,['--input-type=module','-e',`
    import {createFileContextMemorySchedulerLeaseV010 as lease} from ${JSON.stringify(moduleUrl)};
    try { console.log(JSON.stringify({acquired:lease(process.argv[1],'child',1000).acquire(new Date(Number(process.argv[2])))})); }
    catch(error) {console.log(JSON.stringify({error:error.message}));}
  `,path,String(time)],{encoding:'utf8',timeout:10000});
  assert.equal(child.status,0,child.stderr);
  return JSON.parse(child.stdout);
}
test('another process cannot take over a long DLP tick; late completion retains ownership until finally',async t=>{
  const path=fixture(t); let finish;
  const blocked=new Promise(resolve=>{finish=resolve;}); const calls=[];
  const owner=scheduler({lease:lease(path,'owner',1000),now:()=>new Date(0),
    listGovernanceContexts:()=>[{contractVersion:'0.1.0',kind:'PERSONAL',contextId:'a'}],
    operations:{runRetention(){calls.push('retention');},async runDlp(){await blocked;calls.push('dlp-finished');}},
    operationLog:{append(){}}
  });
  const run=owner.tick();
  const before=readFileSync(path,'utf8');
  try {
    assert.deepEqual(contender(path),{error:'CONTEXT_MEMORY_SCHEDULER_LEASE_OVERDUE'});
    assert.equal(readFileSync(path,'utf8'),before);
    await assert.rejects(owner.stop(1),/STOP_TIMEOUT/);
    assert.deepEqual(contender(path,2000),{error:'CONTEXT_MEMORY_SCHEDULER_LEASE_OVERDUE'});
  } finally {finish();await run;await owner.stop();}
  assert.deepEqual(calls,['retention','dlp-finished']); assert.equal(existsSync(path),false);
  assert.deepEqual(contender(path,3000),{acquired:true});
});
test('a dead owner is not silently replaced after TTL; recovery requires all writers stopped',t=>{
  const path=fixture(t);
  assert.deepEqual(contender(path,0),{acquired:true}); // Child exits without release.
  const original=readFileSync(path,'utf8');
  assert.deepEqual(contender(path,5000),{error:'CONTEXT_MEMORY_SCHEDULER_LEASE_OVERDUE'});
  assert.equal(readFileSync(path,'utf8'),original);
  // Only fixture processes existed and both have exited: explicit quiescent recovery.
  rmSync(path);
  assert.deepEqual(contender(path,5000),{acquired:true});
});
test('re-entrant acquire does not lose ownership; normal release allows reuse',t=>{
  const path=fixture(t),a=lease(path,'same-holder',1000),b=lease(path,'same-holder',1000);
  assert.equal(a.acquire(new Date(0)),true);
  assert.equal(a.acquire(new Date(5000)),false);
  assert.equal(b.acquire(new Date(1)),false);b.release();assert.ok(existsSync(path));
  a.release();assert.equal(existsSync(path),false);
  assert.equal(b.acquire(new Date(2)),true);b.release();
});
test('invalid, partial and expired legacy claims fail closed without changing bytes',t=>{
  const path=fixture(t);
  for(const raw of ['', '{', 'null', JSON.stringify({contractVersion:'0.1.0',holderId:'legacy',acquiredAt:new Date(0).toISOString(),expiresAt:new Date(1000).toISOString()})]) {
    writeFileSync(path,raw);
    assert.throws(()=>lease(path,'next',1000).acquire(new Date(2000)),/LEASE_(UNREADABLE|OVERDUE)/);
    assert.equal(readFileSync(path,'utf8'),raw);
  }
});
test('release cannot delete a replacement claim even with the same holder label',t=>{
  const path=fixture(t),a=lease(path,'same',1000);
  a.acquire(new Date(0));const replacement={...JSON.parse(readFileSync(path,'utf8')),acquisitionId:'different'};
  writeFileSync(path,JSON.stringify(replacement));a.release();
  assert.deepEqual(JSON.parse(readFileSync(path,'utf8')),replacement);
});
test('invalid time cannot create a persistent claim and filesystem failures are observable',t=>{
  const path=fixture(t),a=lease(path,'owner',1000);
  assert.throws(()=>a.acquire(new Date(NaN)),RangeError);assert.equal(existsSync(path),false);
  writeFileSync(path,'parent-is-file');
  assert.throws(()=>lease(join(path,'nested'),'owner',1000).acquire(new Date(0)));
});
