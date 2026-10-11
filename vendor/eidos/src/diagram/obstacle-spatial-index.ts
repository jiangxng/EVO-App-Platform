/** Spatial lookup for presentation-only orthogonal routing.
 * Result order is always the source-order node order: preserves route tie-breaks.
 * The returned obstacles exclude the two edge endpoints and include exactly
 * those potentially relevant to the router's 120-world-unit search envelope
 * plus its 14-unit default clearance. No domain topology is modified.
 */
export interface DiagramSpatialNodeV010 {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DiagramRouteCoordinateV010 { x: number; y: number }
export interface DiagramSpatialObstacleV010 {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramObstacleSpatialIndexV010 {
  near(
    start: DiagramRouteCoordinateV010,
    end: DiagramRouteCoordinateV010,
    excludeSourceId: string,
    excludeTargetId: string
  ): DiagramSpatialObstacleV010[];
}

const SEARCH_ENVELOPE = 120;
const DEFAULT_CLEARANCE = 14;
const CELL = 256;
const MAX_NODE_CELLS = 64;
const MAX_QUERY_CELLS = 4096;

function bucketKey(x: number, y: number): string {
  return x + ":" + y;
}
function range(value: number, extent: number): [number, number] {
  return [Math.floor(value / CELL), Math.floor((value + extent) / CELL)];
}

/** Build once per full render, never per edge or pointer movement. */
export function createDiagramObstacleSpatialIndexV010(
  nodes: readonly DiagramSpatialNodeV010[]
): DiagramObstacleSpatialIndexV010 {
  const buckets = new Map<string, number[]>();
  const enormous: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)
      || !Number.isFinite(node.width) || !Number.isFinite(node.height)
      || node.width <= 0 || node.height <= 0) {
      throw new Error("EIDOS_DIAGRAM_SPATIAL_NODE_INVALID");
    }
    const [x0,x1] = range(node.x,node.width);
    const [y0,y1] = range(node.y,node.height);
    if ((x1-x0+1)*(y1-y0+1) > MAX_NODE_CELLS) {
      enormous.push(i);
      continue;
    }
    for (let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++){
      const key=bucketKey(x,y);
      const list=buckets.get(key);
      if(list)list.push(i);else buckets.set(key,[i]);
    }
  }
  return {
    near(start,end,excludeSourceId,excludeTargetId) {
      const pad = SEARCH_ENVELOPE + DEFAULT_CLEARANCE;
      const minX=Math.min(start.x,end.x)-pad;
      const maxX=Math.max(start.x,end.x)+pad;
      const minY=Math.min(start.y,end.y)-pad;
      const maxY=Math.max(start.y,end.y)+pad;
      const x0=Math.floor(minX/CELL),x1=Math.floor(maxX/CELL);
      const y0=Math.floor(minY/CELL),y1=Math.floor(maxY/CELL);
      const matches=new Set<number>();
      if ((x1-x0+1)*(y1-y0+1)>MAX_QUERY_CELLS
        || ![x0,x1,y0,y1].every(Number.isFinite)) {
        // Far-apart endpoints: bounded fallback, never enumerate infinite cells.
        for (let i=0;i<nodes.length;i++) matches.add(i);
      } else {
        for(const i of enormous)matches.add(i);
        for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
          for(const i of buckets.get(bucketKey(x,y))??[])matches.add(i);
        }
      }
      const result: DiagramSpatialObstacleV010[]=[];
      for(const i of [...matches].sort((a,b)=>a-b)){
        const node=nodes[i]!;
        if(node.id===excludeSourceId||node.id===excludeTargetId)continue;
        if (node.x > maxX || node.x + node.width < minX
          || node.y > maxY || node.y + node.height < minY) continue;
        result.push({x:node.x,y:node.y,width:node.width,height:node.height});
      }
      return result;
    }
  };
}
