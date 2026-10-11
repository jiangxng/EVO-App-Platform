/** B11g: B-Class synthetic presentation QA, not production App save implementation. */
export function projectionDiffGuardV010(before,after){if(!before||!after||!Array.isArray(before.nodes)||!Array.isArray(after.nodes)||!Array.isArray(before.edges)||!Array.isArray(after.edges))throw Error("both graphs required");
 const nodeKey=g=>g.nodes.map(n=>n.id).sort();const relationKey=g=>g.edges.map(e=>JSON.stringify([e.id,e.source,e.target,e.kind])).sort();
 if(JSON.stringify(nodeKey(before))!==JSON.stringify(nodeKey(after)) || JSON.stringify(relationKey(before))!==JSON.stringify(relationKey(after)))throw Error("business topology changed");
 const prior=new Map(before.nodes.map(n=>[n.id,n]));let moved=0;for(const n of after.nodes){const b=prior.get(n.id);if(n.x!==b.x||n.y!==b.y)moved++}
 return {schema:"B11g-business-topology-guard",businessTopologyUnchanged:true,movedNodeCount:moved,nodes:before.nodes.length,relations:before.edges.length,note:"offline comparison, not App CAS validation"};
}
