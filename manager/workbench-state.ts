import type {
  EnterpriseResourceRepositoryV010
} from "../contracts/enterprise-resource.js";
import type {
  EnterpriseContextRelationshipKindV010
} from "../contracts/platform-services.js";
import type {
  WorkbenchCompositionLayerV010,
  WorkbenchItemPreferenceV010
} from "./workbench-composition.js";

export const WORKBENCH_NAMESPACE_V010 = "evo.workbench" as const;
export const WORKBENCH_ENTERPRISE_DEFAULT_COLLECTION_V010 =
  "enterprise-role-defaults" as const;
export const WORKBENCH_ENTERPRISE_DEFAULT_RESOURCE_TYPE_V010 =
  "workbench.enterprise-role-default" as const;
export const WORKBENCH_ENTERPRISE_DEFAULT_SCHEMA_V010 =
  "evo.workbench.enterprise-role-default/0.1.0" as const;

export interface EnterpriseRoleWorkbenchDefaultV010 {
  contractVersion: "0.1.0";
  contextId: string;
  relationshipKind: EnterpriseContextRelationshipKindV010;
  preferences: WorkbenchItemPreferenceV010[];
}

export interface PersonalWorkbenchStateV010 {
  contractVersion: "0.1.0";
  personalContextId: string;
  subjectId: string;
  preferences: WorkbenchItemPreferenceV010[];
  favoriteItemIds: string[];
  recentItemIds: string[];
  updatedAt: string;
}

export interface PersonalWorkbenchStateStoreV010 {
  get(
    personalContextId: string,
    subjectId: string
  ): Promise<PersonalWorkbenchStateV010 | undefined>;
  put(
    state: PersonalWorkbenchStateV010
  ): Promise<PersonalWorkbenchStateV010>;
  recordRecent(input: {
    personalContextId: string;
    subjectId: string;
    itemId: string;
    updatedAt: string;
    limit?: number;
  }): Promise<PersonalWorkbenchStateV010>;
  setFavorite(input: {
    personalContextId: string;
    subjectId: string;
    itemId: string;
    favorite: boolean;
    updatedAt: string;
  }): Promise<PersonalWorkbenchStateV010>;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function relationshipKind(
  value: string
): EnterpriseContextRelationshipKindV010 {
  const normalized = required(
    value,
    "WORKBENCH_RELATIONSHIP_KIND_REQUIRED"
  ).toUpperCase();
  if (!["OWNER", "ADMIN", "MEMBER", "AUDITOR"].includes(normalized)) {
    throw new Error("WORKBENCH_RELATIONSHIP_KIND_INVALID");
  }
  return normalized as EnterpriseContextRelationshipKindV010;
}

function normalizedPreferences(
  values: readonly WorkbenchItemPreferenceV010[]
): WorkbenchItemPreferenceV010[] {
  const byId = new Map<string, WorkbenchItemPreferenceV010>();
  for (const input of values) {
    const itemId = required(
      input.itemId,
      "WORKBENCH_PREFERENCE_ITEM_ID_REQUIRED"
    );
    if (
      input.order !== undefined
      && (!Number.isInteger(input.order) || input.order < -10_000 || input.order > 10_000)
    ) {
      throw new Error("WORKBENCH_PREFERENCE_ORDER_INVALID");
    }
    byId.set(itemId, {
      itemId,
      ...(input.hidden === undefined ? {} : { hidden: input.hidden }),
      ...(input.order === undefined ? {} : { order: input.order })
    });
  }
  return [...byId.values()].sort((a, b) => a.itemId.localeCompare(b.itemId));
}

function resourceId(kind: EnterpriseContextRelationshipKindV010): string {
  return "relationship:" + kind.toLowerCase();
}

export function createEnterpriseRoleWorkbenchDefaultRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
) {
  return {
    get(
      contextId: string,
      kind: EnterpriseContextRelationshipKindV010
    ): EnterpriseRoleWorkbenchDefaultV010 | undefined {
      const resource = resources.get({
        contextId: required(contextId, "WORKBENCH_CONTEXT_ID_REQUIRED"),
        namespace: WORKBENCH_NAMESPACE_V010,
        collectionId: WORKBENCH_ENTERPRISE_DEFAULT_COLLECTION_V010,
        resourceType: WORKBENCH_ENTERPRISE_DEFAULT_RESOURCE_TYPE_V010,
        resourceId: resourceId(kind)
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      const payload = resource.payload as unknown as EnterpriseRoleWorkbenchDefaultV010;
      if (payload?.contractVersion !== "0.1.0") {
        throw new Error("WORKBENCH_ENTERPRISE_DEFAULT_INVALID");
      }
      return {
        contractVersion: "0.1.0",
        contextId: payload.contextId,
        relationshipKind: relationshipKind(payload.relationshipKind),
        preferences: normalizedPreferences(payload.preferences ?? [])
      };
    },

    put(input: {
      contextId: string;
      relationshipKind: EnterpriseContextRelationshipKindV010;
      preferences: readonly WorkbenchItemPreferenceV010[];
      actorSubjectId: string;
      recordedAt: string;
    }): EnterpriseRoleWorkbenchDefaultV010 {
      const value: EnterpriseRoleWorkbenchDefaultV010 = {
        contractVersion: "0.1.0",
        contextId: required(input.contextId, "WORKBENCH_CONTEXT_ID_REQUIRED"),
        relationshipKind: relationshipKind(input.relationshipKind),
        preferences: normalizedPreferences(input.preferences)
      };
      resources.put({
        contextId: value.contextId,
        namespace: WORKBENCH_NAMESPACE_V010,
        collectionId: WORKBENCH_ENTERPRISE_DEFAULT_COLLECTION_V010,
        resourceType: WORKBENCH_ENTERPRISE_DEFAULT_RESOURCE_TYPE_V010,
        resourceId: resourceId(value.relationshipKind),
        schemaRef: WORKBENCH_ENTERPRISE_DEFAULT_SCHEMA_V010,
        ownerPackageId: "evo-app-platform",
        storageKind: "DOCUMENT",
        payload: JSON.parse(JSON.stringify(value)),
        metadata: {
          relationshipKind: value.relationshipKind
        },
        actorSubjectId: required(
          input.actorSubjectId,
          "WORKBENCH_ACTOR_SUBJECT_ID_REQUIRED"
        ),
        recordedAt: required(input.recordedAt, "WORKBENCH_RECORDED_AT_REQUIRED")
      });
      return structuredClone(value);
    },

    layer(
      contextId: string,
      kind: EnterpriseContextRelationshipKindV010
    ): WorkbenchCompositionLayerV010 | undefined {
      const value = this.get(contextId, kind);
      return value
        ? {
            layerId: "ENTERPRISE_ROLE_DEFAULT",
            preferences: structuredClone(value.preferences)
          }
        : undefined;
    }
  };
}

export function personalWorkbenchLayerV010(
  state: PersonalWorkbenchStateV010 | undefined
): WorkbenchCompositionLayerV010 | undefined {
  return state
    ? {
        layerId: "PERSONAL_PREFERENCE",
        preferences: structuredClone(state.preferences)
      }
    : undefined;
}


export function createMemoryPersonalWorkbenchStateStoreV010(
  seed: PersonalWorkbenchStateV010[] = []
): PersonalWorkbenchStateStoreV010 {
  const states = new Map(
    seed.map(item => [
      item.personalContextId + "|" + item.subjectId,
      structuredClone(item)
    ])
  );
  const key = (personalContextId: string, subjectId: string) =>
    required(personalContextId, "WORKBENCH_PERSONAL_CONTEXT_ID_REQUIRED")
    + "|"
    + required(subjectId, "WORKBENCH_SUBJECT_ID_REQUIRED");

  return {
    async get(personalContextId, subjectId) {
      const value = states.get(key(personalContextId, subjectId));
      return value ? structuredClone(value) : undefined;
    },
    async put(state) {
      const value = {
        ...structuredClone(state),
        personalContextId: required(
          state.personalContextId,
          "WORKBENCH_PERSONAL_CONTEXT_ID_REQUIRED"
        ),
        subjectId: required(state.subjectId, "WORKBENCH_SUBJECT_ID_REQUIRED"),
        preferences: normalizedPreferences(state.preferences ?? []),
        favoriteItemIds: [...new Set(state.favoriteItemIds ?? [])],
        recentItemIds: [...new Set(state.recentItemIds ?? [])],
        updatedAt: required(state.updatedAt, "WORKBENCH_UPDATED_AT_REQUIRED")
      };
      states.set(key(value.personalContextId, value.subjectId), value);
      return structuredClone(value);
    },
    async recordRecent(input) {
      const limit = input.limit ?? 8;
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        throw new Error("WORKBENCH_RECENT_LIMIT_INVALID");
      }
      const current =
        await this.get(input.personalContextId, input.subjectId)
        ?? {
          contractVersion: "0.1.0" as const,
          personalContextId: input.personalContextId,
          subjectId: input.subjectId,
          preferences: [],
          favoriteItemIds: [],
          recentItemIds: [],
          updatedAt: input.updatedAt
        };
      return this.put({
        ...current,
        recentItemIds: [
          input.itemId,
          ...current.recentItemIds.filter(id => id !== input.itemId)
        ].slice(0, limit),
        updatedAt: input.updatedAt
      });
    },
    async setFavorite(input) {
      const current =
        await this.get(input.personalContextId, input.subjectId)
        ?? {
          contractVersion: "0.1.0" as const,
          personalContextId: input.personalContextId,
          subjectId: input.subjectId,
          preferences: [],
          favoriteItemIds: [],
          recentItemIds: [],
          updatedAt: input.updatedAt
        };
      return this.put({
        ...current,
        favoriteItemIds: input.favorite
          ? [...new Set([...current.favoriteItemIds, input.itemId])]
          : current.favoriteItemIds.filter(id => id !== input.itemId),
        updatedAt: input.updatedAt
      });
    }
  };
}
