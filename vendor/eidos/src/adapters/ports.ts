import type { ActionRequestV010, JsonValue } from "../runtime/contracts.js";
export interface ActionExecutionResult { ok:boolean; correlationId?:string; result?:JsonValue; error?:{code:string;message:string} }
export interface ActionHost { confirm?(request:ActionRequestV010):Promise<boolean>; execute(request:ActionRequestV010):Promise<ActionExecutionResult> }
export interface QueryRequest { contractVersion:string; queryCode:string; parameters:Record<string,JsonValue> }
export interface QueryHost { query(request:QueryRequest):Promise<JsonValue> }
