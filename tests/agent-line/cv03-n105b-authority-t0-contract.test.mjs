import test from "node:test";
import assert from "node:assert/strict";
import {
  createCv03N105bDenyT0FromExecutorV010,
  createCv03N105bDenyT0PgV010
} from "../../dist/manager/cv03-n105b-authority-t0-pg.js";
import {
  assertCv03HumanSaveNotEnabledV010,
  cv03UnadmittedWriteDenialV010
} from "../../dist/manager/cv03-personal-saved-view-host-admission.js";

const req={
  operationKey:"owner-minted-deny-20261111",
  enterpriseId:"ent-1",
  contextId:"enterprise-context:ent-1",
  principalSubjectId:"user-1",
  actorType:"HUMAN",
  expectedEpoch:7,
  sourceGeneration:"generation-20261111",
  reason:"PA05_DISABLE"
};
const operationId="collection.saved-view.personal.save";
function row(change={}){
  return {
    authenticated_host_id:"pa05-host-01",operation_key:req.operationKey,
    context_id:req.contextId,enterprise_id:req.enterpriseId,
    principal_subject_id:req.principalSubjectId,actor_type:req.actorType,
    operation_id:operationId,source_generation:req.sourceGeneration,
    authority_epoch:"8",enabled:false,
    outbox_event_id:"event-immutable-001",replayed:false,...change
  };
}
function make(execute){
  return createCv03N105bDenyT0FromExecutorV010({
    schema:"owner_provisioned_schema",trustedHostId:"pa05-host-01",
    sql:{query:execute}
  });
}

test("N1-05b/01 uses exactly one owner function call and denies only",async()=>{
  const seen=[];
  const client=make(async(sql,values)=>{
    seen.push({sql,values});
    return [row()];
  });
  assert.deepEqual(await client.commitDeny(req),{
    authorityEpoch:8,sourceGeneration:req.sourceGeneration,
    outboxEventId:"event-immutable-001",replayed:false
  });
  assert.equal(seen.length,1);
  assert.match(seen[0].sql,/FROM "owner_provisioned_schema"\.cv03_n105b_commit_deny_t0\(/);
  assert.doesNotMatch(seen[0].sql,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|SET ROLE)\b/i);
  assert.equal(seen[0].values[0],"pa05-host-01");
  assert.equal(seen[0].values[9],operationId);
  assert.equal(seen[0].values.length,10);
});

test("N1-05b/01 rejects untrusted/malformed scope before touching SQL",async()=>{
  let calls=0;
  const client=make(async()=>{calls++;return [row()]});
  const bad=[
    {contextId:"enterprise-context:another"},
    {actorType:"SERVICE"},
    {sourceGeneration:"X"},
    {operationKey:""},
    {reason:"GRANT"},
    {principalSubjectId:""},
    {enterpriseId:"e\n"},
    {expectedEpoch:-1},
    {expectedEpoch:Number.MAX_SAFE_INTEGER}
  ];
  for(const change of bad){
    await assert.rejects(()=>client.commitDeny({...req,...change}));
  }
  assert.equal(calls,0);
});

test("N1-05b/01 cannot confuse Host, actor, enterprise, scope, epoch or outbox",async()=>{
  const bad=[
    {authenticated_host_id:"stolen-host"},
    {operation_key:"different-key"},
    {context_id:"enterprise-context:other"},
    {enterprise_id:"other"},
    {principal_subject_id:"other"},
    {actor_type:"AI"},
    {operation_id:"another-operation"},
    {source_generation:"old-generation"},
    {authority_epoch:"7"},
    {authority_epoch:"9007199254740992"},
    {enabled:true},
    {outbox_event_id:""},
    {replayed:"true"}
  ];
  for(const change of bad){
    const client=make(async()=>[row(change)]);
    await assert.rejects(()=>client.commitDeny(req),/CV03_N105B_COMMIT_UNVERIFIABLE/);
  }
});

test("N1-05b/01 DB outage, undefined Owner function, missing/ambiguous row fail closed",async()=>{
  for(const result of [[],[row(),row()]]){
    const client=make(async()=>result);
    await assert.rejects(()=>client.commitDeny(req),/CV03_N105B_COMMIT_UNVERIFIABLE/);
  }
  const down=make(async()=>{throw Error("connection refused")});
  await assert.rejects(()=>down.commitDeny(req),/connection refused/);
  const uninstalled=make(async()=>{throw Error("42883 undefined function")});
  await assert.rejects(()=>uninstalled.commitDeny(req),/42883/);
});

test("N1-05b/01 replay is accepted only for exact scope-bound epoch and outbox",async()=>{
  const client=make(async()=>[row({replayed:true})]);
  const result=await client.commitDeny(req);
  assert.equal(result.replayed,true);
  assert.equal(result.authorityEpoch,8);
});

test("N1-05b/01 requires explicit PG/Host binding, never opens DB by default",()=>{
  assert.throws(()=>createCv03N105bDenyT0PgV010({
    connectionString:"",schema:"safe_schema",trustedHostId:"pa05-host-01"
  }),/CV03_N105B_PG_URL_REQUIRED/);
  assert.throws(()=>createCv03N105bDenyT0FromExecutorV010({
    schema:"bad;DROP",trustedHostId:"pa05-host-01",sql:{query:async()=>[row()]}
  }),/CV03_N105B_SCHEMA_INVALID/);
  assert.throws(()=>createCv03N105bDenyT0FromExecutorV010({
    schema:"safe_schema",trustedHostId:"xx",sql:{query:async()=>[row()]}
  }),/CV03_N105B_HOST_ID_INVALID/);
});

test("N1-05b/01 does not relax formal Host SAVE OFF/403",()=>{
  assert.doesNotThrow(()=>assertCv03HumanSaveNotEnabledV010({
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"OFF"
  }));
  assert.throws(()=>assertCv03HumanSaveNotEnabledV010({
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"ON"
  }),/CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED/);
  const denial=cv03UnadmittedWriteDenialV010({
    command:{code:operationId,inputVersion:"0.1.0"},
    sourceInteractionId:"deny-test"
  });
  assert.equal(denial?.ok,false);
  assert.equal(denial?.error?.code,"CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED");
});
