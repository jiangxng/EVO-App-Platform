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
  createCounterpartyActionHandlersV010
} from "../../dist/apps/counterparty/actions.js";
import {
  createCounterpartyDirectoryPageV010,
  createCounterpartyCreatePageV010,
  createCounterpartyDetailPageV010,
  createCounterpartyEditPageV010
} from "../../dist/apps/counterparty/page.js";
import {
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_UPDATE_COMMAND,
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_ASSIGN_ROLE_COMMAND,
  COUNTERPARTY_REMOVE_ROLE_COMMAND
} from "../../dist/apps/counterparty/constants.js";
import {
  counterpartyPackage
} from "../../dist/apps/counterparty/package.js";

function context(contextId = "enterprise-context:a", enterpriseId = "ent-a") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "owner-a",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId
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
        contextId,
        enterpriseId
      }
    },
    correlationId: "cp-test"
  };
}

function action(commandCode, values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "counterparty-test",
    actionId: commandCode,
    requiresConfirmation: false
  };
}

test("Counterparty package requires Enterprise Resource Library and exposes Chinese navigation", () => {
  const feature = counterpartyPackage.features[0];
  assert.ok(feature.requiresCapabilities.includes("enterprise.resource.repository"));
  assert.ok(
    feature.providesCapabilities.includes(
      "enterprise.counterparty.relationship-role"
    )
  );
  const zh = feature.contributions.find(item =>
    item.kind === "eidos.localization-bundle"
    && item.bundle.locale === "zh-CN"
  );
  assert.equal(
    zh.bundle.messages["navigation.evo-counterparty.nav.label"],
    "往来对象"
  );
});

test("Counterparty create persists into the active Enterprise Context only", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  let id = 0;
  const handlers = createCounterpartyActionHandlersV010({
    repository,
    roleRepository,
    canManageEnterpriseContext: () => true,
    idFactory: () => "cp-" + (++id),
    now: () => new Date("2026-10-06T10:00:00.000Z")
  });
  const create = handlers.find(
    item => item.commandCode === COUNTERPARTY_CREATE_COMMAND
  );

  const result = await create.execute(
    action(COUNTERPARTY_CREATE_COMMAND, {
      code: "C001",
      displayName: "ABC有限公司",
      subjectType: "ORGANIZATION",
      legalName: "ABC有限公司",
      taxIdentifier: "TAX-001",
      countryOrRegion: "中国"
    }),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(repository.list("enterprise-context:a").length, 1);
  assert.equal(repository.list("enterprise-context:b").length, 0);

  const saved = repository.list("enterprise-context:a")[0];
  assert.equal(saved.counterpartyId, "cp-1");
  assert.equal(saved.code, "C001");
  assert.equal(saved.displayName, "ABC有限公司");
  assert.equal(saved.subjectType, "ORGANIZATION");

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty"
  })[0];
  assert.equal(raw.collectionId, "counterparties");
  assert.equal(raw.resourceType, "counterparty.subject");
  assert.equal(raw.schemaRef, "evo.counterparty/0.1.0");
  assert.equal(raw.ownerPackageId, "evo-counterparty");
});

test("Counterparty code is unique inside one Enterprise Context but may repeat in another", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  const base = {
    contractVersion: "0.1.0",
    counterpartyId: "cp-a",
    code: "C001",
    displayName: "Alpha",
    subjectType: "ORGANIZATION",
    status: "ACTIVE"
  };
  repository.save({
    contextId: "enterprise-context:a",
    subject: base,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T10:00:00.000Z"
  });

  assert.throws(() => repository.save({
    contextId: "enterprise-context:a",
    subject: {
      ...base,
      counterpartyId: "cp-a-2",
      displayName: "Another Alpha"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T10:01:00.000Z"
  }), /COUNTERPARTY_CODE_DUPLICATE/);

  assert.doesNotThrow(() => repository.save({
    contextId: "enterprise-context:b",
    subject: {
      ...base,
      counterpartyId: "cp-b",
      displayName: "Alpha in B"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T10:02:00.000Z"
  }));
});

test("Counterparty archive retains Enterprise Resource evidence but removes it from active directory", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  repository.save({
    contextId: "enterprise-context:a",
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "Alpha",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T10:00:00.000Z"
  });

  const handlers = createCounterpartyActionHandlersV010({
    repository,
    roleRepository,
    canManageEnterpriseContext: () => true,
    idFactory: () => "unused",
    now: () => new Date("2026-10-06T11:00:00.000Z")
  });
  const archive = handlers.find(
    item => item.commandCode === COUNTERPARTY_ARCHIVE_COMMAND
  );
  const result = await archive.execute(
    action(COUNTERPARTY_ARCHIVE_COMMAND, {
      counterpartyId: "cp-1"
    }),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(repository.list("enterprise-context:a").length, 0);
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.counterparty",
      lifecycleState: "ARCHIVED"
    }).length,
    1
  );
});

test("Counterparty pages establish list-first management UX and a valid create form", () => {
  const directory = createCounterpartyDirectoryPageV010({
    counterparties: [{
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "ABC有限公司",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    }],
    locale: "zh-CN"
  });
  assert.equal(directory.layout, "list");
  assert.equal(directory.title, "往来对象");
  assert.equal(directory.items[0].title, "ABC有限公司");
  assert.equal(directory.items.at(-1).id, "counterparty:create");

  const form = createCounterpartyCreatePageV010("zh-CN");
  assert.equal(form.kind, "form");
  assert.equal(form.title, "新建往来对象");
  assert.equal(
    form.fields.find(field => field.key === "subjectType").control,
    "select"
  );
});


test("Counterparty edit preserves stable identity and updates the same Enterprise Resource", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  repository.save({
    contextId: "enterprise-context:a",
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "ABC有限公司",
      subjectType: "ORGANIZATION",
      status: "ACTIVE",
      countryOrRegion: "中国"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T00:00:00.000Z"
  });

  const editPage = createCounterpartyEditPageV010({
    counterparty: repository.get("enterprise-context:a", "cp-1"),
    locale: "zh-CN"
  });
  assert.equal(editPage.kind, "form");
  assert.equal(editPage.title, "编辑往来对象");
  assert.equal(
    editPage.fields.find(field => field.key === "counterpartyId").initialValue,
    "cp-1"
  );
  assert.equal(
    editPage.fields.find(field => field.key === "displayName").initialValue,
    "ABC有限公司"
  );

  const handlers = createCounterpartyActionHandlersV010({
    repository,
    roleRepository,
    canManageEnterpriseContext: () => true,
    idFactory: () => "unused",
    now: () => new Date("2026-10-07T00:05:00.000Z")
  });
  const update = handlers.find(
    item => item.commandCode === COUNTERPARTY_UPDATE_COMMAND
  );
  const result = await update.execute(
    action(COUNTERPARTY_UPDATE_COMMAND, {
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "ABC国际有限公司",
      subjectType: "ORGANIZATION",
      legalName: "ABC国际有限公司",
      taxIdentifier: "",
      countryOrRegion: "中国",
      phone: "",
      email: "",
      notes: "名称更新"
    }),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(repository.list("enterprise-context:a").length, 1);
  const saved = repository.get("enterprise-context:a", "cp-1");
  assert.equal(saved.counterpartyId, "cp-1");
  assert.equal(saved.displayName, "ABC国际有限公司");
  assert.equal(saved.notes, "名称更新");

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparties",
    resourceType: "counterparty.subject"
  });
  assert.equal(raw.length, 1);
  assert.equal(raw[0].resourceId, "cp-1");
});


test("Counterparty supports simultaneous Customer and Supplier roles without duplicating identity", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    repository
  );
  repository.save({
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
    recordedAt: "2026-10-07T01:00:00.000Z"
  });

  const handlers = createCounterpartyActionHandlersV010({
    repository,
    roleRepository,
    canManageEnterpriseContext: () => true,
    idFactory: () => "unused",
    now: () => new Date("2026-10-07T01:05:00.000Z")
  });
  const assign = handlers.find(
    item => item.commandCode === COUNTERPARTY_ASSIGN_ROLE_COMMAND
  );
  const remove = handlers.find(
    item => item.commandCode === COUNTERPARTY_REMOVE_ROLE_COMMAND
  );

  assert.equal((await assign.execute(
    action(COUNTERPARTY_ASSIGN_ROLE_COMMAND, {
      counterpartyId: "cp-1",
      roleCode: "CUSTOMER"
    }),
    context()
  )).ok, true);
  assert.equal((await assign.execute(
    action(COUNTERPARTY_ASSIGN_ROLE_COMMAND, {
      counterpartyId: "cp-1",
      roleCode: "SUPPLIER"
    }),
    context()
  )).ok, true);

  assert.deepEqual(
    roleRepository.list("enterprise-context:a", "cp-1")
      .map(role => role.roleCode),
    ["CUSTOMER", "SUPPLIER"]
  );
  assert.equal(repository.list("enterprise-context:a").length, 1);
  assert.equal(repository.get("enterprise-context:a", "cp-1").counterpartyId, "cp-1");
  assert.equal(roleRepository.list("enterprise-context:b").length, 0);

  const roleResources = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparty-roles",
    resourceType: "counterparty.relationship-role",
    lifecycleState: "ACTIVE"
  });
  assert.equal(roleResources.length, 2);
  assert.equal(
    roleResources.every(item =>
      item.ownerPackageId === "evo-counterparty"
      && item.schemaRef === "evo.counterparty.relationship-role/0.1.0"
    ),
    true
  );

  assert.equal((await remove.execute(
    action(COUNTERPARTY_REMOVE_ROLE_COMMAND, {
      counterpartyId: "cp-1",
      roleCode: "CUSTOMER"
    }),
    context()
  )).ok, true);

  assert.deepEqual(
    roleRepository.list("enterprise-context:a", "cp-1")
      .map(role => role.roleCode),
    ["SUPPLIER"]
  );
  assert.equal(repository.get("enterprise-context:a", "cp-1").status, "ACTIVE");
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.counterparty",
      collectionId: "counterparty-roles",
      resourceType: "counterparty.relationship-role",
      lifecycleState: "ARCHIVED"
    }).length,
    1
  );
});

test("Counterparty detail exposes relationship roles independently from master identity", () => {
  const counterparty = {
    contractVersion: "0.1.0",
    counterpartyId: "cp-1",
    code: "C001",
    displayName: "ABC有限公司",
    subjectType: "ORGANIZATION",
    status: "ACTIVE"
  };
  const roles = [{
    contractVersion: "0.1.0",
    roleId: "cp-1.customer",
    counterpartyId: "cp-1",
    roleCode: "CUSTOMER"
  }, {
    contractVersion: "0.1.0",
    roleId: "cp-1.supplier",
    counterpartyId: "cp-1",
    roleCode: "SUPPLIER"
  }];

  const page = createCounterpartyDetailPageV010({
    counterparty,
    roles,
    locale: "zh-CN"
  });
  const item = page.items[0];

  assert.deepEqual(item.badges, ["客户", "供应商"]);
  assert.equal(item.metadata["关系角色"], "客户 · 供应商");
  assert.equal(
    item.secondaryActions.find(
      action => action.id === "toggle-customer-role"
    ).command,
    COUNTERPARTY_REMOVE_ROLE_COMMAND
  );
  assert.equal(
    item.secondaryActions.find(
      action => action.id === "toggle-supplier-role"
    ).command,
    COUNTERPARTY_REMOVE_ROLE_COMMAND
  );

  const noRolePage = createCounterpartyDetailPageV010({
    counterparty,
    roles: [],
    locale: "zh-CN"
  });
  assert.equal(noRolePage.items[0].metadata["关系角色"], "未设置");
  assert.equal(
    noRolePage.items[0].secondaryActions.find(
      action => action.id === "toggle-customer-role"
    ).command,
    COUNTERPARTY_ASSIGN_ROLE_COMMAND
  );
});
