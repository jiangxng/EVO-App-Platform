import type { ExperienceArchitectureDescriptorV010 } from "../vendor/eidos/src/experience-architecture/contracts.js";

export const APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010 = {
  contractVersion: "0.1.0",
  eidosCommit: "9440d8c32b9f23eab2c55b0f58a8be711573da33",
  eidosReviewDecisionCommit: "82dcea59abf14518394fd605faf5b741e57a7ef0",
  eidosJourneyContinuationCommit: "b937d45e6149dc16bdd2f0f6141df468f9014bda",
  eidosScopedJourneyContinuationCommit: "a2c2cf3380f1155c76dd405183abedec4e670cdc",
  eidosRuntimeLocalizationCommit: "05fa28cfa2b1019fa22c9811eaf06d3278d344af",
  eidosSettingsJourneyCommit: "c6fb8bb99541dbda5d5e4957fdebac069299e573",
  eidosPolicyVersion: "0.1.0",
  constitution: "Eidos Experience Architecture Constitution v0.1",
  baselineExpansionRequiresHumanApproval: true
} as const;

export const appPlatformExperienceArchitectureV010: ExperienceArchitectureDescriptorV010[] = [
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.chat",
    maturity: "candidate",
    archetype: "conversation",
    taskMode: "exploration",
    goal: "Ask, understand and carry out work with Personal Agent",
    subject: "active-context",
    actions: [
      {
        id: "send",
        label: "Send",
        determinism: "agentic",
        frequency: "frequent",
        surface: "direct",
        primary: true
      }
    ],
    agent: {
      enabled: true,
      mayRecommendDeclaredActions: true,
      mayPrepareDeclaredActionInputs: true,
      mayExecuteOnlyDeclaredActions: true
    },
    quality: {
      systemStringsLocalized: true,
      machineValuesSeparatedFromHumanCopy: true,
      designLanguageCompliant: true
    }
  },
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.setup",
    maturity: "candidate",
    archetype: "setup",
    taskMode: "bounded-task",
    goal: "Make Personal Agent usable with a working LLM Provider",
    subject: "personal-agent-readiness",
    journey: {
      goal: "Reach Personal Agent ready state",
      entry: ["/enterprise-agent", "/enterprise-agent/setup"],
      prerequisites: ["Personal Agent feature active"],
      states: ["provider", "credentials", "readiness", "ready"],
      currentState: "provider",
      completionStates: ["ready"],
      nextDestinations: ["/enterprise-agent"],
      resumable: true,
      recoveryActions: ["recheck-setup", "check-provider-status"]
    },
    actions: [
      {
        id: "choose-provider",
        label: "Choose Provider",
        determinism: "deterministic",
        frequency: "occasional",
        surface: "direct",
        primary: true,
        availableInStates: ["provider"]
      },
      {
        id: "configure-provider",
        label: "Configure Provider",
        determinism: "deterministic",
        frequency: "occasional",
        surface: "direct",
        primary: true,
        availableInStates: ["credentials"]
      },
      {
        id: "check-provider-status",
        label: "Check Provider status",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct",
        primary: true,
        availableInStates: ["readiness"]
      },
      {
        id: "open-agent",
        label: "Open Personal Agent",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct",
        primary: true,
        availableInStates: ["ready"]
      }
    ],
    agent: { enabled: false },
    quality: {
      systemStringsLocalized: true,
      machineValuesSeparatedFromHumanCopy: true,
      designLanguageCompliant: true
    }
  },
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.memory-review",
    maturity: "candidate",
    archetype: "review",
    taskMode: "exploration",
    goal: "Review proposed durable knowledge and governance changes",
    subject: "context-memory-proposal",
    actions: [
      {
        id: "accept",
        label: "Accept",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct",
        primary: true
      },
      {
        id: "save",
        label: "Save edit",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct"
      },
      {
        id: "reject",
        label: "Reject",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct"
      }
    ],
    agent: { enabled: false },
    quality: {
      systemStringsLocalized: true,
      machineValuesSeparatedFromHumanCopy: true,
      designLanguageCompliant: true
    }
  },
  {
    contractVersion: "0.1.0",
    experienceId: "llm-provider.binding",
    maturity: "candidate",
    archetype: "editor",
    taskMode: "bounded-task",
    goal: "Choose which installed LLM Provider serves the requested capability",
    subject: "provider-binding",
    journey: {
      goal: "Persist a valid provider binding",
      entry: ["/providers/llm.inference"],
      states: ["editing", "saved"],
      currentState: "editing",
      completionStates: ["saved"],
      nextDestinations: ["/enterprise-agent/setup"],
      resumable: true,
      recoveryActions: ["fix-validation", "retry-health-check"]
    },
    actions: [
      {
        id: "save-binding",
        label: "Save binding",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct",
        primary: true,
        availableInStates: ["editing"]
      }
    ],
    agent: { enabled: false },
    quality: {
      systemStringsLocalized: true,
      machineValuesSeparatedFromHumanCopy: true,
      designLanguageCompliant: true
    }
  },
  {
    contractVersion: "0.1.0",
    experienceId: "llm-provider.settings",
    maturity: "candidate",
    archetype: "editor",
    taskMode: "bounded-task",
    goal: "Configure Provider runtime settings and credentials",
    subject: "provider-settings",
    journey: {
      goal: "Save usable Provider configuration",
      entry: ["/settings"],
      states: ["editing", "configured"],
      currentState: "editing",
      completionStates: ["configured"],
      nextDestinations: ["/enterprise-agent/setup"],
      resumable: true,
      recoveryActions: ["fix-validation", "replace-credential", "retry-save"]
    },
    actions: [
      {
        id: "save-settings",
        label: "Save",
        determinism: "deterministic",
        frequency: "frequent",
        surface: "direct",
        primary: true,
        availableInStates: ["editing"]
      }
    ],
    agent: { enabled: false },
    quality: {
      systemStringsLocalized: true,
      machineValuesSeparatedFromHumanCopy: true,
      designLanguageCompliant: true
    }
  },
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.quality",
    maturity: "experimental",
    archetype: "overview",
    taskMode: "exploration",
    goal: "Inspect evidence about Personal Agent collaboration quality"
  },
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.quality-review",
    maturity: "experimental",
    archetype: "review",
    taskMode: "exploration",
    goal: "Add Human evaluation evidence to observed Personal Agent interactions"
  },
  {
    contractVersion: "0.1.0",
    experienceId: "personal-agent.follow-ups",
    maturity: "experimental",
    archetype: "work-queue",
    taskMode: "exploration",
    goal: "Review and complete Personal Agent follow-up work"
  }
];

export const appPlatformExperienceArchitectureKnownDebtV010: Readonly<Record<string, readonly string[]>> = {};
