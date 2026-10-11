import test from "node:test";
import assert from "node:assert/strict";
import {
  createPurchaseOperationalProjectionServiceV010,
  PURCHASE_OPERATIONS_READ_ACTION_V010
} from "../../dist/apps/trading-reference/operational-projection.js";

const base = {
  contextId: "enterprise-context:a",
  enterpriseId: "evo-a",
  orderNo: "PO-1",
  supplierCounterpartyId: "cp-1",
  itemId: "item-1",
  warehouseId: "wh-1"
};
const common = { order_no: "PO-1", supplier: "cp-1", product_id: "item-1" };
const warehouse = { ...common, warehouse: "wh-1" };

function request(actorType = "HUMAN") {
  return {
    ...base,
    requestContext: {
      contractVersion: "0.1.0",
      principal: {
        contractVersion: "0.1.0",
        actorType,
        subjectId: "user-1",
        sessionId: "session-1",
        identityProviderId: "identity.test"
      },
      scope: { contractVersion: "0.1.0", enterpriseId: "evo-a", userId: "user-1" },
      context: {
        activeContext: {
          contractVersion: "0.1.0", kind: "ENTERPRISE",
          contextId: "enterprise-context:a", enterpriseId: "evo-a"
        }
      },
      correlationId: "tr01-test"
    }
  };
}

function fixture({ pending = 0, inventory = 10, amount = 125, work = true } = {}) {
  const calls = [];
  const reader = {
    async listOpenWorkItems(enterpriseId) {
      calls.push(["work", enterpriseId]);
      const items = work ? [
        ...(pending > 0 ? [{
          sourceLedgerCode: "pending_purchase",
          workType: "RECEIVE",
          dimensions: warehouse,
          quantity: pending
        }] : []),
        {
          sourceLedgerCode: "payable", workType: "PAY",
          dimensions: common, amount
        },
        {
          sourceLedgerCode: "payable", workType: "PAY",
          dimensions: { ...common, order_no: "OTHER" }, amount: 900
        }
      ] : [];
      return { items, complete: true };
    },
    async readLedgerBalances(enterpriseId, ledger, dimensions) {
      calls.push([ledger, enterpriseId, dimensions]);
      const item = ledger === "pending_purchase"
        ? { dimensions: warehouse, quantity: pending, amount: 0 }
        : ledger === "inventory"
          ? { dimensions: warehouse, quantity: inventory, amount: inventory * 12.5 }
          : { dimensions: common, amount, quantity: 0 };
      return { items: [item], complete: true };
    }
  };
  const checks = [];
  const provider = {
    providerId: "test.policy",
    async check(input) {
      checks.push(input);
      return {
        contractVersion: "0.1.0", allowed: true,
        policyProviderId: "test.policy", reasonCodes: []
      };
    }
  };
  const service = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => provider
  });
  return { service, reader, calls, checks, provider };
}

test("TR-01A3 derives Work/Inventory/Payable from same read contract for Human and Agent", async () => {
  const { service, calls, checks } = fixture();
  const human = await service.read(request("HUMAN"));
  const agent = await service.read(request("AI"));
  assert.deepEqual(human, agent);
  assert.equal(human.pendingPurchaseQuantity, 0);
  assert.deepEqual(human.inventoryPosition, { quantity: 10, amount: 125 });
  assert.equal(human.payableAmount, 125);
  assert.deepEqual(human.openWork, { receive: null, pay: { amount: 125 } });
  assert.equal(checks.length, 2);
  assert.equal(checks[0].action, PURCHASE_OPERATIONS_READ_ACTION_V010);
  assert.equal(checks[0].resource.id, "PO-1");
  assert.equal(checks[0].resource.attributes.itemId, "item-1");
  assert.equal(checks[0].principal.actorType, "HUMAN");
  assert.equal(checks[1].principal.actorType, "AI");
  assert.equal(calls.length, 8);
  assert.equal(calls.filter(x => x[0] === "inventory").length, 2);
});

test("TR-01A3 reversal read reopens RECEIVE and preserves PAY without mutable stock", async () => {
  const { service } = fixture({ pending: 10, inventory: 0 });
  const view = await service.read(request());
  assert.deepEqual(view.openWork, {
    receive: { quantity: 10 }, pay: { amount: 125 }
  });
  assert.deepEqual(view.inventoryPosition, { quantity: 0, amount: 0 });
  assert.equal(view.pendingPurchaseQuantity, 10);
});

test("TR-01A3 fails closed before any EVO access for missing or denying policy", async () => {
  const { calls, reader } = fixture();
  const missing = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => undefined
  });
  await assert.rejects(missing.read(request()), /AUTHORIZATION_REQUIRED/);
  const denied = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => ({
      providerId: "deny",
      check: async () => ({
        contractVersion: "0.1.0", allowed: false,
        policyProviderId: "deny", reasonCodes: ["FORBIDDEN"]
      })
    })
  });
  await assert.rejects(denied.read(request()), /READ_DENIED/);
  const conditional = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => ({
      providerId: "conditional",
      check: async () => ({
        contractVersion: "0.1.0", allowed: true,
        policyProviderId: "conditional", reasonCodes: [],
        obligations: [{ type: "ROW_MASK" }]
      })
    })
  });
  await assert.rejects(conditional.read(request()), /READ_DENIED/);
  assert.deepEqual(calls, []);
});

test("TR-01A3 rejects cross-enterprise or inactive enterprise context before access", async () => {
  const { service, calls, checks } = fixture();
  const mismatched = request();
  mismatched.requestContext.scope.enterpriseId = "other-host-enterprise";
  await assert.rejects(service.read(mismatched), /CONTEXT_MISMATCH/);
  const personal = request();
  personal.requestContext.context.activeContext.kind = "PERSONAL";
  await assert.rejects(service.read(personal), /CONTEXT_MISMATCH/);
  assert.deepEqual(checks, []);
  assert.deepEqual(calls, []);
});

test("TR-01A3 rejects incomplete EVO pages, ambiguous balances, and missing derived Work", async () => {
  const f = fixture();
  const original = f.reader.listOpenWorkItems;
  f.reader.listOpenWorkItems = async enterprise => ({
    ...await original(enterprise),
    complete: false
  });
  await assert.rejects(f.service.read(request()), /INCOMPLETE_PAGE:work/);
  const b = fixture();
  const old = b.reader.readLedgerBalances;
  b.reader.readLedgerBalances = async (enterprise, ledger, dimensions) => {
    const result = await old(enterprise, ledger, dimensions);
    return ledger === "inventory"
      ? { items: [...result.items, ...result.items], complete: true }
      : result;
  };
  await assert.rejects(b.service.read(request()), /BALANCE_AMBIGUOUS:inventory/);
  const missing = fixture({ pending: 10, work: false });
  await assert.rejects(
    missing.service.read(request()),
    /WORK_BALANCE_NOT_READY:RECEIVE/
  );
});

test("TR-01A3 strictly scopes Work by order and supplier/item/warehouse dimensions", async () => {
  const f = fixture({ pending: 10, inventory: 0 });
  const old = f.reader.listOpenWorkItems;
  f.reader.listOpenWorkItems = async enterprise => {
    const original = await old(enterprise);
    return {
      ...original,
      items: [{
        sourceLedgerCode: "pending_purchase",
        workType: "RECEIVE",
        dimensions: { ...warehouse, warehouse: "other-wh" },
        quantity: 500
      }, ...original.items]
    };
  };
  const result = await f.service.read(request());
  assert.equal(result.openWork.receive.quantity, 10);
  assert.equal(result.openWork.pay.amount, 125);
});

test("TR-01A4 permits an explicitly bound EVO runtime scope distinct from Host enterprise", async () => {
  const { service } = fixture({ pending: 10, inventory: 0 });
  const scoped = request();
  scoped.enterpriseId = "evo-runtime-tenant-a";
  const view = await service.read(scoped);
  assert.equal(view.enterpriseId, "evo-runtime-tenant-a");
  assert.equal(view.pendingPurchaseQuantity, 10);
});
