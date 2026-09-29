import type { SpatialSceneV010 } from "./contracts.js";
/** Minimal dependency-inversion boundary. An actual Three.js package is optional and replaceable. */
export interface ThreeLikeScene { add(object:unknown):void; }
export interface ThreeLikeAdapter { createScene():ThreeLikeScene; createObject(spec:{id:string;kind:string;source?:string}):unknown; render(scene:ThreeLikeScene,container:unknown):void; }
export function realizeWithThreeAdapter(spec:SpatialSceneV010,adapter:ThreeLikeAdapter,container:unknown):ThreeLikeScene { const scene=adapter.createScene();for(const o of spec.objects)scene.add(adapter.createObject({id:o.id,kind:o.kind,...(o.source?{source:o.source}:{})}));adapter.render(scene,container);return scene; }
