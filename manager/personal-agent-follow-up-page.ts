import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
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
