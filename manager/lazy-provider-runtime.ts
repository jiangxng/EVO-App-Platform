/** Host-owned activation lease. Node module caches are not unloaded by stop(). */
export function createLazyProviderRuntimeV010<T>(options: {
  isActive(): boolean;
  load(): Promise<T>;
  dispose?(runtime: T): Promise<void> | void;
}) {
  let loaded: Promise<T> | undefined;
  let calls = 0;
  let blocked = false;
  let stopTask: Promise<void> | undefined;
  const idle: Array<() => void> = [];
  return {
    async run<R>(operation: (runtime: T) => Promise<R>): Promise<R> {
      if (blocked || !options.isActive()) throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
      calls++;
      try {
        loaded ??= Promise.resolve().then(options.load).catch(error => {
          loaded = undefined;
          throw error;
        });
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
      stopTask = (async () => {
        if (calls) await new Promise<void>(resolve => idle.push(resolve));
        // A failed load has no instance to dispose. Disposal failure keeps the
        // instance and blocks new work; a subsequent stop() retries disposal.
        const current = loaded;
        if (current) await options.dispose?.(await current);
        loaded = undefined;
        blocked = false;
      })().finally(() => { stopTask = undefined; });
      return stopTask;
    }
  };
}
