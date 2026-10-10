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
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); return;
    }
    if (url.pathname === "/action" && req.method === "POST") {
      let data = "";
      for await (const chunk of req) data += chunk.toString();
      const request = JSON.parse(data);
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
let proc, a, b;
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
  async function tab(id) {
    const response = await fetch(api + "/json/new?" + encodeURIComponent(address + "/?session=" + id),
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
  assert.equal(repository.listHistory({
    enterpriseId: target.enterpriseId, definitionId: target.definitionId
  }).length, 1);
  console.log("DIAGRAM_BROWSER_CAS_PROOF=" + JSON.stringify({
    browser: version.Browser, tabs: 2, staleWriteBlocked: true,
    draftPreserved: true, savedAsNewProjection: true, businessHistoryUnchanged: true
  }));
} finally {
  a?.close(); b?.close();
  if (proc && proc.exitCode === null) {
    const exited = once(proc, "exit");
    proc.kill("SIGTERM");
    await Promise.race([exited, sleep(3000)]);
    if (proc.exitCode === null) proc.kill("SIGKILL");
  }
  server.closeAllConnections?.(); server.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 150 });
}
