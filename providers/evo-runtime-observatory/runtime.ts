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

      const requestedMetricMappings = (
        request.metricCodes?.length
          ? request.metricCodes
          : [
              "event.count",
              "event.frequency",
              "business.quantity",
              "business.amount",
              "balance.quantity",
              "balance.amount"
            ]
      )
        .map(supportedMetric)
        .filter((item): item is MetricMapping => item !== undefined);

      if (requestedMetricMappings.length === 0) return [];

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
