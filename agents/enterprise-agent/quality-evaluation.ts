export interface PersonalAgentQualityEvidenceV010 {
  contractVersion: "0.1.0";
  interactionId: string;
  clarificationAsked?: boolean;
  clarificationWasNecessary?: boolean;
  presentedEquivalentOptionsWithoutRecommendation?: boolean;
  executableStepsReturnedToHuman?: number;
  authorizationRequired?: boolean;
  authorizationGranted?: boolean;
  continuedAfterAuthorization?: boolean;
  completionVerified?: boolean;
  correctedApproach?: boolean;
  correctionPreservedHumanGoal?: boolean;
  toolCalls: number;
  successfulToolCalls: number;
  failedToolCalls: number;
}

export interface PersonalAgentQualityEvaluationV010 {
  contractVersion: "0.1.0";
  interactionId: string;
  metrics: {
    unnecessaryClarifications: 0 | 1 | "UNKNOWN";
    avoidableChoiceMenus: 0 | 1 | "UNKNOWN";
    executableStepsPushedToHuman: number | "UNKNOWN";
    postAuthorizationContinuation: "NOT_APPLICABLE" | "PASS" | "FAIL" | "UNKNOWN";
    verifiedCompletion: boolean | "UNKNOWN";
    correctionQuality: "NOT_APPLICABLE" | "PASS" | "FAIL" | "UNKNOWN";
    toolSuccessRate?: number;
  };
  signals: string[];
}

export function evaluatePersonalAgentQualityV010(
  evidence: PersonalAgentQualityEvidenceV010
): PersonalAgentQualityEvaluationV010 {
  if (evidence.contractVersion !== "0.1.0" || !evidence.interactionId.trim()) {
    throw new Error("PERSONAL_AGENT_QUALITY_EVIDENCE_INVALID");
  }
  for (const [key, value] of Object.entries({
    ...(evidence.executableStepsReturnedToHuman !== undefined
      ? { executableStepsReturnedToHuman: evidence.executableStepsReturnedToHuman }
      : {}),
    toolCalls: evidence.toolCalls,
    successfulToolCalls: evidence.successfulToolCalls,
    failedToolCalls: evidence.failedToolCalls
  })) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`PERSONAL_AGENT_QUALITY_COUNT_INVALID: ${key}`);
    }
  }
  if (evidence.successfulToolCalls + evidence.failedToolCalls > evidence.toolCalls) {
    throw new Error("PERSONAL_AGENT_QUALITY_TOOL_COUNTS_INVALID");
  }

  const unnecessaryClarifications =
    evidence.clarificationAsked === undefined || evidence.clarificationWasNecessary === undefined
      ? "UNKNOWN"
      : evidence.clarificationAsked && evidence.clarificationWasNecessary === false ? 1 : 0;
  const avoidableChoiceMenus =
    evidence.presentedEquivalentOptionsWithoutRecommendation === undefined
      ? "UNKNOWN"
      : evidence.presentedEquivalentOptionsWithoutRecommendation ? 1 : 0;

  const postAuthorizationContinuation =
    evidence.authorizationRequired === undefined
      ? "UNKNOWN"
      : !evidence.authorizationRequired
        ? "NOT_APPLICABLE"
        : evidence.authorizationGranted !== true
          ? "UNKNOWN"
        : evidence.continuedAfterAuthorization === true
          ? "PASS"
          : evidence.continuedAfterAuthorization === false
            ? "FAIL"
            : "UNKNOWN";

  const correctionQuality =
    evidence.correctedApproach === undefined
      ? "UNKNOWN"
      : !evidence.correctedApproach
        ? "NOT_APPLICABLE"
      : evidence.correctionPreservedHumanGoal === true
        ? "PASS"
        : evidence.correctionPreservedHumanGoal === false
          ? "FAIL"
          : "UNKNOWN";

  const signals: string[] = [];
  if (unnecessaryClarifications === 1) signals.push("UNNECESSARY_CLARIFICATION");
  if (avoidableChoiceMenus === 1) signals.push("AVOIDABLE_CHOICE_MENU");
  if ((evidence.executableStepsReturnedToHuman ?? 0) > 0) signals.push("EXECUTABLE_WORK_PUSHED_TO_HUMAN");
  if (postAuthorizationContinuation === "FAIL") signals.push("AUTHORIZATION_WITHOUT_FOLLOW_THROUGH");
  if (evidence.completionVerified === false) signals.push("COMPLETION_NOT_VERIFIED");
  if (correctionQuality === "FAIL") signals.push("CORRECTION_DID_NOT_PRESERVE_GOAL");
  if (evidence.failedToolCalls > 0) signals.push("TOOL_FAILURE_OBSERVED");

  return {
    contractVersion: "0.1.0",
    interactionId: evidence.interactionId,
    metrics: {
      unnecessaryClarifications,
      avoidableChoiceMenus,
      executableStepsPushedToHuman: evidence.executableStepsReturnedToHuman ?? "UNKNOWN",
      postAuthorizationContinuation,
      verifiedCompletion: evidence.completionVerified ?? "UNKNOWN",
      correctionQuality,
      ...(evidence.toolCalls > 0
        ? { toolSuccessRate: evidence.successfulToolCalls / evidence.toolCalls }
        : {})
    },
    signals
  };
}
