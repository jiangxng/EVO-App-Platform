import type {
  BusinessDictionaryOptionV010,
  BusinessDictionaryResolveBatchRequestV010,
  BusinessDictionaryResolutionV010,
  BusinessDictionarySnapshotV010
} from "../../contracts/reference-data/dictionary.js";
import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  resolveBusinessDictionarySnapshotV010
} from "../../foundation/reference-resolution/dictionary.js";
import { BUSINESS_DICTIONARY_PACKAGE_ID } from "./constants.js";

export const BUSINESS_DICTIONARY_NAMESPACE_V010 = "evo.business-dictionary" as const;
const SCHEMA = "evo.business-dictionary.definition/0.1.0" as const;
const TYPE = "business-dictionary.definition" as const;
const CURRENT = "current" as const;
const HISTORY = "history" as const;

export interface BusinessDictionaryRepositoryV010 {
  list(contextId: string): BusinessDictionarySnapshotV010[];
  get(contextId: string, dictionaryId: string): BusinessDictionarySnapshotV010 | undefined;
  getEffective(contextId: string, dictionaryId: string): BusinessDictionarySnapshotV010 | undefined;
  history(contextId: string, dictionaryId: string): BusinessDictionarySnapshotV010[];
  saveDraft(input: {
    contextId: string; dictionaryId: string; expectedVersion: number;
    options: BusinessDictionaryOptionV010[];
    actorSubjectId: string; recordedAt: string;
  }): BusinessDictionarySnapshotV010;
  publish(input: {
    contextId: string; dictionaryId: string; expectedVersion: number;
    actorSubjectId: string; actorType: "HUMAN" | "AI";
    recordedAt: string;
  }): BusinessDictionarySnapshotV010;
  resolveBatch(input: BusinessDictionaryResolveBatchRequestV010):
    BusinessDictionaryResolutionV010[];
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}

function validateOptions(options: BusinessDictionaryOptionV010[]): BusinessDictionaryOptionV010[] {
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error("BUSINESS_DICTIONARY_OPTIONS_REQUIRED");
  }
  const codes = new Set<string>();
  return options.map(option => {
    const code = required(option?.code, "BUSINESS_DICTIONARY_CODE_REQUIRED");
    if (code !== option.code) throw new Error("BUSINESS_DICTIONARY_CODE_NONCANONICAL");
    if (codes.has(normalize(code))) throw new Error("BUSINESS_DICTIONARY_CODE_DUPLICATE");
    codes.add(normalize(code));
    if (!option.label || typeof option.label.default !== "string" || !option.label.default.trim()) {
      throw new Error("BUSINESS_DICTIONARY_LABEL_REQUIRED");
    }
    if (option.status !== "ACTIVE" && option.status !== "INACTIVE") {
      throw new Error("BUSINESS_DICTIONARY_STATUS_INVALID");
    }
    const aliases = (option.aliases ?? []).map(a => required(a, "BUSINESS_DICTIONARY_ALIAS_INVALID"));
    return {
      code,
      label: {
        default: option.label.default.trim(),
        ...(option.label.translations ? { translations: { ...option.label.translations } } : {})
      },
      ...(aliases.length ? { aliases: [...new Set(aliases)] } : {}),
      status: option.status
    };
  });
}

function fromPayload(payload: EnterpriseResourceJsonV010 | undefined):
  BusinessDictionarySnapshotV010 {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("BUSINESS_DICTIONARY_PAYLOAD_INVALID");
  }
  const value = payload as unknown as BusinessDictionarySnapshotV010;
  if (value.contractVersion !== "0.1.0" || !value.contextId || !value.dictionaryId ||
      !Number.isSafeInteger(value.version) || value.version < 1 ||
      (value.state !== "DRAFT" && value.state !== "PUBLISHED")) {
    throw new Error("BUSINESS_DICTIONARY_SNAPSHOT_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    contextId: value.contextId,
    dictionaryId: value.dictionaryId,
    version: value.version,
    state: value.state,
    options: validateOptions(value.options)
  };
}

export function createBusinessDictionaryRepositoryV010(resources: EnterpriseResourceRepositoryV010):
  BusinessDictionaryRepositoryV010 {
  const address = (contextId: string, dictionaryId: string, collectionId: string, suffix = "") => ({
    contextId: required(contextId, "BUSINESS_DICTIONARY_CONTEXT_REQUIRED"),
    namespace: BUSINESS_DICTIONARY_NAMESPACE_V010,
    collectionId,
    resourceType: TYPE,
    resourceId: required(dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED") + suffix
  });

  const current = (contextId: string, dictionaryId: string) =>
    resources.get(address(contextId, dictionaryId, CURRENT));
  const historyAddress = (contextId: string, dictionaryId: string, version: number) =>
    address(contextId, dictionaryId, HISTORY, "::" + version);

  const store = (snapshot: BusinessDictionarySnapshotV010, actorSubjectId: string, recordedAt: string) => {
    const payload = JSON.parse(JSON.stringify(snapshot)) as EnterpriseResourceJsonV010;
    for (const a of [
      address(snapshot.contextId, snapshot.dictionaryId, CURRENT),
      historyAddress(snapshot.contextId, snapshot.dictionaryId, snapshot.version)
    ]) {
      resources.put({
        ...a, schemaRef: SCHEMA, ownerPackageId: BUSINESS_DICTIONARY_PACKAGE_ID,
        storageKind: "DOCUMENT", payload, actorSubjectId, recordedAt
      });
    }
    return snapshot;
  };
  function inTransaction<T>(work: () => T): T {
    if (!resources.transaction) {
      throw new Error("BUSINESS_DICTIONARY_ATOMIC_RESOURCE_REQUIRED");
    }
    return resources.transaction(work);
  }

  return {
    list(contextId) {
      return resources.list({
        contextId: required(contextId, "BUSINESS_DICTIONARY_CONTEXT_REQUIRED"),
        namespace: BUSINESS_DICTIONARY_NAMESPACE_V010,
        collectionId: CURRENT, resourceType: TYPE, lifecycleState: "ACTIVE"
      }).map(resource => fromPayload(resource.payload))
        .sort((a, b) => a.dictionaryId.localeCompare(b.dictionaryId));
    },
    get(contextId, dictionaryId) {
      const record = current(contextId, dictionaryId);
      return record && record.lifecycleState === "ACTIVE"
        ? fromPayload(record.payload) : undefined;
    },
    history(contextId, dictionaryId) {
      const prefix = required(dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED") + "::";
      return resources.list({
        contextId: required(contextId, "BUSINESS_DICTIONARY_CONTEXT_REQUIRED"),
        namespace: BUSINESS_DICTIONARY_NAMESPACE_V010,
        collectionId: HISTORY, resourceType: TYPE, lifecycleState: "ACTIVE"
      }).filter(resource => resource.resourceId.startsWith(prefix))
        .map(resource => fromPayload(resource.payload))
        .sort((a, b) => a.version - b.version);
    },
    getEffective(contextId, dictionaryId) {
      const latest = this.history(contextId, dictionaryId);
      return latest.filter(item => item.state === "PUBLISHED").at(-1);
    },
    saveDraft(input) {
      return inTransaction(() => {
        const contextId = required(input.contextId, "BUSINESS_DICTIONARY_CONTEXT_REQUIRED");
        const dictionaryId = required(input.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED");
        const options = validateOptions(input.options);
        const previous = this.get(contextId, dictionaryId);
        if (previous?.version !== input.expectedVersion && !(previous === undefined && input.expectedVersion === 0)) {
          // Same-content retries for the same draft do not manufacture another revision.
          if (previous?.state === "DRAFT"
              && previous.version === input.expectedVersion + 1
              && JSON.stringify(previous.options) === JSON.stringify(options)) return previous;
          throw new Error("BUSINESS_DICTIONARY_VERSION_CONFLICT");
        }
        if (previous?.state === "DRAFT" &&
            JSON.stringify(previous.options) === JSON.stringify(options)) return previous;
        const next: BusinessDictionarySnapshotV010 = {
          contractVersion: "0.1.0", contextId, dictionaryId,
          version: (previous?.version ?? 0) + 1, state: "DRAFT", options
        };
        return store(next, required(input.actorSubjectId, "BUSINESS_DICTIONARY_ACTOR_REQUIRED"), input.recordedAt);
      });
    },
    publish(input) {
      return inTransaction(() => {
        const draft = this.get(input.contextId, input.dictionaryId);
        if (!draft) throw new Error("BUSINESS_DICTIONARY_NOT_FOUND");
        if (draft.version !== input.expectedVersion) throw new Error("BUSINESS_DICTIONARY_VERSION_CONFLICT");
        if (draft.state === "PUBLISHED") return draft; // Response-loss retry is safe.
        if (input.actorType !== "HUMAN") throw new Error("BUSINESS_DICTIONARY_PUBLISH_HUMAN_REQUIRED");
        // Reject collisions rather than silently selecting a wrong reference.
        const keys = draft.options.flatMap(option => [option.code, ...(option.aliases ?? [])]);
        const decisions = resolveBusinessDictionarySnapshotV010(
          { ...draft, state: "PUBLISHED" },
          { contextId: draft.contextId, dictionaryId: draft.dictionaryId,
            expectedVersion: draft.version, sourceValues: keys }
        );
        if (decisions.some(result => result.status === "AMBIGUOUS")) {
          throw new Error("BUSINESS_DICTIONARY_AMBIGUOUS_ALIAS");
        }
        return store({ ...draft, state: "PUBLISHED" },
          required(input.actorSubjectId, "BUSINESS_DICTIONARY_ACTOR_REQUIRED"), input.recordedAt);
      });
    },
    resolveBatch(input) {
      const effective = this.getEffective(input.contextId, input.dictionaryId);
      if (!effective) throw new Error("BUSINESS_DICTIONARY_NOT_PUBLISHED");
      return resolveBusinessDictionarySnapshotV010(effective, input);
    }
  };
}
