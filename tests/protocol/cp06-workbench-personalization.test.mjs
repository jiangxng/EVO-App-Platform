import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createEnterpriseRoleWorkbenchDefaultRepositoryV010,
  createMemoryPersonalWorkbenchStateStoreV010
} from "../../dist/apps/bi-workbench/state.js";
import {
  createWorkbenchServiceV010
} from "../../dist/apps/bi-workbench/service.js";
import {
  createWorkbenchActionHandlersV010
} from "../../dist/apps/bi-workbench/actions.js";
import {
  BI_WORKBENCH_FEATURE_ID_V010,
  BI_WORKBENCH_ITEM_OPEN_COMMAND_V010 as WORKBENCH_ITEM_OPEN_COMMAND_V010,
  BI_WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010 as WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010
} from "../../dist/apps/bi-workbench/constants.js";
import {
  createWorkspaceHomePageV010
} from "../../dist/apps/bi-workbench/page.js";
import {
  createAppActionRouter
} from "../../dist/actions/router.js";

function context(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "user-a",
      actorType,
      identityProviderId: "test.identity",
      sessionId: "session-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a",
      userId: "user-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:user-a",
        ownerSubjectId: "user-a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "ent-a"
      }
    },
    correlationId: "cp06-workbench-state-test",
    locale: "zh-CN"
  };
}

function operation(operationId, capability, action, resourceType) {
  return {
    contractVersion: "0.1.0",
    operationId,
    capability,
    operationVersion: "0.1.0",
    title: operationId,
    description: operationId,
    effect: "READ",
    dataScope: "ENTERPRISE",
    authorization: {
      action,
      resource: {
        type: resourceType,
        idSource: "DATA_SCOPE"
      }
    },
    inputSchema: {},
    outputSchema: {},
    binding: {
      type: "ACTION_HOST",
      commandCode: operationId,
      inputVersion: "0.1.0"
    },
    exposure: ["HUMAN", "PERSONAL_AGENT"],
    packageId: operationId.startsWith("counterparty.")
      ? "evo-counterparty"
      : "evo-data-import",
    featureId: "feature"
  };
}

function fakeManager() {
  const home = [{
    contractVersion: "0.1.0",
    id: "my-customers",
    title: "My Customers",
    description: "Customers",
    section: "MY_BUSINESS_OBJECTS",
    route: "/counterparties/my-customers",
    capabilityOperationId: "counterparty.projection.my-customers.read",
    order: 20,
    localization: {
      namespace: "evo-counterparty",
      titleKey: "workbench.my-customers.title",
      descriptionKey: "workbench.my-customers.description"
    },
    packageId: "evo-counterparty",
    featureId: "counterparty.default"
  }, {
    contractVersion: "0.1.0",
    id: "my-suppliers",
    title: "My Suppliers",
    description: "Suppliers",
    section: "MY_BUSINESS_OBJECTS",
    route: "/counterparties/my-suppliers",
    capabilityOperationId: "counterparty.projection.my-suppliers.read",
    order: 30,
    packageId: "evo-counterparty",
    featureId: "counterparty.default"
  }, {
    contractVersion: "0.1.0",
    id: "data-import",
    title: "Data Import",
    description: "Import",
    section: "FIXED_CAPABILITIES",
    route: "/data-import",
    capabilityOperationId: "data-import.stage-file",
    order: 60,
    packageId: "evo-data-import",
    featureId: "data-import.default"
  }, {
    contractVersion: "0.1.0",
    id: "personal-agent",
    title: "Personal Agent",
    description: "Agent",
    section: "PERSONAL_AGENT",
    route: "/enterprise-agent",
    order: 90,
    packageId: "enterprise-agent",
    featureId: "enterprise-agent.default"
  }];

  const operations = [
    operation(
      "counterparty.projection.my-customers.read",
      "enterprise.counterparty.projection",
      "counterparty.read",
      "counterparty.subject"
    ),
    operation(
      "counterparty.projection.my-suppliers.read",
      "enterprise.counterparty.projection",
      "counterparty.read",
      "counterparty.subject"
    ),
    operation(
      "data-import.stage-file",
      "enterprise.data-import",
      "data-import.write",
      "data-import"
    )
  ];

  return {
    listEffectiveWorkbenchHomeItems() {
      return structuredClone(home);
    },
    listEffectiveCapabilityOperations() {
      return structuredClone(operations);
    },
    listEffectiveLocalizationBundles() {
      return [{
        contractVersion: "0.1.0",
        namespace: "evo-counterparty",
        locale: "zh-CN",
        messages: {
          "workbench.my-customers.title": "我的客户",
          "workbench.my-customers.description": "我负责的客户。"
        },
        packageId: "evo-counterparty",
        featureId: "counterparty.default"
      }];
    }
  };
}

function provider() {
  return {
    providerId: "test.authorization",
    check(input) {
      const operationId = input.context?.operationId;
      if (operationId === "counterparty.projection.my-suppliers.read") {
        return {
          contractVersion: "0.1.0",
          allowed: false,
          policyProviderId: "test.authorization",
          reasonCodes: ["TEST_SUPPLIER_DENY"]
        };
      }
      return {
        contractVersion: "0.1.0",
        allowed: true,
        policyProviderId: "test.authorization",
        reasonCodes: ["TEST_ALLOW"]
      };
    }
  };
}

test("CP-06 enterprise-role defaults persist in Enterprise Context and personal state overrides defaults only after authorization", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const enterpriseDefaults =
    createEnterpriseRoleWorkbenchDefaultRepositoryV010(resources);
  enterpriseDefaults.put({
    contextId: "enterprise-context:a",
    relationshipKind: "MEMBER",
    preferences: [{
      itemId: "personal-agent",
      hidden: true
    }, {
      itemId: "my-customers",
      order: 40
    }],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T02:30:00.000Z"
  });

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.workbench",
    collectionId: "enterprise-role-defaults"
  });
  assert.equal(raw.length, 1);
  assert.equal(raw[0].metadata.relationshipKind, "MEMBER");

  const personal = createMemoryPersonalWorkbenchStateStoreV010([{
    contractVersion: "0.1.0",
    personalContextId: "personal:user-a",
    subjectId: "user-a",
    preferences: [{
      itemId: "personal-agent",
      hidden: false,
      order: 5
    }, {
      itemId: "data-import",
      hidden: true
    }],
    favoriteItemIds: ["my-customers", "my-suppliers"],
    recentItemIds: ["my-suppliers", "my-customers"],
    updatedAt: "2026-10-09T02:31:00.000Z"
  }]);

  const service = createWorkbenchServiceV010({
    manager: fakeManager(),
    personalState: personal,
    enterpriseRoleLayer: ({ contextId, relationshipKind }) =>
      enterpriseDefaults.layer(contextId, relationshipKind),
    resolveRelationshipKind: () => "MEMBER",
    resolveAuthorizationProvider: provider
  });

  const home = await service.resolve(context());
  assert.deepEqual(
    home.items.map(item => item.id),
    ["personal-agent", "my-customers"]
  );
  assert.equal(home.items[1].title, "我的客户");
  assert.equal(home.items[1].description, "我负责的客户。");
  assert.deepEqual(home.favorites.map(item => item.id), ["my-customers"]);
  assert.deepEqual(home.recent.map(item => item.id), ["my-customers"]);
  assert.equal(
    home.items.some(item => item.id === "my-suppliers"),
    false
  );
});

test("CP-06 Workbench open records Recent only after re-authorizing the item", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const defaults = createEnterpriseRoleWorkbenchDefaultRepositoryV010(resources);
  const personal = createMemoryPersonalWorkbenchStateStoreV010();
  const service = createWorkbenchServiceV010({
    manager: fakeManager(),
    personalState: personal,
    enterpriseRoleLayer: ({ contextId, relationshipKind }) =>
      defaults.layer(contextId, relationshipKind),
    resolveRelationshipKind: () => "MEMBER",
    resolveAuthorizationProvider: provider
  });

  const opened = await service.open({
    context: context(),
    itemId: "my-customers",
    occurredAt: "2026-10-09T02:32:00.000Z"
  });
  assert.equal(opened.route, "/counterparties/my-customers");

  const state = await personal.get("personal:user-a", "user-a");
  assert.deepEqual(state.recentItemIds, ["my-customers"]);

  await assert.rejects(
    service.open({
      context: context(),
      itemId: "my-suppliers",
      occurredAt: "2026-10-09T02:33:00.000Z"
    }),
    /WORKBENCH_ITEM_NOT_AUTHORIZED/
  );
  assert.deepEqual(
    (await personal.get("personal:user-a", "user-a")).recentItemIds,
    ["my-customers"]
  );
});

test("CP-06 Favorites and personal preferences cannot target unauthorized items", async () => {
  const defaults = createEnterpriseRoleWorkbenchDefaultRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010()
  );
  const personal = createMemoryPersonalWorkbenchStateStoreV010();
  const service = createWorkbenchServiceV010({
    manager: fakeManager(),
    personalState: personal,
    enterpriseRoleLayer: ({ contextId, relationshipKind }) =>
      defaults.layer(contextId, relationshipKind),
    resolveRelationshipKind: () => "MEMBER",
    resolveAuthorizationProvider: provider
  });

  await service.favorite({
    context: context(),
    itemId: "my-customers",
    favorite: true,
    occurredAt: "2026-10-09T02:34:00.000Z"
  });
  assert.deepEqual(
    (await service.resolve(context())).favorites.map(item => item.id),
    ["my-customers"]
  );

  await assert.rejects(
    service.favorite({
      context: context(),
      itemId: "my-suppliers",
      favorite: true,
      occurredAt: "2026-10-09T02:35:00.000Z"
    }),
    /WORKBENCH_ITEM_NOT_AUTHORIZED/
  );
  await assert.rejects(
    service.setPersonalPreferences({
      context: context(),
      preferences: [{
        itemId: "my-suppliers",
        order: 1
      }],
      occurredAt: "2026-10-09T02:36:00.000Z"
    }),
    /WORKBENCH_PREFERENCE_ITEM_NOT_AUTHORIZED/
  );
});

test("CP-06 Workspace page uses governed open/favorite commands for base and derived groups", async () => {
  const defaults = createEnterpriseRoleWorkbenchDefaultRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010()
  );
  const personal = createMemoryPersonalWorkbenchStateStoreV010([{
    contractVersion: "0.1.0",
    personalContextId: "personal:user-a",
    subjectId: "user-a",
    preferences: [],
    favoriteItemIds: ["my-customers"],
    recentItemIds: ["my-customers"],
    updatedAt: "2026-10-09T02:37:00.000Z"
  }]);
  const service = createWorkbenchServiceV010({
    manager: fakeManager(),
    personalState: personal,
    enterpriseRoleLayer: ({ contextId, relationshipKind }) =>
      defaults.layer(contextId, relationshipKind),
    resolveRelationshipKind: () => "MEMBER",
    resolveAuthorizationProvider: provider
  });

  const page = createWorkspaceHomePageV010(
    "zh-CN",
    await service.resolve(context())
  );
  const favorite = page.items.find(item => item.id === "favorite:my-customers");
  const recent = page.items.find(item => item.id === "recent:my-customers");
  const base = page.items.find(item => item.id === "my-customers");

  assert.equal(favorite.category, "收藏");
  assert.equal(recent.category, "最近使用");
  assert.equal(favorite.primaryAction.type, "command");
  assert.equal(
    favorite.primaryAction.command,
    WORKBENCH_ITEM_OPEN_COMMAND_V010
  );
  assert.deepEqual(favorite.primaryAction.values, {
    itemId: "my-customers"
  });
  assert.equal(
    base.secondaryActions[0].command,
    WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010
  );
  assert.equal(base.secondaryActions[0].values.favorite, false);
});

test("CP-06 Workbench action handler records Recent and returns package-owned route", async () => {
  const defaults = createEnterpriseRoleWorkbenchDefaultRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010()
  );
  const personal = createMemoryPersonalWorkbenchStateStoreV010();
  const service = createWorkbenchServiceV010({
    manager: fakeManager(),
    personalState: personal,
    enterpriseRoleLayer: ({ contextId, relationshipKind }) =>
      defaults.layer(contextId, relationshipKind),
    resolveRelationshipKind: () => "MEMBER",
    resolveAuthorizationProvider: provider
  });
  const open = createWorkbenchActionHandlersV010({
    resolveService: async () => service,
    now: () => new Date("2026-10-09T02:40:00.000Z")
  }).find(item => item.commandCode === WORKBENCH_ITEM_OPEN_COMMAND_V010);

  const result = await open.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: WORKBENCH_ITEM_OPEN_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    values: { itemId: "my-customers" },
    sourceInteractionId: "cp06-open",
    actionId: WORKBENCH_ITEM_OPEN_COMMAND_V010,
    requiresConfirmation: false
  }, context());

  assert.equal(result.ok, true);
  assert.equal(result.result.navigateTo, "/counterparties/my-customers");
  assert.deepEqual(
    (await personal.get("personal:user-a", "user-a")).recentItemIds,
    ["my-customers"]
  );
});


test("CP-06 Action Router executes Workbench actions only while the BI Workbench plugin feature is active", async () => {
  const service = {
    async open() {
      return {
        itemId: "my-customers",
        route: "/counterparties/my-customers"
      };
    },
    async favorite() {
      throw new Error("UNUSED");
    },
    async setPersonalPreferences() {
      throw new Error("UNUSED");
    },
    async resolve() {
      throw new Error("UNUSED");
    }
  };
  const handlers = createWorkbenchActionHandlersV010({
    resolveService: async () => service,
    now: () => new Date("2026-10-09T02:41:00.000Z")
  });
  const router = createAppActionRouter(
    handlers,
    featureId => featureId === BI_WORKBENCH_FEATURE_ID_V010
  );

  const result = await router.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: WORKBENCH_ITEM_OPEN_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    values: { itemId: "my-customers" },
    sourceInteractionId: "cp06-router",
    actionId: WORKBENCH_ITEM_OPEN_COMMAND_V010,
    requiresConfirmation: false
  }, context());

  assert.equal(result.ok, true);
  assert.equal(result.result.navigateTo, "/counterparties/my-customers");

  const inactiveRouter = createAppActionRouter(
    handlers,
    () => false
  );
  const blocked = await inactiveRouter.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: WORKBENCH_ITEM_OPEN_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    values: { itemId: "my-customers" },
    sourceInteractionId: "cp06-router-disabled",
    actionId: WORKBENCH_ITEM_OPEN_COMMAND_V010,
    requiresConfirmation: false
  }, context());
  assert.equal(blocked.ok, false);
});
