import type {
  TemplatePublicationProviderV010
} from "../../contracts/template-publication.js";
import type {
  TemplateStoreRepositoryV010
} from "./repository.js";

export const TEMPLATE_STORE_PUBLICATION_PROVIDER_ID =
  "evo-template-store.publication" as const;

export function createTemplateStorePublicationProviderV010(
  repository: TemplateStoreRepositoryV010
): TemplatePublicationProviderV010 {
  return {
    providerId: TEMPLATE_STORE_PUBLICATION_PROVIDER_ID,
    publish(input) {
      const record = repository.publish({
        templateId: input.templateId,
        bundle: input.bundle,
        publishedAt: input.publishedAt
      });
      return {
        templateId: record.templateId,
        version: record.version,
        publishedAt: record.publishedAt
      };
    }
  };
}
