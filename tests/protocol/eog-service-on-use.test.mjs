import test from 'node:test';
import assert from 'node:assert/strict';
import {createOnUseEogServicesV010} from '../../dist/manager/eog-service-runtime.js';
import {createMemoryBusinessDefinitionRepositoryV010} from '../../dist/providers/enterprise-context/business-definitions.js';
import {createEnterpriseOperatingGraphDefinitionPersistenceV010} from '../../dist/apps/eog-2d-designer/definition-persistence.js';
import {createEnterpriseOperatingGraphHostServiceV010} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-service.js';
import {createEogExpectedSopServiceV010} from '../../dist/manager/enterprise-operating-graph-sop-service.js';
import {createEnterpriseOperatingGraphActionHandlersV010,EOG_CREATE_ACTION,EOG_LIST_ACTION} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-actions.js';
import {createEogExpectedSopActionHandlersV010,EOG_SOP_LIST_ACTION,EOG_SOP_CREATE_ACTION} from '../../dist/manager/enterprise-operating-graph-sop-actions.js';
import {createAppActionRouter} from '../../dist/actions/router.js';
const enterpriseId='enterprise:test',graphId='graph:test';
const context={correlationId:'test',principal:{contractVersion:'0.1.0',actorType:'HUMAN',subjectId:'owner'},context:{activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',enterpriseId,contextId:'context:test'}}};
function fixture(){
 const repository=createMemoryBusinessDefinitionRepositoryV010();const counts={graph:0,persistence:0,sop:0};let graphFailures=0,sopFailures=0;
 const services=createOnUseEogServicesV010({
  createGraph(){counts.graph++;if(graphFailures-->0)throw Error('GRAPH_FACTORY_FAILED');counts.persistence++;return createEnterpriseOperatingGraphHostServiceV010({persistence:createEnterpriseOperatingGraphDefinitionPersistenceV010(repository)});},
  createSop(graph){counts.sop++;if(sopFailures-->0)throw Error('SOP_FACTORY_FAILED');return createEogExpectedSopServiceV010({repository,graphService:graph});}
 });return {repository,counts,...services,failGraph(){graphFailures=1;},failSop(){sopFailures=1;}};
}
const request=(code,values={})=>({contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,sourceInteractionId:'test',actionId:'test',requiresConfirmation:false});
function routing(f){let active=true,allowed=true;const provider={check(){return {contractVersion:'0.1.0',allowed,policyProviderId:'test',reasonCodes:allowed?[]:['TEST_DENIED']};}};
 const handlers=[...createEnterpriseOperatingGraphActionHandlersV010({service:f.graph,resolveAuthorizationProvider:()=>provider}),...createEogExpectedSopActionHandlersV010({service:f.sop,resolveAuthorizationProvider:()=>provider})];
 const router=createAppActionRouter(handlers,()=>active);return {router,setActive(v){active=v;},setAllowed(v){allowed=v;}};
}
test('metadata registration, inactive calls, invalid context and denied writes create no services',async()=>{
 const f=fixture(),r=routing(f);assert.deepEqual(f.counts,{graph:0,persistence:0,sop:0});
 r.setActive(false);for(const code of [EOG_LIST_ACTION,EOG_SOP_LIST_ACTION])assert.equal((await r.router.execute(request(code,{graphId}),context)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
 r.setActive(true);assert.equal((await r.router.execute(request(EOG_LIST_ACTION))).error.code,'REQUEST_CONTEXT_REQUIRED');
 r.setAllowed(false);for(const code of [EOG_CREATE_ACTION,EOG_SOP_CREATE_ACTION])assert.equal((await r.router.execute(request(code,{graphId,sopId:'sop:test'}),context)).error.code,'TEST_DENIED');
 assert.deepEqual(f.counts,{graph:0,persistence:0,sop:0});
});
test('SOP read methods create only SOP; graph reads create graph/persistence once across callers',async()=>{
 const f=fixture(),r=routing(f);assert.equal((await r.router.execute(request(EOG_SOP_LIST_ACTION,{graphId}),context)).ok,true);
 assert.deepEqual(f.sop.history({enterpriseId,graphId,sopId:'none'}),[]);assert.deepEqual(f.sop.listPublished({enterpriseId,graphId}),[]);
 assert.deepEqual(f.counts,{graph:0,persistence:0,sop:1});
 const reads=await Promise.all(Array.from({length:8},()=>r.router.execute(request(EOG_LIST_ACTION),context)));
 assert.ok(reads.every(x=>x.ok));assert.deepEqual(f.counts,{graph:1,persistence:1,sop:1});
});
test('graph edits and SOP create/revise/publish share original repository; enterprise isolation remains',()=>{
 const f=fixture();let g=f.graph.create({enterpriseId,graphId});
 for(const nodeId of ['app:a','app:b'])g=f.graph.apply({enterpriseId,graphId,expectedRevision:g.revision,actor:{type:'HUMAN',subjectId:'owner'},mutation:{type:'NODE_BIND',node:{nodeId,kind:'APPLICATION',semanticRef:{kind:'APPLICATION',authority:'HOST',refId:nodeId}}}});
 assert.equal(f.graph.get({enterpriseId,graphId}).nodes.length,2);assert.ok(Array.isArray(f.graph.validate({enterpriseId,graphId}).issues));
 const actor={actorType:'HUMAN',subjectId:'owner'};
 let sop=f.sop.create({enterpriseId,graphId,sopId:'sop:test',title:'Test',applicationNodeIds:['app:a','app:b'],actor});
 sop=f.sop.revise({enterpriseId,graphId,sopId:sop.sopId,expectedRevision:sop.revision,title:'Revised',actor});
 sop=f.sop.publish({enterpriseId,graphId,sopId:sop.sopId,expectedRevision:sop.revision,subjectId:'owner'});
 assert.equal(sop.state,'PUBLISHED');assert.equal(f.sop.listPublished({enterpriseId,graphId}).length,1);assert.equal(f.sop.history({enterpriseId,graphId,sopId:sop.sopId}).length,3);
 assert.deepEqual(f.graph.list({enterpriseId:'other'}),[]);assert.deepEqual(f.sop.list({enterpriseId:'other',graphId}),[]);
 assert.deepEqual(f.counts,{graph:1,persistence:1,sop:1});
});
test('disable rejects new router calls, re-enable preserves state; shared read reference remains usable',async()=>{
 const f=fixture(),r=routing(f);assert.equal((await r.router.execute(request(EOG_CREATE_ACTION,{graphId}),context)).ok,true);
 r.setActive(false);assert.equal((await r.router.execute(request(EOG_LIST_ACTION),context)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
 // Another already-authorized consumer may still read: facade is not an authority grant.
 assert.equal(f.graph.get({enterpriseId,graphId}).graphId,graphId);
 r.setActive(true);assert.equal((await r.router.execute(request(EOG_LIST_ACTION),context)).result.graphs.length,1);
 assert.deepEqual(f.counts,{graph:1,persistence:1,sop:0});
});
test('failed graph and SOP factories retry independently without caching failure',()=>{
 const f=fixture();f.failGraph();assert.throws(()=>f.graph.list({enterpriseId}),/GRAPH_FACTORY_FAILED/);assert.deepEqual(f.graph.list({enterpriseId}),[]);
 f.failSop();assert.throws(()=>f.sop.list({enterpriseId,graphId}),/SOP_FACTORY_FAILED/);assert.deepEqual(f.sop.list({enterpriseId,graphId}),[]);
 assert.deepEqual(f.counts,{graph:2,persistence:1,sop:2});
});
