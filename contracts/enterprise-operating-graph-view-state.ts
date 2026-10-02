import type {
  EnterpriseOperatingGraphViewKindV010,
  EnterpriseOperatingGraphViewMutationV010,
  EnterpriseOperatingGraphViewStateV010
} from "./enterprise-operating-graph-view.js";

export const EOG_VIEW_STATE_CAPABILITY_V010 =
  "enterprise.operating-graph.view-state" as const;

export const EOG_VIEW_STATE_PROVIDER_CONTRACT_V010 =
  "evo.enterprise-operating-graph.view-state" as const;

export interface EnterpriseOperatingGraphViewStateProviderV010 {
  ensure(input: {
    enterpriseId: string;
    graphId: string;
    kind: EnterpriseOperatingGraphViewKindV010;
    viewId?: string;
    occurredAt?: string;
  }): EnterpriseOperatingGraphViewStateV010;
  get(input: {
    enterpriseId: string;
    graphId: string;
    viewId: string;
  }): EnterpriseOperatingGraphViewStateV010;
  list(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphViewStateV010[];
  apply(input: {
    enterpriseId: string;
    graphId: string;
    viewId: string;
    expectedRevision: number;
    mutation: EnterpriseOperatingGraphViewMutationV010;
    occurredAt?: string;
  }): EnterpriseOperatingGraphViewStateV010;
}

/**
 * Compatibility name retained while legacy manager imports converge.
 * New plugin code should depend on EnterpriseOperatingGraphViewStateProviderV010.
 */
export type EnterpriseOperatingGraphViewHostServiceV010 =
  EnterpriseOperatingGraphViewStateProviderV010;
