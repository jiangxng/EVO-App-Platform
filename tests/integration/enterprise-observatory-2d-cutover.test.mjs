import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  ENTERPRISE_OBSERVATORY_2D_EXPERIENCE_ID,
  ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_2D_ROUTE,
  ENTERPRISE_OBSERVATORY_MOBILE_ROUTE,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID,
  enterpriseObservatoryPackage
} from "../../dist/apps/enterprise-observatory/package.js";
import {
  eog2dPackage
} from "../../dist/apps/eog-2d/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";
import {
  createEnterpriseOperatingGraphObservatoryActionHandlersV020
} from "../../dist/apps/enterprise-observatory/observatory-actions.js";
import {
  createEnterpriseOperatingGraphObservatoryExperienceManifestV020,
  createEnterpriseOperatingGraphObservatoryViewActionHandlerV020
} from "../../dist/apps/enterprise-observatory/desktop-page.js";
import {
  createEnterpriseOperatingGraphMobileReadActionHandlerV010
} from "../../dist/apps/enterprise-observatory/mobile-read-page.js";

test("Enterprise Observatory is an independent peer package over EOG 2D Viewer", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      enterpriseObservatoryPackage,
      eog2dPackage,
      hostEnterpriseContextProviderPackage,
      hostStaticAuthorizationProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-03T05:00:00.000Z")
  );

  manager.install(ENTERPRISE_OBSERVATORY_PACKAGE_ID);

  const snapshot = manager.getSnapshot();
  assert.equal(
    snapshot.activeFeatures.some(
      item => item.featureId === ENTERPRISE_OBSERVATORY_2D_FEATURE_ID
    ),
    true
  );

  const observatory = manager.listEffectiveExperiences().find(
    item => item.experienceId === ENTERPRISE_OBSERVATORY_2D_EXPERIENCE_ID
  );
  assert.ok(observatory);
  assert.equal(observatory.packageId, ENTERPRISE_OBSERVATORY_PACKAGE_ID);
  assert.equal(observatory.featureId, ENTERPRISE_OBSERVATORY_2D_FEATURE_ID);
  assert.deepEqual(
    (observatory.routes ?? []).map(route => route.path),
    [ENTERPRISE_OBSERVATORY_2D_ROUTE, ENTERPRISE_OBSERVATORY_MOBILE_ROUTE]
  );
});

test("2D Observatory handlers are lifecycle-owned by the peer package", () => {
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
    handlers.every(item => item.packageId === ENTERPRISE_OBSERVATORY_PACKAGE_ID),
    true
  );
  assert.equal(
    handlers.every(item => item.featureId === ENTERPRISE_OBSERVATORY_2D_FEATURE_ID),
    true
  );
});

test("legacy Observatory manifest helper reports the peer package owner", () => {
  const manifest =
    createEnterpriseOperatingGraphObservatoryExperienceManifestV020();
  assert.equal(manifest.packageId, ENTERPRISE_OBSERVATORY_PACKAGE_ID);
  assert.equal(manifest.featureId, ENTERPRISE_OBSERVATORY_2D_FEATURE_ID);
});
