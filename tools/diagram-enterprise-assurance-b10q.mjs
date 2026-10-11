/** B10q: offline local graph QA. Call only with prevalidated de-identified or synthetic input. */
export function nodeOverlapProfileV010(graph){if(!Array.isArray(graph?.nodes))throw Error("graph required");let pairs=0,maxOverlapArea=0;
 for(let i=0;i<graph.nodes.length;i++){const a=graph.nodes[i];if(![a.x,a.y,a.width,a.height].every(Number.isFinite)||a.width<=0||a.height<=0)throw Error("invalid rectangle");
 for(let j=i+1;j<graph.nodes.length;j++){const b=graph.nodes[j];if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error("invalid rectangle");const dx=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),dy=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);if(dx>0&&dy>0){pairs++;maxOverlapArea=Math.max(maxOverlapArea,dx*dy)}}}
 return {schema:"B10q-rect-overlap-proxy",overlappingPairs:pairs,maxOverlapArea,disclosure:"aggregate only; no labels/positions"};
}
