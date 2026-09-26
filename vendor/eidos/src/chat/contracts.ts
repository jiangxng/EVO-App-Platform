import type { JsonValue } from "../runtime/contracts.js";

export interface ChatExperienceV010 {
  contractVersion: "0.1.0";
  kind: "chat";
  id: string;
  title: string;
  command: {
    code: string;
    inputVersion: string;
  };
  composer: {
    key: string;
    placeholder: string;
    sendLabel: string;
  };
  emptyState?: string;
  metadata?: Record<string, JsonValue>;
}

export interface ChatActionV020 {
  id: string;
  label: string;
  type: "command" | "navigate" | "prompt";
  command?: string;
  inputVersion?: string;
  route?: string;
  prompt?: string;
  primary?: boolean;
  requiresConfirmation?: boolean;
}

export interface ChatContextOptionV020 {
  id: string;
  label: string;
  value: JsonValue;
}

export interface ChatContextSelectorV020 {
  key: string;
  ariaLabel: string;
  selectedId?: string;
  options: ChatContextOptionV020[];
}

export interface ChatContextSummaryV020 {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
  selector?: ChatContextSelectorV020;
}

export interface ChatReadinessV020 {
  state: "ready" | "setup-required" | "unavailable" | "degraded";
  label: string;
  message?: string;
  action?: ChatActionV020;
}

export interface ChatSuggestedPromptV020 {
  id: string;
  label: string;
  prompt: string;
}

export interface ChatExperienceV020 {
  contractVersion: "0.2.0";
  kind: "chat";
  id: string;
  title: string;
  command: {
    code: string;
    inputVersion: string;
  };
  composer: {
    key: string;
    placeholder: string;
    sendLabel: string;
    disabled?: boolean;
  };
  context?: ChatContextSummaryV020;
  readiness?: ChatReadinessV020;
  emptyState?: {
    title?: string;
    description: string;
    suggestions?: ChatSuggestedPromptV020[];
  };
  metadata?: Record<string, JsonValue>;
}

export interface ChatTextPartV020 {
  type: "text";
  text: string;
}

export interface ChatNoticePartV020 {
  type: "notice";
  tone: "info" | "success" | "warning" | "danger";
  title?: string;
  text: string;
}

export interface ChatActivityPartV020 {
  type: "activity";
  label: string;
  state: "pending" | "complete" | "error";
  detail?: string;
  route?: string;
}

export interface ChatEvidencePartV020 {
  type: "evidence";
  title: string;
  source?: string;
  context?: string;
  freshness?: string;
  route?: string;
}

export interface ChatProposalPartV020 {
  type: "proposal";
  title: string;
  summary?: string;
  reasons?: string[];
  risk?: string;
  actions?: ChatActionV020[];
}

export type ChatMessagePartV020 =
  | ChatTextPartV020
  | ChatNoticePartV020
  | ChatActivityPartV020
  | ChatEvidencePartV020
  | ChatProposalPartV020;

export interface ChatMessageV010 {
  id: string;
  role: "user" | "assistant" | "system" | "error";
  text: string;
  createdAt?: string;
}

export interface ChatMessageV020 {
  id: string;
  contractVersion: "0.2.0";
  role: "user" | "assistant" | "system" | "error";
  parts: ChatMessagePartV020[];
  createdAt?: string;
}

export function isChatExperienceV010(value: unknown): value is ChatExperienceV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const command = item.command as Record<string, unknown> | undefined;
  const composer = item.composer as Record<string, unknown> | undefined;
  return item.contractVersion === "0.1.0"
    && item.kind === "chat"
    && typeof item.id === "string"
    && item.id.length > 0
    && typeof item.title === "string"
    && item.title.length > 0
    && command !== undefined
    && typeof command.code === "string"
    && command.code.length > 0
    && typeof command.inputVersion === "string"
    && command.inputVersion.length > 0
    && composer !== undefined
    && typeof composer.key === "string"
    && composer.key.length > 0
    && typeof composer.placeholder === "string"
    && typeof composer.sendLabel === "string"
    && composer.sendLabel.length > 0;
}

export function isChatExperienceV020(value: unknown): value is ChatExperienceV020 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const command = item.command as Record<string, unknown> | undefined;
  const composer = item.composer as Record<string, unknown> | undefined;
  return item.contractVersion === "0.2.0"
    && item.kind === "chat"
    && typeof item.id === "string"
    && item.id.length > 0
    && typeof item.title === "string"
    && item.title.length > 0
    && command !== undefined
    && typeof command.code === "string"
    && command.code.length > 0
    && typeof command.inputVersion === "string"
    && command.inputVersion.length > 0
    && composer !== undefined
    && typeof composer.key === "string"
    && composer.key.length > 0
    && typeof composer.placeholder === "string"
    && typeof composer.sendLabel === "string"
    && composer.sendLabel.length > 0;
}
