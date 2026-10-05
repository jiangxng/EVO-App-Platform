import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010
} from "../../dist/contracts/definition-projection.js";
import {
  ledgerRuntimeBaselineBundleV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  createLedgerManagerPageV010,
  ledgerManagerVersionLabelV010
} from "../../dist/apps/ledger-manager/page.js";
import {
  createLedgerManagerActionHandlersV010
} from "../../dist/apps/ledger-manager/actions.js";
import {
  LEDGER_MANAGER_PUBLISH_COMMAND
} from "../../dist/apps/ledger-manager/constants.js";

function seededRepository() {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const bundle = ledgerRuntimeBaselineBundleV010;
  repository.createDraft({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    kind: bundle.definition.kind,
    title: bundle.definition.title,
    payload: structuredClone(bundle.definition.payload),
    projectionGallery: structuredClone(bundle.definition.projectionGallery),
    actor: {
      actorType: "HUMAN",
      subjectId: "owner-a"
    },
    recordedAt: "2026-10-05T00:00:00.000Z",
    origin: {
      type: "TEMPLATE_COPY",
      sourceRef: "template-store:evo-ledger-runtime-baseline@3"
    }
  });
  return repository;
}

function request(command, values, requiresConfirmation = false) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: command, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "ledger-manager-test",
    actionId: command,
    requiresConfirmation
  };
}

function context() {
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
      enterpriseId: "ent-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner-a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent-a",
        enterpriseId: "ent-a"
      }
    },
    correlationId: "ledger-manager-test"
  };
}

test("Ledger Manager presents copied revision zero as default", () => {
  const repository = seededRepository();
  const page = createLedgerManagerPageV010({
    enterpriseId: "ent-a",
    repository,
    viewer2dAvailable: true,
    canPublish: true,
    locale: "en"
  });

  assert.equal(ledgerManagerVersionLabelV010(0), "default");
  assert.equal(ledgerManagerVersionLabelV010(2), "v2");
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].version, "default");
  assert.equal(page.items[0].primaryAction.command, "ledger.manager.open-detail");
  assert.ok(
    page.items[0].secondaryActions.some(
      item => item.command === LEDGER_MANAGER_PUBLISH_COMMAND
    )
  );
});

test("Ledger Manager publishes the selected Enterprise Context revision without mutating it", async () => {
  const repository = seededRepository();
  let publication;
  const handlers = createLedgerManagerActionHandlersV010({
    repository,
    projectionSessions: createMemoryDefinitionProjectionSessionStoreV010(),
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
    canManageEnterpriseContext: () => true,
    viewerAvailable: () => true,
    async publishToLedgerRuntime(input) {
      publication = input;
      return {
        ok: true,
        enterpriseCode: input.enterpriseId,
        semanticDigest: input.compiled.semanticDigest
      };
    },
    resolveEnterpriseDisplayName: () => "Enterprise A"
  });
  const handler = handlers.find(
    item => item.commandCode === LEDGER_MANAGER_PUBLISH_COMMAND
  );
  assert.ok(handler);

  const before = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  const result = await handler.execute(
    request(
      LEDGER_MANAGER_PUBLISH_COMMAND,
      {
        definitionId: "ledger:main",
        definitionRevision: 0
      },
      true
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.version, "default");
  assert.equal(publication.enterpriseId, "ent-a");
  assert.equal(publication.enterpriseDisplayName, "Enterprise A");
  assert.equal(publication.compiled.kind, "evo.ledger-runtime.compiled-configuration");

  const after = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.deepEqual(after, before);
});

test("Ledger Manager publish requires OWNER or ADMIN management role", async () => {
  const repository = seededRepository();
  const handlers = createLedgerManagerActionHandlersV010({
    repository,
    projectionSessions: createMemoryDefinitionProjectionSessionStoreV010(),
    resolveAuthorizationProvider: () => ({
      providerId: "test.authorization",
      check() {
        throw new Error("authorization must not be reached");
      }
    }),
    canManageEnterpriseContext: () => false,
    viewerAvailable: () => true,
    async publishToLedgerRuntime() {
      throw new Error("runtime must not be reached");
    }
  });
  const handler = handlers.find(
    item => item.commandCode === LEDGER_MANAGER_PUBLISH_COMMAND
  );

  const result = await handler.execute(
    request(
      LEDGER_MANAGER_PUBLISH_COMMAND,
      {
        definitionId: "ledger:main",
        definitionRevision: 0
      },
      true
    ),
    context()
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "LEDGER_MANAGER_MANAGE_ROLE_REQUIRED");
});
