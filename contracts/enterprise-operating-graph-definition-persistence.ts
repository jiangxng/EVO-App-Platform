import type {
  EogOperationActorV010,
  EnterpriseOperatingGraphV010
} from "./enterprise-operating-graph.js";

export type EnterpriseOperatingGraphPersistenceActorV010 =
  | EogOperationActorV010
  | {
      type: "SERVICE";
      subjectId: string;
    };

export interface EnterpriseOperatingGraphDefinitionPersistenceV010 {
  create(input: {
    graph: EnterpriseOperatingGraphV010;
    actor: EnterpriseOperatingGraphPersistenceActorV010;
  }): EnterpriseOperatingGraphV010;
  replace(input: {
    current: EnterpriseOperatingGraphV010;
    next: EnterpriseOperatingGraphV010;
    actor: EnterpriseOperatingGraphPersistenceActorV010;
  }): EnterpriseOperatingGraphV010;
  get(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphV010 | undefined;
  listByEnterprise(input: {
    enterpriseId: string;
  }): EnterpriseOperatingGraphV010[];
}
