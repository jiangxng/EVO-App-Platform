import type { ActionExecutionResult, ActionHost } from "../adapters/ports.js";
import type {
  ChatMessageV020
} from "../chat/contracts.js";
import type { ActionRequestV010, JsonValue } from "../runtime/contracts.js";

export type ThreadBackedRunStateV010 =
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "BLOCKED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface ThreadBackedMessageV010 {
  messageId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  runId?: string;
  replyToMessageId?: string;
  presentation?: {
    messageParts?: unknown;
    [key: string]: unknown;
  };
}

export interface ThreadBackedThreadV010 {
  threadId: string;
  state?: "ACTIVE" | "ARCHIVED";
  sourceInteractionId?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  messages: ThreadBackedMessageV010[];
}

export interface ThreadBackedChatExecutionV010 {
  mode: "THREAD";
  result: ActionExecutionResult;
  thread?: ThreadBackedThreadV010;
  threadId?: string;
  runId?: string;
  runState?: ThreadBackedRunStateV010;
  resumeCount: number;
  transcript: ChatMessageV020[];
}

export interface ThreadBackedChatOptionsV010 {
  actionHost: ActionHost;
  request: ActionRequestV010;
  threadId?: string;
  maxConsecutiveResumes?: number;
  onProgress?: (input: {
    threadId: string;
    runId?: string;
    state?: ThreadBackedRunStateV010;
    resumeCount: number;
  }) => void | Promise<void>;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function errorResult(code: string, message: string): ActionExecutionResult {
  return {
    ok: false,
    error: { code, message }
  };
}

export function threadActionsUnavailableV010(
  result: ActionExecutionResult
): boolean {
  return !result.ok && (
    result.error?.code === "ACTION_HANDLER_NOT_FOUND"
    || result.error?.code === "ACTION_FEATURE_NOT_ACTIVE"
  );
}

function scopeValues(request: ActionRequestV010): Record<string, JsonValue> {
  const values: Record<string, JsonValue> = {};
  for (const key of ["activeContext", "locale"]) {
    const value = request.values[key];
    if (value !== undefined) values[key] = structuredClone(value);
  }
  return values;
}

function turnContextValues(
  request: ActionRequestV010
): Record<string, JsonValue> {
  const values = scopeValues(request);
  const interactionContext = request.values.interactionContext;
  if (interactionContext !== undefined) {
    values.interactionContext = structuredClone(interactionContext);
  }
  const clientTurnId = request.values.clientTurnId;
  if (clientTurnId !== undefined) {
    values.clientTurnId = structuredClone(clientTurnId);
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

function threadFromResult(
  result: ActionExecutionResult
): ThreadBackedThreadV010 | undefined {
  if (!result.ok) return undefined;
  const payload = objectValue(result.result);
  const raw = objectValue(payload?.thread);
  if (
    !raw
    || typeof raw.threadId !== "string"
    || !Array.isArray(raw.messages)
  ) {
    return undefined;
  }
  return raw as unknown as ThreadBackedThreadV010;
}


function threadsFromListResult(
  result: ActionExecutionResult
): ThreadBackedThreadV010[] | undefined {
  if (!result.ok) return undefined;
  const payload = objectValue(result.result);
  if (!Array.isArray(payload?.threads)) return undefined;
  const threads: ThreadBackedThreadV010[] = [];
  for (const rawValue of payload.threads) {
    const raw = objectValue(rawValue);
    if (
      !raw
      || typeof raw.threadId !== "string"
      || !Array.isArray(raw.messages)
    ) {
      return undefined;
    }
    threads.push(raw as unknown as ThreadBackedThreadV010);
  }
  return threads;
}

export async function listConversationThreadsV010(
  options: ThreadBackedChatOptionsV010 & { includeArchived?: boolean }
): Promise<{
  unavailable: boolean;
  result?: ActionExecutionResult;
  threads?: ThreadBackedThreadV010[];
}> {
  const listed = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.list",
    "chat.thread.history",
    {
      limit: 100,
      includeArchived: options.includeArchived === true,
      ...scopeValues(options.request)
    }
  ));
  if (threadActionsUnavailableV010(listed)) return { unavailable: true };
  if (!listed.ok) return { unavailable: false, result: listed };
  const threads = threadsFromListResult(listed);
  return threads
    ? { unavailable: false, threads }
    : {
        unavailable: false,
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
          "Thread list returned invalid durable state."
        )
      };
}

export async function getConversationThreadV010(
  options: ThreadBackedChatOptionsV010,
  threadId: string
): Promise<{
  unavailable: boolean;
  result?: ActionExecutionResult;
  thread?: ThreadBackedThreadV010;
}> {
  const got = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.get",
    "chat.thread.get",
    {
      threadId: threadId.trim(),
      ...scopeValues(options.request)
    }
  ));
  if (threadActionsUnavailableV010(got)) return { unavailable: true };
  if (!got.ok) return { unavailable: false, result: got };
  const thread = threadFromResult(got);
  return thread
    ? { unavailable: false, thread }
    : {
        unavailable: false,
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
          "Thread get returned invalid durable state."
        )
      };
}

export async function createConversationThreadV010(
  options: ThreadBackedChatOptionsV010
): Promise<{
  unavailable: boolean;
  result?: ActionExecutionResult;
  thread?: ThreadBackedThreadV010;
}> {
  const created = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.create",
    "chat.thread.new",
    scopeValues(options.request)
  ));
  if (threadActionsUnavailableV010(created)) return { unavailable: true };
  if (!created.ok) return { unavailable: false, result: created };
  const thread = threadFromResult(created);
  return thread
    ? { unavailable: false, thread }
    : {
        unavailable: false,
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
          "Thread create returned invalid durable state."
        )
      };
}

export async function archiveConversationThreadV010(
  options: ThreadBackedChatOptionsV010,
  threadId: string
): Promise<{
  unavailable: boolean;
  result?: ActionExecutionResult;
  thread?: ThreadBackedThreadV010;
}> {
  const archived = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.archive",
    "chat.thread.archive",
    {
      threadId: threadId.trim(),
      ...scopeValues(options.request)
    }
  ));
  if (threadActionsUnavailableV010(archived)) return { unavailable: true };
  if (!archived.ok) return { unavailable: false, result: archived };
  const thread = threadFromResult(archived);
  return thread
    ? { unavailable: false, thread }
    : {
        unavailable: false,
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
          "Thread archive returned invalid durable state."
        )
      };
}

function runFromResult(
  result: ActionExecutionResult
): { runId: string; state: ThreadBackedRunStateV010 } | undefined {
  if (!result.ok) return undefined;
  const payload = objectValue(result.result);
  const raw = objectValue(payload?.run);
  if (
    !raw
    || typeof raw.runId !== "string"
    || typeof raw.state !== "string"
    || ![
      "READY",
      "RUNNING",
      "PAUSED",
      "BLOCKED",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED"
    ].includes(raw.state)
  ) {
    return undefined;
  }
  return {
    runId: raw.runId,
    state: raw.state as ThreadBackedRunStateV010
  };
}

function assistantParts(
  message: ThreadBackedMessageV010
): ChatMessageV020["parts"] {
  const parts = message.presentation?.messageParts;
  if (Array.isArray(parts)) {
    return structuredClone(parts) as ChatMessageV020["parts"];
  }
  return [{ type: "text", text: message.content }];
}

export function transcriptFromThreadV010(
  thread: ThreadBackedThreadV010
): ChatMessageV020[] {
  return thread.messages.map(message => ({
    id: message.messageId,
    contractVersion: "0.2.0",
    role: message.role === "USER"
      ? "user"
      : message.role === "ASSISTANT"
        ? "assistant"
        : "system",
    parts: message.role === "ASSISTANT"
      ? assistantParts(message)
      : [{ type: "text", text: message.content }]
  }));
}

async function progress(
  options: ThreadBackedChatOptionsV010,
  threadId: string,
  run: { runId: string; state: ThreadBackedRunStateV010 } | undefined,
  resumeCount: number
): Promise<void> {
  await options.onProgress?.({
    threadId,
    ...(run ? { runId: run.runId, state: run.state } : {}),
    resumeCount
  });
}

function terminalError(
  run: { runId: string; state: ThreadBackedRunStateV010 }
): ActionExecutionResult | undefined {
  if (run.state === "BLOCKED") {
    return errorResult(
      "EIDOS_THREAD_AGENT_RUN_BLOCKED",
      "The durable thread turn is blocked by an authority or execution boundary."
    );
  }
  if (run.state === "FAILED") {
    return errorResult(
      "EIDOS_THREAD_AGENT_RUN_FAILED",
      "The durable thread turn failed."
    );
  }
  if (run.state === "CANCELLED") {
    return errorResult(
      "EIDOS_THREAD_AGENT_RUN_CANCELLED",
      "The durable thread turn was cancelled."
    );
  }
  return undefined;
}

async function drain(
  options: ThreadBackedChatOptionsV010,
  first: ActionExecutionResult,
  threadId: string
): Promise<ThreadBackedChatExecutionV010> {
  let result = first;
  let thread = threadFromResult(result);
  let run = runFromResult(result);
  if (!result.ok || !thread || !run) {
    return {
      mode: "THREAD",
      result: result.ok
        ? errorResult(
            "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
            "Thread-backed Agent turn returned invalid durable state."
          )
        : result,
      thread,
      threadId,
      ...(run ? { runId: run.runId, runState: run.state } : {}),
      resumeCount: 0,
      transcript: thread ? transcriptFromThreadV010(thread) : []
    };
  }

  let resumeCount = 0;
  await progress(options, threadId, run, resumeCount);
  const maxResumes = options.maxConsecutiveResumes ?? 12;

  while (run.state === "PAUSED") {
    if (resumeCount >= maxResumes) {
      return {
        mode: "THREAD",
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESUME_LIMIT_REACHED",
          "The durable thread turn is still paused after the client resume budget. The Host thread/run state is preserved for recovery."
        ),
        thread,
        threadId,
        runId: run.runId,
        runState: run.state,
        resumeCount,
        transcript: transcriptFromThreadV010(thread)
      };
    }

    resumeCount += 1;
    result = await options.actionHost.execute(commandRequest(
      options.request,
      "enterprise-agent.thread.resume",
      "chat.thread.resume",
      {
        threadId,
        runId: run.runId,
        ...scopeValues(options.request)
      }
    ));
    if (!result.ok) {
      return {
        mode: "THREAD",
        result,
        thread,
        threadId,
        runId: run.runId,
        runState: run.state,
        resumeCount,
        transcript: transcriptFromThreadV010(thread)
      };
    }

    const nextThread = threadFromResult(result);
    const nextRun = runFromResult(result);
    if (
      !nextThread
      || nextThread.threadId !== threadId
      || !nextRun
      || nextRun.runId !== run.runId
    ) {
      return {
        mode: "THREAD",
        result: errorResult(
          "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
          "Thread resume returned mismatched durable state."
        ),
        thread,
        threadId,
        runId: run.runId,
        runState: run.state,
        resumeCount,
        transcript: transcriptFromThreadV010(thread)
      };
    }
    thread = nextThread;
    run = nextRun;
    await progress(options, threadId, run, resumeCount);
  }

  const error = terminalError(run);
  return {
    mode: "THREAD",
    result: error ?? result,
    thread,
    threadId,
    runId: run.runId,
    runState: run.state,
    resumeCount,
    transcript: transcriptFromThreadV010(thread)
  };
}

export async function resolveConversationThreadV010(
  options: ThreadBackedChatOptionsV010
): Promise<{
  unavailable: boolean;
  result?: ActionExecutionResult;
  thread?: ThreadBackedThreadV010;
}> {
  const requestedId = options.threadId?.trim();
  if (requestedId) {
    const got = await getConversationThreadV010(options, requestedId);
    if (got.unavailable) return { unavailable: true };
    if (got.thread) return { unavailable: false, thread: got.thread };
    if (got.result?.error?.code !== "CONVERSATION_THREAD_NOT_FOUND") {
      return { unavailable: false, result: got.result };
    }
  }

  const listed = await listConversationThreadsV010(options);
  if (listed.unavailable) return { unavailable: true };
  if (listed.result && !listed.threads) {
    return { unavailable: false, result: listed.result };
  }
  const matching = (listed.threads ?? []).filter(item =>
    item.sourceInteractionId === options.request.sourceInteractionId
  );
  if (matching.length > 0) {
    return {
      unavailable: false,
      thread: matching[0]
    };
  }

  const created = await createConversationThreadV010(options);
  if (created.unavailable) return { unavailable: true };
  return created.thread
    ? { unavailable: false, thread: created.thread }
    : { unavailable: false, result: created.result };
}

function latestPendingRunId(
  thread: ThreadBackedThreadV010
): string | undefined {
  const answered = new Set(
    thread.messages
      .filter(item => item.role === "ASSISTANT" && item.runId)
      .map(item => item.runId as string)
  );
  return [...thread.messages]
    .reverse()
    .find(item =>
      item.role === "USER"
      && typeof item.runId === "string"
      && !answered.has(item.runId)
    )?.runId;
}

export async function recoverThreadBackedChatV010(
  options: ThreadBackedChatOptionsV010
): Promise<ThreadBackedChatExecutionV010 | undefined> {
  const resolved = await resolveConversationThreadV010(options);
  if (resolved.unavailable) return undefined;
  if (!resolved.thread) {
    return {
      mode: "THREAD",
      result: resolved.result ?? errorResult(
        "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
        "Unable to resolve durable conversation thread."
      ),
      resumeCount: 0,
      transcript: []
    };
  }

  const thread = resolved.thread;
  const pendingRunId = thread.state === "ARCHIVED"
    ? undefined
    : latestPendingRunId(thread);
  if (!pendingRunId) {
    await progress(options, thread.threadId, undefined, 0);
    return {
      mode: "THREAD",
      result: {
        ok: true,
        result: JSON.parse(JSON.stringify({ thread })) as JsonValue
      },
      thread,
      threadId: thread.threadId,
      resumeCount: 0,
      transcript: transcriptFromThreadV010(thread)
    };
  }

  const resumed = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.resume",
    "chat.thread.resume",
    {
      threadId: thread.threadId,
      runId: pendingRunId,
      ...scopeValues(options.request)
    }
  ));
  return drain(options, resumed, thread.threadId);
}

export async function executeThreadBackedChatV010(
  options: ThreadBackedChatOptionsV010
): Promise<ThreadBackedChatExecutionV010 | undefined> {
  const message = options.request.values.message;
  if (typeof message !== "string" || !message.trim()) {
    return {
      mode: "THREAD",
      result: errorResult("MESSAGE_REQUIRED", "A chat message is required."),
      resumeCount: 0,
      transcript: []
    };
  }

  const resolved = await resolveConversationThreadV010(options);
  if (resolved.unavailable) return undefined;
  if (!resolved.thread) {
    return {
      mode: "THREAD",
      result: resolved.result ?? errorResult(
        "EIDOS_CONVERSATION_THREAD_RESPONSE_INVALID",
        "Unable to resolve durable conversation thread."
      ),
      resumeCount: 0,
      transcript: []
    };
  }

  const threadId = resolved.thread.threadId;
  const sent = await options.actionHost.execute(commandRequest(
    options.request,
    "enterprise-agent.thread.send",
    "chat.thread.send",
    {
      threadId,
      message: message.trim(),
      ...turnContextValues(options.request)
    }
  ));
  if (threadActionsUnavailableV010(sent)) return undefined;
  return drain(options, sent, threadId);
}

export function threadBackedChatStorageKeyV010(
  sourceInteractionId: string
): string {
  return "eidos:personal-agent-thread:" + sourceInteractionId;
}
