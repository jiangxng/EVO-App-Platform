import type { AgentAssistanceRequestV010 } from "../../contracts/agent-assistance.js";

const invalid = () => new Error("PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID");

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalid();
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw invalid();
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw invalid();
}

function text(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw invalid();
  return value.trim();
}

// Bound depth and node count before stringify; reject non-JSON instead of coercing it.
function validateJson(value: unknown, depth: number, budget: { left: number }): void {
  if (--budget.left < 0 || depth > 16) throw invalid();
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) validateJson(item, depth + 1, budget);
    return;
  }
  const record = object(value);
  for (const [key, item] of Object.entries(record)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) throw invalid();
    validateJson(item, depth + 1, budget);
  }
}

export function parseAgentAssistanceRequestV010(
  value: unknown
): AgentAssistanceRequestV010 | undefined {
  if (value === undefined) return undefined;
  validateJson(value, 0, { left: 2000 });
  const raw = object(value);
  keys(raw, ["contractVersion", "requestId", "taskKind", "userIntent", "source", "context"]);
  if (raw.contractVersion !== "0.1.0") {
    throw new Error("PERSONAL_AGENT_ASSISTANCE_VERSION_UNSUPPORTED");
  }
  if (JSON.stringify(raw).length > 16000) {
    throw new Error("PERSONAL_AGENT_ASSISTANCE_REQUEST_TOO_LARGE");
  }
  const source = object(raw.source);
  keys(source, ["pageId", "actionId", "route", "resourceRef", "resourceRevision"]);
  const taskKind = text(raw.taskKind, 128);
  const context = raw.context === undefined ? undefined : object(raw.context);
  if (context?.taskKind !== undefined && context.taskKind !== taskKind) throw invalid();
  if (source.resourceRevision !== undefined && source.resourceRef === undefined) throw invalid();
  return {
    contractVersion: "0.1.0",
    requestId: text(raw.requestId, 240),
    taskKind,
    userIntent: text(raw.userIntent, 8000),
    source: {
      pageId: text(source.pageId, 240),
      actionId: text(source.actionId, 240),
      ...(source.route === undefined ? {} : { route: text(source.route, 2048) }),
      ...(source.resourceRef === undefined ? {} : { resourceRef: text(source.resourceRef, 512) }),
      ...(source.resourceRevision === undefined ? {} : { resourceRevision: text(source.resourceRevision, 240) })
    },
    ...(context === undefined ? {} : {
      context: JSON.parse(JSON.stringify(context)) as NonNullable<AgentAssistanceRequestV010["context"]>
    })
  };
}

export function assistanceInteractionContextV010(request: AgentAssistanceRequestV010) {
  return {
    contractVersion: "0.1.0" as const,
    source: structuredClone(request.source),
    context: { ...structuredClone(request.context ?? {}), taskKind: request.taskKind }
  };
}
