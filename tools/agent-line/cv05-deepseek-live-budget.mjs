/**
 * CV05 DeepSeek live QA: conservative client-side *request reservation*.
 * This is NOT an upstream billing cap. Keep L01-L05 blocked until the
 * operator independently confirms current Provider prices and authorization.
 *
 * USD guard rates are intentionally much more expensive than DeepSeek's
 * published 2026-11-19 peak CNY token rates: CNY 2/M uncached input,
 * CNY 8/M output. We reserve once BEFORE each HTTP attempt, including
 * attempts that later time out, and never reclaim the reservation.
 *
 * Input request UTF-8 bytes are used as a conservative proxy for tokens,
 * plus an 8192-token per-request allowance for unreported framing.
 * This approximation cannot prove actual external billing, exchange rate,
 * price changes, or concurrent consumption on the same account.
 */
export const CV05_DEEPSEEK_LIVE_MODEL = "deepseek-flash";
export const CV05_DEEPSEEK_MAX_USD = 2;
export const CV05_DEEPSEEK_MAX_OUTPUT_TOKENS = 700;
export const CV05_DEEPSEEK_MAX_REQUEST_BODY_BYTES = 96_000;
export const CV05_DEEPSEEK_MAX_REQUESTS = 32;
const INPUT_USD_PER_MILLION = 2;
const OUTPUT_USD_PER_MILLION = 8;
const EXTRA_INPUT_TOKENS_PER_REQUEST = 8192;

function blocked(code) {
  throw new Error("CV05_LIVE_BUDGET_" + code);
}

export function createCv05DeepSeekLiveBudgetGuard() {
  let reservedUsd = 0;
  let reservedCalls = 0;
  let requestBytes = 0;

  return {
    /** Must be invoked before actual fetch, never after receipt. */
    reserve(jsonBody) {
      if (typeof jsonBody !== "string") blocked("BODY_REQUIRED");
      const byteCount = Buffer.byteLength(jsonBody, "utf8");
      if (byteCount > CV05_DEEPSEEK_MAX_REQUEST_BODY_BYTES) {
        blocked("REQUEST_TOO_LARGE");
      }
      let payload;
      try {
        payload = JSON.parse(jsonBody);
      } catch {
        blocked("JSON_INVALID");
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        blocked("BODY_INVALID");
      }
      if (payload.model !== CV05_DEEPSEEK_LIVE_MODEL) {
        blocked("MODEL_NOT_APPROVED");
      }
      if (payload.max_output_tokens !== CV05_DEEPSEEK_MAX_OUTPUT_TOKENS) {
        blocked("OUTPUT_LIMIT_REQUIRED");
      }
      if (!Array.isArray(payload.input)
        || typeof payload.instructions !== "string"
        || (payload.tools !== undefined && !Array.isArray(payload.tools))
        || (Array.isArray(payload.tools)
          && payload.tools.some(tool => tool?.type !== "function"))) {
        blocked("UNEXPECTED_REQUEST_SHAPE");
      }
      if (reservedCalls + 1 > CV05_DEEPSEEK_MAX_REQUESTS) {
        blocked("REQUEST_LIMIT");
      }
      const estimatedInputTokens = byteCount + EXTRA_INPUT_TOKENS_PER_REQUEST;
      const nextReservation =
        (estimatedInputTokens * INPUT_USD_PER_MILLION
          + CV05_DEEPSEEK_MAX_OUTPUT_TOKENS * OUTPUT_USD_PER_MILLION)
        / 1_000_000;
      if (reservedUsd + nextReservation > CV05_DEEPSEEK_MAX_USD + 1e-12) {
        blocked("USD_CEILING");
      }
      // Commit before networking: timeout, cancellation and missing usage
      // still consume the upper-bound reservation.
      reservedCalls++;
      requestBytes += byteCount;
      reservedUsd += nextReservation;
    },
    receipt() {
      return Object.freeze({
        callsReserved: reservedCalls,
        requestBytes,
        conservativeEstimatedUsd: Number(reservedUsd.toFixed(6)),
        approvedModel: CV05_DEEPSEEK_LIVE_MODEL,
        ceilingUsd: CV05_DEEPSEEK_MAX_USD
      });
    }
  };
}
