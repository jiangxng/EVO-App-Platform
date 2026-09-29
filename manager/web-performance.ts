export type WebPerformanceSurfaceTargetV010 =
  | "DESKTOP_WORKBENCH"
  | "MOBILE_TASK"
  | "MOBILE_READ"
  | "TABLET_WORKBENCH"
  | "HANDOFF"
  | "UNKNOWN";

export interface WebPerformanceSampleV010 {
  contractVersion: "0.1.0";
  observedAt: string;
  clientRevision?: string;
  hostRevision?: string;
  surfaceTarget: WebPerformanceSurfaceTargetV010;
  navigationType?: string;
  navigationDurationMs?: number;
  largestContentfulPaintMs?: number;
  firstContentfulPaintMs?: number;
  longTaskCount?: number;
  longTaskTotalMs?: number;
  resourceCount?: number;
  transferBytes?: number;
  jsTransferBytes?: number;
  cssTransferBytes?: number;
  apiTransferBytes?: number;
  cachedResourceCount?: number;
}

export interface WebPerformanceDiagnosticsV010 {
  contractVersion: "0.1.0";
  capacity: number;
  sampleCount: number;
  droppedInvalidSamples: number;
  bySurface: Record<string, number>;
  recent: WebPerformanceSampleV010[];
}

export interface WebPerformanceStoreV010 {
  record(value: unknown): boolean;
  diagnostics(): WebPerformanceDiagnosticsV010;
}

const SURFACES = new Set<WebPerformanceSurfaceTargetV010>([
  "DESKTOP_WORKBENCH",
  "MOBILE_TASK",
  "MOBILE_READ",
  "TABLET_WORKBENCH",
  "HANDOFF",
  "UNKNOWN"
]);

function finiteBounded(
  value: unknown,
  min: number,
  max: number
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function optionalString(value: unknown, maxLength = 128): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function validateWebPerformanceSampleV010(
  value: unknown
): WebPerformanceSampleV010 | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const sample = value as Record<string, unknown>;
  if (sample.contractVersion !== "0.1.0") return undefined;
  if (
    typeof sample.surfaceTarget !== "string"
    || !SURFACES.has(sample.surfaceTarget as WebPerformanceSurfaceTargetV010)
  ) {
    return undefined;
  }
  const observedAt = optionalString(sample.observedAt, 64);
  if (!observedAt || !Number.isFinite(Date.parse(observedAt))) return undefined;

  const result: WebPerformanceSampleV010 = {
    contractVersion: "0.1.0",
    observedAt,
    surfaceTarget: sample.surfaceTarget as WebPerformanceSurfaceTargetV010
  };

  const clientRevision = optionalString(sample.clientRevision);
  const hostRevision = optionalString(sample.hostRevision);
  const navigationType = optionalString(sample.navigationType, 64);
  if (clientRevision) result.clientRevision = clientRevision;
  if (hostRevision) result.hostRevision = hostRevision;
  if (navigationType) result.navigationType = navigationType;

  const metricSpecs = [
    ["navigationDurationMs", 0, 600_000],
    ["largestContentfulPaintMs", 0, 600_000],
    ["firstContentfulPaintMs", 0, 600_000],
    ["longTaskCount", 0, 100_000],
    ["longTaskTotalMs", 0, 600_000],
    ["resourceCount", 0, 100_000],
    ["transferBytes", 0, 2_000_000_000],
    ["jsTransferBytes", 0, 2_000_000_000],
    ["cssTransferBytes", 0, 2_000_000_000],
    ["apiTransferBytes", 0, 2_000_000_000],
    ["cachedResourceCount", 0, 100_000]
  ] as const;

  for (const [key, min, max] of metricSpecs) {
    const number = finiteBounded(sample[key], min, max);
    if (number !== undefined) {
      (result as unknown as Record<string, unknown>)[key] = number;
    }
  }

  return result;
}

export function createWebPerformanceStoreV010(
  capacity = 500
): WebPerformanceStoreV010 {
  const boundedCapacity = Math.max(10, Math.min(10_000, Math.trunc(capacity)));
  const recent: WebPerformanceSampleV010[] = [];
  let droppedInvalidSamples = 0;

  return {
    record(value) {
      const sample = validateWebPerformanceSampleV010(value);
      if (!sample) {
        droppedInvalidSamples += 1;
        return false;
      }
      recent.push(sample);
      if (recent.length > boundedCapacity) {
        recent.splice(0, recent.length - boundedCapacity);
      }
      return true;
    },
    diagnostics() {
      const bySurface: Record<string, number> = {};
      for (const sample of recent) {
        bySurface[sample.surfaceTarget] =
          (bySurface[sample.surfaceTarget] ?? 0) + 1;
      }
      return {
        contractVersion: "0.1.0",
        capacity: boundedCapacity,
        sampleCount: recent.length,
        droppedInvalidSamples,
        bySurface,
        recent: recent.map(item => ({ ...item }))
      };
    }
  };
}
