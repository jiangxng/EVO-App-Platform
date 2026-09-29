#!/usr/bin/env node
import { spawn } from "node:child_process";

const host = process.env.HOST ?? "https://ledger-configurator-production.up.railway.app";
const chrome = process.env.CHROME;
if (!chrome) throw new Error("CHROME is required");

const scenarios = [
  {
    id: "mobile",
    url: host + "/#/enterprise-agent",
    width: 390,
    require: [
      "/manager/mobile-task-runtime.js"
    ],
    forbid: [
      "/manager/desktop-workbench-runtime.js",
      "/vendor/eidos/src/workbench/",
      "/vendor/eidos/src/diagram/",
      "/vendor/eidos/src/spatial/"
    ]
  },
  {
    id: "desktop",
    url: host + "/?surface=desktop#/enterprise-agent",
    width: 390,
    require: [
      "/manager/desktop-workbench-runtime.js",
      "/vendor/eidos/src/workbench/"
    ],
    forbid: [
      "/manager/mobile-task-runtime.js"
    ]
  },
  {
    id: "handoff",
    url: host + "/#/enterprise-agent/setup",
    width: 390,
    require: [],
    forbid: [
      "/manager/mobile-task-runtime.js",
      "/manager/desktop-workbench-runtime.js",
      "/vendor/eidos/src/workbench/",
      "/vendor/eidos/src/diagram/",
      "/vendor/eidos/src/spatial/",
      "/v1/events"
    ]
  }
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitJson(url, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome may still be starting.
    }
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
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
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
      const listeners = this.listeners.get(message.method) ?? [];
      for (const listener of listeners) listener(message.params ?? {});
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
      const current = this.listeners.get(method) ?? [];
      this.listeners.set(method, current.filter(item => item !== listener));
    };
  }

  close() {
    this.ws.close();
  }
}

function jsAsset(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(host).origin
      && parsed.pathname.startsWith("/assets/")
      && parsed.pathname.endsWith(".js");
  } catch {
    return false;
  }
}

async function collectNavigation(client, url, width, reload = false) {
  const responses = new Map();
  const finished = new Map();
  const urls = new Set();

  const offResponse = client.on("Network.responseReceived", params => {
    responses.set(params.requestId, params.response);
    urls.add(params.response.url);
  });
  const offFinished = client.on("Network.loadingFinished", params => {
    finished.set(params.requestId, params.encodedDataLength ?? 0);
  });

  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 844,
    deviceScaleFactor: 1,
    mobile: width < 768
  });

  let loadResolve;
  const loaded = new Promise(resolve => {
    loadResolve = resolve;
  });
  const offLoad = client.on("Page.loadEventFired", () => loadResolve());

  if (reload) await client.send("Page.reload", { ignoreCache: false });
  else await client.send("Page.navigate", { url });

  await Promise.race([
    loaded,
    delay(12_000).then(() => {
      throw new Error("Page load timed out for " + url);
    })
  ]);
  await delay(1500);

  offResponse();
  offFinished();
  offLoad();

  const assets = [];
  let encodedJsBytes = 0;
  let cacheHits = 0;

  for (const [requestId, response] of responses) {
    if (!jsAsset(response.url)) continue;
    const encoded = finished.get(requestId) ?? 0;
    encodedJsBytes += encoded;
    const fromCache = response.fromDiskCache === true
      || response.fromPrefetchCache === true
      || response.fromServiceWorker === true
      || encoded === 0;
    if (fromCache) cacheHits += 1;
    assets.push({
      url: response.url,
      encodedDataLength: encoded,
      fromCache
    });
  }

  assets.sort((a, b) => a.url.localeCompare(b.url));
  return {
    urls: [...urls].sort(),
    assets,
    encodedJsBytes,
    cacheHits
  };
}

async function runScenario(scenario, port) {
  const profile = "/tmp/evo-cdp-" + scenario.id + "-" + process.pid;
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
    if (!page?.webSocketDebuggerUrl) {
      throw new Error("No Chrome page target available");
    }

    const client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    await client.send("Network.enable");
    await client.send("Page.enable");

    const cold = await collectNavigation(
      client,
      scenario.url,
      scenario.width,
      false
    );
    const warm = await collectNavigation(
      client,
      scenario.url,
      scenario.width,
      true
    );

    const allUrls = cold.urls.join("\n");
    for (const required of scenario.require) {
      if (!allUrls.includes(required)) {
        throw new Error(
          scenario.id + " did not request required resource " + required
        );
      }
    }
    for (const forbidden of scenario.forbid) {
      if (allUrls.includes(forbidden)) {
        throw new Error(
          scenario.id + " unexpectedly requested " + forbidden
        );
      }
    }

    client.close();
    return {
      id: scenario.id,
      url: scenario.url,
      cold: {
        encodedJsBytes: cold.encodedJsBytes,
        jsRequests: cold.assets.length,
        cacheHits: cold.cacheHits,
        assets: cold.assets
      },
      warm: {
        encodedJsBytes: warm.encodedJsBytes,
        jsRequests: warm.assets.length,
        cacheHits: warm.cacheHits,
        assets: warm.assets
      }
    };
  } finally {
    proc.kill("SIGTERM");
    await delay(150);
    if (!proc.killed) proc.kill("SIGKILL");
  }
}

const results = [];
for (let index = 0; index < scenarios.length; index += 1) {
  results.push(await runScenario(scenarios[index], 9222 + index));
}

const mobile = results.find(item => item.id === "mobile");
const desktop = results.find(item => item.id === "desktop");
const handoff = results.find(item => item.id === "handoff");

if (!mobile || !desktop || !handoff) {
  throw new Error("Missing Surface proof scenario");
}

if (mobile.cold.encodedJsBytes >= desktop.cold.encodedJsBytes) {
  throw new Error(
    "MOBILE_TASK JavaScript transfer must be lower than DESKTOP_WORKBENCH"
  );
}

console.log("SURFACE_LOADING_PROOF=" + JSON.stringify({
  mobile: {
    coldJsBytes: mobile.cold.encodedJsBytes,
    warmJsBytes: mobile.warm.encodedJsBytes,
    coldJsRequests: mobile.cold.jsRequests,
    warmJsRequests: mobile.warm.jsRequests,
    requestedMobileRuntime: mobile.cold.assets.some(item =>
      item.url.includes("/manager/mobile-task-runtime.js")
    ),
    requestedDesktopRuntime: mobile.cold.assets.some(item =>
      item.url.includes("/manager/desktop-workbench-runtime.js")
    )
  },
  desktop: {
    coldJsBytes: desktop.cold.encodedJsBytes,
    warmJsBytes: desktop.warm.encodedJsBytes,
    coldJsRequests: desktop.cold.jsRequests,
    warmJsRequests: desktop.warm.jsRequests,
    requestedDesktopRuntime: desktop.cold.assets.some(item =>
      item.url.includes("/manager/desktop-workbench-runtime.js")
    )
  },
  handoff: {
    coldJsBytes: handoff.cold.encodedJsBytes,
    warmJsBytes: handoff.warm.encodedJsBytes,
    coldJsRequests: handoff.cold.jsRequests,
    warmJsRequests: handoff.warm.jsRequests,
    requestedSurfaceRuntime:
      handoff.cold.assets.some(item =>
        item.url.includes("/manager/mobile-task-runtime.js")
        || item.url.includes("/manager/desktop-workbench-runtime.js")
      )
  }
}, null, 2));
