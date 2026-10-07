import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createObjectExtensionRepositoryV010
} from "../../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionActionHandlersV010
} from "../../dist/apps/object-extension/actions.js";
import {
  OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010
} from "../../dist/apps/object-extension/constants.js";

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
    correlationId: "object-extension-test"
  };
}

function action(commandCode, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "object-extension-test",
    actionId: commandCode,
    requiresConfirmation: false
  };
}

function definition(extensionId = "enterprise-a.customer.channel-deposit-grade") {
  return {
    contractVersion: "0.1.0",
    extensionId,
    targetObjectType: "counterparty.subject",
    targetSlot: "counterparty.customer-profile",
    namespace: "enterprise.a.counterparty",
    fieldId: "channelDepositGrade",
    semanticType: "customer-channel-deposit-grade",
    valueType: "ENUM",
    label: {
      default: "Channel deposit grade",
      translations: {
        "zh-CN": "渠道保证金等级"
      }
    },
    required: false,
    order: 10,
    applicability: {
      relationshipRoles: ["CUSTOMER"]
    },
    enumOptions: [{
      value: "A",
      label: { default: "A" }
    }, {
      value: "B",
      label: { default: "B" }
    }],
    surfaces: ["DETAIL", "EDIT"],
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: false
  };
}

test("Object Extension public actions are enterprise-scoped and governed", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createObjectExtensionRepositoryV010(resources);
  const handlers = createObjectExtensionActionHandlersV010({
    repository,
    canManageEnterpriseContext: (_principal, contextId) =>
      contextId === "enterprise-context:a",
    now: () => new Date("2026-10-07T04:30:00.000Z")
  });

  const upsert = handlers.find(
    item => item.commandCode === OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010
  );
  const list = handlers.find(
    item => item.commandCode === OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010
  );
  const archive = handlers.find(
    item => item.commandCode === OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010
  );

  const saved = await upsert.execute(
    action(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010, {
      definition: definition()
    }),
    context()
  );
  assert.equal(saved.ok, true);
  assert.equal(saved.result.definition.fieldId, "channelDepositGrade");

  const listed = await list.execute(
    action(OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010, {
      targetObjectType: "counterparty.subject"
    }),
    context()
  );
  assert.equal(listed.ok, true);
  assert.equal(listed.result.definitions.length, 1);
  assert.equal(
    listed.result.definitions[0].targetSlot,
    "counterparty.customer-profile"
  );

  assert.equal(
    repository.list("enterprise-context:b").length,
    0
  );

  const denied = await list.execute(
    action(OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010),
    context("enterprise-context:b", "ent-b")
  );
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED");

  const archived = await archive.execute(
    action(OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010, {
      extensionId: definition().extensionId
    }),
    context()
  );
  assert.equal(archived.ok, true);
  assert.equal(archived.result.archived, true);
  assert.equal(repository.list("enterprise-context:a").length, 0);
});

test("Object Extension upsert is stable by extensionId and preserves one Enterprise Resource address", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createObjectExtensionRepositoryV010(resources);
  const handlers = createObjectExtensionActionHandlersV010({
    repository,
    canManageEnterpriseContext: () => true,
    now: () => new Date("2026-10-07T04:31:00.000Z")
  });
  const upsert = handlers.find(
    item => item.commandCode === OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010
  );

  const first = definition();
  assert.equal((await upsert.execute(
    action(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010, {
      definition: first
    }),
    context()
  )).ok, true);

  const changed = {
    ...first,
    label: {
      ...first.label,
      translations: {
        "zh-CN": "渠道保证金分级"
      }
    }
  };
  assert.equal((await upsert.execute(
    action(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010, {
      definition: changed
    }),
    context()
  )).ok, true);

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: "evo.object-extension",
    collectionId: "definitions",
    resourceType: "object-extension.definition",
    lifecycleState: "ACTIVE"
  });
  assert.equal(raw.length, 1);
  assert.equal(raw[0].resourceId, first.extensionId);
  assert.equal(
    repository.get("enterprise-context:a", first.extensionId)
      .label.translations["zh-CN"],
    "渠道保证金分级"
  );
});

test("Object Extension public actions reject missing Enterprise Context", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createObjectExtensionRepositoryV010(resources);
  const handlers = createObjectExtensionActionHandlersV010({
    repository,
    canManageEnterpriseContext: () => true
  });
  const list = handlers.find(
    item => item.commandCode === OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010
  );

  const noEnterprise = context();
  noEnterprise.context.activeContext = noEnterprise.context.personalContext;
  const result = await list.execute(
    action(OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010),
    noEnterprise
  );
  assert.equal(result.ok, false);
  assert.equal(
    result.error.code,
    "OBJECT_EXTENSION_ENTERPRISE_CONTEXT_REQUIRED"
  );
});
