import type {
  FoundationObjectLocalizedTextV010
} from "../foundation-object/schema.js";

/**
 * Managed business dictionaries are not the object plugin's immutable ENUM options.
 * Semantic owner: a future optional business-dictionary Application plugin.
 * This public contract grants no read permission or publication authority.
 */
export interface BusinessDictionaryOptionV010 {
  /** Stable within (contextId, dictionaryId); never derive from a display label. */
  code: string;
  label: FoundationObjectLocalizedTextV010;
  /** Explicitly governed source-value equivalents, not fuzzy matching. */
  aliases?: string[];
  status: "ACTIVE" | "INACTIVE";
}

export interface BusinessDictionarySnapshotV010 {
  contractVersion: "0.1.0";
  /** Enterprise Context resource boundary, not the login principal ID. */
  contextId: string;
  dictionaryId: string;
  /** Published revisions are immutable; drafts are not executable as lookup truth. */
  version: number;
  state: "DRAFT" | "PUBLISHED";
  options: BusinessDictionaryOptionV010[];
}

export interface BusinessDictionaryResolveBatchRequestV010 {
  contextId: string;
  dictionaryId: string;
  expectedVersion?: number;
  sourceValues: string[];
}

export type BusinessDictionaryResolutionStatusV010 =
  | "RESOLVED"
  | "UNKNOWN"
  | "INACTIVE"
  | "AMBIGUOUS"
  | "CONTEXT_MISMATCH"
  | "DICTIONARY_MISMATCH"
  | "VERSION_MISMATCH"
  | "NOT_PUBLISHED";

export type BusinessDictionaryResolutionV010 =
  | {
      status: "RESOLVED";
      optionCode: string;
      dictionaryVersion: number;
    }
  | {
      status: Exclude<BusinessDictionaryResolutionStatusV010, "RESOLVED">;
      dictionaryVersion: number;
      candidateCodes?: string[];
    };

/**
 * The plugin owner must authenticate, authorize and isolate before resolving.
 * Both Human UI and Agent/Import consume the same read capability.
 * No publication, writing or grant is implied by this interface.
 */
export interface BusinessDictionaryReadCapabilityV010 {
  resolveBatch(
    request: BusinessDictionaryResolveBatchRequestV010
  ): Promise<BusinessDictionaryResolutionV010[]>;
}
