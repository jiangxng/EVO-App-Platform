import test from "node:test";
import assert from "node:assert/strict";

import {
  EOG_2D_PACKAGE_ID,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_VIEWER_CAPABILITY,
  EOG_2D_DESIGNER_CAPABILITY,
  eog2dPackage
} from "../../dist/apps/eog-2d/package.js";

test("EOG 2D is one Package with Viewer and Designer feature profiles", () => {
  assert.equal(eog2dPackage.packageId, EOG_2D_PACKAGE_ID);
  assert.equal(eog2dPackage.features.length, 2);

  const viewer = eog2dPackage.features.find(
    item => item.featureId === EOG_2D_VIEWER_FEATURE_ID
  );
  const designer = eog2dPackage.features.find(
    item => item.featureId === EOG_2D_DESIGNER_FEATURE_ID
  );

  assert.ok(viewer);
  assert.ok(designer);
  assert.deepEqual(
    viewer.providesCapabilities,
    [EOG_2D_VIEWER_CAPABILITY, "visual.viewer.2d"]
  );
  assert.deepEqual(designer.providesCapabilities, [EOG_2D_DESIGNER_CAPABILITY]);
  assert.equal(
    designer.requiresFeatures.includes(EOG_2D_VIEWER_FEATURE_ID),
    true
  );
  assert.equal(viewer.requiresCapabilities.includes("authorization.check"), false);
  assert.equal(designer.requiresCapabilities.includes("authorization.check"), true);

  assert.equal(
    viewer.contributions[0].manifest.packageId,
    EOG_2D_PACKAGE_ID
  );
  assert.equal(
    designer.contributions[0].manifest.packageId,
    EOG_2D_PACKAGE_ID
  );
});
