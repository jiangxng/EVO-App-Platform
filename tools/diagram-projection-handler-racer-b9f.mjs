#!/usr/bin/env node
// B9f child process: real independent App Handler, real file projection CAS.
import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../dist/providers/enterprise-context/business-definitions.js";
import {
  createFileDefinitionProjectionStoreV010
} from "../dist/providers/enterprise-context/definition-projection-store.js";
import {
  createEnterpriseDefinitionProjectionArtifactSourceV010
} from "../dist/providers/enterprise-context/definition-projection.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010
} from "../dist/contracts/definition-projection.js";
import {
  ledgerRuntimeBaselineBundleV010
} from "../dist/apps/template-store/seed-records.js";
import {
  createEnterpriseDefinitionProjectionEditorActionHandlersV010
} from "../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION as READ,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION as SAVE
} from "../dist/apps/eog-2d-designer/package.js";

const [file,name]=process.argv.slice(2);
if(!file||!["A","B"].includes(name))
 throw Error("B9F_CHILD_ARGUMENT_INVALID");
const request=(code,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code,inputVersion:"0.1.0"},values,
 actionId:code,sourceInteractionId:"b9f-"+name,
 requiresConfirmation:false
});
const context={
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9f",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-"+name},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9f"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9f"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9f",enterpriseId:"ent-b9f"}},
 locale:"en-US",correlationId:"B9f-real-handler-"+name
};
const repository=createMemoryBusinessDefinitionRepositoryV010();
const bundle=ledgerRuntimeBaselineBundleV010;
const revision=repository.createDraft({
 enterpriseId:"ent-b9f",definitionId:"ledger:b9f",
 kind:bundle.definition.kind,title:bundle.definition.title,
 payload:structuredClone(bundle.definition.payload),
 projectionGallery:structuredClone(bundle.definition.projectionGallery),
 actor:{actorType:"HUMAN",subjectId:"owner-b9f"},
 recordedAt:"2026-10-11T00:00:00.000Z",
 origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9f"}
});
const target={
 enterpriseId:revision.enterpriseId,
 definitionId:revision.definitionId,
 definitionRevision:revision.revision,
 projectionId:revision.projectionGallery.primaryProjectionId
};
const projectionStore=createFileDefinitionProjectionStoreV010(file);
const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,projectionStore);
const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
 repository,projectionStore,source,
 sessions:createMemoryDefinitionProjectionSessionStoreV010(),
 canManageEnterpriseContext:()=>true,
 authorizeProjectionSave:async()=>{},
 locale:()=>"en-US",
 now:()=>new Date("2026-10-11T00:02:00.000Z")
});
const read=handlers.find(h=>h.commandCode===READ);
const save=handlers.find(h=>h.commandCode===SAVE);
if(!read||!save)throw Error("B9F_REAL_APP_HANDLERS_MISSING");
const initial=await read.execute(request(READ,target),context);
if(!initial.ok)throw Error("B9F_READ_FAILED: "+initial.error?.message);
const delta=name==="A"?101:202;
const changed=await save.execute(request(SAVE,{
 ...target,
 expectedRevision:revision.revision,expectedWriteToken:"0",
 operation:{type:"SAVE_PROJECTION_VIEW"},
 viewState:{
  placements:initial.result.nodes.map(node=>({nodeId:node.id,x:node.x,y:node.y})),
  camera:{scale:1,translateX:delta,translateY:0}
 }
}),context);
console.log(JSON.stringify({
 name,delta,ok:changed.ok,
 ...(changed.ok?{revision:changed.result.revision}:{
  errorCode:changed.error?.code,errorMessage:changed.error?.message}),
 storeVersion:projectionStore.getVersion(target),
 businessRevisionCount:repository.listHistory({
  enterpriseId:target.enterpriseId,definitionId:target.definitionId
 }).length
}));
