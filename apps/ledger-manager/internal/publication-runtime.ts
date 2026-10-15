import type { CompiledLedgerRuntimeConfigurationV010 } from "../../ledger-runtime-configurator/expression-compiler.js";

type PublicationTarget =
  | { enterpriseId: string; enterpriseCode?: never; enterpriseName?: never }
  | { enterpriseCode: string; enterpriseName?: string; enterpriseId?: never };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unknownResult(reason: string): Error {
  // Transport failure is not proof that the transaction did not commit.
  // Keep remote bodies/URLs out of user-visible diagnostics.
  return new Error(
    `LEDGER_MANAGER_RUNTIME_PUBLISH_UNKNOWN: 发布结果尚未确认（${reason}）。请先核实账本运行时的实际配置，不要直接重复发布。`
  );
}

/** EVO configurator receipt at d5ce0513; not a general runtime-health claim. */
function validReceipt(
  value: unknown,
  compiled: CompiledLedgerRuntimeConfigurationV010,
  target: PublicationTarget
): value is Record<string, unknown> {
  if (!record(value) || value.ok !== true
    || !nonempty(value.enterpriseId) || !nonempty(value.enterpriseCode)
    || value.configurationId !== compiled.configurationId
    || value.semanticDigest !== compiled.semanticDigest
    || (target.enterpriseId !== undefined
      ? value.enterpriseId !== target.enterpriseId
      : value.enterpriseCode !== target.enterpriseCode)
    || value.applications !== new Set(compiled.applications.map(app => app.applicationId)).size
    || value.ledgers !== compiled.accounts.length
    || value.rules !== compiled.rules.length
    || value.uniqueExpressions !== compiled.compiler.uniqueExpressionCount
    || value.compiledExpressions !== compiled.compiler.compiledExpressionCount
    || !Array.isArray(value.runtimeBuiltins)
    || value.runtimeBuiltins.length !== compiled.compiler.builtinNames.length
    || value.runtimeBuiltins.some((name, index) => name !== compiled.compiler.builtinNames[index])
    || !record(value.applicationInstances)) return false;
  return compiled.applications.every(app =>
    Object.hasOwn(value.applicationInstances as object, app.applicationId)
    && nonempty((value.applicationInstances as Record<string, unknown>)[app.applicationId])
  );
}

/** One write, bounded through body consumption, with no redirect/retry or status shortcut. */
export async function publishLedgerRuntimeConfigurationV010(input: {
  baseUrl: string;
  target: PublicationTarget;
  compiled: CompiledLedgerRuntimeConfigurationV010;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<Record<string, unknown>> {
  const timeoutMs = input.timeoutMs ?? 30_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0
    || !(nonempty(input.target.enterpriseId) || nonempty(input.target.enterpriseCode))) {
    throw new Error("LEDGER_MANAGER_RUNTIME_PUBLISH_INPUT_INVALID");
  }
  // Serialize before dispatch: local failures cannot have written remotely.
  const body = JSON.stringify({ ...input.compiled, target: input.target });
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(unknownResult("TIMEOUT"));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      deadline,
      (async () => {
        let response: Response;
        let text: string;
        try {
          response = await (input.fetch ?? fetch)(
            `${input.baseUrl.replace(/\/$/u, "")}/api/v1/configurator/burn`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body,
              signal: controller.signal,
              redirect: "error"
            }
          );
          text = await response.text();
        } catch {
          throw unknownResult("TRANSPORT_ERROR");
        }
        if (!response.ok) throw unknownResult(`HTTP_${response.status}`);
        let receipt: unknown;
        try { receipt = JSON.parse(text); }
        catch { throw unknownResult("INVALID_RECEIPT"); }
        if (!validReceipt(receipt, input.compiled, input.target)) {
          throw unknownResult("RECEIPT_MISMATCH");
        }
        return receipt;
      })()
    ]);
  } finally {
    clearTimeout(timer);
  }
}
