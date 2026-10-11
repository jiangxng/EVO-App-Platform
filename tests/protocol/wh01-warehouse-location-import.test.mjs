import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createWarehouseRepositoryV010
} from "../../dist/apps/warehouse/repository.js";
import {
  createWarehouseLocationRepositoryV010
} from "../../dist/apps/warehouse/locations.js";
import {
  createWarehouseLocationImportTargetV010
} from "../../dist/apps/warehouse/import-target.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportServiceV010
} from "../../dist/apps/data-import/service.js";

function seedWarehouse(repository, input = {}) {
  return repository.save({
    contextId: input.contextId ?? "enterprise-context:wh01",
    warehouse: {
      contractVersion: "0.1.0",
      warehouseId: input.warehouseId ?? "warehouse-a",
      code: input.code ?? "WH-A",
      displayName: input.displayName ?? "Warehouse A"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:40:00.000Z"
  });
}

function mapping() {
  return [
    ["warehouseCode", "warehouseCode"],
    ["path", "path"],
    ["displayName", "displayName"],
    ["locationKind", "locationKind"],
    ["description", "description"]
  ].map(([sourceColumn, targetFieldId]) => ({
    sourceColumn,
    targetFieldId
  }));
}

function serviceHarness() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);
  const jobs = createDataImportRepositoryV010(resources);
  const target = createWarehouseLocationImportTargetV010({
    resources,
    warehouseRepository: warehouses,
    locationRepository: locations
  });
  const service = createDataImportServiceV010({
    repository: jobs,
    targets: [target]
  });
  return { resources, warehouses, locations, target, service };
}

test("WH-01B imports same-batch Warehouse hierarchy independent of source row order", () => {
  const { warehouses, locations, service } = serviceHarness();
  seedWarehouse(warehouses);

  const staged = service.stage({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-hierarchy-order-independent",
    targetId: "warehouse.location",
    source: {
      kind: "ROWS",
      name: "Warehouse hierarchy",
      headers: [
        "warehouseCode",
        "path",
        "displayName",
        "locationKind",
        "description"
      ],
      rows: [{
        warehouseCode: "WH-A",
        path: "ZONE-A/01/BIN-01",
        displayName: "Bin 01",
        locationKind: "BIN",
        description: "Child appears before its parents"
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-B/01",
        displayName: "Location 01 in Zone B",
        locationKind: "LOCATION",
        description: ""
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-A",
        displayName: "Zone A",
        locationKind: "ZONE",
        description: ""
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-B",
        displayName: "Zone B",
        locationKind: "ZONE",
        description: ""
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-A/01",
        displayName: "Location 01 in Zone A",
        locationKind: "LOCATION",
        description: ""
      }]
    },
    mapping: mapping(),
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:41:00.000Z"
  });
  assert.equal(staged.state, "STAGED");

  const dryRun = service.dryRun({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-hierarchy-order-independent",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:42:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");
  assert.equal(dryRun.dryRun.totalRows, 5);
  assert.equal(dryRun.dryRun.validRows, 5);
  assert.equal(dryRun.dryRun.invalidRows, 0);

  const committed = service.commit({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-hierarchy-order-independent",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:43:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");
  assert.equal(committed.receipt.succeededRows, 5);
  assert.equal(committed.receipt.failedRows, 0);

  const all = locations.list("enterprise-context:wh01", "warehouse-a");
  assert.equal(all.length, 5);

  const zoneA = all.find(item => item.code === "ZONE-A");
  const zoneB = all.find(item => item.code === "ZONE-B");
  assert.ok(zoneA);
  assert.ok(zoneB);

  const location01A = all.find(item =>
    item.code === "01" && item.parentLocationId === zoneA.locationId
  );
  const location01B = all.find(item =>
    item.code === "01" && item.parentLocationId === zoneB.locationId
  );
  assert.ok(location01A);
  assert.ok(location01B);
  assert.notEqual(location01A.locationId, location01B.locationId);

  const bin = all.find(item => item.code === "BIN-01");
  assert.ok(bin);
  assert.equal(bin.parentLocationId, location01A.locationId);
});

test("WH-01B resolves existing parents and same-batch children together", () => {
  const { warehouses, locations, service } = serviceHarness();
  seedWarehouse(warehouses);

  const zone = locations.save({
    contextId: "enterprise-context:wh01",
    location: {
      contractVersion: "0.1.0",
      locationId: "existing-zone",
      warehouseId: "warehouse-a",
      code: "ZONE-A",
      displayName: "Existing Zone A",
      locationKind: "ZONE"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:44:00.000Z"
  });

  service.stage({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-existing-parent",
    targetId: "warehouse.location",
    source: {
      kind: "ROWS",
      name: "Existing parent hierarchy",
      headers: [
        "warehouseCode",
        "path",
        "displayName",
        "locationKind",
        "description"
      ],
      rows: [{
        warehouseCode: "WH-A",
        path: "ZONE-A/01/BIN-02",
        displayName: "Bin 02",
        locationKind: "BIN",
        description: ""
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-A/01",
        displayName: "Location 01",
        locationKind: "LOCATION",
        description: ""
      }]
    },
    mapping: mapping(),
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:45:00.000Z"
  });
  service.dryRun({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-existing-parent",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:46:00.000Z"
  });
  const committed = service.commit({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-existing-parent",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:47:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");

  const all = locations.list("enterprise-context:wh01", "warehouse-a");
  const location = all.find(item => item.code === "01");
  assert.ok(location);
  assert.equal(location.parentLocationId, zone.locationId);
  const bin = all.find(item => item.code === "BIN-02");
  assert.equal(bin.parentLocationId, location.locationId);
});

test("WH-01B orphan hierarchy fails atomically without partial Warehouse Location writes", () => {
  const { warehouses, locations, service } = serviceHarness();
  seedWarehouse(warehouses);

  service.stage({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-orphan",
    targetId: "warehouse.location",
    source: {
      kind: "ROWS",
      name: "Orphan hierarchy",
      headers: [
        "warehouseCode",
        "path",
        "displayName",
        "locationKind",
        "description"
      ],
      rows: [{
        warehouseCode: "WH-A",
        path: "ZONE-MISSING/01",
        displayName: "Orphan child",
        locationKind: "LOCATION",
        description: ""
      }, {
        warehouseCode: "WH-A",
        path: "ZONE-VALID",
        displayName: "Would otherwise be valid",
        locationKind: "ZONE",
        description: ""
      }]
    },
    mapping: mapping(),
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:48:00.000Z"
  });
  const dryRun = service.dryRun({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-orphan",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:49:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");

  const committed = service.commit({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-orphan",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:50:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED_WITH_ERRORS");
  assert.equal(committed.receipt.succeededRows, 0);
  assert.equal(committed.receipt.failedRows, 2);
  assert.equal(
    locations.list("enterprise-context:wh01", "warehouse-a").length,
    0
  );
  assert.ok(committed.receipt.rows.every(row =>
    row.issues.some(issue =>
      issue.message.includes("WAREHOUSE_LOCATION_IMPORT_PARENT_NOT_FOUND")
    )
  ));
});

test("WH-01B duplicate hierarchy path fails during dry-run", () => {
  const { warehouses, service } = serviceHarness();
  seedWarehouse(warehouses);

  service.stage({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-duplicate-path",
    targetId: "warehouse.location",
    source: {
      kind: "ROWS",
      name: "Duplicate path",
      headers: [
        "warehouseCode",
        "path",
        "displayName",
        "locationKind",
        "description"
      ],
      rows: [{
        warehouseCode: "WH-A",
        path: "ZONE-A",
        displayName: "Zone A",
        locationKind: "ZONE",
        description: ""
      }, {
        warehouseCode: "wh-a",
        path: "zone-a",
        displayName: "Duplicate Zone A",
        locationKind: "ZONE",
        description: ""
      }]
    },
    mapping: mapping(),
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:51:00.000Z"
  });
  const dryRun = service.dryRun({
    contextId: "enterprise-context:wh01",
    importJobId: "wh01-duplicate-path",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T14:52:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_FAILED");
  assert.equal(dryRun.dryRun.invalidRows, 1);
  assert.ok(dryRun.dryRun.rows[1].issues.some(issue =>
    issue.code === "DATA_IMPORT_DUPLICATE_IN_BATCH"
  ));
});

test("WH-01B hierarchy import schema contains no Inventory Position or stock-balance fields", () => {
  const { target } = serviceHarness();
  const schema = target.describe({
    contextId: "enterprise-context:wh01",
    locale: "zh-CN"
  });
  assert.deepEqual(
    schema.fields.map(field => field.fieldId),
    ["warehouseCode", "path", "displayName", "locationKind", "description"]
  );
  const serialized = JSON.stringify(schema).toLocaleLowerCase();
  for (const forbidden of [
    "itemid",
    "onhand",
    "availableqty",
    "reservedqty",
    "inventorybalance",
    "ledgerbalance"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
