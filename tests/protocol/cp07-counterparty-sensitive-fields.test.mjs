import test from "node:test";
import assert from "node:assert/strict";

import {
  createCounterpartyDetailPageV010
} from "../../dist/apps/counterparty/page.js";
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

function requestContext() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "owner-a",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-owner-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a",
      userId: "owner-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner-a",
        ownerSubjectId: "owner-a"
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
    correlationId: "cp07-sensitive-fields"
  };
}

const subject = {
  contractVersion: "0.1.0",
  counterpartyId: "cp-sensitive",
  code: "C-SENSITIVE",
  displayName: "Sensitive Counterparty",
  subjectType: "ORGANIZATION",
  status: "ACTIVE",
  legalName: "Sensitive Counterparty Legal Ltd",
  taxIdentifier: "TAX-SECRET-001",
  countryOrRegion: "JP",
  phone: "+81-SECRET-CORE",
  email: "core-secret@example.test"
};

const fieldIds = [
  "displayName",
  "code",
  "subjectType",
  "legalName",
  "taxIdentifier",
  "countryOrRegion",
  "phone",
  "email",
  "customerLevel",
  "customerSource",
  "salesRegion",
  "supplierClassification",
  "procurementRegion",
  "primaryContactName",
  "primaryContactTitle",
  "primaryContactPhone",
  "primaryContactEmail",
  "primaryAddressLine1",
  "primaryAddressCity",
  "primaryAddressRegion",
  "primaryAddressPostalCode",
  "primaryAddressCountryOrRegion"
];

test("CP-07 sensitive-field policy strips core, Contact, Address and Profile values before Eidos detail output", async () => {
  const denied = [
    "taxIdentifier",
    "phone",
    "email",
    "customerLevel",
    "customerSource",
    "salesRegion",
    "supplierClassification",
    "procurementRegion",
    "primaryContactName",
    "primaryContactTitle",
    "primaryContactPhone",
    "primaryContactEmail",
    "primaryAddressLine1",
    "primaryAddressCity",
    "primaryAddressRegion",
    "primaryAddressPostalCode",
    "primaryAddressCountryOrRegion"
  ];
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      counterpartyAuthorizationPolicyV010,
      {
        contractVersion: "0.1.0",
        rules: [{
          id: "deny-sensitive-counterparty-fields",
          effect: "DENY",
          actions: ["counterparty.field.read"],
          resourceTypes: ["counterparty.field"],
          resourceIds: denied
        }]
      }
    )
  );

  const access = await resolveCounterpartyReadAccessV010({
    authorizationProvider: provider,
    requestContext: requestContext(),
    enterpriseRelationshipKind: "OWNER",
    counterparties: [subject],
    responsibilities: [],
    fieldIds
  });

  assert.equal(access.counterparties.length, 1);
  for (const fieldId of denied) {
    assert.equal(access.readableFieldIds.includes(fieldId), false);
  }

  const page = createCounterpartyDetailPageV010({
    counterparty: subject,
    roles: [{
      contractVersion: "0.1.0",
      roleId: "cp-sensitive.customer",
      counterpartyId: "cp-sensitive",
      roleCode: "CUSTOMER"
    }, {
      contractVersion: "0.1.0",
      roleId: "cp-sensitive.supplier",
      counterpartyId: "cp-sensitive",
      roleCode: "SUPPLIER"
    }],
    customerProfile: {
      contractVersion: "0.1.0",
      profileId: "cp-sensitive.customer",
      counterpartyId: "cp-sensitive",
      roleCode: "CUSTOMER",
      status: "ACTIVE",
      values: {
        customerLevel: "VIP-SECRET",
        customerSource: "PRIVATE-SOURCE",
        salesRegion: "PRIVATE-SALES-REGION"
      }
    },
    supplierProfile: {
      contractVersion: "0.1.0",
      profileId: "cp-sensitive.supplier",
      counterpartyId: "cp-sensitive",
      roleCode: "SUPPLIER",
      status: "ACTIVE",
      values: {
        supplierClassification: "STRATEGIC-SECRET",
        procurementRegion: "PRIVATE-PROCUREMENT-REGION"
      }
    },
    contacts: [{
      contractVersion: "0.1.0",
      contactId: "contact-secret",
      counterpartyId: "cp-sensitive",
      displayName: "Secret Person",
      status: "ACTIVE",
      title: "Secret Title",
      phone: "+81-SECRET-CONTACT",
      email: "contact-secret@example.test",
      isPrimary: true
    }],
    addresses: [{
      contractVersion: "0.1.0",
      addressId: "address-secret",
      counterpartyId: "cp-sensitive",
      purpose: "BILLING",
      status: "ACTIVE",
      line1: "1 Secret Street",
      city: "Secret City",
      region: "Secret Region",
      postalCode: "SECRET-POSTAL",
      countryOrRegion: "JP",
      isPrimary: true
    }],
    locale: "en",
    readableFieldIds: access.readableFieldIds,
    canManage: false
  });

  const serialized = JSON.stringify(page);
  for (const secret of [
    "TAX-SECRET-001",
    "+81-SECRET-CORE",
    "core-secret@example.test",
    "VIP-SECRET",
    "PRIVATE-SOURCE",
    "PRIVATE-SALES-REGION",
    "STRATEGIC-SECRET",
    "PRIVATE-PROCUREMENT-REGION",
    "Secret Person",
    "Secret Title",
    "+81-SECRET-CONTACT",
    "contact-secret@example.test",
    "1 Secret Street",
    "Secret City",
    "Secret Region",
    "SECRET-POSTAL"
  ]) {
    assert.equal(serialized.includes(secret), false, secret + " must not leak");
  }

  assert.equal(page.actions.length, 0);
  assert.equal(
    page.items.some(item => item.category === "Contacts"),
    false
  );
  assert.equal(
    page.items.some(item => item.category === "Addresses"),
    false
  );
  assert.equal(
    page.items.some(item => item.category === "Customer profile"),
    false
  );
  assert.equal(
    page.items.some(item => item.category === "Supplier profile"),
    false
  );
});

test("CP-07 denying displayName fails the Counterparty read closed instead of returning a partially identifying record", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      counterpartyAuthorizationPolicyV010,
      {
        contractVersion: "0.1.0",
        rules: [{
          id: "deny-counterparty-display-name",
          effect: "DENY",
          actions: ["counterparty.field.read"],
          resourceTypes: ["counterparty.field"],
          resourceIds: ["displayName"]
        }]
      }
    )
  );

  const access = await resolveCounterpartyReadAccessV010({
    authorizationProvider: provider,
    requestContext: requestContext(),
    enterpriseRelationshipKind: "OWNER",
    counterparties: [subject],
    responsibilities: [],
    fieldIds
  });

  assert.equal(access.readableFieldIds.includes("displayName"), false);
  assert.deepEqual(access.counterparties, []);
});
