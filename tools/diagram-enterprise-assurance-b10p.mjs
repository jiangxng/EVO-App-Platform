/** B10p: offline local graph QA. Call only with prevalidated de-identified or synthetic input. */
export function parallelRelationProfileV010(graph){if(!graph?.nodes||!Array.isArray(graph?.edges))throw Error("graph required");const forward=new Map(),reverseSet=new Set();
 for(const e of graph.edges){const key=JSON.stringify([e.source,e.target]);forward.set(key,(forward.get(key)??0)+1);reverseSet.add(key)}
 let parallelGroups=0,extraParallel=0,reversePairs=0;for(const [key,n] of forward){if(n>1){parallelGroups++;extraParallel+=n-1}const [a,b]=JSON.parse(key);if(a!==b&&reverseSet.has(JSON.stringify([b,a]))&&a<b)reversePairs++}
 return {schema:"B10p-relation-diagnostics",parallelGroups,extraParallel,reversePairs,selfLoops:graph.edges.filter(e=>e.source===e.target).length,disclosure:"aggregate only"};
}
