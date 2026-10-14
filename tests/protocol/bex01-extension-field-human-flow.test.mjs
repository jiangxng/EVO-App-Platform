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
 const handlers=createObjectExtensionActionHandlersV010({
  repository:repo,
  canManageEnterpriseContext:()=>true,
  getImportJob:(id,jobId)=>id===contextId&&jobId===job.importJobId?job:undefined
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
 const created=await action.execute(request("开户银行","开户银行","STRING"),ctx());
 assert.equal(created.ok,true,JSON.stringify(created));
 assert.equal(created.result.navigateTo,"/data-import/jobs/bex-ext-1/map");
 const definition=repo.list(contextId,"counterparty.subject")[0];
 assert.equal(definition.targetSlot,"counterparty.supplier-profile");
 assert.deepEqual(definition.applicability.relationshipRoles,["SUPPLIER"]);
 assert.equal(definition.importable,true);
 const schema=createCounterpartyEffectiveObjectSchemaV010({
  activeRelationshipRoles:["SUPPLIER"],extensions:repo.list(contextId,"counterparty.subject")
 });
 const refreshed=createDataImportMappingPageV010({job,schema,target:undefined,locale:"zh-CN"});
 assert.ok(refreshed.fields.find(x=>x.key==="map_2").options.some(x=>x.value===definition.fieldId));
 const duplicate=await action.execute(request("开户银行","另一个名称","STRING"),ctx());
 assert.equal(duplicate.ok,false);
 assert.equal(duplicate.error.code,"OBJECT_EXTENSION_ALREADY_EXISTS_REMAP_FIELD");
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
