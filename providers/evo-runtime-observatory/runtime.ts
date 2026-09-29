import { createHash } from "node:crypto";
import type {
  EogRuntimeFactQueryV020,
  EogRuntimeFactV020,
  EogResolvedNodeTargetV020,
  EnterpriseOperatingGraphRuntimeFactProviderV020
} from "../../contracts/enterprise-operating-graph-observatory.js";
import {
  EVO_RUNTIME_OBSERVATORY_PROVIDER_ID
} from "./package.js";

interface EvoObservation {
  contractVersion?: string;
  enterpriseId?: string;
  target?: {
    kind?: string;
    code?: string;
    applicationId?: string;
  };
  metricCode?: string;
  kind?: "COUNT" | "QUANTITY" | "AMOUNT" | "RATE";
  unit?: string;
  value?: number;
  sampleCount?: number;
  window?: {
    startAt?: string;
    endAt?: string;
  };
  observedAt?: string;
  source?: {
    kind?: string;
    ref?: string;
  };
}

interface EvoObservationResponse {
  contractVersion?: string;
  observations?: EvoObservation[];
  error?: {
    code?: string;
    message?: string;
  };
}

interface EvoRuntimeTraceStep {
  applicationId?: string;
  stepCode?: string;
  businessDataId?: string;
  commandExecutionId?: string;
  occurredAt?: string;
}

interface EvoRuntimeTrace {
  contractVersion?: string;
  enterpriseId?: string;
  flowDefinitionId?: string;
  flowInstanceId?: string;
  flowInstanceKey?: string;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  steps?: EvoRuntimeTraceStep[];
  startedAt?: string;
  completedAt?: string;
}

interface EvoRuntimeTraceResponse {
  contractVersion?: string;
  traces?: EvoRuntimeTrace[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface EvoRuntimeObservatoryProviderOptions {
  baseUrl: string;
  resolveEnterpriseCode(hostEnterpriseId: string): string | undefined;
  resolveApplicationId?(
    hostEnterpriseId: string,
    hostApplicationRefId: string
  ): string | undefined;
  fetchImpl?: typeof fetch;
}

interface MetricMapping {
  evoCode: string;
  eogCode: string;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function ledgerCode(refId: string): string | undefined {
  const value = refId.trim();
  if (!value.startsWith("ledger:")) return undefined;
  const code = value.slice("ledger:".length).trim();
  return code || undefined;
}

function supportedMetric(code: string): MetricMapping | undefined {
  switch (code) {
    case "event.count":
    case "event.frequency":
    case "balance.quantity":
    case "balance.amount":
      return { evoCode: code, eogCode: code };
    case "business.quantity":
      return {
        evoCode: "flow.net_quantity",
        eogCode: "business.quantity"
      };
    case "business.amount":
      return {
        evoCode: "flow.net_amount",
        eogCode: "business.amount"
      };
    default:
      return undefined;
  }
}

function applicationMetric(mapping: MetricMapping): boolean {
  return mapping.eogCode === "event.count"
    || mapping.eogCode === "event.frequency";
}

function factKind(
  kind: EvoObservation["kind"]
): EogRuntimeFactV020["metric"]["kind"] {
  if (
    kind === "COUNT"
    || kind === "QUANTITY"
    || kind === "AMOUNT"
    || kind === "RATE"
  ) {
    return kind;
  }
  throw new Error("EVO_OBSERVATORY_OBSERVATION_KIND_INVALID");
}

function explicitNodeRequested(
  request: EogRuntimeFactQueryV020,
  nodeId: string
): boolean {
  return request.targets?.some(
    target => target.kind === "NODE" && target.nodeId === nodeId
  ) === true;
}

export function createEvoRuntimeObservatoryProviderV020(
  options: EvoRuntimeObservatoryProviderOptions
): EnterpriseOperatingGraphRuntimeFactProviderV020 {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EVO_OBSERVATORY_FETCH_UNAVAILABLE");
  const baseUrl = options.baseUrl.replace(/\/$/u, "");

  return {
    contractVersion: "0.2.0",
    providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,

    async query(
      request: EogRuntimeFactQueryV020
    ): Promise<EogRuntimeFactV020[]> {
      const enterpriseCode = options.resolveEnterpriseCode(
        request.enterpriseId
      )?.trim();
      if (!enterpriseCode) {
        throw new Error("EVO_OBSERVATORY_ENTERPRISE_MAPPING_REQUIRED");
      }

      const enterpriseResponse = await fetchImpl(
        baseUrl
          + "/api/v1/enterprises/"
          + encodeURIComponent(enterpriseCode),
        {
          headers: { accept: "application/json" }
        }
      );
      const enterpriseBody = await enterpriseResponse.json() as {
        id?: unknown;
        error?: { code?: string; message?: string };
      };
      if (
        !enterpriseResponse.ok
        || typeof enterpriseBody.id !== "string"
        || !enterpriseBody.id.trim()
      ) {
        throw new Error(
          enterpriseBody.error?.code
          ?? "EVO_OBSERVATORY_ENTERPRISE_RESOLUTION_FAILED"
        );
      }
      const evoEnterpriseId = enterpriseBody.id.trim();

      const requestedCodes = request.metricCodes?.length
        ? request.metricCodes
        : [
            "event.count",
            "event.frequency",
            "business.quantity",
            "business.amount",
            "balance.quantity",
            "balance.amount",
            "sop.transition.count"
          ];
      const requestedMetricMappings = requestedCodes
        .map(supportedMetric)
        .filter((item): item is MetricMapping => item !== undefined);
      const transitionCountRequested = requestedCodes.includes(
        "sop.transition.count"
      );
      const traceTransitionRequested = requestedCodes.includes(
        "sop.trace.transition"
      );
      const traceCoverageRequested = requestedCodes.includes(
        "sop.trace.coverage"
      );
      const transitionEvidenceRequested =
        transitionCountRequested
        || traceTransitionRequested
        || traceCoverageRequested;

      if (
        requestedMetricMappings.length === 0
        && !transitionEvidenceRequested
      ) {
        return [];
      }

      const facts: EogRuntimeFactV020[] = [];

      const queryRuntime = async (input: {
        resolved: EogResolvedNodeTargetV020;
        target:
          | { kind: "LEDGER_DEFINITION"; code: string }
          | { kind: "APPLICATION_ANCHOR"; applicationId: string };
        metricMappings: MetricMapping[];
        fallbackSourceRef: string;
      }): Promise<void> => {
        if (input.metricMappings.length === 0) return;

        const response = await fetchImpl(
          baseUrl + "/api/v1/runtime-observations/query",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json"
            },
            body: JSON.stringify({
              contractVersion: "0.1.0",
              enterpriseId: evoEnterpriseId,
              target: input.target,
              window: request.window,
              metricCodes: input.metricMappings.map(
                item => item.evoCode
              )
            })
          }
        );

        const body = await response.json() as EvoObservationResponse;
        if (!response.ok || !Array.isArray(body.observations)) {
          throw new Error(
            body.error?.code
            ?? "EVO_OBSERVATORY_RUNTIME_QUERY_FAILED"
          );
        }

        for (const observation of body.observations) {
          const mapping = input.metricMappings.find(
            item => item.evoCode === observation.metricCode
          );
          const targetMatches = input.target.kind === "LEDGER_DEFINITION"
            ? observation.target?.kind === "LEDGER_DEFINITION"
              && observation.target.code === input.target.code
            : observation.target?.kind === "APPLICATION_ANCHOR"
              && observation.target.applicationId === input.target.applicationId;
          if (
            !mapping
            || observation.contractVersion !== "0.1.0"
            || observation.enterpriseId !== evoEnterpriseId
            || !targetMatches
            || typeof observation.value !== "number"
            || !Number.isFinite(observation.value)
            || typeof observation.unit !== "string"
            || !observation.unit.trim()
            || typeof observation.observedAt !== "string"
            || !Number.isFinite(Date.parse(observation.observedAt))
            || observation.window?.startAt !== request.window.startAt
            || observation.window?.endAt !== request.window.endAt
          ) {
            throw new Error("EVO_OBSERVATORY_OBSERVATION_INVALID");
          }

          facts.push({
            contractVersion: "0.2.0",
            factId: "evo-fact:" + digest({
              enterpriseId: request.enterpriseId,
              graphId: request.graphId,
              target: input.resolved.target,
              metric: mapping.eogCode,
              window: request.window,
              source: observation.source?.ref ?? input.fallbackSourceRef
            }),
            enterpriseId: request.enterpriseId,
            graphId: request.graphId,
            target: structuredClone(input.resolved.target),
            metric: {
              code: mapping.eogCode,
              kind: factKind(observation.kind),
              unit: observation.unit
            },
            window: structuredClone(request.window),
            value: observation.value,
            ...(observation.sampleCount === undefined
              ? {}
              : { sampleCount: observation.sampleCount }),
            observedAt: observation.observedAt,
            source: {
              providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
              sourceKind: "EVO_RUNTIME",
              sourceRef: observation.source?.ref ?? input.fallbackSourceRef,
              queryDigest: digest({
                evoEnterpriseId,
                target: input.target,
                window: request.window,
                metricCode: observation.metricCode
              })
            }
          });
        }
      };

      for (const resolved of request.semanticTargets) {
        if (resolved.target.kind !== "NODE" || !("node" in resolved)) {
          continue;
        }

        if (
          resolved.node.kind === "LEDGER"
          && resolved.node.semanticRef.authority === "EVO"
          && resolved.node.semanticRef.kind === "LEDGER_DEFINITION"
        ) {
          const code = ledgerCode(resolved.node.semanticRef.refId);
          if (!code) continue;
          await queryRuntime({
            resolved,
            target: {
              kind: "LEDGER_DEFINITION",
              code
            },
            metricMappings: requestedMetricMappings,
            fallbackSourceRef: "ledger:" + code
          });
          continue;
        }

        if (
          resolved.node.kind === "APPLICATION"
          && resolved.node.semanticRef.authority === "HOST"
          && resolved.node.semanticRef.kind === "APPLICATION"
        ) {
          const applicationId = options.resolveApplicationId?.(
            request.enterpriseId,
            resolved.node.semanticRef.refId
          )?.trim();
          if (!applicationId) {
            if (explicitNodeRequested(request, resolved.node.nodeId)) {
              throw new Error(
                "EVO_OBSERVATORY_APPLICATION_MAPPING_REQUIRED"
              );
            }
            continue;
          }
          await queryRuntime({
            resolved,
            target: {
              kind: "APPLICATION_ANCHOR",
              applicationId
            },
            metricMappings: requestedMetricMappings.filter(
              applicationMetric
            ),
            fallbackSourceRef: "application:" + applicationId
          });
        }
      }


      if (transitionEvidenceRequested) {
        const runtimeToNode = new Map<string, string>();
        for (const resolved of request.semanticTargets) {
          if (
            resolved.target.kind !== "NODE"
            || !("node" in resolved)
            || resolved.node.kind !== "APPLICATION"
            || resolved.node.semanticRef.authority !== "HOST"
            || resolved.node.semanticRef.kind !== "APPLICATION"
          ) {
            continue;
          }
          const applicationId = options.resolveApplicationId?.(
            request.enterpriseId,
            resolved.node.semanticRef.refId
          )?.trim();
          if (!applicationId) continue;
          if (runtimeToNode.has(applicationId)) {
            throw new Error(
              "EVO_OBSERVATORY_APPLICATION_RUNTIME_IDENTITY_AMBIGUOUS"
            );
          }
          runtimeToNode.set(applicationId, resolved.node.nodeId);
        }

        if (runtimeToNode.size > 0) {
          const traceResponse = await fetchImpl(
            baseUrl + "/api/v1/runtime-traces/query",
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                accept: "application/json"
              },
              body: JSON.stringify({
                contractVersion: "0.1.0",
                enterpriseId: evoEnterpriseId,
                window: request.window,
                applicationIds: [...runtimeToNode.keys()].sort()
              })
            }
          );
          const traceBody =
            await traceResponse.json() as EvoRuntimeTraceResponse;
          if (!traceResponse.ok || !Array.isArray(traceBody.traces)) {
            throw new Error(
              traceBody.error?.code
              ?? "EVO_OBSERVATORY_RUNTIME_TRACE_QUERY_FAILED"
            );
          }

          const counts = new Map<string, {
            fromNodeId: string;
            toNodeId: string;
            fromStepCode: string;
            toStepCode: string;
            value: number;
            evidenceRefs: string[];
          }>();

          for (const trace of traceBody.traces) {
            if (
              trace.contractVersion !== "0.1.0"
              || trace.enterpriseId !== evoEnterpriseId
              || typeof trace.flowDefinitionId !== "string"
              || !trace.flowDefinitionId.trim()
              || typeof trace.flowInstanceId !== "string"
              || !trace.flowInstanceId.trim()
              || typeof trace.flowInstanceKey !== "string"
              || !trace.flowInstanceKey.trim()
              || (
                trace.status !== "ACTIVE"
                && trace.status !== "COMPLETED"
                && trace.status !== "CANCELLED"
              )
              || !Array.isArray(trace.steps)
            ) {
              throw new Error("EVO_OBSERVATORY_RUNTIME_TRACE_INVALID");
            }

            const queryDigest = digest({
              evoEnterpriseId,
              window: request.window,
              applicationIds: [...runtimeToNode.keys()].sort()
            });
            const mappedStepCount = trace.steps.filter(step =>
              typeof step.applicationId === "string"
              && runtimeToNode.has(step.applicationId)
            ).length;
            let mappedTransitionCount = 0;
            let coverageAnchorNodeId: string | undefined;

            for (const step of trace.steps) {
              if (
                typeof step.applicationId === "string"
                && runtimeToNode.has(step.applicationId)
              ) {
                coverageAnchorNodeId ??=
                  runtimeToNode.get(step.applicationId);
              }
            }

            for (let index = 0; index + 1 < trace.steps.length; index += 1) {
              const from = trace.steps[index];
              const to = trace.steps[index + 1];
              if (
                typeof from?.applicationId !== "string"
                || typeof to?.applicationId !== "string"
                || typeof from.stepCode !== "string"
                || typeof to.stepCode !== "string"
                || typeof from.businessDataId !== "string"
                || typeof to.businessDataId !== "string"
              ) {
                throw new Error("EVO_OBSERVATORY_RUNTIME_TRACE_INVALID");
              }
              const fromNodeId = runtimeToNode.get(from.applicationId);
              const toNodeId = runtimeToNode.get(to.applicationId);
              if (!fromNodeId || !toNodeId) continue;
              mappedTransitionCount += 1;

              const explicitTargets = request.targets?.filter(
                target => target.kind === "NODE"
              );
              const visible = !explicitTargets?.length
                || explicitTargets.some(target =>
                  target.kind === "NODE"
                  && target.nodeId === fromNodeId
                );

              const key = [
                fromNodeId,
                toNodeId,
                from.stepCode,
                to.stepCode
              ].join("|");
              const aggregate = counts.get(key) ?? {
                fromNodeId,
                toNodeId,
                fromStepCode: from.stepCode,
                toStepCode: to.stepCode,
                value: 0,
                evidenceRefs: []
              };
              aggregate.value += 1;
              aggregate.evidenceRefs.push(
                from.businessDataId + "->" + to.businessDataId
              );
              counts.set(key, aggregate);

              if (traceTransitionRequested && visible) {
                facts.push({
                  contractVersion: "0.2.0",
                  factId: "evo-trace-path-fact:" + digest({
                    enterpriseId: request.enterpriseId,
                    graphId: request.graphId,
                    window: request.window,
                    flowInstanceId: trace.flowInstanceId,
                    index,
                    fromNodeId,
                    toNodeId,
                    fromStepCode: from.stepCode,
                    toStepCode: to.stepCode
                  }),
                  enterpriseId: request.enterpriseId,
                  graphId: request.graphId,
                  target: {
                    kind: "NODE",
                    nodeId: fromNodeId
                  },
                  metric: {
                    code: "sop.trace.transition",
                    kind: "COUNT",
                    unit: "transitions"
                  },
                  window: structuredClone(request.window),
                  value: 1,
                  sampleCount: 1,
                  dimensions: {
                    toApplicationNodeId: toNodeId,
                    fromStepCode: from.stepCode,
                    toStepCode: to.stepCode,
                    flowDefinitionId: trace.flowDefinitionId,
                    flowInstanceId: trace.flowInstanceId,
                    flowInstanceKey: trace.flowInstanceKey,
                    traceStatus: trace.status,
                    transitionIndex: index,
                    fromBusinessDataId: from.businessDataId,
                    toBusinessDataId: to.businessDataId
                  },
                  observedAt: request.window.endAt,
                  source: {
                    providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
                    sourceKind: "EVO_RUNTIME",
                    sourceRef: "runtime-traces",
                    queryDigest
                  }
                });
              }
            }

            if (traceCoverageRequested && coverageAnchorNodeId) {
              const rawTransitionCount = Math.max(
                trace.steps.length - 1,
                0
              );
              const fullyMapped =
                mappedStepCount === trace.steps.length
                && mappedTransitionCount === rawTransitionCount;
              facts.push({
                contractVersion: "0.2.0",
                factId: "evo-trace-coverage-fact:" + digest({
                  enterpriseId: request.enterpriseId,
                  graphId: request.graphId,
                  window: request.window,
                  flowInstanceId: trace.flowInstanceId
                }),
                enterpriseId: request.enterpriseId,
                graphId: request.graphId,
                target: {
                  kind: "NODE",
                  nodeId: coverageAnchorNodeId
                },
                metric: {
                  code: "sop.trace.coverage",
                  kind: "RATIO",
                  unit: "ratio"
                },
                window: structuredClone(request.window),
                value: fullyMapped ? 1 : (
                  trace.steps.length > 0
                    ? mappedStepCount / trace.steps.length
                    : 0
                ),
                sampleCount: trace.steps.length,
                dimensions: {
                  flowDefinitionId: trace.flowDefinitionId,
                  flowInstanceId: trace.flowInstanceId,
                  flowInstanceKey: trace.flowInstanceKey,
                  traceStatus: trace.status,
                  rawStepCount: trace.steps.length,
                  mappedStepCount,
                  rawTransitionCount,
                  mappedTransitionCount,
                  completeMapping: fullyMapped
                },
                observedAt: request.window.endAt,
                source: {
                  providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
                  sourceKind: "EVO_RUNTIME",
                  sourceRef: "runtime-traces",
                  queryDigest
                }
              });
            }
          }

          if (transitionCountRequested) {
          for (const aggregate of [...counts.values()].sort((a, b) =>
            [
              a.fromNodeId,
              a.toNodeId,
              a.fromStepCode,
              a.toStepCode
            ].join("|").localeCompare([
              b.fromNodeId,
              b.toNodeId,
              b.fromStepCode,
              b.toStepCode
            ].join("|"))
          )) {
            facts.push({
              contractVersion: "0.2.0",
              factId: "evo-trace-fact:" + digest({
                enterpriseId: request.enterpriseId,
                graphId: request.graphId,
                window: request.window,
                fromNodeId: aggregate.fromNodeId,
                toNodeId: aggregate.toNodeId,
                fromStepCode: aggregate.fromStepCode,
                toStepCode: aggregate.toStepCode
              }),
              enterpriseId: request.enterpriseId,
              graphId: request.graphId,
              target: {
                kind: "NODE",
                nodeId: aggregate.fromNodeId
              },
              metric: {
                code: "sop.transition.count",
                kind: "COUNT",
                unit: "transitions"
              },
              window: structuredClone(request.window),
              value: aggregate.value,
              sampleCount: aggregate.value,
              dimensions: {
                toApplicationNodeId: aggregate.toNodeId,
                fromStepCode: aggregate.fromStepCode,
                toStepCode: aggregate.toStepCode,
                evidenceDigest: digest(
                  aggregate.evidenceRefs.sort()
                )
              },
              observedAt: request.window.endAt,
              source: {
                providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
                sourceKind: "EVO_RUNTIME",
                sourceRef: "runtime-traces",
                queryDigest: digest({
                  evoEnterpriseId,
                  window: request.window,
                  applicationIds: [...runtimeToNode.keys()].sort()
                })
              }
            });
          }
          }
        }
      }

      return facts;
    }
  };
}

export function createEvoRuntimeObservatoryHealthProbeV010(
  options: Pick<EvoRuntimeObservatoryProviderOptions, "baseUrl" | "fetchImpl">
) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EVO_OBSERVATORY_FETCH_UNAVAILABLE");
  const baseUrl = options.baseUrl.replace(/\/$/u, "");

  return async () => {
    try {
      const response = await fetchImpl(baseUrl + "/health/ready", {
        headers: { accept: "application/json" }
      });
      return response.ok
        ? {
            state: "HEALTHY" as const,
            message: "EVO Runtime observation endpoint is reachable."
          }
        : {
            state: "UNAVAILABLE" as const,
            message: "EVO Runtime readiness returned HTTP "
              + response.status
              + "."
          };
    } catch (error) {
      return {
        state: "UNAVAILABLE" as const,
        message: error instanceof Error
          ? error.message
          : String(error)
      };
    }
  };
}
