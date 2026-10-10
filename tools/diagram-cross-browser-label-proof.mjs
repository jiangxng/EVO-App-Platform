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
 {id:"cjk-emoji",caption:"销售到收款👩‍💻｜采购到付款🧾｜請求書照合・日本語処理を確認",direction:"ltr"}
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
      const {diagramCaptionLayoutV010}=await import("/dist/vendor/eidos/src/diagram/label-reservation.js");
      const anchor={x:Number(edge.getAttribute("x")),
        y:Number(edge.getAttribute("y"))+8+14*(Math.max(0,rows.length-1))/2};
      const estimated=diagramCaptionLayoutV010(anchor,window.__state.edges[0].label,
        text=>c.measureText(text));
      return {direction:edge.getAttribute("direction"),canvasWidths,svgWidths,
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
    }finally{await page.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,cases.length*2);
 console.log("B8S_CROSS_BROWSER_RESULT="+JSON.stringify({
  engines:["firefox","webkit"],samples:results.length,cases:results,
  note:"Real Firefox and WebKit SVG metrics. Font-dependent widths need not match pixel-for-pixel; physical devices not covered."}));
}finally{
 if(serverStarted){server.closeAllConnections?.();server.close();}
}
