import type { AppActionRequestV010, AppActionExecutionResultV010, JsonValue }
  from "../actions/contracts.js";
import type { AppActionRouter } from "../actions/router.js";
import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import type { UidlFormV011 } from "../vendor/eidos/src/runtime/contracts.js";
import {
  businessDictionaryDirectoryQueryRouteV010,
  parseBusinessDictionaryDirectoryRouteV010,
  type BusinessDictionaryDirectorySelectionV010
} from "../apps/business-dictionary/directory-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010
} from "../apps/business-dictionary/collection-query.js";
import { BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010 }
  from "../apps/business-dictionary/constants.js";
import { PERSONAL_SAVED_VIEW_WRITE_V010 }
  from "../providers/enterprise-context/personal-saved-views.js";

/**
 * C3-02 isolated Human Eidos form -> existing Capability Operation.
 * Not registered as an experience page/Host action or enabled by the
 * production server. A production caller must first certify Postgres,
 * Host signing keys, Feature lifecycle and actual identity/enterprise.
 */
export const CV03_HUMAN_SAVED_VIEW_FORM_ID_V010 =
  "evo-business-dictionary.personal-view.new" as const;
const ownerColumns = [
  "displayName","dictionaryId","state","version","optionCount"
] as const;
const viewIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/;

function requireHumanEnterprise(ctx?: PlatformRequestContextV010) {
  const active=ctx?.context?.activeContext;
  if (!ctx || ctx.delegatedActor || ctx.principal.actorType!=="HUMAN" ||
    !ctx.principal.subjectId?.trim() ||
    active?.kind!=="ENTERPRISE" ||
    !active.contextId?.trim() || !active.enterpriseId?.trim() ||
    ctx.scope.enterpriseId!==active.enterpriseId ||
    (ctx.scope.userId && ctx.scope.userId!==ctx.principal.subjectId) ||
    (ctx.context?.personalContext?.ownerSubjectId &&
      ctx.context.personalContext.ownerSubjectId!==ctx.principal.subjectId)) {
    throw Error("CV03_HUMAN_FORM_ENTERPRISE_CONTEXT_REQUIRED");
  }
}
function boundedDirectory(route:string):BusinessDictionaryDirectorySelectionV010 {
  const selection=parseBusinessDictionaryDirectoryRouteV010(route);
  // Source may be a previously selected private view. "Save as" creates a
  // NEW private view from currently visible bounded filters, not an update.
  return {view:selection.view,query:selection.query};
}

export function createCv03PersonalSavedViewHumanFormV010(input:{
  viewId:string;
  currentDirectoryRoute:string;
  locale?:string;
}):UidlFormV011 {
  if(!viewIdPattern.test(input.viewId))throw Error("CV03_HUMAN_FORM_VIEW_ID_INVALID");
  const selection=boundedDirectory(input.currentDirectoryRoute);
  const returnTo=businessDictionaryDirectoryQueryRouteV010(selection,selection.query.page??0);
  const zh=input.locale?.toLowerCase().startsWith("zh");
  return {
    contractVersion:"0.1.1",kind:"form",
    id:CV03_HUMAN_SAVED_VIEW_FORM_ID_V010,
    title:zh?"将当前筛选保存为我的视图":"Save current filters as my view",
    description:zh
      ?"保存当前列表的筛选与排序，供下次快速打开。仅你本人可见；保存前会重新检查企业权限和可读字段。"
      :"Save the current list filters and sort for your own use. The Host rechecks enterprise permissions and readable fields.",
    purpose:"execute-command",
    contextNavigation:{items:[
      {id:"dictionary",label:zh?"业务字典":"Business dictionaries",route:returnTo},
      {id:"new-private-view",label:zh?"保存我的视图":"Save my view"}
    ]},
    command:{code:PERSONAL_SAVED_VIEW_WRITE_V010,inputVersion:"0.1.0"},
    fields:[
      {key:"title",label:zh?"视图名称":"View name",semanticType:"saved-view.title",
        control:"text",required:true,validation:{pattern:".{1,120}"}},
      {key:"viewId",label:"View ID",semanticType:"saved-view.id",
        control:"text",required:true,hidden:true,initialValue:input.viewId},
      {key:"returnTo",label:"Return to",semanticType:"saved-view.return-route",
        control:"text",required:true,hidden:true,initialValue:returnTo}
    ],
    actions:[{id:"save-personal-view",label:zh?"保存为我的视图":"Save my view",
      type:"submit",command:PERSONAL_SAVED_VIEW_WRITE_V010,
      requiresConfirmation:true}],
    metadata:{ownerPackageId:"host-enterprise-context-provider",
      visibility:"PERSONAL",sourceOperationId:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010}
  };
}

/**
 * Accept only an Eidos Human form shape and resolve the structured business
 * query + readable columns via the REAL current Domain Owner READ, then call
 * the EXISTING Saved View WRITE Operation. The original signed PG Owner is
 * solely responsible for durable receipt/CAS and unknown-ACK reconciliation.
 */
export async function executeCv03HumanSavedViewFormV010(input:{
  router:AppActionRouter;
  request:AppActionRequestV010;
  context?:PlatformRequestContextV010;
}):Promise<AppActionExecutionResultV010> {
  try {
    const {router,request,context}=input;
    requireHumanEnterprise(context);
    if(request.contractVersion!=="0.1.0" || request.type!=="command" ||
      request.command.code!==PERSONAL_SAVED_VIEW_WRITE_V010 ||
      request.command.inputVersion!=="0.1.0" ||
      request.actionId!=="save-personal-view" ||
      !request.sourceInteractionId?.trim() ||
      request.requiresConfirmation!==true ||
      Object.keys(request.values).some(k=>!["title","viewId","returnTo"].includes(k))) {
      throw Error("CV03_HUMAN_FORM_ACTION_INVALID");
    }
    const {title,viewId,returnTo}=request.values;
    if(typeof title!=="string" || !title.trim() || title.trim().length>120 ||
      typeof viewId!=="string" || !viewIdPattern.test(viewId) ||
      typeof returnTo!=="string" || returnTo.length>650) {
      throw Error("CV03_HUMAN_FORM_FIELDS_INVALID");
    }
    const selection=boundedDirectory(returnTo);
    const sourceQuery={
      view:selection.view,
      ...(selection.query.search ? {search:selection.query.search}:{}),
      ...(selection.query.sort ? {sort:selection.query.sort}:{}),
      ...(selection.query.direction ? {direction:selection.query.direction}:{})
    };
    const data=await router.execute({
      contractVersion:"0.1.0",type:"command",
      command:{code:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,inputVersion:"0.1.0"},
      values:{...sourceQuery,page:0,pageSize:10},
      sourceInteractionId:request.sourceInteractionId,
      actionId:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
      requiresConfirmation:false
    },context);
    if(!data.ok || !data.result ||
      typeof data.result!=="object" || Array.isArray(data.result)) {
      throw Error("CV03_HUMAN_FORM_SOURCE_READ_DENIED");
    }
    const collection=(data.result as Record<string,unknown>).data;
    if(!collection || typeof collection!=="object" || Array.isArray(collection)) {
      throw Error("CV03_HUMAN_FORM_SOURCE_READ_DENIED");
    }
    const projection=collection as Record<string,unknown>;
    if(projection.collectionId!==BUSINESS_DICTIONARY_COLLECTION_ID_V010 ||
      projection.schemaRef!==BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010 ||
      !Array.isArray(projection.readableFieldIds)) {
      throw Error("CV03_HUMAN_FORM_SOURCE_SCHEMA_INVALID");
    }
    const columns=ownerColumns.filter(id=>projection.readableFieldIds.includes(id));
    if(!columns.includes("displayName") || !columns.includes("dictionaryId")) {
      throw Error("CV03_HUMAN_FORM_COLUMNS_UNAVAILABLE");
    }
    // No arbitrary SQL or column list from the browser; the signed owner
    // READ is the source of the field projection and all business rows.
    const canonical:AppActionRequestV010={
      contractVersion:"0.1.0",type:"command",
      command:{code:PERSONAL_SAVED_VIEW_WRITE_V010,inputVersion:"0.1.0"},
      values:{
        viewId,title:title.trim(),
        queryOperationId:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
        query:sourceQuery as JsonValue,columns:[...columns],
        presentation:"table",expectedRevision:null
      },
      sourceInteractionId:request.sourceInteractionId,
      actionId:PERSONAL_SAVED_VIEW_WRITE_V010,
      requiresConfirmation:true
    };
    const saved=await router.execute(canonical,context);
    if(!saved.ok)return saved;
    const payload=saved.result && typeof saved.result==="object" &&
      !Array.isArray(saved.result) ? saved.result as Record<string,JsonValue> : {};
    const writeData=payload.data && typeof payload.data==="object" &&
      !Array.isArray(payload.data) ? payload.data as Record<string,JsonValue> : {};
    const view=writeData.view && typeof writeData.view==="object" &&
      !Array.isArray(writeData.view) ? writeData.view as Record<string,JsonValue> : {};
    if(view.viewId!==viewId || view.visibility!=="PERSONAL") {
      throw Error("CV03_HUMAN_FORM_WRITE_OUTCOME_UNVERIFIED");
    }
    const navigateTo=businessDictionaryDirectoryQueryRouteV010({
      ...selection,personalViewId:viewId
    },0);
    // Eidos already supports navigateTo after a successful Host Action.
    // On navigation the GET page must REAUTHORIZE the saved view, not trust
    // the route hint or this response as a permission grant.
    return {...saved,result:{...payload,navigateTo}};
  } catch(e) {
    const code=e instanceof Error?e.message:"CV03_HUMAN_FORM_UNEXPECTED";
    return {ok:false,...(input.context?{correlationId:input.context.correlationId}:{}),
      error:{code,message:code}};
  }
}
