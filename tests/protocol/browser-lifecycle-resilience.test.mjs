import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createBrowserLifecycleControllerV010,
  createSupersedingRequestGateV010
} from "../../dist/vendor/eidos/src/realtime/index.js";

function fakeDocument(initial = "visible") {
  const listeners = new Map();
  return {
    visibilityState: initial,
    addEventListener(type, handler) {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type) {
      for (const handler of listeners.get(type) ?? []) handler({ type });
    }
  };
}

function fakeWindow() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type, event = { type }) {
      for (const handler of listeners.get(type) ?? []) handler(event);
    }
  };
}

test("vendored browser lifecycle preserves bfcache as a distinct state", () => {
  const doc = fakeDocument();
  const win = fakeWindow();
  const nav = { onLine: true };
  const lifecycle = createBrowserLifecycleControllerV010({
    documentRef: doc,
    windowRef: win,
    navigatorRef: nav
  });

  win.dispatch("pagehide", { type: "pagehide", persisted: true });
  assert.equal(lifecycle.snapshot().state, "BFCACHE_FROZEN");

  win.dispatch("pageshow", { type: "pageshow", persisted: true });
  assert.equal(lifecycle.snapshot().state, "ACTIVE_VISIBLE");

  nav.onLine = false;
  win.dispatch("offline");
  assert.equal(lifecycle.snapshot().state, "OFFLINE");

  lifecycle.dispose();
});

test("vendored request gate aborts and invalidates superseded route reads", () => {
  const gate = createSupersedingRequestGateV010();
  const first = gate.begin();
  const second = gate.begin();

  assert.equal(first.signal.aborted, true);
  assert.equal(first.isCurrent(), false);
  assert.equal(second.isCurrent(), true);

  gate.dispose();
  assert.equal(second.signal.aborted, true);
});

test("App Platform runtime no longer treats persisted pagehide as real disposal", async () => {
  const client = await readFile(
    new URL("../../dist/manager/app-host-client.js", import.meta.url),
    "utf8"
  );
  const desktop = await readFile(
    new URL("../../dist/manager/desktop-workbench-runtime.js", import.meta.url),
    "utf8"
  );
  const lifecycle = await readFile(
    new URL("../../dist/manager/browser-lifecycle.js", import.meta.url),
    "utf8"
  );

  assert.match(client, /disposeOnRealPageExitV010/);
  assert.match(lifecycle, /event\.persisted/);
  assert.match(lifecycle, /data-evo-network-state/);
  assert.doesNotMatch(desktop, /addEventListener\("pagehide"/);
});
