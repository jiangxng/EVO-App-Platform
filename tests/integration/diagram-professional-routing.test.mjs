import test from "node:test";
import assert from "node:assert/strict";
import { diagramEdgeGeometryV010 } from "../../dist/vendor/eidos/src/diagram/edge-paths.js";
import { diagramParallelLaneOffsetsV010, diagramSelfLoopGeometryV010 } from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";
import { routeDiagramOrthogonalV010 } from "../../dist/vendor/eidos/src/diagram/obstacle-routing.js";

test("vendored 2D obstacle routing matches the newly integrated Eidos capability", () => {
  const start = { x: 0, y: 0 };
  const end = { x: 280, y: 0 };
  const obstacle = { x: 120, y: -40, width: 40, height: 80 };
  const route = routeDiagramOrthogonalV010(start, end, [obstacle]);
  assert.ok(route);
  assert.ok(route.some(p => Math.abs(p.y) >= 54));
  const straight = diagramEdgeGeometryV010(start, end, "straight", { obstacles: [obstacle] });
  const orthogonal = diagramEdgeGeometryV010(start, end, "orthogonal", { obstacles: [obstacle] });
  const rounded = diagramEdgeGeometryV010(start, end, "rounded-orthogonal", { obstacles: [obstacle] });
  assert.notEqual(orthogonal.d, straight.d);
  assert.equal(orthogonal.congested, undefined);
  assert.match(rounded.d, / Q /);
  assert.equal(diagramEdgeGeometryV010(start, end).kind, "straight");
});

test("vendored 2D parallel edges and self-relations have stable non-degenerate geometry", () => {
  const list = [{ id: "a", source: "left", target: "right" },
    { id: "b", source: "right", target: "left" }];
  const offsets = diagramParallelLaneOffsetsV010(list);
  assert.notEqual(offsets.get("a"), offsets.get("b"));
  const loop = diagramSelfLoopGeometryV010({ x: 0, y: 0, width: 150, height: 72 }, "rounded-orthogonal");
  assert.match(loop.d, / Q /);
  assert.ok(loop.label.x > 150);
});

test("vendor navigation and style integration keeps the App Host-specific context navigation seam", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL(
    "../../vendor/eidos/src/diagram/surface.ts", import.meta.url
  ), "utf8");
  assert.match(source, /renderContextNavigationV010/);
  assert.match(source, /diagramParallelLaneOffsetsV010/);
  assert.match(source, /data-eidos-diagram-route-congested/);
});
