#!/usr/bin/env node
/**
 * TR-01A6: real running Host(s) + pinned EVO PostgreSQL + Eidos Chrome proof.
 * Every access is through HTTP, feature installation, Host policy and Context.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const humanHost = (process.env.APP_PLATFORM_BASE_URL ?? "http://127.0.0.1:4100").replace(/\/$/u,"");
const agentHost = (process.env.APP_PLATFORM_AGENT_PROOF_BASE_URL ?? "http://127.0.0.1:4101").replace(/\/$/u,"");
const evo = (process.env.EVO_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/u,"");
const contextId = process.env.APP_PLATFORM_PROOF_CONTEXT_ID ?? "enterprise:browser-proof";
const browser = process.env.CHROME;
if (!browser) throw Error("CHROME_REQUIRED");

const refs = {
  orderNo: "TR01-PO-001",
  supplierCounterpartyId: "cp-tr01-supplier",
  itemId: "item-tr01",
  warehouseId: "warehouse-tr01"
};
const names = {
  entry: "trading-reference.purchase-operations.entry.open",
  read: "trading-reference.purchase-operations.read"
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(base, path, { method = "GET", body, ...other } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      accept: "application/json",
      "x-evo-context-id": contextId,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(other.headers ?? {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error("INVALID_JSON:" + path + ":" + response.status);
  }
  return { status: response.status, body: result };
}
function action(code, values = {}) {
  return {
    contractVersion: "0.1.0", type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "tr01-a6-actual-installed-host",
    actionId: "read",
    requiresConfirmation: false
  };
}
async function execute(base, code, values = {}) {
  const result = await request(base, "/v1/actions", {
    method: "POST", body: action(code, values)
  });
  assert.equal(result.status, 200, JSON.stringify(result));
  return result.body;
}
async function install(base, packageId) {
  const result = await request(base, "/v1/install", {
    method: "POST", body: { packageId }
  });
  assert.equal(result.status, 200, JSON.stringify(result));
  assert.ok(result.body.snapshot?.installedPackages?.some(x => x.packageId === packageId));
}
async function getPage(base, source, route) {
  const params = new URLSearchParams({ source });
  if (route) params.set("route", route);
  return request(base, "/v1/experience-pages?" + params.toString());
}
async function waitJson(url, timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await fetch(url);
      if (result.ok) return result.json();
    } catch {}
    await delay(100);
  }
  throw Error("TR01_BROWSER_CHROME_NOT_READY:" + url);
}
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 1;
    this.pending = new Map();
  }
  async open() {
    if (this.ws.readyState !== WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        this.ws.addEventListener("open", resolve, { once: true });
        this.ws.addEventListener("error", reject, { once: true });
      });
    }
    this.ws.addEventListener("message", event => {
      const msg = JSON.parse(String(event.data));
      if (!msg.id) return;
      const callback = this.pending.get(msg.id);
      if (!callback) return;
      this.pending.delete(msg.id);
      if (msg.error) callback.reject(Error(msg.error.message));
      else callback.resolve(msg.result);
    });
  }
  send(method, params={}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve,reject) => this.pending.set(id, {resolve,reject}));
  }
  close() { this.ws.close(); }
}
async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression, awaitPromise:true, returnByValue:true
  });
  if (result.exceptionDetails) {
    throw Error("TR01_BROWSER_EVALUATION_FAILED:" + result.exceptionDetails.text);
  }
  return result.result?.value;
}
async function waitFor(cdp, expression, ms=25_000) {
  const start=Date.now();
  while(Date.now()-start < ms) {
    if(await evaluate(cdp,expression)) return;
    await delay(150);
  }
  const diag=await evaluate(cdp, "({url:location.href,text:document.body?.innerText?.slice(0,1600)})");
  throw Error("TR01_BROWSER_WAIT_TIMEOUT:"+expression+" "+JSON.stringify(diag));
}

const enterprise = await request(evo, "/api/v1/enterprises/EVO_DEMO");
assert.equal(enterprise.status, 200, JSON.stringify(enterprise));
assert.equal(enterprise.body.status, "ACTIVE");
const evoEnterpriseId = enterprise.body.id;
const contexts = await request(humanHost, "/v1/contexts/effective");
assert.equal(contexts.status, 200);
assert.ok(contexts.body.availableContexts?.some(x => x.contextId === contextId));
const before = await getPage(humanHost,
  "app://evo-trading-reference/pages/purchase-lookup");
assert.notEqual(before.status, 200, "Uninstalled purchase page must not be exposed");
const prior = await execute(humanHost, names.read, refs);
assert.equal(prior.ok, false, "Uninstalled purchase capability must be unavailable");

for (const base of [humanHost, agentHost]) {
  await install(base, "evo-trading-reference");
}
await install(humanHost, "evo-bi-workbench");

const workbench = await getPage(humanHost,
  "app://evo-bi-workbench/pages/workspace-home");
assert.equal(workbench.status, 200, JSON.stringify(workbench));
const home = workbench.body;
assert.equal(home.kind, "catalog-browser");
const entry = home.items.find(x => x.id ===
  "evo-trading-reference.workbench.purchase-lookup");
assert.ok(entry, "Installed authorized Workbench item missing");
assert.equal(entry.primaryAction.command, "workbench.item.open");

const lookup = await getPage(humanHost,
  "app://evo-trading-reference/pages/purchase-lookup");
assert.equal(lookup.status, 200, JSON.stringify(lookup));
assert.equal(lookup.body.command.code, names.read);

const human = await execute(humanHost, names.read, refs);
const ai = await execute(agentHost, names.read, refs);
assert.equal(human.ok, true, JSON.stringify(human));
assert.equal(ai.ok, true, JSON.stringify(ai));
assert.deepEqual(ai.result, human.result, "Human and AI should see same authorized EVO projection");
assert.equal(human.result.enterpriseId, evoEnterpriseId);
assert.equal(human.result.orderNo, refs.orderNo);
assert.equal(human.result.pendingPurchaseQuantity, 10);
assert.equal(human.result.inventoryPosition.quantity, 0);
assert.equal(human.result.inventoryPosition.amount, 0);
assert.equal(human.result.payableAmount, 125);
assert.equal(human.result.openWork.receive.quantity, 10);
assert.equal(human.result.openWork.pay.amount, 125);

const detail = await getPage(humanHost,
  "app://evo-trading-reference/pages/purchase-position",
  human.result.navigateTo);
assert.equal(detail.status, 200, JSON.stringify(detail));
assert.equal(detail.body.kind, "catalog-browser");
assert.equal(detail.body.items.length, 3);
assert.equal(detail.body.items[1].metadata["Inventory quantity"], 0);
assert.equal(detail.body.items[2].metadata["Payable amount"], 125);

const forbidden = await execute(humanHost, names.read, {
  ...refs, orderNo: "PO-FORBIDDEN"
});
assert.equal(forbidden.ok, false, "Restricted PO cannot be read");
const forbiddenDetail = await getPage(humanHost,
  "app://evo-trading-reference/pages/purchase-position",
  human.result.navigateTo.replace("TR01-PO-001", "PO-FORBIDDEN"));
assert.notEqual(forbiddenDetail.status, 200,
  "Deep link cannot bypass scoped purchase read policy");

const port = Number(process.env.TR01_CHROME_DEBUG_PORT ?? "9236");
const processChrome = spawn(browser, [
  "--headless=new", "--no-sandbox", "--disable-gpu",
  "--disable-dev-shm-usage", "--disable-background-networking",
  "--disable-component-update",
  "--user-data-dir=/tmp/tr01-browser-proof-"+process.pid,
  "--remote-debugging-port="+port,
  "about:blank"
], { stdio: ["ignore","ignore","inherit"] });
let cdp;
try {
  const list = await waitJson("http://127.0.0.1:"+port+"/json/list");
  const target = list.find(x => x.type === "page");
  assert.ok(target?.webSocketDebuggerUrl);
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `if (location.origin === ${JSON.stringify(humanHost)}) {
      localStorage.setItem("evo.context.id", ${JSON.stringify(contextId)});
      localStorage.setItem("evo.locale", "en");
    }`
  });
  await cdp.send("Page.navigate", { url: humanHost+"/?surface=desktop#/workspace" });
  await waitFor(cdp, `Boolean(document.querySelector(
    'article[data-eidos-catalog-item="evo-trading-reference.workbench.purchase-lookup"]'))`);
  const opened = await evaluate(cdp, `(() => {
    const row=document.querySelector(
      'article[data-eidos-catalog-item="evo-trading-reference.workbench.purchase-lookup"]');
    const button=row?.querySelector('button[data-eidos-command="workbench.item.open"]');
    if(!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(opened, true, "Workbench item must be clickable");
  await waitFor(cdp, `Boolean(document.querySelector(
    'form[data-eidos-id] input[name="orderNo"]'))`);
  const submitted = await evaluate(cdp, `(() => {
    const form=document.querySelector('form[data-eidos-id]');
    if(!form)return false;
    const refs=${JSON.stringify(refs)};
    for(const [key,value] of Object.entries(refs)) {
      const input=form.elements.namedItem(key);
      if(!input)return false;
      input.value=value;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      input.dispatchEvent(new Event("change",{bubbles:true}));
    }
    form.requestSubmit();
    return true;
  })()`);
  assert.equal(submitted, true, "Browser lookup form must submit");
  await waitFor(cdp, `Boolean(document.querySelector(
    '[data-eidos-id="trading-reference.purchase-operational-position"]'))`,30_000);
  const view = await evaluate(cdp, `(() => {
    const root=document.querySelector(
      '[data-eidos-id="trading-reference.purchase-operational-position"]');
    return {text:root?.textContent??"",rows:root?.querySelectorAll(
      'article[data-eidos-catalog-item]')?.length??0,url:location.href};
  })()`);
  assert.equal(view.rows, 3, JSON.stringify(view));
  assert.ok(view.text.includes("125"), JSON.stringify(view));
  assert.ok(view.text.includes("Inventory"), JSON.stringify(view));

  console.log("TR01A6_INSTALLED_HUMAN_AGENT_WORKBENCH_EVO_PROOF="+JSON.stringify({
    status:"PASS",
    evoEnterpriseId, contextId,
    purchasePackageInstalled:true,
    biWorkbenchInstalled:true,
    workbenchEntryAuthorized:true,
    browserWorkbenchToLookupToDetail:true,
    liveEvoWorkAndLedger:true,
    humanAgentParity:true,
    unauthorizedOrderRejected:true,
    unauthorizedDetailRouteRejected:true,
    viewRows:view.rows,
    pendingQuantity:human.result.pendingPurchaseQuantity,
    inventory:human.result.inventoryPosition,
    payable:human.result.payableAmount
  }));
} finally {
  cdp?.close();
  processChrome.kill("SIGTERM");
  await delay(100);
  if(!processChrome.killed) processChrome.kill("SIGKILL");
}
