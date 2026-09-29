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

export interface AppHostChatState {
  messages: Array<ChatMessageV010 | ChatMessageV020>;
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

function browserJourneyStorage(): JourneyContinuationStorageV010 | undefined {
  try {
    return typeof globalThis.sessionStorage === "undefined"
      ? undefined
      : globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function journeyContinuationStorageKeyV010(targetRoute: string): string {
  return JOURNEY_CONTINUATION_PREFIX + targetRoute;
}

export function persistJourneyContinuationV010(
  targetRoute: string,
  onActionId: string,
  returnRoute: string,
  storage: JourneyContinuationStorageV010 | undefined = browserJourneyStorage(),
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
  storage: JourneyContinuationStorageV010 | undefined = browserJourneyStorage(),
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
  storage: JourneyContinuationStorageV010 | undefined = browserJourneyStorage(),
  now = Date.now(),
  completedItemId?: string
): AppHostJourneyContinuationV010 | undefined {
  if (!storage) return undefined;
  const value = peekJourneyContinuationV010(targetRoute, storage, now);
  if (!value) return undefined;
  if (value.onActionId !== completedActionId) return undefined;
  if (
    Array.isArray(value.onItemIds)
    && value.onItemIds.length > 0
    && (!completedItemId || !value.onItemIds.includes(completedItemId))
  ) return undefined;
  storage.removeItem(journeyContinuationStorageKeyV010(targetRoute));
  return value;
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

  const hostActionButtons = container.querySelectorAll<HTMLButtonElement>(
    "[data-eidos-catalog-action],[data-eidos-extension-action],[data-eidos-setup-action],[data-eidos-chat-action],[data-eidos-review-action]"
  );
  if (hostActionButtons.length > 0) {
    const actionStatus = document.createElement("pre");
    actionStatus.setAttribute("data-eidos-action-status", "");
    actionStatus.setAttribute("role", "status");
    actionStatus.style.marginTop = "12px";
    container.appendChild(actionStatus);

    for (const button of Array.from(hostActionButtons)) {
      const handler = () => {
        void (async () => {
          if (button.disabled) {
            actionStatus.textContent = button.dataset.eidosDisabledReason
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
          if (actionType !== "command") return;

          if (!options.actionHost) {
            actionStatus.textContent = hostText(
              "shell.noActionHost",
              "No App Host ActionHost is configured."
            );
            return;
          }

          const command = button.dataset.eidosCommand;
          const itemId = button.dataset.eidosItemId;
          if (!command) {
            actionStatus.textContent = hostText(
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
          actionStatus.textContent = hostText("shell.executing", "Executing…");

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
                actionStatus.textContent = [
                  typeof message === "string"
                    ? message
                    : hostText("shell.completed", "Completed."),
                  typeof nextAction === "string"
                    ? hostText("shell.next", "Next: {next}", { next: nextAction })
                    : "",
                  details
                ].filter(Boolean).join("\n\n");
              } else {
                actionStatus.textContent = JSON.stringify(payload ?? { ok: true }, null, 2);
              }
            } else {
              actionStatus.textContent = hostText(
                "shell.actionFailed",
                "Action failed: {message}",
                { message: result.error?.message ?? "Unknown action error" }
              );
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
          } catch (error) {
            actionStatus.textContent = hostText(
              "shell.actionFailed",
              "Action failed: {message}",
              { message: error instanceof Error ? error.message : String(error) }
            );
          } finally {
            button.disabled = false;
          }
        })();
      };
      button.addEventListener("click", handler);
      listeners.push(() => button.removeEventListener("click", handler));
    }
  }

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

    renderTranscript();

    if (form && textarea instanceof HTMLTextAreaElement) {
      const submit = async () => {
        const message = textarea.value.trim();
        if (!message) return;

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
            [definition.composer.key]: message
          };
          if (definition.contractVersion === "0.2.0" && definition.context?.selector) {
            const selector = container.querySelector<HTMLSelectElement>("[data-eidos-chat-context-selector]");
            const selected = selector?.selectedOptions[0]?.dataset.eidosChatContextValue;
            if (selected) {
              values[definition.context.selector.key] = JSON.parse(selected) as JsonValue;
            }
          }

          const request: ActionRequestV010 = {
            contractVersion: "0.1.0",
            type: "command",
            command: { ...definition.command },
            values,
            sourceInteractionId: definition.id,
            actionId: "chat.send",
            requiresConfirmation: false
          };

          const result = await options.actionHost.execute(request);
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
          await options.onActionResult?.(
            result,
            page,
            { preserveMountedPage: true }
          );
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
          if (button) button.disabled = false;
          textarea.focus();
        }
      };

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
              status.textContent = hostText("shell.settingsSaved", "Settings saved.");
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
