export interface SpatialObject {
  id:string;
  kind:"mesh"|"model"|"line"|"point"|"label"|"measurement"|"annotation";
  source?:string;
  selectable?:boolean;
  layer?:string;
}
export interface SpatialSceneV010 {
  contractVersion:"0.1.0";
  sceneId:string;
  objects:SpatialObject[];
  camera?:{mode:"perspective"|"orthographic";targetObjectId?:string};
  interaction?:{picking?:boolean;measurement?:boolean;annotation?:boolean};
}
