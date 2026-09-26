import { assertValidUidl } from "../runtime/validate.js";
import type { ActionRequestV010, JsonValue } from "../runtime/contracts.js";
import type { ActionHost } from "../adapters/ports.js";
import {
  isChatExperienceV010,
  renderChatMessageToHtml,
  type ChatMessageV010
} from "../chat/index.js";
import { isSettingsEditorV010 } from "../settings/index.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type { AppHostLoadedPageV010 } from "./contracts.js";
import { executeAppHostPageAction } from "./action-executor.js";
import { renderAppHostPageToHtml } from "./page-renderer.js";

export interface AppHostChatState {
  messages: ChatMessageV010[];
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

  const extensionActionButtons = container.querySelectorAll<HTMLButtonElement>(
    "[data-eidos-catalog-action],[data-eidos-extension-action]"
  );
  if (extensionActionButtons.length > 0) {
    const actionStatus = document.createElement("pre");
    actionStatus.setAttribute("data-eidos-action-status", "");
    actionStatus.setAttribute("role", "status");
    actionStatus.style.marginTop = "12px";
    container.appendChild(actionStatus);

    for (const button of Array.from(extensionActionButtons)) {
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
          if (!command || !itemId) {
            actionStatus.textContent = hostText(
              "shell.actionIncomplete",
              "Catalog command action is incomplete."
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
              values: {
                itemId,
                confirmed: button.dataset.eidosConfirm === "true"
              },
              sourceInteractionId: (page.definition as { id?: string }).id ?? page.page.id,
              actionId: button.dataset.eidosCatalogAction
                ?? button.dataset.eidosExtensionAction
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
  if (isChatExperienceV010(definition)) {
    const state = options.chatState ?? { messages: [] };
    const transcript = container.querySelector<HTMLElement>("[data-eidos-chat-transcript]");
    const form = container.querySelector<HTMLFormElement>("[data-eidos-chat-composer]");
    const textarea = form?.elements.namedItem(definition.composer.key);

    const renderTranscript = () => {
      if (!transcript) return;
      transcript.innerHTML = state.messages.map(renderChatMessageToHtml).join("");
      transcript.scrollTop = transcript.scrollHeight;
    };

    renderTranscript();

    if (form && textarea instanceof HTMLTextAreaElement) {
      const submit = async () => {
        const message = textarea.value.trim();
        if (!message) return;

        state.messages.push({
          id: `user-${Date.now()}-${state.messages.length}`,
          role: "user",
          text: message
        });
        textarea.value = "";
        renderTranscript();

        if (!options.actionHost) {
          state.messages.push({
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
          const request: ActionRequestV010 = {
            contractVersion: "0.1.0",
            type: "command",
            command: { ...definition.command },
            values: { [definition.composer.key]: message },
            sourceInteractionId: definition.id,
            actionId: "chat.send",
            requiresConfirmation: false
          };

          const result = await options.actionHost.execute(request);
          state.messages.push({
            id: `${result.ok ? "assistant" : "error"}-${Date.now()}-${state.messages.length}`,
            role: result.ok ? "assistant" : "error",
            text: result.ok
              ? resultMessage(result.result)
              : result.error?.message ?? "Unknown action error"
          });
          renderTranscript();
          await options.onActionResult?.(result, page);
        } catch (error) {
          state.messages.push({
            id: `error-${Date.now()}-${state.messages.length}`,
            role: "error",
            text: error instanceof Error ? error.message : String(error)
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
    }

    return {
      dispose() {
        for (const dispose of listeners) dispose();
      }
    };
  }

  if (isSettingsEditorV010(definition)) {
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
          for (const field of definition.settings) {
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
