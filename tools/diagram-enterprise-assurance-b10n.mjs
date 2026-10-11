/** B10n — synthetic/de-identified local QA only; consume B9k-validated data. */
export function cycleGroupsV010(graph){
 if(!Array.isArray(graph?.nodes)||!Array.isArray(graph?.edges))throw Error("graph required");
 const ids=new Set(graph.nodes.map(n=>n.id)),f=new Map([...ids].map(id=>[id,[]])),r=new Map([...ids].map(id=>[id,[]]));
 for(const e of graph.edges){if(!ids.has(e.source)||!ids.has(e.target))throw Error("orphan relation");f.get(e.source).push(e.target);r.get(e.target).push(e.source)}
 const seen=new Set(),order=[];
 for(const id of ids){if(seen.has(id))continue;seen.add(id);const stack=[[id,0]];while(stack.length){const t=stack[stack.length-1];if(t[1]<f.get(t[0]).length){const v=f.get(t[0])[t[1]++];if(!seen.has(v)){seen.add(v);stack.push([v,0])}}else{order.push(t[0]);stack.pop()}}}
 seen.clear();let groups=0,cyclicGroups=0,maxGroup=0;const loops=new Set(graph.edges.filter(e=>e.source===e.target).map(e=>e.source));
 for(let i=order.length-1;i>=0;i--){const id=order[i];if(seen.has(id))continue;groups++;let size=0,looped=false;const stack=[id];seen.add(id);
 while(stack.length){const v=stack.pop();size++;looped ||= loops.has(v);for(const t of r.get(v))if(!seen.has(t)){seen.add(t);stack.push(t)}}
 if(size>1||looped)cyclicGroups++;maxGroup=Math.max(maxGroup,size)}
 return {schema:"B10n-scc-proxy",stronglyConnectedGroups:groups,cyclicGroups,maxGroup,note:"cycle groups not a compliance finding"};
}
