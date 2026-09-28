export const EOG_CONTRACT_VERSION_V010 = "0.1.0" as const;
export const PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010 = "eog:primary" as const;

export type EogGraphStateV010 = "DRAFT" | "PUBLISHED";

export type EogNodeKindV010 =
  | "APPLICATION"
  | "LEDGER";

export type EogCanonicalRefKindV010 =
  | "APPLICATION"
  | "LEDGER_DEFINITION";

export type EogCanonicalAuthorityV010 =
  | "HOST"
  | "EVO";

export interface EogCanonicalRefV010 {
  kind: EogCanonicalRefKindV010;
  authority: EogCanonicalAuthorityV010;
  refId: string;
  versionRef?: string;
}

export interface EogNodeBindingV010 {
  nodeId: string;
  kind: EogNodeKindV010;
  semanticRef: EogCanonicalRefV010;
}

export type EogGuidanceSourceKindV010 =
  | "LEGACY_POSTING_RULE_TEMPLATE"
  | "ACCOUNTING_GUIDANCE"
  | "APQC"
  | "INDUSTRY_TEMPLATE"
  | "ENTERPRISE_TEMPLATE";

export interface EogGuidanceSourceV010 {
  kind: EogGuidanceSourceKindV010;
  sourceRef: string;
}

export interface EogApplicationLedgerGuidanceRelationV010 {
  relationId: string;
  kind: "APPLICATION_LEDGER";
  applicationNodeId: string;
  ledgerNodeId: string;
  source: EogGuidanceSourceV010;
}

export interface EogApplicationLedgerEnterpriseRelationV010 {
  relationId: string;
  kind: "APPLICATION_LEDGER";
  applicationNodeId: string;
  ledgerNodeId: string;
  confirmedBySubjectId: string;
  confirmedAt: string;
  confirmedFromGuidanceRelationId?: string;
}

export interface EnterpriseOperatingGraphV010 {
  contractVersion: typeof EOG_CONTRACT_VERSION_V010;
  graphId: string;
  enterpriseId: string;
  state: EogGraphStateV010;
  revision: number;
  nodes: EogNodeBindingV010[];
  guidanceRelations: EogApplicationLedgerGuidanceRelationV010[];
  enterpriseRelations: EogApplicationLedgerEnterpriseRelationV010[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type EogOperationActorTypeV010 =
  | "HUMAN"
  | "AGENT";

export interface EogOperationActorV010 {
  type: EogOperationActorTypeV010;
  subjectId: string;
}

interface EogOperationBaseV010 {
  contractVersion: typeof EOG_CONTRACT_VERSION_V010;
  operationId: string;
  graphId: string;
  expectedRevision: number;
  actor: EogOperationActorV010;
  occurredAt: string;
}

export type EnterpriseOperatingGraphOperationV010 =
  | (EogOperationBaseV010 & {
      type: "NODE_BIND";
      node: EogNodeBindingV010;
    })
  | (EogOperationBaseV010 & {
      type: "NODE_REMOVE";
      nodeId: string;
    })
  | (EogOperationBaseV010 & {
      type: "GUIDANCE_RELATION_PUT";
      relation: EogApplicationLedgerGuidanceRelationV010;
    })
  | (EogOperationBaseV010 & {
      type: "GUIDANCE_RELATION_REMOVE";
      relationId: string;
    })
  | (EogOperationBaseV010 & {
      type: "ENTERPRISE_RELATION_CONFIRM";
      enterpriseRelationId: string;
      applicationNodeId: string;
      ledgerNodeId: string;
      guidanceRelationId?: string;
    })
  | (EogOperationBaseV010 & {
      type: "ENTERPRISE_RELATION_REMOVE";
      relationId: string;
    })
  | (EogOperationBaseV010 & {
      type: "PUBLISH";
    });

export interface EogValidationIssueV010 {
  code: string;
  path: string;
  message: string;
}

export interface EogValidationResultV010 {
  contractVersion: typeof EOG_CONTRACT_VERSION_V010;
  publishable: boolean;
  issues: EogValidationIssueV010[];
}
