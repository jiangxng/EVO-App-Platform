import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  EOG_3D_VIEWER_EXPERIENCE_ID,
  EOG_3D_VIEWER_FEATURE_ID,
  EOG_3D_VIEWER_PACKAGE_ID,
  EOG_3D_VIEWER_ROUTE,
  eog3dViewerPackage
} from "../../dist/apps/eog-3d-viewer/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020,
  createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020
} from "../../dist/manager/enterprise-operating-graph-spatial-observatory-page.js";

test("EOG 3D Viewer installs with Enterprise Context definition authority and owns one spatial Experience", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog3dViewerPackage,
      hostEnterpriseContextProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-02T05:00:00.000Z")
  );

  manager.install(EOG_3D_VIEWER_PACKAGE_ID);

  const snapshot = manager.getSnapshot();
  assert.equal(
    snapshot.activeFeatures.some(
      item => item.featureId === EOG_3D_VIEWER_FEATURE_ID
    ),
    true
  );

  const experiences = manager.listEffectiveExperiences();
  const viewer = experiences.find(
    item => item.experienceId === EOG_3D_VIEWER_EXPERIENCE_ID
  );
  assert.ok(viewer);
  assert.equal(viewer.packageId, EOG_3D_VIEWER_PACKAGE_ID);
  assert.equal(viewer.featureId, EOG_3D_VIEWER_FEATURE_ID);
  assert.equal(viewer.defaultRoute, EOG_3D_VIEWER_ROUTE);
  assert.equal(
    experiences.flatMap(item => item.routes ?? [])
      .filter(route => route.path === EOG_3D_VIEWER_ROUTE).length,
    1
  );
});

test("EOG 3D spatial read handler is gated by the dedicated 3D Viewer feature", () => {
  const handler = createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020({
    graphService: {},
    viewService: {},
    providers: {}
  });
  assert.equal(handler.packageId, EOG_3D_VIEWER_PACKAGE_ID);
  assert.equal(handler.featureId, EOG_3D_VIEWER_FEATURE_ID);
});

test("legacy spatial Viewer manifest helper no longer assigns ownership to Enterprise Agent", () => {
  const manifest = createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020();
  assert.equal(manifest.packageId, EOG_3D_VIEWER_PACKAGE_ID);
  assert.equal(manifest.featureId, EOG_3D_VIEWER_FEATURE_ID);
});
