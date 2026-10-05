import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEnterpriseTemplateTransferProviderV010
} from "../../dist/providers/enterprise-context/template-transfer.js";
import {
  createEnterpriseSoftwareActionHandlersV010
} from "../../dist/apps/enterprise-context-governance/software-actions.js";
import {
  ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
  ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
  ENTERPRISE_SOFTWARE_SHARE_COMMAND
} from "../../dist/apps/enterprise-context-governance/constants.js";
import {
  createEnterpriseSoftwarePageV010
} from "../../dist/apps/enterprise-context-governance/software-page.js";
import {
  createMemoryTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  createTemplateStorePublicationProviderV010
} from "../../dist/apps/template-store/publication-provider.js";

const gallery = {
  contractVersion: "0.1.0",
  primaryProjectionId: "projection:main",
  projections: [
    {
      projectionId: "projection:main",
      title: "Main",
      thumbnail: {
        src: "data:image/svg+xml,%3Csvg%2F%3E",
        alt: "Main"
      },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D",
        hiddenNodeIds: ["node:hidden"],
        placements: [{ nodeId: "node:a", x: 120, y: 80 }]
      }
    },
    {
      projectionId: "projection:finance",
      title: "Finance",
      thumbnail: {
        src: "data:image/svg+xml,%3Csvg%2F%3E",
        alt: "Finance"
      },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D",
        hiddenEdgeIds: ["edge:hidden"]
      }
    }
  ]
};

function request(command, values, requiresConfirmation = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: command, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "enterprise-software",
    actionId: command,
    requiresConfirmation
  };
}

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:owner",
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "enterprise:test"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:test",
        enterpriseId: "enterprise:test"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:test",
        enterpriseId: "enterprise:test"
      }
    },
    correlationId: "correlation:software"
  };
}

function setup() {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(repository);
  const store = createMemoryTemplateStoreRepositoryV010();
  const publication = createTemplateStorePublicationProviderV010(store);

  repository.createDraft({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime",
    kind: "LEDGER_RUNTIME_TEMPLATE",
    title: "Enterprise Runtime",
    payload: { runtime: "v1" },
    projectionGallery: gallery,
    actor: { actorType: "HUMAN", subjectId: "human:owner" },
    recordedAt: "2026-10-05T01:00:00.000Z"
  });

  const handlers = createEnterpriseSoftwareActionHandlersV010({
    repository,
    transfer,
    resolveAuthorizationProvider: () => ({
      providerId: "test.authorization",
      check() {
        return {
          contractVersion: "0.1.0",
          allowed: true,
          policyProviderId: "test.authorization",
          reasonCodes: ["TEST_ALLOW"]
        };
      }
    }),
    async resolvePublicationProvider() {
      return publication;
    },
    now: () => new Date("2026-10-05T02:00:00.000Z"),
    id: () => "share-1"
  });

  return {
    repository,
    store,
    handler(code) {
      return handlers.find(item => item.commandCode === code);
    }
  };
}

test("Create Version freezes the Working Draft and its Projection Gallery", async () => {
  const { repository, handler } = setup();
  const result = await handler(ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
      { itemId: "software:runtime", expectedRevision: 0 }
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.version, 1);
  const latest = repository.getLatest({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime"
  });
  assert.equal(latest.state, "PUBLISHED");
  assert.equal(latest.revision, 1);
  assert.deepEqual(latest.projectionGallery, gallery);
});

test("Share copies an exact immutable Version and all interactive projections", async () => {
  const { repository, store, handler } = setup();
  await handler(ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
      { itemId: "software:runtime", expectedRevision: 0 }
    ),
    context()
  );

  const result = await handler(ENTERPRISE_SOFTWARE_SHARE_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_SHARE_COMMAND,
      { itemId: "software:runtime", definitionRevision: 1 }
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.templateVersion, 1);
  const record = store.getLatest(result.result.templateId);
  assert.ok(record);
  assert.equal(record.bundle.source.definitionRevision, 1);
  assert.deepEqual(record.bundle.definition.projectionGallery, gallery);
  assert.equal(record.bundle.definition.projectionGallery.projections.length, 2);

  const history = repository.listHistory({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime"
  });
  assert.equal(history.length, 2);
});

test("Edit New Version starts a Working Draft without mutating the immutable Version", async () => {
  const { repository, handler } = setup();
  await handler(ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
      { itemId: "software:runtime", expectedRevision: 0 }
    ),
    context()
  );
  const before = repository.getEffective({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime"
  });

  const result = await handler(ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
      { itemId: "software:runtime", expectedRevision: 1 }
    ),
    context()
  );

  assert.equal(result.ok, true);
  const latest = repository.getLatest({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime"
  });
  const effective = repository.getEffective({
    enterpriseId: "enterprise:test",
    definitionId: "software:runtime"
  });
  assert.equal(latest.state, "DRAFT");
  assert.equal(latest.revision, 2);
  assert.deepEqual(latest.projectionGallery, gallery);
  assert.deepEqual(effective, before);
});

test("Enterprise Software page separates Working Draft from user-facing Version numbers", async () => {
  const { repository, handler } = setup();
  let page = createEnterpriseSoftwarePageV010({
    enterpriseId: "enterprise:test",
    repository,
    shareAvailable: true,
    locale: "zh-CN"
  });
  assert.equal(page.items[0].summary, "Working Draft");
  assert.equal(page.items[0].primaryAction.label, "创建版本");
  assert.equal(page.items[0].metadata["投影"], 2);

  await handler(ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND).execute(
    request(
      ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
      { itemId: "software:runtime", expectedRevision: 0 }
    ),
    context()
  );
  page = createEnterpriseSoftwarePageV010({
    enterpriseId: "enterprise:test",
    repository,
    shareAvailable: true,
    locale: "zh-CN"
  });
  assert.equal(page.items[0].summary, "版本 1");
  assert.equal(page.items[0].primaryAction.label, "编辑新版本");
  assert.equal(page.items[0].secondaryActions[0].label, "共享到模板商店");
});
