export const ENTERPRISE_APPLICATION_RUNTIME_BINDING_VERSION_V010 =
  "0.1.0" as const;

export const ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010 =
  "enterprise.application-runtime-binding" as const;

export const ENTERPRISE_APPLICATION_RUNTIME_BINDING_CONTRACT_V010 =
  "evo.enterprise.application-runtime-binding" as const;

export interface EnterpriseApplicationRuntimeBindingV010 {
  contractVersion: typeof ENTERPRISE_APPLICATION_RUNTIME_BINDING_VERSION_V010;
  bindingId: string;
  enterpriseId: string;
  hostApplicationRefId: string;
  runtimeProviderId: string;
  runtimeKind: "EVO_APPLICATION_ANCHOR";
  runtimeApplicationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseApplicationRuntimeBindingSnapshotV010 {
  contractVersion: typeof ENTERPRISE_APPLICATION_RUNTIME_BINDING_VERSION_V010;
  bindings: EnterpriseApplicationRuntimeBindingV010[];
}

export interface EnterpriseApplicationRuntimeBindingProviderV010 {
  bind(input: {
    enterpriseId: string;
    hostApplicationRefId: string;
    runtimeProviderId: string;
    runtimeApplicationId: string;
  }): EnterpriseApplicationRuntimeBindingV010;
  resolve(input: {
    enterpriseId: string;
    hostApplicationRefId: string;
    runtimeProviderId: string;
  }): EnterpriseApplicationRuntimeBindingV010 | undefined;
  list(enterpriseId: string): EnterpriseApplicationRuntimeBindingV010[];
}
