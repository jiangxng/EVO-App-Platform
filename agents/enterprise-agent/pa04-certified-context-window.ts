import type { LlmInferenceRequestV010 } from "../../contracts/llm.js";

/**
 * Optional Host-owned C01 admission port, scoped to an exact Provider/model.
 *
 * quoteInputUpperBound MUST include the final serialized system/developer/user/
 * assistant messages, tool descriptions and schemas, and model-specific framing
 * overhead. Character counts or a model's self-estimate are NOT certified bounds.
 * This port is not a supplier billing tariff or PA-02 R10 monetary approval.
 */
export interface CertifiedModelContextWindowV010 {
  providerId: string;
  modelId: string;
  /** Model-supported combined prompt + completion context size. */
  contextWindowTokens: number;
  /** Required explicit completion reserve, sent to the Provider unchanged. */
  maxOutputTokens: number;
  quoteInputUpperBound(request: LlmInferenceRequestV010): Promise<{
    providerId: string;
    modelId: string;
    inputUpperBoundTokens: number;
    sourceVersion: string;
  } | undefined>;
}

const validPositive = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;

/**
 * FAIL-CLOSED, before any LLM inference: no truncation of protected instructions,
 * currently authorized tool contracts, recent work or Human intent is allowed.
 * A later prioritizing Context Assembler can reduce irrelevant history upstream,
 * but must pass this exact-request admission again after materialization.
 */
export async function admitCertifiedModelContextWindowV010(input: {
  providerId: string;
  modelId: string;
  request: LlmInferenceRequestV010;
  port: CertifiedModelContextWindowV010;
}): Promise<{ inputUpperBoundTokens: number; remainingInputTokens: number }> {
  const { providerId, modelId, request, port } = input;
  if (!validPositive(port.contextWindowTokens)
    || !validPositive(port.maxOutputTokens)
    || port.maxOutputTokens >= port.contextWindowTokens) {
    throw Error("PA04_CONTEXT_WINDOW_CONFIG_INVALID");
  }
  if (port.providerId !== providerId || port.modelId !== modelId) {
    throw Error("PA04_CONTEXT_WINDOW_MODEL_MISMATCH");
  }
  if (request.maxOutputTokens !== port.maxOutputTokens) {
    throw Error("PA04_CONTEXT_WINDOW_OUTPUT_RESERVE_MISMATCH");
  }
  // The quote always inspects the exact final materialized request, including
  // all tool schemas and its explicit completion cap.
  let quote: Awaited<ReturnType<CertifiedModelContextWindowV010["quoteInputUpperBound"]>>;
  try {
    quote = await port.quoteInputUpperBound(structuredClone(request));
  } catch {
    quote = undefined;
  }
  if (!quote || quote.providerId !== providerId || quote.modelId !== modelId
    || !validPositive(quote.inputUpperBoundTokens)
    || typeof quote.sourceVersion !== "string"
    || !quote.sourceVersion.trim()) {
    throw Error("PA04_CONTEXT_WINDOW_INPUT_BOUND_UNVERIFIED");
  }
  const available = port.contextWindowTokens - port.maxOutputTokens;
  if (quote.inputUpperBoundTokens > available) {
    throw Error("PA04_CONTEXT_WINDOW_EXHAUSTED");
  }
  return {
    inputUpperBoundTokens: quote.inputUpperBoundTokens,
    remainingInputTokens: available - quote.inputUpperBoundTokens
  };
}
