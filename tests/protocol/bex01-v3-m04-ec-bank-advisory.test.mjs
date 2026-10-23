import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createDataImportServiceV010 } from "../../dist/apps/data-import/service.js";
import { createDataImportActionHandlersV010 } from "../../dist/apps/data-import/actions.js";
import { DATA_IMPORT_STAGE_FILE_COMMAND_V010 } from "../../dist/apps/data-import/constants.js";
import { createCounterpartyEffectiveObjectSchemaV010 } from "../../dist/apps/counterparty/foundation-object.js";
import { createDataImportMappingPageV010 } from "../../dist/apps/data-import/page.js";

// Synthetic test data only: customer original workbook and bank IDs unavailable.
const contextId="enterprise-context:m04-ec-ambiguous-bank";
function actor() {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",actorType:"HUMAN",
      identityProviderId:"test",sessionId:"test"},
    scope:{contractVersion:"0.1.0",enterpriseId:"test-enterprise"},
    context:{contractVersion:"0.1.0",activeContext:{
      contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,
      enterpriseId:"test-enterprise"}},
    correlationId:"m04-ec-ambiguous-bank"
  };
}
function schemaWithDistinctBankIds() {
  const schema=createCounterpartyEffectiveObjectSchemaV010({locale:"zh-CN"});
  const example=schema.fields.find(x=>x.fieldId==="displayName");
  assert.ok(example);
  const fields=[
    ["test.bank.receiving","开户银行","客户回款用途"],
    ["test.bank.settlement","开户银行","供应商付款用途"],
    ["test.memo","内部备忘","人工可复用的来源备注"]
  ].map(([fieldId,label,description])=>({
    ...example,fieldId,slotId:"counterparty.supplier-profile",
    semanticType:fieldId,source:"ENTERPRISE_EXTENSION",
    resolvedLabel:label,resolvedDescription:description,
    label:{default:label},description:{default:description},
    surfaces:["IMPORT"],required:false,readOnly:false,
    readable:true,writable:true
  }));
  return {...schema,fields:[...schema.fields,...fields]};
}

test("M04: EC high-confidence advice must not preselect one of two same-name bank IDs on actual Host stage",async()=>{
  const schema=schemaWithDistinctBankIds();
  const target={
    contractVersion:"0.1.0",targetId:"counterparty.subject",
    objectType:schema.objectType,ownerPackageId:schema.ownerPackageId,
    label:{default:"Suppliers"},describe:()=>schema,
    validateRow:()=>{throw Error("STAGE_MUST_NOT_DRY_RUN");},
    commitRow:()=>{throw Error("STAGE_MUST_NOT_COMMIT");}
  };
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createDataImportRepositoryV010(resources);
  const service=createDataImportServiceV010({repository,targets:[target]});
  let calls=0;
  const experienceAdvisor={
    recommend:async()=>{calls++;return [
      {sourceColumn:"开户银行",targetFieldId:"test.bank.receiving",
        confidence:0.99,supportCount:3,conflictCount:0,
        supportingRecordIds:["test.known.bank"],rationale:"prior Human evidence",
        advisoryOnly:true},
      {sourceColumn:"供应联系备注",targetFieldId:"test.memo",
        confidence:0.95,supportCount:2,conflictCount:0,
        supportingRecordIds:["test.known.memo"],rationale:"prior Human evidence",
        advisoryOnly:true}
    ];},
    recordSuccessful:async()=>{throw Error("STAGE_MUST_NOT_LEARN");}
  };
  const handler=createDataImportActionHandlersV010({
    service,repository,targets:[target],experienceAdvisor,
    canManageEnterpriseContext:()=>true,
    idFactory:()=>"m04-ec-bank-stage",
    now:()=>new Date("2026-10-19T00:00:00.000Z")
  }).find(x=>x.commandCode===DATA_IMPORT_STAGE_FILE_COMMAND_V010);
  assert.ok(handler);
  const headers=["往来编码","往来名称","主体类型","开户银行","供应联系备注"];
  const csv=[headers.join(","),["SUP-E01","Synthetic Supplier E01",
    "ORGANIZATION","Synthetic Bank","Synthetic Note"].join(",")].join("\n");
  const file={
    name:"synthetic-ec-ambiguous-bank.csv",mediaType:"text/csv",
    size:Buffer.byteLength(csv),contentBase64:Buffer.from(csv).toString("base64")
  };
  const result=await handler.execute({
    contractVersion:"0.1.0",type:"command",
    command:{code:DATA_IMPORT_STAGE_FILE_COMMAND_V010,inputVersion:"0.1.0"},
    actionId:"stage",sourceInteractionId:"m04-test",requiresConfirmation:false,
    values:{targetId:"counterparty.subject",file}
  },actor());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(calls,1,"experience recommendation entry was exercised");

  const job=repository.get(contextId,"m04-ec-bank-stage");
  assert.ok(job);
  assert.equal(job.state,"STAGED");
  assert.equal(job.mappingOrigin,"DETERMINISTIC");
  assert.deepEqual(job.source.headers,headers);
  assert.equal(job.source.rows[0]["开户银行"],"Synthetic Bank");
  assert.equal(job.mapping.some(m=>m.sourceColumn==="开户银行"),false,
    "advisoryOnly EC evidence cannot become an approved same-label bank mapping");
  assert.ok(job.mapping.some(m=>m.sourceColumn==="往来编码"&&m.targetFieldId==="code"));
  const positive=job.mapping.find(m=>m.sourceColumn==="供应联系备注");
  assert.equal(positive?.targetFieldId,"test.memo",
    "EC must still suggest an unambiguous, history-supported alternative");
  assert.equal(positive?.advisory?.source,"EXPERIENCE_COMPILER");
  assert.equal(job.dryRun,undefined);
  assert.equal(job.receipt,undefined);

  const page=createDataImportMappingPageV010({
    job,schema,locale:"zh-CN",canCreateExtension:true
  });
  assert.equal(page.fields.find(x=>x.key==="map_3").initialValue,"__PENDING__");
  const row=page.reviewGroups.find(x=>x.primaryFieldKey==="map_3");
  assert.equal(row?.reviewStatus?.key,"attention");
  assert.equal(row?.defaultExpanded,true);
  const field=page.fields.find(x=>x.key==="candidateEvidence_3");
  assert.ok(field);
  for(const id of ["test.bank.receiving","test.bank.settlement"]){
    assert.ok(field.initialValue.includes(id));
  }
});
