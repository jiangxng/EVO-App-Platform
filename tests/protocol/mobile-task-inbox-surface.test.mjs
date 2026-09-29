import test from "node:test";
import assert from "node:assert/strict";

import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";
import {
  createMobileTaskActionRequestV010,
  resolveMobileTaskActionV010
} from "../../dist/manager/mobile-task-inbox-action.js";
import {
  createPersonalAgentFollowUpTaskInboxV010
} from "../../dist/manager/personal-agent-follow-up-page.js";
import {
  createMemoryPersonalAgentFollowUpStoreV010
} from "../../dist/manager/personal-agent-follow-up-store.js";

function experienceManifest() {
  const contribution = enterpriseAgentPackage.features[0].contributions.find(
    item => item.kind === "eidos.experience"
  );
  assert.ok(contribution);
  return contribution.manifest;
}

const principal = {
  contractVersion: "0.1.0",
  actorType: "HUMAN",
  subjectId: "person-1",
  displayName: "Person One"
};

const context = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:person-1"
};

function store() {
  return createMemoryPersonalAgentFollowUpStoreV010({
    contractVersion: "0.1.0",
    events: [
      {
        contractVersion: "0.1.0",
        eventId: "event:ready",
        followUpId: "follow-up:ready",
        principalSubjectId: "person-1",
        context,
        state: "OPEN",
        kind: "REVIEW_PREFERRED_MEMORY",
        sourceType: "MEMORY_CONTRADICTION",
        sourceId: "contradiction:1",
        title: "Review preferred memory",
        instruction: "Review which memory should be preferred.",
        relatedMemoryIds: ["memory:1", "memory:2"],
        occurredAt: "2026-09-29T12:00:00.000Z",
        actorSubjectId: "person-1"
      },
      {
        contractVersion: "0.1.0",
        eventId: "event:blocked",
        followUpId: "follow-up:blocked",
        principalSubjectId: "person-1",
        context,
        state: "OPEN",
        kind: "CLARIFY_MEMORY_CONTEXT",
        sourceType: "MEMORY_CONTRADICTION",
        sourceId: "contradiction:2",
        title: "Clarify context",
        instruction: "Clarify where this memory applies.",
        relatedMemoryIds: ["memory:3"],
        occurredAt: "2026-09-29T12:01:00.000Z",
        actorSubjectId: "person-1"
      },
      {
        contractVersion: "0.1.0",
        eventId: "event:done",
        followUpId: "follow-up:done",
        principalSubjectId: "person-1",
        context,
        state: "COMPLETED",
        kind: "REVIEW_MEMORY_RESOLUTION",
        sourceType: "MEMORY_CONTRADICTION",
        sourceId: "contradiction:3",
        title: "Resolved item",
        instruction: "Already resolved.",
        relatedMemoryIds: ["memory:4"],
        occurredAt: "2026-09-29T12:02:00.000Z",
        actorSubjectId: "person-1"
      }
    ]
  });
}

test("Follow-ups share one semantic route across desktop and MOBILE_TASK", () => {
  const manifest = experienceManifest();
  const routes = manifest.routes.filter(
    route => route.semanticId === "enterprise-agent.follow-ups"
  );

  assert.deepEqual(
    routes.map(route => ({
      path: route.path,
      surfaceId: route.surfaceId,
      pageId: route.pageId
    })),
    [
      {
        path: "/enterprise-agent/follow-ups",
        surfaceId: "enterprise-agent.desktop",
        pageId: "enterprise-agent.follow-ups"
      },
      {
        path: "/m/enterprise-agent/follow-ups",
        surfaceId: "enterprise-agent.mobile-task",
        pageId: "enterprise-agent.mobile-follow-ups"
      }
    ]
  );
});

test("mobile Follow-up Task Inbox is scoped, open-only and presentation-only", () => {
  const inbox = createPersonalAgentFollowUpTaskInboxV010({
    principal,
    context,
    store: store()
  });

  assert.equal(inbox.kind, "task-inbox");
  assert.equal(inbox.items.length, 2);
  assert.deepEqual(
    inbox.items.map(item => [item.id, item.state, item.assignee?.actorId]),
    [
      ["follow-up:blocked", "BLOCKED", "person-1"],
      ["follow-up:ready", "READY", "person-1"]
    ]
  );
  assert.equal(
    inbox.items.some(item => item.id === "follow-up:done"),
    false
  );
  assert.match(inbox.description, /planning tasks, not business facts/);
});

test("Task Inbox commands keep Host authority and item identity", () => {
  const inbox = createPersonalAgentFollowUpTaskInboxV010({
    principal,
    context,
    store: store()
  });
  const request = createMobileTaskActionRequestV010({
    definition: inbox,
    itemId: "follow-up:ready",
    actionId: "complete-follow-up"
  });

  assert.deepEqual(request, {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.follow-up.complete",
      inputVersion: "0.1.0"
    },
    values: {
      itemId: "follow-up:ready",
      confirmed: false
    },
    sourceInteractionId: "personal-agent.follow-ups.mobile",
    actionId: "complete-follow-up",
    requiresConfirmation: false
  });
});

test("Task Inbox navigation is never converted into a command", () => {
  const inbox = createPersonalAgentFollowUpTaskInboxV010({
    principal,
    context,
    store: store()
  });
  const selection = resolveMobileTaskActionV010(
    inbox,
    "follow-up:ready",
    "open-personal-agent"
  );

  assert.equal(selection.action.type, "navigate");
  assert.equal(selection.action.route, "/m/enterprise-agent");
  assert.throws(
    () => createMobileTaskActionRequestV010({
      definition: inbox,
      itemId: "follow-up:ready",
      actionId: "open-personal-agent"
    }),
    /EVO_MOBILE_TASK_ACTION_NOT_COMMAND/
  );
});

test("Task Inbox rejects unknown DOM action identity", () => {
  const inbox = createPersonalAgentFollowUpTaskInboxV010({
    principal,
    context,
    store: store()
  });
  assert.throws(
    () => resolveMobileTaskActionV010(
      inbox,
      "follow-up:ready",
      "complete-everything"
    ),
    /EVO_MOBILE_TASK_ACTION_NOT_FOUND/
  );
});
