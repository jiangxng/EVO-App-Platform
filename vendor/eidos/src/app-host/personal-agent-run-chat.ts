import type { ActionExecutionResult, ActionHost } from "../adapters/ports.js";
import type { ActionRequestV010, JsonValue } from "../runtime/contracts.js";

export type RunBackedChatRunStateV010 =
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "BLOCKED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface RunBackedChatRunV010 {
  runId: string;
  state: RunBackedChatRunStateV010;
  sourceInteractionId?: string;
  sourceActionId?: string;
  createdAt?: string;
  updatedAt?: string;
  sliceCount?: number;
  finalMessage?: string;
  blocker?: { code?: string; reason: string };
  error?: { code?: string; reason: string };
}

export interface RunBackedChatProgressV010 {
  runId: string;
  state: RunBackedChatRunStateV010;
  sliceCount?: number;
  resumeCount: number;
}

export interface RunBackedChatExecutionV010 {
  mode: "RUN" | "LEGACY";
  result: ActionExecutionResult;
  runId?: string;
  runState?: RunBackedChatRunStateV010;
  resumeCount: number;
}

export interface RunBackedChatExecuteOptionsV010 {
  actionHost: ActionHost;
  request: ActionRequestV010;
  maxConsecutiveResumes?: number;
  onProgress?: (progress: RunBackedChatProgressV010) => void | Promise<void>;
}

const TERMINAL = new Set<RunBackedChatRunStateV010>([
  "BLOCKED",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED"
]);

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function runFromResult(result: ActionExecutionResult): RunBackedChatRunV010 | undefined {
  if (!result.ok) return undefined;
  const payload = objectValue(result.result);
  const rawRun = objectValue(payload?.run);
  if (
    !rawRun
    || typeof rawRun.runId !== "string"
    || typeof rawRun.state !== "string"
    || ![
      "READY",
      "RUNNING",
      "PAUSED",
      "BLOCKED",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED"
    ].includes(rawRun.state)
  ) {
    return undefined;
  }
  return rawRun as unknown as RunBackedChatRunV010;
}

function scopeValues(request: ActionRequestV010): Record<string, JsonValue> {
  const values: Record<string, JsonValue> = {};
  for (const key of ["activeContext", "locale"]) {
    const value = request.values[key];
    if (value !== undefined) values[key] = structuredClone(value);
  }
  return values;
}

function commandRequest(
  source: ActionRequestV010,
  code: string,
  actionId: string,
  values: Record<string, JsonValue>
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code,
      inputVersion: source.command.inputVersion
    },
    values,
    sourceInteractionId: source.sourceInteractionId,
    actionId,
    ...(source.runtimeInstanceId
      ? { runtimeInstanceId: source.runtimeInstanceId }
      : {}),
    requiresConfirmation: false
  };
}

function errorResult(code: string, message: string): ActionExecutionResult {
  return {
    ok: false,
    error: { code, message }
  };
}

function shouldLegacyFallback(result: ActionExecutionResult): boolean {
  return !result.ok && (
    result.error?.code === "ACTION_HANDLER_NOT_FOUND"
    || result.error?.code === "ACTION_FEATURE_NOT_ACTIVE"
  );
}

async function progress(
  options: RunBackedChatExecuteOptionsV010,
  run: RunBackedChatRunV010,
  resumeCount: number
): Promise<void> {
  await options.onProgress?.({
    runId: run.runId,
    state: run.state,
    ...(typeof run.sliceCount === "number" ? { sliceCount: run.sliceCount } : {}),
    resumeCount
  });
}

async function drainRun(
  options: RunBackedChatExecuteOptionsV010,
  firstResult: ActionExecutionResult
): Promise<RunBackedChatExecutionV010> {
  let result = firstResult;
  let run = runFromResult(result);
  if (!run) {
    return {
      mode: "RUN",
      result: result.ok
        ? errorResult(
            "EIDOS_AGENT_RUN_RESPONSE_INVALID",
            "Durable Agent Run action returned no valid run state."
          )
        : result,
      resumeCount: 0
    };
  }

  let resumeCount = 0;
  await progress(options, run, resumeCount);

  const maxResumes = options.maxConsecutiveResumes ?? 12;
  while (run.state === "PAUSED") {
    if (resumeCount >= maxResumes) {
      return {
        mode: "RUN",
        result: errorResult(
          "EIDOS_AGENT_RUN_RESUME_LIMIT_REACHED",
          "The durable Agent Run is still paused after the client resume budget. Its runId is preserved and can be recovered without recreating the request."
        ),
        runId: run.runId,
        runState: run.state,
        resumeCount
      };
    }

    resumeCount += 1;
    result = await options.actionHost.execute(commandRequest(
      options.request,
      "enterprise-agent.run.resume",
      "chat.run.resume",
      {
        runId: run.runId,
        ...scopeValues(options.request)
      }
    ));
    if (!result.ok) {
      return {
        mode: "RUN",
        result,
        runId: run.runId,
        runState: run.state,
        resumeCount
      };
    }
    const next = runFromResult(result);
    if (!next || next.runId !== run.runId) {
      return {
        mode: "RUN",
        result: errorResult(
          "EIDOS_AGENT_RUN_RESPONSE_INVALID",
          "Durable Agent Run resume returned an invalid or mismatched run."
        ),
        runId: run.runId,
        runState: run.state,
        resumeCount
      };
    }
    run = next;
    await progress(options, run, resumeCount);
  }

  return {
    mode: "RUN",
    result,
    runId: run.runId,
    runState: run.state,
    resumeCount
  };
}

export async function executeRunBackedChatV010(
  options: RunBackedChatExecuteOptionsV010
): Promise<RunBackedChatExecutionV010> {
  const message = options.request.values.message;
  if (typeof message !== "string" || !message.trim()) {
    return {
      mode: "RUN",
      result: errorResult("MESSAGE_REQUIRED", "A chat message is required."),
      resumeCount: 0
    };
  }

  const start = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.run.start",
    "chat.run.start",
    {
      ...structuredClone(options.request.values),
      message: message.trim()
    }
  ));

  if (shouldLegacyFallback(start)) {
    return {
      mode: "LEGACY",
      result: await options.actionHost.execute(options.request),
      resumeCount: 0
    };
  }

  return drainRun(options, start);
}

export async function recoverRunBackedChatV010(
  options: RunBackedChatExecuteOptionsV010 & {
    runId?: string;
  }
): Promise<RunBackedChatExecutionV010 | undefined> {
  let runId = options.runId?.trim();

  if (!runId) {
    const listed = await options.actionHost.execute(commandRequest(
      options.request,
      "enterprise-agent.run.list",
      "chat.run.list",
      {
        limit: 20,
        ...scopeValues(options.request)
      }
    ));
    if (shouldLegacyFallback(listed)) return undefined;
    if (!listed.ok) {
      return {
        mode: "RUN",
        result: listed,
        resumeCount: 0
      };
    }

    const payload = objectValue(listed.result);
    const runs = Array.isArray(payload?.runs)
      ? payload!.runs
          .map(objectValue)
          .filter((item): item is Record<string, unknown> => Boolean(item))
      : [];
    const candidates = runs.filter(item =>
      typeof item.runId === "string"
      && item.sourceInteractionId === options.request.sourceInteractionId
      && item.sourceActionId === "chat.run.start"
      && typeof item.state === "string"
      && !TERMINAL.has(item.state as RunBackedChatRunStateV010)
    );

    if (candidates.length === 0) return undefined;
    if (candidates.length > 1) {
      return {
        mode: "RUN",
        result: errorResult(
          "EIDOS_AGENT_RUN_RECOVERY_AMBIGUOUS",
          "More than one non-terminal durable Agent Run matches this chat interaction. The client will not guess which run to resume."
        ),
        resumeCount: 0
      };
    }
    runId = candidates[0].runId as string;
  }

  const got = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.run.get",
    "chat.run.get",
    {
      runId,
      ...scopeValues(options.request)
    }
  ));
  if (shouldLegacyFallback(got)) return undefined;
  if (!got.ok) {
    return {
      mode: "RUN",
      result: got,
      runId,
      resumeCount: 0
    };
  }

  const run = runFromResult(got);
  if (!run) {
    return {
      mode: "RUN",
      result: errorResult(
        "EIDOS_AGENT_RUN_RESPONSE_INVALID",
        "Durable Agent Run readback returned no valid run."
      ),
      runId,
      resumeCount: 0
    };
  }

  await progress(options, run, 0);
  if (run.state !== "PAUSED") {
    return {
      mode: "RUN",
      result: got,
      runId: run.runId,
      runState: run.state,
      resumeCount: 0
    };
  }

  return drainRun(options, got);
}

export function runBackedChatStorageKeyV010(
  sourceInteractionId: string
): string {
  return "eidos:personal-agent-run:" + sourceInteractionId;
}
