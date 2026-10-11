import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import {
  WAREHOUSE_DIRECTORY_ROUTE,
  WAREHOUSE_MY_ROUTE,
  warehouseDetailRouteV010
} from "./constants.js";
import {
  WAREHOUSE_DIRECTORY_PROJECTION_V010,
  WAREHOUSE_MY_PROJECTION_V010,
  WAREHOUSE_STEWARD_RESPONSIBILITY_V010,
  type WarehouseProjectionIdV010
} from "./projections.js";
import type {
  WarehouseProjectionRecordV010
} from "./projection-service.js";
import type {
  WarehouseLocationV010
} from "./locations.js";

function textFor(locale?: string) {
  const zh = (locale ?? "").toLocaleLowerCase().startsWith("zh");
  return zh
    ? {
        title: "仓库 / 位置",
        description:
          "维护企业的物理场所身份与 Zone / Location / Bin 层级。这里回答“在哪里”，不承载库存数量。",
        search: "搜索仓库编码或名称",
        empty: "还没有仓库。",
        my: "我的仓库",
        myDescription:
          "由 WAREHOUSE_STEWARD 责任范围派生；责任关系本身不授予额外读取权限。",
        code: "仓库编码",
        steward: "仓库责任人",
        noSteward: "未分配",
        nodes: "位置节点",
        hierarchy: "位置层级",
        path: "路径",
        kind: "类型",
        noLocations: "尚未定义 Zone / Location / Bin。",
        extension: "企业扩展",
        detailDescription:
          "此页面是 Warehouse 身份、位置层级、企业扩展与 Responsibility 的派生读模型，不是第二份场所数据权威。"
      }
    : {
        title: "Warehouses / Locations",
        description:
          "Maintain enterprise place identity and Zone / Location / Bin hierarchy. This surface answers where; it does not carry inventory quantities.",
        search: "Search warehouse code or name",
        empty: "No Warehouses yet.",
        my: "My Warehouses",
        myDescription:
          "Derived from WAREHOUSE_STEWARD responsibility. Responsibility does not grant additional read authority.",
        code: "Warehouse code",
        steward: "Warehouse steward",
        noSteward: "Unassigned",
        nodes: "Location nodes",
        hierarchy: "Location hierarchy",
        path: "Path",
        kind: "Kind",
        noLocations: "No Zone / Location / Bin hierarchy yet.",
        extension: "Enterprise extension",
        detailDescription:
          "This page is a derived read model over Warehouse identity, location hierarchy, Enterprise Extensions and Responsibility; it is not a second place-data authority."
      };
}

function canReadSet(readableFieldIds?: readonly string[]) {
  const readable = readableFieldIds
    ? new Set(readableFieldIds)
    : undefined;
  return (fieldId: string) => !readable || readable.has(fieldId);
}

function stewards(record: WarehouseProjectionRecordV010): string[] {
  return record.responsibilities
    .filter(assignment =>
      assignment.responsibilityType ===
        WAREHOUSE_STEWARD_RESPONSIBILITY_V010
      && assignment.assigneeRef.kind === "PRINCIPAL"
    )
    .map(assignment => assignment.assigneeRef.id)
    .sort();
}

function locationPaths(
  locations: readonly WarehouseLocationV010[]
): Map<string, string> {
  const byId = new Map(locations.map(location => [
    location.locationId,
    location
  ] as const));
  const cache = new Map<string, string>();
  const visiting = new Set<string>();

  const resolve = (location: WarehouseLocationV010): string => {
    const cached = cache.get(location.locationId);
    if (cached) return cached;
    if (visiting.has(location.locationId)) {
      return "[invalid-cycle]/" + location.code;
    }
    visiting.add(location.locationId);
    const parent = location.parentLocationId
      ? byId.get(location.parentLocationId)
      : undefined;
    const path = parent
      ? resolve(parent) + "/" + location.code
      : location.code;
    visiting.delete(location.locationId);
    cache.set(location.locationId, path);
    return path;
  };

  for (const location of locations) resolve(location);
  return cache;
}

function warehouseRows(
  records: readonly WarehouseProjectionRecordV010[],
  input: {
    locale?: string;
    readableFieldIds?: readonly string[];
  }
): CatalogBrowserV010["items"] {
  const text = textFor(input.locale);
  const canRead = canReadSet(input.readableFieldIds);
  return records.map(record => ({
    id: record.warehouse.warehouseId,
    title: record.warehouse.displayName,
    ...(canRead("description") && record.warehouse.description
      ? { summary: record.warehouse.description }
      : canRead("code")
        ? { summary: record.warehouse.code }
        : {}),
    metadata: {
      ...(canRead("code")
        ? { [text.code]: record.warehouse.code }
        : {}),
      [text.nodes]: String(record.locations.length),
      [text.steward]: stewards(record).join(" · ") || text.noSteward
    },
    primaryAction: {
      id: "view",
      label: record.warehouse.displayName,
      type: "navigate",
      route: warehouseDetailRouteV010(record.warehouse.warehouseId),
      requiresConfirmation: false
    }
  }));
}

export function createWarehouseProjectionPageV010(input: {
  projectionId: WarehouseProjectionIdV010;
  records: readonly WarehouseProjectionRecordV010[];
  locale?: string;
  readableFieldIds?: readonly string[];
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const mine = input.projectionId === WAREHOUSE_MY_PROJECTION_V010;
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo-warehouse.projection." + input.projectionId,
    title: mine ? text.my : text.title,
    description: mine ? text.myDescription : text.description,
    contextNavigation: {
      items: [{
        id: "warehouses",
        label: text.title,
        route: WAREHOUSE_DIRECTORY_ROUTE
      }, ...(mine ? [{ id: "my-warehouses", label: text.my }] : [])]
    },
    actions: [{
      id: "all",
      label: text.title,
      type: "navigate",
      route: WAREHOUSE_DIRECTORY_ROUTE,
      requiresConfirmation: false
    }, {
      id: "mine",
      label: text.my,
      type: "navigate",
      route: WAREHOUSE_MY_ROUTE,
      requiresConfirmation: false
    }],
    search: {
      placeholder: text.search,
      ariaLabel: text.search,
      noResultsMessage: text.empty
    },
    items: warehouseRows(input.records, input),
    emptyMessage: text.empty
  };
}

export function createWarehouseDetailPageV010(input: {
  record: WarehouseProjectionRecordV010;
  locale?: string;
  readableFieldIds?: readonly string[];
}): CatalogBrowserV010 {
  const text = textFor(input.locale);
  const canRead = canReadSet(input.readableFieldIds);
  const paths = locationPaths(input.record.locations);
  const warehouse = input.record.warehouse;
  const locationRows: CatalogBrowserV010["items"] =
    [...input.record.locations]
      .sort((a, b) =>
        (paths.get(a.locationId) ?? "").localeCompare(
          paths.get(b.locationId) ?? ""
        )
      )
      .map(location => ({
        id: location.locationId,
        title: location.displayName,
        category: text.hierarchy,
        summary: paths.get(location.locationId) ?? location.code,
        badges: [location.locationKind],
        metadata: {
          [text.path]: paths.get(location.locationId) ?? location.code,
          [text.kind]: location.locationKind
        }
      }));

  const extensionRows: CatalogBrowserV010["items"] =
    input.record.extensionValues.map((valueSet, index) => ({
      id: warehouse.warehouseId + ":extension:" + index,
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
    id: "evo-warehouse.detail",
    title: warehouse.displayName,
    description: text.detailDescription,
    contextNavigation: {
      items: [{
        id: "warehouses",
        label: text.title,
        route: WAREHOUSE_DIRECTORY_ROUTE
      }, {
        id: "warehouse",
        label: warehouse.displayName
      }]
    },
    actions: [{
      id: "my-warehouses",
      label: text.my,
      type: "navigate",
      route: WAREHOUSE_MY_ROUTE,
      requiresConfirmation: false
    }],
    items: [{
      id: warehouse.warehouseId,
      title: warehouse.displayName,
      ...(canRead("description") && warehouse.description
        ? { summary: warehouse.description }
        : canRead("code")
          ? { summary: warehouse.code }
          : {}),
      metadata: {
        ...(canRead("code") ? { [text.code]: warehouse.code } : {}),
        [text.nodes]: String(input.record.locations.length),
        [text.steward]:
          stewards(input.record).join(" · ") || text.noSteward
      }
    }, ...locationRows, ...extensionRows],
    emptyMessage: text.noLocations
  };
}

export { WAREHOUSE_DIRECTORY_PROJECTION_V010 };
