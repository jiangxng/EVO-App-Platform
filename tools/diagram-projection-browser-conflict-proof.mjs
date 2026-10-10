#!/usr/bin/env node
// Headless Chromium test through the real Eidos DOM and App Platform handlers.
// Independent browser tabs share one in-memory projection store.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { createMemoryBusinessDefinitionRepositoryV010 } from "../dist/providers/enterprise-context/business-definitions.js";
import { createMemoryDefinitionProjectionStoreV010 } from "../dist/providers/enterprise-context/definition-projection-store.js";
import { createEnterpriseDefinitionProjectionArtifactSourceV010 } from "../dist/providers/enterprise-context/definition-projection.js";
import { createMemoryDefinitionProjectionSessionStoreV010 } from "../dist/contracts/definition-projection.js";
import { createEnterpriseDefinitionProjectionEditorPageV010, createEnterpriseDefinitionProjectionEditorActionHandlersV010 } from "../dist/apps/eog-2d-designer/definition-projection-editor.js";
import { ledgerRuntimeBaselineBundleV010 } from "../dist/apps/template-store/seed-records.js";
import { renderDiagramEditorPageShellToHtmlV010 } from "../dist/vendor/eidos/src/diagram/surface.js";
import { renderDiagramWorkspacePageShellToHtmlV010 } from "../dist/vendor/eidos/src/diagram/workspace.js";
import {
  createEnterpriseDefinition2dPreviewPageV010,
  createEnterpriseDefinition2dPreviewReadActionV010
} from "../dist/apps/eog-2d-viewer/definition-preview.js";

const chrome = process.env.CHROME;
assert.ok(chrome, "CHROME must identify an installed Chromium executable");
let profile = mkdtempSync(join(tmpdir(), "evo-2d-browser-"));
const profiles = [profile];
const repository = createMemoryBusinessDefinitionRepositoryV010();
const bundle = ledgerRuntimeBaselineBundleV010;
const revision = repository.createDraft({
  enterpriseId: "ent-browser", definitionId: "ledger:browser",
  kind: bundle.definition.kind, title: bundle.definition.title,
  payload: structuredClone(bundle.definition.payload),
  projectionGallery: structuredClone(bundle.definition.projectionGallery),
  actor: { actorType: "HUMAN", subjectId: "owner-browser" },
  recordedAt: "2026-10-10T00:00:00.000Z",
  origin: { type: "TEMPLATE_COPY", sourceRef: "test:browser" }
});
const target = { enterpriseId: revision.enterpriseId, definitionId: revision.definitionId,
  definitionRevision: revision.revision, projectionId: revision.projectionGallery.primaryProjectionId };
const store = createMemoryDefinitionProjectionStoreV010();
const sessions = createMemoryDefinitionProjectionSessionStoreV010();
const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository, store);
const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository, projectionStore: store, source, sessions,
  canManageEnterpriseContext: () => true, authorizeProjectionSave: async () => {},
  locale: () => "en-US", now: () => new Date("2026-10-10T00:01:00.000Z"),
  projectionIdFactory: () => "projection:browser-conflict-copy"
});
const page = createEnterpriseDefinitionProjectionEditorPageV010({
  ...target, title: "Browser CAS smoke", locale: "en-US"
});
const markup = renderDiagramEditorPageShellToHtmlV010(page);
const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="root">'
  + markup + '</main><script>window.__page=' + JSON.stringify(page)
  + ';window.__browserErrors=[];window.addEventListener("error",e=>window.__browserErrors.push(e.message));'
  + 'window.addEventListener("unhandledrejection",e=>window.__browserErrors.push(String(e.reason)));</script>'
  + '<script type="module">import {mountDiagramEditorPageV010} from "/dist/vendor/eidos/src/diagram/surface.js";'
  + 'const tab=new URL(location.href).searchParams.get("session");'
  + 'const actionHost={async execute(request){const response=await fetch("/action?session="+encodeURIComponent(tab),'
  + '{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});'
  + 'if(!response.ok)throw Error("HTTP "+response.status);return response.json();}};'
  + 'window.__mounted=mountDiagramEditorPageV010({definition:window.__page,container:document.getElementById("root"),actionHost});'
  + '</script></body></html>';
// A separate visual fixture positions the real editor camera over a real
// existing relation. Other three tabs continue to use the original page.
const routeGraph = source.get(target)?.diagram2d;
assert.ok(routeGraph?.edges?.length && routeGraph.nodes?.length,
  "An editable base diagram is required for the route-handle browser proof");
const routeNodes = new Map(routeGraph.nodes.map(node => [node.id,node]));
const routeChoices = routeGraph.edges.flatMap(edge => {
  const a=routeNodes.get(edge.source), b=routeNodes.get(edge.target);
  if(!a||!b||a.id===b.id)return [];
  const ax=a.x+a.width/2, ay=a.y+a.height/2;
  const bx=b.x+b.width/2, by=b.y+b.height/2;
  if(![ax,ay,bx,by].every(Number.isFinite))return [];
  const mid={x:(ax+bx)/2,y:(ay+by)/2};
  const clearance=Math.min(...routeGraph.nodes
    .filter(node=>node.id!==a.id&&node.id!==b.id)
    .map(node=>Math.max(node.x-mid.x,0,mid.x-node.x-node.width,
      node.y-mid.y,0,mid.y-node.y-node.height)));
  const distance=Math.hypot(ax-bx,ay-by);
  return [{edge,mid,clearance,distance}];
}).filter(item=>item.distance>160&&item.distance<1400)
  .sort((a,b)=>b.clearance-a.clearance||a.distance-b.distance);
const routeChoice=routeChoices[0];
assert.ok(routeChoice,"Need an existing relation with a draggable midpoint");
const routePage={...page,
  initialCamera:{scale:1,translateX:150-routeChoice.mid.x,translateY:90-routeChoice.mid.y}};
const routeHtml=html.replace(markup,renderDiagramEditorPageShellToHtmlV010(routePage))
  .replace("window.__page="+JSON.stringify(page),
    "window.__page="+JSON.stringify(routePage));
// B8b: mount the genuine read-only Enterprise Definition Viewer workspace
// against the very same persisted Store and business artifact source.
const viewerPage=createEnterpriseDefinition2dPreviewPageV010({
  ...target,title:"Browser B8b saved projection",camera:routePage.initialCamera
});
const viewerShell=renderDiagramWorkspacePageShellToHtmlV010(viewerPage);
const viewerHtml='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="root">'
  +viewerShell+'</main><script>window.__page='+JSON.stringify(viewerPage)
  +';window.__browserErrors=[];window.addEventListener("error",e=>window.__browserErrors.push(e.message));'
  +'window.addEventListener("unhandledrejection",e=>window.__browserErrors.push(String(e.reason)));'
  +'</script><script type="module">import {mountDiagramWorkspacePageV010} from "/dist/vendor/eidos/src/diagram/workspace.js";'
  +'const tab=new URL(location.href).searchParams.get("session");'
  +'const actionHost={async execute(request){const response=await fetch("/action?session="+encodeURIComponent(tab),'
  +'{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});'
  +'if(!response.ok)throw Error("HTTP "+response.status);return response.json();}};'
  +'window.__mounted=mountDiagramWorkspacePageV010({definition:window.__page,container:document.getElementById("root"),actionHost});'
  +'</script></body></html>';
const viewerReadHandler=createEnterpriseDefinition2dPreviewReadActionV010({source});

 // B8f controlled self-relation fixture; the production seed need not have
 // self-edges. Real App read, CAS Save, and Viewer all use the same source.
 const selfNode=[...routeNodes.values()].sort((a,b)=>
   (b.x+b.width)-(a.x+a.width)||a.id.localeCompare(b.id))[0];
 const selfId="diagram-browser:self-loop";
 const selfEdge={...routeChoice.edge,id:selfId,source:selfNode.id,target:selfNode.id,
   kind:routeChoice.edge.kind,label:"B8f browser loop",pathKind:"curve"};
 delete selfEdge.waypoints;delete selfEdge.sourceAnchor;delete selfEdge.targetAnchor;
 const loopSource={get(input){
   const art=source.get(input);
   if(!art?.diagram2d)return art;
   const gallery=store.get(target)??revision.projectionGallery;
   const saved=gallery?.projections?.find(x=>x.projectionId===target.projectionId)
     ?.view.edgePaths?.find(x=>x.edgeId===selfId);
   const edge={...selfEdge};
   if(saved){edge.pathKind=saved.pathKind;
     if(saved.waypoints?.length)edge.waypoints=saved.waypoints.map(p=>({...p}));
   }
   return {...art,diagram2d:{...art.diagram2d,edges:[...art.diagram2d.edges,edge]}};
 }};
 const loopHandlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
   repository,projectionStore:store,source:loopSource,sessions,
   canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
   locale:()=>"en-US",now:()=>new Date("2026-10-10T00:01:00.000Z")
 });
 const loopViewerReadHandler=createEnterpriseDefinition2dPreviewReadActionV010({source:loopSource});
 const loopCamera={scale:1,
   translateX:260-(selfNode.x+selfNode.width+60),
   translateY:180-(selfNode.y+selfNode.height/2)};
 const loopPage={...page,title:"B8f loop Designer",initialCamera:loopCamera};
 const loopHtml=html.replace(markup,renderDiagramEditorPageShellToHtmlV010(loopPage))
   .replace("window.__page="+JSON.stringify(page),
     "window.__page="+JSON.stringify(loopPage));
 const loopViewerPage=createEnterpriseDefinition2dPreviewPageV010({
   ...target,title:"B8f loop Viewer",camera:loopCamera
 });
 const loopViewerHtml=viewerHtml
   .replace(viewerShell,renderDiagramWorkspacePageShellToHtmlV010(loopViewerPage))
   .replace("window.__page="+JSON.stringify(viewerPage),
     "window.__page="+JSON.stringify(loopViewerPage));


// B8g: separate test-only right-obstacle relation source. The regular
// loopSource remains obstacle-free to verify a persisted manually edited
// bottom loop never silently jumps back to the old right-hand default.
const blockedNode={...selfNode,
  id:"diagram-browser:right-obstacle",
  x:selfNode.x+selfNode.width+12,y:selfNode.y+selfNode.height*.12,
  width:90,height:selfNode.height*.76,label:"B8g right obstacle"};
const blockedSource={get(input){
  const result=loopSource.get(input);
  if(!result?.diagram2d)return result;
  // Isolated two-node test diagram gives an unambiguous right-hand blocker;
  // all business topology remains untouched in the repository. The real App
  // save/read handlers are still used for this synthetic presentation fixture.
  return {...result,diagram2d:{...result.diagram2d,
    nodes:[{...selfNode},{...blockedNode}],
    edges:result.diagram2d.edges.filter(edge=>edge.id===selfId)}};
}};
const blockedHandlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository,projectionStore:store,source:blockedSource,sessions,
  canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
  locale:()=>"en-US",now:()=>new Date("2026-10-10T00:02:00.000Z")
});
const blockedViewerReadHandler=createEnterpriseDefinition2dPreviewReadActionV010({
  source:blockedSource
});

// B8h: isolated presentation-only five-self-loop scene, NOT a modification
// to source business definitions. Keep the same real Host read/Viewer pipeline.
const multiIds=Array.from({length:5},(_,i)=>"diagram-browser:multi-loop-"+(i+1));
const multiSource={get(input){
  const artifact=source.get(input);
  if(!artifact?.diagram2d)return artifact;
  const edges=multiIds.map((id,index)=>({
    ...selfEdge,id,label:"B8h sibling self-loop "+(index+1),
    pathKind:"curve"
  }));
  return {...artifact,diagram2d:{...artifact.diagram2d,
    nodes:[{...selfNode}],edges}};
}};
const multiHandlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository,projectionStore:store,source:multiSource,sessions,
  canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
  locale:()=>"en-US",now:()=>new Date("2026-10-10T00:03:00.000Z")
});
const multiViewerHandler=createEnterpriseDefinition2dPreviewReadActionV010({
  source:multiSource
});
const fullBlockNodes=[
  {...selfNode,id:"diagram-browser:four-right",
    x:selfNode.x+selfNode.width+4,y:selfNode.y-15,width:95,height:selfNode.height+30},
  {...selfNode,id:"diagram-browser:four-bottom",
    x:selfNode.x+20,y:selfNode.y+selfNode.height+4,width:selfNode.width-40,height:95},
  {...selfNode,id:"diagram-browser:four-left",
    x:selfNode.x-99,y:selfNode.y-15,width:95,height:selfNode.height+30},
  {...selfNode,id:"diagram-browser:four-top",
    x:selfNode.x+20,y:selfNode.y-99,width:selfNode.width-40,height:95}
];
const allBlockedSource={get(input){
  const result=multiSource.get(input);
  return result?.diagram2d
    ? {...result,diagram2d:{...result.diagram2d,
        nodes:[...result.diagram2d.nodes,...fullBlockNodes]}}
    : result;
}};
const allBlockedHandlers=createEnterpriseDefinitionProjectionEditorActionHandlersV010({
  repository,projectionStore:store,source:allBlockedSource,sessions,
  canManageEnterpriseContext:()=>true,authorizeProjectionSave:async()=>{},
  locale:()=>"en-US",now:()=>new Date("2026-10-10T00:04:00.000Z")
});
const multiCamera={scale:.6,
  translateX:200-.6*(selfNode.x+selfNode.width/2),
  translateY:220-.6*(selfNode.y+selfNode.height/2)};
const multiPage={...page,title:"B8h multi-self-loop test",initialCamera:multiCamera};
const multiHtml=html.replace(markup,renderDiagramEditorPageShellToHtmlV010(multiPage))
  .replace("window.__page="+JSON.stringify(page),
    "window.__page="+JSON.stringify(multiPage));
const multiViewerPage=createEnterpriseDefinition2dPreviewPageV010({
  ...target,title:"B8h siblings Viewer",camera:multiCamera
});
const multiViewerHtml=viewerHtml
  .replace(viewerShell,renderDiagramWorkspacePageShellToHtmlV010(multiViewerPage))
  .replace("window.__page="+JSON.stringify(viewerPage),
    "window.__page="+JSON.stringify(multiViewerPage));

const context = tab => ({
  contractVersion: "0.1.0",
  principal: { contractVersion: "0.1.0", subjectId: "owner-browser", actorType: "HUMAN",
    identityProviderId: "test.identity", sessionId: tab },
  scope: { contractVersion: "0.1.0", enterpriseId: target.enterpriseId },
  context: {
    contractVersion: "0.1.0",
    personalContext: { contractVersion: "0.1.0", kind: "PERSONAL", contextId: "personal:owner-browser" },
    activeContext: { contractVersion: "0.1.0", kind: "ENTERPRISE",
      contextId: "enterprise:ent-browser", enterpriseId: target.enterpriseId }
  },
  locale: "en-US", correlationId: "browser-cas-" + tab
});
const transientFailures = new Set(["C"]);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); return;
    }
    if (url.pathname === "/route") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(routeHtml); return;
    }
    if (url.pathname === "/viewer") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(viewerHtml); return;
    }
    if (url.pathname === "/loop") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(loopHtml); return;
    }
    if (url.pathname === "/loop-viewer") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(loopViewerHtml); return;
    }
    if (url.pathname === "/blocked-loop") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(loopHtml); return;
    }
    if (url.pathname === "/multi-loop" || url.pathname === "/all-blocked-loop") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(multiHtml); return;
    }
    if (url.pathname === "/multi-loop-viewer") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(multiViewerHtml); return;
    }
    if (url.pathname === "/action" && req.method === "POST") {
      let data = "";
      for await (const chunk of req) data += chunk.toString();
      const request = JSON.parse(data);
      const tab = url.searchParams.get("session") ?? "A";
      if (request.values?.operation?.type === "SAVE_PROJECTION_VIEW"
        && transientFailures.delete(tab)) {
        res.writeHead(503); res.end("Injected transient network failure"); return;
      }
      const candidates = tab === "R"
        ? [...blockedHandlers,blockedViewerReadHandler]
        : ["U","V"].includes(tab)
          ? [...multiHandlers,multiViewerHandler]
          : tab === "W"
            ? [...allBlockedHandlers,multiViewerHandler]
        : ["O","P","Q","S","T"].includes(tab)
          ? [...loopHandlers,loopViewerReadHandler]
          : [...handlers,viewerReadHandler];
      const handler = candidates.find(h => h.commandCode === request.command?.code);
      if (!handler) throw Error("Unknown action: " + request.command?.code);
      const result = await handler.execute(request, context(url.searchParams.get("session") ?? "A"));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result)); return;
    }
    if (url.pathname.startsWith("/dist/")) {
      const abs = resolve(process.cwd(), "." + url.pathname);
      if (!abs.startsWith(join(process.cwd(), "dist") + "/")) throw Error("Unsafe module path");
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      res.end(await readFile(abs)); return;
    }
    res.writeHead(404); res.end("Not found");
  } catch (error) { res.writeHead(500); res.end(String(error?.stack ?? error)); }
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); }
  async start() {
    if (this.ws.readyState !== WebSocket.OPEN) await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const p = this.pending.get(message.id);
      if (!p) return;
      this.pending.delete(message.id);
      if (message.error) p.reject(Error(message.error.message));
      else p.resolve(message.result);
    });
    await this.send("Runtime.enable");
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true
    });
    if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description
      ?? response.exceptionDetails.text);
    return response.result?.value;
  }
  close() { this.ws.close(); }
}
let proc, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, sTab, t, u, v, w;
try {
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = "http://127.0.0.1:" + server.address().port;
  let debugPort;
  let chromeFailure = "";
  // Shared CI runners occasionally fail to initialize a headless Chrome
  // process on the first launch. Retry the *process bootstrap only*, using
  // an isolated user profile, before executing ANY browser scenario.
  for (let attempt = 0; attempt < 3 && !debugPort; attempt++) {
    if (attempt > 0) {
      profile = mkdtempSync(join(tmpdir(), "evo-2d-browser-"));
      profiles.push(profile);
    }
    let stderr = "";
    proc = spawn(chrome, [
      "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
      "--no-first-run", "--disable-background-networking",
      "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"
    ], { stdio: ["ignore", "ignore", "pipe"] });
    proc.stderr?.on("data", chunk => { stderr = (stderr + chunk.toString()).slice(-3000); });
    for (let n = 0; n < 180; n++) {
      if (existsSync(join(profile, "DevToolsActivePort"))) {
        debugPort = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0];
        break;
      }
      if (proc.exitCode !== null || proc.signalCode !== null) break;
      await sleep(100);
    }
    if (!debugPort) {
      chromeFailure = "launch " + (attempt + 1) + " exit=" + proc.exitCode
        + " signal=" + proc.signalCode + " stderr=" + stderr;
      if (proc.exitCode === null) {
        const stopped = once(proc, "exit");
        proc.kill("SIGTERM");
        await Promise.race([stopped, sleep(2500)]);
        if (proc.exitCode === null) proc.kill("SIGKILL");
      }
      console.warn("Retrying isolated Chrome launch: " + chromeFailure);
    }
  }
  assert.ok(debugPort, "Chrome did not start DevTools: " + chromeFailure);
  const api = "http://127.0.0.1:" + debugPort;
  const version = await (await fetch(api + "/json/version")).json();
  async function tab(id, route = false) {
    const path = route === "viewer" ? "/viewer?session="
      : route === "loop" ? "/loop?session="
      : route === "loop-viewer" ? "/loop-viewer?session="
      : route === "blocked-loop" ? "/blocked-loop?session="
      : route === "multi-loop" ? "/multi-loop?session="
      : route === "multi-loop-viewer" ? "/multi-loop-viewer?session="
      : route === "all-blocked-loop" ? "/all-blocked-loop?session="
      : route ? "/route?session=" : "/?session=";
    const response = await fetch(api + "/json/new?" + encodeURIComponent(
      address + path + id),
      { method: "PUT" });
    assert.ok(response.ok, "Chrome target create failed");
    const targetInfo = await response.json();
    const client = new CDP(targetInfo.webSocketDebuggerUrl);
    await client.start(); return client;
  }
  a = await tab("A"); b = await tab("B");
  async function until(client, phrase) {
    const expression = '(async()=>{const start=Date.now();while(Date.now()-start<12000){'
      + 'const text=document.querySelector("[data-eidos-diagram-status]")?.textContent||"";'
      + 'if(window.__browserErrors?.length)throw Error(window.__browserErrors.join(";"));'
      + 'if(text.includes(' + JSON.stringify(phrase) + '))return text;'
      + 'await new Promise(r=>setTimeout(r,50));}throw Error("No status '+phrase+'; "+'
      + 'document.querySelector("[data-eidos-diagram-status]")?.textContent)})()';
    // A new tab can navigate away from about:blank during this read-only
    // status check. Do not retry any action or mutating evaluation.
    for (let attempt = 0; attempt < 8; attempt++) {
      try { return await client.eval(expression); }
      catch (error) {
        if (!String(error).includes("Execution context was destroyed")
          || attempt === 7) throw error;
        await sleep(150);
      }
    }
    throw Error("Unreachable browser readiness state");
  }

  await Promise.all([until(a,"Ready."),until(b,"Ready.")]);
  // B6a: exercise real browser toolbar toggles and native mouse pointer capture.
  // A grid-aligned drag is previewed and then cancelled, so the B7b persistence
  // conflict test below retains its original saved-state baseline.
  const snapProbe = await a.eval('(()=>{'
    + 'const mode=key=>document.querySelector("[data-eidos-diagram-snap-mode="+key+"]");'
    + 'const grid=mode("grid"),snap=mode("snap"),align=mode("align");'
    + 'if(!grid||!snap||!align)throw Error("Missing B6a controls");'
    + 'if(grid.getAttribute("aria-pressed")!=="true"||snap.getAttribute("aria-pressed")!=="false"'
    + '||align.getAttribute("aria-pressed")!=="true")throw Error("Wrong B6a defaults");'
    + 'const stage=document.querySelector("[data-eidos-diagram-node]")?.parentElement;'
    + 'grid.click();if(stage.style.backgroundImage!=="none")throw Error("Grid not hidden");'
    + 'mode("grid").click();if(stage.style.backgroundImage==="none")throw Error("Grid not restored");'
    + 'mode("snap").click();mode("align").click();'
    + 'if(mode("snap").getAttribute("aria-pressed")!=="true"'
    + '||mode("align").getAttribute("aria-pressed")!=="false")throw Error("Grid snap and Align not independent");'
    + 'const nodes=[...document.querySelectorAll("[data-eidos-diagram-node]")];'
    + 'const node=nodes.find(n=>{const r=n.getBoundingClientRect();'
    + 'return r.width>0&&r.left>=0&&r.top>=0&&r.left<innerWidth-30&&r.top<innerHeight-30})||nodes[0];'
    + 'if(!node)throw Error("No nodes in browser");'
    + 'const rect=node.getBoundingClientRect();'
    + 'const scale=Number(stage.style.transform.slice(7).split(",")[0]);'
    + 'if(!(scale>0))throw Error("Invalid camera transform");'
    + 'const worldX=Number.parseFloat(node.style.left);'
    + 'let gridStep=24;while(gridStep*scale<12)gridStep*=2;'
    + 'const target=Math.round(worldX/gridStep)*gridStep+gridStep;'
    + 'window.__b6SnapNodeId=node.getAttribute("data-eidos-diagram-node");'
    + 'window.__b6InitialX=worldX;'
    + 'return {x:rect.left+Math.min(20,rect.width/4),y:rect.top+Math.min(20,rect.height/4),'
    + 'target,worldX,delta:(target-worldX)*scale+2,scale,gridStep};'
    + '})()');
  await a.send("Input.dispatchMouseEvent", {type:"mouseMoved",x:snapProbe.x,y:snapProbe.y});
  await a.send("Input.dispatchMouseEvent", {type:"mousePressed",button:"left",clickCount:1,
    x:snapProbe.x,y:snapProbe.y});
  await a.send("Input.dispatchMouseEvent", {type:"mouseMoved",button:"left",
    x:snapProbe.x+snapProbe.delta,y:snapProbe.y});
  const snappedPreview = await a.eval('(()=>{'
    + 'const node=document.querySelector("[data-eidos-diagram-node="+CSS.escape(window.__b6SnapNodeId)+"]");'
    + 'return node?Number.parseFloat(node.style.left):NaN;})()');
  assert.ok(Math.abs(snappedPreview-snapProbe.target)<.001,
    "Native pointer drag should snap node to 24-unit world grid at "+snapProbe.scale);
  await a.eval('(()=>{'
    + 'const node=document.querySelector("[data-eidos-diagram-node="+CSS.escape(window.__b6SnapNodeId)+"]");'
    + 'node.dispatchEvent(new PointerEvent("pointercancel",{bubbles:true,pointerId:1,pointerType:"mouse"}));'
    + '})()');
  await a.send("Input.dispatchMouseEvent", {type:"mouseReleased",button:"left",
    x:snapProbe.x+snapProbe.delta,y:snapProbe.y});
  const cancelProbe = await a.eval('(()=>{'
    + 'const node=document.querySelector("[data-eidos-diagram-node="+CSS.escape(window.__b6SnapNodeId)+"]");'
    + 'const guides=document.querySelectorAll("[data-eidos-diagram-snap-axis]");'
    + 'document.querySelector("[data-eidos-diagram-snap-mode=snap]").click();'
    + 'document.querySelector("[data-eidos-diagram-snap-mode=align]").click();'
    + 'return {x:Number.parseFloat(node.style.left),guides:guides.length};})()');
  assert.equal(cancelProbe.x,snapProbe.worldX,"pointercancel must roll back snapped preview");
  assert.equal(cancelProbe.guides,0,"pointercancel must clear alignment guides");
  assert.equal(store.getVersion(target),0,"preview/cancel must not persist projection");

  // B6b: use the actual Eidos multi-select UI, overflow command and undo.
  // This is a local presentation edit and must not write the Host projection.
  const arrangeProof = await a.eval('(()=>{'
    + 'const ids=[...document.querySelectorAll("[data-eidos-diagram-node]")].slice(0,3)'
    + '.map(node=>node.getAttribute("data-eidos-diagram-node"));'
    + 'if(ids.length!==3)throw Error("Three nodes required for distribution");'
    + 'const get=id=>document.querySelector("[data-eidos-diagram-node="+CSS.escape(id)+"]");'
    + 'const initial=ids.map(id=>({id,x:Number.parseFloat(get(id).style.left),'
    + 'y:Number.parseFloat(get(id).style.top)}));'
    + 'get(ids[0]).click();'
    + 'for(const id of ids.slice(1))get(id).dispatchEvent(new MouseEvent("click",'
    + '{bubbles:true,shiftKey:true}));'
    + 'const align=document.querySelector("[data-eidos-diagram-arrange=left]");'
    + 'const distribute=document.querySelector("[data-eidos-diagram-arrange=distribute-x]");'
    + 'if(!align||!distribute||align.disabled||distribute.disabled)'
    + 'throw Error("B6b group commands unavailable");'
    + 'align.click();'
    + 'const aligned=ids.map(id=>Number.parseFloat(get(id).style.left));'
    + 'if(!aligned.every(x=>x===aligned[0]))throw Error("Group align did not align left");'
    + 'const undo=document.querySelector("[data-eidos-diagram-history=undo]");'
    + 'if(!undo||undo.disabled)throw Error("Group align omitted single undo step");'
    + 'undo.click();'
    + 'const restored=ids.map(id=>({id,x:Number.parseFloat(get(id).style.left),'
    + 'y:Number.parseFloat(get(id).style.top)}));'
    + 'if(JSON.stringify(restored)!==JSON.stringify(initial))'
    + 'throw Error("Undo failed to restore all three node placements");'
    + 'return {aligned:true,undoRestored:true,selectionCount:ids.length};'
    + '})()');
  assert.equal(arrangeProof.aligned, true);
  assert.equal(arrangeProof.undoRestored, true);
  assert.equal(store.getVersion(target),0,"arrangement/undo may not implicitly save");

  const hide = async (client, index) => client.eval('(()=>{'
    + 'const nodes=[...document.querySelectorAll("[data-eidos-diagram-node]")];'
    + 'if(nodes.length<2)throw Error("Need at least 2 nodes");'
    + 'const id=nodes[' + index + '].getAttribute("data-eidos-diagram-node");'
    + 'nodes[' + index + '].click();'
    + 'const button=document.querySelector("[data-eidos-diagram-local-hide]");'
    + 'if(!button)throw Error("Hide control missing");button.click();'
    + 'if(document.querySelector("[data-eidos-diagram-node="+CSS.escape(id)+"]"))'
    + 'throw Error("Node was not hidden");return id;})()');
  const action = (client, label) => client.eval('(()=>{'
    + 'const buttons=[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")];'
    + 'const button=buttons.find(b=>b.textContent.trim()===' + JSON.stringify(label) + ');'
    + 'if(!button)throw Error("Missing action ' + label + '");button.click();return true})()');
  const hiddenA = await hide(a, 0), hiddenB = await hide(b, 1);
  assert.notEqual(hiddenA, hiddenB);
  await action(a, "Save projection"); await until(a, "Saved.");
  assert.equal(store.getVersion(target), 1);
  const original = structuredClone(store.get(target).projections
    .find(p => p.projectionId === target.projectionId));
  assert.ok(original.view.hiddenNodeIds.includes(hiddenA));
  await action(b, "Save projection");
  const conflict = await until(b, "Projection changed elsewhere");
  assert.match(conflict, /Local edits are preserved/);
  assert.equal(store.getVersion(target), 1);
  await action(b, "Save as projection"); await until(b, "Saved.");
  assert.equal(store.getVersion(target), 2);
  const gallery = store.get(target);
  assert.equal(gallery.projections.length, revision.projectionGallery.projections.length + 1);
  assert.deepEqual(gallery.projections.find(p => p.projectionId === target.projectionId), original);
  const copy = gallery.projections.find(p => p.projectionId === "projection:browser-conflict-copy");
  assert.ok(copy); assert.ok(copy.view.hiddenNodeIds.includes(hiddenB));
  // A third *real browser tab* fails at the HTTP transport boundary, then
  // retries without losing its local unsaved projection view.
  c = await tab("C");
  await until(c, "Ready.");
  await hide(c, 0);
  await action(c, "Save projection");
  await until(c, "Save failed; local edits are preserved.");
  assert.equal(store.getVersion(target), 2);
  await action(c, "Save projection");
  await until(c, "Saved.");
  assert.equal(store.getVersion(target), 3);

  // B6b: a fourth real Chrome tab opens an actual Host graph relationship
  // with its camera focused on the geometric midpoint. An SVG hit selects
  // the relation, the property editor adds one manual waypoint, and genuine
  // CDP mouse events move its 44px pointer-captured handle to the grid.
  d = await tab("D",true);
  await until(d,"Ready.");
  const handleProbe = await d.eval('(()=>{'
    + 'const id=' + JSON.stringify(routeChoice.edge.id) + ';'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'if(!edge)throw Error("Target route missing "+id);'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const select=document.querySelector("[data-eidos-diagram-edge-path-kind]");'
    + 'if(!select)throw Error("Route style editor missing");'
    + 'select.value="orthogonal";'
    + 'select.dispatchEvent(new Event("change",{bubbles:true}));'
    + 'const add=[...document.querySelectorAll("[data-eidos-diagram-waypoint-controls] button")]'
    + '.find(button=>button.textContent==="Add path point");'
    + 'if(!add)throw Error("Add waypoint control missing");add.click();'
    + 'const snap=document.querySelector("[data-eidos-diagram-snap-mode=snap]");'
    + 'if(!snap)throw Error("Route grid snap missing");snap.click();'
    + 'document.querySelector("[data-eidos-diagram-snap-mode=align]")?.click();'
    + 'const handle=document.querySelector("[data-eidos-diagram-waypoint-handle]");'
    + 'if(!handle)throw Error("Manual SVG handle missing");'
    + 'const box=handle.getBoundingClientRect();'
    + 'const cx=box.left+box.width/2,cy=box.top+box.height/2;'
    + 'const top=document.elementFromPoint(cx,cy);'
    + 'if(top!==handle)throw Error("Route handle blocked at "+cx+","+cy+"; canvas="+'
    + 'JSON.stringify(document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect().toJSON())'
    + '+" by "+(top?.outerHTML||"null").slice(0,120));'
    + 'const initial=Number(handle.getAttribute("cx"));'
    + 'const goal=Math.round(initial/24)*24+48;'
    + 'return {x:cx,y:cy,initial,goal,delta:goal-initial+2};'
    + '})()');
  assert.ok(handleProbe.delta>4);
  await d.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:handleProbe.x,y:handleProbe.y});
  await d.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    x:handleProbe.x,y:handleProbe.y});
  await d.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
    x:handleProbe.x+handleProbe.delta,y:handleProbe.y});
  const routePreview=await d.eval('(()=>{const handle=document.querySelector("[data-eidos-diagram-waypoint-handle]");'
    + 'return Number(handle.getAttribute("cx"));})()');
  assert.ok(Math.abs(routePreview-handleProbe.goal)<.01,
    "Native manual waypoint should snap to grid; got "+routePreview+" expected "+handleProbe.goal);
  await d.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
    x:handleProbe.x+handleProbe.delta,y:handleProbe.y});
  const routeUndo=await d.eval('(()=>{'
    + 'const handle=document.querySelector("[data-eidos-diagram-waypoint-handle]");'
    + 'const committed=Number(handle.getAttribute("cx"));'
    + 'const undo=document.querySelector("[data-eidos-diagram-history=undo]");'
    + 'if(!undo||undo.disabled)throw Error("Handle drag missing single undo checkpoint");'
    + 'undo.click();'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape('
    + JSON.stringify(routeChoice.edge.id)
    + ')+"]");'
    + 'if(!edge)throw Error("Undo lost original relation");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const marker=document.querySelector("[data-eidos-diagram-waypoint-handle]");'
    + 'if(!marker)throw Error("Undo dropped waypoint instead of reverting drag");'
    + 'const restored=Number(marker.getAttribute("cx"));'
    + 'return {committed,restored};})()');
  assert.ok(Math.abs(routeUndo.committed-handleProbe.goal)<.01);
  assert.ok(Math.abs(routeUndo.restored-handleProbe.initial)<.01);

  // B6b: arrange the one-control-point route into a deliberate visible bend.
  // A perfectly collinear single waypoint shares its midpoint with the
  // segment handle and intentionally wins the 44px overlapping hit target;
  // editing the route through its accessible numeric controls exposes segments.
  await d.eval('(()=>{'
    + 'const change=(axis,delta)=>{'
    + 'const inputs=document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]");'
    + 'const input=inputs[axis];if(!input)throw Error("Accessible waypoint numeric input missing");'
    + 'input.value=String(Number(input.value)+delta);'
    + 'input.dispatchEvent(new Event("change",{bubbles:true}));};'
    + 'change(0,120);change(1,100);return true;})()');

  // B6b: drag a genuinely exposed orthogonal segment handle along its sole
  // permissible normal axis. Compare the rendered SVG path before/after, then
  // Undo and reselect (Undo intentionally clears the active selection).
  const segmentProbe=await d.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const visual=()=>document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'const canvas=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();'
    + 'const handles=[...document.querySelectorAll("[data-eidos-diagram-segment-handle]")];'
    + 'const h=handles.find(el=>{const b=el.getBoundingClientRect();'
    + 'const x=b.left+b.width/2,y=b.top+b.height/2;'
    + 'return x>canvas.left+20&&x<canvas.right-20&&y>canvas.top+20&&y<canvas.bottom-20'
    + '&&document.elementFromPoint(x,y)===el});'
    + 'if(!h){const diagnostic=handles.map(el=>{const r=el.getBoundingClientRect();'
    + 'const x=r.left+r.width/2,y=r.top+r.height/2;'
    + 'return {x,y,axis:el.style.cursor,top:document.elementFromPoint(x,y)?.outerHTML.slice(0,150),'
    + 'canvas:{left:canvas.left,top:canvas.top,right:canvas.right,bottom:canvas.bottom}}});'
    + 'throw Error("No unobstructed segment handle "+JSON.stringify(diagnostic));}'
    + 'const b=h.getBoundingClientRect();'
    + 'const axis=h.style.cursor==="ew-resize"?"x":"y";'
    + 'const initial=Number(h.getAttribute(axis==="x"?"cx":"cy"));'
    + 'const goal=Math.round(initial/24)*24+48;'
    + 'return {x:b.left+b.width/2,y:b.top+b.height/2,axis,initial,goal,'
    + 'delta:goal-initial+2,originalPath:visual().getAttribute("d")};'
    + '})()');
  await d.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:segmentProbe.x,y:segmentProbe.y});
  await d.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    x:segmentProbe.x,y:segmentProbe.y});
  await d.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
    x:segmentProbe.x+(segmentProbe.axis==="x"?segmentProbe.delta:0),
    y:segmentProbe.y+(segmentProbe.axis==="y"?segmentProbe.delta:0)});
  const segmentPreview=await d.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const p=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return p?.getAttribute("d");})()');
  assert.notEqual(segmentPreview,segmentProbe.originalPath,
    "Perpendicular segment drag must change actual visual path");
  await d.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
    x:segmentProbe.x+(segmentProbe.axis==="x"?segmentProbe.delta:0),
    y:segmentProbe.y+(segmentProbe.axis==="y"?segmentProbe.delta:0)});
  const segmentUndo=await d.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const visual=()=>document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'const committed=visual()?.getAttribute("d");'
    + 'const undo=document.querySelector("[data-eidos-diagram-history=undo]");'
    + 'if(!undo||undo.disabled)throw Error("Segment drag missing Undo");undo.click();'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'return {committed,restored:visual()?.getAttribute("d")};})()');
  assert.notEqual(segmentUndo.committed,segmentProbe.originalPath);
  assert.equal(segmentUndo.restored,segmentProbe.originalPath,
    "Undo must restore exact original orthogonal connector SVG geometry");
  assert.equal(store.getVersion(target),3,"Manual route interaction must not implicitly save");

  // B8a: fifth real Chrome tab starts from a fresh projection. Select an
  // existing relationship and switch presentation to orthogonal WITHOUT
  // clicking Add path point. Automatic line segments are directly draggable.
  e=await tab("E",true);
  await until(e,"Ready.");
  const configureAuto=async(client)=>client.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'if(!edge)throw Error("B8 automatic edge missing");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const select=document.querySelector("[data-eidos-diagram-edge-path-kind]");'
    + 'if(!select)throw Error("B8 route selector missing");'
    + 'select.value="orthogonal";select.dispatchEvent(new Event("change",{bubbles:true}));'
    + 'const nums=document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]");'
    + 'if(nums.length)throw Error("B8 should start with no manual points");'
    + 'const canvas=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();'
    + 'const candidates=[...document.querySelectorAll("[data-eidos-diagram-auto-segment-handle]")];'
    + 'const hit=candidates.find(el=>{const b=el.getBoundingClientRect();'
    + 'const x=b.left+b.width/2,y=b.top+b.height/2;'
    + 'return x>canvas.left+22&&x<canvas.right-22&&y>canvas.top+22&&y<canvas.bottom-22'
    + '&&document.elementFromPoint(x,y)===el});'
    + 'if(!hit)throw Error("B8 no native-grabbable auto segment "+JSON.stringify('
    + 'candidates.map(el=>{const r=el.getBoundingClientRect();'
    + 'return {x:r.left+r.width/2,y:r.top+r.height/2,cursor:el.style.cursor};})));'
    + 'const box=hit.getBoundingClientRect();'
    + 'const axis=hit.style.cursor==="ew-resize"?"x":"y";'
    + 'const x=box.left+box.width/2,y=box.top+box.height/2;'
    + 'const point=Number(hit.getAttribute(axis==="x"?"cx":"cy"));'
    + 'const goal=Math.round(point/24)*24+48;'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {x,y,axis,delta:goal-point+2,original:visual.getAttribute("d")};})()');
  const autoHandle=await configureAuto(e);
  const moveAuto=async(client,handle)=>{
    await client.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:handle.x,y:handle.y});
    await client.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
      x:handle.x,y:handle.y});
    await client.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
      x:handle.x+(handle.axis==="x"?handle.delta:0),
      y:handle.y+(handle.axis==="y"?handle.delta:0)});
  };
  await moveAuto(e,autoHandle);
  const autoPreview=await e.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {d:visual.getAttribute("d"),manual:'
    + 'document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};'
    + '})()');
  assert.notEqual(autoPreview.d,autoHandle.original,"B8 automatic preview should move");
  assert.equal(autoPreview.manual,0,"B8 preview cannot persist manual controls");
  await e.eval('(()=>{const h=document.querySelector("[data-eidos-diagram-auto-segment-handle]");'
    + 'h.dispatchEvent(new PointerEvent("pointercancel",{bubbles:true,pointerId:1,pointerType:"mouse"}));'
    + 'return true;})()');
  await e.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
    x:autoHandle.x+(autoHandle.axis==="x"?autoHandle.delta:0),
    y:autoHandle.y+(autoHandle.axis==="y"?autoHandle.delta:0)});
  const cancelledAuto=await e.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return {d:document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};'
    + '})()');
  assert.equal(cancelledAuto.d,autoHandle.original,"B8 pointercancel must restore exact automatic SVG");
  assert.equal(cancelledAuto.manual,0,"B8 cancelled auto drag must leave automatic routing");
  // Synthetic pointercancel does not reset Chrome's native mouse-device
  // state identically to a real OS pointer cancellation. Use a fresh tab for
  // the independent native commit/Undo proof rather than a false red test.
  f=await tab("F",true);
  await until(f,"Ready.");
  const commitHandle=await configureAuto(f);
  await moveAuto(f,commitHandle);
  const repeatedAutoPreview=await f.eval('(()=>{const id='
    + JSON.stringify(routeChoice.edge.id) + ';'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {d:visual.getAttribute("d"),manual:'
    + 'document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};})()');
  assert.notEqual(repeatedAutoPreview.d,commitHandle.original,
    "B8 native automatic segment drag on fresh tab must update SVG");
  await f.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
    x:commitHandle.x+(commitHandle.axis==="x"?commitHandle.delta:0),
    y:commitHandle.y+(commitHandle.axis==="y"?commitHandle.delta:0)});
  const committedAuto=await f.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {d:visual.getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length,'
    + 'automatic:document.querySelectorAll("[data-eidos-diagram-auto-segment-handle]").length};'
    + '})()');
  assert.notEqual(committedAuto.d,commitHandle.original,"B8 committed automatic route must change");
  assert.ok(committedAuto.manual>=2,"B8 native segment release must materialize manual control points");
  assert.equal(committedAuto.automatic,0,"B8 committed route is now explicitly editable");
  assert.equal(store.getVersion(target),3,"B8 local edit must not implicitly save");
  const undoAuto=await f.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const undo=document.querySelector("[data-eidos-diagram-history=undo]");'
    + 'if(!undo||undo.disabled)throw Error("B8 missing undo");undo.click();'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'return {d:document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length,'
    + 'automatic:document.querySelectorAll("[data-eidos-diagram-auto-segment-handle]").length};})()');
  assert.equal(undoAuto.d,commitHandle.original,"B8 Undo must restore the original automatic SVG path");
  assert.equal(undoAuto.manual,0,"B8 Undo must discard all converted manual controls");
  assert.ok(undoAuto.automatic>0,"B8 Undo must restore automatic segment drag handles");
  assert.equal(store.getVersion(target),3,"B8 Undo must not persist a Host write");

  // B8b: Redo the converted route, persist through the actual App Host
  // authorization + CAS handler, reopen a NEW Designer tab, then open the
  // actual read-only Enterprise Definition Viewer workspace in Chrome.
  const redoAuto=await f.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const redo=document.querySelector("[data-eidos-diagram-history=redo]");'
    + 'if(!redo||redo.disabled)throw Error("B8b converted route cannot be redone");'
    + 'redo.click();'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {d:visual.getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};})()');
  assert.equal(redoAuto.d,committedAuto.d,"Redo must restore the identical manually routed SVG");
  assert.equal(redoAuto.manual,committedAuto.manual,"Redo must restore exact manual point fields");
  assert.equal(store.getVersion(target),3,"Redo cannot write before Save");
  await action(f,"Save projection");
  await until(f,"Saved.");
  assert.equal(store.getVersion(target),4,"B8b Save must advance independent projection CAS once");
  const persisted=store.get(target).projections
    .find(projection=>projection.projectionId===target.projectionId);
  const savedRoute=persisted?.view.edgePaths?.find(route=>route.edgeId===routeChoice.edge.id);
  assert.ok(savedRoute,"Converted auto route must appear in saved projection edgePaths");
  assert.equal(savedRoute.pathKind,"orthogonal");
  assert.ok(savedRoute.waypoints?.length>=2,"Persisted auto-to-manual conversion must include waypoints");
  assert.equal(repository.listHistory({enterpriseId:target.enterpriseId,
    definitionId:target.definitionId}).length,1,
    "Projection save must not append a business definition revision");

  // A fresh browser tab is a real page reload/read over the persisted Store,
  // not a reuse of the Designer's in-memory local graph.
  g=await tab("G",true);
  await until(g,"Ready.");
  const reopened=await g.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'if(!edge)throw Error("Reopened Designer lost persisted relation");'
    + 'edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {d:visual.getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};})()');
  assert.equal(reopened.d,committedAuto.d,"Fresh Designer read must restore exactly saved path geometry");
  assert.equal(reopened.manual,committedAuto.manual,"Fresh Designer must expose saved manual controls");

  const savedArtifact=source.get(target);
  assert.ok(savedArtifact?.diagram2d);
  const persistedEdge=savedArtifact.diagram2d.edges.find(edge=>edge.id===routeChoice.edge.id);
  assert.deepEqual(persistedEdge?.waypoints,savedRoute.waypoints);
  assert.equal(persistedEdge?.pathKind,savedRoute.pathKind);
  const originalBusinessEdge=routeGraph.edges.find(edge=>edge.id===routeChoice.edge.id);
  assert.equal(persistedEdge.source,originalBusinessEdge.source);
  assert.equal(persistedEdge.target,originalBusinessEdge.target);
  assert.equal(persistedEdge.kind,originalBusinessEdge.kind);

  h=await tab("H","viewer");
  await until(h,"Ready.");
  // The read-only Viewer reports Ready. after its real action handler returns;
  // subsequent assertions verify the exact SVG rather than notice wording.
  const viewer=await h.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'if(!visual)throw Error("Actual Viewer lost saved auto-to-manual relation");'
    + 'return {d:visual.getAttribute("d"),'
    + 'manual:document.querySelectorAll("[data-eidos-diagram-waypoint-controls]").length,'
    + 'auto:document.querySelectorAll("[data-eidos-diagram-auto-segment-handle]").length,'
    + 'save:[...document.querySelectorAll("[data-eidos-diagram-toolbar] button")]'
    + '.some(b=>b.textContent.trim()==="Save projection")};})()');
  assert.equal(viewer.d,committedAuto.d,"Actual Viewer SVG path must equal committed Designer SVG");
  assert.equal(viewer.manual,0,"Read-only Viewer must not show Designer manual waypoint controls");
  assert.equal(viewer.auto,0,"Read-only Viewer must not show Designer auto-segment handles");
  assert.equal(viewer.save,false,"Read-only Viewer cannot expose projection Save");
  assert.equal(store.getVersion(target),4,"Viewer read must not mutate projection store");
  assert.equal(repository.listHistory({enterpriseId:target.enterpriseId,
    definitionId:target.definitionId}).length,1);

  // B8c overlap: same saved relation, restored automatic, then a single
  // manual point at the original straight elbow. Without shrinking either
  // SVG hit target, Shift+CDP-native mouse drag reaches the segment occluded
  // beneath the waypoint circle, and Undo restores the one original point.
  i=await tab("I",true);
  await until(i,"Ready.");
  const overlapProbe=await i.eval('(()=>{'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const edge=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'if(!edge)throw Error("B8c relation missing");edge.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const restore=[...document.querySelectorAll("[data-eidos-diagram-waypoint-controls] button")]'
    + '.find(b=>b.textContent==="Restore automatic routing");'
    + 'if(!restore)throw Error("B8c restore-auto control missing");restore.click();'
    + 'const add=[...document.querySelectorAll("[data-eidos-diagram-waypoint-controls] button")]'
    + '.find(b=>b.textContent==="Add path point");'
    + 'if(!add)throw Error("B8c add-point control missing");add.click();'
    + 'const matches=[...document.querySelectorAll("[data-eidos-diagram-overlap-point]")];'
    + 'const stage=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();'
    + 'const hit=matches.find(el=>{const r=el.getBoundingClientRect();'
    + 'const x=r.left+r.width/2,y=r.top+r.height/2;'
    + 'return x>stage.left+22&&x<stage.right-22&&y>stage.top+22&&y<stage.bottom-22'
    + '&&document.elementFromPoint(x,y)===el});'
    + 'if(!hit)throw Error("No visible B8c overlap waypoint "+JSON.stringify('
    + 'matches.map(el=>{const b=el.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2};})));'
    + 'const r=hit.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;'
    + 'const segments=[...document.querySelectorAll("[data-eidos-diagram-segment-handle]")];'
    + 'const ranked=segments.map(el=>{const b=el.getBoundingClientRect();'
    + 'return {el,d:Math.hypot(x-(b.left+b.width/2),y-(b.top+b.height/2))};})'
    + '.filter(item=>item.d<=44).sort((a,b)=>a.d-b.d||'
    + 'Number(a.el.getAttribute("data-eidos-diagram-segment-handle").split(":").at(-1))-'
    + 'Number(b.el.getAttribute("data-eidos-diagram-segment-handle").split(":").at(-1)));'
    + 'if(!ranked.length)throw Error("B8c no overlapping segment candidate");'
    + 'const axis=ranked[0].el.style.cursor==="ew-resize"?"x":"y";'
    + 'const visual=document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]");'
    + 'return {x,y,axis,old:visual.getAttribute("d"),'
    + 'points:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length,'
    + 'hint:hit.getAttribute("title"),radius:hit.getAttribute("data-eidos-diagram-handle-screen-radius")};})()');
  assert.equal(overlapProbe.points,2,"B8c starts with exactly one manual waypoint");
  assert.equal(overlapProbe.radius,"22","B8c cannot shrink 44px waypoint target");
  assert.match(overlapProbe.hint,/Shift\+drag/);
  const bx=overlapProbe.x+(overlapProbe.axis==="x"?64:0);
  const by=overlapProbe.y+(overlapProbe.axis==="y"?64:0);
  await i.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:overlapProbe.x,y:overlapProbe.y});
  await i.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    modifiers:8,x:overlapProbe.x,y:overlapProbe.y});
  await i.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",modifiers:8,x:bx,y:by});
  const overlapPreview=await i.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d");})()');
  assert.notEqual(overlapPreview,overlapProbe.old,"Native Shift drag must preview hidden segment");
  await i.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",modifiers:8,x:bx,y:by});
  const overlapCommitted=await i.eval('(()=>({'
    + 'points:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length,'
    + 'undo:!document.querySelector("[data-eidos-diagram-history=undo]")?.disabled'
    + '}))()');
  assert.ok(overlapCommitted.points>=4,"Shift+drag must move whole segment and materialize at least two controls");
  assert.equal(overlapCommitted.undo,true);
  await i.eval('(()=>{document.querySelector("[data-eidos-diagram-history=undo]").click();'
    + 'const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]")'
    + '.dispatchEvent(new MouseEvent("click",{bubbles:true}));return true;})()');
  const overlapUndo=await i.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return {d:document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d"),'
    + 'points:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};})()');
  assert.equal(overlapUndo.d,overlapProbe.old);
  assert.equal(overlapUndo.points,2);
  assert.equal(store.getVersion(target),4,"B8c hit-disambiguation must not implicitly Save");

  // B8c native Chrome CDP touch stream, not a JS-dispatched PointerEvent:
  // touchStart/move/cancel THEN touchStart/move/end on the SAME page and
  // selected automatic segment. This directly probes regrab after cancel.
  j=await tab("J",true);
  await until(j,"Ready.");
  await j.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:2});
  const touchProbe=await j.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'const e=document.querySelector("[data-eidos-diagram-edge="+CSS.escape(id)+"]");'
    + 'e.dispatchEvent(new MouseEvent("click",{bubbles:true}));'
    + 'const restore=[...document.querySelectorAll("[data-eidos-diagram-waypoint-controls] button")]'
    + '.find(b=>b.textContent==="Restore automatic routing");'
    + 'if(!restore)throw Error("B8c touch: no Restore automatic routing");restore.click();'
    + 'const canvas=document.querySelector("[data-eidos-diagram-canvas]").getBoundingClientRect();'
    + 'const segments=[...document.querySelectorAll("[data-eidos-diagram-auto-segment-handle]")];'
    + 'const hit=segments.find(el=>{const r=el.getBoundingClientRect();'
    + 'const x=r.left+r.width/2,y=r.top+r.height/2;'
    + 'return x>canvas.left+22&&x<canvas.right-22&&y>canvas.top+22&&y<canvas.bottom-22'
    + '&&document.elementFromPoint(x,y)===el});'
    + 'if(!hit)throw Error("B8c touch: auto segment not hit-testable");'
    + 'const r=hit.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;'
    + 'const axis=hit.style.cursor==="ew-resize"?"x":"y";'
    + 'return {x,y,axis,old:document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d")};})()');
  const tpx=touchProbe.x+(touchProbe.axis==="x"?72:0);
  const tpy=touchProbe.y+(touchProbe.axis==="y"?72:0);
  const touch=async(type,id,x,y)=>{
    const touchPoints=type==="touchEnd"||type==="touchCancel"?[]
      :[{x,y,id}];
    await j.send("Input.dispatchTouchEvent",{type,touchPoints});
  };
  await touch("touchStart",1,touchProbe.x,touchProbe.y);
  await touch("touchMove",1,tpx,tpy);
  const firstTouchPreview=await j.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d");})()');
  assert.notEqual(firstTouchPreview,touchProbe.old,"Chrome native touch drag did not preview route");
  await touch("touchCancel",1,tpx,tpy);
  const afterNativeCancel=await j.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return {d:document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d"),'
    + 'points:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length};})()');
  assert.equal(afterNativeCancel.d,touchProbe.old,"Native touchCancel must restore exact SVG");
  assert.equal(afterNativeCancel.points,0,"Native touchCancel cannot add waypoints");
  await touch("touchStart",2,touchProbe.x,touchProbe.y);
  await touch("touchMove",2,tpx,tpy);
  const nativeRegrab=await j.eval('(()=>{const id='+JSON.stringify(routeChoice.edge.id)+';'
    + 'return document.querySelector("[data-eidos-diagram-edge-visual="+CSS.escape(id)+"]").getAttribute("d");})()');
  assert.notEqual(nativeRegrab,touchProbe.old,"Same-tab native touch regrab after cancel must preview");
  await touch("touchEnd",2,tpx,tpy);
  const nativeCommitted=await j.eval('(()=>({'
    + 'points:document.querySelectorAll("[data-eidos-diagram-waypoint-controls] input[type=number]").length'
    + '}))()');
  assert.ok(nativeCommitted.points>=2,"Native touch regrab commit must create manual points");
  assert.equal(store.getVersion(target),4,"Same-page touch sequence must not auto-save");

  // B8d: independent actual Chrome tab; construct a compact five-point route
  // through the real Inspector controls so 3+ segment handles overlap the
  // final waypoint. CDP Shift+Alt click cycles to third, then drags it.
  k=await tab("K",true);
  await until(k,"Ready.");
  const denseProbe=await k.eval("(()=>{\n const id=__EDGE_ID__;\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8d relation missing\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const button=name=>{\n   const el=[...document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] button\")]\n     .find(b=>b.textContent===name);\n   if(!el)throw Error(\"Missing \"+name);\n   return el;\n };\n button(\"Restore automatic routing\").click();\n for(let i=0;i<5;i++)button(\"Add path point\").click();\n const readInputs=()=>[...document.querySelectorAll(\n   \"[data-eidos-diagram-waypoint-controls] input[type=number]\")];\n const inputs=readInputs();\n if(inputs.length!==10)throw Error(\"B8d expected five editable waypoints\");\n const cx=Number(inputs[0].value),cy=Number(inputs[1].value);\n const offsets=[[-24,0],[0,-24],[24,0],[0,24],[8,8]];\n for(let i=0;i<offsets.length;i++)for(let axis=0;axis<2;axis++){\n   const el=readInputs()[i*2+axis];\n   el.value=String((axis===0?cx:cy)+offsets[i][axis]);\n   el.dispatchEvent(new Event(\"change\",{bubbles:true}));\n }\n const hit=[...document.querySelectorAll(\"[data-eidos-diagram-waypoint-handle]\")]\n   .find(el=>el.getAttribute(\"data-eidos-diagram-waypoint-handle\")===id+\":4\");\n if(!hit)throw Error(\"B8d final manual point not visible\");\n const rect=hit.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;\n if(document.elementFromPoint(x,y)!==hit)\n   throw Error(\"B8d final waypoint not topmost at center\");\n const segments=[...document.querySelectorAll(\"[data-eidos-diagram-segment-handle]\")]\n   .map(el=>{\n     const r=el.getBoundingClientRect();\n     return {x:r.left+r.width/2,y:r.top+r.height/2,\n       index:Number(el.getAttribute(\"data-eidos-diagram-segment-handle\").split(\":\").at(-1)),\n       axis:el.style.cursor===\"ew-resize\"?\"x\":\"y\"};\n   })\n   .map(s=>({...s,d:Math.hypot(x-s.x,y-s.y)}))\n   .filter(s=>s.d<=44)\n   .sort((a,b)=>a.d-b.d||a.index-b.index||a.axis.localeCompare(b.axis));\n const seen=new Set();\n const ranked=segments.filter(s=>{\n   const key=s.index+\":\"+s.axis;if(seen.has(key))return false;\n   seen.add(key);return true;\n });\n const marker=document.querySelector(\"[data-eidos-diagram-overlap-choice=\"+CSS.escape(id+\":4\")+\"]\");\n if(ranked.length<3||!marker)\n   throw Error(\"B8d needs 3+ distinct overlap segments: \"+JSON.stringify(\n     {ranked,marker:!!marker,hit:hit.outerHTML.slice(0,500)}));\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {x,y,axis:ranked[2].axis,count:ranked.length,old:visual.getAttribute(\"d\"),\n  rank:hit.getAttribute(\"data-eidos-diagram-overlap-selected-rank\"),\n  hint:hit.getAttribute(\"title\"),\n  radius:hit.getAttribute(\"data-eidos-diagram-handle-screen-radius\"),\n  tag:marker.textContent};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.ok(denseProbe.count>=3,"B8d requires at least three overlapping segments");
  assert.equal(denseProbe.rank,"1","B8d default alternate remains the second segment");
  assert.equal(denseProbe.radius,"22","B8d keeps original 44 CSS px hit circle");
  assert.ok(denseProbe.hint.includes("Shift+Alt+click"));
  await k.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:denseProbe.x,y:denseProbe.y});
  await k.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    modifiers:9,x:denseProbe.x,y:denseProbe.y});
  await k.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,
    modifiers:9,x:denseProbe.x,y:denseProbe.y});
  const afterCycle=await k.eval("(()=>{\n const id=__EDGE_ID__;\n const point=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(id+\":4\")+\"]\");\n const label=document.querySelector(\"[data-eidos-diagram-overlap-choice=\"+CSS.escape(id+\":4\")+\"]\");\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {rank:point?.getAttribute(\"data-eidos-diagram-overlap-selected-rank\"),\n   label:label?.textContent, d:visual?.getAttribute(\"d\"),\n   radius:point?.getAttribute(\"data-eidos-diagram-handle-screen-radius\")};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(afterCycle.rank,"2","Shift+Alt click must select third segment");
  assert.equal(afterCycle.label,"3/"+denseProbe.count);
  assert.equal(afterCycle.d,denseProbe.old,"A click must not mutate route geometry");
  assert.equal(afterCycle.radius,"22");
  assert.equal(store.getVersion(target),4,"Selection cycle cannot implicitly Save");
  const dx=denseProbe.x+(denseProbe.axis==="x"?72:0);
  const dy=denseProbe.y+(denseProbe.axis==="y"?72:0);
  await k.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:denseProbe.x,y:denseProbe.y});
  await k.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    modifiers:9,x:denseProbe.x,y:denseProbe.y});
  await k.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",modifiers:9,x:dx,y:dy});
  const densePreview=await k.eval("(()=>{\n const id=__EDGE_ID__;\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")\n  .getAttribute(\"d\");\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.notEqual(densePreview,denseProbe.old,"Selected third segment must preview a changed route");
  await k.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",modifiers:9,x:dx,y:dy});
  const denseCommitted=await k.eval("(()=>{\n const id=__EDGE_ID__;\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")\n  .getAttribute(\"d\");\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.notEqual(denseCommitted,denseProbe.old,"Selected third segment drag must commit locally");
  const denseUndo=await k.eval("(()=>{\n const id=__EDGE_ID__;\n document.querySelector(\"[data-eidos-diagram-history=undo]\").click();\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\").getAttribute(\"d\");\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(denseUndo,denseProbe.old,"Single Undo must restore before third-segment edit");
  assert.equal(store.getVersion(target),4,"Dense overlap interaction must not implicitly Save");
  assert.equal(repository.listHistory({enterpriseId:target.enterpriseId,definitionId:target.definitionId}).length,1);

  // B8e: rounded-orthogonal dense route in a separate real Chrome tab.
  // Cycle past fourth to the last occluded handle, wrap back to second,
  // then native Shift+Alt drag -> Escape cancel -> same-page regrab/Undo/Redo.
  l=await tab("L",true);
  await until(l,"Ready.");
  const roundedProbe=await l.eval("(()=>{\n const id=__EDGE_ID__;\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8e rounded route relation missing\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const button=name=>{\n  const el=[...document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] button\")]\n   .find(b=>b.textContent===name);\n  if(!el)throw Error(\"B8e missing \"+name);\n  return el;\n };\n button(\"Restore automatic routing\").click();\n const type=document.querySelector(\"[data-eidos-diagram-edge-path-kind=\"+CSS.escape(id)+\"]\");\n if(!type)throw Error(\"B8e path kind control missing\");\n type.value=\"rounded-orthogonal\";\n type.dispatchEvent(new Event(\"change\",{bubbles:true}));\n for(let i=0;i<5;i++)button(\"Add path point\").click();\n const inputs=()=>[...document.querySelectorAll(\n  \"[data-eidos-diagram-waypoint-controls] input[type=number]\")];\n if(inputs().length!==10)throw Error(\"B8e expects five waypoints\");\n const cx=Number(inputs()[0].value),cy=Number(inputs()[1].value);\n const offsets=[[-24,0],[0,-24],[24,0],[0,24],[8,8]];\n for(let i=0;i<5;i++)for(let axis=0;axis<2;axis++){\n  const el=inputs()[i*2+axis];\n  el.value=String((axis===0?cx:cy)+offsets[i][axis]);\n  el.dispatchEvent(new Event(\"change\",{bubbles:true}));\n }\n const hit=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(id+\":4\")+\"]\");\n if(!hit)throw Error(\"B8e waypoint circle missing\");\n const r=hit.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;\n if(document.elementFromPoint(x,y)!==hit)throw Error(\"B8e waypoint not topmost\");\n const segments=[...document.querySelectorAll(\"[data-eidos-diagram-segment-handle]\")]\n  .filter(el=>el.getAttribute(\"data-eidos-diagram-segment-handle\")?.startsWith(id+\":\"))\n  .map(el=>{\n   const b=el.getBoundingClientRect();\n   return {index:Number(el.getAttribute(\"data-eidos-diagram-segment-handle\").split(\":\").at(-1)),\n    axis:el.style.cursor===\"ew-resize\"?\"x\":\"y\",\n    d:Math.hypot(x-(b.left+b.width/2),y-(b.top+b.height/2))};\n  }).filter(v=>v.d<=44)\n  .sort((a,b)=>a.d-b.d||a.index-b.index||a.axis.localeCompare(b.axis));\n const seen=new Set(),ranked=segments.filter(s=>{\n  const key=s.index+\":\"+s.axis;if(seen.has(key))return false;seen.add(key);return true;\n });\n if(ranked.length<4)throw Error(\"B8e four or more route candidates required: \"+JSON.stringify(ranked));\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n const old=visual?.getAttribute(\"d\");\n if(!old?.includes(\" Q \"))throw Error(\"B8e route was not rounded\");\n const label=document.querySelector(\"[data-eidos-diagram-overlap-choice=\"+CSS.escape(id+\":4\")+\"]\");\n if(!label)throw Error(\"B8e candidate rank label missing\");\n return {x,y,count:ranked.length,axis:ranked.at(-1).axis,old,\n  radius:hit.getAttribute(\"data-eidos-diagram-handle-screen-radius\"),\n  rank:hit.getAttribute(\"data-eidos-diagram-overlap-selected-rank\"),\n  choice:label.textContent};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.ok(roundedProbe.count>=4);
  assert.equal(roundedProbe.rank,"1");
  assert.equal(roundedProbe.radius,"22","B8e 44px hit circle cannot shrink");
  const roundedState=()=>l.eval("(()=>{\n const id=__EDGE_ID__;\n const hit=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(id+\":4\")+\"]\");\n const label=document.querySelector(\"[data-eidos-diagram-overlap-choice=\"+CSS.escape(id+\":4\")+\"]\");\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {rank:hit?.getAttribute(\"data-eidos-diagram-overlap-selected-rank\"),\n  label:label?.textContent,d:visual?.getAttribute(\"d\"),\n  radius:hit?.getAttribute(\"data-eidos-diagram-handle-screen-radius\"),\n  points:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  const clickAlternate=async()=>{
    await l.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:roundedProbe.x,y:roundedProbe.y});
    await l.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
      modifiers:9,x:roundedProbe.x,y:roundedProbe.y});
    await l.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,
      modifiers:9,x:roundedProbe.x,y:roundedProbe.y});
  };
  for(let rank=2;rank<roundedProbe.count;rank++) {
    await clickAlternate();
    const selection=await roundedState();
    assert.equal(selection.rank,String(rank),"B8e all high ordinals must be selectable");
    assert.equal(selection.label,(rank+1)+"/"+roundedProbe.count);
    assert.equal(selection.d,roundedProbe.old,"B8e selection must not edit rounded route");
    assert.equal(selection.radius,"22");
  }
  await clickAlternate();
  const wrapped=await roundedState();
  assert.equal(wrapped.rank,"1","B8e last candidate wraps back to second");
  assert.equal(wrapped.d,roundedProbe.old);
  for(let rank=2;rank<roundedProbe.count;rank++)await clickAlternate();
  assert.equal((await roundedState()).rank,String(roundedProbe.count-1));
  assert.equal(store.getVersion(target),4,"B8e hit cycling never saves");

  const rx=roundedProbe.x+(roundedProbe.axis==="x"?64:0);
  const ry=roundedProbe.y+(roundedProbe.axis==="y"?64:0);
  const roundedPress=async()=>{
    await l.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:roundedProbe.x,y:roundedProbe.y});
    await l.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
      modifiers:9,x:roundedProbe.x,y:roundedProbe.y});
    await l.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
      modifiers:9,x:rx,y:ry});
  };
  const roundedRelease=async()=>{
    await l.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
      modifiers:9,x:rx,y:ry});
  };
  await l.eval('document.querySelector("[data-eidos-diagram-canvas]").focus({preventScroll:true})');
  await roundedPress();
  const cancelPreview=await roundedState();
  assert.notEqual(cancelPreview.d,roundedProbe.old,"B8e last segment must visibly preview");
  assert.match(cancelPreview.d,/ Q /,"B8e preview must preserve rounded corners");
  await l.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",
    windowsVirtualKeyCode:27});
  await l.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",
    windowsVirtualKeyCode:27});
  await roundedRelease();
  const cancelled=await roundedState();
  assert.equal(cancelled.d,roundedProbe.old,"Escape must restore original rounded SVG");
  assert.equal(cancelled.rank,String(roundedProbe.count-1));
  assert.equal(store.getVersion(target),4,"Cancel cannot write the projection");

  await roundedPress();
  const regrabPreview=await roundedState();
  assert.notEqual(regrabPreview.d,roundedProbe.old,
    "Native same-tab mouse regrab after Escape must preview");
  await roundedRelease();
  const committedRounded=await roundedState();
  assert.notEqual(committedRounded.d,roundedProbe.old,"B8e final candidate must commit");
  assert.match(committedRounded.d,/ Q /,"B8e commit remains rounded");
  const roundedUndo=await l.eval("(()=>{\n const id=__EDGE_ID__;\n const button=document.querySelector(\"[data-eidos-diagram-history=undo]\");\n if(!button||button.disabled)throw Error(\"B8e Undo was not enabled\");\n button.click();\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\").getAttribute(\"d\");\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(roundedUndo,roundedProbe.old,
    "One Undo restores original rounded SVG after last segment drag");
  const roundedRedo=await l.eval("(()=>{\n const id=__EDGE_ID__;\n const button=document.querySelector(\"[data-eidos-diagram-history=redo]\");\n if(!button||button.disabled)throw Error(\"B8e Redo was not enabled\");\n button.click();\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\").getAttribute(\"d\");\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(roundedRedo,committedRounded.d,"Redo restores exactly committed rounded SVG");
  assert.equal(store.getVersion(target),4,"Undo/Redo must not write projection");
  await action(l,"Save projection");
  await until(l,"Saved.");
  assert.equal(store.getVersion(target),5,"B8e rounded route Save CAS advances exactly once");
  const roundedSaved=store.get(target).projections
    .find(projection=>projection.projectionId===target.projectionId)
    ?.view.edgePaths?.find(edge=>edge.edgeId===routeChoice.edge.id);
  assert.equal(roundedSaved?.pathKind,"rounded-orthogonal");
  assert.ok(roundedSaved?.waypoints?.length>=2);
  assert.equal(repository.listHistory({
    enterpriseId:target.enterpriseId,definitionId:target.definitionId
  }).length,1,"Rounded presentation Save must not add domain revision");

  m=await tab("M",true);
  await until(m,"Ready.");
  const refreshedRounded=await m.eval("(()=>{\n const id=__EDGE_ID__;\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8e saved edge missing\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {d:visual?.getAttribute(\"d\"),\n  kind:document.querySelector(\"[data-eidos-diagram-edge-path-kind=\"+CSS.escape(id)+\"]\")?.value,\n  manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(refreshedRounded.d,committedRounded.d,
    "Fresh Designer must reread identical persisted rounded SVG");
  assert.equal(refreshedRounded.kind,"rounded-orthogonal");
  assert.ok(refreshedRounded.manual>=4);
  n=await tab("N","viewer");
  await until(n,"Ready.");
  const readonlyRounded=await n.eval("(()=>{\n const id=__EDGE_ID__;\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {d:visual?.getAttribute(\"d\"),\n  manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls]\").length,\n  save:[...document.querySelectorAll(\"[data-eidos-diagram-toolbar] button\")]\n   .some(b=>b.textContent.trim()===\"Save projection\")};\n})()".replace("__EDGE_ID__",JSON.stringify(routeChoice.edge.id)));
  assert.equal(readonlyRounded.d,committedRounded.d,
    "Actual read-only Viewer must render the persisted rounded SVG identically");
  assert.equal(readonlyRounded.manual,0);
  assert.equal(readonlyRounded.save,false);
  assert.equal(store.getVersion(target),5,"Viewer read never writes");


  // B8f: isolated synthetic self relation in a test-only artifact source.
  // Actual App Host read/CAS save and Viewer render use the same injected source.
  o=await tab("O","loop");
  await until(o,"Ready.");
  const loopProbe=await o.eval("(()=>{const id=__ID__;const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8f fixture self-edge not in read\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const route=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n const handle=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(id+\":0\")+\"]\");\n if(!handle)throw Error(\"B8f exterior cubic bulge handle absent\");\n const r=handle.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;\n if(document.elementFromPoint(x,y)!==handle)throw Error(\"Bulge handle not hit-testable \"+JSON.stringify({x,y,top:document.elementFromPoint(x,y)?.outerHTML.slice(0,350),handle:handle.outerHTML.slice(0,350),bounds:r.toJSON(),canvas:document.querySelector(\"[data-eidos-diagram-canvas]\")?.getBoundingClientRect().toJSON()}));\n if(document.querySelector(\"[data-eidos-diagram-waypoint-controls] input[type=number]\"))\n  throw Error(\"Auto loop selection materialized saved manual control\");\n return {x,y,old:route.getAttribute(\"d\"),radius:handle.getAttribute(\"data-eidos-diagram-handle-screen-radius\")};\n})()".replace("__ID__",JSON.stringify(selfId)));
  assert.equal(loopProbe.radius,"22");
  assert.match(loopProbe.old,/ C /,"Automatic self-edge starts cubic");
  assert.equal(store.getVersion(target),5,"Loop selection cannot write");
  const loopX=loopProbe.x+64,loopY=loopProbe.y-20;
  const loopPress=async()=>{
    await o.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:loopProbe.x,y:loopProbe.y});
    await o.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
      x:loopProbe.x,y:loopProbe.y});
    await o.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",x:loopX,y:loopY});
  };
  const loopRelease=()=>o.send("Input.dispatchMouseEvent",{type:"mouseReleased",
    button:"left",x:loopX,y:loopY});
  await loopPress();
  const loopPreview=await o.eval("(()=>{const id=__ID__;return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"), manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};})()".replace("__ID__",JSON.stringify(selfId)));
  assert.notEqual(loopPreview.d,loopProbe.old,"Native loop bulge drag must preview");
  assert.match(loopPreview.d,/ C /);
  await o.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",
    code:"Escape",windowsVirtualKeyCode:27});
  await o.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",
    code:"Escape",windowsVirtualKeyCode:27});
  await loopRelease();
  assert.equal((await o.eval("(()=>{const id=__ID__;return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"), manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};})()".replace("__ID__",JSON.stringify(selfId)))).d,loopProbe.old,
    "Native Escape restores automatic cubic");
  await loopPress();
  assert.notEqual((await o.eval("(()=>{const id=__ID__;return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"), manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};})()".replace("__ID__",JSON.stringify(selfId)))).d,loopProbe.old,
    "Cancelled bulge can be regrabbed on the same page");
  await loopRelease();
  const loopCommit=await o.eval("(()=>{const id=__ID__;return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"), manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};})()".replace("__ID__",JSON.stringify(selfId)));
  assert.notEqual(loopCommit.d,loopProbe.old);
  assert.match(loopCommit.d,/ C /);
  assert.equal(loopCommit.manual,2,"One editable cubic bulge waypoint");
  assert.equal(await o.eval("(()=>{const id=__ID__;const b=document.querySelector(\"[data-eidos-diagram-history=undo]\");if(!b||b.disabled)throw Error(\"B8f Undo unavailable\");b.click();document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\")?.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\");})()".replace("__ID__",JSON.stringify(selfId))),loopProbe.old);
  assert.equal(await o.eval("(()=>{const id=__ID__;const b=document.querySelector(\"[data-eidos-diagram-history=redo]\");if(!b||b.disabled)throw Error(\"B8f Redo unavailable\");b.click();document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\")?.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\");})()".replace("__ID__",JSON.stringify(selfId))),loopCommit.d);
  assert.equal(store.getVersion(target),5,"Loop Undo/Redo cannot auto-save");
  await action(o,"Save projection");
  await until(o,"Saved.");
  assert.equal(store.getVersion(target),6,"Loop explicit CAS Save once");
  const storedLoop=store.get(target).projections
    .find(x=>x.projectionId===target.projectionId)?.view.edgePaths
    ?.find(x=>x.edgeId===selfId);
  assert.equal(storedLoop?.pathKind,"curve");
  assert.equal(storedLoop?.waypoints?.length,1);
  assert.equal(repository.listHistory({enterpriseId:target.enterpriseId,
    definitionId:target.definitionId}).length,1);
  p=await tab("P","loop");
  await until(p,"Ready.");
  const refreshedLoop=await p.eval("(()=>{const id=__ID__;const e=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");if(!e)throw Error(\"B8f fresh self-edge missing\");e.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"),kind:document.querySelector(\"[data-eidos-diagram-edge-path-kind=\"+CSS.escape(id)+\"]\")?.value,manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};})()".replace("__ID__",JSON.stringify(selfId)));
  assert.equal(refreshedLoop.d,loopCommit.d,"Fresh Designer exact cubic SVG");
  assert.equal(refreshedLoop.kind,"curve");
  assert.equal(refreshedLoop.manual,2);
  q=await tab("Q","loop-viewer");
  await until(q,"Ready.");
  const viewerLoop=await q.eval("(()=>{const id=__ID__;return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"),manual:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls]\").length,save:[...document.querySelectorAll(\"[data-eidos-diagram-toolbar] button\")].some(b=>b.textContent.trim()===\"Save projection\")};})()".replace("__ID__",JSON.stringify(selfId)));
  assert.equal(viewerLoop.d,loopCommit.d,"Readonly Viewer exact cubic SVG");
  assert.equal(viewerLoop.manual,0);
  assert.equal(viewerLoop.save,false);
  assert.equal(store.getVersion(target),6,"Viewer read must not write");

  // B8g: one additional actual Chrome scene with a test-only adjacent node
  // occupying the right self-loop corridor. Restore automatic path, verify
  // bottom fallback is hit-testable, native drag, explicit CAS Save, then
  // remove the obstacle in a fresh Designer/Viewer: manual side must be pinned.
  r=await tab("R","blocked-loop");
  await until(r,"Ready.");
  const fallback=await r.eval("(()=>{\n const id=__LOOP_ID__;\n const edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8g test-only blocked self-loop missing\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const ctl=document.querySelector(\"[data-eidos-diagram-waypoint-controls]\");\n if(!ctl)throw Error(\"B8g self-loop Inspector missing\");\n const restore=[...ctl.querySelectorAll(\"button\")]\n  .find(b=>b.textContent===\"Restore automatic routing\");\n if(!restore)throw Error(\"B8g Restore automatic routing unavailable\");\n restore.click();\n const hit=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(id+\":0\")+\"]\");\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n if(!hit||!visual)throw Error(\"B8g automatic self-loop handle absent\");\n const b=hit.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;\n const top=document.elementFromPoint(x,y);\n if(top!==hit)throw Error(\"B8g free-side handle not hit-testable \"+JSON.stringify({\n   x,y,top:top?.outerHTML.slice(0,220),handle:hit.outerHTML.slice(0,220)}));\n return {x,y,worldY:Number(hit.getAttribute(\"cy\")),worldX:Number(hit.getAttribute(\"cx\")),\n   d:visual.getAttribute(\"d\"),radius:hit.getAttribute(\"data-eidos-diagram-handle-screen-radius\"),\n   inputs:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length,\n   blocker:document.querySelector(\"[data-eidos-diagram-node=diagram-browser\\\\:right-obstacle]\")!==null};\n})()".replace("__LOOP_ID__",JSON.stringify(selfId)));
  assert.equal(fallback.blocker,true,"B8g obstacle fixture must be visible");
  assert.equal(fallback.radius,"22","B8g keeps 44 CSS px hit area");
  assert.equal(fallback.inputs,0,"B8g restore cannot manufacture manual points");
  assert.ok(fallback.worldY>selfNode.y+selfNode.height+20,
    "B8g free-side automatic curve bulge must face below blocked right side");
  assert.match(fallback.d,/ C /);
  assert.ok(fallback.d.startsWith("M "+String(Math.round((selfNode.x+selfNode.width*.28)*1000)/1000)
    +" "+String(Math.round((selfNode.y+selfNode.height)*1000)/1000)+" "));
  assert.equal(store.getVersion(target),6,"B8g automatic fallback is local only");
  const fx=fallback.x,fy=fallback.y+55;
  await r.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:fx,y:fallback.y});
  await r.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    x:fx,y:fallback.y});
  await r.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",x:fx,y:fy});
  const fallbackPreview=await r.eval("(()=>{\n const id=__LOOP_ID__;\n return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"),\n  controls:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};\n})()".replace("__LOOP_ID__",JSON.stringify(selfId)));
  assert.notEqual(fallbackPreview.d,fallback.d,
    "Native drag of clear-side bulge must preview a different cubic");
  assert.match(fallbackPreview.d,/ C /);
  await r.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",x:fx,y:fy});
  const fallbackCommit=await r.eval("(()=>{\n const id=__LOOP_ID__;\n return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"),\n  controls:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};\n})()".replace("__LOOP_ID__",JSON.stringify(selfId)));
  assert.notEqual(fallbackCommit.d,fallback.d);
  assert.equal(fallbackCommit.controls,2,"Committed clear-side cubic has exactly one manual point");
  assert.equal(await r.eval("(()=>{\n const id=__LOOP_ID__,b=document.querySelector(\"[data-eidos-diagram-history=undo]\");\n if(!b||b.disabled)throw Error(\"B8g Undo missing\");b.click();\n document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\")\n  ?.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\");\n})()".replace("__LOOP_ID__",JSON.stringify(selfId))),fallback.d,
    "B8g one Undo restores automatic bottom fallback");
  assert.equal(await r.eval("(()=>{\n const id=__LOOP_ID__,b=document.querySelector(\"[data-eidos-diagram-history=redo]\");\n if(!b||b.disabled)throw Error(\"B8g Redo missing\");b.click();\n document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\")\n  ?.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\");\n})()".replace("__LOOP_ID__",JSON.stringify(selfId))),fallbackCommit.d,
    "B8g one Redo restores committed bottom-side cubic");
  assert.equal(store.getVersion(target),6,"B8g local edits cannot auto-save");
  await action(r,"Save projection");
  await until(r,"Saved.");
  assert.equal(store.getVersion(target),7,"B8g explicit CAS Save advances once");
  const savedFallback=store.get(target).projections
    .find(p=>p.projectionId===target.projectionId)?.view.edgePaths
    ?.find(e=>e.edgeId===selfId);
  assert.equal(savedFallback?.pathKind,"curve");
  assert.equal(savedFallback?.waypoints?.length,1);
  assert.ok(savedFallback.waypoints[0].y>selfNode.y+selfNode.height,
    "B8g saved manual point must remain outside bottom edge");
  assert.equal(repository.listHistory({enterpriseId:target.enterpriseId,
    definitionId:target.definitionId}).length,1,
    "Self-loop reroute cannot create a business definition revision");
  // The obstacle is ABSENT in these new tabs: persistence must pin manual side.
  sTab=await tab("S","loop");
  await until(sTab,"Ready.");
  const obstacleGone=await sTab.eval("(()=>{\n const id=__LOOP_ID__,edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n if(!edge)throw Error(\"B8g self relation gone after unobstructed read\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n return {d:visual?.getAttribute(\"d\"),\n   inputs:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls] input[type=number]\").length};\n})()".replace("__LOOP_ID__",JSON.stringify(selfId)));
  assert.equal(obstacleGone.d,fallbackCommit.d,
    "Fresh Designer without adjacent obstacle must respect manually saved bottom side");
  assert.equal(obstacleGone.inputs,2);
  t=await tab("T","loop-viewer");
  await until(t,"Ready.");
  const fallbackViewer=await t.eval("(()=>{\n const id=__LOOP_ID__;\n return {d:document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\"),\n  edit:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls]\").length,\n  save:[...document.querySelectorAll(\"[data-eidos-diagram-toolbar] button\")]\n    .some(b=>b.textContent.trim()===\"Save projection\")};\n})()".replace("__LOOP_ID__",JSON.stringify(selfId)));
  assert.equal(fallbackViewer.d,fallbackCommit.d,
    "Readonly Viewer without obstacle renders pinned manual cubic unchanged");
  assert.equal(fallbackViewer.edit,0);
  assert.equal(fallbackViewer.save,false);
  assert.equal(store.getVersion(target),7,"B8g Viewer read cannot write");

  // B8h: three isolated genuine Chrome tabs. Stable-ID sibling distribution,
  // fifth loop nested with honest warning, hit-tested native pointer drag,
  // read-only Viewer parity, and all four sides blocked congestion warning.
  u=await tab("U","multi-loop");
  await until(u,"Ready.");
  const multiProbe=await u.eval("(()=>{\n const ids=__IDS__,node=__NODE__;\n const edges=ids.map(id=>{\n   const p=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n   if(!p)throw Error(\"B8h missing synthetic self-edge \"+id);\n   const d=p.getAttribute(\"d\");\n   const m=/^M\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)/.exec(d);\n   if(!m)throw Error(\"B8h invalid self-edge SVG \"+d);\n   const x=Number(m[1]),y=Number(m[2]);\n   const eq=(a,b)=>Math.abs(a-b)<.002;\n   const side=eq(x,node.x+node.width)?\"right\"\n     :eq(y,node.y+node.height)?\"bottom\"\n     :eq(x,node.x)?\"left\":eq(y,node.y)?\"top\":\"unknown\";\n   return {id,d,side,\n     congested:document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\")\n       ?.getAttribute(\"data-eidos-diagram-route-congested\")===\"true\",\n     warning:!!document.querySelector(\"[data-eidos-diagram-congestion-warning=\"+CSS.escape(id)+\"]\")};\n });\n const fifth=ids[4],edge=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(fifth)+\"]\");\n edge.dispatchEvent(new MouseEvent(\"click\",{bubbles:true}));\n const handle=document.querySelector(\"[data-eidos-diagram-waypoint-handle=\"+CSS.escape(fifth+\":0\")+\"]\");\n if(!handle)throw Error(\"B8h fifth outward cubic bulge not draggable\");\n const r=handle.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;\n const top=document.elementFromPoint(x,y);\n if(top!==handle)throw Error(\"B8h fifth handle is obscured: \"+top?.outerHTML.slice(0,170));\n return {edges,x,y,radius:handle.getAttribute(\"data-eidos-diagram-handle-screen-radius\"),\n   fifthWorldX:Number(handle.getAttribute(\"cx\")),\n   firstWorldX:node.x+node.width,\n   hit:top===handle};\n})()".replace("__IDS__",JSON.stringify(multiIds)).replace("__NODE__",JSON.stringify(selfNode)));
  assert.deepEqual(multiProbe.edges.map(e=>e.side),
    ["right","bottom","left","top","right"],
    "Five automatic self-loops must distribute by stable ID");
  assert.ok(multiProbe.edges.slice(0,4).every(e=>!e.congested&&!e.warning));
  assert.equal(multiProbe.edges[4].congested,true);
  assert.equal(multiProbe.edges[4].warning,true,
    "Fifth repeated side must show explicit congestion warning");
  assert.equal(multiProbe.radius,"22");
  assert.equal(multiProbe.hit,true,"Congestion warning must not obstruct 44px handle");
  assert.ok(multiProbe.fifthWorldX>multiProbe.firstWorldX+58);
  const fifthOld=multiProbe.edges[4].d;
  await u.send("Input.dispatchMouseEvent",{type:"mouseMoved",x:multiProbe.x,y:multiProbe.y});
  await u.send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,
    x:multiProbe.x,y:multiProbe.y});
  await u.send("Input.dispatchMouseEvent",{type:"mouseMoved",button:"left",
    x:multiProbe.x+33,y:multiProbe.y-10});
  const fifthPreview=await u.eval("(()=>{\n const id=__LAST__;\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")\n   ?.getAttribute(\"d\");\n})()".replace("__LAST__",JSON.stringify(multiIds[4])));
  assert.notEqual(fifthPreview,fifthOld,"Fifth congested loop must remain editable");
  await u.send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",
    x:multiProbe.x+33,y:multiProbe.y-10});
  const fifthCommit=await u.eval("(()=>{\n const id=__LAST__;\n return document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")\n   ?.getAttribute(\"d\");\n})()".replace("__LAST__",JSON.stringify(multiIds[4])));
  assert.notEqual(fifthCommit,fifthOld);
  assert.equal(store.getVersion(target),7,"B8h local edit cannot auto-save");
  v=await tab("V","multi-loop-viewer");
  await until(v,"Ready.");
  const multiViewer=await v.eval("(()=>{\n const ids=__IDS__;\n return {paths:ids.map(id=>document.querySelector(\n    \"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\")?.getAttribute(\"d\")),\n   controls:document.querySelectorAll(\"[data-eidos-diagram-waypoint-controls]\").length,\n   save:[...document.querySelectorAll(\"[data-eidos-diagram-toolbar] button\")]\n      .some(b=>b.textContent.trim()===\"Save projection\")};\n})()".replace("__IDS__",JSON.stringify(multiIds)));
  assert.deepEqual(multiViewer.paths,multiProbe.edges.map(e=>e.d),
    "Readonly Viewer remains equal to the pre-edit, UNSAVED test source");
  assert.equal(multiViewer.controls,0);
  assert.equal(multiViewer.save,false);
  w=await tab("W","all-blocked-loop");
  await until(w,"Ready.");
  const allCrowded=await w.eval("(()=>{\n const ids=__IDS__;\n return ids.map(id=>{\n   const visual=document.querySelector(\"[data-eidos-diagram-edge-visual=\"+CSS.escape(id)+\"]\");\n   const hit=document.querySelector(\"[data-eidos-diagram-edge=\"+CSS.escape(id)+\"]\");\n   const warning=document.querySelector(\"[data-eidos-diagram-congestion-warning=\"+CSS.escape(id)+\"]\");\n   if(!visual||!hit)throw Error(\"B8h crowded edge missing \"+id);\n   return {d:visual.getAttribute(\"d\"),\n     congested:hit.getAttribute(\"data-eidos-diagram-route-congested\")===\"true\",\n     aria:hit.getAttribute(\"aria-label\"),\n     warning:!!warning,warningPointer:warning?.style.pointerEvents};\n });\n})()".replace("__IDS__",JSON.stringify(multiIds)));
  assert.ok(allCrowded.every(e=>e.congested&&e.warning),
    "Four-sided node congestion must never be reported as clear");
  assert.ok(allCrowded.every(e=>e.aria?.includes("congested")
    && e.warningPointer==="none"),"Congestion must be accessible and nonblocking");
  assert.equal(store.getVersion(target),7,
    "Read-only Viewer and all-sides congestion must not write projection");
  assert.equal(repository.listHistory({
    enterpriseId: target.enterpriseId, definitionId: target.definitionId
  }).length, 1);
  console.log("DIAGRAM_BROWSER_CAS_PROOF=" + JSON.stringify({
    browser: version.Browser, tabs: 23,
    b8hMultiLoopCongestionNativePointerViewer: true,
    b8gNativeBlockedSideSaveReadViewer: true,
    b8fSelfLoopCurveNativeDragSaveViewer: true,
    b8eRoundedMultiRankCancelRegrabSaveViewer: true,
    b8dNativeDenseOverlapCycleAndUndo: true,
    b8cNativeShiftOverlapSegmentUndo: true, b8cNativeTouchCancelRegrab: true,
    b8bSaveReloadRealViewerRoundtrip: true,
    autoSegmentDragCancelConvertUndo: true, nativeRouteHandleSnapAndUndo: true,
    nativeOrthogonalSegmentSnapAndUndo: true,
    nativeGridSnapCancelled: true,
    independentGridModes: true, groupAlignmentUndo: true,
    staleWriteBlocked: true,
    draftPreserved: true, savedAsNewProjection: true,
    transientFailurePreservesDraft: true, retrySaved: true,
    businessHistoryUnchanged: true
  }));
} finally {
  a?.close(); b?.close(); c?.close(); d?.close(); e?.close(); f?.close(); g?.close(); h?.close(); i?.close(); j?.close(); k?.close(); l?.close(); m?.close(); n?.close(); o?.close(); p?.close(); q?.close(); r?.close(); sTab?.close(); t?.close(); u?.close(); v?.close(); w?.close();
  if (proc && proc.exitCode === null) {
    const exited = once(proc, "exit");
    proc.kill("SIGTERM");
    await Promise.race([exited, sleep(3000)]);
    if (proc.exitCode === null) proc.kill("SIGKILL");
  }
  server.closeAllConnections?.(); server.close();
  try {
    for (const dir of profiles) {
      rmSync(dir, { recursive: true, force: true, maxRetries: 12, retryDelay: 150 });
    }
  } catch (error) {
    // Chrome may leave a short-lived crashpad/utility worker writing to its
    // disposable, unique profile even after the browser process exits. Runner
    // teardown owns this temp directory; never hide browser assertion errors.
    if (error?.code !== "ENOTEMPTY" && error?.code !== "EBUSY") throw error;
    console.warn("Deferred Chromium temporary profile cleanup: " + error.code);
  }
}
