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

export async function mountMobileTaskRuntimeV010(options: {
  container: HTMLElement | string;
  source: MobileExperienceSource;
  bootstrapManifests: unknown[];
  path: string;
  locale: string;
  baseUrl: string;
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
    options.source.loadPage(page),
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

  if (!isChatExperienceV010(localized)) {
    throw new Error("EVO_MOBILE_TASK_UNSUPPORTED_PAGE_KIND");
  }

  const actionHost: ActionHost = createAppManagerActionHost({
    baseUrl: options.baseUrl
  });
  const messages: ChatMessageV010[] = [];
  const root = document.createElement("main");
  root.setAttribute("data-evo-mobile-task-runtime", "0.1.0");
  root.setAttribute("data-surface-target", "MOBILE_TASK");
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
