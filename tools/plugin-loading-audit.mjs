import { fork, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2];
if (!output) throw new Error('Usage: node tools/plugin-loading-audit.mjs <report.json>');
function files(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory() ? files(path.join(directory, entry.name), relative)
      : [{ path: relative.split(path.sep).join('/'), bytes: fs.statSync(path.join(directory, entry.name)).size }];
  }).sort((a, b) => a.path.localeCompare(b.path));
}
async function sample(name, directory, profile, extra = {}) {
  const state = path.join(directory, 'state.json');
  const child = fork(path.join(root, 'dist/manager/server.js'), [], {
    cwd: root, execArgv: ['--import', path.join(root, 'tools/plugin-loading-audit-probe.mjs')],
    env: { PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
      APP_PLATFORM_STATE_FILE: state, APP_PLATFORM_STARTUP_PROFILE: profile,
      APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true', ...extra },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  child.stdout.resume();
  let stderr = '', timer;
  child.stderr.on('data', data => { stderr = (stderr + data).slice(-10000); });
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  try {
    const report = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('AUDIT_START_TIMEOUT')), 30000);
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`AUDIT_EARLY_EXIT ${code}: ${stderr}`)));
      child.on('message', message => { if (message.kind === 'host-baseline') resolve(message); });
    });
    clearTimeout(timer);
    const lifecycle = JSON.parse(fs.readFileSync(state, 'utf8'));
    const inventory = files(directory);
    const storedFiles = inventory.filter(file => !file.path.startsWith('web-assets/'));
    const archived = inventory.filter(file => file.path.startsWith('web-assets/'));
    const archiveAreas = {};
    for (const file of archived) {
      const area = file.path.split('/')[2];
      archiveAreas[area] ??= { files: 0, bytes: 0 };
      archiveAreas[area].files++; archiveAreas[area].bytes += file.bytes;
    }
    const archivedAssets = { files: archived.length,
      bytes: archived.reduce((sum, file) => sum + file.bytes, 0), areas: archiveAreas };
    child.kill('SIGTERM');
    timer = setTimeout(() => child.kill('SIGKILL'), 7000);
    const shutdown = await exited;
    if (shutdown.code !== 0 || stderr || report.blockedOutbound !== 0
      || !report.loadedModules.includes('dist/manager/server.js')) {
      throw new Error('AUDIT_INVALID: ' + JSON.stringify({ shutdown, stderr, blockedOutbound: report.blockedOutbound }));
    }
    // Hook instrumentation makes these unsuitable for performance comparisons.
    const { port, readyMs, memoryBytes, idleCpuMicros, ...observations } = report;
    return { profile: name, ...observations, installedPackages: lifecycle.installedPackages.map(p => p.packageId).sort(),
      activeFeatures: lifecycle.activeFeatures.map(f => ({ packageId: f.packageId, featureId: f.featureId })),
      storedFiles, archivedAssets, shutdown };
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited; }
  }
}
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-loading-audit-'));
const samples = [];
try {
  const minimal = path.join(directory, 'minimal'), compatible = path.join(directory, 'compatible');
  fs.mkdirSync(minimal); fs.mkdirSync(compatible);
  samples.push(await sample('minimal-uninstalled', minimal, 'minimal'));
  samples.push(await sample('compatible-installed-unused', compatible, 'compatible'));
  const statePath = path.join(compatible, 'state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const disabledPackages = ['evo-counterparty', 'evo-object-extension', 'evo-data-import',
    'evo-eog-2d', 'evo-eog-3d', 'evo-enterprise-observatory', 'eog-bottleneck-analysis-provider'];
  state.activeFeatures = state.activeFeatures.filter(f => !disabledPackages.includes(f.packageId));
  fs.writeFileSync(statePath, JSON.stringify(state));
  const disabled = await sample('compatible-disabled-restart', compatible, 'compatible');
  if (disabled.activeFeatures.some(f => disabledPackages.includes(f.packageId))) throw new Error('DISABLED_FEATURE_REACTIVATED');
  samples.push({ ...disabled, disabledPackages });
  const scheduled = path.join(directory, 'scheduled'); fs.mkdirSync(scheduled);
  samples.push(await sample('minimal-scheduler-configured', scheduled, 'minimal', {
    APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '60000'
  }));
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
const loadedModuleSets = {};
for (const sample of samples) {
  const key = createHash('sha256').update(JSON.stringify(sample.loadedModules)).digest('hex');
  loadedModuleSets[key] = sample.loadedModules;
  sample.loadedModuleSet = key;
  sample.loadedModuleCount = sample.loadedModules.length;
  delete sample.loadedModules;
}
const report = {
  schemaVersion: 1, measuredAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceState: 'working tree; file hashes identify measured source',
  measuredFilesSha256: Object.fromEntries(['manager/server.ts', 'dist/manager/server.js',
    'tools/plugin-loading-audit.mjs', 'tools/plugin-loading-audit-probe.mjs', 'tools/lightweight-host-probe.mjs']
    .map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])),
  environment: { node: process.version, platform: process.platform, architecture: process.arch },
  scope: 'Isolated empty file storage; no production secrets or business requests. One sample/profile at ~500ms. Load hooks prove module loading, not instance creation or heap retention. Interval registration is not tick execution. File inventory is not database connection evidence. No performance conclusions.',
  loadedModuleSets, samples
};
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(samples.map(s => ({ profile: s.profile, installed: s.installedPackages.length,
  loadedModules: s.loadedModuleCount, intervals: s.registeredIntervals.length, stateFiles: s.storedFiles.length, archivedAssets: s.archivedAssets.files,
  blockedOutbound: s.blockedOutbound, exit: s.shutdown.code })), null, 2));
