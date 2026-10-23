import type { AgentConversationMessageV010 } from "./contracts.js";
import type { LlmInferenceRequestV010 } from "../../contracts/llm.js";
import {
  admitCertifiedModelContextWindowV010
} from "./pa04-certified-context-window.js";
import type {
  CertifiedModelContextWindowV010
} from "./pa04-certified-context-window.js";

/**
 * C01 opt-in, bounded and deterministic overflow policy.
 *
 * Only old Conversation items are disposable model-input material. Source
 * Conversation remains durable in the Host; this never edits the Run input.
 * System instructions, current Human turn, authoritative Principal/Context,
 * interaction coordinates, Working State/tool observations, tool schemas and
 * reserved output are never shortened. The latest 4 history turns are pinned.
 *
 * This policy does not infer decisions from arbitrary chat prose. Formal
 * Working State/approved memory must be supplied as governed context by the
 * Host; if the protected input alone cannot fit, inference is denied.
 */
export async function fitCertifiedModelContextHistoryV010(input: {
  providerId: string;
  modelId: string;
  request: LlmInferenceRequestV010;
  history: readonly AgentConversationMessageV010[];
  port: CertifiedModelContextWindowV010;
}): Promise<{
  request: LlmInferenceRequestV010;
  removedOldHistoryMessages: number;
  inputUpperBoundTokens: number;
}> {
  const { request, history, port, providerId, modelId } = input;
  // The existing Personal Agent request layout is system, optional history,
  // current user, then Host developer context. Refuse rather than accidentally
  // remove a Principal, current task, tool result or other privileged content.
  const messages = request.messages;
  if (messages.length !== history.length + 3
    || messages[0]?.role !== "system"
    || messages[messages.length - 2]?.role !== "user"
    || messages[messages.length - 1]?.role !== "developer"
    || history.some((item, index) =>
      messages[index + 1].role !== item.role
      || messages[index + 1].content !== item.content)) {
    throw Error("PA04_CONTEXT_WINDOW_HISTORY_MISMATCH");
  }
  const allowed = (candidate: LlmInferenceRequestV010) =>
    admitCertifiedModelContextWindowV010({
      providerId, modelId, request: candidate, port
    });
  try {
    const approved = await allowed(request);
    return {
      request, removedOldHistoryMessages: 0,
      inputUpperBoundTokens: approved.inputUpperBoundTokens
    };
  } catch (error) {
    // Never retry an unverified, wrong-identity or invalid certified quote:
    // reducing old history does not cure an untrusted token bound.
    if (!(error instanceof Error)
      || error.message !== "PA04_CONTEXT_WINDOW_EXHAUSTED") throw error;
  }

  const protectedRecent = Math.min(4, history.length);
  const removable = history.length - protectedRecent;
  if (removable === 0) throw Error("PA04_CONTEXT_WINDOW_EXHAUSTED");

  // At most four additional token quotations regardless of thread length;
  // source history is not mutated and nothing is sent to the Provider until
  // the exact *candidate* request is independently certified as fitting.
  const plans = [...new Set([0.25, 0.5, 0.75, 1]
    .map(part => Math.ceil(removable * part)))];
  for (const removed of plans) {
    const candidate: LlmInferenceRequestV010 = {
      ...request,
      messages: [
        messages[0],
        ...messages.slice(1 + removed, 1 + history.length),
        messages[messages.length - 2],
        messages[messages.length - 1]
      ]
    };
    try {
      const approved = await allowed(candidate);
      return {
        request: candidate,
        removedOldHistoryMessages: removed,
        inputUpperBoundTokens: approved.inputUpperBoundTokens
      };
    } catch (error) {
      if (!(error instanceof Error)
        || error.message !== "PA04_CONTEXT_WINDOW_EXHAUSTED") throw error;
    }
  }
  throw Error("PA04_CONTEXT_WINDOW_EXHAUSTED");
}
