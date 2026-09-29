import type { SpatialSceneV010 } from "./contracts.js";
export interface Vec3{x:number;y:number;z:number}
export interface SpatialPose {objectId:string;position:Vec3;rotation:Vec3;scale:Vec3;}
export interface SpatialRuntimeState {scene:SpatialSceneV010;poses:Record<string,SpatialPose>;selectedObjectId?:string;camera:{position:Vec3;target:Vec3};}
export type SpatialCommand={type:"select";objectId?:string}|{type:"move";objectId:string;position:Vec3}|{type:"camera";position:Vec3;target:Vec3};
export function reduceSpatial(s:SpatialRuntimeState,c:SpatialCommand):SpatialRuntimeState{if(c.type==="select")return {...s,...(c.objectId?{selectedObjectId:c.objectId}:{selectedObjectId:undefined})};if(c.type==="camera")return {...s,camera:{position:c.position,target:c.target}};const pose=s.poses[c.objectId];if(!pose)return s;return {...s,poses:{...s.poses,[c.objectId]:{...pose,position:c.position}}};}
export interface ProjectedPoint{x:number;y:number;depth:number}
export function projectPerspective(p:Vec3,cameraZ=6,focal=500):ProjectedPoint{const z=Math.max(.1,cameraZ-p.z);return {x:p.x*focal/z,y:-p.y*focal/z,depth:z};}
