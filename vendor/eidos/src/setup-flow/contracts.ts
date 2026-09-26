export type SetupStepStateV010 =
  | "pending"
  | "current"
  | "complete"
  | "blocked"
  | "error";

export interface SetupFlowActionV010 {
  id: string;
  label: string;
  type: "command" | "navigate";
  command?: string;
  inputVersion?: string;
  route?: string;
  primary?: boolean;
  requiresConfirmation?: boolean;
  enabled?: boolean;
  disabledReason?: string;
}

export interface SetupFlowStepV010 {
  id: string;
  title: string;
  description?: string;
  state: SetupStepStateV010;
  statusDetail?: string;
  primaryAction?: SetupFlowActionV010;
  secondaryActions?: SetupFlowActionV010[];
}

export interface SetupFlowV010 {
  contractVersion: "0.1.0";
  kind: "setup-flow";
  id: string;
  title: string;
  description?: string;
  steps: SetupFlowStepV010[];
  completionAction?: SetupFlowActionV010;
}

export function isSetupFlowV010(value: unknown): value is SetupFlowV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.contractVersion === "0.1.0"
    && item.kind === "setup-flow"
    && typeof item.id === "string"
    && item.id.length > 0
    && typeof item.title === "string"
    && item.title.length > 0
    && Array.isArray(item.steps);
}
