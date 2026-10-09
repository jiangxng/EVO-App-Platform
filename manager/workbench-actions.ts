import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import type {
  WorkbenchItemPreferenceV010
} from "./workbench-composition.js";
import type {
  WorkbenchServiceV010
} from "./workbench-service.js";

export const WORKBENCH_ITEM_OPEN_COMMAND_V010 =
  "workbench.item.open" as const;
export const WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010 =
  "workbench.item.favorite.set" as const;
export const WORKBENCH_PERSONAL_PREFERENCES_SET_COMMAND_V010 =
  "workbench.personal-preferences.set" as const;

function requiredContext(
  context: PlatformRequestContextV010 | undefined
): PlatformRequestContextV010 {
  if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
  return context;
}

function stringValue(
  request: AppActionRequestV010,
  key: string
): string {
  const value = request.values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("WORKBENCH_ACTION_VALUE_REQUIRED: " + key);
  }
  return value.trim();
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message.split(":")[0]
    : "WORKBENCH_ACTION_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: {
      code,
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

export function createWorkbenchActionHandlersV010(input: {
  service: WorkbenchServiceV010;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const open: AppActionHandler = {
    packageId: "evo-app-platform",
    featureId: "evo-workspace-home.system",
    commandCode: WORKBENCH_ITEM_OPEN_COMMAND_V010,
    async execute(request, context) {
      try {
        const result = await input.service.open({
          context: requiredContext(context),
          itemId: stringValue(request, "itemId"),
          occurredAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context?.correlationId,
          result: {
            contractVersion: "0.1.0",
            itemId: result.itemId,
            navigateTo: result.route
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const favorite: AppActionHandler = {
    packageId: "evo-app-platform",
    featureId: "evo-workspace-home.system",
    commandCode: WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010,
    async execute(request, context) {
      try {
        const value = request.values.favorite;
        if (typeof value !== "boolean") {
          throw new Error("WORKBENCH_FAVORITE_VALUE_REQUIRED");
        }
        const result = await input.service.favorite({
          context: requiredContext(context),
          itemId: stringValue(request, "itemId"),
          favorite: value,
          occurredAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context?.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            favorite: value,
            navigateTo: "/workspace",
            favorites: result.favorites.map(item => item.id)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const preferences: AppActionHandler = {
    packageId: "evo-app-platform",
    featureId: "evo-workspace-home.system",
    commandCode: WORKBENCH_PERSONAL_PREFERENCES_SET_COMMAND_V010,
    async execute(request, context) {
      try {
        const raw = request.values.preferences;
        if (!Array.isArray(raw)) {
          throw new Error("WORKBENCH_PREFERENCES_REQUIRED");
        }
        const normalized: WorkbenchItemPreferenceV010[] = raw.map(item => {
          if (
            item === null
            || typeof item !== "object"
            || Array.isArray(item)
          ) {
            throw new Error("WORKBENCH_PREFERENCE_INVALID");
          }
          const value = item as Record<string, JsonValue>;
          if (typeof value.itemId !== "string" || !value.itemId.trim()) {
            throw new Error("WORKBENCH_PREFERENCE_ITEM_ID_REQUIRED");
          }
          if (
            value.hidden !== undefined
            && typeof value.hidden !== "boolean"
          ) {
            throw new Error("WORKBENCH_PREFERENCE_HIDDEN_INVALID");
          }
          if (
            value.order !== undefined
            && (
              typeof value.order !== "number"
              || !Number.isInteger(value.order)
            )
          ) {
            throw new Error("WORKBENCH_PREFERENCE_ORDER_INVALID");
          }
          return {
            itemId: value.itemId.trim(),
            ...(value.hidden === undefined
              ? {}
              : { hidden: value.hidden }),
            ...(value.order === undefined
              ? {}
              : { order: value.order })
          };
        });
        const result = await input.service.setPersonalPreferences({
          context: requiredContext(context),
          preferences: normalized,
          occurredAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context?.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            navigateTo: "/workspace",
            visibleItemIds: result.items.map(item => item.id)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [open, favorite, preferences];
}
