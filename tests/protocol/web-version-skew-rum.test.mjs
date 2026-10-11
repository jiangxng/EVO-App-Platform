import test from "node:test";
import assert from "node:assert/strict";

import {
  applyWebRevisionHeadersV010,
  normalizeClientRevisionV010,
  webRevisionHeadersV010
} from "../../dist/manager/web-version-skew.js";
import {
  createWebPerformanceStoreV010,
  validateWebPerformanceSampleV010
} from "../../dist/manager/web-performance.js";
import {
  currentRevisionNavigationUrlV010
} from "../../dist/manager/browser-version-notice.js";

test("web revision contract detects stale immutable clients without rejecting compatibility", () => {
  assert.equal(normalizeClientRevisionV010("abc-123"), "abc-123");
  assert.equal(normalizeClientRevisionV010("../bad"), undefined);

  assert.deepEqual(webRevisionHeadersV010("host-2", "host-2"), {
    hostRevision: "host-2",
    contractVersion: "0.1.0",
    clientUpdateAvailable: false
  });

  assert.deepEqual(webRevisionHeadersV010("host-2", "host-1"), {
    hostRevision: "host-2",
    contractVersion: "0.1.0",
    clientUpdateAvailable: true
  });
});

test("web performance samples are bounded, non-authoritative diagnostics", () => {
  const sample = validateWebPerformanceSampleV010({
    contractVersion: "0.1.0",
    observedAt: "2026-09-30T00:00:00.000Z",
    pageViewId: "page-view-1",
    clientRevision: "client-1",
    hostRevision: "host-1",
    surfaceTarget: "MOBILE_READ",
    navigationType: "reload",
    navigationDurationMs: 1234.5,
    largestContentfulPaintMs: 900,
    firstContentfulPaintMs: 450,
    longTaskCount: 2,
    longTaskTotalMs: 140,
    resourceCount: 12,
    transferBytes: 10000,
    jsTransferBytes: 7000,
    cssTransferBytes: 1000,
    apiTransferBytes: 2000,
    cachedResourceCount: 8
  });

  assert.equal(sample?.surfaceTarget, "MOBILE_READ");
  assert.equal(sample?.transferBytes, 10000);

  assert.equal(validateWebPerformanceSampleV010({
    contractVersion: "0.1.0",
    observedAt: "bad-date",
    surfaceTarget: "MOBILE_READ"
  }), undefined);

  const store = createWebPerformanceStoreV010(10);
  assert.equal(store.record(sample), true);
  assert.equal(store.record(sample), true);
  assert.equal(store.record({ bad: true }), false);
  const diagnostics = store.diagnostics();
  assert.equal(diagnostics.sampleCount, 1);
  assert.equal(diagnostics.droppedInvalidSamples, 1);
  assert.equal(diagnostics.duplicateSamples, 1);
  assert.equal(diagnostics.bySurface.MOBILE_READ, 1);
  assert.equal(diagnostics.recent[0].clientRevision, "client-1");
});

test("stale-client update navigation forces a new shell URL while preserving route", () => {
  const next = new URL(currentRevisionNavigationUrlV010(
    "https://example.test/?surface=MOBILE_READ#/enterprise-contexts/overview",
    "host-revision-2"
  ));

  assert.equal(next.searchParams.get("surface"), "MOBILE_READ");
  assert.equal(next.searchParams.get("evo-web-revision"), "host-revision-2");
  assert.equal(next.hash, "#/enterprise-contexts/overview");

  const updatedAgain = new URL(currentRevisionNavigationUrlV010(
    next.toString(),
    "host-revision-3"
  ));
  assert.equal(updatedAgain.searchParams.getAll("evo-web-revision").length, 1);
  assert.equal(updatedAgain.searchParams.get("evo-web-revision"), "host-revision-3");
});

test("web revision headers explicitly clear stale cached update state", () => {
  const headers = new Map();
  applyWebRevisionHeadersV010(
    (name, value) => headers.set(name.toLowerCase(), value),
    "host-2",
    "host-2"
  );

  assert.equal(headers.get("x-evo-host-revision"), "host-2");
  assert.equal(headers.get("x-evo-client-update"), "current");
  assert.equal(headers.get("vary"), "x-evo-client-revision");

  applyWebRevisionHeadersV010(
    (name, value) => headers.set(name.toLowerCase(), value),
    "host-2",
    "host-1"
  );
  assert.equal(headers.get("x-evo-client-update"), "available");
});
