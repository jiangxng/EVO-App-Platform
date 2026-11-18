import test from "node:test";
import assert from "node:assert/strict";
import {
  createCv03PersonalSavedViewHumanFormV010,
  executeCv03HumanSavedViewFormV010
} from "../../dist/manager/cv03-personal-saved-view-human-form.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010
} from "../../dist/apps/business-dictionary/collection-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010
} from "../../dist/apps/business-dictionary/constants.js";
import {
  PERSONAL_SAVED_VIEW_WRITE_V010
} from "../../dist/providers/enterprise-context/personal-saved-views.js";

const ctx={
  principal:{subjectId:"human-a",actorType:"HUMAN"},
  scope:{enterpriseId:"one",userId:"human-a"},
  context:{
    activeContext:{kind:"ENTERPRISE",contextId:"enterprise-context:one",enterpriseId:"one"},
    personalContext:{ownerSubjectId:"human-a"}
  },
  correlationId:"cv03-protocol-human-columns"
};
const route="/business-dictionaries?view=published&personalViewId=old-private"+
  "&search=Hong&sort=displayName&direction=desc"+
  "&columns=displayName%2Cstate%2CdictionaryId&page=3&pageSize=15";
function formRequest(form) {
  return {
    contractVersion:"0.1.0",type:"command",
    command:{code:PERSONAL_SAVED_VIEW_WRITE_V010,inputVersion:"0.1.0"},
    values:{
      title:"Hong suppliers (compact)",
      viewId:form.fields.find(f=>f.key==="viewId").initialValue,
      returnTo:form.fields.find(f=>f.key==="returnTo").initialValue
    },
    sourceInteractionId:"cv03-protocol-human-save",
    actionId:"save-personal-view",requiresConfirmation:true
  };
}
function ownerResult(fields){
  return {ok:true,result:{data:{
    collectionId:BUSINESS_DICTIONARY_COLLECTION_ID_V010,
    schemaRef:BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
    readableFieldIds:fields
  }}};
}

test("CV03 isolated save-as preserves current authorized column order, not an old private view ID",async()=>{
  const form=createCv03PersonalSavedViewHumanFormV010({
    viewId:"new-private",currentDirectoryRoute:route,locale:"zh-CN"
  });
  const requested=parseBusinessDictionaryDirectoryRouteV010(
    form.fields.find(f=>f.key==="returnTo").initialValue);
  assert.equal(requested.personalViewId,undefined);
  assert.deepEqual(requested.columns,["displayName","state","dictionaryId"]);
  assert.equal(requested.query.search,"Hong");
  assert.equal(requested.query.page,3);
  const seen=[];
  const router={async execute(request){
    seen.push(request);
    if(request.command.code===BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010)
      return ownerResult(["displayName","dictionaryId","state","version","optionCount"]);
    if(request.command.code===PERSONAL_SAVED_VIEW_WRITE_V010)
      return {ok:true,result:{data:{view:{
        viewId:request.values.viewId,visibility:"PERSONAL",revision:0
      }}}};
    throw Error("unexpected operation");
  }};
  const result=await executeCv03HumanSavedViewFormV010({
    router,request:formRequest(form),context:ctx
  });
  assert.equal(result.ok,true,JSON.stringify(result.error));
  assert.equal(seen.length,2);
  assert.equal(seen[0].command.code,BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010);
  assert.deepEqual(seen[1].values.columns,["displayName","state","dictionaryId"]);
  assert.deepEqual(seen[1].values.query,{
    view:"published",search:"Hong",sort:"displayName",direction:"desc"
  });
  const after=parseBusinessDictionaryDirectoryRouteV010(result.result.navigateTo);
  assert.equal(after.personalViewId,"new-private");
  assert.deepEqual(after.columns,["displayName","state","dictionaryId"]);
  assert.equal(after.query.page,0);
});

test("CV03 isolated save-as refuses revoked display fields before requesting signed WRITE",async()=>{
  const form=createCv03PersonalSavedViewHumanFormV010({
    viewId:"safe-new",currentDirectoryRoute:route
  });
  const seen=[];
  const router={async execute(request){
    seen.push(request.command.code);
    if(request.command.code===BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010)
      return ownerResult(["displayName","dictionaryId"]);
    throw Error("saved view WRITE must not run on revoked column");
  }};
  const result=await executeCv03HumanSavedViewFormV010({
    router,request:formRequest(form),context:ctx
  });
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"CV03_HUMAN_FORM_COLUMNS_UNAVAILABLE");
  assert.deepEqual(seen,[BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010]);
});

test("CV03 isolated form refuses unsupported/duplicate presentation columns before any Host WRITE",()=>{
  for(const unsafe of [
    "displayName%2Cstate%2Csecret",
    "displayName%2Cstate%2Cstate",
    "displayName%2Cstate%2C",
    "state%2CdisplayName"
  ]) {
    const bad="/business-dictionaries?view=all&columns="+unsafe;
    assert.throws(()=>createCv03PersonalSavedViewHumanFormV010({
      viewId:"blocked",currentDirectoryRoute:bad
    }),/BUSINESS_DICTIONARY_DIRECTORY_COLUMNS_INVALID/);
  }
});
