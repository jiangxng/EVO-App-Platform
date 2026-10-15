import test from "node:test";
import assert from "node:assert/strict";

import { createAppActionRouter } from "../../dist/actions/router.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  evoFoundationPackage,
  ledgerRuntimeConfiguratorPackage,
  tradingReferencePackageV010
} from "../../dist/catalog/seed.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import {
  createLedgerRuntimeConfiguratorCapabilityActionHandlers,
  LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND
} from "../../dist/apps/ledger-runtime-configurator/capability-action-handlers.js";
import {
  LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION
} from "../../dist/apps/ledger-runtime-configurator/capability-manifest.js";
import {
  createLedgerRuntimeConfiguratorService
} from "../../dist/apps/ledger-runtime-configurator/service.js";
import {
  createPurchaseOperationalReadActionHandlerV010
} from "../../dist/apps/trading-reference/operational-actions.js";
import {
  createPurchaseOperationalProjectionServiceV010
} from "../../dist/apps/trading-reference/operational-projection.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_READ_OPERATION_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
  PURCHASE_OPERATIONS_CAPABILITY_V010,
  PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010
} from "../../dist/apps/trading-reference/constants.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";
import {
  createCapabilityOperationActionPreExecuteV010
} from "../../dist/manager/capability-operation-access.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

const purchaseValues = {
  orderNo: "PO-PA05-01",
  supplierCounterpartyId: "supplier-a",
  itemId: "item-a",
  warehouseId: "warehouse-a"
};
const common = {
  order_no: purchaseValues.orderNo,
  supplier: purchaseValues.supplierCounterpartyId,
  product_id: purchaseValues.itemId
};
const withWarehouse = { ...common, warehouse: purchaseValues.warehouseId };

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human-pa05",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-pa05"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "host-pa05",
      userId: "human-pa05"
    },
    context: {
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:pa05",
        enterpriseId: "host-pa05"
      }
    },
    correlationId: "pa05-cert-01"
  };
}

function request(commandCode, values = {}, inputVersion = "0.1.0") {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: commandCode, inputVersion },
    values: structuredClone(values),
    sourceInteractionId: "pa05-direct-action",
    actionId: "read",
    requiresConfirmation: false
  };
}

function fixture() {
  const manager = createAppManagerService(
    createPackageCatalog([
      evoFoundationPackage,
      ledgerRuntimeConfiguratorPackage,
      tradingReferencePackageV010
    ]),
    createMemoryLifecycleStore()
  );
  manager.install(ledgerRuntimeConfiguratorPackage.packageId);
  manager.install(tradingReferencePackageV010.packageId);

  const state = { revoked: false, reads: [], checks: [] };
  const authorizationProvider = {
    providerId: "pa05.test-authorization",
    async check(input) {
      state.checks.push({
        actor: input.principal.actorType,
        action: input.action,
        resourceId: input.resource.id,
        enterpriseId: input.scope.enterpriseId
      });
      const allowed = !state.revoked
        && input.scope.enterpriseId === "host-pa05"
        && (
          input.resource.type === "ledger.runtime.configuration"
          || (
            input.resource.type === "trading-reference.purchase-order"
            && (
              input.resource.id === undefined
              || input.resource.id === purchaseValues.orderNo
            )
          )
        );
      return {
        contractVersion: "0.1.0",
        allowed,
        policyProviderId: "pa05.test-authorization",
        reasonCodes: allowed ? [] : ["PA05_DENIED"]
      };
    }
  };

  const reader = {
    async listOpenWorkItems(enterpriseId) {
      state.reads.push(["work", enterpriseId]);
      return {
        complete: true,
        items: [
          { sourceLedgerCode: "pending_purchase", workType: "RECEIVE",
            dimensions: withWarehouse, quantity: 10 },
          { sourceLedgerCode: "payable", workType: "PAY",
            dimensions: common, amount: 125 }
        ]
      };
    },
    async readLedgerBalances(enterpriseId, ledger, dimensions) {
      state.reads.push([ledger, enterpriseId]);
      return {
        complete: true,
        items: [{
          dimensions,
          quantity: ledger === "pending_purchase" ? 10 : 0,
          amount: ledger === "payable" ? 125 : 0
        }]
      };
    }
  };

  const purchaseService = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => authorizationProvider
  });
  const handler = createPurchaseOperationalReadActionHandlerV010({
    service: purchaseService,
    resolveEvoEnterpriseId(ctx) {
      if (ctx.scope.enterpriseId !== "host-pa05") {
        throw new Error("TR01_OPERATIONAL_EVO_SCOPE_BINDING_REQUIRED");
      }
      return "evo-pa05";
    }
  });

  const router = createAppActionRouter(
    [
      ...createLedgerRuntimeConfiguratorCapabilityActionHandlers(
        createLedgerRuntimeConfiguratorService()
      ),
      handler
    ],
    featureId => manager.listEffectiveCapabilityOperations()
      .some(operation => operation.featureId === featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider: () => authorizationProvider
    })
  );
  const registrations = createPersonalAgentCapabilityToolRegistrationsV010({
    manager,
    actionRouter: router,
    requestContext: context(),
    resolveAuthorizationProvider: () => authorizationProvider
  });
  const tool = id => {
    const found = registrations.find(item => item.descriptor.id === id);
    assert.ok(found, "Expected existing Host tool: " + id);
    return found;
  };
  const invoke = (operationId, input = {}) =>
    tool(PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({ operationId, input }, []);
  return { manager, router, tool, invoke, state };
}

test("PA05-M01 makes real Trading Reference manifest conformant while retaining legacy public IDs", () => {
  const ledger = validatePluginManifestV010(ledgerRuntimeConfiguratorPackage);
  const trading = validatePluginManifestV010(tradingReferencePackageV010);
  assert.equal(ledger.ok, true, JSON.stringify(ledger.issues));
  assert.equal(trading.ok, true, JSON.stringify(trading.issues));
  assert.deepEqual(trading.issues, []);

  // Historical dependency ID is still an advertised Capability, but the
  // already-published operation IDs are now under their true namespace.
  assert.equal(PURCHASE_OPERATIONS_CAPABILITY_V010,
    "enterprise.trading-reference.purchase-operations");
  assert.equal(PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010,
    "trading-reference.purchase-operations");
  const feature = tradingReferencePackageV010.features[0];
  assert.deepEqual(feature.providesCapabilities, [
    PURCHASE_OPERATIONS_CAPABILITY_V010,
    PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010
  ]);
  assert.equal(tradingReferencePackageV010.version, "0.1.1");
  assert.equal(feature.version, "0.1.1");

  const operations = feature.contributions
    .filter(item => item.kind === "platform.capability-operation")
    .map(item => item.operation);
  assert.deepEqual(
    operations.map(op => op.operationId).sort(),
    [
      "trading-reference.purchase-operations.entry.open",
      "trading-reference.purchase-operations.read"
    ]
  );
  assert.deepEqual(
    operations.map(op => op.binding.commandCode).sort(),
    [
      PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
      PURCHASE_OPERATIONS_READ_COMMAND_V010
    ].sort()
  );
  assert.ok(operations.every(op =>
    op.capability === PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010
    && op.operationVersion === "0.1.0"
    && op.exposure.includes("HUMAN")
    && op.exposure.includes("PERSONAL_AGENT")
  ));
  assert.ok(operations.some(op =>
    op.operationId === PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010
  ));
  assert.ok(operations.some(op =>
    op.operationId === PURCHASE_OPERATIONS_READ_OPERATION_V010
  ));

  const manager = createAppManagerService(
    createPackageCatalog([tradingReferencePackageV010]),
    createMemoryLifecycleStore()
  );
  manager.install(tradingReferencePackageV010.packageId);
  assert.deepEqual(
    manager.listEffectiveCapabilityOperations(
      PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010
    ).map(op => op.operationId).sort(),
    operations.map(op => op.operationId).sort()
  );

  for (const pkg of [
    ledgerRuntimeConfiguratorPackage,
    tradingReferencePackageV010
  ]) {
    assert.ok(pkg.features.some(item =>
      item.contributions?.some(contribution =>
        contribution.kind === "platform.capability-operation"
        && contribution.operation.exposure.includes("PERSONAL_AGENT")
        && contribution.operation.effect === "READ"
      )
    ));
  }
});

test("PA05-M01 installed 0.1.0 plugin upgrades to 0.1.1 without losing activation or legacy dependency", () => {
  // Build the historical manifest shape to exercise the real lifecycle store,
  // not a new mock upgrade implementation. The historical namespace violation
  // was present on that version; we never weaken the current validator.
  const previous = structuredClone(tradingReferencePackageV010);
  previous.version = "0.1.0";
  previous.features[0].version = "0.1.0";
  previous.features[0].providesCapabilities = [
    PURCHASE_OPERATIONS_CAPABILITY_V010
  ];
  for (const contribution of previous.features[0].contributions) {
    if (contribution.kind === "platform.capability-operation") {
      contribution.operation.capability = PURCHASE_OPERATIONS_CAPABILITY_V010;
    }
  }

  const store = createMemoryLifecycleStore();
  const oldManager = createAppManagerService(
    createPackageCatalog([previous]), store
  );
  oldManager.install(previous.packageId);
  assert.ok(oldManager.listEffectiveCapabilityOperations().length === 2);

  const manager = createAppManagerService(
    createPackageCatalog([tradingReferencePackageV010]), store
  );
  const plan = manager.planUpgrade(tradingReferencePackageV010.packageId);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.fromVersion, "0.1.0");
  assert.equal(plan.toVersion, "0.1.1");
  assert.equal(plan.requiresUserApproval, false);
  manager.upgrade(tradingReferencePackageV010.packageId);
  assert.deepEqual(
    manager.listEffectiveCapabilityOperations()
      .map(op => op.operationId).sort(),
    [
      PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
      PURCHASE_OPERATIONS_READ_OPERATION_V010
    ].sort()
  );
  assert.ok(manager.getSnapshot().activeFeatures.some(item =>
    item.featureId === tradingReferencePackageV010.features[0].featureId
    && item.version === "0.1.1"
  ));
});

test("PA05-01 Agent discovers both owners and returns the same direct business results", async () => {
  const f = fixture();
  const ledgerList = await f.tool(PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({ query: "ledger" }, []);
  const tradingList = await f.tool(PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({ query: "purchase" }, []);
  assert.ok(ledgerList.items.some(item =>
    item.operationId === LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION
  ));
  assert.ok(tradingList.items.some(item =>
    item.operationId === PURCHASE_OPERATIONS_READ_OPERATION_V010
  ));

  const described = await f.tool(PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID)
    .execute({ operationId: PURCHASE_OPERATIONS_READ_OPERATION_V010 }, []);
  assert.equal(described.operation.effect, "READ");
  assert.ok(described.operation.inputSchema.required.includes("orderNo"));
  assert.equal("binding" in described.operation, false);

  const directLedger = await f.router.execute(
    request(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND), context()
  );
  const agentLedger = await f.invoke(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION);
  assert.equal(directLedger.ok, true);
  assert.deepEqual(agentLedger.result, directLedger.result);

  const directPurchase = await f.router.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, purchaseValues), context()
  );
  const agentPurchase = await f.invoke(
    PURCHASE_OPERATIONS_READ_OPERATION_V010, purchaseValues
  );
  assert.equal(directPurchase.ok, true);
  assert.deepEqual(agentPurchase.result, directPurchase.result);
  assert.deepEqual(agentPurchase.result.openWork, {
    receive: { quantity: 10 },
    pay: { amount: 125 }
  });
  assert.equal(agentPurchase.result.enterpriseId, "evo-pa05");
  assert.equal(f.state.reads.length, 8);
  assert.ok(f.state.reads.every(row => row[1] === "evo-pa05"));
  assert.ok(f.state.checks.some(item => item.actor === "HUMAN"));
  assert.ok(f.state.checks.some(item => item.actor === "AI"));
});

test("PA05-01 revocation and resource denial block both channels before EVO reads", async () => {
  const f = fixture();
  const deniedRequest = request(PURCHASE_OPERATIONS_READ_COMMAND_V010, {
    ...purchaseValues, orderNo: "PO-OTHER"
  });
  const denied = await f.router.execute(deniedRequest, context());
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "PA05_DENIED");
  await assert.rejects(
    () => f.invoke(PURCHASE_OPERATIONS_READ_OPERATION_V010, {
      ...purchaseValues, orderNo: "PO-OTHER"
    }),
    /PA05_DENIED/
  );

  f.state.revoked = true;
  const direct = await f.router.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, purchaseValues), context()
  );
  assert.equal(direct.ok, false);
  assert.equal(direct.error.code, "PA05_DENIED");
  await assert.rejects(
    () => f.invoke(PURCHASE_OPERATIONS_READ_OPERATION_V010, purchaseValues),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
  assert.deepEqual(f.state.reads, []);
});

test("PA05-01 stops missing resource, wrong version and disabled owner without fallback", async () => {
  const f = fixture();
  const missing = await f.router.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, {
      ...purchaseValues, orderNo: undefined
    }), context()
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "CAPABILITY_OPERATION_RESOURCE_ID_REQUIRED");
  await assert.rejects(
    () => f.invoke(PURCHASE_OPERATIONS_READ_OPERATION_V010, {
      supplierCounterpartyId: purchaseValues.supplierCounterpartyId,
      itemId: purchaseValues.itemId,
      warehouseId: purchaseValues.warehouseId
    }),
    /CAPABILITY_OPERATION_RESOURCE_ID_REQUIRED/
  );
  const oldVersion = await f.router.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, purchaseValues, "9.9.9"),
    context()
  );
  assert.equal(oldVersion.ok, false);
  assert.equal(oldVersion.error.code, "CAPABILITY_OPERATION_INPUT_VERSION_UNSUPPORTED");

  f.manager.disable(tradingReferencePackageV010.packageId);
  const disabled = await f.router.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, purchaseValues), context()
  );
  assert.equal(disabled.ok, false);
  assert.equal(disabled.error.code, "ACTION_FEATURE_NOT_ACTIVE");
  await assert.rejects(
    () => f.invoke(PURCHASE_OPERATIONS_READ_OPERATION_V010, purchaseValues),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
  const otherOwner = await f.invoke(
    LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION
  );
  assert.equal(otherOwner.result.kind, "evo.ledger-runtime.configuration-description");
  assert.deepEqual(f.state.reads, []);
});
