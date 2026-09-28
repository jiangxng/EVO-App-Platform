import type { ActiveContextRefV010 } from "./platform-services.js";

export interface ConversationRetentionCandidatePolicyV010 {
  contractVersion: "0.1.0";
  retainArchivedForDays: number;
}

export type ConversationRetentionPreviewOutcomeV010 =
  | "ACTIVE_NOT_ELIGIBLE"
  | "ARCHIVED_WOULD_RETAIN"
  | "ARCHIVED_WOULD_PURGE";

export interface ConversationRetentionPreviewItemV010 {
  contractVersion: "0.1.0";
  threadId: string;
  state: "ACTIVE" | "ARCHIVED";
  updatedAt: string;
  archivedAt?: string;
  deadline?: string;
  outcome: ConversationRetentionPreviewOutcomeV010;
  messageCount: number;
}

export interface ConversationRetentionPreviewResultV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  simulatedAt: string;
  candidatePolicy: ConversationRetentionCandidatePolicyV010;
  scope: "READER_VISIBLE_CURRENT_CONTEXT";
  destructiveActionExecuted: false;
  totals: {
    examined: number;
    activeNotEligible: number;
    archivedWouldRetain: number;
    archivedWouldPurge: number;
  };
  items: ConversationRetentionPreviewItemV010[];
}
