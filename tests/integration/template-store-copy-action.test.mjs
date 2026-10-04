import test from "node:test";
import assert from "node:assert/strict";

import {
  createTemplateStoreCopyActionHandlerV010
} from "../../dist/apps/template-store/copy-action.js";
import {
  createMemoryTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEnterpriseTemplateTransferProviderV010
} from "../../dist/providers/enterprise-context/template-transfer.js";

const human = { actorType: "HUMAN", subjectId: "human:source-owner" };

function request(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.copy",
      inputVersion: "0.1.0"
    },
    values: {
      templateId: "template:o2c",
      templateVersion: 1,
      targetDefinitionId: "process:o2c-local"
    },
    sourceInteractionId: "interaction:1",
    actionId: "copy",
    requiresConfirmation: true,
    ...overrides
  };
}

function context(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:target-owner",
      actorType,
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:target"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:target"
      }
    },
    correlationId: "correlation:1"
  };
}

function setup({ allowed = true, enterpriseContexts } = {}) {
  const definitions = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(definitions);
  const store = createMemoryTemplateStoreRepositoryV010();

  definitions.createDraft({
    enterpriseId: "enterprise:source",
    definitionId: "process:o2c",
    kind: "PROCESS",
    title: "Order to cash",
    payload: { stage: "source-v0" },
    actor: human,
    recordedAt: "2026-10-04T01:00:00.000Z"
  });

  const bundle = transfer.prepareShare({
    enterpriseId: "enterprise:source",
    definitionId: "process:o2c",
    definitionRevision: 0,
    transferId: "share:o2c:1",
    listing: {
      name: "Order to Cash",
      description: "Reusable O2C baseline",
      thumbnail: {
        src: "data:image/svg+xml,%3Csvg%2F%3E",
        alt: "O2C preview"
      }
    },
    actor: human,
    sharedAt: "2026-10-04T02:00:00.000Z"
  });

  store.publish({
    templateId: "template:o2c",
    bundle,
    publishedAt: "2026-10-04T02:05:00.000Z"
  });

  const availableContexts = [
    {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:target"
    },
    ...(enterpriseContexts ?? [{
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "context:target",
      enterpriseId: "enterprise:target"
    }])
  ];

  const handler = createTemplateStoreCopyActionHandlerV010({
    store,
    transfer,
    listAvailableContexts: () => availableContexts,
    resolveAuthorizationProvider: () => ({
      providerId: "test.authorization",
      check(input) {
        return {
          contractVersion: "0.1.0",
          allowed,
          policyProviderId: "test.authorization",
          reasonCodes: [allowed ? "TEST_ALLOW" : "TEST_DENY"]
        };
      }
    }),
    now: () => new Date("2026-10-04T03:00:00.000Z")
  });

  return { definitions, handler };
}

test("Template Store Copy auto-resolves the single Enterprise Context in v0.1", async () => {
  const { definitions, handler } = setup();
  const result = await handler.execute(request(), context());

  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target");
  assert.equal(result.result.targetEnterpriseId, "enterprise:target");

  const copied = definitions.getLatest({
    enterpriseId: "enterprise:target",
    definitionId: "process:o2c-local"
  });
  assert.ok(copied);
  assert.equal(copied.state, "DRAFT");
  assert.equal(copied.revision, 0);
  assert.equal(copied.origin.type, "TEMPLATE_COPY");
  assert.equal(
    copied.origin.sourceRef,
    "template-store:template:o2c@1"
  );
  assert.equal(copied.payload.stage, "source-v0");

});

test("Template Store Copy preserves future multi-context targeting through targetContextId", async () => {
  const { definitions, handler } = setup({
    enterpriseContexts: [
      {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:target-a",
        enterpriseId: "enterprise:target-a"
      },
      {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:target-b",
        enterpriseId: "enterprise:target-b"
      }
    ]
  });
  const result = await handler.execute(
    request({
      values: {
        templateId: "template:o2c",
        templateVersion: 1,
        targetContextId: "context:target-b",
        targetDefinitionId: "process:o2c-local"
      }
    }),
    context()
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target-b");
  assert.ok(definitions.getLatest({
    enterpriseId: "enterprise:target-b",
    definitionId: "process:o2c-local"
  }));
});

test("Template Store Copy refuses ambiguous multi-context writes until a target is supplied", async () => {
  const { handler } = setup({
    enterpriseContexts: [
      {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:target-a",
        enterpriseId: "enterprise:target-a"
      },
      {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "context:target-b",
        enterpriseId: "enterprise:target-b"
      }
    ]
  });
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEMPLATE_STORE_TARGET_CONTEXT_REQUIRED");
});

test("Template Store Copy rejects a target Context unavailable to the principal", async () => {
  const { handler } = setup();
  const result = await handler.execute(
    request({
      values: {
        templateId: "template:o2c",
        templateVersion: 1,
        targetContextId: "context:not-available",
        targetDefinitionId: "process:o2c-local"
      }
    }),
    context()
  );
  assert.equal(result.ok, false);
  assert.equal(
    result.error.code,
    "TEMPLATE_STORE_TARGET_CONTEXT_NOT_AVAILABLE"
  );
});

test("Template Store Copy rejects missing confirmation", async () => {
  const { handler } = setup(true);
  const result = await handler.execute(
    request({ requiresConfirmation: false }),
    context()
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
});

test("Template Store Copy rejects non-Human callers in the Human Action path", async () => {
  const { handler } = setup(true);
  const result = await handler.execute(request(), context("AI"));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEMPLATE_STORE_COPY_HUMAN_REQUIRED");
});

test("Template Store Copy honors authorization denial", async () => {
  const { handler } = setup({ allowed: false });
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEST_DENY");
});
