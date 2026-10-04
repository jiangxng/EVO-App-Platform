import {
  TEMPLATE_STORE_PAGE_SOURCE
} from "./package.js";
import {
  templateStoreSeedTemplatesV010,
  type TemplateStoreEntryV010
} from "./templates.js";

export function createTemplateStorePageV010(
  templates: TemplateStoreEntryV010[] = templateStoreSeedTemplatesV010
) {
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-template-store",
    title: "Template Store",
    description:
      "Browse shared templates. Copy semantics are independent: copied content becomes enterprise-owned.",
    search: {
      placeholder: "Search templates",
      ariaLabel: "Search templates",
      noResultsMessage: "No matching templates."
    },
    items: templates.map(template => ({
      id: template.templateId,
      title: template.name,
      summary: template.description,
      thumbnail: template.thumbnail,
      primaryAction: {
        id: "copy",
        label: "Use template",
        type: "command",
        command: "evo-template-store.copy",
        inputVersion: "0.1.0",
        requiresConfirmation: true,
        helpText:
          "Creates an independent copy in the Enterprise Context repository."
      }
    })),
    emptyMessage: "No shared templates are available."
  } as const;
}

export const templateStoreExperienceAssets = new Map<string, unknown>([
  [TEMPLATE_STORE_PAGE_SOURCE, createTemplateStorePageV010()]
]);
