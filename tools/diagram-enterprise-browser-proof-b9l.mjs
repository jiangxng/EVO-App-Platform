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
import {analyzeCorridorRiskV010} from "./diagram-corridor-risk-b9o.mjs";

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
 }catch{res.writeHead(500);res.end("Internal error")}
});
let browser;
try{
 server.listen(0,"127.0.0.1");await once(server,"listening");
 const address="http://127.0.0.1:"+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:chrome,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 // B10h malformed local test request must not echo implementation or fixture.
 const malformed=await fetch(address+"/action",{
  method:"POST",headers:{"content-type":"application/json"},
  body:"{malformed"
 });
 assert.equal(malformed.status,500);
 assert.equal(await malformed.text(),"Internal error",
  "B10h local CI action server errors must not leak stack traces");
 const snapshot=async(mode,viewport={width:1280,height:820})=>{
  const tab=await browser.newPage({viewport});
  try{
   await tab.goto(address+"/"+mode,{waitUntil:"load"});
   await tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
    {timeout:30000});
   if(mode==="viewer" && viewport.width===390 &&
      process.env.EVO_B10E_SYNTHETIC_VISUAL==="1" &&
      process.env.CI==="true" &&
      graph.nodes.every(node=>node.label.startsWith("Synthetic")) &&
      graph.edges.every(edge=>!edge.label || edge.label.startsWith("Synthetic"))){
     await tab.screenshot({
      path:join(process.env.RUNNER_TEMP??tmp,"b10e-synthetic-viewer-"+intake.process+".png"),
      fullPage:true
     });
   }
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
     probeExecuted:window.__b10fRan===true,
     errorCount:window.__errors.length};
   });
   assert.equal(result.errorCount,0,mode+" B9l real Chrome error count");
   assert.equal(result.probeExecuted,false,"B10f HTML-like labels must not execute script");
   assert.ok(result.canvasWidth>0,mode+" SVG must render at viewport width "+viewport.width);
   assert.ok(result.visibleCanvasWidth>0,
    mode+" must expose a non-zero clipped canvas");
   assert.equal(result.canvasOverflow,"hidden",
    mode+" world-sized SVG stage must remain inside a clipped canvas");
   assert.ok(result.visibleCanvasWidth<=viewport.width+2,
    mode+" visible canvas width must not exceed browser viewport");
   if(viewport.width<=414){
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
 // B10d: straight-corridor proxy is diagnostic, never a true router output.
 const proxy=analyzeCorridorRiskV010(graph);
 const savedDesigner=await snapshot("designer");
 const savedViewer=await snapshot("viewer");
 assert.equal(reopened.projectionStore.getVersion(id),1,
  "B9y opening saved readonly Viewer and Designer must never advance CAS");
 assert.equal(savedDesigner.count,savedViewer.count,
  "fresh readonly Viewer must match persisted Designer's honest congestion count");
 assert.equal(savedViewer.saveButtons,0);
 console.log("B10D_ROUTING_EVIDENCE_RESULT="+JSON.stringify({
  process:intake.process,routeCongestedActualChrome:savedViewer.count,
  corridorRiskProxy:proxy.corridorsAboveBudget,proxyBands:proxy.corridorRiskBands,
  exactMatchNotRequired:true,
  warning:"Diagnostic straight corridor proxy is NOT actual Eidos A* route congestion"
 }));
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
  const browserErrorCount=await nativeSaveTab.evaluate(()=>window.__errors.length);
  assert.equal(browserErrorCount,0,"B9l browser native Save errors");
  console.log("B9L_NATIVE_SAVE_RESULT="+JSON.stringify({
   browser:browser.version(),process:intake.process,
   graphSha256:intake.sha256,initialSavedCongestion:savedDesigner.count,
   versionBeforeNativeSave:1,versionAfterNativeSave:2,
   truePointerSelection:true,trueSaveButton:true,errorCount:browserErrorCount,
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
 // B10c duplicate independent read must be stable and must not change the CAS.
 const preReadToken=reopened.projectionStore.getVersion(id);
 const readAgain=await open().read.execute(request(READ,id),ctx);
 assert.equal(readAgain.ok,true,"independent freshly constructed Store handler GET");
 assert.equal(reopened.projectionStore.getVersion(id),preReadToken,
  "cold re-open must not create presentation versions");
 assert.deepEqual(
  [...(readAgain.result.hiddenNodeIds??[])].sort(),
  [...(staleRead.result.hiddenNodeIds??[])].sort(),
  "fresh Store instance must see same hidden presentation identifiers");
 console.log("B10C_COLD_STORE_READ_RESULT="+JSON.stringify({
  process:intake.process,independentStoreObject:true,casPreserved:preReadToken,
  hiddenStateMatches:true,warning:"Same local temporary disk, not production database restart"
 }));
 const fresh=await reopened.read.execute(request(READ,id),ctx);
 assert.equal(fresh.ok,true,"fresh App read must succeed");
 assert.ok(fresh.result.hiddenNodeIds?.includes(removeNodeId),
  "CAS saved presentation must include the selected ID in hiddenNodeIds");
 assert.ok(fresh.result.nodes.some(node=>node.id===removeNodeId),
  "editor GET includeHidden must retain underlying business node");
 // Business relation direction and identity cannot be altered by hiding a node.
 const sourceTopology=graph.edges.map(edge=>[edge.id,edge.source,edge.target,edge.kind])
  .sort((a,b)=>a[0].localeCompare(b[0],"en"));
 const savedTopology=fresh.result.edges.map(edge=>[edge.id,edge.source,edge.target,edge.kind])
  .sort((a,b)=>a[0].localeCompare(b[0],"en"));
 assert.deepEqual(savedTopology,sourceTopology,
  "B9z projection edit must not change real business relation endpoints");
 console.log("B9Z_RELATION_INTEGRITY_RESULT="+JSON.stringify({
  process:intake.process,relationsChecked:sourceTopology.length,identical:true,
  warning:"Synthetic topology verification, not actual enterprise semantics"
 }));
 assert.ok(graph.nodes.some(node=>node.id===removeNodeId),
  "the original business preview2d topology remains untouched");
 assert.equal(reopenedClearViewer.saveButtons,0);
 // B9q: same persisted Eidos geometry under actual Chrome window-size changes.
 // These are *emulated viewports*, NOT physical phone/tablet or touch gestures.
 const responsiveChecks=[];
 for(const viewport of [{width:320,height:700},{width:360,height:780},{width:390,height:844},{width:414,height:896},{width:768,height:1024}]){
  const d=await snapshot("designer",viewport);
  const v=await snapshot("viewer",viewport);
  assert.equal(d.count,reopenedClearDesigner.count,
   "responsive designer preserves saved route-congested count");
  assert.equal(v.count,reopenedClearViewer.count,
   "responsive readonly Viewer preserves saved route-congested count");
  assert.equal(v.saveButtons,0,"mobile-size readonly Viewer must not expose Save");
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "B9y readonly Viewer navigation and resizing never saves presentation");
  assert.ok(d.documentWidth<=viewport.width+2 && v.documentWidth<=viewport.width+2,
   "B10a neither Designer nor readonly Viewer may cause page horizontal overflow");
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
 // B10b: a real Chrome wheel event while in readonly Viewer must not Save.
 const wheelTab=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await wheelTab.goto(address+"/viewer",{waitUntil:"load"});
  await wheelTab.waitForFunction(()=>
   document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.");
  await wheelTab.mouse.move(180,330);
  await wheelTab.mouse.wheel(0,-180);
  await wheelTab.waitForTimeout(80);
  const wheel=await wheelTab.evaluate(()=>({
   errorsCount:window.__errors.length,
   viewerSave:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]
    .filter(b=>b.textContent.trim()==="Save projection").length
  }));
  assert.equal(wheel.errorsCount,0,"Viewer wheel may not throw");
  assert.equal(wheel.viewerSave,0,"Viewer wheel must not reveal Save");
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "Viewer wheel navigation must not persist a projection");
  console.log("B10B_READONLY_WHEEL_RESULT="+JSON.stringify({
   process:intake.process,physicalBrowserWheelEvent:true,casPreserved:2,
   caveat:"Chrome synthetic wheel, NOT physical trackpad or two-finger gestures"
  }));
 }finally{await wheelTab.close();}
 // B11c: real Chrome keyboard events on the readonly Viewer cannot write.
 const keyTab=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await keyTab.goto(address+"/viewer",{waitUntil:"load"});
  await keyTab.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.");
  await keyTab.keyboard.press("Tab");
  await keyTab.keyboard.press("Escape");
  const k=await keyTab.evaluate(()=>({
   errorCount:window.__errors.length,
   saveButtons:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]
    .filter(x=>x.textContent.trim()==="Save projection").length
  }));
  assert.equal(k.errorCount,0);
  assert.equal(k.saveButtons,0);
  assert.equal(reopened.projectionStore.getVersion(id),2,
   "B11c keyboard-only readonly browsing cannot write CAS");
  console.log("B11C_KEYBOARD_READONLY_RESULT="+JSON.stringify({
   process:intake.process,tabAndEscape:true,casAfter:2,
   caveat:"Chrome keyboard smoke, not screen reader or WCAG assessment"
  }));
 }finally{await keyTab.close();}
 // B11d: two independent readonly Chrome tabs see one saved projection.
 const tabs=await Promise.all([
  browser.newPage({viewport:{width:390,height:844}}),
  browser.newPage({viewport:{width:768,height:1024}})
 ]);
 try{
  const results=await Promise.all(tabs.map(async t=>{
   await t.goto(address+"/viewer",{waitUntil:"load"});
   await t.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.");
   return t.evaluate(()=>({
    count:Number(document.querySelector("svg[data-eidos-diagram-congested-count]")?.getAttribute("data-eidos-diagram-congested-count")),
    errors:window.__errors.length,
    saveButtons:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]
     .filter(x=>x.textContent.trim()==="Save projection").length
   }));
  }));
  assert.equal(results[0].count,results[1].count);
  for(const r of results){assert.equal(r.errors,0);assert.equal(r.saveButtons,0)}
  assert.equal(reopened.projectionStore.getVersion(id),2,"B11d simultaneous viewer tabs do not write");
  console.log("B11D_MULTI_VIEWER_RESULT="+JSON.stringify({
   process:intake.process,tabs:2,congestionConsistent:true,casPreserved:2,
   caveat:"two tabs in one Chrome process, not true multi-user/tenant concurrency"
  }));
 }finally{await Promise.all(tabs.map(t=>t.close()))}
 // B11e: real Chrome network reload of readonly Viewer, not only new client mount.
 const reloadTab=await browser.newPage({viewport:{width:414,height:896}});
 try{
  await reloadTab.goto(address+"/viewer",{waitUntil:"load"});
  await reloadTab.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.");
  await reloadTab.reload({waitUntil:"load"});
  await reloadTab.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.");
  const view=await reloadTab.evaluate(()=>({
   errors:window.__errors.length,congested:Number(document.querySelector("svg[data-eidos-diagram-congested-count]")?.getAttribute("data-eidos-diagram-congested-count")),
   documentWidth:document.documentElement.scrollWidth
  }));
  assert.equal(view.errors,0);
  assert.equal(view.congested,reopenedClearViewer.count);
  assert.ok(view.documentWidth<=414);
  assert.equal(reopened.projectionStore.getVersion(id),2);
  console.log("B11E_VIEWER_RELOAD_RESULT="+JSON.stringify({process:intake.process,hardReload:true,casPreserved:2,congestionMatches:true}));
 }finally{await reloadTab.close()}
 assert.equal(repository.listHistory({
  enterpriseId:id.enterpriseId,definitionId:id.definitionId
 }).length,1,"projection Save must not version the business definition");
 console.log("B9Y_READONLY_NO_WRITE_RESULT="+JSON.stringify({
  process:intake.process,casAfterInitialView:1,casAfterFreshMobileViews:2,
  readonlyViewerSaveButtons:0,
  caveat:"Synthetic Chrome Viewer read-only path, not authenticated customer policy"
 }));
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
