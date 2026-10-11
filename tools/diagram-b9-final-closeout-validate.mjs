#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const m=JSON.parse(readFileSync("docs/architecture/DIAGRAM-B9-FINAL-CHAIN-CLOSEOUT-20261011.json","utf8"));
if(m.closedHistoryPRs?.map(x=>x.number).join()!=="537,547,549,550,552"||m.formalCommercialAcceptance?.signed!==0||m.priorB9ArchivePR!==705)throw Error("Invalid historical closure manifest");
const item=m.onlyDistinctUnarchivedBlob;
const buf=readFileSync(item.archivePath);
const sha=createHash("sha1").update("blob "+buf.length).update(Buffer.from([0])).update(buf).digest("hex");
if(sha!==item.blob)throw Error("Source research changed");
console.log("Legacy B9 docs/source SHA verified; last five history PR heads recorded.");
