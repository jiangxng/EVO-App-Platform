import test from 'node:test';
import assert from 'node:assert/strict';
import {createContextMemoryScheduleDriverV010,createContextMemorySchedulerV010,createMemoryContextMemorySchedulerLeaseV010} from '../../dist/manager/context-memory-scheduler.js';
function timers(t){let callback,created=0,cleared=0;t.mock.method(globalThis,'setInterval',fn=>{callback=fn;created++;return {unref(){}};});t.mock.method(globalThis,'clearInterval',()=>{cleared++;});return {fire:()=>callback(),counts:()=>({created,cleared})};}
test('empty configured driver has zero timers; arrival wakes once; removal stops; reactivation restores',async t=>{
 const clock=timers(t);let work=false,ticks=0;const errors=[];
 const d=createContextMemoryScheduleDriverV010({intervalMs:60000,hasWork:()=>work,tick:async()=>{ticks++;},onError:e=>errors.push(e)});
 d.refresh();assert.deepEqual(clock.counts(),{created:0,cleared:0});
 work=true;d.refresh();d.refresh();assert.deepEqual(clock.counts(),{created:1,cleared:0});clock.fire();assert.equal(ticks,1);
 work=false;d.refresh();assert.equal(d.isScheduled(),false);clock.fire();assert.equal(ticks,1);
 work=true;d.refresh();assert.equal(clock.counts().created,2);d.dispose();d.refresh();assert.equal(d.isScheduled(),false);assert.deepEqual(errors,[]);
});
test('eligibility is rechecked before a queued tick; failed resolution stops without breaking the mutation',t=>{
 const clock=timers(t);let state='work',ticks=0;const errors=[];
 const d=createContextMemoryScheduleDriverV010({intervalMs:60000,hasWork:()=>{if(state==='error')throw Error('binding unavailable');return state==='work';},tick:async()=>{ticks++;},onError:e=>errors.push(e.message)});
 d.refresh();state='idle';clock.fire();assert.equal(ticks,0);assert.equal(d.isScheduled(),false);
 state='error';assert.doesNotThrow(()=>d.refresh());assert.deepEqual(errors,['binding unavailable']);state='work';d.refresh();assert.equal(d.isScheduled(),true);d.dispose();
});
test('disabled schedule never evaluates providers or allocates a timer',t=>{
 const clock=timers(t);const d=createContextMemoryScheduleDriverV010({intervalMs:0,hasWork:()=>{throw Error('must not resolve');},tick:async()=>{},onError:e=>{throw e;}});d.refresh();assert.equal(clock.counts().created,0);d.dispose();
 assert.throws(()=>createContextMemoryScheduleDriverV010({intervalMs:1}),/INTERVAL_INVALID/);
});
test('source disable during an intake page drains its evidence but prevents next Context; restore permits later tick',async()=>{
 let enabled=true,release;const page=new Promise(r=>{release=r;});let calls=0;const logs=[];
 const scheduler=createContextMemorySchedulerV010({lease:createMemoryContextMemorySchedulerLeaseV010(),operationLog:{append:e=>logs.push(e)},operations:{runRetention(){},async runDlp(){}},listGovernanceContexts:()=>[],listIntakeContexts:()=>['a','b'].map(contextId=>({kind:'PERSONAL',contextId})),canRunSourceIntake:()=>enabled,async runSourceIntake(){calls++;await page;return {examined:1,changed:0,skipped:1};}});
 const first=scheduler.tick();enabled=false;release();await first;assert.equal(calls,1);assert.equal(logs.length,1);assert.equal(logs[0].state,'SUCCEEDED');
 enabled=true;await scheduler.tick();assert.equal(calls,3);await scheduler.stop();
});
