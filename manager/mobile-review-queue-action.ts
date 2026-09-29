import type { ActionRequestV010, JsonValue } from "../vendor/eidos/src/runtime/contracts.js";
import type {
  ReviewQueueActionV010,
  ReviewQueueItemV010,
  ReviewQueueV010
} from "../vendor/eidos/src/review-queue/contracts.js";

export interface MobileReviewActionSelectionV010 {
  item: ReviewQueueItemV010;
  action: ReviewQueueActionV010;
}

export function resolveMobileReviewActionV010(
  definition: ReviewQueueV010,
  itemId: string,
  actionId: string
): MobileReviewActionSelectionV010 {
  const item = definition.items.find(candidate => candidate.id === itemId);
  if (!item) {
    throw new Error("EVO_MOBILE_REVIEW_ITEM_NOT_FOUND");
  }
  const actions = [
    ...(item.secondaryActions ?? []),
    ...(item.primaryAction ? [item.primaryAction] : [])
  ];
  const action = actions.find(candidate => candidate.id === actionId);
  if (!action) {
    throw new Error("EVO_MOBILE_REVIEW_ACTION_NOT_FOUND");
  }
  if (action.enabled === false) {
    throw new Error(
      action.disabledReason?.trim()
        ? "EVO_MOBILE_REVIEW_ACTION_DISABLED: " + action.disabledReason
        : "EVO_MOBILE_REVIEW_ACTION_DISABLED"
    );
  }
  return { item, action };
}

export function createMobileReviewActionRequestV010(input: {
  definition: ReviewQueueV010;
  itemId: string;
  actionId: string;
  fieldValues?: Record<string, JsonValue>;
}): ActionRequestV010 {
  const { item, action } = resolveMobileReviewActionV010(
    input.definition,
    input.itemId,
    input.actionId
  );
  if (action.type !== "command" || !action.command?.trim()) {
    throw new Error("EVO_MOBILE_REVIEW_ACTION_NOT_COMMAND");
  }

  const allowedFields = new Set(
    (item.fields ?? [])
      .filter(field => field.readOnly !== true)
      .map(field => field.key)
  );
  const fields = Object.fromEntries(
    Object.entries(input.fieldValues ?? {})
      .filter(([key]) => allowedFields.has(key))
  ) as Record<string, JsonValue>;

  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: action.command,
      inputVersion: action.inputVersion ?? "0.1.0"
    },
    values: {
      itemId: item.id,
      confirmed: action.requiresConfirmation === true,
      ...fields
    },
    sourceInteractionId: input.definition.id,
    actionId: action.id,
    requiresConfirmation: action.requiresConfirmation === true
  };
}
