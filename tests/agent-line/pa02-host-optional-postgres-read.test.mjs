import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID,createHash } from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createOptionalHostAsyncRunReaderV020}
  from "../../dist/manager/agent-async-run-host-mode.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"host-opt-in-user",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:host-opt-in-user",ownerSubjectId:"host-opt-in-user"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"context:opt-a",enterpriseId:"enterprise-opt-a"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"context:opt-a",enterpriseId:"enterprise-opt-a",
    enterpriseProviderId:"fixture",lifecycleState:"ACTIVE"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:context.activeContext.kind,contextId:context.activeContext.contextId,
  enterpriseId:context.activeContext.enterpriseId};
const digest=s=>createHash("sha256").update(s).digest("hex");

test("PA02 Host flag stays OFF without connecting and rejects unsafe configuration",async()=>{
  assert.equal(await createOptionalHostAsyncRunReaderV020({}),undefined);
  assert.equal(await createOptionalHostAsyncRunReaderV020({
    APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"OFF",
    APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:"postgres://invalid.invalid:1/not-connected"
  }),undefined);
  await assert.rejects(createOptionalHostAsyncRunReaderV020({
    APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"AUTO"
  }),/AGENT_ASYNC_READ_MODE_INVALID/);
  await assert.rejects(createOptionalHostAsyncRunReaderV020({
    APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"POSTGRES_READ_ONLY"
  }),/AGENT_ASYNC_READ_DATABASE_URL_REQUIRED/);
  await assert.rejects(createOptionalHostAsyncRunReaderV020({
    APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"POSTGRES_READ_ONLY",
    APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:"postgres://unused",
    APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:"public;drop schema"
  }),/AGENT_ASYNC_READ_SCHEMA_INVALID/);
});

test("PA02 Host configured read-through is PostgreSQL read-only and enterprise scoped",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_hostmode_"+randomUUID().replaceAll("-","").slice(0,12);
  const notReady="agent_pa02_absent_"+randomUUID().replaceAll("-","").slice(0,10);
  const admin=postgres(url,{max:2});
  let repository,host;
  try{
    await assert.rejects(createOptionalHostAsyncRunReaderV020({
      APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"POSTGRES_READ_ONLY",
      APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
      APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:notReady
    }),/AGENT_ASYNC_READ_SCHEMA_NOT_READY/);
    const missing=await admin.unsafe(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name=$1",
      [notReady]
    );
    assert.equal(missing.length,0,"Host must not create schemas on boot");

    repository=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    const runId="run:"+randomUUID();
    await repository.claimTurn({
      scope,threadId:"thread:opt",clientTurnId:"client:opt",
      taskDigest:digest("intent"),taskPayload:{message:"authorized test"},
      created:{contractVersion:"0.1.0",eventId:"ev:"+randomUUID(),
        runId,type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{principalSubjectId:principal.subjectId,
          principalActorType:principal.actorType,context:context.activeContext,
          sourceInteractionId:"thread:opt",sourceActionId:"client:opt",
          input:{message:"authorized test",conversationHistory:[],
            locale:"en",providerId:"sandbox",modelId:"static"}}}
    });
    host=await createOptionalHostAsyncRunReaderV020({
      APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE:"postGRES_read_only",
      APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
      APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:schema
    });
    assert.ok(host);
    const known=await host.read({runId,principal,context});
    assert.equal(known.runId,runId);
    assert.equal(known.state,"READY");
    assert.equal(await host.read({runId:"run:absent",principal,context}),undefined);
    const other={...context,
      activeContext:{...context.activeContext,
        contextId:"context:opt-b",enterpriseId:"enterprise-opt-b"},
      enterpriseContext:{...context.enterpriseContext,
        contextId:"context:opt-b",enterpriseId:"enterprise-opt-b"}
    };
    assert.equal(await host.read({runId,principal,context:other}),undefined);
    assert.equal(await host.read({
      runId,principal:{...principal,subjectId:"forged"},context
    }),undefined);
    const count=await admin.unsafe(
      'SELECT count(*)::int AS count FROM "'+schema+'".agent_run_events');
    assert.equal(Number(count[0].count),1,"Host read cannot write Run event");
    await host.close();host=undefined;
    console.log("PA02_HOST_READ_ONLY_FLAG="+JSON.stringify({
      status:"PASS",defaultOff:true,invalidModeDenied:true,
      missingSchemaFailClosed:true,noHostDdl:true,authorizedRead:true,
      enterpriseScopeHidden:true,forgedPrincipalHidden:true,noRunMutation:true,
      liveWorkerCutover:false,externalWrite:false
    }));
  }finally{
    if(host)await host.close();
    if(repository)await repository.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
