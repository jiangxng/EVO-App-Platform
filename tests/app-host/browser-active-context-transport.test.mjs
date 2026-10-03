import test from "node:test";
import assert from "node:assert/strict";

import {
  createRevisionAwareBrowserTransportV010
} from "../../dist/manager/browser-transport.js";

const originalWindow = globalThis.window;

function installWindow(origin) {
  globalThis.window = {
    location: { origin }
  };
}

test.afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

function captureFetch() {
  let captured;
  return {
    fetch: async (input, init) => {
      captured = { input, init };
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    },
    captured: () => captured
  };
}

test("same-origin browser requests carry the Host-selected Context", async () => {
  installWindow("https://evo.example");
  const capture = captureFetch();
  const transport = createRevisionAwareBrowserTransportV010({
    importUrl: "https://evo.example/assets/rev-1/manager/app-host-client.js",
    fetchImpl: capture.fetch,
    selectedContextId: () => " enterprise:demo "
  });

  await transport.fetch("https://evo.example/v1/actions", {
    method: "POST",
    headers: { "content-type": "application/json" }
  });

  const headers = new Headers(capture.captured().init.headers);
  assert.equal(headers.get("x-evo-client-revision"), "rev-1");
  assert.equal(headers.get("x-evo-context-id"), "enterprise:demo");
});

test("explicit Context headers are never overwritten by browser selection", async () => {
  installWindow("https://evo.example");
  const capture = captureFetch();
  const transport = createRevisionAwareBrowserTransportV010({
    importUrl: "https://evo.example/assets/rev-1/manager/app-host-client.js",
    fetchImpl: capture.fetch,
    selectedContextId: () => "enterprise:selected"
  });

  await transport.fetch("https://evo.example/v1/actions", {
    headers: { "x-evo-context-id": "enterprise:explicit" }
  });

  const headers = new Headers(capture.captured().init.headers);
  assert.equal(headers.get("x-evo-context-id"), "enterprise:explicit");
});

test("cross-origin requests do not leak Host Context selection", async () => {
  installWindow("https://evo.example");
  const capture = captureFetch();
  const transport = createRevisionAwareBrowserTransportV010({
    importUrl: "https://evo.example/assets/rev-1/manager/app-host-client.js",
    fetchImpl: capture.fetch,
    selectedContextId: () => "enterprise:demo"
  });

  await transport.fetch("https://external.example/api", {
    headers: { accept: "application/json" }
  });

  const headers = new Headers(capture.captured().init.headers);
  assert.equal(headers.get("x-evo-context-id"), null);
  assert.equal(headers.get("x-evo-client-revision"), null);
});
