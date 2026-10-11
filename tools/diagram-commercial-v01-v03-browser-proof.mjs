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
    {id:"sale",kind:"subject",label:"销售到收款业务流程节点与多法人应收账款管理中文长标题",
      shape:"rounded-rectangle",x:80,y:130,width:150,height:68},
    {id:"receipt",kind:"subject",label:"Synthetic Global Cash Receipt Reconciliation and Multi-Entity Settlement",
      shape:"rounded-rectangle",x:640,y:335,width:150,height:68}
  ],
  edges:[{id:relationId,source:"sale",target:"receipt",
    kind:"business-flow",label:"销售到收款跨企业应收收款关联 Long English Relationship Label with extensive settlement information",arrow:"end"}]
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
const v06State={...initial.result,nodes:initial.result.nodes.map((node,i)=>({
  ...node,issue:i===0?{level:"error",message:"Required business mapping is missing"}
    :{level:"warning",message:"Settlement review pending"}
}))};
const html=(mode)=>{
  const readOnly=mode==="viewer";
  const v06=mode==="v06";
  const definition=readOnly?viewer:editor;
  const shell=readOnly
    ? renderDiagramWorkspacePageShellToHtmlV010(definition)
    : renderDiagramEditorPageShellToHtmlV010(definition);
  const modulePath=readOnly?"/dist/vendor/eidos/src/diagram/workspace.js"
    :"/dist/vendor/eidos/src/diagram/surface.js";
  const mountName=readOnly?"mountDiagramWorkspacePageV010":"mountDiagramEditorPageV010";
  const json=JSON.stringify(definition).replaceAll("<","\\u003c");
  const issueState=v06?JSON.stringify(v06State).replaceAll("<","\\u003c"):"null";
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<style>html,body{margin:0}main{width:1200px;height:760px}'
    +'[data-eidos-diagram-editor]{height:750px!important;min-height:560px}</style></head>'
    +'<body><main id="root">'+shell+'</main>'
    +'<script>window.__definition='+json
    +';window.__v06State='+issueState
    +';window.__errors=[];window.addEventListener("error",e=>window.__errors.push(e.message));'
    +'window.addEventListener("unhandledrejection",e=>window.__errors.push(String(e.reason)));'
    +'</script><script type="module">'
    +'import {'+mountName+'} from '+JSON.stringify(modulePath)+';'
    +'const actionHost={async execute(request){if(window.__v06State && request.command?.code==='+JSON.stringify(READ)+')return {ok:true,result:window.__v06State};const res=await fetch("/action",{method:"POST",'
    +'headers:{"content-type":"application/json"},body:JSON.stringify(request)});'
    +'if(!res.ok)throw Error("HTTP "+res.status);return res.json()}};'
    +'window.__mounted='+mountName+'({definition:window.__definition,'
    +'container:document.getElementById("root"),actionHost});'
    +'</script></body></html>';
};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://127.0.0.1");
    if(url.pathname==="/designer"||url.pathname==="/viewer"||url.pathname==="/v06"){
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
  // V05 genuine Chrome DOM: full titles remain retrievable, node labels stay
  // within bounded cards, long multilingual SVG edge captions are readable
  // via intrinsic title and do not silently change graph meaning.
  const v05=await tab.evaluate(()=>{
    const nodes=[...document.querySelectorAll("[data-eidos-diagram-node]")];
    const svgCaption=document.querySelector("[data-eidos-diagram-edge-label]");
    const edge=document.querySelector("[data-eidos-diagram-edge-visual]");
    return {
      nodes:nodes.map(n=>({id:n.getAttribute("data-eidos-diagram-node"),
        fullText:n.querySelector("strong")?.textContent??"",
        cardWidth:n.clientWidth,
        labelWidth:n.querySelector("strong")?.scrollWidth??0,
        labelClient:n.querySelector("strong")?.clientWidth??0,
        cardHeight:n.clientHeight,
        labelHeight:n.querySelector("strong")?.getBoundingClientRect().height??0,
        clipped:getComputedStyle(n.querySelector("strong")).overflow==="hidden",
        tooltipIncludesLabel:n.getAttribute("title")?.includes(n.querySelector("strong")?.textContent??"")??false,
        title:n.getAttribute("title")})),
      captionExists:Boolean(svgCaption),
      captionText:svgCaption?.textContent??"",
      captionTitle:svgCaption?.querySelector("title")?.textContent??"",
      captionTruncated:svgCaption?.getAttribute("data-eidos-diagram-caption-truncated")??null,
      edgeTitle:edge?.querySelector("title")?.textContent??"",
      browserErrors:window.__errors
    };
  });
  assert.equal(v05.nodes.length,2,"V05: long Chinese/English nodes should remain visible");
  assert.ok(v05.nodes[0].fullText.includes("销售到收款业务流程节点"));
  assert.ok(v05.nodes[1].fullText.includes("Multi-Entity Settlement"));
  assert.ok(v05.nodes.every(n=>n.labelWidth<=n.labelClient+2),
    "V05: Chinese/English long labels must wrap or clamp inside actual DOM width");
  assert.ok(v05.nodes.every(n=>n.clipped && n.tooltipIncludesLabel && n.labelHeight<=n.cardHeight),
    "V05: rendered long labels must not vertically escape the node card");
  assert.equal(v05.captionExists,true,"V05: long edge caption remains visible in small graph");
  assert.ok(v05.captionText.length>0,"V05: caption cannot vanish");
  assert.ok(v05.captionTitle.includes("Long English Relationship Label"),
    "V05: truncated SVG edge caption needs complete accessible tooltip");
  assert.deepEqual(v05.browserErrors,[]);
  console.log("DIAGRAM_V05_BROWSER_SUBGATE="+JSON.stringify({
    case:"V05",browser:"Chromium "+browser.version(),nodeSummary:v05.nodes,
    captionTruncated:v05.captionTruncated,captionTitleAccessible:true,
    syntheticOnly:true,formalHumanSignedCases:0,formalTotalCases:39
  }));
  // V06: an actual Eidos-rendered state with independently declared error
  // and warning. Never infer business errors from colors, arbitrary labels,
  // or mutate the projection Store. Click, pointer hover and keyboard focus
  // are genuinely dispatched to Chrome; inspect computed styles and DOM.
  const v06Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await v06Tab.goto(base+"/v06",{waitUntil:"load"});
  await waitReady(v06Tab);
  const errorNode=v06Tab.locator('[data-eidos-diagram-node="sale"]');
  const warningNode=v06Tab.locator('[data-eidos-diagram-node="receipt"]');
  assert.equal(await errorNode.locator('[data-eidos-diagram-issue="error"]').count(),1);
  assert.equal(await warningNode.locator('[data-eidos-diagram-issue="warning"]').count(),1);
  assert.match(await errorNode.getAttribute("title"),/ERROR: Required business mapping is missing/);
  assert.match(await warningNode.getAttribute("title"),/WARNING: Settlement review pending/);
  assert.equal(await errorNode.getAttribute("aria-pressed"),"false");
  await errorNode.hover();
  const hovered=await errorNode.evaluate(el=>({
    outline:getComputedStyle(el).outlineStyle,
    border:getComputedStyle(el).borderColor,
    badge:el.querySelector('[data-eidos-diagram-issue]')?.textContent
  }));
  assert.notEqual(hovered.outline,"none","V06 hover needs a distinct outline");
  await errorNode.click();
  assert.equal(await errorNode.getAttribute("aria-pressed"),"true");
  assert.equal(await warningNode.getAttribute("aria-pressed"),"false");
  await v06Tab.keyboard.press("Tab");
  await errorNode.focus();
  const compound=await errorNode.evaluate(el=>({
    focused:document.activeElement===el,
    focusVisible:el.matches(":focus-visible"),
    outlineStyle:getComputedStyle(el).outlineStyle,
    borderStyle:getComputedStyle(el).borderStyle,
    borderColor:getComputedStyle(el).borderColor,
    selected:el.getAttribute("data-eidos-diagram-selected"),
    badge:el.querySelector('[data-eidos-diagram-issue]')?.textContent,
    issueAria:el.querySelector('[data-eidos-diagram-issue]')?.getAttribute("aria-label")
  }));
  assert.equal(compound.focused,true);
  assert.equal(compound.focusVisible,true,"V06 keyboard focus must be independently visible");
  assert.equal(compound.outlineStyle,"dashed",
    "V06 focus ring must be distinct from solid selection border");
  assert.equal(compound.selected,"true","V06 focus cannot erase selected state");
  assert.match(compound.badge,/Error/,"V06 issue indicator remains when selected and focused");
  assert.match(compound.issueAria,/Required business mapping/);
  assert.deepEqual(await v06Tab.evaluate(()=>window.__errors),[]);
  assert.equal(store.getVersion(id),0,"V06 visual states may never write business presentation");
  console.log("DIAGRAM_V06_BROWSER_SUBGATE="+JSON.stringify({
    case:"V06",browser:"Chromium "+browser.version(),
    selectedFocusError:compound,hoverOutline:hovered.outline,
    warningSurvived:true,colorNotSoleSignal:true,
    syntheticOnly:true,physicalDeviceVerified:false
  }));
  await v06Tab.close();
  // M01: native left-button drag on blank canvas creates a marquee and selects
  // the enclosed node without changing the camera or saved projection.
  const m01Before=await tab.evaluate(()=>{
    const sale=document.querySelector('[data-eidos-diagram-node="sale"]');
    const other=document.querySelector('[data-eidos-diagram-node="receipt"]');
    const canvas=document.querySelector("[data-eidos-diagram-canvas]");
    const a=sale.getBoundingClientRect(), b=other.getBoundingClientRect();
    const v=canvas.getBoundingClientRect();
    const start={x:a.left-24,y:a.top-24};
    const end={x:a.right+24,y:a.bottom+24};
    return {start,end,canvas:{left:v.left,top:v.top,right:v.right,bottom:v.bottom},
      other:{left:b.left,top:b.top},
      transform:sale.parentElement.style.transform,
      startTarget:document.elementFromPoint(start.x,start.y)?.getAttribute("data-eidos-diagram-node"),
      endTarget:document.elementFromPoint(end.x,end.y)?.getAttribute("data-eidos-diagram-node")};
  });
  assert.equal(m01Before.startTarget,null,"M01 marquee must start on blank canvas");
  assert.equal(m01Before.endTarget,null,"M01 marquee must end on blank canvas");
  assert.ok(m01Before.start.x>m01Before.canvas.left
    &&m01Before.end.x<m01Before.canvas.right
    &&m01Before.start.y>m01Before.canvas.top
    &&m01Before.end.y<m01Before.canvas.bottom,"M01 drag stays inside canvas");
  await tab.mouse.move(m01Before.start.x,m01Before.start.y);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(m01Before.end.x,m01Before.end.y,{steps:10});
  assert.equal(await tab.locator("[data-eidos-diagram-marquee]").count(),1,
    "M01 real left-drag draws an active selection rectangle");
  await tab.mouse.up({button:"left"});
  assert.equal(await tab.locator("[data-eidos-diagram-marquee]").count(),0);
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),
    "true","M01 enclosed node must be selected");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),
    "false","M01 excluded node must remain unselected");
  const m01After=await tab.evaluate(()=>document.querySelector(
    '[data-eidos-diagram-node="sale"]').parentElement.style.transform);
  assert.equal(m01After,m01Before.transform,
    "M01 dragging to marquee may not accidentally pan/zoom the canvas");
  assert.equal(store.getVersion(id),0,"M01 marquee is presentation-only and unsaved");
  console.log("DIAGRAM_M01_BROWSER_SUBGATE="+JSON.stringify({
    case:"M01",browser:"Chromium "+browser.version(),
    nativeBlankCanvasLeftDrag:true,marqueeVisibleDuringDrag:true,
    enclosedNodeSelected:true,excludedNodeNotSelected:true,cameraUnchanged:true,
    syntheticOnly:true,physicalMouseDeviceVerified:false
  }));
  // M02: click selects but does not move; 2px motion below the 4px
  // pointer threshold does not drag; real 48px mouse move does drag. Undo
  // restores geometry before subsequent existing V01-V06 regression.
  const m02Node=tab.locator('[data-eidos-diagram-node="sale"]');
  const m02Pos=async()=>tab.evaluate(()=>[...document.querySelectorAll(
    '[data-eidos-diagram-node]')].map(n=>({
      id:n.getAttribute("data-eidos-diagram-node"),
      x:Number.parseFloat(n.style.left),y:Number.parseFloat(n.style.top)
    })));
  const beforeClick=await m02Pos();
  await m02Node.click();
  assert.equal(await m02Node.getAttribute("aria-pressed"),"true",
    "M02 clicking a node selects it");
  assert.deepEqual(await m02Pos(),beforeClick,
    "M02 click alone may not move node coordinates");
  let rect=await m02Node.boundingBox();
  let cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  await tab.mouse.move(cx,cy);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(cx+2,cy+2);
  await tab.mouse.up({button:"left"});
  assert.deepEqual(await m02Pos(),beforeClick,
    "M02 pointer motion below 4 CSS px must not move the node");
  rect=await m02Node.boundingBox();
  cx=rect.x+rect.width/2;cy=rect.y+rect.height/2;
  await tab.mouse.move(cx,cy);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(cx+48,cy+15,{steps:9});
  await tab.mouse.up({button:"left"});
  const movedM02=await m02Pos();
  const oldNode=beforeClick.find(x=>x.id==="sale"),newNode=movedM02.find(x=>x.id==="sale");
  assert.ok(Math.abs(newNode.x-oldNode.x)>12,
    "M02 native left drag past threshold must move selected node");
  assert.deepEqual(movedM02.find(x=>x.id==="receipt"),
    beforeClick.find(x=>x.id==="receipt"),
    "M02 dragging one node cannot silently move the other");
  assert.equal(store.getVersion(id),0,
    "M02 moving presentation nodes is not an implicit Save");
  await tab.locator("[data-eidos-diagram-canvas]").focus();
  await tab.keyboard.press("Control+z");
  assert.deepEqual(await m02Pos(),beforeClick,
    "M02 one Undo must restore the exact original node positions");
  console.log("DIAGRAM_M02_BROWSER_SUBGATE="+JSON.stringify({
    case:"M02",browser:"Chromium "+browser.version(),
    actualClickSelectNoMove:true,subthresholdMotionNoMove:true,
    aboveThresholdMoved:true,otherNodePreserved:true,undoRestored:true,
    syntheticOnly:true,physicalDeviceVerified:false
  }));
  // M03: native Shift click and Shift marquee must add, never replace
  // selection. Avoid synthetic DOM click() and use actual pointer+keyboard.
  const m03Zoom=tab.locator('[data-eidos-diagram-view-controls] button[aria-label="Zoom out"]');
  let m03Region;
  for(let attempt=0;attempt<8;attempt++){
    m03Region=await tab.evaluate(()=>{
      const r=document.querySelector('[data-eidos-diagram-node="receipt"]').getBoundingClientRect();
      const c=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
      const start={x:r.left-12,y:r.top-12};
      const end={x:r.right+12,y:r.bottom+12};
      return {start,end,fits:start.x>c.left+10&&start.y>c.top+10
        &&end.x<c.right-10&&end.y<c.bottom-10};
    });
    if(m03Region.fits)break;
    await m03Zoom.click();
  }
  assert.ok(m03Region.fits,"M03 both rectangle endpoints must be on visible canvas");
  await tab.locator('[data-eidos-diagram-node="sale"]').click();
  await tab.locator('[data-eidos-diagram-node="receipt"]').click({modifiers:["Shift"]});
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true",
    "M03 Shift click must preserve first node");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true",
    "M03 Shift click must add second node");
  await tab.locator('[data-eidos-diagram-node="sale"]').click();
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"false",
    "M03 ordinary click correctly resets additive selection");
  // Selection opens the inspector, shrinking canvas width. Recompute then
  // zoom until the target rectangle itself, not just its center, is visible.
  for(let attempt=0;attempt<8;attempt++){
    m03Region=await tab.evaluate(()=>{
      const r=document.querySelector('[data-eidos-diagram-node="receipt"]').getBoundingClientRect();
      const c=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
      const start={x:r.left-12,y:r.top-12},end={x:r.right+12,y:r.bottom+12};
      return {start,end,fits:start.x>c.left+8&&start.y>c.top+8
        &&end.x<c.right-8&&end.y<c.bottom-8};
    });
    if(m03Region.fits)break;
    await m03Zoom.click();
  }
  assert.ok(m03Region.fits,"M03 target must stay entirely inside the selected canvas");
  await tab.keyboard.down("Shift");
  await tab.mouse.move(m03Region.start.x,m03Region.start.y);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(m03Region.end.x,m03Region.end.y,{steps:8});
  assert.equal(await tab.locator("[data-eidos-diagram-marquee]").count(),1,
    "M03 additive marquee visibly follows Shift+pointer");
  await tab.mouse.up({button:"left"});
  await tab.keyboard.up("Shift");
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true",
    "M03 Shift marquee must not clear the first selection");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true",
    "M03 Shift marquee must add the second node");
  assert.equal(store.getVersion(id),0,"M03 selection cannot save business presentation");
  console.log("DIAGRAM_M03_BROWSER_SUBGATE="+JSON.stringify({
    case:"M03",browser:"Chromium "+browser.version(),
    nativeShiftClickAdditive:true,nativeShiftMarqueeAdditive:true,
    ordinaryClickReplaces:true,noImplicitSave:true,
    syntheticOnly:true,physicalDeviceVerified:false
  }));
  // M04: drag one of two selected nodes using a native mouse. Both nodes
  // must receive identical world-coordinate deltas, without losing business
  // edge endpoints. One Undo restores original two-node relative placement.
  const groupPos=async()=>tab.evaluate(()=>[...document.querySelectorAll(
    "[data-eidos-diagram-node]")].map(n=>({
      id:n.getAttribute("data-eidos-diagram-node"),
      x:Number.parseFloat(n.style.left),y:Number.parseFloat(n.style.top)
    })));
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true");
  const m04Before=await groupPos();
  const m04EdgeBefore=await shape(tab);
  const groupBox=await tab.locator('[data-eidos-diagram-node="sale"]').boundingBox();
  const gx=groupBox.x+groupBox.width/2,gy=groupBox.y+groupBox.height/2;
  await tab.mouse.move(gx,gy);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(gx+42,gy+14,{steps:9});
  assert.notEqual(await shape(tab),m04EdgeBefore,
    "M04 connected business edge must follow nodes while mouse is still down");
  await tab.mouse.up({button:"left"});
  const m04After=await groupPos();
  const d0={x:m04After[0].x-m04Before[0].x,
    y:m04After[0].y-m04Before[0].y};
  const d1={x:m04After[1].x-m04Before[1].x,
    y:m04After[1].y-m04Before[1].y};
  assert.ok(Math.hypot(d0.x,d0.y)>6,"M04 group must really move");
  assert.ok(Math.abs(d0.x-d1.x)<.05&&Math.abs(d0.y-d1.y)<.05,
    "M04 both selected nodes must move by identical world delta");
  assert.equal(store.getVersion(id),0,"M04 drag cannot implicitly Save projection");
  await tab.locator("[data-eidos-diagram-canvas]").focus();
  await tab.keyboard.press("Control+z");
  assert.deepEqual(await groupPos(),m04Before,
    "M04 group drag must be restored by one Undo without drifting geometry");
  assert.equal(await shape(tab),m04EdgeBefore,
    "M04 connected edge geometry must be restored by the same Undo");
  console.log("DIAGRAM_M04_BROWSER_SUBGATE="+JSON.stringify({
    case:"M04",browser:"Chromium "+browser.version(),mouseGroupDrag:true,
    deltaShared:true,oneUndoExact:true,noImplicitSave:true,physicalDeviceVerified:false
  }));
  // M05: right drag starting on a node pans the camera only, without
  // moving selected business nodes or summoning any context menu.
  await tab.locator('[data-eidos-diagram-node="sale"]').click();
  const m05Before=await tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    const r=node.getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2,
      transform:node.parentElement.style.transform,
      positions:[...document.querySelectorAll("[data-eidos-diagram-node]")].map(n=>({
        id:n.getAttribute("data-eidos-diagram-node"),
        x:n.style.left,y:n.style.top
      })),selected:node.getAttribute("aria-pressed")};
  });
  assert.equal(m05Before.selected,"true");
  await tab.evaluate(()=>{
    window.__m05Menus=[];
    document.querySelector("[data-eidos-diagram-canvas]").addEventListener("contextmenu",e=>{
      window.__m05Menus.push({defaultPrevented:e.defaultPrevented});
    });
  });
  await tab.mouse.move(m05Before.x,m05Before.y);
  await tab.mouse.down({button:"right"});
  await tab.mouse.move(m05Before.x+60,m05Before.y+27,{steps:10});
  await tab.mouse.up({button:"right"});
  const m05After=await tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    return {transform:node.parentElement.style.transform,
      positions:[...document.querySelectorAll("[data-eidos-diagram-node]")].map(n=>({
        id:n.getAttribute("data-eidos-diagram-node"),x:n.style.left,y:n.style.top
      })),selected:node.getAttribute("aria-pressed"),
      customMenu:document.querySelectorAll("[data-eidos-diagram-context-menu]").length,
      nativeMenus:window.__m05Menus};
  });
  assert.notEqual(m05After.transform,m05Before.transform,
    "M05 real right drag must pan canvas camera");
  assert.deepEqual(m05After.positions,m05Before.positions,
    "M05 right drag must not move nodes");
  assert.equal(m05After.selected,"true","M05 right drag keeps current selection");
  assert.equal(m05After.customMenu,0,
    "M05 dragging cannot open the application context menu");
  assert.ok(m05After.nativeMenus.every(m=>m.defaultPrevented),
    "M05 right drag must suppress native browser context menu");
  assert.equal(store.getVersion(id),0,"M05 navigation cannot Save");
  console.log("DIAGRAM_M05_BROWSER_SUBGATE="+JSON.stringify({
    case:"M05",browser:"Chromium "+browser.version(),
    rightDragPanned:true,nodesUnchanged:true,selectionUnchanged:true,
    menuNotShown:true,noImplicitSave:true,physicalDeviceVerified:false
  }));
  // M07: real middle mouse and keyboard Space+left drag independently pan.
  // No application data, node coordinates or selected nodes may be changed.
  const m07Data=async()=>tab.evaluate(()=>{
    const nodes=[...document.querySelectorAll("[data-eidos-diagram-node]")];
    const canvas=document.querySelector("[data-eidos-diagram-canvas]");
    const r=canvas.getBoundingClientRect();
    return {positions:nodes.map(n=>({id:n.dataset.eidosDiagramNode,x:n.style.left,y:n.style.top})),
      transform:nodes[0].parentElement.style.transform,
      selected:nodes.map(n=>n.getAttribute("aria-pressed")),
      start:{x:r.left+30,y:r.top+35},
      target:document.elementFromPoint(r.left+30,r.top+35)?.tagName};
  });
  const m07Before=await m07Data();
  await tab.mouse.move(m07Before.start.x,m07Before.start.y);
  await tab.mouse.down({button:"middle"});
  await tab.mouse.move(m07Before.start.x+48,m07Before.start.y+26,{steps:8});
  await tab.mouse.up({button:"middle"});
  const m07Mid=await m07Data();
  assert.notEqual(m07Mid.transform,m07Before.transform,"M07 middle drag must pan viewport");
  assert.deepEqual(m07Mid.positions,m07Before.positions,"M07 middle drag cannot move nodes");
  assert.deepEqual(m07Mid.selected,m07Before.selected,"M07 middle drag keeps selection");
  await tab.locator("[data-eidos-diagram-canvas]").focus();
  await tab.keyboard.down("Space");
  await tab.mouse.move(m07Before.start.x,m07Before.start.y);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(m07Before.start.x-33,m07Before.start.y+22,{steps:8});
  await tab.mouse.up({button:"left"});
  await tab.keyboard.up("Space");
  const m07Space=await m07Data();
  assert.notEqual(m07Space.transform,m07Mid.transform,"M07 Space+left must pan viewport");
  assert.deepEqual(m07Space.positions,m07Before.positions,"M07 Space+left cannot move nodes");
  assert.deepEqual(m07Space.selected,m07Before.selected,"M07 Space+left keeps selection");
  assert.equal(await tab.locator("[data-eidos-diagram-marquee]").count(),0,
    "M07 Space pan must not leave a marquee");
  assert.equal(store.getVersion(id),0,"M07 navigation cannot persist a projection");
  console.log("DIAGRAM_M07_BROWSER_SUBGATE="+JSON.stringify({
    case:"M07",browser:"Chromium "+browser.version(),
    nativeMiddlePan:true,nativeSpaceLeftPan:true,
    preservedSelection:true,positionsStable:true,withoutImplicitSave:true,
    physicalDeviceVerified:false
  }));
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
  // V04 extra automated subgate: real Chrome renders and hit-tests the exact
  // same connector at the §14 zoom extremes. This does NOT certify subjective
  // visual quality or physical mouse/trackpad devices.
  const v04=[];
  const resetZoom=tab.locator('[data-eidos-diagram-view-controls] button[aria-label="Reset view"]');
  const zoomOut=tab.locator('[data-eidos-diagram-view-controls] button[aria-label="Zoom out"]');
  const zoomIn=tab.locator('[data-eidos-diagram-view-controls] button[aria-label="Zoom in"]');
  for(const scenario of [
    {display:"10%",direction:"down",times:20},
    {display:"100%",direction:"reset",times:0},
    {display:"300%",direction:"up",times:20}
  ]){
    await resetZoom.click();
    for(let index=0;index<scenario.times;index++){
      await (scenario.direction==="down"?zoomOut:zoomIn).click();
    }
    assert.equal((await resetZoom.textContent())?.trim(),scenario.display,
      "V04 zoom control must reach exactly "+scenario.display);
    const result=await tab.evaluate(edge=>{
      const hit=document.querySelector('[data-eidos-diagram-edge="'+edge+'"]');
      const visual=document.querySelector('[data-eidos-diagram-edge-visual="'+edge+'"]');
      if(!hit||!visual)throw Error("V04 missing SVG elements");
      const length=hit.getTotalLength();
      const matrix=hit.getScreenCTM();
      if(!matrix)throw Error("V04 missing path screen matrix");
      const toScreen=v=>({x:v.x*matrix.a+v.y*matrix.c+matrix.e,
        y:v.x*matrix.b+v.y*matrix.d+matrix.f});
      const canvas=document.querySelector("[data-eidos-diagram-canvas]");
      const rect=canvas.getBoundingClientRect();
      // After M01 selection freezes camera, the inspector may cover some
      // connector screen positions. Sample an actually visible segment, not
      // the former hard-coded 74% position hidden behind the inspector.
      let sample;
      for(const fraction of [.74,.62,.50,.38,.26,.14]){
        const p=hit.getPointAtLength(length*fraction);
        const before=hit.getPointAtLength(length*Math.max(0,fraction-.02));
        const after=hit.getPointAtLength(length*Math.min(1,fraction+.02));
        const middle=toScreen(p),a=toScreen(before),b=toScreen(after);
        const tangent={x:b.x-a.x,y:b.y-a.y};
        const norm=Math.hypot(tangent.x,tangent.y);
        if(!(norm>0))continue;
        const x=middle.x-6*tangent.y/norm;
        const y=middle.y+6*tangent.x/norm;
        if(x<rect.left+9||x>=rect.right-9||y<rect.top+9||y>=rect.bottom-9)continue;
        sample={fraction,middle,x,y};
        break;
      }
      if(!sample)throw Error("V04 no actually visible connector point to hit at this zoom");
      const {middle,x,y}=sample;
      const element=document.elementFromPoint(x,y);
      const hitDetected=element?.getAttribute("data-eidos-diagram-edge")===edge;
      const centerElement=document.elementFromPoint(middle.x,middle.y);
      const topElements=document.elementsFromPoint(x,y).slice(0,6)
        .map(el=>({tag:el.tagName,id:el.getAttribute("data-eidos-diagram-edge"),
          className:String(el.getAttribute("class")??"").slice(0,50)}));
      const marker=visual.getAttribute("marker-end");
      return {
        hitWidth:hit.getAttribute("stroke-width"),
        hitVectorEffect:hit.getAttribute("vector-effect"),
        visualVectorEffect:visual.getAttribute("vector-effect"),
        markerEnd:marker,
        markerStart:visual.getAttribute("marker-start"),
        hitDetected,
        sampleFraction:sample.fraction,
        diagnostic:{zoomDisplay:document.querySelector('[aria-label="Reset view"]')?.textContent,
          center:[middle.x,middle.y],point:[x,y],
          centerTag:centerElement?.tagName,centerHit:centerElement?.getAttribute("data-eidos-diagram-edge"),
          topElements,computedHitStroke:getComputedStyle(hit).strokeWidth,
          hitRect:hit.getBoundingClientRect().toJSON()},
        sampledPointInsideViewport:x>=rect.left&&y>=rect.top
          &&x<rect.right&&y<rect.bottom
      };
    },relationId);
    console.log("V04_NATIVE_HIT_DIAGNOSTIC="+JSON.stringify({scenario:scenario.display,...result}));
    assert.equal(result.hitWidth,"18","V04 hit region must have 18px nominal stroke");
    assert.equal(result.hitVectorEffect,null,
      "V04 CSS world-width compensation must not double-apply SVG vector-effect");
    assert.ok(Math.abs(Number.parseFloat(result.diagnostic.computedHitStroke)
      * (Number.parseFloat(scenario.display)/100) - 18) < .15,
      "V04 actual computed CSS stroke must remain 18 screen pixels at "+scenario.display);
    assert.equal(result.visualVectorEffect,"non-scaling-stroke",
      "V04 visible line thickness must remain stable at every scale");
    assert.ok(result.markerEnd?.startsWith("url(#"),
      "V04 visible arrow is not allowed to vanish on zoom");
    assert.equal(result.markerStart,null,
      "V04 zoom cannot reverse arrow semantics");
    assert.equal(result.sampledPointInsideViewport,true,
      "V04 sampled connector segment must remain in the real canvas viewport");
    assert.equal(result.hitDetected,true,
      "V04 at "+scenario.display+" real Chrome 6px perpendicular pointer hit must select the relation");
    v04.push({zoom:scenario.display,hitSixPixelsFromCurve:true,
      computedHitStrokeWorldPx:result.diagnostic.computedHitStroke,
      visibleVectorEffect:result.visualVectorEffect,arrowPreserved:true});
  }
  assert.equal(store.getVersion(id),1,"V04 zooming must not write projection CAS");
  console.log("DIAGRAM_V04_BROWSER_SUBGATE="+JSON.stringify({
    browser:"Chromium "+browser.version(),case:"V04",
    zoomEvidence:v04,nativeChromeDomHitTesting:true,
    syntheticOnly:true,formalHumanSignedCases:0,formalTotalCases:39,
    disclaimer:"V04 subjective visual/physical-device acceptance still NOT TESTED"
  }));

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
