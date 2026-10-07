import type { FormRenderModelV010 } from "./contracts.js";
import { assertValidUidl } from "./validate.js";
export function toRenderModel(document: unknown): FormRenderModelV010 {
  const doc = assertValidUidl(document);
  const submit = doc.actions.find(action => action.type === "submit")!;
  return {
    modelVersion: "0.1.0",
    sourceContractVersion: doc.contractVersion,
    kind: "form",
    id: doc.id,
    title: doc.title,
    ...(doc.description ? { description: doc.description } : {}),
    ...(doc.contextNavigation
      ? { contextNavigation: structuredClone(doc.contextNavigation) }
      : {}),
    command: { ...doc.command },
    fields: doc.fields.map(field => ({
      ...field,
      options: field.options?.map(option => ({ ...option })),
      validation: field.validation ? { ...field.validation } : undefined,
      inputName: field.key
    })),
    submitAction: {
      id: submit.id,
      label: submit.label,
      requiresConfirmation: submit.requiresConfirmation ?? false
    },
    cancelActions: doc.actions
      .filter(action => action.type === "cancel")
      .map(action => ({ id: action.id, label: action.label })),
    agentActions: doc.actions
      .filter(action => action.type === "agent")
      .map(action => ({
        id: action.id,
        label: action.label,
        prompt: action.prompt!,
        ...(action.agentCapability
          ? { agentCapability: action.agentCapability }
          : {}),
        ...(action.context
          ? { context: structuredClone(action.context) }
          : {}),
        ...(action.refreshSourceOnComplete === true
          ? { refreshSourceOnComplete: true }
          : {})
      }))
  };
}
