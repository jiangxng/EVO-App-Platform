import type { AgentConversationMessageV010 } from "../agents/enterprise-agent/contracts.js";
import type { ConversationMessageV010, ConversationThreadStoreV010 } from "./conversation-thread.js";

export interface ConversationCompressionPolicyV010 {
  contractVersion: "0.1.0";
  policyId: string;
  version: string;
  directHistoryMaxMessages: number;
  directHistoryMaxCharacters: number;
  recentTailMessages: number;
  summaryMaxCharacters: number;
}

export interface ConversationSummaryProvenanceV010 {
  strategy: "DETERMINISTIC_EXTRACTIVE" | "MODEL";
  policyId: string;
  policyVersion: string;
  providerId?: string;
  modelId?: string;
  promptVersion?: string;
  generatedAt: string;
}

export interface ConversationSummaryArtifactV010 {
  contractVersion: "0.1.0";
  summaryId: string;
  threadId: string;
  artifactVersion: number;
  sourceMessageIds: string[];
  sourceFirstMessageId: string;
  sourceLastMessageId: string;
  sourceMessageCount: number;
  sourceCharacterCount: number;
  content: string;
  activeGoals: string[];
  decisions: string[];
  unresolvedQuestions: string[];
  relevantToolOutcomes: string[];
  provenance: ConversationSummaryProvenanceV010;
}

export interface ConversationCheckpointV010 {
  contractVersion: "0.1.0";
  checkpointId: string;
  threadId: string;
  summaryId: string;
  throughMessageId: string;
  createdAt: string;
}

export interface ConversationContextArtifactStoreV010 {
  latestSummary(input: {
    threadId: string;
    policyId: string;
    policyVersion: string;
  }): Promise<ConversationSummaryArtifactV010 | undefined>;
  saveSummary(summary: ConversationSummaryArtifactV010): Promise<ConversationSummaryArtifactV010>;
  saveCheckpoint(checkpoint: ConversationCheckpointV010): Promise<ConversationCheckpointV010>;
}

export interface ConversationCompressionInputV010 {
  threadId: string;
  messages: readonly ConversationMessageV010[];
  policy: ConversationCompressionPolicyV010;
  generatedAt: string;
  artifactVersion: number;
}

export interface ConversationCompressionProviderV010 {
  compress(input: ConversationCompressionInputV010): Promise<ConversationSummaryArtifactV010>;
}

export interface ConversationContextAssemblyResultV010 {
  contractVersion: "0.1.0";
  mode: "DIRECT" | "COMPRESSED" | "FALLBACK_RECENT";
  messages: AgentConversationMessageV010[];
  sourceMessageCount: number;
  includedRecentMessageCount: number;
  includedSummaryId?: string;
  totalCharacters: number;
  diagnostic?: string;
}

export interface ConversationContextAssemblerV010 {
  assemble(input: {
    threadId: string;
    threadStore: ConversationThreadStoreV010;
    now: string;
  }): Promise<ConversationContextAssemblyResultV010>;
}
