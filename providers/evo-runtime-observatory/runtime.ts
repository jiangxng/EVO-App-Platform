import { createHash } from "node:crypto";
import type {
  EogRuntimeFactQueryV020,
  EogRuntimeFactV020,
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
  fetchImpl?: typeof fetch;
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

function supportedMetric(
  code: string
): {
  evoCode: string;
  eogCode: string;
} | undefined {
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
        .filter((item): item is {
          evoCode: string;
          eogCode: string;
        } => item !== undefined);

      if (requestedMetricMappings.length === 0) return [];

      const facts: EogRuntimeFactV020[] = [];
      for (const resolved of request.semanticTargets) {
        if (
          resolved.target.kind !== "NODE"
          || !("node" in resolved)
          || resolved.node.kind !== "LEDGER"
          || resolved.node.semanticRef.authority !== "EVO"
          || resolved.node.semanticRef.kind !== "LEDGER_DEFINITION"
        ) {
          continue;
        }

        const code = ledgerCode(resolved.node.semanticRef.refId);
        if (!code) continue;

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
              target: {
                kind: "LEDGER_DEFINITION",
                code
              },
              window: request.window,
              metricCodes: requestedMetricMappings.map(
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
          const mapping = requestedMetricMappings.find(
            item => item.evoCode === observation.metricCode
          );
          if (
            !mapping
            || observation.contractVersion !== "0.1.0"
            || observation.enterpriseId !== evoEnterpriseId
            || observation.target?.kind !== "LEDGER_DEFINITION"
            || observation.target.code !== code
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
              target: resolved.target,
              metric: mapping.eogCode,
              window: request.window,
              source: observation.source?.ref ?? code
            }),
            enterpriseId: request.enterpriseId,
            graphId: request.graphId,
            target: structuredClone(resolved.target),
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
              sourceRef: observation.source?.ref ?? "ledger:" + code,
              queryDigest: digest({
                evoEnterpriseId,
                target: {
                  kind: "LEDGER_DEFINITION",
                  code
                },
                window: request.window,
                metricCode: observation.metricCode
              })
            }
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
