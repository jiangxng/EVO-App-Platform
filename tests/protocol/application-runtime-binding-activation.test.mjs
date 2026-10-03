import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  APPLICATION_RUNTIME_BINDING_FEATURE_ID,
  APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
  applicationRuntimeBindingProviderPackage
} from "../../dist/providers/application-runtime-binding/package.js";

test("installing Runtime Binding Provider activates its sole provider feature", () => {
  const manager = createAppManagerService(
    createPackageCatalog([applicationRuntimeBindingProviderPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-03T12:00:00.000Z")
  );
  manager.install(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);
  assert.equal(
    manager.getSnapshot().activeFeatures.some(
      item => item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID
    ),
    true
  );
});
