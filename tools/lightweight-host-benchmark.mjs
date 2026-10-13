import { fork, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2];
if (!output) throw new Error('Usage: node tools/lightweight-host-benchmark.mjs <report.json>');
const profiles = [
  { name: 'managed-empty-state', config: {} },
  { name: 'managed-plus-bi-installed-unused', config: { EVO_BI_WORKBENCH_AUTOINSTALL: '1' } }
];
const samples = [];
for (let round = 1; round <= 3; round++) {
  for (const profile of profiles) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-host-baseline-'));
    const stateFile = path.join(directory, 'state.json');
    let child;
    let timer;
    try {
      let stderr = '';
      // Explicit environment: never inherit production credentials, endpoints or storage.
      child = fork(path.join(root, 'dist/manager/server.js'), [], {
        cwd: root,
        execArgv: ['--import', path.join(root, 'tools/lightweight-host-probe.mjs')],
        env: { PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
          APP_PLATFORM_STATE_FILE: stateFile, APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true',
          APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0', ...profile.config },
        stdio: ['ignore', 'pipe', 'pipe', 'ipc']
      });
      child.stdout.resume();
      child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-12000); });
      const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
      const sample = await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('HOST_BASELINE_TIMEOUT')), 30000);
        child.once('error', reject);
        child.on('message', message => { if (message.kind === 'host-baseline') resolve(message); });
        child.once('exit', code => reject(new Error('HOST_BASELINE_EARLY_EXIT: ' + code + '\n' + stderr)));
      });
      clearTimeout(timer);
      const lifecycle = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      child.kill('SIGTERM');
      timer = setTimeout(() => child.kill('SIGKILL'), 7000);
      const shutdown = await exited;
      clearTimeout(timer);
      if (sample.blockedOutbound !== 0 || shutdown.code !== 0 || stderr.trim()) {
        throw new Error('Baseline not clean: ' + JSON.stringify({ blockedOutbound: sample.blockedOutbound, shutdown, stderr }));
      }
      samples.push({ profile: profile.name, round, ...sample, shutdown,
        installedPackages: lifecycle.installedPackages.map(item => item.packageId).sort(),
        activeFeatureCount: lifecycle.activeFeatures.length });
      console.log(profile.name + ' round ' + round + ': ready ' + Math.round(sample.readyMs) + 'ms, RSS ' + Math.round(sample.memoryBytes.rss / 1048576) + 'MiB');
    } finally {
      clearTimeout(timer);
      if (child && child.exitCode === null && child.signalCode === null) {
        const stopped = new Promise(resolve => child.once('exit', resolve));
        child.kill('SIGKILL');
        await stopped;
      }
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
}
const report = {
  schemaVersion: 1, measuredAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch,
    cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, totalMemoryBytes: os.totalmem() },
  scope: 'Fresh process + empty temporary file storage; warm OS cache possible; managed authentication enabled, no credentials or business requests; not minimum host and not production load.',
  samples
};
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
