import { assertValidUidl } from "../runtime/validate.js";
import type { ActionRequestV010, JsonValue } from "../runtime/contracts.js";
import type { ActionHost } from "../adapters/ports.js";
import {
  isChatExperienceV010,
  isChatExperienceV020,
  renderChatMessageToHtml,
  type ChatMessageV010,
  type ChatMessageV020
} from "../chat/index.js";
import {
  isSettingsEditorV010,
  isSettingsEditorV020,
  type SettingsFieldV010
} from "../settings/index.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type { AppHostLoadedPageV010 } from "./contracts.js";
import { executeAppHostPageAction } from "./action-executor.js";
import { renderAppHostPageToHtml } from "./page-renderer.js";
import {
  executeRunBackedChatV010,
  recoverRunBackedChatV010,
  runBackedChatStorageKeyV010,
  type RunBackedChatProgressV010
} from "./personal-agent-run-chat.js";
import {
  executeThreadBackedChatV010,
  recoverThreadBackedChatV010,
  threadBackedChatStorageKeyV010,
  type ThreadBackedChatExecutionV010
} from "./personal-agent-thread-chat.js";

export interface AppHostChatState {
  messages: Array<ChatMessageV010 | ChatMessageV020>;
  activeRunId?: string;
  activeThreadId?: string;
}


export interface ChatConversationHistoryItemV010 {
  role: "user" | "assistant";
  content: string;
}

function chatMessageContentForHistory(
  message: ChatMessageV010 | ChatMessageV020
): string {
  if ("text" in message) return message.text.trim();

  return message.parts
    .flatMap(part => {
      if (part.type === "text") return [part.text];
      if (part.type === "notice") {
        return [[part.title, part.text].filter(Boolean).join(": ")];
      }
      if (part.type === "proposal") {
        return [[
          part.title,
          part.summary,
          ...(part.reasons ?? [])
        ].filter(Boolean).join("\n")];
      }
      return [];
    })
    .join("\n\n")
    .trim();
}

export function createChatConversationHistoryV010(
  messages: readonly (ChatMessageV010 | ChatMessageV020)[],
  options: {
    maxMessages?: number;
    maxTotalCharacters?: number;
    maxCharactersPerMessage?: number;
  } = {}
): ChatConversationHistoryItemV010[] {
  const maxMessages = options.maxMessages ?? 16;
  const maxTotalCharacters = options.maxTotalCharacters ?? 24_000;
  const maxCharactersPerMessage = options.maxCharactersPerMessage ?? 8_000;

  const candidates = messages
    .filter(message => message.role === "user" || message.role === "assistant")
    .map(message => ({
      role: message.role as "user" | "assistant",
      content: chatMessageContentForHistory(message).slice(0, maxCharactersPerMessage)
    }))
    .filter(message => message.content.length > 0)
    .slice(-maxMessages);

  const selected: ChatConversationHistoryItemV010[] = [];
  let characters = 0;
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const item = candidates[index];
    if (characters + item.content.length > maxTotalCharacters) break;
    selected.push(item);
    characters += item.content.length;
  }

  return selected.reverse();
}

export interface MountAppHostPageOptions {
  page: AppHostLoadedPageV010;
  container: HTMLElement;
  renderPage?: (page: AppHostLoadedPageV010) => string | Node;
  actionHost?: ActionHost;
  localization?: LocalizationRuntime;
  onNavigate?: (route: string) => void | Promise<void>;
  onActionResult?: (result: unknown, page: AppHostLoadedPageV010) => void | Promise<void>;
  chatState?: AppHostChatState;
}

export interface MountedAppHostPage {
  dispose(): void;
}


export const APP_HOST_ACTION_SELECTOR =
  "[data-eidos-catalog-action],[data-eidos-extension-action],[data-eidos-setup-action],[data-eidos-chat-action],[data-eidos-review-action]";

export function bindDelegatedAppHostActionsV010(
  container: HTMLElement,
  onAction: (button: HTMLButtonElement) => void | Promise<void>
): () => void {
  const handler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>(APP_HOST_ACTION_SELECTOR);
    if (!button || !container.contains(button)) return;
    void onAction(button);
  };
  container.addEventListener("click", handler);
  return () => container.removeEventListener("click", handler);
}

function collectFormValues(
  form: HTMLFormElement,
  definition: unknown
): Record<string, JsonValue> {
  const document = assertValidUidl(definition);
  const values: Record<string, JsonValue> = {};

  for (const field of document.fields) {
    const control = form.elements.namedItem(field.key);
    if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) continue;

    const raw = control.value;
    if (raw === "") {
      values[field.key] = "";
      continue;
    }

    if (field.control === "number" || field.control === "money") {
      values[field.key] = Number(raw);
      continue;
    }

    if (field.control === "select" && control instanceof HTMLSelectElement) {
      const selected = control.selectedOptions[0];
      const valueType = selected?.dataset.valueType;
      if (valueType === "number") values[field.key] = Number(raw);
      else if (valueType === "boolean") values[field.key] = raw === "true";
      else values[field.key] = raw;
      continue;
    }

    values[field.key] = raw;
  }

  return values;
}

function resultMessage(result: unknown): string {
  if (result !== null && typeof result === "object" && !Array.isArray(result)) {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return JSON.stringify(result ?? { ok: true }, null, 2);
}

function settingsFields(definition: unknown): SettingsFieldV010[] {
  if (isSettingsEditorV010(definition)) return definition.settings;
  if (isSettingsEditorV020(definition)) return definition.groups.flatMap(group => group.settings);
  return [];
}

function resultMessageV020(
  result: unknown,
  id: string,
  ok: boolean,
  fallbackError?: string
): ChatMessageV020 {
  if (ok && result !== null && typeof result === "object" && !Array.isArray(result)) {
    const parts = (result as { messageParts?: unknown }).messageParts;
    if (Array.isArray(parts)) {
      return {
        id,
        contractVersion: "0.2.0",
        role: "assistant",
        parts: structuredClone(parts) as ChatMessageV020["parts"]
      };
    }
  }
  return {
    id,
    contractVersion: "0.2.0",
    role: ok ? "assistant" : "error",
    parts: ok
      ? [{ type: "text", text: resultMessage(result) }]
      : [{ type: "notice", tone: "danger", text: fallbackError ?? "Unknown action error" }]
  };
}

function browserSessionStorage(): Storage | undefined {
  try {
    return typeof globalThis.sessionStorage === "undefined"
      ? undefined
      : globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

function runProgressMessageV020(
  id: string,
  progress: RunBackedChatProgressV010
): ChatMessageV020 {
  const terminalError = ["BLOCKED", "FAILED", "CANCELLED"].includes(progress.state);
  return {
    id,
    contractVersion: "0.2.0",
    role: "system",
    parts: [{
      type: "activity",
      label: "Personal Agent",
      state: progress.state === "SUCCEEDED"
        ? "complete"
        : terminalError
          ? "error"
          : "pending",
      detail: [
        progress.state,
        typeof progress.sliceCount === "number"
          ? "slice " + progress.sliceCount
          : undefined,
        progress.resumeCount > 0
          ? "resume " + progress.resumeCount
          : undefined
      ].filter(Boolean).join(" · ")
    }]
  };
}

export function mountAppHostLoadedPage(options: MountAppHostPageOptions): MountedAppHostPage {
  const { page, container, localization } = options;
  const renderPage = options.renderPage ?? ((value: AppHostLoadedPageV010) =>
    renderAppHostPageToHtml(value, localization));
  const listeners: Array<() => void> = [];

  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;

  const rendered = renderPage(page);
  if (typeof rendered === "string") container.innerHTML = rendered;
  else container.replaceChildren(rendered);

  const catalogSearch = container.querySelector<HTMLInputElement>(
    "[data-eidos-catalog-search-input]"
  );
  if (catalogSearch) {
    const catalogItems = Array.from(
      container.querySelectorAll<HTMLElement>("[data-eidos-catalog-item]")
    );
    const noResults = container.querySelector<HTMLElement>("[data-eidos-catalog-search-empty]");
    const filterCatalog = () => {
      const query = catalogSearch.value.trim().toLocaleLowerCase();
      let visible = 0;
      for (const item of catalogItems) {
        const haystack = item.dataset.eidosCatalogSearchText ?? item.textContent?.toLocaleLowerCase() ?? "";
        const matches = !query || haystack.includes(query);
        item.hidden = !matches;
        if (matches) visible += 1;
      }
      if (noResults) noResults.hidden = visible !== 0 || query.length === 0;
    };
    catalogSearch.addEventListener("input", filterCatalog);
    listeners.push(() => catalogSearch.removeEventListener("input", filterCatalog));
  }

  let actionStatus: HTMLPreElement | undefined;

  const ensureActionStatus = (): HTMLPreElement => {
    if (actionStatus) return actionStatus;
    actionStatus = document.createElement("pre");
    actionStatus.setAttribute("data-eidos-action-status", "");
    actionStatus.setAttribute("role", "status");
    actionStatus.style.marginTop = "12px";
    container.appendChild(actionStatus);
    return actionStatus;
  };

  const executeHostAction = async (button: HTMLButtonElement): Promise<void> => {
    try {
      const status = () => ensureActionStatus();

      if (button.disabled) {
        status().textContent = button.dataset.eidosDisabledReason
          ?? hostText("shell.actionUnavailable", "This action is not available yet.");
        return;
      }

      const actionType = button.dataset.eidosActionType;
      const route = button.dataset.eidosRoute;

      if (actionType === "navigate") {
        if (!route) throw new Error("EIDOS_CATALOG_NAVIGATE_ROUTE_REQUIRED");
        await options.onNavigate?.(route);
        return;
      }

      if (actionType === "prompt") {
        const prompt = button.dataset.eidosChatPrompt;
        const composer = container.querySelector<HTMLTextAreaElement>(
          "[data-eidos-chat-composer] textarea"
        );
        if (!prompt || !composer) {
          throw new Error("EIDOS_CHAT_PROMPT_TARGET_REQUIRED");
        }
        composer.value = prompt;
        composer.focus();
        return;
      }

      if (actionType !== "command") return;

      if (!options.actionHost) {
        status().textContent = hostText(
          "shell.noActionHost",
          "No App Host ActionHost is configured."
        );
        return;
      }

      const command = button.dataset.eidosCommand;
      const itemId = button.dataset.eidosItemId;
      if (!command) {
        status().textContent = hostText(
          "shell.actionIncomplete",
          "Command action is incomplete."
        );
        return;
      }

      if (
        button.dataset.eidosConfirm === "true"
        && !window.confirm(button.textContent ?? hostText("shell.confirm", "Confirm action?"))
      ) {
        return;
      }

      button.disabled = true;
      status().textContent = hostText("shell.executing", "Executing…");

      try {
        const request: ActionRequestV010 = {
          contractVersion: "0.1.0",
          type: "command",
          command: {
            code: command,
            inputVersion: button.dataset.eidosInputVersion ?? "0.1.0"
          },
          values: (() => {
            const values: Record<string, JsonValue> = {
              ...(itemId ? { itemId } : {}),
              confirmed: button.dataset.eidosConfirm === "true"
            };
            if (button.dataset.eidosReviewAction) {
              const form = button.closest<HTMLFormElement>("[data-eidos-review-form]");
              if (form) {
                const controls = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
                  "[data-eidos-review-field]"
                );
                for (const control of Array.from(controls)) {
                  if (control.disabled) continue;
                  const key = control.dataset.eidosReviewField;
                  if (!key) continue;
                  if (control instanceof HTMLSelectElement) {
                    const encoded = control.selectedOptions[0]?.dataset.valueJson;
                    if (encoded !== undefined) {
                      values[key] = JSON.parse(encoded) as JsonValue;
                      continue;
                    }
                  }
                  values[key] = control.value;
                }
              }
            }
            return values;
          })(),
          sourceInteractionId: (page.definition as { id?: string }).id ?? page.page.id,
          actionId: button.dataset.eidosCatalogAction
            ?? button.dataset.eidosExtensionAction
            ?? button.dataset.eidosSetupAction
            ?? button.dataset.eidosChatAction
            ?? button.dataset.eidosReviewAction
            ?? command,
          requiresConfirmation: button.dataset.eidosConfirm === "true"
        };

        const result = await options.actionHost.execute(request);
        if (result.ok) {
          const payload = result.result;
          if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
            const message = (payload as { message?: unknown }).message;
            const nextAction = (payload as { nextAction?: unknown }).nextAction;
            const details = JSON.stringify(payload, null, 2);
            status().textContent = [
              typeof message === "string"
                ? message
                : hostText("shell.completed", "Completed."),
              typeof nextAction === "string"
                ? hostText("shell.next", "Next: {next}", { next: nextAction })
                : "",
              details
            ].filter(Boolean).join("\n\n");
          } else {
            status().textContent = JSON.stringify(payload ?? { ok: true }, null, 2);
          }
        } else {
          status().textContent = hostText(
            "shell.actionFailed",
            "Action failed: {message}",
            { message: result.error?.message ?? "Unknown action error" }
          );
        }

        await options.onActionResult?.(result, page);
      } finally {
        button.disabled = false;
      }
    } catch (error) {
      ensureActionStatus().textContent = hostText(
        "shell.actionFailed",
        "Action failed: {message}",
        { message: error instanceof Error ? error.message : String(error) }
      );
    }
  };

  listeners.push(bindDelegatedAppHostActionsV010(container, executeHostAction));

  const definition = page.definition;
  if (isChatExperienceV010(definition) || isChatExperienceV020(definition)) {
    const state = options.chatState ?? { messages: [] };
    const transcript = container.querySelector<HTMLElement>("[data-eidos-chat-transcript]");
    const form = container.querySelector<HTMLFormElement>("[data-eidos-chat-composer]");
    const textarea = form?.elements.namedItem(definition.composer.key);

    const renderTranscript = () => {
      if (!transcript) return;
      transcript.innerHTML = state.messages.map(renderChatMessageToHtml).join("");
      transcript.scrollTop = transcript.scrollHeight;
    };

    const runBacked = definition.command.code === "enterprise-agent.chat";
    const threadBacked = runBacked && definition.contractVersion === "0.2.0";
    const runStorage = browserSessionStorage();
    const runStorageKey = runBacked
      ? runBackedChatStorageKeyV010(definition.id)
      : undefined;
    const threadStorageKey = threadBacked
      ? threadBackedChatStorageKeyV010(definition.id)
      : undefined;
    let runProgressMessageId: string | undefined;
    let runTransportInFlight = false;

    const persistRunId = (runId: string | undefined): void => {
      state.activeRunId = runId;
      if (!runStorage || !runStorageKey) return;
      try {
        if (runId) runStorage.setItem(runStorageKey, runId);
        else runStorage.removeItem(runStorageKey);
      } catch {
        // Session storage is an experience convenience only. Host run state remains authoritative.
      }
    };

    const storedRunId = (): string | undefined => {
      if (state.activeRunId) return state.activeRunId;
      if (!runStorage || !runStorageKey) return undefined;
      try {
        return runStorage.getItem(runStorageKey) ?? undefined;
      } catch {
        return undefined;
      }
    };

    const persistThreadId = (threadId: string | undefined): void => {
      state.activeThreadId = threadId;
      if (!runStorage || !threadStorageKey) return;
      try {
        if (threadId) runStorage.setItem(threadStorageKey, threadId);
        else runStorage.removeItem(threadStorageKey);
      } catch {
        // Host thread state is authoritative; session storage is only a fast recovery hint.
      }
    };

    const storedThreadId = (): string | undefined => {
      if (state.activeThreadId) return state.activeThreadId;
      if (!runStorage || !threadStorageKey) return undefined;
      try {
        return runStorage.getItem(threadStorageKey) ?? undefined;
      } catch {
        return undefined;
      }
    };

    const applyThreadExecution = (
      execution: ThreadBackedChatExecutionV010
    ): void => {
      if (execution.threadId) persistThreadId(execution.threadId);
      state.messages = execution.transcript.map(message => structuredClone(message));
      renderTranscript();
    };

    const onRunProgress = async (progress: RunBackedChatProgressV010): Promise<void> => {
      persistRunId(progress.runId);
      if (definition.contractVersion !== "0.2.0") return;
      runProgressMessageId ??= "run-" + progress.runId;
      const next = runProgressMessageV020(runProgressMessageId, progress);
      const index = state.messages.findIndex(message => message.id === runProgressMessageId);
      if (index >= 0) state.messages[index] = next;
      else state.messages.push(next);
      renderTranscript();
    };

    const contextValues = (): Record<string, JsonValue> => {
      const values: Record<string, JsonValue> = {};
      if (definition.contractVersion === "0.2.0" && definition.context?.selector) {
        const selector = container.querySelector<HTMLSelectElement>("[data-eidos-chat-context-selector]");
        const selected = selector?.selectedOptions[0]?.dataset.eidosChatContextValue;
        if (selected) {
          values[definition.context.selector.key] = JSON.parse(selected) as JsonValue;
        }
      }
      return values;
    };

    const baseChatRequest = (
      values: Record<string, JsonValue>,
      actionId = "chat.send"
    ): ActionRequestV010 => ({
      contractVersion: "0.1.0",
      type: "command",
      command: { ...definition.command },
      values,
      sourceInteractionId: definition.id,
      actionId,
      requiresConfirmation: false
    });

    const appendChatResult = async (
      result: Awaited<ReturnType<ActionHost["execute"]>>
    ): Promise<void> => {
      const resultId = `${result.ok ? "assistant" : "error"}-${Date.now()}-${state.messages.length}`;
      state.messages.push(definition.contractVersion === "0.2.0"
        ? resultMessageV020(
            result.result,
            resultId,
            result.ok,
            result.error?.message ?? "Unknown action error"
          )
        : {
            id: resultId,
            role: result.ok ? "assistant" : "error",
            text: result.ok
              ? resultMessage(result.result)
              : result.error?.message ?? "Unknown action error"
          });
      renderTranscript();
      await options.onActionResult?.(result, page);
    };

    renderTranscript();

    if (form && textarea instanceof HTMLTextAreaElement) {
      const submit = async () => {
        const message = textarea.value.trim();
        if (!message) return;

        const conversationHistory = definition.contractVersion === "0.2.0"
          ? createChatConversationHistoryV010(state.messages)
          : [];

        state.messages.push(definition.contractVersion === "0.2.0"
          ? {
              id: `user-${Date.now()}-${state.messages.length}`,
              contractVersion: "0.2.0",
              role: "user",
              parts: [{ type: "text", text: message }]
            }
          : {
              id: `user-${Date.now()}-${state.messages.length}`,
              role: "user",
              text: message
            });
        textarea.value = "";
        renderTranscript();

        if (!options.actionHost) {
          state.messages.push(definition.contractVersion === "0.2.0"
            ? {
                id: `error-${Date.now()}-${state.messages.length}`,
                contractVersion: "0.2.0",
                role: "error",
                parts: [{
                  type: "notice",
                  tone: "danger",
                  text: hostText("shell.noActionHost", "No App Host ActionHost is configured.")
                }]
              }
            : {
                id: `error-${Date.now()}-${state.messages.length}`,
                role: "error",
                text: hostText("shell.noActionHost", "No App Host ActionHost is configured.")
              });
          renderTranscript();
          return;
        }

        const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (button) button.disabled = true;

        try {
          const values: Record<string, JsonValue> = {
            [definition.composer.key]: message,
            message,
            ...(definition.contractVersion === "0.2.0" && conversationHistory.length
              ? {
                  conversationHistory: conversationHistory.map(item => ({
                    role: item.role,
                    content: item.content
                  }))
                }
              : {}),
            ...contextValues()
          };

          const request = baseChatRequest(values);
          runTransportInFlight = true;

          const threadExecution = threadBacked
            ? await executeThreadBackedChatV010({
                actionHost: options.actionHost,
                request,
                threadId: storedThreadId(),
                onProgress: async progress => {
                  if (progress.runId && progress.state) {
                    await onRunProgress({
                      runId: progress.runId,
                      state: progress.state,
                      resumeCount: progress.resumeCount
                    });
                  }
                }
              })
            : undefined;

          if (threadExecution) {
            persistRunId(undefined);
            applyThreadExecution(threadExecution);
            if (!threadExecution.result.ok) {
              await appendChatResult(threadExecution.result);
            } else {
              await options.onActionResult?.(threadExecution.result, page);
            }
          } else {
            const execution = runBacked
              ? await executeRunBackedChatV010({
                  actionHost: options.actionHost,
                  request,
                  onProgress: onRunProgress
                })
              : {
                  mode: "LEGACY" as const,
                  result: await options.actionHost.execute(request),
                  resumeCount: 0
                };
            if (execution.mode === "LEGACY") persistRunId(undefined);
            if (
              execution.mode === "RUN"
              && execution.runState
              && ["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"].includes(execution.runState)
            ) {
              persistRunId(undefined);
            }
            await appendChatResult(execution.result);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          state.messages.push(definition.contractVersion === "0.2.0"
            ? {
                id: `error-${Date.now()}-${state.messages.length}`,
                contractVersion: "0.2.0",
                role: "error",
                parts: [{ type: "notice", tone: "danger", text: message }]
              }
            : {
                id: `error-${Date.now()}-${state.messages.length}`,
                role: "error",
                text: message
              });
          renderTranscript();
        } finally {
          runTransportInFlight = false;
          if (button) button.disabled = false;
          textarea.focus();
        }
      };

      const recoverDurableRun = async (): Promise<void> => {
        if (!runBacked || !options.actionHost || runTransportInFlight) return;
        const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        runTransportInFlight = true;
        if (button) button.disabled = true;
        try {
          const request = baseChatRequest(contextValues(), "chat.recover");

          const threadRecovered = threadBacked
            ? await recoverThreadBackedChatV010({
                actionHost: options.actionHost,
                request,
                threadId: storedThreadId(),
                onProgress: async progress => {
                  if (progress.runId && progress.state) {
                    await onRunProgress({
                      runId: progress.runId,
                      state: progress.state,
                      resumeCount: progress.resumeCount
                    });
                  }
                }
              })
            : undefined;

          if (threadRecovered) {
            persistRunId(undefined);
            applyThreadExecution(threadRecovered);
            if (!threadRecovered.result.ok) {
              await appendChatResult(threadRecovered.result);
            } else {
              await options.onActionResult?.(threadRecovered.result, page);
            }
            return;
          }

          const recovered = await recoverRunBackedChatV010({
            actionHost: options.actionHost,
            request,
            runId: storedRunId(),
            onProgress: onRunProgress
          });
          if (!recovered) {
            persistRunId(undefined);
            return;
          }
          if (
            recovered.runState
            && ["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"].includes(recovered.runState)
          ) {
            persistRunId(undefined);
          }
          if (recovered.result.ok || recovered.result.error) {
            await appendChatResult(recovered.result);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await appendChatResult({
            ok: false,
            error: {
              code: "EIDOS_AGENT_RUN_RECOVERY_FAILED",
              message
            }
          });
        } finally {
          runTransportInFlight = false;
          if (button) button.disabled = false;
        }
      };

      if (runBacked) {
        void recoverDurableRun();
      }

      const submitHandler = (event: SubmitEvent) => {
        event.preventDefault();
        void submit();
      };
      const keyHandler = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          void submit();
        }
      };
      form.addEventListener("submit", submitHandler);
      textarea.addEventListener("keydown", keyHandler);
      listeners.push(() => form.removeEventListener("submit", submitHandler));
      listeners.push(() => textarea.removeEventListener("keydown", keyHandler));

      const suggestions = container.querySelectorAll<HTMLButtonElement>("[data-eidos-chat-suggestion]");
      for (const suggestion of Array.from(suggestions)) {
        const handler = () => {
          textarea.value = suggestion.dataset.eidosChatPrompt ?? "";
          textarea.focus();
        };
        suggestion.addEventListener("click", handler);
        listeners.push(() => suggestion.removeEventListener("click", handler));
      }
    }

    return {
      dispose() {
        for (const dispose of listeners) dispose();
      }
    };
  }

  if (isSettingsEditorV010(definition) || isSettingsEditorV020(definition)) {
    const form = container.querySelector<HTMLFormElement>("[data-eidos-settings-form]");
    const status = document.createElement("div");
    status.setAttribute("data-eidos-action-status", "");
    status.setAttribute("role", "status");
    container.appendChild(status);

    if (form) {
      const submitHandler = (event: SubmitEvent) => {
        event.preventDefault();
        void (async () => {
          if (!options.actionHost) {
            status.textContent = hostText("shell.noActionHost", "No App Host ActionHost is configured.");
            return;
          }

          const values: Record<string, JsonValue> = {};
          for (const field of settingsFields(definition)) {
            const control = form.elements.namedItem(field.key);
            if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) continue;
            if (field.readOnly) continue;

            if (field.type === "boolean" && control instanceof HTMLInputElement) {
              values[field.key] = control.checked;
            } else if (field.type === "number") {
              values[field.key] = Number(control.value);
            } else if (field.type === "select" && control instanceof HTMLSelectElement) {
              const selected = control.selectedOptions[0];
              const valueType = selected?.dataset.valueType;
              if (valueType === "number") values[field.key] = Number(control.value);
              else if (valueType === "boolean") values[field.key] = control.value === "true";
              else values[field.key] = control.value;
            } else {
              values[field.key] = control.value;
            }
          }

          const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (button) button.disabled = true;
          status.textContent = hostText("shell.executing", "Executing…");

          try {
            const request: ActionRequestV010 = {
              contractVersion: "0.1.0",
              type: "command",
              command: { ...definition.command },
              values: {
                namespace: definition.namespace,
                settings: values
              },
              sourceInteractionId: definition.id,
              actionId: "settings.save",
              requiresConfirmation: false
            };
            const result = await options.actionHost.execute(request);
            status.textContent = result.ok
              ? hostText("shell.settingsSaved", "Settings saved.")
              : hostText(
                  "shell.actionFailed",
                  "Action failed: {message}",
                  { message: result.error?.message ?? "Unknown action error" }
                );
            await options.onActionResult?.(result, page);
          } catch (error) {
            status.textContent = hostText(
              "shell.actionFailed",
              "Action failed: {message}",
              { message: error instanceof Error ? error.message : String(error) }
            );
          } finally {
            if (button) button.disabled = false;
          }
        })();
      };

      form.addEventListener("submit", submitHandler);
      listeners.push(() => form.removeEventListener("submit", submitHandler));
    }

    return {
      dispose() {
        for (const dispose of listeners) dispose();
      }
    };
  }

  const form = container.querySelector<HTMLFormElement>("form[data-eidos-id]");
  if (form) {
    const actionStatus = document.createElement("div");
    actionStatus.setAttribute("data-eidos-action-status", "");
    actionStatus.setAttribute("role", "status");
    actionStatus.style.marginTop = "12px";
    container.appendChild(actionStatus);

    const submitHandler = (event: SubmitEvent) => {
      event.preventDefault();
      void (async () => {
        if (!options.actionHost) {
          actionStatus.textContent = hostText(
            "shell.noActionHost",
            "No App Host ActionHost is configured."
          );
          return;
        }

        const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submit) submit.disabled = true;
        actionStatus.textContent = hostText("shell.executing", "Executing…");

        try {
          const values = collectFormValues(form, page.definition);
          const execution = await executeAppHostPageAction(page, values, options.actionHost);
          actionStatus.textContent = execution.result.ok
            ? hostText("shell.completed", "Completed.")
            : hostText(
                "shell.actionFailed",
                "Action failed: {message}",
                { message: execution.result.error?.message ?? "Unknown action error" }
              );
          await options.onActionResult?.(execution.result, page);
        } catch (error) {
          actionStatus.textContent = hostText(
            "shell.actionFailed",
            "Action failed: {message}",
            { message: error instanceof Error ? error.message : String(error) }
          );
        } finally {
          if (submit) submit.disabled = false;
        }
      })();
    };

    form.addEventListener("submit", submitHandler);
    listeners.push(() => form.removeEventListener("submit", submitHandler));
  }

  return {
    dispose() {
      for (const dispose of listeners) dispose();
    }
  };
}
