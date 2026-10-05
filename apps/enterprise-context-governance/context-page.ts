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
  ENTERPRISE_CONTEXT_SELECT_COMMAND,
  ENTERPRISE_SOFTWARE_ROUTE
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
      secondaryActions: isDefault
        ? []
        : [{
            id: "set-default",
            label: text.setDefault,
            type: "command" as const,
            command: ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010,
            inputVersion: "0.1.0",
            requiresConfirmation: false,
            values: {
              targetContextId: contextId
            }
          }],
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
          navigateTo: ENTERPRISE_SOFTWARE_ROUTE
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
