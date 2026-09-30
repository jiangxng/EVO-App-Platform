import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  ledgerRuntimeConfiguratorPackage
} from "../../dist/catalog/seed.js";
import {
  createLedgerRuntimeConfiguratorCapabilityActionHandlers,
  LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND,
  LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_COMMAND
} from "../../dist/apps/ledger-runtime-configurator/capability-action-handlers.js";
import {
  describeLedgerRuntimeConfigurationV010,
  readLedgerRuntimeConfigurationSectionV010
} from "../../dist/apps/ledger-runtime-configurator/capability-operations.js";
import {
  createLedgerRuntimeConfiguratorService
} from "../../dist/apps/ledger-runtime-configurator/service.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function actionRequest(commandCode, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "test-interaction",
    actionId: "test-action",
    requiresConfirmation: false
  };
}

test("Ledger configuration describe is bounded and exposes template structure without dumping all rules", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const description = describeLedgerRuntimeConfigurationV010(service);

  assert.equal(
    description.kind,
    "evo.ledger-runtime.configuration-description"
  );
  assert.equal(description.template.expressionLanguage, "bookkeeping-aviator-v1");
  assert.equal(description.counts.accounts, 141);
  assert.equal(description.counts.applications, 143);
  assert.equal(description.counts.dictionaries, 106);
  assert.equal(description.counts.postingRules, 912);
  assert.equal(description.compatibility.burnReady, true);
  assert.deepEqual(
    description.sections.map(item => [item.section, item.count]),
    [
      ["accounts", 141],
      ["applications", 143],
      ["dictionaries", 106],
      ["postingRules", 912]
    ]
  );
  assert.equal(
    JSON.stringify(description).includes('"postingRules":['),
    false
  );
});

test("Ledger configuration section read is paged and cursor continues the same semantic digest", () => {
  const service = createLedgerRuntimeConfiguratorService();

  const first = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "postingRules",
    pageSize: 25
  });
  assert.equal(first.offset, 0);
  assert.equal(first.pageSize, 25);
  assert.equal(first.total, 912);
  assert.equal(first.items.length, 25);
  assert.ok(first.nextCursor);

  const second = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "postingRules",
    pageSize: 25,
    cursor: first.nextCursor
  });
  assert.equal(second.offset, 25);
  assert.equal(second.items.length, 25);
  assert.equal(second.semanticDigest, first.semanticDigest);
  assert.notDeepEqual(second.items, first.items);
});

test("Ledger configuration cursor is section-bound and becomes stale after configuration changes", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const first = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "accounts",
    pageSize: 10
  });
  assert.ok(first.nextCursor);

  assert.throws(
    () => readLedgerRuntimeConfigurationSectionV010(service, {
      section: "applications",
      pageSize: 10,
      cursor: first.nextCursor
    }),
    /LEDGER_CONFIGURATION_CURSOR_SECTION_MISMATCH/
  );

  const changed = service.getCurrent();
  changed.displayName = changed.displayName + " — changed";
  const imported = service.importConfiguration(changed);
  assert.equal(imported.ok, true);

  assert.throws(
    () => readLedgerRuntimeConfigurationSectionV010(service, {
      section: "accounts",
      pageSize: 10,
      cursor: first.nextCursor
    }),
    /LEDGER_CONFIGURATION_CURSOR_STALE/
  );
});

test("Ledger configuration section read enforces bounded page size", () => {
  const service = createLedgerRuntimeConfiguratorService();
  assert.throws(
    () => readLedgerRuntimeConfigurationSectionV010(service, {
      section: "postingRules",
      pageSize: 101
    }),
    /LEDGER_CONFIGURATION_PAGE_SIZE_INVALID/
  );
  assert.throws(
    () => readLedgerRuntimeConfigurationSectionV010(service, {
      section: "postingRules",
      pageSize: 0
    }),
    /LEDGER_CONFIGURATION_PAGE_SIZE_INVALID/
  );
});

test("Ledger capability Action handlers return the same semantic read contracts", async () => {
  const service = createLedgerRuntimeConfiguratorService();
  const handlers =
    createLedgerRuntimeConfiguratorCapabilityActionHandlers(service);
  const byCommand = new Map(
    handlers.map(handler => [handler.commandCode, handler])
  );

  const describe = await byCommand
    .get(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND)
    .execute(actionRequest(LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND));
  assert.equal(describe.ok, true);
  assert.equal(
    describe.result.kind,
    "evo.ledger-runtime.configuration-description"
  );

  const section = await byCommand
    .get(LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_COMMAND)
    .execute(actionRequest(
      LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_COMMAND,
      {
        section: "accounts",
        pageSize: 5
      }
    ));
  assert.equal(section.ok, true);
  assert.equal(
    section.result.kind,
    "evo.ledger-runtime.configuration-section-page"
  );
  assert.equal(section.result.items.length, 5);
});

test("Ledger plugin publishes exactly the two EA-001 READ operations and bindings are real Host Actions", () => {
  const feature = ledgerRuntimeConfiguratorPackage.features.find(
    item => item.featureId === "evo-ledger-runtime-configurator.default"
  );
  assert.ok(feature);
  assert.ok(feature.providesCapabilities.includes("ledger.runtime.configuration"));

  const operations = feature.contributions
    .filter(item => item.kind === "platform.capability-operation")
    .map(item => item.operation)
    .sort((a, b) => a.operationId.localeCompare(b.operationId));

  assert.deepEqual(
    operations.map(item => item.operationId),
    [
      "ledger.runtime.configuration.describe",
      "ledger.runtime.configuration.section.read"
    ]
  );
  assert.ok(operations.every(item => item.effect === "READ"));
  assert.ok(operations.every(
    item => item.exposure.includes("EXTERNAL_AGENT")
  ));

  const commandCodes = new Set(
    createLedgerRuntimeConfiguratorCapabilityActionHandlers(
      createLedgerRuntimeConfiguratorService()
    ).map(handler => handler.commandCode)
  );
  for (const operation of operations) {
    assert.equal(operation.binding.type, "ACTION_HOST");
    assert.equal(commandCodes.has(operation.binding.commandCode), true);
  }
});

test("Ledger capability operations follow plugin lifecycle automatically", () => {
  const manager = createAppManagerService(
    createPackageCatalog([ledgerRuntimeConfiguratorPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-30T10:45:00.000Z")
  );

  assert.deepEqual(manager.listEffectiveCapabilityOperations(), []);
  manager.install("evo-ledger-runtime-configurator");

  assert.deepEqual(
    manager.listEffectiveCapabilityOperations("ledger.runtime.configuration")
      .map(item => item.operationId),
    [
      "ledger.runtime.configuration.describe",
      "ledger.runtime.configuration.section.read"
    ]
  );

  manager.disable("evo-ledger-runtime-configurator");
  assert.deepEqual(
    manager.listEffectiveCapabilityOperations("ledger.runtime.configuration"),
    []
  );
});
