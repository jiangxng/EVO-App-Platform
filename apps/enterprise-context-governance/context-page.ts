import {
  ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010
} from "../../contracts/enterprise-context-preference.js";
import type {
  ActiveContextRefV010,
  EnterpriseContextV010
} from "../../contracts/platform-services.js";
import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  ENTERPRISE_CONTEXT_CREATE_ROUTE,
  ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
  ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
  ENTERPRISE_CONTEXT_SELECT_COMMAND
} from "./constants.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "企业上下文",
        description: "查看和进入你已创建或有权访问的企业上下文。",
        search: "搜索企业",
        empty: "还没有企业上下文。请先创建一家企业。",
        current: "当前企业",
        default: "默认企业",
        setDefault: "设为默认",
        archive: "归档企业",
        archiveHelp: "从日常企业列表中移除，同时保留创建事实和审计记录。",
        available: "可进入",
        enter: "进入企业",
        create: "创建新企业",
        createSummary: "新增一个企业上下文。",
        count: "企业数量",
        code: "企业代码",
        state: "状态"
      }
    : {
        title: "Enterprise Contexts",
        description: "See and enter the Enterprise Contexts you created or can access.",
        search: "Search enterprises",
        empty: "No Enterprise Contexts yet. Create your first enterprise.",
        current: "Current enterprise",
        default: "Default enterprise",
        setDefault: "Set default",
        archive: "Archive enterprise",
        archiveHelp: "Remove it from normal enterprise use while retaining creation and audit facts.",
        available: "Available",
        enter: "Enter enterprise",
        create: "Create enterprise",
        createSummary: "Create another Enterprise Context.",
        count: "Enterprise count",
        code: "Enterprise code",
        state: "State"
      };
}

export function createEnterpriseContextDirectoryPageV010(input: {
  contexts: readonly EnterpriseContextV010[];
  activeContext?: ActiveContextRefV010;
  defaultContextId?: string;
  ownerContextIds?: readonly string[];
  locale?: string;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const enterprises = [...input.contexts].sort((a, b) =>
    (a.displayName ?? a.contextId ?? a.enterpriseId ?? "").localeCompare(
      b.displayName ?? b.contextId ?? b.enterpriseId ?? ""
    )
  );

  const enterpriseItems = enterprises.flatMap(context => {
    const contextId = context.contextId?.trim();
    const enterpriseId = context.enterpriseId?.trim();
    if (!contextId || !enterpriseId) return [];
    const displayName =
      context.displayName?.trim()
      || enterpriseId;

    const current =
      input.activeContext?.kind === "ENTERPRISE"
      && input.activeContext.contextId === contextId;
    const isDefault = input.defaultContextId === contextId;
    const isOwner = input.ownerContextIds?.includes(contextId) === true;
    const code = typeof context.attributes?.code === "string"
      ? context.attributes.code
      : undefined;

    return [{
      id: contextId,
      title: displayName,
      summary: [
        current ? text.current : undefined,
        isDefault ? text.default : undefined
      ].filter(Boolean).join(" · ") || text.available,
      badges: [
        ...(isDefault ? [text.default] : []),
        ...(current ? [text.current] : [])
      ],
      status: {
        label: current ? text.current : (context.lifecycleState ?? text.available),
        tone: current ? "positive" as const : "neutral" as const
      },
      metadata: {
        ...(code ? { [text.code]: code } : {}),
        [text.state]: context.lifecycleState ?? "ACTIVE"
      },
      secondaryActions: [
        ...(!isDefault
          ? [{
              id: "set-default",
              label: text.setDefault,
              type: "command" as const,
              command: ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010,
              inputVersion: "0.1.0",
              requiresConfirmation: false,
              values: {
                targetContextId: contextId
              }
            }]
          : []),
        ...(isOwner
          ? [{
              id: "archive",
              label: text.archive,
              type: "command" as const,
              command: ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
              inputVersion: "0.1.0",
              requiresConfirmation: true,
              helpText: text.archiveHelp,
              values: {
                targetContextId: contextId
              }
            }]
          : [])
      ],
      primaryAction: {
        id: "enter",
        label: text.enter,
        type: "command" as const,
        command: ENTERPRISE_CONTEXT_SELECT_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: false,
        values: {
          targetContextId: contextId,
          targetEnterpriseId: enterpriseId,
          navigateTo: ENTERPRISE_CONTEXT_OVERVIEW_ROUTE
        }
      }
    }];
  });

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-context-governance.directory",
    title: text.title,
    description: `${text.description} ${text.count}: ${enterprises.length}`,
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: [
      ...enterpriseItems,
      {
        id: "enterprise-context:create",
        title: text.create,
        summary: text.createSummary,
        category: "ACTION",
        primaryAction: {
          id: "create",
          label: text.create,
          type: "navigate",
          route: ENTERPRISE_CONTEXT_CREATE_ROUTE,
          requiresConfirmation: false
        }
      }
    ],
    emptyMessage: text.empty
  };
}


export function createEnterpriseContextOverviewPageV010(input: {
  context: EnterpriseContextV010;
  currentRole?: string;
  isDefault?: boolean;
  locale?: string;
}): CatalogBrowserV010 {
  const zh = (input.locale ?? "").toLowerCase().startsWith("zh");
  const contextId = input.context.contextId?.trim() ?? "";
  const enterpriseId = input.context.enterpriseId.trim();
  const displayName = input.context.displayName?.trim() || enterpriseId;
  const code = typeof input.context.attributes?.code === "string"
    ? input.context.attributes.code
    : undefined;

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-context-governance.overview",
    title: displayName,
    description: zh
      ? "企业上下文是一个薄的企业级持久资源容器。业务能力由独立插件读取和操作这里的资源。"
      : "An Enterprise Context is a thin persistent enterprise resource container. Independent plugins read and operate its resources.",
    items: [{
      id: contextId || enterpriseId,
      title: zh ? "容器状态" : "Container status",
      summary: input.isDefault
        ? (zh ? "当前默认企业上下文" : "Current default Enterprise Context")
        : (zh ? "企业级资源边界" : "Enterprise resource boundary"),
      status: {
        label: input.context.lifecycleState ?? "ACTIVE",
        tone: input.context.lifecycleState === "ACTIVE"
          ? "positive"
          : "neutral"
      },
      metadata: {
        [zh ? "企业 ID" : "Enterprise ID"]: enterpriseId,
        ...(contextId
          ? { [zh ? "Context ID" : "Context ID"]: contextId }
          : {}),
        ...(code
          ? { [zh ? "企业代码" : "Enterprise code"]: code }
          : {}),
        [zh ? "当前角色" : "Current role"]: input.currentRole ?? "—",
        [zh ? "默认" : "Default"]: input.isDefault ? (zh ? "是" : "Yes") : (zh ? "否" : "No"),
        [zh ? "职责" : "Responsibility"]: zh
          ? "存储、隔离、寻址、访问边界"
          : "Persistence, isolation, addressing and access boundary"
      }
    }, {
      id: "enterprise-context:plugin-boundary",
      title: zh ? "插件操作资源" : "Plugins operate resources",
      summary: zh
        ? "账本、组织、应用、文件等领域能力不属于企业上下文本体；它们由独立插件通过当前 Context 工作。"
        : "Ledger, organization, applications, files and other domain capabilities live in independent plugins operating against the current Context.",
      status: {
        label: zh ? "薄容器" : "Thin container",
        tone: "neutral"
      }
    }],
    emptyMessage: zh ? "企业上下文可用。" : "Enterprise Context is available."
  };
}
