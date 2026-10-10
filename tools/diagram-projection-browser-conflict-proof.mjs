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

const chrome = process.env.CHROME;
assert.ok(chrome, "CHROME must identify an installed Chromium executable");
const profile = mkdtempSync(join(tmpdir(), "evo-2d-browser-"));
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
    if (url.pathname === "/action" && req.method === "POST") {
      let data = "";
      for await (const chunk of req) data += chunk.toString();
      const request = JSON.parse(data);
      const tab = url.searchParams.get("session") ?? "A";
      if (request.values?.operation?.type === "SAVE_PROJECTION_VIEW"
        && transientFailures.delete(tab)) {
        res.writeHead(503); res.end("Injected transient network failure"); return;
      }
      const handler = handlers.find(h => h.commandCode === request.command?.code);
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
let proc, a, b, c, d;
try {
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = "http://127.0.0.1:" + server.address().port;
  proc = spawn(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--no-first-run", "--disable-background-networking",
    "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"
  ], { stdio: "ignore" });
  let debugPort;
  for (let n = 0; n < 150; n++) {
    if (existsSync(join(profile, "DevToolsActivePort"))) {
      debugPort = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]; break;
    }
    if (proc.exitCode !== null) throw Error("Chrome exited before DevTools opened");
    await sleep(100);
  }
  assert.ok(debugPort, "Chrome did not start DevTools");
  const api = "http://127.0.0.1:" + debugPort;
  const version = await (await fetch(api + "/json/version")).json();
  async function tab(id, route = false) {
    const response = await fetch(api + "/json/new?" + encodeURIComponent(
      address + (route ? "/route?session=" : "/?session=") + id),
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
    return client.eval(expression);
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
    + 'if(!h)throw Error("No unobstructed orthogonal segment handle, candidates="+handles.length);'
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

  assert.equal(repository.listHistory({
    enterpriseId: target.enterpriseId, definitionId: target.definitionId
  }).length, 1);
  console.log("DIAGRAM_BROWSER_CAS_PROOF=" + JSON.stringify({
    browser: version.Browser, tabs: 4, nativeRouteHandleSnapAndUndo: true,
    nativeOrthogonalSegmentSnapAndUndo: true,
    nativeGridSnapCancelled: true,
    independentGridModes: true, groupAlignmentUndo: true,
    staleWriteBlocked: true,
    draftPreserved: true, savedAsNewProjection: true,
    transientFailurePreservesDraft: true, retrySaved: true,
    businessHistoryUnchanged: true
  }));
} finally {
  a?.close(); b?.close(); c?.close(); d?.close();
  if (proc && proc.exitCode === null) {
    const exited = once(proc, "exit");
    proc.kill("SIGTERM");
    await Promise.race([exited, sleep(3000)]);
    if (proc.exitCode === null) proc.kill("SIGKILL");
  }
  server.closeAllConnections?.(); server.close();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 150 });
  } catch (error) {
    // Chrome may leave a short-lived crashpad/utility worker writing to its
    // disposable, unique profile even after the browser process exits. Runner
    // teardown owns this temp directory; never hide browser assertion errors.
    if (error?.code !== "ENOTEMPTY" && error?.code !== "EBUSY") throw error;
    console.warn("Deferred Chromium temporary profile cleanup: " + error.code);
  }
}
