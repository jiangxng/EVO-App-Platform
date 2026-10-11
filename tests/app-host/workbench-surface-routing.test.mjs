import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveWorkbenchSurfaceRouteV010
} from "../../dist/vendor/eidos/src/workbench/index.js";
import {
  validateEffectiveExperienceManifest
} from "../../dist/vendor/eidos/src/app-host/index.js";
import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";

function manifest() {
  const contribution = enterpriseAgentPackage.features
    .flatMap(feature => feature.contributions ?? [])
    .find(item => item.kind === "eidos.experience");
  assert.ok(contribution);
  const validated = validateEffectiveExperienceManifest(contribution.manifest);
  assert.equal(validated.ok, true);
  return validated.value;
}

function snapshot() {
  const value = manifest();
  return {
    contractVersion: "0.1.0",
    revision: 1,
    status: "ready",
    manifests: [value],
    pages: value.pages,
    routes: value.routes,
    navigation: value.navigation ?? [],
    diagnostics: []
  };
}

test("Workbench resolves query-qualified detail routes without dropping route identity", () => {
  const value = manifest();
  const snap = {
    contractVersion: "0.1.0",
    revision: 1,
    status: "ready",
    manifests: [value],
    pages: value.pages,
    routes: value.routes,
    navigation: value.navigation ?? [],
    diagnostics: []
  };
  const route = value.routes[0].path + "?itemId=example";
  const result = resolveWorkbenchSurfaceRouteV010(snap, {
    path: route
  });
  assert.equal(result?.resolution.kind, "ROUTE");
  assert.equal(result?.manifest.experienceId, value.experienceId);
});

test("Workbench keeps mobile Agent Surface during internal semantic navigation", () => {
  const result = resolveWorkbenchSurfaceRouteV010(snapshot(), {
    path: "/enterprise-agent",
    configuredSurfaceId: "enterprise-agent.mobile-task"
  });

  assert.equal(result?.resolution.kind, "ROUTE");
  assert.equal(result?.resolution.target, "MOBILE_TASK");
  assert.equal(result?.resolution.surfaceId, "enterprise-agent.mobile-task");
  assert.equal(result?.resolution.route.path, "/m/enterprise-agent");
  assert.equal(result?.resolution.semanticRouteId, "enterprise-agent.home");
});

test("Workbench keeps desktop Agent Surface when configured by gateway", () => {
  const result = resolveWorkbenchSurfaceRouteV010(snapshot(), {
    path: "/m/enterprise-agent",
    configuredSurfaceId: "enterprise-agent.desktop"
  });

  assert.equal(result?.resolution.kind, "ROUTE");
  assert.equal(result?.resolution.target, "DESKTOP_WORKBENCH");
  assert.equal(result?.resolution.surfaceId, "enterprise-agent.desktop");
  assert.equal(result?.resolution.route.path, "/enterprise-agent");
});

test("Workbench root resolves through selected Surface entry route", () => {
  const result = resolveWorkbenchSurfaceRouteV010(snapshot(), {
    path: "/",
    configuredSurfaceId: "enterprise-agent.mobile-task"
  });

  assert.equal(result?.resolution.kind, "ROUTE");
  assert.equal(result?.resolution.target, "MOBILE_TASK");
  assert.equal(result?.resolution.route.path, "/m/enterprise-agent");
});

test("desktop-only Agent setup fails closed when current Workbench Surface is mobile", () => {
  const result = resolveWorkbenchSurfaceRouteV010(snapshot(), {
    path: "/enterprise-agent/setup",
    configuredSurfaceId: "enterprise-agent.mobile-task"
  });

  assert.equal(result?.resolution.kind, "HANDOFF");
  assert.equal(result?.resolution.reason, "SEMANTIC_ROUTE_UNAVAILABLE");
  assert.equal(result?.resolution.target, "MOBILE_TASK");
});
