import test from "node:test";
import assert from "node:assert/strict";

import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";
import {
  resolveBrowserSurfaceGatewayV010
} from "../../dist/manager/browser-surface-gateway.js";

function agentManifest() {
  const contribution = enterpriseAgentPackage.features
    .flatMap(feature => feature.contributions ?? [])
    .find(item => item.kind === "eidos.experience");
  assert.ok(contribution);
  return contribution.manifest;
}

const compactProfile = {
  contractVersion: "0.1.0",
  viewportClass: "COMPACT",
  primaryPointer: "COARSE",
  hover: false,
  touch: true,
  reducedMotion: false,
  standalone: false
};

test("compact browser maps Personal Agent semantic home to mobile task route", () => {
  const result = resolveBrowserSurfaceGatewayV010({
    manifests: [agentManifest()],
    path: "/enterprise-agent",
    url: new URL("https://example.test/#/enterprise-agent"),
    profile: compactProfile
  });

  assert.equal(result.kind, "REDIRECT");
  assert.equal(result.fromPath, "/enterprise-agent");
  assert.equal(result.toPath, "/m/enterprise-agent");
  assert.equal(result.target, "MOBILE_TASK");
  assert.equal(result.surfaceId, "enterprise-agent.mobile-task");
  assert.equal(result.semanticRouteId, "enterprise-agent.home");
});

test("explicit URL Surface overrides compact capability inference", () => {
  const result = resolveBrowserSurfaceGatewayV010({
    manifests: [agentManifest()],
    path: "/enterprise-agent",
    url: new URL(
      "https://example.test/?surface=desktop#/enterprise-agent"
    ),
    profile: compactProfile
  });

  assert.equal(result.kind, "UNCHANGED");
  assert.equal(result.reason, "ALREADY_ON_TARGET");
  assert.equal(result.target, "DESKTOP_WORKBENCH");
  assert.equal(result.surfaceId, "enterprise-agent.desktop");
});

test("desktop-only Agent setup becomes handoff on mobile task Surface", () => {
  const result = resolveBrowserSurfaceGatewayV010({
    manifests: [agentManifest()],
    path: "/enterprise-agent/setup",
    url: new URL("https://example.test/#/enterprise-agent/setup"),
    profile: compactProfile
  });

  assert.equal(result.kind, "HANDOFF");
  assert.equal(result.target, "MOBILE_TASK");
  assert.equal(result.model.reason, "SEMANTIC_ROUTE_UNAVAILABLE");
  assert.equal(result.model.semanticRouteId, "enterprise-agent.setup");
  assert.ok(
    result.model.alternatives.some(
      item =>
        item.target === "DESKTOP_WORKBENCH"
        && item.route === "/enterprise-agent/setup"
    )
  );
});

test("stored user desktop preference overrides browser capability inference", () => {
  const result = resolveBrowserSurfaceGatewayV010({
    manifests: [agentManifest()],
    path: "/m/enterprise-agent",
    url: new URL("https://example.test/#/m/enterprise-agent"),
    profile: compactProfile,
    storedUserTarget: "desktop"
  });

  assert.equal(result.kind, "REDIRECT");
  assert.equal(result.toPath, "/enterprise-agent");
  assert.equal(result.target, "DESKTOP_WORKBENCH");
});

test("legacy Experience without Surface metadata remains unchanged", () => {
  const legacy = {
    contractVersion: "0.1.0",
    experienceId: "notes",
    packageId: "notes",
    featureId: "notes.default",
    defaultRoute: "/notes",
    pages: [
      { id: "notes.home", source: "memory://notes" }
    ],
    routes: [
      { id: "notes.home", path: "/notes", pageId: "notes.home" }
    ]
  };

  const result = resolveBrowserSurfaceGatewayV010({
    manifests: [legacy],
    path: "/notes",
    url: new URL("https://example.test/#/notes"),
    profile: compactProfile
  });

  assert.deepEqual(result, {
    kind: "UNCHANGED",
    reason: "EXPERIENCE_NOT_SURFACE_MANAGED",
    path: "/notes"
  });
});
