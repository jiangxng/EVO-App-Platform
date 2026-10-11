/** B10o — synthetic/de-identified local QA only; consume B9k-validated data. */
export function branchMergeProfileV010(graph){
 if(!Array.isArray(graph?.nodes)||!Array.isArray(graph?.edges))throw Error("graph required");
 const deg=new Map(graph.nodes.map(n=>[n.id,{incoming:0,outgoing:0}]));
 for(const e of graph.edges){if(!deg.has(e.source)||!deg.has(e.target))throw Error("orphan relation");deg.get(e.source).outgoing++;deg.get(e.target).incoming++}
 let branches=0,merges=0,maxIn=0,maxOut=0;
 for(const d of deg.values()){if(d.outgoing>1)branches++;if(d.incoming>1)merges++;maxIn=Math.max(maxIn,d.incoming);maxOut=Math.max(maxOut,d.outgoing)}
 return {schema:"B10o-degree-aggregate",branches,merges,maxIn,maxOut,note:"high fan-out is not automatically an error"};
}
