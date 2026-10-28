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
  ENTERPRISE_CONTEXT_MY_PERMISSIONS_ROUTE,
  ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
  ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
  ENTERPRISE_CONTEXT_SELECT_COMMAND
} from "./constants.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "我的企业",
        description: "选择要进入的企业，或在有资格时创建新企业。",
        search: "搜索企业",
        empty: "暂时没有可访问的企业。",
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
        title: "My enterprises",
        description: "Select an enterprise you can access or create a new one when eligible.",
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
  createEligibility?: { allowed: boolean; message: string };
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
      // Current, default and ownership are distinct facts, shown only once.
      summary: isOwner
        ? (input.locale?.toLowerCase().startsWith("zh") ? "由你管理" : "Managed by you")
        : text.available,
      badges: isDefault ? [text.default] : [],
      status: {
        label: current
          ? text.current
          : (context.lifecycleState === "ACTIVE" ? text.available
            : (context.lifecycleState ?? text.available)),
        tone: current ? "positive" as const : "neutral" as const
      },
      metadata: {
        ...(code ? { [text.code]: code } : {}),
        [text.state]: context.lifecycleState === "ACTIVE"
          ? (input.locale?.toLowerCase().startsWith("zh") ? "正常" : "Active")
          : (context.lifecycleState ?? "—")
      },
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
    layout: "list",
    density: "compact",
    title: text.title,
    description: [
      text.description,
      `${text.count}: ${enterprises.length}`,
      ...(input.createEligibility?.allowed === false ? [input.createEligibility.message] : [])
    ].join(" · "),
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    // Page-level actions are not enterprise records; keep them outside the directory.
    actions: [
      ...(input.createEligibility?.allowed === false ? [] : [{
        id: "create-enterprise",
        label: text.create,
        type: "navigate" as const,
        route: ENTERPRISE_CONTEXT_CREATE_ROUTE,
        primary: true
      }]),
      {
        id: "check-create-eligibility",
        label: input.locale?.toLowerCase().startsWith("zh") ? "查看创建资格" : "Check creation eligibility",
        type: "navigate" as const,
        route: ENTERPRISE_CONTEXT_MY_PERMISSIONS_ROUTE
      }
    ],
    items: enterpriseItems,
    emptyMessage: input.createEligibility?.allowed === false
      ? input.createEligibility.message
      : text.empty
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
  const lifecycle = input.context.lifecycleState;
  const active = lifecycle === "ACTIVE";
  const roleLabel = input.currentRole === "OWNER"
    ? (zh ? "所有者" : "Owner")
    : input.currentRole === "ADMIN"
      ? (zh ? "管理员" : "Administrator")
      : input.currentRole === "MEMBER"
        ? (zh ? "成员" : "Member")
        : (zh ? "已加入" : "Member");
  const statusLabel = active
    ? (zh ? "正常" : "Active")
    : (zh ? "当前不可用" : "Unavailable");

  // The overview is a child journey of the enterprise directory. Eidos owns
  // breadcrumb / mobile parent navigation; do not depend on browser history.
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-context-governance.overview",
    layout: "list",
    density: "compact",
    contextNavigation: {
      items: [
        {
          id: "my-enterprises",
          label: zh ? "我的企业" : "My enterprises",
          route: "/enterprise-contexts"
        },
        { id: "selected-enterprise", label: displayName }
      ]
    },
    title: displayName,
    description: zh
      ? "查看当前企业的信息及可用操作。"
      : "View information and available actions for the selected enterprise.",
    items: [{
      id: contextId || enterpriseId,
      title: zh ? "企业信息" : "Enterprise information",
      summary: input.isDefault
        ? (zh ? "这是你的默认企业" : "Your default enterprise")
        : (zh ? "当前选择的企业" : "Selected enterprise"),
      status: {
        label: statusLabel,
        tone: active ? "positive" : "neutral"
      },
      metadata: {
        ...(code ? { [zh ? "企业代码" : "Enterprise code"]: code } : {}),
        [zh ? "我的身份" : "My role"]: roleLabel,
        [zh ? "默认企业" : "Default enterprise"]:
          input.isDefault ? (zh ? "是" : "Yes") : (zh ? "否" : "No")
      }
    }, ...((input.isDefault !== true || input.currentRole === "OWNER")
      ? [{
          id: "enterprise-management-actions",
          title: zh ? "管理操作" : "Management actions",
          summary: zh
            ? "只在需要时修改默认企业或归档。归档会从日常列表中移除企业，但保留历史记录。"
            : "Change the default enterprise or archive it when needed. Archiving retains historical records.",
          secondaryActions: [
            ...(!input.isDefault ? [{
              id: "set-default",
              label: zh ? "设为默认" : "Set as default",
              type: "command" as const,
              command: ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010,
              inputVersion: "0.1.0",
              requiresConfirmation: false,
              values: { targetContextId: contextId }
            }] : []),
            ...(input.currentRole === "OWNER" ? [{
              id: "archive",
              label: zh ? "归档企业" : "Archive enterprise",
              type: "command" as const,
              command: ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
              inputVersion: "0.1.0",
              requiresConfirmation: true,
              values: { targetContextId: contextId }
            }] : [])
          ]
        }] : [])],
    emptyMessage: zh ? "暂无企业信息。" : "No enterprise information available."
  };
}
