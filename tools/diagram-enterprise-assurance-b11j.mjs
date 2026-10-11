/** B11j local evidence-policy regression. NOT independent customer consent verification. */
export function mayUploadSyntheticProofV010(fixture){if(!fixture||!fixture.preview2d||!Array.isArray(fixture.preview2d.nodes)||!Array.isArray(fixture.preview2d.edges))return{allow:false,reason:"invalid"};
 const g=fixture.preview2d;
 const strict=fixture.deidentified===true&&fixture.ownerApprovedForLocalQa===true&&["S2C","P2P"].includes(fixture.process)&&g.nodes.length>0&&g.edges.length>0;
 const names=g.nodes.every(n=>typeof n.label==="string"&&/^Synthetic\b/.test(n.label))&&g.edges.every(e=>e.label===undefined||(typeof e.label==="string"&&/^Synthetic\b/.test(e.label)));
 return {schema:"B11j-label-gate",allow:strict&&names,warning:"heuristic synthetic prefix is NOT independent provenance verification; never classify customer evidence for public upload"};
}
