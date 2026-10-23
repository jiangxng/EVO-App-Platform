import test from 'node:test';
import assert from 'node:assert/strict';
import {createContextMemorySchedulerV010,createMemoryContextMemorySchedulerLeaseV010} from '../../dist/manager/context-memory-scheduler.js';
function fixture({phase='dlp',fail=false}={}) {
 let unblock;const blocked=new Promise(resolve=>{unblock=resolve;});
 const calls=[];const lease=createMemoryContextMemorySchedulerLeaseV010();
 const contexts=['a','b'].map(contextId=>({contractVersion:'0.1.0',kind:'PERSONAL',contextId}));
 const scheduler=createContextMemorySchedulerV010({
  lease,operationLog:{append(event){calls.push(event.state);}},
  listGovernanceContexts:()=>phase==='dlp'?contexts:[],listIntakeContexts:()=>contexts,
  operations:{runRetention(c){calls.push('retention:'+c.contextId);},async runDlp(c){calls.push('dlp:'+c.contextId);await blocked;if(fail)throw Error('DLP_FAILED');}},
  async runSourceIntake(c){calls.push('intake:'+c.contextId);await blocked;return {examined:1,changed:0,skipped:1};}
 });
 return {scheduler,lease,calls,unblock};
}
for(const phase of ['dlp','intake'])test('stop drains '+phase+' without admitting another context or releasing its lease early',async()=>{
 const f=fixture({phase});const run=f.scheduler.tick();let stopped=false;
 const stop=f.scheduler.stop().then(()=>{stopped=true;});await Promise.resolve();
 assert.equal(stopped,false);assert.equal(f.lease.acquire(new Date()),false);
 assert.equal((await f.scheduler.tick()).acquired,false);
 f.unblock();await run;await stop;
 assert.equal(f.calls.some(x=>x.endsWith(':b')),false);
 if(phase==='dlp')assert.equal(f.calls.some(x=>x.startsWith('intake:')),false);
 else assert.ok(f.calls.includes('SUCCEEDED'),'completed intake keeps operation evidence');
 assert.equal(f.lease.acquire(new Date()),true);f.lease.release();
 await f.scheduler.stop();assert.equal((await f.scheduler.tick()).acquired,false);
});
test('stop timeout retains the active lease and blocks new work; later drain can be awaited',async()=>{
 const f=fixture();const run=f.scheduler.tick();
 await assert.rejects(f.scheduler.stop(5),/SCHEDULER_STOP_TIMEOUT$/);
 assert.equal(f.lease.acquire(new Date()),false);assert.equal((await f.scheduler.tick()).acquired,false);
 f.unblock();await run;await f.scheduler.stop();assert.equal(f.lease.acquire(new Date()),true);f.lease.release();
});
test('failing in-flight operation releases only in finally and stop reports failure',async()=>{
 const f=fixture({fail:true});const run=f.scheduler.tick();const runFailure=assert.rejects(run,/DLP_FAILED/);
 const stopFailure=assert.rejects(f.scheduler.stop(),/DLP_FAILED/);f.unblock();await Promise.all([runFailure,stopFailure]);
 assert.equal(f.lease.acquire(new Date()),true);f.lease.release();assert.equal((await f.scheduler.tick()).acquired,false);
});
test('idle stop prevents lease acquisition; invalid deadline does not stop a live scheduler',async()=>{
 const f=fixture();await assert.rejects(f.scheduler.stop(-1),/TIMEOUT_INVALID/);
 f.unblock();assert.equal((await f.scheduler.tick()).acquired,true);
 await f.scheduler.stop();assert.equal((await f.scheduler.tick()).acquired,false);
});
