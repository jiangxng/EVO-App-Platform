import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagramSnapTranslationV010, diagramGridStepV010 } from "../../dist/vendor/eidos/src/diagram/snapping.js";

const moving = [{ id: "moving", x: 10, y: 20, width: 20, height: 10 }];
const targets = [{ id: "target", x: 50, y: 80, width: 20, height: 10 }];

test("snaps group anchors and draws target guide positions without mutating input", () => {
  const input = structuredClone(moving);
  const fixed = structuredClone(targets);
  const result = diagramSnapTranslationV010(moving, targets, 39, 59,
    { scale: 1, alignToNodes: true, snapToGrid: false });
  assert.deepEqual(result, {
    dx: 40, dy: 60, guideX: 50, guideY: 80, snapX: "node", snapY: "node"
  });
  assert.deepEqual(moving, input);
  assert.deepEqual(targets, fixed);
});

test("6 CSS px tolerance is preserved through 10% and 300% zoom", () => {
  const rect = [{ id: "a", x: 0, y: 0, width: 20, height: 10 }];
  const other = [{ id: "b", x: 100, y: 0, width: 20, height: 10 }];
  // At 300%, 3 world units are 9 screen pixels and cannot snap.
  const zoomIn = diagramSnapTranslationV010(rect, other, 77, 0,
    { scale: 3, alignToNodes: true });
  assert.equal(zoomIn.dx, 77);
  // At 10%, a correction of 30 world units is 3 screen pixels and can snap.
  const zoomOut = diagramSnapTranslationV010(rect, other, 50, 0,
    { scale: .1, alignToNodes: true });
  assert.equal(zoomOut.dx, 80);
  assert.equal(zoomOut.guideX, 100);
});

test("multiple selected nodes preserve their exact rigid relative spacing", () => {
  const group = [
    { id: "a", x: 0, y: 0, width: 20, height: 20 },
    { id: "b", x: 40, y: 0, width: 20, height: 20 }
  ];
  const result = diagramSnapTranslationV010(group, [
    ...group,
    { id: "target", x: 100, y: 80, width: 20, height: 20 }
  ], 39, 59, { scale: 1, alignToNodes: true });
  assert.equal(result.dx, 40);
  assert.equal(result.dy, 60);
  const next = group.map(p => ({ x: p.x + result.dx, y: p.y + result.dy }));
  assert.deepEqual(next, [{ x: 40, y: 60 }, { x: 80, y: 60 }]);
});

test("grid display, grid snap, node alignment are independent", () => {
  const rect = [{ id: "x", x: 22, y: 31, width: 0, height: 0 }];
  const off = diagramSnapTranslationV010(rect, [], 0, 0,
    { scale: 1, alignToNodes: false, snapToGrid: false });
  assert.equal(off.dx, 0);
  assert.equal(off.dy, 0);
  const grid = diagramSnapTranslationV010(rect, [], 0, 0,
    { scale: 1, alignToNodes: false, snapToGrid: true, gridSize: 24 });
  assert.equal(grid.dx, 2);
  assert.equal(grid.dy, 0);
  assert.equal(grid.snapX, "grid");
  assert.equal(grid.guideX, undefined);
  const alignWithoutGrid = diagramSnapTranslationV010(rect, [
    { id: "b", x: 26, y: 31, width: 0, height: 0 }
  ], 0, 0, { scale: 1, alignToNodes: true, snapToGrid: false });
  assert.equal(alignWithoutGrid.dx, 4);
  assert.equal(alignWithoutGrid.snapX, "node");
});

test("target ordering never changes deterministic tie-breaking", () => {
  const origin = [{ id: "moving", x: 50, y: 0, width: 0, height: 0 }];
  const a = { id: "a", x: 46, y: 0, width: 0, height: 0 };
  const b = { id: "b", x: 54, y: 0, width: 0, height: 0 };
  const opts = { scale: 1, alignToNodes: true };
  const first = diagramSnapTranslationV010(origin, [a, b], 0, 0, opts);
  const second = diagramSnapTranslationV010(origin, [b, a], 0, 0, opts);
  assert.deepEqual(first, second);
  assert.equal(first.guideX, 46);
});

test("malformed scale, invalid rectangles and non-finite movement fail closed", () => {
  assert.throws(() => diagramSnapTranslationV010(moving, targets, NaN, 0, { scale: 1 }),
    /EIDOS_DIAGRAM_SNAP_INPUT_INVALID/);
  assert.throws(() => diagramSnapTranslationV010(moving, targets, 0, 0, { scale: 0 }),
    /EIDOS_DIAGRAM_SNAP_INPUT_INVALID/);
  assert.throws(() => diagramSnapTranslationV010(
    [{ id: "bad", x: 0, y: 0, width: -1, height: 1 }], targets, 0, 0, { scale: 1 }),
    /EIDOS_DIAGRAM_SNAP_INPUT_INVALID/);
});

test("on-canvas guides are transient and touch cancellation clears the overlay", async () => {
  const surface = await readFile(
    new URL("../../vendor/eidos/src/diagram/surface.ts", import.meta.url), "utf8"
  );
  assert.match(surface, /data-eidos-diagram-snap-guides/);
  assert.match(surface, /drawSnapGuides\(\);[\s\S]*?suppressNextNodeClick = true/);
  assert.match(surface, /screenDeltaX \/ camera.scale/);
  assert.match(surface, /movingRects, stationaryRects/);
  assert.match(surface, /data-eidos-diagram-snap-mode/);
  assert.match(surface, /renderContextNavigationV010/);
});

test("world grid step expands at low zoom instead of rendering dense subpixel lines", () => {
  assert.equal(diagramGridStepV010(.1), 192);
  assert.equal(diagramGridStepV010(.25), 48);
  assert.equal(diagramGridStepV010(1), 24);
  assert.equal(diagramGridStepV010(3), 24);
  assert.throws(() => diagramGridStepV010(0), /EIDOS_DIAGRAM_GRID_SCALE_INVALID/);
  const snap = diagramSnapTranslationV010([{ id: "p", x: 172, y: 0, width: 0, height: 0 }],
    [], 0, 0, { scale: .1, snapToGrid: true });
  assert.equal(snap.dx, 20);
});
