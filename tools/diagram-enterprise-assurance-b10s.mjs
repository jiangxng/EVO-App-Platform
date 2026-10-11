/** B10s: offline local graph QA. Call only with prevalidated de-identified or synthetic input. */
export function directDistanceProfileV010(graph){if(!Array.isArray(graph?.nodes)||!Array.isArray(graph?.edges))throw Error("graph required");
 const nodes=new Map(graph.nodes.map(n=>[n.id,n]));let sum=0,max=0,zero=0;
 for(const e of graph.edges){const a=nodes.get(e.source),b=nodes.get(e.target);if(!a||!b)throw Error("orphan relation");const d=Math.abs((a.x+a.width/2)-(b.x+b.width/2))+Math.abs((a.y+a.height/2)-(b.y+b.height/2));if(!Number.isFinite(d))throw Error("invalid geometry");sum+=d;max=Math.max(max,d);if(d===0)zero++}
 return {schema:"B10s-manhattan-lower-bound-proxy",relations:graph.edges.length,zeroDistance:zero,maxDirectDistance:max,meanDirectDistance:graph.edges.length?Math.round(sum/graph.edges.length):0,note:"Manhattan center distance only, NOT true edge route length"};
}
