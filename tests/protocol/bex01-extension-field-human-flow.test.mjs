import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionActionHandlersV010 } from "../../dist/apps/object-extension/actions.js";
import {
  OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,
  objectExtensionImportRouteV010,
  parseObjectExtensionImportRouteV010
} from "../../dist/apps/object-extension/constants.js";
import { createObjectExtensionImportPageV010 } from "../../dist/apps/object-extension/page.js";
import { createCounterpartyEffectiveObjectSchemaV010 } from "../../dist/apps/counterparty/foundation-object.js";
import { createDataImportMappingPageV010 } from "../../dist/apps/data-import/page.js";
import { createCounterpartyDetailPageV010 } from "../../dist/apps/counterparty/page.js";
import { createDataImportActionHandlersV010 } from "../../dist/apps/data-import/actions.js";
import { DATA_IMPORT_REVIEW_COMMAND_V010 } from "../../dist/apps/data-import/constants.js";

const contextId="enterprise-context:bex-ext";
const job={
 contractVersion:"0.1.0",importJobId:"bex-ext-1",targetId:"counterparty.subject",
 targetParameters:{relationshipMode:"SUPPLIER"},state:"STAGED",
 source:{kind:"XLSX",name:"vendor.xlsx",headers:["编码","主体类型","开户银行"],
 rows:[{"编码":"S900","主体类型":"ORGANIZATION","开户银行":"汇丰"}]},
 mapping:[{sourceColumn:"编码",targetFieldId:"code"},{sourceColumn:"主体类型",targetFieldId:"subjectType"}],
 mappingOrigin:"HUMAN"
};
function ctx(){
 return {
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:"owner",actorType:"HUMAN",
   identityProviderId:"test",sessionId:"test-session"},
  scope:{contractVersion:"0.1.0",enterpriseId:"ent"},
  context:{contractVersion:"0.1.0",activeContext:{
   contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,enterpriseId:"ent"
  }},
  correlationId:"bex01-extension"
 };
}
const request=(column,label,type)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code:OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,inputVersion:"0.1.0"},
 values:{importJobId:job.importJobId,sourceColumn:column,label,valueType:type},
 actionId:"create-extension",sourceInteractionId:"test",requiresConfirmation:false
});
test("BEX-01 human extension flow uses existing CP-03 owner and refreshes import mapping schema",async()=>{
 const repo=createObjectExtensionRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
 let savedJob=structuredClone(job);
 const handlers=createObjectExtensionActionHandlersV010({
  repository:repo,
  canManageEnterpriseContext:()=>true,
  getImportJob:(id,jobId)=>id===contextId&&jobId===job.importJobId
    ? savedJob : undefined,
  applyImportMapping:input=>{
    assert.equal(input.contextId,contextId);
    assert.equal(input.importJobId,job.importJobId);
    savedJob={...savedJob,mapping:structuredClone(input.mapping),
      ignoredSourceColumns:structuredClone(input.ignoredSourceColumns??[])};
  }
 });
 const action=handlers.find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010);
 assert.ok(action);
 const route=objectExtensionImportRouteV010(job.importJobId);
 assert.equal(parseObjectExtensionImportRouteV010(route),job.importJobId);
 assert.equal(parseObjectExtensionImportRouteV010("//bad"),undefined);
 const form=createObjectExtensionImportPageV010({job,locale:"zh-CN"});
 assert.deepEqual(form.fields.find(x=>x.key==="sourceColumn").options.map(x=>x.value),["开户银行"]);
 assert.equal(form.contextNavigation.items[1].route,
   "/data-import/jobs/bex-ext-1/map");
 const schemaBefore=createCounterpartyEffectiveObjectSchemaV010({
  activeRelationshipRoles:["SUPPLIER"],extensions:[]
 });
 const mappingWithEntry=createDataImportMappingPageV010({
  job,schema:schemaBefore,locale:"zh-CN",canCreateExtension:true,
  canUsePersonalAgent:true
 });
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.contextLink?.route,objectExtensionImportRouteV010(job.importJobId,"开户银行"));
 const prefilled=createObjectExtensionImportPageV010({job,locale:"zh-CN",sourceColumn:"开户银行"});
 assert.equal(prefilled.fields.find(x=>x.key==="label").initialValue,"开户银行");
 assert.equal(prefilled.fields.find(x=>x.key==="sourceColumn").options.length,1);
 assert.equal(prefilled.fields.find(x=>x.key==="sourceSample").initialValue,"汇丰");
 assert.throws(()=>createObjectExtensionImportPageV010({
   job,locale:"zh-CN",sourceColumn:"系统编码"
 }),/OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED/);
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.contextLink?.label,
   "新建字段：开户银行");
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_0")?.contextLink,undefined);
 assert.equal(mappingWithEntry.reviewTable.utilityNavigation,undefined);
 assert.equal(mappingWithEntry.contextNavigation.items.some(x=>
   x.id==="batch-review" || x.id==="create-extension"),false);
 const exclusive = mappingWithEntry.fields.filter(x=>x.semanticType==="data-import-field-mapping");
 assert.equal(exclusive.length,job.source.headers.length);
 assert.deepEqual(exclusive.map(x=>x.exclusiveSelect),Array(exclusive.length).fill({
   group:"data-import-targets",exemptValues:["__IGNORE__","__CREATE__","__PENDING__"]
 }));
 const mappingWithoutPermission=createDataImportMappingPageV010({
  job,schema:schemaBefore,locale:"zh-CN",canCreateExtension:false
 });
 assert.equal(mappingWithoutPermission.fields.some(x=>x.contextLink),false);
 assert.equal(mappingWithoutPermission.reviewTable.utilityNavigation,undefined);
 assert.equal(mappingWithoutPermission.contextNavigation.items.some(x=>x.id==="create-extension"),false);
 const mapOtherObject=createDataImportMappingPageV010({
  job:{...job,targetId:"warehouse.item"},schema:schemaBefore,locale:"zh-CN",
  canCreateExtension:true
 });
 assert.equal(mapOtherObject.fields.some(x=>x.contextLink),false);
 const agentAction=mappingWithEntry.actions.find(x=>x.id==="ai-auto-map");
 assert.equal(agentAction?.type,"agent");
 assert.equal(agentAction.context?.importJobId,job.importJobId);
 assert.equal(agentAction.context?.targetId,"counterparty.subject");
 assert.equal(agentAction.refreshSourceOnComplete,true);
 const created=await action.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(created.ok,true,JSON.stringify(created));
 assert.equal(created.result.navigateTo,"/data-import/jobs/bex-ext-1/map");
 assert.equal(created.result.mappedSourceColumn,"开户银行");
 assert.equal(created.result.mappedTargetFieldId,created.result.definition.fieldId);
 assert.equal(savedJob.mapping.find(x=>x.sourceColumn==="开户银行").targetFieldId,
   created.result.definition.fieldId);
 assert.deepEqual(savedJob.source.rows,job.source.rows);
 assert.equal(savedJob.mapping.length,3);
 const definition=repo.list(contextId,"counterparty.subject")[0];
 assert.equal(definition.targetSlot,"counterparty.supplier-profile");
 assert.deepEqual(definition.applicability.relationshipRoles,["SUPPLIER"]);
 assert.equal(definition.importable,true);
 const schema=createCounterpartyEffectiveObjectSchemaV010({
  activeRelationshipRoles:["SUPPLIER"],extensions:repo.list(contextId,"counterparty.subject")
 });
 const refreshed=createDataImportMappingPageV010({job,schema,target:undefined,locale:"zh-CN"});
 assert.ok(refreshed.fields.find(x=>x.key==="map_2").options.some(x=>x.value===definition.fieldId));
 const restored=createDataImportMappingPageV010({job:savedJob,schema,locale:"zh-CN"});
 assert.equal(restored.fields.find(x=>x.key==="map_2").initialValue,definition.fieldId);
 const reused=createDataImportMappingPageV010({job,schema,locale:"zh-CN"});
 assert.equal(reused.fields.find(x=>x.key==="map_2").initialValue,definition.fieldId);
 const ambiguousSchema={...schema,fields:[...schema.fields,{
  ...schema.fields.find(x=>x.fieldId===definition.fieldId),fieldId:"ext_duplicate_same_label"
 }]};
 const ambiguous=createDataImportMappingPageV010({job,schema:ambiguousSchema,locale:"zh-CN"});
 assert.equal(ambiguous.fields.find(x=>x.key==="map_2").initialValue,"__PENDING__");
 assert.match(ambiguous.fields.find(x=>x.key==="sourceEvidence_2").initialValue,/汇丰/);
 assert.match(ambiguous.fields.find(x=>x.key==="candidateEvidence_2").initialValue,
   /ext_duplicate_same_label/);
 assert.ok(ambiguous.fields.find(x=>x.key==="map_2").options.some(x=>
   x.label.includes("业务用途待核对")));
 const duplicate=await action.execute(request("开户银行","另一个名称","STRING"),ctx());
 assert.equal(duplicate.ok,false);
 assert.equal(duplicate.error.code,"OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
 const unsafe=await action.execute(request("隐藏列","来源不允许","STRING"),ctx());
 assert.equal(unsafe.ok,false);
 assert.equal(unsafe.error.code,"OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
 const personal=ctx();personal.context.activeContext={kind:"PERSONAL",contextId:"personal:owner"};
 assert.equal((await action.execute(request("开户银行","开户银行","STRING"),personal)).ok,false);
 const detail=createCounterpartyDetailPageV010({
  counterparty:{contractVersion:"0.1.0",counterpartyId:"subject-1",code:"S900",
   displayName:"某供应商",subjectType:"ORGANIZATION",status:"ACTIVE"},
  locale:"zh-CN",readableFieldIds:["code","subjectType",definition.fieldId],
  extensionFields:[{fieldId:definition.fieldId,label:"开户银行",value:"汇丰"}]
 });
 const extension=detail.items.find(x=>x.id==="subject-1:enterprise-extension");
 assert.equal(extension.metadata["开户银行"],"汇丰");
 const noAccess=createCounterpartyDetailPageV010({
  counterparty:{contractVersion:"0.1.0",counterpartyId:"subject-1",code:"S900",
   displayName:"某供应商",subjectType:"ORGANIZATION",status:"ACTIVE"},
  locale:"zh-CN",readableFieldIds:["code","subjectType"],
  extensionFields:[{fieldId:definition.fieldId,label:"开户银行",value:"汇丰"}]
 });
 assert.equal(noAccess.items.some(x=>x.id==="subject-1:enterprise-extension"),false);
});

test("BEX one-source field save retries its original field after a partial mapping failure",async()=>{
 const repo=createObjectExtensionRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
 let latest={...structuredClone(job),source:{
   ...structuredClone(job.source),
   headers:[...job.source.headers,"内部银行"],
   rows:job.source.rows.map(row=>({...row,"内部银行":"另一家银行"}))
 }};
 let failOnce=true;
 const handlers=createObjectExtensionActionHandlersV010({
   repository:repo,
   canManageEnterpriseContext:()=>true,
   getImportJob:(_,id)=>id===job.importJobId?latest:undefined,
   applyImportMapping:input=>{
     if(failOnce) {failOnce=false;throw new Error("IMPORT_MAP_TEMPORARY_FAILURE");}
     latest={...latest,mapping:structuredClone(input.mapping),
       ignoredSourceColumns:structuredClone(input.ignoredSourceColumns??[])};
   }
 });
 const action=handlers.find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010);
 const first=await action.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(first.ok,false);
 assert.equal(first.error.code,"IMPORT_MAP_TEMPORARY_FAILURE");
 assert.equal(repo.list(contextId,job.targetId).length,1);
 assert.equal(latest.mapping.length,2);
 const second=await action.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(second.ok,true,JSON.stringify(second));
 assert.equal(repo.list(contextId,job.targetId).length,1,
   "retry must not create a second field");
 assert.equal(latest.mapping.find(x=>x.sourceColumn==="开户银行").targetFieldId,
   second.result.definition.fieldId);
 const third=await action.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(third.ok,false);
 assert.equal(third.error.code,"OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
 const other=await action.execute(request("内部银行","开户银行","STRING"),ctx());
 assert.equal(other.ok,false);
 assert.equal(other.error.code,"OBJECT_EXTENSION_LABEL_ALREADY_EXISTS_CHOOSE_FIELD");
 assert.equal(repo.list(contextId,job.targetId).length,1,
   "same-name legacy bank data must be reviewed, never duplicated or deleted");
});

test("BEX import review rejects pending source columns before any mapping or data write",async()=>{
 let writes=0;
 const handlers=createDataImportActionHandlersV010({
   repository:{get:()=>structuredClone(job)},
   service:{updateMapping(){writes++;throw new Error("UNEXPECTED_WRITE");}},
   idFactory:()=> "no-write",
   targets:[],
   canManageEnterpriseContext:()=>true
 });
 const handler=handlers.find(x=>x.commandCode===DATA_IMPORT_REVIEW_COMMAND_V010);
 const result=await handler.execute({
   contractVersion:"0.1.0",type:"command",
   command:{code:DATA_IMPORT_REVIEW_COMMAND_V010,inputVersion:"0.1.0"},
   actionId:"review",sourceInteractionId:"test",requiresConfirmation:false,
   values:{importJobId:job.importJobId,
     map_0:"code",map_1:"subjectType",map_2:"__PENDING__"}
 },ctx());
 assert.equal(result.ok,false);
 assert.equal(result.error.code,"DATA_IMPORT_COLUMNS_NEED_DECISION");
 assert.equal(writes,0);
});
