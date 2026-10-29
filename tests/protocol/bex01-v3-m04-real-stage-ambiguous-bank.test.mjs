import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createDataImportServiceV010 } from "../../dist/apps/data-import/service.js";
import { createDataImportActionHandlersV010 } from "../../dist/apps/data-import/actions.js";
import { DATA_IMPORT_STAGE_FILE_COMMAND_V010 } from "../../dist/apps/data-import/constants.js";
import { createDataImportMappingPageV010 } from "../../dist/apps/data-import/page.js";
import { syntheticV3WorkbookV010 } from "../../tools/bex01/synthetic-v3-xlsx.mjs";

/** M04 synthetic Host action fixture; NEVER the original customer Excel/Job. */
const contextId="enterprise-context:m04-bank-stage-proof";
const bankDefs=[
  {fieldId:"test.bank.receiving",description:"客户回款用途"},
  {fieldId:"test.bank.settlement",description:"供应商付款用途"}
];
function principalContext() {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",
      actorType:"HUMAN",identityProviderId:"test",sessionId:"test"},
    scope:{contractVersion:"0.1.0",enterpriseId:"test-enterprise"},
    context:{contractVersion:"0.1.0",activeContext:{
      contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,
      enterpriseId:"test-enterprise"
    }},
    correlationId:"synthetic-bank-stage-proof"
  };
}

test("M04: actual XLSX stage Host keeps two same-label enterprise bank fields unresolved and source unchanged",async()=>{
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const counterparties=createCounterpartyRepositoryV010(resources);
  const roles=createCounterpartyRoleRepositoryV010(resources,counterparties);
  const extensions=createObjectExtensionRepositoryV010(resources);
  const extensionValues=createObjectExtensionValueRepositoryV010(resources);

  for(const [i,{fieldId,description}] of bankDefs.entries()){
    extensions.save({
      contextId,actorSubjectId:"owner",recordedAt:"2026-10-19T00:00:00Z",
      definition:{
        contractVersion:"0.1.0",extensionId:"test.m04."+i,
        targetObjectType:"counterparty.subject",
        targetSlot:"counterparty.supplier-profile",
        namespace:"enterprise.counterparty",
        fieldId,semanticType:"test.m04.bank."+i,
        valueType:"STRING",label:{default:"开户银行"},
        description:{default:description},required:false,order:800+i,
        applicability:{relationshipRoles:["SUPPLIER"]},
        surfaces:["DETAIL","EDIT","IMPORT"],
        importable:true,exportable:false
      }
    });
  }
  const target=createCounterpartyImportTargetV010({
    resources,repository:counterparties,roleRepository:roles,
    extensionRepository:extensions,extensionValueRepository:extensionValues
  });
  const repository=createDataImportRepositoryV010(resources);
  const service=createDataImportServiceV010({repository,targets:[target]});
  const handlers=createDataImportActionHandlersV010({
    service,repository,targets:[target],
    canManageEnterpriseContext:()=>true,
    idFactory:()=>"m04-actual-stage-synthetic-only",
    now:()=>new Date("2026-10-19T00:00:00.000Z")
  });
  const stage=handlers.find(x=>x.commandCode===DATA_IMPORT_STAGE_FILE_COMMAND_V010);
  assert.ok(stage);

  const workbook=syntheticV3WorkbookV010();
  assert.equal(workbook.synthetic,true);
  assert.equal(workbook.rows.length,172);
  assert.equal(workbook.headers.length,22);
  const result=await stage.execute({
    contractVersion:"0.1.0",type:"command",
    command:{code:DATA_IMPORT_STAGE_FILE_COMMAND_V010,inputVersion:"0.1.0"},
    actionId:"stage",sourceInteractionId:"synthetic-m04",requiresConfirmation:false,
    values:{
      targetId:"counterparty.subject",parameter__relationshipMode:"SUPPLIER",
      file:{name:"synthetic-bank-stage.xlsx",
        mediaType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size:workbook.bytes.length,contentBase64:workbook.bytes.toString("base64")}
    }
  },principalContext());
  assert.equal(result.ok,true,JSON.stringify(result));

  const job=repository.get(contextId,"m04-actual-stage-synthetic-only");
  assert.ok(job);
  assert.equal(job.state,"STAGED");
  assert.equal(job.mappingOrigin,"DETERMINISTIC");
  assert.equal(job.targetParameters.relationshipMode,"SUPPLIER");
  assert.equal(job.source.kind,"XLSX");
  assert.deepEqual(job.source.headers,workbook.headers);
  assert.deepEqual(job.source.rows,workbook.rows);
  assert.equal(job.mapping.some(m=>m.sourceColumn==="开户银行"),false,
    "an ambiguous bank label cannot be persisted as an initial mapping");
  for(const [column,fieldId] of [
    ["往来编码","code"],["往来名称","displayName"],["主体类型","subjectType"]
  ]) {
    assert.ok(job.mapping.some(m=>m.sourceColumn===column&&m.targetFieldId===fieldId));
  }
  assert.equal(job.dryRun,undefined,"staging is not an automatic dry run");
  assert.equal(job.receipt,undefined,"staging does not commit supplier records");
  assert.equal(counterparties.list(contextId).length,0);
  assert.equal(extensions.list(contextId,"counterparty.subject").length,2,
    "staging must not create or approve new schema fields");

  const schema=target.describe({
    contextId,parameters:{relationshipMode:"SUPPLIER"},locale:"zh-CN"
  });
  const bankFields=schema.fields.filter(f=>f.resolvedLabel==="开户银行");
  assert.deepEqual(bankFields.map(f=>f.fieldId).sort(),
    bankDefs.map(f=>f.fieldId).sort());
  const page=createDataImportMappingPageV010({job,schema,locale:"zh-CN",
    canCreateExtension:true});
  const bankIndex=workbook.headers.indexOf("开户银行");
  const bankSelect=page.fields.find(f=>f.key==="map_"+bankIndex);
  assert.ok(bankSelect);
  assert.equal(bankSelect.initialValue,"__PENDING__",
    "existing Human mapping view must expose ambiguity, never claim approved bank target");
  const choices=bankSelect.options;
  for(const {fieldId,description} of bankDefs){
    assert.ok(choices.some(choice=>choice.label.includes(fieldId)
      && choice.label.includes(description)),
      "same-name bank candidates must have in-context purpose evidence");
  }
  const reviewRow=page.reviewGroups.find(g=>
    g.primaryFieldKey==="map_"+bankIndex);
  assert.ok(reviewRow,"the actual /map review row must remain available");
  assert.equal(reviewRow.reviewStatus.key,"attention",
    "duplicate bank candidates require Human attention");
  assert.deepEqual(reviewRow.detailFieldKeys,[],
    "V3 shows source samples directly without an extra row disclosure");
  for(const index of [164,168,171]){
    assert.equal(job.source.rows[index]["主体类型"],"",
      "synthetic row "+(index+1)+" must remain unresolved for Human correction");
  }
});
