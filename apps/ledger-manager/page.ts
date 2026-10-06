import type {
  BusinessDefinitionOriginV010,
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010,
  BusinessDefinitionStateV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  CatalogBrowserActionV010,
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  definition2dPreviewRouteV010
} from "../../contracts/definition-projection.js";
import {
  LEDGER_MANAGER_DEFINITION_KIND,
  LEDGER_MANAGER_PUBLISH_COMMAND,
  LEDGER_MANAGER_ROUTE,
  ledgerManagerDetailRouteV010
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
          "管理当前企业的账本定义与版本，并将选定版本发布为当前生效的账本配置。",
        search: "搜索账本",
        empty:
          "当前企业还没有账本定义。可以先从模板商店添加一个账本模板。",
        details: "查看详情",
        back: "返回账本管理",
        publish: "发布生效",
        publishHelp:
          "发布后，这个版本将成为当前企业正在使用的账本配置。",
        preview: "查看关系图",
        viewerUnavailable: "关系图查看器尚未安装。",
        revision: "版本",
        repositoryState: "状态",
        origin: "来源",
        projections: "关系图",
        definitionCategory: "账本定义",
        defaultVersion: "默认版本",
        draft: "草稿",
        published: "已发布",
        originNative: "企业创建",
        originMigrated: "迁移导入",
        originTemplate: "来自模板",
        oneProjection: "1 个视图",
        manyProjections: (count: number) => `${count} 个视图`,
        manageRoleRequired: "需要企业所有者或管理员权限。"
      }
    : {
        title: "Ledger management",
        description:
          "Manage ledger definitions and versions for the current enterprise, and publish the selected version as the active ledger configuration.",
        search: "Search ledgers",
        empty:
          "This enterprise has no ledger definitions yet. Add a ledger template from Template Store first.",
        details: "View details",
        back: "Back to ledger management",
        publish: "Publish",
        publishHelp:
          "After publishing, this version becomes the active ledger configuration for the current enterprise.",
        preview: "View relationship map",
        viewerUnavailable: "The relationship-map viewer is not installed.",
        revision: "Version",
        repositoryState: "Status",
        origin: "Source",
        projections: "Relationship maps",
        definitionCategory: "Ledger definition",
        defaultVersion: "Default version",
        draft: "Draft",
        published: "Published",
        originNative: "Created in enterprise",
        originMigrated: "Imported",
        originTemplate: "From template",
        oneProjection: "1 view",
        manyProjections: (count: number) => `${count} views`,
        manageRoleRequired: "Enterprise owner or administrator permission is required."
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

function stateLabel(
  state: BusinessDefinitionStateV010,
  text: ReturnType<typeof textFor>
): string {
  return state === "PUBLISHED" ? text.published : text.draft;
}

function originLabel(
  origin: BusinessDefinitionOriginV010,
  text: ReturnType<typeof textFor>
): string {
  if (origin.type === "TEMPLATE_COPY") return text.originTemplate;
  if (origin.type === "MIGRATED") return text.originMigrated;
  return text.originNative;
}

function versionDisplayLabel(
  revision: number,
  text: ReturnType<typeof textFor>
): string {
  return revision === 0 ? text.defaultVersion : `v${revision}`;
}

function projectionCountLabel(
  count: number,
  text: ReturnType<typeof textFor>
): string {
  return count === 1 ? text.oneProjection : text.manyProjections(count);
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
    layout: "list",
    id: "evo-ledger-manager.home",
    title: text.title,
    description: text.description,
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: revisions.map(item => {
      const displayVersion = versionDisplayLabel(item.revision, text);
      const projections = item.projectionGallery?.projections ?? [];
      const secondaryActions: CatalogBrowserActionV010[] = [{
        id: "details",
        label: text.details,
        type: "navigate",
        route: ledgerManagerDetailRouteV010(
          item.definitionId,
          item.revision
        ),
        requiresConfirmation: false
      }];

      return {
        id: `${item.definitionId}@${item.revision}`,
        title: item.title,
        category: text.definitionCategory,
        summary: [
          displayVersion,
          originLabel(item.origin, text),
          projectionCountLabel(projections.length, text)
        ].join(" · "),
        status: {
          label: stateLabel(item.state, text),
          tone: item.state === "PUBLISHED"
            ? "positive" as const
            : "neutral" as const
        },
        primaryAction: {
          id: "publish",
          label: text.publish,
          type: "command" as const,
          command: LEDGER_MANAGER_PUBLISH_COMMAND,
          inputVersion: "0.1.0",
          requiresConfirmation: true,
          values: {
            definitionId: item.definitionId,
            definitionRevision: item.revision
          },
          enabled: input.canPublish,
          ...(input.canPublish
            ? {}
            : {
                disabledReason: text.manageRoleRequired
              })
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
  const displayVersion = versionDisplayLabel(input.revision.revision, text);
  const projections = input.revision.projectionGallery?.projections ?? [];

  return {
    contractVersion: "0.1.0",
    kind: "catalog-detail",
    id: "evo-ledger-manager.detail",
    itemId: input.revision.definitionId,
    title: input.revision.title,
    description: text.publishHelp,
    version: displayVersion,
    category: text.definitionCategory,
    badges: [stateLabel(input.revision.state, text)],
    metadata: {
      [text.revision]: displayVersion,
      [text.repositoryState]: stateLabel(input.revision.state, text),
      [text.origin]: originLabel(input.revision.origin, text),
      [text.projections]: projectionCountLabel(projections.length, text)
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
          type: "navigate" as const,
          route: definition2dPreviewRouteV010({
            definitionId: input.revision.definitionId,
            definitionRevision: input.revision.revision,
            projectionId: projection.projectionId
          }),
          requiresConfirmation: false,
          enabled: input.viewer2dAvailable,
          ...(input.viewer2dAvailable
            ? {}
            : {
                disabledReason: text.viewerUnavailable
              })
        }
      }))
    },
    secondaryActions: [{
      id: "back",
      label: text.back,
      type: "navigate" as const,
      route: LEDGER_MANAGER_ROUTE,
      requiresConfirmation: false
    }],
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
            disabledReason: text.manageRoleRequired,
            helpText: text.manageRoleRequired
          })
    }
  } as const;
}
