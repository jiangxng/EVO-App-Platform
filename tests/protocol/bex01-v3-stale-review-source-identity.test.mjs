import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionActionHandlersV010 } from "../../dist/apps/object-extension/actions.js";
import { OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010 } from "../../dist/apps/object-extension/constants.js";
import { batchUnmappedColumnsV010, batchReviewSourceRevisionV010 } from "../../dist/apps/object-extension/batch-page.js";

const contextId="enterprise-context:bex-v3-stale-draft";
function importJob() {
  return {
    contractVersion:"0.1.0",
    importJobId:"bex-v3-stale-form",
    targetId:"counterparty.subject",
    targetParameters:{relationshipMode:"SUPPLIER"},
    state:"STAGED",
    source:{
      kind:"XLSX",name:"isolated-stale-review.xlsx",
      headers:["编码","待审列甲","待审列乙"],
      rows:[{"编码":"SUP-001","待审列甲":"原值甲","待审列乙":"原值乙"}]
    },
    mapping:[{sourceColumn:"编码",targetFieldId:"code"}],
    mappingOrigin:"HUMAN"
  };
}
function humanContext() {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",
      actorType:"HUMAN",identityProviderId:"test",sessionId:"test"},
    scope:{contractVersion:"0.1.0",enterpriseId:"enterprise-test"},
    context:{contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId,enterpriseId:"enterprise-test"}},
    correlationId:"bex-v3-stale-review-source-proof"
  };
}
function requestCreatedFromOldPage() {
  return {
    contractVersion:"0.1.0",type:"command",
    command:{code:OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010,inputVersion:"0.1.0"},
    actionId:"save-review-draft",sourceInteractionId:"stale-form-test",
    requiresConfirmation:false,
    values:{
      importJobId:"bex-v3-stale-form",batchMode:batchReviewSourceRevisionV010(importJob()),
      batchSubjectType:"__KEEP__",
      choice_0:"__IGNORE__",label_0:"人工决定甲",type_0:"STRING",
      choice_1:"__CREATE__",label_1:"人工决定乙",type_1:"STRING"
    }
  };
}

test("M03: saving an old review form must not apply choice_0 to a different source column after mapping changes",async()=>{
  let job=importJob();
  const initialColumns=batchUnmappedColumnsV010(job);
  assert.deepEqual(initialColumns,["待审列甲","待审列乙"]);
  const captured=[];
  const handlers=createObjectExtensionActionHandlersV010({
    repository:createObjectExtensionRepositoryV010(
      createMemoryEnterpriseResourceRepositoryV010()),
    canManageEnterpriseContext:()=>true,
    getImportJob:(_,id)=>id===job.importJobId?job:undefined,
    getImportableTargets:()=>[],
    saveBatchReviewDraft:input=>{captured.push(input.draft);}
  });
  const save=handlers.find(handler=>
    handler.commandCode===OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010);
  assert.ok(save,"real action handler must exist");

  // Verify fixture and old-form submission are otherwise legitimate.
  const valid=await save.execute(requestCreatedFromOldPage(),humanContext());
  assert.equal(valid.ok,true,JSON.stringify(valid));
  assert.deepEqual(captured[0].columns.map(x=>x.sourceColumn),initialColumns);
  captured.length=0;

  // Another authorized operation maps A after this form was displayed.
  // A becomes unavailable; the remaining index 0 now means B.
  job={...job,mapping:[
    ...job.mapping,{sourceColumn:"待审列甲",targetFieldId:"displayName"}
  ]};
  assert.deepEqual(batchUnmappedColumnsV010(job),["待审列乙"]);
  const authoritativeBefore=structuredClone(job);

  const stale=await save.execute(requestCreatedFromOldPage(),humanContext());
  assert.equal(stale.ok,false,
    "reject stale indexed choices rather than reinterpreting A's choice_0 as B");
  assert.equal(captured.length,0,
    "no unapproved review draft from a stale form may be persisted");
  assert.deepEqual(job,authoritativeBefore,
    "stale rejection must not mutate the authoritative import Job");
});
