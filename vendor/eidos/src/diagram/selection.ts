/** World-coordinate rectangle intersection for the 2D Designer selection tool. */
export interface DiagramSelectionRectV010 {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramSelectableNodeV010 extends DiagramSelectionRectV010 {
  id: string;
}

export function diagramNodesIntersectingRectV010(
  nodes: readonly DiagramSelectableNodeV010[],
  rect: DiagramSelectionRectV010
): string[] {
  const x0 = Math.min(rect.x, rect.x + rect.width);
  const x1 = Math.max(rect.x, rect.x + rect.width);
  const y0 = Math.min(rect.y, rect.y + rect.height);
  const y1 = Math.max(rect.y, rect.y + rect.height);
  if (![x0, x1, y0, y1].every(Number.isFinite)) {
    throw new Error("EIDOS_DIAGRAM_SELECTION_RECT_INVALID");
  }
  return nodes.filter(node =>
    [node.x, node.y, node.width, node.height].every(Number.isFinite)
    && node.width > 0 && node.height > 0
    && node.x <= x1 && node.x + node.width >= x0
    && node.y <= y1 && node.y + node.height >= y0
  ).map(node => node.id);
}
