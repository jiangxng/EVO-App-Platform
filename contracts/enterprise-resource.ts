import type { AgentActionReceiptBeginInputV010, AgentActionReceiptV010 } from "./agent-action-receipt.js";
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
  /** Present only for resources governed by conditional writes. Legacy records remain unversioned. */
  revision?: number;
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

/**
 * A null expectedRevision is an atomic create-if-absent (including archived IDs).
 * A numeric expectedRevision is an atomic compare-and-update against current revision.
 * Legacy unversioned records have effective revision 0 for conditional migration.
 * Conflict: ENTERPRISE_RESOURCE_REVISION_CONFLICT. Unknown result: read back before retry.
 */
export interface EnterpriseResourceConditionalPutInputV010
  extends EnterpriseResourcePutInputV010 {
  expectedRevision: number | null;
}

export interface EnterpriseResourceConditionalArchiveInputV010 {
  address: EnterpriseResourceAddressV010;
  expectedRevision: number;
  actorSubjectId: string;
  recordedAt: string;
}

/**
 * PROCESS_LOCAL cannot prove a shared multi-Worker authority.
 * SAME_FILESYSTEM_LOCK is an OS-filesystem lock, NOT a cross-host datastore guarantee.
 * A future production store must declare its separately certified authority.
 */
export type EnterpriseResourceConditionalConsistencyV010 =
  | "PROCESS_LOCAL"
  | "SAME_FILESYSTEM_LOCK"
  /** Exactly one PostgreSQL primary authority shared by all writers; not a production deployment certification. */
  | "SHARED_POSTGRES_TRANSACTION";

export interface EnterpriseResourceRepositoryV010 {
  /** Explicitly scoped conditional-write guarantee; do not infer from method presence. */
  readonly conditionalWriteConsistency?: EnterpriseResourceConditionalConsistencyV010;
  transaction?<T>(work: () => T): T;
  /** Optional: unsupported implementations must fail closed, not emulate get→put. */
  putIfRevision?(
    input: EnterpriseResourceConditionalPutInputV010
  ): EnterpriseResourceV010;
  archiveIfRevision?(
    input: EnterpriseResourceConditionalArchiveInputV010
  ): EnterpriseResourceV010;
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

/**
 * Asynchronous conditional-only resource adapter for a shared PostgreSQL authority.
 * It does NOT implement the legacy synchronous EnterpriseResourceRepositoryV010.
 * Callers must not fall back to ordinary get/put when this store is unavailable.
 * A separately governed Host/Feature owner must authorize every use.
 */
export interface EnterpriseResourceConditionalAsyncRepositoryV010 {
  readonly conditionalWriteConsistency: "SHARED_POSTGRES_TRANSACTION";
  get(address: EnterpriseResourceAddressV010): Promise<EnterpriseResourceV010 | undefined>;
  list(input: EnterpriseResourceListInputV010): Promise<EnterpriseResourceV010[]>;
  putIfRevision(input: EnterpriseResourceConditionalPutInputV010): Promise<EnterpriseResourceV010>;
  /**
   * Optional: immutable Host receipt and resource CAS in ONE durable transaction.
   * No fallback to putIfRevision is permitted for a receipt-required WRITE.
   */
  putIfRevisionWithReceipt?(
    input: EnterpriseResourceConditionalPutInputV010,
    signedApproval: EnterpriseResourceSignedHostReceiptV010
  ): Promise<EnterpriseResourceCommittedWriteV010>;
  /**
   * Historical committed receipt readback, scoped to original resource and actor.
   * Absence/ambiguous result must not be interpreted as a failed database commit.
   */
  getCommittedWriteByIdempotencyKey?(
    query: EnterpriseResourceCommittedWriteLookupV010
  ): Promise<EnterpriseResourceCommittedWriteV010 | undefined>;
  archiveIfRevision(input: EnterpriseResourceConditionalArchiveInputV010): Promise<EnterpriseResourceV010>;
  close(): Promise<void>;
}

/** Immutable result of one committed resource revision + Host-approved receipt. */
export interface EnterpriseResourceCommittedWriteV010 {
  resource: EnterpriseResourceV010;
  receipt: AgentActionReceiptV010;
  replayed: boolean;
}

export interface EnterpriseResourceCommittedWriteLookupV010 {
  address: EnterpriseResourceAddressV010;
  idempotencyKey: string;
  receiptId: string;
  inputDigest: string;
  principalSubjectId: string;
  principalActorType: "HUMAN" | "AI";
}

/**
 * Host-issued signed admission for one exact conditional resource write.
 * The receipt keeps the original Agent Action Receipt data contract; proof
 * is a separate envelope, never user/model action values or an authorization
 * substitute. PostgreSQL Owner verifies the signature before its CAS tx.
 */
export interface EnterpriseResourceSignedHostReceiptV010 {
  receipt: AgentActionReceiptBeginInputV010;
  proof: {
    contractVersion: "0.1.0";
    purpose: "cv03.enterprise-resource.host-write";
    keyId: string;
    algorithm: "HMAC-SHA256";
    signature: string;
  };
}
