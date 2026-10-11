#!/usr/bin/env node
/** B9i: actual Chrome Designer + readonly Enterprise Definition Viewer
 * on one truly App-CAS-saved, positive-congestion file-backed projection.
 * Synthetic legitimate business preview2d, not a test-only GET overlay.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {once} from "node:events";
import {readFile} from "node:fs/promises";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {chromium} from "playwright";

import {createMemoryBusinessDefinitionRepositoryV010} from "../dist/providers/enterprise-context/business-definitions.js";
import {createFileDefinitionProjectionStoreV010} from "../dist/providers/enterprise-context/definition-projection-store.js";
import {createEnterpriseDefinitionProjectionArtifactSourceV010} from "../dist/providers/enterprise-context/definition-projection.js";
import {createMemoryDefinitionProjectionSessionStoreV010} from "../dist/contracts/definition-projection.js";
import {createEnterpriseDefinitionProjectionEditorActionHandlersV010,
 createEnterpriseDefinitionProjectionEditorPageV010} from "../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {createEnterpriseDefinition2dPreviewPageV010,
 createEnterpriseDefinition2dPreviewReadActionV010} from "../dist/apps/eog-2d-viewer/definition-preview.js";
import {renderDiagramEditorPageShellToHtmlV010} from "../dist/vendor/eidos/src/diagram/surface.js";
import {renderDiagramWorkspacePageShellToHtmlV010} from "../dist/vendor/eidos/src/diagram/workspace.js";
import {ledgerRuntimeBaselineBundleV010} from "../dist/apps/template-store/seed-records.js";
import {
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION as READ,
 EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION as SAVE
} from "../dist/apps/eog-2d-designer/package.js";
import {EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION as VIEW} from "../dist/apps/eog-2d-viewer/package.js";

const chrome=process.env.CHROME;
assert.ok(chrome,"B9i requires an actual Chrome executable");
const tmp=mkdtempSync(join(tmpdir(),"evo-b9i-saved-positive-"));
const file=join(tmp,"projection-store.json");
const graph={
 contractVersion:"0.1.0",
 nodes:[
  {id:"crowded-a",kind:"subject",label:"Source",shape:"rounded-rectangle",
   x:20,y:200,width:130,height:64},
  {id:"crowded-b",kind:"subject",label:"Target",shape:"rounded-rectangle",
   x:880,y:200,width:130,height:64},
  ...Array.from({length:23},(_,i)=>({
   id:"block-"+i,kind:"subject",label:"Block "+i,
   shape:"rounded-rectangle",x:180+i*26,y:200,width:58,height:64
  }))
 ],
 edges:[{id:"b9i-business-relation",source:"crowded-a",
  target:"crowded-b",kind:"test",label:"Review required",arrow:"end"}]
};
const repository=createMemoryBusinessDefinitionRepositoryV010();
const bundle=ledgerRuntimeBaselineBundleV010;
const revision=repository.createDraft({
 enterpriseId:"ent-b9i",definitionId:"ledger:b9i",kind:bundle.definition.kind,
 title:bundle.definition.title,
 payload:{...structuredClone(bundle.definition.payload),preview2d:graph},
 projectionGallery:structuredClone(bundle.definition.projectionGallery),
 actor:{actorType:"HUMAN",subjectId:"owner-b9i"},
 recordedAt:"2026-10-11T00:00:00.000Z",
 origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9i-legitimate-preview2d"}
});
const id={enterpriseId:revision.enterpriseId,definitionId:revision.definitionId,
 definitionRevision:revision.revision,
 projectionId:revision.projectionGallery.primaryProjectionId};
const ctx={
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9i",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-b9i"},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9i"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9i"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9i",enterpriseId:"ent-b9i"}},
 locale:"en-US",correlationId:"b9i-real-browser"
};
const request=(code,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code,inputVersion:"0.1.0"},values,
 sourceInteractionId:"B9i-saved-real-browser",actionId:code,requiresConfirmation:false
});
const open=()=>{
 const projectionStore=createFileDefinitionProjectionStoreV010(file);
 const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,projectionStore);
 const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository,projectionStore,source,
  sessions:createMemoryDefinitionProjectionSessionStoreV010(),
  canManageEnterpriseContext:()=>true,
  authorizeProjectionSave:async()=>{},
  locale:()=>"en-US",now:()=>new Date("2026-10-11T00:01:00.000Z")
 });
 return {projectionStore,handlers,
  read:handlers.find(x=>x.commandCode===READ),
  save:handlers.find(x=>x.commandCode===SAVE),
  viewer:createEnterpriseDefinition2dPreviewReadActionV010({source})};
};
const first=open();
const initial=await first.read.execute(request(READ,id),ctx);
assert.equal(initial.ok,true,initial.error?.message);
assert.equal(initial.result.nodes.length,25);
const edgePaths=[{edgeId:"b9i-business-relation",pathKind:"orthogonal"}];
const save=(current,token,hiddenNodeIds)=>current.save.execute(request(SAVE,{
 ...id,expectedRevision:revision.revision,expectedWriteToken:token,
 operation:{type:"SAVE_PROJECTION_VIEW"},
 viewState:{
  hiddenNodeIds,edgePaths,
  placements:initial.result.nodes.filter(n=>!hiddenNodeIds.includes(n.id))
   .map(n=>({nodeId:n.id,x:n.x,y:n.y})),
  camera:{scale:.8,translateX:10,translateY:14}
 }
}),ctx);
const committed=await save(first,"0",[]);
assert.equal(committed.ok,true,committed.error?.message);
assert.equal(first.projectionStore.getVersion(id),1,
 "genuine App Handler must commit the orthogonal 23-obstacle diagram");

const reopened=open(); // Fresh file Store and genuine independent handlers for HTTP GETs
assert.equal(reopened.projectionStore.getVersion(id),1);
const editorPage=createEnterpriseDefinitionProjectionEditorPageV010({
 ...id,title:"B9i persisted crowded business graph",locale:"en-US",
 initialCamera:{scale:.8,translateX:10,translateY:14}
});
const viewerPage=createEnterpriseDefinition2dPreviewPageV010({
 ...id,title:"B9i readonly persisted business graph",locale:"en-US",
 camera:{scale:.8,translateX:10,translateY:14}
});
const pageHTML=(mode)=>{
 const viewer=mode==="viewer";
 const definition=viewer?viewerPage:editorPage;
 const shell=viewer
  ?renderDiagramWorkspacePageShellToHtmlV010(definition)
  :renderDiagramEditorPageShellToHtmlV010(definition);
 const modulePath=viewer
  ?"/dist/vendor/eidos/src/diagram/workspace.js"
  :"/dist/vendor/eidos/src/diagram/surface.js";
 const mountName=viewer?"mountDiagramWorkspacePageV010":"mountDiagramEditorPageV010";
 return '<!doctype html><html><head><meta charset="utf-8">'
  +'<style>html,body{margin:0}main{width:1250px;height:760px}'
  +'[data-eidos-diagram-editor]{height:750px!important;min-height:560px}</style></head>'
  +'<body><main id="root">'+shell+'</main>'
  +'<script>window.__definition='+JSON.stringify(definition)
  +';window.__errors=[];window.addEventListener("error",e=>window.__errors.push(e.message));'
  +'window.addEventListener("unhandledrejection",e=>window.__errors.push(String(e.reason)));'
  +'</script><script type="module">'
  +'import {'+mountName+'} from '+JSON.stringify(modulePath)+';'
  +'const actionHost={async execute(request){const res=await fetch("/action",{method:"POST",'
  +'headers:{"content-type":"application/json"},body:JSON.stringify(request)});'
  +'if(!res.ok)throw Error("HTTP "+res.status);return res.json()}};'
  +'window.__mounted='+mountName+'({definition:window.__definition,'
  +'container:document.getElementById("root"),actionHost});'
  +'</script></body></html>';
};
// B9j: native node selection also invokes the real App selection-read
// command. Never fake/404 it just because B9i only needed initial GET.
const handlers=new Map([
 ...reopened.handlers.map(handler=>[handler.commandCode,handler]),
 [VIEW,reopened.viewer]
]);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1");
  if(url.pathname==="/designer"||url.pathname==="/viewer"){
   res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
   res.end(pageHTML(url.pathname.slice(1)));return;
  }
  if(url.pathname==="/action"&&req.method==="POST"){
   let raw="";for await (const chunk of req)raw+=chunk;
   const call=JSON.parse(raw);
   const h=handlers.get(call.command?.code);
   if(!h){res.writeHead(400);res.end("Unknown command");return}
   const value=await h.execute(call,ctx);
   res.writeHead(200,{"content-type":"application/json"});
   res.end(JSON.stringify(value));return;
  }
  if(url.pathname.startsWith("/dist/")){
   const base=resolve(process.cwd(),"dist");
   const abs=resolve(process.cwd(),"."+url.pathname);
   if(!abs.startsWith(base+"/")){res.writeHead(403);res.end("Forbidden");return}
   const bytes=await readFile(abs);
   res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});
   res.end(bytes);return;
  }
  res.writeHead(404);res.end("Not found");
 }catch(error){res.writeHead(500);res.end(String(error?.stack??error))}
});
let browser;
try{
 server.listen(0,"127.0.0.1");await once(server,"listening");
 const address="http://127.0.0.1:"+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:chrome,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const snapshot=async(mode)=>{
  const tab=await browser.newPage({viewport:{width:1280,height:820}});
  try{
   await tab.goto(address+"/"+mode,{waitUntil:"load"});
   await tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
    {timeout:30000});
   const result=await tab.evaluate(()=>{
    const svg=document.querySelector("svg[data-eidos-diagram-congested-count]");
    const routes=[...document.querySelectorAll("[data-eidos-diagram-route-congested]")];
    const note=document.querySelector("[data-eidos-diagram-congestion-summary]");
    return {count:Number(svg?.getAttribute("data-eidos-diagram-congested-count")),
     actualPaths:routes.length,
     missingAria:routes.filter(item=>!item.getAttribute("aria-label")).length,
     note:note?.getAttribute("data-eidos-diagram-congestion-summary")??null,
     noteRole:note?.getAttribute("role")??null,
     pointerEvents:note?.style.pointerEvents??null,
     saveButtons:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]
      .filter(button=>button.textContent.trim()==="Save projection").length,
     errors:window.__errors};
   });
   assert.deepEqual(result.errors,[],mode+" B9i real Chrome errors");
   assert.equal(result.count,result.actualPaths,mode+" congestion DOM hit count");
   assert.equal(result.missingAria,0);
   assert.equal(result.note,result.count>0?String(result.count):null);
   assert.equal(result.noteRole,result.count>0?"note":null);
   assert.equal(result.pointerEvents,result.count>0?"none":null);
   return result;
  }finally{await tab.close()}
 };
 const savedDesigner=await snapshot("designer");
 const savedViewer=await snapshot("viewer");
 assert.equal(savedDesigner.count,1,
  "B9i genuinely persisted 23-blocker orthogonal graph must expose congestion in Chrome Designer");
 assert.equal(savedViewer.count,1,
  "B9i actual Chrome readonly Viewer must report same saved positive congestion");
 assert.equal(savedViewer.saveButtons,0);
 // B9j: real browser pointer clicks + real Save projection button,
 // NOT a Node test invoking the Handler for the second CAS commit.
 const nativeSaveTab=await browser.newPage({viewport:{width:1280,height:820}});
 try{
  await nativeSaveTab.goto(address+"/designer",{waitUntil:"load"});
  await nativeSaveTab.waitForFunction(()=>
   document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
   {timeout:30000});
  const blocker=nativeSaveTab.locator("[data-eidos-diagram-node='block-22']");
  const rect=await blocker.boundingBox();
  assert.ok(rect&&rect.width>12&&rect.height>12,
   "B9j last budget blocker must be visible for real native mouse");
  // This blocker overlaps #21 near its left side. Click well inside its
  // right nonoverlapping portion so hit testing is exercised honestly.
  await nativeSaveTab.mouse.click(rect.x+rect.width*.87,rect.y+rect.height*.5);
  const hide=nativeSaveTab.locator("[data-eidos-diagram-local-hide]");
  await hide.click();
  await nativeSaveTab.waitForFunction(()=>
   document.querySelector("svg[data-eidos-diagram-congested-count]")
    ?.getAttribute("data-eidos-diagram-congested-count")==="0",
   {timeout:30000});
  assert.equal(reopened.projectionStore.getVersion(id),1,
   "B9j local hide must NOT persist merely because real Chrome redraws");
  const saveButton=nativeSaveTab.locator("[data-eidos-diagram-toolbar] button")
   .filter({hasText:"Save projection"});
  assert.equal(await saveButton.count(),1);
  await saveButton.click();
  await nativeSaveTab.waitForFunction(()=>
   document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
   {timeout:30000});
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "B9j native Chrome Save button must trigger actual App CAS file commit");
  const browserErrors=await nativeSaveTab.evaluate(()=>window.__errors);
  assert.deepEqual(browserErrors,[],"B9j browser native Save errors");
  console.log("B9J_NATIVE_SAVE_RESULT="+JSON.stringify({
   browser:browser.version(),initialSavedCongestion:1,
   localHiddenCount:0,versionBeforeNativeSave:1,versionAfterNativeSave:2,
   truePointerSelection:true,trueSaveButton:true,errors:browserErrors,
   warning:"Browser native UI + real App FileStore; synthetic preview2d, not customer production deployment"
  }));
 }finally{await nativeSaveTab.close()}
 const reopenedClearDesigner=await snapshot("designer");
 const reopenedClearViewer=await snapshot("viewer");
 assert.equal(reopenedClearDesigner.count,0,
  "saving hidden 23rd blocker must remove congestion in fresh Chrome Designer");
 assert.equal(reopenedClearViewer.count,0,
  "saving hidden 23rd blocker must remove congestion in fresh readonly Viewer");
 assert.equal(reopenedClearViewer.saveButtons,0);
 assert.equal(repository.listHistory({
  enterpriseId:id.enterpriseId,definitionId:id.definitionId
 }).length,1,"projection Save must not version the business definition");
 console.log("B9I_SAVED_POSITIVE_CHROME_RESULT="+JSON.stringify({
  browser:browser.version(),firstCASVersion:1,secondCASVersion:2,
  savedDesigner,savedViewer,reopenedClearDesigner,reopenedClearViewer,
  businessDefinitionHistoryCount:1,
  warning:"Genuine App Handler/FileStore and true Chrome DOM, but synthetic legitimate preview2d and NOT customer production DB"
 }));
}finally{
 await browser?.close();
 server.closeAllConnections?.();server.close();
 rmSync(tmp,{recursive:true,force:true});
}
