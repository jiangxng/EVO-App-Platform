import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  assertFoundationObjectConformanceV010
} from "../../dist/foundation/testkit/index.js";
import {
  warehouseCoreSchemaV010,
  warehouseFoundationObjectDescriptorV010
} from "../../dist/apps/warehouse/foundation-object.js";
import {
  createWarehouseRepositoryV010
} from "../../dist/apps/warehouse/repository.js";
import {
  createWarehouseLocationRepositoryV010
} from "../../dist/apps/warehouse/locations.js";

function warehouse(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    warehouseId: "wh-1",
    code: "WH-001",
    displayName: "Main Warehouse",
    ...overrides
  };
}

function location(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    locationId: "zone-a",
    warehouseId: "wh-1",
    code: "A",
    displayName: "Zone A",
    locationKind: "ZONE",
    ...overrides
  };
}

test("WH-01A reuses Foundation Object contracts without inventory balance semantics", () => {
  const report = assertFoundationObjectConformanceV010({
    descriptor: warehouseFoundationObjectDescriptorV010,
    coreSchema: warehouseCoreSchemaV010
  });

  assert.equal(report.objectType, "warehouse.subject");
  assert.equal(report.ownerPackageId, "evo-warehouse");
  assert.equal(report.schemaRef, "evo.warehouse/0.1.0");
  assert.equal(report.fieldCount, 4);
  assert.equal(report.extensionSlotCount, 2);

  const serialized = JSON.stringify({
    descriptor: warehouseFoundationObjectDescriptorV010,
    schema: warehouseCoreSchemaV010
  }).toLocaleLowerCase();

  for (const forbidden of [
    "onhand",
    "on_hand",
    "quantity",
    "availablequantity",
    "inventoryposition",
    "inventory.position",
    "stockbalance"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("WH-01A persists Warehouse identity and Zone/Location/Bin hierarchy in Enterprise Context", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);

  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:50:00.000Z"
  });

  locations.save({
    contextId: "enterprise-context:a",
    location: location(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:51:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "loc-a-01",
      parentLocationId: "zone-a",
      code: "01",
      displayName: "Aisle 01",
      locationKind: "LOCATION"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:52:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "bin-a-01-01",
      parentLocationId: "loc-a-01",
      code: "01",
      displayName: "Bin A-01-01",
      locationKind: "BIN"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:53:00.000Z"
  });

  assert.equal(warehouses.list("enterprise-context:a").length, 1);
  assert.equal(locations.list("enterprise-context:a", "wh-1").length, 3);
  assert.deepEqual(
    locations.listChildren("enterprise-context:a", "wh-1")
      .map(item => item.locationId),
    ["zone-a"]
  );
  assert.deepEqual(
    locations.listChildren("enterprise-context:a", "wh-1", "zone-a")
      .map(item => item.locationId),
    ["loc-a-01"]
  );
  assert.deepEqual(
    locations.listChildren("enterprise-context:a", "wh-1", "loc-a-01")
      .map(item => item.locationId),
    ["bin-a-01-01"]
  );
});

test("WH-01A location codes are sibling-scoped rather than globally flattened", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);

  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:54:00.000Z"
  });
  for (const zone of [
    location({ locationId: "zone-a", code: "A", displayName: "Zone A" }),
    location({ locationId: "zone-b", code: "B", displayName: "Zone B" })
  ]) {
    locations.save({
      contextId: "enterprise-context:a",
      location: zone,
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-09T12:55:00.000Z"
    });
  }

  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "bin-a-01",
      parentLocationId: "zone-a",
      code: "01",
      displayName: "A-01",
      locationKind: "BIN"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:56:00.000Z"
  });

  assert.doesNotThrow(() => locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "bin-b-01",
      parentLocationId: "zone-b",
      code: "01",
      displayName: "B-01",
      locationKind: "BIN"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:57:00.000Z"
  }));

  assert.throws(() => locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "bin-a-duplicate",
      parentLocationId: "zone-a",
      code: "01",
      displayName: "Duplicate A-01",
      locationKind: "BIN"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:58:00.000Z"
  }), /WAREHOUSE_LOCATION_SIBLING_CODE_DUPLICATE/);
});

test("WH-01A prevents cross-Warehouse parents, Warehouse reassignment and hierarchy cycles", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);

  for (const wh of [
    warehouse(),
    warehouse({
      warehouseId: "wh-2",
      code: "WH-002",
      displayName: "Second Warehouse"
    })
  ]) {
    warehouses.save({
      contextId: "enterprise-context:a",
      warehouse: wh,
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-09T12:59:00.000Z"
    });
  }

  locations.save({
    contextId: "enterprise-context:a",
    location: location(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:00:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "zone-b",
      code: "B",
      displayName: "Zone B"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:01:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "wh2-zone",
      warehouseId: "wh-2",
      code: "Z",
      displayName: "WH2 Zone"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:02:00.000Z"
  });

  assert.throws(() => locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "cross-wh",
      parentLocationId: "wh2-zone",
      code: "X",
      displayName: "Cross warehouse"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:03:00.000Z"
  }), /WAREHOUSE_LOCATION_PARENT_WAREHOUSE_MISMATCH/);

  assert.throws(() => locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "zone-a",
      warehouseId: "wh-2",
      code: "A",
      displayName: "Moved to WH2"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:04:00.000Z"
  }), /WAREHOUSE_LOCATION_WAREHOUSE_IMMUTABLE/);

  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "zone-b",
      parentLocationId: "zone-a",
      code: "B",
      displayName: "Zone B"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:05:00.000Z"
  });

  assert.throws(() => locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "zone-a",
      parentLocationId: "zone-b",
      code: "A",
      displayName: "Zone A"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:06:00.000Z"
  }), /WAREHOUSE_LOCATION_HIERARCHY_CYCLE/);
});

test("WH-01A archives bottom-up and preserves Warehouse/location identity history", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);

  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:07:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:08:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: location({
      locationId: "bin-a",
      parentLocationId: "zone-a",
      code: "01",
      displayName: "Bin A",
      locationKind: "BIN"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:09:00.000Z"
  });

  assert.throws(() => warehouses.archive({
    contextId: "enterprise-context:a",
    warehouseId: "wh-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:10:00.000Z"
  }), /WAREHOUSE_HAS_ACTIVE_LOCATIONS/);

  assert.throws(() => locations.archive({
    contextId: "enterprise-context:a",
    locationId: "zone-a",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:11:00.000Z"
  }), /WAREHOUSE_LOCATION_HAS_ACTIVE_CHILDREN/);

  locations.archive({
    contextId: "enterprise-context:a",
    locationId: "bin-a",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:12:00.000Z"
  });
  locations.archive({
    contextId: "enterprise-context:a",
    locationId: "zone-a",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:13:00.000Z"
  });
  warehouses.archive({
    contextId: "enterprise-context:a",
    warehouseId: "wh-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:14:00.000Z"
  });

  assert.equal(warehouses.get("enterprise-context:a", "wh-1"), undefined);
  assert.equal(locations.get("enterprise-context:a", "zone-a"), undefined);

  assert.throws(() => warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse({
      warehouseId: "wh-new",
      code: "wh-001",
      displayName: "Attempted code reuse"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T13:15:00.000Z"
  }), /WAREHOUSE_CODE_DUPLICATE/);
});
