#!/usr/bin/env node
/** B9l: local, owner-attested de-identified enterprise topology proof.
 * Native Chrome Designer Save -> genuine App CAS FileStore -> fresh readonly Viewer.
 * Never send raw fixture to GitHub Actions/artifacts; CI uses synthetic geometry.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {once} from "node:events";
import {readFile} from "node:fs/promises";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {chromium} from "playwright";
import {loadAuthorizedEnterpriseFixtureV010} from "./diagram-enterprise-fixture-intake-b9k.mjs";

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
assert.ok(chrome,"B9l requires an actual Chrome executable");
const tmp=mkdtempSync(join(tmpdir(),"evo-b9l-saved-positive-"));
const file=join(tmp,"projection-store.json");
const fixturePath=process.env.EVO_B9L_FIXTURE_PATH;
assert.ok(fixturePath,"B9l requires a local, external fixture path");
const {summary:intake,preview2d:graph}=await loadAuthorizedEnterpriseFixtureV010(fixturePath,{
 authorized:process.env.EVO_B9K_AUTHORIZED_QA==="1"
});
// Single open/read/parse/validation; never reopen untrusted pathname after consent gate.
const removeNodeId=process.env.EVO_B9L_REMOVE_NODE_ID;
assert.ok(removeNodeId,"B9l requires explicit removal candidate ID");
const removeNode=graph.nodes.find(node=>node.id===removeNodeId);
assert.ok(removeNode,"B9l selected node must exist in the checked enterprise topology");
const camera={scale:.8,
 translateX:650-.8*(removeNode.x+removeNode.width/2),
 translateY:320-.8*(removeNode.y+removeNode.height/2)};

const repository=createMemoryBusinessDefinitionRepositoryV010();
const bundle=ledgerRuntimeBaselineBundleV010;
const revision=repository.createDraft({
 enterpriseId:"ent-b9l",definitionId:"ledger:b9l",kind:bundle.definition.kind,
 title:bundle.definition.title,
 payload:{...structuredClone(bundle.definition.payload),preview2d:graph},
 projectionGallery:structuredClone(bundle.definition.projectionGallery),
 actor:{actorType:"HUMAN",subjectId:"owner-b9l"},
 recordedAt:"2026-10-11T00:00:00.000Z",
 origin:{type:"TEMPLATE_COPY",sourceRef:"test:b9l-legitimate-preview2d"}
});
const id={enterpriseId:revision.enterpriseId,definitionId:revision.definitionId,
 definitionRevision:revision.revision,
 projectionId:revision.projectionGallery.primaryProjectionId};
const ctx={
 contractVersion:"0.1.0",
 principal:{contractVersion:"0.1.0",subjectId:"owner-b9l",
  actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"session-b9l"},
 scope:{contractVersion:"0.1.0",enterpriseId:"ent-b9l"},
 context:{contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-b9l"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
   contextId:"enterprise:ent-b9l",enterpriseId:"ent-b9l"}},
 locale:"en-US",correlationId:"b9l-real-browser"
};
const request=(code,values)=>({
 contractVersion:"0.1.0",type:"command",
 command:{code,inputVersion:"0.1.0"},values,
 sourceInteractionId:"B9l-saved-real-browser",actionId:code,requiresConfirmation:false
});
let denySaves=false;
const open=()=>{
 const projectionStore=createFileDefinitionProjectionStoreV010(file);
 const source=createEnterpriseDefinitionProjectionArtifactSourceV010(repository,projectionStore);
 const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository,projectionStore,source,
  sessions:createMemoryDefinitionProjectionSessionStoreV010(),
  canManageEnterpriseContext:()=>true,
  authorizeProjectionSave:async()=>{if(denySaves)throw Error("B9x simulated deny");},
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
assert.equal(initial.result.nodes.length,graph.nodes.length);
const edgePaths=[{edgeId:graph.edges[0].id,pathKind:"orthogonal"}];
const save=(current,token,hiddenNodeIds)=>current.save.execute(request(SAVE,{
 ...id,expectedRevision:revision.revision,expectedWriteToken:token,
 operation:{type:"SAVE_PROJECTION_VIEW"},
 viewState:{
  hiddenNodeIds,edgePaths,
  placements:initial.result.nodes.filter(n=>!hiddenNodeIds.includes(n.id))
   .map(n=>({nodeId:n.id,x:n.x,y:n.y})),
  camera
 }
}),ctx);
const committed=await save(first,"0",[]);
assert.equal(committed.ok,true,committed.error?.message);
assert.equal(first.projectionStore.getVersion(id),1,
 "genuine App Handler must commit the selected enterprise topology");

const reopened=open(); // Fresh file Store and genuine independent handlers for HTTP GETs
assert.equal(reopened.projectionStore.getVersion(id),1);
const editorPage=createEnterpriseDefinitionProjectionEditorPageV010({
 ...id,title:"B9l isolated enterprise topology",locale:"en-US",
 initialCamera:camera
});
const viewerPage=createEnterpriseDefinition2dPreviewPageV010({
 ...id,title:"B9l readonly enterprise topology",locale:"en-US",
 camera
});
const pageHTML=(mode)=>{
 const viewer=mode==="viewer";
 const definition=viewer?viewerPage:editorPage;
 // An attested de-identified label is still untrusted text. Do not permit a
 // literal "</script>" from graph JSON to terminate the inline bootstrap.
 const safeInlineJson=JSON.stringify(definition).replaceAll("<","\\u003c");
 const shell=viewer
  ?renderDiagramWorkspacePageShellToHtmlV010(definition)
  :renderDiagramEditorPageShellToHtmlV010(definition);
 const modulePath=viewer
  ?"/dist/vendor/eidos/src/diagram/workspace.js"
  :"/dist/vendor/eidos/src/diagram/surface.js";
 const mountName=viewer?"mountDiagramWorkspacePageV010":"mountDiagramEditorPageV010";
 return '<!doctype html><html><head><meta charset="utf-8">'
  +'<style>html,body{margin:0}main{width:min(100%,1250px);height:760px}'
  +'[data-eidos-diagram-editor]{height:750px!important;min-height:560px}</style></head>'
  +'<body><main id="root">'+shell+'</main>'
  +'<script>window.__definition='+safeInlineJson
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
// B9l: native node selection also invokes the real App selection-read
// command. Never fake/404 it just because B9l only needed initial GET.
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
 const snapshot=async(mode,viewport={width:1280,height:820})=>{
  const tab=await browser.newPage({viewport});
  try{
   await tab.goto(address+"/"+mode,{waitUntil:"load"});
   await tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
    {timeout:30000});
   const result=await tab.evaluate(()=>{
    const svg=document.querySelector("svg[data-eidos-diagram-congested-count]");
    const canvasWidth=svg?.getBoundingClientRect().width??0;
    const canvas=document.querySelector("[data-eidos-diagram-canvas]");
    const clip=canvas?.getBoundingClientRect();
    const visibleCanvasWidth=clip?.width??0;
    const canvasOverflow=canvas?getComputedStyle(canvas).overflow:"missing";
    const routes=[...document.querySelectorAll("[data-eidos-diagram-route-congested]")];
    const note=document.querySelector("[data-eidos-diagram-congestion-summary]");
    return {canvasWidth,visibleCanvasWidth,canvasOverflow,
     documentWidth:document.documentElement.scrollWidth,
     viewportWidth:document.documentElement.clientWidth,
     count:Number(svg?.getAttribute("data-eidos-diagram-congested-count")),
     actualPaths:routes.length,
     missingAria:routes.filter(item=>!item.getAttribute("aria-label")).length,
     note:note?.getAttribute("data-eidos-diagram-congestion-summary")??null,
     noteRole:note?.getAttribute("role")??null,
     pointerEvents:note?.style.pointerEvents??null,
     saveButtons:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]
      .filter(button=>button.textContent.trim()==="Save projection").length,
     errors:window.__errors};
   });
   assert.deepEqual(result.errors,[],mode+" B9l real Chrome errors");
   assert.ok(result.canvasWidth>0,mode+" SVG must render at viewport width "+viewport.width);
   assert.ok(result.visibleCanvasWidth>0,
    mode+" must expose a non-zero clipped canvas");
   assert.equal(result.canvasOverflow,"hidden",
    mode+" world-sized SVG stage must remain inside a clipped canvas");
   assert.ok(result.visibleCanvasWidth<=viewport.width+2,
    mode+" visible canvas width must not exceed browser viewport");
   if(viewport.width<=390){
    assert.ok(result.documentWidth<=result.viewportWidth+2,
     mode+" mobile document must not overflow horizontally");
   }
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
 assert.equal(savedDesigner.count,savedViewer.count,
  "fresh readonly Viewer must match persisted Designer's honest congestion count");
 assert.equal(savedViewer.saveButtons,0);
 // B9l: real browser pointer clicks + real Save projection button,
 // NOT a Node test invoking the Handler for the second CAS commit.
 const nativeSaveTab=await browser.newPage({viewport:{width:1280,height:820}});
 try{
  await nativeSaveTab.goto(address+"/designer",{waitUntil:"load"});
  await nativeSaveTab.waitForFunction(()=>
   document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
   {timeout:30000});
  const blocker=nativeSaveTab.locator(
   "[data-eidos-diagram-node="+JSON.stringify(removeNodeId)+"]");
  const rect=await blocker.boundingBox();
  assert.ok(rect&&rect.width>12&&rect.height>12,
   "B9l chosen node must have a hit-testable Chrome rectangle");
  await nativeSaveTab.mouse.click(rect.x+rect.width*.87,rect.y+rect.height*.5);
  const hide=nativeSaveTab.locator("[data-eidos-diagram-local-hide]");
  await hide.click();
  await nativeSaveTab.waitForFunction(target=>
   ![...document.querySelectorAll("[data-eidos-diagram-node]")]
     .some(element=>element.getAttribute("data-eidos-diagram-node")===target),
   removeNodeId,{timeout:30000});
  assert.equal(reopened.projectionStore.getVersion(id),1,
   "B9l local hide must NOT persist merely because real Chrome redraws");
  const saveButton=nativeSaveTab.locator("[data-eidos-diagram-toolbar] button")
   .filter({hasText:"Save projection"});
  assert.equal(await saveButton.count(),1);
  await saveButton.click();
  await nativeSaveTab.waitForFunction(()=>
   document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
   {timeout:30000});
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "B9l native Chrome Save button must trigger actual App CAS file commit");
  const browserErrors=await nativeSaveTab.evaluate(()=>window.__errors);
  assert.deepEqual(browserErrors,[],"B9l browser native Save errors");
  console.log("B9L_NATIVE_SAVE_RESULT="+JSON.stringify({
   browser:browser.version(),process:intake.process,
   graphSha256:intake.sha256,initialSavedCongestion:savedDesigner.count,
   versionBeforeNativeSave:1,versionAfterNativeSave:2,
   truePointerSelection:true,trueSaveButton:true,errors:browserErrors,
   warning:"Owner attestation not independently verified; isolated test identity/FileStore, never production DB"
  }));
 }finally{await nativeSaveTab.close()}
 // B9p: a second writer using the previously consumed presentation CAS token
 // must be rejected by the same production Handler/FileStore (no silent overwrite).
 const staleSave=await save(first,"1",[]);
 assert.equal(staleSave.ok,false,"stale save must fail");
 assert.equal(staleSave.error?.code,"DEFINITION_PROJECTION_WRITE_CONFLICT");
 assert.equal(reopened.projectionStore.getVersion(id),2,
  "stale write must not change persisted CAS version");
 const staleRead=await reopened.read.execute(request(READ,id),ctx);
 assert.equal(staleRead.ok,true,"read after conflict succeeds");
 assert.ok(staleRead.result.hiddenNodeIds?.includes(removeNodeId),
  "stale writer must not restore previously hidden projection node");
 console.log("B9P_STALE_CAS_RESULT="+JSON.stringify({
  process:intake.process,staleErrorCode:staleSave.error?.code,
  versionAfterRejectedWrite:2,previousHiddenNodePreserved:true,
  warning:"Isolated test Handler identity/FileStore; no production user conflict tested"
 }));
 // B9x simulated save authorization DENY after real Chrome winner Save.
 denySaves=true;
 try{
  const rejected=await save(reopened,"2",[]);
  assert.equal(rejected.ok,false,"unauthorized synthetic writer must be rejected");
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "permission-denied write must not advance CAS");
  console.log("B9X_PERMISSION_DENIAL_RESULT="+JSON.stringify({
   process:intake.process,denied:true,versionPreserved:2,
   caveat:"Controlled test authorization hook; NOT production enterprise policy"
  }));
 }finally{denySaves=false;}
 const reopenedClearDesigner=await snapshot("designer");
 const reopenedClearViewer=await snapshot("viewer");
 assert.equal(reopenedClearDesigner.count,reopenedClearViewer.count,
  "fresh readonly Viewer and Designer must agree after browser Save");
 const fresh=await reopened.read.execute(request(READ,id),ctx);
 assert.equal(fresh.ok,true,"fresh App read must succeed");
 assert.ok(fresh.result.hiddenNodeIds?.includes(removeNodeId),
  "CAS saved presentation must include the selected ID in hiddenNodeIds");
 assert.ok(fresh.result.nodes.some(node=>node.id===removeNodeId),
  "editor GET includeHidden must retain underlying business node");
 assert.ok(graph.nodes.some(node=>node.id===removeNodeId),
  "the original business preview2d topology remains untouched");
 assert.equal(reopenedClearViewer.saveButtons,0);
 // B9q: same persisted Eidos geometry under actual Chrome window-size changes.
 // These are *emulated viewports*, NOT physical phone/tablet or touch gestures.
 const responsiveChecks=[];
 for(const viewport of [{width:390,height:844},{width:768,height:1024}]){
  const d=await snapshot("designer",viewport);
  const v=await snapshot("viewer",viewport);
  assert.equal(d.count,reopenedClearDesigner.count,
   "responsive designer preserves saved route-congested count");
  assert.equal(v.count,reopenedClearViewer.count,
   "responsive readonly Viewer preserves saved route-congested count");
  assert.equal(v.saveButtons,0,"mobile-size readonly Viewer must not expose Save");
  responsiveChecks.push({
   viewport:viewport.width+"x"+viewport.height,
   editorWorldSvgWidth:Math.round(d.canvasWidth),
   viewerWorldSvgWidth:Math.round(v.canvasWidth),
   editorVisibleCanvasWidth:Math.round(d.visibleCanvasWidth),
   viewerVisibleCanvasWidth:Math.round(v.visibleCanvasWidth),
   editorDocWidth:d.documentWidth,viewerDocWidth:v.documentWidth,
   editorViewportWidth:d.viewportWidth,viewerViewportWidth:v.viewportWidth,
   congestedDesigner:d.count,congestedViewer:v.count,
   viewerReadOnly:true
  });
 }
 console.log("B9Q_RESPONSIVE_CHROME_RESULT="+JSON.stringify({
  process:intake.process,responsiveChecks,chrome:browser.version(),
  caution:"Chrome emulated viewport only; NOT physical mobile/touch/accessibility acceptance"
 }));
 assert.equal(repository.listHistory({
  enterpriseId:id.enterpriseId,definitionId:id.definitionId
 }).length,1,"projection Save must not version the business definition");
 console.log("B9L_ENTERPRISE_CHROME_RESULT="+JSON.stringify({
  browser:browser.version(),firstCASVersion:1,secondCASVersion:2,
  savedDesigner,savedViewer,reopenedClearDesigner,reopenedClearViewer,
  businessDefinitionHistoryCount:1,
  process:intake.process,graphSha256:intake.sha256,
  warning:"Fixture may be synthetic; isolated App Handler/FileStore Chrome proof, NOT customer authorization or production DB"
 }));
}finally{
 await browser?.close();
 server.closeAllConnections?.();server.close();
 rmSync(tmp,{recursive:true,force:true});
}
