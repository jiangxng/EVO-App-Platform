import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditWebAssetGraph} from '../../tools/web-asset-graph-audit.mjs';
function fixture(files,run){const root=fs.mkdtempSync(path.join(os.tmpdir(),'web-graph-'));try{for(const [file,content]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content);}return run(root);}finally{fs.rmSync(root,{recursive:true,force:true});}}
test('graph includes static, re-export and deferred imports without executing modules',()=>fixture({
 'entry.js':"import './static.js';export * from './export.js';function later(){return import('./lazy.js');}",
 'static.js':"import './entry.js';throw Error('MUST_NOT_EXECUTE');",'export.js':'export const x=1;', 'lazy.js':'export const y=2;', 'server.js':'export const backend=3;'
},root=>{const report=auditWebAssetGraph({sourceRoot:root,entries:['entry.js']});assert.equal(report.totalJavaScript.files,5);assert.equal(report.reachableJavaScript.files,4);assert.deepEqual(report.unresolved,[]);assert.deepEqual(report.outsideEntryGraph.map(x=>x.path),['server.js']);assert.ok(report.reachable.every(x=>x.sha256.length===64));}));
test('computed, external, missing and escaping imports remain explicit unresolved evidence',()=>fixture({'entry.js':"import 'external';import './missing.js';import '../outside.js';export async function later(name){return import(name);}"},root=>{const report=auditWebAssetGraph({sourceRoot:root,entries:['entry.js']});assert.equal(report.unresolved.length,4);assert.ok(report.unresolved.some(x=>x.kind==='computed-import'));assert.throws(()=>auditWebAssetGraph({sourceRoot:root,entries:['../outside.js']}),/OUTSIDE_ROOT/);}));
