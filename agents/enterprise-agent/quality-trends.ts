import {
  aggregatePersonalAgentQualityEvidenceV010,
  type PersonalAgentQualityEvidenceEventV010
} from "./quality-evidence-store.js";

export interface PersonalAgentQualityTrendMetricV010 {
  current?: number;
  previous?: number;
  delta?: number;
  comparable: boolean;
  reason?: "INSUFFICIENT_INTERACTIONS" | "INSUFFICIENT_EVALUATED_EVIDENCE" | "NO_DENOMINATOR";
}

export interface PersonalAgentQualityTrendWindowV010 {
  contractVersion: "0.1.0";
  windowDays: 7 | 30 | 90;
  minimumComparableInteractions: number;
  minimumComparableEvaluatedInteractions: number;
  current: {
    startAt: string;
    endAt: string;
    interactions: number;
    humanEvaluatedInteractions: number;
    labEvaluatedInteractions: number;
  };
  previous: {
    startAt: string;
    endAt: string;
    interactions: number;
    humanEvaluatedInteractions: number;
    labEvaluatedInteractions: number;
  };
  metrics: {
    toolSuccessRate: PersonalAgentQualityTrendMetricV010;
    humanEvaluationCoverage: PersonalAgentQualityTrendMetricV010;
    verifiedCompletionRate: PersonalAgentQualityTrendMetricV010;
    postAuthorizationContinuationRate: PersonalAgentQualityTrendMetricV010;
    unnecessaryClarificationRate: PersonalAgentQualityTrendMetricV010;
  };
}

function hostInteractionIdsInWindow(
  events: readonly PersonalAgentQualityEvidenceEventV010[],
  startMs: number,
  endMs: number
): Set<string> {
  return new Set(
    events
      .filter(event =>
        event.source === "HOST_OBSERVED"
        && Date.parse(event.occurredAt) >= startMs
        && Date.parse(event.occurredAt) < endMs
      )
      .map(event => event.interactionId)
  );
}

function cohort(
  events: readonly PersonalAgentQualityEvidenceEventV010[],
  startMs: number,
  endMs: number
) {
  const ids = hostInteractionIdsInWindow(events, startMs, endMs);
  return events.filter(event => ids.has(event.interactionId));
}

function ratio(numerator: number, denominator: number): number | undefined {
  return denominator > 0 ? numerator / denominator : undefined;
}

function metric(
  current: number | undefined,
  previous: number | undefined,
  options: {
    enoughInteractions: boolean;
    enoughEvaluated?: boolean;
  }
): PersonalAgentQualityTrendMetricV010 {
  if (!options.enoughInteractions) {
    return {
      comparable: false,
      reason: "INSUFFICIENT_INTERACTIONS"
    };
  }
  if (options.enoughEvaluated === false) {
    return {
      comparable: false,
      reason: "INSUFFICIENT_EVALUATED_EVIDENCE"
    };
  }
  if (current === undefined || previous === undefined) {
    return {
      comparable: false,
      reason: "NO_DENOMINATOR"
    };
  }
  return {
    current,
    previous,
    delta: current - previous,
    comparable: true
  };
}

function windowFor(
  events: readonly PersonalAgentQualityEvidenceEventV010[],
  now: Date,
  windowDays: 7 | 30 | 90,
  minimumComparableInteractions: number,
  minimumComparableEvaluatedInteractions: number
): PersonalAgentQualityTrendWindowV010 {
  const endMs = now.getTime();
  const durationMs = windowDays * 86_400_000;
  const currentStartMs = endMs - durationMs;
  const previousStartMs = currentStartMs - durationMs;

  const currentEvents = cohort(events, currentStartMs, endMs);
  const previousEvents = cohort(events, previousStartMs, currentStartMs);
  const current = aggregatePersonalAgentQualityEvidenceV010(currentEvents);
  const previous = aggregatePersonalAgentQualityEvidenceV010(previousEvents);

  const enoughInteractions =
    current.interactions >= minimumComparableInteractions
    && previous.interactions >= minimumComparableInteractions;
  const enoughEvaluated =
    current.humanEvaluatedInteractions + current.labEvaluatedInteractions
      >= minimumComparableEvaluatedInteractions
    && previous.humanEvaluatedInteractions + previous.labEvaluatedInteractions
      >= minimumComparableEvaluatedInteractions;

  const toolSuccessCurrent = ratio(
    current.successfulToolCalls,
    current.observedToolCalls
  );
  const toolSuccessPrevious = ratio(
    previous.successfulToolCalls,
    previous.observedToolCalls
  );
  const humanCoverageCurrent = ratio(
    current.humanEvaluatedInteractions,
    current.interactions
  );
  const humanCoveragePrevious = ratio(
    previous.humanEvaluatedInteractions,
    previous.interactions
  );
  const completionCurrent = ratio(
    current.verifiedCompletion.pass,
    current.verifiedCompletion.pass + current.verifiedCompletion.fail
  );
  const completionPrevious = ratio(
    previous.verifiedCompletion.pass,
    previous.verifiedCompletion.pass + previous.verifiedCompletion.fail
  );
  const continuationCurrent = ratio(
    current.postAuthorizationContinuation.pass,
    current.postAuthorizationContinuation.pass
      + current.postAuthorizationContinuation.fail
  );
  const continuationPrevious = ratio(
    previous.postAuthorizationContinuation.pass,
    previous.postAuthorizationContinuation.pass
      + previous.postAuthorizationContinuation.fail
  );
  const unnecessaryCurrent = ratio(
    current.knownUnnecessaryClarifications,
    current.humanEvaluatedInteractions + current.labEvaluatedInteractions
  );
  const unnecessaryPrevious = ratio(
    previous.knownUnnecessaryClarifications,
    previous.humanEvaluatedInteractions + previous.labEvaluatedInteractions
  );

  return {
    contractVersion: "0.1.0",
    windowDays,
    minimumComparableInteractions,
    minimumComparableEvaluatedInteractions,
    current: {
      startAt: new Date(currentStartMs).toISOString(),
      endAt: new Date(endMs).toISOString(),
      interactions: current.interactions,
      humanEvaluatedInteractions: current.humanEvaluatedInteractions,
      labEvaluatedInteractions: current.labEvaluatedInteractions
    },
    previous: {
      startAt: new Date(previousStartMs).toISOString(),
      endAt: new Date(currentStartMs).toISOString(),
      interactions: previous.interactions,
      humanEvaluatedInteractions: previous.humanEvaluatedInteractions,
      labEvaluatedInteractions: previous.labEvaluatedInteractions
    },
    metrics: {
      toolSuccessRate: metric(
        toolSuccessCurrent,
        toolSuccessPrevious,
        { enoughInteractions }
      ),
      humanEvaluationCoverage: metric(
        humanCoverageCurrent,
        humanCoveragePrevious,
        { enoughInteractions }
      ),
      verifiedCompletionRate: metric(
        completionCurrent,
        completionPrevious,
        { enoughInteractions, enoughEvaluated }
      ),
      postAuthorizationContinuationRate: metric(
        continuationCurrent,
        continuationPrevious,
        { enoughInteractions, enoughEvaluated }
      ),
      unnecessaryClarificationRate: metric(
        unnecessaryCurrent,
        unnecessaryPrevious,
        { enoughInteractions, enoughEvaluated }
      )
    }
  };
}

export function createPersonalAgentQualityTrendWindowsV010(input: {
  events: readonly PersonalAgentQualityEvidenceEventV010[];
  now?: Date;
  minimumComparableInteractions?: number;
  minimumComparableEvaluatedInteractions?: number;
}): PersonalAgentQualityTrendWindowV010[] {
  const now = input.now ?? new Date();
  const minimumComparableInteractions =
    input.minimumComparableInteractions ?? 5;
  const minimumComparableEvaluatedInteractions =
    input.minimumComparableEvaluatedInteractions ?? 3;
  if (
    !Number.isInteger(minimumComparableInteractions)
    || minimumComparableInteractions < 1
    || !Number.isInteger(minimumComparableEvaluatedInteractions)
    || minimumComparableEvaluatedInteractions < 1
  ) {
    throw new Error("PERSONAL_AGENT_QUALITY_TREND_THRESHOLD_INVALID");
  }

  return ([7, 30, 90] as const).map(windowDays =>
    windowFor(
      input.events,
      now,
      windowDays,
      minimumComparableInteractions,
      minimumComparableEvaluatedInteractions
    )
  );
}
