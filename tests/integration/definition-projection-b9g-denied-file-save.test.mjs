import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {createMemoryBusinessDefinitionRepositoryV010} from "../../dist/providers/enterprise-context/business-definitions.js";
import {createFileDefinitionProjectionStoreV010} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import {createEnterpriseDefinitionProjectionArtifactSourceV010} from "../../dist/providers/enterprise-context/definition-projection.js";
import {createMemoryDefinitionProjectionSessionStoreV010} from "../../dist/contracts/definition-projection.js";
import {createEnterpriseDefinitionProjectionEditorActionHandlersV010} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {createEnterpriseDefinition2dPreviewReadActionV010} from "../../dist/apps/eog-2d-viewer/definition-preview.js";
import {ledgerRuntimeBaselineBundleV010} from "../../dist/apps/template-store/seed-records.js";
import {
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION as READ,
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION as SAVE
} from "../../dist/apps/eog-2d-designer/package.js";
import {EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION as VIEW} from "../../dist/apps/eog-2d-viewer/package.js";

const request=(code,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code,inputVersion:"0.1.0"},values,
 actionId:code,sourceInteractionId:"b9g-authorization",requiresConfirmation:false
});
const context={
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9g",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-b9g"},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9g"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9g"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9g",enterpriseId:"ent-b9g"}},
 locale:"zh-CN",correlationId:"b9g-authorization"
};

test("B9g denied App Save may not create or overwrite file-backed projection, and Viewer sees only permitted commit",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"evo-b9g-denied-"));
 const file=join(dir,"projection-gallery.json");
 try{
  const repository=createMemoryBusinessDefinitionRepositoryV010();
  const bundle=ledgerRuntimeBaselineBundleV010;
  const revision=repository.createDraft({
   enterpriseId:"ent-b9g",definitionId:"ledger:b9g",
   kind:bundle.definition.kind,title:bundle.definition.title,
   payload:structuredClone(bundle.definition.payload),
   projectionGallery:structuredClone(bundle.definition.projectionGallery),
   actor:{actorType:"HUMAN",subjectId:"owner-b9g"},
   recordedAt:"2026-10-11T00:00:00.000Z",
   origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9g"}
  });
  const id={enterpriseId:revision.enterpriseId,definitionId:revision.definitionId,
   definitionRevision:revision.revision,
   projectionId:revision.projectionGallery.primaryProjectionId};
  let deniedCalls=0;
  const store=createFileDefinitionProjectionStoreV010(file);
  const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,store);
  const handlers=(denied)=>createEnterpriseDefinitionProjectionEditorActionHandlersV010({
   repository,projectionStore:store,source,
   sessions:createMemoryDefinitionProjectionSessionStoreV010(),
   canManageEnterpriseContext:()=>true,
   authorizeProjectionSave:async()=>{if(denied){deniedCalls++;throw Error("B9G_TEST_AUTH_DENIED")}},
   locale:()=>"zh-CN",now:()=>new Date("2026-10-11T00:01:00.000Z")
  });
  const permitted=handlers(false),blocked=handlers(true);
  const read=permitted.find(h=>h.commandCode===READ);
  const allowedSave=permitted.find(h=>h.commandCode===SAVE);
  const deniedSave=blocked.find(h=>h.commandCode===SAVE);
  assert.ok(read&&allowedSave&&deniedSave);
  const loaded=await read.execute(request(READ,id),context);
  assert.equal(loaded.ok,true,loaded.error?.message);
  const hidden=loaded.result.nodes[0].id;
  const viewState=(hiddenNodeIds)=>({
   hiddenNodeIds,
   placements:loaded.result.nodes
    .filter(n=>!hiddenNodeIds.includes(n.id))
    .map(n=>({nodeId:n.id,x:n.x,y:n.y})),
   camera:{scale:1,translateX:42,translateY:0}
  });
  const commit=(token,view,handler)=>handler.execute(request(SAVE,{
   ...id,expectedRevision:revision.revision,
   expectedWriteToken:token,operation:{type:"SAVE_PROJECTION_VIEW"},
   viewState:view
  }),context);
  const forbiddenInitial=await commit("0",viewState([hidden]),deniedSave);
  assert.equal(forbiddenInitial.ok,false,"denied App authorization must not report successful Save");
  assert.equal(deniedCalls,1,"denial hook must actually have been consulted");
  assert.equal(store.getVersion(id),0,"denied Save must not create first file-store version");
  assert.equal(existsSync(file),false,"denied save must not create projection file");

  const permittedSave=await commit("0",viewState([hidden]),allowedSave);
  assert.equal(permittedSave.ok,true,permittedSave.error?.message);
  assert.equal(store.getVersion(id),1);

  const forbiddenOverwrite=await commit("1",viewState([]),deniedSave);
  assert.equal(forbiddenOverwrite.ok,false,"denied overwrite must remain blocked");
  assert.equal(deniedCalls,2);
  const reopened=createFileDefinitionProjectionStoreV010(file);
  assert.equal(reopened.getVersion(id),1);
  assert.ok(reopened.get(id).projections.find(p=>p.projectionId===id.projectionId)
   .view.hiddenNodeIds.includes(hidden));

  const viewer=createEnterpriseDefinition2dPreviewReadActionV010({
   source:createEnterpriseDefinitionProjectionArtifactSourceV010(repository,reopened)
  });
  const readonly=await viewer.execute(request(VIEW,id),context);
  assert.equal(readonly.ok,true,readonly.error?.message);
  assert.equal(readonly.result.nodes.some(n=>n.id===hidden),false,
   "readonly Viewer must see only the authorized hidden-state commit");
  assert.equal(reopened.getVersion(id),1);
  assert.equal(repository.listHistory({
   enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }).length,1,"denied or permitted projection Save cannot create business definition revision");
 }finally{rmSync(dir,{recursive:true,force:true})}
});
