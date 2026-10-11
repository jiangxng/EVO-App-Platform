/** B10k: topology-only synthetic QA; graph was validated by B9k before this step. */
export function topologyInventoryV010(graph){
 if(!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
  throw Error("validated preview2d required");
 const nodes=new Set(graph.nodes.map(n=>n.id));
 const edges=new Set();
 for(const e of graph.edges){
  if(edges.has(e.id) || !nodes.has(e.source) || !nodes.has(e.target))throw Error("invalid relation");
  edges.add(e.id);
 }
 if(nodes.size!==graph.nodes.length)throw Error("duplicate node");
 return {kind:"B10k-aggregate",nodes:nodes.size,edges:edges.size,selfLoops:graph.edges.filter(e=>e.source===e.target).length,disclosure:"counts only; no private labels or identifiers"};
}
