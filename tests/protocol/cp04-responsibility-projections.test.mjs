import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

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
  createResponsibilityRepositoryV010,
  RESPONSIBILITY_COLLECTION_V010,
  RESPONSIBILITY_NAMESPACE_V010,
  RESPONSIBILITY_RESOURCE_TYPE_V010
} from "../../dist/apps/responsibility/repository.js";
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_PROCUREMENT_OWNER_RESPONSIBILITY_V010,
  COUNTERPARTY_SALES_OWNER_RESPONSIBILITY_V010,
  counterpartyAuthorizedDataScopeV010,
  projectCounterpartiesV010
} from "../../dist/apps/counterparty/projections.js";
import {
  createCounterpartyProjectionPageV010
} from "../../dist/apps/counterparty/page.js";
import {
  counterpartyPackage
} from "../../dist/apps/counterparty/package.js";
import {
  resolveCounterpartyReadAccessV010
} from "../../dist/apps/counterparty/access.js";
import {
  counterpartyAuthorizationPolicyV010
} from "../../dist/apps/counterparty/authorization.js";
import {
  createHostStaticAuthorizationProviderV010,
  mergeHostStaticAuthorizationPoliciesV010
} from "../../dist/providers/authorization/runtime.js";

function subject(id, code = id) {
  return {
    contractVersion: "0.1.0",
    counterpartyId: id,
    code,
    displayName: "Party " + id,
    subjectType: "ORGANIZATION",
    status: "ACTIVE",
    taxIdentifier: "TAX-" + id
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
    correlationId: "cp04-test"
  };
}

test("CP-04 Responsibility is independent enterprise state and one identity may carry different sales/procurement owners", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const responsibilities = createResponsibilityRepositoryV010(resources);

  counterparties.save({
    contextId: "enterprise-context:a",
    subject: subject("cp-1", "C001"),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T15:30:00.000Z"
  });
  roles.assignMany({
    contextId: "enterprise-context:a",
    assignments: [
      { counterpartyId: "cp-1", roleCode: "CUSTOMER" },
      { counterpartyId: "cp-1", roleCode: "SUPPLIER" }
    ],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T15:31:00.000Z"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "counterparty.subject",
      objectId: "cp-1"
    },
    responsibilityType: COUNTERPARTY_SALES_OWNER_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "sales-a" },
    effectiveFrom: "2026-10-07T15:32:00.000Z",
    actorSubjectId: "owner-a"
  });
  responsibilities.assign({
    contextId: "enterprise-context:a",
    targetRef: {
      objectType: "counterparty.subject",
      objectId: "cp-1"
    },
    responsibilityType: COUNTERPARTY_PROCUREMENT_OWNER_RESPONSIBILITY_V010,
    assigneeRef: { kind: "PRINCIPAL", id: "buyer-b" },
    effectiveFrom: "2026-10-07T15:33:00.000Z",
    actorSubjectId: "owner-a"
  });

  assert.equal(counterparties.list("enterprise-context:a").length, 1);
  assert.deepEqual(
    responsibilities.list("enterprise-context:a", {
      objectId: "cp-1"
    }).map(item => [item.responsibilityType, item.assigneeRef.id]),
    [
      ["PROCUREMENT_OWNER", "buyer-b"],
      ["SALES_OWNER", "sales-a"]
    ]
  );

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: RESPONSIBILITY_NAMESPACE_V010,
    collectionId: RESPONSIBILITY_COLLECTION_V010,
    resourceType: RESPONSIBILITY_RESOURCE_TYPE_V010,
    lifecycleState: "ACTIVE"
  });
  assert.equal(raw.length, 2);
  assert.equal(
    raw.every(item => item.ownerPackageId === "evo-responsibility"),
    true
  );
});

test("CP-04 projections intersect authorized scope, relationship role and responsibility", () => {
  const counterparties = [
    subject("cp-1"),
    subject("cp-2"),
    subject("cp-3")
  ];
  const roles = [
    {
      contractVersion: "0.1.0",
      roleId: "cp-1.customer",
      counterpartyId: "cp-1",
      roleCode: "CUSTOMER"
    },
    {
      contractVersion: "0.1.0",
      roleId: "cp-1.supplier",
      counterpartyId: "cp-1",
      roleCode: "SUPPLIER"
    },
    {
      contractVersion: "0.1.0",
      roleId: "cp-2.customer",
      counterpartyId: "cp-2",
      roleCode: "CUSTOMER"
    },
    {
      contractVersion: "0.1.0",
      roleId: "cp-3.supplier",
      counterpartyId: "cp-3",
      roleCode: "SUPPLIER"
    }
  ];
  const responsibility = (objectId, type, assigneeId) => ({
    contractVersion: "0.1.0",
    assignmentId: objectId + ":" + type + ":" + assigneeId,
    targetRef: {
      objectType: "counterparty.subject",
      objectId
    },
    responsibilityType: type,
    assigneeRef: { kind: "PRINCIPAL", id: assigneeId },
    effectiveFrom: "2026-10-07T15:00:00.000Z",
    status: "ACTIVE"
  });
  const responsibilities = [
    responsibility("cp-1", "SALES_OWNER", "owner-a"),
    responsibility("cp-1", "PROCUREMENT_OWNER", "buyer-b"),
    responsibility("cp-2", "SALES_OWNER", "sales-b"),
    responsibility("cp-3", "PROCUREMENT_OWNER", "owner-a")
  ];

  const ownerScope = counterpartyAuthorizedDataScopeV010({
    counterparties,
    responsibilities,
    principalSubjectId: "owner-a",
    enterpriseRelationshipKind: "OWNER"
  });
  assert.deepEqual(
    projectCounterpartiesV010({
      projectionId: COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
      counterparties,
      roles,
      responsibilities,
      principalSubjectId: "owner-a",
      authorizedCounterpartyIds: ownerScope
    }).map(item => item.counterpartyId),
    ["cp-1"]
  );
  assert.deepEqual(
    projectCounterpartiesV010({
      projectionId: COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
      counterparties,
      roles,
      responsibilities,
      principalSubjectId: "owner-a",
      authorizedCounterpartyIds: ownerScope
    }).map(item => item.counterpartyId),
    ["cp-3"]
  );

  const memberScope = counterpartyAuthorizedDataScopeV010({
    counterparties,
    responsibilities,
    principalSubjectId: "sales-b",
    enterpriseRelationshipKind: "MEMBER"
  });
  assert.deepEqual([...memberScope], ["cp-2"]);
  assert.deepEqual(
    projectCounterpartiesV010({
      projectionId: COUNTERPARTY_CUSTOMER_PROJECTION_V010,
      counterparties,
      roles,
      responsibilities,
      principalSubjectId: "sales-b",
      authorizedCounterpartyIds: memberScope
    }).map(item => item.counterpartyId),
    ["cp-2"]
  );
});

test("CP-04 read authorization removes denied records and fields before Eidos page creation", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      counterpartyAuthorizationPolicyV010,
      {
        contractVersion: "0.1.0",
        rules: [{
          id: "deny-secret-counterparty",
          effect: "DENY",
          actions: ["counterparty.read"],
          resourceTypes: ["counterparty.subject"],
          resourceIds: ["cp-secret"]
        }, {
          id: "deny-tax-field",
          effect: "DENY",
          actions: ["counterparty.field.read"],
          resourceTypes: ["counterparty.field"],
          resourceIds: ["taxIdentifier"]
        }]
      }
    )
  );
  const counterparties = [
    subject("cp-visible"),
    subject("cp-secret")
  ];
  const access = await resolveCounterpartyReadAccessV010({
    authorizationProvider: provider,
    requestContext: requestContext(),
    enterpriseRelationshipKind: "OWNER",
    counterparties,
    responsibilities: [],
    fieldIds: [
      "displayName",
      "code",
      "subjectType",
      "taxIdentifier"
    ]
  });

  assert.deepEqual(
    access.counterparties.map(item => item.counterpartyId),
    ["cp-visible"]
  );
  assert.equal(access.readableFieldIds.includes("taxIdentifier"), false);

  const page = createCounterpartyProjectionPageV010({
    projectionId: COUNTERPARTY_CUSTOMER_PROJECTION_V010,
    counterparties: access.counterparties,
    locale: "zh-CN",
    readableFieldIds: access.readableFieldIds,
    canManage: false
  });
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, "cp-visible");
  assert.equal("税号 / 纳税识别号" in page.items[0].metadata, false);
  assert.equal(
    page.actions.some(action => action.id === "create"),
    false
  );
});

test("CP-04 projection path handles 10k records without duplicate identities", () => {
  const counterparties = [];
  const roles = [];
  const responsibilities = [];
  for (let index = 0; index < 10_000; index += 1) {
    const id = "cp-" + index;
    counterparties.push(subject(id));
    roles.push({
      contractVersion: "0.1.0",
      roleId: id + ".customer",
      counterpartyId: id,
      roleCode: "CUSTOMER"
    });
    if (index % 2 === 0) {
      responsibilities.push({
        contractVersion: "0.1.0",
        assignmentId: id + ":sales",
        targetRef: {
          objectType: "counterparty.subject",
          objectId: id
        },
        responsibilityType: "SALES_OWNER",
        assigneeRef: { kind: "PRINCIPAL", id: "owner-a" },
        effectiveFrom: "2026-10-07T15:00:00.000Z",
        status: "ACTIVE"
      });
    }
  }
  const authorized = new Set(
    counterparties.map(item => item.counterpartyId)
  );
  const started = performance.now();
  const result = projectCounterpartiesV010({
    projectionId: COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
    counterparties,
    roles,
    responsibilities,
    principalSubjectId: "owner-a",
    authorizedCounterpartyIds: authorized
  });
  const elapsed = performance.now() - started;

  assert.equal(result.length, 5_000);
  assert.equal(
    new Set(result.map(item => item.counterpartyId)).size,
    result.length
  );
  assert.ok(elapsed < 2_000, "10k projection should remain interactive");
});

test("CP-04 role projections are discoverable under Counterparty navigation", () => {
  assert.equal(
    counterpartyPackage.features[0].requiresCapabilities.includes(
      "enterprise.responsibility"
    ),
    true
  );
  const experience = counterpartyPackage.features[0].contributions
    .find(item => item.kind === "eidos.experience").manifest;
  const children = experience.navigation
    .filter(item => item.parentId === "evo-counterparty.nav")
    .map(item => [item.label, item.route]);
  assert.deepEqual(children, [
    ["Customers", "/counterparties/customers"],
    ["Suppliers", "/counterparties/suppliers"],
    ["My Customers", "/counterparties/my-customers"],
    ["My Suppliers", "/counterparties/my-suppliers"]
  ]);
});
