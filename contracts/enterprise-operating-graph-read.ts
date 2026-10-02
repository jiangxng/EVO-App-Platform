import type {
  EnterpriseOperatingGraphV010
} from "./enterprise-operating-graph.js";

export const EOG_GRAPH_READ_CAPABILITY_V010 =
  "enterprise.operating-graph.read" as const;

export interface EnterpriseOperatingGraphReadProviderV010 {
  get(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphV010;
  list(input: {
    enterpriseId: string;
  }): EnterpriseOperatingGraphV010[];
}
