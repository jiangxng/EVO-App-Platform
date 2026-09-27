import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createAgentActionReceiptServiceV010,
  createJsonlAgentActionReceiptEventStoreV010,
  createMemoryAgentActionReceiptEventStoreV010
} from "../../dist/manager/agent-action-receipt-store.js";
import {
  createEnterpriseAgentHostToolCatalogV010
} from "../../dist/agents/enterprise-agent/host-tool-catalog.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "receipt-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const personalContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:receipt-user",
    ownerSubjectId: "receipt-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:receipt-user"
  }
};

function service(store) {
  let id = 0;
  return createAgentActionReceiptServiceV010({
    store,
    eventId: () => String(++id)
  });
}

function catalog(input = {}) {
  let executions = 0;
  const receiptService = input.receiptService
    ?? service(createMemoryAgentActionReceiptEventStoreV010());
  const value = createEnterpriseAgentHostToolCatalogV010(
    {
      manager: {},
      principal,
      context: personalContext,
      listAvailableContexts() { return [personalContext.activeContext]; },
      listProviderBindings() { return []; },
      getProviderHealth() { return { state: "UNKNOWN" }; },
      actionReceipt: {
        sourceInteractionId: input.sourceInteractionId ?? "interaction-1",
        sourceActionId: input.sourceActionId ?? "action-1",
        service: receiptService,
        now: input.now ?? (() => new Date("2026-09-27T16:00:00.000Z"))
      },
      searchHelp() { return []; },
      authorizeWrite: input.authorizeWrite ?? (() => ({ allowed: true }))
    },
    [{
      descriptor: {
        contractVersion: "0.1.0",
        id: "test.write",
        modelName: "test_write",
        title: "Test write",
        description: "Test material write.",
        inputSchema: {
          type: "object",
          properties: { value: { type: "string" } },
          required: ["value"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "test-package",
        capability: "test.write"
      },
      execute(args) {
        executions += 1;
        if (input.failExecution) throw new Error("TEST_WRITE_FAILED: failed");
        return {
          objectId: "object:" + args.value,
          nested: { proposalId: "proposal:" + args.value }
        };
      }
    }]
  );
  return { catalog: value, receiptService, executions: () => executions };
}

test("successful Agent WRITE emits durable receipt and identical retry does not execute twice", async () => {
  const h = catalog();
  const call = { tool: "test.write", arguments: { value: "A" } };

  const first = await h.catalog.invoke(call, []);
  assert.equal(first.ok, true);
  assert.equal(h.executions(), 1);
  assert.equal(first.receipt.status, "SUCCEEDED");
  assert.equal(first.receipt.toolId, "test.write");
  assert.deepEqual(
    new Set(first.receipt.resultEntityRefs),
    new Set(["object:A", "proposal:A"])
  );

  const second = await h.catalog.invoke(call, []);
  assert.equal(second.ok, true);
  assert.equal(h.executions(), 1);
  assert.equal(second.result.replayedFromReceipt, true);
  assert.equal(second.receipt.receiptId, first.receipt.receiptId);

  const receipts = h.receiptService.list({
    principalSubjectId: principal.subjectId,
    context: personalContext.activeContext
  });
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].status, "SUCCEEDED");
});

test("denied and failed Agent WRITEs preserve terminal receipts", async () => {
  const denied = catalog({
    authorizeWrite: () => ({
      allowed: false,
      code: "TEST_DENIED",
      message: "denied"
    })
  });
  const deniedObservation = await denied.catalog.invoke(
    { tool: "test.write", arguments: { value: "D" } },
    []
  );
  assert.equal(deniedObservation.ok, false);
  assert.equal(denied.executions(), 0);
  assert.equal(deniedObservation.error.code, "TEST_DENIED");
  assert.equal(deniedObservation.receipt.status, "DENIED");

  const failed = catalog({ failExecution: true });
  const failedObservation = await failed.catalog.invoke(
    { tool: "test.write", arguments: { value: "F" } },
    []
  );
  assert.equal(failedObservation.ok, false);
  assert.equal(failed.executions(), 1);
  assert.equal(failedObservation.error.code, "TEST_WRITE_FAILED");
  assert.equal(failedObservation.receipt.status, "FAILED");
});

test("REQUESTED without terminal is indeterminate and is never repeated automatically", async () => {
  const receiptService = service(createMemoryAgentActionReceiptEventStoreV010());
  const h = catalog({ receiptService });
  const call = { tool: "test.write", arguments: { value: "I" } };

  const crypto = await import("node:crypto");
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
          .map(([key, item]) => [key, stable(item)])
      );
    }
    return value;
  };
  const sha = value => crypto.createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(stable(value)))
    .digest("hex");
  const inputDigest = sha(call.arguments);
  const idempotencyKey = sha({
    contractVersion: "0.1.0",
    sourceInteractionId: "interaction-1",
    sourceActionId: "action-1",
    principalSubjectId: principal.subjectId,
    context: personalContext.activeContext,
    toolId: "test.write",
    inputDigest
  });

  receiptService.begin({
    receiptId: "agent-action-receipt:" + idempotencyKey,
    invocationId: "agent-tool-invocation:" + idempotencyKey.slice(0, 32),
    idempotencyKey,
    sourceInteractionId: "interaction-1",
    sourceActionId: "action-1",
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: personalContext.activeContext,
    toolId: "test.write",
    ownerPackageId: "test-package",
    capability: "test.write",
    inputDigest,
    requestedAt: "2026-09-27T16:00:00.000Z"
  });

  const observation = await h.catalog.invoke(call, []);
  assert.equal(observation.ok, false);
  assert.equal(observation.error.code, "AGENT_ACTION_RECEIPT_INDETERMINATE");
  assert.equal(observation.receipt.status, "REQUESTED");
  assert.equal(h.executions(), 0);
});

test("receipt READ tools are scoped to current Principal and Context", async () => {
  const h = catalog();
  const write = await h.catalog.invoke(
    { tool: "test.write", arguments: { value: "R" } },
    []
  );
  const list = await h.catalog.invoke(
    { tool: "agent.action.receipt.list", arguments: {} },
    []
  );
  assert.equal(list.ok, true);
  assert.equal(list.result.length, 1);
  assert.equal(list.result[0].receiptId, write.receipt.receiptId);

  const get = await h.catalog.invoke(
    {
      tool: "agent.action.receipt.get",
      arguments: { receiptId: write.receipt.receiptId }
    },
    []
  );
  assert.equal(get.ok, true);
  assert.equal(get.result.status, "SUCCEEDED");
});

test("JSONL receipt events survive service reconstruction", () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-action-receipt-"));
  const path = join(directory, "receipts.jsonl");
  const firstStore = createJsonlAgentActionReceiptEventStoreV010(path);
  const first = service(firstStore);

  first.begin({
    receiptId: "receipt:1",
    invocationId: "invocation:1",
    idempotencyKey: "a".repeat(64),
    sourceInteractionId: "interaction-1",
    sourceActionId: "action-1",
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: personalContext.activeContext,
    toolId: "test.write",
    ownerPackageId: "test-package",
    inputDigest: "b".repeat(64),
    requestedAt: "2026-09-27T16:00:00.000Z"
  });
  first.complete({
    receiptId: "receipt:1",
    status: "SUCCEEDED",
    completedAt: "2026-09-27T16:00:01.000Z",
    resultDigest: "c".repeat(64),
    resultEntityRefs: ["object:1"],
    resultSummary: "completed"
  });

  const second = service(createJsonlAgentActionReceiptEventStoreV010(path));
  const restored = second.get("receipt:1");
  assert.equal(restored.status, "SUCCEEDED");
  assert.deepEqual(restored.resultEntityRefs, ["object:1"]);

  const lines = readFileSync(path, "utf8").trim().split(/\r?\n/u);
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).status, "REQUESTED");
  assert.equal(JSON.parse(lines[1]).status, "SUCCEEDED");
});
