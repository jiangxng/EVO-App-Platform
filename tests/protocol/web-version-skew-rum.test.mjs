import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeClientRevisionV010,
  webRevisionHeadersV010
} from "../../dist/manager/web-version-skew.js";
import {
  createWebPerformanceStoreV010,
  validateWebPerformanceSampleV010
} from "../../dist/manager/web-performance.js";

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
  assert.equal(store.record({ bad: true }), false);
  const diagnostics = store.diagnostics();
  assert.equal(diagnostics.sampleCount, 1);
  assert.equal(diagnostics.droppedInvalidSamples, 1);
  assert.equal(diagnostics.bySurface.MOBILE_READ, 1);
  assert.equal(diagnostics.recent[0].clientRevision, "client-1");
});
