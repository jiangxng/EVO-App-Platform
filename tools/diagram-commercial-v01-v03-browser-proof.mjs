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
const e01State={
  ...initial.result,
  nodes:[
    {...initial.result.nodes[0],x:80,y:210},
    {...initial.result.nodes[1],x:640,y:210},
    {id:"obstacle",kind:"subject",label:"Mandatory approval checkpoint",
      shape:"rounded-rectangle",x:355,y:180,width:140,height:130}
  ],
  edges:initial.result.edges.map(edge=>({...edge,pathKind:"orthogonal"}))
};
const e02Edges={
  forwardA:"e02-forward-a",forwardB:"e02-forward-b",
  reverse:"e02-reverse",loop:"e02-loop"
};
const e02Base=initial.result.edges[0];
const e02State={
  ...initial.result,
  nodes:[
    {...initial.result.nodes[0],x:100,y:200},
    {...initial.result.nodes[1],x:720,y:210}
  ],
  edges:[
    {...e02Base,id:e02Edges.forwardA,pathKind:"orthogonal"},
    {...e02Base,id:e02Edges.forwardB,pathKind:"orthogonal"},
    {...e02Base,id:e02Edges.reverse,source:"receipt",target:"sale",pathKind:"orthogonal"},
    {...e02Base,id:e02Edges.loop,source:"sale",target:"sale",pathKind:"orthogonal"}
  ]
};
const html=(mode)=>{
  const readOnly=mode==="viewer";
  const v06=mode==="v06";
  const phone=mode==="phone";
  const e01=mode==="e01";
  const e02=mode==="e02";
  const definition=readOnly?viewer:editor;
  const shell=readOnly
    ? renderDiagramWorkspacePageShellToHtmlV010(definition)
    : renderDiagramEditorPageShellToHtmlV010(definition);
  const modulePath=readOnly?"/dist/vendor/eidos/src/diagram/workspace.js"
    :"/dist/vendor/eidos/src/diagram/surface.js";
  const mountName=readOnly?"mountDiagramWorkspacePageV010":"mountDiagramEditorPageV010";
  const json=JSON.stringify(definition).replaceAll("<","\\u003c");
  const issueState=v06?JSON.stringify(v06State).replaceAll("<","\\u003c"):"null";
  const obstacleState=e01?JSON.stringify(e01State).replaceAll("<","\\u003c"):"null";
  const parallelState=e02?JSON.stringify(e02State).replaceAll("<","\\u003c"):"null";
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<style>html,body{margin:0}main{width:'+(phone?'100vw':'1200px')+';height:'+(phone?'100dvh':'760px')+'}'
    +'[data-eidos-diagram-editor]{height:'+(phone?'100%':'750px')+'!important;min-height:'+(phone?'700px':'560px')+'}</style></head>'
    +'<body><main id="root">'+shell+'</main>'
    +'<script>window.__definition='+json
    +';window.__e02State='+parallelState
    +';window.__e01State='+obstacleState
    +';window.__v06State='+issueState
    +';window.__errors=[];window.addEventListener("error",e=>window.__errors.push(e.message));'
    +'window.addEventListener("unhandledrejection",e=>window.__errors.push(String(e.reason)));'
    +'</script><script type="module">'
    +'import {'+mountName+'} from '+JSON.stringify(modulePath)+';'
    +'const actionHost={async execute(request){if(window.__e02State && request.command?.code==='+JSON.stringify(READ)+')return {ok:true,result:window.__e02State};if(window.__e01State && request.command?.code==='+JSON.stringify(READ)+')return {ok:true,result:window.__e01State};if(window.__v06State && request.command?.code==='+JSON.stringify(READ)+')return {ok:true,result:window.__v06State};const res=await fetch("/action",{method:"POST",'
    +'headers:{"content-type":"application/json"},body:JSON.stringify(request)});'
    +'if(!res.ok)throw Error("HTTP "+res.status);return res.json()}};'
    +'window.__mounted='+mountName+'({definition:window.__definition,'
    +'container:document.getElementById("root"),actionHost});'
    +'</script></body></html>';
};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://127.0.0.1");
    if(url.pathname==="/designer"||url.pathname==="/viewer"||url.pathname==="/v06"||url.pathname==="/phone"||url.pathname==="/e01"||url.pathname==="/e02"){
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
  // Main tab uses an explicit context so M09 can open a second tab in it.
  const mainContext=await browser.newContext({viewport:{width:1250,height:820}});
  const tab=await mainContext.newPage();
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
  // M06: stationary secondary click shows the application context menu.
  // If a selected node belongs to a group, the group's selection survives.
  await tab.locator("[data-eidos-diagram-canvas]").focus();
  await tab.keyboard.press("Control+a");
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true");
  const m06Before=await tab.evaluate(()=>{
    const n=document.querySelector('[data-eidos-diagram-node="sale"]');
    return {camera:n.parentElement.style.transform,
      positions:[...document.querySelectorAll("[data-eidos-diagram-node]")].map(el=>({
        id:el.getAttribute("data-eidos-diagram-node"),x:el.style.left,y:el.style.top
      }))};
  });
  await tab.locator('[data-eidos-diagram-node="sale"]').click({button:"right"});
  const menu=tab.locator("[data-eidos-diagram-context-menu]");
  await menu.waitFor({state:"visible",timeout:7000});
  assert.equal(await menu.getAttribute("role"),"menu");
  assert.equal((await menu.locator("[data-eidos-diagram-context-subject]").textContent())?.trim(),
    "2 nodes selected","M06 right click on group member keeps whole selection context");
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true");
  assert.equal(await tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true");
  const m06After=await tab.evaluate(()=>{
    const n=document.querySelector('[data-eidos-diagram-node="sale"]');
    return {camera:n.parentElement.style.transform,
      positions:[...document.querySelectorAll("[data-eidos-diagram-node]")].map(el=>({
        id:el.getAttribute("data-eidos-diagram-node"),x:el.style.left,y:el.style.top
      }))};
  });
  assert.deepEqual(m06After,m06Before,
    "M06 stationary secondary click cannot pan camera or mutate graph");
  assert.equal(await menu.locator('[role="menuitem"]').filter({hasText:"Close"}).count(),1,
    "M06 a discoverable dismiss action must be present");
  await menu.locator('[role="menuitem"]').filter({hasText:"Close"}).click();
  assert.equal(await tab.locator("[data-eidos-diagram-context-menu]").count(),0);
  assert.equal(store.getVersion(id),0,"M06 context menu must never save on open/close");
  console.log("DIAGRAM_M06_BROWSER_SUBGATE="+JSON.stringify({
    case:"M06",browser:"Chromium "+browser.version(),
    nativeStationaryRightClick:true,applicationMenuVisible:true,
    groupContextPreserved:true,cameraAndPositionsUnchanged:true,
    explicitMenuDismiss:true,noImplicitSave:true,
    syntheticOnly:true,physicalDeviceVerified:false
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
  // M08: actual product waypoint number editor keeps Ctrl+A, Delete and
  // Space within input focus, never invoking canvas select-all or pan.
  await select.selectOption("orthogonal");
  await tab.getByRole("button",{name:"Add path point"}).click();
  const m08Number=tab.locator('[data-eidos-diagram-waypoint-controls] input[type="number"]').first();
  await m08Number.waitFor({state:"visible",timeout:12000});
  const m08Original=await m08Number.inputValue();
  const m08SelectedBefore=await tab.locator('[data-eidos-diagram-node="sale"]')
    .getAttribute("aria-pressed");
  const m08CameraBefore=await tab.evaluate(()=>document.querySelector(
    '[data-eidos-diagram-node="sale"]').parentElement.style.transform);
  await m08Number.focus();
  await m08Number.press("ControlOrMeta+A");
  await m08Number.press("Delete");
  assert.equal(await m08Number.inputValue(),"",
    "M08 Delete must act inside the real waypoint number editor");
  await m08Number.press("Space");
  assert.equal(await m08Number.evaluate(el=>document.activeElement===el),true,
    "M08 Space inside input must not move focus to the canvas");
  await m08Number.fill(m08Original);
  await m08Number.press("Tab");
  assert.equal(await tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),
    m08SelectedBefore,"M08 Ctrl+A inside editor cannot select every business node");
  assert.equal(await tab.evaluate(()=>document.querySelector(
    '[data-eidos-diagram-node="sale"]').parentElement.style.transform),
    m08CameraBefore,"M08 Space within input must not pan camera");
  await tab.getByRole("button",{name:"Restore automatic routing"}).click();
  await select.selectOption("curve");
  assert.equal(store.getVersion(id),0,"M08 input edits must not implicitly persist projection");
  console.log("DIAGRAM_M08_BROWSER_SUBGATE="+JSON.stringify({
    case:"M08",browser:"Chromium "+browser.version(),
    realWaypointNumericEditor:true,nativeCtrlA:true,nativeDelete:true,
    spaceRespectsInputFocus:true,canvasSelectionAndCameraUnchanged:true,
    noImplicitSave:true,physicalDeviceVerified:false
  }));
  // M09: native mouse node drag interrupted by actual browser-tab
  // focus loss must roll back preview coordinates and release pointer state.
  const m09Node=tab.locator('[data-eidos-diagram-node="sale"]');
  const m09Pos=()=>m09Node.evaluate(el=>({x:el.style.left,y:el.style.top}));
  const m09Before=await m09Pos();
  const m09Box=await m09Node.boundingBox();
  const m09X=m09Box.x+m09Box.width/2,m09Y=m09Box.y+m09Box.height/2;
  await tab.mouse.move(m09X,m09Y);
  await tab.mouse.down({button:"left"});
  await tab.mouse.move(m09X+40,m09Y+22,{steps:9});
  const m09Moving=await m09Pos();
  assert.notDeepEqual(m09Moving,m09Before,
    "M09 must first prove that a real native node drag is in progress");
  // Same browser context, not a separate isolated Playwright context.
  const m09Other=await tab.context().newPage();
  await m09Other.goto("about:blank");
  await m09Other.bringToFront();
  // Headless Chromium does not reliably emit an OS focus-loss event when
  // switching tabs. Dispatch the browser blur event explicitly after the
  // real tab transition; this verifies the product cancel handler, not an
  // actual physical cross-window blur.
  await tab.evaluate(()=>window.dispatchEvent(new Event("blur")));
  await tab.mouse.up({button:"left"});
  await tab.bringToFront();
  const m09AfterBlur=await m09Pos();
  assert.deepEqual(m09AfterBlur,m09Before,
    "M09 switching tabs during native drag must roll back the unsaved preview");
  await tab.mouse.move(m09X+76,m09Y+41,{steps:5});
  assert.deepEqual(await m09Pos(),m09Before,
    "M09 after losing capture, subsequent mouse movement must not drag a ghost node");
  await m09Other.close();
  assert.equal(store.getVersion(id),0,
    "M09 cancelled drag must not persist business projection");
  console.log("DIAGRAM_M09_BROWSER_SUBGATE="+JSON.stringify({
    case:"M09",browser:"Chromium "+browser.version(),
    actualMouseDragBeforeBlur:true,tabTransition:true,simulatedBlurEvent:true,
    physicalWindowBlurVerified:false,
    rollbackExact:true,ghostDragAbsent:true,noImplicitSave:true,
    physicalDeviceVerified:false
  }));
  // T01 synthetic Chromium wheel/pinch subgate. OS physical Mac
  // trackpad cannot be certified by CDP wheel events; verify UI semantics.
  const t01Mode=tab.locator("[data-eidos-diagram-wheel-mode]");
  const t01BeforeMode=await t01Mode.getAttribute("data-eidos-diagram-wheel-mode");
  if(t01BeforeMode!=="TRACKPAD")await t01Mode.click();
  assert.equal(await t01Mode.getAttribute("data-eidos-diagram-wheel-mode"),"TRACKPAD");
  const t01Camera=()=>tab.evaluate(()=>{
    const stage=document.querySelector('[data-eidos-diagram-node="sale"]').parentElement;
    const m=new DOMMatrix(stage.style.transform);
    return {scale:m.a,x:m.e,y:m.f};
  });
  const t01Start=await t01Camera();
  const t01Canvas=await tab.locator("[data-eidos-diagram-canvas]").boundingBox();
  const t01X=t01Canvas.x+42,t01Y=t01Canvas.y+45;
  await tab.mouse.move(t01X,t01Y);
  await tab.mouse.wheel(31,47);
  const t01Pan=await t01Camera();
  assert.ok(Math.abs(t01Pan.scale-t01Start.scale)<1e-7,
    "T01 trackpad two-finger scrolling must pan without zooming");
  assert.ok(Math.abs((t01Pan.x-t01Start.x)+31)<1.1
    && Math.abs((t01Pan.y-t01Start.y)+47)<1.1,
    "T01 trackpad wheel delta must be a continuous two-axis viewport translation");
  await tab.keyboard.down("Control");
  await tab.mouse.wheel(0,-120);
  await tab.keyboard.up("Control");
  const t01Pinch=await t01Camera();
  assert.ok(t01Pinch.scale>t01Pan.scale,
    "T01 ctrl-wheel pinch in Trackpad mode must zoom, not pan-only");
  assert.ok(t01Pinch.scale/t01Pan.scale<1.5,
    "T01 pinch must apply once, not double-count zoom handlers");
  if(t01BeforeMode!=="TRACKPAD")await t01Mode.click();
  assert.equal(store.getVersion(id),0,"T01 wheel gestures must not Save presentation");
  console.log("DIAGRAM_T01_BROWSER_SUBGATE="+JSON.stringify({
    case:"T01",browser:"Chromium "+browser.version(),
    syntheticTrackpadWheelPan:true,ctrlWheelPinchZoom:true,
    noDoubleZoom:true,continuousDelta:true,noImplicitSave:true,
    realMacTrackpadVerified:false,physicalDeviceVerified:false
  }));
  // T02 synthetic touch: beginning a swipe over an UNSELECTED node must
  // pan canvas rather than move the business node. Physical iOS/Android
  // gestures remain a separate manual device signoff.
  const t02Context=await browser.newContext({viewport:{width:1250,height:820},hasTouch:true});
  const t02Tab=await t02Context.newPage();
  await t02Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(t02Tab);
  const t02Node=t02Tab.locator('[data-eidos-diagram-node="sale"]');
  assert.equal(await t02Node.getAttribute("aria-pressed"),"false");
  const t02Snapshot=()=>t02Tab.evaluate(()=>{
    const el=document.querySelector('[data-eidos-diagram-node="sale"]');
    const m=new DOMMatrix(el.parentElement.style.transform);
    return {x:el.style.left,y:el.style.top,camX:m.e,camY:m.f,scale:m.a};
  });
  const t02Start=await t02Snapshot();
  const t02Rect=await t02Node.boundingBox();
  const t02X=t02Rect.x+t02Rect.width/2,t02Y=t02Rect.y+t02Rect.height/2;
  const t02Cdp=await t02Context.newCDPSession(t02Tab);
  await t02Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[{x:t02X,y:t02Y}]
  });
  for(let i=1;i<=7;i++)await t02Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[{x:t02X+i*8,y:t02Y+i*4}]
  });
  await t02Cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  const t02End=await t02Snapshot();
  assert.equal(t02End.x,t02Start.x,
    "T02 touch swipe over an unselected node must not change node X");
  assert.equal(t02End.y,t02Start.y,
    "T02 touch swipe over an unselected node must not change node Y");
  assert.ok(Math.hypot(t02End.camX-t02Start.camX,t02End.camY-t02Start.camY)>20,
    "T02 unselected-node swipe should navigate the viewport");
  assert.equal(t02End.scale,t02Start.scale,"T02 one-finger touch must not pinch zoom");
  assert.equal(store.getVersion(id),0,"T02 browsing gesture cannot implicitly Save");
  await t02Context.close();
  console.log("DIAGRAM_T02_BROWSER_SUBGATE="+JSON.stringify({
    case:"T02",browser:"Chromium "+browser.version(),
    syntheticTouchOverUnselectedNode:true,
    pannedCamera:true,nodePositionStable:true,noImplicitSave:true,
    realTouchscreenVerified:false,physicalDeviceVerified:false
  }));
  // T03: synthetic native-Chromium touch gesture on an explicitly selected
  // node must move presentation coordinates, unlike T02 unselected swipe.
  const t03Context=await browser.newContext({viewport:{width:1250,height:820},hasTouch:true});
  const t03Tab=await t03Context.newPage();
  await t03Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(t03Tab);
  const t03Node=t03Tab.locator('[data-eidos-diagram-node="sale"]');
  const t03Box=await t03Node.boundingBox();
  const t03X=t03Box.x+t03Box.width/2,t03Y=t03Box.y+t03Box.height/2;
  await t03Tab.touchscreen.tap(t03X,t03Y);
  assert.equal(await t03Node.getAttribute("aria-pressed"),"true",
    "T03 first tap must explicitly select node before a drag is allowed");
  const t03Pos=()=>t03Node.evaluate(el=>({
    x:Number.parseFloat(el.style.left),y:Number.parseFloat(el.style.top)
  }));
  const t03Before=await t03Pos();
  // Selecting a node opens the inspector and reflows/adjusts its screen
  // bounding box; recompute true hit target after the first tap.
  const t03SelectedBox=await t03Node.boundingBox();
  const t03DragX=t03SelectedBox.x+t03SelectedBox.width/2;
  const t03DragY=t03SelectedBox.y+t03SelectedBox.height/2;
  await t03Tab.evaluate(()=>{
    window.__t03PointerLog=[];
    const sale=document.querySelector('[data-eidos-diagram-node="sale"]');
    const canvas=document.querySelector("[data-eidos-diagram-canvas]");
    for(const el of [sale,canvas]){
      for(const type of ["pointerdown","pointermove","pointerup","pointercancel"]){
        el.addEventListener(type,e=>{
          window.__t03PointerLog.push({type,pointerType:e.pointerType,
            target:e.target.getAttribute?.("data-eidos-diagram-node"),
            current:el.getAttribute("data-eidos-diagram-node")??"canvas",
            capture:sale.hasPointerCapture(e.pointerId),x:e.clientX,y:e.clientY});
        },true);
      }
    }
  });
  const t03Cdp=await t03Context.newCDPSession(t03Tab);
  await t03Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[{x:t03DragX,y:t03DragY}]
  });
  for(let i=1;i<=8;i++)await t03Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[{x:t03DragX+i*7,y:t03DragY+i*4}]
  });
  await t03Cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  const t03After=await t03Pos();
  console.log("T03_POINTER_DIAGNOSTIC="+JSON.stringify({
    before:t03Before,after:t03After,
    events:await t03Tab.evaluate(()=>window.__t03PointerLog)
  }));
  assert.ok(Math.hypot(t03After.x-t03Before.x,t03After.y-t03Before.y)>12,
    "T03 selected node must move after explicit touch dragging threshold");
  assert.equal(store.getVersion(id),0,
    "T03 touch node edit must remain an unsaved local presentation edit");
  await t03Context.close();
  console.log("DIAGRAM_T03_BROWSER_SUBGATE="+JSON.stringify({
    case:"T03",browser:"Chromium "+browser.version(),
    explicitFirstTapSelection:true,syntheticTouchDraggedSelectedNode:true,
    localPresentationOnly:true,readonlyViewerGestureNotCovered:true,
    physicalDeviceVerified:false
  }));
  // T04: actual Chromium multitouch injection during a node drag.
  // Adding a second finger must cancel (not commit) pending node movement.
  const t04Context=await browser.newContext({viewport:{width:1250,height:820},hasTouch:true});
  const t04Tab=await t04Context.newPage();
  await t04Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(t04Tab);
  const t04Node=t04Tab.locator('[data-eidos-diagram-node="sale"]');
  let t04Rect=await t04Node.boundingBox();
  await t04Tab.touchscreen.tap(t04Rect.x+t04Rect.width/2,t04Rect.y+t04Rect.height/2);
  assert.equal(await t04Node.getAttribute("aria-pressed"),"true",
    "T04 must first select node before touch dragging");
  t04Rect=await t04Node.boundingBox(); // Inspector may move the node on screen.
  const t04X=t04Rect.x+t04Rect.width/2,t04Y=t04Rect.y+t04Rect.height/2;
  const t04Snap=()=>t04Tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    const matrix=new DOMMatrix(node.parentElement.style.transform);
    return {nodeX:Number.parseFloat(node.style.left),
      nodeY:Number.parseFloat(node.style.top),scale:matrix.a,
      cameraX:matrix.e,cameraY:matrix.f};
  });
  const t04Before=await t04Snap();
  const t04Cdp=await t04Context.newCDPSession(t04Tab);
  const t04A=(x=t04X,y=t04Y)=>({x,y,id:11});
  const t04B=(x=t04X+150,y=t04Y+62)=>({x,y,id:22});
  await t04Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[t04A()]
  });
  for(let i=1;i<=6;i++)await t04Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[t04A(t04X+i*8,t04Y+i*4)]
  });
  const t04During=await t04Snap();
  assert.ok(Math.hypot(t04During.nodeX-t04Before.nodeX,
    t04During.nodeY-t04Before.nodeY)>12,
    "T04 must prove pending node drag visually moved before second finger");
  const t04AX=t04X+48,t04AY=t04Y+24;
  await t04Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[t04A(t04AX,t04AY),t04B()]
  });
  const t04Cancelled=await t04Snap();
  assert.ok(Math.abs(t04Cancelled.nodeX-t04Before.nodeX)<.001
    &&Math.abs(t04Cancelled.nodeY-t04Before.nodeY)<.001,
    "T04 adding a second finger must immediately roll back pending node coordinates");
  await t04Tab.evaluate(()=>{
    window.__t04EventTrace=[];
    const canvas=document.querySelector("[data-eidos-diagram-canvas]");
    for(const name of ["pointerdown","pointermove","pointercancel","pointerup"]){
      canvas.addEventListener(name,e=>window.__t04EventTrace.push({
        name,pointerId:e.pointerId,target:e.target.getAttribute?.("data-eidos-diagram-node"),
        x:e.clientX,y:e.clientY,pointerType:e.pointerType
      }),true);
    }
  });
  for(let i=1;i<=5;i++)await t04Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[
      t04A(t04AX-i*4,t04AY-i*2),
      t04B(t04X+150+i*18,t04Y+62+i*9)]
  });
  const t04Pinch=await t04Snap();
  console.log("T04_GESTURE_DIAGNOSTIC="+JSON.stringify({
    before:t04Before,during:t04During,cancelled:t04Cancelled,
    pinch:t04Pinch,events:await t04Tab.evaluate(()=>window.__t04EventTrace)
  }));
  await t04Cdp.send("Input.dispatchTouchEvent",{
    type:"touchEnd",touchPoints:[]
  });
  const t04After=await t04Snap();
  assert.ok(Math.abs(t04After.nodeX-t04Before.nodeX)<.001
    &&Math.abs(t04After.nodeY-t04Before.nodeY)<.001,
    "T04 after finger release must not commit the cancelled business node move");
  assert.ok(Math.abs(t04Pinch.scale-t04Before.scale)>.005
    ||Math.hypot(t04Pinch.cameraX-t04Before.cameraX,
      t04Pinch.cameraY-t04Before.cameraY)>3,
    "T04 two-finger gesture must be taken over by viewport navigation");
  assert.equal(store.getVersion(id),0,"T04 cancelled drag must not Save");
  await t04Context.close();
  console.log("DIAGRAM_T04_BROWSER_SUBGATE="+JSON.stringify({
    case:"T04",browser:"Chromium "+browser.version(),
    dragBeforeSecondFinger:true,secondFingerCancelled:true,
    navigationTookOver:true,positionRestored:true,
    implicitSave:false,syntheticTouch:true,physicalDeviceVerified:false
  }));
  // T05: two-finger navigation becoming one-finger pan must NOT resume
  // the formerly cancelled node edit. Synthetic Chrome only.
  const t05Context=await browser.newContext({viewport:{width:1250,height:820},hasTouch:true});
  const t05Tab=await t05Context.newPage();
  await t05Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(t05Tab);
  const t05Node=t05Tab.locator('[data-eidos-diagram-node="sale"]');
  let t05Rect=await t05Node.boundingBox();
  await t05Tab.touchscreen.tap(t05Rect.x+t05Rect.width/2,t05Rect.y+t05Rect.height/2);
  assert.equal(await t05Node.getAttribute("aria-pressed"),"true");
  t05Rect=await t05Node.boundingBox();
  const t05X=t05Rect.x+t05Rect.width/2,t05Y=t05Rect.y+t05Rect.height/2;
  const t05Snapshot=()=>t05Tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    const m=new DOMMatrix(node.parentElement.style.transform);
    return {nodeX:Number.parseFloat(node.style.left),
      nodeY:Number.parseFloat(node.style.top),
      scale:m.a,cameraX:m.e,cameraY:m.f};
  });
  const t05Start=await t05Snapshot();
  await t05Tab.evaluate(()=>{
    window.__t05PointerEvents=[];
    for(const name of ["pointerdown","pointermove","pointerup","pointercancel","lostpointercapture"]){
      document.addEventListener(name,e=>{
        window.__t05PointerEvents.push({name,id:e.pointerId,
          target:e.target.getAttribute?.("data-eidos-diagram-node")??e.target.tagName,
          isPrimary:e.isPrimary,x:e.clientX,y:e.clientY,
          touch:e.pointerType==="touch"});
      },true);
    }
  });
  const t05Cdp=await t05Context.newCDPSession(t05Tab);
  const t05A=(x=t05X,y=t05Y)=>({x,y,id:31});
  const t05B=(x=t05X+150,y=t05Y+72)=>({x,y,id:32});
  await t05Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[t05A()]
  });
  for(let i=1;i<=5;i++)await t05Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[t05A(t05X+i*8,t05Y+i*4)]
  });
  const t05Moving=await t05Snapshot();
  assert.ok(Math.hypot(t05Moving.nodeX-t05Start.nodeX,
    t05Moving.nodeY-t05Start.nodeY)>12,"T05 must first be actively dragging a selected node");
  const t05Ax=t05X+40,t05Ay=t05Y+20;
  await t05Cdp.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[t05A(t05Ax,t05Ay),t05B()]
  });
  const t05Cancelled=await t05Snapshot();
  assert.ok(Math.abs(t05Cancelled.nodeX-t05Start.nodeX)<.001
    &&Math.abs(t05Cancelled.nodeY-t05Start.nodeY)<.001,
    "T05 adding finger must cancel former node drag");
  for(let i=1;i<=4;i++)await t05Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[
      t05A(t05Ax-i*3,t05Ay-i*2),
      t05B(t05X+150+i*16,t05Y+72+i*8)]
  });
  const t05Two=await t05Snapshot();
  const t05OneX=t05Ax-12,t05OneY=t05Ay-8;
  await t05Cdp.send("Input.dispatchTouchEvent",{
    // CDP touchEnd points are the touches BEING RELEASED, not survivors.
    // End finger B (id 32), leaving the original A (id 31) down.
    type:"touchEnd",touchPoints:[t05B(t05X+214,t05Y+104)]
  });
  const t05Transition=await t05Snapshot();
  for(let i=1;i<=5;i++)await t05Cdp.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[t05A(t05OneX+i*9,t05OneY+i*6)]
  });
  const t05Single=await t05Snapshot();
  await t05Cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  const t05Final=await t05Snapshot();
  console.log("T05_TOUCH_SEQUENCE_DIAGNOSTIC="+JSON.stringify({
    start:t05Start,moving:t05Moving,cancelled:t05Cancelled,
    twoFinger:t05Two,transition:t05Transition,
    singleFinger:t05Single,final:t05Final,
    eventTrace:await t05Tab.evaluate(()=>window.__t05PointerEvents)
  }));
  assert.ok(Math.hypot(t05Single.cameraX-t05Transition.cameraX,
    t05Single.cameraY-t05Transition.cameraY)>12,
    "T05 after second finger lifts remaining finger must pan viewport");
  assert.ok(Math.abs(t05Single.scale-t05Transition.scale)<.0001,
    "T05 remaining single finger must not continue pinch zoom");
  assert.ok(Math.abs(t05Final.nodeX-t05Start.nodeX)<.001
    &&Math.abs(t05Final.nodeY-t05Start.nodeY)<.001,
    "T05 remaining finger must never revive cancelled node drag");
  assert.equal(store.getVersion(id),0,"T05 touch navigation never implicitly saves");
  await t05Context.close();
  console.log("DIAGRAM_T05_BROWSER_SUBGATE="+JSON.stringify({
    case:"T05",browser:"Chromium "+browser.version(),
    secondFingerCancelsNodeDrag:true,singleFingerContinuesPan:true,
    noZoomAfterLift:true,nodeDoesNotResumeDrag:true,
    syntheticTouch:true,physicalDeviceVerified:false
  }));
  // T06 phone-sized Chromium touch-only interaction:
  // visible Multi-select + Box select; no keyboard/hidden long press.
  const t06Context=await browser.newContext({
    viewport:{width:420,height:860},hasTouch:true,isMobile:true,deviceScaleFactor:1
  });
  const t06Tab=await t06Context.newPage();
  await t06Tab.goto(base+"/phone",{waitUntil:"load"});
  await waitReady(t06Tab);
  const t06Multi=t06Tab.locator('[data-eidos-diagram-touch-selection="multi"]');
  const t06Box=t06Tab.locator('[data-eidos-diagram-touch-selection="box"]');
  assert.equal(await t06Multi.count(),1,"T06 mobile needs visible multi-select control");
  assert.equal(await t06Box.count(),1,"T06 mobile needs visible box-select control");
  assert.equal(await t06Multi.isVisible(),true);
  assert.equal(await t06Box.isVisible(),true);
  const t06Sale=t06Tab.locator('[data-eidos-diagram-node="sale"]');
  const t06Receipt=t06Tab.locator('[data-eidos-diagram-node="receipt"]');
  const t06Tap=async locator=>{
    const b=await locator.boundingBox();
    assert.ok(b && b.width>4 && b.height>4,"T06 touch target must be rendered");
    await t06Tab.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
  };
  const t06Geometry=await t06Tab.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    canvas:document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect().toJSON(),
    sale:document.querySelector('[data-eidos-diagram-node="sale"]').getBoundingClientRect().toJSON(),
    receipt:document.querySelector('[data-eidos-diagram-node="receipt"]').getBoundingClientRect().toJSON()
  }));
  console.log("T06_PHONE_GEOMETRY="+JSON.stringify(t06Geometry));
  await t06Multi.click();
  assert.equal(await t06Multi.getAttribute("aria-pressed"),"true");
  await t06Tap(t06Sale);
  await t06Tap(t06Receipt);
  assert.equal(await t06Sale.getAttribute("aria-pressed"),"true",
    "T06 mobile tap must preserve first selection without Shift");
  assert.equal(await t06Receipt.getAttribute("aria-pressed"),"true",
    "T06 mobile touch must add a second node without keyboard");
  await t06Tap(t06Sale);
  assert.equal(await t06Sale.getAttribute("aria-pressed"),"false",
    "T06 tapping selected node again must remove only that node");
  assert.equal(await t06Receipt.getAttribute("aria-pressed"),"true");
  await t06Multi.click();
  await t06Box.click();
  assert.equal(await t06Box.getAttribute("aria-pressed"),"true");
  const t06Selection=await t06Tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    const n=node.getBoundingClientRect();
    const v=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
    return {
      start:{x:Math.max(v.left+6,n.left-14),y:Math.max(v.top+6,n.top-14)},
      end:{x:Math.min(v.right-6,n.right+14),y:Math.min(v.bottom-6,n.bottom+14)},
      canvas:v.toJSON(),node:n.toJSON()
    };
  });
  assert.ok(t06Selection.start.x<t06Selection.end.x
    &&t06Selection.start.y<t06Selection.end.y,
    "T06 phone selection rectangle needs reachable visible region");
  const t06CDP=await t06Context.newCDPSession(t06Tab);
  const t06Start=t06Selection.start,t06End=t06Selection.end;
  await t06CDP.send("Input.dispatchTouchEvent",{
    type:"touchStart",touchPoints:[{x:t06Start.x,y:t06Start.y}]
  });
  for(let i=1;i<=8;i++)await t06CDP.send("Input.dispatchTouchEvent",{
    type:"touchMove",touchPoints:[{
      x:t06Start.x+(t06End.x-t06Start.x)*i/8,
      y:t06Start.y+(t06End.y-t06Start.y)*i/8
    }]
  });
  assert.equal(await t06Tab.locator("[data-eidos-diagram-marquee]").count(),1,
    "T06 single finger must display an actual touch selection box");
  await t06CDP.send("Input.dispatchTouchEvent",{
    type:"touchEnd",touchPoints:[]
  });
  assert.equal(await t06Tab.locator("[data-eidos-diagram-marquee]").count(),0);
  assert.equal(await t06Sale.getAttribute("aria-pressed"),"true",
    "T06 touch box must select enclosed sales node");
  assert.equal(await t06Receipt.getAttribute("aria-pressed"),"false",
    "T06 non-additive touch box must clear excluded prior selection");
  assert.equal(store.getVersion(id),0,"T06 touch selection cannot Save business projection");
  assert.deepEqual(await t06Tab.evaluate(()=>window.__errors),[]);
  await t06Context.close();
  console.log("DIAGRAM_T06_BROWSER_SUBGATE="+JSON.stringify({
    case:"T06",browser:"Chromium "+browser.version(),
    phoneViewportWidth:420,explicitVisibleTouchButtons:true,
    additiveTap:true,toggleOffTap:true,nativeTouchBox:true,
    noKeyboardOrLongPress:true,noImplicitSave:true,
    physicalPhoneVerified:false
  }));
  // T07: phone viewport orientation and simulated soft-keyboard resize.
  // This subgate is NOT physical Safari/Android, notch or actual OS keyboard.
  const t07Context=await browser.newContext({
    viewport:{width:420,height:860},hasTouch:true,isMobile:true,deviceScaleFactor:1
  });
  const t07Tab=await t07Context.newPage();
  await t07Tab.goto(base+"/phone",{waitUntil:"load"});
  await waitReady(t07Tab);
  const t07Sale=t07Tab.locator('[data-eidos-diagram-node="sale"]');
  const t07Bounding=await t07Sale.boundingBox();
  await t07Tab.touchscreen.tap(t07Bounding.x+t07Bounding.width/2,
    t07Bounding.y+t07Bounding.height/2);
  assert.equal(await t07Sale.getAttribute("aria-pressed"),"true",
    "T07 initial phone view must select a real business node");
  const t07Snapshot=()=>t07Tab.evaluate(()=>{
    const n=document.querySelector('[data-eidos-diagram-node="sale"]');
    const v=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
    const t=document.querySelector("[data-eidos-diagram-toolbar]").getBoundingClientRect();
    return {nodeX:n.style.left,nodeY:n.style.top,
      selected:n.getAttribute("aria-pressed"),
      canvasWidth:v.width,canvasHeight:v.height,
      toolbarRight:t.right,viewportWidth:window.innerWidth,
      inspectorText:document.querySelector("[data-eidos-diagram-selection]")?.textContent};
  });
  const t07Portrait=await t07Snapshot();
  assert.ok(t07Portrait.inspectorText.length>0,
    "T07 node selection drawer must remain accessible");
  await t07Tab.setViewportSize({width:860,height:420});
  await t07Tab.waitForTimeout(100);
  const t07Landscape=await t07Snapshot();
  assert.equal(t07Landscape.selected,"true",
    "T07 rotation cannot clear the selected business node");
  assert.equal(t07Landscape.nodeX,t07Portrait.nodeX);
  assert.equal(t07Landscape.nodeY,t07Portrait.nodeY);
  assert.ok(t07Landscape.canvasWidth>100 && t07Landscape.canvasHeight>100,
    "T07 landscape orientation must retain a usable graph viewport");
  assert.ok(t07Landscape.toolbarRight<=t07Landscape.viewportWidth+2,
    "T07 landscape tool region must not overflow horizontal viewport");
  await t07Tab.setViewportSize({width:420,height:860});
  await t07Tab.waitForTimeout(100);
  const t07Restored=await t07Snapshot();
  assert.equal(t07Restored.selected,"true",
    "T07 returning to portrait cannot lose selection");
  assert.equal(t07Restored.nodeX,t07Portrait.nodeX);
  assert.equal(t07Restored.nodeY,t07Portrait.nodeY);
  const t07EdgePoint=await t07Tab.evaluate(edge=>{
    const hit=document.querySelector('[data-eidos-diagram-edge="'+edge+'"]');
    const p=hit.getPointAtLength(hit.getTotalLength()*.48);
    const m=hit.getScreenCTM();
    return {x:p.x*m.a+p.y*m.c+m.e,y:p.x*m.b+p.y*m.d+m.f};
  },relationId);
  await t07Tab.touchscreen.tap(t07EdgePoint.x,t07EdgePoint.y);
  const t07PathKind=t07Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
  await t07PathKind.waitFor({state:"visible",timeout:12000});
  await t07PathKind.selectOption("orthogonal");
  await t07Tab.getByRole("button",{name:"Add path point"}).click();
  const t07Input=t07Tab.locator('[data-eidos-diagram-waypoint-controls] input[type="number"]').first();
  await t07Input.waitFor({state:"visible"});
  await t07Input.focus();
  assert.equal(await t07Input.evaluate(el=>document.activeElement===el),true,
    "T07 numeric path editor must accept focus");
  // Shrink the viewport as a test proxy for a soft keyboard overlay.
  await t07Tab.setViewportSize({width:420,height:480});
  await t07Input.scrollIntoViewIfNeeded();
  const t07Keyboard=await t07Input.boundingBox();
  assert.ok(t07Keyboard && t07Keyboard.y>=0 &&
    t07Keyboard.y+t07Keyboard.height<=480,
    "T07 focused editor should remain reachable after viewport shrinks");
  assert.equal(await t07Input.evaluate(el=>document.activeElement===el),true,
    "T07 viewport keyboard resize must not discard input focus");
  assert.equal(store.getVersion(id),0,
    "T07 viewport change and editable focus must not implicitly Save");
  console.log("DIAGRAM_T07_BROWSER_SUBGATE="+JSON.stringify({
    case:"T07",browser:"Chromium "+browser.version(),
    portrait:t07Portrait,landscape:t07Landscape,
    restoredPortrait:t07Restored,syntheticKeyboardRect:t07Keyboard,
    selectionPreserved:true,focusPreserved:true,viewportReachable:true,
    syntheticRotation:true,realSoftKeyboardVerified:false,
    physicalSafeAreaVerified:false,physicalDeviceVerified:false
  }));
  await t07Context.close();
  // E01: 3-node native Chrome business graph, with one blocking node
  // directly between the endpoints of an automatically routed orthogonal edge.
  const e01Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await e01Tab.goto(base+"/e01",{waitUntil:"load"});
  await waitReady(e01Tab);
  const e01Result=await e01Tab.evaluate(edgeId=>{
    const edge=document.querySelector('[data-eidos-diagram-edge-visual="'+edgeId+'"]');
    const hit=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const obstacle=document.querySelector('[data-eidos-diagram-node="obstacle"]');
    if(!edge||!hit||!obstacle)throw Error("E01 missing route/obstacle DOM");
    const bounds={
      x:Number.parseFloat(obstacle.style.left),y:Number.parseFloat(obstacle.style.top),
      width:Number.parseFloat(obstacle.style.width),height:Number.parseFloat(obstacle.style.height)
    };
    const samples=400;
    const length=edge.getTotalLength();
    const collisions=[];
    for(let i=0;i<=samples;i++){
      const p=edge.getPointAtLength(i*length/samples);
      if(p.x>bounds.x+2 && p.x<bounds.x+bounds.width-2
        && p.y>bounds.y+2 && p.y<bounds.y+bounds.height-2){
        collisions.push({x:p.x,y:p.y});
      }
    }
    return {
      path:edge.getAttribute("d"),obstacle:bounds,
      count:collisions.length,firstCollision:collisions[0]??null,
      congested:hit.getAttribute("data-eidos-diagram-route-congested")==="true",
      warningCount:document.querySelectorAll('[data-eidos-diagram-congestion-warning]').length,
      summary:document.querySelector('[data-eidos-diagram-congestion-summary]')?.textContent??null,
      hitCount:document.querySelectorAll('[data-eidos-diagram-edge]').length
    };
  },relationId);
  assert.equal(e01Result.hitCount,1);
  assert.match(e01Result.path,/^M /,"E01 should render a real SVG route");
  assert.ok(e01Result.count===0 || (
    e01Result.congested && e01Result.warningCount>0 && e01Result.summary),
    "E01 a routed connector may not pass through an obstacle while falsely claiming success");
  assert.deepEqual(await e01Tab.evaluate(()=>window.__errors),[]);
  assert.equal(store.getVersion(id),0,"E01 rendering must not persist presentation");
  console.log("DIAGRAM_E01_BROWSER_SUBGATE="+JSON.stringify({
    case:"E01",browser:"Chromium "+browser.version(),
    ...e01Result,
    noSilentObstacleCollision:true,syntheticBusinessFixture:true,
    physicalDeviceVerified:false
  }));
  await e01Tab.close();
  // E02: true native Chrome multi-edge business graph. Same-direction
  // parallel routes, reversed direction and self-loop must be visually
  // discriminable and independently clickable without mutating semantics.
  const e02Tab=await browser.newPage({viewport:{width:1250,height:820}});
  const e02Ready=async()=>{
    await e02Tab.waitForFunction(()=>
      document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready."
      &&document.querySelectorAll("[data-eidos-diagram-edge-visual]").length===4,
      {timeout:30000});
  };
  await e02Tab.goto(base+"/e02",{waitUntil:"load"});
  await e02Ready();
  const e02Visuals=await e02Tab.evaluate(ids=>{
    return Object.entries(ids).map(([kind,id])=>{
      const visual=document.querySelector('[data-eidos-diagram-edge-visual="'+id+'"]');
      const hit=document.querySelector('[data-eidos-diagram-edge="'+id+'"]');
      return {kind,id,path:visual?.getAttribute("d"),
        length:visual?.getTotalLength()??0,
        markerEnd:visual?.getAttribute("marker-end"),
        markerStart:visual?.getAttribute("marker-start"),
        hit:!!hit};
    });
  },e02Edges);
  assert.equal(e02Visuals.length,4);
  for(const v of e02Visuals){
    assert.ok(v.hit && v.path?.startsWith("M ") && v.length>35,
      "E02 all parallel, reverse and self-loop routes must have non-degenerate geometry");
    assert.match(v.markerEnd,/url\(#/,"E02 each business direction retains end arrow");
    assert.equal(v.markerStart,null,"E02 style cannot invert original direction");
  }
  const e02ByKind=Object.fromEntries(e02Visuals.map(v=>[v.kind,v]));
  assert.notEqual(e02ByKind.forwardA.path,e02ByKind.forwardB.path,
    "E02 two same-direction edges must have visibly distinct lanes");
  assert.notEqual(e02ByKind.reverse.path,e02ByKind.forwardA.path,
    "E02 reverse business route cannot paint over a forward arrow");
  assert.notEqual(e02ByKind.loop.path,e02ByKind.forwardA.path,
    "E02 self-loop must render as separate non-degenerate path");
  const e02Selections=[];
  for(const [kind,id] of Object.entries(e02Edges)){
    await e02Tab.goto(base+"/e02",{waitUntil:"load"});
    await e02Ready();
    const pointer=await e02Tab.evaluate(edgeId=>{
      const edge=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
      const m=edge.getScreenCTM(),len=edge.getTotalLength();
      const box=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
      for(let i=2;i<=98;i+=2){
        const p=edge.getPointAtLength(len*i/100);
        const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
        if(x<=box.left+4||x>=box.right-4||y<=box.top+4||y>=box.bottom-4)continue;
        const top=document.elementFromPoint(x,y);
        if(top?.getAttribute("data-eidos-diagram-edge")===edgeId)return {x,y};
      }
      return null;
    },id);
    assert.ok(pointer,"E02 "+kind+" must have a native mouse-clickable SVG path segment");
    await e02Tab.mouse.click(pointer.x,pointer.y);
    const panel=e02Tab.locator('select[data-eidos-diagram-edge-path-kind="'+id+'"]');
    await panel.waitFor({state:"visible",timeout:10000});
    e02Selections.push({kind,id,mouseSelected:true});
  }
  assert.equal(store.getVersion(id),0,"E02 selection cannot Save presentation");
  assert.deepEqual(await e02Tab.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_E02_BROWSER_SUBGATE="+JSON.stringify({
    case:"E02",browser:"Chromium "+browser.version(),
    rendered:e02Visuals,selection:e02Selections,
    parallelDistinct:true,reverseArrowPreserved:true,selfLoopNonDegenerate:true,
    nativeMouseSelection:true,syntheticOnly:true,physicalDeviceVerified:false
  }));
  await e02Tab.close();
  // E03: actual mouse drag of an editable path point and orthogonal segment;
  // each operation must be a single undoable presentation edit.
  const e03Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await e03Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(e03Tab);
  const e03Route=()=>shape(e03Tab);
  const e03Hit=await e03Tab.evaluate(edgeId=>{
    const h=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=h.getScreenCTM(),length=h.getTotalLength();
    for(let f=.12;f<.89;f+=.04){
      const p=h.getPointAtLength(length*f);
      const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(e03Hit,"E03 actual business edge must be clickable");
  await e03Tab.mouse.click(e03Hit.x,e03Hit.y);
  const e03Kind=e03Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
  await e03Kind.waitFor({state:"visible"});
  await e03Kind.selectOption("orthogonal");
  await e03Tab.getByRole("button",{name:"Add path point"}).click();
  const e03Initial=await e03Route();
  const e03DragCenter=async (selector,requiresTop=true)=>e03Tab.evaluate(args=>{
    for(const handle of document.querySelectorAll(args.selector)){
      const cx=Number(handle.getAttribute("cx"));
      const cy=Number(handle.getAttribute("cy"));
      const m=handle.getScreenCTM();
      const x=cx*m.a+cy*m.c+m.e,y=cx*m.b+cy*m.d+m.f;
      const top=document.elementFromPoint(x,y);
      if(!args.requiresTop||top===handle)return {x,y,axis:handle.getAttribute("aria-label")};
    }
    return null;
  },{selector,requiresTop});
  const e03Waypoint=await e03DragCenter(
    '[data-eidos-diagram-waypoint-handle="'+relationId+':0"]');
  assert.ok(e03Waypoint,"E03 actual waypoint needs a pointer-hit control");
  await e03Tab.mouse.move(e03Waypoint.x,e03Waypoint.y);
  await e03Tab.mouse.down({button:"left"});
  await e03Tab.mouse.move(e03Waypoint.x+46,e03Waypoint.y-31,{steps:8});
  assert.notEqual(await e03Route(),e03Initial,
    "E03 path point drag must visibly update SVG before mouse release");
  await e03Tab.mouse.up({button:"left"});
  const e03WaypointCommitted=await e03Route();
  assert.notEqual(e03WaypointCommitted,e03Initial);
  await e03Tab.locator("[data-eidos-diagram-canvas]").focus();
  await e03Tab.keyboard.press("Control+z");
  assert.equal(await e03Route(),e03Initial,
    "E03 one Undo must restore exact pre-drag waypoint path");
  // Undo restores a view snapshot and clears the inspector selection.
  // Re-select the real edge before asking Eidos for its segment handles.
  const e03Reopen=await e03Tab.evaluate(edgeId=>{
    const h=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=h.getScreenCTM(),length=h.getTotalLength();
    for(let f=.1;f<.91;f+=.03){
      const p=h.getPointAtLength(length*f);
      const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(e03Reopen,"E03 must reselect the route after Undo");
  await e03Tab.mouse.click(e03Reopen.x,e03Reopen.y);
  await e03Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
    .waitFor({state:"visible"});
  let e03Segment=await e03DragCenter(
    '[data-eidos-diagram-segment-handle^="'+relationId+':"]');
  const e03UsedOverlap= !e03Segment;
  if(e03UsedOverlap) {
    // B8c supported public interaction: a waypoint is drawn on top of the
    // larger orthogonal segment hit area, Shift+drag the waypoint to edit
    // the covered segment rather than weakening hit regions.
    e03Segment=await e03DragCenter(
      '[data-eidos-diagram-waypoint-handle="'+relationId+':0"]');
  }
  assert.ok(e03Segment,
    "E03 must have a usable direct or Shift-overlap segment control");
  console.log("E03_SEGMENT_HANDLE_MODE="+JSON.stringify({
    direct:!e03UsedOverlap,shiftOverlap:e03UsedOverlap
  }));
  await e03Tab.mouse.move(e03Segment.x,e03Segment.y);
  if(e03UsedOverlap)await e03Tab.keyboard.down("Shift");
  await e03Tab.mouse.down({button:"left"});
  await e03Tab.mouse.move(e03Segment.x+55,e03Segment.y+45,{steps:8});
  assert.notEqual(await e03Route(),e03Initial,
    "E03 orthogonal segment drag must visibly change actual SVG geometry");
  await e03Tab.mouse.up({button:"left"});
  if(e03UsedOverlap)await e03Tab.keyboard.up("Shift");
  assert.notEqual(await e03Route(),e03Initial);
  await e03Tab.locator("[data-eidos-diagram-canvas]").focus();
  await e03Tab.keyboard.press("Control+z");
  assert.equal(await e03Route(),e03Initial,
    "E03 one Undo must restore exact pre-drag orthogonal segment");
  assert.equal(store.getVersion(id),0,
    "E03 editing and Undo without explicit Save must not write CAS");
  assert.deepEqual(await e03Tab.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_E03_BROWSER_SUBGATE="+JSON.stringify({
    case:"E03",browser:"Chromium "+browser.version(),
    nativeWaypointDrag:true,nativeSegmentDrag:true,
    segmentUsedShiftOverlap:e03UsedOverlap,
    inMotionSVGPreview:true,oneUndoPerOperation:true,
    businessSourceTargetUnchanged:true,noImplicitSave:true,
    syntheticOnly:true,physicalDeviceVerified:false
  }));
  await e03Tab.close();
  // E04: click the actual curved ink far away from its endpoint chord.
  // A point on the ghost straight chord must NOT hit this SVG edge.
  const e04Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await e04Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(e04Tab);
  const e04GetPoint=await e04Tab.evaluate(edgeId=>{
    const e=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=e.getScreenCTM(),len=e.getTotalLength();
    for(let i=12;i<=88;i+=2){
      const p=e.getPointAtLength(len*i/100);
      const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)return {x,y};
    }
    return null;
  },relationId);
  assert.ok(e04GetPoint,"E04 source relation must have actual pointer-hit segment");
  await e04Tab.mouse.click(e04GetPoint.x,e04GetPoint.y);
  const e04Kind=e04Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
  await e04Kind.waitFor({state:"visible"});
  await e04Kind.selectOption("curve");
  assert.match(await shape(e04Tab),/ C /,"E04 must actually render a cubic, not a fake straight edge");
  const e04Geometry=await e04Tab.evaluate(edgeId=>{
    const visual=document.querySelector('[data-eidos-diagram-edge-visual="'+edgeId+'"]');
    const hit=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=hit.getScreenCTM(),len=hit.getTotalLength();
    const pointAt=t=>{
      const p=hit.getPointAtLength(len*t);
      return {x:p.x*m.a+p.y*m.c+m.e,y:p.x*m.b+p.y*m.d+m.f};
    };
    const a=pointAt(0),b=pointAt(1);
    let best=null;
    const rect=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();
    for(let i=10;i<=90;i++){
      const f=i/100,p=pointAt(f);
      const vx=b.x-a.x,vy=b.y-a.y;
      const k=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/(vx*vx+vy*vy)));
      const chord={x:a.x+k*vx,y:a.y+k*vy};
      const distance=Math.hypot(p.x-chord.x,p.y-chord.y);
      if(p.x<rect.left+12||p.x>rect.right-12||p.y<rect.top+12||p.y>rect.bottom-12)continue;
      if(chord.x<rect.left+12||chord.x>rect.right-12||chord.y<rect.top+12||chord.y>rect.bottom-12)continue;
      if(document.elementFromPoint(p.x,p.y)?.getAttribute("data-eidos-diagram-edge")!==edgeId)continue;
      if(!best||distance>best.distance)best={fraction:f,p,chord,distance};
    }
    if(!best)return null;
    return {...best,
      chordTarget:document.elementFromPoint(best.chord.x,best.chord.y)?.getAttribute("data-eidos-diagram-edge")??null,
      chordStack:[...document.elementsFromPoint(best.chord.x,best.chord.y)].slice(0,4)
        .map(x=>x.getAttribute("data-eidos-diagram-edge")),
      actualTarget:document.elementFromPoint(best.p.x,best.p.y)?.getAttribute("data-eidos-diagram-edge")??null,
      visual:visual.getAttribute("d")};
  },relationId);
  assert.ok(e04Geometry && e04Geometry.distance>15,
    "E04 cubic must have clickable ink visibly displaced >15px from endpoint chord");
  assert.equal(e04Geometry.actualTarget,relationId);
  assert.notEqual(e04Geometry.chordTarget,relationId,
    "E04 old endpoint straight chord cannot retain a ghost hit corridor");
  await e04Tab.mouse.click(e04Geometry.chord.x,e04Geometry.chord.y);
  assert.equal(await e04Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]').count(),0,
    "E04 clicking ghost-chord location must NOT select edited edge");
  // Blank click collapses the inspector and may move/refit the canvas.
  // Re-measure the painted curve after that layout change, not stale pixels.
  const e04Reselect=await e04Tab.evaluate(edgeId=>{
    const path=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=path.getScreenCTM(),len=path.getTotalLength();
    for(let i=15;i<=85;i++){
      const q=path.getPointAtLength(len*i/100);
      const x=q.x*m.a+q.y*m.c+m.e,y=q.x*m.b+q.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(e04Reselect,"E04 curve must remain hit-testable after inspector collapse");
  await e04Tab.mouse.click(e04Reselect.x,e04Reselect.y);
  await e04Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
    .waitFor({state:"visible"});
  assert.equal(store.getVersion(id),0,"E04 hit-testing cannot save business graph");
  assert.deepEqual(await e04Tab.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_E04_BROWSER_SUBGATE="+JSON.stringify({
    case:"E04",browser:"Chromium "+browser.version(),
    maxChordDistance:e04Geometry.distance,
    realCurveClick:true,ghostChordNotClickable:true,
    cubicSVG:e04Geometry.visual,syntheticOnly:true,physicalDeviceVerified:false
  }));
  await e04Tab.close();
  // E05: move one, then both business endpoints of a manual orthogonal route.
  // Hand-authored path controls must survive, not silently reset.
  const e05Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await e05Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(e05Tab);
  const e05Route=()=>shape(e05Tab);
  const e05SelectEdge=async()=>{
    const hit=await e05Tab.evaluate(edgeId=>{
      const p=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
      const m=p.getScreenCTM(),len=p.getTotalLength();
      for(let i=8;i<=92;i+=2){
        const q=p.getPointAtLength(len*i/100);
        const x=q.x*m.a+q.y*m.c+m.e,y=q.x*m.b+q.y*m.d+m.f;
        if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
          return {x,y};
      }
      return null;
    },relationId);
    assert.ok(hit,"E05 real connector must retain a clickable segment");
    await e05Tab.mouse.click(hit.x,hit.y);
    await e05Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
      .waitFor({state:"visible"});
  };
  const e05NodePos=()=>e05Tab.evaluate(()=>[...document.querySelectorAll(
    "[data-eidos-diagram-node]")].map(n=>({
      id:n.getAttribute("data-eidos-diagram-node"),
      x:Number.parseFloat(n.style.left),y:Number.parseFloat(n.style.top)
    })));
  const e05Waypoint=async()=>{
    await e05SelectEdge();
    const box=e05Tab.locator('[data-eidos-diagram-waypoint-controls="'+relationId+'"]');
    await box.waitFor({state:"visible"});
    const inputs=box.locator('input[type="number"]');
    assert.ok((await inputs.count())>=2,"E05 manual path points cannot disappear");
    return {
      x:Number(await inputs.nth(0).inputValue()),
      y:Number(await inputs.nth(1).inputValue()),
      path:await e05Route()
    };
  };
  const e05Move=async(nodeId,dx,dy)=>{
    const node=e05Tab.locator('[data-eidos-diagram-node="'+nodeId+'"]');
    const b=await node.boundingBox();
    const x=b.x+b.width/2,y=b.y+b.height/2;
    await e05Tab.mouse.move(x,y);
    await e05Tab.mouse.down({button:"left"});
    await e05Tab.mouse.move(x+dx,y+dy,{steps:9});
    await e05Tab.mouse.up({button:"left"});
  };
  await e05SelectEdge();
  await e05Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
    .selectOption("orthogonal");
  await e05Tab.getByRole("button",{name:"Add path point"}).click();
  const e05Manual=await e05Waypoint();
  const e05BeforeNodes=await e05NodePos();
  await e05Tab.locator('[data-eidos-diagram-node="sale"]').click();
  await e05Move("sale",42,19);
  const e05OneMoved=await e05NodePos();
  assert.ok(Math.hypot(e05OneMoved[0].x-e05BeforeNodes[0].x,
    e05OneMoved[0].y-e05BeforeNodes[0].y)>7,
    "E05 first endpoint must really move under native mouse");
  assert.deepEqual(e05OneMoved[1],e05BeforeNodes[1],
    "E05 moving one endpoint must preserve the other endpoint");
  const e05AfterOne=await e05Waypoint();
  assert.deepEqual({x:e05AfterOne.x,y:e05AfterOne.y},
    {x:e05Manual.x,y:e05Manual.y},
    "E05 single-endpoint move must preserve manually placed world points");
  assert.notEqual(e05AfterOne.path,e05Manual.path,
    "E05 one endpoint movement must update the SVG route");
  await e05Tab.locator("[data-eidos-diagram-canvas]").focus();
  await e05Tab.keyboard.press("Control+a");
  assert.equal(await e05Tab.locator('[data-eidos-diagram-node="sale"]').getAttribute("aria-pressed"),"true");
  assert.equal(await e05Tab.locator('[data-eidos-diagram-node="receipt"]').getAttribute("aria-pressed"),"true");
  await e05Move("sale",36,26);
  const e05BothMoved=await e05NodePos();
  const dx0=e05BothMoved[0].x-e05OneMoved[0].x;
  const dy0=e05BothMoved[0].y-e05OneMoved[0].y;
  const dx1=e05BothMoved[1].x-e05OneMoved[1].x;
  const dy1=e05BothMoved[1].y-e05OneMoved[1].y;
  assert.ok(Math.hypot(dx0,dy0)>5 && Math.abs(dx0-dx1)<.05
    &&Math.abs(dy0-dy1)<.05,
    "E05 group moving both endpoints must keep their relative geometry");
  const e05AfterBoth=await e05Waypoint();
  assert.ok(Math.abs(e05AfterBoth.x-e05Manual.x-dx0)<.1
    &&Math.abs(e05AfterBoth.y-e05Manual.y-dy0)<.1,
    "E05 moving both endpoints must translate manual path controls together");
  assert.match(e05AfterBoth.path,/^M /);
  assert.match(await e05Tab.locator('[data-eidos-diagram-edge-visual="'+relationId+'"]')
    .getAttribute("marker-end"),/url\(#/);
  assert.equal(store.getVersion(id),0,
    "E05 node and waypoint movement cannot Save implicitly");
  assert.deepEqual(await e05Tab.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_E05_BROWSER_SUBGATE="+JSON.stringify({
    case:"E05",browser:"Chromium "+browser.version(),
    manual:e05Manual,afterOne:e05AfterOne,afterBoth:e05AfterBoth,
    oneEndpointNativeDrag:true,bothEndpointsNativeGroupDrag:true,
    manualPointsStableOnSingleMove:true,translatedOnGroupMove:true,
    businessArrowPreserved:true,noImplicitSave:true,
    syntheticOnly:true,physicalDeviceVerified:false
  }));
  await e05Tab.close();
  // E06: manual curve and orthogonal path => straight is a destructive
  // presentation reset, with an explicit warning and exact one-step Undo.
  for(const e06Mode of ["curve","orthogonal"]){
    const e06Tab=await browser.newPage({viewport:{width:1250,height:820}});
    await e06Tab.goto(base+"/designer",{waitUntil:"load"});
    await waitReady(e06Tab);
    const e06Select=async()=>{
      if(await e06Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]').count())return;
      const point=await e06Tab.evaluate(edgeId=>{
        const hit=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
        const matrix=hit.getScreenCTM(),len=hit.getTotalLength();
        for(let i=10;i<=90;i+=2){
          const p=hit.getPointAtLength(len*i/100);
          const x=p.x*matrix.a+p.y*matrix.c+matrix.e,
            y=p.x*matrix.b+p.y*matrix.d+matrix.f;
          if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
            return {x,y};
        }
        return null;
      },relationId);
      assert.ok(point,"E06 business edge should remain click-selectable");
      await e06Tab.mouse.click(point.x,point.y);
      await e06Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
        .waitFor({state:"visible",timeout:10000});
    };
    await e06Select();
    const e06Dropdown=e06Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
    await e06Dropdown.selectOption(e06Mode);
    await e06Tab.getByRole("button",{name:"Add path point"}).click();
    const e06Panel=e06Tab.locator('[data-eidos-diagram-waypoint-controls="'+relationId+'"]');
    const e06Inputs=e06Panel.locator('input[type="number"]');
    assert.ok((await e06Inputs.count())>=2);
    const e06Before={
      path:await shape(e06Tab),x:await e06Inputs.nth(0).inputValue(),
      y:await e06Inputs.nth(1).inputValue()
    };
    let cancelledWarning="";
    e06Tab.once("dialog",async dialog=>{
      cancelledWarning=dialog.message();await dialog.dismiss();
    });
    await e06Dropdown.selectOption("straight");
    assert.match(cancelledWarning,/resets manual path points/i,
      "E06 destructive route reset must warn the user explicitly");
    assert.equal(await e06Dropdown.inputValue(),e06Mode,
      "E06 decline must restore the previous path-kind selector");
    assert.equal(await shape(e06Tab),e06Before.path,
      "E06 declined reset must not mutate SVG geometry");
    assert.equal(await e06Inputs.nth(0).inputValue(),e06Before.x);
    let acceptedWarning="";
    e06Tab.once("dialog",async dialog=>{
      acceptedWarning=dialog.message();await dialog.accept();
    });
    await e06Dropdown.selectOption("straight");
    assert.match(acceptedWarning,/Undo restores them/i);
    assert.equal(await e06Dropdown.inputValue(),"straight");
    const e06Straight=await shape(e06Tab);
    assert.match(e06Straight,/^M .* L /);
    assert.notEqual(e06Straight,e06Before.path,
      "E06 approved reset actually removes custom path");
    assert.equal(await e06Tab.locator('[data-eidos-diagram-waypoint-controls="'+relationId+'"]').count(),0);
    await e06Tab.locator("[data-eidos-diagram-canvas]").focus();
    await e06Tab.keyboard.press("Control+z");
    assert.equal(await shape(e06Tab),e06Before.path,
      "E06 single Undo restores complete original routed SVG path");
    await e06Select();
    const e06Restored=e06Tab.locator('[data-eidos-diagram-waypoint-controls="'+relationId+'"] input[type="number"]');
    await e06Restored.first().waitFor({state:"visible"});
    assert.equal(await e06Restored.nth(0).inputValue(),e06Before.x);
    assert.equal(await e06Restored.nth(1).inputValue(),e06Before.y);
    assert.equal(await e06Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
      .inputValue(),e06Mode);
    assert.equal(store.getVersion(id),0,
      "E06 manual path reset and Undo must not Save business projection");
    assert.deepEqual(await e06Tab.evaluate(()=>window.__errors),[]);
    console.log("DIAGRAM_E06_BROWSER_SUBGATE="+JSON.stringify({
      case:"E06",mode:e06Mode,browser:"Chromium "+browser.version(),
      actualNativeWarning:true,cancelLeavesPathUnchanged:true,
      acceptDeletesManualPath:true,oneUndoRestoresExactControls:true,
      noImplicitSave:true,physicalDeviceVerified:false
    }));
    await e06Tab.close();
  }
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
  // E07: native label drag -> Undo/Redo -> node movement follows new
  // path anchor -> explicit CAS Save -> reload -> independent readonly Viewer.
  const e07Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await e07Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(e07Tab);
  const e07EdgePoint=await e07Tab.evaluate(edgeId=>{
    const path=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=path.getScreenCTM(),len=path.getTotalLength();
    for(let i=12;i<=88;i+=2){
      const p=path.getPointAtLength(len*i/100);
      const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(e07EdgePoint,"E07 edge must be selectable before label drag");
  await e07Tab.mouse.click(e07EdgePoint.x,e07EdgePoint.y);
  await e07Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]')
    .waitFor({state:"visible"});
  const e07Label=e07Tab.locator('[data-eidos-diagram-edge-label="'+relationId+'"]');
  await e07Label.waitFor({state:"visible"});
  const e07Snapshot=()=>e07Tab.evaluate(edgeId=>{
    const l=document.querySelector('[data-eidos-diagram-edge-label="'+edgeId+'"]');
    const route=document.querySelector('[data-eidos-diagram-edge-visual="'+edgeId+'"]');
    return {x:Number(l.getAttribute("x")),y:Number(l.getAttribute("y")),
      offsetX:Number(l.getAttribute("data-eidos-diagram-label-offset-x")),
      offsetY:Number(l.getAttribute("data-eidos-diagram-label-offset-y")),
      path:route.getAttribute("d")};
  },relationId);
  const e07Initial=await e07Snapshot();
  assert.equal(e07Initial.offsetX,0);
  assert.equal(e07Initial.offsetY,0);
  const e07Hit=await e07Tab.evaluate(edgeId=>{
    const el=document.querySelector('[data-eidos-diagram-edge-label="'+edgeId+'"]');
    const box=el.getBoundingClientRect();
    const ys=[.25,.55,.75,.1,.9],xs=[.2,.35,.5,.65,.8,.1,.9];
    for(const yf of ys)for(const xf of xs){
      const x=box.left+box.width*xf,y=box.top+box.height*yf;
      const top=document.elementFromPoint(x,y);
      if(top?.closest?.('[data-eidos-diagram-edge-label="'+edgeId+'"]'))
        return {x,y,rect:box.toJSON()};
    }
    return null;
  },relationId);
  assert.ok(e07Hit,"E07 selected label must expose a native mouse hit surface");
  await e07Tab.mouse.move(e07Hit.x,e07Hit.y);
  await e07Tab.mouse.down({button:"left"});
  await e07Tab.mouse.move(e07Hit.x+45,e07Hit.y-26,{steps:8});
  const e07During=await e07Snapshot();
  assert.ok(Math.hypot(e07During.x-e07Initial.x,e07During.y-e07Initial.y)>12,
    "E07 label SVG ink must follow the actual mouse before release");
  await e07Tab.mouse.up({button:"left"});
  const e07Dragged=await e07Snapshot();
  assert.ok(Math.hypot(e07Dragged.offsetX,e07Dragged.offsetY)>20,
    "E07 drag must commit a presentation offset, not merely move DOM");
  assert.equal(e07Dragged.path,e07Initial.path,
    "E07 text move cannot rewrite business route geometry");
  await e07Tab.locator("[data-eidos-diagram-canvas]").focus();
  await e07Tab.keyboard.press("Control+z");
  const e07Undo=await e07Snapshot();
  assert.equal(e07Undo.offsetX,0,"E07 Undo must restore automatic label position");
  assert.equal(e07Undo.offsetY,0);
  await e07Tab.locator("[data-eidos-diagram-canvas]").focus();
  await e07Tab.keyboard.press("Control+y");
  const e07Redo=await e07Snapshot();
  assert.ok(Math.abs(e07Redo.offsetX-e07Dragged.offsetX)<.001
    &&Math.abs(e07Redo.offsetY-e07Dragged.offsetY)<.001,
    "E07 Redo restores exact caption offset");
  await e07Tab.locator('[data-eidos-diagram-node="sale"]').click();
  const e07Node=e07Tab.locator('[data-eidos-diagram-node="sale"]');
  const e07NodeBox=await e07Node.boundingBox();
  const ex=e07NodeBox.x+e07NodeBox.width/2,
    ey=e07NodeBox.y+e07NodeBox.height/2;
  await e07Tab.mouse.move(ex,ey);
  await e07Tab.mouse.down({button:"left"});
  await e07Tab.mouse.move(ex+44,ey+25,{steps:8});
  await e07Tab.mouse.up({button:"left"});
  const e07AfterNode=await e07Snapshot();
  assert.equal(e07AfterNode.offsetX,e07Dragged.offsetX,
    "E07 moving a node retains the label displacement");
  assert.equal(e07AfterNode.offsetY,e07Dragged.offsetY);
  assert.ok(Math.hypot(e07AfterNode.x-e07Dragged.x,
    e07AfterNode.y-e07Dragged.y)>4,
    "E07 label must follow the real route after an endpoint moves");
  const e07Save=e07Tab.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"});
  await e07Save.click();
  await e07Tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
    {timeout:30000});
  assert.equal(store.getVersion(id),2,"E07 explicit Save adds exactly one CAS revision after the V01–V04 baseline save");
  await e07Tab.reload({waitUntil:"load"});
  await waitReady(e07Tab);
  const e07Reloaded=await e07Snapshot();
  assert.ok(Math.abs(e07Reloaded.offsetX-e07Dragged.offsetX)<.001
    &&Math.abs(e07Reloaded.offsetY-e07Dragged.offsetY)<.001,
    "E07 label position must persist after a new Designer mount");
  const e07Viewer=await browser.newPage({viewport:{width:1250,height:820}});
  await e07Viewer.goto(base+"/viewer",{waitUntil:"load"});
  await waitReady(e07Viewer);
  const e07ReadOnly=await e07Viewer.evaluate(edgeId=>{
    const l=document.querySelector('[data-eidos-diagram-edge-label="'+edgeId+'"]');
    return l && {
      x:Number(l.getAttribute("x")),y:Number(l.getAttribute("y")),
      offsetX:Number(l.getAttribute("data-eidos-diagram-label-offset-x")),
      offsetY:Number(l.getAttribute("data-eidos-diagram-label-offset-y"))
    };
  },relationId);
  assert.ok(e07ReadOnly,"E07 independent readonly Viewer should render caption");
  assert.ok(Math.abs(e07ReadOnly.offsetX-e07Dragged.offsetX)<.001
    &&Math.abs(e07ReadOnly.offsetY-e07Dragged.offsetY)<.001,
    "E07 Viewer must use exactly the Designer-saved caption displacement");
  assert.equal(await e07Viewer.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"}).count(),0,
    "E07 Viewer cannot offer write action");
  const e07Saved=await read.execute(request(READ,id),ctx);
  assert.equal(e07Saved.ok,true);
  assert.equal(e07Saved.result.edges[0].arrow,"end");
  assert.ok(Math.abs(e07Saved.result.edges[0].labelOffset.x-e07Dragged.offsetX)<.001);
  assert.equal(repo.listHistory({enterpriseId:id.enterpriseId,definitionId:id.definitionId}).length,1,
    "E07 presentation Save cannot create a new business definition version");
  assert.deepEqual(await e07Tab.evaluate(()=>window.__errors),[]);
  assert.deepEqual(await e07Viewer.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_E07_BROWSER_SUBGATE="+JSON.stringify({
    case:"E07",browser:"Chromium "+browser.version(),
    nativeMouseLabelDrag:true,undoRedo:true,nodeMovementFollowsPath:true,
    explicitSaveAndFreshDesigner:true,independentViewerMatches:true,
    captionOffset:{x:e07Dragged.offsetX,y:e07Dragged.offsetY},
    businessArrowAndDefinitionRevisionPreserved:true,
    physicalDeviceVerified:false
  }));
  await e07Viewer.close();
  await e07Tab.close();

  // D01: real native Chrome UI hides a business relation and node as a
  // presentation-only draft; Save must preserve canonical business data.
  const d01Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await d01Tab.goto(base+"/designer",{waitUntil:"load"});
  await waitReady(d01Tab);
  assert.equal(store.getVersion(id),2,"D01 starts from the completed E07 saved baseline");
  const d01EdgePoint=await d01Tab.evaluate(edgeId=>{
    const path=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const transform=path.getScreenCTM(),len=path.getTotalLength();
    for(let pct=8;pct<=92;pct+=2){
      const p=path.getPointAtLength(len*pct/100);
      const x=p.x*transform.a+p.y*transform.c+transform.e;
      const y=p.x*transform.b+p.y*transform.d+transform.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(d01EdgePoint,"D01 must mouse-select the real visible relation");
  await d01Tab.mouse.click(d01EdgePoint.x,d01EdgePoint.y);
  await d01Tab.locator('[data-eidos-diagram-local-hide]').click();
  assert.equal(await d01Tab.locator(selector).count(),0,
    "D01 hidden relation must disappear from the current presentation");
  assert.equal(await d01Tab.locator('[data-eidos-diagram-node="receipt"]').count(),1);
  await d01Tab.locator('[data-eidos-diagram-node="sale"]').click();
  await d01Tab.locator('[data-eidos-diagram-local-hide]').click();
  assert.equal(await d01Tab.locator('[data-eidos-diagram-node="sale"]').count(),0,
    "D01 hidden node must disappear without deleting the business node");
  assert.equal(store.getVersion(id),2,"D01 visibility editing before Save is local only");
  const beforeSave=await read.execute(request(READ,id),ctx);
  assert.equal(beforeSave.ok,true);
  assert.equal(beforeSave.result.nodes.length,2,
    "D01 original read before Save retains both canonical business nodes");
  assert.equal(beforeSave.result.edges.length,1,
    "D01 original read before Save retains the canonical relationship");
  await d01Tab.locator('[data-eidos-diagram-toolbar] button')
    .filter({hasText:"Save projection"}).click();
  await d01Tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
    {timeout:30000});
  assert.equal(store.getVersion(id),3,"D01 explicit Save increments projection CAS once");
  const persisted=await read.execute(request(READ,id),ctx);
  assert.equal(persisted.ok,true,persisted.error?.message);
  assert.ok(persisted.result.hiddenNodeIds?.includes("sale"),
    "D01 saved projection records hidden node ID");
  assert.ok(persisted.result.hiddenEdgeIds?.includes(relationId),
    "D01 saved projection records hidden relation ID");
  assert.equal(persisted.result.nodes.length,2,
    "D01 projection hide must never delete underlying business nodes");
  assert.equal(persisted.result.edges.length,1,
    "D01 projection hide must never delete underlying business relation");
  assert.equal(persisted.result.edges[0].source,"sale");
  assert.equal(persisted.result.edges[0].target,"receipt");
  assert.equal(persisted.result.edges[0].arrow,"end");
  assert.equal(repo.listHistory({
    enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }).length,1,"D01 projection-only write cannot create a business revision");
  const d01Ready=page=>page.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
    {timeout:30000});
  await d01Tab.reload({waitUntil:"load"});
  await d01Ready(d01Tab);
  assert.equal(await d01Tab.locator('[data-eidos-diagram-node="sale"]').count(),0,
    "D01 fresh Designer must preserve hidden node");
  assert.equal(await d01Tab.locator(selector).count(),0,
    "D01 fresh Designer must preserve hidden edge");
  assert.equal(await d01Tab.locator('[data-eidos-diagram-node="receipt"]').count(),1);
  const d01Viewer=await browser.newPage({viewport:{width:1250,height:820}});
  await d01Viewer.goto(base+"/viewer",{waitUntil:"load"});
  await d01Ready(d01Viewer);
  assert.equal(await d01Viewer.locator('[data-eidos-diagram-node="sale"]').count(),0);
  assert.equal(await d01Viewer.locator(selector).count(),0);
  assert.equal(await d01Viewer.locator('[data-eidos-diagram-node="receipt"]').count(),1);
  assert.equal(await d01Viewer.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"}).count(),0,
    "D01 readonly Viewer cannot change the projection");
  assert.equal(store.getVersion(id),3,"D01 read-only operations cannot write CAS");
  assert.deepEqual(await d01Tab.evaluate(()=>window.__errors),[]);
  assert.deepEqual(await d01Viewer.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_D01_BROWSER_SUBGATE="+JSON.stringify({
    case:"D01",browser:"Chromium "+browser.version(),
    nativeMouseHideEdge:true,nativeMouseHideNode:true,
    localDraftBeforeExplicitSave:true,
    independentCasVersionBefore:2,after:3,
    persistedHiddenNode:true,persistedHiddenRelation:true,
    freshDesignerAndReadonlyViewerHide:true,
    businessNodes:2,businessEdges:1,businessRevisions:1,
    formalHumanSignedCases:0,physicalDeviceVerified:false
  }));
  await d01Viewer.close();
  await d01Tab.close();

  // D02: multiple distinct edits, one-command undo/redo, explicit Save,
  // then a fresh undo-to-saved-baseline; never create a business revision.
  const d02Tab=await browser.newPage({viewport:{width:1250,height:820}});
  await d02Tab.goto(base+"/designer",{waitUntil:"load"});
  await d02Tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
    {timeout:30000});
  assert.equal(store.getVersion(id),3,"D02 begins after the committed D01 projection");
  assert.equal(await d02Tab.locator('[data-eidos-diagram-node="sale"]').count(),0);
  await d02Tab.locator("[data-eidos-diagram-more-actions] summary").click();
  await d02Tab.locator("[data-eidos-diagram-local-visibility-reset]").click();
  assert.equal(await d02Tab.locator('[data-eidos-diagram-node="sale"]').count(),1,
    "D02 restoring visibility is the first undo checkpoint");
  assert.equal(await d02Tab.locator(selector).count(),1);
  const d02XY=()=>d02Tab.evaluate(()=>{
    const node=document.querySelector('[data-eidos-diagram-node="sale"]');
    return {x:Number.parseFloat(node.style.left),y:Number.parseFloat(node.style.top)};
  });
  const d02Original=await d02XY();
  const d02Node=d02Tab.locator('[data-eidos-diagram-node="sale"]');
  await d02Node.click();
  let d02Box=await d02Node.boundingBox();
  await d02Tab.mouse.move(d02Box.x+d02Box.width/2,d02Box.y+d02Box.height/2);
  await d02Tab.mouse.down({button:"left"});
  await d02Tab.mouse.move(d02Box.x+d02Box.width/2+52,
    d02Box.y+d02Box.height/2+29,{steps:8});
  await d02Tab.mouse.up({button:"left"});
  const d02Moved=await d02XY();
  assert.ok(Math.hypot(d02Moved.x-d02Original.x,d02Moved.y-d02Original.y)>12,
    "D02 native mouse node move must be a second edit");
  const d02EdgePoint=await d02Tab.evaluate(edgeId=>{
    const path=document.querySelector('[data-eidos-diagram-edge="'+edgeId+'"]');
    const m=path.getScreenCTM(),len=path.getTotalLength();
    for(let i=12;i<=88;i+=2){
      const p=path.getPointAtLength(len*i/100);
      const x=p.x*m.a+p.y*m.c+m.e,y=p.x*m.b+p.y*m.d+m.f;
      if(document.elementFromPoint(x,y)?.getAttribute("data-eidos-diagram-edge")===edgeId)
        return {x,y};
    }
    return null;
  },relationId);
  assert.ok(d02EdgePoint,"D02 must select the actual editable business edge");
  await d02Tab.mouse.click(d02EdgePoint.x,d02EdgePoint.y);
  const d02Kind=d02Tab.locator('select[data-eidos-diagram-edge-path-kind="'+relationId+'"]');
  await d02Kind.waitFor({state:"visible"});
  assert.equal(await d02Kind.inputValue(),"curve");
  await d02Kind.selectOption("orthogonal");
  assert.equal(await d02Kind.inputValue(),"orthogonal");
  assert.equal(store.getVersion(id),3,"D02 three edits cannot implicitly Save");

  const d02Undo=d02Tab.locator('[data-eidos-diagram-history="undo"]');
  const d02Redo=d02Tab.locator('[data-eidos-diagram-history="redo"]');
  await d02Undo.click();
  // Undo is checked via the actual painted SVG, without stale click coordinates.
  assert.match(await shape(d02Tab),/ C /,
    "D02 first Undo reverts only the edge style to its previous curve");
  assert.deepEqual(await d02XY(),d02Moved,
    "D02 first Undo retains the preceding node displacement");
  await d02Undo.click();
  assert.deepEqual(await d02XY(),d02Original,
    "D02 second Undo restores original node coordinates");
  assert.equal(await d02Tab.locator('[data-eidos-diagram-node="sale"]').count(),1);
  await d02Undo.click();
  assert.equal(await d02Tab.locator('[data-eidos-diagram-node="sale"]').count(),0,
    "D02 third Undo reverses only the visibility restore");
  assert.equal(await d02Tab.locator(selector).count(),0);
  await d02Redo.click();
  assert.equal(await d02Tab.locator('[data-eidos-diagram-node="sale"]').count(),1);
  await d02Redo.click();
  assert.deepEqual(await d02XY(),d02Moved);
  await d02Redo.click();
  assert.match(await shape(d02Tab),/ L /,
    "D02 third Redo restores the orthogonal route");
  assert.equal(store.getVersion(id),3,
    "D02 Undo/Redo updates only local presentation until explicit Save");
  await d02Tab.locator("[data-eidos-diagram-toolbar] button")
    .filter({hasText:"Save projection"}).click();
  await d02Tab.waitForFunction(()=>
    document.querySelector("[data-eidos-diagram-status]")?.textContent==="Saved.",
    {timeout:30000});
  assert.equal(store.getVersion(id),4,"D02 explicit Save advances CAS once");
  assert.equal(await d02Undo.isDisabled(),true,
    "D02 saving defines a new baseline rather than retaining old Undo history");
  assert.equal(await d02Redo.isDisabled(),true);
  const d02Persisted=await read.execute(request(READ,id),ctx);
  assert.equal(d02Persisted.ok,true);
  assert.equal(d02Persisted.result.hiddenNodeIds?.includes("sale")??false,false);
  assert.equal(d02Persisted.result.edges[0].pathKind,"orthogonal");
  await d02Tab.locator('[data-eidos-diagram-node="sale"]').click();
  d02Box=await d02Tab.locator('[data-eidos-diagram-node="sale"]').boundingBox();
  await d02Tab.mouse.move(d02Box.x+d02Box.width/2,d02Box.y+d02Box.height/2);
  await d02Tab.mouse.down({button:"left"});
  await d02Tab.mouse.move(d02Box.x+d02Box.width/2+36,
    d02Box.y+d02Box.height/2+22,{steps:8});
  await d02Tab.mouse.up({button:"left"});
  assert.ok(Math.hypot((await d02XY()).x-d02Moved.x,
    (await d02XY()).y-d02Moved.y)>8,
    "D02 new edit after Save must become unsaved");
  assert.match(await d02Tab.locator("[data-eidos-diagram-status]").textContent(),
    /No changes were saved/,
    "D02 an actual new node move remains a local, unsaved edit");
  await d02Undo.click();
  assert.deepEqual(await d02XY(),d02Moved,
    "D02 undo after Save must return to the new saved node baseline");
  assert.equal((await d02Tab.locator("[data-eidos-diagram-status]").textContent())?.trim(),"Saved.",
    "D02 undoing the sole post-Save edit must clear the dirty status");
  assert.equal(store.getVersion(id),4,"D02 Undo-to-baseline must not write again");
  assert.equal(repo.listHistory({
    enterpriseId:id.enterpriseId,definitionId:id.definitionId
  }).length,1,"D02 visual edits never create business revisions");
  assert.deepEqual(await d02Tab.evaluate(()=>window.__errors),[]);
  console.log("DIAGRAM_D02_BROWSER_SUBGATE="+JSON.stringify({
    case:"D02",browser:"Chromium "+browser.version(),
    nativeNodeDrag:true,threeDifferentEdits:true,threeStepUndo:true,
    threeStepRedo:true,explicitCasVersionBefore:3,after:4,
    saveClearsOldUndoRedo:true,undoToSavedBaselineNotDirty:true,
    businessRevisions:1,physicalDeviceVerified:false
  }));
  await d02Tab.close();

}finally{
  await browser?.close();
  server.closeAllConnections?.();server.close();
  rmSync(tmp,{recursive:true,force:true});
}
