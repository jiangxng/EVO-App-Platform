import type { AppActionHandler, AppActionExecutionResultV010, JsonValue } from "../../actions/contracts.js";
import type { PlatformPrincipalV010, PlatformRequestContextV010 } from "../../contracts/platform-services.js";
import type { OrganizationUnitV010 } from "../../contracts/reference-data/organization.js";
import {
  ORGANIZATION_DRAFT_COMMAND_V010 as DRAFT,
  ORGANIZATION_LIST_COMMAND_V010 as LIST,
  ORGANIZATION_PUBLISH_COMMAND_V010 as PUBLISH,
  ORGANIZATION_RESOLVE_COMMAND_V010 as RESOLVE,
  ORGANIZATION_FEATURE_ID_V010 as FEATURE,
  ORGANIZATION_PACKAGE_ID_V010 as PACKAGE
} from "../../contracts/reference-data/organization.js";
import type { OrganizationRepositoryV010 } from "./repository.js";

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}
function version(v: unknown): number {
  if (!Number.isSafeInteger(v) || (v as number)<0) throw new Error("ORGANIZATION_VERSION_INVALID");
  return v as number;
}
function active(context: PlatformRequestContextV010 | undefined): string {
  const current=context?.context?.activeContext;
  if (!context || current?.kind!=="ENTERPRISE" || !current.contextId ||
      !current.enterpriseId || context.scope.enterpriseId!==current.enterpriseId) {
    throw new Error("ORGANIZATION_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return current.contextId;
}
function failure(e: unknown, context?: PlatformRequestContextV010):
  AppActionExecutionResultV010 {
  const code=e instanceof Error?e.message:"ORGANIZATION_ACTION_FAILED";
  return {ok:false,...(context?.correlationId?{correlationId:context.correlationId}:{}),
    error:{code,message:code}};
}

export function createOrganizationActionHandlersV010(input: ({
  repository: OrganizationRepositoryV010
} | {
  resolveRepository(): Promise<OrganizationRepositoryV010>
}) & {
  canRead(principal:PlatformPrincipalV010,contextId:string):boolean;
  canManage(principal:PlatformPrincipalV010,contextId:string):boolean;
  now?:()=>Date;
}):AppActionHandler[] {
  const now=input.now??(()=>new Date());
  const handler=(commandCode:string,write:boolean,
    command:(repo:OrganizationRepositoryV010,context:PlatformRequestContextV010,
      contextId:string,values:Record<string,JsonValue>)=>unknown):AppActionHandler=>({
    packageId:PACKAGE,featureId:FEATURE,commandCode,
    async execute(request,context){
      try{
        const contextId=active(context);
        const check=()=> (write?input.canManage:input.canRead)(context!.principal,contextId);
        if(!check())throw new Error("ORGANIZATION_PERMISSION_DENIED");
        const repo="resolveRepository" in input?await input.resolveRepository():input.repository;
        if(!check())throw new Error("ORGANIZATION_PERMISSION_DENIED");
        const data=command(repo,context!,contextId,request.values);
        return {ok:true,correlationId:context!.correlationId,
          result:JSON.parse(JSON.stringify({contractVersion:"0.1.0",data})) as JsonValue};
      }catch(e){return failure(e,context)}
    }
  });
  return [
    handler(LIST,false,(repo,_ctx,id,values)=>
      values.organizationId?repo.get(id,required(values.organizationId,"ORGANIZATION_ID_REQUIRED")):repo.list(id)),
    handler(DRAFT,true,(repo,ctx,id,values)=>repo.saveDraft({
      contextId:id,organizationId:required(values.organizationId,"ORGANIZATION_ID_REQUIRED"),
      expectedVersion:version(values.expectedVersion),
      units:Array.isArray(values.units)
        ?values.units as unknown as OrganizationUnitV010[]
        :(()=>{throw new Error("ORGANIZATION_UNITS_REQUIRED")})(),
      actorSubjectId:ctx.principal.subjectId,recordedAt:now().toISOString()
    })),
    handler(PUBLISH,true,(repo,ctx,id,values)=>{
      if(ctx.principal.actorType!=="HUMAN")throw new Error("ORGANIZATION_PUBLISH_HUMAN_REQUIRED");
      return repo.publish({
        contextId:id,organizationId:required(values.organizationId,"ORGANIZATION_ID_REQUIRED"),
        expectedVersion:version(values.expectedVersion),
        actorSubjectId:ctx.principal.subjectId,actorType:"HUMAN",recordedAt:now().toISOString()
      });
    }),
    handler(RESOLVE,false,(repo,_ctx,id,values)=>repo.resolveBatch({
      contextId:id,organizationId:required(values.organizationId,"ORGANIZATION_ID_REQUIRED"),
      ...(values.expectedVersion===undefined?{}:{expectedVersion:version(values.expectedVersion)}),
      sourceValues:Array.isArray(values.sourceValues)&&
        values.sourceValues.every(x=>typeof x==="string")
          ?values.sourceValues as string[]
          :(()=>{throw new Error("ORGANIZATION_SOURCE_VALUES_INVALID")})(),
      ...(values.effectiveAt?{effectiveAt:required(values.effectiveAt,"ORGANIZATION_EFFECTIVE_AT_INVALID")}:{})
    }))
  ];
}
