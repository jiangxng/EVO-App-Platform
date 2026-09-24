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

export interface ChatMessageV010 {
  id: string;
  role: "user" | "assistant" | "system" | "error";
  text: string;
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
