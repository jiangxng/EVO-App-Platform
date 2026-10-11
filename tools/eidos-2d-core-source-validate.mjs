#!/usr/bin/env node
// Offline, deterministic Eidos 2D component provenance + public API + plugin identity gate.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root,"vendor/eidos/source.manifest.json"),"utf8"));
const component = (manifest.componentPins ?? []).find(p => p.component === "eidos.2d-core");
const errors = [];
const required = (c, why) => { if (!c) errors.push(why); };
required(component?.sourceRepository === "jiangxng/eidos","Unexpected 2D upstream repository.");
required(component?.sourceCommit === "3fde008f372bcbcaad45563f511c7b7cf1f8924e","Unexpected 2D upstream commit.");
required(component?.sourcePath === "src/diagram","Unexpected source path.");
required(component?.vendoredPath === "vendor/eidos/src/diagram","Unexpected local path.");
required(component?.publicEntrypoint === "src/2d/index.ts","Wrong Eidos 2D public entrypoint.");
required(component?.sourcePublicEntrypointBlob === "d35b0f2fd6631b1c14ea540f27984a5f2cf0e419","Wrong Eidos public entrypoint provenance.");
required(manifest.sourceCommit !== component?.sourceCommit,"Broad Eidos snapshot must not falsely claim the newer scoped sync.");
function gitBlobSha(bytes) {
  return createHash("sha1").update("blob " + bytes.length).update(Buffer.from([0])).update(bytes).digest("hex");
}
const expected = component?.upstreamFileBlobs ?? {};
const overlays = new Map((component?.hostOverlays ?? []).map(p=>[p.path.replace("src/diagram/",""),p]));
const diagramRoot = join(root,"vendor/eidos/src/diagram");
const actual = readdirSync(diagramRoot).filter(f => f.endsWith(".ts")).sort();
required(JSON.stringify(actual) === JSON.stringify(Object.keys(expected).sort()),"Unexpected or missing diagram source files.");
for (const name of actual) {
 const path = "src/diagram/"+name;
 required(manifest.files.includes(path),"Eidos manifest omits "+path);
 const actualSha = gitBlobSha(readFileSync(join(diagramRoot,name)));
 const overlay = overlays.get(name);
 if (overlay) {
   required(overlay.upstreamBlob === expected[name],"Invalid upstream overlay evidence: "+name);
   required(overlay.vendoredBlob === actualSha,"Host overlay was edited without renewed provenance: "+name);
   required(Boolean(overlay.owner && overlay.reason),"Host overlay must declare owner and rationale: "+name);
 } else {
   required(actualSha === expected[name],"Eidos 2D source drift for "+name);
 }
}
required(overlays.size === 1 && overlays.has("surface.ts"),"Unexpected undeclared 2D host overlays.");
const public2d = readFileSync(join(root,"vendor/eidos/src/2d/index.ts"),"utf8");
const publicDiagram = readFileSync(join(diagramRoot,"index.ts"),"utf8");
required(public2d.includes('export * from "../diagram/index.js"'),"Public 2D API must expose the diagram facade.");
for (const name of ["edge-paths","edge-waypoints"]) {
 required(publicDiagram.includes('export * from "./'+name+'.js"'),"Missing public 2D geometry export: "+name);
}
for (const dir of ["apps/eog-2d-designer","apps/eog-2d-viewer"]) {
 for (const file of readdirSync(join(root,dir)).filter(x => x.endsWith(".ts"))) {
   const text = readFileSync(join(root,dir,file),"utf8");
   required(!text.includes("vendor/eidos/src/diagram/"),"Product bypasses Eidos 2D public API: "+dir+"/"+file);
 }
}
const pkg = await import("../dist/apps/eog-2d/package.js");
const seed = readFileSync(join(root,"catalog/seed.ts"),"utf8");
required(pkg.eog2dPackage.packageId === "evo-eog-2d","Wrong unified 2D package id.");
required(pkg.eog2dPackage.features.length === 2,"EOG Viewer and Designer must be peer Features within one package.");
const [viewer,designer] = pkg.eog2dPackage.features;
required(viewer.featureId === "evo-eog-2d.viewer" && designer.featureId === "evo-eog-2d.designer","Invalid 2D feature profiles.");
required(designer.requiresFeatures?.includes(viewer.featureId),"Designer must depend on Viewer feature.");
required(designer.requiresCapabilities?.includes("authorization.check"),"Designer mutation must depend on authorization.");
required(seed.includes('eog2dPackage') && !seed.includes('eog2dDesignerPackage'),"Catalog must register the unified package, not legacy aliases.");
if (errors.length) { for (const err of errors) console.error("Eidos 2D boundary FAIL:",err); process.exitCode=1; }
else console.log(JSON.stringify({ok:true,component:component.component,upstream:component.sourceCommit,identicalSourceFiles:actual.length-overlays.size,hostOverlays:overlays.size,public2d:true,pluginFeatures:[viewer.featureId,designer.featureId]}));
