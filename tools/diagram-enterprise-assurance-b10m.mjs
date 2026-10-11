/** B10m — synthetic/de-identified local QA only; consume B9k-validated data. */
export function rootReachabilityV010(graph){
 if(!Array.isArray(graph?.nodes)||!Array.isArray(graph?.edges))throw Error("graph required");
 const indegree=new Map(graph.nodes.map(n=>[n.id,0])),adjacent=new Map(graph.nodes.map(n=>[n.id,[]]));
 for(const e of graph.edges){if(!indegree.has(e.source)||!indegree.has(e.target))throw Error("orphan relation");indegree.set(e.target,indegree.get(e.target)+1);adjacent.get(e.source).push(e.target)}
 const roots=[...indegree].filter(x=>x[1]===0).map(x=>x[0]);
 const seen=new Set(roots),stack=[...roots];while(stack.length)for(const n of adjacent.get(stack.pop()))if(!seen.has(n)){seen.add(n);stack.push(n)}
 return {schema:"B10m-reachability-proxy",sources:roots.length,reachableFromSources:seen.size,notReached:graph.nodes.length-seen.size,rootsAbsent:roots.length===0,note:"roots and reachability are graph heuristics, not verified process starts"};
}
