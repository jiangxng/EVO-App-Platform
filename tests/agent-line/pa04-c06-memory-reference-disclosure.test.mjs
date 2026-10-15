import test from "node:test";
import assert from "node:assert/strict";
import {
  guardPa04ContextMemoryDisclosureV010
} from "../../dist/agents/enterprise-agent/pa04-memory-reference-disclosure.js";
import {
  createEnterpriseAgentHostToolCatalogV010
} from "../../dist/agents/enterprise-agent/host-tool-catalog.js";

const principal={contractVersion:"0.1.0",subjectId:"human-c06",
  actorType:"HUMAN",identityProviderId:"fixture"};
const personal={contractVersion:"0.1.0",kind:"PERSONAL",
  contextId:"personal:human-c06"};
const enterprise={contractVersion:"0.1.0",kind:"ENTERPRISE",
  contextId:"enterprise:source-vendor",enterpriseId:"vendor"};
const resolved={contractVersion:"0.1.0",
  personalContext:{...personal,ownerSubjectId:principal.subjectId},
  activeContext:personal};
const privateTitle="PRIVATE_TITLE_NO_LONGER_AUTHORIZED";
const privateBody="PRIVATE_BODY_NO_LONGER_AUTHORIZED";
const privateUrl="https://restricted.invalid/download/private-file";
function item(memoryId="memory:revoked") {
  return {
    contractVersion:"0.1.0",memoryId,context:personal,kind:"FACT",
    summary:privateBody,documentTitle:privateTitle,downloadUrl:privateUrl,
    provenance:{
      contractVersion:"0.1.0",origin:"DIRECT",
      sourceContext:enterprise,
      evidenceRefs:["enterprise:source-vendor:document:31"],
      evidenceSources:[{
        contractVersion:"0.1.0",
        sourceId:"enterprise:source-vendor:attachment:31",
        sourceType:"DOCUMENT",trustLevel:"HOST_VERIFIED"
      }]
    }
  };
}
function authority(allow=()=>true) {
  const calls=[];
  return {calls,async authorize(value) {
    calls.push(structuredClone(value));
    return allow(value);
  }};
}
function catalog(auth, read) {
  return createEnterpriseAgentHostToolCatalogV010({
    manager:{},principal,context:resolved,
    listAvailableContexts:()=>[personal],
    listProviderBindings:()=>[],
    getProviderHealth:()=>({state:"UNKNOWN"}),
    readContextMemory:read,
    inventoryContextMemory:()=>({contractVersion:"0.1.0",
      items:[item()],totalCount:1,nextCursor:undefined}),
    searchHelp:()=>[],
    memoryDisclosureAuthority:auth
  });
}
async function call(host,tool,args={}) {
  return host.invoke({tool,arguments:args},[]);
}
function denied(result) {
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"PA04_REFERENCE_DISCLOSURE_DENIED");
  const text=JSON.stringify(result);
  for(const s of [privateTitle,privateBody,privateUrl,"attachment:31",
    "document:31"])assert.doesNotMatch(text,new RegExp(s.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&")));
}
test("PA04 C06: exact Principal, Context, Memory and source provenance checked at display",async()=>{
  const auth=authority();
  const snapshot={items:[item()]};
  await guardPa04ContextMemoryDisclosureV010({
    result:snapshot,principal,context:personal,authority:auth
  });
  assert.deepEqual(auth.calls[0],{
    principal,context:personal,memoryId:"memory:revoked",
    sourceContext:enterprise,
    evidenceRefs:["enterprise:source-vendor:document:31"],
    evidenceSourceIds:["enterprise:source-vendor:attachment:31"]
  });
});
test("PA04 C06: a changed source grant denies title, body, provenance and URL together",async()=>{
  let visible=true;
  const auth=authority(()=>visible);
  const host=catalog(auth,async()=>({contractVersion:"0.1.0",items:[item()]}));
  const initial=await call(host,"context.memory.search",{query:"source"});
  assert.equal(initial.ok,true);
  assert.equal(initial.result.items[0].downloadUrl,privateUrl);
  visible=false; // real Host would check live resource permission here
  for(const [tool,args] of [
    ["context.memory.search",{query:"source"}],
    ["context.memory.inventory.list",{}],
    ["context.memory.recall",{queries:["source","document"]}],
    ["context.memory.audit.get",{memoryId:"memory:revoked"}],
    ["context.memory.audit.compare",{query:"source",memoryIds:["memory:revoked"]}]
  ])denied(await call(host,tool,args));
});
test("PA04 C06: grant lookup throws or returns unknown => no memory or link data",async()=>{
  const host=catalog(authority(()=>{throw Error("INTERNAL_SECRET_OR_SOURCE_URL");}),
    async()=>({items:[item()]}));
  denied(await call(host,"context.memory.search",{query:"private"}));
});
test("PA04 C06: malformed or cross-context records cannot bypass Host disclosure checks",async()=>{
  const bad=[
    {...item(),context:{...personal,contextId:"personal:other"}},
    {...item(),provenance:{...item().provenance,evidenceRefs:undefined}},
    {...item(),provenance:{...item().provenance,evidenceSources:[{}]}},
    {...item(),memoryId:""}
  ];
  for(const value of bad) {
    const result=await call(catalog(authority(),async()=>({items:[value]})),
      "context.memory.search",{});
    assert.equal(result.ok,false);
    assert.equal(result.error.code,"PA04_REFERENCE_DISCLOSURE_UNVERIFIED");
    assert.doesNotMatch(JSON.stringify(result),/PRIVATE_TITLE|PRIVATE_BODY|restricted.invalid/);
  }
});
test("PA04 C06: an authorized Memory remains readable; no broad blocking",async()=>{
  const host=catalog(authority(()=>true),async()=>({items:[item()]}));
  const search=await call(host,"context.memory.search",{query:"ok"});
  assert.equal(search.ok,true);
  assert.equal(search.result.items[0].summary,privateBody);
  const audit=await call(host,"context.memory.audit.get",{memoryId:"memory:revoked"});
  assert.equal(audit.ok,true);
});
