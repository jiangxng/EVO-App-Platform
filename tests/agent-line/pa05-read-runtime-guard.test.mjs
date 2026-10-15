import test from "node:test";
import assert from "node:assert/strict";

import { createAppActionRouter } from "../../dist/actions/router.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ledgerRuntimeConfiguratorPackage,
  tradingReferencePackageV010
} from "../../dist/catalog/seed.js";
import {
  createLedgerRuntimeConfiguratorCapabilityActionHandlers,
  LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND
} from "../../dist/apps/ledger-runtime-configurator/capability-action-handlers.js";
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
  createCapabilityOperationActionPreExecuteV010
} from "../../dist/manager/capability-operation-access.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";
import {
  createPa05CertifiedReadActionGatewayV010
} from "../../certification/pa05-read-action-gateway.mjs";
import {
  certifyCapabilitySchemaDefinitionV010
} from "../../certification/capability-operation-schema-fixture.mjs";

const ledgerOp = "ledger.runtime.configuration.describe";
const values = {
  orderNo: "PO-PA05-B",
  supplierCounterpartyId: "supplier-b",
  itemId: "item-b",
  warehouseId: "warehouse-b"
};
const common = { order_no: values.orderNo, supplier: values.supplierCounterpartyId,
  product_id: values.itemId };
const dimensioned = { ...common, warehouse: values.warehouseId };

function context(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: { contractVersion: "0.1.0", subjectId: "human-b",
      actorType, identityProviderId: "test.identity", sessionId: "session-b" },
    scope: { contractVersion: "0.1.0", enterpriseId: "host-b", userId: "human-b" },
    context: { activeContext: { contractVersion: "0.1.0",
      kind: "ENTERPRISE", contextId: "enterprise:host-b", enterpriseId: "host-b" } },
    correlationId: "pa05-b"
  };
}
function request(code, input = {}) {
  return {
    contractVersion: "0.1.0", type: "command",
    command: { code, inputVersion: "0.1.0" }, values: input,
    sourceInteractionId: "pa05-b", actionId: "read",
    requiresConfirmation: false
  };
}
function fixture() {
  const manager = createAppManagerService(
    createPackageCatalog([ledgerRuntimeConfiguratorPackage, tradingReferencePackageV010]),
    createMemoryLifecycleStore()
  );
  manager.install(ledgerRuntimeConfiguratorPackage.packageId);
  manager.install(tradingReferencePackageV010.packageId);
  const state = { revoked: false, obligations: false, checks: [], reads: 0 };
  const authorizationProvider = {
    providerId: "pa05-b.test",
    async check(input) {
      state.checks.push({
        actor: input.principal.actorType,
        action: input.action, enterprise: input.scope.enterpriseId,
        resourceId: input.resource.id
      });
      const allowed = !state.revoked && input.scope.enterpriseId === "host-b"
        && (!input.resource.id || input.resource.id === values.orderNo);
      return {
        contractVersion: "0.1.0", allowed,
        policyProviderId: "pa05-b.test",
        reasonCodes: allowed ? [] : ["PA05_B_DENIED"],
        ...(state.obligations ? { obligations: [{ type: "APPROVAL" }] } : {})
      };
    }
  };
  const service = createPurchaseOperationalProjectionServiceV010({
    resolveAuthorizationProvider: () => authorizationProvider,
    reader: {
      async listOpenWorkItems(enterpriseId) {
        state.reads++;
        assert.equal(enterpriseId, "evo-b");
        return {
          complete: true,
          items: [
            { sourceLedgerCode: "pending_purchase", workType: "RECEIVE",
              dimensions: dimensioned, quantity: 10 },
            { sourceLedgerCode: "payable", workType: "PAY",
              dimensions: common, amount: 125 }
          ]
        };
      },
      async readLedgerBalances(enterpriseId, code, dimensions) {
        state.reads++;
        assert.equal(enterpriseId, "evo-b");
        return {
          complete: true,
          items: [{ dimensions,
            quantity: code === "pending_purchase" ? 10 : 0,
            amount: code === "payable" ? 125 : 0 }]
        };
      }
    }
  });
  const owner = createPurchaseOperationalReadActionHandlerV010({
    service, resolveEvoEnterpriseId(ctx) {
      assert.equal(ctx.scope.enterpriseId, "host-b");
      return "evo-b";
    }
  });
  const actionRouter = createAppActionRouter([
    ...createLedgerRuntimeConfiguratorCapabilityActionHandlers(
      createLedgerRuntimeConfiguratorService()),
    owner
  ], featureId =>
    manager.listEffectiveCapabilityOperations()
      .some(op => op.featureId === featureId),
  createCapabilityOperationActionPreExecuteV010({
    manager, resolveAuthorizationProvider: () => authorizationProvider
  }));
  const gateway = makeGateway({
    manager, actionRouter, resolveAuthorizationProvider: () => authorizationProvider
  });
  return { manager, gateway, actionRouter, authorizationProvider, state };
}
function makeGateway(input, ids = [ledgerOp, PURCHASE_OPERATIONS_READ_OPERATION_V010]) {
  return createPa05CertifiedReadActionGatewayV010({
    ...input, certifiedOperationIds: ids
  });
}
function deferred() {
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const completed = new Promise(resolve => { release = resolve; });
  return { entered, release, started, completed };
}

test("PA05-02B runtime gateway enforces two real READ owners and Human/Agent parity", async () => {
  const f = fixture();
  const ledgerDirect = await f.gateway.execute(
    request(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND), context()
  );
  assert.equal(ledgerDirect.ok, true);
  assert.equal(ledgerDirect.result.kind, "evo.ledger-runtime.configuration-description");

  const purchaseDirect = await f.gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values), context()
  );
  assert.equal(purchaseDirect.ok, true);
  assert.equal(purchaseDirect.result.payableAmount, 125);

  const registrations = createPersonalAgentCapabilityToolRegistrationsV010({
    manager: f.manager, actionRouter: f.gateway,
    requestContext: context(),
    resolveAuthorizationProvider: () => f.authorizationProvider
  });
  const invoke = registrations.find(r =>
    r.descriptor.id === PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID);
  assert.ok(invoke);
  const ledgerAgent = await invoke.execute({ operationId: ledgerOp, input: {} }, []);
  const purchaseAgent = await invoke.execute({
    operationId: PURCHASE_OPERATIONS_READ_OPERATION_V010, input: values
  }, []);
  assert.deepEqual(ledgerAgent.result, ledgerDirect.result);
  assert.deepEqual(purchaseAgent.result, purchaseDirect.result);
  assert.ok(f.state.checks.some(x => x.actor === "HUMAN"));
  assert.ok(f.state.checks.some(x => x.actor === "AI"));
  assert.equal(f.state.reads, 8);
});

test("PA05-02B malformed input, unknown commands, missing context and obligations cannot reach owner", async () => {
  const f = fixture();
  const bad = await f.gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, {
      ...values, extra: "unexpected"
    }), context()
  );
  assert.equal(bad.error.code, "PA05_READ_GATEWAY_INPUT_INVALID");
  const wrongType = await f.gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, {
      ...values, itemId: 5
    }), context()
  );
  assert.equal(wrongType.error.code, "PA05_READ_GATEWAY_INPUT_INVALID");

  const denied = await f.gateway.execute(
    request("example.write", values), context()
  );
  assert.equal(denied.error.code, "PA05_READ_GATEWAY_OPERATION_NOT_ADMITTED");
  assert.equal((await f.gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values)
  )).error.code, "PA05_READ_GATEWAY_REQUEST_INVALID");

  f.state.obligations = true;
  const obligation = await f.gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values), context()
  );
  assert.equal(obligation.ok, false);
  assert.equal(f.state.reads, 0);
});

test("PA05-02B suppresses malformed successful owner outputs without leaking their payload", async () => {
  const f = fixture();
  const gateway = makeGateway({
    manager: f.manager,
    resolveAuthorizationProvider: () => f.authorizationProvider,
    actionRouter: {
      async execute() {
        return { ok: true, result: { payableAmount: "secret-not-a-number" } };
      }
    }
  }, [PURCHASE_OPERATIONS_READ_OPERATION_V010]);
  const result = await gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values), context()
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PA05_READ_GATEWAY_OUTPUT_INVALID");
  assert.equal(JSON.stringify(result).includes("secret-not-a-number"), false);
  assert.equal("result" in result, false);
});

test("PA05-02B permission revoked while READ is running cannot publish stale result", async () => {
  const f = fixture();
  const gate = deferred();
  const gateway = makeGateway({
    manager: f.manager, resolveAuthorizationProvider: () => f.authorizationProvider,
    actionRouter: {
      async execute() {
        gate.entered();
        await gate.completed;
        return { ok: true, result: { payableAmount: "forbidden" } };
      }
    }
  }, [PURCHASE_OPERATIONS_READ_OPERATION_V010]);
  const pending = gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values), context()
  );
  await gate.started;
  f.state.revoked = true;
  gate.release();
  const result = await pending;
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PA05_B_DENIED");
  assert.equal("result" in result, false);
});

test("PA05-02B owner disabled during READ cannot publish stale result; unrelated owner stays active", async () => {
  const f = fixture();
  const gate = deferred();
  const gateway = makeGateway({
    manager: f.manager, resolveAuthorizationProvider: () => f.authorizationProvider,
    actionRouter: {
      async execute() {
        gate.entered();
        await gate.completed;
        return { ok: true, result: { payableAmount: 125 } };
      }
    }
  }, [PURCHASE_OPERATIONS_READ_OPERATION_V010]);
  const pending = gateway.execute(
    request(PURCHASE_OPERATIONS_READ_COMMAND_V010, values), context()
  );
  await gate.started;
  f.manager.disable(tradingReferencePackageV010.packageId);
  gate.release();
  const result = await pending;
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PA05_READ_GATEWAY_OPERATION_CHANGED");
  const ledger = await f.gateway.execute(
    request(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND), context()
  );
  assert.equal(ledger.ok, true);
});

test("PA05-02B entire schema tree must be supported, even optional branches never present in data", () => {
  const f = fixture();
  const altered = structuredClone(ledgerRuntimeConfiguratorPackage);
  const contribution = altered.features[0].contributions.find(c =>
    c.kind === "platform.capability-operation"
    && c.operation.operationId === ledgerOp
  );
  contribution.operation.inputSchema.properties.neverUsed = {
    type: "object", properties: {
      nested: { type: "string", pattern: "^NOT-SUPPORTED$" }
    }
  };
  const invalid = certifyCapabilitySchemaDefinitionV010(
    contribution.operation.inputSchema
  );
  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some(i =>
    i.code === "PA05_CERT_SCHEMA_KEYWORD_UNSUPPORTED"
  ));
  const manager = createAppManagerService(
    createPackageCatalog([altered]), createMemoryLifecycleStore()
  );
  manager.install(altered.packageId);
  assert.throws(() => makeGateway({
    manager, actionRouter: f.actionRouter,
    resolveAuthorizationProvider: () => f.authorizationProvider
  }, [ledgerOp]), /PA05_READ_GATEWAY_SCHEMA_OR_OPERATION_NOT_CERTIFIED/);
});

test("PA05-02B does not admit a WRITE operation, even with a valid schema", () => {
  const f = fixture();
  const edited = structuredClone(ledgerRuntimeConfiguratorPackage);
  const op = edited.features[0].contributions.find(c =>
    c.kind === "platform.capability-operation"
    && c.operation.operationId === ledgerOp
  ).operation;
  op.effect = "WRITE";
  op.writeSafety = { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" };
  const manager = createAppManagerService(
    createPackageCatalog([edited]), createMemoryLifecycleStore()
  );
  manager.install(edited.packageId);
  assert.throws(() => makeGateway({
    manager, actionRouter: f.actionRouter,
    resolveAuthorizationProvider: () => f.authorizationProvider
  }, [ledgerOp]), /PA05_READ_GATEWAY_SCHEMA_OR_OPERATION_NOT_CERTIFIED/);
});
