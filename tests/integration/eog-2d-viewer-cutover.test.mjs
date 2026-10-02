import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  EOG_2D_VIEWER_EXPERIENCE_ID,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_MOBILE_ROUTE,
  EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_ROUTE,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  createEnterpriseOperatingGraphObservatoryActionHandlersV020
} from "../../dist/manager/enterprise-operating-graph-observatory-actions.js";
import {
  createEnterpriseOperatingGraphObservatoryExperienceManifestV020,
  createEnterpriseOperatingGraphObservatoryViewActionHandlerV020
} from "../../dist/manager/enterprise-operating-graph-observatory-page.js";
import {
  createEnterpriseOperatingGraphMobileReadActionHandlerV010
} from "../../dist/manager/enterprise-operating-graph-mobile-read-page.js";

test("EOG 2D Viewer installs with Enterprise Context definition authority and owns one desktop/mobile Experience", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog2dViewerPackage,
      hostEnterpriseContextProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-02T04:30:00.000Z")
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

  const routes = experiences.flatMap(item => item.routes ?? []);
  assert.equal(routes.filter(route => route.path === EOG_2D_VIEWER_ROUTE).length, 1);
  assert.equal(
    routes.filter(route => route.path === EOG_2D_VIEWER_MOBILE_ROUTE).length,
    1
  );
});

test("EOG 2D Viewer read/orchestration handlers are gated by the dedicated Viewer feature", () => {
  const graphService = {};
  const viewService = {};
  const providers = {};

  const handlers = [
    ...createEnterpriseOperatingGraphObservatoryActionHandlersV020({
      graphService,
      providers
    }),
    createEnterpriseOperatingGraphObservatoryViewActionHandlerV020({
      graphService,
      viewService,
      providers
    }),
    createEnterpriseOperatingGraphMobileReadActionHandlerV010({
      graphService,
      providers
    })
  ];

  assert.ok(handlers.length > 0);
  assert.equal(
    handlers.every(item => item.packageId === EOG_2D_VIEWER_PACKAGE_ID),
    true
  );
  assert.equal(
    handlers.every(item => item.featureId === EOG_2D_VIEWER_FEATURE_ID),
    true
  );
});

test("legacy 2D Observatory manifest helper no longer assigns Viewer ownership to Enterprise Agent", () => {
  const manifest = createEnterpriseOperatingGraphObservatoryExperienceManifestV020();
  assert.equal(manifest.packageId, EOG_2D_VIEWER_PACKAGE_ID);
  assert.equal(manifest.featureId, EOG_2D_VIEWER_FEATURE_ID);
});
