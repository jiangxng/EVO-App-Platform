import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createMemoryEnterpriseResourceRepositoryV010,
  createFileEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionModelPublicationV010
} from "../../dist/apps/object-extension/model-publication.js";
import {
  createObjectExtensionModelActionHandlersV010
} from "../../dist/apps/object-extension/model-actions.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createLazyAppActionHandlerV010 } from "../../dist/actions/lazy-handler.js";
import { objectExtensionPackage } from "../../dist/apps/object-extension/package.js";

const scope="enterprise:a";
const original = {
  contractVersion:"0.1.0", importJobId:"import-100", targetId:"counterparty.subject",
  state:"STAGED", targetParameters:{relationshipMode:"CUSTOMER"},
  source:{kind:"CSV",name:"customer.csv",
    headers:["往来编码","客户等级","负责部门","负责人"],
    rows:[{往来编码:"CP-01",客户等级:"重点",负责部门:"销售一部",负责人:"张三"}]},
  mapping:[{sourceColumn:"往来编码",targetFieldId:"code"}],
  stagedAt:"2026-10-30T11:00:00.000Z",stagedBySubjectId:"owner-a"
};
function definition(sourceKind="BUSINESS_DICTIONARY", id="counterparty.customer-level") {
  return {
    contractVersion:"0.1.0",extensionId:"enterprise.customer.level",
    targetObjectType:"counterparty.subject",
    targetSlot:"counterparty.customer-profile",
    namespace:"enterprise.counterparty",
    fieldId:"customerLevelRef",semanticType:"business-reference",
    valueType:"REFERENCE",
    label:{default:"客户等级"},required:false,order:30,
    surfaces:["DETAIL","EDIT","IMPORT"],importable:true,
    agentReadable:true,agentWritable:false,
    reference:{sourceKind,sourceId:id,expectedVersion:3,cardinality:"ONE"}
  };
}
function setup(resources=createMemoryEnterpriseResourceRepositoryV010(), published=()=>true) {
  const imports=createDataImportRepositoryV010(resources);
  imports.save({contextId:scope,job:structuredClone(original),
    actorSubjectId:"owner-a",recordedAt:"2026-10-30T11:00:00.000Z"});
  const model=createObjectExtensionModelPublicationV010({
    resources, getImportJob:(id,jobId)=>imports.get(id,jobId),
    isPublishedReference:published
  });
  return {resources,imports,model};
}
const author={actorSubjectId:"owner-a",recordedAt:"2026-10-30T12:00:00.000Z"};
function prepare(model) {
  const proposal=model.propose(scope,original.importJobId);
  return { ...author, contextId:scope, importJobId:original.importJobId,
    sourceColumn:"客户等级",sourceRevision:proposal.sourceRevision,
    expectedVersion:0,definition:definition()};
}
function context(actorType="HUMAN") {
  return {contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner-a",actorType,
      identityProviderId:"test",sessionId:"session"},
    scope:{contractVersion:"0.1.0",enterpriseId:"company-a"},
    context:{contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:owner-a",ownerSubjectId:"owner-a"},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:scope,enterpriseId:"company-a"}},
    correlationId:"review"
  };
}
function request(code,values) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},values,
    actionId:code,sourceInteractionId:"review",requiresConfirmation:false};
}

test("MD-02: Object Extension owns four optional Human-governed model operations",()=>{
  const feature=objectExtensionPackage.features[0];
  const ids=feature.contributions.filter(x=>x.kind==="platform.capability-operation")
    .map(x=>x.operation.operationId);
  assert.ok(ids.includes("object-extension.model.propose"));
  assert.ok(ids.includes("object-extension.model.draft.get"));
  assert.ok(ids.includes("object-extension.model.draft.save"));
  assert.ok(ids.includes("object-extension.model.publish"));
});

test("MD-02: suggestions are deterministic, uncommitted, and never auto-publish",()=>{
  const {model,imports,resources}=setup();
  const proposal=model.propose(scope,original.importJobId);
  assert.deepEqual(proposal.columns.map(x=>[x.sourceColumn,x.status,x.suggestedValueType]),[
    ["客户等级","REQUIRES_HUMAN_REVIEW","STRING"],
    ["负责部门","REQUIRES_HUMAN_REVIEW","STRING"],
    ["负责人","REQUIRES_HUMAN_REVIEW","STRING"]
  ]);
  assert.equal(proposal.targetId,"counterparty.subject");
  assert.equal(imports.get(scope,original.importJobId).mapping.length,1);
  assert.equal(createObjectExtensionRepositoryV010(resources).list(scope).length,0);
});

test("MD-02: Human draft persists separately; publication atomically adds existing extension and returns to mapping",()=>{
  const {model,resources,imports}=setup();
  const draft=model.saveDraft(prepare(model));
  assert.equal(draft.state,"DRAFT");
  assert.equal(draft.version,1);
  assert.equal(model.get(scope,draft.modelDraftId).state,"DRAFT");
  const existing=createObjectExtensionRepositoryV010(resources);
  assert.equal(existing.list(scope).length,0,"Draft never becomes an executable model");
  const publication=model.publish({ ...author,contextId:scope,
    modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN" });
  assert.equal(publication.published.state,"PUBLISHED");
  assert.equal(existing.get(scope,definition().extensionId).reference.expectedVersion,3);
  assert.equal(publication.navigateTo,"/data-import/jobs/import-100/map");
  assert.deepEqual(imports.get(scope,original.importJobId).mapping,original.mapping);
  assert.equal(model.publish({ ...author,contextId:scope,
    modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN" }).published.state,
    "PUBLISHED");
  const events=resources.list({
    contextId:scope,namespace:"evo.object-extension",
    collectionId:"model-history",resourceType:"object-extension.model-publication",
    lifecycleState:"ACTIVE"
  });
  assert.deepEqual(events.map(x=>x.payload.state).sort(),["DRAFT","PUBLISHED"]);
});

test("MD-02: never publish an unresolved or stale business reference",()=>{
  let permitted=false;
  const {model,resources}=setup(undefined,()=>permitted);
  const draft=model.saveDraft(prepare(model));
  const input={...author,contextId:scope,modelDraftId:draft.modelDraftId,
    expectedVersion:1,actorType:"HUMAN"};
  assert.throws(()=>model.publish(input),/MODEL_REFERENCE_NOT_PUBLISHED/);
  assert.equal(createObjectExtensionRepositoryV010(resources).list(scope).length,0);
  permitted=true;
  assert.equal(model.publish(input).published.state,"PUBLISHED");
});

test("MD-02: source file rows, mapping and committed states reject stale publication without partial mutation",()=>{
  for(const mutation of [
    job=>{job.source.rows[0]["客户等级"]="新来源值";},
    job=>{job.mapping.push({sourceColumn:"客户等级",targetFieldId:"someField"});},
    job=>{job.state="COMMITTED";}
  ]) {
    const {model,imports,resources}=setup();
    const draft=model.saveDraft(prepare(model));
    const changed=imports.get(scope,original.importJobId);
    mutation(changed);
    imports.save({contextId:scope,job:changed,...author});
    assert.throws(()=>model.publish({...author,contextId:scope,
      modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN"}),
    /MODEL_(SOURCE_REVISION_STALE|SOURCE_COLUMN_NOT_AVAILABLE|IMPORT_JOB_ALREADY_COMMITTED)/);
    assert.equal(createObjectExtensionRepositoryV010(resources).list(scope).length,0);
  }
});

test("MD-02: wrong tenant, invalid source, duplicate extension and wrong version fail closed",()=>{
  const {model,resources}=setup();
  assert.throws(()=>model.saveDraft({...prepare(model),sourceColumn:"not-a-column"}),
    /MODEL_SOURCE_COLUMN_NOT_AVAILABLE/);
  const draft=model.saveDraft(prepare(model));
  assert.equal(model.get("enterprise:b",draft.modelDraftId),undefined);
  assert.throws(()=>model.publish({...author,contextId:"enterprise:b",
    modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN"}),
    /MODEL_DRAFT_NOT_FOUND/);
  assert.throws(()=>model.publish({...author,contextId:scope,
    modelDraftId:draft.modelDraftId,expectedVersion:2,actorType:"HUMAN"}),
    /MODEL_VERSION_CONFLICT/);
  assert.throws(()=>model.publish({...author,contextId:scope,
    modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"AI"}),
    /MODEL_PUBLISH_HUMAN_REQUIRED/);
  const prior=resources.put({
    contextId:scope,namespace:"evo.object-extension",collectionId:"definitions",
    resourceType:"object-extension.definition",resourceId:definition().extensionId,
    schemaRef:"evo.object-extension.definition/0.1.0",ownerPackageId:"evo-object-extension",
    storageKind:"DOCUMENT",payload:definition(),...author
  });
  assert.ok(prior);
  assert.throws(()=>model.publish({...author,contextId:scope,
    modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN"}),
    /MODEL_FIELD_ALREADY_EXISTS/);
});

test("MD-02: persisted draft survives process-style restart with the same import source",()=>{
  const temp=mkdtempSync(join(tmpdir(),"evo-model-review-"));
  try {
    const file=join(temp,"enterprise.json");
    const first=setup(createFileEnterpriseResourceRepositoryV010(file));
    const draft=first.model.saveDraft(prepare(first.model));
    const reopened=createFileEnterpriseResourceRepositoryV010(file);
    const model=createObjectExtensionModelPublicationV010({
      resources:reopened,
      getImportJob:(scope,id)=>createDataImportRepositoryV010(reopened).get(scope,id),
      isPublishedReference:()=>true
    });
    assert.equal(model.get(scope,draft.modelDraftId).version,1);
    assert.equal(model.publish({...author,contextId:scope,
      modelDraftId:draft.modelDraftId,expectedVersion:1,actorType:"HUMAN"}).published.state,
      "PUBLISHED");
    assert.equal(createObjectExtensionRepositoryV010(reopened).list(scope).length,1);
  } finally {rmSync(temp,{recursive:true,force:true});}
});

test("MD-02: real ActionRouter refuses unauthorized, non-Human, wrong context and inactive plugin",async()=>{
  let active=false;
  let resolved=0;
  const {model}=setup();
  const codes=["object-extension.model.propose","object-extension.model.draft.get",
    "object-extension.model.draft.save","object-extension.model.publish"];
  const handlers=codes.map(code=>createLazyAppActionHandlerV010({
    packageId:"evo-object-extension",featureId:"evo-object-extension.default",
    commandCode:code,
    async load(){
      resolved++;
      return createObjectExtensionModelActionHandlersV010({
        resolveModel:async()=>model,
        canManageEnterpriseContext:()=>true
      }).find(h=>h.commandCode===code);
    }
  }));
  const router=createAppActionRouter(handlers,id=>active&&id==="evo-object-extension.default");
  const propose=request(codes[0],{importJobId:original.importJobId});
  assert.equal((await router.execute(propose,context())).error.code,"ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(resolved,0);
  active=true;
  const proposal=await router.execute(propose,context());
  assert.equal(proposal.ok,true);
  assert.equal(proposal.result.data.columns.length,3);
  assert.equal((await router.execute(propose,context("AI"))).error.code,"MODEL_HUMAN_REVIEW_REQUIRED");
  const unauthorized=createObjectExtensionModelActionHandlersV010({
    resolveModel:async()=>model,canManageEnterpriseContext:()=>false
  })[0];
  assert.equal((await unauthorized.execute(propose,context())).error.code,"MODEL_PERMISSION_DENIED");
  const spoof=context();spoof.scope.enterpriseId="foreign-company";
  assert.equal((await router.execute(propose,spoof)).error.code,
    "MODEL_ENTERPRISE_CONTEXT_REQUIRED");
  active=false;
  assert.equal((await router.execute(propose,context())).error.code,"ACTION_FEATURE_NOT_ACTIVE");
});
