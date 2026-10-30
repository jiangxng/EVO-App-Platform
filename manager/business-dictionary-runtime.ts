import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { EnterpriseResourceRepositoryV010 } from "../contracts/enterprise-resource.js";
import type {
  BusinessDictionaryRepositoryV010,
  createBusinessDictionaryRepositoryV010
} from "../apps/business-dictionary/repository.js";

/** Optional plugin owner, loaded only when an authorized operation needs it. */
export function createBusinessDictionaryRuntimeHostV010(input: {
  isActive(): boolean;
  resources: EnterpriseResourceRepositoryV010;
  loadFactory?: () => Promise<typeof createBusinessDictionaryRepositoryV010>;
}) {
  let generation = 0;
  const lease = createLazyProviderRuntimeV010<BusinessDictionaryRepositoryV010>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const factory = await (input.loadFactory ? input.loadFactory()
        : import("../apps/business-dictionary/repository.js").then(x => x.createBusinessDictionaryRepositoryV010));
      const check = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const repo = factory(input.resources);
      return {
        list(...args) { check(); return repo.list(...args); },
        get(...args) { check(); return repo.get(...args); },
        getEffective(...args) { check(); return repo.getEffective(...args); },
        history(...args) { check(); return repo.history(...args); },
        saveDraft(...args) { check(); return repo.saveDraft(...args); },
        publish(...args) { check(); return repo.publish(...args); },
        resolveBatch(...args) { check(); return repo.resolveBatch(...args); }
      };
    }
  });
  return {
    resolve: () => lease.run(async repository => repository),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics
  };
}
