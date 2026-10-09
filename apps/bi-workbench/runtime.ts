import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  AppManagerService
} from "../../manager/service.js";
import {
  createPostgresPersonalWorkbenchStateStoreV010
} from "./postgres-store.js";
import {
  createWorkbenchServiceV010,
  type WorkbenchServiceV010
} from "./service.js";
import {
  createEnterpriseRoleWorkbenchDefaultRepositoryV010,
  createMemoryPersonalWorkbenchStateStoreV010
} from "./state.js";

export interface BiWorkbenchRuntimeV010 {
  service: WorkbenchServiceV010;
  close(): Promise<void>;
}

export async function createBiWorkbenchRuntimeV010(input: {
  manager: AppManagerService;
  enterpriseResources: EnterpriseResourceRepositoryV010;
  databaseUrl?: string;
  postgresSchema?: string;
  legacyPostgresSchema?: string;
  resolveRelationshipKind(
    context: PlatformRequestContextV010
  ): EnterpriseContextRelationshipKindV010 | undefined;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): Promise<BiWorkbenchRuntimeV010> {
  const enterpriseRoleDefaults =
    createEnterpriseRoleWorkbenchDefaultRepositoryV010(
      input.enterpriseResources
    );
  const personalState = input.databaseUrl
    ? await createPostgresPersonalWorkbenchStateStoreV010({
        connectionString: input.databaseUrl,
        ...(input.postgresSchema
          ? { schema: input.postgresSchema }
          : {}),
        ...(input.legacyPostgresSchema
          ? { legacySchema: input.legacyPostgresSchema }
          : {})
      })
    : createMemoryPersonalWorkbenchStateStoreV010();

  const service = createWorkbenchServiceV010({
    manager: input.manager,
    personalState,
    enterpriseRoleLayer({ contextId, relationshipKind }) {
      return enterpriseRoleDefaults.layer(contextId, relationshipKind);
    },
    resolveRelationshipKind: input.resolveRelationshipKind,
    resolveAuthorizationProvider: input.resolveAuthorizationProvider
  });

  return {
    service,
    async close() {
      if ("close" in personalState && typeof personalState.close === "function") {
        await personalState.close();
      }
    }
  };
}
