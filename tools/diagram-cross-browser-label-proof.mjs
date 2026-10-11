#!/usr/bin/env node
/** B8s: actual Firefox/WebKit browser rendering of SVG RTL text.
 * Captures each engine's native text metrics; pixel-identical wrapping
 * is NOT asserted because fallback fonts and shaping differ.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {once} from "node:events";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {firefox,webkit} from "playwright";
import {renderDiagramEditorPageShellToHtmlV010,
 validateDiagramEditorStateV010} from "../dist/vendor/eidos/src/diagram/surface.js";
const definition={
 contractVersion:"0.1.0",kind:"diagram-editor",id:"b8s-cross-browser",
 title:"Cross-engine Label Proof",resourceId:"b8s:readonly",
 readCommand:{code:"b8s.read",inputVersion:"0.1.0"},
 initialCamera:{scale:1,translateX:10,translateY:10},
 viewInteraction:{zoom:true,pan:true,localEdgePathEdit:false,localNodeDrag:false}
};
const cases=[
 {id:"rtl-ar",caption:"مرحبا بالعالم · أمر شراء 2026 · فاتورة مورد ومطابقة التحصيل حسابات الشركة",direction:"rtl"},
 {id:"rtl-he",caption:"חשבונית ספק 2026 · אישור חשבונות לתשלום והשלמת ההתאמות",direction:"rtl"},
 {id:"ltr-en",caption:"Accounts payable approval process and purchase order payment reconciliation",direction:"ltr"},
 {id:"cjk-emoji",caption:"销售到收款👩‍💻｜采购到付款🧾｜請求書照合・日本語処理を確認",direction:"ltr"},
 // B8u: distinct shaping/fallback sequences. Do not reverse logical text.
 {id:"rtl-ar-diacritics",caption:"تَسْوِيَةُ الْحِسَابَاتِ 2026 · مراجعة الطلبات والفواتير · حساب الشركة",direction:"rtl"},
 {id:"rtl-he-niqqud",caption:"שָׁלוֹם · בְּדִיקַת חֶשְׁבּוֹן 2026 · אישור תשלומים נוספים",direction:"rtl"},
 {id:"ltr-zwj-mixed",caption:"Approval 👩‍💻 / 👨‍👩‍👧‍👦 — नमस्ते · 買掛金 · 合同验收",direction:"ltr"}
];
const nodes=[
 {id:"a",kind:"subject",label:"Sales",shape:"rounded-rectangle",x:40,y:85,width:150,height:64},
 {id:"b",kind:"subject",label:"Cash",shape:"rounded-rectangle",x:590,y:85,width:150,height:64}
];
function state(caption){
 return {contractVersion:"0.1.0",resourceId:definition.resourceId,
  revision:1,lifecycleState:"DRAFT",nodes,
  edges:[{id:"business-relation",kind:"test",source:"a",target:"b",
   pathKind:"curve",label:caption,arrow:"end"}]};
}
const rootMarkup=renderDiagramEditorPageShellToHtmlV010(definition);
const fixtures=new Map(cases.map(test=>{
 const value=state(test.caption);
 const valid=validateDiagramEditorStateV010(value);
 assert.equal(valid.ok,true,valid.issues.join("; "));
 const html='<!doctype html><html><head><meta charset="utf-8">'
  +'<meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<style>html,body{margin:0;height:100%}main{height:760px;width:1150px}</style>'
  +'</head><body><main id="root">'+rootMarkup+'</main>'
  +'<script>window.__state='+JSON.stringify(value)
  +';window.__errors=[];window.addEventListener("error",e=>window.__errors.push(e.message));'
  +'window.addEventListener("unhandledrejection",e=>window.__errors.push(String(e.reason)));'
  +'</script><script type="module">'
  +'import {mountDiagramEditorPageV010} from "/dist/vendor/eidos/src/diagram/surface.js";'
  +'mountDiagramEditorPageV010({definition:'+JSON.stringify(definition)
  +',container:document.getElementById("root"),'
  +'actionHost:{async execute(){return {ok:true,result:window.__state}}}});'
  +'</script></body></html>';
 return [test.id,html];
}));
// 258 painted RTL labels probe the existing 256 getBBox cap on a real DOM.
const capState=state("שלום");
capState.edges=Array.from({length:258},(_,i)=>({
 id:"cap-edge-"+i,kind:"test",source:"a",target:"b",
 pathKind:"straight",label:"שלום "+i,arrow:"end"
}));
const capValid=validateDiagramEditorStateV010(capState);
assert.equal(capValid.ok,true,capValid.issues.join("; "));
const baseCaption=cases.find(sample=>sample.id==="rtl-he").caption;
const sourceJSON=JSON.stringify(state(baseCaption));
const sourceHTML=fixtures.get("rtl-he");
assert.ok(sourceHTML?.includes(sourceJSON));
fixtures.set("rtl-cap-258",sourceHTML.replace(sourceJSON,JSON.stringify(capState)));
// B8x: an independent pair of actual Eidos Surface instances on ONE page.
// The first has 23 local obstacles (the unchanged 22-obstacle router budget);
// the second has a simple clear curve. Both must own separate selection,
// congestion notices, resource IDs, route geometry and marker SVG IDs.
const dualDefinitions=[
 {...definition,id:"b8x-congested",resourceId:"b8x:congested",
  initialCamera:{scale:0.8,translateX:12,translateY:14}},
 {...definition,id:"b8x-clear",resourceId:"b8x:clear",
  initialCamera:{scale:0.8,translateX:12,translateY:14}}
];
const dualNodesA=[
 {id:"crowded-a",kind:"subject",label:"Source",shape:"rounded-rectangle",
  x:20,y:200,width:130,height:64},
 {id:"crowded-b",kind:"subject",label:"Target",shape:"rounded-rectangle",
  x:880,y:200,width:130,height:64},
 ...Array.from({length:23},(_,i)=>({
  id:"block-"+i,kind:"subject",label:"Block "+i,
  shape:"rounded-rectangle",x:180+i*26,y:200,width:58,height:64
 }))
];
const dualNodesB=[
 {id:"clear-a",kind:"subject",label:"Left",shape:"rounded-rectangle",
  x:20,y:150,width:130,height:64},
 {id:"clear-b",kind:"subject",label:"Right",shape:"rounded-rectangle",
  x:690,y:150,width:130,height:64}
];
const dualStates=[
 {contractVersion:"0.1.0",resourceId:dualDefinitions[0].resourceId,
  revision:1,lifecycleState:"DRAFT",nodes:dualNodesA,
  edges:[{id:"blocked-relation",kind:"test",source:"crowded-a",target:"crowded-b",
    pathKind:"orthogonal",arrow:"end",label:"Review required"}]},
 {contractVersion:"0.1.0",resourceId:dualDefinitions[1].resourceId,
  revision:1,lifecycleState:"DRAFT",nodes:dualNodesB,
  edges:[{id:"clear-relation",kind:"test",source:"clear-a",target:"clear-b",
    pathKind:"curve",arrow:"end",label:"No congestion"}]}
];
dualStates.forEach(value=>{
 const checked=validateDiagramEditorStateV010(value);
 assert.equal(checked.ok,true,"B8x fixture must be legal: "+checked.issues.join("; "));
});
fixtures.set("b8x-two-instances",
 '<!doctype html><html><head><meta charset="utf-8">'
 +'<meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<style>html,body{margin:0;}main{height:690px;width:1190px}'
 +'[data-eidos-diagram-editor]{height:680px!important;min-height:560px}</style>'
 +'</head><body>'
 +'<main id="b8x-first">'+renderDiagramEditorPageShellToHtmlV010(dualDefinitions[0])+'</main>'
 +'<main id="b8x-second">'+renderDiagramEditorPageShellToHtmlV010(dualDefinitions[1])+'</main>'
 +'<script>window.__dualStates='+JSON.stringify(dualStates)
 +';window.__errors=[];window.addEventListener("error",e=>window.__errors.push(e.message));'
 +'window.addEventListener("unhandledrejection",e=>window.__errors.push(String(e.reason)));'
 +'</script><script type="module">'
 +'import {mountDiagramEditorPageV010} from "/dist/vendor/eidos/src/diagram/surface.js";'
 +dualDefinitions.map((def,i)=>
  'mountDiagramEditorPageV010({definition:'+JSON.stringify(def)
  +',container:document.getElementById("b8x-'+(i===0?'first':'second')+'"),'
  +'actionHost:{async execute(){return {ok:true,result:window.__dualStates['+i+']}}}});'
 ).join("")
 +'</script></body></html>');
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1");
  if(url.pathname==="/fixture"){
   const html=fixtures.get(url.searchParams.get("case"));
   if(!html){res.writeHead(404);res.end("unknown");return;}
   res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
   res.end(html);return;
  }
  if(url.pathname.startsWith("/dist/")){
   const base=resolve(process.cwd(),"dist"),full=resolve(process.cwd(),"."+url.pathname);
   if(!full.startsWith(base+"/"))throw Error("Unsafe JS module path");
   res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});
   res.end(await readFile(full));return;
  }
  res.writeHead(404);res.end("not found");
 }catch(error){res.writeHead(500);res.end(String(error));}
});
let serverStarted=false;
try{
 server.listen(0,"127.0.0.1");await once(server,"listening");serverStarted=true;
 const origin="http://127.0.0.1:"+server.address().port;
 const results=[];
 const postSelectResults=[];
 const limitResults=[];
 for(const [engine,browserType] of [["firefox",firefox],["webkit",webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const sample of cases){
    const page=await browser.newPage({viewport:{width:1150,height:800}});
    try{
     await page.goto(origin+"/fixture?case="+sample.id,{waitUntil:"load"});
     await page.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
       {timeout:30000});
     await page.evaluate(()=>document.fonts.ready);
     const result=await page.evaluate(async()=>{
      const edge=document.querySelector("[data-eidos-diagram-edge-label='business-relation']");
      if(!edge)throw Error("B8s rendered SVG label missing");
      const bbox=edge.getBBox();
      const rowElements=[...edge.querySelectorAll("tspan")];
      const rows=rowElements.map(t=>t.textContent);
      const c=document.createElement("canvas").getContext("2d");
      c.font="11px "+getComputedStyle(document.querySelector("[data-eidos-diagram-canvas]")).fontFamily;
      const canvasWidths=rows.map(row=>c.measureText(row).width);
      const svgWidths=rowElements.map(t=>t.getBBox().width);
      const variants=[];
      if(edge.getAttribute("direction")==="rtl"){
       for(const variant of ["original","child-middle","child-end",
         "parent-start","parent-end","no-plaintext","per-child-plaintext",
         "per-child-isolate"]){
        const temp=edge.cloneNode(true);
        temp.removeAttribute("data-eidos-diagram-edge-label");
        const spans=[...temp.querySelectorAll("tspan")];
        if(variant==="child-middle")spans.forEach(t=>t.setAttribute("text-anchor","middle"));
        if(variant==="child-end")spans.forEach(t=>t.setAttribute("text-anchor","end"));
        if(variant==="parent-start")temp.setAttribute("text-anchor","start");
        if(variant==="parent-end")temp.setAttribute("text-anchor","end");
        if(variant==="no-plaintext")temp.removeAttribute("unicode-bidi");
        if(variant==="per-child-plaintext")spans.forEach(t=>t.setAttribute("unicode-bidi","plaintext"));
        if(variant==="per-child-isolate")spans.forEach(t=>t.setAttribute("unicode-bidi","isolate"));
        edge.parentElement.appendChild(temp);
        const value=temp.getBBox();
        variants.push({variant,left:value.x,right:value.x+value.width,width:value.width});
        temp.remove();
       }
      }
      const {diagramCaptionLayoutV010}=await import("/dist/vendor/eidos/src/diagram/label-reservation.js");
      const anchor={x:Number(edge.getAttribute("data-eidos-diagram-caption-world-x")),
        y:Number(edge.getAttribute("y"))+8+14*(Math.max(0,rows.length-1))/2};
      const estimated=diagramCaptionLayoutV010(anchor,window.__state.edges[0].label,
        text=>c.measureText(text));
      return {direction:edge.getAttribute("direction"),canvasWidths,svgWidths,variants,
       left:bbox.x,right:bbox.x+bbox.width,
       reservedBox:estimated.box,
       computedDirection:getComputedStyle(edge).direction,
       unicodeBidi:edge.getAttribute("unicode-bidi"),
       rows:rows.length||1,
       renderedText:rows.join("")||edge.textContent,
       title:edge.querySelector("title")?.textContent,
       aria:edge.getAttribute("aria-label"),
       width:bbox.width,height:bbox.height,
       route:document.querySelector("[data-eidos-diagram-edge-visual='business-relation']")
        ?.getAttribute("d"),
       errors:window.__errors};
     });
     assert.deepEqual(result.errors,[],engine+" script errors");
     assert.equal(result.direction,sample.direction);
     assert.equal(result.computedDirection,sample.direction,engine+" computed bidi");
     assert.equal(result.unicodeBidi,"plaintext");
     assert.ok(result.rows>=1&&result.rows<=4);
     assert.ok(result.width>5&&Number.isFinite(result.width));
     assert.ok(result.height>0&&Number.isFinite(result.height));
     if(sample.direction==="rtl")console.log("B8S_ANCHOR_DIAGNOSTIC="+JSON.stringify({
       engine,case:sample.id,box:result.reservedBox,
       left:result.left,right:result.right,variants:result.variants}));
     assert.ok(result.width<=result.reservedBox.width+3,
       engine+" SVG glyph width must not exceed stable route collision reservation");
     assert.ok(result.left>=result.reservedBox.x-6
       && result.right<=result.reservedBox.x+result.reservedBox.width+6,
       engine+" actual SVG bbox must remain inside world-space collision reservation");
     assert.ok(result.route?.includes(" C "));
     assert.ok(result.title===sample.caption||result.renderedText===sample.caption,
       engine+" source caption must survive in title or SVG logical text");
     results.push({engine,case:sample.id,direction:result.computedDirection,
      rows:result.rows,
      canvasWidths:result.canvasWidths.map(x=>Math.round(x*100)/100),
      svgWidths:result.svgWidths.map(x=>Math.round(x*100)/100),
      width:Math.round(result.width*100)/100,
      reservedWidth:Math.round(result.reservedBox.width*100)/100,
      height:Math.round(result.height*100)/100,
      titlePreserved:result.title===sample.caption});
     console.log("B8S_BROWSER_CASE="+JSON.stringify(results.at(-1)));
     // B8w: actual browser mouse click causes a fresh, selected-node
     // render. Recheck the final painted SVG ink against the ORIGINAL
     // world-space route box; a first-render-only bidi fix is insufficient.
     await page.locator("[data-eidos-diagram-node='a']").click();
     const after=await page.evaluate(async()=>{
      const label=document.querySelector("[data-eidos-diagram-edge-label='business-relation']");
      if(!label)throw Error("B8w related edge label missing after native selection");
      const bbox=label.getBBox();
      const rows=[...label.querySelectorAll("tspan")];
      const {diagramCaptionLayoutV010}=await import("/dist/vendor/eidos/src/diagram/label-reservation.js");
      const fontContext=document.createElement("canvas").getContext("2d");
      fontContext.font="11px "+getComputedStyle(document.querySelector("[data-eidos-diagram-canvas]")).fontFamily;
      const originalAnchor={x:Number(label.getAttribute("data-eidos-diagram-caption-world-x")),
       y:Number(label.getAttribute("y"))+8+14*Math.max(0,rows.length-1)/2};
      const reserved=diagramCaptionLayoutV010(originalAnchor,window.__state.edges[0].label,
       value=>fontContext.measureText(value)).box;
      return {left:bbox.x,right:bbox.x+bbox.width,width:bbox.width,
       reserved,dir:label.getAttribute("direction"),
       labelPreserved:label.querySelector("title")?.textContent===window.__state.edges[0].label
        || (rows.map(t=>t.textContent).join("")||label.textContent)===window.__state.edges[0].label,
       errors:window.__errors,
       congestionSummary:document.querySelector("[data-eidos-diagram-congestion-summary]")?.getAttribute("data-eidos-diagram-congestion-summary")??null,
       congestionCount:document.querySelector("[data-eidos-diagram-congested-count]")?.getAttribute("data-eidos-diagram-congested-count")
       };
     });
     assert.deepEqual(after.errors,[],engine+" native selected-node rerender errors");
     assert.equal(after.congestionCount,"0",engine+" safe single edge must count zero congested routes");
     assert.equal(after.congestionSummary,null,engine+" zero-congestion graph must not show advisory");
     assert.equal(after.dir,sample.direction,engine+" bidi direction must survive selection");
     assert.equal(after.labelPreserved,true,engine+" rerender must preserve original caption");
     assert.ok(after.width>5&&Number.isFinite(after.width));
     assert.ok(after.left>=after.reserved.x-6
       && after.right<=after.reserved.x+after.reserved.width+6,
       engine+" selected rerendered SVG ink exceeds original world reservation");
     postSelectResults.push({engine,case:sample.id,
      measuredWidth:Math.round(after.width*100)/100,
      retainedBidi:after.dir===sample.direction});
    }finally{await page.close();}
   }
   const capPage=await browser.newPage({viewport:{width:1150,height:800}});
   try {
    await capPage.goto(origin+"/fixture?case=rtl-cap-258",{waitUntil:"load"});
    await capPage.waitForFunction(()=>document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.",
      {timeout:30000});
    // Dense diagrams intentionally hide unselected edge captions (>18).
    // Select their shared endpoint to make all 258 captions actually painted.
    const beforeSelect=await capPage.locator("[data-eidos-diagram-caption-direction='rtl']").count();
    assert.equal(beforeSelect,0,engine+" must preserve the dense unselected-caption policy");
    await capPage.locator("[data-eidos-diagram-node='a']").click();
    await capPage.waitForFunction(()=>
      document.querySelectorAll("[data-eidos-diagram-caption-direction='rtl']").length===258,
      {timeout:30000});
    const diagnostic=await capPage.evaluate(()=>({
      count:document.querySelectorAll("[data-eidos-diagram-caption-direction='rtl']").length,
      capped:document.querySelector("svg[data-eidos-diagram-bidi-measure-limit]")?.getAttribute("data-eidos-diagram-bidi-measure-limit"),
      errors:window.__errors
    }));
    assert.deepEqual(diagnostic.errors,[],engine+" label-cap script errors");
    assert.equal(diagnostic.count,258,engine+" must paint all labels, not silently drop excess");
    assert.equal(diagnostic.capped,"true",engine+" expensive RTL measurements must be bounded");
    limitResults.push({engine,...diagnostic});
    console.log("B8U_MEASURE_LIMIT="+JSON.stringify({engine,count:diagnostic.count,capped:diagnostic.capped}));
   } finally { await capPage.close(); }
   const dualPage=await browser.newPage({viewport:{width:1200,height:1500}});
   try{
    await dualPage.goto(origin+"/fixture?case=b8x-two-instances",{waitUntil:"load"});
    await dualPage.waitForFunction(()=>{
     const roots=["#b8x-first","#b8x-second"];
     return roots.every(selector=>
      document.querySelector(selector+" [data-eidos-diagram-status]")?.textContent==="Ready.");
    },{timeout:30000});
    const inspect=()=>dualPage.evaluate(()=>{
     const check=selector=>{
      const root=document.querySelector(selector);
      const svg=root.querySelector("svg[data-eidos-diagram-congested-count]");
      const hitCount=root.querySelectorAll("[data-eidos-diagram-route-congested]").length;
      const summary=root.querySelector("[data-eidos-diagram-congestion-summary]");
      return {status:root.querySelector("[data-eidos-diagram-status]")?.textContent,
       count:Number(svg?.getAttribute("data-eidos-diagram-congested-count")),
       hits:hitCount,summary:summary?.textContent??null,
       summaryRole:summary?.getAttribute("role")??null,
       summaryPointer:summary?.style.pointerEvents??null,
       selection:root.querySelector("[data-eidos-diagram-editor]")?.getAttribute("data-has-selection"),
       marker:root.querySelector("marker[id^='eidos-diagram-arrow-']")?.id,
       edgeCount:root.querySelectorAll("[data-eidos-diagram-edge]").length};
     };
     return {first:check("#b8x-first"),second:check("#b8x-second"),
       errors:window.__errors,
       stateCounts:window.__dualStates.map(s=>({nodes:s.nodes.length,edges:s.edges.length}))};
    });
    const before=await inspect();
    assert.deepEqual(before.errors,[],engine+" two-instance startup errors");
    assert.equal(before.first.edgeCount,1);
    assert.equal(before.second.edgeCount,1);
    assert.equal(before.first.count,before.first.hits,
     engine+" busy instance count should exactly match its own congested hits");
    assert.ok(before.first.count>0,engine+" 23 blockers must trigger bounded-route congestion");
    assert.equal(before.first.summaryRole,"note");
    assert.equal(before.first.summaryPointer,"none");
    assert.equal(before.second.count,0,"clear sibling must have no congestion");
    assert.equal(before.second.hits,0);
    assert.equal(before.second.summary,null);
    assert.ok(before.first.marker&&before.second.marker);
    assert.notEqual(before.first.marker,before.second.marker,
     engine+" SVG marker ids must be isolated per mounted surface");
    assert.equal(before.first.selection,"false");
    assert.equal(before.second.selection,"false");
    await dualPage.locator("#b8x-second [data-eidos-diagram-node='clear-a']").click();
    const afterSecond=await inspect();
    assert.equal(afterSecond.first.selection,"false",
     engine+" selection on sibling must not change first Surface");
    assert.equal(afterSecond.second.selection,"true");
    assert.equal(afterSecond.first.count,before.first.count);
    assert.equal(afterSecond.second.count,0);
    await dualPage.locator("#b8x-first [data-eidos-diagram-node='crowded-a']").click();
    const afterFirst=await inspect();
    assert.equal(afterFirst.first.selection,"true");
    assert.equal(afterFirst.second.selection,"true",
     engine+" selecting first Surface must preserve the second selection");
    assert.equal(afterFirst.first.count,afterFirst.first.hits);
    assert.equal(afterFirst.second.count,0);
    assert.deepEqual(afterFirst.stateCounts,before.stateCounts,
     "presentation selection must not mutate business graph fixture");
    assert.deepEqual(afterFirst.errors,[],engine+" independent selection errors");
    console.log("B8X_MULTI_INSTANCE_RESULT="+JSON.stringify({
     engine,first:afterFirst.first,second:afterFirst.second,
     independentSelection:true,distinctSvgMarkers:true,
     warning:"Real Linux engine with two Eidos instances; not physical-device P02 signoff"
    }));
   }finally{await dualPage.close();}
  }finally{await browser.close();}
 }
 assert.equal(results.length,cases.length*2);
 assert.equal(postSelectResults.length,cases.length*2);
 assert.equal(limitResults.length,2);
 console.log("B8W_POST_SELECT_RESULT="+JSON.stringify({
  engines:["firefox","webkit"],nativeClicks:postSelectResults.length,
  cases:postSelectResults,
  note:"Native pointer selection re-render of real SVG; not physical-device validation"
 }));
 console.log("B8U_COMPLEX_TEXT_RESULT="+JSON.stringify({
  engines:["firefox","webkit"],samples:results.length,capProbes:limitResults,
  warning:"Linux browser engines only; not a Safari/iOS or physical-device acceptance"}));
 console.log("B8S_CROSS_BROWSER_RESULT="+JSON.stringify({
  engines:["firefox","webkit"],samples:results.length,cases:results,
  note:"Real Firefox and WebKit SVG metrics. Font-dependent widths need not match pixel-for-pixel; physical devices not covered."}));
}finally{
 if(serverStarted){server.closeAllConnections?.();server.close();}
}
