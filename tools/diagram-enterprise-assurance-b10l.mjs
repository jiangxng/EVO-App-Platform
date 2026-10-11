/** B10l — synthetic/de-identified local QA only; consume B9k-validated data. */
export function componentProfileV010(graph){
 if(!graph?.nodes||!graph?.edges)throw Error("graph required");
 const adjacent=new Map(graph.nodes.map(n=>[n.id,new Set()]));
 for(const e of graph.edges){if(!adjacent.has(e.source)||!adjacent.has(e.target))throw Error("orphan relation");adjacent.get(e.source).add(e.target);adjacent.get(e.target).add(e.source)}
 const seen=new Set();let islands=0,isolated=0,largest=0;
 for(const id of adjacent.keys()){if(seen.has(id))continue;let size=0;const stack=[id];seen.add(id);
 while(stack.length){const current=stack.pop();size++;for(const next of adjacent.get(current))if(!seen.has(next)){seen.add(next);stack.push(next)}}
 islands++;if(size===1&&adjacent.get(id).size===0)isolated++;largest=Math.max(largest,size)}
 return {schema:"B10l-undirected-aggregate",islands,isolated,largest,disclosure:"aggregate only; this is not process correctness"};
}
