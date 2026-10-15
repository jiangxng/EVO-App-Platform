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
  PURCHASE_OPERATIONS_READ_OPERATION_V010
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

test("PA05-01 pins existing trading manifest namespace debt; no validator weakening", () => {
  const ledger = validatePluginManifestV010(ledgerRuntimeConfiguratorPackage);
  assert.equal(ledger.ok, true, JSON.stringify(ledger.issues));

  // Existing public operation IDs and Capability IDs must not be silently
  // renamed by a certification test. PA05-M01 is an explicit BLOCKER.
  const trading = validatePluginManifestV010(tradingReferencePackageV010);
  assert.equal(trading.ok, false, "PA05-M01 debt resolved: update this gate to require PASS");
  assert.deepEqual(trading.issues.map(issue => [issue.code, issue.path]), [
    ["PLUGIN_CAPABILITY_OPERATION_ID_NAMESPACE_MISMATCH",
      "features[0].contributions[0].operation.operationId"],
    ["PLUGIN_CAPABILITY_OPERATION_ID_NAMESPACE_MISMATCH",
      "features[0].contributions[5].operation.operationId"]
  ]);

  for (const pkg of [
    ledgerRuntimeConfiguratorPackage,
    tradingReferencePackageV010
  ]) {
    assert.ok(pkg.features.some(feature =>
      feature.contributions?.some(contribution =>
        contribution.kind === "platform.capability-operation"
        && contribution.operation.exposure.includes("PERSONAL_AGENT")
        && contribution.operation.effect === "READ"
      )
    ));
  }
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
