/** B10w aggregate-only pre-routing diagnostic; never actual Eidos routing or FPS. */
export function graphWorkBudgetV010(graph){if(!Array.isArray(graph?.nodes)||!Array.isArray(graph?.edges))throw Error("graph required");const n=graph.nodes.length,e=graph.edges.length;const pairs=n*(n-1)/2,edgeNodeChecks=n*e;return{schema:"B10w-diagnostic-work-budget",nodes:n,edges:e,rectanglePairs:pairs,edgeNodeChecks,overMillionPairChecks:pairs>1_000_000,overMillionCorridorChecks:edgeNodeChecks>1_000_000,warning:"estimated preprocessing operations, NOT latency, FPS or Eidos router budget"};
}
