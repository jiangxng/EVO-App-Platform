import {
  TEMPLATE_STORE_COPY_COMMAND,
  TEMPLATE_STORE_PAGE_SOURCE,
  TEMPLATE_STORE_PREVIEW_2D_COMMAND
} from "./package.js";
import {
  templateStoreSeedTemplatesV010,
  type TemplateStoreEntryV010
} from "./templates.js";

export interface TemplateStorePageOptionsV010 {
  viewer2dAvailable?: boolean;
  locale?: string;
}

function localizedText(locale: string | undefined) {
  if ((locale ?? "").toLowerCase().startsWith("zh")) {
    return {
      title: "模板商店",
      description: "浏览共享模板。使用模板后会在企业上下文仓库中创建独立副本。",
      searchPlaceholder: "搜索模板",
      searchAriaLabel: "搜索模板",
      noResultsMessage: "没有匹配的模板。",
      emptyMessage: "暂无可用的共享模板。",
      preview: "预览",
      use: "使用模板",
      previewHelp: "使用 2D Viewer 只读查看模板，不会复制或修改企业上下文。",
      previewUnavailable: "未安装 2D Viewer 扩展插件，无法预览。",
      copyHelp: "在 Enterprise Context 仓库中创建独立副本。"
    };
  }
  return {
    title: "Template Store",
    description:
      "Browse shared templates. Using a template creates an independent copy in the Enterprise Context repository.",
    searchPlaceholder: "Search templates",
    searchAriaLabel: "Search templates",
    noResultsMessage: "No matching templates.",
    emptyMessage: "No shared templates are available.",
    preview: "Preview",
    use: "Use template",
    previewHelp:
      "Open a read-only preview in 2D Viewer without copying or modifying Enterprise Context.",
    previewUnavailable:
      "2D Viewer extension is not installed, so preview is unavailable.",
    copyHelp:
      "Creates an independent copy in the Enterprise Context repository."
  };
}

export function createTemplateStorePageV010(
  templates: TemplateStoreEntryV010[] = templateStoreSeedTemplatesV010,
  options: TemplateStorePageOptionsV010 = {}
) {
  const text = localizedText(options.locale);
  const viewer2dAvailable = options.viewer2dAvailable === true;

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-template-store",
    title: text.title,
    description: text.description,
    search: {
      placeholder: text.searchPlaceholder,
      ariaLabel: text.searchAriaLabel,
      noResultsMessage: text.noResultsMessage
    },
    items: templates.map(template => ({
      id: template.templateId,
      title: template.name,
      summary: template.description,
      thumbnail: template.thumbnail,
      primaryAction: {
        id: "copy",
        label: text.use,
        type: "command",
        command: TEMPLATE_STORE_COPY_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: true,
        helpText: text.copyHelp
      },
      secondaryActions: [{
        id: "preview-2d",
        label: text.preview,
        type: "command",
        command: TEMPLATE_STORE_PREVIEW_2D_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: false,
        enabled: viewer2dAvailable,
        ...(viewer2dAvailable
          ? { helpText: text.previewHelp }
          : {
              disabledReason: text.previewUnavailable,
              helpText: text.previewUnavailable
            })
      }]
    })),
    emptyMessage: text.emptyMessage
  } as const;
}

/**
 * Compatibility asset for tests and non-Host embedders.
 * Production Host resolves the page lazily after the plugin Feature is active.
 */
export const templateStoreExperienceAssets = new Map<string, unknown>([
  [TEMPLATE_STORE_PAGE_SOURCE, createTemplateStorePageV010()]
]);
