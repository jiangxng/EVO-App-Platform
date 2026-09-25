export type PluginRuntimeEventTypeV010 =
  | "PROCESS_STARTING"
  | "PROCESS_READY"
  | "PROCESS_STOPPED"
  | "PROCESS_EXITED"
  | "PROCESS_ERROR"
  | "PROCESS_FATAL"
  | "INVOCATION_STARTED"
  | "INVOCATION_SUCCEEDED"
  | "INVOCATION_FAILED"
  | "INVOCATION_TIMEOUT";

export interface PluginRuntimeEventV010 {
  contractVersion: "0.1.0";
  sequence: number;
  occurredAt: string;
  packageId: string;
  type: PluginRuntimeEventTypeV010;
  invocationId?: string;
  method?: string;
  durationMs?: number;
  message?: string;
}

export interface PluginRuntimeDiagnosticsV010 {
  contractVersion: "0.1.0";
  packageId: string;
  health: "healthy" | "degraded" | "stopped" | "unknown";
  starts: number;
  invocations: number;
  successes: number;
  failures: number;
  timeouts: number;
  crashes: number;
  restarts: number;
  lastEventAt?: string;
  lastError?: string;
}

export interface PluginRuntimeObservabilityV010 {
  record(input: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence">): PluginRuntimeEventV010;
  listEvents(packageId?: string): PluginRuntimeEventV010[];
  diagnostics(packageId: string): PluginRuntimeDiagnosticsV010;
  listDiagnostics(): PluginRuntimeDiagnosticsV010[];
}

interface MutableDiagnostics {
  packageId: string;
  health: PluginRuntimeDiagnosticsV010["health"];
  starts: number;
  invocations: number;
  successes: number;
  failures: number;
  timeouts: number;
  crashes: number;
  lastEventAt?: string;
  lastError?: string;
}

export function createPluginRuntimeObservabilityV010(
  maxEvents = 500
): PluginRuntimeObservabilityV010 {
  if (!Number.isInteger(maxEvents) || maxEvents < 10) {
    throw new Error("PLUGIN_RUNTIME_OBSERVABILITY_CAPACITY_INVALID");
  }

  let sequence = 0;
  const events: PluginRuntimeEventV010[] = [];
  const summaries = new Map<string, MutableDiagnostics>();

  const getMutable = (packageId: string): MutableDiagnostics => {
    let current = summaries.get(packageId);
    if (!current) {
      current = {
        packageId,
        health: "unknown",
        starts: 0,
        invocations: 0,
        successes: 0,
        failures: 0,
        timeouts: 0,
        crashes: 0
      };
      summaries.set(packageId, current);
    }
    return current;
  };

  const snapshot = (value: MutableDiagnostics): PluginRuntimeDiagnosticsV010 => ({
    contractVersion: "0.1.0",
    packageId: value.packageId,
    health: value.health,
    starts: value.starts,
    invocations: value.invocations,
    successes: value.successes,
    failures: value.failures,
    timeouts: value.timeouts,
    crashes: value.crashes,
    restarts: Math.max(0, value.starts - 1),
    ...(value.lastEventAt ? { lastEventAt: value.lastEventAt } : {}),
    ...(value.lastError ? { lastError: value.lastError } : {})
  });

  return {
    record(input) {
      const event: PluginRuntimeEventV010 = {
        contractVersion: "0.1.0",
        sequence: ++sequence,
        ...structuredClone(input)
      };
      events.push(event);
      if (events.length > maxEvents) events.splice(0, events.length - maxEvents);

      const current = getMutable(event.packageId);
      current.lastEventAt = event.occurredAt;

      switch (event.type) {
        case "PROCESS_STARTING":
          current.starts += 1;
          current.health = "unknown";
          break;
        case "PROCESS_READY":
        case "INVOCATION_SUCCEEDED":
          current.health = "healthy";
          if (event.type === "INVOCATION_SUCCEEDED") current.successes += 1;
          break;
        case "INVOCATION_STARTED":
          current.invocations += 1;
          break;
        case "INVOCATION_FAILED":
          current.failures += 1;
          current.health = "degraded";
          current.lastError = event.message;
          break;
        case "INVOCATION_TIMEOUT":
          current.failures += 1;
          current.timeouts += 1;
          current.health = "degraded";
          current.lastError = event.message;
          break;
        case "PROCESS_EXITED":
        case "PROCESS_ERROR":
        case "PROCESS_FATAL":
          current.crashes += 1;
          current.health = "degraded";
          current.lastError = event.message;
          break;
        case "PROCESS_STOPPED":
          current.health = "stopped";
          break;
      }
      return structuredClone(event);
    },

    listEvents(packageId) {
      return events
        .filter(event => !packageId || event.packageId === packageId)
        .map(event => structuredClone(event));
    },

    diagnostics(packageId) {
      return snapshot(getMutable(packageId));
    },

    listDiagnostics() {
      return [...summaries.values()]
        .sort((a, b) => a.packageId.localeCompare(b.packageId))
        .map(snapshot);
    }
  };
}
