import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { PersonnelRepositoryV010, createPersonnelRepositoryV010 } from "../apps/personnel/repository.js";
import type { OrganizationRepositoryV010 } from "../apps/organization/repository.js";
import type { EnterpriseResourceRepositoryV010 } from "../contracts/enterprise-resource.js";

/** Business personnel uses the active organization owner's public read boundary. */
export function createPersonnelRuntimeHostV010(input: {
  isActive(): boolean;
  resources: EnterpriseResourceRepositoryV010;
  organization(): Promise<OrganizationRepositoryV010>;
  loadFactory?: () => Promise<typeof createPersonnelRepositoryV010>;
}) {
  let generation = 0;
  const lease = createLazyProviderRuntimeV010<PersonnelRepositoryV010>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const [factory, org] = await Promise.all([
        input.loadFactory ? input.loadFactory() :
          import("../apps/personnel/repository.js").then(x => x.createPersonnelRepositoryV010),
        input.organization()
      ]);
      const check = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const repo = factory(input.resources, org);
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
  return { resolve: () => lease.run(async repo => repo),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics };
}
