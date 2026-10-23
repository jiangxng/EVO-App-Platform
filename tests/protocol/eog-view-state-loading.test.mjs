import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createFileEogViewStateStoreV010} from '../../dist/providers/eog-view-state/store.js';
import {createEogViewStateProviderV010} from '../../dist/providers/eog-view-state/runtime.js';

test('view store and provider construction perform zero filesystem operations', () => {
  // A separate process avoids patching fs in other tests. Import first so module
  // loader I/O is not confused with construction of the business resource.
  const script = `
    import fs from 'node:fs';
    import {syncBuiltinESMExports} from 'node:module';
    import {createFileEogViewStateStoreV010} from './dist/providers/eog-view-state/store.js';
    import {createEogViewStateProviderV010} from './dist/providers/eog-view-state/runtime.js';
    for (const name of ['existsSync','mkdirSync','readFileSync','writeFileSync','renameSync','openSync','statSync']) {
      fs[name] = () => { throw new Error('EAGER_VIEW_STORE_IO:' + name); };
    }
    syncBuiltinESMExports();
    const provider = createEogViewStateProviderV010({store:createFileEogViewStateStoreV010('/unused/view-state.json')});
    if (typeof provider.ensure !== 'function') throw new Error('PROVIDER_NOT_CREATED');
  `;
  const child=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),encoding:'utf8',timeout:10000});
  assert.equal(child.error,undefined);
  assert.equal(child.status,0,child.stderr);
});

test('file views fail closed on corrupt data, reread repairs and persist shared 2D/3D state', () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'eog-view-loading-'));
  const file=path.join(directory,'nested','views.json');
  try {
    const store=createFileEogViewStateStoreV010(file);
    const provider=createEogViewStateProviderV010({store,now:()=>new Date('2026-10-19T00:00:00.000Z')});
    assert.equal(fs.existsSync(path.dirname(file)),false);
    assert.deepEqual(provider.list({enterpriseId:'enterprise:a',graphId:'graph:a'}),[]);
    assert.equal(fs.existsSync(path.dirname(file)),false,'read of absent store must not create directories');
    fs.mkdirSync(path.dirname(file));
    const corrupt='{broken';fs.writeFileSync(file,corrupt);
    assert.throws(()=>provider.ensure({enterpriseId:'enterprise:a',graphId:'graph:a',kind:'DIAGRAM_2D'}),SyntaxError);
    assert.equal(fs.readFileSync(file,'utf8'),corrupt,'ensure must not replace unreadable business data');
    fs.writeFileSync(file,JSON.stringify({contractVersion:'0.1.0',views:[]}));
    const diagram=provider.ensure({enterpriseId:'enterprise:a',graphId:'graph:a',kind:'DIAGRAM_2D'});
    const spatial=provider.ensure({enterpriseId:'enterprise:a',graphId:'graph:a',kind:'SPATIAL_3D'});
    assert.notEqual(diagram.viewId,spatial.viewId);
    const changed=provider.apply({enterpriseId:'enterprise:a',graphId:'graph:a',viewId:diagram.viewId,expectedRevision:0,mutation:{type:'PROJECTION_ITEM_VISIBILITY_SET',target:{kind:'NODE',id:'node:a'},visible:false}});
    const reopened=createEogViewStateProviderV010({store:createFileEogViewStateStoreV010(file)});
    assert.deepEqual(reopened.get({enterpriseId:'enterprise:a',graphId:'graph:a',viewId:diagram.viewId}),changed);
    assert.deepEqual(reopened.get({enterpriseId:'enterprise:a',graphId:'graph:a',viewId:spatial.viewId}),spatial);
    assert.throws(()=>reopened.get({enterpriseId:'enterprise:b',graphId:'graph:a',viewId:diagram.viewId}),/EOG_VIEW_NOT_FOUND/);
    assert.throws(()=>reopened.apply({enterpriseId:'enterprise:a',graphId:'graph:a',viewId:diagram.viewId,expectedRevision:0,mutation:{type:'PROJECTION_VISIBILITY_RESET'}}),/EOG_VIEW_REVISION_CONFLICT/);
    assert.deepEqual(reopened.get({enterpriseId:'enterprise:a',graphId:'graph:a',viewId:diagram.viewId}),changed);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
