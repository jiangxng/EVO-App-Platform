import type {AppManagerService} from "./service.js";
import type {AuthorizationProviderV010,PlatformPrincipalV010,
  PlatformRequestContextV010,ResolvedContextSetV010} from "../contracts/platform-services.js";
import type {EnterpriseResourceRepositoryV010} from "../contracts/enterprise-resource.js";
import type {AgentTrustedOwnerBindingV040} from "./agent-trusted-owner-registration.js";
import {createHostRegisteredAgentOwnerRegistryV040} from "./agent-trusted-owner-registration.js";
import {listAuthorizedCapabilityOperationsV010} from "./capability-operation-access.js";
import {personalAgentCapabilityRequestContextV010} from
  "../agents/enterprise-agent/capability-fabric-tools.js";
import {assertObjectExtensionDefinitionV010,
  type ObjectExtensionDefinitionV010} from "../contracts/foundation-object/extension.js";
import {OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010} from "../apps/object-extension/constants.js";
import {OBJECT_EXTENSION_NAMESPACE_V010} from "../apps/object-extension/repository.js";

/**
 * PA-02 DEVELOPMENT SANDBOX ONLY.
 *
 * Host owns a single installed Object Extension Owner registration. Ordinary
 * Personal Agent capability search remains unchanged, but a specifically
 * authorized, isolated enterprise can expose one direct governed WRITE tool
 * to the Fenced Worker. No source file migrations or application Provider
 * swaps occur. Human file-store operations remain outside this sandbox proof.
 */
export interface Pa02SandboxObjectOwnerV010 {
  binding:AgentTrustedOwnerBindingV040;
  isAuthorized(input:{
    principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010;
  }):Promise<boolean>;
  close():Promise<void>;
}

export async function createOptionalPa02SandboxObjectOwnerV010(
  env:Record<string,string|undefined>,
  deps:{
    manager:AppManagerService;
    resolveAuthorizationProvider():AuthorizationProviderV010|undefined;
    resources:EnterpriseResourceRepositoryV010;
  }
):Promise<Pa02SandboxObjectOwnerV010|undefined> {
  const mode=env.APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE?.trim().toUpperCase()||"OFF";
  if(mode!=="OWNER_SANDBOX")return undefined;
  if(env.NODE_ENV==="production"||
    env.APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK!=="ISOLATED_NO_PRODUCTION_DATA")
    throw Error("PA02_HOST_OBJECT_SANDBOX_NOT_ADMITTED");
  const contextId=env.APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_CONTEXT_ID?.trim();
  const enterpriseId=env.APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_ENTERPRISE_ID?.trim();
  const schema=env.APP_PLATFORM_AGENT_RUN_PA02_OBJECT_SCHEMA?.trim();
  const url=env.APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL?.trim();
  if(!contextId?.startsWith("pa02-sandbox:")||
    !enterpriseId?.startsWith("pa02-sandbox:")||
    !schema||!/^pa02_[a-z0-9_]{1,58}$/.test(schema)||
    schema===env.APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA||
    !url)
    throw Error("PA02_HOST_OBJECT_SANDBOX_SCOPE_INVALID");
  // Do not shadow any existing Human/file Object Extension definitions.
  // This guard is a development admission check, NOT a production Provider
  // cutover / ongoing two-writer lock.
  const assertEmptyFileAuthority=()=>{
    if(deps.resources.list({contextId,namespace:OBJECT_EXTENSION_NAMESPACE_V010}).length)
      throw Error("PA02_HOST_OBJECT_SANDBOX_FILE_AUTHORITY_CONFLICT");
  };
  assertEmptyFileAuthority();
  const {createPostgresObjectExtensionAtomicOwnerV010}=await import(
    "../apps/object-extension/agent-owner-postgres.js"
  );
  const owner=createPostgresObjectExtensionAtomicOwnerV010({
    connectionString:url,schema
  });
  try{
    // Fail startup if explicit isolated Owner schema has not been prepared.
    // No CREATE/ALTER/migration inside ordinary Server bootstrap.
    await owner.listResources({contextId,enterpriseId});
    const registry=createHostRegisteredAgentOwnerRegistryV040({
      manager:deps.manager,
      resolveAuthorizationProvider:deps.resolveAuthorizationProvider,
      registrations:[{
        operationId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
        packageId:OBJECT_EXTENSION_PACKAGE_ID,
        commandCode:OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
        inputVersion:"0.1.0",modelName:"pa02_object_extension_create",
        owner:owner.owner,verifier:owner.verifier,
        validateArguments(args) {
          if(!args||Object.keys(args).length!==1||
            !args.definition||typeof args.definition!=="object"||
            Array.isArray(args.definition))return false;
          try{
            assertObjectExtensionDefinitionV010(args.definition as ObjectExtensionDefinitionV010);
            return true;
          }catch{return false;}
        }
      }]
    });
    const binding=registry.resolve(OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010);
    if(!binding)throw Error("PA02_HOST_OBJECT_SANDBOX_OPERATION_NOT_INSTALLED");
    const exactScope=(i:{
      principal:PlatformPrincipalV010;context:ResolvedContextSetV010;
      requestContext?:PlatformRequestContextV010;
    })=>{
      const current=i.context.activeContext,request=i.requestContext;
      return current.kind==="ENTERPRISE" &&
        current.contextId===contextId &&
        current.enterpriseId===enterpriseId &&
        request?.contractVersion==="0.1.0" &&
        !request.delegatedActor &&
        request.principal.subjectId===i.principal.subjectId &&
        request.principal.actorType===i.principal.actorType &&
        request.context?.activeContext.kind==="ENTERPRISE" &&
        request.context.activeContext.contextId===contextId &&
        request.context.activeContext.enterpriseId===enterpriseId &&
        request.scope.enterpriseId===enterpriseId;
    };
    const authorize=binding.authorize;
    const guarded:AgentTrustedOwnerBindingV040={
      ...binding,
      async authorize(input){
        if(!exactScope(input))return false;
        try{assertEmptyFileAuthority();}
        catch{return false;}
        return authorize(input);
      }
    };
    return {
      binding:guarded,
      async isAuthorized(input) {
        if(!exactScope(input)||!input.requestContext)return false;
        try{
          assertEmptyFileAuthority();
          const active=registry.resolve(OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010);
          if(!active)return false;
          const catalog=await listAuthorizedCapabilityOperationsV010({
            manager:deps.manager,
            authorizationProvider:deps.resolveAuthorizationProvider(),
            requestContext:personalAgentCapabilityRequestContextV010({
              ...input.requestContext,context:input.context
            }),
            audience:"PERSONAL_AGENT"
          });
          return catalog.operations.some(o=>
            o.operationId===binding.descriptor.id &&
            o.packageId===binding.descriptor.ownerPackageId &&
            o.effect==="WRITE"&&o.capability===binding.descriptor.capability);
        }catch{return false;}
      },
      close:owner.close
    };
  }catch(error){await owner.close();throw error;}
}
