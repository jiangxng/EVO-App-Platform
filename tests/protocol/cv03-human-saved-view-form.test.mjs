import test from "node:test";
import assert from "node:assert/strict";
import {renderToHtml} from "../../dist/vendor/eidos/src/renderers/html/index.js";
import {
  createCv03PersonalSavedViewHumanFormV010,
  executeCv03HumanSavedViewFormV010,
  CV03_HUMAN_SAVED_VIEW_FORM_ID_V010
} from "../../dist/manager/cv03-personal-saved-view-human-form.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";

const route="/business-dictionaries?view=published&search=Hong+Kong&sort=displayName&direction=asc&page=1&pageSize=25";
const actor=(subject="owner",ent="one")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",actorType:"HUMAN",subjectId:subject,
    identityProviderId:"test",sessionId:"test"},
  scope:{contractVersion:"0.1.0",userId:subject,enterpriseId:ent},
  context:{
    contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+subject,ownerSubjectId:subject},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise-context:"+ent,enterpriseId:ent}
  },correlationId:"cv03-human-form"
});
function submit(values,overrides={}){
  return {contractVersion:"0.1.0",type:"command",
    command:{code:"collection.saved-view.personal.save",inputVersion:"0.1.0"},
    values:{title:"我的供应商",viewId:"view123",returnTo:route,...values},
    actionId:"save-personal-view",sourceInteractionId:"cv03-form-1",
    requiresConfirmation:true,...overrides
  };
}
function router({denySource=false,denySave=false,fields=[
  "dictionaryId","displayName","state","version","optionCount"
]}={}){
  const seen=[];
  return {seen,execute:async (req)=>{
    seen.push(req);
    if(req.command.code==="dictionary.collection.query"){
      if(denySource)return {ok:false,error:{code:"DICTIONARY_READ_DENIED",message:"denied"}};
      return {ok:true,result:{contractVersion:"0.1.0",data:{
        contractVersion:"0.1.0",collectionId:"evo.business-dictionary.directory",
        schemaRef:"evo.business-dictionary.directory/0.1.0",
        readableFieldIds:fields,rows:[],pageInfo:{page:0,pageSize:10,total:0,hasMore:false}
      }}};
    }
    if(denySave)return {ok:false,error:{code:"CV03_WRITE_DENIED",message:"denied"}};
    return {ok:true,result:{contractVersion:"0.1.0",data:{
      view:{viewId:req.values.viewId,visibility:"PERSONAL",revision:0}
    }}};
  }};
}

test("CV03 Human UidlForm uses existing Eidos form, confirmed WRITE, generated private id and owner return route",()=>{
  const form=createCv03PersonalSavedViewHumanFormV010({
    viewId:"view123",currentDirectoryRoute:route,locale:"zh-CN"
  });
  assert.equal(form.contractVersion,"0.1.1");
  assert.equal(form.kind,"form");
  assert.equal(form.id,CV03_HUMAN_SAVED_VIEW_FORM_ID_V010);
  assert.equal(form.command.code,"collection.saved-view.personal.save");
  assert.equal(form.actions[0].requiresConfirmation,true);
  assert.deepEqual(form.fields.map(f=>f.key),["title","viewId","returnTo"]);
  assert.equal(form.fields[1].hidden,true);
  assert.equal(form.fields[2].hidden,true);
  assert.ok(form.fields[2].initialValue.includes("view=published"));
  assert.equal(form.fields[2].initialValue.includes("page=1"),true);
  const html=renderToHtml(form);
  assert.match(html,/我的视图/);
  assert.match(html,/save-personal-view/);
  assert.doesNotMatch(html,/SQL SELECT|enterpriseId|ownerSubjectId/);
  assert.throws(()=>createCv03PersonalSavedViewHumanFormV010({
    viewId:"../../evil",currentDirectoryRoute:route
  }),/CV03_HUMAN_FORM_VIEW_ID_INVALID/);
  assert.throws(()=>createCv03PersonalSavedViewHumanFormV010({
    viewId:"ok",currentDirectoryRoute:"https://attacker.invalid/path"
  }),/BUSINESS_DICTIONARY_DIRECTORY_ROUTE_INVALID/);
});

test("CV03 Human form Host adapter canonicalizes only owner-validated READ into existing WRITE and Eidos navigateTo",async()=>{
  const host=router();
  const result=await executeCv03HumanSavedViewFormV010({
    router:host,context:actor(),request:submit()
  });
  assert.equal(result.ok,true,JSON.stringify(result.error));
  assert.equal(host.seen.length,2);
  assert.equal(host.seen[0].command.code,"dictionary.collection.query");
  assert.deepEqual(host.seen[0].values,{
    view:"published",search:"Hong Kong",sort:"displayName",
    direction:"asc",page:0,pageSize:10
  });
  assert.equal(host.seen[1].command.code,"collection.saved-view.personal.save");
  assert.equal(host.seen[1].actionId,"collection.saved-view.personal.save");
  assert.equal(host.seen[1].requiresConfirmation,true);
  assert.equal(host.seen[1].values.expectedRevision,null);
  assert.deepEqual(host.seen[1].values.query,{
    view:"published",search:"Hong Kong",sort:"displayName",direction:"asc"
  });
  assert.deepEqual(host.seen[1].values.columns,[
    "displayName","dictionaryId","state","version","optionCount"
  ]);
  assert.equal("returnTo" in host.seen[1].values,false);
  const back=parseBusinessDictionaryDirectoryRouteV010(result.result.navigateTo);
  assert.equal(back.personalViewId,"view123");
  assert.equal(back.query.search,"Hong Kong");
  assert.equal(back.query.page,0);
});

test("CV03 Human form rejects forged owner/scope, delegated or AI, unconfirmed, unknown values and source denial before WRITE",async()=>{
  const cases=[
    {context:actor(),request:submit({ownerSubjectId:"attacker"})},
    {context:actor(),request:submit({query:{sql:"DROP"}})},
    {context:actor(),request:submit({enterpriseId:"two"})},
    {context:actor(),request:submit({}, {requiresConfirmation:false})},
    {context:actor(),request:submit({}, {actionId:"forged-action"})},
    {context:actor(),request:submit({viewId:"../danger"})},
    {context:actor(),request:submit({title:""})},
    {context:actor(),request:submit({returnTo:"https://malicious.invalid"})},
    {context:actor(),request:submit({returnTo:"/business-dictionaries?view=all&search=x&sql=1"})},
    {context:{...actor(),principal:{...actor().principal,actorType:"AI"}},request:submit()},
    {context:{...actor(),scope:{contractVersion:"0.1.0",enterpriseId:"other"}},request:submit()},
    {context:{...actor(),delegatedActor:{subjectId:"external"}},request:submit()}
  ];
  for(const input of cases){
    const host=router();
    const response=await executeCv03HumanSavedViewFormV010({
      router:host,...input
    });
    assert.equal(response.ok,false,JSON.stringify(input));
    assert.equal(host.seen.length,0,"invalid form must not reach any Host action");
  }
  const denied=router({denySource:true});
  const result=await executeCv03HumanSavedViewFormV010({
    router:denied,context:actor(),request:submit()
  });
  assert.equal(result.error.code,"CV03_HUMAN_FORM_SOURCE_READ_DENIED");
  assert.equal(denied.seen.length,1);
  const noKeyFields=router({fields:["state","version"]});
  const deniedColumns=await executeCv03HumanSavedViewFormV010({
    router:noKeyFields,context:actor(),request:submit()
  });
  assert.equal(deniedColumns.error.code,"CV03_HUMAN_FORM_COLUMNS_UNAVAILABLE");
  assert.equal(noKeyFields.seen.length,1);
  const deniedWrite=router({denySave:true});
  const auth=await executeCv03HumanSavedViewFormV010({
    router:deniedWrite,context:actor(),request:submit()
  });
  assert.equal(auth.error.code,"CV03_WRITE_DENIED");
  assert.equal(deniedWrite.seen.length,2);
  assert.equal("result" in auth,false);
});

test("CV03 Human form does not retain a previous personalViewId as an authorization source",async()=>{
  const fromPersonal=route.replace("&search=","&personalViewId=someone-else&search=");
  const form=createCv03PersonalSavedViewHumanFormV010({
    viewId:"fresh",currentDirectoryRoute:fromPersonal
  });
  assert.equal(form.fields[2].initialValue.includes("personalViewId"),false);
  const host=router();
  const result=await executeCv03HumanSavedViewFormV010({
    router:host,context:actor(),request:submit({viewId:"fresh",returnTo:fromPersonal})
  });
  assert.equal(result.ok,true);
  assert.equal(result.result.navigateTo.includes("personalViewId=fresh"),true);
  assert.equal(host.seen[1].values.viewId,"fresh");
  assert.equal(host.seen[1].values.query.personalViewId,undefined);
});
