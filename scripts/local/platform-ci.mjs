import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const cache = resolve('.local/local-tools');
mkdirSync(cache, { recursive: true });
const snapshot = mkdtempSync(join(cache, 'ci-source-'));
const image = 'evo-platform-local-ci:node22';
const withDatabase = process.argv.includes('--postgres');
const identity = 'evo-local-ci-' + randomUUID().slice(0, 8);
const database = identity + '-postgres';
let networkCreated = false;
let databaseCreated = false;
const paths = ['.', ':!:node_modules', ':!:dist', ':!:.local', ':!:artifacts', ':!:.env', ':!:.env.*'];
function run(program, args) {
  const result = spawnSync(program, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(`${program} failed (${result.error || result.status})`);
}
try {
  // Include current edits/new files; never include Git credentials, local state or installed dependencies.
  // Git's EOL metadata distinguishes CRLF text from binary files. This gives the Linux job
  // the LF checkout it receives in Actions, without rewriting the Windows working tree.
  const listing = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--eol', '-z', '--', ...paths], { maxBuffer: 32 * 1024 * 1024 }).toString('utf8');
  let count = 0;
  for (const record of new Set(listing.split('\0').filter(Boolean))) {
    const tab = record.indexOf('\t');
    const metadata = record.slice(0, tab);
    const path = record.slice(tab + 1);
    if (tab < 0 || path.split('/').some(part => ['.git', '.local', 'node_modules', 'dist'].includes(part))) continue;
    const source = resolve(root, path);
    const destination = resolve(snapshot, path);
    if (!source.startsWith(resolve(root) + sep) || !destination.startsWith(snapshot + sep)) throw new Error(`Unsafe snapshot path: ${path}`);
    if (!existsSync(source)) continue; // Deletions in the current worktree remain deletions.
    if (!lstatSync(source).isFile()) throw new Error(`Only ordinary source files are supported: ${path}`);
    let bytes = readFileSync(source);
    if (/w\/(?:crlf|mixed)\s/.test(metadata) && !metadata.includes('-text')) {
      bytes = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
    }
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
    count++;
  }
  console.log(`Linux source snapshot: ${count} files. No host environment or production database credentials forwarded.`);
  run('docker', ['build', '--tag', image, '--file', join(snapshot, 'scripts/local/ci.Dockerfile'), snapshot]);
  const runtimeArgs = ['run', '--rm', '--init'];
  if (withDatabase) {
    run('docker', ['network', 'create', '--internal', identity]);
    networkCreated = true;
    run('docker', ['run', '-d', '--name', database, '--network', identity, '--network-alias', 'postgres',
      '-e', 'POSTGRES_USER=evo_ci', '-e', 'POSTGRES_PASSWORD=local-ci-only', '-e', 'POSTGRES_DB=evo_ci', 'postgres:18']);
    databaseCreated = true;
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnSync('docker', ['exec', database, 'pg_isready', '-U', 'evo_ci', '-d', 'evo_ci'], { stdio: 'ignore' }).status === 0) {
        ready = true; break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error('Disposable PostgreSQL did not become ready.');
    runtimeArgs.push('--network', identity, '-e', 'PA02A_PROOF_DATABASE_URL=postgres://evo_ci:local-ci-only@postgres:5432/evo_ci');
  }
  console.log('Running npm run test:platform. Full output will be saved in .local/local-tools/platform-output-last.log.');
  const result = spawnSync('docker', [...runtimeArgs, image], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  writeFileSync(join(cache, 'platform-output-last.log'), output);
  console.log(output.split('\n').slice(result.status === 0 ? -18 : -60).join('\n'));
  if (result.error || result.status !== 0) throw new Error(`Platform tests failed (${result.error || result.status}); inspect platform-output-last.log.`);
  if (withDatabase && !output.includes('PA04_C02_DERIVED_REVOCATION_PG=')) {
    throw new Error('PostgreSQL acceptance marker missing; a skipped test is not a database pass.');
  }
} finally {
  if (databaseCreated) {
    const cleanup = spawnSync('docker', ['rm', '-f', '-v', database], { stdio: 'ignore' });
    if (cleanup.status !== 0) console.error(`Could not remove disposable container: ${database}`);
  }
  if (networkCreated) {
    const cleanup = spawnSync('docker', ['network', 'rm', identity], { stdio: 'ignore' });
    if (cleanup.status !== 0) console.error(`Could not remove disposable network: ${identity}`);
  }
  // Delete only this invocation's generated snapshot under the known local cache directory.
  const withinCache = relative(cache, snapshot);
  if (!withinCache.startsWith('..') && withinCache.startsWith('ci-source-') && dirname(snapshot) === cache) {
    rmSync(snapshot, { recursive: true, force: true });
  }
}
