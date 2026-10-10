#!/usr/bin/env node
/** P01a synthetic Eidos DOM stress harness, not a business correctness test.
 * Real Chrome renders full nodes/edges and dispatches native mouse input.
 * Records metrics only; hardware-independent performance gates are NOT inferred.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  renderDiagramEditorPageShellToHtmlV010
} from "../dist/vendor/eidos/src/diagram/surface.js";

const CHROME = process.env.CHROME;
assert.ok(CHROME, "CHROME must be an installed Chrome/Chromium binary");
const denseMode=process.env.EVO_DENSE_B8O==="1";
const complexMode=process.env.EVO_COMPLEX_B8Q==="1";
assert.ok(!(denseMode&&complexMode),"Choose exactly one benchmark variant");
const sizes = complexMode
  ? [{nodes:160,edges:480},{nodes:320,edges:960}]
  : denseMode
    ? [{nodes:300,edges:1200},{nodes:600,edges:2400},
      {nodes:200,edges:12001}]
    : [{nodes:200,edges:400},{nodes:500,edges:1000}];
// Warm each size first, then interleave three independent mounts per scale.
// Cold JS module compilation and OS scheduling distort single-shot numbers.
const repeats=denseMode?1:complexMode?2:3;
const scenarios = [...sizes.map(x=>({...x,warmup:true})),
  ...Array.from({length:repeats},()=>sizes.map(x=>({...x,warmup:false}))).flat()];
const viewWidth=1440, viewHeight=900;
const profileDirs=[];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const duration=(n)=>Math.round(n*100)/100;
const page={
  contractVersion:"0.1.0",kind:"diagram-editor",id:"performance-diagram",
  title:"Eidos Performance Stress",resourceId:"benchmark:synthetic",
  readCommand:{code:"benchmark.read",inputVersion:"0.1.0"},
  initialCamera:{scale:.8,translateX:40,translateY:50},
  viewInteraction:{
    zoom:true,pan:true,localNodeDrag:true,localEdgePathEdit:true
  }
};
const markup=renderDiagramEditorPageShellToHtmlV010(page);
const makeState=(nodeCount,edgeCount)=>{
  const columns=nodeCount===200?20:25;
  const businessLabels=["销售订单","客户往来","销售出库","应收确认","收款核销",
    "采购申请","供应商","采购入库","应付确认","付款核销",
    "合同审查","库存盘点","银行对账","财务期间结账","営利収益",
    "طلب شراء","חשבונית","Shipment / Invoice"];
  const nodes=Array.from({length:nodeCount},(_,i)=>({
    id:"n"+i,kind:"synthetic",
    label:complexMode?businessLabels[i%businessLabels.length]+" "+Math.floor(i/businessLabels.length):
      "Node "+i,shape:"rounded-rectangle",
    x:40+(i%columns)*235,y:40+Math.floor(i/columns)*155,
    width:120,height:60
  }));
  const edges=Array.from({length:edgeCount},(_,i)=>{
    const src=i%nodeCount, dir=Math.floor(i/nodeCount);
    const dst=dir%2===0
      ?(src%columns===columns-1?src-columns+1:src+1)
      :(src+columns)%nodeCount;
    const hasLoop=(denseMode&&i%55===0)||(complexMode&&i%37===0);
    const aboveBudget=denseMode && edgeCount>12000;
    if(complexMode){
      // Representative enterprise workflow graph, NOT a real customer
      // database: S2C/P2P relationships, mixed kinds, self-relations,
      // manually edited controls, RTL/CJK captions and distant dependencies.
      const finalTarget=hasLoop?src:(i%5===0?(src+columns*3)%nodeCount:dst);
      const kind=i%4===0?"rounded-orthogonal":i%4===1?"orthogonal":
        i%4===2?"curve":"straight";
      // B8q: a contained mixed-path/rendering benchmark, NOT a mass
      // auto-router scalability benchmark. The original 480-edge case
      // exhausted the 90s mount deadline when many long-distance
      // orthogonal edges all requested global automatic rerouting.
      // Preserve the real Q/C and manual-path cost while isolating
      // expensive dense automatic orthogonal routing as an open risk.
      const explicit=kind==="orthogonal"||kind==="rounded-orthogonal"
        || (kind==="curve"&&i%3===0);
      const manual=explicit&&!hasLoop
        ? [{x:40+(src%columns)*235+160,
            y:80+Math.floor(src/columns)*155+62}] : undefined;
      return {id:"e"+i,kind:"synthetic",source:"n"+src,
        target:"n"+finalTarget,pathKind:hasLoop?"curve":kind,
        ...(manual?{waypoints:manual}:{}),
        arrow:"end",label:i%7===0
          ? "طلب شراء وفاتورة 123 · חשבונית 2026"
          : i%5===0?"销售收款 · 采购付款 · 源单据追溯 / Traceability"
          : i%3===0?"請求書を照合 · 業務プロセス 📦"
          :"Approval and payment reconciliation"};
    }
    return {
      id:"e"+i,kind:"synthetic",source:"n"+src,
      target:"n"+(hasLoop?src:dst),
      ...(hasLoop?{pathKind:"curve",label:"销售订单\n采购付款🧾日本語",
        arrow:"end"}:aboveBudget?{pathKind:"straight"}:
        i%4===0?{pathKind:"orthogonal",arrow:"end"}:
        i%4===1?{pathKind:"rounded-orthogonal",arrow:"end"}:{}),
      ...(denseMode && i%19===0 && !hasLoop
        ? {label:"大型企业业务流程 · 订单履约与收款 · 日本語"} : {})
    };
  });
  return {contractVersion:"0.1.0",resourceId:page.resourceId,revision:1,
    lifecycleState:"DRAFT",nodes,edges};
};
const html=(state)=>'<!doctype html><html><head><meta charset="utf-8">'
+'<meta name="viewport" content="width=device-width,initial-scale=1">'
+'<style>html,body{margin:0;height:100%;}main{width:100vw;height:100vh;}'
+'[data-eidos-diagram-canvas]{min-height:700px;}</style></head>'
+'<body><main id="root">'+markup+'</main><script>window.__perfState='
+JSON.stringify(state)+';window.__perfPage='+JSON.stringify(page)
+';window.__perfStart=performance.now();window.__perfErr=[];'
+'window.addEventListener("error",e=>window.__perfErr.push(e.message));'
+'window.addEventListener("unhandledrejection",e=>window.__perfErr.push(String(e.reason)));'
+'</script><script type="module">'
+'import {mountDiagramEditorPageV010} from "/dist/vendor/eidos/src/diagram/surface.js";'
+'const actionHost={async execute(){return {ok:true,result:window.__perfState}}};'
+'window.__mounted=mountDiagramEditorPageV010({definition:window.__perfPage,'
+'container:document.getElementById("root"),actionHost});'
+'</script></body></html>';
const contents=new Map(sizes.map(s=>[s.nodes,html(makeState(s.nodes,s.edges))]));
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://127.0.0.1");
    if(url.pathname==="/perf"){
      const nodes=Number(url.searchParams.get("nodes"));
      const content=contents.get(nodes);
      if(!content){res.writeHead(404);res.end("unknown fixture");return;}
      res.writeHead(200,{"content-type":"text/html; charset=utf-8"});res.end(content);return;
    }
    if(url.pathname.startsWith("/dist/")){
      const root=resolve(process.cwd(),"dist");
      const full=resolve(process.cwd(),"."+url.pathname);
      if(!full.startsWith(root+"/"))throw Error("Unsafe JS module location");
      res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});
      res.end(await readFile(full));return;
    }
    res.writeHead(404);res.end("not found");
  }catch(e){res.writeHead(500);res.end(String(e?.stack??e));}
});
class CDP{
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();}
  async open(){
    if(this.ws.readyState!==WebSocket.OPEN)await new Promise((resolve,reject)=>{
      this.ws.addEventListener("open",resolve,{once:true});
      this.ws.addEventListener("error",reject,{once:true});
    });
    this.ws.addEventListener("message",event=>{
      const msg=JSON.parse(String(event.data));
      const job=this.pending.get(msg.id);
      if(!job)return;
      this.pending.delete(msg.id);
      if(msg.error)job.reject(Error(msg.error.message));else job.resolve(msg.result);
    });
    await this.send("Runtime.enable");
  }
  send(method,params={}){
    const id=++this.id;
    this.ws.send(JSON.stringify({id,method,params}));
    return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
  }
  async eval(expression){
    const r=await this.send("Runtime.evaluate",
      {expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);
    return r.result?.value;
  }
  close(){this.ws.close();}
}
let chrome, client;
try{
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const serverUrl="http://127.0.0.1:"+server.address().port;
  let port;
  for(let attempt=0;attempt<3&&!port;attempt++){
    const profile=mkdtempSync(join(tmpdir(),"eidos-perf-"));profileDirs.push(profile);
    let errors="";
    chrome=spawn(CHROME,[
      "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
      "--no-first-run","--disable-background-networking",
      "--enable-precise-memory-info",
      "--window-size="+viewWidth+","+viewHeight,
      "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
    ],{stdio:["ignore","ignore","pipe"]});
    chrome.stderr?.on("data",d=>{errors=(errors+d.toString()).slice(-1200);});
    for(let i=0;i<200;i++){
      const f=join(profile,"DevToolsActivePort");
      if(existsSync(f)){port=readFileSync(f,"utf8").split("\n")[0];break;}
      if(chrome.exitCode!==null||chrome.signalCode!==null)break;
      await sleep(100);
    }
    if(!port){
      console.warn("P01_CHROME_BOOTSTRAP_RETRY="+JSON.stringify({
        attempt:attempt+1,exit:chrome.exitCode,stderr:errors}));
      chrome.kill("SIGKILL");
      await sleep(150);
    }
  }
  assert.ok(port,"P01 Chromium DevTools bootstrap failed");
  const origin="http://127.0.0.1:"+port;
  const version=await(await fetch(origin+"/json/version")).json();
  const results=[];
  for(const size of scenarios){
    const targetUrl=serverUrl+"/perf?nodes="+size.nodes;
    const created=await fetch(origin+"/json/new?"+encodeURIComponent(targetUrl),
      {method:"PUT"});
    assert.ok(created.ok,"Could not create P01 tab");
    const tab=await created.json();
    client=new CDP(tab.webSocketDebuggerUrl);
    await client.open();
    const expression='(async()=>{const end=performance.now()+90000;'
      +'while(performance.now()<end){'
      +'if(window.__perfErr?.length)throw Error(window.__perfErr.join(";"));'
      +'if(document.querySelector("[data-eidos-diagram-status]")?.textContent==="Ready.")'
      +'return {mountMs:performance.now()-window.__perfStart,'
      +'nodes:document.querySelectorAll("[data-eidos-diagram-node]").length,'
      +'edges:document.querySelectorAll("[data-eidos-diagram-edge]").length,'
      +'svg:document.querySelectorAll("svg *").length,'
      +'inkQuality:document.querySelector("[data-eidos-diagram-ink-quality]")?.getAttribute("data-eidos-diagram-ink-quality"),'
      +'inkIndex:document.querySelector("[data-eidos-diagram-ink-label-metrics]")?.getAttribute("data-eidos-diagram-ink-label-metrics"),'
      +'advisory:document.querySelector("[data-eidos-diagram-routing-advisory]")?.getAttribute("data-eidos-diagram-routing-advisory")??null,'
      +'heapMB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};'
      +'await new Promise(r=>setTimeout(r,60));}throw Error("P01 fixture never mounted")})()';
    let mounted;
    for(let retry=0;retry<10;retry++){
      try{mounted=await client.eval(expression);break;}
      catch(e){
        if(!String(e).includes("Execution context was destroyed")||retry===9)throw e;
        await sleep(150);
      }
    }
    assert.equal(mounted.nodes,size.nodes);
    assert.equal(mounted.edges,size.edges);
    if(denseMode||complexMode){
      const expected=size.edges>12000?"node-only":"full";
      assert.equal(mounted.inkQuality,expected,
        "B8o dense rendered SVG must expose true budget degradation");
      assert.equal(mounted.advisory,size.edges>12000?"node-only":null,
        "B8o advisory must appear only for actually degraded quality");
      assert.equal(mounted.inkIndex,"browser");
      assert.ok(mounted.svg>size.edges*2,
        "B8o/B8q count actual SVG DOM elements rather than virtual arrays");
    }
    if(complexMode){
      const types=await client.eval('(()=>{'
        +'const paths=[...document.querySelectorAll("[data-eidos-diagram-edge-visual]")].map(x=>x.getAttribute("d")||"");'
        +'return {cubic:paths.some(p=>p.includes(" C ")),'
        +'rounded:paths.some(p=>p.includes(" Q ")),'
        +'loopCount:document.querySelectorAll("[data-eidos-diagram-edge][data-eidos-diagram-route-congested]").length};})()');
      assert.equal(types.cubic,true,"B8q must exercise actually rendered Bézier paths");
      assert.equal(types.rounded,true,"B8q must exercise actually rendered rounded corners");
    }
    const selection=await client.eval('(()=>{'
      +'const node=document.querySelector("[data-eidos-diagram-node]");'
      +'const before=performance.now();node.click();'
      +'return {selectionMs:performance.now()-before,'
      +'count:document.querySelectorAll("[data-eidos-diagram-node]").length};})()');
    assert.equal(selection.count,size.nodes);
    // Simulate independent pointer frames; each move executes actual native
    // browser handlers (node position / incident connector preview / guides).
    const drag=await client.eval('(async()=>{'
      +'const first=document.querySelector("[data-eidos-diagram-node]");'
      +'const rect=first.getBoundingClientRect();'
      +'const x=rect.left+Math.min(20,rect.width/4);'
      +'const y=rect.top+Math.min(20,rect.height/4);'
      +'return {x,y};})()');
    await client.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:drag.x,y:drag.y});
    await client.send("Input.dispatchMouseEvent",{type:"mousePressed",
      x:drag.x,y:drag.y,button:"left",clickCount:1});
    const frames=[];
    for(let i=0;i<12;i++){
      const started=performance.now();
      await client.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
        x:drag.x+(i+1)*4,y:drag.y+(i+1)*2});
      frames.push(performance.now()-started);
    }
    await client.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
      x:drag.x+48,y:drag.y+24});
    const measured=await client.eval('(()=>({'
      +'nodeCount:document.querySelectorAll("[data-eidos-diagram-node]").length,'
      +'edgeCount:document.querySelectorAll("[data-eidos-diagram-edge]").length,'
      +'heapMB:performance.memory?performance.memory.usedJSHeapSize/1048576:null,'
      +'status:document.querySelector("[data-eidos-diagram-status]")?.textContent'
      +'}))()');
    assert.equal(measured.nodeCount,size.nodes);
    assert.equal(measured.edgeCount,size.edges);
    const sorted=[...frames].sort((a,b)=>a-b);
    const data={nodes:size.nodes,edges:size.edges,
      mountMs:duration(mounted.mountMs),selectionMs:duration(selection.selectionMs),
      dragDispatchP50Ms:duration(sorted[Math.floor(sorted.length*.5)]),
      dragDispatchP95Ms:duration(sorted[Math.floor(sorted.length*.95)]),
      svgElements:mounted.svg,
      ...(denseMode||complexMode?{inkQuality:mounted.inkQuality,
        labelMetrics:mounted.inkIndex,advisory:mounted.advisory}:{}),
      usedHeapMB:measured.heapMB===null?null:duration(measured.heapMB)};
    if (!size.warmup) results.push(data);
    console.log("P01_CASE="+JSON.stringify({...data,warmup:size.warmup}));
    client.close();client=undefined;
  }
  const median=(values)=>{
    const ordered=[...values].sort((a,b)=>a-b);
    return ordered[Math.floor(ordered.length/2)];
  };
  const aggregated=sizes.map(size=>{
    const trials=results.filter(item=>item.nodes===size.nodes);
    assert.equal(trials.length,repeats);
    return {
      nodes:size.nodes,edges:size.edges,samples:trials.length,
      mountMs:duration(median(trials.map(t=>t.mountMs))),
      selectionMs:duration(median(trials.map(t=>t.selectionMs))),
      dragDispatchP50Ms:duration(median(trials.map(t=>t.dragDispatchP50Ms))),
      dragDispatchP95Ms:duration(median(trials.map(t=>t.dragDispatchP95Ms))),
      svgElements:trials[0].svgElements,
      usedHeapMB:duration(median(trials.map(t=>t.usedHeapMB??0)))
    };
  });
  console.log((complexMode?"B8Q_COMPLEX_BROWSER_RESULT=":
      denseMode?"B8O_DENSE_BROWSER_RESULT=":"P01_BROWSER_RESULT=")
    +JSON.stringify({browser:version.Browser,cases:aggregated,
      mode:complexMode?"representative mixed S2C/P2P routes, 2 prewarm + 4 measured Chrome mounts":
        denseMode?"synthetic dense full DOM, 3 prewarm + 3 measured Chrome mounts incl 12001-edge node-only":
        "synthetic Eidos DOM, 2 prewarm + 6 interleaved trials",
      warning:"CI-host perf only; no production SLA/physical-device FPS inference"}));
}finally{
  client?.close();
  if(chrome&&chrome.exitCode===null){
    const ended=once(chrome,"exit");chrome.kill("SIGTERM");
    await Promise.race([ended,sleep(2500)]);
    if(chrome.exitCode===null)chrome.kill("SIGKILL");
  }
  server.closeAllConnections?.();server.close();
  for(const path of profileDirs){
    try{rmSync(path,{force:true,recursive:true,maxRetries:4,retryDelay:120});}
    catch(e){if(!["ENOTEMPTY","EBUSY"].includes(e?.code))throw e;}
  }
}
