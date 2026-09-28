export const eidosExperienceArchitecturePolicyV010 = {
  contractVersion: "0.1.0",
  authority: "P0",
  formula: [
    "archetype",
    "goal",
    "subject",
    "state",
    "journey",
    "actions",
    "feedback",
    "recovery",
    "agent-assistance"
  ],
  authorityStack: [
    "experience-architecture",
    "experience-contracts",
    "capabilities-and-page-archetypes",
    "productive-design-language",
    "renderer-and-terminal"
  ],
  archetypes: [
    "collection",
    "detail",
    "overview",
    "work-queue",
    "editor",
    "review",
    "setup",
    "explorer",
    "conversation"
  ],
  actionModel: {
    availabilityFunction: ["subject", "state", "context", "permission", "policy"],
    maxPrimaryPerState: 1,
    deterministicFrequentActionRequiresDirectSurface: true,
    chatOnlyDeterministicFrequentActionForbiddenForCandidateAndProduction: true,
    agentMayRecommendDeclaredActions: true,
    agentMayPrepareDeclaredActionInputs: true,
    agentMayExecuteOnlyDeclaredActions: true
  },
  journey: {
    boundedTasksRequireGoal: true,
    boundedTasksRequireCompletion: true,
    candidateRequiresRecovery: true,
    productionRequiresRecovery: true,
    strandedSuccessForbidden: true
  },
  settings: {
    preferSmartDefaults: true,
    minimizeConfiguration: true,
    taskSpecificOptionsStayInTaskContext: true,
    crossPageSettingsTransitionMustPreserveJourney: true,
    advancedUsesProgressiveDisclosure: true
  },
  language: {
    systemTextLocalizable: true,
    machineValuesStable: true,
    machineValuesNotDefaultHumanCopy: true,
    fallbackDoesNotEqualCoverage: true
  },
  maturity: {
    experimentalMayBeIncomplete: true,
    experimentalMustBeExplicit: true,
    candidateRequiresStructureAndJourney: true,
    productionRequiresGoldenJourney: true,
    productionRequiresAccessibility: true,
    productionRequiresResponsiveBehavior: true
  },
  gates: [
    "experience-structure",
    "journey-continuity",
    "action-grammar",
    "human-directness",
    "product-quality"
  ]
} as const;
