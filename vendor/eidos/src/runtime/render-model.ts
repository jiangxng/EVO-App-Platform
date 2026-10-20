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
    ...(doc.reviewGroups
      ? { reviewGroups: doc.reviewGroups.map(group => ({
          ...group,
          detailFieldKeys: [...group.detailFieldKeys],
          ...(group.reviewStatus ? { reviewStatus: {...group.reviewStatus} } : {})
        })) }
      : {}),
    ...(doc.reviewTable
      ? { reviewTable: {
          ...(doc.reviewTable.presentation ? {presentation:doc.reviewTable.presentation} : {}),
          ...(doc.reviewTable.heading ? {heading:{...doc.reviewTable.heading}} : {}),
          columnLabels: {...doc.reviewTable.columnLabels},
          ...(doc.reviewTable.filter ? { filter: {
            ...doc.reviewTable.filter,
            options: doc.reviewTable.filter.options.map(option => ({
              ...option, statusKeys: [...option.statusKeys]
            }))
          }} : {})
        }}
      : {}),
    ...(doc.reviewTask ? {reviewTask:structuredClone(doc.reviewTask)} : {}),...(doc.reviewPlan ? {reviewPlan:structuredClone(doc.reviewPlan)} : {}),submitAction: {
      id: submit.id,
      label: submit.label,
      requiresConfirmation: submit.requiresConfirmation ?? false
    },
    submitActions: doc.actions.filter(action => action.type === "submit").map(action => ({
      id: action.id, label: action.label, command: action.command ?? doc.command.code,
      requiresConfirmation: action.requiresConfirmation ?? false
    })),
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
