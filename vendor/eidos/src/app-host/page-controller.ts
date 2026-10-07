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
import {
  isDiagramEditorPageV010,
  mountDiagramEditorPageV010
} from "../diagram/surface.js";
import {
  isSpatialObservatoryPageV010,
  mountSpatialObservatoryPageV010
} from "../spatial/surface.js";
import { executeAppHostPageAction } from "./action-executor.js";
import { renderAppHostPageToHtml } from "./page-renderer.js";
import { actionResultDownloadV010 } from "./action-download.js";
import {
  executeRunBackedChatV010,
  recoverRunBackedChatV010,
  runBackedChatStorageKeyV010,
  type RunBackedChatProgressV010
} from "./personal-agent-run-chat.js";
import {
  archiveConversationThreadV010,
  createConversationThreadV010,
  executeThreadBackedChatV010,
  getConversationThreadV010,
  listConversationThreadsV010,
  recoverThreadBackedChatV010,
  threadBackedChatStorageKeyV010,
  transcriptFromThreadV010,
  type ThreadBackedChatExecutionV010,
  type ThreadBackedThreadV010
} from "./personal-agent-thread-chat.js";

export interface AppHostChatState {
  messages: Array<ChatMessageV010 | ChatMessageV020>;
  activeRunId?: string;
  activeThreadId?: string;
  activeThreadState?: "ACTIVE" | "ARCHIVED";
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

export interface AppHostActionRenderHintV010 {
  /**
   * The mounted surface has already applied the action result locally.
   * Shells may refresh navigation/provider chrome, but must not tear down
   * and remount the current page.
   */
  preserveMountedPage?: boolean;
}

export interface MountAppHostPageOptions {
  page: AppHostLoadedPageV010;
  container: HTMLElement;
  renderPage?: (page: AppHostLoadedPageV010) => string | Node;
  actionHost?: ActionHost;
  localization?: LocalizationRuntime;
  onNavigate?: (route: string) => void | Promise<void>;
  onActionResult?: (
    result: unknown,
    page: AppHostLoadedPageV010,
    renderHint?: AppHostActionRenderHintV010
  ) => void | Promise<void>;
  chatState?: AppHostChatState;
}

export interface MountedAppHostPage {
  resourceIds?: readonly string[];
  refresh?(): Promise<void>;
  dispose(): void;
}


export const APP_HOST_ACTION_SELECTOR =
  "[data-eidos-catalog-action],[data-eidos-extension-action],[data-eidos-setup-action],[data-eidos-chat-action],[data-eidos-review-action],[data-eidos-task-action]";

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

function arrayBufferToBase64V010(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length))
    );
  }
  return globalThis.btoa(binary);
}

async function collectFormValues(
  form: HTMLFormElement,
  definition: unknown
): Promise<Record<string, JsonValue>> {
  const document = assertValidUidl(definition);
  const values: Record<string, JsonValue> = {};

  for (const field of document.fields) {
    const control = form.elements.namedItem(field.key);
    if (
      !(control instanceof HTMLInputElement)
      && !(control instanceof HTMLSelectElement)
    ) {
      continue;
    }

    if (field.control === "file" && control instanceof HTMLInputElement) {
      const file = control.files?.[0];
      if (!file) {
        values[field.key] = "";
        continue;
      }
      if (field.maxBytes !== undefined && file.size > field.maxBytes) {
        throw new Error("EIDOS_FILE_TOO_LARGE");
      }
      values[field.key] = {
        name: file.name,
        mediaType: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: arrayBufferToBase64V010(await file.arrayBuffer())
      };
      continue;
    }

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

export function formatAppHostActionResultV010(result: unknown): string {
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
      ? [{ type: "text", text: formatAppHostActionResultV010(result) }]
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

export interface AppHostJourneyContinuationV010 {
  targetRoute: string;
  onActionId: string;
  returnRoute: string;
  onItemIds?: string[];
  createdAt: number;
}

export interface JourneyContinuationStorageV010 {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const JOURNEY_CONTINUATION_PREFIX = "eidos.journey.continuation:";
const JOURNEY_CONTINUATION_TTL_MS = 30 * 60 * 1000;

export function journeyContinuationStorageKeyV010(targetRoute: string): string {
  return JOURNEY_CONTINUATION_PREFIX + targetRoute;
}

export function persistJourneyContinuationV010(
  targetRoute: string,
  onActionId: string,
  returnRoute: string,
  storage: JourneyContinuationStorageV010 | undefined = browserSessionStorage(),
  now = Date.now(),
  onItemIds?: readonly string[]
): void {
  if (!storage) return;
  if (!targetRoute.startsWith("/") || !returnRoute.startsWith("/") || !onActionId.trim()) {
    throw new Error("EIDOS_JOURNEY_CONTINUATION_INVALID");
  }
  const value: AppHostJourneyContinuationV010 = {
    targetRoute,
    onActionId,
    returnRoute,
    ...(onItemIds?.length ? { onItemIds: [...new Set(onItemIds)].sort() } : {}),
    createdAt: now
  };
  storage.setItem(journeyContinuationStorageKeyV010(targetRoute), JSON.stringify(value));
}

export function peekJourneyContinuationV010(
  targetRoute: string,
  storage: JourneyContinuationStorageV010 | undefined = browserSessionStorage(),
  now = Date.now()
): AppHostJourneyContinuationV010 | undefined {
  if (!storage) return undefined;
  const key = journeyContinuationStorageKeyV010(targetRoute);
  const raw = storage.getItem(key);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<AppHostJourneyContinuationV010>;
    const createdAt = value.createdAt;
    const valid = value.targetRoute === targetRoute
      && typeof value.onActionId === "string"
      && typeof value.returnRoute === "string"
      && value.returnRoute.startsWith("/")
      && typeof createdAt === "number"
      && Number.isFinite(createdAt);
    if (!valid || typeof createdAt !== "number" || now - createdAt > JOURNEY_CONTINUATION_TTL_MS) {
      storage.removeItem(key);
      return undefined;
    }
    return value as AppHostJourneyContinuationV010;
  } catch {
    storage.removeItem(key);
    return undefined;
  }
}

export function consumeJourneyContinuationV010(
  targetRoute: string,
  completedActionId: string,
  storage: JourneyContinuationStorageV010 | undefined = browserSessionStorage(),
  now = Date.now(),
  completedItemId?: string
): AppHostJourneyContinuationV010 | undefined {
  if (!storage) return undefined;
  const key = journeyContinuationStorageKeyV010(targetRoute);
  const raw = storage.getItem(key);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<AppHostJourneyContinuationV010>;
    const createdAt = value.createdAt;
    const valid = value.targetRoute === targetRoute
      && typeof value.onActionId === "string"
      && typeof value.returnRoute === "string"
      && value.returnRoute.startsWith("/")
      && typeof createdAt === "number"
      && Number.isFinite(createdAt);
    if (!valid || typeof createdAt !== "number" || now - createdAt > JOURNEY_CONTINUATION_TTL_MS) {
      storage.removeItem(key);
      return undefined;
    }
    if (value.onActionId !== completedActionId) return undefined;
    if (
      Array.isArray(value.onItemIds)
      && value.onItemIds.length > 0
      && (!completedItemId || !value.onItemIds.includes(completedItemId))
    ) return undefined;
    storage.removeItem(key);
    return value as AppHostJourneyContinuationV010;
  } catch {
    storage.removeItem(key);
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

  if (isDiagramEditorPageV010(page.definition)) {
    if (!options.actionHost) {
      throw new Error("EIDOS_DIAGRAM_EDITOR_ACTION_HOST_REQUIRED");
    }
    const mountedDiagram = mountDiagramEditorPageV010({
      definition: page.definition,
      container,
      actionHost: options.actionHost,
      onNavigate: options.onNavigate,
      onActionResult(result) {
        return options.onActionResult?.(
          result,
          page,
          { preserveMountedPage: true }
        );
      }
    });
    return {
      resourceIds: [page.definition.resourceId],
      refresh() {
        return mountedDiagram.refresh();
      },
      dispose() {
        mountedDiagram.dispose();
        for (const dispose of listeners) dispose();
      }
    };
  }

  if (isSpatialObservatoryPageV010(page.definition)) {
    if (!options.actionHost) {
      throw new Error("EIDOS_SPATIAL_OBSERVATORY_ACTION_HOST_REQUIRED");
    }
    const mountedSpatial = mountSpatialObservatoryPageV010({
      definition: page.definition,
      container,
      actionHost: options.actionHost,
      localization,
      onActionResult(result) {
        return options.onActionResult?.(
          result,
          page,
          { preserveMountedPage: true }
        );
      }
    });
    return {
      resourceIds: [page.definition.resourceId],
      refresh() {
        return mountedSpatial.refresh();
      },
      dispose() {
        mountedSpatial.dispose();
        for (const dispose of listeners) dispose();
      }
    };
  }

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
        const continuationActionId = button.dataset.eidosContinuationActionId;
        const continuationRoute = button.dataset.eidosContinuationRoute;
        const continuationItemIds = button.dataset.eidosContinuationItemIds
          ? JSON.parse(button.dataset.eidosContinuationItemIds) as string[]
          : undefined;
        if (continuationActionId || continuationRoute) {
          if (!continuationActionId || !continuationRoute) {
            throw new Error("EIDOS_JOURNEY_CONTINUATION_INCOMPLETE");
          }
          persistJourneyContinuationV010(
            route,
            continuationActionId,
            continuationRoute,
            undefined,
            Date.now(),
            continuationItemIds
          );
        }
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
            const rawActionValues = button.dataset.eidosActionValues;
            let actionValues: Record<string, JsonValue> = {};
            if (rawActionValues) {
              const parsed = JSON.parse(rawActionValues) as unknown;
              if (
                parsed === null
                || typeof parsed !== "object"
                || Array.isArray(parsed)
              ) {
                throw new Error("EIDOS_ACTION_VALUES_INVALID");
              }
              actionValues = parsed as Record<string, JsonValue>;
            }
            const values: Record<string, JsonValue> = {
              ...actionValues,
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
          const download = actionResultDownloadV010(payload);
          if (download) {
            const blob = new Blob([download.content], {
              type: download.mediaType
            });
            const href = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = href;
            anchor.download = download.fileName;
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(href), 0);

            const message = payload !== null
              && typeof payload === "object"
              && !Array.isArray(payload)
              ? (payload as { message?: unknown }).message
              : undefined;
            status().textContent = typeof message === "string"
              ? message
              : hostText("shell.completed", "Completed.");
          } else if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
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

        const navigateTo =
          result.ok
          && result.result !== null
          && typeof result.result === "object"
          && !Array.isArray(result.result)
          && typeof (result.result as { navigateTo?: unknown }).navigateTo === "string"
            ? (result.result as { navigateTo: string }).navigateTo.trim()
            : "";
        if (navigateTo && options.onNavigate) {
          if (!navigateTo.startsWith("/")) {
            throw new Error("EIDOS_ACTION_NAVIGATE_TARGET_INVALID");
          }
          await options.onNavigate(navigateTo);
        }

        const continuation = result.ok && options.onNavigate
          ? consumeJourneyContinuationV010(
              page.route.path,
              request.actionId,
              undefined,
              Date.now(),
              itemId
            )
          : undefined;
        if (continuation) {
          await options.onNavigate?.(continuation.returnRoute);
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

    const initialEmptyState = transcript
      ?.querySelector<HTMLElement>("[data-eidos-chat-empty]")
      ?.cloneNode(true) as HTMLElement | undefined;
    const renderedMessages = new Map<string, {
      html: string;
      element: HTMLElement;
    }>();
    let transcriptFrame: number | undefined;

    const patchTranscript = () => {
      if (!transcript) return;

      const distanceFromBottom =
        transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
      const keepPinnedToBottom = distanceFromBottom <= 72;
      const desiredIds = new Set(state.messages.map(message => message.id));

      for (const [id, rendered] of renderedMessages) {
        if (desiredIds.has(id)) continue;
        rendered.element.remove();
        renderedMessages.delete(id);
      }

      if (state.messages.length > 0) {
        transcript.querySelector("[data-eidos-chat-empty]")?.remove();
      }

      let previous: ChildNode | null = null;
      for (const message of state.messages) {
        const html = renderChatMessageToHtml(message);
        let rendered = renderedMessages.get(message.id);

        if (!rendered || rendered.html !== html) {
          const template = document.createElement("template");
          template.innerHTML = html.trim();
          const next = template.content.firstElementChild;
          if (!(next instanceof HTMLElement)) {
            throw new Error("EIDOS_CHAT_MESSAGE_RENDER_INVALID");
          }
          next.setAttribute("data-eidos-chat-message-id", message.id);

          if (rendered?.element.isConnected) {
            rendered.element.replaceWith(next);
          }
          rendered = { html, element: next };
          renderedMessages.set(message.id, rendered);
        }

        const desiredPosition: ChildNode | null = previous
          ? previous.nextSibling
          : transcript.firstChild;
        if (rendered.element !== desiredPosition) {
          transcript.insertBefore(rendered.element, desiredPosition);
        }
        previous = rendered.element;
      }

      if (state.messages.length === 0 && initialEmptyState) {
        const currentEmpty = transcript.querySelector("[data-eidos-chat-empty]");
        if (!currentEmpty) transcript.appendChild(initialEmptyState.cloneNode(true));
      }

      if (keepPinnedToBottom) {
        transcript.scrollTop = transcript.scrollHeight;
      }
    };

    const renderTranscript = () => {
      if (!transcript || transcriptFrame !== undefined) return;
      if (typeof globalThis.requestAnimationFrame !== "function") {
        patchTranscript();
        return;
      }
      transcriptFrame = globalThis.requestAnimationFrame(() => {
        transcriptFrame = undefined;
        patchTranscript();
      });
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
    const chatHeader = container.querySelector<HTMLElement>("[data-eidos-chat-header]");
    const threadControls = threadBacked && chatHeader
      ? document.createElement("div")
      : undefined;
    const threadSelect = threadControls
      ? document.createElement("select")
      : undefined;
    const newThreadButton = threadControls
      ? document.createElement("button")
      : undefined;
    const archiveThreadButton = threadControls
      ? document.createElement("button")
      : undefined;

    if (
      chatHeader
      && threadControls
      && threadSelect
      && newThreadButton
      && archiveThreadButton
    ) {
      threadControls.setAttribute("data-eidos-chat-thread-controls", "");
      threadSelect.setAttribute("data-eidos-chat-thread-selector", "");
      threadSelect.setAttribute(
        "aria-label",
        hostText("shell.chatHistory", "Conversation history")
      );
      newThreadButton.type = "button";
      newThreadButton.setAttribute("data-eidos-chat-new-thread", "");
      newThreadButton.textContent = hostText("shell.chatNew", "New chat");
      archiveThreadButton.type = "button";
      archiveThreadButton.setAttribute("data-eidos-chat-archive-thread", "");
      archiveThreadButton.textContent = hostText("shell.chatArchive", "Archive");
      threadControls.append(threadSelect, newThreadButton, archiveThreadButton);
      chatHeader.appendChild(threadControls);
    }

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

    const applyThread = (
      thread: ThreadBackedThreadV010
    ): void => {
      persistThreadId(thread.threadId);
      state.activeThreadState = thread.state;
      state.messages = transcriptFromThreadV010(thread)
        .map(message => structuredClone(message));
      renderTranscript();
      if (threadSelect) threadSelect.value = thread.threadId;
      if (archiveThreadButton) {
        archiveThreadButton.disabled = thread.state === "ARCHIVED";
      }
      if (textarea instanceof HTMLTextAreaElement) {
        const baseDisabled = definition.contractVersion === "0.2.0"
          && (
            definition.composer.disabled === true
            || (
              definition.readiness !== undefined
              && definition.readiness.state !== "ready"
            )
          );
        textarea.disabled = baseDisabled || thread.state === "ARCHIVED";
        const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitButton && !runTransportInFlight) {
          submitButton.disabled = baseDisabled || thread.state === "ARCHIVED";
        }
      }
    };

    const applyThreadExecution = (
      execution: ThreadBackedChatExecutionV010
    ): void => {
      if (execution.thread) {
        applyThread(execution.thread);
        return;
      }
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
      result: Awaited<ReturnType<ActionHost["execute"]>>,
      notifyActionResult = true
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
              ? formatAppHostActionResultV010(result.result)
              : result.error?.message ?? "Unknown action error"
          });
      renderTranscript();
      if (notifyActionResult) {
        await options.onActionResult?.(
          result,
          page,
          { preserveMountedPage: true }
        );
      }
    };

    renderTranscript();

    if (form && textarea instanceof HTMLTextAreaElement) {
      const threadOptions = (): Parameters<typeof recoverThreadBackedChatV010>[0] => ({
        actionHost: options.actionHost!,
        request: baseChatRequest(contextValues(), "chat.thread.manage")
      });

      const threadLabel = (thread: ThreadBackedThreadV010): string => {
        const firstUser = thread.messages.find(message => message.role === "USER");
        const base = thread.title?.trim()
          || firstUser?.content.trim().slice(0, 42)
          || hostText("shell.chatUntitled", "New chat");
        return thread.state === "ARCHIVED"
          ? hostText("shell.chatArchivedLabel", "[Archived] {title}", { title: base })
          : base;
      };

      const refreshThreadHistory = async (): Promise<void> => {
        if (!threadBacked || !options.actionHost || !threadSelect) return;
        const listed = await listConversationThreadsV010({
          ...threadOptions(),
          includeArchived: true
        });
        if (listed.unavailable || !listed.threads) return;

        const currentId = storedThreadId();
        threadSelect.replaceChildren();
        for (const thread of listed.threads) {
          const option = document.createElement("option");
          option.value = thread.threadId;
          option.textContent = threadLabel(thread);
          option.dataset.eidosChatThreadState = thread.state ?? "ACTIVE";
          option.selected = thread.threadId === currentId;
          threadSelect.appendChild(option);
        }
        if (
          currentId
          && !listed.threads.some(thread => thread.threadId === currentId)
        ) {
          persistThreadId(undefined);
        }
      };

      const openThread = async (threadId: string): Promise<void> => {
        if (!threadBacked || !options.actionHost || runTransportInFlight) return;
        const got = await getConversationThreadV010(threadOptions(), threadId);
        if (got.unavailable || !got.thread) {
          if (got.result && !got.result.ok) await appendChatResult(got.result);
          return;
        }

        if (got.thread.state === "ARCHIVED") {
          applyThread(got.thread);
          await refreshThreadHistory();
          return;
        }

        const recovered = await recoverThreadBackedChatV010({
          ...threadOptions(),
          threadId: got.thread.threadId,
          onProgress: async progress => {
            if (progress.runId && progress.state) {
              await onRunProgress({
                runId: progress.runId,
                state: progress.state,
                resumeCount: progress.resumeCount
              });
            }
          }
        });
        if (recovered) {
          persistRunId(undefined);
          applyThreadExecution(recovered);
          if (!recovered.result.ok) await appendChatResult(recovered.result);
        } else {
          applyThread(got.thread);
        }
        await refreshThreadHistory();
      };

      if (threadSelect) {
        const handler = () => {
          const threadId = threadSelect.value.trim();
          if (threadId) void openThread(threadId);
        };
        threadSelect.addEventListener("change", handler);
        listeners.push(() => threadSelect.removeEventListener("change", handler));
      }

      if (newThreadButton) {
        const handler = () => {
          void (async () => {
            if (!options.actionHost || runTransportInFlight) return;
            runTransportInFlight = true;
            newThreadButton.disabled = true;
            try {
              const created = await createConversationThreadV010(threadOptions());
              if (created.unavailable) return;
              if (!created.thread) {
                if (created.result) await appendChatResult(created.result);
                return;
              }
              persistRunId(undefined);
              applyThread(created.thread);
              await refreshThreadHistory();
              textarea.focus();
            } finally {
              runTransportInFlight = false;
              newThreadButton.disabled = false;
            }
          })();
        };
        newThreadButton.addEventListener("click", handler);
        listeners.push(() => newThreadButton.removeEventListener("click", handler));
      }

      if (archiveThreadButton) {
        const handler = () => {
          void (async () => {
            const threadId = storedThreadId();
            if (!options.actionHost || !threadId || runTransportInFlight) return;
            runTransportInFlight = true;
            archiveThreadButton.disabled = true;
            try {
              const archived = await archiveConversationThreadV010(
                threadOptions(),
                threadId
              );
              if (archived.unavailable) return;
              if (!archived.thread) {
                if (archived.result) await appendChatResult(archived.result);
                return;
              }
              applyThread(archived.thread);
              await refreshThreadHistory();
            } finally {
              runTransportInFlight = false;
              archiveThreadButton.disabled =
                state.activeThreadState === "ARCHIVED";
            }
          })();
        };
        archiveThreadButton.addEventListener("click", handler);
        listeners.push(() => archiveThreadButton.removeEventListener("click", handler));
      }

      if (threadBacked) void refreshThreadHistory();
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
              await options.onActionResult?.(
                threadExecution.result,
                page,
                { preserveMountedPage: true }
              );
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
          if (button) {
            button.disabled = state.activeThreadState === "ARCHIVED";
          }
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
            await refreshThreadHistory();
            if (!threadRecovered.result.ok) {
              await appendChatResult(threadRecovered.result, false);
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
            await appendChatResult(recovered.result, false);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await appendChatResult({
            ok: false,
            error: {
              code: "EIDOS_AGENT_RUN_RECOVERY_FAILED",
              message
            }
          }, false);
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
        if (
          transcriptFrame !== undefined
          && typeof globalThis.cancelAnimationFrame === "function"
        ) {
          globalThis.cancelAnimationFrame(transcriptFrame);
          transcriptFrame = undefined;
        }
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
      const pendingSettingsContinuation = peekJourneyContinuationV010(page.route.path);
      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (pendingSettingsContinuation?.onActionId === "settings.save") {
        if (submitButton) {
          submitButton.textContent = hostText(
            "shell.settingsSaveAndContinue",
            "Save and continue"
          );
        }
        const footer = form.querySelector<HTMLElement>("[data-eidos-settings-footer]");
        if (footer && options.onNavigate) {
          const returnButton = document.createElement("button");
          returnButton.type = "button";
          returnButton.setAttribute("data-eidos-settings-return", "");
          returnButton.textContent = hostText(
            "shell.settingsReturnWithoutSaving",
            "Return without saving"
          );
          const returnHandler = () => {
            const continuation = consumeJourneyContinuationV010(
              page.route.path,
              "settings.save"
            );
            if (continuation) void options.onNavigate?.(continuation.returnRoute);
          };
          returnButton.addEventListener("click", returnHandler);
          listeners.push(() => returnButton.removeEventListener("click", returnHandler));
          footer.prepend(returnButton);
        }
      }

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
            const continuation = result.ok && options.onNavigate
              ? consumeJourneyContinuationV010(page.route.path, "settings.save")
              : undefined;
            if (continuation) {
              await options.onNavigate?.(continuation.returnRoute);
            }
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
          const values = await collectFormValues(form, page.definition);
          const execution = await executeAppHostPageAction(page, values, options.actionHost);
          actionStatus.textContent = execution.result.ok
            ? formatAppHostActionResultV010(execution.result.result)
            : hostText(
                "shell.actionFailed",
                "Action failed: {message}",
                { message: execution.result.error?.message ?? "Unknown action error" }
              );
          const navigateTo =
            execution.result.ok
            && execution.result.result !== null
            && typeof execution.result.result === "object"
            && !Array.isArray(execution.result.result)
            && typeof (execution.result.result as { navigateTo?: unknown }).navigateTo === "string"
              ? (execution.result.result as { navigateTo: string }).navigateTo.trim()
              : "";
          if (navigateTo && options.onNavigate) {
            if (!navigateTo.startsWith("/")) {
              throw new Error("EIDOS_ACTION_NAVIGATE_TARGET_INVALID");
            }
            await options.onNavigate(navigateTo);
          }
          await options.onActionResult?.(
            execution.result,
            page,
            { preserveMountedPage: true }
          );
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
