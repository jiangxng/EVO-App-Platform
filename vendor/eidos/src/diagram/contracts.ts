export interface DiagramNode {
  id:string;
  kind:string;
  label?:string;
  laneId?:string;
  data?:Record<string,string|number|boolean|null>;
}
export interface DiagramEdge {
  id:string;
  source:string;
  target:string;
  kind?:string;
  label?:string;
}
export interface DiagramSpecV010 {
  contractVersion:"0.1.0";
  diagramId:string;
  kind:"flowchart"|"process"|"bpmn-like"|"org"|"dependency"|"state-machine"|"er"|"topology"|"mind-map"|"whiteboard";
  nodes:DiagramNode[];
  edges:DiagramEdge[];
  editable?:boolean;
}
export function validateDiagram(spec:DiagramSpecV010):string[]{
  const issues:string[]=[]; const ids=new Set(spec.nodes.map(n=>n.id));
  for(const e of spec.edges){
    if(!ids.has(e.source)) issues.push(`Unknown edge source: ${e.source}`);
    if(!ids.has(e.target)) issues.push(`Unknown edge target: ${e.target}`);
  }
  return issues;
}
