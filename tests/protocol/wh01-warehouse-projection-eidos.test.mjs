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
  WAREHOUSE_OPERATIONAL_PROFILE_SLOT_V010
} from "../../dist/apps/warehouse/foundation-object.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../../dist/apps/object-extension/values.js";
import {
  createResponsibilityRepositoryV010
} from "../../dist/apps/responsibility/repository.js";
import {
  WAREHOUSE_DIRECTORY_PROJECTION_V010,
  WAREHOUSE_MY_PROJECTION_V010,
  WAREHOUSE_STEWARD_RESPONSIBILITY_V010,
  warehouseAuthorizedDataScopeV010,
  projectWarehousesV010
} from "../../dist/apps/warehouse/projections.js";
import {
  createWarehouseProjectionServiceV010
} from "../../dist/apps/warehouse/projection-service.js";
import {
  createWarehouseProjectionActionHandlersV010
} from "../../dist/apps/warehouse/projection-actions.js";
import {
  createWarehouseDetailPageV010,
  createWarehouseProjectionPageV010
} from "../../dist/apps/warehouse/page.js";
import {
  warehouseAuthorizationPolicyV010
} from "../../dist/apps/warehouse/authorization.js";
import {
  createHostStaticAuthorizationProviderV010,
  mergeHostStaticAuthorizationPoliciesV010
} from "../../dist/providers/authorization/runtime.js";
import {
  WAREHOUSE_MY_READ_COMMAND_V010
} from "../../dist/apps/warehouse/constants.js";
import {
  warehousePackage
} from "../../dist/apps/warehouse/package.js";

function warehouse(id, code = id) {
  return {
    contractVersion: "0.1.0",
    warehouseId: id,
    code,
    displayName: "Warehouse " + id
  };
}

function requestContext(subjectId = "owner-a") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-" + subjectId
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a",
      userId: subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + subjectId,
        ownerSubjectId: subjectId
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "ent-a"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "ent-a",
        enterpriseProviderId: "test.enterprise"
      }
    },
    correlationId: "wh01c-test"
  };
}

test("WH-01C Warehouse stewardship filters My Warehouses but never becomes authorization", () => {
  const warehouses = [
    warehouse("warehouse-1"),
    warehouse("warehouse-2")
  ];
  const responsibilities = [{
    contractVersion: "0.1.0",
    assignmentId: "warehouse-1:steward",
    targetRef: {
      objectType: "warehouse.subject",
      objectId: "warehouse-1"
    },
    responsibilityType: WAREHOUSE_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "member-a" },
    effectiveFrom: "2026-10-09T14:55:00.000Z",
    status: "ACTIVE"
  }];

  const authorized = warehouseAuthorizedDataScopeV010({
    warehouses,
    enterpriseRelationshipKind: "MEMBER"
  });
  assert.deepEqual(
    [...authorized].sort(),
    ["warehouse-1", "warehouse-2"]
  );

  assert.deepEqual(
    projectWarehousesV010({
      projectionId: WAREHOUSE_DIRECTORY_PROJECTION_V010,
      warehouses,
      responsibilities,
      principalSubjectId: "member-a",
      authorizedWarehouseIds: authorized
    }).map(item => item.warehouseId),
    ["warehouse-1", "warehouse-2"]
  );

  assert.deepEqual(
    projectWarehousesV010({
      projectionId: WAREHOUSE_MY_PROJECTION_V010,
      warehouses,
      responsibilities,
      principalSubjectId: "member-a",
      authorizedWarehouseIds: authorized
    }).map(item => item.warehouseId),
    ["warehouse-1"]
  );
});

test("WH-01C derived projection composes Warehouse hierarchy, Responsibility and Extensions without second authority", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);

  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse("warehouse-1", "WH-001"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T14:56:00.000Z"
  });
  const zone = locations.save({
    contextId: "enterprise-context:a",
    location: {
      contractVersion: "0.1.0",
      locationId: "zone-a",
      warehouseId: "warehouse-1",
      code: "ZONE-A",
      displayName: "Zone A",
      locationKind: "ZONE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T14:57:00.000Z"
  });
  locations.save({
    contextId: "enterprise-context:a",
    location: {
      contractVersion: "0.1.0",
      locationId: "bin-a-01",
      warehouseId: "warehouse-1",
      parentLocationId: zone.locationId,
      code: "BIN-01",
      displayName: "Bin 01",
      locationKind: "BIN"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T14:58:00.000Z"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "warehouse.subject",
      objectId: "warehouse-1"
    },
    responsibilityType: WAREHOUSE_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "owner-a" },
    effectiveFrom: "2026-10-09T14:59:00.000Z",
    actorSubjectId: "owner-a"
  });
  extensions.save({
    contextId: "enterprise-context:a",
    valueSet: {
      contractVersion: "0.1.0",
      targetRef: {
        objectType: "warehouse.subject",
        objectId: "warehouse-1",
        slot: WAREHOUSE_OPERATIONAL_PROFILE_SLOT_V010
      },
      namespace: "enterprise.demo.warehouse",
      values: { facilityClass: "REGIONAL_DC" },
      provenance: { source: "MANUAL" }
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T15:00:00.000Z"
  });

  const service = createWarehouseProjectionServiceV010({
    repository: warehouses,
    locationRepository: locations,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(
        warehouseAuthorizationPolicyV010
      );
    },
    fieldIds() {
      return ["warehouseId", "code", "displayName", "description"];
    }
  });

  const result = await service.read({
    contextId: "enterprise-context:a",
    projectionId: WAREHOUSE_MY_PROJECTION_V010,
    requestContext: requestContext("owner-a"),
    enterpriseRelationshipKind: "OWNER"
  });

  assert.equal(result.count, 1);
  assert.equal(result.warehouses[0].warehouse.warehouseId, "warehouse-1");
  assert.equal(result.warehouses[0].locations.length, 2);
  assert.equal(
    result.warehouses[0].responsibilities[0].responsibilityType,
    WAREHOUSE_STEWARD_RESPONSIBILITY_V010
  );
  assert.deepEqual(
    result.warehouses[0].extensionValues[0].values,
    { facilityClass: "REGIONAL_DC" }
  );

  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.warehouse"
    }).length,
    3
  );
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.warehouse-projection"
    }).length,
    0
  );
});

test("WH-01C Human and Personal Agent reads share one Warehouse projection service", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);

  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse("warehouse-1"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T15:01:00.000Z"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "warehouse.subject",
      objectId: "warehouse-1"
    },
    responsibilityType: WAREHOUSE_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "owner-a" },
    effectiveFrom: "2026-10-09T15:02:00.000Z",
    actorSubjectId: "owner-a"
  });

  const service = createWarehouseProjectionServiceV010({
    repository: warehouses,
    locationRepository: locations,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(
        warehouseAuthorizationPolicyV010
      );
    },
    fieldIds() {
      return ["warehouseId", "code", "displayName", "description"];
    }
  });
  const context = requestContext("owner-a");
  const direct = await service.read({
    contextId: "enterprise-context:a",
    projectionId: WAREHOUSE_MY_PROJECTION_V010,
    requestContext: context,
    enterpriseRelationshipKind: "OWNER"
  });
  const handler = createWarehouseProjectionActionHandlersV010({
    service,
    resolveEnterpriseRelationshipKind() {
      return "OWNER";
    }
  }).find(item =>
    item.commandCode === WAREHOUSE_MY_READ_COMMAND_V010
  );
  const action = await handler.execute({ values: {} }, context);
  assert.equal(action.ok, true);
  assert.deepEqual(action.result.warehouses, direct.warehouses);
  assert.deepEqual(action.result.readableFieldIds, direct.readableFieldIds);
});

test("WH-01C field authorization removes Warehouse code before Eidos composition", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const warehouses = createWarehouseRepositoryV010(resources);
  const locations = createWarehouseLocationRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);
  warehouses.save({
    contextId: "enterprise-context:a",
    warehouse: warehouse("warehouse-1", "SECRET-WH"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T15:03:00.000Z"
  });

  const policy = mergeHostStaticAuthorizationPoliciesV010(
    warehouseAuthorizationPolicyV010,
    {
      contractVersion: "0.1.0",
      rules: [{
        id: "deny-warehouse-code-field",
        effect: "DENY",
        actions: ["warehouse.field.read"],
        resourceTypes: ["warehouse.field"],
        resourceIds: ["code"]
      }]
    }
  );
  const service = createWarehouseProjectionServiceV010({
    repository: warehouses,
    locationRepository: locations,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(policy);
    },
    fieldIds() {
      return ["warehouseId", "code", "displayName", "description"];
    }
  });
  const result = await service.read({
    contextId: "enterprise-context:a",
    projectionId: WAREHOUSE_DIRECTORY_PROJECTION_V010,
    requestContext: requestContext(),
    enterpriseRelationshipKind: "OWNER"
  });
  const page = createWarehouseProjectionPageV010({
    projectionId: WAREHOUSE_DIRECTORY_PROJECTION_V010,
    records: result.warehouses,
    readableFieldIds: result.readableFieldIds,
    locale: "en"
  });
  assert.equal(result.readableFieldIds.includes("code"), false);
  assert.equal("Warehouse code" in page.items[0].metadata, false);
  assert.equal(JSON.stringify(page).includes("SECRET-WH"), false);
});

test("WH-01C detail page renders structural paths without inventory quantities", () => {
  const subject = warehouse("warehouse-1", "WH-001");
  const page = createWarehouseDetailPageV010({
    record: {
      warehouse: subject,
      locations: [{
        contractVersion: "0.1.0",
        locationId: "zone-a",
        warehouseId: "warehouse-1",
        code: "ZONE-A",
        displayName: "Zone A",
        locationKind: "ZONE"
      }, {
        contractVersion: "0.1.0",
        locationId: "bin-a",
        warehouseId: "warehouse-1",
        parentLocationId: "zone-a",
        code: "BIN-01",
        displayName: "Bin 01",
        locationKind: "BIN"
      }],
      responsibilities: [],
      extensionValues: []
    },
    locale: "en"
  });

  assert.equal(page.kind, "catalog-browser");
  assert.ok(page.items.some(item =>
    item.summary === "ZONE-A/BIN-01"
  ));
  const serialized = JSON.stringify(page).toLocaleLowerCase();
  for (const forbidden of [
    "onhand",
    "availableqty",
    "reservedqty",
    "inventorybalance",
    "ledgerbalance",
    "itemid"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("WH-01C Warehouse package contributes My Warehouses and lifecycle-aware import without owning Workspace", () => {
  const feature = warehousePackage.features[0];
  assert.ok(
    feature.requiresCapabilities.includes("enterprise.responsibility")
  );
  const workbench = feature.contributions.find(
    item => item.kind === "eidos.workbench-home-item"
  );
  assert.equal(workbench.item.title, "My Warehouses");
  assert.equal(workbench.item.route, "/warehouses/my-warehouses");

  const importTarget = feature.contributions.find(
    item => item.kind === "platform.data-import-target"
  );
  assert.equal(importTarget.target.targetId, "warehouse.location");
  assert.equal(
    importTarget.target.binding.ref,
    "evo-warehouse.location-import-target.v0.1"
  );

  const serialized = JSON.stringify(warehousePackage).toLocaleLowerCase();
  assert.equal(serialized.includes("workspace.owner"), false);
  assert.equal(serialized.includes("evo-bi-workbench"), false);
  assert.equal(serialized.includes("onhand"), false);
  assert.equal(serialized.includes("inventorybalance"), false);
});
