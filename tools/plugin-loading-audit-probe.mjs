// Isolated audit instrumentation only. Never imported by the application.
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const loaded = new Set();
registerHooks({ load(url, context, next) {
  const result = next(url, context);
  if (url.startsWith('file:')) {
    const relative = path.relative(root, fileURLToPath(url)).split(path.sep).join('/');
    if (relative.startsWith('dist/')) loaded.add(relative);
  }
  return result;
}});
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
    loadedModules: [...loaded].sort(),
    registeredIntervals: [...intervals].map(([timer, value]) => ({ ...value, referenced: timer.hasRef() }))
  };
  return send?.(message, ...args);
};
// Reuse loopback-only listener and outbound TCP block; no production connection.
await import('./lightweight-host-probe.mjs');
