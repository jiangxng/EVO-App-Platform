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
      itemId: "template:o2c"
    },
    sourceInteractionId: "evo-template-store",
    actionId: "copy",
    requiresConfirmation: true,
    ...overrides
  };
}

function context(actorType = "HUMAN", activeEnterprise) {
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
      activeContext: activeEnterprise ?? {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:target"
      }
    },
    correlationId: "correlation:1"
  };
}

function setup({ allowed = true, enterpriseContexts, defaultContextId, canManage = true } = {}) {
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
    resolveDefaultEnterpriseContext: () => {
      if (!defaultContextId) return undefined;
      return availableContexts.find(
        item => item.kind === "ENTERPRISE" && item.contextId === defaultContextId
      );
    },
    canManageEnterpriseContext: () => canManage,
    resolveAuthorizationProvider: () => ({
      providerId: "test.authorization",
      check() {
        return {
          contractVersion: "0.1.0",
          allowed,
          policyProviderId: "test.authorization",
          reasonCodes: [allowed ? "TEST_ALLOW" : "TEST_DENY"]
        };
      }
    }),
    now: () => new Date("2026-10-04T03:00:00.000Z"),
    id: () => "copy-1"
  });

  return { definitions, handler };
}

test("catalog-style Template Store Copy auto-resolves the single Enterprise Context", async () => {
  const { definitions, handler } = setup();
  const result = await handler.execute(request(), context());

  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target");
  assert.equal(result.result.targetEnterpriseId, "enterprise:target");
  assert.equal(result.result.targetDefinitionId, "template-copy:copy-1");
  assert.match(result.result.message, /Order to Cash/);

  const copied = definitions.getLatest({
    enterpriseId: "enterprise:target",
    definitionId: "template-copy:copy-1"
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
        itemId: "template:o2c",
        targetContextId: "context:target-b"
      }
    }),
    context()
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target-b");
  assert.ok(definitions.getLatest({
    enterpriseId: "enterprise:target-b",
    definitionId: "template-copy:copy-1"
  }));
});

test("Template Store Copy prefers the Host-selected Enterprise Context", async () => {
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
    request(),
    context("HUMAN", {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "context:target-b",
      enterpriseId: "enterprise:target-b"
    })
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target-b");
  assert.ok(definitions.getLatest({
    enterpriseId: "enterprise:target-b",
    definitionId: "template-copy:copy-1"
  }));
});

test("Template Store Copy uses the Principal default Enterprise Context when multiple are available", async () => {
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
    ],
    defaultContextId: "context:target-a"
  });
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, true);
  assert.equal(result.result.targetContextId, "context:target-a");
  assert.ok(definitions.getLatest({
    enterpriseId: "enterprise:target-a",
    definitionId: "template-copy:copy-1"
  }));
});

test("Template Store Copy refuses ambiguous multi-context writes when no default or explicit target exists", async () => {
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

test("Template Store Copy rejects missing confirmation", async () => {
  const { handler } = setup();
  const result = await handler.execute(
    request({ requiresConfirmation: false }),
    context()
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
});

test("Template Store Copy rejects non-Human callers in the Human Action path", async () => {
  const { handler } = setup();
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

test("Template Store Copy requires enterprise management role", async () => {
  const { handler } = setup({ canManage: false });
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEMPLATE_STORE_TARGET_CONTEXT_MANAGE_REQUIRED");
});
