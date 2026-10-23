// Isolated governance test only; never registered by the production Host.
import {register} from 'node:module';
import {isMainThread} from 'node:worker_threads';
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout} from 'node:timers/promises';
let config;
if(isMainThread&&process.env.SOP_ACTION_IMPORT_TEST_DIRECTORY){
  register(import.meta.url,{data:{directory:process.env.SOP_ACTION_IMPORT_TEST_DIRECTORY,
    fail:process.env.SOP_ACTION_IMPORT_TEST_FAIL==='true'}});
}
export function initialize(data){config=data;}
export async function load(url,context,nextLoad){
  if(config&&url.endsWith('/manager/enterprise-operating-graph-sop-actions.js')){
    writeFileSync(join(config.directory,'sop-import.ready'),url);
    if(config.fail)throw new Error('SOP_ACTION_TEST_IMPORT_FAILURE');
    const deadline=Date.now()+10000;
    while(!existsSync(join(config.directory,'sop-import.release'))){
      if(Date.now()>deadline)throw new Error('SOP_ACTION_TEST_IMPORT_TIMEOUT');
      await setTimeout(10);
    }
  }
  return nextLoad(url,context);
}
