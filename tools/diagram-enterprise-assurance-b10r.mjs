/** B10r: offline local graph QA. Call only with prevalidated de-identified or synthetic input. */
export function spatialCrowdingV010(graph){if(!Array.isArray(graph?.nodes))throw Error("graph required");
 const buckets=new Map();for(const node of graph.nodes){if(!Number.isFinite(node.x)||!Number.isFinite(node.y))throw Error("invalid placement");const key=Math.floor(node.x/240)+":"+Math.floor(node.y/240);buckets.set(key,(buckets.get(key)??0)+1)}
 let busy=0,max=0;for(const n of buckets.values()){if(n>5)busy++;max=Math.max(max,n)}
 return {schema:"B10r-tile-density-proxy",worldTile:240,occupiedTiles:buckets.size,overfiveTiles:busy,maxTileNodeCount:max,note:"tile counts are not actual visual congestion"};
}
