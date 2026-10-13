import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createEvoRuntimeRevisionBridgeV010 } from "../../dist/manager/evo-runtime-revision-bridge.js";

const interest = (code = "A") => ({ connectionId: "connection", contextId: "context",
  enterpriseId: "enterprise", evoEnterpriseCode: code, resourceId: "eog:primary" });
const body = code => JSON.stringify({ contractVersion: "0.1.0", enterpriseId: "runtime", enterpriseCode: code });

async function fixture(t, options = {}) {
  let respond = false;
  const received = [];
  const server = createServer((req, res) => {
    received.push(req.url);
    if (respond) {
      res.writeHead(200, { etag: '"revision"', "content-type": "application/json" });
      res.end(body(req.url.split("/").at(-2)));
    } else {
      // Headers arrive, but the JSON body stalls: timeout must cover body reads too.
      res.writeHead(200, { etag: '"pending"', "content-type": "application/json" });
      res.write('{"contractVersion":');
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const errors = [];
  const changed = [];
  const bridge = createEvoRuntimeRevisionBridgeV010({
    baseUrl: `http://127.0.0.1:${server.address().port}`, intervalMs: 60_000,
    requestTimeoutMs: 5_000, onChanged: e => changed.push(e), onError: e => errors.push(e), ...options
  });
  t.after(async () => {
    bridge.dispose();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  return { server, bridge, received, errors, changed, respond: () => { respond = true; } };
}

test("last subscription closes a real in-flight HTTP response and supports re-subscription", { timeout: 10_000 }, async t => {
  const f = await fixture(t);
  assert.equal(f.bridge.diagnostics().timerActive, false);
  const request = once(f.server, "request");
  const close = f.bridge.register([interest()]);
  const [, response] = await request;
  const closed = once(response, "close");
  close(); close();
  await closed;
  await f.bridge.pollNow();
  assert.equal(f.bridge.diagnostics().timerActive, false);
  assert.equal(f.errors.length, 0);
  assert.equal(f.changed.length, 0);
  f.respond();
  const nextRequest = once(f.server, "request");
  const closeAgain = f.bridge.register([interest()]);
  await nextRequest;
  await f.bridge.pollNow();
  assert.equal(f.received.length, 2);
  assert.equal(f.changed.length, 0); // new subscription establishes a fresh baseline
  closeAgain();
});

test("dispose aborts the active HTTP body and skips queued enterprise reads", { timeout: 10_000 }, async t => {
  const f = await fixture(t);
  const request = once(f.server, "request");
  f.bridge.register([interest("A"), interest("B")]);
  const [, response] = await request;
  const closed = once(response, "close");
  const polling = f.bridge.pollNow();
  f.bridge.dispose(); f.bridge.dispose();
  await closed;
  await polling;
  assert.equal(f.received.length, 1);
  assert.equal(f.bridge.diagnostics().interestCount, 0);
  assert.equal(f.bridge.diagnostics().timerActive, false);
  assert.equal(f.errors.length, 0);
  assert.throws(() => f.bridge.register([interest()]), /DISPOSED/);
});

test("HTTP body timeout releases the request and the next poll recovers", { timeout: 10_000 }, async t => {
  const f = await fixture(t, { requestTimeoutMs: 1_000 });
  const request = once(f.server, "request");
  const close = f.bridge.register([interest()]);
  const [, response] = await request;
  const closed = once(response, "close");
  await f.bridge.pollNow();
  await closed;
  assert.equal(f.errors.length, 1);
  assert.match(String(f.errors[0].error), /EVO_RUNTIME_REVISION_TIMEOUT/);
  f.respond();
  await f.bridge.pollNow();
  assert.equal(f.received.length, 2);
  assert.equal(f.errors.length, 1);
  assert.equal(f.bridge.diagnostics().timerActive, true);
  close();
});
