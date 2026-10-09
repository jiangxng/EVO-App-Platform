import test from "node:test";
import assert from "node:assert/strict";
import { assertTemplateProjectionGalleryV010 } from "../../dist/contracts/template-projection-gallery.js";
import { applyDefinitionProjectionV010 } from "../../dist/eog/definition-projection.js";
import { projectReadOnly2dArtifactStateV010 } from "../../dist/apps/eog-2d-viewer/template-preview.js";
import { validateDiagramEditorStateV010 } from "../../dist/vendor/eidos/src/diagram/surface.js";

const diagram = {
  contractVersion: "0.1.0",
  nodes: [
    { id: "a", kind: "application", label: "Order", x: -100, y: 0, width: 180, height: 72 },
    { id: "b", kind: "ledger", label: "Receivable", x: 300, y: 100, width: 180, height: 72 }
  ],
  edges: [{ id: "relation-a", source: "a", target: "b", kind: "posting", arrow: "end" }]
};
function gallery(edgePaths) {
  return {
    contractVersion: "0.1.0",
    primaryProjectionId: "projection:one",
    projections: [{
      projectionId: "projection:one",
      title: "Graph",
      thumbnail: { src: "data:image/svg+xml,A", alt: "Graph" },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D",
        ...(edgePaths === undefined ? {} : { edgePaths })
      }
    }]
  };
}

test("legacy projection stays straight and new display paths reach the Viewer unchanged", () => {
  const legacy = applyDefinitionProjectionV010({ diagram, gallery: gallery() });
  assert.equal(legacy.diagram2d.edges[0].pathKind, undefined);
  const projection = applyDefinitionProjectionV010({
    diagram,
    gallery: gallery([{ edgeId: "relation-a", pathKind: "curve" }])
  });
  assert.equal(projection.diagram2d.edges[0].pathKind, "curve");
  const readOnly = projectReadOnly2dArtifactStateV010({
    resourceId: "graph:read",
    revision: 1,
    lifecycleState: "PUBLISHED",
    title: "Graph",
    diagram2d: projection.diagram2d,
    notice: "Ready"
  });
  assert.equal(readOnly.edges[0].pathKind, "curve");
  assert.equal(readOnly.edges[0].arrow, "end");
  assert.equal(readOnly.edges[0].source, "a");
  assert.equal(readOnly.edges[0].target, "b");
  assert.equal(validateDiagramEditorStateV010(readOnly).ok, true);
});

test("projection schema rejects unknown route enums and duplicated edge overrides", () => {
  assert.throws(
    () => assertTemplateProjectionGalleryV010(gallery([{ edgeId: "relation-a", pathKind: "executable" }])),
    /EDGE_PATH_INVALID/
  );
  assert.throws(
    () => assertTemplateProjectionGalleryV010(gallery([
      { edgeId: "relation-a", pathKind: "straight" },
      { edgeId: "relation-a", pathKind: "curve" }
    ])),
    /EDGE_PATH_INVALID/
  );
  assert.deepEqual(
    assertTemplateProjectionGalleryV010(gallery()).projections[0].view.edgePaths,
    undefined
  );
});
