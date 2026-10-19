import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { EnterpriseResourceRepositoryV010 } from "../contracts/enterprise-resource.js";
import type { ObjectExtensionDefinitionReaderV010 } from "../contracts/foundation-object/extension.js";
import type { ObjectExtensionValueReaderV010 } from "../contracts/foundation-object/extension-value.js";
import type { createObjectExtensionRepositoryV010, ObjectExtensionRepositoryV010 } from "../apps/object-extension/repository.js";
import type { createObjectExtensionValueRepositoryV010, ObjectExtensionValueRepositoryV010 } from "../apps/object-extension/values.js";

type Scope = {
  /** The requesting management or business Feature, not the storage owner. */
  isActive(): boolean;
  resources: EnterpriseResourceRepositoryV010;
};

/** Definition access follows its consumer's lease; storage remains enterprise-owned. */
export function createObjectExtensionDefinitionRuntimeHostV010(input: Scope & {
  loadFactory?: () => Promise<typeof createObjectExtensionRepositoryV010>;
}) {
  let generation = 0;
  const lease = createLazyProviderRuntimeV010<{
    reader: ObjectExtensionDefinitionReaderV010;
    manager: ObjectExtensionRepositoryV010;
  }>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const factory = await (input.loadFactory ? input.loadFactory()
        : import("../apps/object-extension/repository.js").then(module => module.createObjectExtensionRepositoryV010));
      const check = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const repository = factory(input.resources);
      const reader: ObjectExtensionDefinitionReaderV010 = {
        list(...args) { check(); return repository.list(...args); },
        get(...args) { check(); return repository.get(...args); }
      };
      return {
        reader,
        manager: {
          ...reader,
          save(...args) { check(); return repository.save(...args); },
          archive(...args) { check(); return repository.archive(...args); }
        }
      };
    }
  });
  return {
    resolveRead: () => lease.run(async runtime => runtime.reader),
    // Only trusted Host wiring for the management action receives this facade.
    resolveManage: () => lease.run(async runtime => runtime.manager),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics
  };
}

/** Value writes remain available only to the existing governed import composition. */
export function createObjectExtensionValueRuntimeHostV010(input: Scope & {
  loadFactory?: () => Promise<typeof createObjectExtensionValueRepositoryV010>;
}) {
  let generation = 0;
  const lease = createLazyProviderRuntimeV010<{
    reader: ObjectExtensionValueReaderV010;
    writer: ObjectExtensionValueRepositoryV010;
  }>({
    isActive: input.isActive,
    async load() {
      const current = generation;
      const factory = await (input.loadFactory ? input.loadFactory()
        : import("../apps/object-extension/values.js").then(module => module.createObjectExtensionValueRepositoryV010));
      const check = () => {
        if (current !== generation || !input.isActive() || lease.diagnostics().blocked) {
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const repository = factory(input.resources);
      const reader: ObjectExtensionValueReaderV010 = {
        get(...args) { check(); return repository.get(...args); },
        listForObject(...args) { check(); return repository.listForObject(...args); }
      };
      return {
        reader,
        writer: {
          ...reader,
          save(...args) { check(); return repository.save(...args); },
          saveMany(...args) { check(); return repository.saveMany(...args); },
          archive(...args) { check(); return repository.archive(...args); }
        }
      };
    }
  });
  return {
    resolveRead: () => lease.run(async runtime => runtime.reader),
    resolveWrite: () => lease.run(async runtime => runtime.writer),
    stop() { generation++; return lease.stop(); },
    diagnostics: lease.diagnostics
  };
}
