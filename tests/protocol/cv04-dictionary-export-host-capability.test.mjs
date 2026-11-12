import test from "node:test";
import assert from "node:assert/strict";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {
  createCapabilityOperationActionPreExecuteV010,
  listAuthorizedCapabilityOperationsV010
} from "../../dist/manager/capability-operation-access.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createDictionaryExportJobOwnerV010}
  from "../../dist/apps/business-dictionary/export-jobs.js";
import {createStagedDictionaryExportCapabilityContributionsV010}
  from "../../dist/apps/business-dictionary/export-capability.js";

const pkgId="cv04-test-only-dictionary-export-host",featureId=pkgId+".default";
const ctxId="enterprise-context:cv04-a";
const contrib=createStagedDictionaryExportCapabilityContributionsV010();
const createPlugin=()=>({
  contractVersion:"0.1.0",packageId:pkgId,displayName:"CV04 Isolated Export Capability Fixture",
  version:"0.1.0",type:"APPLICATION",
  features:[{contractVersion:"0.1.0",featureId,packageId:pkgId,version:"0.1.0",
    activationScope:"INSTALLATION",defaultActivation:true,
    providesCapabilities:["enterprise.business-dictionary.bounded-export"],
    contributions:contrib}]
});
const principal=(subjectId="member",actorType="HUMAN",enterpriseId="cv04-a")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId,actorType,
    identityProviderId:"cv04-isolated-bearer",sessionId:"session:"+subjectId+":"+actorType},
  scope:{contractVersion:"0.1.0",enterpriseId,userId:subjectId},
  context:{contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+subjectId,ownerSubjectId:subjectId},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise-context:"+enterpriseId,enterpriseId}
  },correlationId:"cv04-host-export-isolated"
});
const request=(code,values={},inputVersion="0.1.0")=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion},values,
  sourceInteractionId:"cv04-host-capability-test",
  actionId:code,requiresConfirmation:false
});
const args=(key="cv04_idempotency_01")=>({
  idempotencyKey:key,query:{view:"published",sort:"dictionaryId",direction:"asc"},
  fieldIds:["dictionaryId","displayName"]
});

function harness(){
  const manager=createAppManagerService(
    createPackageCatalog([createPlugin()]),createMemoryLifecycleStore()
  );
  manager.install(pkgId);
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createBusinessDictionaryRepositoryV010(resources);
  const seed=repository.saveDraft({contextId:ctxId,dictionaryId:"cv04-safe-one",
    displayName:"Eidos authorized dictionary",expectedVersion:0,
    options:[{code:"PRIVATE_X",label:{default:"Private option value"},status:"ACTIVE"}],
    actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z"});
  repository.publish({contextId:ctxId,dictionaryId:"cv04-safe-one",
    expectedVersion:seed.version,actorSubjectId:"owner",actorType:"HUMAN",
    recordedAt:"2026-11-12T00:00:00Z"});
  const state={exportAllowed:false,relationship:true,providerPresent:true,handlerCalls:0};
  const authorizationProvider=()=>{
    if(!state.providerPresent)return undefined;
    return createHostStaticAuthorizationProviderV010({
      contractVersion:"0.1.0",rules:[
        {id:"read-default",effect:"ALLOW",actions:["dictionary.read"],
          subjectIds:["member"],actorTypes:["HUMAN","AI"],scope:{enterpriseId:"cv04-a"}},
        ...(state.exportAllowed?[{
          id:"independent-export",effect:"ALLOW",actions:["dictionary.export"],
          subjectIds:["member"],actorTypes:["HUMAN","AI"],scope:{enterpriseId:"cv04-a"},
          resourceTypes:["business-dictionary.definition"],resourceIds:["cv04-a"]
        }]:[])
      ]
    });
  };
  const owner=createDictionaryExportJobOwnerV010({
    repository,resources,isolatedTestOnly:true,
    resolveAuthorizationProvider:authorizationProvider,
    hasLiveRelationship:()=>state.relationship,
    isFeatureActive:()=>manager.getSnapshot().activeFeatures
      .some(f=>f.featureId===featureId),
    now:()=>new Date("2026-11-12T00:00:00Z")
  });
  const handlers=contrib.map(item=>({
    packageId:pkgId,featureId,commandCode:item.operation.binding.commandCode,
    async execute(req,context){
      state.handlerCalls++;
      if(!context)return {ok:false,error:{
        code:"REQUEST_CONTEXT_REQUIRED",message:"Host request context missing"
      }};
      try{
        const code=req.command.code,values=req.values;
        if(code.endsWith(".request"))
          return {ok:true,result:await owner.request(context,values)};
        if(code.endsWith(".status"))
          return {ok:true,result:await owner.status(context,values.jobId)};
        if(code.endsWith(".download"))
          return {ok:true,result:await owner.download(context,values.jobId)};
        return {ok:false,error:{code:"CV04_UNRECOGNIZED_EXPORT",message:"Unknown operation"}};
      }catch(error){
        const code=error instanceof Error?error.message:"CV04_UNKNOWN_FAILURE";
        return {ok:false,error:{code,message:code}};
      }
    }
  }));
  const router=createAppActionRouter(
    handlers,
    fid=>manager.getSnapshot().activeFeatures.some(f=>f.featureId===fid),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:authorizationProvider
    })
  );
  const catalog=(audience,context,overrideProvider=authorizationProvider())=>
    listAuthorizedCapabilityOperationsV010({
      manager,authorizationProvider:overrideProvider,
      requestContext:context,audience
    });
  return {manager,owner,state,router,catalog,authorizationProvider};
}

test("CV04 staging descriptors are independent EXPORT and require Host write receipt",()=>{
  const operations=contrib.map(x=>x.operation);
  assert.equal(operations.length,3);
  assert.deepEqual(operations.map(x=>x.operationId),[
    "dictionary.collection.export.job.request",
    "dictionary.collection.export.job.status",
    "dictionary.collection.export.job.download"
  ]);
  for(const op of operations){
    assert.equal(op.authorization.action,"dictionary.export");
    assert.equal(op.authorization.resource.idSource,"DATA_SCOPE");
    assert.equal(op.authorization.resource.type,"business-dictionary.definition");
    assert.equal(op.dataScope,"ENTERPRISE");
    assert.deepEqual(op.exposure,["HUMAN","PERSONAL_AGENT"]);
    assert.ok(!op.exposure.includes("EXTERNAL_AGENT"));
  }
  assert.equal(operations[0].effect,"WRITE");
  assert.deepEqual(operations[0].writeSafety,
    {idempotency:"HOST_REQUIRED",receipt:"HOST_REQUIRED"});
  assert.deepEqual(operations.slice(1).map(x=>x.effect),["READ","READ"]);
});

test("CV04 same Host Capability discovery hides Export for READ-only, foreign context and External Agent",async()=>{
  const h=harness(),human=principal(),ai=principal("member","AI");
  for(const [audience,ctx] of [["HUMAN",human],["PERSONAL_AGENT",ai]]){
    const notExport=await h.catalog(audience,ctx);
    assert.equal(notExport.operations.length,0);
    assert.ok(notExport.evaluations.every(x=>x.allowed===false));
  }
  h.state.exportAllowed=true;
  for(const [audience,ctx] of [["HUMAN",human],["PERSONAL_AGENT",ai]]){
    const allowed=await h.catalog(audience,ctx);
    assert.equal(allowed.operations.length,3);
  }
  const foreign=await h.catalog("HUMAN",principal("member","HUMAN","cv04-b"));
  assert.equal(foreign.operations.length,0);
  const external=await h.catalog("EXTERNAL_AGENT",human);
  assert.equal(external.operations.length,0);
  assert.ok(external.evaluations.every(x=>
    x.reasonCodes.includes("CAPABILITY_OPERATION_EXPOSURE_DENIED")));
  h.state.providerPresent=false;
  const missing=await h.catalog("HUMAN",human);
  assert.equal(missing.operations.length,0);
  console.log("CV04_HOST_CAPABILITY_EXPORT_DISCOVERY_READ_DENY_ACTOR_PARITY_PASS");
});

test("CV04 actual Host ActionRouter invokes Owner only after independent EXPORT authorization",async()=>{
  const h=harness(),human=principal(),ai=principal("member","AI");
  const requestCode="dictionary.collection.export.job.request";
  const downloadCode="dictionary.collection.export.job.download";
  const denied=await h.router.execute(request(requestCode,args()),human);
  assert.equal(denied.ok,false);
  assert.equal(h.state.handlerCalls,0,"READ grant must not enter Owner EXPORT job");
  h.state.exportAllowed=true;
  const queued=await h.router.execute(request(requestCode,args()),human);
  assert.equal(queued.ok,true,JSON.stringify(queued));
  assert.equal(queued.result.state,"QUEUED");
  const agent=await h.router.execute(request(requestCode,args()),ai);
  assert.equal(agent.ok,true,JSON.stringify(agent));
  assert.notEqual(queued.result.jobId,agent.result.jobId);
  assert.equal((await h.owner.run(human,queued.result.jobId)).state,"READY");
  assert.equal((await h.owner.run(ai,agent.result.jobId)).state,"READY");
  const hFile=await h.router.execute(request(downloadCode,
    {jobId:queued.result.jobId}),human);
  const aFile=await h.router.execute(request(downloadCode,
    {jobId:agent.result.jobId}),ai);
  assert.equal(hFile.ok,true);
  assert.equal(aFile.ok,true);
  assert.equal(hFile.result.content,aFile.result.content);
  assert.ok(!hFile.result.content.includes("PRIVATE_X"));
  const before=h.state.handlerCalls;
  h.state.exportAllowed=false;
  const afterRevoke=await h.router.execute(request(downloadCode,
    {jobId:queued.result.jobId}),human);
  assert.equal(afterRevoke.ok,false);
  assert.equal(h.state.handlerCalls,before,
    "PreExecute rejects revoked EXPORT before Owner download handler");
  h.state.exportAllowed=true;
  h.state.relationship=false;
  const revokedRelationship=await h.router.execute(request(downloadCode,
    {jobId:agent.result.jobId}),ai);
  assert.equal(revokedRelationship.ok,false);
  assert.equal(revokedRelationship.error.code,"COLLECTION_EXPORT_PERMISSION_DENIED");
  h.state.relationship=true;
  h.manager.disable(pkgId);
  assert.equal((await h.catalog("HUMAN",human)).operations.length,0);
  const stopped=await h.router.execute(request(downloadCode,
    {jobId:queued.result.jobId}),human);
  assert.equal(stopped.ok,false);
  assert.equal(stopped.error.code,"ACTION_FEATURE_NOT_ACTIVE");
  console.log("CV04_HOST_CAPABILITY_REAL_OWNER_HUMAN_AI_REVOKE_DISABLED_PASS");
});

test("CV04 Host request context, version and foreign enterprise are enforced before Owner",async()=>{
  const h=harness();h.state.exportAllowed=true;
  const code="dictionary.collection.export.job.request";
  const missing=await h.router.execute(request(code,args()));
  assert.equal(missing.ok,false);
  assert.equal(missing.error.code,"REQUEST_CONTEXT_REQUIRED");
  const version=await h.router.execute(request(code,args(),"9.9.9"),principal());
  assert.equal(version.ok,false);
  assert.equal(version.error.code,"CAPABILITY_OPERATION_INPUT_VERSION_UNSUPPORTED");
  const foreign=await h.router.execute(request(code,args()),principal("member","HUMAN","cv04-b"));
  assert.equal(foreign.ok,false);
  assert.equal(h.state.handlerCalls,0);
  const forged=await h.router.execute(request(code,{
    ...args(),subjectId:"forged-owner",enterpriseId:"cv04-b"
  }),principal());
  assert.equal(forged.ok,true,
    "Request body cannot override Host principal / Context; Owner only uses trusted context");
  assert.equal(h.state.handlerCalls,1);
  h.state.providerPresent=false;
  const down=await h.router.execute(request(
    "dictionary.collection.export.job.status",{jobId:forged.result.jobId}),principal());
  assert.equal(down.ok,false);
  assert.equal(down.error.code,"AUTHORIZATION_PROVIDER_REQUIRED");
});
