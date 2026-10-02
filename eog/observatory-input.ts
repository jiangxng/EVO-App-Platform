import type {
  EogObservatoryTargetV020,
  EogTimeLensV020
} from "../contracts/enterprise-operating-graph-observatory.js";

function record(value: unknown, code: string): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw new Error(code);
  }
  return value as Record<string, unknown>;
}

function stringValue(
  value: unknown,
  code: string
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(code);
  }
  return value.trim();
}

function windowValue(value: unknown): {
  startAt: string;
  endAt: string;
} {
  const raw = record(value, "EOG_TIME_WINDOW_INVALID");
  return {
    startAt: stringValue(
      raw.startAt,
      "EOG_TIME_WINDOW_INVALID"
    ),
    endAt: stringValue(
      raw.endAt,
      "EOG_TIME_WINDOW_INVALID"
    )
  };
}

export function parseEogTimeLensInputV020(
  value: unknown
): EogTimeLensV020 {
  const raw = record(value, "EOG_TIME_LENS_INVALID");
  if (raw.contractVersion !== "0.2.0") {
    throw new Error("EOG_TIME_LENS_VERSION_UNSUPPORTED");
  }

  const comparisonRaw = raw.comparison;
  let comparison: EogTimeLensV020["comparison"];
  if (comparisonRaw !== undefined) {
    const candidate = record(
      comparisonRaw,
      "EOG_TIME_COMPARISON_INVALID"
    );
    if (candidate.kind === "PREVIOUS_PERIOD") {
      comparison = { kind: "PREVIOUS_PERIOD" };
    } else if (candidate.kind === "EXPLICIT") {
      comparison = {
        kind: "EXPLICIT",
        window: windowValue(candidate.window)
      };
    } else {
      throw new Error("EOG_TIME_COMPARISON_INVALID");
    }
  }

  return {
    contractVersion: "0.2.0",
    primary: windowValue(raw.primary),
    ...(comparison ? { comparison } : {})
  };
}

export function parseEogObservatoryTargetsV020(
  value: unknown
): EogObservatoryTargetV020[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("EOG_OBSERVATORY_TARGETS_INVALID");
  }

  return value.map((item, index) => {
    const raw = record(
      item,
      "EOG_OBSERVATORY_TARGET_INVALID:" + index
    );
    if (raw.kind === "NODE") {
      return {
        kind: "NODE" as const,
        nodeId: stringValue(
          raw.nodeId,
          "EOG_OBSERVATORY_TARGET_INVALID:" + index
        )
      };
    }
    if (
      raw.kind === "RELATION"
      && (
        raw.authority === "GUIDANCE"
        || raw.authority === "ENTERPRISE"
      )
    ) {
      return {
        kind: "RELATION" as const,
        authority: raw.authority,
        relationId: stringValue(
          raw.relationId,
          "EOG_OBSERVATORY_TARGET_INVALID:" + index
        )
      };
    }
    throw new Error(
      "EOG_OBSERVATORY_TARGET_INVALID:" + index
    );
  });
}

export function parseEogMetricCodesV020(
  value: unknown
): string[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value)
    || value.some(item =>
      typeof item !== "string"
      || !item.trim()
    )
  ) {
    throw new Error("EOG_RUNTIME_METRIC_FILTER_INVALID");
  }
  return [...new Set(
    value.map(item => String(item).trim())
  )].sort();
}

export function parseEogObservatoryRequestInputV020(
  input: Record<string, unknown>
): {
  graphId: string;
  timeLens: EogTimeLensV020;
  targets?: EogObservatoryTargetV020[];
  metricCodes?: string[];
} {
  const targets = parseEogObservatoryTargetsV020(
    input.targets
  );
  const metricCodes = parseEogMetricCodesV020(
    input.metricCodes
  );
  return {
    graphId: stringValue(
      input.graphId,
      "EOG_GRAPH_ID_REQUIRED"
    ),
    timeLens: parseEogTimeLensInputV020(input.timeLens),
    ...(targets?.length ? { targets } : {}),
    ...(metricCodes?.length ? { metricCodes } : {})
  };
}
