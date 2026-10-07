export const ENTERPRISE_RESOURCE_CAPABILITY_V010 =
  "enterprise.resource.repository" as const;
export const ENTERPRISE_RESOURCE_CONTRACT_V010 =
  "evo.enterprise.resource-repository" as const;

export type EnterpriseResourceStorageKindV010 =
  | "DOCUMENT"
  | "TABLE"
  | "OBJECT"
  | "REFERENCE";

export type EnterpriseResourceLifecycleStateV010 =
  | "ACTIVE"
  | "ARCHIVED";

export type EnterpriseResourceJsonV010 =
  | null
  | boolean
  | number
  | string
  | EnterpriseResourceJsonV010[]
  | { [key: string]: EnterpriseResourceJsonV010 };

export interface EnterpriseResourceAddressV010 {
  contextId: string;
  namespace: string;
  collectionId: string;
  resourceType: string;
  resourceId: string;
}

export interface EnterpriseResourceV010
  extends EnterpriseResourceAddressV010 {
  contractVersion: "0.1.0";
  schemaRef: string;
  ownerPackageId?: string;
  storageKind: EnterpriseResourceStorageKindV010;
  payload?: EnterpriseResourceJsonV010;
  payloadRef?: string;
  metadata?: Record<string, EnterpriseResourceJsonV010>;
  lifecycleState: EnterpriseResourceLifecycleStateV010;
  createdAt: string;
  createdBySubjectId: string;
  updatedAt: string;
  updatedBySubjectId: string;
}

export interface EnterpriseResourceListInputV010 {
  contextId: string;
  namespace?: string;
  collectionId?: string;
  resourceType?: string;
  lifecycleState?: EnterpriseResourceLifecycleStateV010;
}

export interface EnterpriseResourcePutInputV010
  extends EnterpriseResourceAddressV010 {
  schemaRef: string;
  ownerPackageId?: string;
  storageKind?: EnterpriseResourceStorageKindV010;
  payload?: EnterpriseResourceJsonV010;
  payloadRef?: string;
  metadata?: Record<string, EnterpriseResourceJsonV010>;
  actorSubjectId: string;
  recordedAt: string;
}

export interface EnterpriseResourceRepositoryV010 {
  transaction?<T>(work: () => T): T;
  get(
    address: EnterpriseResourceAddressV010
  ): EnterpriseResourceV010 | undefined;
  list(
    input: EnterpriseResourceListInputV010
  ): EnterpriseResourceV010[];
  put(
    input: EnterpriseResourcePutInputV010
  ): EnterpriseResourceV010;
  putMany?(
    inputs: EnterpriseResourcePutInputV010[]
  ): EnterpriseResourceV010[];
  archive(input: {
    address: EnterpriseResourceAddressV010;
    actorSubjectId: string;
    recordedAt: string;
  }): EnterpriseResourceV010;
}
