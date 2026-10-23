import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { EnterpriseResourceRepositoryV010 } from "../contracts/enterprise-resource.js";
import type { createResponsibilityRepositoryV010, ResponsibilityRepositoryV010 } from "../apps/responsibility/repository.js";

/** Shared dependency owned by Responsibility, never by one consuming object. */
export function createResponsibilityRuntimeHostV010(input: {
  isActive(): boolean;
  resources: EnterpriseResourceRepositoryV010;
  loadFactory?: () => Promise<typeof createResponsibilityRepositoryV010>;
}) {
  let generation = 0;
  const lease = createLazyProviderRuntimeV010<ResponsibilityRepositoryV010>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const factory = await (input.loadFactory ? input.loadFactory()
        : import("../apps/responsibility/repository.js").then(module => module.createResponsibilityRepositoryV010));
      const assertAvailable = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      assertAvailable();
      const repository = factory(input.resources);
      // These repository operations are synchronous. Check each use, including
      // references retained by projections; no new persistence or user cache.
      return {
        list(...args) { assertAvailable(); return repository.list(...args); },
        get(...args) { assertAvailable(); return repository.get(...args); },
        assign(...args) { assertAvailable(); return repository.assign(...args); },
        archive(...args) { assertAvailable(); return repository.archive(...args); }
      };
    }
  });
  return {
    resolve: () => lease.run(async repository => repository),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics
  };
}
