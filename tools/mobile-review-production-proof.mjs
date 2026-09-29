#!/usr/bin/env node
import { spawn } from "node:child_process";

const host = process.env.HOST ?? "https://ledger-configurator-production.up.railway.app";
const chrome = process.env.CHROME;
if (!chrome) throw new Error("CHROME is required");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready");
}

class CdpClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async open() {
    if (this.ws.readyState !== WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        this.ws.addEventListener("open", resolve, { once: true });
        this.ws.addEventListener("error", reject, { once: true });
      });
    }
    this.ws.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
  on(method, listener) {
    const list = this.listeners.get(method) ?? [];
    list.push(listener);
    this.listeners.set(method, list);
    return () => {
      this.listeners.set(
        method,
        (this.listeners.get(method) ?? []).filter(item => item !== listener)
      );
    };
  }
  close() { this.ws.close(); }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(client, expression)) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for " + expression);
}

function ownJs(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(host).origin
      && parsed.pathname.startsWith("/assets/")
      && parsed.pathname.endsWith(".js");
  } catch {
    return false;
  }
}

async function navigateAndMeasure(client, url, reload = false) {
  const responses = new Map();
  const finished = new Map();
  const offResponse = client.on("Network.responseReceived", params => {
    responses.set(params.requestId, params.response);
  });
  const offFinished = client.on("Network.loadingFinished", params => {
    finished.set(params.requestId, params.encodedDataLength ?? 0);
  });

  let resolveLoad;
  const loaded = new Promise(resolve => { resolveLoad = resolve; });
  const offLoad = client.on("Page.loadEventFired", () => resolveLoad());

  if (reload) await client.send("Page.reload", { ignoreCache: false });
  else await client.send("Page.navigate", { url });

  await Promise.race([
    loaded,
    delay(12000).then(() => { throw new Error("Page load timeout"); })
  ]);
  await waitFor(
    client,
    "Boolean(document.querySelector('[data-eidos-review-queue]'))",
    12000
  );
  await delay(700);

  offResponse();
  offFinished();
  offLoad();

  const assets = [];
  let encodedJsBytes = 0;
  for (const [requestId, response] of responses) {
    if (!ownJs(response.url)) continue;
    const encoded = finished.get(requestId) ?? 0;
    encodedJsBytes += encoded;
    assets.push({
      url: response.url,
      encoded,
      fromCache: response.fromDiskCache === true
        || response.fromPrefetchCache === true
        || response.fromServiceWorker === true
        || encoded === 0
    });
  }
  return { assets, encodedJsBytes };
}

async function runScenario(id, url, width, port) {
  const profile = "/tmp/evo-mobile-review-" + id + "-" + process.pid;
  const proc = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-component-update",
    "--user-data-dir=" + profile,
    "--remote-debugging-port=" + port,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "inherit"] });

  try {
    const pages = await waitJson("http://127.0.0.1:" + port + "/json/list");
    const page = pages.find(item => item.type === "page");
    if (!page?.webSocketDebuggerUrl) throw new Error("No page target");
    const client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    await client.send("Network.enable");
    await client.send("Page.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: width < 768
    });

    const cold = await navigateAndMeasure(client, url, false);
    const dom = await evaluate(client, "(() => ({hash:location.hash,mobile:Boolean(document.querySelector('[data-evo-mobile-review-queue]')),workbench:Boolean(document.querySelector('[data-eidos-app-host-layout="workbench"]')),reviewId:document.querySelector('[data-eidos-review-queue]')?.getAttribute('data-review-id')??null,empty:Boolean(document.querySelector('[data-eidos-review-empty]'))}))()");
    const warm = await navigateAndMeasure(client, url, true);
    client.close();

    return {
      id,
      dom,
      cold,
      warm
    };
  } finally {
    proc.kill("SIGTERM");
    await delay(150);
    if (!proc.killed) proc.kill("SIGKILL");
  }
}

const mobile = await runScenario(
  "mobile",
  host + "/#/enterprise-agent/memory",
  390,
  9251
);
const desktop = await runScenario(
  "desktop",
  host + "/?surface=desktop#/enterprise-agent/memory",
  390,
  9252
);

if (mobile.dom.hash !== "#/m/enterprise-agent/memory") {
  throw new Error("Compact route did not resolve to MOBILE_TASK Memory Review");
}
if (!mobile.dom.mobile || mobile.dom.workbench) {
  throw new Error("Mobile Memory Review did not use dedicated mobile runtime");
}
if (mobile.dom.reviewId !== "personal-agent.memory-review") {
  throw new Error("Mobile Memory Review did not render the real Review Queue");
}
if (!desktop.dom.workbench || desktop.dom.mobile) {
  throw new Error("Explicit desktop override did not retain Workbench");
}

const mobileUrls = mobile.cold.assets.map(item => item.url).join("\n");
for (const forbidden of [
  "/manager/desktop-workbench-runtime.js",
  "/vendor/eidos/src/workbench/",
  "/vendor/eidos/src/diagram/",
  "/vendor/eidos/src/spatial/"
]) {
  if (mobileUrls.includes(forbidden)) {
    throw new Error("Mobile Memory Review unexpectedly loaded " + forbidden);
  }
}
if (!mobileUrls.includes("/manager/mobile-task-runtime.js")) {
  throw new Error("Mobile Memory Review did not load mobile-task-runtime");
}
if (mobile.warm.encodedJsBytes !== 0 || desktop.warm.encodedJsBytes !== 0) {
  throw new Error("Warm immutable module graph transferred JS bytes");
}

console.log("MOBILE_REVIEW_PROOF=" + JSON.stringify({
  mobile: {
    route: mobile.dom.hash,
    reviewId: mobile.dom.reviewId,
    emptyQueue: mobile.dom.empty,
    coldJsBytes: mobile.cold.encodedJsBytes,
    coldJsRequests: mobile.cold.assets.length,
    warmJsBytes: mobile.warm.encodedJsBytes,
    requestedMobileRuntime: mobileUrls.includes("/manager/mobile-task-runtime.js"),
    requestedDesktopRuntime: mobileUrls.includes("/manager/desktop-workbench-runtime.js"),
    requestedWorkbench: mobileUrls.includes("/vendor/eidos/src/workbench/"),
    requestedDiagram: mobileUrls.includes("/vendor/eidos/src/diagram/"),
    requestedSpatial: mobileUrls.includes("/vendor/eidos/src/spatial/")
  },
  desktop: {
    route: desktop.dom.hash,
    reviewId: desktop.dom.reviewId,
    coldJsBytes: desktop.cold.encodedJsBytes,
    coldJsRequests: desktop.cold.assets.length,
    warmJsBytes: desktop.warm.encodedJsBytes,
    workbench: desktop.dom.workbench
  }
}, null, 2));
