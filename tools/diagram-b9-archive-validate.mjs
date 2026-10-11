#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const catalog=JSON.parse(readFileSync("docs/architecture/DIAGRAM-B9-DRAFT-CONSOLIDATED-CATALOG-20261011.json","utf8"));
const errors=[]; const assert=(c,m)=>{if(!c)errors.push(m);};
assert(catalog.draftCount===54&&catalog.legacyDraftPRs?.length===54,"Expected exactly 54 archived B9 Draft PR refs");
assert(catalog.formalAcceptance?.cases===39&&catalog.formalAcceptance?.signed===0,"Cannot claim formal acceptance");
const ids=new Set(),heads=new Set();
for(const pr of catalog.legacyDraftPRs){assert(Number.isInteger(pr.pr)&&!ids.has(pr.pr)&&/^[0-9a-f]{40}$/.test(pr.sha)&&!heads.has(pr.sha),"Duplicate or invalid PR provenance "+pr.pr);ids.add(pr.pr);heads.add(pr.sha);}
assert(catalog.archivedEntries?.length>=50,"Missing historical artifacts");
const dst=new Set();
for(const item of catalog.archivedEntries){
 assert(!dst.has(item.archivedPath),"Duplicate path "+item.archivedPath);dst.add(item.archivedPath);
 const bytes=readFileSync(item.archivedPath);
 const hash=createHash("sha1").update("blob "+bytes.length).update(Buffer.from([0])).update(bytes).digest("hex");
 assert(hash===item.sha,"Historical blob mismatch at "+item.archivedPath);
 assert(item.archivedPath.startsWith("docs/"),"Do not insert old code into Platform runtime: "+item.archivedPath);
}
if(errors.length){errors.forEach(m=>console.error(m));process.exitCode=1;}
else console.log(JSON.stringify({ok:true,archivedArtifacts:catalog.archivedEntries.length,historicalDraftPRs:catalog.legacyDraftPRs.length,formalSigned:0}));
