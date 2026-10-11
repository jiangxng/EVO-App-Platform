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

test("explicit control points and fixed node anchors survive projection-to-Viewer roundtrip", () => {
  const original = [{edgeId:"relation-a",pathKind:"rounded-orthogonal",
    sourceAnchor:"right",targetAnchor:"left",
    waypoints:[{x:-30,y:160},{x:220,y:160}]}];
  const normalized = assertTemplateProjectionGalleryV010(gallery(original));
  assert.deepEqual(normalized.projections[0].view.edgePaths, original);
  const projected = applyDefinitionProjectionV010({diagram,gallery:normalized});
  const edge=projected.diagram2d.edges[0];
  assert.equal(edge.source,"a");
  assert.equal(edge.target,"b");
  assert.equal(edge.arrow,"end");
  assert.equal(edge.sourceAnchor,"right");
  assert.equal(edge.targetAnchor,"left");
  assert.deepEqual(edge.waypoints,original[0].waypoints);
  const viewer=projectReadOnly2dArtifactStateV010({
    resourceId:"graph:viewer",revision:1,lifecycleState:"PUBLISHED",title:"Graph",
    diagram2d:projected.diagram2d,notice:"Ready"
  });
  assert.deepEqual(viewer.edges[0].waypoints,original[0].waypoints);
  assert.equal(viewer.edges[0].sourceAnchor,"right");
  assert.equal(viewer.edges[0].targetAnchor,"left");
  assert.equal(validateDiagramEditorStateV010(viewer).ok,true);
});
test("invalid waypoint metadata is rejected, never silently lost or interpreted as business endpoints", () => {
  for(const bad of [
    {pathKind:"straight",waypoints:[{x:1,y:2}]},
    {pathKind:"curve",waypoints:[{x:Infinity,y:2}]},
    {pathKind:"curve",waypoints:[{x:1e10,y:2}]},
    {pathKind:"orthogonal",sourceAnchor:"inside"},
    {pathKind:"curve",waypoints:Array.from({length:25},(_,i)=>({x:i,y:i}))}
  ]){
    assert.throws(()=>assertTemplateProjectionGalleryV010(gallery([
      {edgeId:"relation-a",...bad}
    ])),/EDGE_PATH_INVALID/);
  }
});
