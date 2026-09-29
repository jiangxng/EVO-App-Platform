#!/usr/bin/env node
import { spawn } from "node:child_process";

const host = process.env.HOST
  ?? "https://ledger-configurator-production.up.railway.app";
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
  close() {
    this.ws.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description
        ?? result.exceptionDetails.text
        ?? "Runtime.evaluate failed"
    );
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(client, expression)) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for " + expression);
}

function parsed(url) {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function ownJs(url) {
  const value = parsed(url);
  return Boolean(
    value
    && value.origin === new URL(host).origin
    && value.pathname.startsWith("/assets/")
    && value.pathname.endsWith(".js")
  );
}

function ownApi(url) {
  const value = parsed(url);
  return Boolean(
    value
    && value.origin === new URL(host).origin
    && value.pathname.startsWith("/v1/")
  );
}

async function navigateAndMeasure(
  client,
  url,
  readyExpression,
  reload = false
) {
  const requests = new Map();
  const responses = new Map();
  const finished = new Map();

  const offRequest = client.on("Network.requestWillBeSent", params => {
    requests.set(params.requestId, params.request);
  });
  const offResponse = client.on("Network.responseReceived", params => {
    responses.set(params.requestId, params.response);
  });
  const offFinished = client.on("Network.loadingFinished", params => {
    finished.set(params.requestId, params.encodedDataLength ?? 0);
  });

  let resolveLoad;
  const loaded = new Promise(resolve => { resolveLoad = resolve; });
  const offLoad = client.on("Page.loadEventFired", () => resolveLoad());

  if (reload) {
    await client.send("Page.reload", { ignoreCache: false });
  } else {
    await client.send("Page.navigate", { url });
  }

  await Promise.race([
    loaded,
    delay(15000).then(() => {
      throw new Error("Page load timeout");
    })
  ]);
  await waitFor(client, readyExpression, 15000);
  await delay(900);

  offRequest();
  offResponse();
  offFinished();
  offLoad();

  const assets = [];
  const api = [];
  let encodedJsBytes = 0;
  let apiBytes = 0;
  let actionRequests = 0;
  let actionBytes = 0;

  for (const [requestId, response] of responses) {
    const encoded = finished.get(requestId) ?? 0;
    if (ownJs(response.url)) {
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
    if (ownApi(response.url)) {
      const request = requests.get(requestId);
      const urlValue = new URL(response.url);
      apiBytes += encoded;
      if (
        urlValue.pathname === "/v1/actions"
        && request?.method === "POST"
      ) {
        actionRequests += 1;
        actionBytes += encoded;
      }
      api.push({
        path: urlValue.pathname,
        method: request?.method ?? "UNKNOWN",
        status: response.status,
        encoded
      });
    }
  }

  return {
    assets,
    api,
    encodedJsBytes,
    apiBytes,
    actionRequests,
    actionBytes
  };
}

async function runScenario(id, url, width, port, readyExpression) {
  const profile = "/tmp/evo-mobile-read-" + id + "-" + process.pid;
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
    const pages = await waitJson(
      "http://127.0.0.1:" + port + "/json/list"
    );
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

    const cold = await navigateAndMeasure(
      client,
      url,
      readyExpression,
      false
    );

    const dom = await evaluate(
      client,
      "(() => ({"
        + "hash:location.hash,"
        + "mobileRead:Boolean(document.querySelector('[data-evo-mobile-read-runtime]')),"
        + "workbench:Boolean(document.querySelector('[data-eidos-app-host-layout=workbench]')),"
        + "inspectorId:document.querySelector('[data-eidos-entity-inspector]')?.getAttribute('data-entity-inspector-id')??null,"
        + "freshnessStale:document.querySelector('[data-eidos-entity-freshness]')?.getAttribute('data-stale')??null,"
        + "itemCount:document.querySelectorAll('[data-eidos-entity-item]').length,"
        + "metricCount:document.querySelectorAll('[data-eidos-entity-metric]').length,"
        + "evidenceCount:document.querySelectorAll('[data-eidos-entity-evidence]').length,"
        + "buttonCount:document.querySelectorAll('[data-evo-mobile-read-runtime] button').length,"
        + "formCount:document.querySelectorAll('[data-evo-mobile-read-runtime] form').length,"
        + "resourceId:document.querySelector('[data-evo-mobile-read-runtime]')?.getAttribute('data-resource-id')??null"
        + "}))()"
    );

    const warm = await navigateAndMeasure(
      client,
      url,
      readyExpression,
      true
    );

    client.close();
    return { id, dom, cold, warm };
  } finally {
    proc.kill("SIGTERM");
    await delay(150);
    if (!proc.killed) proc.kill("SIGKILL");
  }
}

const mobile = await runScenario(
  "mobile",
  host + "/#/operating-graph/observe",
  390,
  9251,
  "Boolean(document.querySelector('[data-eidos-entity-inspector]'))"
);

const desktop = await runScenario(
  "desktop",
  host + "/?surface=desktop#/operating-graph/observe",
  390,
  9252,
  "Boolean(document.querySelector('[data-eidos-app-host-layout=workbench]'))"
);

if (mobile.dom.hash !== "#/m/operating-graph/observe") {
  throw new Error(
    "Compact Observatory route did not resolve to MOBILE_READ"
  );
}
if (!mobile.dom.mobileRead || mobile.dom.workbench) {
  throw new Error(
    "MOBILE_READ Observatory did not use the dedicated mobile read runtime"
  );
}
if (
  mobile.dom.inspectorId
  !== "evo-enterprise-operating-graph.observatory.mobile-read"
) {
  throw new Error("MOBILE_READ did not render the EOG Entity Inspector");
}
if (mobile.dom.resourceId !== "eog:primary") {
  throw new Error("MOBILE_READ did not bind the primary governed EOG resource");
}
if (mobile.dom.freshnessStale !== "false") {
  throw new Error(
    "MOBILE_READ Runtime Facts were not reported as current/provider-backed"
  );
}
if (mobile.dom.itemCount < 1) {
  throw new Error("MOBILE_READ rendered no real governed EOG entities");
}
if (mobile.dom.metricCount < 1 || mobile.dom.evidenceCount < 1) {
  throw new Error(
    "MOBILE_READ rendered entities without Runtime Fact/evidence projection"
  );
}
if (mobile.dom.buttonCount !== 0 || mobile.dom.formCount !== 0) {
  throw new Error("MOBILE_READ exposed a write-capable control");
}
if (!desktop.dom.workbench || desktop.dom.mobileRead) {
  throw new Error("Explicit desktop override did not retain Workbench");
}

const mobileUrls = mobile.cold.assets.map(item => item.url).join("\n");
for (const forbidden of [
  "/manager/mobile-task-runtime.js",
  "/manager/desktop-workbench-runtime.js",
  "/vendor/eidos/src/workbench/",
  "/vendor/eidos/src/diagram/",
  "/vendor/eidos/src/spatial/"
]) {
  if (mobileUrls.includes(forbidden)) {
    throw new Error("MOBILE_READ unexpectedly loaded " + forbidden);
  }
}
if (!mobileUrls.includes("/manager/mobile-read-runtime.js")) {
  throw new Error("MOBILE_READ did not load mobile-read-runtime");
}
if (mobile.warm.encodedJsBytes !== 0 || desktop.warm.encodedJsBytes !== 0) {
  throw new Error("Warm immutable module graph transferred JS bytes");
}
if (mobile.cold.actionRequests !== 1) {
  throw new Error(
    "MOBILE_READ should perform exactly one governed read action on cold load"
  );
}
if (mobile.cold.apiBytes >= desktop.cold.apiBytes) {
  throw new Error(
    "MOBILE_READ API/data payload is not smaller than desktop Observatory"
  );
}

console.log("EOG_MOBILE_READ_PROOF=" + JSON.stringify({
  mobile: {
    route: mobile.dom.hash,
    inspectorId: mobile.dom.inspectorId,
    resourceId: mobile.dom.resourceId,
    freshnessStale: mobile.dom.freshnessStale,
    itemCount: mobile.dom.itemCount,
    metricCount: mobile.dom.metricCount,
    evidenceCount: mobile.dom.evidenceCount,
    buttonCount: mobile.dom.buttonCount,
    formCount: mobile.dom.formCount,
    coldJsBytes: mobile.cold.encodedJsBytes,
    coldJsRequests: mobile.cold.assets.length,
    warmJsBytes: mobile.warm.encodedJsBytes,
    coldApiBytes: mobile.cold.apiBytes,
    coldActionRequests: mobile.cold.actionRequests,
    coldActionBytes: mobile.cold.actionBytes,
    warmApiBytes: mobile.warm.apiBytes,
    requestedMobileReadRuntime:
      mobileUrls.includes("/manager/mobile-read-runtime.js"),
    requestedMobileTaskRuntime:
      mobileUrls.includes("/manager/mobile-task-runtime.js"),
    requestedDesktopRuntime:
      mobileUrls.includes("/manager/desktop-workbench-runtime.js"),
    requestedWorkbench:
      mobileUrls.includes("/vendor/eidos/src/workbench/"),
    requestedDiagram:
      mobileUrls.includes("/vendor/eidos/src/diagram/"),
    requestedSpatial:
      mobileUrls.includes("/vendor/eidos/src/spatial/")
  },
  desktop: {
    route: desktop.dom.hash,
    coldJsBytes: desktop.cold.encodedJsBytes,
    coldJsRequests: desktop.cold.assets.length,
    warmJsBytes: desktop.warm.encodedJsBytes,
    coldApiBytes: desktop.cold.apiBytes,
    coldActionRequests: desktop.cold.actionRequests,
    coldActionBytes: desktop.cold.actionBytes,
    workbench: desktop.dom.workbench
  }
}, null, 2));
