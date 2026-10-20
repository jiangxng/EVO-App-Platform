// Test-only ESM observation/fault injection. Source is never transformed.
import {appendFileSync, readFileSync, writeFileSync} from 'node:fs';
let eventFile, stateFile, storeFile, scenario;
export function initialize(data) {
  ({eventFile, stateFile, storeFile, scenario} = data);
}
function event(value) { appendFileSync(eventFile, JSON.stringify(value) + '\n'); }
export async function load(url, context, nextLoad) {
  if (url.endsWith('/dist/apps/eog-2d-designer/definition-projection-editor.js')) {
    event({kind: 'editor-loading'});
    // Mutate test-owned authority/selection while the real import is pending.
    // No production hooks or callbacks are added for fault injection.
    const state = JSON.parse(readFileSync(stateFile, 'utf8'));
    if (scenario === 'disable') state.active = false;
    if (scenario === 'access') state.access = false;
    if (scenario === 'role') state.manage = false;
    if (scenario === 'target') state.targetChanged = true;
    writeFileSync(stateFile, JSON.stringify(state));
    if (scenario === 'write-token') {
      const {createFileDefinitionProjectionStoreV010} = await import('../../dist/providers/enterprise-context/definition-projection-store.js');
      createFileDefinitionProjectionStoreV010(storeFile).putIfVersion(state.competingEntry, 0);
    }
    if (scenario === 'load-error') throw Error('TEST_EDITOR_LOAD_FAILED');
  }
  const result = await nextLoad(url, context);
  if (url.includes('/dist/')) event({kind: 'loaded', url});
  return result;
}
