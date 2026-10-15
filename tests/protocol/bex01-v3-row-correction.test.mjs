import test from "node:test";
import assert from "node:assert/strict";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createDataImportServiceV010 } from "../../dist/apps/data-import/service.js";
import { createDataImportActionHandlersV010 } from "../../dist/apps/data-import/actions.js";
import { createDataImportReviewPageV010 } from "../../dist/apps/data-import/page.js";
import { createDataImportRowCorrectionPageV010 } from "../../dist/apps/data-import/row-correction-page.js";
import { dataImportRowCorrectionRevisionV010 } from "../../dist/apps/data-import/row-correction.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { DATA_IMPORT_ROW_CORRECT_COMMAND_V010 } from "../../dist/apps/data-import/constants.js";

const contextId = "enterprise-context:repair";
function setup() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources, repository: counterparties,
    roleRepository: createCounterpartyRoleRepositoryV010(resources, counterparties),
    extensionRepository: createObjectExtensionRepositoryV010(resources),
    extensionValueRepository: createObjectExtensionValueRepositoryV010(resources)
  });
  const repository = createDataImportRepositoryV010(resources);
  const service = createDataImportServiceV010({ repository, targets: [target] });
  const source = { kind: "ROWS", headers: ["往来编码", "往来名称", "主体类型"],
    rows: [
      {"往来编码":"S001","往来名称":"公司甲","主体类型":""},
      {"往来编码":"S002","往来名称":"公司乙","主体类型":""},
      {"往来编码":"S003","往来名称":"公司丙","主体类型":""}
    ]};
  service.stage({
    contextId, importJobId: "repair-1", targetId: "counterparty.subject",
    targetParameters: { relationshipMode: "SUPPLIER" },
    source, mapping: [
      {sourceColumn:"往来编码",targetFieldId:"code"},
      {sourceColumn:"往来名称",targetFieldId:"displayName"},
      {sourceColumn:"主体类型",targetFieldId:"subjectType"}
    ],
    appliedRecipeId:"previously-confirmed",
    mappingOrigin:"RECIPE", actorSubjectId:"owner",
    recordedAt:"2026-10-15T00:00:00Z"
  });
  service.dryRun({contextId,importJobId:"repair-1",
    actorSubjectId:"owner",recordedAt:"2026-10-15T00:00:01Z"});
  return {target,repository,service,counterparties};
}
function correct(service, job, rowNumber, mode, value, revision) {
  return service.correctRow({
    contextId, importJobId:job.importJobId, rowNumber,
    sourceColumn:"主体类型", expectedRevision:revision ??
      dataImportRowCorrectionRevisionV010(job,rowNumber,"主体类型"),
    mode, ...(value !== undefined ? {value}:{}),
    actorSubjectId:"owner", recordedAt:"2026-10-15T01:00:00Z"
  });
}
function context(actorType="HUMAN") {
  return { contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",actorType,
      identityProviderId:"test",sessionId:"session"},
    context:{contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:owner",ownerSubjectId:"owner"},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,
        enterpriseId:"tenant-repair"}},
    scope:{contractVersion:"0.1.0",enterpriseId:"tenant-repair"},
    correlationId:"row-repair"
  };
}
function request(values) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code:DATA_IMPORT_ROW_CORRECT_COMMAND_V010,inputVersion:"0.1.0"},
    values, sourceInteractionId:"test-row-edit",actionId:"save-row-correction",
    requiresConfirmation:false};
}

test("source remains immutable, correction invalidates old dry-run, revalidation is required", () => {
  const {target,repository,service,counterparties}=setup();
  const start=repository.get(contextId,"repair-1");
  const before=structuredClone(start.source);
  assert.equal(start.state,"DRY_RUN_FAILED");
  assert.equal(start.dryRun.invalidRows,3);
  const page=createDataImportReviewPageV010({job:start,
    schema:target.describe({contextId,parameters:start.targetParameters,locale:"zh-CN"}),
    locale:"zh-CN"});
  assert.equal(page.items.find(x=>x.id==="row:1").primaryAction.label,"修正本行问题");
  assert.equal(page.items.find(x=>x.id==="row:1").primaryAction.route,
    "/data-import/jobs/repair-1/fix/1/2");
  let patched=correct(service,start,1,"SET","ORGANIZATION");
  assert.equal(patched.state,"STAGED");
  assert.equal(patched.dryRun,undefined);
  assert.equal(patched.rowCorrections[0].actorSubjectId,"owner");
  assert.deepEqual(patched.source,before);
  assert.equal(patched.appliedRecipeId,"previously-confirmed");
  assert.throws(()=>service.commit({contextId,importJobId:"repair-1",
    actorSubjectId:"owner",recordedAt:"2026-10-15T01:00:02Z"}),/DATA_IMPORT_DRY_RUN_REQUIRED/);
  let rerun=service.dryRun({contextId,importJobId:"repair-1",
    actorSubjectId:"owner",recordedAt:"2026-10-15T01:00:03Z"});
  assert.equal(rerun.dryRun.invalidRows,2);
  assert.equal(rerun.dryRun.rows[0].prepared.values.subjectType,"ORGANIZATION");
  assert.equal(counterparties.list(contextId).length,0);
  const restored=correct(service,rerun,1,"REVERT");
  assert.deepEqual(restored.source,before);
  assert.equal(restored.rowCorrections?.length??0,0);
  assert.equal(restored.state,"STAGED");
  const again=service.dryRun({contextId,importJobId:"repair-1",
    actorSubjectId:"owner",recordedAt:"2026-10-15T01:00:04Z"});
  assert.equal(again.dryRun.invalidRows,3);
});

test("different principals, stale revision, bad enums and committed jobs fail closed", async () => {
  const {repository,service,target}=setup();
  let original=repository.get(contextId,"repair-1");
  const token=dataImportRowCorrectionRevisionV010(original,1,"主体类型");
  assert.throws(()=>correct(service,original,1,"SET","SUPPLIER"),/CORRECTION_ENUM_INVALID/);
  assert.throws(()=>correct(service,original,99,"SET","ORGANIZATION"),/CORRECTION_SOURCE_NOT_FOUND/);
  const handlers=createDataImportActionHandlersV010({
    service,repository,targets:[target],idFactory:()=>"noop",
    canManageEnterpriseContext:()=>false
  });
  const handler=handlers.find(x=>x.commandCode===DATA_IMPORT_ROW_CORRECT_COMMAND_V010);
  const params={importJobId:"repair-1",rowNumber:1,sourceColumn:"主体类型",
    expectedRevision:token,mode:"SET",value:"ORGANIZATION"};
  const denied=await handler.execute(request(params),context());
  assert.equal(denied.ok,false);
  const aiHandlers=createDataImportActionHandlersV010({
    service,repository,targets:[target],idFactory:()=>"noop",
    canManageEnterpriseContext:()=>true
  });
  const action=aiHandlers.find(x=>x.commandCode===DATA_IMPORT_ROW_CORRECT_COMMAND_V010);
  assert.equal((await action.execute(request(params),context("AI"))).ok,false);
  assert.equal((await action.execute(request(params),context())).ok,true);
  const later=repository.get(contextId,"repair-1");
  assert.equal(later.dryRun.invalidRows,2);
  assert.throws(()=>correct(service,later,1,"SET","PERSON",token),/CORRECTION_STALE/);
  const form=createDataImportRowCorrectionPageV010({
    job:later,schema:target.describe({contextId,parameters:later.targetParameters,
      locale:"zh-CN"}),rowNumber:1,columnIndex:2,locale:"zh-CN"
  });
  assert.equal(form.id,"evo-data-import.row-correct");
  assert.match(form.metadata.description,/Excel 原值：（空）/);
  assert.match(form.metadata.description,/已更正：ORGANIZATION/);
  assert.ok(form.fields.find(x=>x.key==="mode").options.some(x=>x.value==="REVERT"));
  assert.ok(form.fields.find(x=>x.key==="value").options.some(x=>x.value==="PERSON"));
  // Committed state is terminal even if a client carries an old edit token.
  repository.save({contextId,job:{...later,state:"COMMITTED"},
    actorSubjectId:"owner",recordedAt:"2026-10-15T01:10:00Z"});
  const terminal=repository.get(contextId,"repair-1");
  assert.throws(()=>correct(service,terminal,1,"SET","PERSON"),/ALREADY_COMMITTED/);
});
