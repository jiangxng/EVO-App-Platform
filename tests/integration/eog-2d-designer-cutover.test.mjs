import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  EOG_2D_DESIGNER_EXPERIENCE_ID,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID,
  EOG_2D_DESIGNER_ROUTE,
  eog2dDesignerPackage
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createMemoryEnterpriseOperatingGraphViewStoreV010
} from "../../dist/manager/enterprise-operating-graph-view-store.js";
import {
  createEnterpriseOperatingGraphViewHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-view-service.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010
} from "../../dist/manager/enterprise-operating-graph-actions.js";
import {
  createEnterpriseOperatingGraphExperienceManifestV010,
  createEnterpriseOperatingGraphViewActionHandlersV010
} from "../../dist/manager/enterprise-operating-graph-page.js";

test("EOG 2D Designer installs with definition and authorization dependencies and becomes the effective Experience owner", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      eog2dDesignerPackage,
      hostEnterpriseContextProviderPackage,
      hostStaticAuthorizationProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-02T04:00:00.000Z")
  );

  manager.install(EOG_2D_DESIGNER_PACKAGE_ID);

  const snapshot = manager.getSnapshot();
  assert.equal(
    snapshot.activeFeatures.some(
      item => item.featureId === EOG_2D_DESIGNER_FEATURE_ID
    ),
    true
  );

  const experiences = manager.listEffectiveExperiences();
  const designer = experiences.find(
    item => item.experienceId === EOG_2D_DESIGNER_EXPERIENCE_ID
  );
  assert.ok(designer);
  assert.equal(designer.packageId, EOG_2D_DESIGNER_PACKAGE_ID);
  assert.equal(designer.featureId, EOG_2D_DESIGNER_FEATURE_ID);
  assert.equal(designer.defaultRoute, EOG_2D_DESIGNER_ROUTE);
  assert.equal(
    experiences.flatMap(item => item.routes ?? [])
      .filter(route => route.path === EOG_2D_DESIGNER_ROUTE).length,
    1
  );
});

test("EOG 2D semantic and diagram action handlers are gated by the dedicated Designer feature", () => {
  let serial = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial),
    now: () => new Date("2026-10-02T04:00:00.000Z")
  });
  const viewService = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010(),
    now: () => new Date("2026-10-02T04:00:00.000Z")
  });
  const authorization = {
    contractVersion: "0.1.0",
    providerId: "test.allow",
    capability: "authorization.check",
    check(request) {
      return {
        contractVersion: "0.1.0",
        allowed: true,
        policyProviderId: "test.allow",
        reasonCodes: ["TEST_ALLOW"],
        request
      };
    }
  };

  const handlers = [
    ...createEnterpriseOperatingGraphActionHandlersV010({
      service,
      resolveAuthorizationProvider: () => authorization
    }),
    ...createEnterpriseOperatingGraphViewActionHandlersV010({
      service,
      viewService,
      resolveAuthorizationProvider: () => authorization
    })
  ];

  assert.ok(handlers.length > 0);
  assert.equal(
    handlers.every(item => item.packageId === EOG_2D_DESIGNER_PACKAGE_ID),
    true
  );
  assert.equal(
    handlers.every(item => item.featureId === EOG_2D_DESIGNER_FEATURE_ID),
    true
  );
});

test("legacy Designer manifest helper no longer assigns EOG Experience ownership to Enterprise Agent", () => {
  const manifest = createEnterpriseOperatingGraphExperienceManifestV010();
  assert.equal(manifest.packageId, EOG_2D_DESIGNER_PACKAGE_ID);
  assert.equal(manifest.featureId, EOG_2D_DESIGNER_FEATURE_ID);
});
