#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const host = (process.env.APP_PLATFORM_BASE_URL ?? "http://127.0.0.1:4100").replace(/\/$/u, "");
const evo = (process.env.EVO_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/u, "");
const chrome = process.env.CHROME;
if (!chrome) throw new Error("CHROME is required");

const contextId = process.env.APP_PLATFORM_PROOF_CONTEXT_ID ?? "enterprise:browser-proof";
const enterpriseCode = process.env.EVO_ENTERPRISE_CODE ?? "EVO_DEMO";
const runtimeApplicationId = process.env.EVO_RUNTIME_APPLICATION_ID ?? "sales_order";
const amount = Number(process.env.TRADING_LITE_PROOF_AMOUNT ?? "137");
const quantity = Number(process.env.TRADING_LITE_PROOF_QUANTITY ?? "1");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function json(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error("HTTP " + response.status + ": " + JSON.stringify(body));
  }
  return body;
}

async function waitJson(url, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (response.ok) return response.json();
    } catch {
      // Target may still be starting.
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for " + url);
}

async function runtimeObservation(enterpriseId, target, metricCodes) {
  return json(await fetch(evo + "/api/v1/runtime-observations/query", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      contractVersion: "0.1.0",
      enterpriseId,
      target,
      window: {
        startAt: "2020-01-01T00:00:00.000Z",
        endAt: "2030-01-01T00:00:00.000Z"
      },
      metricCodes
    })
  }));
}

function metric(body, code) {
  const found = body.observations.find(item => item.metricCode === code);
  assert.ok(found, "missing runtime observation " + code);
  return found.value;
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

async function evaluate(client, expression, awaitPromise = true) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(client, expression)) return;
    await delay(100);
  }
  throw new Error("Browser condition timed out: " + expression);
}

const enterprise = await json(await fetch(
  evo + "/api/v1/enterprises/" + encodeURIComponent(enterpriseCode),
  { headers: { accept: "application/json" } }
));
assert.equal(enterprise.status, "ACTIVE");
assert.ok(enterprise.id);

const beforeApp = await runtimeObservation(
  enterprise.id,
  { kind: "APPLICATION_ANCHOR", applicationId: runtimeApplicationId },
  ["event.count"]
);
const beforeEventCount = metric(beforeApp, "event.count");

const contexts = await waitJson(host + "/v1/contexts/effective");
assert.ok(
  contexts.availableContexts.some(item =>
    item.kind === "ENTERPRISE" && item.contextId === contextId
  ),
  "configured enterprise Context is not available to the browser session"
);

const installed = await json(await fetch(host + "/v1/install", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    accept: "application/json"
  },
  body: JSON.stringify({ packageId: "trading-lite" })
}));
assert.ok(
  installed.snapshot?.installedPackages?.some(item => item.packageId === "trading-lite"),
  "Trading Lite was not installed"
);

const port = Number(process.env.CHROME_DEBUG_PORT ?? "9229");
const profile = "/tmp/evo-trading-lite-browser-proof-" + process.pid;
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

let client;
try {
  const pages = await waitJson("http://127.0.0.1:" + port + "/json/list");
  const page = pages.find(item => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No Chrome page target available");

  client = new CdpClient(page.webSocketDebuggerUrl);
  await client.open();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");

  let actionRequest;
  let actionResponse;
  const responseBodies = new Map();

  const isActionUrl = value => {
    try {
      return new URL(value).origin === host
        && new URL(value).pathname === "/v1/actions";
    } catch {
      return false;
    }
  };
  client.on("Network.requestWillBeSent", params => {
    if (params.request?.url && isActionUrl(params.request.url)) {
      actionRequest = params;
    }
  });
  client.on("Network.responseReceived", params => {
    if (params.response?.url && isActionUrl(params.response.url)) {
      actionResponse = params;
    }
  });
  client.on("Network.loadingFinished", async params => {
    if (actionResponse?.requestId !== params.requestId) return;
    try {
      const body = await client.send("Network.getResponseBody", {
        requestId: params.requestId
      });
      responseBodies.set(params.requestId, body.body);
    } catch {
      // The proof also validates the resulting EVO runtime state below.
    }
  });

  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      if (location.origin === ${JSON.stringify(host)}) {
        localStorage.setItem("evo.context.id", ${JSON.stringify(contextId)});
      }
    `
  });

  let loadedResolve;
  const loaded = new Promise(resolve => {
    loadedResolve = resolve;
  });
  const offLoad = client.on("Page.loadEventFired", () => loadedResolve());

  await client.send("Page.navigate", {
    url: host + "/?surface=desktop#/trading"
  });
  await Promise.race([
    loaded,
    delay(15_000).then(() => {
      throw new Error("Trading Lite page load timed out");
    })
  ]);
  offLoad();

  await waitFor(
    client,
    `Boolean(document.querySelector('form[data-eidos-id] input[name="customer"]'))`
  );

  const interaction = await evaluate(client, `(() => {
    const form = document.querySelector('form[data-eidos-id]');
    if (!form) return { ok: false, reason: "form-missing" };
    const values = {
      customer: "Browser Cross Project Proof",
      item: "P-100",
      quantity: ${JSON.stringify(quantity)},
      amount: ${JSON.stringify(amount)}
    };
    for (const [name, value] of Object.entries(values)) {
      const control = form.elements.namedItem(name);
      if (!control) return { ok: false, reason: "field-missing:" + name };
      control.value = String(value);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
    form.requestSubmit();
    return { ok: true };
  })()`);
  assert.equal(interaction?.ok, true, JSON.stringify(interaction));

  const started = Date.now();
  while ((!actionRequest || !actionResponse || actionResponse.response.status !== 200)
    && Date.now() - started < 15_000) {
    await delay(100);
  }
  assert.ok(actionRequest, "browser never issued /v1/actions");
  assert.ok(actionResponse, "browser never received /v1/actions response");
  assert.equal(actionResponse.response.status, 200);

  const requestHeaders = Object.fromEntries(
    Object.entries(actionRequest.request.headers ?? {})
      .map(([key, value]) => [key.toLowerCase(), value])
  );
  assert.equal(
    requestHeaders["x-evo-context-id"],
    contextId,
    "browser ActionHost did not propagate the selected Enterprise Context"
  );

  let actionBody;
  const bodyStarted = Date.now();
  while (!responseBodies.has(actionResponse.requestId)
    && Date.now() - bodyStarted < 3_000) {
    await delay(50);
  }
  if (responseBodies.has(actionResponse.requestId)) {
    actionBody = JSON.parse(responseBodies.get(actionResponse.requestId));
    assert.equal(actionBody.ok, true, JSON.stringify(actionBody));
    assert.equal(actionBody.result.applicationId, runtimeApplicationId);
    assert.equal(actionBody.result.postingStatus, "QUEUED");
    assert.equal(actionBody.result.runtimeObservation?.status, "OBSERVED");
    assert.equal(actionBody.result.runtimeObservation?.metricCode, "event.count");
  }

  await waitFor(
    client,
    `Array.from(document.querySelectorAll("[data-eidos-action-status]")).some(element => {
      const text = element.textContent ?? "";
      return text.includes('"runtimeObservation"')
        && text.includes('"OBSERVED"')
        && text.includes('"event.count"');
    })`
  );
  const renderedActionResultText = await evaluate(client, `(() => {
    const values = Array.from(document.querySelectorAll("[data-eidos-action-status]"))
      .map(element => element.textContent ?? "");
    return values.find(text => text.includes('"runtimeObservation"')) ?? "";
  })()`);
  const renderedActionResult = JSON.parse(renderedActionResultText);
  assert.equal(renderedActionResult.applicationId, runtimeApplicationId);
  assert.equal(renderedActionResult.postingStatus, "QUEUED");
  assert.equal(renderedActionResult.runtimeObservation.status, "OBSERVED");
  assert.equal(renderedActionResult.runtimeObservation.metricCode, "event.count");
  assert.ok(renderedActionResult.runtimeObservation.value >= 1);

  let afterEventCount = beforeEventCount;
  let afterReceivable = null;
  let lastLedgerError = null;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await delay(400);
    const app = await runtimeObservation(
      enterprise.id,
      { kind: "APPLICATION_ANCHOR", applicationId: runtimeApplicationId },
      ["event.count"]
    );
    afterEventCount = metric(app, "event.count");

    try {
      const ledger = await runtimeObservation(
        enterprise.id,
        { kind: "LEDGER_DEFINITION", code: "receivable" },
        ["balance.amount"]
      );
      afterReceivable = metric(ledger, "balance.amount");
      lastLedgerError = null;
    } catch (error) {
      lastLedgerError = error;
    }

    if (
      afterEventCount >= beforeEventCount + 1
      && afterReceivable !== null
      && Math.abs(afterReceivable - amount) < 0.000001
    ) {
      break;
    }
  }

  assert.equal(afterEventCount, beforeEventCount + 1);
  assert.notEqual(
    afterReceivable,
    null,
    lastLedgerError instanceof Error
      ? lastLedgerError.message
      : "receivable runtime observation unavailable"
  );
  assert.ok(
    Math.abs(afterReceivable - amount) < 0.000001,
    "expected receivable balance amount " + amount + ", got " + afterReceivable
  );

  console.log("TRADING_LITE_BROWSER_EVO_PROOF=" + JSON.stringify({
    status: "PASS",
    route: "/trading",
    surface: "DESKTOP_WORKBENCH",
    contextId,
    actionEndpoint: "/v1/actions",
    actionContextHeader: requestHeaders["x-evo-context-id"],
    runtimeApplicationId,
    evoScopeKey: enterprise.id,
    businessDataId: actionBody?.result?.businessDataId ?? null,
    postingInputId: actionBody?.result?.postingInputId ?? null,
    browserRenderedRuntimeObservation: true,
    runtimeObservationStatus: renderedActionResult.runtimeObservation.status,
    eventCountDelta: afterEventCount - beforeEventCount,
    receivableBalanceAmount: afterReceivable
  }, null, 2));
} finally {
  client?.close();
  proc.kill("SIGTERM");
  await delay(150);
  if (!proc.killed) proc.kill("SIGKILL");
}
