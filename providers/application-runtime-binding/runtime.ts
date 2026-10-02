import type {
  EnterpriseApplicationRuntimeBindingProviderV010,
  EnterpriseApplicationRuntimeBindingV010
} from "../../contracts/enterprise-application-runtime-binding.js";
import type {
  EnterpriseApplicationRuntimeBindingStoreV010
} from "./store.js";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function createEnterpriseApplicationRuntimeBindingProviderV010(input: {
  store: EnterpriseApplicationRuntimeBindingStoreV010;
  now?: () => Date;
}): EnterpriseApplicationRuntimeBindingProviderV010 {
  const now = input.now ?? (() => new Date());

  return {
    bind(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      const hostApplicationRefId = required(
        request.hostApplicationRefId,
        "EOG_HOST_APPLICATION_REF_REQUIRED"
      );
      const runtimeProviderId = required(
        request.runtimeProviderId,
        "EOG_RUNTIME_PROVIDER_ID_REQUIRED"
      );
      const runtimeApplicationId = required(
        request.runtimeApplicationId,
        "EOG_RUNTIME_APPLICATION_ID_REQUIRED"
      );
      const existing = input.store.get({
        enterpriseId,
        hostApplicationRefId,
        runtimeProviderId
      });
      const timestamp = now().toISOString();
      return input.store.put({
        contractVersion: "0.1.0",
        bindingId: existing?.bindingId
          ?? [
              "eog-app-runtime",
              encodeURIComponent(enterpriseId),
              encodeURIComponent(hostApplicationRefId),
              encodeURIComponent(runtimeProviderId)
            ].join(":"),
        enterpriseId,
        hostApplicationRefId,
        runtimeProviderId,
        runtimeKind: "EVO_APPLICATION_ANCHOR",
        runtimeApplicationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp
      });
    },

    resolve(request) {
      return input.store.get(request);
    },

    list(enterpriseId) {
      return input.store.listByEnterprise(enterpriseId);
    }
  };
}
