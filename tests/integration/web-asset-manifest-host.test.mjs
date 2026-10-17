import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fork} from 'node:child_process';
import {buildWebAssetManifest} from '../../tools/build-web-asset-manifest.mjs';
import {appHostShellCss} from '../../dist/manager/app-host-shell.js';

test('real Host upgrade serves old unrequested lazy bytes and CSS with immutable validators', {timeout:45000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'archive-host-')),dist=path.join(root,'dist');let live;
 async function start(revision){
  const child=fork(path.join(dist,'manager/server.js'),[],{execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],env:{PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STARTUP_PROFILE:'minimal',APP_PLATFORM_MANAGED_SESSION_ENABLED:'true',APP_PLATFORM_ASSET_REVISION:revision,APP_PLATFORM_STATE_FILE:path.join(root,'state.json')},stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='';child.stderr.on('data',x=>stderr+=x);const exited=new Promise(resolve=>child.once('exit',resolve));let timer;
  live={child,exited};
  const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('START_TIMEOUT '+stderr)),30000);child.once('error',reject);child.once('exit',code=>reject(Error('EARLY_EXIT '+code+' '+stderr)));child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});}).finally(()=>clearTimeout(timer));
  assert.equal(sample.blockedOutbound,0);
  return {base:`http://127.0.0.1:${sample.port}`,async stop(){child.kill('SIGTERM');const kill=setTimeout(()=>child.kill('SIGKILL'),7000);const code=await exited;clearTimeout(kill);live=undefined;assert.equal(code,0);assert.equal(stderr,'');}};
 }
 async function get(base,url,headers){return fetch(base+url,{headers,signal:AbortSignal.timeout(10000)});}
 try{
  await fs.cp(path.resolve('dist'),dist,{recursive:true});await fs.symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
  const lazy='manager/mobile-task-runtime.js',oldBytes=await fs.readFile(path.join(dist,lazy),'utf8');
  const old=await start('old-rev');await old.stop(); // No browser request for the lazy file yet.
  const newBytes=oldBytes+'\n// upgrade fixture: new revision\n';await fs.writeFile(path.join(dist,lazy),newBytes);
  await fs.writeFile(path.join(dist,'web-asset-manifest.json'),JSON.stringify(buildWebAssetManifest({sourceRoot:dist,shellCss:appHostShellCss}))); // Independent build for new revision.
  const current=await start('new-rev');
  for(const [asset,expected]of [[lazy,oldBytes],['manager/app-host-shell.css',appHostShellCss]]){
   const response=await get(current.base,'/assets/old-rev/'+asset);assert.equal(response.status,200);assert.equal(await response.text(),expected);assert.match(response.headers.get('cache-control'),/immutable/);const etag=response.headers.get('etag');assert.ok(etag);
   const cached=await get(current.base,'/assets/old-rev/'+asset,{'if-none-match':etag});assert.equal(cached.status,304);assert.equal(await cached.text(),'');
  }
  assert.equal(await (await get(current.base,'/assets/new-rev/'+lazy)).text(),newBytes);
  const legacy=await get(current.base,'/assets/'+lazy);assert.equal(await legacy.text(),newBytes);assert.match(legacy.headers.get('cache-control'),/must-revalidate/);
  assert.equal((await get(current.base,'/assets/old-rev/manager/server.js')).status,404);
  assert.equal((await get(current.base,'/assets/unknown-rev/'+lazy)).status,404);
  await assert.rejects(fs.stat(path.join(root,'web-assets','new-rev','manager/server.js')),/ENOENT/);
  await current.stop();
 }finally{if(live){live.child.kill('SIGKILL');await live.exited;}await fs.rm(root,{recursive:true,force:true});}
});
