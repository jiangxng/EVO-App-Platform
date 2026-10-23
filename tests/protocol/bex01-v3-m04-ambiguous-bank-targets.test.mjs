import test from "node:test";
import assert from "node:assert/strict";
import { suggestDataImportMappingV010 } from "../../dist/apps/data-import/service.js";
import { createCounterpartyEffectiveObjectSchemaV010 } from "../../dist/apps/counterparty/foundation-object.js";
import { createDataImportMappingPageV010 } from "../../dist/apps/data-import/page.js";

/**
 * M04 acceptance: two legitimately distinct enterprise fields may share the
 * Human-visible Chinese label 开户银行. This synthetic test NEVER claims to
 * know the customer's actual field IDs or reads private supplier records.
 */
function ambiguousBankSchema() {
  const schema=createCounterpartyEffectiveObjectSchemaV010({locale:"zh-CN"});
  const template=schema.fields.find(field=>field.fieldId==="displayName");
  assert.ok(template,"effective Counterparty schema must contain displayName");
  const bankFields=[
    {fieldId:"test.bank.receiving",description:"客户回款用途"},
    {fieldId:"test.bank.settlement",description:"供应商付款用途"}
  ].map(({fieldId,description})=>({
    ...template,fieldId,semanticType:fieldId,source:"ENTERPRISE_EXTENSION",
    resolvedLabel:"开户银行",resolvedDescription:description,
    label:{default:"开户银行"},description:{default:description},
    surfaces:["IMPORT"],required:false,readOnly:false,
    readable:true,writable:true
  }));
  return {...schema,fields:[...schema.fields,...bankFields]};
}
function source(headers) {
  return {kind:"ROWS",name:"synthetic-bank-id-safety.xlsx",headers,
    rows:[Object.fromEntries(headers.map(x=>[x,"synthetic-only"]))]};
}

test("M04: duplicate bank labels cannot silently select the first available target ID",()=>{
  const schema=ambiguousBankSchema();
  const mapping=suggestDataImportMappingV010({
    schema,source:source(["往来编码","开户银行","往来名称"])
  });
  assert.ok(mapping.some(x=>x.sourceColumn==="往来编码"&&x.targetFieldId==="code"));
  assert.ok(mapping.some(x=>x.sourceColumn==="往来名称"&&x.targetFieldId==="displayName"));
  assert.equal(mapping.some(x=>x.sourceColumn==="开户银行"),false,
    "two same-label bank candidates require an explicit Human field-ID choice");
});

test("M04: an explicit bank field ID can map, but never resolves another same-label column by vacancy",()=>{
  const schema=ambiguousBankSchema();
  const mapping=suggestDataImportMappingV010({
    schema,source:source(["test.bank.receiving","开户银行"])
  });
  assert.ok(mapping.some(x=>x.sourceColumn==="test.bank.receiving"
    &&x.targetFieldId==="test.bank.receiving"),
    "an unambiguous explicit field ID is a valid machine-readable alias");
  assert.equal(mapping.some(x=>x.sourceColumn==="开户银行"),false,
    "even one unoccupied target must not be inferred from originally ambiguous label");
});
