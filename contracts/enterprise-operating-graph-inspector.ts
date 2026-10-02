import type {
  EogCanonicalRefV010,
  EogNodeKindV010
} from "./enterprise-operating-graph.js";
import type { JsonValue } from "../actions/contracts.js";

export const EOG_INSPECTOR_PROPERTY_PROVIDER_CAPABILITY_V010 =
  "enterprise.operating-graph.inspector-properties" as const;

export const EOG_INSPECTOR_PROPERTY_PROVIDER_CONTRACT_V010 =
  "evo.enterprise-operating-graph.inspector-properties" as const;

export type EogInspectorPropertyValueV010 =
  | string
  | number
  | boolean
  | null;

export type EogInspectorTargetV010 =
  | {
      kind: "NODE";
      nodeId: string;
      nodeKind: EogNodeKindV010;
      semanticRef: EogCanonicalRefV010;
    }
  | {
      kind: "RELATION";
      authority: "GUIDANCE" | "ENTERPRISE";
      relationId: string;
      relationKind: "APPLICATION_LEDGER";
      applicationNodeId: string;
      ledgerNodeId: string;
    };

export interface EogInspectorPropertyEditV010 {
  kind: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT";
  actionId: string;
  command: {
    code: string;
    inputVersion: string;
  };
  valueField: string;
  operation: Record<string, JsonValue>;
  requiresConfirmation?: boolean;
  options?: Array<{
    label: string;
    value: Exclude<EogInspectorPropertyValueV010, null>;
  }>;
}

export interface EogInspectorPropertyV010 {
  key: string;
  label: string;
  value: EogInspectorPropertyValueV010;
  detail?: string;
  edit?: EogInspectorPropertyEditV010;
}

export interface EogInspectorPropertyContributionV010 {
  contractVersion: "0.1.0";
  providerId: string;
  target: EogInspectorTargetV010;
  properties: EogInspectorPropertyV010[];
}

export interface EnterpriseOperatingGraphInspectorPropertyProviderV010 {
  providerId: string;
  inspect(input: {
    enterpriseId: string;
    graphId: string;
    target: EogInspectorTargetV010;
  }): Promise<EogInspectorPropertyContributionV010>;
}


export interface EnterpriseOperatingGraphInspectorPropertyResolverV010 {
  hasCandidates(): boolean;
  inspect(input: {
    enterpriseId: string;
    graphId: string;
    target: EogInspectorTargetV010;
  }): Promise<EogInspectorPropertyContributionV010[]>;
}
