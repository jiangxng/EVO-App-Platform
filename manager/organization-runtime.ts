import { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import type { EnterpriseResourceRepositoryV010 } from "../contracts/enterprise-resource.js";
import type {
  OrganizationRepositoryV010, createOrganizationRepositoryV010
} from "../apps/organization/repository.js";

/** Optional organization owner loaded only on actual authorized activity. */
export function createOrganizationRuntimeHostV010(input:{
  isActive():boolean;
  resources:EnterpriseResourceRepositoryV010;
  loadFactory?:()=>Promise<typeof createOrganizationRepositoryV010>;
}){
  let generation=0;
  const lease=createLazyProviderRuntimeV010<OrganizationRepositoryV010>({
    isActive:input.isActive,
    async load(){
      const current=generation;
      const factory=await(input.loadFactory?input.loadFactory()
        :import("../apps/organization/repository.js").then(x=>x.createOrganizationRepositoryV010));
      const check=()=>{
        if(current!==generation||!input.isActive()||lease.diagnostics().blocked){
          throw new Error("PROVIDER_NOT_ACTIVE_OR_STOPPING");
        }
      };
      check();
      const repo=factory(input.resources);
      return{
        list(...args){check();return repo.list(...args);},
        get(...args){check();return repo.get(...args);},
        getEffective(...args){check();return repo.getEffective(...args);},
        history(...args){check();return repo.history(...args);},
        saveDraft(...args){check();return repo.saveDraft(...args);},
        publish(...args){check();return repo.publish(...args);},
        resolveBatch(...args){check();return repo.resolveBatch(...args);}
      };
    }
  });
  return {resolve:()=>lease.run(async repo=>repo),
    stop(){generation++;return lease.stop();},
    diagnostics:lease.diagnostics};
}
