import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../../dist/apps/counterparty/roles.js";
import {
  createResponsibilityRepositoryV010
} from "../../dist/apps/responsibility/repository.js";
import {
  createCounterpartyProjectionServiceV010
} from "../../dist/apps/counterparty/projection-service.js";
import {
  createCounterpartyProjectionActionHandlersV010
} from "../../dist/apps/counterparty/projection-actions.js";
import {
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010
} from "../../dist/apps/counterparty/projections.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE
} from "../../dist/apps/counterparty/constants.js";
import {
  counterpartyAuthorizationPolicyV010
} from "../../dist/apps/counterparty/authorization.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  counterpartyPackage
} from "../../dist/apps/counterparty/package.js";

function requestContext(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "seller-a",
      actorType,
      identityProviderId: "test.identity",
      sessionId: "session-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a",
      userId: "seller-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:seller-a",
        ownerSubjectId: "seller-a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "ent-a"
      }
    },
    correlationId: "cp06-projection-test"
  };
}

function action(commandCode) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values: {},
    sourceInteractionId: "cp06-projection-test",
    actionId: commandCode,
    requiresConfirmation: false
  };
}

function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  const responsibilityRepository =
    createResponsibilityRepositoryV010(resources);
  const authorizationProvider =
    createHostStaticAuthorizationProviderV010(
      counterpartyAuthorizationPolicyV010
    );

  for (const subject of [{
    counterpartyId: "cp-customer-mine",
    code: "C001",
    displayName: "Mine Customer"
  }, {
    counterpartyId: "cp-customer-other",
    code: "C002",
    displayName: "Other Customer"
  }, {
    counterpartyId: "cp-supplier-mine",
    code: "S001",
    displayName: "Mine Supplier"
  }]) {
    repository.save({
      contextId: "enterprise-context:a",
      subject: {
        contractVersion: "0.1.0",
        ...subject,
        subjectType: "ORGANIZATION",
        status: "ACTIVE"
      },
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-09T02:00:00.000Z"
    });
  }

  for (const counterpartyId of [
    "cp-customer-mine",
    "cp-customer-other"
  ]) {
    roleRepository.assign({
      contextId: "enterprise-context:a",
      counterpartyId,
      roleCode: "CUSTOMER",
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-09T02:01:00.000Z"
    });
  }
  roleRepository.assign({
    contextId: "enterprise-context:a",
    counterpartyId: "cp-supplier-mine",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T02:01:00.000Z"
  });

  responsibilityRepository.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "counterparty.subject",
      objectId: "cp-customer-mine"
    },
    responsibilityType: "SALES_OWNER",
    assigneeRef: {
      kind: "PRINCIPAL",
      id: "seller-a"
    },
    effectiveFrom: "2026-10-09T00:00:00.000Z",
    actorSubjectId: "owner-a"
  });
  responsibilityRepository.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "counterparty.subject",
      objectId: "cp-customer-other"
    },
    responsibilityType: "SALES_OWNER",
    assigneeRef: {
      kind: "PRINCIPAL",
      id: "someone-else"
    },
    effectiveFrom: "2026-10-09T00:00:00.000Z",
    actorSubjectId: "owner-a"
  });
  responsibilityRepository.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "counterparty.subject",
      objectId: "cp-supplier-mine"
    },
    responsibilityType: "PROCUREMENT_OWNER",
    assigneeRef: {
      kind: "PRINCIPAL",
      id: "seller-a"
    },
    effectiveFrom: "2026-10-09T00:00:00.000Z",
    actorSubjectId: "owner-a"
  });

  const service = createCounterpartyProjectionServiceV010({
    repository,
    roleRepository,
    responsibilityRepository,
    resolveAuthorizationProvider: () => authorizationProvider,
    fieldIds: () => ["displayName", "code", "subjectType"]
  });

  return {
    service,
    handlers: createCounterpartyProjectionActionHandlersV010({
      service,
      resolveEnterpriseRelationshipKind: () => "MEMBER"
    })
  };
}

test("CP-06 Human and Personal Agent read the same governed My Customers projection", async () => {
  const f = fixture();

  const human = await f.service.read({
    contextId: "enterprise-context:a",
    projectionId: COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
    requestContext: requestContext("HUMAN"),
    enterpriseRelationshipKind: "MEMBER"
  });

  const handler = f.handlers.find(
    item => item.commandCode === COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010
  );
  const agent = await handler.execute(
    action(COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010),
    requestContext("AI")
  );

  assert.equal(agent.ok, true);
  assert.deepEqual(
    human.counterparties.map(item => item.counterpartyId),
    ["cp-customer-mine"]
  );
  assert.deepEqual(
    agent.result.counterparties.map(item => item.counterpartyId),
    human.counterparties.map(item => item.counterpartyId)
  );
  assert.equal(agent.result.route, COUNTERPARTY_MY_CUSTOMERS_ROUTE);
  assert.equal(agent.result.count, 1);
  assert.equal(
    agent.result.counterparties.some(
      item => item.counterpartyId === "cp-customer-other"
    ),
    false
  );
});

test("CP-06 Human and Personal Agent read the same governed My Suppliers projection", async () => {
  const f = fixture();

  const human = await f.service.read({
    contextId: "enterprise-context:a",
    projectionId: COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    requestContext: requestContext("HUMAN"),
    enterpriseRelationshipKind: "MEMBER"
  });

  const handler = f.handlers.find(
    item => item.commandCode === COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010
  );
  const agent = await handler.execute(
    action(COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010),
    requestContext("AI")
  );

  assert.equal(agent.ok, true);
  assert.deepEqual(
    human.counterparties.map(item => item.counterpartyId),
    ["cp-supplier-mine"]
  );
  assert.deepEqual(
    agent.result.counterparties.map(item => item.counterpartyId),
    human.counterparties.map(item => item.counterpartyId)
  );
  assert.equal(agent.result.route, COUNTERPARTY_MY_SUPPLIERS_ROUTE);
  assert.equal(agent.result.count, 1);
});

test("CP-06 Counterparty package exposes projection reads to Human and Personal Agent through Capability Fabric", () => {
  const operations = counterpartyPackage.features[0].contributions.filter(
    item => item.kind === "platform.capability-operation"
  ).map(item => item.operation);

  const myCustomers = operations.find(
    item => item.operationId === "counterparty.projection.my-customers.read"
  );
  const mySuppliers = operations.find(
    item => item.operationId === "counterparty.projection.my-suppliers.read"
  );

  assert.ok(myCustomers);
  assert.ok(mySuppliers);
  assert.equal(myCustomers.effect, "READ");
  assert.deepEqual(
    [...myCustomers.exposure].sort(),
    ["AUTOMATION", "HUMAN", "PERSONAL_AGENT"].sort()
  );
  assert.equal(
    myCustomers.binding.commandCode,
    COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010
  );
  assert.equal(
    mySuppliers.binding.commandCode,
    COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010
  );
});
