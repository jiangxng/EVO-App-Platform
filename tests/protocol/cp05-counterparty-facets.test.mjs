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
  createCounterpartyContactRepositoryV010,
  createCounterpartyAddressRepositoryV010,
  createCounterpartyProfileRepositoryV010
} from "../../dist/apps/counterparty/facets.js";

function setup() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const contacts = createCounterpartyContactRepositoryV010({
    resources,
    counterpartyRepository: counterparties
  });
  const addresses = createCounterpartyAddressRepositoryV010({
    resources,
    counterpartyRepository: counterparties
  });
  const profiles = createCounterpartyProfileRepositoryV010({
    resources,
    counterpartyRepository: counterparties,
    roleRepository: roles
  });
  counterparties.save({
    contextId: "enterprise-context:a",
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "ABC有限公司",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:00:00.000Z"
  });
  return { resources, counterparties, roles, contacts, addresses, profiles };
}

test("CP-05 Contact is a repeatable child resource, not a flattened Counterparty field", () => {
  const { counterparties, contacts, resources } = setup();

  contacts.save({
    contextId: "enterprise-context:a",
    contact: {
      contractVersion: "0.1.0",
      contactId: "contact-1",
      counterpartyId: "cp-1",
      displayName: "张三",
      status: "ACTIVE",
      title: "采购经理",
      phone: "+86-13800000001",
      email: "zhang@example.com",
      isPrimary: true
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:01:00.000Z"
  });
  contacts.save({
    contextId: "enterprise-context:a",
    contact: {
      contractVersion: "0.1.0",
      contactId: "contact-2",
      counterpartyId: "cp-1",
      displayName: "李四",
      status: "ACTIVE",
      phone: "+86-13800000002"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:02:00.000Z"
  });

  assert.equal(contacts.list("enterprise-context:a", "cp-1").length, 2);
  assert.equal(contacts.list("enterprise-context:a", "cp-1")[0].contactId, "contact-1");
  assert.equal(counterparties.get("enterprise-context:a", "cp-1").displayName, "ABC有限公司");

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "contacts",
    resourceType: "counterparty.contact"
  });
  assert.equal(raw.length, 2);
  assert.equal(raw.every(item => item.ownerPackageId === "evo-counterparty"), true);
});

test("CP-05 Address is repeatable and independently archived", () => {
  const { addresses } = setup();

  for (const address of [{
    addressId: "address-registered",
    purpose: "REGISTERED",
    line1: "香港中环1号",
    isPrimary: true
  }, {
    addressId: "address-shipping",
    purpose: "SHIPPING",
    line1: "香港九龙2号"
  }]) {
    addresses.save({
      contextId: "enterprise-context:a",
      address: {
        contractVersion: "0.1.0",
        counterpartyId: "cp-1",
        status: "ACTIVE",
        countryOrRegion: "中国香港",
        ...address
      },
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-08T10:03:00.000Z"
    });
  }

  assert.equal(addresses.list("enterprise-context:a", "cp-1").length, 2);
  addresses.archive({
    contextId: "enterprise-context:a",
    counterpartyId: "cp-1",
    addressId: "address-shipping",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:04:00.000Z"
  });
  assert.deepEqual(
    addresses.list("enterprise-context:a", "cp-1").map(item => item.addressId),
    ["address-registered"]
  );
});

test("CP-05 CustomerProfile and SupplierProfile require their relationship roles", () => {
  const { roles, profiles } = setup();

  assert.throws(() => profiles.save({
    contextId: "enterprise-context:a",
    profile: {
      contractVersion: "0.1.0",
      profileId: "profile-customer-cp-1",
      counterpartyId: "cp-1",
      roleCode: "CUSTOMER",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:05:00.000Z"
  }), /COUNTERPARTY_PROFILE_ROLE_REQUIRED/);

  roles.assign({
    contextId: "enterprise-context:a",
    counterpartyId: "cp-1",
    roleCode: "CUSTOMER",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:06:00.000Z"
  });
  roles.assign({
    contextId: "enterprise-context:a",
    counterpartyId: "cp-1",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:07:00.000Z"
  });

  profiles.save({
    contextId: "enterprise-context:a",
    profile: {
      contractVersion: "0.1.0",
      profileId: "profile-customer-cp-1",
      counterpartyId: "cp-1",
      roleCode: "CUSTOMER",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:08:00.000Z"
  });
  profiles.save({
    contextId: "enterprise-context:a",
    profile: {
      contractVersion: "0.1.0",
      profileId: "profile-supplier-cp-1",
      counterpartyId: "cp-1",
      roleCode: "SUPPLIER",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:09:00.000Z"
  });

  assert.equal(
    profiles.get("enterprise-context:a", "cp-1", "CUSTOMER").profileId,
    "profile-customer-cp-1"
  );
  assert.equal(
    profiles.get("enterprise-context:a", "cp-1", "SUPPLIER").profileId,
    "profile-supplier-cp-1"
  );
});

test("CP-05 child resources cannot exist without a live parent Counterparty", () => {
  const { contacts, addresses } = setup();

  assert.throws(() => contacts.save({
    contextId: "enterprise-context:a",
    contact: {
      contractVersion: "0.1.0",
      contactId: "orphan-contact",
      counterpartyId: "missing",
      displayName: "孤立联系人",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:10:00.000Z"
  }), /COUNTERPARTY_NOT_FOUND/);

  assert.throws(() => addresses.save({
    contextId: "enterprise-context:a",
    address: {
      contractVersion: "0.1.0",
      addressId: "orphan-address",
      counterpartyId: "missing",
      purpose: "OTHER",
      status: "ACTIVE",
      line1: "unknown"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T10:11:00.000Z"
  }), /COUNTERPARTY_NOT_FOUND/);
});
