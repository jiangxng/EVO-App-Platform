import type { Diagnostic, UidlAction, UidlField, UidlFormV011, UidlOptionValue, ValidationResult } from "./contracts.js";
import { isPlainObject, toJsonSnapshot } from "./json.js";

const controls = new Set(["text","number","money","select","date","reference"]);
const docKeys = new Set(["contractVersion","kind","id","title","purpose","command","fields","actions","metadata"]);
const fieldKeys = new Set(["key","label","semanticType","control","required","readOnly","unit","options","validation"]);
const actionKeys = new Set(["id","label","type","command","requiresConfirmation"]);
function d(code:string,path:string,message:string,fix?:string):Diagnostic{return {code,path,message,...(fix?{fix}:{})};}
function nonEmpty(v:unknown):v is string{return typeof v==="string"&&v.length>0;}
function extraKeys(obj:Record<string,unknown>, allowed:Set<string>, path:string, out:Diagnostic[]){for(const k of Object.keys(obj)) if(!allowed.has(k)) out.push(d("EIDOS_SCHEMA_ADDITIONAL_PROPERTY",`${path}.${k}`,`Unknown property '${k}'`));}

function parseField(value: unknown, path: string, out: Diagnostic[]): UidlField | undefined {
  if (!isPlainObject(value)) { out.push(d("EIDOS_SCHEMA_TYPE",path,"Field must be an object")); return; }
  extraKeys(value, fieldKeys, path, out);
  const {key,label,semanticType,control,required,readOnly,unit,options,validation}=value;
  if(!nonEmpty(key)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.key`,`Field key must be a non-empty string`));
  if(!nonEmpty(label)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.label`,`Field label must be a non-empty string`));
  if(!nonEmpty(semanticType)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.semanticType`,`semanticType must be a non-empty string`));
  if(typeof control!=="string"||!controls.has(control)) out.push(d("EIDOS_CONTROL_UNSUPPORTED",`${path}.control`,`Unsupported control '${String(control)}'`));
  if(typeof required!=="boolean") out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.required`,`required must be boolean`));
  if(readOnly!==undefined&&typeof readOnly!=="boolean") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.readOnly`,`readOnly must be boolean`));
  if(unit!==undefined&&typeof unit!=="string") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.unit`,`unit must be string`));
  let parsedOptions: {value:UidlOptionValue;label:string}[]|undefined;
  if(options!==undefined){
    if(!Array.isArray(options)||options.length===0) out.push(d("EIDOS_SCHEMA_TYPE",`${path}.options`,`options must be a non-empty array`));
    else parsedOptions=options.flatMap((o,i)=>{
      if(!isPlainObject(o)){out.push(d("EIDOS_SCHEMA_TYPE",`${path}.options[${i}]`,`Option must be object`));return []}
      extraKeys(o,new Set(["value","label"]),`${path}.options[${i}]`,out);
      if(!["string","number","boolean"].includes(typeof o.value)) out.push(d("EIDOS_OPTION_VALUE_TYPE",`${path}.options[${i}].value`,`Option value must be string, number or boolean`));
      if(!nonEmpty(o.label)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.options[${i}].label`,`Option label must be non-empty`));
      return (["string","number","boolean"].includes(typeof o.value)&&nonEmpty(o.label))?[{value:o.value as UidlOptionValue,label:o.label}]:[];
    });
  }
  if(control==="select"&&(!parsedOptions||parsedOptions.length===0)) out.push(d("EIDOS_SELECT_OPTIONS_REQUIRED",`${path}.options`,`Select control requires options`));
  let parsedValidation: UidlField["validation"];
  if(validation!==undefined){
    if(!isPlainObject(validation)) out.push(d("EIDOS_SCHEMA_TYPE",`${path}.validation`,`validation must be object`));
    else {
      extraKeys(validation,new Set(["min","max","pattern"]),`${path}.validation`,out);
      if(validation.min!==undefined&&typeof validation.min!=="number") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.validation.min`,`min must be number`));
      if(validation.max!==undefined&&typeof validation.max!=="number") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.validation.max`,`max must be number`));
      if(validation.pattern!==undefined&&typeof validation.pattern!=="string") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.validation.pattern`,`pattern must be string`));
      if(typeof validation.pattern==="string") { try{new RegExp(validation.pattern);}catch{out.push(d("EIDOS_PATTERN_INVALID",`${path}.validation.pattern`,`pattern is not a valid RegExp source`));} }
      if(typeof validation.min==="number"&&typeof validation.max==="number"&&validation.min>validation.max) out.push(d("EIDOS_RANGE_INVALID",`${path}.validation`,`min must not exceed max`));
      parsedValidation={...(typeof validation.min==="number"?{min:validation.min}:{}),...(typeof validation.max==="number"?{max:validation.max}:{}),...(typeof validation.pattern==="string"?{pattern:validation.pattern}:{})};
    }
  }
  if(!nonEmpty(key)||!nonEmpty(label)||!nonEmpty(semanticType)||typeof control!=="string"||!controls.has(control)||typeof required!=="boolean") return;
  return {key,label,semanticType,control:control as UidlField["control"],required,...(typeof readOnly==="boolean"?{readOnly}:{}),...(typeof unit==="string"?{unit}:{}),...(parsedOptions?{options:parsedOptions}:{}),...(parsedValidation?{validation:parsedValidation}:{})};
}

function parseAction(value:unknown,path:string,out:Diagnostic[]):UidlAction|undefined{
  if(!isPlainObject(value)){out.push(d("EIDOS_SCHEMA_TYPE",path,"Action must be object"));return;}
  extraKeys(value,actionKeys,path,out);
  if(!nonEmpty(value.id)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.id`,`Action id must be non-empty`));
  if(!nonEmpty(value.label)) out.push(d("EIDOS_SCHEMA_REQUIRED",`${path}.label`,`Action label must be non-empty`));
  if(value.type!=="submit"&&value.type!=="cancel") out.push(d("EIDOS_ACTION_TYPE",`${path}.type`,`Action type must be submit or cancel`));
  if(value.command!==undefined&&!nonEmpty(value.command)) out.push(d("EIDOS_SCHEMA_TYPE",`${path}.command`,`command must be non-empty when present`));
  if(value.requiresConfirmation!==undefined&&typeof value.requiresConfirmation!=="boolean") out.push(d("EIDOS_SCHEMA_TYPE",`${path}.requiresConfirmation`,`requiresConfirmation must be boolean`));
  if(!nonEmpty(value.id)||!nonEmpty(value.label)||(value.type!=="submit"&&value.type!=="cancel")) return;
  return {id:value.id,label:value.label,type:value.type,...(nonEmpty(value.command)?{command:value.command}:{}),...(typeof value.requiresConfirmation==="boolean"?{requiresConfirmation:value.requiresConfirmation}:{})};
}

export class UidlValidationError extends Error { constructor(public diagnostics: Diagnostic[]){super(diagnostics.map(x=>`${x.path}: ${x.message}`).join("; "));this.name="UidlValidationError";} }

export function validateUidl(document: unknown): ValidationResult<UidlFormV011> {
  const out: Diagnostic[]=[];
  if(!isPlainObject(document)) return {ok:false,diagnostics:[d("EIDOS_SCHEMA_TYPE","$","UIDL document must be a plain object")]};
  extraKeys(document,docKeys,"$",out);
  if(document.contractVersion!=="0.1.1") out.push(d("EIDOS_VERSION_UNSUPPORTED","$.contractVersion",`Unsupported UIDL version: ${String(document.contractVersion)}`,"Use a declared supported version; 0.1.0 remains blocked pending identity resolution."));
  if(document.kind!=="form") out.push(d("EIDOS_KIND_UNSUPPORTED","$.kind","Only form UIDL is supported by this profile"));
  if(document.purpose!=="execute-command") out.push(d("EIDOS_PURPOSE_UNSUPPORTED","$.purpose","Only execute-command is supported by this profile"));
  if(!nonEmpty(document.id)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.id","id must be non-empty"));
  if(!nonEmpty(document.title)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.title","title must be non-empty"));
  let command:{code:string;inputVersion:string}|undefined;
  if(!isPlainObject(document.command)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.command","command is required"));
  else { extraKeys(document.command,new Set(["code","inputVersion"]),"$.command",out); if(!nonEmpty(document.command.code)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.command.code","command.code must be non-empty")); if(!nonEmpty(document.command.inputVersion)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.command.inputVersion","command.inputVersion must be non-empty")); if(nonEmpty(document.command.code)&&nonEmpty(document.command.inputVersion)) command={code:document.command.code,inputVersion:document.command.inputVersion}; }
  const fields:UidlField[]=[]; const fieldKeysSeen=new Set<string>();
  if(!Array.isArray(document.fields)) out.push(d("EIDOS_SCHEMA_REQUIRED","$.fields","fields must be an array"));
  else document.fields.forEach((f,i)=>{const p=parseField(f,`$.fields[${i}]`,out);if(p){if(fieldKeysSeen.has(p.key))out.push(d("EIDOS_FIELD_DUPLICATE",`$.fields[${i}].key`,`Duplicate field key: ${p.key}`));fieldKeysSeen.add(p.key);fields.push(p);}});
  const actions:UidlAction[]=[]; const actionIds=new Set<string>();
  if(!Array.isArray(document.actions)||document.actions.length===0) out.push(d("EIDOS_SCHEMA_REQUIRED","$.actions","actions must be a non-empty array"));
  else document.actions.forEach((a,i)=>{const p=parseAction(a,`$.actions[${i}]`,out);if(p){if(actionIds.has(p.id))out.push(d("EIDOS_ACTION_DUPLICATE",`$.actions[${i}].id`,`Duplicate action id: ${p.id}`));actionIds.add(p.id);actions.push(p);}});
  const submits=actions.filter(a=>a.type==="submit");
  if(submits.length!==1) out.push(d("EIDOS_SUBMIT_CARDINALITY","$.actions",`Exactly one submit action is required; found ${submits.length}`));
  if(command&&submits[0]?.command&&submits[0].command!==command.code) out.push(d("EIDOS_COMMAND_MISMATCH","$.actions","Submit action command must match document command.code"));
  if(document.metadata!==undefined){ try{const snap=toJsonSnapshot(document.metadata); if(!isPlainObject(snap)) out.push(d("EIDOS_METADATA_TYPE","$.metadata","metadata must be a JSON object"));} catch(e){out.push(d("EIDOS_METADATA_JSON","$.metadata",e instanceof Error?e.message:"metadata is not JSON"));} }
  if(out.length||document.contractVersion!=="0.1.1"||document.kind!=="form"||document.purpose!=="execute-command"||!nonEmpty(document.id)||!nonEmpty(document.title)||!command) return {ok:false,diagnostics:out};
  return {ok:true,diagnostics:[],value:{contractVersion:"0.1.1",kind:"form",id:document.id,title:document.title,purpose:"execute-command",command,fields,actions,...(document.metadata!==undefined?{metadata:toJsonSnapshot(document.metadata) as Record<string,import("./contracts.js").JsonValue>}:{})}};
}

export function assertValidUidl(document:unknown):UidlFormV011{const r=validateUidl(document);if(!r.ok||!r.value)throw new UidlValidationError(r.diagnostics);return r.value;}
