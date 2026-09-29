import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { TaskInboxV010 } from "../vendor/eidos/src/task-inbox/contracts.js";
import type {
  ActiveContextRefV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type {
  PersonalAgentFollowUpStoreV010
} from "./personal-agent-follow-up-store.js";

export function createPersonalAgentFollowUpPageV010(input: {
  principal: PlatformPrincipalV010;
  context: ActiveContextRefV010;
  store: PersonalAgentFollowUpStoreV010;
}): CatalogBrowserV010 {
  const items = input.store.listForPrincipal(
    input.principal.subjectId,
    input.context
  );

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "personal-agent.follow-ups",
    title: "Personal Agent Follow-ups",
    description: "Planning-only follow-ups derived from confirmed governance outcomes. They do not change Memory or grant Agent authority.",
    items: items.map(item => ({
      id: item.followUpId,
      title: item.title,
      category: item.kind,
      summary: [
        item.instruction,
        `source=${item.sourceType}:${item.sourceId}`,
        `related-memory=${item.relatedMemoryIds.join(",")}`
      ].join(" · "),
      status: {
        label: item.state,
        tone: item.state === "OPEN"
          ? "warning"
          : item.state === "COMPLETED"
            ? "positive"
            : "neutral"
      },
      ...(item.state === "OPEN"
        ? {
            primaryAction: {
              id: "open-personal-agent",
              label: "Open Personal Agent",
              type: "navigate" as const,
              route: "/enterprise-agent"
            },
            secondaryActions: [
              {
                id: "complete-follow-up",
                label: "Mark complete",
                type: "command" as const,
                command: "enterprise-agent.follow-up.complete",
                inputVersion: "0.1.0",
                requiresConfirmation: false
              },
              {
                id: "dismiss-follow-up",
                label: "Dismiss",
                type: "command" as const,
                command: "enterprise-agent.follow-up.dismiss",
                inputVersion: "0.1.0",
                requiresConfirmation: false
              }
            ]
          }
        : {}),
      metadata: {
        sourceId: item.sourceId,
        sourceType: item.sourceType,
        occurredAt: item.occurredAt,
        contextId: item.context.contextId
      }
    })),
    emptyMessage: "No Personal Agent follow-up is open or recorded for this Context."
  };
}


export function createPersonalAgentFollowUpTaskInboxV010(input: {
  principal: PlatformPrincipalV010;
  context: ActiveContextRefV010;
  store: PersonalAgentFollowUpStoreV010;
}): TaskInboxV010 {
  const items = input.store.listOpen(
    input.principal.subjectId,
    input.context
  );

  return {
    contractVersion: "0.1.0",
    kind: "task-inbox",
    id: "personal-agent.follow-ups.mobile",
    title: "My follow-ups",
    description: "Open Personal Agent follow-ups for this Context. These are planning tasks, not business facts or Memory authority.",
    emptyMessage: "No follow-up needs your attention.",
    items: items.map(item => {
      const state = item.kind === "REVIEW_MEMORY_RESOLUTION"
        ? "EXCEPTION" as const
        : item.kind === "CLARIFY_MEMORY_CONTEXT"
          ? "BLOCKED" as const
          : "READY" as const;
      const priority = state === "EXCEPTION"
        ? 100
        : state === "BLOCKED"
          ? 80
          : 60;
      return {
        id: item.followUpId,
        title: item.title,
        summary: item.instruction,
        state,
        statusLabel: state === "EXCEPTION"
          ? "Needs review"
          : state === "BLOCKED"
            ? "Needs context"
            : "Ready",
        priority,
        workType: item.kind,
        assignee: {
          actorType: "HUMAN",
          actorId: input.principal.subjectId
        },
        metrics: [{
          id: "related-memory",
          label: "Related Memory",
          value: String(item.relatedMemoryIds.length),
          tone: item.relatedMemoryIds.length > 1
            ? "warning" as const
            : "neutral" as const
        }],
        evidence: [{
          id: "source",
          title: "Source",
          source: item.sourceType,
          detail: item.sourceId
        }],
        primaryAction: {
          id: "open-personal-agent",
          label: "Open Personal Agent",
          type: "navigate" as const,
          route: "/m/enterprise-agent"
        },
        secondaryActions: [
          {
            id: "complete-follow-up",
            label: "Mark complete",
            type: "command" as const,
            command: "enterprise-agent.follow-up.complete",
            inputVersion: "0.1.0",
            requiresConfirmation: false
          },
          {
            id: "dismiss-follow-up",
            label: "Dismiss",
            type: "command" as const,
            command: "enterprise-agent.follow-up.dismiss",
            inputVersion: "0.1.0",
            requiresConfirmation: false
          }
        ],
        metadata: {
          sourceId: item.sourceId,
          sourceType: item.sourceType,
          occurredAt: item.occurredAt,
          contextId: item.context.contextId
        }
      };
    })
  };
}
