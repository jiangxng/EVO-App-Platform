import type {
  CatalogBrowserItemV010,
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  ENTERPRISE_APPLICATIONS_ROUTE,
  ENTERPRISE_CONTEXT_AUDIT_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_AUDIT_ROUTE,
  ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
  ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_DATA_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_DATA_ROUTE,
  ENTERPRISE_CONTEXT_FILES_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_FILES_ROUTE,
  ENTERPRISE_CONTEXT_JOBS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_JOBS_ROUTE,
  ENTERPRISE_CONTEXT_MEMBERS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
  ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_SETTINGS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_SETTINGS_ROUTE,
  ENTERPRISE_SOFTWARE_PAGE_SOURCE
} from "./constants.js";

function navItem(
  id: string,
  title: string,
  summary: string,
  route: string,
  status = "原型"
): CatalogBrowserItemV010 {
  return {
    id,
    title,
    summary,
    status: {
      label: status,
      tone: status === "已有能力" || status === "已有后端能力"
        ? "positive"
        : "neutral"
    },
    primaryAction: {
      id: "open",
      label: "打开",
      type: "navigate",
      route
    }
  };
}

function placeholderPage(input: {
  id: string;
  title: string;
  description: string;
  scope: string[];
}): CatalogBrowserV010 {
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: input.id,
    title: input.title,
    description:
      input.description
      + " 当前页面用于确认 Enterprise Context 的产品信息架构，能力将在导航确认后逐步接入。",
    items: input.scope.map((title, index) => ({
      id: input.id + ":" + String(index + 1),
      title,
      summary: "导航原型占位；此处尚未绑定最终 Provider 或业务实现。",
      status: {
        label: "待确认",
        tone: "neutral"
      }
    })),
    emptyMessage: "导航原型"
  };
}

const overviewPage: CatalogBrowserV010 = {
  contractVersion: "0.1.0",
  kind: "catalog-browser",
  id: "evo-enterprise-context-governance.overview",
  title: "企业概览",
  description:
    "这是进入一家企业后的首页原型。先确认整个企业后台应该有哪些入口，再逐步接入真实数据和能力。",
  items: [
    navItem(
      "applications",
      "应用",
      "查看这家企业安装和使用的业务应用。应用本身由 Application Platform 管理，Enterprise Context 这里只提供企业视角。",
      ENTERPRISE_APPLICATIONS_ROUTE,
      "已有能力"
    ),
    navItem(
      "organization",
      "组织",
      "法律实体、事业部、业务单元、部门、站点、工厂、仓库等企业组织结构。",
      ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE
    ),
    navItem(
      "data",
      "数据",
      "查看企业级数据资源、共享范围和组织/应用作用域。",
      ENTERPRISE_CONTEXT_DATA_ROUTE
    ),
    navItem(
      "files",
      "文件",
      "企业文档、附件、对象和其他文件型资产。",
      ENTERPRISE_CONTEXT_FILES_ROUTE
    ),
    navItem(
      "members",
      "成员与权限",
      "OWNER、ADMIN、MEMBER、AUDITOR、邀请、授权和所有权转移。",
      ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
      "已有后端能力"
    ),
    navItem(
      "connections",
      "连接",
      "企业级外部系统、API、数据源和服务连接。",
      ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE
    ),
    navItem(
      "jobs",
      "任务",
      "后台任务、计划任务、队列和长期运行作业。",
      ENTERPRISE_CONTEXT_JOBS_ROUTE
    ),
    navItem(
      "audit",
      "审计",
      "查看企业上下文的重要治理操作和审计证据。",
      ENTERPRISE_CONTEXT_AUDIT_ROUTE
    ),
    navItem(
      "settings",
      "设置",
      "企业级语言、时区、货币、编号、功能策略及其他企业偏好。",
      ENTERPRISE_CONTEXT_SETTINGS_ROUTE
    )
  ]
};

export const enterpriseContextGovernanceExperienceAssets =
  new Map<string, unknown>([
    [
      ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE,
      {
        contractVersion: "0.1.1",
        kind: "form",
        id: "evo-enterprise-context-governance.create",
        title: "Create Enterprise Context",
        purpose: "execute-command",
        command: {
          code: "enterprise.context.create",
          inputVersion: "0.1.0"
        },
        fields: [
          {
            key: "displayName",
            label: "Enterprise name",
            semanticType: "enterprise.display-name",
            control: "text",
            required: true
          },
          {
            key: "code",
            label: "Enterprise code",
            semanticType: "enterprise.code",
            control: "text",
            required: false
          }
        ],
        actions: [{
          id: "create",
          label: "Create enterprise",
          type: "submit",
          command: "enterprise.context.create",
          requiresConfirmation: true
        }],
        metadata: {
          dataOwnerCapability: "enterprise.directory",
          commandOwner: "host-enterprise-context-provider",
          designOwner: "evo-enterprise-context-governance",
          creationFactsImmutable: true,
          initialRelationship: "OWNER"
        }
      }
    ],
    [ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE, overviewPage],
    [
      ENTERPRISE_SOFTWARE_PAGE_SOURCE,
      {
        contractVersion: "0.1.0",
        kind: "catalog-browser",
        id: "evo-enterprise-context-governance.software",
        title: "Applications",
        description: "Select an Enterprise Context to manage its applications.",
        items: [],
        emptyMessage: "No applications are available in this Enterprise Context."
      }
    ],
    [
      ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.organization",
        title: "组织",
        description: "管理企业内部的组织结构；Enterprise Context 本身不是法人、部门或业务单元。",
        scope: ["法律实体", "事业部 / 业务单元", "部门", "站点 / 工厂", "仓库 / 库位"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_DATA_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.data",
        title: "数据",
        description: "从企业控制面查看数据资源和作用域，而不是直接暴露某个数据库。",
        scope: ["企业共享数据", "组织级数据", "应用级数据", "数据资源与容量"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_FILES_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.files",
        title: "文件",
        description: "管理企业上下文中的文档、附件和对象型资源。",
        scope: ["企业文件", "业务附件", "文档资产", "存储与生命周期"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_MEMBERS_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.members",
        title: "成员与权限",
        description: "把已经存在的 Enterprise Relationship / Grant 后端能力变成可操作的管理界面。",
        scope: ["OWNER", "ADMIN", "MEMBER", "AUDITOR", "邀请与接受", "所有权转移"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.connections",
        title: "连接",
        description: "查看企业所连接的外部系统、服务和数据源。",
        scope: ["API / Webhook", "ERP / CRM", "银行 / 电商", "邮件 / 协作工具", "AI Provider"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_JOBS_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.jobs",
        title: "任务",
        description: "企业后台长期任务和自动化作业的统一观察入口。",
        scope: ["运行中任务", "计划任务", "失败任务", "任务历史"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_AUDIT_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.audit",
        title: "审计",
        description: "聚合 Enterprise Context 重要治理动作的可追溯证据。",
        scope: ["上下文生命周期", "成员与权限变更", "应用管理事件", "连接和配置变更"]
      })
    ],
    [
      ENTERPRISE_CONTEXT_SETTINGS_PAGE_SOURCE,
      placeholderPage({
        id: "evo-enterprise-context-governance.settings",
        title: "设置",
        description: "企业级公共偏好和策略入口；不吸收各业务应用自己的私有设置。",
        scope: ["基本信息", "语言与时区", "币种与单位", "编号规则", "企业功能策略"]
      })
    ]
  ]);
