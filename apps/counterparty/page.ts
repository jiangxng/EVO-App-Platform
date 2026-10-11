import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  fieldsForSurfaceV010,
  localizedTextV010,
  type EffectiveObjectSchemaV010,
  type FoundationObjectFieldSurfaceV010
} from "../../contracts/foundation-object/schema.js";
import type {
  CounterpartySubjectV010
} from "./repository.js";
import type {
  CounterpartyRelationshipRoleCodeV010,
  CounterpartyRelationshipRoleV010
} from "./roles.js";
import type {
  CounterpartyAddressV010,
  CounterpartyContactV010,
  CounterpartyRelationshipProfileV010
} from "./facets.js";
import {
  createCounterpartyEffectiveObjectSchemaV010
} from "./foundation-object.js";
import {
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_ASSIGN_ROLE_COMMAND,
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_CREATE_ROUTE,
  COUNTERPARTY_CUSTOMERS_ROUTE,
  COUNTERPARTY_DIRECTORY_ROUTE,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE,
  COUNTERPARTY_REMOVE_ROLE_COMMAND,
  COUNTERPARTY_SUPPLIERS_ROUTE,
  COUNTERPARTY_UPDATE_COMMAND,
  counterpartyDetailRouteV010,
  counterpartyEditRouteV010
} from "./constants.js";
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_SUPPLIER_PROJECTION_V010,
  type CounterpartyProjectionIdV010
} from "./projections.js";

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
        import: "导入",
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
        relationshipRoles: "关系角色",
        noRelationshipRole: "未设置",
        customer: "客户",
        supplier: "供应商",
        addCustomerRole: "设为客户",
        removeCustomerRole: "取消客户角色",
        addSupplierRole: "设为供应商",
        removeSupplierRole: "取消供应商角色",
        roleHelp:
          "关系角色描述本企业与该往来对象的业务关系，不改变往来对象身份。",
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
        save: "创建往来对象",
        customers: "客户",
        suppliers: "供应商",
        myCustomers: "我的客户",
        mySuppliers: "我的供应商",
        projectionDescription: "按业务关系与当前责任范围查看往来对象。",
        projectionEmpty: "当前视图没有可查看的往来对象。",
        customerProfile: "客户资料",
        supplierProfile: "供应商资料",
        profileEmpty: "该关系角色暂未维护更多资料。",
        contacts: "联系人",
        addresses: "地址",
        contactTitle: "职位",
        contactDepartment: "部门",
        addressPurpose: "用途",
        addressCity: "城市",
        addressRegion: "省/州/区域",
        addressPostalCode: "邮编",
        addressCountryOrRegion: "国家或地区",
        primary: "主要",
        registered: "注册地址",
        billing: "账单地址",
        shipping: "收货地址",
        other: "其他地址",
        customerLevel: "客户等级",
        customerSource: "客户来源",
        salesRegion: "销售区域",
        supplierClassification: "供应商分类",
        procurementRegion: "采购区域"
      }
    : {
        title: "Counterparties",
        description:
          "Manage parties that have business, economic or settlement relationships with the current enterprise. Customer and Supplier are roles, not duplicate identities.",
        search: "Search code or name",
        empty: "No counterparties yet.",
        create: "New counterparty",
        import: "Import",
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
        relationshipRoles: "Relationship roles",
        noRelationshipRole: "None",
        customer: "Customer",
        supplier: "Supplier",
        addCustomerRole: "Assign Customer role",
        removeCustomerRole: "Remove Customer role",
        addSupplierRole: "Assign Supplier role",
        removeSupplierRole: "Remove Supplier role",
        roleHelp:
          "Relationship roles describe how this enterprise relates to the counterparty without changing its identity.",
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
        save: "Create counterparty",
        customers: "Customers",
        suppliers: "Suppliers",
        myCustomers: "My Customers",
        mySuppliers: "My Suppliers",
        projectionDescription:
          "View counterparties by business relationship and current responsibility scope.",
        projectionEmpty: "No counterparties are visible in this view.",
        customerProfile: "Customer profile",
        supplierProfile: "Supplier profile",
        profileEmpty: "No additional profile data has been maintained for this relationship yet.",
        contacts: "Contacts",
        addresses: "Addresses",
        contactTitle: "Title",
        contactDepartment: "Department",
        addressPurpose: "Purpose",
        addressCity: "City",
        addressRegion: "Region",
        addressPostalCode: "Postal code",
        addressCountryOrRegion: "Country or region",
        primary: "Primary",
        registered: "Registered",
        billing: "Billing",
        shipping: "Shipping",
        other: "Other",
        customerLevel: "Customer level",
        customerSource: "Customer source",
        salesRegion: "Sales region",
        supplierClassification: "Supplier classification",
        procurementRegion: "Procurement region"
      };
}

function subjectTypeLabel(
  value: CounterpartySubjectV010["subjectType"],
  locale?: string
): string {
  const text = textFor(locale);
  return value === "ORGANIZATION" ? text.organization : text.person;
}

function relationshipRoleLabel(
  value: CounterpartyRelationshipRoleCodeV010,
  locale?: string
): string {
  const text = textFor(locale);
  return value === "CUSTOMER" ? text.customer : text.supplier;
}

export function createCounterpartyDirectoryPageV010(input: {
  counterparties: readonly CounterpartySubjectV010[];
  importRoute?: string;
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const canManage = input.canManage ?? true;
  const readable = input.readableFieldIds
    ? new Set(input.readableFieldIds)
    : undefined;
  const canRead = (fieldId: string) => !readable || readable.has(fieldId);
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo-counterparty.directory",
    title: text.title,
    description: text.description,
    actions: [
      ...(canManage && input.importRoute
        ? [{
            id: "import",
            label: text.import,
            type: "navigate" as const,
            route: input.importRoute,
            requiresConfirmation: false
          }]
        : []),
      ...(canManage
        ? [{
            id: "create",
            label: text.create,
            type: "navigate" as const,
            route: COUNTERPARTY_CREATE_ROUTE,
            requiresConfirmation: false,
            primary: true
          }]
        : [])
    ],
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: input.counterparties.map(counterparty => ({
        id: counterparty.counterpartyId,
        title: counterparty.displayName,
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
          ...(canRead("code")
            ? { [text.code]: counterparty.code }
            : {}),
          ...(canRead("subjectType")
            ? {
                [text.subjectType]: subjectTypeLabel(
                  counterparty.subjectType,
                  input.locale
                )
              }
            : {}),
          ...(canRead("taxIdentifier") && counterparty.taxIdentifier
            ? { [text.taxIdentifier]: counterparty.taxIdentifier }
            : {}),
          ...(canRead("countryOrRegion") && counterparty.countryOrRegion
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
    emptyMessage: text.empty
  };
}

function projectionTitleV010(
  projectionId: CounterpartyProjectionIdV010,
  locale?: string
): string {
  const text = textFor(locale);
  switch (projectionId) {
    case COUNTERPARTY_CUSTOMER_PROJECTION_V010:
      return text.customers;
    case COUNTERPARTY_SUPPLIER_PROJECTION_V010:
      return text.suppliers;
    case COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010:
      return text.myCustomers;
    case COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010:
      return text.mySuppliers;
  }
}

export function createCounterpartyProjectionPageV010(input: {
  projectionId: CounterpartyProjectionIdV010;
  counterparties: readonly CounterpartySubjectV010[];
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const title = projectionTitleV010(
    input.projectionId,
    input.locale
  );
  const page = createCounterpartyDirectoryPageV010({
    counterparties: input.counterparties,
    locale: input.locale,
    readableFieldIds: input.readableFieldIds,
    canManage: input.canManage
  });
  return {
    ...page,
    id: "evo-counterparty.projection." + input.projectionId,
    title,
    description: text.projectionDescription,
    contextNavigation: {
      items: [{
        id: "counterparties",
        label: text.title,
        route: COUNTERPARTY_DIRECTORY_ROUTE
      }, {
        id: "projection",
        label: title
      }]
    },
    actions: [{
      id: "customers",
      label: text.customers,
      type: "navigate",
      route: COUNTERPARTY_CUSTOMERS_ROUTE,
      requiresConfirmation: false
    }, {
      id: "suppliers",
      label: text.suppliers,
      type: "navigate",
      route: COUNTERPARTY_SUPPLIERS_ROUTE,
      requiresConfirmation: false
    }, {
      id: "my-customers",
      label: text.myCustomers,
      type: "navigate",
      route: COUNTERPARTY_MY_CUSTOMERS_ROUTE,
      requiresConfirmation: false
    }, {
      id: "my-suppliers",
      label: text.mySuppliers,
      type: "navigate",
      route: COUNTERPARTY_MY_SUPPLIERS_ROUTE,
      requiresConfirmation: false
    }],
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.projectionEmpty
    },
    emptyMessage: text.projectionEmpty
  };
}

export function createCounterpartyDetailPageV010(input: {
  counterparty: CounterpartySubjectV010;
  roles?: readonly CounterpartyRelationshipRoleV010[];
  customerProfile?: CounterpartyRelationshipProfileV010;
  supplierProfile?: CounterpartyRelationshipProfileV010;
  contacts?: readonly CounterpartyContactV010[];
  addresses?: readonly CounterpartyAddressV010[];
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const subject = input.counterparty;
  const canManage = input.canManage ?? true;
  const readable = input.readableFieldIds
    ? new Set(input.readableFieldIds)
    : undefined;
  const canRead = (fieldId: string) => !readable || readable.has(fieldId);
  const roles = [...(input.roles ?? [])]
    .sort((a, b) => a.roleCode.localeCompare(b.roleCode));
  const activeRoleCodes = new Set(
    roles.map(role => role.roleCode)
  );
  const roleLabels = roles.map(role =>
    relationshipRoleLabel(role.roleCode, input.locale)
  );

  const facetItems: CatalogBrowserV010["items"] = [];

  const customerProfileReadable = [
    "customerLevel",
    "customerSource",
    "salesRegion"
  ].some(canRead);
  if (activeRoleCodes.has("CUSTOMER") && customerProfileReadable) {
    const values = input.customerProfile?.values ?? {};
    const metadata = {
      ...(canRead("customerLevel") && values.customerLevel
        ? { [text.customerLevel]: String(values.customerLevel) }
        : {}),
      ...(canRead("customerSource") && values.customerSource
        ? { [text.customerSource]: String(values.customerSource) }
        : {}),
      ...(canRead("salesRegion") && values.salesRegion
        ? { [text.salesRegion]: String(values.salesRegion) }
        : {})
    };
    facetItems.push({
      id: subject.counterpartyId + ":customer-profile",
      title: text.customerProfile,
      category: text.customerProfile,
      ...(Object.keys(metadata).length === 0
        ? { summary: text.profileEmpty }
        : {}),
      metadata
    });
  }

  const supplierProfileReadable = [
    "supplierClassification",
    "procurementRegion"
  ].some(canRead);
  if (activeRoleCodes.has("SUPPLIER") && supplierProfileReadable) {
    const values = input.supplierProfile?.values ?? {};
    const metadata = {
      ...(canRead("supplierClassification") && values.supplierClassification
        ? {
            [text.supplierClassification]:
              String(values.supplierClassification)
          }
        : {}),
      ...(canRead("procurementRegion") && values.procurementRegion
        ? { [text.procurementRegion]: String(values.procurementRegion) }
        : {})
    };
    facetItems.push({
      id: subject.counterpartyId + ":supplier-profile",
      title: text.supplierProfile,
      category: text.supplierProfile,
      ...(Object.keys(metadata).length === 0
        ? { summary: text.profileEmpty }
        : {}),
      metadata
    });
  }

  const contactReadable = [
    "primaryContactName",
    "primaryContactTitle",
    "primaryContactPhone",
    "primaryContactEmail"
  ].some(canRead);
  if (contactReadable) {
    for (const contact of input.contacts ?? []) {
      const metadata = {
        ...(canRead("primaryContactTitle") && contact.title
          ? { [text.contactTitle]: contact.title }
          : {}),
        ...(canRead("primaryContactPhone") && contact.phone
          ? { [text.phone]: contact.phone }
          : {}),
        ...(canRead("primaryContactEmail") && contact.email
          ? { [text.email]: contact.email }
          : {})
      };
      facetItems.push({
        id: subject.counterpartyId + ":contact:" + contact.contactId,
        title: canRead("primaryContactName")
          ? contact.displayName
          : text.contacts,
        category: text.contacts,
        ...(contact.isPrimary ? { badges: [text.primary] } : {}),
        metadata
      });
    }
  }

  const addressReadable = [
    "primaryAddressLine1",
    "primaryAddressCity",
    "primaryAddressRegion",
    "primaryAddressPostalCode",
    "primaryAddressCountryOrRegion"
  ].some(canRead);
  if (addressReadable) {
    for (const address of input.addresses ?? []) {
      const purposeLabel =
        address.purpose === "REGISTERED"
          ? text.registered
          : address.purpose === "BILLING"
            ? text.billing
            : address.purpose === "SHIPPING"
              ? text.shipping
              : text.other;
      const metadata = {
        [text.addressPurpose]: purposeLabel,
        ...(canRead("primaryAddressCity") && address.city
          ? { [text.addressCity]: address.city }
          : {}),
        ...(canRead("primaryAddressRegion") && address.region
          ? { [text.addressRegion]: address.region }
          : {}),
        ...(canRead("primaryAddressPostalCode") && address.postalCode
          ? { [text.addressPostalCode]: address.postalCode }
          : {}),
        ...(canRead("primaryAddressCountryOrRegion")
          && address.countryOrRegion
          ? { [text.addressCountryOrRegion]: address.countryOrRegion }
          : {})
      };
      facetItems.push({
        id: subject.counterpartyId + ":address:" + address.addressId,
        title: canRead("primaryAddressLine1")
          ? address.line1
          : text.addresses,
        category: text.addresses,
        ...(address.isPrimary ? { badges: [text.primary] } : {}),
        metadata
      });
    }
  }

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    id: "evo-counterparty.detail",
    title: subject.displayName,
    description: text.detailDescription,
    contextNavigation: {
      items: [{
        id: "counterparties",
        label: text.title,
        route: COUNTERPARTY_DIRECTORY_ROUTE
      }, {
        id: "counterparty",
        label: subject.displayName
      }]
    },
    actions: canManage
      ? [{
          id: "edit",
          label: text.edit,
          type: "navigate",
          route: counterpartyEditRouteV010(subject.counterpartyId),
          requiresConfirmation: false
        }]
      : [],
    items: [{
      id: subject.counterpartyId,
      title: subject.displayName,
      ...(canRead("legalName") && subject.legalName
        ? { summary: subject.legalName }
        : canRead("code")
          ? { summary: subject.code }
          : {}),
      ...(roleLabels.length > 0 ? { badges: roleLabels } : {}),
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
        ...(canRead("code") ? { [text.code]: subject.code } : {}),
        ...(canRead("subjectType")
          ? {
              [text.subjectType]: subjectTypeLabel(
                subject.subjectType,
                input.locale
              )
            }
          : {}),
        [text.relationshipRoles]:
          roleLabels.join(" · ") || text.noRelationshipRole,
        ...(canRead("legalName") && subject.legalName
          ? { [text.legalName]: subject.legalName }
          : {}),
        ...(canRead("taxIdentifier") && subject.taxIdentifier
          ? { [text.taxIdentifier]: subject.taxIdentifier }
          : {}),
        ...(canRead("countryOrRegion") && subject.countryOrRegion
          ? { [text.countryOrRegion]: subject.countryOrRegion }
          : {}),
        ...(canRead("phone") && subject.phone
          ? { [text.phone]: subject.phone }
          : {}),
        ...(canRead("email") && subject.email
          ? { [text.email]: subject.email }
          : {})
      },
      secondaryActions: canManage ? [{
        id: "toggle-customer-role",
        label: activeRoleCodes.has("CUSTOMER")
          ? text.removeCustomerRole
          : text.addCustomerRole,
        type: "command",
        command: activeRoleCodes.has("CUSTOMER")
          ? COUNTERPARTY_REMOVE_ROLE_COMMAND
          : COUNTERPARTY_ASSIGN_ROLE_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: activeRoleCodes.has("CUSTOMER"),
        helpText: text.roleHelp,
        values: {
          counterpartyId: subject.counterpartyId,
          roleCode: "CUSTOMER"
        }
      }, {
        id: "toggle-supplier-role",
        label: activeRoleCodes.has("SUPPLIER")
          ? text.removeSupplierRole
          : text.addSupplierRole,
        type: "command",
        command: activeRoleCodes.has("SUPPLIER")
          ? COUNTERPARTY_REMOVE_ROLE_COMMAND
          : COUNTERPARTY_ASSIGN_ROLE_COMMAND,
        inputVersion: "0.1.0",
        requiresConfirmation: activeRoleCodes.has("SUPPLIER"),
        helpText: text.roleHelp,
        values: {
          counterpartyId: subject.counterpartyId,
          roleCode: "SUPPLIER"
        }
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
      }] : []
    }, ...facetItems]
  };
}

function counterpartyFormFieldsV010(input: {
  schema: EffectiveObjectSchemaV010;
  surface: Extract<FoundationObjectFieldSurfaceV010, "CREATE" | "EDIT">;
  initialValues?: Record<string, string>;
}) {
  return fieldsForSurfaceV010(input.schema, input.surface).map(field => ({
    key: field.fieldId,
    label: field.resolvedLabel,
    semanticType: field.semanticType,
    control: field.control,
    required: field.required,
    ...(field.readOnly ? { readOnly: true } : {}),
    ...(input.initialValues && field.fieldId in input.initialValues
      ? { initialValue: input.initialValues[field.fieldId] }
      : {}),
    ...(field.enumOptions
      ? {
          options: field.enumOptions.map(option => ({
            value: option.value,
            label: localizedTextV010(option.label, input.schema.locale)
          }))
        }
      : {})
  }));
}

export function createCounterpartyCreatePageV010(locale?: string) {
  const text = textFor(locale);
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-counterparty.create",
    title: text.formTitle,
    description: text.formDescription,
    contextNavigation: {
      items: [{
        id: "counterparties",
        label: text.title,
        route: COUNTERPARTY_DIRECTORY_ROUTE
      }, {
        id: "create",
        label: text.formTitle
      }]
    },
    purpose: "execute-command",
    command: {
      code: COUNTERPARTY_CREATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: counterpartyFormFieldsV010({
      schema: createCounterpartyEffectiveObjectSchemaV010({ locale }),
      surface: "CREATE"
    }),
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
    description: text.formDescription,
    contextNavigation: {
      items: [{
        id: "counterparties",
        label: text.title,
        route: COUNTERPARTY_DIRECTORY_ROUTE
      }, {
        id: "counterparty",
        label: subject.displayName,
        route: counterpartyDetailRouteV010(subject.counterpartyId)
      }, {
        id: "edit",
        label: text.editFormTitle
      }]
    },
    purpose: "execute-command",
    command: {
      code: COUNTERPARTY_UPDATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: counterpartyFormFieldsV010({
      schema: createCounterpartyEffectiveObjectSchemaV010({
        locale: input.locale
      }),
      surface: "EDIT",
      initialValues: {
        counterpartyId: subject.counterpartyId,
        code: subject.code,
        displayName: subject.displayName,
        subjectType: subject.subjectType,
        legalName: subject.legalName ?? "",
        taxIdentifier: subject.taxIdentifier ?? "",
        countryOrRegion: subject.countryOrRegion ?? "",
        phone: subject.phone ?? "",
        email: subject.email ?? "",
        notes: subject.notes ?? ""
      }
    }),
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
