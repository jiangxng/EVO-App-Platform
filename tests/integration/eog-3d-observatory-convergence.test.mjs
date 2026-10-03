import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  EOG_3D_PACKAGE_ID,
  EOG_3D_VIEWER_EXPERIENCE_ID,
  EOG_3D_VIEWER_FEATURE_ID,
  EOG_3D_VIEWER_ROUTE,
  eog3dPackage
} from "../../dist/apps/eog-3d/package.js";
import {
  enterpriseObservatoryPackage,
  ENTERPRISE_OBSERVATORY_3D_EXPERIENCE_ID,
  ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_3D_ROUTE,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "../../dist/apps/enterprise-observatory/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  createEnterpriseOperatingGraph3dViewerReadActionV010
} from "../../dist/apps/eog-3d/workspace-page.js";
import {
  createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020
} from "../../dist/apps/enterprise-observatory/spatial-page.js";

test("EOG 3D Viewer and Enterprise Observatory 3D are independent lifecycle features", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog3dPackage,
      enterpriseObservatoryPackage,
      hostEnterpriseContextProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-03T06:00:00.000Z")
  );

  manager.install(EOG_3D_PACKAGE_ID);
  manager.install(ENTERPRISE_OBSERVATORY_PACKAGE_ID);

  const experiences = manager.listEffectiveExperiences();
  const viewer = experiences.find(
    item => item.experienceId === EOG_3D_VIEWER_EXPERIENCE_ID
  );
  const observatory = experiences.find(
    item => item.experienceId === ENTERPRISE_OBSERVATORY_3D_EXPERIENCE_ID
  );

  assert.ok(viewer);
  assert.ok(observatory);
  assert.equal(viewer.packageId, EOG_3D_PACKAGE_ID);
  assert.equal(viewer.featureId, EOG_3D_VIEWER_FEATURE_ID);
  assert.equal(viewer.defaultRoute, EOG_3D_VIEWER_ROUTE);
  assert.equal(observatory.packageId, ENTERPRISE_OBSERVATORY_PACKAGE_ID);
  assert.equal(observatory.featureId, ENTERPRISE_OBSERVATORY_3D_FEATURE_ID);
  assert.equal(observatory.defaultRoute, ENTERPRISE_OBSERVATORY_3D_ROUTE);
});

test("3D Viewer owns neutral spatial read while Observatory owns runtime overlays", () => {
  const viewer = createEnterpriseOperatingGraph3dViewerReadActionV010({
    graphService: {},
    viewService: {}
  });
  const observatory =
    createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020({
      graphService: {},
      viewService: {},
      providers: {}
    });

  assert.equal(viewer.packageId, EOG_3D_PACKAGE_ID);
  assert.equal(viewer.featureId, EOG_3D_VIEWER_FEATURE_ID);
  assert.equal(observatory.packageId, ENTERPRISE_OBSERVATORY_PACKAGE_ID);
  assert.equal(observatory.featureId, ENTERPRISE_OBSERVATORY_3D_FEATURE_ID);
});
