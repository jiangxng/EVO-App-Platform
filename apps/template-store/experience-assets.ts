import {
  TEMPLATE_STORE_COPY_COMMAND,
  TEMPLATE_STORE_DETAIL_PAGE_SOURCE,
  TEMPLATE_STORE_DOWNLOAD_COMMAND,
  TEMPLATE_STORE_OPEN_DETAIL_COMMAND,
  TEMPLATE_STORE_PAGE_SOURCE,
  TEMPLATE_STORE_PREVIEW_2D_COMMAND
} from "./package.js";
import {
  templateStoreSeedTemplatesV010,
  type TemplateStoreEntryV010,
  type TemplateStoreThumbnailV010
} from "./templates.js";
import type {
  TemplateStoreRecordV010
} from "./repository.js";
import type {
  TemplateProjectionGalleryV010
} from "../../contracts/template-projection-gallery.js";

export interface TemplateStorePageOptionsV010 {
  viewer2dAvailable?: boolean;
  locale?: string;
}

export interface TemplateStoreCatalogEntryV010 {
  templateId: string;
  name: string;
  description: string;
  thumbnail: TemplateStoreThumbnailV010;
  projectionGallery?: TemplateProjectionGalleryV010;
  version?: number;
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
      details: "详情",
      preview: "预览",
      download: "下载",
      use: "使用模板",
      projectionCount: "投影数量",
      detailHelp: "查看模板版本与可交互的 2D 投影。",
      previewHelp: "使用 2D Viewer 只读查看模板，不会复制或修改企业上下文。",
      previewUnavailable: "未安装 2D Viewer 扩展插件，无法预览。",
      copyHelp: "在 Enterprise Context 仓库中创建独立副本。",
      downloadHelp: "下载此不可变模板版本的完整 EVO Template Package，包含全部可交互投影。",
      openProjection: "使用 2D Viewer 查看投影"
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
    details: "Details",
    preview: "Preview",
    download: "Download",
    use: "Use template",
    projectionCount: "Projections",
    detailHelp: "Inspect this immutable template version and its interactive 2D projections.",
    previewHelp:
      "Open a read-only preview in 2D Viewer without copying or modifying Enterprise Context.",
    previewUnavailable:
      "2D Viewer extension is not installed, so preview is unavailable.",
    copyHelp:
      "Creates an independent copy in the Enterprise Context repository.",
    downloadHelp:
      "Download this immutable template version as a complete EVO Template Package including all interactive projections.",
    openProjection: "Open projection in 2D Viewer"
  };
}

export function createTemplateStoreCatalogEntriesV010(
  records: readonly TemplateStoreRecordV010[]
): TemplateStoreCatalogEntryV010[] {
  return records.map(record => ({
    templateId: record.templateId,
    name: record.bundle.listing.name,
    description: record.bundle.listing.description ?? "",
    thumbnail: { ...record.bundle.listing.thumbnail },
    ...(record.bundle.definition.projectionGallery
      ? {
          projectionGallery: structuredClone(
            record.bundle.definition.projectionGallery
          )
        }
      : {}),
    version: record.version
  }));
}

export function createTemplateStorePageV010(
  templates: readonly TemplateStoreCatalogEntryV010[] =
    templateStoreSeedTemplatesV010 satisfies readonly TemplateStoreEntryV010[],
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
      ...(template.version
        ? { version: `v${template.version}` }
        : {}),
      ...(template.projectionGallery
        ? {
            metadata: {
              [text.projectionCount]:
                template.projectionGallery.projections.length
            }
          }
        : {}),
      primaryAction: {
        id: "copy",
        label: text.use,
        type: "command",
        command: TEMPLATE_STORE_COPY_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: true,
        ...(template.version
          ? { values: { templateVersion: template.version } }
          : {}),
        helpText: text.copyHelp
      },
      secondaryActions: [{
        id: "detail",
        label: text.details,
        type: "command",
        command: TEMPLATE_STORE_OPEN_DETAIL_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: false,
        ...(template.version
          ? { values: { templateVersion: template.version } }
          : {}),
        helpText: text.detailHelp
      }, {
        id: "preview-2d",
        label: text.preview,
        type: "command",
        command: TEMPLATE_STORE_PREVIEW_2D_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: false,
        ...(template.version
          ? { values: { templateVersion: template.version } }
          : {}),
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

export function createTemplateStoreDetailPageV010(
  record: TemplateStoreRecordV010,
  options: TemplateStorePageOptionsV010 = {}
) {
  const text = localizedText(options.locale);
  const viewer2dAvailable = options.viewer2dAvailable === true;
  const gallery = record.bundle.definition.projectionGallery;
  const fallbackId = "projection:legacy-main";
  const projections = gallery?.projections ?? [{
    projectionId: fallbackId,
    title: record.bundle.listing.name,
    description: record.bundle.listing.description,
    thumbnail: { ...record.bundle.listing.thumbnail },
    view: {
      contractVersion: "0.1.0" as const,
      kind: "DIAGRAM_2D" as const
    }
  }];
  const primaryProjectionId = gallery?.primaryProjectionId ?? fallbackId;

  return {
    contractVersion: "0.1.0",
    kind: "catalog-detail",
    id: "evo-template-store.detail",
    itemId: record.templateId,
    title: record.bundle.listing.name,
    description: record.bundle.listing.description,
    version: `v${record.version}`,
    metadata: {
      [text.projectionCount]: projections.length
    },
    gallery: {
      primaryItemId: primaryProjectionId,
      maxItems: 9,
      requireItemActions: true,
      items: projections.map(projection => ({
        id: projection.projectionId,
        title: projection.title,
        thumbnail: { ...projection.thumbnail },
        action: {
          id: `preview-2d:${projection.projectionId}`,
          label: text.openProjection,
          type: "command",
          command: TEMPLATE_STORE_PREVIEW_2D_COMMAND,
          inputVersion: "0.1.0",
          requiresConfirmation: false,
          values: {
            templateVersion: record.version,
            ...(gallery
              ? { projectionId: projection.projectionId }
              : {})
          },
          enabled: viewer2dAvailable,
          ...(viewer2dAvailable
            ? { helpText: text.previewHelp }
            : {
                disabledReason: text.previewUnavailable,
                helpText: text.previewUnavailable
              })
        }
      }))
    },
    secondaryActions: [{
      id: "download",
      label: text.download,
      type: "command",
      command: TEMPLATE_STORE_DOWNLOAD_COMMAND,
      inputVersion: "0.1.0",
      requiresConfirmation: false,
      values: {
        templateVersion: record.version
      },
      helpText: text.downloadHelp
    }],
    primaryAction: {
      id: "copy",
      label: text.use,
      type: "command",
      command: TEMPLATE_STORE_COPY_COMMAND,
      inputVersion: "0.1.0",
      requiresConfirmation: true,
      values: {
        templateVersion: record.version
      },
      helpText: text.copyHelp
    }
  } as const;
}

/**
 * Compatibility asset for tests and non-Host embedders.
 * Production Host resolves pages lazily after the plugin Feature is active.
 */
export const templateStoreExperienceAssets = new Map<string, unknown>([
  [TEMPLATE_STORE_PAGE_SOURCE, createTemplateStorePageV010()],
  [TEMPLATE_STORE_DETAIL_PAGE_SOURCE, {
    contractVersion: "0.1.0",
    kind: "catalog-detail",
    id: "evo-template-store.detail",
    itemId: "template:none",
    title: "Template Detail",
    gallery: {
      primaryItemId: "placeholder",
      items: [{
        id: "placeholder",
        title: "Template",
        thumbnail: {
          src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
          alt: "Template"
        }
      }]
    }
  }]
]);
