import test from "node:test";
import assert from "node:assert/strict";

import { createAppActionRouter } from "../../dist/actions/router.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createCapabilityOperationActionPreExecuteV010 } from "../../dist/manager/capability-operation-access.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";
import {
  tradingReferencePackageV010
} from "../../dist/apps/trading-reference/package.js";
import {
  createPurchaseOperationalProjectionServiceV010
} from "../../dist/apps/trading-reference/operational-projection.js";
import {
  createPurchaseOperationalReadActionHandlerV010
} from "../../dist/apps/trading-reference/operational-actions.js";
import {
  PURCHASE_OPERATIONS_READ_OPERATION_V010
} from "../../dist/apps/trading-reference/constants.js";
import {
  purchaseAttentionPackageV010,
  PURCHASE_ATTENTION_CAPABILITY_V010,
  PURCHASE_ATTENTION_COMMAND_V010,
  PURCHASE_ATTENTION_OPERATION_V010
} from "../../dist/apps/purchase-attention/package.js";
import {
  createPurchaseAttentionActionHandlerV010
} from "../../dist/apps/purchase-attention/operation.js";
import {
  certifyCapabilitySchemaDefinitionV010
} from "../../certification/capability-operation-schema-fixture.mjs";
import {
  createPa05CertifiedReadActionGatewayV010
} from "../../certification/pa05-read-action-gateway.mjs";

const refs = {
  orderNo: "PO-ATTN-01",
  supplierCounterpartyId: "supplier-01",
  itemId: "item-01",
  warehouseId: "warehouse-01"
};
const common = {
  order_no: refs.orderNo, supplier: refs.supplierCounterpartyId,
  product_id: refs.itemId
};
const withWarehouse = { ...common, warehouse: refs.warehouseId };
function context(enterpriseId = "host-attn") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", subjectId: "human-attn",
      actorType: "HUMAN", identityProviderId: "fixture.identity",
      sessionId: "session-attn"
    },
    scope: {
      contractVersion: "0.1.0", enterpriseId, userId: "human-attn"
    },
    context: {
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: "enterprise:host-attn", enterpriseId: "host-attn"
      }
    },
    correlationId: "pa05-independent-attention"
  };
}
function request(values = refs, inputVersion = "0.1.0") {
  return {
    contractVersion: "0.1.0", type: "command",
    command: { code: PURCHASE_ATTENTION_COMMAND_V010, inputVersion },
    values: structuredClone(values),
    sourceInteractionId: "human.purchase-attention", actionId: "read",
    requiresConfirmation: false
  };
}
function provision(extra = {}) {
  const catalog = createPackageCatalog([
    tradingReferencePackageV010, purchaseAttentionPackageV010, ...extra.packages ?? []
  ]);
  const manager = createAppManagerService(catalog, createMemoryLifecycleStore());
  const plan = manager.planInstall(purchaseAttentionPackageV010.packageId);
  assert.deepEqual(plan.blockers, []);
  manager.install(purchaseAttentionPackageV010.packageId);

  const state = {
    denyAttention: false, denySource: false,
    incomplete: false, mismatched: false, zero: false,
    businessReads: 0, permissionChecks: []
  };
  const provider = {
    providerId: "pa05.independent-policy",
    async check(input) {
      const isAttention = input.action === PURCHASE_ATTENTION_OPERATION_V010;
      const isSource = input.action === PURCHASE_OPERATIONS_READ_OPERATION_V010;
      state.permissionChecks.push([input.principal.actorType, input.action, input.resource.id]);
      const allowed = input.scope.enterpriseId === "host-attn"
        && (input.resource.id === undefined || input.resource.id === refs.orderNo)
        && (isAttention || isSource)
        && !(isAttention && state.denyAttention)
        && !(isSource && state.denySource);
      return {
        contractVersion: "0.1.0", allowed,
        policyProviderId: "pa05.independent-policy",
        reasonCodes: allowed ? [] : ["PA05_DENIED"]
      };
    }
  };
  const reader = {
    async listOpenWorkItems(enterpriseId) {
      state.businessReads++;
      assert.equal(enterpriseId, "evo-attn");
      if (state.incomplete) return { complete: false, items: [] };
      return { complete: true, items: state.zero ? [] : [
        { sourceLedgerCode: "pending_purchase", workType: "RECEIVE",
          dimensions: withWarehouse, quantity: 10 },
        { sourceLedgerCode: "payable", workType: "PAY",
          dimensions: common, amount: 125 }
      ] };
    },
    async readLedgerBalances(enterpriseId, code, dimensions) {
      state.businessReads++;
      assert.equal(enterpriseId, "evo-attn");
      return {
        complete: true,
        items: [{
          dimensions: state.mismatched ? { ...dimensions, order_no: "OTHER" } : dimensions,
          quantity: state.zero ? 0 : code === "pending_purchase" ? 10 : code === "inventory" ? 5 : 0,
          amount: state.zero ? 0 : code === "payable" ? 125 : code === "inventory" ? 50 : 0
        }]
      };
    }
  };
  const sourceService = createPurchaseOperationalProjectionServiceV010({
    reader, resolveAuthorizationProvider: () => provider
  });
  const sourceHandler = createPurchaseOperationalReadActionHandlerV010({
    service: sourceService,
    resolveEvoEnterpriseId(ctx) {
      if (ctx.scope.enterpriseId !== "host-attn")
        throw new Error("TEST_EVO_SCOPE_BINDING_DENIED");
      return "evo-attn";
    }
  });
  let host;
  const attentionHandler = createPurchaseAttentionActionHandlerV010({
    sourceRouter: { execute(...args) { return host.execute(...args); } },
    resolveAuthorizationProvider: () => provider
  });
  host = createAppActionRouter(
    [sourceHandler, attentionHandler],
    featureId => manager.listEffectiveCapabilityOperations()
      .some(item => item.featureId === featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager, resolveAuthorizationProvider: () => provider
    })
  );
  const gateway = createPa05CertifiedReadActionGatewayV010({
    manager, actionRouter: host,
    resolveAuthorizationProvider: () => provider,
    certifiedOperationIds: [PURCHASE_ATTENTION_OPERATION_V010]
  });
  const tools = createPersonalAgentCapabilityToolRegistrationsV010({
    manager, actionRouter: gateway, requestContext: context(),
    resolveAuthorizationProvider: () => provider
  });
  const tool = id => {
    const result = tools.find(x => x.descriptor.id === id);
    assert.ok(result);
    return result;
  };
  return { plan, manager, gateway, state, tool, sourceHandler, attentionHandler, provider };
}
test("PA05-03 third plugin: independent package passes protocol and installs its source dependency", () => {
  const checked = validatePluginManifestV010(purchaseAttentionPackageV010);
  assert.equal(checked.ok, true, JSON.stringify(checked.issues));
  assert.deepEqual(checked.issues, []);
  const feature = purchaseAttentionPackageV010.features[0];
  assert.deepEqual(feature.requiresCapabilities, ["trading-reference.purchase-operations"]);
  assert.deepEqual(feature.providesCapabilities, [PURCHASE_ATTENTION_CAPABILITY_V010]);
  const operation = feature.contributions[0].operation;
  assert.equal(operation.effect, "READ");
  assert.deepEqual(operation.exposure, ["HUMAN", "PERSONAL_AGENT"]);
  assert.equal(certifyCapabilitySchemaDefinitionV010(operation.inputSchema).ok, true);
  assert.equal(certifyCapabilitySchemaDefinitionV010(operation.outputSchema).ok, true);
  const f = provision();
  assert.ok(f.plan.installPackages.includes(purchaseAttentionPackageV010.packageId));
  assert.ok(f.plan.installPackages.includes(tradingReferencePackageV010.packageId));
  assert.equal(f.manager.listEffectiveCapabilityOperations(PURCHASE_ATTENTION_CAPABILITY_V010).length, 1);
  assert.ok(f.manager.listEffectiveCapabilityOperations()
    .some(op => op.operationId === PURCHASE_OPERATIONS_READ_OPERATION_V010));
  const sourceDisable = f.manager.planDisable(tradingReferencePackageV010.packageId);
  assert.ok(sourceDisable.blockers.some(b => b.code === "ACTIVE_DEPENDENT_CAPABILITY"));
  assert.throws(
    () => f.manager.disable(tradingReferencePackageV010.packageId),
    /DISABLE_BLOCKED/
  );
  assert.ok(f.manager.listEffectiveCapabilityOperations().some(op =>
    op.operationId === PURCHASE_ATTENTION_OPERATION_V010
  ));
});

test("PA05-03 real purchase owner -> independent attention plugin: Human and Agent return identical business facts", async () => {
  const f = provision();
  const searched = await f.tool(PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({ query: "purchase attention", effects: ["READ"] }, []);
  assert.ok(searched.items.some(x => x.operationId === PURCHASE_ATTENTION_OPERATION_V010));
  const described = await f.tool(PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID)
    .execute({ operationId: PURCHASE_ATTENTION_OPERATION_V010 }, []);
  assert.equal(described.operation.capability, PURCHASE_ATTENTION_CAPABILITY_V010);
  assert.equal(described.operation.effect, "READ");

  const human = await f.gateway.execute(request(), context());
  assert.equal(human.ok, true, JSON.stringify(human.error));
  assert.deepEqual(human.result.attentionFlags, ["RECEIVE_PENDING", "PAYMENT_PENDING"]);
  assert.equal(human.result.pendingPurchaseQuantity, 10);
  assert.equal(human.result.payableAmount, 125);
  assert.equal(human.result.needsAttention, true);

  const agent = await f.tool(PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute({ operationId: PURCHASE_ATTENTION_OPERATION_V010, input: refs }, []);
  assert.deepEqual(agent.result, human.result);
  assert.ok(f.state.permissionChecks.some(x => x[0] === "AI" && x[1] === PURCHASE_ATTENTION_OPERATION_V010));
  assert.ok(f.state.permissionChecks.some(x => x[0] === "AI" && x[1] === PURCHASE_OPERATIONS_READ_OPERATION_V010));
  assert.equal(f.state.businessReads, 8);
});

test("PA05-03 no pending source Work produces a deterministic empty attention result", async () => {
  const f = provision();
  f.state.zero = true;
  const result = await f.gateway.execute(request(), context());
  assert.equal(result.ok, true);
  assert.deepEqual(result.result.attentionFlags, []);
  assert.equal(result.result.needsAttention, false);
  assert.equal(result.result.payableAmount, 0);
  assert.equal(result.result.pendingPurchaseQuantity, 0);
});

test("PA05-03 denying either independent plugin or its source fails closed before business reads", async () => {
  const f = provision();
  f.state.denyAttention = true;
  const denied = await f.gateway.execute(request(), context());
  assert.equal(denied.ok, false);
  assert.equal(f.state.businessReads, 0);
  const hidden = await f.tool(PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({ query: "purchase attention" }, []);
  assert.equal(hidden.items.some(x => x.operationId === PURCHASE_ATTENTION_OPERATION_V010), false);
  await assert.rejects(
    () => f.tool(PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({ operationId: PURCHASE_ATTENTION_OPERATION_V010, input: refs }, []),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
  f.state.denyAttention = false;
  f.state.denySource = true;
  const sourceDenied = await f.gateway.execute(request(), context());
  assert.equal(sourceDenied.ok, false);
  assert.equal(sourceDenied.error.code, "PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
  assert.equal(f.state.businessReads, 0);
});

test("PA05-03 wrong scope, invalid arguments, version mismatch and plugin disable fail closed", async () => {
  const f = provision();
  const wrong = await f.gateway.execute(request(), context("other-tenant"));
  assert.equal(wrong.ok, false);
  assert.equal(f.state.businessReads, 0);
  for (const [bad, expectedCode] of [
    [{ ...refs, orderNo: "" }, "CAPABILITY_OPERATION_RESOURCE_ID_REQUIRED"],
    [{ ...refs, itemId: 5 }, "PA05_READ_GATEWAY_INPUT_INVALID"],
    [{ ...refs, arbitraryValue: "extra" }, "PA05_READ_GATEWAY_INPUT_INVALID"]
  ]) {
    const result = await f.gateway.execute(request(bad), context());
    assert.equal(result.error.code, expectedCode);
  }
  const version = await f.gateway.execute(request(refs, "9.9.9"), context());
  assert.equal(version.error.code, "CAPABILITY_OPERATION_INPUT_VERSION_UNSUPPORTED");
  assert.equal(f.state.businessReads, 0);
  f.manager.disable(purchaseAttentionPackageV010.packageId);
  const disabled = await f.gateway.execute(request(), context());
  assert.equal(disabled.ok, false);
  assert.equal(f.state.businessReads, 0);
  assert.ok(f.manager.listEffectiveCapabilityOperations().some(op =>
    op.operationId === PURCHASE_OPERATIONS_READ_OPERATION_V010
  ));
});

test("PA05-03 incomplete or conflicting source facts never become an Agent recommendation", async () => {
  const f = provision();
  f.state.incomplete = true;
  let result = await f.gateway.execute(request(), context());
  assert.equal(result.error.code, "PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
  assert.equal("result" in result, false);
  f.state.incomplete = false;
  f.state.mismatched = true;
  result = await f.gateway.execute(request(), context());
  assert.equal(result.error.code, "PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
  assert.equal("result" in result, false);
  assert.equal(JSON.stringify(result).includes("OTHER"), false);
});

test("PA05-03 plugin Owner independently rejects forged upstream successful source outputs", async () => {
  const f = provision();
  const handler = createPurchaseAttentionActionHandlerV010({
    sourceRouter: {
      async execute() {
        return {
          ok: true,
          result: {
            contractVersion: "0.1.0",
            projectionId: "trading-reference.purchase-operations",
            enterpriseId: "evo-attn",
            orderNo: "UNRELATED_ORDER",
            references: { supplierCounterpartyId: refs.supplierCounterpartyId,
              itemId: refs.itemId, warehouseId: refs.warehouseId },
            pendingPurchaseQuantity: 12,
            payableAmount: 100,
            openWork: { receive: { quantity: 12 }, pay: { amount: 100 } }
          }
        };
      }
    },
    resolveAuthorizationProvider: () => f.provider
  });
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PURCHASE_ATTENTION_SOURCE_CONTRACT_INVALID");
  assert.equal("result" in result, false);
});
