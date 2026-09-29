import test from "node:test";
import assert from "node:assert/strict";

import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";
import {
  createMobileReviewActionRequestV010,
  resolveMobileReviewActionV010
} from "../../dist/manager/mobile-review-queue-action.js";

function experienceManifest() {
  const contribution = enterpriseAgentPackage.features[0].contributions.find(
    item => item.kind === "eidos.experience"
  );
  assert.ok(contribution);
  return contribution.manifest;
}

function reviewQueue() {
  return {
    contractVersion: "0.1.0",
    kind: "review-queue",
    id: "personal-agent.memory-review",
    title: "Memory review",
    items: [{
      id: "proposal:1",
      title: "Candidate",
      state: "attention",
      statusLabel: "Needs attention",
      fields: [
        {
          key: "kind",
          label: "Kind",
          control: "select",
          value: "FACT",
          options: [{ label: "Fact", value: "FACT" }]
        },
        {
          key: "summary",
          label: "Summary",
          control: "textarea",
          value: "Candidate"
        },
        {
          key: "readonly",
          label: "Readonly",
          control: "text",
          value: "cannot-change",
          readOnly: true
        }
      ],
      primaryAction: {
        id: "accept",
        label: "Accept",
        type: "command",
        command: "context.memory.proposal.accept",
        inputVersion: "0.1.0",
        requiresConfirmation: true
      },
      secondaryActions: [
        {
          id: "save",
          label: "Save edit",
          type: "command",
          command: "context.memory.proposal.edit",
          inputVersion: "0.1.0"
        },
        {
          id: "reject",
          label: "Reject",
          type: "command",
          command: "context.memory.proposal.reject",
          inputVersion: "0.1.0",
          requiresConfirmation: true
        }
      ]
    }]
  };
}

test("Memory Review has one semantic route across desktop and MOBILE_TASK", () => {
  const manifest = experienceManifest();
  const routes = manifest.routes.filter(
    route => route.semanticId === "enterprise-agent.memory-review"
  );

  assert.deepEqual(
    routes.map(route => ({
      path: route.path,
      surfaceId: route.surfaceId,
      pageId: route.pageId
    })),
    [
      {
        path: "/enterprise-agent/memory",
        surfaceId: "enterprise-agent.desktop",
        pageId: "enterprise-agent.memory-review"
      },
      {
        path: "/m/enterprise-agent/memory",
        surfaceId: "enterprise-agent.mobile-task",
        pageId: "enterprise-agent.memory-review"
      }
    ]
  );
});

test("mobile Review Queue builds accept request from authoritative definition", () => {
  const definition = reviewQueue();
  const request = createMobileReviewActionRequestV010({
    definition,
    itemId: "proposal:1",
    actionId: "accept",
    fieldValues: {
      kind: "PRACTICE",
      summary: "Human-reviewed wording",
      readonly: "tampered",
      injected: "ignore-me"
    }
  });

  assert.deepEqual(request, {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "context.memory.proposal.accept",
      inputVersion: "0.1.0"
    },
    values: {
      itemId: "proposal:1",
      confirmed: true,
      kind: "PRACTICE",
      summary: "Human-reviewed wording"
    },
    sourceInteractionId: "personal-agent.memory-review",
    actionId: "accept",
    requiresConfirmation: true
  });
});

test("mobile Review Queue preserves non-material edit without confirmation", () => {
  const request = createMobileReviewActionRequestV010({
    definition: reviewQueue(),
    itemId: "proposal:1",
    actionId: "save",
    fieldValues: {
      kind: "CLAIM",
      summary: "Edited"
    }
  });

  assert.equal(request.command.code, "context.memory.proposal.edit");
  assert.equal(request.requiresConfirmation, false);
  assert.equal(request.values.confirmed, false);
});

test("mobile Review Queue does not trust unknown DOM action ids", () => {
  assert.throws(
    () => resolveMobileReviewActionV010(
      reviewQueue(),
      "proposal:1",
      "delete-everything"
    ),
    /EVO_MOBILE_REVIEW_ACTION_NOT_FOUND/
  );
});

test("mobile Review Queue reject retains material confirmation boundary", () => {
  const request = createMobileReviewActionRequestV010({
    definition: reviewQueue(),
    itemId: "proposal:1",
    actionId: "reject"
  });
  assert.equal(request.command.code, "context.memory.proposal.reject");
  assert.equal(request.requiresConfirmation, true);
  assert.equal(request.values.confirmed, true);
});
