export const EOG_APPLICATION_RUNTIME_BINDING_VERSION_V010 = "0.1.0" as const;

export interface EogApplicationRuntimeBindingV010 {
  contractVersion: typeof EOG_APPLICATION_RUNTIME_BINDING_VERSION_V010;
  bindingId: string;
  enterpriseId: string;
  hostApplicationRefId: string;
  runtimeProviderId: string;
  runtimeKind: "EVO_APPLICATION_ANCHOR";
  runtimeApplicationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EogApplicationRuntimeBindingSnapshotV010 {
  contractVersion: typeof EOG_APPLICATION_RUNTIME_BINDING_VERSION_V010;
  bindings: EogApplicationRuntimeBindingV010[];
}
