import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../../dist/apps/object-extension/values.js";
import {
  createResponsibilityRepositoryV010
} from "../../dist/apps/responsibility/repository.js";
import {
  createItemRepositoryV010
} from "../../dist/apps/item/repository.js";
import {
  ITEM_RESOURCE_TYPE_V010,
  ITEM_TRADE_PROFILE_SLOT_V010
} from "../../dist/apps/item/foundation-object.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  ITEM_STEWARD_RESPONSIBILITY_V010,
  itemAuthorizedDataScopeV010,
  projectItemsV010
} from "../../dist/apps/item/projections.js";
import {
  createItemProjectionServiceV010
} from "../../dist/apps/item/projection-service.js";
import {
  createItemProjectionActionHandlersV010
} from "../../dist/apps/item/projection-actions.js";
import {
  createItemCreatePageV010,
  createItemDetailPageV010,
  createItemProjectionPageV010
} from "../../dist/apps/item/page.js";
import {
  itemAuthorizationPolicyV010
} from "../../dist/apps/item/authorization.js";
import {
  createHostStaticAuthorizationProviderV010,
  mergeHostStaticAuthorizationPoliciesV010
} from "../../dist/providers/authorization/runtime.js";
import {
  ITEM_MY_ITEMS_READ_COMMAND_V010
} from "../../dist/apps/item/constants.js";
import {
  itemPackage
} from "../../dist/apps/item/package.js";

function subject(id, code = id) {
  return {
    contractVersion: "0.1.0",
    itemId: id,
    code,
    displayName: "Item " + id,
    itemKind: "GOODS",
    baseUomCode: "C62"
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
    correlationId: "it01d-test"
  };
}

test("IT-01D Item stewardship filters My Items but does not become authorization scope", () => {
  const items = [
    subject("item-1"),
    subject("item-2")
  ];
  const responsibilities = [{
    contractVersion: "0.1.0",
    assignmentId: "item-1:steward",
    targetRef: {
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: "item-1"
    },
    responsibilityType: ITEM_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "member-a" },
    effectiveFrom: "2026-10-09T11:20:00.000Z",
    status: "ACTIVE"
  }];

  const authorized = itemAuthorizedDataScopeV010({
    items,
    enterpriseRelationshipKind: "MEMBER"
  });
  assert.deepEqual([...authorized].sort(), ["item-1", "item-2"]);

  assert.deepEqual(
    projectItemsV010({
      projectionId: ITEM_DIRECTORY_PROJECTION_V010,
      items,
      responsibilities,
      principalSubjectId: "member-a",
      authorizedItemIds: authorized
    }).map(item => item.itemId),
    ["item-1", "item-2"]
  );

  assert.deepEqual(
    projectItemsV010({
      projectionId: ITEM_MY_ITEMS_PROJECTION_V010,
      items,
      responsibilities,
      principalSubjectId: "member-a",
      authorizedItemIds: authorized
    }).map(item => item.itemId),
    ["item-1"]
  );
});

test("IT-01D derived projection composes Item, Responsibility and Enterprise Extension without persisting a second authority", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const items = createItemRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);

  items.save({
    contextId: "enterprise-context:a",
    item: subject("item-1", "I-001"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:21:00.000Z"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: "item-1"
    },
    responsibilityType: ITEM_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "owner-a" },
    effectiveFrom: "2026-10-09T11:22:00.000Z",
    actorSubjectId: "owner-a"
  });
  extensions.save({
    contextId: "enterprise-context:a",
    valueSet: {
      contractVersion: "0.1.0",
      targetRef: {
        objectType: ITEM_RESOURCE_TYPE_V010,
        objectId: "item-1",
        slot: ITEM_TRADE_PROFILE_SLOT_V010
      },
      namespace: "enterprise.demo.item",
      values: { commodityClass: "BEVERAGE" },
      provenance: { source: "MANUAL" }
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:23:00.000Z"
  });

  const service = createItemProjectionServiceV010({
    repository: items,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(
        itemAuthorizationPolicyV010
      );
    },
    fieldIds() {
      return [
        "itemId",
        "code",
        "displayName",
        "itemKind",
        "baseUomCode",
        "description"
      ];
    }
  });

  const result = await service.read({
    contextId: "enterprise-context:a",
    projectionId: ITEM_MY_ITEMS_PROJECTION_V010,
    requestContext: requestContext("owner-a"),
    enterpriseRelationshipKind: "OWNER"
  });

  assert.equal(result.count, 1);
  assert.equal(result.items[0].item.itemId, "item-1");
  assert.equal(
    result.items[0].responsibilities[0].responsibilityType,
    ITEM_STEWARD_RESPONSIBILITY_V010
  );
  assert.deepEqual(
    result.items[0].extensionValues[0].values,
    { commodityClass: "BEVERAGE" }
  );

  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.item"
    }).length,
    1
  );
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.responsibility"
    }).length,
    1
  );
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.item-projection"
    }).length,
    0
  );
});

test("IT-01D Human and Personal Agent projection reads share one projection service", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const items = createItemRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);
  items.save({
    contextId: "enterprise-context:a",
    item: subject("item-1"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:24:00.000Z"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: "item-1"
    },
    responsibilityType: ITEM_STEWARD_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "owner-a" },
    effectiveFrom: "2026-10-09T11:25:00.000Z",
    actorSubjectId: "owner-a"
  });

  const service = createItemProjectionServiceV010({
    repository: items,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(
        itemAuthorizationPolicyV010
      );
    },
    fieldIds() {
      return ["itemId", "code", "displayName", "itemKind", "baseUomCode"];
    }
  });
  const context = requestContext("owner-a");
  const direct = await service.read({
    contextId: "enterprise-context:a",
    projectionId: ITEM_MY_ITEMS_PROJECTION_V010,
    requestContext: context,
    enterpriseRelationshipKind: "OWNER"
  });

  const handler = createItemProjectionActionHandlersV010({
    service,
    resolveEnterpriseRelationshipKind() {
      return "OWNER";
    }
  }).find(item =>
    item.commandCode === ITEM_MY_ITEMS_READ_COMMAND_V010
  );
  const action = await handler.execute({ values: {} }, context);
  assert.equal(action.ok, true);
  assert.deepEqual(action.result.items, direct.items);
  assert.deepEqual(action.result.readableFieldIds, direct.readableFieldIds);
});

test("IT-01D authorization removes denied Item fields before Eidos page composition", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const items = createItemRepositoryV010(resources);
  const responsibilities = createResponsibilityRepositoryV010(resources);
  const extensions = createObjectExtensionValueRepositoryV010(resources);
  items.save({
    contextId: "enterprise-context:a",
    item: subject("item-1", "SECRET-CODE"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:26:00.000Z"
  });
  const policy = mergeHostStaticAuthorizationPoliciesV010(
    itemAuthorizationPolicyV010,
    {
      contractVersion: "0.1.0",
      rules: [{
        id: "deny-item-code-field",
        effect: "DENY",
        actions: ["item.field.read"],
        resourceTypes: ["item.field"],
        resourceIds: ["code"]
      }]
    }
  );
  const service = createItemProjectionServiceV010({
    repository: items,
    responsibilityRepository: responsibilities,
    extensionValueRepository: extensions,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010(policy);
    },
    fieldIds() {
      return ["itemId", "code", "displayName", "itemKind", "baseUomCode"];
    }
  });
  const result = await service.read({
    contextId: "enterprise-context:a",
    projectionId: ITEM_DIRECTORY_PROJECTION_V010,
    requestContext: requestContext(),
    enterpriseRelationshipKind: "OWNER"
  });
  const page = createItemProjectionPageV010({
    projectionId: ITEM_DIRECTORY_PROJECTION_V010,
    records: result.items,
    readableFieldIds: result.readableFieldIds,
    locale: "en"
  });
  assert.equal(result.readableFieldIds.includes("code"), false);
  assert.equal("Item code" in page.items[0].metadata, false);
});

test("IT-01D Eidos forms are generated from the Item EffectiveObjectSchema", () => {
  const page = createItemCreatePageV010("zh-CN");
  assert.equal(page.kind, "form");
  assert.deepEqual(
    page.fields.map(field => field.key),
    ["code", "displayName", "itemKind", "baseUomCode", "description"]
  );
  assert.deepEqual(
    page.fields.find(field => field.key === "itemKind").options,
    [{
      value: "GOODS",
      label: "货物"
    }, {
      value: "SERVICE",
      label: "服务"
    }]
  );
});

test("IT-01D Item package contributes My Items to Workbench without owning Workspace", () => {
  const feature = itemPackage.features[0];
  assert.ok(
    feature.requiresCapabilities.includes("enterprise.responsibility")
  );
  const workbench = feature.contributions.find(
    item => item.kind === "eidos.workbench-home-item"
  );
  assert.equal(workbench.item.title, "My Items");
  assert.equal(workbench.item.route, "/items/my-items");

  const serialized = JSON.stringify(itemPackage).toLowerCase();
  assert.equal(serialized.includes("workspace.owner"), false);
  assert.equal(serialized.includes("evo-bi-workbench"), false);
  assert.equal(
    feature.contributions.some(item =>
      item.kind === "eidos.experience"
    ),
    true
  );
});

test("IT-01D detail page displays derived stewardship/extension data without mutating Item identity", () => {
  const item = subject("item-1");
  const page = createItemDetailPageV010({
    record: {
      item,
      responsibilities: [{
        contractVersion: "0.1.0",
        assignmentId: "x",
        targetRef: {
          objectType: ITEM_RESOURCE_TYPE_V010,
          objectId: item.itemId
        },
        responsibilityType: ITEM_STEWARD_RESPONSIBILITY_V010,
        assigneeRef: { kind: "PRINCIPAL", id: "steward-a" },
        effectiveFrom: "2026-10-09T11:27:00.000Z",
        status: "ACTIVE"
      }],
      extensionValues: [{
        contractVersion: "0.1.0",
        targetRef: {
          objectType: ITEM_RESOURCE_TYPE_V010,
          objectId: item.itemId,
          slot: ITEM_TRADE_PROFILE_SLOT_V010
        },
        namespace: "enterprise.demo.item",
        values: { commodityClass: "BEVERAGE" }
      }]
    },
    locale: "en",
    canManage: false
  });
  assert.equal(page.kind, "catalog-browser");
  assert.equal(page.actions.length, 0);
  assert.equal(page.items[0].metadata["Item steward"], "steward-a");
  assert.equal(page.items[1].metadata.commodityClass, "BEVERAGE");
  assert.deepEqual(Object.keys(item), [
    "contractVersion",
    "itemId",
    "code",
    "displayName",
    "itemKind",
    "baseUomCode"
  ]);
});
