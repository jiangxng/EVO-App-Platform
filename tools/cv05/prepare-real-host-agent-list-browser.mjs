#!/usr/bin/env node
/**
 * CV05 isolated browser acceptance adapter.
 * Reuses the already-complete CV04 real installed Host fixture; does NOT
 * synthesize Owner data, call a live LLM, or change a running Host.
 *
 * A fresh /v1/actions READ is fed into the production CV05 preview adapter
 * and Eidos reply renderer. The resulting authorized presentation HTML is
 * inserted into the real Host Chat DOM by the Chromium harness.
 */
import assert from "node:assert/strict";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {presentPersonalAgentCollectionReadV010} from
  "../../dist/agents/enterprise-agent/collection-read-preview.js";
import {presentPersonalAgentReplyV020} from
  "../../dist/agents/enterprise-agent/reply-presentation.js";
import {renderChatMessageToHtml} from
  "../../dist/vendor/eidos/src/chat/index.js";

const cv04=JSON.parse(readFileSync("artifacts/cv04-csv-browser/fixture.json","utf8"));
assert.equal(cv04.isolated,true);
assert.equal(cv04.productionUsed,false);
const host=cv04.hostUrl,contextId=cv04.contextId;
assert.match(host,/^http:\/\/127\.0\.0\.1:\d+$/);
assert.ok(contextId && cv04.secondaryContextId!==contextId);
const out=resolve("artifacts/cv05-agent-list-browser");
mkdirSync(out,{recursive:true});

async function ownerRead(operationId,query){
  const request={
    contractVersion:"0.1.0",type:"command",
    command:{code:operationId,inputVersion:"0.1.0"},values:query,
    sourceInteractionId:"cv05-browser-owner-read",actionId:operationId,
    requiresConfirmation:false
  };
  const resp=await fetch(host+"/v1/actions",{
    method:"POST",headers:{
      accept:"application/json","content-type":"application/json",
      "x-evo-context-id":contextId
    },body:JSON.stringify(request)
  });
  const value=await resp.json();
  assert.equal(resp.status,200,JSON.stringify(value).slice(0,900));
  assert.equal(value.ok,true,JSON.stringify(value).slice(0,900));
  return value.result;
}

const plans=[
  {
    name:"my-suppliers",
    operationId:"counterparty.collection.my-suppliers.query",
    query:{search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:1},
    expectedA:"Supplier Alpha CV04",expectedB:cv04.secondaryNames["my-suppliers"]
  },
  {
    name:"dictionary",
    operationId:"dictionary.collection.query",
    query:{view:"published",search:"Dictionary",sort:"displayName",
      direction:"asc",page:0,pageSize:1},
    expectedA:"Alpha CSV Dictionary",expectedB:cv04.secondaryNames.dictionary
  }
];
const result=[];
for(const plan of plans){
  const read=await ownerRead(plan.operationId,plan.query);
  const preview=await presentPersonalAgentCollectionReadV010({
    operationId:plan.operationId,query:plan.query,
    result:read,correlationId:"cv05-real-host-chromium"
  });
  assert.equal(preview.pageInfo.page,0);
  assert.equal(preview.rows.length,1);
  assert.equal(preview.pageInfo.countKind,"EXACT");
  assert.ok(preview.pageInfo.total>=1);
  const reply={
    contractVersion:"0.1.0",agentId:"enterprise-agent",
    message:"已从当前企业读取有权限的列表，请在列表中打开。",
    tools:[{
      id:"evo.collection.read.preview",title:"Preview authorized Collection",
      effect:"READ",ownerPackageId:"evo-app-platform"
    }],
    observations:[{
      tool:"evo.collection.read.preview",ok:true,result:preview
    }]
  };
  const parts=presentPersonalAgentReplyV020(reply,"zh-CN");
  const nav=parts.flatMap(x=>x.type==="proposal"?(x.actions??[]):[])
    .find(x=>x.id==="open-authorized-collection");
  assert.equal(nav?.route,preview.navigation.route);
  assert.equal(nav?.type,"navigate");
  const messageHtml=renderChatMessageToHtml({
    contractVersion:"0.2.0",id:"cv05-isolated-"+plan.name,
    role:"assistant",parts
  });
  assert.match(messageHtml,/data-eidos-chat-action="open-authorized-collection"/);
  assert.ok(!messageHtml.includes("PRIVATE-") && !messageHtml.includes("SECRET-"));
  result.push({
    name:plan.name,operationId:plan.operationId,query:plan.query,
    expectedA:plan.expectedA,expectedB:plan.expectedB,
    route:nav.route,messageHtml,
    pageInfo:preview.pageInfo
  });
  console.log("CV05_OWNER_REAL_READ_TO_EIDOS_CHAT_PASS="+plan.name);
}

writeFileSync(out+"/fixture.json",JSON.stringify({
  ...Object.fromEntries(["hostUrl","contextId","secondaryContextId",
    "subjectId"].map(k=>[k,cv04[k]])),
  sourceSha:process.env.GITHUB_SHA??"local",
  isolated:true,productionUsed:false,liveLlmUsed:false,humanLoginUsed:false,
  plans:result
},null,2));
console.log("CV05_REAL_HOST_AGENT_LIST_BROWSER_READY="+result.length);
