// Benchmark-only preload. Never imported by production host.
import net from 'node:net';
import { performance } from 'node:perf_hooks';

let blockedOutbound = 0;
net.Socket.prototype.connect = function () {
  blockedOutbound++;
  throw new Error('BENCHMARK_OUTBOUND_NETWORK_BLOCKED');
};
const listen = net.Server.prototype.listen;
let measured = false;
net.Server.prototype.listen = function (...args) {
  if (!measured) {
    measured = true;
    this.once('listening', () => {
      const readyMs = performance.now();
      const cpu = process.cpuUsage();
      setTimeout(() => {
        const resources = {};
        for (const name of process.getActiveResourcesInfo()) resources[name] = (resources[name] ?? 0) + 1;
        process.send?.({ kind: 'host-baseline', readyMs, port: this.address().port,
          idleWindowMs: performance.now() - readyMs,
          idleCpuMicros: process.cpuUsage(cpu), memoryBytes: process.memoryUsage(),
          activeResources: resources, blockedOutbound,
          note: 'Includes benchmark IPC and one sampling Timeout; no business workload.' });
      }, 500);
    });
    // Benchmark process must only listen on loopback, even if host uses wildcard.
    if (typeof args[0] === 'number') args.splice(1, 0, '127.0.0.1');
  }
  return listen.apply(this, args);
};
