#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  evaluateWebSurfaceBudgetV010
} from "../dist/manager/web-performance-budgets.js";

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
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
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

async function diagnostics() {
  const response = await fetch(host + "/v1/web-delivery/diagnostics");
  if (!response.ok) {
    throw new Error("WEB_DELIVERY_DIAGNOSTICS_HTTP_" + response.status);
  }
  return response.json();
}

async function runScenario(scenario, port) {
  const profile = "/tmp/evo-rum-" + scenario.id + "-" + process.pid;
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
    await client.send("Page.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: scenario.width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: scenario.width < 768
    });

    await client.send("Page.navigate", { url: scenario.url });
    await waitFor(
      client,
      "Boolean(document.documentElement.dataset.evoPageViewId)",
      15000
    );
    await waitFor(client, scenario.ready, 15000);
    const pageViewId = await evaluate(
      client,
      "document.documentElement.dataset.evoPageViewId"
    );

    // Reporter flushes once after 5s. Leave headroom for CI scheduling.
    await delay(6500);

    const after = await diagnostics();
    const matching = (after.performance?.recent ?? [])
      .filter(item => item.pageViewId === pageViewId);

    if (matching.length !== 1) {
      throw new Error(
        scenario.id + " expected exactly one RUM sample for " + pageViewId
        + ", got " + matching.length
      );
    }

    const sample = matching[0];
    if (sample.surfaceTarget !== scenario.surface) {
      throw new Error(
        scenario.id + " RUM surface mismatch: " + sample.surfaceTarget
      );
    }

    const violations = evaluateWebSurfaceBudgetV010(
      scenario.surface,
      {
        coldJsBytes: sample.jsTransferBytes,
        firstContentfulPaintMs: sample.firstContentfulPaintMs,
        largestContentfulPaintMs: sample.largestContentfulPaintMs,
        longTaskTotalMs: sample.longTaskTotalMs
      }
    );
    if (violations.length) {
      throw new Error(
        scenario.id + " performance budget violation: "
        + JSON.stringify(violations)
      );
    }

    client.close();
    return {
      id: scenario.id,
      pageViewId,
      surface: sample.surfaceTarget,
      clientRevision: sample.clientRevision,
      hostRevision: sample.hostRevision,
      navigationType: sample.navigationType,
      navigationDurationMs: sample.navigationDurationMs,
      firstContentfulPaintMs: sample.firstContentfulPaintMs,
      largestContentfulPaintMs: sample.largestContentfulPaintMs,
      longTaskCount: sample.longTaskCount,
      longTaskTotalMs: sample.longTaskTotalMs,
      resourceCount: sample.resourceCount,
      transferBytes: sample.transferBytes,
      jsTransferBytes: sample.jsTransferBytes,
      cssTransferBytes: sample.cssTransferBytes,
      apiTransferBytes: sample.apiTransferBytes,
      cachedResourceCount: sample.cachedResourceCount
    };
  } finally {
    proc.kill("SIGTERM");
    await delay(150);
    if (!proc.killed) proc.kill("SIGKILL");
  }
}

const scenarios = [
  {
    id: "mobile-task",
    surface: "MOBILE_TASK",
    width: 390,
    url: host + "/?rum=1#/enterprise-agent",
    ready: "Boolean(document.querySelector('[data-evo-mobile-task-runtime]'))"
  },
  {
    id: "mobile-read",
    surface: "MOBILE_READ",
    width: 390,
    url: host + "/?rum=1#/operating-graph/observe",
    ready: "Boolean(document.querySelector('[data-evo-mobile-read-runtime]'))"
  },
  {
    id: "desktop",
    surface: "DESKTOP_WORKBENCH",
    width: 1366,
    url: host + "/?rum=1&surface=desktop#/enterprise-agent",
    ready: "Boolean(document.querySelector('[data-eidos-app-host-layout=workbench]'))"
  },
  {
    id: "handoff",
    surface: "HANDOFF",
    width: 390,
    url: host + "/?rum=1#/enterprise-agent/setup",
    ready: "Boolean(document.querySelector('[data-eidos-surface-handoff]'))"
  }
];

const results = [];
for (let index = 0; index < scenarios.length; index += 1) {
  results.push(await runScenario(scenarios[index], 9340 + index));
}

console.log(
  "REAL_BROWSER_RUM_BUDGET_PROOF="
  + JSON.stringify({ scenarios: results }, null, 2)
);
