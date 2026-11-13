import test from "node:test";
import assert from "node:assert/strict";
import { presentPersonalAgentReplyV020 } from
  "../../dist/agents/enterprise-agent/reply-presentation.js";
import { renderChatMessageToHtml } from
  "../../dist/vendor/eidos/src/chat/index.js";

const TOOL = "evo.collection.read.preview";
const DICTIONARY = "dictionary.collection.query";
const MY_CUSTOMERS = "counterparty.collection.my-customers.query";
const MY_SUPPLIERS = "counterparty.collection.my-suppliers.query";

function response(operationId=DICTIONARY, route="/business-dictionaries?view=published&search=Supplier&page=1&pageSize=25") {
  return {
    contractVersion:"0.1.0",
    kind:"evo.personal-agent-collection.read-preview",
    operationId,
    pageInfo:{page:1,pageSize:25,total:46,hasMore:false,countKind:"EXACT"},
    navigation:{
      kind:"EIDOS_COLLECTION_PAGE", authority:"PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN",
      route
    }
  };
}

function reply(value=response(), overrides={}) {
  return {
    contractVersion:"0.1.0",agentId:"enterprise-agent",
    message:"已查询授权列表。",
    tools:[{id:TOOL,title:"Preview Collection",effect:"READ",ownerPackageId:"evo-app-platform"}],
    observations:[{tool:TOOL,ok:true,result:value}],
    ...overrides
  };
}
function listAction(parts) {
  return parts.filter(x=>x.type==="proposal"
    && x.actions?.some(action=>action.id==="open-authorized-collection"));
}

test("CV05 true Host READ creates Chinese Eidos chat list action with exact count and safe route",()=>{
  const original=response();
  const parts=presentPersonalAgentReplyV020(reply(original),"zh-CN");
  const action=listAction(parts);
  assert.equal(action.length,1);
  assert.equal(action[0].title,"有权列表查询结果");
  assert.match(action[0].summary,/第 2 页/);
  assert.match(action[0].summary,/46 条/);
  assert.match(action[0].summary,/重新核验/);
  assert.equal(action[0].actions[0].label,"在列表中打开");
  assert.deepEqual(action[0].actions[0],{
    id:"open-authorized-collection",
    label:"在列表中打开",
    type:"navigate",
    route:original.navigation.route,
    primary:true
  });
  const html=renderChatMessageToHtml({
    contractVersion:"0.2.0",id:"agent-list",role:"assistant",parts
  });
  assert.match(html,/data-eidos-chat-action="open-authorized-collection"/);
  assert.match(html,/data-eidos-action-type="navigate"/);
  assert.match(html,/data-eidos-route="\/business-dictionaries\?view=published&amp;search=Supplier&amp;page=1&amp;pageSize=25"/);
  assert.doesNotMatch(html,/\\s+on[a-z]+\\s*=/i);
});

test("CV05 navigates to both actual Counterparty My-scope Eidos pages without new UI shell",()=>{
  for(const [op,route] of [
    [MY_SUPPLIERS,"/counterparties/my-suppliers?search=Hong+Kong&sort=displayName&page=0&pageSize=25"],
    [MY_CUSTOMERS,"/counterparties/my-customers?search=Global&page=0&pageSize=25"]
  ]) {
    const parts=presentPersonalAgentReplyV020(reply(response(op,route)),"en");
    const action=listAction(parts);
    assert.equal(action.length,1,op);
    assert.equal(action[0].actions[0].route,route);
    assert.equal(action[0].actions[0].label,"Open in list");
    assert.match(action[0].summary,/exact server count: 46/);
  }
});

test("CV05 untrusted observation cannot inject an arbitrary navigation target, owner, authority or count",()=>{
  const original=response();
  const variants=[
    {...original,navigation:{...original.navigation,route:"https://evil.example/steal"}},
    {...original,navigation:{...original.navigation,route:"//evil.example/steal"}},
    {...original,navigation:{...original.navigation,route:"/business-dictionaries#secret"}},
    {...original,navigation:{...original.navigation,route:"/business-dictionaries\\evil"}},
    {...original,navigation:{...original.navigation,route:"/counterparties/my-suppliers?search=x"}},
    {...original,navigation:{...original.navigation,route:"/business-dictionaries?tenantId=other"}},
    {...original,navigation:{...original.navigation,route:"/business-dictionaries?view=all&view=draft"}},
    {...original,navigation:{...original.navigation,authority:"PRODUCTION_CERTIFIED"}},
    {...original,navigation:{...original.navigation,kind:"EXTERNAL_URL"}},
    {...original,operationId:"dictionary.publish"},
    {...original,kind:"model-forged-result"},
    {...original,pageInfo:{...original.pageInfo,countKind:"ESTIMATED"}},
    {...original,pageInfo:{...original.pageInfo,total:-1}},
    {...original,contractVersion:"9.0"}
  ];
  for(const candidate of variants) {
    const parts=presentPersonalAgentReplyV020(reply(candidate),"zh-CN");
    assert.equal(listAction(parts).length,0,JSON.stringify(candidate));
  }
});

test("CV05 failed, revoked, absent, forged-descriptor or later denied observations never produce List action",()=>{
  const good=response();
  const variants=[
    reply(good,{observations:[{tool:TOOL,ok:false,result:good}]}),
    reply(good,{observations:[]}),
    reply(good,{observations:[{tool:"evo.capabilities.invoke.read-plan",ok:true,result:good}]}),
    reply(good,{tools:[{id:TOOL,title:"Preview Collection",effect:"WRITE",ownerPackageId:"evo-app-platform"}]}),
    reply(good,{observations:[
      {tool:TOOL,ok:true,result:good},
      {tool:TOOL,ok:false,error:{code:"AUTHORIZATION_DENIED"}}
    ]})
  ];
  for(const candidate of variants)
    assert.equal(listAction(presentPersonalAgentReplyV020(candidate)).length,0);
});
