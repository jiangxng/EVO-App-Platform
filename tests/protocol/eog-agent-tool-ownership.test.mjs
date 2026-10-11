import test from "node:test";
import assert from "node:assert/strict";

import {
  EOG_2D_DESIGNER_PACKAGE_ID
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  EOG_2D_VIEWER_PACKAGE_ID
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  EOG_3D_VIEWER_PACKAGE_ID
} from "../../dist/apps/eog-3d-viewer/package.js";
import {
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "../../dist/apps/enterprise-observatory/package.js";
import {
  createEnterpriseOperatingGraphAgentToolRegistrationsV010
} from "../../dist/manager/enterprise-operating-graph-agent-tools.js";
import {
  createEog2dDesignerAgentToolRegistrationsV010
} from "../../dist/apps/eog-2d-designer/agent-tools.js";
import {
  createEog3dViewerAgentToolRegistrationsV010
} from "../../dist/apps/eog-3d-viewer/agent-tools.js";
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

test("stable generic View tool ids are now the 2D Designer compatibility path only", () => {
  const registrations = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true,
    is3dViewerActive: () => true
  });

  const viewIds = new Set([
    "enterprise.operating_graph.view.get",
    "enterprise.operating_graph.view.apply"
  ]);
  const twoD = registrations.filter(item => viewIds.has(item.descriptor.id));
  assert.equal(twoD.length, 2);
  assert.equal(
    twoD.every(item => item.descriptor.ownerPackageId === EOG_2D_DESIGNER_PACKAGE_ID),
    true
  );
  assert.equal(
    twoD.every(item =>
      item.descriptor.inputSchema.properties.kind.enum.length === 1
      && item.descriptor.inputSchema.properties.kind.enum[0] === "DIAGRAM_2D"
    ),
    true
  );
});

test("explicit spatial View tools are owned and lifecycle-gated by the 3D Viewer", () => {
  const spatialIds = new Set([
    "enterprise.operating_graph.spatial_view.get",
    "enterprise.operating_graph.spatial_view.apply"
  ]);
  const active = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true,
    is3dViewerActive: () => true
  }).filter(item => spatialIds.has(item.descriptor.id));

  assert.equal(active.length, 2);
  assert.equal(
    active.every(item => item.descriptor.ownerPackageId === EOG_3D_VIEWER_PACKAGE_ID),
    true
  );
  assert.equal(active.every(item => item.available?.() === true), true);

  const inactive = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true,
    is3dViewerActive: () => false
  }).filter(item => spatialIds.has(item.descriptor.id));
  assert.equal(inactive.every(item => item.available?.() === false), true);
});

test("no EOG Agent tool descriptor remains generically owned by evo-app-platform", () => {
  const all = [
    ...createEnterpriseOperatingGraphAgentToolRegistrationsV010({
      service: {},
      viewService: {},
      principal,
      context,
      isDesignerActive: () => true,
      is3dViewerActive: () => true
    }),
    ...createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
      graphService: {},
      providers: {
        hasRuntimeCandidate: () => true,
        hasAnalysisCandidate: () => true
      },
      principal,
      context,
      isObservatoryActive: () => true
    })
  ];
  assert.equal(
    all.some(item => item.descriptor.ownerPackageId === "evo-app-platform"),
    false
  );
});

test("observatory Agent tools are owned and lifecycle-gated by Enterprise Observatory while calculations remain Provider-backed", () => {
  const providers = {
    hasRuntimeCandidate: () => true,
    hasAnalysisCandidate: () => true
  };

  const active = createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
    graphService: {},
    providers,
    principal,
    context,
    isObservatoryActive: () => true
  });
  assert.equal(active.length, 2);
  assert.equal(
    active.every(item => item.descriptor.ownerPackageId === ENTERPRISE_OBSERVATORY_PACKAGE_ID),
    true
  );
  assert.equal(active.every(item => item.available?.() === true), true);

  const inactive = createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
    graphService: {},
    providers,
    principal,
    context,
    isObservatoryActive: () => false
  });
  assert.equal(inactive.every(item => item.available?.() === false), true);
});


test("physical Agent tool factories are package-owned while manager remains compatibility composition", () => {
  const designer = createEog2dDesignerAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true
  });
  assert.equal(designer.length, 6);
  assert.equal(
    designer.every(item => item.descriptor.ownerPackageId === EOG_2D_DESIGNER_PACKAGE_ID),
    true
  );

  const spatial = createEog3dViewerAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    is3dViewerActive: () => true
  });
  assert.equal(spatial.length, 2);
  assert.equal(
    spatial.every(item => item.descriptor.ownerPackageId === EOG_3D_VIEWER_PACKAGE_ID),
    true
  );

  const compatibility = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service: {},
    viewService: {},
    principal,
    context,
    isDesignerActive: () => true,
    is3dViewerActive: () => true
  });
  assert.equal(compatibility.length, designer.length + spatial.length);
});
