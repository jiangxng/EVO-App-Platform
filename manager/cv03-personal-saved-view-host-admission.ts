import type {AppActionRequestV010, AppActionExecutionResultV010}
  from "../actions/contracts.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";

export const CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010 =
  "app://evo-business-dictionary/pages/personal-view-new" as const;
export const CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010 =
  "collection.saved-view.personal.save" as const;

// This is the exact Domain Owner opt-in Feature identifier, not the
// host-enterprise-context-provider DEFAULT Feature. Keep the startup check
// side-effect-free: do not import/instantiate the test-only optional Feature
// manifest merely to decide whether a restored Host may start.
export const CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010 =
  "host-enterprise-context-provider.personal-saved-views" as const;

/**
 * Fail closed BEFORE binding any HTTP socket if an unadmitted Personal
 * Saved View Feature was restored from persisted lifecycle state.
 *
 * Inactive installed package metadata, the normal enterprise-context
 * default Feature, and the separate READ_ONLY Eidos page opt-in are not
 * themselves a persisted registration of this uncertified WRITE Feature.
 *
 * This is a local Host startup barrier, NOT a DB authority reconciliation
 * or PA05 cross-Worker fence. The SQL mirror may still require quarantining
 * by its independently trusted Owner; production N1 remains NOT_CERTIFIED.
 */
export function assertCv03UnadmittedPersistedFeatureAbsentV010(
  snapshot: Pick<PlatformSnapshotV010,"activeFeatures">
): void {
  if(!snapshot || !Array.isArray(snapshot.activeFeatures) ||
     snapshot.activeFeatures.some(feature =>
       feature?.featureId===CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010)) {
    throw Error("CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED");
  }
}


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
  config: {APP_PLATFORM_CV03_HUMAN_SAVE_MODE?:string}
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
