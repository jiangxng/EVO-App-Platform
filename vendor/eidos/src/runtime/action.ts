import type { ActionRequestV010 } from "./contracts.js";
import { assertValidUidl, UidlValidationError } from "./validate.js";
import { validateValues } from "./values.js";
export interface ActionContext { runtimeInstanceId?: string; actionId?: string }
export function createActionRequest(document:unknown,values:unknown,context:ActionContext={}):ActionRequestV010{
  const doc=assertValidUidl(document); const checked=validateValues(doc,values); if(!checked.ok||!checked.value)throw new UidlValidationError(checked.diagnostics);
  const submit=doc.actions.find(a=>a.type==="submit" &&
    (!context.actionId || a.id===context.actionId));
  if (!submit) throw new UidlValidationError([{
    code:"EIDOS_SUBMIT_ACTION_UNKNOWN",path:"$.actions",
    message:"Selected submit action is not declared on this form"
  }]);
  return {contractVersion:"0.1.0",type:"command",command:{...doc.command,code:submit.command??doc.command.code},values:checked.value,sourceInteractionId:doc.id,actionId:submit.id,...(context.runtimeInstanceId?{runtimeInstanceId:context.runtimeInstanceId}:{}),requiresConfirmation:submit.requiresConfirmation??false};
}
