import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createMemoryBusinessDefinitionRepositoryV010 } from "../../dist/providers/enterprise-context/business-definitions.js";
import { createFileDefinitionProjectionStoreV010 } from "../../dist/providers/enterprise-context/definition-projection-store.js";
import { createEnterpriseDefinitionProjectionArtifactSourceV010 } from "../../dist/providers/enterprise-context/definition-projection.js";
import { createMemoryDefinitionProjectionSessionStoreV010 } from "../../dist/contracts/definition-projection.js";
import { ledgerRuntimeBaselineBundleV010 } from "../../dist/apps/template-store/seed-records.js";
import { createEnterpriseDefinitionProjectionEditorActionHandlersV010 } from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import { createEnterpriseDefinition2dPreviewReadActionV010 } from "../../dist/apps/eog-2d-viewer/definition-preview.js";
import {
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION as READ,
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION as SAVE
} from "../../dist/apps/eog-2d-designer/package.js";
import { EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION as VIEW } from "../../dist/apps/eog-2d-viewer/package.js";
import { validateDiagramEditorStateV010 } from "../../dist/vendor/eidos/src/diagram/surface.js";

const request=(command,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code:command,inputVersion:"0.1.0"},values,
 sourceInteractionId:"B9d-file-restart",actionId:command,
 requiresConfirmation:false
});
const ctx=()=>({
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9d",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-b9d"},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9d"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9d"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9d",enterpriseId:"ent-b9d"}},
 locale:"zh-CN",correlationId:"B9d-file-restart"
});

test("B9d genuine App CAS save survives file projection Store reopening and readonly Viewer GET",async()=>{
 const scratch=mkdtempSync(join(tmpdir(),"evo-b9d-projection-"));
 try{
  const file=join(scratch,"enterprise-projections.json");
  const repository=createMemoryBusinessDefinitionRepositoryV010();
  const bundle=ledgerRuntimeBaselineBundleV010;
  const revision=repository.createDraft({
   enterpriseId:"ent-b9d",definitionId:"ledger:b9d",
   kind:bundle.definition.kind,title:bundle.definition.title,
   payload:structuredClone(bundle.definition.payload),
   projectionGallery:structuredClone(bundle.definition.projectionGallery),
   actor:{actorType:"HUMAN",subjectId:"owner-b9d"},
   recordedAt:"2026-10-11T00:00:00.000Z",
   origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9d"}
  });
  const identity={enterpriseId:revision.enterpriseId,
   definitionId:revision.definitionId,definitionRevision:revision.revision,
   projectionId:revision.projectionGallery.primaryProjectionId};
  const beforeBusiness=structuredClone(repository.getLatest({
   enterpriseId:identity.enterpriseId,definitionId:identity.definitionId
  }));
  const open=()=>{
   const projectionStore=createFileDefinitionProjectionStoreV010(file);
   const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,projectionStore);
   const sessions=createMemoryDefinitionProjectionSessionStoreV010();
   const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,projectionStore,source,sessions,
    canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
    locale:()=>"zh-CN",now:()=>new Date("2026-10-11T00:01:00.000Z")
   });
   const handler=code=>handlers.find(h=>h.commandCode===code);
   assert.ok(handler(READ)&&handler(SAVE),"real App editor read and save handlers exist");
   return {projectionStore,source,handler,
    viewer:createEnterpriseDefinition2dPreviewReadActionV010({source})};
  };
  const first=open();
  assert.equal(first.projectionStore.getVersion(identity),0);
  const initial=await first.handler(READ).execute(request(READ,identity),ctx());
  assert.equal(initial.ok,true,initial.error?.message);
  const edge=initial.result.edges[0];
  assert.ok(edge,"original business graph must have an edge");
  const hidden=initial.result.nodes.find(n=>n.id!==edge.source&&n.id!==edge.target);
  assert.ok(hidden,"need a visible nonincident node to hide without removing the styled edge");
  const path={edgeId:edge.id,pathKind:"rounded-orthogonal",
   sourceAnchor:"right",targetAnchor:"left",
   waypoints:[{x:-60,y:120},{x:90,y:120}]};
  const saved=await first.handler(SAVE).execute(request(SAVE,{
   ...identity,expectedRevision:revision.revision,expectedWriteToken:"0",
   operation:{type:"SAVE_PROJECTION_VIEW"},
   viewState:{
    hiddenNodeIds:[hidden.id],edgePaths:[path],
    placements:initial.result.nodes.filter(n=>n.id!==hidden.id).map(n=>({
     nodeId:n.id,x:n.x,y:n.y
    })),
    camera:{scale:1,translateX:25,translateY:-12}
   }
  }),ctx());
  assert.equal(saved.ok,true,saved.error?.message);
  assert.equal(first.projectionStore.getVersion(identity),1,
   "real first App CAS save must commit once");
  assert.deepEqual(repository.getLatest({
   enterpriseId:identity.enterpriseId,definitionId:identity.definitionId
  }),beforeBusiness,"projection save must not mutate definition business revision");

  // Independent store object recreated from actual file bytes, not a cloned
  // in-memory instance. The business-definition fixture itself stays stable.
  const second=open();
  assert.equal(second.projectionStore.getVersion(identity),1,
   "reopened file-backed projection store must preserve CAS write token");
  const reread=await second.handler(READ).execute(request(READ,identity),ctx());
  assert.equal(reread.ok,true,reread.error?.message);
  assert.equal(reread.result.writeToken,"1");
  assert.ok(reread.result.hiddenNodeIds?.includes(hidden.id));
  const reopenedEdge=reread.result.edges.find(e=>e.id===edge.id);
  assert.ok(reopenedEdge,"saved edge must stay visible in independent editor read");
  assert.equal(reopenedEdge.pathKind,path.pathKind);
  assert.deepEqual(reopenedEdge.waypoints,path.waypoints);
  assert.equal(reopenedEdge.source,edge.source);
  assert.equal(reopenedEdge.target,edge.target);
  assert.equal(validateDiagramEditorStateV010(reread.result).ok,true,
   "real Eidos state validator must accept reopened App projection");

  const readonly=await second.viewer.execute(request(VIEW,identity),ctx());
  assert.equal(readonly.ok,true,readonly.error?.message);
  const viewerEdge=readonly.result.edges.find(e=>e.id===edge.id);
  assert.ok(viewerEdge,"readonly Viewer must load the saved relation");
  assert.equal(viewerEdge.pathKind,path.pathKind);
  assert.deepEqual(viewerEdge.waypoints,path.waypoints);
  assert.equal(viewerEdge.source,edge.source);
  assert.equal(viewerEdge.target,edge.target);
  assert.ok(!readonly.result.nodes.some(n=>n.id===hidden.id),
   "Viewer must apply the same saved node visibility");
  assert.equal(validateDiagramEditorStateV010(readonly.result).ok,true);
  assert.equal(second.projectionStore.getVersion(identity),1,
   "readonly Viewer cannot write the store");

  const stale=await second.handler(SAVE).execute(request(SAVE,{
   ...identity,expectedRevision:revision.revision,expectedWriteToken:"0",
   operation:{type:"SAVE_PROJECTION_VIEW"},
   viewState:{hiddenNodeIds:[],placements:initial.result.nodes.map(n=>({
    nodeId:n.id,x:n.x,y:n.y
   })),camera:{scale:1,translateX:0,translateY:0}}
  }),ctx());
  assert.equal(stale.ok,false,"reopened file CAS must block stale writer");
  assert.equal(second.projectionStore.getVersion(identity),1);
  assert.equal(repository.listHistory({
   enterpriseId:identity.enterpriseId,definitionId:identity.definitionId
  }).length,1,"projection file writes cannot produce business definition revisions");
  const third=open();
  assert.equal(third.projectionStore.getVersion(identity),1);
  assert.ok(third.source.get(identity)?.diagram2d.edges.some(e=>
   e.id===edge.id&&e.pathKind===path.pathKind));
 }finally{
  rmSync(scratch,{recursive:true,force:true});
 }
});
