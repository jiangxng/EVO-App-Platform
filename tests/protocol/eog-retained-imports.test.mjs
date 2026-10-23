import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Match the directed R1 root inventory in the governance evidence. Fresh
// processes keep imports cold, independently of the test runner/module cache.
const groups = {
  'metadata, identities and authorization': [
    'contracts/definition-projection.js', 'contracts/current-2d-editor.js',
    'contracts/enterprise-operating-graph-sop.js',
    'apps/eog-2d-designer/package.js', 'apps/eog-2d-viewer/package.js',
    'apps/eog-3d-viewer/package.js', 'apps/enterprise-observatory/package.js',
    'providers/eog-bottleneck-analysis/package.js', 'apps/eog-2d-designer/authorization.js'
  ],
  'shared synchronous services and persistence closures': [
    'manager/eog-service-runtime.js', 'apps/eog-2d-designer/definition-persistence.js',
    'manager/enterprise-operating-graph-service.js', 'manager/enterprise-operating-graph-sop-service.js',
    'providers/eog-view-state/store.js', 'providers/eog-view-state/runtime.js',
    'providers/enterprise-context/definition-projection-store.js', 'providers/enterprise-context/definition-projection.js'
  ],
  'request tool descriptors and resolver closures': [
    'manager/enterprise-operating-graph-agent-tools.js',
    'manager/enterprise-operating-graph-sop-agent-tools.js',
    'manager/enterprise-operating-graph-observatory-agent-tools.js',
    'apps/eog-2d-designer/current-2d-editor-agent-tools.js',
    'manager/enterprise-operating-graph-observatory-provider.js',
    'manager/enterprise-operating-graph-inspector-provider.js'
  ],
  // Only import is covered here. Its explicitly conditional startup migration
  // and preview functions may do business IO; existing Host tests cover those.
  'conditional compatibility entry module': ['manager/eog-startup-compatibility.js']
};

function probe(mode, modules = []) {
  const env = {...process.env};
  delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, [fileURLToPath(new URL('../fixtures/eog-retained-import-probe.mjs', import.meta.url)), mode, ...modules], {
    env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 15000
  });
}

test('pre-import resource guard detects swallowed ESM side effects', () => probe('canary'));
for (const [group, modules] of Object.entries(groups)) {
  test('retained EOG imports perform no guarded resource work: ' + group, () => probe('imports', modules));
}
