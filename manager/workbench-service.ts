import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import type { AppManagerService } from "./service.js";
import {
  listAuthorizedCapabilityOperationsV010
} from "./capability-operation-access.js";
import {
  composeWorkbenchHomeV010,
  type EffectiveWorkbenchHomeItemV010,
  type WorkbenchItemPreferenceV010
} from "./workbench-composition.js";
import type {
  PersonalWorkbenchStateStoreV010
} from "./workbench-state.js";
import {
  personalWorkbenchLayerV010
} from "./workbench-state.js";

export interface WorkbenchResolvedHomeV010 {
  contractVersion: "0.1.0";
  items: EffectiveWorkbenchHomeItemV010[];
  favorites: EffectiveWorkbenchHomeItemV010[];
  recent: EffectiveWorkbenchHomeItemV010[];
  rejectedPreferenceItemIds: string[];
}

export interface WorkbenchServiceV010 {
  resolve(
    context: PlatformRequestContextV010
  ): Promise<WorkbenchResolvedHomeV010>;
  open(input: {
    context: PlatformRequestContextV010;
    itemId: string;
    occurredAt: string;
  }): Promise<{ itemId: string; route: string }>;
  favorite(input: {
    context: PlatformRequestContextV010;
    itemId: string;
    favorite: boolean;
    occurredAt: string;
  }): Promise<WorkbenchResolvedHomeV010>;
  setPersonalPreferences(input: {
    context: PlatformRequestContextV010;
    preferences: WorkbenchItemPreferenceV010[];
    occurredAt: string;
  }): Promise<WorkbenchResolvedHomeV010>;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function createWorkbenchServiceV010(input: {
  manager: AppManagerService;
  personalState: PersonalWorkbenchStateStoreV010;
  enterpriseRoleLayer(input: {
    contextId: string;
    relationshipKind: EnterpriseContextRelationshipKindV010;
  }): {
    layerId: "ENTERPRISE_ROLE_DEFAULT";
    preferences: WorkbenchItemPreferenceV010[];
  } | undefined;
  resolveRelationshipKind(
    context: PlatformRequestContextV010
  ): EnterpriseContextRelationshipKindV010 | undefined;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): WorkbenchServiceV010 {
  const identity = (context: PlatformRequestContextV010) => {
    const personalContextId = required(
      context.context?.personalContext.contextId ?? "",
      "WORKBENCH_PERSONAL_CONTEXT_REQUIRED"
    );
    const subjectId = required(
      context.principal.subjectId,
      "WORKBENCH_SUBJECT_REQUIRED"
    );
    return { personalContextId, subjectId };
  };

  const resolve = async (
    context: PlatformRequestContextV010
  ): Promise<WorkbenchResolvedHomeV010> => {
    const authorized = await listAuthorizedCapabilityOperationsV010({
      manager: input.manager,
      authorizationProvider: input.resolveAuthorizationProvider(),
      requestContext: context,
      audience: "HUMAN"
    });
    const authorizedIds = new Set(
      authorized.operations.map(item => item.operationId)
    );
    const personalIdentity = identity(context);
    const personal = await input.personalState.get(
      personalIdentity.personalContextId,
      personalIdentity.subjectId
    );
    const active = context.context?.activeContext;
    const relationshipKind =
      active?.kind === "ENTERPRISE"
        ? input.resolveRelationshipKind(context)
        : undefined;
    const enterpriseRoleDefault =
      active?.kind === "ENTERPRISE" && relationshipKind
        ? input.enterpriseRoleLayer({
            contextId: active.contextId,
            relationshipKind
          })
        : undefined;

    const locale = context.locale?.trim() || "en";
    const bundles = input.manager.listEffectiveLocalizationBundles();
    const packageItems = input.manager.listEffectiveWorkbenchHomeItems()
      .map(item => {
        const localization = item.localization;
        if (!localization) return item;
        const bundle =
          bundles.find(candidate =>
            candidate.namespace === localization.namespace
            && candidate.locale === locale
          )
          ?? bundles.find(candidate =>
            candidate.namespace === localization.namespace
            && candidate.locale.toLowerCase()
              === locale.toLowerCase()
          )
          ?? bundles.find(candidate =>
            candidate.namespace === localization.namespace
            && candidate.locale === "en"
          );
        if (!bundle) return item;
        return {
          ...item,
          title:
            bundle.messages[localization.titleKey]
            ?? item.title,
          ...(localization.descriptionKey
            ? {
                description:
                  bundle.messages[localization.descriptionKey]
                  ?? item.description
              }
            : {})
        };
      });

    const composition = composeWorkbenchHomeV010({
      packageItems,
      authorizedCapabilityOperationIds: authorizedIds,
      enterpriseRoleDefault,
      personalPreference: personalWorkbenchLayerV010(personal)
    });
    const byId = new Map(
      composition.items.map(item => [item.id, item] as const)
    );
    const favorites = (personal?.favoriteItemIds ?? [])
      .map(itemId => byId.get(itemId))
      .filter((item): item is EffectiveWorkbenchHomeItemV010 => Boolean(item));
    const recent = (personal?.recentItemIds ?? [])
      .map(itemId => byId.get(itemId))
      .filter((item): item is EffectiveWorkbenchHomeItemV010 => Boolean(item));

    return {
      contractVersion: "0.1.0",
      items: composition.items,
      favorites,
      recent,
      rejectedPreferenceItemIds: composition.rejectedPreferenceItemIds
    };
  };

  return {
    resolve,

    async open(request) {
      const itemId = required(request.itemId, "WORKBENCH_ITEM_ID_REQUIRED");
      const home = await resolve(request.context);
      const item = home.items.find(candidate => candidate.id === itemId);
      if (!item) throw new Error("WORKBENCH_ITEM_NOT_AUTHORIZED");
      const personal = identity(request.context);
      await input.personalState.recordRecent({
        ...personal,
        itemId,
        updatedAt: request.occurredAt
      });
      return { itemId, route: item.route };
    },

    async favorite(request) {
      const itemId = required(request.itemId, "WORKBENCH_ITEM_ID_REQUIRED");
      const home = await resolve(request.context);
      if (!home.items.some(candidate => candidate.id === itemId)) {
        throw new Error("WORKBENCH_ITEM_NOT_AUTHORIZED");
      }
      const personal = identity(request.context);
      await input.personalState.setFavorite({
        ...personal,
        itemId,
        favorite: request.favorite,
        updatedAt: request.occurredAt
      });
      return resolve(request.context);
    },

    async setPersonalPreferences(request) {
      const home = await resolve(request.context);
      const allowed = new Set(home.items.map(item => item.id));
      if (request.preferences.some(item => !allowed.has(item.itemId))) {
        throw new Error("WORKBENCH_PREFERENCE_ITEM_NOT_AUTHORIZED");
      }
      const personal = identity(request.context);
      const current = await input.personalState.get(
        personal.personalContextId,
        personal.subjectId
      );
      await input.personalState.put({
        contractVersion: "0.1.0",
        ...personal,
        preferences: structuredClone(request.preferences),
        favoriteItemIds: current?.favoriteItemIds ?? [],
        recentItemIds: current?.recentItemIds ?? [],
        updatedAt: request.occurredAt
      });
      return resolve(request.context);
    }
  };
}
