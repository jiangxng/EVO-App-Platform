import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveExperienceSurfaceV010,
  validateEffectiveExperienceManifest
} from "../../dist/vendor/eidos/src/app-host/index.js";
import {
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage,
  ENTERPRISE_AGENT_MOBILE_PAGE_SOURCE,
  ENTERPRISE_AGENT_PAGE_SOURCE
} from "../../dist/agents/enterprise-agent/package.js";

function agentExperienceManifest() {
  const contribution = enterpriseAgentPackage.features
    .flatMap(feature => feature.contributions ?? [])
    .find(item => item.kind === "eidos.experience");
  assert.ok(contribution);
  return contribution.manifest;
}

test("Personal Agent declares separate desktop/mobile Surface pages over one semantic route", () => {
  const manifest = agentExperienceManifest();
  const validated = validateEffectiveExperienceManifest(manifest);
  assert.equal(validated.ok, true);

  const desktop = resolveExperienceSurfaceV010(validated.value, {
    semanticRouteId: "enterprise-agent.home",
    explicitTarget: "DESKTOP_WORKBENCH"
  });
  const mobile = resolveExperienceSurfaceV010(validated.value, {
    semanticRouteId: "enterprise-agent.home",
    explicitTarget: "MOBILE_TASK"
  });

  assert.equal(desktop.kind, "ROUTE");
  assert.equal(mobile.kind, "ROUTE");
  assert.equal(desktop.route.path, "/enterprise-agent");
  assert.equal(mobile.route.path, "/m/enterprise-agent");
  assert.equal(desktop.semanticRouteId, mobile.semanticRouteId);
  assert.notEqual(desktop.route.pageId, mobile.route.pageId);

  const desktopPage = validated.value.pages.find(
    page => page.id === desktop.route.pageId
  );
  const mobilePage = validated.value.pages.find(
    page => page.id === mobile.route.pageId
  );
  assert.equal(desktopPage.source, ENTERPRISE_AGENT_PAGE_SOURCE);
  assert.equal(mobilePage.source, ENTERPRISE_AGENT_MOBILE_PAGE_SOURCE);
  assert.notEqual(desktopPage.source, mobilePage.source);
});

test("Personal Agent mobile Surface reuses Agent command semantics without reusing page implementation", () => {
  const desktop = enterpriseAgentExperienceAssets.get(
    ENTERPRISE_AGENT_PAGE_SOURCE
  );
  const mobile = enterpriseAgentExperienceAssets.get(
    ENTERPRISE_AGENT_MOBILE_PAGE_SOURCE
  );

  assert.equal(desktop.kind, "chat");
  assert.equal(mobile.kind, "chat");
  assert.equal(desktop.command.code, "enterprise-agent.chat");
  assert.equal(mobile.command.code, "enterprise-agent.chat");
  assert.notEqual(desktop.id, mobile.id);
  assert.equal(mobile.metadata.surface.target, "MOBILE_TASK");
  assert.equal(mobile.metadata.surface.interaction, "TASK_FOCUSED");
});

test("Personal Agent explicitly hands off unsupported mobile-read Surface", () => {
  const validated = validateEffectiveExperienceManifest(
    agentExperienceManifest()
  );
  assert.equal(validated.ok, true);

  const resolution = resolveExperienceSurfaceV010(validated.value, {
    semanticRouteId: "enterprise-agent.home",
    explicitTarget: "MOBILE_READ"
  });

  assert.equal(resolution.kind, "HANDOFF");
  assert.equal(resolution.reason, "TARGET_UNSUPPORTED");
  assert.equal(resolution.fallbackSurfaceId, "enterprise-agent.desktop");
});

test("desktop-only Agent setup does not silently fall through to mobile task page", () => {
  const validated = validateEffectiveExperienceManifest(
    agentExperienceManifest()
  );
  assert.equal(validated.ok, true);

  const resolution = resolveExperienceSurfaceV010(validated.value, {
    semanticRouteId: "enterprise-agent.setup",
    explicitTarget: "MOBILE_TASK"
  });

  assert.equal(resolution.kind, "HANDOFF");
  assert.equal(resolution.reason, "SEMANTIC_ROUTE_UNAVAILABLE");
});
