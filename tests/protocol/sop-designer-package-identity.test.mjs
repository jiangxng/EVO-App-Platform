import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  SOP_DESIGNER_CAPABILITY,
  SOP_DESIGNER_FEATURE_ID,
  SOP_DESIGNER_PACKAGE_ID,
  sopDesignerPackage
} from "../../dist/apps/sop-designer/package.js";

test("SOP Designer has a concrete default-OFF peer-plugin identity", () => {
  assert.equal(SOP_DESIGNER_PACKAGE_ID, "evo-sop-designer");
  assert.equal(SOP_DESIGNER_FEATURE_ID, "evo-sop-designer.default");
  assert.equal(sopDesignerPackage.packageId, SOP_DESIGNER_PACKAGE_ID);
  assert.equal(sopDesignerPackage.type, "APPLICATION");

  const feature = sopDesignerPackage.features[0];
  assert.equal(feature.featureId, SOP_DESIGNER_FEATURE_ID);
  assert.equal(feature.defaultActivation, false);
  assert.equal(
    feature.requiresCapabilities?.includes(
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ),
    true
  );
  assert.equal(
    feature.requiresCapabilities?.includes("authorization.check"),
    true
  );
  assert.deepEqual(feature.providesCapabilities, [SOP_DESIGNER_CAPABILITY]);
  assert.equal(
    (feature.contributions ?? []).some(item => item.kind === "eidos.experience"),
    false
  );
});

test("SOP Designer identity is catalog-discoverable without activating implementation", () => {
  const catalog = createPackageCatalog([sopDesignerPackage]);
  assert.deepEqual(
    catalog.findCapabilityProviders(SOP_DESIGNER_CAPABILITY),
    [{
      packageId: SOP_DESIGNER_PACKAGE_ID,
      featureId: SOP_DESIGNER_FEATURE_ID
    }]
  );
});

test("SOP Designer package scaffold does not depend on EOG application private implementation", async () => {
  const source = await readFile("apps/sop-designer/package.ts", "utf8");
  assert.equal(source.includes("../eog-2d-designer/"), false);
  assert.equal(source.includes("../eog-2d-viewer/"), false);
  assert.equal(source.includes("../eog-3d-viewer/"), false);
});
