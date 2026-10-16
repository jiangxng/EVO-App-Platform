import type { EnterpriseResourceRepositoryV010 } from "../../contracts/enterprise-resource.js";
import type { AuthorizationProviderV010 } from "../../contracts/platform-services.js";
import type { ResponsibilityRepositoryV010 } from "../responsibility/repository.js";
import { createCounterpartyRepositoryV010 } from "./repository.js";
import { createCounterpartyRoleRepositoryV010 } from "./roles.js";
import { createCounterpartyContactRepositoryV010, createCounterpartyAddressRepositoryV010,
  createCounterpartyProfileRepositoryV010 } from "./facets.js";
import { createCounterpartyProjectionServiceV010 } from "./projection-service.js";
import { counterpartyCoreSchemaV010 } from "./foundation-object.js";

/** Domain adapters share the Host's existing enterprise resource authority.
 * They own no connections, timers or private durable data. */
export function createCounterpartyRuntimeV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  responsibilityRepository: ResponsibilityRepositoryV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}) {
  const repository = createCounterpartyRepositoryV010(input.resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(input.resources, repository);
  const facets = { resources: input.resources, counterpartyRepository: repository };
  return {
    repository, roleRepository,
    contactRepository: createCounterpartyContactRepositoryV010(facets),
    addressRepository: createCounterpartyAddressRepositoryV010(facets),
    profileRepository: createCounterpartyProfileRepositoryV010({ ...facets, roleRepository }),
    projectionService: createCounterpartyProjectionServiceV010({
      repository, roleRepository,
      responsibilityRepository: input.responsibilityRepository,
      resolveAuthorizationProvider: input.resolveAuthorizationProvider,
      fieldIds: () => counterpartyCoreSchemaV010.fields.map(field => field.fieldId)
    })
  };
}
export type CounterpartyRuntimeV010 = ReturnType<typeof createCounterpartyRuntimeV010>;
