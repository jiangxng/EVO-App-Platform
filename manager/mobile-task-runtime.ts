import type {
  ActionExecutionResult,
  ActionHost
} from "../vendor/eidos/src/adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../vendor/eidos/src/runtime/contracts.js";
import type {
  EffectiveExperienceManifestV010,
  ExperienceSource
} from "../vendor/eidos/src/app-host/contracts.js";
import type {
  LocalizationBundleSource
} from "../vendor/eidos/src/localization/contracts.js";
import {
  isChatExperienceV010,
  renderChatExperienceToHtml,
  renderChatMessageToHtml,
  type ChatMessageV010
} from "../vendor/eidos/src/chat/index.js";
import {
  isReviewQueueV010,
  renderReviewQueueToHtml,
  type ReviewQueueV010
} from "../vendor/eidos/src/review-queue/index.js";
import {
  isTaskInboxV010,
  renderTaskInboxToHtml,
  type TaskInboxV010
} from "../vendor/eidos/src/task-inbox/index.js";
import {
  executeRunBackedChatV010,
  recoverRunBackedChatV010,
  runBackedChatStorageKeyV010,
  type RunBackedChatProgressV010
} from "../vendor/eidos/src/app-host/personal-agent-run-chat.js";
import {
  createAppManagerActionHost
} from "../vendor/eidos/src/app-host/app-manager-action-host.js";
import {
  createLocalizationRuntime,
  eidosAppHostLocalizationBundles
} from "../vendor/eidos/src/localization/index.js";
import {
  localizeAppHostPageDefinition
} from "../vendor/eidos/src/localization/localize.js";
import {
  createMobileReviewActionRequestV010,
  resolveMobileReviewActionV010
} from "./mobile-review-queue-action.js";
import {
  createMobileTaskActionRequestV010,
  resolveMobileTaskActionV010
} from "./mobile-task-inbox-action.js";
import {
  validateEffectiveExperienceManifest
} from "../vendor/eidos/src/app-host/host.js";

export interface MobileTaskRuntimeV010 {
  dispose(): void;
}

type MobileExperienceSource =
  ExperienceSource
  & LocalizationBundleSource;

function sessionStorageSafe(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

function resultMessage(result: unknown): string {
  if (result !== null && typeof result === "object" && !Array.isArray(result)) {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
    const run = (result as { run?: unknown }).run;
    if (run !== null && typeof run === "object" && !Array.isArray(run)) {
      const finalMessage = (run as { finalMessage?: unknown }).finalMessage;
      if (typeof finalMessage === "string" && finalMessage.trim()) {
        return finalMessage;
      }
    }
  }
  return JSON.stringify(result ?? { ok: true }, null, 2);
}

function findManifestAndRoute(
  rawManifests: unknown[],
  path: string
): {
  manifest: EffectiveExperienceManifestV010;
  route: EffectiveExperienceManifestV010["routes"][number];
} | undefined {
  for (const [index, raw] of rawManifests.entries()) {
    const validated = validateEffectiveExperienceManifest(raw, index);
    if (!validated.ok || !validated.value) continue;
    const route = validated.value.routes.find(item => item.path === path);
    if (route) return { manifest: validated.value, route };
  }
  return undefined;
}

function baseRequest(
  definition: ReturnType<typeof structuredClone> & {
    id: string;
    command: { code: string; inputVersion: string };
    composer: { key: string };
  },
  message: string,
  locale: string
): ActionRequestV010 {
  const values: Record<string, JsonValue> = {
    [definition.composer.key]: message,
    message,
    locale
  };
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...definition.command },
    values,
    sourceInteractionId: definition.id,
    actionId: "chat.send",
    requiresConfirmation: false
  };
}

function appendResult(
  messages: ChatMessageV010[],
  result: ActionExecutionResult
): void {
  messages.push({
    id: (result.ok ? "assistant-" : "error-") + Date.now() + "-" + messages.length,
    role: result.ok ? "assistant" : "error",
    text: result.ok
      ? resultMessage(result.result)
      : result.error?.message ?? "Unknown action error"
  });
}


function reviewFieldValues(
  form: HTMLFormElement
): Record<string, JsonValue> {
  const values: Record<string, JsonValue> = {};
  const controls = form.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("[data-eidos-review-field]");
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
  return values;
}

function mountMobileReviewQueueV010(input: {
  root: HTMLElement;
  definition: ReviewQueueV010;
  actionHost: ActionHost;
  onReload: () => Promise<ReviewQueueV010>;
}): { dispose(): void } {
  let disposed = false;
  let definition = input.definition;

  const status = document.createElement("div");
  status.setAttribute("data-evo-mobile-review-status", "");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const content = document.createElement("div");
  content.setAttribute("data-evo-mobile-review-content", "");
  input.root.replaceChildren(status, content);

  const render = () => {
    if (disposed) return;
    content.innerHTML = renderReviewQueueToHtml(definition);
  };

  const onClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const routeLink = target.closest<HTMLElement>("[data-eidos-route]");
    if (
      routeLink
      && !target.closest("[data-eidos-review-action]")
      && routeLink.dataset.eidosRoute
    ) {
      event.preventDefault();
      window.location.hash = routeLink.dataset.eidosRoute;
      return;
    }

    const button = target.closest<HTMLButtonElement>(
      "[data-eidos-review-action]"
    );
    if (!button || !content.contains(button)) return;

    void (async () => {
      const itemId = button.dataset.eidosItemId;
      const actionId = button.dataset.eidosReviewAction;
      if (!itemId || !actionId) return;

      let selection;
      try {
        selection = resolveMobileReviewActionV010(
          definition,
          itemId,
          actionId
        );
      } catch (error) {
        status.textContent = error instanceof Error
          ? error.message
          : String(error);
        return;
      }

      if (
        selection.action.requiresConfirmation === true
        && !window.confirm(button.textContent?.trim() || "Confirm action?")
      ) {
        return;
      }

      const form = button.closest<HTMLFormElement>("[data-eidos-review-form]");
      const fields = form ? reviewFieldValues(form) : {};

      button.disabled = true;
      status.textContent = "Executing…";

      try {
        const request = createMobileReviewActionRequestV010({
          definition,
          itemId,
          actionId,
          fieldValues: fields
        });
        const result = await input.actionHost.execute(request);
        if (!result.ok) {
          status.textContent =
            result.error?.message ?? "Review action failed.";
          return;
        }

        status.textContent = "Completed.";
        definition = await input.onReload();
        render();
      } catch (error) {
        status.textContent = error instanceof Error
          ? error.message
          : String(error);
      } finally {
        if (button.isConnected) button.disabled = false;
      }
    })();
  };

  content.addEventListener("click", onClick);
  render();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      content.removeEventListener("click", onClick);
    }
  };
}

function mountMobileTaskInboxV010(input: {
  root: HTMLElement;
  definition: TaskInboxV010;
  actionHost: ActionHost;
  onReload: () => Promise<TaskInboxV010>;
}): { dispose(): void } {
  let disposed = false;
  let definition = input.definition;

  const status = document.createElement("div");
  status.setAttribute("data-evo-mobile-task-inbox-status", "");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const content = document.createElement("div");
  content.setAttribute("data-evo-mobile-task-inbox-content", "");
  input.root.replaceChildren(status, content);

  const render = () => {
    if (disposed) return;
    content.innerHTML = renderTaskInboxToHtml(definition);
  };

  const onClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest<HTMLButtonElement>("[data-eidos-task-action]");
    if (!button || !content.contains(button)) return;

    void (async () => {
      const itemId = button.dataset.eidosItemId;
      const actionId = button.dataset.eidosTaskAction;
      if (!itemId || !actionId) return;

      let selection;
      try {
        selection = resolveMobileTaskActionV010(definition, itemId, actionId);
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
        return;
      }

      if (selection.action.type === "navigate") {
        const route = selection.action.route?.trim();
        if (!route) {
          status.textContent = "Task navigation route is unavailable.";
          return;
        }
        window.location.hash = route;
        return;
      }

      if (
        selection.action.requiresConfirmation === true
        && !window.confirm(button.textContent?.trim() || "Confirm action?")
      ) {
        return;
      }

      button.disabled = true;
      status.textContent = "Executing…";

      try {
        const request = createMobileTaskActionRequestV010({
          definition,
          itemId,
          actionId
        });
        const result = await input.actionHost.execute(request);
        if (!result.ok) {
          status.textContent = result.error?.message ?? "Task action failed.";
          return;
        }

        status.textContent = "Updated.";
        definition = await input.onReload();
        render();
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
      } finally {
        if (button.isConnected) button.disabled = false;
      }
    })();
  };

  content.addEventListener("click", onClick);
  render();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      content.removeEventListener("click", onClick);
    }
  };
}

export async function mountMobileTaskRuntimeV010(options: {
  container: HTMLElement | string;
  source: MobileExperienceSource;
  bootstrapManifests: unknown[];
  path: string;
  locale: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<MobileTaskRuntimeV010> {
  const container = typeof options.container === "string"
    ? document.querySelector<HTMLElement>(options.container)
    : options.container;
  if (!container) throw new Error("EVO_MOBILE_TASK_CONTAINER_NOT_FOUND");

  const resolved = findManifestAndRoute(options.bootstrapManifests, options.path);
  if (!resolved) throw new Error("EVO_MOBILE_TASK_ROUTE_NOT_FOUND");

  const page = resolved.manifest.pages.find(
    item => item.id === resolved.route.pageId
  );
  if (!page) throw new Error("EVO_MOBILE_TASK_PAGE_NOT_FOUND");

  const [definition, bundles] = await Promise.all([
    options.source.loadPage(page, { routePath: options.path }),
    options.source.listEffectiveLocalizationBundles()
  ]);

  const localization = createLocalizationRuntime(
    [...eidosAppHostLocalizationBundles, ...bundles],
    {
      locale: options.locale,
      fallbackLocales: ["en"]
    }
  );

  const loaded = {
    route: resolved.route,
    page,
    experienceId: resolved.manifest.experienceId,
    packageId: resolved.manifest.packageId,
    featureId: resolved.manifest.featureId,
    definition
  };
  const localized = localizeAppHostPageDefinition(
    loaded,
    localization
  );

  const actionHost: ActionHost = createAppManagerActionHost({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    locale: () => options.locale
  });
  const root = document.createElement("main");
  root.setAttribute("data-evo-mobile-task-runtime", "0.1.0");
  root.setAttribute("data-surface-target", "MOBILE_TASK");

  if (isReviewQueueV010(localized)) {
    root.setAttribute("data-evo-mobile-review-queue", localized.id);
    container.replaceChildren(root);

    const mountedReview = mountMobileReviewQueueV010({
      root,
      definition: localized,
      actionHost,
      async onReload() {
        const nextDefinition = await options.source.loadPage(page);
        const nextLocalized = localizeAppHostPageDefinition(
          {
            ...loaded,
            definition: nextDefinition
          },
          localization
        );
        if (!isReviewQueueV010(nextLocalized)) {
          throw new Error("EVO_MOBILE_TASK_REVIEW_RELOAD_INVALID");
        }
        return nextLocalized;
      }
    });

    return {
      dispose() {
        mountedReview.dispose();
        root.remove();
      }
    };
  }

  if (isTaskInboxV010(localized)) {
    root.setAttribute("data-evo-mobile-task-inbox", localized.id);
    container.replaceChildren(root);

    const mountedInbox = mountMobileTaskInboxV010({
      root,
      definition: localized,
      actionHost,
      async onReload() {
        const nextDefinition = await options.source.loadPage(page);
        const nextLocalized = localizeAppHostPageDefinition(
          {
            ...loaded,
            definition: nextDefinition
          },
          localization
        );
        if (!isTaskInboxV010(nextLocalized)) {
          throw new Error("EVO_MOBILE_TASK_INBOX_RELOAD_INVALID");
        }
        return nextLocalized;
      }
    });

    return {
      dispose() {
        mountedInbox.dispose();
        root.remove();
      }
    };
  }

  if (!isChatExperienceV010(localized)) {
    throw new Error("EVO_MOBILE_TASK_UNSUPPORTED_PAGE_KIND");
  }

  const messages: ChatMessageV010[] = [];
  root.innerHTML = renderChatExperienceToHtml(localized);

  const status = document.createElement("div");
  status.setAttribute("data-evo-mobile-task-status", "");
  status.setAttribute("role", "status");
  status.style.minHeight = "1.25em";
  root.prepend(status);

  container.replaceChildren(root);

  const transcript = root.querySelector<HTMLElement>(
    "[data-eidos-chat-transcript]"
  );
  const form = root.querySelector<HTMLFormElement>(
    "[data-eidos-chat-composer]"
  );
  const textarea = form?.elements.namedItem(localized.composer.key);

  if (
    !transcript
    || !form
    || !(textarea instanceof HTMLTextAreaElement)
  ) {
    throw new Error("EVO_MOBILE_TASK_CHAT_DOM_INVALID");
  }

  const initialEmpty = transcript
    .querySelector<HTMLElement>("[data-eidos-chat-empty]")
    ?.cloneNode(true) as HTMLElement | undefined;
  const rendered = new Map<string, {
    html: string;
    element: HTMLElement;
  }>();
  let renderFrame: number | undefined;
  let disposed = false;
  let inFlight = false;

  const patchTranscript = () => {
    if (disposed) return;
    const desired = new Set(messages.map(message => message.id));

    for (const [id, item] of rendered) {
      if (desired.has(id)) continue;
      item.element.remove();
      rendered.delete(id);
    }

    if (messages.length) {
      transcript.querySelector("[data-eidos-chat-empty]")?.remove();
    }

    let previous: ChildNode | null = null;
    for (const message of messages) {
      const html = renderChatMessageToHtml(message);
      let item = rendered.get(message.id);
      if (!item || item.html !== html) {
        const template = document.createElement("template");
        template.innerHTML = html.trim();
        const next = template.content.firstElementChild;
        if (!(next instanceof HTMLElement)) {
          throw new Error("EVO_MOBILE_TASK_MESSAGE_RENDER_INVALID");
        }
        next.setAttribute("data-eidos-chat-message-id", message.id);
        if (item?.element.isConnected) item.element.replaceWith(next);
        item = { html, element: next };
        rendered.set(message.id, item);
      }

      const position: ChildNode | null = previous
        ? previous.nextSibling
        : transcript.firstChild;
      if (item.element !== position) {
        transcript.insertBefore(item.element, position);
      }
      previous = item.element;
    }

    if (!messages.length && initialEmpty) {
      if (!transcript.querySelector("[data-eidos-chat-empty]")) {
        transcript.appendChild(initialEmpty.cloneNode(true));
      }
    }

    transcript.scrollTop = transcript.scrollHeight;
  };

  const renderTranscript = () => {
    if (disposed || renderFrame !== undefined) return;
    if (typeof requestAnimationFrame !== "function") {
      patchTranscript();
      return;
    }
    renderFrame = requestAnimationFrame(() => {
      renderFrame = undefined;
      patchTranscript();
    });
  };

  const runStorage = sessionStorageSafe();
  const storageKey = runBackedChatStorageKeyV010(localized.id);
  let activeRunId: string | undefined;

  const persistRunId = (runId: string | undefined) => {
    activeRunId = runId;
    if (!runStorage) return;
    try {
      if (runId) runStorage.setItem(storageKey, runId);
      else runStorage.removeItem(storageKey);
    } catch {
      // Session storage is a recovery hint only.
    }
  };

  const storedRunId = (): string | undefined => {
    if (activeRunId) return activeRunId;
    if (!runStorage) return undefined;
    try {
      return runStorage.getItem(storageKey) ?? undefined;
    } catch {
      return undefined;
    }
  };

  const onProgress = async (progress: RunBackedChatProgressV010) => {
    persistRunId(progress.runId);
    status.textContent = progress.state === "SUCCEEDED"
      ? ""
      : "Working · " + progress.state.toLowerCase();
  };

  const requestFor = (
    message: string,
    actionId = "chat.send"
  ): ActionRequestV010 => ({
    ...baseRequest(localized, message, options.locale),
    actionId
  });

  const submit = async () => {
    const message = textarea.value.trim();
    if (!message || inFlight) return;

    messages.push({
      id: "user-" + Date.now() + "-" + messages.length,
      role: "user",
      text: message
    });
    textarea.value = "";
    renderTranscript();

    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    inFlight = true;
    if (button) button.disabled = true;
    textarea.disabled = true;
    status.textContent = "Working";

    try {
      const execution = await executeRunBackedChatV010({
        actionHost,
        request: requestFor(message),
        onProgress
      });
      if (
        execution.runState
        && ["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"].includes(
          execution.runState
        )
      ) {
        persistRunId(undefined);
      }
      appendResult(messages, execution.result);
      renderTranscript();
    } catch (error) {
      messages.push({
        id: "error-" + Date.now() + "-" + messages.length,
        role: "error",
        text: error instanceof Error ? error.message : String(error)
      });
      renderTranscript();
    } finally {
      inFlight = false;
      status.textContent = "";
      textarea.disabled = false;
      if (button) button.disabled = false;
      textarea.focus();
    }
  };

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void submit();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  form.addEventListener("submit", onSubmit);
  textarea.addEventListener("keydown", onKeyDown);

  const recover = async () => {
    const runId = storedRunId();
    if (!runId || inFlight) return;
    inFlight = true;
    status.textContent = "Recovering";
    try {
      const recovered = await recoverRunBackedChatV010({
        actionHost,
        request: requestFor("", "chat.recover"),
        runId,
        onProgress
      });
      if (!recovered) {
        persistRunId(undefined);
        return;
      }
      if (
        recovered.runState
        && ["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"].includes(
          recovered.runState
        )
      ) {
        persistRunId(undefined);
      }
      appendResult(messages, recovered.result);
      renderTranscript();
    } finally {
      inFlight = false;
      status.textContent = "";
    }
  };

  void recover();

  return {
    dispose() {
      disposed = true;
      if (
        renderFrame !== undefined
        && typeof cancelAnimationFrame === "function"
      ) {
        cancelAnimationFrame(renderFrame);
      }
      form.removeEventListener("submit", onSubmit);
      textarea.removeEventListener("keydown", onKeyDown);
      root.remove();
    }
  };
}
