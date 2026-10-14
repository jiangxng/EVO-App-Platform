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
 let liveJob=structuredClone(job);
 const handlers=createObjectExtensionActionHandlersV010({
  repository:repo,
  canManageEnterpriseContext:()=>true,
  getImportJob:(id,jobId)=>id===contextId&&jobId===job.importJobId?liveJob:undefined,
  applyImportMapping:async ({sourceColumn,targetFieldId})=>{
   liveJob={...liveJob,mapping:[...liveJob.mapping,{sourceColumn,targetFieldId}]};
  }
 });
 const action=handlers.find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010);
 assert.ok(action);
 const route=objectExtensionImportRouteV010(job.importJobId);
 assert.equal(parseObjectExtensionImportRouteV010(route),job.importJobId);
 const selectedRoute=objectExtensionImportRouteV010(job.importJobId,"开户银行");
 assert.match(selectedRoute,/column=%E5%BC%80%E6%88%B7%E9%93%B6%E8%A1%8C/);
 assert.equal(parseObjectExtensionImportRouteV010(selectedRoute),job.importJobId);
 const prefilled=createObjectExtensionImportPageV010({
  job,locale:"zh-CN",sourceColumn:"开户银行"
 });
 assert.equal(prefilled.fields.find(x=>x.key==="label").initialValue,"开户银行");
 assert.equal(prefilled.fields.find(x=>x.key==="sourceColumn").options.length,1);
 assert.equal(parseObjectExtensionImportRouteV010("//bad"),undefined);
 const form=createObjectExtensionImportPageV010({job,locale:"zh-CN"});
 assert.deepEqual(form.fields.find(x=>x.key==="sourceColumn").options.map(x=>x.value),["开户银行"]);
 assert.equal(form.contextNavigation.items[1].route,
   "/data-import/jobs/bex-ext-1/map");
 const schemaBefore=createCounterpartyEffectiveObjectSchemaV010({
  activeRelationshipRoles:["SUPPLIER"],extensions:[]
 });
 const mappingWithEntry=createDataImportMappingPageV010({
  job,schema:schemaBefore,locale:"zh-CN",canCreateExtension:true
 });
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.contextLink?.route,selectedRoute);
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.initialValue,"__PENDING_CREATE__");
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.options.at(-1)?.value,"__IGNORE__");
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_2")?.contextLink?.label,
   "＋ 创建“开户银行”企业字段");
 assert.equal(mappingWithEntry.fields.find(x=>x.key==="map_0")?.contextLink,undefined);
 const mappingWithoutPermission=createDataImportMappingPageV010({
  job,schema:schemaBefore,locale:"zh-CN",canCreateExtension:false
 });
 assert.equal(mappingWithoutPermission.fields.some(x=>x.contextLink),false);
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
 assert.deepEqual(liveJob.mapping.at(-1),{
  sourceColumn:"开户银行",targetFieldId:created.result.mappedTargetFieldId
 });
 assert.equal(created.result.navigateTo,"/data-import/jobs/bex-ext-1/map");
 const definition=repo.list(contextId,"counterparty.subject")[0];
 assert.equal(definition.targetSlot,"counterparty.supplier-profile");
 assert.deepEqual(definition.applicability.relationshipRoles,["SUPPLIER"]);
 assert.equal(definition.importable,true);
 const schema=createCounterpartyEffectiveObjectSchemaV010({
  activeRelationshipRoles:["SUPPLIER"],extensions:repo.list(contextId,"counterparty.subject")
 });
 const refreshed=createDataImportMappingPageV010({
  job:liveJob,schema,target:undefined,locale:"zh-CN"
 });
 assert.equal(refreshed.fields.find(x=>x.key==="map_2").initialValue,definition.fieldId);
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


test("BEX-01 prevents duplicate labels after different source columns and reuses same stable ID",async()=>{
 const repository=createObjectExtensionRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
 const altJob={...structuredClone(job),source:{
  ...structuredClone(job.source),
  headers:[...job.source.headers,"系统编码"]
 }};
 const handler=createObjectExtensionActionHandlersV010({
  repository,canManageEnterpriseContext:()=>true,
  getImportJob:()=>altJob
 }).find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010);
 assert.ok(handler);
 const first=await handler.execute({
  ...request("系统编码","开户银行","STRING"),
  values:{importJobId:job.importJobId,sourceColumn:"系统编码",label:"开户银行",valueType:"STRING"}
 },ctx());
 assert.equal(first.ok,true,JSON.stringify(first));
 const second=await handler.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(second.ok,false);
 assert.equal(second.error.code,"OBJECT_EXTENSION_LABEL_ALREADY_EXISTS_CHOOSE_FIELD");
 assert.equal(repository.list(contextId,"counterparty.subject").length,1);
 const repeat=await handler.execute({
  ...request("系统编码","开户银行","STRING"),
  values:{importJobId:job.importJobId,sourceColumn:"系统编码",label:"开户银行",valueType:"STRING"}
 },ctx());
 assert.equal(repeat.ok,true,JSON.stringify(repeat));
 assert.equal(repository.list(contextId,"counterparty.subject").length,1);
});
