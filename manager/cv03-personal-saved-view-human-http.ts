import type {IncomingMessage, ServerResponse} from "node:http";
import type {AppActionRequestV010} from "../actions/contracts.js";
import type {AppActionRouter} from "../actions/router.js";
import type {PlatformRequestContextV010} from "../contracts/platform-services.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../apps/business-dictionary/directory-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010
} from "../apps/business-dictionary/collection-query.js";
import { BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010 }
  from "../apps/business-dictionary/constants.js";
import {
  assertCv03HumanEnterpriseContextV010,
  createCv03PersonalSavedViewHumanFormV010,
  executeCv03HumanSavedViewFormV010
} from "./cv03-personal-saved-view-human-form.js";

/**
 * Explicitly opt-in, isolated HTTP composition harness. This is NOT
 * registered in manager/server.ts and is not an alternative production
 * identity/Host/Plugin Framework. The trusted Host supplies a fresh
 * authenticated context: never derive a Principal from a request body.
 */
export const CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010 =
  "app://evo-business-dictionary/pages/personal-view-new" as const;

type HttpOutput = {code:string;message?:string} | Record<string,unknown>;

function reply(res:ServerResponse,status:number,body:HttpOutput) {
  res.statusCode=status;
  res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("cache-control","private, no-store");
  res.setHeader("vary","authorization");
  res.end(JSON.stringify(body));
}
function assertResponseScope(ctx?:PlatformRequestContextV010) {
  assertCv03HumanEnterpriseContextV010(ctx);
}
async function requestBody(request:IncomingMessage):Promise<unknown> {
  const chunks:Buffer[]=[];
  let bytes=0;
  for await(const part of request) {
    const data=Buffer.isBuffer(part)?part:Buffer.from(part);
    bytes+=data.length;
    if(bytes>16*1024)throw Error("CV03_HUMAN_HTTP_BODY_TOO_LARGE");
    chunks.push(data);
  }
  let value:unknown;
  try { value=JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Error("CV03_HUMAN_HTTP_JSON_REQUIRED"); }
  if(!value || typeof value!=="object" || Array.isArray(value))
    throw Error("CV03_HUMAN_HTTP_ACTION_INVALID");
  return value;
}

export function createCv03IsolatedHumanHttpHandlerV010(input:{
  router:AppActionRouter;
  /**
   * Caller-provided real Host identity/enterprise resolver, never built from
   * HTTP headers or body by this adapter. Throw on missing/expired login.
   */
  resolveContext(request:IncomingMessage):Promise<PlatformRequestContextV010>;
  /** OFF unless expressly approved for disposable isolated tests. */
  isEnabled():boolean;
  /** Trusted Host generator, e.g. randomUUID; not client-controlled. */
  newViewId():string;
}):(request:IncomingMessage,response:ServerResponse)=>Promise<boolean> {
  return async (request,response)=>{
    const url=new URL(request.url??"/","http://localhost");
    const isForm=request.method==="GET" &&
      url.pathname==="/v1/experience-pages" &&
      url.searchParams.get("source")===CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010;
    const isAction=request.method==="POST" && url.pathname==="/v1/actions";
    if(!isForm&&!isAction)return false;
    if(!input.isEnabled()){
      reply(response,404,{code:"CV03_HUMAN_HTTP_NOT_ENABLED"});
      return true;
    }
    if(isForm && (
      [...url.searchParams.keys()].some(x=>!["source","route","locale"].includes(x)) ||
      url.searchParams.getAll("source").length!==1 ||
      url.searchParams.getAll("route").length!==1 ||
      url.searchParams.getAll("locale").length>1
    )){
      reply(response,400,{code:"CV03_HUMAN_HTTP_ROUTE_INVALID"});
      return true;
    }
    if(isAction && (
      url.search || !request.headers["content-type"]?.toLowerCase()
        .startsWith("application/json")
    )){
      reply(response,415,{code:"CV03_HUMAN_HTTP_JSON_REQUIRED"});
      return true;
    }
    let context:PlatformRequestContextV010;
    try{
      context=await input.resolveContext(request);
      assertResponseScope(context);
    }catch{
      reply(response,403,{code:"CV03_HUMAN_HTTP_AUTHENTICATION_REQUIRED"});
      return true;
    }
    if(isForm){
      try{
        const path=url.searchParams.get("route");
        if(!path)throw Error("CV03_HUMAN_HTTP_ROUTE_REQUIRED");
        const selection=parseBusinessDictionaryDirectoryRouteV010(path);
        // The form is not a permission grant. An existing Domain Owner READ
        // must succeed for the same currently authenticated Principal.
        const source=await input.router.execute({
          contractVersion:"0.1.0",type:"command",
          command:{code:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
            inputVersion:"0.1.0"},
          values:{
            view:selection.view,
            ...(selection.query.search?{search:selection.query.search}:{}),
            ...(selection.query.sort?{sort:selection.query.sort}:{}),
            ...(selection.query.direction?{direction:selection.query.direction}:{}),
            page:0,pageSize:10
          },
          actionId:BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
          sourceInteractionId:"cv03-human-http-form-read:"+context.correlationId,
          requiresConfirmation:false
        },context);
        const data=source.result && typeof source.result==="object" &&
          !Array.isArray(source.result)
          ? (source.result as Record<string,unknown>).data
          : undefined;
        if(!source.ok || !data || typeof data!=="object" ||
          Array.isArray(data) ||
          (data as Record<string,unknown>).collectionId!==BUSINESS_DICTIONARY_COLLECTION_ID_V010 ||
          (data as Record<string,unknown>).schemaRef!==BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010){
          reply(response,403,{code:"CV03_HUMAN_HTTP_SOURCE_READ_DENIED"});
          return true;
        }
        const form=createCv03PersonalSavedViewHumanFormV010({
          viewId:input.newViewId(),currentDirectoryRoute:path,
          locale:url.searchParams.get("locale")??undefined
        });
        reply(response,200,form);
      }catch{
        reply(response,400,{code:"CV03_HUMAN_HTTP_ROUTE_INVALID"});
      }
      return true;
    }
    try {
      const action=await requestBody(request) as AppActionRequestV010;
      const result=await executeCv03HumanSavedViewFormV010({
        router:input.router,request:action,context
      });
      reply(response,200,result);
    }catch(error){
      const code=error instanceof Error?error.message:"CV03_HUMAN_HTTP_FAILURE";
      reply(response,code==="CV03_HUMAN_HTTP_BODY_TOO_LARGE"?413:400,{code});
    }
    return true;
  };
}
