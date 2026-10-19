// Isolated audit instrumentation only. Never imported by the application.
import { register } from 'node:module';
import { MessageChannel, receiveMessageOnPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const loaded = new Set();
// Keep Node 22 CommonJS dependencies on the default loader. The synchronous
// hook caused ERR_VM_MODULE_LINK_FAILURE for @npmcli/agent's require('net').
const { port1, port2 } = new MessageChannel();
port1.unref();
register('./plugin-loading-audit-loader.mjs', {
  parentURL: import.meta.url, data: { port: port2 }, transferList: [port2]
});
function drainLoadedModules() {
  let entry;
  while ((entry = receiveMessageOnPort(port1))) loaded.add(entry.message);
  return [...loaded].sort();
}
const intervals = new Map();
const set = globalThis.setInterval;
const clear = globalThis.clearInterval;
globalThis.setInterval = function (callback, delay, ...args) {
  const timer = set(callback, delay, ...args);
  intervals.set(timer, { delayMs: delay, origin: new Error().stack?.split('\n')
    .slice(2, 5).map(line => line.replaceAll(root, '<repo>/')).join('\n') });
  return timer;
};
globalThis.clearInterval = function (timer) { intervals.delete(timer); return clear(timer); };
const send = process.send?.bind(process);
process.send = function (message, ...args) {
  if (message?.kind === 'host-baseline') message = { ...message,
    loadedModules: drainLoadedModules(),
    registeredIntervals: [...intervals].map(([timer, value]) => ({ ...value, referenced: timer.hasRef() }))
  };
  return send?.(message, ...args);
};
// Reuse loopback-only listener and outbound TCP block; no production connection.
await import('./lightweight-host-probe.mjs');

// Test-only post-request inventory; never installed in the production Host.
process.on('message', message => {
  if (message?.kind === 'audit-module-snapshot') {
    send?.({ kind: 'audit-module-snapshot', id: message.id, loadedModules: drainLoadedModules() });
  }
});
