import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {fork} from 'node:child_process';
const context={contractVersion:'0.1.0',kind:'PERSONAL',contextId:'personal:fixture'};
const memory={contractVersion:'0.1.0',memoryId:'fixture:memory',context,kind:'FACT',summary:'Synthetic retained fact',provenance:{contractVersion:'0.1.0',origin:'DIRECT',sourceContext:context,evidenceRefs:[]},attribution:{contractVersion:'0.1.0',recordedBySubjectId:'fixture',recordedByActorType:'HUMAN',recordedAt:'2026-10-01T00:00:00.000Z'}};
for(const seeded of [false,true])test(`real minimal Host ${seeded?'with retained Memory':'without Memory or source'} registers ${seeded?1:0} scheduler timer`,{timeout:45000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'memory-demand-host-'));let child,exited;
 try{
 if(seeded)await fs.writeFile(path.join(root,'context-memory.json'),JSON.stringify({contractVersion:'0.1.0',items:[memory]}));
 for(let restart=0;restart<2;restart++){
 child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],env:{PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(root,'state.json'),APP_PLATFORM_STARTUP_PROFILE:'minimal',APP_PLATFORM_MANAGED_SESSION_ENABLED:'true',APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS:'60000',APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON:JSON.stringify([context])},stdio:['ignore','pipe','pipe','ipc']});
 child.stdout.resume();let stderr='';child.stderr.on('data',x=>stderr+=x);exited=new Promise(r=>child.once('exit',r));let timer;
 const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_TIMEOUT '+stderr)),30000);child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EXIT '+code+' '+stderr)));child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});}).finally(()=>clearTimeout(timer));
 assert.equal(sample.blockedOutbound,0);assert.equal(sample.registeredIntervals.length,seeded?1:0);
 if(seeded)assert.equal(sample.registeredIntervals[0].delayMs,60000);
 await assert.rejects(fs.stat(path.join(root,'context-memory-scheduler.lease.json')),/ENOENT/,'no tick ran during startup');
 child.kill('SIGTERM');const kill=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);clearTimeout(kill);assert.equal(stderr,'');child=undefined;
 }
 if(seeded)assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'context-memory.json'),'utf8')).items,[memory]);
 }finally{if(child&&child.exitCode===null){child.kill('SIGKILL');await exited;}await fs.rm(root,{recursive:true,force:true});}
});
