import test from 'node:test';
import assert from 'node:assert/strict';
import {dataImportActionTargetV010 as select} from '../../dist/apps/data-import/action-target.js';
const contextId='enterprise-a';
const input=(commandCode,values={},repository={get(){throw Error('UNEXPECTED_JOB_READ');}})=>({commandCode,request:{values},contextId,repository});
test('receipt and error download need no target or preliminary Job read',()=>{
  for(const command of ['get','error-csv'])assert.equal(select(input('data-import.'+command)),undefined);
});
test('stage commands select exactly the requested target and reject missing ids',()=>{
  for(const command of ['stage-file','stage-csv']){
    assert.equal(select(input('data-import.'+command,{targetId:' item '})),'item');
    for(const targetId of [undefined,' ',3])assert.throws(()=>select(input('data-import.'+command,{targetId})),/TARGET_ID_REQUIRED/);
  }
});
test('existing Job commands use its enterprise-scoped persisted target, never a supplied target override',()=>{
  for(const command of ['review','dry-run','commit','mapping.inspect','mapping.apply','row-correct']){
    const repository={get(context,id){assert.equal(context,contextId);assert.equal(id,'job');return {targetId:'counterparty.subject'};}};
    assert.equal(select(input('data-import.'+command,{importJobId:' job ',targetId:'warehouse.location'},repository)),'counterparty.subject');
    assert.throws(()=>select(input('data-import.'+command,{importJobId:'job'},{get(){return undefined;}})),/JOB_NOT_FOUND/);
    assert.throws(()=>select(input('data-import.'+command,{},repository)),/JOB_ID_REQUIRED/);
  }
});
test('new/unknown commands fail closed instead of silently loading all targets',()=>{
  assert.throws(()=>select(input('data-import.future')),/HANDLER_NOT_FOUND/);
});
