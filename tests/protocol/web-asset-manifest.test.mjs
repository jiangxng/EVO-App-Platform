import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {buildWebAssetManifest} from '../../tools/build-web-asset-manifest.mjs';
import {createWebAssetArchiveV010} from '../../dist/manager/web-asset-archive.js';
async function fixture(run){const root=await fs.mkdtemp(path.join(os.tmpdir(),'web-manifest-'));try{const source=path.join(root,'dist');await fs.mkdir(source);await fs.writeFile(path.join(source,'entry.js'),"export async function open(){return import('./lazy.js');}");await fs.writeFile(path.join(source,'lazy.js'),'export const old=1;');await fs.writeFile(path.join(source,'server.js'),'throw Error("backend");');const manifestPath=path.join(root,'manifest.json');const manifest=buildWebAssetManifest({sourceRoot:source,entries:['entry.js'],shellCss:'old-css'});await fs.writeFile(manifestPath,JSON.stringify(manifest));await run({root,source,manifestPath,manifest,options:{currentRevision:'old',sourceRoot:source,archiveRoot:path.join(root,'archive'),shellCss:'old-css',manifestPath}});}finally{await fs.rm(root,{recursive:true,force:true});}}
test('complete manifest snapshot retains late dependencies and excludes backend; concurrent publication converges',async()=>fixture(async({options,source})=>{
 const a=createWebAssetArchiveV010(options),b=createWebAssetArchiveV010(options);
 await Promise.all([a.ensureCurrent(),a.ensureCurrent(),b.ensureCurrent()]);
 assert.equal((await a.readArchived('old','lazy.js')).toString(),'export const old=1;');assert.equal(await a.readArchived('old','server.js'),undefined);
 assert.deepEqual(await a.revisions(),['old']);await fs.writeFile(path.join(source,'lazy.js'),'export const old=2;');
 await a.ensureCurrent();assert.equal((await a.readArchived('old','lazy.js')).toString(),'export const old=1;');
 assert.deepEqual(await fs.readdir(path.join(options.archiveRoot,'.staging')),[]);
}));
test('hash failure publishes no partial revision; retry succeeds after original bytes restored',async()=>fixture(async({options,source})=>{
 await fs.writeFile(path.join(source,'lazy.js'),'tampered');const a=createWebAssetArchiveV010(options);
 await assert.rejects(a.ensureCurrent(),/CONTENT_MISMATCH/);assert.deepEqual(await a.revisions(),[]);assert.equal(await a.readArchived('old','entry.js'),undefined);
 await fs.writeFile(path.join(source,'lazy.js'),'export const old=1;');await a.ensureCurrent();assert.ok(await a.readArchived('old','lazy.js'));
}));
test('missing/invalid manifest, CSS mismatch and dot revisions fail without completion',async()=>fixture(async({options,manifestPath,manifest})=>{
 await assert.rejects(createWebAssetArchiveV010({...options,manifestPath:manifestPath+'.missing'}).ensureCurrent(),/ENOENT/);
 await assert.rejects(createWebAssetArchiveV010({...options,shellCss:'wrong'}).ensureCurrent(),/CSS_MISMATCH/);
 for(const revision of ['.','..','.staging'])await assert.rejects(createWebAssetArchiveV010({...options,currentRevision:revision}).ensureCurrent(),/REVISION_INVALID/);
 manifest.files[0].path='../escape.js';await fs.writeFile(manifestPath,JSON.stringify(manifest));await assert.rejects(createWebAssetArchiveV010(options).ensureCurrent(),/MANIFEST_INVALID/);
}));
test('old full snapshots remain readable; new snapshots retain only the configured completed versions',async()=>fixture(async({options,manifestPath})=>{
 const legacy=createWebAssetArchiveV010({...options,manifestPath:undefined});await legacy.ensureCurrent();assert.ok(await legacy.readArchived('old','server.js'));
 const migrated=createWebAssetArchiveV010(options);await migrated.ensureCurrent();assert.ok(await migrated.readArchived('old','server.js'));
 await fs.utimes(path.join(options.archiveRoot,'old','.ready'),new Date(0),new Date(0));
 for(const currentRevision of ['new-1','new-2'])await createWebAssetArchiveV010({...options,currentRevision,retention:2}).ensureCurrent();
 assert.deepEqual(await migrated.revisions(),['new-1','new-2']);
 await fs.mkdir(path.join(options.archiveRoot,'broken'));await fs.writeFile(path.join(options.archiveRoot,'broken','entry.js'),'incomplete');
 assert.equal(await migrated.readArchived('broken','entry.js'),undefined);assert.deepEqual(await migrated.revisions(),['new-1','new-2']);
}));
test('build rejects computed imports and uncontracted resource loaders',async()=>fixture(async({source})=>{
 for(const code of ["export const load=x=>import(x);","new Worker('./worker.js');","new URL('./worker.js',import.meta.url);","import 'node:fs';"]){await fs.writeFile(path.join(source,'entry.js'),code);assert.throws(()=>buildWebAssetManifest({sourceRoot:source,entries:['entry.js'],shellCss:''}),/WEB_ASSET_GRAPH/);}
}));
test('revision conflicts preserve published bytes and incomplete destinations are never erased',async()=>fixture(async({options,manifestPath,manifest})=>{
 const a=createWebAssetArchiveV010(options);await a.ensureCurrent();
 await fs.writeFile(manifestPath,JSON.stringify({...manifest,entries:['changed-entry.js']}));
 await assert.rejects(createWebAssetArchiveV010(options).ensureCurrent(),/REVISION_CONFLICT/);
 assert.equal((await a.readArchived('old','lazy.js')).toString(),'export const old=1;');
 const broken=path.join(options.archiveRoot,'broken');await fs.mkdir(broken);await fs.writeFile(path.join(broken,'sentinel'),'preserve');
 await assert.rejects(createWebAssetArchiveV010({...options,currentRevision:'broken'}).ensureCurrent());
 assert.equal(await fs.readFile(path.join(broken,'sentinel'),'utf8'),'preserve');assert.equal(await a.readArchived('broken','entry.js'),undefined);
}));
