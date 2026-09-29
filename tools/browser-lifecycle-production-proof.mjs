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

async function waitFor(client, expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.result?.value) return result.result.value;
    await delay(100);
  }
  throw new Error("Timed out waiting for: " + expression);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.text
      ?? result.exceptionDetails.exception?.description
      ?? "Runtime.evaluate failed"
    );
  }
  return result.result?.value;
}

const profile = "/tmp/evo-lifecycle-proof-" + process.pid;
const port = 9248;
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
  if (!page?.webSocketDebuggerUrl) throw new Error("No Chrome page target available");

  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.open();
  await client.send("Network.enable");
  await client.send("Page.enable");

  const requests = [];
  client.on("Network.requestWillBeSent", params => {
    requests.push({
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method
    });
  });

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await client.send("Page.navigate", {
    url: host + "/?surface=desktop#/enterprise-agent"
  });
  await waitFor(
    client,
    "Boolean(document.querySelector('[data-eidos-workspace-content]'))"
  );
  await delay(1200);

  const baselineActions = requests.filter(item =>
    item.method === "POST" && item.url.includes("/v1/actions")
  ).length;
  const baselineSse = requests.filter(item =>
    item.url.includes("/v1/events")
  ).length;

  const marker = "bfcache-" + Date.now();
  const installProof = "(() => {" +
    "const workspace=document.querySelector('[data-eidos-workspace-content]');" +
    "if(!workspace)return false;" +
    "workspace.setAttribute('data-lifecycle-proof'," + JSON.stringify(marker) + ");" +
    "window.__evoLifecycleProof={marker:" + JSON.stringify(marker) + ",pagehide:[],pageshow:[]};" +
    "window.addEventListener('pagehide',event=>window.__evoLifecycleProof.pagehide.push(Boolean(event.persisted)));" +
    "window.addEventListener('pageshow',event=>window.__evoLifecycleProof.pageshow.push(Boolean(event.persisted)));" +
    "return true;})()";
  if (!await evaluate(client, installProof)) throw new Error("Failed to install lifecycle proof");

  await client.send("Page.navigate", { url: host + "/health/ready" });
  await waitFor(client, "location.pathname === '/health/ready'");

  await evaluate(client, "history.back(); true");
  await waitFor(
    client,
    "location.hash === '#/enterprise-agent' && Boolean(window.__evoLifecycleProof)",
    12000
  );
  await delay(1500);

  const restored = await evaluate(client,
    "(() => ({marker:document.querySelector('[data-eidos-workspace-content]')?.getAttribute('data-lifecycle-proof')??null," +
    "proof:window.__evoLifecycleProof??null," +
    "networkState:document.documentElement.getAttribute('data-evo-network-state')}))()"
  );

  if (restored.marker !== marker) throw new Error("Workbench DOM marker was not preserved");
  if (!restored.proof?.pagehide?.includes(true)) {
    throw new Error("pagehide.persisted=true was not observed");
  }
  if (!restored.proof?.pageshow?.includes(true)) {
    throw new Error("pageshow.persisted=true was not observed");
  }

  const afterRestoreActions = requests.filter(item =>
    item.method === "POST" && item.url.includes("/v1/actions")
  ).length;
  const afterRestoreSse = requests.filter(item =>
    item.url.includes("/v1/events")
  ).length;

  if (afterRestoreActions !== baselineActions) {
    throw new Error("bfcache restore unexpectedly emitted /v1/actions");
  }
  if (afterRestoreSse <= baselineSse) {
    throw new Error("SSE connection did not resume after bfcache restore");
  }

  await client.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: "none"
  });
  await waitFor(
    client,
    "document.documentElement.getAttribute('data-evo-network-state') === 'offline'"
  );
  const offline = await evaluate(client,
    "(() => {const notice=document.querySelector('[data-evo-connectivity-notice]');" +
    "return {networkState:document.documentElement.getAttribute('data-evo-network-state')," +
    "noticeVisible:Boolean(notice&&!notice.hidden),text:notice?.textContent??''};})()"
  );
  if (!offline.noticeVisible || !offline.text.includes("may be stale")) {
    throw new Error("Offline freshness notice was not visible");
  }

  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
    connectionType: "wifi"
  });
  await waitFor(
    client,
    "document.documentElement.getAttribute('data-evo-network-state') === 'online'"
  );
  const onlineNoticeHidden = await evaluate(client,
    "(() => {const notice=document.querySelector('[data-evo-connectivity-notice]');return Boolean(notice?.hidden);})()"
  );
  if (!onlineNoticeHidden) throw new Error("Connectivity notice remained visible");

  console.log("BROWSER_LIFECYCLE_PROOF=" + JSON.stringify({
    bfcache: {
      domPreserved: true,
      pagehidePersisted: true,
      pageshowPersisted: true
    },
    network: {
      actionDelta: afterRestoreActions - baselineActions,
      sseConnectionsBeforeAway: baselineSse,
      sseConnectionsAfterRestore: afterRestoreSse
    },
    offline: {
      noticeVisible: offline.noticeVisible,
      networkState: offline.networkState,
      recoveredOnline: true
    }
  }, null, 2));

  client.close();
} finally {
  proc.kill("SIGTERM");
  await delay(150);
  if (!proc.killed) proc.kill("SIGKILL");
}
