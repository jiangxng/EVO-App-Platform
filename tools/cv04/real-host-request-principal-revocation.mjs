#!/usr/bin/env node
/**
 * CV-04 nonproduction, request-bound Principal test: actual running Host,
 * bearer Session Provider, Enterprise relationship invite/accept/revoke,
 * real Dictionary Owner + ActionRouter, and stale scoped CSV requests.
 * No Tokyo credentials, live accounts, provider mocks or customer records.
 */
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {createPersonalAgentExperienceProfileV010} from
  "../../dist/manager/local-experience-profile.js";

const OUT=resolve("artifacts/cv04-request-principal-revoke");
mkdirSync(OUT,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),"cv04-principals-"));
const hostUrl="http://127.0.0.1:41386";
const owner="cv04-request-owner",member="cv04-request-member";
const tokenOwner=randomUUID()+"."+randomUUID();
const tokenMember=randomUUID()+"."+randomUUID();
const tokenAgent=randomUUID()+"."+randomUUID();
const tokens={owner:tokenOwner,member:tokenMember,agent:tokenAgent};
const makeSession=(subjectId,actorType,sessionId)=>({
  sessionId,
  principal:{subjectId,actorType,identityProviderId:"host.bearer-session"},
  issuedAt:"2026-11-12T00:00:00.000Z",
  assurance:["TEST_REQUEST_BOUND_BEARER"]
});
const bearerSessions={
  contractVersion:"0.1.0",
  sessions:[
    {token:tokenOwner,session:makeSession(owner,"HUMAN","cv04-owner-session")},
    {token:tokenMember,session:makeSession(member,"HUMAN","cv04-member-session")},
    {token:tokenAgent,session:makeSession(member,"AI","cv04-member-ai-session")}
  ]
};
const policy={contractVersion:"0.1.0",rules:[
  {id:"isolated-owner",effect:"ALLOW",actions:["*"],
   subjectIds:[owner],actorTypes:["HUMAN"]},
  {id:"isolated-member",effect:"ALLOW",
   actions:["dictionary.read","enterprise.relationship.invitation.accept"],
   subjectIds:[member],actorTypes:["HUMAN"]},
  {id:"isolated-member-agent-read",effect:"ALLOW",
   actions:["dictionary.read"],subjectIds:[member],actorTypes:["AI"]}
]};
const profile=createPersonalAgentExperienceProfileV010({
  ...process.env,PORT:"41386",APP_PLATFORM_EXPERIENCE_SUBJECT_ID:owner,
  APP_PLATFORM_STATE_FILE:join(temp,"state.json"),
  APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:join(temp,"governance.json"),
  APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:join(temp,"resources.json"),
  APP_PLATFORM_MANAGED_SESSION_ENABLED:"false",
  APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:"false",
  APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:"false",
  NODE_ENV:"test",LOG_LEVEL:"silent"
});
const child=spawn(process.execPath,["dist/manager/server.js"],{
  env:{
    ...profile.environment,
    APP_PLATFORM_STATIC_SESSION_JSON:"",
    APP_PLATFORM_BEARER_SESSIONS_JSON:JSON.stringify(bearerSessions),
    APP_PLATFORM_AUTHORIZATION_POLICY_JSON:JSON.stringify(policy)
  },
  stdio:["ignore","pipe","pipe"]
});
let log="",closed=false;
child.stdout.on("data",x=>{log+=String(x)});
child.stderr.on("data",x=>{log+=String(x)});
async function stop(){
  if(closed)return;closed=true;
  writeFileSync(join(OUT,"host.log"),log.slice(-300000),"utf8");
  if(child.exitCode===null)child.kill("SIGTERM");
  rmSync(temp,{recursive:true,force:true});
}
for(const name of ["SIGTERM","SIGINT"])
  process.on(name,()=>void stop().then(()=>process.exit(1)));
process.on("exit",()=>{if(!closed)child.kill("SIGTERM")});
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function http(path,who,method="GET",values,contextId){
  const res=await fetch(hostUrl+path,{
    method,
    headers:{
      accept:"application/json",
      ...(who?{authorization:"Bearer "+tokens[who]}:{}),
      ...(values?{"content-type":"application/json"}:{}),
      ...(contextId?{"x-evo-context-id":contextId}:{})
    },
    ...(values?{body:JSON.stringify(values)}:{})
  });
  const raw=await res.text();
  let value;
  try{value=JSON.parse(raw)}catch{value={raw:raw.slice(0,500)}}
  return {status:res.status,value};
}
async function action(code,who,input={},contextId,confirmed=false){
  return http("/v1/actions",who,"POST",{
    contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},
    values:input,sourceInteractionId:"cv04-auth-"+randomUUID(),
    actionId:code,requiresConfirmation:confirmed
  },contextId);
}
function success(res,phase){
  assert.equal(res.status,200,phase+":"+JSON.stringify(res).slice(0,800));
  assert.equal(res.value.ok,true,phase+":"+JSON.stringify(res).slice(0,800));
  return res.value.result;
}
function notDownload(res,phase){
  const raw=JSON.stringify(res.value);
  assert.equal(res.value.ok===true && !!res.value.result?.download,false,
    phase+":download allowed");
  assert.ok(!raw.includes("Isolated Secret B"),phase+":cross-context data leak");
  assert.ok(!raw.includes("Member Allowed A"),phase+":revoked content leak");
}
async function savePublished(name,dictionaryId,ctx){
  const draft=success(await action("dictionary.draft.save","owner",{
    dictionaryId,displayName:name,expectedVersion:0,
    options:[{code:"SECRET",label:{default:"Only in Owner Record"},status:"ACTIVE"}]
  },ctx),"save-"+dictionaryId);
  assert.equal(draft.data?.version,1);
  const p=success(await action("dictionary.publish","owner",
    {dictionaryId,expectedVersion:1},ctx,true),"publish-"+dictionaryId);
  assert.equal(p.data?.state,"PUBLISHED");
}
const exportInput={view:"published",sort:"displayName",direction:"asc",
  page:0,pageSize:1,fieldIds:["dictionaryId","displayName"]};
const marker="CV04_REQUEST_BOUND_PRINCIPALS_GOVERNANCE_REVOKE_PASS";
let failure;
try{
  let ready=false;
  for(let i=0;i<160;i++){
    if(child.exitCode!==null)throw Error("HOST_EXIT_"+child.exitCode);
    try{const h=await http("/health");if(h.status===200&&h.value.ok){ready=true;break}}catch{}
    await sleep(250);
  }
  assert.ok(ready,"HOST_NOT_READY:"+log.slice(-2000));
  const missing=await action("dictionary.collection.page.export.csv",null,exportInput);
  assert.equal(missing.status,401,"No bearer must not become owner static Session");
  console.log("CV04_REQUEST_SESSION_NO_BEARER_DENIED_PASS");
  const invalid=await fetch(hostUrl+"/v1/actions",{
    method:"POST",headers:{accept:"application/json",authorization:"Bearer invalid-cv04",
      "content-type":"application/json"},
    body:JSON.stringify({contractVersion:"0.1.0",type:"command",
      command:{code:"dictionary.collection.page.export.csv",inputVersion:"0.1.0"},
      values:exportInput,sourceInteractionId:"invalid-token",actionId:"export-current-page"})
  });
  assert.equal(invalid.status,401,"Invalid bearer cannot authorize");
  const created=success(await action("enterprise.context.create","owner",
    {displayName:"CV04 Owner A",code:"CV04_REQUEST_A"},undefined,true),"enterprise-A");
  const ctxA=created.context?.contextId??created.contextId;
  assert.ok(ctxA);
  for(const packageId of ["evo-business-dictionary"]){
    const installed=await http("/v1/install","owner","POST",{packageId});
    assert.equal(installed.status,200,JSON.stringify(installed).slice(0,1000));
  }
  await savePublished("Member Allowed A","cv04-member-a",ctxA);
  const createdB=success(await action("enterprise.context.create","owner",
    {displayName:"CV04 Owner B",code:"CV04_REQUEST_B"},undefined,true),"enterprise-B");
  const ctxB=createdB.context?.contextId??createdB.contextId;
  assert.ok(ctxB&&ctxB!==ctxA);
  await savePublished("Isolated Secret B","cv04-owner-b",ctxB);
  const before=await action("dictionary.collection.page.export.csv","member",exportInput,ctxA);
  notDownload(before,"member-before-invitation");
  const invite=success(await action("enterprise.relationship.invite","owner",
    {targetSubjectId:member,kind:"MEMBER"},ctxA,true),"member-invite");
  const invitationId=invite.invitation?.invitationId;
  assert.ok(invitationId);
  const accepted=success(await action(
    "enterprise.relationship.invitation.accept","member",
    {invitationId},undefined,true),"member-accept");
  const relationshipId=accepted.relationship?.relationshipId;
  assert.ok(relationshipId);
  const memberAllowed=success(await action(
    "dictionary.collection.page.export.csv","member",exportInput,ctxA),
    "member-authorized-export");
  const aiAllowed=success(await action(
    "dictionary.collection.page.export.csv","agent",exportInput,ctxA),
    "member-ai-authorized-export");
  for(const download of [memberAllowed.download,aiAllowed.download]){
    assert.equal(typeof download?.content,"string");
    assert.ok(download.content.startsWith("\uFEFF"));
    assert.ok(download.content.includes("Member Allowed A"));
    assert.ok(!download.content.includes("Isolated Secret B"));
    assert.ok(!download.content.includes("Only in Owner Record"));
  }
  assert.equal(aiAllowed.download.content,memberAllowed.download.content);
  console.log("CV04_REQUEST_SESSION_DIFFERENT_HUMAN_AI_OWNER_PARITY_PASS");
  for(const who of ["member","agent"]){
    const cross=await action("dictionary.collection.page.export.csv",who,exportInput,ctxB);
    notDownload(cross,who+"-foreign-enterprise");
  }
  console.log("CV04_REQUEST_SESSION_CROSS_ENTERPRISE_DENIED_PASS");
  const revoked=success(await action("enterprise.relationship.revoke","owner",
    {relationshipId},ctxA,true),"owner-revoke-member");
  assert.equal(revoked.relationship?.state,"REVOKED");
  const snapshot=JSON.parse(readFileSync(join(temp,"governance.json"),"utf8"));
  assert.ok(snapshot.relationshipEvents.some(x=>x.type==="RELATIONSHIP_REVOKED"
    && x.relationshipId===relationshipId));
  assert.ok(snapshot.grants.some(x=>x.subjectId===member
    && x.contextId===ctxA&&x.state==="REVOKED"));
  for(const who of ["member","agent"]){
    const after=await action("dictionary.collection.page.export.csv",who,exportInput,ctxA);
    notDownload(after,who+"-stale-bearer");
  }
  console.log("CV04_REAL_GOVERNANCE_EVENT_STALE_BEARER_DENIED_PASS");
  const ownerStill=success(await action(
    "dictionary.collection.page.export.csv","owner",exportInput,ctxA),"owner-continuity");
  assert.ok(ownerStill.download.content.includes("Member Allowed A"));
  const ownerB=success(await action(
    "dictionary.collection.page.export.csv","owner",exportInput,ctxB),"owner-enterprise-b");
  assert.ok(ownerB.download.content.includes("Isolated Secret B"));
  assert.ok(!ownerB.download.content.includes("Member Allowed A"));
  console.log("CV04_OWNER_CONTINUES_CROSS_ENTERPRISE_ISOLATED_PASS");
  writeFileSync(join(OUT,"result.json"),JSON.stringify({
    mainSha:process.env.GITHUB_SHA??"local",
    test:"REQUEST_BOUND_REAL_HOST_GOVERNANCE",
    notProduction:true,noCustomerData:true,
    principals:["OWNER_HUMAN","MEMBER_HUMAN","MEMBER_AI"],
    enterpriseCount:2,bearerTokensRedacted:true,
    memberInvitationAccepted:true,relationshipEventRevoked:true,
    revokedGrantConfirmed:true,staleSessionDenied:true,
    independentExportPermissionCertified:false
  },null,2));
  console.log(marker);
}catch(error){
  failure=error;
  console.error("CV04_REQUEST_BOUND_PRINCIPALS_FAILED",
    error instanceof Error?error.stack:String(error));
}finally{
  await stop();
}
if(failure)process.exitCode=1;
