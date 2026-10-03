import type {
  EnterpriseAgentToolRegistrationV010
} from "../../agents/enterprise-agent/host-tool-catalog.js";
import {
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "./package.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
  EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  parseEogObservatoryRequestInputV020
} from "../../eog/observatory-input.js";

function enterpriseId(
  context: ResolvedContextSetV010
): string {
  if (
    context.activeContext.kind !== "ENTERPRISE"
    || !context.activeContext.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return context.activeContext.enterpriseId.trim();
}

const querySchema = {
  type: "object",
  properties: {
    graphId: { type: "string" },
    timeLens: {
      type: "object",
      description: "Time Lens contract 0.2.0 with primary window and optional previous-period or explicit comparison.",
      properties: {
        contractVersion: {
          type: "string",
          enum: ["0.2.0"]
        },
        primary: {
          type: "object",
          properties: {
            startAt: { type: "string" },
            endAt: { type: "string" }
          },
          required: ["startAt", "endAt"],
          additionalProperties: false
        },
        comparison: {
          type: "object",
          description: "Optional PREVIOUS_PERIOD or EXPLICIT comparison."
        }
      },
      required: ["contractVersion", "primary"],
      additionalProperties: true
    },
    targets: {
      type: "array",
      description: "Optional EOG node/relation targets. Omit for the Provider-authorized graph-wide observation.",
      items: {
        type: "object"
      }
    },
    metricCodes: {
      type: "array",
      description: "Optional canonical metric code filters such as event.frequency, flow.wip or time.wait.",
      items: { type: "string" }
    }
  },
  required: ["graphId", "timeLens"],
  additionalProperties: false
};

export function createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    providers: EnterpriseOperatingGraphObservatoryProviderResolverV020;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    isObservatoryActive?: () => boolean;
  }
): EnterpriseAgentToolRegistrationV010[] {
  const inEnterprise = () =>
    input.context.activeContext.kind === "ENTERPRISE";
  const observatoryAvailable = () =>
    inEnterprise() && (input.isObservatoryActive?.() ?? true);

  const execute = async (
    args: Record<string, unknown>,
    analyze: boolean
  ) => {
    const scopedEnterpriseId = enterpriseId(input.context);
    const query = parseEogObservatoryRequestInputV020(args);
    const service = input.providers.createService({
      graphService: input.graphService,
      enterpriseId: scopedEnterpriseId,
      ...(analyze ? { requireAnalysis: true } : {})
    });
    return analyze
      ? service.analyze({
          enterpriseId: scopedEnterpriseId,
          ...query
        })
      : service.observe({
          enterpriseId: scopedEnterpriseId,
          ...query
        });
  };

  return [
    {
      descriptor: {
        contractVersion: "0.1.0",
        id: "enterprise.operating_graph.observe",
        modelName: "enterprise_operating_graph_observe",
        title: "Observe Enterprise Operating Graph",
        description: "Read time-bounded Runtime Facts over the current Enterprise Operating Graph. Facts are Provider-sourced observations, not enterprise semantic truth. Use for event frequency, throughput, WIP/backlog, wait/lead time, quantity or amount questions.",
        inputSchema: querySchema,
        effect: "READ",
        ownerPackageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
        capability: EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020
      },
      available() {
        return observatoryAvailable()
          && input.providers.hasRuntimeCandidate();
      },
      execute(args) {
        return execute(args, false);
      }
    },

    {
      descriptor: {
        contractVersion: "0.1.0",
        id: "enterprise.operating_graph.analyze",
        modelName: "enterprise_operating_graph_analyze",
        title: "Analyze Enterprise Operating Graph",
        description: "Read evidence-backed derived Analysis Overlays over Runtime Facts, such as bottleneck, SOP conformance/deviation or anomaly analysis. Analysis remains separate from raw facts and enterprise semantic truth.",
        inputSchema: querySchema,
        effect: "READ",
        ownerPackageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
        capability: EOG_ANALYSIS_PROVIDER_CAPABILITY_V020
      },
      available() {
        return observatoryAvailable()
          && input.providers.hasRuntimeCandidate()
          && input.providers.hasAnalysisCandidate();
      },
      execute(args) {
        return execute(args, true);
      }
    }
  ];
}
