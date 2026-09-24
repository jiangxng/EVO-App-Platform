import type { FormRenderModelV010 } from "./contracts.js";
import { assertValidUidl } from "./validate.js";
export function toRenderModel(document: unknown): FormRenderModelV010 {
  const doc=assertValidUidl(document); const submit=doc.actions.find(a=>a.type==="submit")!;
  return {modelVersion:"0.1.0",sourceContractVersion:doc.contractVersion,kind:"form",id:doc.id,title:doc.title,command:{...doc.command},fields:doc.fields.map(f=>({...f,options:f.options?.map(o=>({...o})),validation:f.validation?{...f.validation}:undefined,inputName:f.key})),submitAction:{id:submit.id,label:submit.label,requiresConfirmation:submit.requiresConfirmation??false},cancelActions:doc.actions.filter(a=>a.type==="cancel").map(a=>({id:a.id,label:a.label}))};
}
