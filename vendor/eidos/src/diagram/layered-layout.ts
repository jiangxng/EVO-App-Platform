export interface LayeredLayoutNodeV010 {
  id: string;
  width: number;
  height: number;
}

export interface LayeredLayoutEdgeV010 {
  id: string;
  source: string;
  target: string;
}

export interface LayeredLayoutOptionsV010 {
  direction?: "RIGHT" | "DOWN";
  layerGap?: number;
  nodeGap?: number;
  componentGap?: number;
  padding?: number;
  crossingMinimizationSweeps?: number;
}

export interface LayeredLayoutPlacementV010 {
  nodeId: string;
  x: number;
  y: number;
}

export interface LayeredLayoutResultV010 {
  placements: LayeredLayoutPlacementV010[];
  width: number;
  height: number;
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sorted<T>(values: Iterable<T>, key: (value: T) => string): T[] {
  return [...values].sort((a, b) => key(a).localeCompare(key(b)));
}

function weakComponents(
  nodeIds: readonly string[],
  edges: readonly LayeredLayoutEdgeV010[]
): string[][] {
  const neighbors = new Map(nodeIds.map(id => [id, new Set<string>()] as const));
  for (const edge of edges) {
    if (!neighbors.has(edge.source) || !neighbors.has(edge.target)) continue;
    neighbors.get(edge.source)!.add(edge.target);
    neighbors.get(edge.target)!.add(edge.source);
  }

  const remaining = new Set(nodeIds);
  const components: string[][] = [];
  while (remaining.size > 0) {
    const start = sorted(remaining, value => value)[0]!;
    const queue = [start];
    const component: string[] = [];
    remaining.delete(start);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]!;
      component.push(current);
      for (const next of sorted(neighbors.get(current) ?? [], value => value)) {
        if (!remaining.delete(next)) continue;
        queue.push(next);
      }
    }
    component.sort((a, b) => a.localeCompare(b));
    components.push(component);
  }
  return components;
}

/**
 * Deterministic greedy cycle breaking inspired by the first phase of
 * Sugiyama-style layered layout. The returned order is then used to treat
 * backward edges as feedback edges during layer assignment.
 */
function cycleBreakingOrder(
  nodeIds: readonly string[],
  edges: readonly LayeredLayoutEdgeV010[]
): string[] {
  const active = new Set(nodeIds);
  const left: string[] = [];
  const right: string[] = [];

  const degree = (id: string) => {
    let incoming = 0;
    let outgoing = 0;
    for (const edge of edges) {
      if (!active.has(edge.source) || !active.has(edge.target)) continue;
      if (edge.source === edge.target) continue;
      if (edge.source === id) outgoing += 1;
      if (edge.target === id) incoming += 1;
    }
    return { incoming, outgoing };
  };

  while (active.size > 0) {
    const candidates = sorted(active, value => value);
    const sink = candidates.find(id => degree(id).outgoing === 0);
    if (sink) {
      active.delete(sink);
      right.push(sink);
      continue;
    }

    const source = candidates.find(id => degree(id).incoming === 0);
    if (source) {
      active.delete(source);
      left.push(source);
      continue;
    }

    let best = candidates[0]!;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const id of candidates) {
      const current = degree(id);
      const score = current.outgoing - current.incoming;
      if (score > bestScore || (score === bestScore && id.localeCompare(best) < 0)) {
        best = id;
        bestScore = score;
      }
    }
    active.delete(best);
    left.push(best);
  }

  return [...left, ...right.reverse()];
}

function reorderLayer(
  layer: string[],
  neighborIds: (id: string) => string[],
  layerByNode: Map<string, number>,
  orderByLayer: Map<number, Map<string, number>>
): string[] {
  const previousOrder = new Map(layer.map((id, index) => [id, index] as const));
  return [...layer].sort((a, b) => {
    const score = (id: string): number | undefined => {
      const positions = neighborIds(id)
        .map(neighborId => {
          const neighborLayer = layerByNode.get(neighborId);
          return neighborLayer === undefined
            ? undefined
            : orderByLayer.get(neighborLayer)?.get(neighborId);
        })
        .filter((value): value is number => value !== undefined);
      if (positions.length === 0) return undefined;
      return positions.reduce((sum, value) => sum + value, 0) / positions.length;
    };
    const aScore = score(a);
    const bScore = score(b);
    if (aScore !== undefined && bScore !== undefined && aScore !== bScore) {
      return aScore - bScore;
    }
    if (aScore !== undefined && bScore === undefined) return -1;
    if (aScore === undefined && bScore !== undefined) return 1;
    return (previousOrder.get(a) ?? 0) - (previousOrder.get(b) ?? 0)
      || a.localeCompare(b);
  });
}

function layoutConnectedComponent(input: {
  nodeIds: string[];
  nodesById: Map<string, LayeredLayoutNodeV010>;
  edges: LayeredLayoutEdgeV010[];
  layerGap: number;
  nodeGap: number;
  sweeps: number;
}): LayeredLayoutResultV010 {
  const sequence = cycleBreakingOrder(input.nodeIds, input.edges);
  const sequenceIndex = new Map(
    sequence.map((id, index) => [id, index] as const)
  );

  const forwardEdges = input.edges.filter(edge =>
    edge.source !== edge.target
    && (sequenceIndex.get(edge.source) ?? 0) < (sequenceIndex.get(edge.target) ?? 0)
  );

  const level = new Map(input.nodeIds.map(id => [id, 0] as const));
  for (const id of sequence) {
    const sourceLevel = level.get(id) ?? 0;
    for (const edge of forwardEdges) {
      if (edge.source !== id) continue;
      level.set(
        edge.target,
        Math.max(level.get(edge.target) ?? 0, sourceLevel + 1)
      );
    }
  }

  const maxLevel = Math.max(0, ...level.values());
  const layers = new Map<number, string[]>();
  for (let index = 0; index <= maxLevel; index += 1) layers.set(index, []);
  for (const id of sequence) {
    layers.get(level.get(id) ?? 0)!.push(id);
  }

  const incoming = new Map(input.nodeIds.map(id => [id, [] as string[]] as const));
  const outgoing = new Map(input.nodeIds.map(id => [id, [] as string[]] as const));
  for (const edge of forwardEdges) {
    incoming.get(edge.target)?.push(edge.source);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const refreshOrder = () => new Map(
    [...layers.entries()].map(([layerIndex, ids]) => [
      layerIndex,
      new Map(ids.map((id, index) => [id, index] as const))
    ] as const)
  );

  for (let sweep = 0; sweep < input.sweeps; sweep += 1) {
    let orderByLayer = refreshOrder();
    for (let layerIndex = 1; layerIndex <= maxLevel; layerIndex += 1) {
      layers.set(
        layerIndex,
        reorderLayer(
          layers.get(layerIndex) ?? [],
          id => incoming.get(id) ?? [],
          level,
          orderByLayer
        )
      );
      orderByLayer = refreshOrder();
    }

    orderByLayer = refreshOrder();
    for (let layerIndex = maxLevel - 1; layerIndex >= 0; layerIndex -= 1) {
      layers.set(
        layerIndex,
        reorderLayer(
          layers.get(layerIndex) ?? [],
          id => outgoing.get(id) ?? [],
          level,
          orderByLayer
        )
      );
      orderByLayer = refreshOrder();
    }
  }

  const layerWidths = new Map<number, number>();
  const layerHeights = new Map<number, number>();
  for (let layerIndex = 0; layerIndex <= maxLevel; layerIndex += 1) {
    const ids = layers.get(layerIndex) ?? [];
    const widths = ids.map(id => input.nodesById.get(id)?.width ?? 140);
    const heights = ids.map(id => input.nodesById.get(id)?.height ?? 64);
    layerWidths.set(layerIndex, Math.max(0, ...widths));
    layerHeights.set(
      layerIndex,
      heights.reduce((sum, value) => sum + value, 0)
        + Math.max(0, ids.length - 1) * input.nodeGap
    );
  }

  const maxHeight = Math.max(0, ...layerHeights.values());
  const xByLayer = new Map<number, number>();
  let x = 0;
  for (let layerIndex = 0; layerIndex <= maxLevel; layerIndex += 1) {
    xByLayer.set(layerIndex, x);
    x += (layerWidths.get(layerIndex) ?? 0) + input.layerGap;
  }

  const placements: LayeredLayoutPlacementV010[] = [];
  for (let layerIndex = 0; layerIndex <= maxLevel; layerIndex += 1) {
    const ids = layers.get(layerIndex) ?? [];
    let y = (maxHeight - (layerHeights.get(layerIndex) ?? 0)) / 2;
    for (const id of ids) {
      const node = input.nodesById.get(id)!;
      placements.push({
        nodeId: id,
        x: xByLayer.get(layerIndex) ?? 0,
        y
      });
      y += node.height + input.nodeGap;
    }
  }

  const width = maxLevel < 0
    ? 0
    : (xByLayer.get(maxLevel) ?? 0) + (layerWidths.get(maxLevel) ?? 0);
  return {
    placements,
    width,
    height: maxHeight
  };
}

/**
 * Layered 2D layout for directed workflow/dependency diagrams.
 *
 * The pipeline intentionally follows the stable phases used by mature
 * hierarchical layout systems: cycle breaking, layer assignment, crossing
 * reduction by repeated barycenter sweeps, then deterministic node placement.
 * It is presentation-only and contains no business/domain semantics.
 */
export function layoutLayeredDiagramV010(input: {
  nodes: readonly LayeredLayoutNodeV010[];
  edges: readonly LayeredLayoutEdgeV010[];
  options?: LayeredLayoutOptionsV010;
}): LayeredLayoutResultV010 {
  const direction = input.options?.direction ?? "RIGHT";
  const layerGap = finitePositive(input.options?.layerGap ?? 96, 96);
  const nodeGap = finitePositive(input.options?.nodeGap ?? 40, 40);
  const componentGap = finitePositive(input.options?.componentGap ?? 112, 112);
  const padding = Math.max(0, input.options?.padding ?? 40);
  const sweeps = Math.max(
    1,
    Math.min(
      12,
      Math.trunc(input.options?.crossingMinimizationSweeps ?? 4)
    )
  );

  const nodesById = new Map<string, LayeredLayoutNodeV010>();
  for (const node of input.nodes) {
    if (!node.id.trim() || nodesById.has(node.id)) {
      throw new Error("EIDOS_LAYERED_LAYOUT_NODE_IDS_INVALID");
    }
    nodesById.set(node.id, {
      id: node.id,
      width: finitePositive(node.width, 140),
      height: finitePositive(node.height, 64)
    });
  }

  const edges = input.edges
    .filter(edge => nodesById.has(edge.source) && nodesById.has(edge.target))
    .map(edge => ({ ...edge }));

  if (nodesById.size === 0) {
    return { placements: [], width: 0, height: 0 };
  }

  const components = weakComponents([...nodesById.keys()], edges);
  const placements: LayeredLayoutPlacementV010[] = [];
  let crossOffset = padding;
  let mainExtent = 0;

  for (const nodeIds of components) {
    const nodeSet = new Set(nodeIds);
    const component = layoutConnectedComponent({
      nodeIds,
      nodesById,
      edges: edges.filter(edge =>
        nodeSet.has(edge.source) && nodeSet.has(edge.target)
      ),
      layerGap,
      nodeGap,
      sweeps
    });

    for (const placement of component.placements) {
      if (direction === "RIGHT") {
        placements.push({
          nodeId: placement.nodeId,
          x: placement.x + padding,
          y: placement.y + crossOffset
        });
      } else {
        placements.push({
          nodeId: placement.nodeId,
          x: placement.y + crossOffset,
          y: placement.x + padding
        });
      }
    }

    if (direction === "RIGHT") {
      crossOffset += component.height + componentGap;
      mainExtent = Math.max(mainExtent, component.width);
    } else {
      crossOffset += component.height + componentGap;
      mainExtent = Math.max(mainExtent, component.width);
    }
  }

  const crossExtent = Math.max(
    padding * 2,
    crossOffset - componentGap + padding
  );

  return direction === "RIGHT"
    ? {
        placements,
        width: mainExtent + padding * 2,
        height: crossExtent
      }
    : {
        placements,
        width: crossExtent,
        height: mainExtent + padding * 2
      };
}
