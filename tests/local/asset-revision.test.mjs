import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalAssetRevisionV010 } from '../../scripts/local/asset-revision.mjs';
import { createAppHostShellHtmlV010 } from '../../dist/manager/app-host-shell.js';

test('local browser asset URLs change with the build manifest', () => {
  const manifest = readFileSync(new URL('../../dist/web-asset-manifest.json', import.meta.url));
  const current = createLocalAssetRevisionV010(manifest);
  const changedManifest = JSON.parse(manifest.toString('utf8'));
  changedManifest.files[0].sha256 = '0'.repeat(64);
  const changed = createLocalAssetRevisionV010(Buffer.from(JSON.stringify(changedManifest)));

  assert.match(current, /^local-[a-f0-9]{24}$/);
  assert.notEqual(current, changed);
  assert.equal(current, createLocalAssetRevisionV010(manifest));
  assert.match(createAppHostShellHtmlV010(current), new RegExp(`/assets/${current}/manager/app-host-client\\.js`));
});
