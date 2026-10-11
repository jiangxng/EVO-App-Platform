import { createHash } from "node:crypto";

import type {
  ConversationCheckpointV010,
  ConversationCompressionInputV010,
  ConversationCompressionPolicyV010,
  ConversationCompressionProviderV010,
  ConversationContextArtifactStoreV010,
  ConversationContextAssemblerV010,
  ConversationContextAssemblyResultV010,
  ConversationSummaryArtifactV010
} from "../contracts/conversation-context.js";
import type {
  ConversationMessageV010
} from "../contracts/conversation-thread.js";

export const DEFAULT_CONVERSATION_COMPRESSION_POLICY_V010:
  ConversationCompressionPolicyV010 = {
    contractVersion: "0.1.0",
    policyId: "personal-agent-long-context",
    version: "0.1.0",
    directHistoryMaxMessages: 16,
    directHistoryMaxCharacters: 24_000,
    recentTailMessages: 8,
    summaryMaxCharacters: 8_000
  };

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function summaryId(input: ConversationCompressionInputV010): string {
  const digest = createHash("sha256")
    .update([
      input.threadId,
      input.policy.policyId,
      input.policy.version,
      String(input.artifactVersion),
      ...input.messages.map(message => message.messageId)
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
  return "conversation-summary:" + digest;
}

function excerpt(
  message: ConversationMessageV010,
  maxCharacters: number
): string {
  const role = message.role === "USER" ? "Human" : "Assistant";
  const normalized = message.content.replace(/\s+/gu, " ").trim();
  const clipped = normalized.length > maxCharacters
    ? normalized.slice(0, Math.max(1, maxCharacters - 1)) + "…"
    : normalized;
  return role + ": " + clipped;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function extractSignals(messages: readonly ConversationMessageV010[]) {
  const goals: string[] = [];
  const decisions: string[] = [];
  const unresolved: string[] = [];
  const toolOutcomes: string[] = [];

  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;
    const lines = content.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(goal|目标|目的|要做|下一步)[:：\s]/iu.test(line)) goals.push(line);
      if (/^(decision|决定|确认|结论)[:：\s]/iu.test(line)) decisions.push(line);
      if (/^(todo|unresolved|待定|未解决|问题)[:：\s]/iu.test(line) || /[?？]$/u.test(line)) {
        unresolved.push(line);
      }
      if (/^(tool|result|结果|执行结果|验证结果)[:：\s]/iu.test(line)) {
        toolOutcomes.push(line);
      }
    }
  }

  return {
    activeGoals: unique(goals).slice(-12),
    decisions: unique(decisions).slice(-12),
    unresolvedQuestions: unique(unresolved).slice(-12),
    relevantToolOutcomes: unique(toolOutcomes).slice(-12)
  };
}

export function createDeterministicConversationCompressionProviderV010():
  ConversationCompressionProviderV010 {
  return {
    async compress(input) {
      if (input.messages.length === 0) {
        throw new Error("CONVERSATION_COMPRESSION_SOURCE_REQUIRED");
      }
      const sourceCharacterCount = input.messages.reduce(
        (total, message) => total + message.content.length,
        0
      );
      const perMessage = Math.max(
        96,
        Math.floor(input.policy.summaryMaxCharacters / input.messages.length)
      );
      const sections = input.messages.map(message => excerpt(message, perMessage));
      let content = sections.join("\n");
      if (content.length > input.policy.summaryMaxCharacters) {
        content = content.slice(0, input.policy.summaryMaxCharacters - 1) + "…";
      }
      const signals = extractSignals(input.messages);
      return {
        contractVersion: "0.1.0",
        summaryId: summaryId(input),
        threadId: input.threadId,
        artifactVersion: input.artifactVersion,
        sourceMessageIds: input.messages.map(message => message.messageId),
        sourceFirstMessageId: input.messages[0].messageId,
        sourceLastMessageId: input.messages.at(-1)!.messageId,
        sourceMessageCount: input.messages.length,
        sourceCharacterCount,
        content,
        ...signals,
        provenance: {
          strategy: "DETERMINISTIC_EXTRACTIVE",
          policyId: input.policy.policyId,
          policyVersion: input.policy.version,
          generatedAt: input.generatedAt
        }
      };
    }
  };
}

export function createMemoryConversationContextArtifactStoreV010():
  ConversationContextArtifactStoreV010 {
  const summaries = new Map<string, ConversationSummaryArtifactV010[]>();
  const checkpoints = new Map<string, ConversationCheckpointV010[]>();
  return {
    async latestSummary(input) {
      const values = summaries.get(input.threadId) ?? [];
      return [...values].reverse().find(item =>
        item.provenance.policyId === input.policyId
        && item.provenance.policyVersion === input.policyVersion
      );
    },
    async saveSummary(summary) {
      const values = summaries.get(summary.threadId) ?? [];
      const existing = values.find(item => item.summaryId === summary.summaryId);
      if (existing) return structuredClone(existing);
      values.push(structuredClone(summary));
      summaries.set(summary.threadId, values);
      return structuredClone(summary);
    },
    async saveCheckpoint(checkpoint) {
      const values = checkpoints.get(checkpoint.threadId) ?? [];
      const existing = values.find(item => item.checkpointId === checkpoint.checkpointId);
      if (existing) return structuredClone(existing);
      values.push(structuredClone(checkpoint));
      checkpoints.set(checkpoint.threadId, values);
      return structuredClone(checkpoint);
    }
  };
}

function directMessages(
  messages: readonly ConversationMessageV010[],
  maxCharacters: number
) {
  const selected = [];
  let total = 0;
  for (const message of [...messages].reverse()) {
    if (message.role !== "USER" && message.role !== "ASSISTANT") continue;
    const role = message.role === "USER" ? "user" as const : "assistant" as const;
    const remaining = maxCharacters - total;
    if (remaining <= 0) break;
    const content = message.content.length > remaining
      ? message.content.slice(message.content.length - remaining)
      : message.content;
    if (!content) continue;
    selected.push({ role, content });
    total += content.length;
  }
  return selected.reverse();
}

function totalCharacters(messages: readonly { content: string }[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}

export function createConversationContextAssemblerV010(input: {
  artifactStore: ConversationContextArtifactStoreV010;
  compressor?: ConversationCompressionProviderV010;
  policy?: ConversationCompressionPolicyV010;
}): ConversationContextAssemblerV010 {
  const policy = input.policy ?? DEFAULT_CONVERSATION_COMPRESSION_POLICY_V010;
  const compressor =
    input.compressor ?? createDeterministicConversationCompressionProviderV010();

  return {
    async assemble(request): Promise<ConversationContextAssemblyResultV010> {
      const thread = await request.threadStore.get(
        required(request.threadId, "CONVERSATION_THREAD_ID_REQUIRED")
      );
      if (!thread) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
      const conversational = thread.messages.filter(
        message => message.role === "USER" || message.role === "ASSISTANT"
      );
      const directCharacterCount = conversational.reduce(
        (sum, message) => sum + message.content.length,
        0
      );
      if (
        conversational.length <= policy.directHistoryMaxMessages
        && directCharacterCount <= policy.directHistoryMaxCharacters
      ) {
        const messages = directMessages(
          conversational,
          policy.directHistoryMaxCharacters
        );
        return {
          contractVersion: "0.1.0",
          mode: "DIRECT",
          messages,
          sourceMessageCount: conversational.length,
          includedRecentMessageCount: messages.length,
          totalCharacters: totalCharacters(messages)
        };
      }

      const recent = conversational.slice(-policy.recentTailMessages);
      const older = conversational.slice(
        0,
        Math.max(0, conversational.length - recent.length)
      );
      if (older.length === 0) {
        const messages = directMessages(
          recent,
          policy.directHistoryMaxCharacters
        );
        return {
          contractVersion: "0.1.0",
          mode: "FALLBACK_RECENT",
          messages,
          sourceMessageCount: conversational.length,
          includedRecentMessageCount: messages.length,
          totalCharacters: totalCharacters(messages),
          diagnostic: "CONVERSATION_COMPRESSION_SOURCE_EMPTY"
        };
      }

      try {
        const latest = await input.artifactStore.latestSummary({
          threadId: thread.threadId,
          policyId: policy.policyId,
          policyVersion: policy.version
        });
        const coverageMatches = latest
          && latest.sourceLastMessageId === older.at(-1)!.messageId
          && latest.sourceFirstMessageId === older[0].messageId
          && latest.sourceMessageCount === older.length;
        const summary = coverageMatches
          ? latest
          : await compressor.compress({
              threadId: thread.threadId,
              messages: older,
              policy,
              generatedAt: request.now,
              artifactVersion: (latest?.artifactVersion ?? 0) + 1
            });
        if (!coverageMatches) {
          await input.artifactStore.saveSummary(summary);
          await input.artifactStore.saveCheckpoint({
            contractVersion: "0.1.0",
            checkpointId: "conversation-checkpoint:" + summary.summaryId,
            threadId: thread.threadId,
            summaryId: summary.summaryId,
            throughMessageId: summary.sourceLastMessageId,
            createdAt: request.now
          });
        }

        const checkpointContent =
          "[Conversation checkpoint " + summary.provenance.policyVersion + "]\n"
          + summary.content;
        const budgetForRecent = Math.max(
          0,
          policy.directHistoryMaxCharacters - checkpointContent.length
        );
        const recentMessages = budgetForRecent > 0
          ? directMessages(recent, budgetForRecent)
          : [];
        const messages = [
          {
            role: "assistant" as const,
            content: checkpointContent.slice(0, policy.directHistoryMaxCharacters)
          },
          ...recentMessages
        ];
        return {
          contractVersion: "0.1.0",
          mode: "COMPRESSED",
          messages,
          sourceMessageCount: conversational.length,
          includedRecentMessageCount: recentMessages.length,
          includedSummaryId: summary.summaryId,
          totalCharacters: totalCharacters(messages)
        };
      } catch (error) {
        const messages = directMessages(
          recent,
          policy.directHistoryMaxCharacters
        );
        return {
          contractVersion: "0.1.0",
          mode: "FALLBACK_RECENT",
          messages,
          sourceMessageCount: conversational.length,
          includedRecentMessageCount: messages.length,
          totalCharacters: totalCharacters(messages),
          diagnostic:
            error instanceof Error ? error.message : "CONVERSATION_COMPRESSION_FAILED"
        };
      }
    }
  };
}
