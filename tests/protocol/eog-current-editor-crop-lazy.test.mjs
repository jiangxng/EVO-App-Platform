import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

for (const [scenario, title] of [
  ['read-and-graph', 'discovery, both reads and graph crop do not load the definition editor'],
  ['preflight-denied', 'invalid, inactive and unauthorized crops reject before load or business reads'],
  ['disable', 'disable during real import rejects without business access and can recover'],
  ['access', 'access revocation during import rejects before business access'],
  ['role', 'management revocation during import rejects before business access'],
  ['target', 'editor target switch during import cannot write either resource'],
  ['write-token', 'concurrent editor write during import preserves CAS conflict and recovery'],
  ['load-error', 'module load failure performs no business work; fresh-process recovery is separate'],
  ['concurrent', 'fresh concurrent crop loads once, preserves original output and commits once']
]) test(title, () => {
  const env = {...process.env};
  delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, [fileURLToPath(new URL('../fixtures/eog-current-editor-lazy-probe.mjs', import.meta.url)), scenario], {
    env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 15000
  });
});
