import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  EOG_2D_VIEWER_EXPERIENCE_ID,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_WORKSPACE_ROUTE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";

test("EOG 2D Viewer is the interactive Workspace feature inside the unified 2D package", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog2dViewerPackage,
      hostEnterpriseContextProviderPackage,
      hostStaticAuthorizationProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-03T05:00:00.000Z")
  );

  manager.install(EOG_2D_VIEWER_PACKAGE_ID);

  const snapshot = manager.getSnapshot();
  assert.equal(
    snapshot.activeFeatures.some(
      item => item.featureId === EOG_2D_VIEWER_FEATURE_ID
    ),
    true
  );

  const experiences = manager.listEffectiveExperiences();
  const viewer = experiences.find(
    item => item.experienceId === EOG_2D_VIEWER_EXPERIENCE_ID
  );
  assert.ok(viewer);
  assert.equal(viewer.packageId, EOG_2D_VIEWER_PACKAGE_ID);
  assert.equal(viewer.featureId, EOG_2D_VIEWER_FEATURE_ID);
  assert.equal(viewer.defaultRoute, EOG_2D_VIEWER_WORKSPACE_ROUTE);

  const routes = viewer.routes ?? [];
  assert.deepEqual(routes.map(route => route.path), [
    EOG_2D_VIEWER_WORKSPACE_ROUTE,
    EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
    EOG_2D_VIEWER_DEFINITION_PREVIEW_ROUTE
  ]);
  assert.equal(routes.some(route => route.path.includes("/observe")), false);
});
