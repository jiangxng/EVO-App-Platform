import { createHash } from "node:crypto";
import type {AgentActionReceiptBeginInputV010} from "../../contracts/agent-action-receipt.js";
import {digestConditionalResourcePutV010} from "./resource-receipt-digest.js";
import type { AppActionHandler, AppActionRequestV010, JsonValue } from "../../actions/contracts.js";
import type { DataCollectionResultV010 } from "../../contracts/data-collection/query.js";
import type {
  EnterpriseResourceConditionalAsyncRepositoryV010,
  EnterpriseResourceAddressV010,
  EnterpriseResourceConditionalPutInputV010,
  EnterpriseResourceJsonV010
} from "../../contracts/enterprise-resource.js";
import type { FeatureManifestV010, PlatformCapabilityOperationContributionV010 } from "../../contracts/package.js";
import type { PlatformRequestContextV010 } from "../../contracts/platform-services.js";
import {
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID
} from "./package.js";

/**
 * CV-03 C3-02 isolated owner vertical: uses existing Platform Feature,
 * Action Host, authorized Collection READ and async Enterprise Resource CAS.
 *
 * NOT included in catalog/seed or production Host. A trusted Host must supply
 * a durable WRITE receipt/approval gate before this capability can be enabled.
 * The generic Personal Agent bridge alone is not a durable WRITE receipt.
 */
export const PERSONAL_SAVED_VIEW_FEATURE_V010 =
  "host-enterprise-context-provider.personal-saved-views" as const;
export const PERSONAL_SAVED_VIEW_CAPABILITY_V010 = "enterprise.collection.saved-view" as const;
export const PERSONAL_SAVED_VIEW_READ_V010 = "collection.saved-view.personal.list" as const;
export const PERSONAL_SAVED_VIEW_WRITE_V010 = "collection.saved-view.personal.save" as const;
export const PERSONAL_SAVED_VIEW_NAMESPACE_V010 = "evo.saved-view.personal" as const;

type SavedQuery = {
  view?: string;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
};
type SavedDefinition = {
  contractVersion: "0.1.0";
  viewId: string;
  visibility: "PERSONAL";
  title: string;
  queryOperationId: string;
  collectionId: string;
  schemaRef: string;
  query: SavedQuery;
  columns: string[];
  presentation: "table" | "list";
  ownerSubjectId: string;
  enterpriseId: string;
};

function requiredText(v: unknown, code: string, max = 120): string {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max) throw Error(code);
  return v.trim();
}
function viewId(v: unknown): string {
  const id = requiredText(v, "SAVED_VIEW_ID_INVALID", 80);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(id)) throw Error("SAVED_VIEW_ID_INVALID");
  return id;
}
function expectedRevision(v: unknown): number | null {
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) {
    throw Error("SAVED_VIEW_EXPECTED_REVISION_INVALID");
  }
  return v;
}
function queryValues(v: unknown): SavedQuery {
  if (v === undefined) return {};
  if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("SAVED_VIEW_QUERY_INVALID");
  const q = v as Record<string, unknown>;
  if (Object.keys(q).some(k=>!["view", "search", "sort", "direction"].includes(k))) {
    throw Error("SAVED_VIEW_QUERY_INVALID");
  }
  const result: SavedQuery = {};
  if (q.view !== undefined) result.view = requiredText(q.view, "SAVED_VIEW_QUERY_INVALID", 30);
  if (q.search !== undefined) result.search = requiredText(q.search, "SAVED_VIEW_QUERY_INVALID", 120);
  if (q.sort !== undefined) result.sort = requiredText(q.sort, "SAVED_VIEW_QUERY_INVALID", 80);
  if (q.direction !== undefined) {
    if (q.direction !== "asc" && q.direction !== "desc") throw Error("SAVED_VIEW_QUERY_INVALID");
    result.direction = q.direction;
  }
  return result;
}
function columnsValue(v: unknown, available: readonly string[]): string[] {
  if (v === undefined) return available.slice(0,20);
  if (!Array.isArray(v) || v.length===0 || v.length>20 ||
    v.some(x=>typeof x!=="string" || !available.includes(x)) ||
    new Set(v).size !== v.length) throw Error("SAVED_VIEW_COLUMNS_FORBIDDEN");
  return [...v] as string[];
}
function principalScope(ctx?: PlatformRequestContextV010) {
  const active = ctx?.context?.activeContext;
  const subject = ctx?.principal?.subjectId;
  if (!ctx || ctx.delegatedActor || !subject?.trim() ||
    !["HUMAN","AI"].includes(ctx.principal.actorType) ||
    !active || active.kind !== "ENTERPRISE" ||
    !active.contextId?.trim() || !active.enterpriseId?.trim() ||
    ctx.scope.enterpriseId !== active.enterpriseId ||
    (ctx.scope.userId && ctx.scope.userId !== subject) ||
    (ctx.context?.personalContext.ownerSubjectId &&
      ctx.context.personalContext.ownerSubjectId !== subject)) {
    throw Error("SAVED_VIEW_PRINCIPAL_ENTERPRISE_SCOPE_REQUIRED");
  }
  return {contextId:active.contextId,enterpriseId:active.enterpriseId,subjectId:subject};
}
function address(ctx: PlatformRequestContextV010, id: string): EnterpriseResourceAddressV010 {
  const s = principalScope(ctx);
  const scopeHash = createHash("sha256").update(JSON.stringify([
    s.enterpriseId,s.subjectId
  ])).digest("hex");
  return {
    contextId:s.contextId,
    namespace:PERSONAL_SAVED_VIEW_NAMESPACE_V010+"."+scopeHash,
    collectionId:"collection-views",
    resourceType:"saved-collection-view",
    resourceId:id
  };
}
function parseDefinition(v: unknown): SavedDefinition {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("SAVED_VIEW_PAYLOAD_INVALID");
  const d=v as SavedDefinition;
  if(d.contractVersion!=="0.1.0" || d.visibility!=="PERSONAL") throw Error("SAVED_VIEW_PAYLOAD_INVALID");
  return d;
}
function resultData(value: unknown): DataCollectionResultV010 {
  if (!value || typeof value!=="object" || Array.isArray(value)) throw Error("SAVED_VIEW_SOURCE_INVALID");
  const v=value as DataCollectionResultV010;
  if(v.contractVersion!=="0.1.0" || !v.collectionId?.trim() ||
     !v.schemaRef?.trim() || !Array.isArray(v.readableFieldIds) ||
     !Array.isArray(v.rows) || !v.pageInfo) throw Error("SAVED_VIEW_SOURCE_INVALID");
  return v;
}
function errorResult(error: unknown, context?: PlatformRequestContextV010) {
  const code=error instanceof Error ? error.message : "SAVED_VIEW_OPERATION_FAILED";
  return {ok:false, ...(context ? {correlationId:context.correlationId} : {}),
    error:{code,message:code}};
}

function operation(op:string,effect:"READ"|"WRITE"): PlatformCapabilityOperationContributionV010 {
  return {kind:"platform.capability-operation",operation:{
    contractVersion:"0.1.0",operationId:op,capability:PERSONAL_SAVED_VIEW_CAPABILITY_V010,
    operationVersion:"0.1.0",
    title:effect==="READ"?"List my saved collection views":"Save my private collection view",
    description:effect==="READ"?
      "List only private views still authorized against the current source Collection and schema.":
      "Save a private view after the Host authorizes the WRITE and re-reads the current allowed business collection.",
    effect,dataScope:"ENTERPRISE",
    authorization:{action:effect==="READ"?"collection.saved-view.read":"collection.saved-view.write",
      resource:{type:"collection.saved-view.personal",idSource:"DATA_SCOPE"}},
    inputSchema:{type:"object",additionalProperties:false,
      ...(effect==="WRITE"?{required:["viewId","title","queryOperationId","expectedRevision"]}:{}),
      properties:effect==="READ"?
        {viewId:{type:"string",maxLength:80}}:{
          viewId:{type:"string",minLength:1,maxLength:80},
          title:{type:"string",minLength:1,maxLength:120},
          queryOperationId:{type:"string",minLength:1},
          query:{type:"object"},columns:{type:"array",items:{type:"string"},maxItems:20},
          presentation:{type:"string",enum:["table","list"]},
          expectedRevision:{anyOf:[{type:"integer",minimum:0},{type:"null"}]}
        }},
    outputSchema:{type:"object"},
    binding:{type:"ACTION_HOST",commandCode:op,inputVersion:"0.1.0"},
    exposure:["HUMAN","PERSONAL_AGENT"],
    ...(effect==="WRITE"?{writeSafety:{idempotency:"HOST_REQUIRED",receipt:"HOST_REQUIRED"}}:{})
  }};
}

/** Opt-in Feature only, never added to the production Host catalog automatically. */
export const personalSavedViewsOptInFeatureV010: FeatureManifestV010 = {
  contractVersion:"0.1.0",featureId:PERSONAL_SAVED_VIEW_FEATURE_V010,
  packageId:HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,version:"0.1.0",
  activationScope:"INSTALLATION",defaultActivation:true,
  providesCapabilities:[PERSONAL_SAVED_VIEW_CAPABILITY_V010],
  contributions:[operation(PERSONAL_SAVED_VIEW_READ_V010,"READ"),
    operation(PERSONAL_SAVED_VIEW_WRITE_V010,"WRITE")]
};

export function createPersonalSavedViewActionHandlersV010(input:{
  storage:EnterpriseResourceConditionalAsyncRepositoryV010;
  /**
   * Privileged Host adapter: invokes only currently authorized source
   * Collection READ via its real ActionRouter and current Principal/Context.
   * No domain row contents are persisted by Saved View.
   */
  readSource(ctx:PlatformRequestContextV010,operationId:string,query:SavedQuery):
    Promise<DataCollectionResultV010>;
  allowedSourceOperationIds: readonly string[];
  /**
   * Trust-bound Host-only issuance of exact material for the PostgreSQL Owner.
   * No action values / model input can supply an approval. The Owner commits
   * the immutable receipt and resource revision in the SAME PostgreSQL tx.
   * Until wired to the REAL Host receipt issuer, keep this feature unregistered.
   */
  issueHostWriteReceipt?(
    ctx:PlatformRequestContextV010,
    request:AppActionRequestV010,
    material:{input:EnterpriseResourceConditionalPutInputV010;inputDigest:string}
  ):Promise<AgentActionReceiptBeginInputV010>;
  now?:()=>Date;
}):AppActionHandler[] {
  const source = async (ctx:PlatformRequestContextV010,op:string,q:SavedQuery) => {
    if (!input.allowedSourceOperationIds.includes(op)) throw Error("SAVED_VIEW_SOURCE_NOT_ALLOWED");
    const result = resultData(await input.readSource(ctx,op,q));
    return result;
  };
  const store = input.storage;
  const requireStore=()=>{
    if(store.conditionalWriteConsistency!=="SHARED_POSTGRES_TRANSACTION"){
      throw Error("SAVED_VIEW_CERTIFIED_STORAGE_REQUIRED");
    }
  };
  const now=input.now??(()=>new Date());
  const execute=(op:string,run:(request:AppActionRequestV010,ctx:PlatformRequestContextV010)=>Promise<unknown>):AppActionHandler=>({
    packageId:HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    featureId:PERSONAL_SAVED_VIEW_FEATURE_V010,
    commandCode:op,
    async execute(request,ctx) {
      try {
        if(!ctx) throw Error("SAVED_VIEW_REQUEST_CONTEXT_REQUIRED");
        principalScope(ctx);
        requireStore();
        const data=await run(request,ctx);
        return {ok:true,correlationId:ctx.correlationId,
          result:JSON.parse(JSON.stringify({contractVersion:"0.1.0",data})) as JsonValue};
      } catch(e) {return errorResult(e,ctx);}
    }
  });
  const verified = async (ctx:PlatformRequestContextV010,d:SavedDefinition) => {
    const scope=principalScope(ctx);
    if(d.ownerSubjectId!==scope.subjectId || d.enterpriseId!==scope.enterpriseId){
      throw Error("SAVED_VIEW_OWNER_SCOPE_MISMATCH");
    }
    const current=await source(ctx,d.queryOperationId,d.query);
    if(d.collectionId!==current.collectionId || d.schemaRef!==current.schemaRef ||
      !Array.isArray(d.columns) || d.columns.some(c=>!current.readableFieldIds.includes(c))){
      throw Error("SAVED_VIEW_SOURCE_SCHEMA_CHANGED");
    }
    return d;
  };
  return [
    execute(PERSONAL_SAVED_VIEW_READ_V010,async (request,ctx)=>{
      if (Object.keys(request.values).some(k=>k!=="viewId")) {
        throw Error("SAVED_VIEW_INPUT_INVALID");
      }
      const rawId=request.values.viewId;
      if(rawId!==undefined){
        const id=viewId(rawId);
        const record=await store.get(address(ctx,id));
        if(!record || record.lifecycleState!=="ACTIVE") return {views:[]};
        try{
          const d=await verified(ctx,parseDefinition(record.payload));
          return {views:[{...d,revision:record.revision}]};
        }catch{return {views:[]};}
      }
      const a=address(ctx,"_read-prefix");
      const all=await store.list({
        contextId:a.contextId,namespace:a.namespace,
        collectionId:a.collectionId,resourceType:a.resourceType,
        lifecycleState:"ACTIVE"
      });
      if(all.length>100) throw Error("SAVED_VIEW_LIST_LIMIT_EXCEEDED");
      const views=[];
      for(const record of all){
        try{
          const d=await verified(ctx,parseDefinition(record.payload));
          views.push({...d,revision:record.revision});
        }catch{continue;}
      }
      return {views};
    }),
    execute(PERSONAL_SAVED_VIEW_WRITE_V010,async (request,ctx)=>{
      if (Object.keys(request.values).some(k=>![
        "viewId","title","queryOperationId","query","columns","presentation","expectedRevision"
      ].includes(k))) throw Error("SAVED_VIEW_INPUT_INVALID");
      if(!input.issueHostWriteReceipt || !store.putIfRevisionWithReceipt)
        throw Error("SAVED_VIEW_HOST_WRITE_RECEIPT_REQUIRED");
      const id=viewId(request.values.viewId);
      const title=requiredText(request.values.title,"SAVED_VIEW_TITLE_INVALID");
      const op=requiredText(request.values.queryOperationId,"SAVED_VIEW_SOURCE_NOT_ALLOWED",100);
      const query=queryValues(request.values.query);
      const expected=expectedRevision(request.values.expectedRevision);
      const presentation=request.values.presentation??"table";
      if(presentation!=="table" && presentation!=="list") throw Error("SAVED_VIEW_PRESENTATION_INVALID");
      const current=await source(ctx,op,query);
      const columns=columnsValue(request.values.columns,current.readableFieldIds);
      const scope=principalScope(ctx);
      const payload:SavedDefinition={
        contractVersion:"0.1.0",viewId:id,visibility:"PERSONAL",title,
        queryOperationId:op,collectionId:current.collectionId,
        schemaRef:current.schemaRef,query,columns,presentation,
        ownerSubjectId:scope.subjectId,enterpriseId:scope.enterpriseId
      };
      // Re-check current source READ before the commit, never persist rows.
      const latest=await source(ctx,op,query);
      if(latest.collectionId!==current.collectionId || latest.schemaRef!==current.schemaRef ||
        columns.some(column=>!latest.readableFieldIds.includes(column))){
        throw Error("SAVED_VIEW_SOURCE_SCHEMA_CHANGED");
      }
      const writeInput:EnterpriseResourceConditionalPutInputV010={
        ...address(ctx,id),schemaRef:"evo.saved-view.personal/0.1.0",
        ownerPackageId:HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,storageKind:"DOCUMENT",
        payload:payload as unknown as EnterpriseResourceJsonV010,
        expectedRevision:expected,
        actorSubjectId:ctx.principal.subjectId,recordedAt:now().toISOString()
      };
      const approval=await input.issueHostWriteReceipt(ctx,request,{
        input:writeInput,inputDigest:digestConditionalResourcePutV010(writeInput)
      });
      const committed=await store.putIfRevisionWithReceipt(writeInput,approval);
      const committedView=parseDefinition(committed.resource.payload);
      return {
        view:{...committedView,revision:committed.resource.revision},
        receipt:{
          receiptId:committed.receipt.receiptId,status:committed.receipt.status,
          resultDigest:committed.receipt.resultDigest
        },
        replayed:committed.replayed
      };
    })
  ];
}
