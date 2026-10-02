import type {
  EogAnalysisSnapshotV020,
  EogObservationSnapshotV020,
  EogObservatoryTargetV020,
  EogTimeLensV020,
  EnterpriseOperatingGraphAnalysisProviderV020,
  EnterpriseOperatingGraphRuntimeFactProviderV020
} from "./enterprise-operating-graph-observatory.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "./enterprise-operating-graph-read.js";

export const EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020 =
  "enterprise.operating-graph.runtime-facts";
export const EOG_ANALYSIS_PROVIDER_CAPABILITY_V020 =
  "enterprise.operating-graph.analysis";

export const EOG_RUNTIME_FACT_PROVIDER_CONTRACT_V020 =
  "evo.enterprise-operating-graph.runtime-facts";
export const EOG_ANALYSIS_PROVIDER_CONTRACT_V020 =
  "evo.enterprise-operating-graph.analysis";

export interface EnterpriseOperatingGraphObservatoryServiceV020 {
  observe(input: {
    enterpriseId: string;
    graphId: string;
    timeLens: EogTimeLensV020;
    targets?: EogObservatoryTargetV020[];
    metricCodes?: string[];
  }): Promise<EogObservationSnapshotV020>;
  analyze(input: {
    enterpriseId: string;
    graphId: string;
    timeLens: EogTimeLensV020;
    targets?: EogObservatoryTargetV020[];
    metricCodes?: string[];
  }): Promise<EogAnalysisSnapshotV020>;
}

export interface EnterpriseOperatingGraphObservatoryProviderResolverV020 {
  hasRuntimeCandidate(): boolean;
  hasAnalysisCandidate(): boolean;
  resolveRuntime(
    enterpriseId: string
  ): EnterpriseOperatingGraphRuntimeFactProviderV020 | undefined;
  resolveAnalysis(
    enterpriseId: string
  ): EnterpriseOperatingGraphAnalysisProviderV020 | undefined;
  createService(input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    enterpriseId: string;
    requireAnalysis?: boolean;
  }): EnterpriseOperatingGraphObservatoryServiceV020;
}
