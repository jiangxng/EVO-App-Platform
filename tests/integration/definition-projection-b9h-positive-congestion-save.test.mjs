import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
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
import {diagramEdgeGeometryV010} from "../../dist/vendor/eidos/src/diagram/edge-paths.js";
import {validateDiagramEditorStateV010} from "../../dist/vendor/eidos/src/diagram/surface.js";

const request=(code,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code,inputVersion:"0.1.0"},values,
 actionId:code,sourceInteractionId:"b9h-positive-persistence",
 requiresConfirmation:false
});
const ctx={
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9h",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-b9h"},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9h"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9h"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9h",enterpriseId:"ent-b9h"}},
 locale:"en-US",correlationId:"b9h-positive-persistence"
};
const graph={
 contractVersion:"0.1.0",
 nodes:[
  {id:"crowded-a",kind:"subject",label:"Source",
   shape:"rounded-rectangle",x:20,y:200,width:130,height:64},
  {id:"crowded-b",kind:"subject",label:"Target",
   shape:"rounded-rectangle",x:880,y:200,width:130,height:64},
  ...Array.from({length:23},(_,i)=>({
   id:"block-"+i,kind:"subject",label:"Block "+i,
   shape:"rounded-rectangle",x:180+i*26,y:200,width:58,height:64
  }))
 ],
 edges:[{id:"real-business-relation",source:"crowded-a",
  target:"crowded-b",kind:"test",label:"Review required",arrow:"end"}]
};
const geometry=(state)=>{
 const edge=state.edges.find(e=>e.id==="real-business-relation");
 assert.ok(edge,"real business edge must survive projection");
 const a=state.nodes.find(n=>n.id===edge.source),b=state.nodes.find(n=>n.id===edge.target);
 assert.ok(a&&b,"real endpoint nodes must remain visible");
 const start={x:a.x+a.width,y:a.y+a.height/2};
 const end={x:b.x,y:b.y+b.height/2};
 const obstacles=state.nodes.filter(n=>n.id!==a.id&&n.id!==b.id)
  .map(n=>({x:n.x,y:n.y,width:n.width,height:n.height}));
 return {count:obstacles.length,result:diagramEdgeGeometryV010(
  start,end,edge.pathKind??"straight",
  {obstacles,forceRouteWhenEmpty:true})};
};

test("B9h positive congested edge is actually App CAS-saved and reappears in file-reopened Designer/Viewer, then clears on saved hide",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"evo-b9h-positive-"));
 const file=join(dir,"projections.json");
 try{
  const repository=createMemoryBusinessDefinitionRepositoryV010();
  const bundle=ledgerRuntimeBaselineBundleV010;
  // The platform's supported business definition preview2d contract;
  // not a test-only overlay applied by an artifact Source on GET.
  const revision=repository.createDraft({
   enterpriseId:"ent-b9h",definitionId:"ledger:b9h",
   kind:bundle.definition.kind,title:bundle.definition.title,
   payload:{...structuredClone(bundle.definition.payload),preview2d:structuredClone(graph)},
   projectionGallery:structuredClone(bundle.definition.projectionGallery),
   actor:{actorType:"HUMAN",subjectId:"owner-b9h"},
   recordedAt:"2026-10-11T00:00:00.000Z",
   origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9h-legitimate-preview2d"}
  });
  const id={enterpriseId:revision.enterpriseId,
   definitionId:revision.definitionId,definitionRevision:revision.revision,
   projectionId:revision.projectionGallery.primaryProjectionId};
  const initialDefinition=structuredClone(repository.getLatest({
   enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }));
  const open=()=>{
   const projectionStore=createFileDefinitionProjectionStoreV010(file);
   const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,projectionStore);
   const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,projectionStore,source,
    sessions:createMemoryDefinitionProjectionSessionStoreV010(),
    canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
    locale:()=>"en-US",now:()=>new Date("2026-10-11T00:01:00.000Z")
   });
   return {projectionStore,source,
    read:handlers.find(h=>h.commandCode===READ),
    save:handlers.find(h=>h.commandCode===SAVE),
    viewer:createEnterpriseDefinition2dPreviewReadActionV010({source})};
  };
  const first=open();
  assert.ok(first.read&&first.save);
  const original=await first.read.execute(request(READ,id),ctx);
  assert.equal(original.ok,true,original.error?.message);
  assert.equal(original.result.nodes.length,25);
  assert.equal(original.result.edges.length,1);
  assert.equal(geometry(original.result).count,23);
  assert.equal(geometry(original.result).result.congested,undefined,
   "legacy no pathKind should initially remain straight");
  const route={edgeId:"real-business-relation",pathKind:"orthogonal"};
  const viewState=hiddenIds=>({
   hiddenNodeIds:hiddenIds,
   edgePaths:[route],
   placements:original.result.nodes.filter(n=>!hiddenIds.includes(n.id))
    .map(n=>({nodeId:n.id,x:n.x,y:n.y})),
   camera:{scale:1,translateX:15,translateY:-8}
  });
  const save=(api,token,hiddenIds)=>api.save.execute(request(SAVE,{
   ...id,expectedRevision:revision.revision,expectedWriteToken:token,
   operation:{type:"SAVE_PROJECTION_VIEW"},viewState:viewState(hiddenIds)
  }),ctx);
  const positive=await save(first,"0",[]);
  assert.equal(positive.ok,true,positive.error?.message);
  assert.equal(first.projectionStore.getVersion(id),1);
  assert.deepEqual(repository.getLatest({
   enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }),initialDefinition,"projection Save must never mutate the business source definition");
  const independent=open();
  assert.equal(independent.projectionStore.getVersion(id),1);
  const reopened=await independent.read.execute(request(READ,id),ctx);
  assert.equal(reopened.ok,true,reopened.error?.message);
  assert.equal(validateDiagramEditorStateV010(reopened.result).ok,true);
  assert.equal(reopened.result.edges[0].pathKind,"orthogonal");
  assert.equal(geometry(reopened.result).count,23);
  assert.equal(geometry(reopened.result).result.congested,true,
   "genuinely saved 23-obstacle automatic orthogonal route must refuse unsafe detour");
  const readonly=await independent.viewer.execute(request(VIEW,id),ctx);
  assert.equal(readonly.ok,true,readonly.error?.message);
  assert.equal(validateDiagramEditorStateV010(readonly.result).ok,true);
  assert.equal(readonly.result.edges[0].pathKind,"orthogonal");
  assert.equal(geometry(readonly.result).count,23);
  assert.equal(geometry(readonly.result).result.congested,true,
   "file-reopened actual readonly Viewer must receive the POSITIVE budget-congested graph");
  assert.equal(independent.projectionStore.getVersion(id),1,
   "a readonly Viewer cannot mutate saved projection CAS");

  const cleared=await save(independent,"1",["block-22"]);
  assert.equal(cleared.ok,true,cleared.error?.message);
  const final=open();
  assert.equal(final.projectionStore.getVersion(id),2);
  const after=await final.viewer.execute(request(VIEW,id),ctx);
  assert.equal(after.ok,true,after.error?.message);
  assert.equal(after.result.nodes.some(n=>n.id==="block-22"),false);
  assert.equal(geometry(after.result).count,22);
  assert.equal(geometry(after.result).result.congested,undefined,
   "persisted removal of 23rd blocker must clear congestion without loosening budget");
  assert.equal(repository.listHistory({
   enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }).length,1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
