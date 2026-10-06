import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  EOG_2D_PACKAGE_ID,
  EOG_2D_DESIGNER_CAPABILITY,
  EOG_2D_DESIGNER_EXPERIENCE_ID,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PAGE_SOURCE,
  EOG_2D_DESIGNER_ROUTE,
  EOG_2D_VIEWER_CAPABILITY,
  EOG_2D_VIEWER_EXPERIENCE_ID,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
  EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
  EOG_2D_VIEWER_WORKSPACE_ROUTE,
  eog2dPackage
} from "../../dist/apps/eog-2d/package.js";
import {
  EOG_2D_DESIGNER_PACKAGE_ID,
  eog2dDesignerPackage
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  EOG_2D_VIEWER_PACKAGE_ID,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  EOG_3D_PACKAGE_ID,
  EOG_3D_VIEWER_CAPABILITY,
  EOG_3D_VIEWER_EXPERIENCE_ID,
  EOG_3D_VIEWER_FEATURE_ID,
  EOG_3D_VIEWER_PAGE_SOURCE,
  EOG_3D_VIEWER_ROUTE,
  eog3dPackage
} from "../../dist/apps/eog-3d/package.js";
import {
  EOG_3D_VIEWER_PACKAGE_ID,
  eog3dViewerPackage
} from "../../dist/apps/eog-3d-viewer/package.js";
import {
  ENTERPRISE_OBSERVATORY_2D_CAPABILITY,
  ENTERPRISE_OBSERVATORY_2D_ROUTE,
  ENTERPRISE_OBSERVATORY_3D_CAPABILITY,
  ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_3D_ROUTE,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID,
  enterpriseObservatoryPackage
} from "../../dist/apps/enterprise-observatory/package.js";

const packages = [eog2dPackage, eog3dPackage, enterpriseObservatoryPackage];

const viewer = eog2dPackage.features.find(
  item => item.featureId === EOG_2D_VIEWER_FEATURE_ID
);
const designer = eog2dPackage.features.find(
  item => item.featureId === EOG_2D_DESIGNER_FEATURE_ID
);

test("EOG convergence has one 2D package plus one 3D package", () => {
  assert.deepEqual(
    packages.map(item => item.packageId),
    [EOG_2D_PACKAGE_ID, EOG_3D_PACKAGE_ID, ENTERPRISE_OBSERVATORY_PACKAGE_ID]
  );
  assert.equal(new Set(packages.map(item => item.packageId)).size, 3);
  assert.equal(packages.every(item => item.type === "APPLICATION"), true);
  assert.ok(viewer);
  assert.ok(designer);
  assert.equal(viewer.defaultActivation, true);
  assert.equal(designer.defaultActivation, true);
  assert.equal(eog3dPackage.features[0].defaultActivation, true);
});

test("legacy 2D package names are compatibility aliases to the unified package", () => {
  assert.equal(EOG_2D_DESIGNER_PACKAGE_ID, EOG_2D_PACKAGE_ID);
  assert.equal(EOG_2D_VIEWER_PACKAGE_ID, EOG_2D_PACKAGE_ID);
  assert.equal(eog2dDesignerPackage, eog2dPackage);
  assert.equal(eog2dViewerPackage, eog2dPackage);
});

test("2D Viewer and Designer share one package but keep separate capabilities", () => {
  assert.ok(viewer);
  assert.ok(designer);

  assert.equal(
    viewer.requiresCapabilities?.includes(
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ),
    true
  );
  assert.equal(
    designer.requiresCapabilities?.includes(
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ),
    true
  );
  assert.equal(
    viewer.requiresCapabilities?.includes("authorization.check") ?? false,
    false
  );
  assert.equal(
    designer.requiresCapabilities?.includes("authorization.check"),
    true
  );
  assert.equal(
    designer.requiresFeatures?.includes(EOG_2D_VIEWER_FEATURE_ID),
    true
  );
});

test("EOG capabilities remain catalog-discoverable through feature identity", () => {
  const catalog = createPackageCatalog(packages);

  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_2D_VIEWER_CAPABILITY),
    [{
      packageId: EOG_2D_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID
    }]
  );
  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_2D_DESIGNER_CAPABILITY),
    [{
      packageId: EOG_2D_PACKAGE_ID,
      featureId: EOG_2D_DESIGNER_FEATURE_ID
    }]
  );
  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_3D_VIEWER_CAPABILITY),
    [{
      packageId: EOG_3D_PACKAGE_ID,
      featureId: EOG_3D_VIEWER_FEATURE_ID
    }]
  );
  assert.equal(
    catalog.findCapabilityProviders(ENTERPRISE_OBSERVATORY_2D_CAPABILITY).length,
    1
  );
  assert.equal(
    catalog.findCapabilityProviders(ENTERPRISE_OBSERVATORY_3D_CAPABILITY).length,
    1
  );
});

test("2D Viewer owns interactive read-only Workspaces; Observatory remains a peer plugin", () => {
  assert.ok(viewer);
  const experiences = (viewer.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_2D_VIEWER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_2D_PACKAGE_ID);
  assert.equal(manifest.featureId, EOG_2D_VIEWER_FEATURE_ID);
  assert.equal(manifest.defaultRoute, EOG_2D_VIEWER_WORKSPACE_ROUTE);
  assert.deepEqual(
    manifest.pages.map(page => page.source),
    [
      EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
      EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE,
      EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE
    ]
  );
  assert.deepEqual(
    manifest.routes.map(route => route.path),
    [
      EOG_2D_VIEWER_WORKSPACE_ROUTE,
      EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
      EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE
    ]
  );
  assert.equal(
    manifest.routes.some(route => route.path.includes("/observe")),
    false
  );
});

test("2D Designer is an editing Feature over the Viewer baseline", () => {
  assert.ok(designer);
  const experiences = (designer.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_2D_DESIGNER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_2D_PACKAGE_ID);
  assert.equal(manifest.featureId, EOG_2D_DESIGNER_FEATURE_ID);
  assert.equal(manifest.defaultRoute, EOG_2D_DESIGNER_ROUTE);
  assert.equal(manifest.pages[0].source, EOG_2D_DESIGNER_PAGE_SOURCE);
});

test("3D Viewer remains an independent spatial package", () => {
  const feature = eog3dPackage.features[0];
  const experiences = (feature.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(feature.defaultActivation, true);
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_3D_VIEWER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_3D_PACKAGE_ID);
  assert.equal(manifest.defaultRoute, EOG_3D_VIEWER_ROUTE);
  assert.equal(manifest.pages[0].source, EOG_3D_VIEWER_PAGE_SOURCE);
});


test("legacy 3D package name is a compatibility alias to unified EOG 3D", () => {
  assert.equal(EOG_3D_VIEWER_PACKAGE_ID, EOG_3D_PACKAGE_ID);
  assert.equal(eog3dViewerPackage, eog3dPackage);
});

test("3D Observatory is a peer Feature, not the EOG 3D Viewer product", () => {
  const feature = enterpriseObservatoryPackage.features.find(
    item => item.featureId === ENTERPRISE_OBSERVATORY_3D_FEATURE_ID
  );
  assert.ok(feature);
  assert.equal(
    feature.requiresFeatures.includes(EOG_3D_VIEWER_FEATURE_ID),
    true
  );
  const experience = feature.contributions.find(
    item => item.kind === "eidos.experience"
  ).manifest;
  assert.equal(experience.packageId, ENTERPRISE_OBSERVATORY_PACKAGE_ID);
  assert.equal(experience.defaultRoute, ENTERPRISE_OBSERVATORY_3D_ROUTE);
});


test("EOG tool experiences stay callable without persistent navigation", () => {
  const manifests = packages.flatMap(pkg =>
    pkg.features.flatMap(feature =>
      (feature.contributions ?? [])
        .filter(item => item.kind === "eidos.experience")
        .map(item => item.manifest)
    )
  );

  assert.deepEqual(
    manifests.flatMap(manifest => manifest.navigation ?? []),
    []
  );

  const routes = manifests.flatMap(manifest =>
    (manifest.routes ?? []).map(route => route.path)
  );
  for (const route of [
    EOG_2D_DESIGNER_ROUTE,
    EOG_2D_VIEWER_WORKSPACE_ROUTE,
    EOG_3D_VIEWER_ROUTE,
    ENTERPRISE_OBSERVATORY_2D_ROUTE,
    ENTERPRISE_OBSERVATORY_3D_ROUTE
  ]) {
    assert.equal(routes.includes(route), true, route);
  }
});
