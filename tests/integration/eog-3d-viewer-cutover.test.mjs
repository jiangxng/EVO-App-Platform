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
  EOG_3D_VIEWER_PACKAGE_ID,
  eog3dViewerPackage
} from "../../dist/apps/eog-3d-viewer/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  createEnterpriseOperatingGraph3dViewerReadActionV010
} from "../../dist/apps/eog-3d/workspace-page.js";

test("EOG 3D Viewer installs as a neutral spatial Workspace", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog3dPackage,
      hostEnterpriseContextProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-03T06:00:00.000Z")
  );

  manager.install(EOG_3D_PACKAGE_ID);
  const viewer = manager.listEffectiveExperiences().find(
    item => item.experienceId === EOG_3D_VIEWER_EXPERIENCE_ID
  );

  assert.ok(viewer);
  assert.equal(viewer.packageId, EOG_3D_PACKAGE_ID);
  assert.equal(viewer.featureId, EOG_3D_VIEWER_FEATURE_ID);
  assert.equal(viewer.defaultRoute, EOG_3D_VIEWER_ROUTE);
  assert.equal(
    (viewer.routes ?? []).some(route => route.path.includes("/observe")),
    false
  );
});

test("3D Viewer read handler is owned by EOG 3D, not Observatory", () => {
  const handler = createEnterpriseOperatingGraph3dViewerReadActionV010({
    graphService: {},
    viewService: {}
  });
  assert.equal(handler.packageId, EOG_3D_PACKAGE_ID);
  assert.equal(handler.featureId, EOG_3D_VIEWER_FEATURE_ID);
});

test("legacy 3D package identity is a compatibility alias", () => {
  assert.equal(EOG_3D_VIEWER_PACKAGE_ID, EOG_3D_PACKAGE_ID);
  assert.equal(eog3dViewerPackage, eog3dPackage);
});
