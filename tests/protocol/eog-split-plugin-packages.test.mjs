import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  EOG_2D_DESIGNER_CAPABILITY,
  EOG_2D_DESIGNER_EXPERIENCE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID,
  EOG_2D_DESIGNER_PAGE_SOURCE,
  EOG_2D_DESIGNER_ROUTE,
  eog2dDesignerPackage
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  EOG_2D_VIEWER_CAPABILITY,
  EOG_2D_VIEWER_EXPERIENCE_ID,
  EOG_2D_VIEWER_MOBILE_PAGE_SOURCE,
  EOG_2D_VIEWER_MOBILE_ROUTE,
  EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_PAGE_SOURCE,
  EOG_2D_VIEWER_ROUTE,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  EOG_3D_VIEWER_CAPABILITY,
  EOG_3D_VIEWER_EXPERIENCE_ID,
  EOG_3D_VIEWER_PACKAGE_ID,
  EOG_3D_VIEWER_PAGE_SOURCE,
  EOG_3D_VIEWER_ROUTE,
  eog3dViewerPackage
} from "../../dist/apps/eog-3d-viewer/package.js";

const packages = [
  eog2dDesignerPackage,
  eog2dViewerPackage,
  eog3dViewerPackage
];

test("EOG responsibility convergence has three independent application package identities", () => {
  assert.deepEqual(
    packages.map(item => item.packageId),
    [
      EOG_2D_DESIGNER_PACKAGE_ID,
      EOG_2D_VIEWER_PACKAGE_ID,
      EOG_3D_VIEWER_PACKAGE_ID
    ]
  );
  assert.equal(new Set(packages.map(item => item.packageId)).size, 3);
  assert.equal(packages.every(item => item.type === "APPLICATION"), true);
  assert.equal(
    packages.every(item => item.features[0].defaultActivation === false),
    true
  );
});

test("all EOG application packages depend on Enterprise Context definition authority", () => {
  for (const pkg of packages) {
    assert.equal(
      pkg.features[0].requiresCapabilities?.includes(
        ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
      ),
      true
    );
  }

  assert.equal(
    eog2dDesignerPackage.features[0].requiresCapabilities?.includes(
      "authorization.check"
    ),
    true
  );
  assert.equal(
    eog2dViewerPackage.features[0].requiresCapabilities?.includes(
      "authorization.check"
    ) ?? false,
    false
  );
  assert.equal(
    eog3dViewerPackage.features[0].requiresCapabilities?.includes(
      "authorization.check"
    ) ?? false,
    false
  );
});

test("split package capabilities are distinct and catalog-discoverable", () => {
  const catalog = createPackageCatalog(packages);

  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_2D_DESIGNER_CAPABILITY),
    [{
      packageId: EOG_2D_DESIGNER_PACKAGE_ID,
      featureId: "evo-eog-2d-designer.default"
    }]
  );
  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_2D_VIEWER_CAPABILITY),
    [{
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: "evo-eog-2d-viewer.default"
    }]
  );
  assert.deepEqual(
    catalog.findCapabilityProviders(EOG_3D_VIEWER_CAPABILITY),
    [{
      packageId: EOG_3D_VIEWER_PACKAGE_ID,
      featureId: "evo-eog-3d-viewer.default"
    }]
  );
});

test("2D Designer declares its target Experience ownership without activating migration", () => {
  const feature = eog2dDesignerPackage.features[0];
  const experiences = (feature.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(feature.defaultActivation, false);
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_2D_DESIGNER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_2D_DESIGNER_PACKAGE_ID);
  assert.equal(manifest.defaultRoute, EOG_2D_DESIGNER_ROUTE);
  assert.equal(manifest.pages[0].source, EOG_2D_DESIGNER_PAGE_SOURCE);
});

test("2D Viewer declares desktop and mobile read Experience ownership without activation", () => {
  const feature = eog2dViewerPackage.features[0];
  const experiences = (feature.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(feature.defaultActivation, false);
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_2D_VIEWER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_2D_VIEWER_PACKAGE_ID);
  assert.equal(manifest.defaultRoute, EOG_2D_VIEWER_ROUTE);
  assert.deepEqual(
    manifest.pages.map(page => page.source),
    [EOG_2D_VIEWER_PAGE_SOURCE, EOG_2D_VIEWER_MOBILE_PAGE_SOURCE]
  );
  assert.deepEqual(
    manifest.routes.map(route => route.path),
    [EOG_2D_VIEWER_ROUTE, EOG_2D_VIEWER_MOBILE_ROUTE]
  );
  assert.equal(
    manifest.surfaces.find(surface => surface.target === "MOBILE_READ")?.support,
    "READ_ONLY"
  );
});

test("3D Viewer declares its target spatial Experience ownership without activation", () => {
  const feature = eog3dViewerPackage.features[0];
  const experiences = (feature.contributions ?? []).filter(
    item => item.kind === "eidos.experience"
  );
  assert.equal(feature.defaultActivation, false);
  assert.equal(experiences.length, 1);
  const manifest = experiences[0].manifest;
  assert.equal(manifest.experienceId, EOG_3D_VIEWER_EXPERIENCE_ID);
  assert.equal(manifest.packageId, EOG_3D_VIEWER_PACKAGE_ID);
  assert.equal(manifest.defaultRoute, EOG_3D_VIEWER_ROUTE);
  assert.equal(manifest.pages[0].source, EOG_3D_VIEWER_PAGE_SOURCE);
});
