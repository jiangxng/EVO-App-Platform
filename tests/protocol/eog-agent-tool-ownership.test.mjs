import test from "node:test";
import assert from "node:assert/strict";

import {
  EOG_2D_DESIGNER_PACKAGE_ID
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  EOG_2D_VIEWER_PACKAGE_ID
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  createEnterpriseOperatingGraphAgentToolRegistrationsV010
} from "../../dist/manager/enterprise-operating-graph-agent-tools.js";
import {
  createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020
} from "../../dist/manager/enterprise-operating-graph-observatory-agent-tools.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "agent:owner",
  actorType: "AGENT",
  identityProviderId: "test"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:owner",
    ownerSubjectId: "human:owner"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise-context:demo",
    enterpriseId: "enterprise:demo"
  },
  enterpriseContext: {
    contractVersion: "0.1.0",
    contextId: "enterprise-context:demo",
    enterpriseId: "enterprise:demo",
    displayName: "Demo"
  }
};

test("semantic EOG Agent tools are owned and gated by the 2D Designer package", () => {
  const registrations = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true
  });

  const semanticIds = new Set([
    "enterprise.operating_graph.list",
    "enterprise.operating_graph.get",
    "enterprise.operating_graph.create",
    "enterprise.operating_graph.proposal.apply"
  ]);

  const semantic = registrations.filter(item => semanticIds.has(item.descriptor.id));
  assert.equal(semantic.length, 4);
  assert.equal(
    semantic.every(item => item.descriptor.ownerPackageId === EOG_2D_DESIGNER_PACKAGE_ID),
    true
  );
  assert.equal(semantic.every(item => item.available?.() === true), true);

  const inactive = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => false
  }).filter(item => semanticIds.has(item.descriptor.id));
  assert.equal(inactive.every(item => item.available?.() === false), true);
});

test("generic mixed 2D/3D View Agent tools remain explicit compatibility debt for the next split", () => {
  const registrations = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true
  });

  const viewIds = new Set([
    "enterprise.operating_graph.view.get",
    "enterprise.operating_graph.view.apply"
  ]);
  const mixed = registrations.filter(item => viewIds.has(item.descriptor.id));
  assert.equal(mixed.length, 2);
  assert.equal(
    mixed.every(item => item.descriptor.ownerPackageId === "evo-app-platform"),
    true
  );
});

test("observatory Agent tools are owned and lifecycle-gated by the 2D Viewer while calculations remain Provider-backed", () => {
  const providers = {
    hasRuntimeCandidate: () => true,
    hasAnalysisCandidate: () => true
  };

  const active = createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
    graphService: {},
    providers,
    principal,
    context,
    isViewerActive: () => true
  });
  assert.equal(active.length, 2);
  assert.equal(
    active.every(item => item.descriptor.ownerPackageId === EOG_2D_VIEWER_PACKAGE_ID),
    true
  );
  assert.equal(active.every(item => item.available?.() === true), true);

  const inactive = createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
    graphService: {},
    providers,
    principal,
    context,
    isViewerActive: () => false
  });
  assert.equal(inactive.every(item => item.available?.() === false), true);
});
