import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  resolveExperienceSurfaceV010
} from "../../dist/vendor/eidos/src/app-host/surface.js";
import {
  createEnterpriseOperatingGraphObservatoryExperienceManifestV020
} from "../../dist/manager/enterprise-operating-graph-observatory-page.js";
import {
  createEnterpriseOperatingGraphMobileReadPageV010,
  projectEnterpriseOperatingGraphEntityInspectorV010
} from "../../dist/manager/enterprise-operating-graph-mobile-read-page.js";

const activeContext = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:one",
  enterpriseId: "one"
};

test("compact capability falls from unsupported MOBILE_TASK to EOG MOBILE_READ", () => {
  const manifest = createEnterpriseOperatingGraphObservatoryExperienceManifestV020();
  const result = resolveExperienceSurfaceV010(manifest, {
    path: "/operating-graph/observe",
    profile: {
      contractVersion: "0.1.0",
      viewportClass: "COMPACT",
      primaryPointer: "COARSE",
      hover: false,
      touch: true,
      reducedMotion: false,
      standalone: false
    }
  });

  assert.equal(result.kind, "ROUTE");
  assert.equal(result.target, "MOBILE_READ");
  assert.equal(result.support, "READ_ONLY");
  assert.equal(result.route.path, "/m/operating-graph/observe");
  assert.equal(result.semanticRouteId, "evo-enterprise-operating-graph.observatory");
});

test("explicit MOBILE_TASK request remains an unsupported handoff", () => {
  const manifest = createEnterpriseOperatingGraphObservatoryExperienceManifestV020();
  const result = resolveExperienceSurfaceV010(manifest, {
    path: "/operating-graph/observe",
    explicitTarget: "MOBILE_TASK"
  });

  assert.equal(result.kind, "HANDOFF");
  assert.equal(result.reason, "TARGET_UNSUPPORTED");
  assert.equal(result.fallbackSurfaceId, "evo-eog-observatory.mobile-read");
});

test("EOG MOBILE_READ page is read-bound and contains no write command", () => {
  const page = createEnterpriseOperatingGraphMobileReadPageV010({
    activeContext,
    now: new Date("2026-09-29T15:00:00.000Z")
  });

  assert.equal(page.kind, "entity-inspector-reader");
  assert.equal(page.resourceId, "eog:primary");
  assert.equal(
    page.readCommand.code,
    "enterprise-operating-graph.observatory.mobile-read.get"
  );
  assert.equal(page.requestValues.activeContext.contextId, "enterprise:one");
  assert.equal("operationCommand" in page, false);
  assert.equal("actions" in page, false);
});

test("EOG MOBILE_READ projects the same runtime facts into entity metrics and evidence", () => {
  const graph = {
    contractVersion: "0.1.0",
    graphId: "eog:primary",
    enterpriseId: "one",
    state: "PUBLISHED",
    revision: 4,
    nodes: [{
      nodeId: "app:o2c-order",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "EVO",
        refId: "Product Sales Order"
      }
    }],
    guidanceRelations: [],
    enterpriseRelations: [],
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    publishedAt: "2026-09-29T00:00:00.000Z"
  };

  const snapshot = {
    contractVersion: "0.2.0",
    enterpriseId: "one",
    graphId: "eog:primary",
    semanticRevision: 4,
    timeLens: {
      contractVersion: "0.2.0",
      primary: {
        startAt: "2026-09-28T15:00:00.000Z",
        endAt: "2026-09-29T15:00:00.000Z"
      }
    },
    primaryFacts: [{
      contractVersion: "0.2.0",
      factId: "fact:event-count",
      enterpriseId: "one",
      graphId: "eog:primary",
      target: { kind: "NODE", nodeId: "app:o2c-order" },
      metric: { code: "event.count", kind: "COUNT", unit: "events" },
      window: {
        startAt: "2026-09-28T15:00:00.000Z",
        endAt: "2026-09-29T15:00:00.000Z"
      },
      value: 0,
      observedAt: "2026-09-29T15:00:00.000Z",
      source: {
        providerId: "evo-runtime-observatory",
        sourceKind: "EVO_RUNTIME",
        sourceRef: "EVO_CONFIG_MVP"
      }
    }],
    comparisonFacts: [],
    overlays: [{
      contractVersion: "0.2.0",
      overlayId: "analysis:sop",
      enterpriseId: "one",
      graphId: "eog:primary",
      target: { kind: "NODE", nodeId: "app:o2c-order" },
      analysisKind: "SOP_CONFORMANCE",
      status: "INSUFFICIENT_EVIDENCE",
      severity: "INFO",
      window: {
        startAt: "2026-09-28T15:00:00.000Z",
        endAt: "2026-09-29T15:00:00.000Z"
      },
      evidenceFactIds: [],
      derivedAt: "2026-09-29T15:00:00.000Z",
      source: {
        providerId: "eog-bottleneck-analysis",
        analyzerRef: "sop-path-conformance-v0.2"
      }
    }]
  };

  const inspector = projectEnterpriseOperatingGraphEntityInspectorV010({
    graph,
    snapshot,
    providerAvailable: true,
    locale: "en"
  });

  assert.equal(inspector.kind, "entity-inspector");
  assert.equal(inspector.items.length, 1);
  assert.equal(inspector.items[0].id, "app:o2c-order");
  assert.equal(inspector.items[0].title, "Product Sales Order");
  assert.equal(inspector.items[0].status, "SOP_CONFORMANCE:INSUFFICIENT_EVIDENCE");
  assert.equal(
    inspector.items[0].metrics.some(metric => metric.id === "event.count"),
    true
  );
  assert.equal(
    inspector.items[0].evidence.some(entry => entry.id === "fact:event-count"),
    true
  );
  assert.equal(inspector.freshness.observedAt, "2026-09-29T15:00:00.000Z");
  assert.equal(inspector.freshness.stale, false);
});

test("MOBILE_READ runtime has no static Workbench, Diagram or Spatial dependency", async () => {
  const source = await readFile(
    new URL("../../dist/manager/mobile-read-runtime.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /desktop-workbench-runtime/);
  assert.doesNotMatch(source, /vendor\/eidos\/src\/workbench/);
  assert.doesNotMatch(source, /vendor\/eidos\/src\/diagram/);
  assert.doesNotMatch(source, /vendor\/eidos\/src\/spatial/);
  assert.match(source, /entity-inspector/);
});
