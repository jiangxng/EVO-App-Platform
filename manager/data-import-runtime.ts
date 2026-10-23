import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { createDataImportRuntimeV010, DataImportRuntimeV010 } from "../apps/data-import/runtime.js";

type Factory = typeof createDataImportRuntimeV010;
export function createDataImportRuntimeHostV010(input: {
  isActive(): boolean;
  dependencies: Parameters<Factory>[0];
  loadFactory?: () => Promise<Factory>;
}) {
  let generation = 0;
  type Runtime = DataImportRuntimeV010 & {assertAvailable(): void};
  const lease: ReturnType<typeof createLazyProviderRuntimeV010<Runtime>> = createLazyProviderRuntimeV010<Runtime>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const factory = await (input.loadFactory ? input.loadFactory()
        : import("../apps/data-import/runtime.js").then(module => module.createDataImportRuntimeV010));
      const check = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const raw = factory(input.dependencies);
      return {
        assertAvailable: check,
        repository: {
          get(...args) { check(); return raw.repository.get(...args); },
          list(...args) { check(); return raw.repository.list(...args); },
          save(...args) { check(); return raw.repository.save(...args); },
          archive(...args) { check(); return raw.repository.archive(...args); }
        },
        recipeRepository: {
          findBySource(...args) { check(); return raw.recipeRepository.findBySource(...args); },
          get(...args) { check(); return raw.recipeRepository.get(...args); },
          list(...args) { check(); return raw.recipeRepository.list(...args); },
          recordValidated(...args) { check(); return raw.recipeRepository.recordValidated(...args); },
          recordSuccessful(...args) { check(); return raw.recipeRepository.recordSuccessful(...args); }
        },
        ...(raw.experienceAdvisor ? {experienceAdvisor: {
          recommend: (...args: Parameters<NonNullable<DataImportRuntimeV010["experienceAdvisor"]>["recommend"]>) =>
            lease.run(async () => { check(); return raw.experienceAdvisor!.recommend(...args); }),
          recordSuccessful: (...args: Parameters<NonNullable<DataImportRuntimeV010["experienceAdvisor"]>["recordSuccessful"]>) =>
            lease.run(async () => { check(); return raw.experienceAdvisor!.recordSuccessful(...args); })
        }} : {})
      };
    }
  });
  return {
    resolve: () => lease.run(async runtime => runtime),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics
  };
}
