import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {
  createCv03IsolatedHumanHttpHandlerV010,
  CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010
} from "../../dist/manager/cv03-personal-saved-view-human-http.js";

const alice={
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",actorType:"HUMAN",subjectId:"alice",
    identityProviderId:"test",sessionId:"alice"},
  scope:{contractVersion:"0.1.0",enterpriseId:"one",userId:"alice"},
  context:{contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      ownerSubjectId:"alice",contextId:"personal:alice"},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      enterpriseId:"one",contextId:"enterprise-context:one"}},
  correlationId:"cv03-http-alice"
};
const sourceRoute="/business-dictionaries?view=published&search=Hong+Kong&page=0&pageSize=25";
const sourceUrl="/v1/experience-pages?source="+encodeURIComponent(CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010)+
  "&route="+encodeURIComponent(sourceRoute)+"&locale=zh-CN";
const requestFor=(form,extra={})=>({
  contractVersion:"0.1.0",type:"command",
  command:{code:"collection.saved-view.personal.save",inputVersion:"0.1.0"},
  values:{
    title:"我的供应商",
    viewId:form.fields.find(x=>x.key==="viewId").initialValue,
    returnTo:form.fields.find(x=>x.key==="returnTo").initialValue,
    ...extra
  },sourceInteractionId:"cv03-http-form",
  actionId:"save-personal-view",requiresConfirmation:true
});
async function harness({enabled=true,denySource=false}={}){
  const seen=[];
  const actionRouter={async execute(req){
    seen.push(req);
    if(req.command.code==="dictionary.collection.query"){
      if(denySource)return {ok:false,error:{code:"DENY",message:"DENY"}};
      return {ok:true,result:{contractVersion:"0.1.0",data:{
        collectionId:"evo.business-dictionary.directory",
        schemaRef:"evo.business-dictionary.directory/0.1.0",
        readableFieldIds:["dictionaryId","displayName","state","version","optionCount"],
        rows:[],pageInfo:{page:0,pageSize:10,total:0,hasMore:false}
      }}};
    }
    return {ok:true,result:{contractVersion:"0.1.0",data:{
      view:{viewId:req.values.viewId,visibility:"PERSONAL",revision:0}
    }}};
  }};
  let isEnabled=enabled;
  let resolutions=0;
  const handler=createCv03IsolatedHumanHttpHandlerV010({
    router:actionRouter,isEnabled:()=>isEnabled,
    newViewId:()=>"http-view-1",
    async resolveContext(req){
      resolutions++;
      if(req.headers.authorization!=="Bearer alice")throw Error("UNAUTHENTICATED");
      return alice;
    }
  });
  const server=createServer((req,res)=>{
    void handler(req,res).then(handled=>{
      if(!handled){res.statusCode=404;res.end("{}");}
    }).catch(err=>{res.statusCode=500;res.end(JSON.stringify({error:String(err)}));});
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  return {
    seen,base,disable:()=>{isEnabled=false;},
    resolutions:()=>resolutions,
    async close(){await new Promise(resolve=>server.close(resolve));}
  };
}
async function fetchJson(host,path,options={}){
  const r=await fetch(host.base+path,{
    headers:{authorization:"Bearer alice",...options.headers},
    ...options,signal:AbortSignal.timeout(3500)
  });
  return {status:r.status,headers:r.headers,body:await r.json()};
}

test("CV03 isolated real HTTP: authenticated Human opens Eidos form and submits existing signed WRITE request",{
  timeout:15000
},async()=>{
  const host=await harness();
  try{
    const get=await fetchJson(host,sourceUrl);
    assert.equal(get.status,200);
    assert.equal(get.body.kind,"form");
    assert.equal(get.body.command.code,"collection.saved-view.personal.save");
    assert.equal(get.body.fields.filter(x=>!x.hidden).length,1);
    assert.equal(get.headers.get("cache-control"),"private, no-store");
    assert.ok(get.headers.get("vary").includes("authorization"));
    const result=await fetchJson(host,"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(requestFor(get.body))
    });
    assert.equal(result.status,200);
    assert.equal(result.body.ok,true,JSON.stringify(result.body));
    assert.ok(result.body.result.navigateTo.includes("personalViewId=http-view-1"));
    assert.equal(host.seen.length,3,"source read on form GET + source re-read before save + canonical WRITE");
    assert.deepEqual(host.seen.map(x=>x.command.code),[
      "dictionary.collection.query","dictionary.collection.query",
      "collection.saved-view.personal.save"
    ]);
    assert.equal("returnTo" in host.seen[2].values,false);
  }finally{await host.close();}
});

test("CV03 isolated real HTTP: OFF, authentication, malformed routes and forged input fail closed",{
  timeout:15000
},async()=>{
  const host=await harness();
  try{
    const stranger=await fetchJson(host,sourceUrl,{
      headers:{authorization:"Bearer stranger"}
    });
    assert.equal(stranger.status,403);
    assert.equal(host.seen.length,0);
    for(const path of [
      sourceUrl+"&source=duplicate",
      "/v1/experience-pages?source="+encodeURIComponent(CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010)+
        "&route="+encodeURIComponent("/business-dictionaries?sql=1"),
      "/v1/experience-pages?source="+encodeURIComponent(CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010)
    ]){
      const result=await fetchJson(host,path);
      assert.equal(result.status,400);
    }
    const valid=await fetchJson(host,sourceUrl);
    assert.equal(valid.status,200);
    const forged=await fetchJson(host,"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(requestFor(valid.body,{enterpriseId:"other"}))
    });
    assert.equal(forged.status,200);
    assert.equal(forged.body.ok,false);
    assert.equal(host.seen.length,1,"forged form must not call any WRITE");
    const invalidJson=await fetchJson(host,"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},body:"{"
    });
    assert.equal(invalidJson.status,400);
    host.disable();
    const off=await fetchJson(host,sourceUrl);
    assert.equal(off.status,404);
    const offSave=await fetchJson(host,"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(requestFor(valid.body))
    });
    assert.equal(offSave.status,404);
  }finally{await host.close();}
});

test("CV03 isolated real HTTP: revoked source disallows even the Human form GET",{
  timeout:15000
},async()=>{
  const host=await harness({denySource:true});
  try{
    const r=await fetchJson(host,sourceUrl);
    assert.equal(r.status,403);
    assert.equal(host.seen.length,1);
  }finally{await host.close();}
});
