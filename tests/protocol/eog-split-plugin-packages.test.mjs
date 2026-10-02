import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  EOG_2D_DESIGNER_CAPABILITY,
  EOG_2D_DESIGNER_PACKAGE_ID,
  eog2dDesignerPackage
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  EOG_2D_VIEWER_CAPABILITY,
  EOG_2D_VIEWER_PACKAGE_ID,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";
import {
  EOG_3D_VIEWER_CAPABILITY,
  EOG_3D_VIEWER_PACKAGE_ID,
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

test("identity scaffold does not claim migrated Experience or service-provider ownership yet", () => {
  for (const pkg of packages) {
    const contributions = pkg.features[0].contributions ?? [];
    assert.equal(contributions.length, 0);
  }
});
