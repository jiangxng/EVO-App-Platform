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
    return () => this.listeners.set(
      method,
      (this.listeners.get(method) ?? []).filter(item => item !== listener)
    );
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

const headers = await fetch(host + "/");
const html = await headers.text();
const assetRevision = html.match(
  /\/assets\/([^/]+)\/manager\/app-host-client\.js/
)?.[1];
const cssPath = html.match(
  /href="([^"]*\/manager\/app-host-shell\.css)"/
)?.[1];
if (!assetRevision || !cssPath) {
  throw new Error("Versioned shell assets not found");
}

const requiredHeaders = {
  "content-security-policy": value =>
    value.includes("default-src 'self'")
      && value.includes("script-src 'self'")
      && value.includes("frame-ancestors 'none'")
      && value.includes("object-src 'none'"),
  "x-content-type-options": value => value === "nosniff",
  "x-frame-options": value => value === "DENY",
  "referrer-policy": value => value === "strict-origin-when-cross-origin",
  "permissions-policy": value =>
    value.includes("camera=()")
      && value.includes("microphone=()")
      && value.includes("geolocation=()"),
  "cross-origin-resource-policy": value => value === "same-origin"
};

const observedHeaders = {};
for (const [name, check] of Object.entries(requiredHeaders)) {
  const value = headers.headers.get(name) ?? "";
  observedHeaders[name] = value;
  if (!check(value)) throw new Error("Invalid security header " + name + ": " + value);
}

const css = await fetch(host + cssPath);
const cssText = await css.text();
if (
  css.headers.get("cache-control")
  !== "public, max-age=31536000, immutable"
) {
  throw new Error("Shell CSS is not immutable");
}
if (!css.headers.get("etag")) throw new Error("Shell CSS has no ETag");
if (!cssText.includes("--eidos-space-xs:4px")) {
  throw new Error("Shell CSS is not the Eidos Productive Workbench stylesheet");
}

const css304 = await fetch(host + cssPath, {
  headers: { "if-none-match": css.headers.get("etag") }
});
if (css304.status !== 304) throw new Error("Shell CSS conditional request did not return 304");

const profile = "/tmp/evo-web-security-" + process.pid;
const proc = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-background-networking",
  "--disable-component-update",
  "--user-data-dir=" + profile,
  "--remote-debugging-port=9251",
  "about:blank"
], { stdio: ["ignore", "ignore", "inherit"] });

try {
  const pages = await waitJson("http://127.0.0.1:9251/json/list");
  const page = pages.find(item => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No page target");

  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.open();
  await client.send("Network.enable");
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });

  const violations = [];
  client.on("Runtime.consoleAPICalled", params => {
    const text = (params.args ?? [])
      .map(item => item.value ?? item.description ?? "")
      .join(" ");
    if (/content security policy|refused to/i.test(text)) violations.push(text);
  });

  const responses = new Map();
  const finished = new Map();
  client.on("Network.responseReceived", params => {
    responses.set(params.requestId, params.response);
  });
  client.on("Network.loadingFinished", params => {
    finished.set(params.requestId, params.encodedDataLength ?? 0);
  });

  await client.send("Page.navigate", {
    url: host + "/#/operating-graph/observe"
  });
  await waitFor(
    client,
    "Boolean(document.querySelector('[data-eidos-entity-inspector]'))",
    15000
  );
  await delay(800);

  const dom = await evaluate(
    client,
    "(() => ({"
      + "shellCss:Array.from(document.styleSheets).some(x=>x.href?.includes('/manager/app-host-shell.css')), "
      + "mobileRead:Boolean(document.querySelector('[data-evo-mobile-read-runtime]')), "
      + "inspector:Boolean(document.querySelector('[data-eidos-entity-inspector]')), "
      + "bodyText:document.body.innerText.length"
      + "}))()"
  );

  const shellAssetStats = [];
  for (const [requestId, response] of responses) {
    const url = response.url;
    if (
      !url.includes("/manager/app-host-shell.css")
      && !url.includes("/manager/app-host-client.js")
    ) continue;
    shellAssetStats.push({
      path: new URL(url).pathname,
      encodedBytes: finished.get(requestId) ?? 0,
      fromDiskCache: response.fromDiskCache === true
    });
  }

  if (!dom.shellCss || !dom.mobileRead || !dom.inspector || dom.bodyText < 1) {
    throw new Error("Application did not render correctly under CSP");
  }
  if (violations.length) {
    throw new Error("CSP console violation: " + violations.join(" | "));
  }

  client.close();

  console.log("WEB_SECURITY_DELIVERY_PROOF=" + JSON.stringify({
    assetRevision,
    shell: {
      bodyBytes: new TextEncoder().encode(html).length,
      cacheControl: headers.headers.get("cache-control"),
      etag: Boolean(headers.headers.get("etag")),
      hasInlineStyleTag: /<style\b/i.test(html),
      cssPath
    },
    css: {
      bodyBytes: new TextEncoder().encode(cssText).length,
      cacheControl: css.headers.get("cache-control"),
      etag: Boolean(css.headers.get("etag")),
      conditionalStatus: css304.status
    },
    securityHeaders: observedHeaders,
    chrome: {
      renderedUnderCsp: true,
      cspViolations: violations.length,
      shellAssets: shellAssetStats
    }
  }, null, 2));
} finally {
  proc.kill("SIGTERM");
  await delay(150);
  if (!proc.killed) proc.kill("SIGKILL");
}
