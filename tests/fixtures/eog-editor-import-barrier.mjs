// Native ESM fault/barrier instrumentation for isolated Host tests only.
import {register} from 'node:module';
import {isMainThread} from 'node:worker_threads';
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout} from 'node:timers/promises';
let config;
if(isMainThread&&process.env.EOG_EDITOR_IMPORT_TEST_DIRECTORY){
  register(import.meta.url,{data:{directory:process.env.EOG_EDITOR_IMPORT_TEST_DIRECTORY,
    fail:process.env.EOG_EDITOR_IMPORT_TEST_FAIL==='true'}});
}
export function initialize(data){config=data;}
export async function load(url,context,nextLoad){
  const name=['enterprise-operating-graph-actions','enterprise-operating-graph-page']
    .find(name=>url.endsWith('/apps/eog-2d-designer/'+name+'.js'));
  if(config&&name){
    writeFileSync(join(config.directory,name+'.ready'),url);
    if(config.fail)throw new Error('EOG_EDITOR_TEST_IMPORT_FAILURE');
    const deadline=Date.now()+10000;
    while(!existsSync(join(config.directory,'release'))){
      if(Date.now()>deadline)throw new Error('EOG_EDITOR_TEST_IMPORT_BARRIER_TIMEOUT');
      await setTimeout(10);
    }
  }
  return nextLoad(url,context);
}
