import type { ActionRequestV010 } from "../vendor/eidos/src/runtime/contracts.js";
import type {
  TaskInboxActionV010,
  TaskInboxItemV010,
  TaskInboxV010
} from "../vendor/eidos/src/task-inbox/contracts.js";

export interface MobileTaskActionSelectionV010 {
  item: TaskInboxItemV010;
  action: TaskInboxActionV010;
}

export function resolveMobileTaskActionV010(
  definition: TaskInboxV010,
  itemId: string,
  actionId: string
): MobileTaskActionSelectionV010 {
  const item = definition.items.find(candidate => candidate.id === itemId);
  if (!item) throw new Error("EVO_MOBILE_TASK_ITEM_NOT_FOUND");
  const actions = [
    ...(item.secondaryActions ?? []),
    ...(item.primaryAction ? [item.primaryAction] : [])
  ];
  const action = actions.find(candidate => candidate.id === actionId);
  if (!action) throw new Error("EVO_MOBILE_TASK_ACTION_NOT_FOUND");
  if (action.enabled === false) {
    throw new Error(
      action.disabledReason?.trim()
        ? "EVO_MOBILE_TASK_ACTION_DISABLED: " + action.disabledReason
        : "EVO_MOBILE_TASK_ACTION_DISABLED"
    );
  }
  return { item, action };
}

export function createMobileTaskActionRequestV010(input: {
  definition: TaskInboxV010;
  itemId: string;
  actionId: string;
}): ActionRequestV010 {
  const { item, action } = resolveMobileTaskActionV010(
    input.definition,
    input.itemId,
    input.actionId
  );
  if (action.type !== "command" || !action.command?.trim()) {
    throw new Error("EVO_MOBILE_TASK_ACTION_NOT_COMMAND");
  }

  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: action.command,
      inputVersion: action.inputVersion ?? "0.1.0"
    },
    values: {
      itemId: item.id,
      confirmed: action.requiresConfirmation === true
    },
    sourceInteractionId: input.definition.id,
    actionId: action.id,
    requiresConfirmation: action.requiresConfirmation === true
  };
}
