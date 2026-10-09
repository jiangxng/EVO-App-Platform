import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  fieldsForSurfaceV010,
  localizedTextV010,
  type FoundationObjectFieldSurfaceV010
} from "../../contracts/foundation-object/schema.js";
import {
  createItemEffectiveObjectSchemaV010
} from "./foundation-object.js";
import {
  ITEM_ARCHIVE_COMMAND,
  ITEM_CREATE_COMMAND,
  ITEM_CREATE_ROUTE,
  ITEM_DIRECTORY_ROUTE,
  ITEM_MY_ITEMS_ROUTE,
  ITEM_UPDATE_COMMAND,
  itemDetailRouteV010,
  itemEditRouteV010
} from "./constants.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  ITEM_STEWARD_RESPONSIBILITY_V010,
  type ItemProjectionIdV010
} from "./projections.js";
import type {
  ItemProjectionRecordV010
} from "./projection-service.js";
import type {
  ItemSubjectV010
} from "./repository.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "物料 / 项目",
        description: "维护企业内可交易、可计量的稳定 Item 身份。产品模板、SKU、变体与 GTIN 在边界证明完成前不并入此身份。",
        search: "搜索编码或名称",
        empty: "还没有 Item。",
        create: "新建 Item",
        import: "导入",
        code: "Item 编码",
        kind: "Item 类型",
        uom: "基本计量单位",
        goods: "货物",
        service: "服务",
        myItems: "我的 Item",
        myItemsDescription: "由共享 Responsibility 的 Item 主数据责任范围派生，不代表额外读取权限。",
        steward: "Item 责任人",
        noSteward: "未分配",
        edit: "编辑",
        archive: "归档",
        archiveHelp: "从日常目录移除，但保留企业资源身份与历史。",
        detailDescription: "Item 详情是由 Item 身份、企业扩展与 Responsibility 派生的读模型，不是第二份业务数据权威。",
        formTitle: "新建 Item",
        editFormTitle: "编辑 Item",
        formDescription: "维护稳定 Item 身份。SKU、变体、GTIN、分类等后续在真实数据压力下单独确定边界。",
        saveCreate: "创建 Item",
        saveUpdate: "保存修改",
        extension: "企业扩展",
        responsibility: "责任"
      }
    : {
        title: "Items",
        description: "Manage stable enterprise Item identities that can be traded or measured. Product templates, SKUs, variants and GTINs are not collapsed into this identity before the boundary proof is complete.",
        search: "Search code or name",
        empty: "No Items yet.",
        create: "New Item",
        import: "Import",
        code: "Item code",
        kind: "Item kind",
        uom: "Base unit",
        goods: "Goods",
        service: "Service",
        myItems: "My Items",
        myItemsDescription: "Derived from shared Item stewardship Responsibility. Stewardship does not grant additional read authority.",
        steward: "Item steward",
        noSteward: "Unassigned",
        edit: "Edit",
        archive: "Archive",
        archiveHelp: "Remove this Item from normal directories while preserving its enterprise resource identity and history.",
        detailDescription: "This Item detail is a derived read model over Item identity, Enterprise Extensions and Responsibility; it is not a second business-data authority.",
        formTitle: "New Item",
        editFormTitle: "Edit Item",
        formDescription: "Maintain the stable Item identity. SKU, variant, GTIN and category boundaries remain separate until real-world pressure evidence is complete.",
        saveCreate: "Create Item",
        saveUpdate: "Save changes",
        extension: "Enterprise extension",
        responsibility: "Responsibility"
      };
}

function itemKindLabel(
  item: ItemSubjectV010,
  locale?: string
): string {
  const text = textFor(locale);
  return item.itemKind === "GOODS" ? text.goods : text.service;
}

function canReadSet(readableFieldIds?: readonly string[]) {
  const readable = readableFieldIds
    ? new Set(readableFieldIds)
    : undefined;
  return (fieldId: string) => !readable || readable.has(fieldId);
}

function itemRows(
  records: readonly ItemProjectionRecordV010[],
  input: {
    locale?: string;
    readableFieldIds?: readonly string[];
  }
): CatalogBrowserV010["items"] {
  const text = textFor(input.locale);
  const canRead = canReadSet(input.readableFieldIds);
  return records.map(record => {
    const item = record.item;
    const stewards = record.responsibilities
      .filter(assignment =>
        assignment.responsibilityType === ITEM_STEWARD_RESPONSIBILITY_V010
        && assignment.assigneeRef.kind === "PRINCIPAL"
      )
      .map(assignment => assignment.assigneeRef.id)
      .sort();
    return {
      id: item.itemId,
      title: item.displayName,
      ...(canRead("description") && item.description
        ? { summary: item.description }
        : canRead("code")
          ? { summary: item.code }
          : {}),
      badges: canRead("itemKind")
        ? [itemKindLabel(item, input.locale)]
        : [],
      metadata: {
        ...(canRead("code") ? { [text.code]: item.code } : {}),
        ...(canRead("itemKind")
          ? { [text.kind]: itemKindLabel(item, input.locale) }
          : {}),
        ...(canRead("baseUomCode")
          ? { [text.uom]: item.baseUomCode }
          : {}),
        [text.steward]: stewards.join(" · ") || text.noSteward
      },
      primaryAction: {
        id: "view",
        label: item.displayName,
        type: "navigate",
        route: itemDetailRouteV010(item.itemId),
        requiresConfirmation: false
      }
    };
  });
}

export function createItemDirectoryPageV010(input: {
  records: readonly ItemProjectionRecordV010[];
  importRoute?: string;
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const canManage = input.canManage ?? true;
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo-item.directory",
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
            route: ITEM_CREATE_ROUTE,
            requiresConfirmation: false,
            primary: true
          }]
        : []),
      {
        id: "my-items",
        label: text.myItems,
        type: "navigate",
        route: ITEM_MY_ITEMS_ROUTE,
        requiresConfirmation: false
      }
    ],
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: itemRows(input.records, input),
    emptyMessage: text.empty
  };
}

export function createItemProjectionPageV010(input: {
  projectionId: ItemProjectionIdV010;
  records: readonly ItemProjectionRecordV010[];
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const page = createItemDirectoryPageV010({
    records: input.records,
    locale: input.locale,
    readableFieldIds: input.readableFieldIds,
    canManage: input.canManage
  });
  const myItems = input.projectionId === ITEM_MY_ITEMS_PROJECTION_V010;
  return {
    ...page,
    id: "evo-item.projection." + input.projectionId,
    title: myItems ? text.myItems : text.title,
    description: myItems ? text.myItemsDescription : text.description,
    contextNavigation: {
      items: [{
        id: "items",
        label: text.title,
        route: ITEM_DIRECTORY_ROUTE
      }, ...(myItems
        ? [{ id: "my-items", label: text.myItems }]
        : [])]
    },
    actions: [{
      id: "all-items",
      label: text.title,
      type: "navigate",
      route: ITEM_DIRECTORY_ROUTE,
      requiresConfirmation: false
    }, {
      id: "my-items",
      label: text.myItems,
      type: "navigate",
      route: ITEM_MY_ITEMS_ROUTE,
      requiresConfirmation: false
    }]
  };
}

export function createItemDetailPageV010(input: {
  record: ItemProjectionRecordV010;
  locale?: string;
  readableFieldIds?: readonly string[];
  canManage?: boolean;
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const canManage = input.canManage ?? true;
  const canRead = canReadSet(input.readableFieldIds);
  const item = input.record.item;
  const stewards = input.record.responsibilities
    .filter(assignment =>
      assignment.responsibilityType === ITEM_STEWARD_RESPONSIBILITY_V010
    )
    .map(assignment => assignment.assigneeRef.id)
    .sort();
  const extensionItems: CatalogBrowserV010["items"] =
    input.record.extensionValues.map((valueSet, index) => ({
      id: item.itemId + ":extension:" + index,
      title: valueSet.namespace,
      category: text.extension,
      summary: valueSet.targetRef.slot,
      metadata: Object.fromEntries(
        Object.entries(valueSet.values).map(([key, value]) => [
          key,
          value === null ? "" : String(value)
        ])
      )
    }));

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    id: "evo-item.detail",
    title: item.displayName,
    description: text.detailDescription,
    contextNavigation: {
      items: [{
        id: "items",
        label: text.title,
        route: ITEM_DIRECTORY_ROUTE
      }, {
        id: "item",
        label: item.displayName
      }]
    },
    actions: canManage
      ? [{
          id: "edit",
          label: text.edit,
          type: "navigate",
          route: itemEditRouteV010(item.itemId),
          requiresConfirmation: false
        }]
      : [],
    items: [{
      id: item.itemId,
      title: item.displayName,
      ...(canRead("description") && item.description
        ? { summary: item.description }
        : canRead("code")
          ? { summary: item.code }
          : {}),
      ...(canRead("itemKind")
        ? { badges: [itemKindLabel(item, input.locale)] }
        : {}),
      metadata: {
        ...(canRead("code") ? { [text.code]: item.code } : {}),
        ...(canRead("itemKind")
          ? { [text.kind]: itemKindLabel(item, input.locale) }
          : {}),
        ...(canRead("baseUomCode")
          ? { [text.uom]: item.baseUomCode }
          : {}),
        [text.steward]: stewards.join(" · ") || text.noSteward
      },
      secondaryActions: canManage
        ? [{
            id: "archive",
            label: text.archive,
            type: "command",
            command: ITEM_ARCHIVE_COMMAND,
            inputVersion: "0.1.0",
            requiresConfirmation: true,
            helpText: text.archiveHelp,
            values: { itemId: item.itemId }
          }]
        : []
    }, ...extensionItems]
  };
}

function itemFormFieldsV010(input: {
  locale?: string;
  surface: Extract<FoundationObjectFieldSurfaceV010, "CREATE" | "EDIT">;
  initialValues?: Record<string, string>;
}) {
  const schema = createItemEffectiveObjectSchemaV010({
    locale: input.locale
  });
  return fieldsForSurfaceV010(schema, input.surface).map(field => ({
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
            label: localizedTextV010(option.label, schema.locale)
          }))
        }
      : {})
  }));
}

export function createItemCreatePageV010(locale?: string) {
  const text = textFor(locale);
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-item.create",
    title: text.formTitle,
    description: text.formDescription,
    contextNavigation: {
      items: [{
        id: "items",
        label: text.title,
        route: ITEM_DIRECTORY_ROUTE
      }, {
        id: "create",
        label: text.formTitle
      }]
    },
    purpose: "execute-command",
    command: {
      code: ITEM_CREATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: itemFormFieldsV010({
      locale,
      surface: "CREATE"
    }),
    actions: [{
      id: "create",
      label: text.saveCreate,
      type: "submit",
      command: ITEM_CREATE_COMMAND,
      requiresConfirmation: false
    }],
    metadata: {
      packageId: "evo-item",
      featureId: "evo-item.default",
      description: text.formDescription
    }
  } as const;
}

export function createItemEditPageV010(input: {
  item: ItemSubjectV010;
  locale?: string;
}) {
  const text = textFor(input.locale);
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-item.edit",
    title: text.editFormTitle,
    description: text.formDescription,
    contextNavigation: {
      items: [{
        id: "items",
        label: text.title,
        route: ITEM_DIRECTORY_ROUTE
      }, {
        id: "item",
        label: input.item.displayName,
        route: itemDetailRouteV010(input.item.itemId)
      }, {
        id: "edit",
        label: text.editFormTitle
      }]
    },
    purpose: "execute-command",
    command: {
      code: ITEM_UPDATE_COMMAND,
      inputVersion: "0.1.0"
    },
    fields: itemFormFieldsV010({
      locale: input.locale,
      surface: "EDIT",
      initialValues: {
        itemId: input.item.itemId,
        code: input.item.code,
        displayName: input.item.displayName,
        itemKind: input.item.itemKind,
        baseUomCode: input.item.baseUomCode,
        description: input.item.description ?? ""
      }
    }),
    actions: [{
      id: "update",
      label: text.saveUpdate,
      type: "submit",
      command: ITEM_UPDATE_COMMAND,
      requiresConfirmation: false
    }],
    metadata: {
      packageId: "evo-item",
      featureId: "evo-item.default",
      itemId: input.item.itemId,
      description: text.formDescription
    }
  } as const;
}
