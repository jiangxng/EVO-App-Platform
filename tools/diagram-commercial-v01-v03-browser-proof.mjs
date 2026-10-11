#!/usr/bin/env node
/**
 * Commercial v1.0 V01-V03: native Chromium UI sub-gate only.
 * Synthetic enterprise fixture; actual Eidos Designer, authorized App Handler,
 * file-backed CAS Save, and independent readonly Viewer. NOT physical-device
 * or customer/human signoff. Original §14 remains NOT TESTED.
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
import {EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION as READ,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION as SAVE}
  from "../dist/apps/eog-2d-designer/package.js";
import {EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION as VIEW}
  from "../dist/apps/eog-2d-viewer/package.js";

const chrome=process.env.CHROME;
assert.ok(chrome,"V01-V03 require a real Chromium/Chrome executable");
const tmp=mkdtempSync(join(tmpdir(),"evo-v01-v03-"));
const storage=join(tmp,"presentation.json");
const relationId="v01-v03-sales-to-receipt";
const graph={
  contractVersion:"0.1.0",
  nodes:[
    {id:"sale",kind:"subject",label:"Synthetic Sales Order",
      shape:"rounded-rectangle",x:80,y:130,width:150,height:68},
    {id:"receipt",kind:"subject",label:"Synthetic Cash Receipt",
      shape:"rounded-rectangle",x:640,y:335,width:150,height:68}
  ],
  edges:[{id:relationId,source:"sale",target:"receipt",
    kind:"business-flow",label:"Synthetic relationship",arrow:"end"}]
};
const repo=createMemoryBusinessDefinitionRepositoryV010();
const bundle=ledgerRuntimeBaselineBundleV010;
const original=repo.createDraft({
  enterpriseId:"ent-v01v03",definitionId:"ledger:v01v03",kind:bundle.definition.kind,
  title:bundle.definition.title,
  payload:{...structuredClone(bundle.definition.payload),preview2d:graph},
  projectionGallery:structuredClone(bundle.definition.projectionGallery),
  actor:{actorType:"HUMAN",subjectId:"test-operator"},
  recordedAt:"2026-10-11T00:00:00.000Z",
  origin:{type:"TEMPLATE_COPY",sourceRef:"test:synthetic-v01-v03"}
});
const id={enterpriseId:original.enterpriseId,definitionId:original.definitionId,
  definitionRevision:original.revision,
  projectionId:original.projectionGallery.primaryProjectionId};
const ctx={
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:"test-operator",
    actorType:"HUMAN",identityProviderId:"test.identity",sessionId:"test-v01-v03"},
  scope:{contractVersion:"0.1.0",enterpriseId:id.enterpriseId},
  context:{contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:synthetic"},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise:synthetic",enterpriseId:id.enterpriseId}},
  locale:"en-US",correlationId:"diagram-commercial-v01-v03"
};
const request=(code,values)=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion:"0.1.0"},values,
  sourceInteractionId:"commercial-v01-v03",actionId:code,requiresConfirmation:false
});
const store=createFileDefinitionProjectionStoreV010(storage);
const artifactSource=createEnterpriseDefinitionProjectionArtifactSourceV010(repo,store);
const handlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository:repo,projectionStore:store,source:artifactSource,
  sessions:createMemoryDefinitionProjectionSessionStoreV010(),
  canManageEnterpriseContext:()=>true,
  authorizeProjectionSave:async()=>{},
  locale:()=>"en-US",now:()=>new Date("2026-10-11T00:01:00Z")
});
const actionByCode=new Map([
  ...handlers.map(handler=>[handler.commandCode,handler]),
  [VIEW,createEnterpriseDefinition2dPreviewReadActionV010({source:artifactSource})]
]);
const read=actionByCode.get(READ);
assert.ok(read && actionByCode.has(SAVE),"real projection App handlers must be present");
const initial=await read.execute(request(READ,id),ctx);
assert.equal(initial.ok,true,initial.error?.message);
assert.equal(initial.result.edges.length,1);
assert.equal(initial.result.edges[0].pathKind,undefined,
  "V02 older projection has no pathKind; it must NOT be migrated automatically");
assert.equal(initial.result.edges[0].arrow,"end");
assert.equal(store.getVersion(id),0,"V02 reading a legacy graph cannot write presentation");

const camera={scale:1,translateX:60,translateY:60};
const editor=createEnterpriseDefinitionProjectionEditorPageV010({
  ...id,title:"Synthetic commercial Designer",locale:"en-US",initialCamera:camera
});
const viewer=createEnterpriseDefinition2dPreviewPageV010({
  ...id,title:"Synthetic commercial Viewer",locale:"en-US",camera
});
const html=(mode)=>{
  const readOnly=mode==="viewer";
  const definition=readOnly?viewer:editor;
  const shell=readOnly
    ? renderDiagramWorkspacePageShellToHtmlV010(definition)
    : renderDiagramEditorPageShellToHtmlV010(definition);
  const modulePath=readOnly?"/dist/vendor/eidos/src/diagram/workspace.js"
    :"/dist/vendor/eidos/src/diagram/surface.js";
  const mountName=readOnly?"mountDiagramWorkspacePageV010":"mountDiagramEditorPageV010";
  const json=JSON.stringify(definition).replaceAll("<","\\u003c");
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<style>html,body{margin:0}main{width:1200px;height:760px}'
    +'[data-eidos-diagram-editor]{height:750px!important;min-height:560px}</style></head>'
    +'<body><main id="root">'+shell+'</main>'
    +'<script>window.__definition='+json
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
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://127.0.0.1");
    if(url.pathname==="/designer"||url.pathname==="/viewer"){
      res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
      res.end(html(url.pathname.slice(1)));return;
    }
    if(url.pathname==="/action"&&req.method==="POST"){
      let raw="";for await(const chunk of req)raw+=chunk;
      const call=JSON.parse(raw);
      const handler=actionByCode.get(call.command?.code);
      if(!handler){res.writeHead(400);res.end("Unknown command");return;}
      const result=await handler.execute(call,ctx);
      res.writeHead(200,{"content-type":"application/json"});
      res.end(JSON.stringify(result));return;
    }
    if(url.pathname.startsWith("/dist/")){
      const base=resolve(process.cwd(),"dist");
      const abs=resolve(process.cwd(),"."+url.pathname);
      if(!abs.startsWith(base+"/")){res.writeHead(403);res.end("Forbidden");return;}
      const data=await readFile(abs);
      res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});
      res.end(data);return;
    }
    res.writeHead(404);res.end("Not found");
  }catch(error){
    res.writeHead(500,{"content-type":"text/plain"});
    res.end("Synthetic harness error");
    console.error("Harness failure:",error instanceof Error?error.message:String(error));
  }
});
const selector='[data-eidos-diagram-edge-visual="'+relationId+'"]';
const waitReady=tab=>tab.waitForFunction(sel=>
  document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready."
  && Boolean(document.querySelector(sel)),selector,{timeout:30000});
const shape=tab=>tab.locator(selector).getAttribute("d");
let browser;
try{
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const base="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:chrome,
    args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
  const tab=await browser.newPage({viewport:{width:1250,height:820}});
  await tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(tab);
  const initialPath=await shape(tab);
  assert.match(initialPath,/^M .* L /,"V02 legacy shape should remain a straight SVG line");
  assert.doesNotMatch(initialPath,/ [QC] /,"V02 default must not be a curve");
  assert.equal(store.getVersion(id),0,"V02 first open remains read-only");
  const hitPosition=await tab.evaluate(edge=>{
    const path=document.querySelector('[data-eidos-diagram-edge="'+edge+'"]');
    if(!path)throw Error("Missing selectable SVG path");
    const local=path.getPointAtLength(path.getTotalLength()*.65);
    const m=path.getScreenCTM();
    return {x:m.a*local.x+m.c*local.y+m.e,
      y:m.b*local.x+m.d*local.y+m.f};
  },relationId);
  await tab.mouse.click(hitPosition.x,hitPosition.y);
  const select=tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
  await select.waitFor({state:"visible",timeout:15000});
  const observed={straight:initialPath};
  // Native form selections, not hidden state mutation or element attribute spoofing.
  for(const kind of ["orthogonal","rounded-orthogonal","curve","straight","curve"]){
    await select.selectOption(kind);
    const d=await shape(tab);
    assert.ok(d && d.startsWith("M "),"V01 route must remain a valid SVG path");
    observed[kind]=d;
    if(kind==="rounded-orthogonal")assert.match(d,/ Q /,"rounded orthogonal must have actual corner curves");
    if(kind==="curve")assert.match(d,/ C /,"curve must have real cubic path data");
    if(kind==="orthogonal")assert.doesNotMatch(d,/ [QC] /,"sharp orthogonal cannot be rendered as curve");
  }
  assert.equal(new Set(Object.values(observed)).size,4,
    "V01 every path kind must have distinct actual Chrome SVG d geometry");
  assert.equal(store.getVersion(id),0,
    "V01 selecting presentation paths cannot silently save business data");
  const edgeVisual=tab.locator(selector);
  const arrowBefore=await edgeVisual.getAttribute("marker-end");
  assert.match(arrowBefore,/url\(#/,"V03 semantic direction keeps the end arrow");
  assert.equal(await edgeVisual.getAttribute("marker-start"),null,
    "V03 presentation control must not invent reverse business arrow");
  const saveButton=tab.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"});
  assert.equal(await saveButton.count(),1,"normal Designer has one explicit Save");
  await saveButton.click();
  await tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
    {timeout:30000});
  assert.equal(store.getVersion(id),1,"real UI Save must increment projection CAS once");
  assert.deepEqual(await tab.evaluate(()=>window.__errors),[],
    "V01-V03 synthetic Chrome had no browser exceptions");
  const saved=await read.execute(request(READ,id),ctx);
  assert.equal(saved.ok,true,saved.error?.message);
  assert.equal(saved.result.edges[0].pathKind,"curve");
  assert.equal(saved.result.edges[0].source,"sale");
  assert.equal(saved.result.edges[0].target,"receipt");
  assert.equal(saved.result.edges[0].arrow,"end",
    "V03 business direction cannot be altered by presentation change");
  assert.equal(repo.listHistory({enterpriseId:id.enterpriseId,definitionId:id.definitionId}).length,1,
    "presentation-only Save must NOT create a new business-definition revision");
  const readOnlyTab=await browser.newPage({viewport:{width:1250,height:820}});
  await readOnlyTab.goto(base+"/viewer",{waitUntil:"load"});
  await waitReady(readOnlyTab);
  assert.equal(await shape(readOnlyTab),observed.curve,
    "V01 saved Viewer geometry must match Designer geometry exactly");
  assert.match(await readOnlyTab.locator(selector).getAttribute("marker-end"),/url\(#/,
    "V03 independent readonly Viewer retains semantic arrow");
  assert.equal(await readOnlyTab.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"}).count(),0);
  assert.deepEqual(await readOnlyTab.evaluate(()=>window.__errors),[]);
  assert.equal(store.getVersion(id),1,"Viewer must never implicitly write");
  console.log("DIAGRAM_V01_V03_BROWSER_SUBGATE="+JSON.stringify({
    browser:"Chromium "+browser.version(),
    cases:["V01","V02","V03"],fourDistinctRenderedPaths:true,
    legacyStraightWithoutMigration:true,
    nativeMouseSelection:true,nativeSelectChanges:true,nativeSave:true,
    appCasVersion:1,independentReadonlyViewerMatch:true,
    originalBusinessDefinitionRevisionPreserved:true,
    originalBusinessArrowPreserved:true,
    source:"synthetic test.graph",evidence:"automated-native-browser-subgate",
    formalHumanSignedCases:0,formalTotalCases:39,
    warning:"NOT a device/customer/production commercial acceptance PASS"
  }));
}finally{
  await browser?.close();
  server.closeAllConnections?.();server.close();
  rmSync(tmp,{recursive:true,force:true});
}
