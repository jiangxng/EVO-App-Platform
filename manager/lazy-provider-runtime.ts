export type LazyProviderPhaseV010 =
  | "IDLE" | "LOADING" | "READY" | "STOPPING" | "STOP_TIMEOUT" | "STOP_FAILED" | "STOPPED";

/** Host-owned activation lease. Node module caches are not unloaded by stop(). */
export function createLazyProviderRuntimeV010<T>(options: {
  isActive(): boolean;
  load(): Promise<T>;
  dispose?(runtime: T): Promise<void> | void;
  /** Bounds the caller's wait, not the lifetime of accepted work or disposal. */
  stopTimeoutMs?: number;
}) {
  const stopTimeoutMs = options.stopTimeoutMs ?? 30_000;
  if (!Number.isInteger(stopTimeoutMs) || stopTimeoutMs < 1 || stopTimeoutMs > 2_147_483_647) {
    throw new Error("PROVIDER_STOP_TIMEOUT_INVALID");
  }
  let loaded: Promise<T> | undefined;
  let calls = 0;
  let blocked = false;
  let phase: LazyProviderPhaseV010 = "IDLE";
  let cleanupTask: Promise<void> | undefined;
  let stopTask: Promise<void> | undefined;
  let stopAttempts = 0;
  const idle: Array<() => void> = [];
  return {
    diagnostics() {
      return { phase, activeCalls: calls, blocked, cleanupPending: cleanupTask !== undefined, stopAttempts };
    },
    async run<R>(operation: (runtime: T) => Promise<R>): Promise<R> {
      if (blocked || !options.isActive()) throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
      calls++;
      try {
        if (!loaded) {
          phase = "LOADING";
          loaded = Promise.resolve().then(options.load).then(runtime => {
            if (!blocked) phase = "READY";
            return runtime;
          }).catch(error => {
            loaded = undefined;
            if (!blocked) phase = "IDLE";
            throw error;
          });
        }
        const runtime = await loaded;
        // Loading may finish after disable; do not start an operation in that case.
        if (blocked || !options.isActive()) throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        return await operation(runtime);
      } finally {
        calls--;
        if (calls === 0) idle.splice(0).forEach(resolve => resolve());
      }
    },
    stop(): Promise<void> {
      if (stopTask) return stopTask;
      blocked = true;
      phase = "STOPPING";
      stopAttempts++;
      if (!cleanupTask) {
        // Start on a microtask so even an empty lease has consistent task ownership.
        cleanupTask = Promise.resolve().then(async () => {
          if (calls) await new Promise<void>(resolve => idle.push(resolve));
          // Failed load has no instance. Failed disposal retains it for retry.
          const current = loaded;
          if (current) await options.dispose?.(await current);
          loaded = undefined;
        }).then(() => {
          cleanupTask = undefined;
          blocked = false;
          phase = "STOPPED";
        }, error => {
          cleanupTask = undefined;
          phase = "STOP_FAILED";
          throw error;
        });
      }
      // Timing out only ends this wait. The underlying drain/dispose retains its
      // lease and may complete later; retry observes it, never disposes twice.
      const cleanup = cleanupTask;
      stopTask = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          phase = "STOP_TIMEOUT";
          reject(new Error("PROVIDER_STOP_TIMEOUT"));
        }, stopTimeoutMs);
        cleanup.then(() => {
          clearTimeout(timer);
          resolve();
        }, error => {
          clearTimeout(timer);
          reject(error);
        });
      }).finally(() => { stopTask = undefined; });
      return stopTask;
    }
  };
}
