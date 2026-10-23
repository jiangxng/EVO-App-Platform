import type { EnterpriseResourceRepositoryV010 } from "../../contracts/enterprise-resource.js";
import { createDataImportRepositoryV010 } from "./repository.js";
import { createDataImportRecipeRepositoryV010 } from "./recipe.js";
import { createHttpDataImportExperienceAdvisorV010 } from "./experience-advisor.js";

export function createDataImportRuntimeV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  advisor?: Parameters<typeof createHttpDataImportExperienceAdvisorV010>[0];
}) {
  return {
    repository: createDataImportRepositoryV010(input.resources),
    recipeRepository: createDataImportRecipeRepositoryV010(input.resources),
    ...(input.advisor ? {experienceAdvisor: createHttpDataImportExperienceAdvisorV010(input.advisor)} : {})
  };
}
export type DataImportRuntimeV010 = ReturnType<typeof createDataImportRuntimeV010>;
