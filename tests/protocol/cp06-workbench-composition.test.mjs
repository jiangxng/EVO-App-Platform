import test from "node:test";
import assert from "node:assert/strict";

import {
  composeWorkbenchHomeV010
} from "../../dist/manager/workbench-composition.js";
import {
  createWorkspaceHomePageV010
} from "../../dist/manager/workspace-home-page.js";
import {
  counterpartyPackage
} from "../../dist/apps/counterparty/package.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010
} from "../../dist/apps/counterparty/constants.js";
import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";

function homeItems(pkg) {
  return pkg.features.flatMap(feature =>
    (feature.contributions ?? [])
      .filter(item => item.kind === "eidos.workbench-home-item")
      .map(item => ({
        ...item.item,
        packageId: pkg.packageId,
        featureId: feature.featureId
      }))
  );
}

test("CP-06 Workbench composes package defaults without duplicating business data", () => {
  const packageItems = [
    ...homeItems(counterpartyPackage),
    ...homeItems(enterpriseAgentPackage)
  ];
  const composition = composeWorkbenchHomeV010({
    packageItems,
    authorizedCapabilityOperationIds: new Set([
      COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010
    ])
  });

  assert.deepEqual(
    composition.items.map(item => item.id),
    [
      "enterprise-agent.workbench.my-work",
      "evo-counterparty.workbench.my-customers",
      "enterprise-agent.workbench.agent"
    ]
  );
  assert.equal(
    composition.items.some(
      item => item.id === "evo-counterparty.workbench.my-suppliers"
    ),
    false
  );

  const page = createWorkspaceHomePageV010("zh-CN", composition.items);
  assert.equal(page.title, "工作区");
  assert.deepEqual(
    page.items.map(item => [
      item.id,
      item.primaryAction.type,
      item.primaryAction.command,
      item.primaryAction.values?.itemId
    ]),
    [
      [
        "enterprise-agent.workbench.my-work",
        "command",
        "workbench.item.open",
        "enterprise-agent.workbench.my-work"
      ],
      [
        "evo-counterparty.workbench.my-customers",
        "command",
        "workbench.item.open",
        "evo-counterparty.workbench.my-customers"
      ],
      [
        "enterprise-agent.workbench.agent",
        "command",
        "workbench.item.open",
        "enterprise-agent.workbench.agent"
      ]
    ]
  );
});

test("CP-06 enterprise-role and personal layers can reorder or hide but cannot expand authority", () => {
  const packageItems = [
    ...homeItems(counterpartyPackage),
    ...homeItems(enterpriseAgentPackage)
  ];
  const composition = composeWorkbenchHomeV010({
    packageItems,
    authorizedCapabilityOperationIds: new Set([
      COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010
    ]),
    enterpriseRoleDefault: {
      layerId: "ENTERPRISE_ROLE_DEFAULT",
      preferences: [{
        itemId: "enterprise-agent.workbench.agent",
        hidden: true
      }, {
        itemId: "evo-counterparty.workbench.my-customers",
        order: 50
      }, {
        itemId: "evo-counterparty.workbench.my-suppliers",
        hidden: false,
        order: 1
      }]
    },
    personalPreference: {
      layerId: "PERSONAL_PREFERENCE",
      preferences: [{
        itemId: "enterprise-agent.workbench.agent",
        hidden: false,
        order: 5
      }, {
        itemId: "enterprise-agent.workbench.my-work",
        order: 10
      }, {
        itemId: "evo-counterparty.workbench.my-suppliers",
        hidden: false,
        order: 0
      }, {
        itemId: "unknown.injected.item",
        hidden: false,
        order: 0
      }]
    }
  });

  assert.deepEqual(
    composition.items.map(item => item.id),
    [
      "enterprise-agent.workbench.agent",
      "enterprise-agent.workbench.my-work",
      "evo-counterparty.workbench.my-customers"
    ]
  );
  assert.equal(
    composition.items.some(
      item => item.id === "evo-counterparty.workbench.my-suppliers"
    ),
    false
  );
  assert.deepEqual(
    composition.rejectedPreferenceItemIds,
    [
      "evo-counterparty.workbench.my-suppliers",
      "unknown.injected.item"
    ]
  );
});

test("CP-06 preferences cannot replace a package-owned route or title", () => {
  const packageItems = [{
    contractVersion: "0.1.0",
    id: "pkg.item",
    title: "Package title",
    description: "Package description",
    section: "MY_WORK",
    route: "/package-route",
    order: 10,
    packageId: "pkg",
    featureId: "pkg.feature"
  }];

  const composition = composeWorkbenchHomeV010({
    packageItems,
    enterpriseRoleDefault: {
      layerId: "ENTERPRISE_ROLE_DEFAULT",
      preferences: [{
        itemId: "pkg.item",
        order: 2
      }]
    },
    personalPreference: {
      layerId: "PERSONAL_PREFERENCE",
      preferences: [{
        itemId: "pkg.item",
        order: 1,
        hidden: false
      }]
    }
  });

  assert.equal(composition.items[0].title, "Package title");
  assert.equal(composition.items[0].route, "/package-route");
  assert.equal(composition.items[0].effectiveOrder, 1);
});
