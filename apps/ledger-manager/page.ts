import type {
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  CatalogBrowserActionV010,
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  LEDGER_MANAGER_DEFINITION_KIND,
  LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
  LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
  LEDGER_MANAGER_PUBLISH_COMMAND
} from "./constants.js";

export function ledgerManagerVersionLabelV010(revision: number): string {
  return revision === 0 ? "default" : `v${revision}`;
}

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "账本管理",
        description:
          "读取当前企业上下文中的账本定义，查看版本与 2D 投影，并将选定版本发布到账本运行时。",
        search: "搜索账本定义",
        empty:
          "当前企业上下文还没有账本定义。可以先从模板商店复制一个账本模板。",
        details: "详情",
        publish: "发布到账本运行时",
        publishHelp:
          "读取当前企业上下文中的这个版本，校验并编译后发布为 Ledger Runtime 的当前定义。",
        preview: "使用 2D Viewer 查看",
        viewerUnavailable: "未安装 2D Viewer。",
        revision: "版本",
        repositoryState: "存储状态",
        origin: "来源",
        projections: "投影",
        definition: "定义"
      }
    : {
        title: "Ledger Manager",
        description:
          "Read ledger definitions from the current Enterprise Context, inspect versions and 2D projections, and publish a selected version to Ledger Runtime.",
        search: "Search ledger definitions",
        empty:
          "This Enterprise Context has no ledger definitions. Copy a ledger template from Template Store first.",
        details: "Details",
        publish: "Publish to Ledger Runtime",
        publishHelp:
          "Read this version from Enterprise Context, validate and compile it, then publish it as Ledger Runtime's current definition.",
        preview: "Open in 2D Viewer",
        viewerUnavailable: "2D Viewer is not installed.",
        revision: "Version",
        repositoryState: "Storage state",
        origin: "Origin",
        projections: "Projections",
        definition: "Definition"
      };
}

function ledgerHistory(
  repository: BusinessDefinitionRepositoryV010,
  enterpriseId: string
): BusinessDefinitionRevisionV010[] {
  return repository
    .listLatest({
      enterpriseId,
      kind: LEDGER_MANAGER_DEFINITION_KIND
    })
    .flatMap(item =>
      repository.listHistory({
        enterpriseId,
        definitionId: item.definitionId
      })
    )
    .filter(item => item.kind === LEDGER_MANAGER_DEFINITION_KIND)
    .sort((a, b) =>
      a.title.localeCompare(b.title)
      || b.revision - a.revision
    );
}

export function createLedgerManagerPageV010(input: {
  enterpriseId: string;
  repository: BusinessDefinitionRepositoryV010;
  viewer2dAvailable: boolean;
  canPublish: boolean;
  locale?: string;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const revisions = ledgerHistory(input.repository, input.enterpriseId);

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-ledger-manager.home",
    title: text.title,
    description: text.description,
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: revisions.map(item => {
      const version = ledgerManagerVersionLabelV010(item.revision);
      const projections = item.projectionGallery?.projections ?? [];
      const primaryProjection =
        projections.find(
          projection =>
            projection.projectionId
            === item.projectionGallery?.primaryProjectionId
        )
        ?? projections[0];

      const secondaryActions: CatalogBrowserActionV010[] = [];
      if (primaryProjection) {
        secondaryActions.push({
          id: "preview",
          label: text.preview,
          type: "command",
          command: LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
          inputVersion: "0.1.0",
          requiresConfirmation: false,
          values: {
            definitionId: item.definitionId,
            definitionRevision: item.revision,
            projectionId: primaryProjection.projectionId
          },
          enabled: input.viewer2dAvailable,
          ...(input.viewer2dAvailable
            ? {}
            : {
                disabledReason: text.viewerUnavailable,
                helpText: text.viewerUnavailable
              })
        });
      }
      secondaryActions.push({
        id: "publish",
        label: text.publish,
        type: "command",
        command: LEDGER_MANAGER_PUBLISH_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: true,
        values: {
          definitionId: item.definitionId,
          definitionRevision: item.revision
        },
        enabled: input.canPublish,
        ...(input.canPublish
          ? { helpText: text.publishHelp }
          : {
              disabledReason: "OWNER or ADMIN role is required.",
              helpText: "OWNER or ADMIN role is required."
            })
      });

      return {
        id: `${item.definitionId}@${item.revision}`,
        title: item.title,
        summary: `${version} · ${item.state}`,
        version,
        badges: [version],
        status: {
          label: item.state,
          tone: item.state === "PUBLISHED"
            ? "positive" as const
            : "neutral" as const
        },
        metadata: {
          [text.definition]: item.definitionId,
          [text.revision]: version,
          [text.repositoryState]: item.state,
          [text.origin]: item.origin.type,
          [text.projections]: projections.length
        },
        primaryAction: {
          id: "details",
          label: text.details,
          type: "command" as const,
          command: LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
          inputVersion: "0.1.0",
          requiresConfirmation: false,
          values: {
            definitionId: item.definitionId,
            definitionRevision: item.revision
          }
        },
        secondaryActions
      };
    }),
    emptyMessage: text.empty
  };
}

export function createLedgerManagerDetailPageV010(input: {
  revision: BusinessDefinitionRevisionV010;
  viewer2dAvailable: boolean;
  canPublish: boolean;
  locale?: string;
}) {
  const text = textFor(input.locale);
  const version = ledgerManagerVersionLabelV010(input.revision.revision);
  const projections = input.revision.projectionGallery?.projections ?? [];

  return {
    contractVersion: "0.1.0",
    kind: "catalog-detail",
    id: "evo-ledger-manager.detail",
    itemId: input.revision.definitionId,
    title: input.revision.title,
    description: `${text.revision}: ${version}`,
    version,
    metadata: {
      [text.definition]: input.revision.definitionId,
      [text.revision]: version,
      [text.repositoryState]: input.revision.state,
      [text.origin]: input.revision.origin.type,
      [text.projections]: projections.length
    },
    gallery: {
      primaryItemId:
        input.revision.projectionGallery?.primaryProjectionId
        ?? projections[0]?.projectionId
        ?? "projection:none",
      maxItems: 9,
      requireItemActions: true,
      items: projections.map(projection => ({
        id: projection.projectionId,
        title: projection.title,
        thumbnail: { ...projection.thumbnail },
        action: {
          id: `preview:${projection.projectionId}`,
          label: text.preview,
          type: "command" as const,
          command: LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
          inputVersion: "0.1.0",
          requiresConfirmation: false,
          values: {
            definitionId: input.revision.definitionId,
            definitionRevision: input.revision.revision,
            projectionId: projection.projectionId
          },
          enabled: input.viewer2dAvailable,
          ...(input.viewer2dAvailable
            ? {}
            : {
                disabledReason: text.viewerUnavailable,
                helpText: text.viewerUnavailable
              })
        }
      }))
    },
    primaryAction: {
      id: "publish",
      label: text.publish,
      type: "command" as const,
      command: LEDGER_MANAGER_PUBLISH_COMMAND,
      inputVersion: "0.1.0",
      requiresConfirmation: true,
      values: {
        definitionId: input.revision.definitionId,
        definitionRevision: input.revision.revision
      },
      enabled: input.canPublish,
      ...(input.canPublish
        ? { helpText: text.publishHelp }
        : {
            disabledReason: "OWNER or ADMIN role is required.",
            helpText: "OWNER or ADMIN role is required."
          })
    }
  } as const;
}
