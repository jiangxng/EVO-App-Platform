import type {
  BusinessDictionaryResolutionV010,
  BusinessDictionaryResolveBatchRequestV010,
  BusinessDictionarySnapshotV010
} from "../../contracts/reference-data/dictionary.js";

/**
 * Pure, deterministic reference resolution over a snapshot already authorized
 * by the owning dictionary plugin. No Host lookup, persistence or fuzzy AI.
 *
 * A name/label is NOT an identifier: only a code or explicitly curated alias
 * may resolve. Ambiguous codes/aliases fail closed even if one match is inactive.
 */
export function resolveBusinessDictionarySnapshotV010(
  snapshot: BusinessDictionarySnapshotV010,
  request: BusinessDictionaryResolveBatchRequestV010
): BusinessDictionaryResolutionV010[] {
  if (snapshot.contractVersion !== "0.1.0") {
    throw new Error("BUSINESS_DICTIONARY_CONTRACT_VERSION_INVALID");
  }
  if (!Number.isSafeInteger(snapshot.version) || snapshot.version < 0) {
    throw new Error("BUSINESS_DICTIONARY_SNAPSHOT_VERSION_INVALID");
  }
  if (!Array.isArray(request.sourceValues)) {
    throw new Error("BUSINESS_DICTIONARY_SOURCE_VALUES_INVALID");
  }

  const normalize = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase();
  const all = (status: Exclude<
    BusinessDictionaryResolutionV010["status"], "RESOLVED"
  >): BusinessDictionaryResolutionV010[] => request.sourceValues.map(() => ({
    status,
    dictionaryVersion: snapshot.version
  }));

  if (snapshot.contextId !== request.contextId) return all("CONTEXT_MISMATCH");
  if (snapshot.dictionaryId !== request.dictionaryId) return all("DICTIONARY_MISMATCH");
  if (request.expectedVersion !== undefined
    && snapshot.version !== request.expectedVersion) return all("VERSION_MISMATCH");
  if (snapshot.state !== "PUBLISHED") return all("NOT_PUBLISHED");

  const lookup = new Map<string, Set<string>>();
  const byCode = new Map(snapshot.options.map(option => [option.code, option]));
  for (const option of snapshot.options) {
    const code = option.code.trim();
    if (!code) throw new Error("BUSINESS_DICTIONARY_OPTION_CODE_REQUIRED");
    for (const value of [code, ...(option.aliases ?? [])]) {
      const key = normalize(value);
      if (!key) throw new Error("BUSINESS_DICTIONARY_ALIAS_INVALID");
      const candidates = lookup.get(key) ?? new Set<string>();
      candidates.add(code);
      lookup.set(key, candidates);
    }
  }

  return request.sourceValues.map(raw => {
    const key = normalize(raw);
    const candidates = key ? [...(lookup.get(key) ?? [])].sort() : [];
    if (candidates.length === 0) {
      return { status: "UNKNOWN", dictionaryVersion: snapshot.version };
    }
    if (candidates.length > 1) {
      return {
        status: "AMBIGUOUS",
        dictionaryVersion: snapshot.version,
        candidateCodes: candidates
      };
    }
    const option = byCode.get(candidates[0]);
    if (!option || option.status !== "ACTIVE") {
      return { status: "INACTIVE", dictionaryVersion: snapshot.version };
    }
    return {
      status: "RESOLVED",
      optionCode: option.code,
      dictionaryVersion: snapshot.version
    };
  });
}
