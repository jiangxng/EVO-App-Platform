import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const cacheDir = resolve('.local/local-tools');
mkdirSync(cacheDir, { recursive: true });
const marker = join(cacheDir, 'build-cache.json');
let saved = {};
try { saved = JSON.parse(readFileSync(marker, 'utf8')); } catch {}
const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (!(major >= 26 || (major === 24 && minor >= 15) || (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))))) {
  throw new Error(`Node ${process.versions.node} does not satisfy package.json engines. Use Node 22.22.2+ or 24.15.0+ (within those major versions), or 26+.`);
}
function digest(paths) {
  const hash = createHash('sha256').update(process.version).update(process.platform).update(process.arch);
  function visit(path) {
    if (!existsSync(path)) { hash.update(`missing:${path}\0`); return; }
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(path, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Unexpected build-input symlink: ${file}`);
      if (entry.isDirectory()) visit(file);
      else { hash.update(file).update('\0').update(readFileSync(file)).update('\0'); }
    }
  }
  for (const path of paths) {
    if (path.endsWith('/')) visit(path);
    else { hash.update(path).update('\0').update(readFileSync(path)).update('\0'); }
  }
  return hash.digest('hex');
}
function npm(command) {
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd ${command}`], { stdio: 'inherit' })
    : spawnSync('npm', command.split(' '), { stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(`npm ${command} failed: ${result.error || result.status}`);
}
const dependencyKey = digest(['package.json', 'package-lock.json']);
const installStamp = 'node_modules/.local-tools-install-key';
const installed = existsSync(installStamp) ? readFileSync(installStamp, 'utf8') : '';
if (installed !== dependencyKey || !existsSync('node_modules/typescript/lib/tsc.js') || !existsSync('node_modules/.package-lock.json')) {
  npm('ci --no-audit --no-fund');
  writeFileSync(installStamp, dependencyKey);
  saved = {};
} else { console.log('Dependencies unchanged: reusing node_modules.'); }

const config = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
const inputDirs = [...new Set(config.include.map(pattern => pattern.split('/')[0] + '/'))];
const sourceKey = digest([...inputDirs, 'tsconfig.json', 'package.json', 'package-lock.json',
  'tools/copy-login-assets.mjs', 'tools/build-web-asset-manifest.mjs']);
const outputKey = existsSync('dist/manager/server.js') ? digest(['dist/']) : '';
if (saved.sourceKey !== sourceKey || !outputKey || saved.outputKey !== outputKey) {
  npm('run build');
  writeFileSync(marker, JSON.stringify({ sourceKey, outputKey: digest(['dist/']) }, null, 2));
} else { console.log('Build inputs and outputs unchanged: reusing dist.'); }
