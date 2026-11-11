import postgres from "postgres";
import type {PlatformActorType} from "../contracts/platform-services.js";
import {CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010}
  from "./cv03-personal-saved-view-host-admission.js";

/**
 * N1-05b/01. An UNMOUNTED, deny-only, opt-in client for a DBA-provisioned
 * PostgreSQL SECURITY DEFINER T0 routine. It is not a new AuthorizationProvider
 * or a replacement for PA05 Manager. It must NOT be called by a user/Agent
 * request or registered in manager/server.ts before actual Owner approvals.
 *
 * The DB Owner routine MUST bind SESSION_USER to a trusted Producer, prove
 * source generation and caller scope, atomically commit authority DENY and
 * the immutable outbox event, enforce idempotency under row locks, and return
 * exactly one scope-bound receipt. The client alone cannot enforce those DB
 * obligations and cannot certify production infrastructure.
 *
 * No DDL or direct table DML is issued. An absent/unsafe function fails closed.
 */
export type Cv03N105bActorV010 = Extract<PlatformActorType,"HUMAN"|"AI">;
export type Cv03N105bDenyReasonV010 =
  "PA05_DISABLE"|"PA05_UNINSTALL"|"AUTHORIZATION_REVOKE";

export interface Cv03N105bDenyRequestV010 {
  /** Host-minted idempotency token; never take from request JSON. */
  operationKey:string;
  /** Host-resolved trusted context; never accept Agent-supplied scope. */
  enterpriseId:string;
  contextId:string;
  principalSubjectId:string;
  actorType:Cv03N105bActorV010;
  /** Trusted prior DB authority watermark and generation; not a cache claim. */
  expectedEpoch:number;
  sourceGeneration:string;
  reason:Cv03N105bDenyReasonV010;
}

export interface Cv03N105bDenyCommitV010 {
  readonly authorityEpoch:number;
  readonly sourceGeneration:string;
  readonly outboxEventId:string;
  readonly replayed:boolean;
}

export interface Cv03N105bDenyAuthorityV010 {
  commitDeny(input:Cv03N105bDenyRequestV010):Promise<Cv03N105bDenyCommitV010>;
}

export interface Cv03N105bSqlExecutorV010 {
  /** Return database rows; the DB function owns the entire ACID transaction. */
  query(statement:string,parameters:readonly (string|number)[]):
    Promise<readonly Record<string,unknown>[]>;
}

function bounded(value:unknown,code:string,max=160):string {
  if(typeof value!=="string"||value.length===0||value.length>max||
      /[\u0000-\u001f\u007f]/.test(value))throw Error(code);
  return value;
}
function identifier(value:unknown,code:string):string {
  if(typeof value!=="string"||!/^[a-z][a-z0-9_]{0,62}$/.test(value))
    throw Error(code);
  return value;
}
function hostId(value:unknown):string {
  if(typeof value!=="string"||!/^[a-z0-9][a-z0-9_-]{2,79}$/.test(value))
    throw Error("CV03_N105B_HOST_ID_INVALID");
  return value;
}
function positiveEpoch(value:unknown):number {
  if(typeof value!=="number"||!Number.isSafeInteger(value)||
      value<0||value>=Number.MAX_SAFE_INTEGER)
    throw Error("CV03_N105B_EXPECTED_EPOCH_INVALID");
  return value;
}
function strictEpoch(value:unknown):number {
  if(typeof value!=="number"&&typeof value!=="string")
    throw Error("CV03_N105B_COMMIT_UNVERIFIABLE");
  if(typeof value==="string"&&!/^(0|[1-9][0-9]*)$/.test(value))
    throw Error("CV03_N105B_COMMIT_UNVERIFIABLE");
  const n=Number(value);
  if(!Number.isSafeInteger(n)||n<1)
    throw Error("CV03_N105B_COMMIT_UNVERIFIABLE");
  return n;
}

export function createCv03N105bDenyT0FromExecutorV010(input:{
  schema:string;
  trustedHostId:string;
  sql:Cv03N105bSqlExecutorV010;
}):Cv03N105bDenyAuthorityV010 {
  const schema=identifier(input.schema,"CV03_N105B_SCHEMA_INVALID");
  const trusted=hostId(input.trustedHostId);
  if(!input.sql||typeof input.sql.query!=="function")
    throw Error("CV03_N105B_SQL_EXECUTOR_REQUIRED");
  const query="SELECT authenticated_host_id,operation_key,context_id,"+
    "enterprise_id,principal_subject_id,actor_type,operation_id,"+
    "source_generation,authority_epoch,enabled,outbox_event_id,replayed "+
    "FROM \""+schema+"\".cv03_n105b_commit_deny_t0("+
    "$1::text,$2::text,$3::text,$4::text,$5::text,"+
    "$6::text,$7::text,$8::bigint,$9::text,$10::text)";
  return {
    async commitDeny(change) {
      if(!change||typeof change!=="object")
        throw Error("CV03_N105B_DENY_REQUEST_INVALID");
      const operationKey=bounded(change.operationKey,
        "CV03_N105B_OPERATION_KEY_INVALID",100);
      const enterpriseId=bounded(change.enterpriseId,
        "CV03_N105B_ENTERPRISE_INVALID");
      const contextId=bounded(change.contextId,
        "CV03_N105B_CONTEXT_INVALID",230);
      if(contextId!=="enterprise-context:"+enterpriseId)
        throw Error("CV03_N105B_CONTEXT_ENTERPRISE_MISMATCH");
      const principalSubjectId=bounded(change.principalSubjectId,
        "CV03_N105B_SUBJECT_INVALID");
      if(change.actorType!=="HUMAN"&&change.actorType!=="AI")
        throw Error("CV03_N105B_ACTOR_INVALID");
      const expectedEpoch=positiveEpoch(change.expectedEpoch);
      const generation=bounded(change.sourceGeneration,
        "CV03_N105B_GENERATION_INVALID",128);
      if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{5,127}$/.test(generation))
        throw Error("CV03_N105B_GENERATION_INVALID");
      if(!["PA05_DISABLE","PA05_UNINSTALL","AUTHORIZATION_REVOKE"].includes(change.reason))
        throw Error("CV03_N105B_DENY_REASON_INVALID");

      // One PostgreSQL function statement = one DB transaction.
      // Do NOT split authority mutation and outbox write across SQL calls.
      const rows=await input.sql.query(query,[
        trusted,operationKey,contextId,enterpriseId,principalSubjectId,
        change.actorType,generation,expectedEpoch,change.reason,
        CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010
      ]);
      if(!Array.isArray(rows)||rows.length!==1)
        throw Error("CV03_N105B_COMMIT_UNVERIFIABLE");
      const row=rows[0];
      // This echo is defense in depth, NOT a substitute for DB session_user
      // validation, SQL GRANT restrictions or authenticated Provider policy.
      if(!row||row.authenticated_host_id!==trusted||
         row.operation_key!==operationKey||
         row.context_id!==contextId||row.enterprise_id!==enterpriseId||
         row.principal_subject_id!==principalSubjectId||
         row.actor_type!==change.actorType||
         row.operation_id!==CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010||
         row.source_generation!==generation||row.enabled!==false||
         typeof row.outbox_event_id!=="string"||
         row.outbox_event_id.length<8||row.outbox_event_id.length>128||
         typeof row.replayed!=="boolean"||
         strictEpoch(row.authority_epoch)!==expectedEpoch+1)
        throw Error("CV03_N105B_COMMIT_UNVERIFIABLE");
      return {
        authorityEpoch:expectedEpoch+1,
        sourceGeneration:generation,
        outboxEventId:row.outbox_event_id,
        replayed:row.replayed
      };
    }
  };
}

export function createCv03N105bDenyT0PgV010(input:{
  connectionString:string;
  schema:string;
  trustedHostId:string;
}):Cv03N105bDenyAuthorityV010 & {close():Promise<void>} {
  if(typeof input.connectionString!=="string"||
     !/^postgres(?:ql)?:\/\/[^/\s]+\/\S+$/.test(input.connectionString))
    throw Error("CV03_N105B_PG_URL_REQUIRED");
  // Validate trusted identity/schema before opening any network connection.
  const schema=identifier(input.schema,"CV03_N105B_SCHEMA_INVALID");
  const trusted=hostId(input.trustedHostId);
  const db=postgres(input.connectionString,{
    max:1,prepare:false,connect_timeout:3,idle_timeout:5
  });
  const client=createCv03N105bDenyT0FromExecutorV010({
    schema,trustedHostId:trusted,
    sql:{async query(statement,parameters) {
      const rows=await db.unsafe(statement,[...parameters]);
      return rows as unknown as readonly Record<string,unknown>[];
    }}
  });
  return {...client,async close(){await db.end({timeout:2});}};
}
