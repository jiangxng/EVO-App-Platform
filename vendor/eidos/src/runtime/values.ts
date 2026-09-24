import type { Diagnostic, JsonValue, UidlFormV011, ValidationResult } from "./contracts.js";
import { isPlainObject, toJsonSnapshot } from "./json.js";
import { assertValidUidl } from "./validate.js";
function diag(code:string,path:string,message:string):Diagnostic{return {code,path,message};}
function empty(v:unknown){return v===undefined||v===null||v==="";}
function optionEq(a:unknown,b:unknown){return typeof a===typeof b&&a===b;}
export function validateValues(document:unknown, values:unknown):ValidationResult<Record<string,JsonValue>>{
  const doc:UidlFormV011=assertValidUidl(document); const ds:Diagnostic[]=[];
  if(!isPlainObject(values)) return {ok:false,diagnostics:[diag("EIDOS_VALUES_TYPE","$values","values must be a plain object")]};
  const allowed=new Set(doc.fields.map(f=>f.key)); for(const k of Object.keys(values)) if(!allowed.has(k)) ds.push(diag("EIDOS_VALUE_UNKNOWN",`$values.${k}`,`Unknown field '${k}'`));
  const out:Record<string,JsonValue>={};
  for(const f of doc.fields){const v=values[f.key]; if(f.required&&empty(v)){ds.push(diag("EIDOS_VALUE_REQUIRED",`$values.${f.key}`,`Required field missing: ${f.key}`));continue;} if(empty(v))continue;
    if(f.readOnly){ds.push(diag("EIDOS_VALUE_READONLY",`$values.${f.key}`,`Read-only field '${f.key}' may not be supplied by user values`));continue;}
    if((f.control==="number"||f.control==="money")&&typeof v!=="number") ds.push(diag("EIDOS_VALUE_TYPE",`$values.${f.key}`,`${f.control} requires a number`));
    if((f.control==="text"||f.control==="reference"||f.control==="date")&&typeof v!=="string") ds.push(diag("EIDOS_VALUE_TYPE",`$values.${f.key}`,`${f.control} requires a string`));
    if(typeof v==="number"&&f.validation?.min!==undefined&&v<f.validation.min) ds.push(diag("EIDOS_VALUE_MIN",`$values.${f.key}`,`Value is below min ${f.validation.min}`));
    if(typeof v==="number"&&f.validation?.max!==undefined&&v>f.validation.max) ds.push(diag("EIDOS_VALUE_MAX",`$values.${f.key}`,`Value exceeds max ${f.validation.max}`));
    if(typeof v==="string"&&f.validation?.pattern&&!new RegExp(f.validation.pattern).test(v)) ds.push(diag("EIDOS_VALUE_PATTERN",`$values.${f.key}`,`Value does not match declared pattern`));
    if(f.control==="select"&&!f.options?.some(o=>optionEq(o.value,v))) ds.push(diag("EIDOS_VALUE_OPTION",`$values.${f.key}`,`Value is not one of the declared options`));
    try{out[f.key]=toJsonSnapshot(v);}catch(e){ds.push(diag("EIDOS_VALUE_JSON",`$values.${f.key}`,e instanceof Error?e.message:"Value is not JSON"));}
  }
  return ds.length?{ok:false,diagnostics:ds}:{ok:true,diagnostics:[],value:out};
}
