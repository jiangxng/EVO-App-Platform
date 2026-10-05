import type {
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
  ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
  ENTERPRISE_SOFTWARE_PAGE_ID,
  ENTERPRISE_SOFTWARE_SHARE_COMMAND
} from "./constants.js";

function localizedText(locale: string | undefined) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "企业软件",
        description:
          "管理企业上下文中的 Working Draft、不可变版本、投影画廊与模板共享。",
        search: "搜索企业软件",
        empty: "当前企业上下文还没有企业软件定义。",
        draft: "Working Draft",
        version: "版本",
        createVersion: "创建版本",
        beginDraft: "编辑新版本",
        share: "共享到模板商店",
        kind: "类型",
        projections: "投影",
        history: "修订记录",
        source: "来源",
        createVersionHelp:
          "将当前 Working Draft 冻结为不可变企业软件版本。",
        beginDraftHelp:
          "从当前不可变版本创建新的 Working Draft。",
        shareHelp:
          "将最近的不可变企业软件版本复制到模板商店；不会建立实时关联。"
      }
    : {
        title: "Enterprise Software",
        description:
          "Manage Working Drafts, immutable versions, Projection Galleries and Template Store sharing in Enterprise Context.",
        search: "Search enterprise software",
        empty: "This Enterprise Context has no enterprise software definitions yet.",
        draft: "Working Draft",
        version: "Version",
        createVersion: "Create Version",
        beginDraft: "Edit New Version",
        share: "Share to Template Store",
        kind: "Kind",
        projections: "Projections",
        history: "Revisions",
        source: "Origin",
        createVersionHelp:
          "Freeze the current Working Draft as an immutable enterprise software version.",
        beginDraftHelp:
          "Create a new Working Draft from the current immutable version.",
        shareHelp:
          "Copy the latest immutable enterprise software version to Template Store without creating a live link."
      };
}

function publishedVersionNumber(
  history: readonly BusinessDefinitionRevisionV010[],
  revision: number
): number | undefined {
  const published = history
    .filter(item => item.state === "PUBLISHED")
    .sort((a, b) => a.revision - b.revision);
  const index = published.findIndex(item => item.revision === revision);
  return index >= 0 ? index + 1 : undefined;
}

export function createEnterpriseSoftwarePageV010(input: {
  enterpriseId: string;
  repository: BusinessDefinitionRepositoryV010;
  shareAvailable: boolean;
  locale?: string;
}): CatalogBrowserV010 {
  const text = localizedText(input.locale);
  const latest = input.repository.listLatest({
    enterpriseId: input.enterpriseId
  });

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: ENTERPRISE_SOFTWARE_PAGE_ID,
    title: text.title,
    description: text.description,
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: latest.map(item => {
      const history = input.repository.listHistory({
        enterpriseId: input.enterpriseId,
        definitionId: item.definitionId
      });
      const published = history
        .filter(revision => revision.state === "PUBLISHED")
        .sort((a, b) => a.revision - b.revision);
      const effective = published.at(-1);
      const currentVersion = item.state === "PUBLISHED"
        ? publishedVersionNumber(history, item.revision)
        : effective
          ? publishedVersionNumber(history, effective.revision)
          : undefined;
      const projectionCount =
        item.projectionGallery?.projections.length
        ?? effective?.projectionGallery?.projections.length
        ?? 0;

      const primaryAction = item.state === "DRAFT"
        ? {
            id: "create-version",
            label: text.createVersion,
            type: "command" as const,
            command: ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
            inputVersion: "0.1.0",
            requiresConfirmation: true,
            values: {
              expectedRevision: item.revision
            },
            helpText: text.createVersionHelp
          }
        : {
            id: "begin-draft",
            label: text.beginDraft,
            type: "command" as const,
            command: ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
            inputVersion: "0.1.0",
            requiresConfirmation: true,
            values: {
              expectedRevision: item.revision
            },
            helpText: text.beginDraftHelp
          };

      const shareRevision = item.state === "PUBLISHED"
        ? item
        : effective;

      return {
        id: item.definitionId,
        title: item.title,
        summary: item.state === "DRAFT"
          ? text.draft
          : `${text.version} ${currentVersion ?? 1}`,
        version: item.state === "DRAFT"
          ? text.draft
          : `v${currentVersion ?? 1}`,
        badges: [
          item.state === "DRAFT" ? text.draft : `${text.version} ${currentVersion ?? 1}`
        ],
        status: {
          label: item.state === "DRAFT" ? text.draft : "Immutable",
          tone: item.state === "DRAFT" ? "warning" : "positive"
        },
        metadata: {
          [text.kind]: item.kind,
          [text.projections]: projectionCount,
          [text.history]: history.length,
          [text.source]: item.origin.type
        },
        primaryAction,
        secondaryActions: shareRevision
          ? [{
              id: "share",
              label: text.share,
              type: "command" as const,
              command: ENTERPRISE_SOFTWARE_SHARE_COMMAND,
              inputVersion: "0.1.0",
              requiresConfirmation: true,
              values: {
                definitionRevision: shareRevision.revision
              },
              enabled: input.shareAvailable,
              ...(input.shareAvailable
                ? { helpText: text.shareHelp }
                : {
                    disabledReason: "Template Store is not available.",
                    helpText: "Template Store is not available."
                  })
            }]
          : []
      };
    }),
    emptyMessage: text.empty
  };
}
