import test from "node:test";
import assert from "node:assert/strict";

import {
  EOG_2D_DESIGNER_WORKSPACE_CAPABILITIES_V010,
  EOG_2D_VIEWER_WORKSPACE_CAPABILITIES_V010
} from "../../dist/eog/2d-workspace-capabilities.js";

test("2D Viewer is interactive while remaining semantically non-mutating", () => {
  const viewer = EOG_2D_VIEWER_WORKSPACE_CAPABILITIES_V010;

  assert.equal(viewer.inspectNode, true);
  assert.equal(viewer.inspectEdge, true);
  assert.equal(viewer.navigate, true);
  assert.equal(viewer.panZoomFocus, true);
  assert.equal(viewer.overlays, true);

  assert.equal(viewer.editNodeSemanticProperties, false);
  assert.equal(viewer.editEdgeSemanticProperties, false);
  assert.equal(viewer.createRemoveNodes, false);
  assert.equal(viewer.createRemoveReconnectRelations, false);
  assert.equal(viewer.confirmPublishDefinition, false);
});

test("2D Designer is a capability superset of Viewer interaction", () => {
  const viewer = EOG_2D_VIEWER_WORKSPACE_CAPABILITIES_V010;
  const designer = EOG_2D_DESIGNER_WORKSPACE_CAPABILITIES_V010;

  for (const key of [
    "inspectNode",
    "inspectEdge",
    "navigate",
    "panZoomFocus",
    "overlays"
  ]) {
    assert.equal(designer[key], viewer[key]);
  }

  assert.equal(designer.editNodeSemanticProperties, true);
  assert.equal(designer.editEdgeSemanticProperties, true);
  assert.equal(designer.createRemoveNodes, true);
  assert.equal(designer.createRemoveReconnectRelations, true);
  assert.equal(designer.confirmPublishDefinition, true);
});
