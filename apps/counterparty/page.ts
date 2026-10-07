import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  CounterpartySubjectV010
} from "./repository.js";
import {
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_CREATE_ROUTE,
  COUNTERPARTY_DIRECTORY_ROUTE,
  COUNTERPARTY_UPDATE_COMMAND,
  counterpartyDetailRouteV010,
  counterpartyEditRouteV010
} from "./constants.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "往来对象",
        description:
          "统一维护与当前企业发生业务、经济或结算关系的主体。客户、供应商等是关系角色，不是重复主体。",
        search: "搜索编码或名称",
        empty: "还没有往来对象。",
        create: "新建往来对象",
        createSummary: "建立一个新的企业往来主体。",
        organization: "机构",
        person: "个人",
        active: "启用",
        inactive: "停用",
        code: "往来编码",
        subjectType: "主体类型",
        taxIdentifier: "税号 / 纳税识别号",
        countryOrRegion: "国家或地区",
        phone: "联系电话",
        email: "电子邮件",
        view: "查看",
        detailDescription:
          "这是当前企业上下文中的往来对象身份。应收、应付、核销与余额不属于此主数据。",
        edit: "编辑",
        archive: "归档",
        archiveHelp: "从日常往来对象目录中移除，但保留企业资源记录。",
        back: "返回往来对象",
        formTitle: "新建往来对象",
        editFormTitle: "编辑往来对象",
        formDescription:
          "先建立稳定主体身份。客户/供应商关系、银行账户、账期、信用额度等后续由关系/扩展部件维护。",
        displayName: "往来名称",
        legalName: "法定名称",
        notes: "备注",
        save: "创建往来对象"
      }
    : {
        title: "Counterparties",
        description:
          "Manage parties that have business, economic or settlement relationships with the current enterprise. Customer and Supplier are roles, not duplicate identities.",
        search: "Search code or name",
        empty: "No counterparties yet.",
        create: "New counterparty",
        createSummary: "Create a new enterprise counterparty identity.",
        organization: "Organization",
        person: "Person",
        active: "Active",
        inactive: "Inactive",
        code: "Counterparty code",
        subjectType: "Subject type",
        taxIdentifier: "Tax identifier",
        countryOrRegion: "Country or region",
        phone: "Phone",
        email: "Email",
        view: "View",
        detailDescription:
          "This is the counterparty identity stored in the current Enterprise Context. Receivables, payables, settlement and balances are not part of this master data.",
        edit: "Edit",
        archive: "Archive",
        archiveHelp:
          "Remove this counterparty from normal directories while retaining its enterprise resource record.",
        back: "Back to counterparties",
        formTitle: "New counterparty",
        editFormTitle: "Edit counterparty",
        formDescription:
          "Create the stable party identity first. Customer/Supplier roles, bank accounts, payment terms and credit profiles belong to later relationship/profile capabilities.",
        displayName: "Display name",
        legalName: "Legal name",
        notes: "Notes",
        save: "Create counterparty"
      };
}

function subjectTypeLabel(
  value: CounterpartySubjectV010["subjectType"],
  locale?: string
): string {
  const text = textFor(locale);
  return value === "ORGANIZATION" ? text.organization : text.person;
}

export function createCounterpartyDirectoryPageV010(input: {
  counterparties: readonly CounterpartySubjectV010[];
  locale?: string;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    id: "evo-counterparty.directory",
    title: text.title,
    description: text.description,
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: [
      ...input.counterparties.map(counterparty => ({
        id: counterparty.counterpartyId,
        title: counterparty.displayName,
        summary: `${counterparty.code} · ${subjectTypeLabel(
          counterparty.subjectType,
          input.locale
        )}`,
        status: {
          label:
            counterparty.status === "ACTIVE"
              ? text.active
              : text.inactive,
          tone:
            counterparty.status === "ACTIVE"
              ? "positive" as const
              : "neutral" as const
        },
        metadata: {
          [text.code]: counterparty.code,
          [text.subjectType]: subjectTypeLabel(
            counterparty.subjectType,
            input.locale
          ),
          ...(counterparty.taxIdentifier
            ? { [text.taxIdentifier]: counterparty.taxIdentifier }
            : {}),
          ...(counterparty.countryOrRegion
            ? { [text.countryOrRegion]: counterparty.countryOrRegion }
            : {})
        },
        primaryAction: {
          id: "view",
          label: text.view,
          type: "navigate" as const,
          route: counterpartyDetailRouteV010(
            counterparty.counterpartyId
          ),
          requiresConfirmation: false
        }
      })),
      {
        id: "counterparty:create",
        title: text.create,
        summary: text.createSummary,
        category: "ACTION",
        primaryAction: {
          id: "create",
          label: text.create,
          type: "navigate" as const,
          route: COUNTERPARTY_CREATE_ROUTE,
          requiresConfirmation: false
        }
      }
    ],
    emptyMessage: text.empty
  };
}

export function createCounterpartyDetailPageV010(input: {
  counterparty: CounterpartySubjectV010;
  locale?: string;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const subject = input.counterparty;
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    id: "evo-counterparty.detail",
    title: subject.displayName,
    description: text.detailDescription,
    items: [{
      id: subject.counterpartyId,
      title: subject.displayName,
      summary: subject.legalName || subject.code,
      status: {
        label:
          subject.status === "ACTIVE"
            ? text.active
            : text.inactive,
        tone:
          subject.status === "ACTIVE"
            ? "positive"
            : "neutral"
      },
      metadata: {
        [text.code]: subject.code,
        [text.subjectType]: subjectTypeLabel(
          subject.subjectType,
          input.locale
        ),
        ...(subject.legalName
          ? { [text.legalName]: subject.legalName }
          : {}),
        ...(subject.taxIdentifier
          ? { [text.taxIdentifier]: subject.taxIdentifier }
          : {}),
        ...(subject.countryOrRegion
          ? { [text.countryOrRegion]: subject.countryOrRegion }
          : {}),
        ...(subject.phone ? { [text.phone]: subject.phone } : {}),
        ...(subject.email ? { [text.email]: subject.email } : {})
      },
      primaryAction: {
        id: "back",
        label: text.back,
        type: "navigate",
        route: COUNTERPARTY_DIRECTORY_ROUTE,
        requiresConfirmation: false
      },
      secondaryActions: [{
        id: "edit",
        label: text.edit,
        type: "navigate",
        route: counterpartyEditRouteV010(subject.counterpartyId),
        requiresConfirmation: false
      }, {
        id: "archive",
        label: text.archive,
        type: "command",
        command: COUNTERPARTY_ARCHIVE_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: true,
        helpText: text.archiveHelp,
        values: {
          counterpartyId: subject.counterpartyId
        }
      }]
    }]
  };
}

export function createCounterpartyCreatePageV010(locale?: string) {
  const text = textFor(locale);
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-counterparty.create",
    title: text.formTitle,
    purpose: "execute-command",
    command: {
      code: COUNTERPARTY_CREATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "code",
      label: text.code,
      semanticType: "counterparty-code",
      control: "text",
      required: true
    }, {
      key: "displayName",
      label: text.displayName,
      semanticType: "counterparty-display-name",
      control: "text",
      required: true
    }, {
      key: "subjectType",
      label: text.subjectType,
      semanticType: "counterparty-subject-type",
      control: "select",
      required: true,
      options: [{
        value: "ORGANIZATION",
        label: text.organization
      }, {
        value: "PERSON",
        label: text.person
      }]
    }, {
      key: "legalName",
      label: text.legalName,
      semanticType: "counterparty-legal-name",
      control: "text",
      required: false
    }, {
      key: "taxIdentifier",
      label: text.taxIdentifier,
      semanticType: "tax-identifier",
      control: "text",
      required: false
    }, {
      key: "countryOrRegion",
      label: text.countryOrRegion,
      semanticType: "country-or-region",
      control: "text",
      required: false
    }, {
      key: "phone",
      label: text.phone,
      semanticType: "phone",
      control: "text",
      required: false
    }, {
      key: "email",
      label: text.email,
      semanticType: "email",
      control: "text",
      required: false
    }, {
      key: "notes",
      label: text.notes,
      semanticType: "notes",
      control: "text",
      required: false
    }],
    actions: [{
      id: "create",
      label: text.save,
      type: "submit",
      command: COUNTERPARTY_CREATE_COMMAND,
      requiresConfirmation: false
    }],
    metadata: {
      packageId: "evo-counterparty",
      featureId: "evo-counterparty.default",
      description: text.formDescription
    }
  } as const;
}


export function createCounterpartyEditPageV010(input: {
  counterparty: CounterpartySubjectV010;
  locale?: string;
}) {
  const text = textFor(input.locale);
  const subject = input.counterparty;
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-counterparty.edit",
    title: text.editFormTitle,
    purpose: "execute-command",
    command: {
      code: COUNTERPARTY_UPDATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "counterpartyId",
      label: "ID",
      semanticType: "counterparty-id",
      control: "text",
      required: true,
      readOnly: true,
      defaultValue: subject.counterpartyId
    }, {
      key: "code",
      label: text.code,
      semanticType: "counterparty-code",
      control: "text",
      required: true,
      defaultValue: subject.code
    }, {
      key: "displayName",
      label: text.displayName,
      semanticType: "counterparty-display-name",
      control: "text",
      required: true,
      defaultValue: subject.displayName
    }, {
      key: "subjectType",
      label: text.subjectType,
      semanticType: "counterparty-subject-type",
      control: "select",
      required: true,
      defaultValue: subject.subjectType,
      options: [{
        value: "ORGANIZATION",
        label: text.organization
      }, {
        value: "PERSON",
        label: text.person
      }]
    }, {
      key: "legalName",
      label: text.legalName,
      semanticType: "counterparty-legal-name",
      control: "text",
      required: false,
      defaultValue: subject.legalName ?? ""
    }, {
      key: "taxIdentifier",
      label: text.taxIdentifier,
      semanticType: "tax-identifier",
      control: "text",
      required: false,
      defaultValue: subject.taxIdentifier ?? ""
    }, {
      key: "countryOrRegion",
      label: text.countryOrRegion,
      semanticType: "country-or-region",
      control: "text",
      required: false,
      defaultValue: subject.countryOrRegion ?? ""
    }, {
      key: "phone",
      label: text.phone,
      semanticType: "phone",
      control: "text",
      required: false,
      defaultValue: subject.phone ?? ""
    }, {
      key: "email",
      label: text.email,
      semanticType: "email",
      control: "text",
      required: false,
      defaultValue: subject.email ?? ""
    }, {
      key: "notes",
      label: text.notes,
      semanticType: "notes",
      control: "text",
      required: false,
      defaultValue: subject.notes ?? ""
    }],
    actions: [{
      id: "update",
      label: text.save,
      type: "submit",
      command: COUNTERPARTY_UPDATE_COMMAND,
      requiresConfirmation: false
    }],
    metadata: {
      packageId: "evo-counterparty",
      featureId: "evo-counterparty.default",
      counterpartyId: subject.counterpartyId,
      description: text.formDescription
    }
  } as const;
}
