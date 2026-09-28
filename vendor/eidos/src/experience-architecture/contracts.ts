export type ExperienceMaturityV010 =
  | "experimental"
  | "candidate"
  | "production";

export type ExperiencePageArchetypeV010 =
  | "collection"
  | "detail"
  | "overview"
  | "work-queue"
  | "editor"
  | "review"
  | "setup"
  | "explorer"
  | "conversation";

export type ExperienceTaskModeV010 = "bounded-task" | "exploration";

export type ExperienceActionDeterminismV010 =
  | "deterministic"
  | "assistive"
  | "agentic";

export type ExperienceActionFrequencyV010 =
  | "frequent"
  | "occasional"
  | "rare";

export type ExperienceActionSurfaceV010 =
  | "direct"
  | "agent"
  | "both";

export interface ExperienceActionDescriptorV010 {
  id: string;
  label?: string;
  determinism: ExperienceActionDeterminismV010;
  frequency: ExperienceActionFrequencyV010;
  surface: ExperienceActionSurfaceV010;
  primary?: boolean;
  destructive?: boolean;
  availableInStates?: string[];
}

export interface ExperienceJourneyV010 {
  goal: string;
  entry?: string[];
  prerequisites?: string[];
  states?: string[];
  currentState?: string;
  completionStates?: string[];
  nextDestinations?: string[];
  resumable?: boolean;
  recoveryActions?: string[];
}

export interface ExperienceAgentPolicyV010 {
  enabled: boolean;
  mayRecommendDeclaredActions?: boolean;
  mayPrepareDeclaredActionInputs?: boolean;
  mayExecuteOnlyDeclaredActions?: boolean;
}

export interface ExperienceQualityV010 {
  systemStringsLocalized?: boolean;
  machineValuesSeparatedFromHumanCopy?: boolean;
  keyboardOperable?: boolean;
  responsive?: boolean;
  recoveryDefined?: boolean;
  designLanguageCompliant?: boolean;
  goldenJourneyCovered?: boolean;
}

export interface ExperienceArchitectureDescriptorV010 {
  contractVersion: "0.1.0";
  experienceId: string;
  maturity: ExperienceMaturityV010;
  archetype: ExperiencePageArchetypeV010;
  taskMode: ExperienceTaskModeV010;
  goal: string;
  subject?: string;
  journey?: ExperienceJourneyV010;
  actions?: ExperienceActionDescriptorV010[];
  agent?: ExperienceAgentPolicyV010;
  quality?: ExperienceQualityV010;
}
