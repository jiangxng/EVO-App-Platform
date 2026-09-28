import type {
  ExperienceActionDescriptorV010,
  ExperienceArchitectureDescriptorV010
} from "./contracts.js";

export interface ExperienceArchitectureDiagnosticV010 {
  code: string;
  path: string;
  message: string;
}

export interface ExperienceArchitectureValidationResultV010 {
  ok: boolean;
  diagnostics: ExperienceArchitectureDiagnosticV010[];
}

const maturity = new Set(["experimental", "candidate", "production"]);
const archetypes = new Set([
  "collection",
  "detail",
  "overview",
  "work-queue",
  "editor",
  "review",
  "setup",
  "explorer",
  "conversation"
]);
const taskModes = new Set(["bounded-task", "exploration"]);

function d(code: string, path: string, message: string): ExperienceArchitectureDiagnosticV010 {
  return { code, path, message };
}

function duplicateIds(actions: readonly ExperienceActionDescriptorV010[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const action of actions) {
    if (seen.has(action.id)) duplicates.add(action.id);
    seen.add(action.id);
  }
  return [...duplicates];
}

export function validateExperienceArchitectureV010(
  value: ExperienceArchitectureDescriptorV010
): ExperienceArchitectureValidationResultV010 {
  const diagnostics: ExperienceArchitectureDiagnosticV010[] = [];

  if (value.contractVersion !== "0.1.0") {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_VERSION", "$.contractVersion", "Unsupported experience architecture contract version."));
  }
  if (!value.experienceId) {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_ID", "$.experienceId", "experienceId is required."));
  }
  if (!maturity.has(value.maturity)) {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_MATURITY", "$.maturity", "Unsupported experience maturity."));
  }
  if (!archetypes.has(value.archetype)) {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_ARCHETYPE", "$.archetype", "A canonical page archetype is required."));
  }
  if (!taskModes.has(value.taskMode)) {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_TASK_MODE", "$.taskMode", "taskMode must be bounded-task or exploration."));
  }
  if (!value.goal?.trim()) {
    diagnostics.push(d("EIDOS_EXPERIENCE_ARCH_GOAL", "$.goal", "A Human goal is required."));
  }

  const actions = value.actions ?? [];
  for (const duplicate of duplicateIds(actions)) {
    diagnostics.push(d("EIDOS_ACTION_DUPLICATE", "$.actions", `Duplicate action id '${duplicate}'.`));
  }

  for (const [index, action] of actions.entries()) {
    if (!action.id?.trim()) {
      diagnostics.push(d("EIDOS_ACTION_ID", `$.actions[${index}].id`, "Action id is required."));
    }
    if (
      value.maturity !== "experimental"
      && action.determinism === "deterministic"
      && action.frequency === "frequent"
      && action.surface === "agent"
    ) {
      diagnostics.push(d(
        "EIDOS_HUMAN_DIRECTNESS_REQUIRED",
        `$.actions[${index}].surface`,
        "Frequent deterministic actions require a direct manipulation surface; chat cannot be the only path."
      ));
    }
  }

  const states = new Set(value.journey?.states ?? []);
  const primaryCounts = new Map<string, number>();
  for (const action of actions.filter(item => item.primary)) {
    const availableStates = action.availableInStates?.length
      ? action.availableInStates
      : ["*"];
    for (const state of availableStates) {
      primaryCounts.set(state, (primaryCounts.get(state) ?? 0) + 1);
      if (state !== "*" && states.size > 0 && !states.has(state)) {
        diagnostics.push(d(
          "EIDOS_ACTION_UNKNOWN_STATE",
          "$.actions",
          `Action '${action.id}' references undeclared state '${state}'.`
        ));
      }
    }
  }
  for (const [state, count] of primaryCounts) {
    if (count > 1) {
      diagnostics.push(d(
        "EIDOS_ACTION_PRIMARY_CONFLICT",
        "$.actions",
        `State '${state}' exposes ${count} primary actions; at most one is allowed per action scope.`
      ));
    }
  }

  if (value.taskMode === "bounded-task" && value.maturity !== "experimental") {
    if (!value.journey) {
      diagnostics.push(d(
        "EIDOS_JOURNEY_REQUIRED",
        "$.journey",
        "Candidate and production bounded tasks require an explicit journey."
      ));
    } else {
      if (!value.journey.goal?.trim()) {
        diagnostics.push(d("EIDOS_JOURNEY_GOAL", "$.journey.goal", "Journey goal is required."));
      }
      if (!value.journey.completionStates?.length) {
        diagnostics.push(d(
          "EIDOS_JOURNEY_COMPLETION_MISSING",
          "$.journey.completionStates",
          "A bounded task requires at least one terminal completion state."
        ));
      }
      if (!value.journey.recoveryActions?.length) {
        diagnostics.push(d(
          "EIDOS_JOURNEY_RECOVERY_MISSING",
          "$.journey.recoveryActions",
          "Candidate and production bounded tasks require an explicit repair or recovery path."
        ));
      }
    }
  }

  if (value.agent?.enabled && value.maturity !== "experimental") {
    if (value.agent.mayExecuteOnlyDeclaredActions !== true) {
      diagnostics.push(d(
        "EIDOS_AGENT_DECLARED_ACTION_BOUNDARY",
        "$.agent.mayExecuteOnlyDeclaredActions",
        "Candidate and production Agent experiences must restrict execution to declared Host actions."
      ));
    }
  }

  if (value.maturity === "candidate" || value.maturity === "production") {
    const quality = value.quality;
    if (!quality?.systemStringsLocalized) {
      diagnostics.push(d(
        "EIDOS_PRODUCT_LOCALIZATION_REQUIRED",
        "$.quality.systemStringsLocalized",
        "Candidate and production Experiences require localized system chrome."
      ));
    }
    if (!quality?.machineValuesSeparatedFromHumanCopy) {
      diagnostics.push(d(
        "EIDOS_PRODUCT_HUMAN_COPY_REQUIRED",
        "$.quality.machineValuesSeparatedFromHumanCopy",
        "Machine values must be separated from default Human-facing copy."
      ));
    }
    if (!quality?.designLanguageCompliant) {
      diagnostics.push(d(
        "EIDOS_PRODUCT_DESIGN_LANGUAGE_REQUIRED",
        "$.quality.designLanguageCompliant",
        "Candidate and production Experiences must use Eidos Design Language."
      ));
    }
  }

  if (value.maturity === "production") {
    const quality = value.quality;
    if (!quality?.keyboardOperable) {
      diagnostics.push(d("EIDOS_PRODUCT_KEYBOARD_REQUIRED", "$.quality.keyboardOperable", "Production Experiences must be keyboard operable."));
    }
    if (!quality?.responsive) {
      diagnostics.push(d("EIDOS_PRODUCT_RESPONSIVE_REQUIRED", "$.quality.responsive", "Production Experiences must define responsive behavior."));
    }
    if (!quality?.recoveryDefined) {
      diagnostics.push(d("EIDOS_PRODUCT_RECOVERY_REQUIRED", "$.quality.recoveryDefined", "Production Experiences must define recovery behavior."));
    }
    if (!quality?.goldenJourneyCovered && value.taskMode === "bounded-task") {
      diagnostics.push(d(
        "EIDOS_GOLDEN_JOURNEY_REQUIRED",
        "$.quality.goldenJourneyCovered",
        "Production bounded tasks require Golden Journey regression coverage."
      ));
    }
  }

  return { ok: diagnostics.length === 0, diagnostics };
}
