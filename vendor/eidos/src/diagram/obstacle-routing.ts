/** Deterministic presentation-only orthogonal obstacle router.
 * The caller supplies only unrelated, visible node bounds; the router never edits graph topology.
 * If a safe path cannot be found within the bounded search budget, it returns undefined.
 */
export interface DiagramRoutePointV010 { x: number; y: number }
export interface DiagramRouteObstacleV010 { x: number; y: number; width: number; height: number }

const EPS = 1e-7;
const MAX_RELEVANT_OBSTACLES = 22;
const MAX_GRID_POINTS = 2600;
const CLEARANCE = 14;
const TURN_PENALTY = 18;

interface Rect { l: number; t: number; r: number; b: number }

function finitePoint(p: DiagramRoutePointV010): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}

function segmentBlocked(a: DiagramRoutePointV010, b: DiagramRoutePointV010, rect: Rect): boolean {
  if (Math.abs(a.y - b.y) <= EPS) {
    return a.y > rect.t + EPS && a.y < rect.b - EPS
      && Math.max(a.x, b.x) > rect.l + EPS && Math.min(a.x, b.x) < rect.r - EPS;
  }
  if (Math.abs(a.x - b.x) <= EPS) {
    return a.x > rect.l + EPS && a.x < rect.r - EPS
      && Math.max(a.y, b.y) > rect.t + EPS && Math.min(a.y, b.y) < rect.b - EPS;
  }
  return true; // Orthogonal paths must never contain diagonal segments.
}

function clear(points: readonly DiagramRoutePointV010[], obstacles: readonly Rect[]): boolean {
  for (let i = 1; i < points.length; i += 1) {
    if (obstacles.some(rect => segmentBlocked(points[i - 1]!, points[i]!, rect))) return false;
  }
  return true;
}

function compress(points: DiagramRoutePointV010[]): DiagramRoutePointV010[] {
  const out: DiagramRoutePointV010[] = [];
  for (const p of points) {
    if (out.length && Math.abs(p.x - out[out.length - 1]!.x) <= EPS
      && Math.abs(p.y - out[out.length - 1]!.y) <= EPS) continue;
    while (out.length > 1) {
      const a = out[out.length - 2]!;
      const b = out[out.length - 1]!;
      if ((Math.abs(a.x - b.x) <= EPS && Math.abs(b.x - p.x) <= EPS)
        || (Math.abs(a.y - b.y) <= EPS && Math.abs(b.y - p.y) <= EPS)) out.pop();
      else break;
    }
    out.push(p);
  }
  return out;
}

interface Entry { key: number; cost: number }
class MinQueue {
  private values: Entry[] = [];
  get length(): number { return this.values.length; }
  push(item: Entry): void {
    const v = this.values;
    v.push(item);
    let index = v.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (v[parent]!.cost < item.cost
        || (v[parent]!.cost === item.cost && v[parent]!.key <= item.key)) break;
      v[index] = v[parent]!;
      index = parent;
    }
    v[index] = item;
  }
  pop(): Entry | undefined {
    const v = this.values;
    if (v.length === 0) return undefined;
    const first = v[0]!;
    const last = v.pop()!;
    if (v.length === 0) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      if (left >= v.length) break;
      const right = left + 1;
      let next = left;
      if (right < v.length && (v[right]!.cost < v[left]!.cost
        || (v[right]!.cost === v[left]!.cost && v[right]!.key < v[left]!.key))) next = right;
      if (last.cost < v[next]!.cost
        || (last.cost === v[next]!.cost && last.key <= v[next]!.key)) break;
      v[index] = v[next]!;
      index = next;
    }
    v[index] = last;
    return first;
  }
}

/** Returns safe points, or undefined for congested/out-of-budget cases.
 * Adjacent endpoints and legacy straight-edge behavior are handled by the caller.
 */
export function routeDiagramOrthogonalV010(
  start: DiagramRoutePointV010,
  end: DiagramRoutePointV010,
  obstacles: readonly DiagramRouteObstacleV010[],
  clearance = CLEARANCE
): DiagramRoutePointV010[] | undefined {
  if (!finitePoint(start) || !finitePoint(end) || !Number.isFinite(clearance)
    || clearance < 0 || clearance > 1000 || obstacles.length > 10000) {
    throw new Error("EIDOS_DIAGRAM_ROUTE_INPUT_INVALID");
  }
  if (obstacles.some(o => ![o.x, o.y, o.width, o.height].every(Number.isFinite)
    || o.width <= 0 || o.height <= 0)) {
    throw new Error("EIDOS_DIAGRAM_ROUTE_OBSTACLE_INVALID");
  }
  if (Math.abs(start.x - end.x) < EPS && Math.abs(start.y - end.y) < EPS) return undefined;

  // Far-away nodes do not affect this edge. This bounded local search protects large diagrams.
  const minX = Math.min(start.x, end.x) - 120;
  const maxX = Math.max(start.x, end.x) + 120;
  const minY = Math.min(start.y, end.y) - 120;
  const maxY = Math.max(start.y, end.y) + 120;
  const relevant = obstacles.filter(o =>
    o.x - clearance <= maxX && o.x + o.width + clearance >= minX
    && o.y - clearance <= maxY && o.y + o.height + clearance >= minY
  );
  if (relevant.length > MAX_RELEVANT_OBSTACLES) return undefined;
  const rects: Rect[] = relevant.map(o => ({
    l: o.x - clearance, t: o.y - clearance,
    r: o.x + o.width + clearance, b: o.y + o.height + clearance
  }));
  if (rects.some(r =>
    (start.x > r.l + EPS && start.x < r.r - EPS && start.y > r.t + EPS && start.y < r.b - EPS)
    || (end.x > r.l + EPS && end.x < r.r - EPS && end.y > r.t + EPS && end.y < r.b - EPS)
  )) return undefined;

  const middleX = (start.x + end.x) / 2;
  const middleY = (start.y + end.y) / 2;
  const direct = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
    ? [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end]
    : [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
  if (clear(direct, rects)) return compress(direct);

  const xs = [...new Set([start.x, end.x, ...rects.flatMap(r => [r.l, r.r])])].sort((a, b) => a - b);
  const ys = [...new Set([start.y, end.y, ...rects.flatMap(r => [r.t, r.b])])].sort((a, b) => a - b);
  const nx = xs.length;
  const ny = ys.length;
  if (nx * ny > MAX_GRID_POINTS) return undefined;
  const pointAt = (id: number): DiagramRoutePointV010 =>
    ({ x: xs[id % nx]!, y: ys[Math.floor(id / nx)]! });
  const inside = (p: DiagramRoutePointV010): boolean => rects.some(r =>
    p.x > r.l + EPS && p.x < r.r - EPS && p.y > r.t + EPS && p.y < r.b - EPS);
  const startIndex = ys.indexOf(start.y) * nx + xs.indexOf(start.x);
  const endIndex = ys.indexOf(end.y) * nx + xs.indexOf(end.x);
  const total = nx * ny * 3; // direction 0=start, 1=horizontal, 2=vertical
  const dist = new Float64Array(total).fill(Infinity);
  const prev = new Int32Array(total).fill(-1);
  const queue = new MinQueue();
  const initial = startIndex * 3;
  dist[initial] = 0;
  queue.push({ key: initial, cost: 0 });
  let finish = -1;
  while (queue.length) {
    const current = queue.pop()!;
    if (current.cost > dist[current.key] + EPS) continue;
    const cell = Math.floor(current.key / 3);
    const direction = current.key % 3;
    if (cell === endIndex) { finish = current.key; break; }
    const x = cell % nx;
    const y = Math.floor(cell / nx);
    const p = pointAt(cell);
    for (const [nextX, nextY, nextDir] of [
      [x - 1, y, 1], [x + 1, y, 1], [x, y - 1, 2], [x, y + 1, 2]
    ]) {
      if (nextX! < 0 || nextX! >= nx || nextY! < 0 || nextY! >= ny) continue;
      const nextCell = nextY! * nx + nextX!;
      const q = pointAt(nextCell);
      if (inside(q) || !clear([p, q], rects)) continue;
      const nextKey = nextCell * 3 + nextDir!;
      const cost = current.cost + Math.abs(q.x - p.x) + Math.abs(q.y - p.y)
        + (direction && direction !== nextDir ? TURN_PENALTY : 0);
      if (cost + EPS >= dist[nextKey]) continue;
      dist[nextKey] = cost;
      prev[nextKey] = current.key;
      queue.push({ key: nextKey, cost });
    }
  }
  if (finish === -1) return undefined;
  const path: DiagramRoutePointV010[] = [];
  for (let key = finish; key !== -1; key = prev[key]!) {
    path.push(pointAt(Math.floor(key / 3)));
  }
  path.reverse();
  const result = compress(path);
  return result.length >= 2 && clear(result, rects) ? result : undefined;
}
