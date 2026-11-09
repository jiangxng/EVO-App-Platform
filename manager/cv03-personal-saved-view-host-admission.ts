import type {AppActionRequestV010, AppActionExecutionResultV010}
  from "../actions/contracts.js";

export const CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010 =
  "app://evo-business-dictionary/pages/personal-view-new" as const;
export const CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010 =
  "collection.saved-view.personal.save" as const;

/**
 * C3-02 negative production admission gate.
 *
 * The current Host has no production-certified shared Postgres authority,
 * independently verified Host receipt signer, migrated schema or approved
 * Human Experience registration. An opt-in test-only loopback HTTP adapter
 * exists but MUST NOT be mounted on the real /v1/actions multiplexor.
 *
 * A flag alone can NEVER authorize this WRITE: an explicit future Host
 * integration PR must prove the physical backend/identity/SQL admission,
 * apply the original CapabilityOperation and install the Feature through
 * PA05 before replacing this gate.
 */
export function assertCv03HumanSaveNotEnabledV010(
  config: Pick<NodeJS.ProcessEnv,"APP_PLATFORM_CV03_HUMAN_SAVE_MODE">
):void {
  const value=config.APP_PLATFORM_CV03_HUMAN_SAVE_MODE?.trim().toUpperCase() || "OFF";
  if(value!=="OFF")throw Error("CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED");
}

export function isCv03HumanSaveFormSourceV010(source:unknown):boolean {
  return source===CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010;
}

/**
 * Only matches CV-03's own WRITE operation; every other Host action must
 * retain the existing dispatcher, regardless of flags or caller input.
 * This also closes an accidental future bypass if another installed Feature
 * contributes the personal-saved-view command without production admission.
 */
export function cv03UnadmittedWriteDenialV010(
  action:Pick<AppActionRequestV010,"command"|"sourceInteractionId">
):AppActionExecutionResultV010|undefined {
  if(action.command?.code!==CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010) {
    return undefined;
  }
  return {
    ok:false,
    correlationId:action.sourceInteractionId,
    error:{
      code:"CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED",
      message:"Private Saved View WRITE is unavailable until Host PostgreSQL, signing receipt, Feature and Human acceptance are certified."
    }
  };
}
