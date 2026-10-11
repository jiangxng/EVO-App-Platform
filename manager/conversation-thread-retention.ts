import type {
  ConversationRetentionCandidatePolicyV010,
  ConversationRetentionPolicySourceV010,
  ConversationRetentionPreviewResultV010
} from "../contracts/conversation-retention.js";
import type {
  ConversationThreadStoreV010
} from "../contracts/conversation-thread.js";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

function validatePolicy(
  policy: ConversationRetentionCandidatePolicyV010
): void {
  if (
    policy.contractVersion !== "0.1.0"
    || !Number.isInteger(policy.retainArchivedForDays)
    || policy.retainArchivedForDays < 1
    || policy.retainArchivedForDays > 36500
  ) {
    throw new Error("CONVERSATION_RETENTION_POLICY_INVALID");
  }
}

export async function previewConversationRetentionV010(input: {
  threadStore: ConversationThreadStoreV010;
  principalSubjectId: string;
  context: ActiveContextRefV010;
  candidatePolicy: ConversationRetentionCandidatePolicyV010;
  policySource?: ConversationRetentionPolicySourceV010;
  now?: Date;
}): Promise<ConversationRetentionPreviewResultV010> {
  validatePolicy(input.candidatePolicy);
  const now = input.now ?? new Date();
  const visible = await input.threadStore.list({
    principalSubjectId: input.principalSubjectId,
    context: input.context,
    includeArchived: true,
    limit: 100
  });

  const items = visible.map(thread => {
    if (thread.state === "ACTIVE") {
      return {
        contractVersion: "0.1.0" as const,
        threadId: thread.threadId,
        state: thread.state,
        updatedAt: thread.updatedAt,
        outcome: "ACTIVE_NOT_ELIGIBLE" as const,
        messageCount: thread.messages.length
      };
    }

    if (!thread.archivedAt) {
      throw new Error("CONVERSATION_THREAD_ARCHIVED_AT_REQUIRED");
    }
    const archivedAt = Date.parse(thread.archivedAt);
    if (!Number.isFinite(archivedAt)) {
      throw new Error("CONVERSATION_THREAD_ARCHIVED_AT_INVALID");
    }
    const deadline = new Date(
      archivedAt + input.candidatePolicy.retainArchivedForDays * 86_400_000
    ).toISOString();
    return {
      contractVersion: "0.1.0" as const,
      threadId: thread.threadId,
      state: thread.state,
      updatedAt: thread.updatedAt,
      archivedAt: thread.archivedAt,
      deadline,
      outcome: Date.parse(deadline) <= now.getTime()
        ? "ARCHIVED_WOULD_PURGE" as const
        : "ARCHIVED_WOULD_RETAIN" as const,
      messageCount: thread.messages.length
    };
  }).sort((a, b) => a.threadId.localeCompare(b.threadId));

  return {
    contractVersion: "0.1.0",
    context: structuredClone(input.context),
    simulatedAt: now.toISOString(),
    candidatePolicy: structuredClone(input.candidatePolicy),
    policySource: input.policySource ?? "PREVIEW_OVERRIDE",
    scope: "READER_VISIBLE_CURRENT_CONTEXT",
    destructiveActionExecuted: false,
    totals: {
      examined: items.length,
      activeNotEligible: items.filter(item => item.outcome === "ACTIVE_NOT_ELIGIBLE").length,
      archivedWouldRetain: items.filter(item => item.outcome === "ARCHIVED_WOULD_RETAIN").length,
      archivedWouldPurge: items.filter(item => item.outcome === "ARCHIVED_WOULD_PURGE").length
    },
    items
  };
}
