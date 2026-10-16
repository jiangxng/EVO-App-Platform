import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { createCounterpartyRuntimeV010, CounterpartyRuntimeV010 } from "../apps/counterparty/runtime.js";

type Factory = typeof createCounterpartyRuntimeV010;
/** Reuse the existing activation lease; this is application wiring, not a new Provider. */
export function createCounterpartyRuntimeHostV010(input: {
  isActive(): boolean;
  dependencies: Parameters<Factory>[0];
  loadFactory?: () => Promise<Factory>;
}) {
  const lease = createLazyProviderRuntimeV010<CounterpartyRuntimeV010>({
    isActive: input.isActive,
    async load() {
      const factory = await (input.loadFactory
        ? input.loadFactory()
        : import("../apps/counterparty/runtime.js").then(module => module.createCounterpartyRuntimeV010));
      if (!input.isActive() || lease.diagnostics().blocked) {
        throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
      }
      return factory(input.dependencies);
    }
  });
  return {
    resolve: () => lease.run(async runtime => ({
      ...runtime,
      assertAvailable() {
        if (!input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      }
    })),
    stop: lease.stop,
    diagnostics: lease.diagnostics
  };
}
